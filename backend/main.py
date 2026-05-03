"""FastAPI AI chat backend with OpenAI streaming support."""

from __future__ import annotations

import logging
import os
from typing import AsyncGenerator, List, Literal, Optional

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from openai import APIError, AsyncOpenAI, AuthenticationError, RateLimitError
from pydantic import BaseModel, Field

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s - %(message)s")
logger = logging.getLogger("chat-backend")

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "*").split(",")
    if origin.strip()
]

if not OPENAI_API_KEY:
    logger.warning("OPENAI_API_KEY is not set; requests to /chat will fail until it is configured.")

client = AsyncOpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

app = FastAPI(
    title="AI Chat Backend",
    version="1.0.0",
    description="A minimal production-ready chat backend powered by OpenAI.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Message(BaseModel):
    role: Literal["system", "user", "assistant"]
    content: str = Field(..., min_length=1)


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="The user's message.")
    history: Optional[List[Message]] = Field(
        default=None,
        description="Optional prior conversation turns to give the model context.",
    )
    system_prompt: Optional[str] = Field(
        default=None,
        description="Optional system prompt that frames the assistant's behavior.",
    )
    stream: bool = Field(
        default=False,
        description="If true, the response is streamed as text/event-stream chunks.",
    )
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)


class ChatResponse(BaseModel):
    reply: str
    model: str


def _require_client() -> AsyncOpenAI:
    if client is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Server is missing the OPENAI_API_KEY environment variable.",
        )
    return client


def _build_messages(req: ChatRequest) -> List[dict]:
    messages: List[dict] = []
    if req.system_prompt:
        messages.append({"role": "system", "content": req.system_prompt})
    if req.history:
        messages.extend(m.model_dump() for m in req.history)
    messages.append({"role": "user", "content": req.message})
    return messages


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "model": OPENAI_MODEL, "configured": client is not None}


@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """Return a single chat completion, or a streaming response when `stream=true`."""
    openai = _require_client()
    messages = _build_messages(req)

    if req.stream:
        return StreamingResponse(
            _stream_chat(openai, messages, req.temperature),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            },
        )

    try:
        completion = await openai.chat.completions.create(
            model=OPENAI_MODEL,
            messages=messages,
            temperature=req.temperature,
        )
    except AuthenticationError as exc:
        logger.error("OpenAI authentication failed: %s", exc)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid OpenAI credentials.") from exc
    except RateLimitError as exc:
        logger.warning("OpenAI rate limit hit: %s", exc)
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="OpenAI rate limit exceeded.") from exc
    except APIError as exc:
        logger.exception("OpenAI API error")
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Upstream OpenAI error.") from exc
    except Exception as exc:
        logger.exception("Unexpected error during chat completion")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error.") from exc

    reply = (completion.choices[0].message.content or "").strip()
    return ChatResponse(reply=reply, model=OPENAI_MODEL)


async def _stream_chat(
    openai: AsyncOpenAI,
    messages: List[dict],
    temperature: float,
) -> AsyncGenerator[bytes, None]:
    """Yield Server-Sent Events as the model produces tokens."""
    try:
        stream = await openai.chat.completions.create(
            model=OPENAI_MODEL,
            messages=messages,
            temperature=temperature,
            stream=True,
        )
        async for chunk in stream:
            if not chunk.choices:
                continue
            delta = chunk.choices[0].delta
            piece = getattr(delta, "content", None)
            if piece:
                yield f"data: {piece}\n\n".encode("utf-8")
        yield b"data: [DONE]\n\n"
    except AuthenticationError:
        logger.error("OpenAI authentication failed during streaming")
        yield b"event: error\ndata: invalid OpenAI credentials\n\n"
    except RateLimitError:
        logger.warning("OpenAI rate limit hit during streaming")
        yield b"event: error\ndata: rate limit exceeded\n\n"
    except APIError as exc:
        logger.exception("OpenAI API error during streaming")
        yield f"event: error\ndata: upstream error: {exc}\n\n".encode("utf-8")
    except Exception as exc:
        logger.exception("Unexpected error during streaming")
        yield f"event: error\ndata: internal server error\n\n".encode("utf-8")
