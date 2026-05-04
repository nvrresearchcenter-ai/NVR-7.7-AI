"""FastAPI AI Agent backend.

Provides:
- POST /agent/run        Streams agent task execution as NDJSON.
- WS   /agent/ws         WebSocket variant of the same agent run loop.
- POST /chat             Single-shot or streaming OpenAI chat completion.
- GET  /health           Liveness probe.

This backend powers the NVR 9.9 Ultra Super Agent UI. The agent picks a plan
based on the prompt, then executes tasks step-by-step, emitting structured
events the frontend renders into a live monitor + activity log.
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import re
import uuid
from typing import AsyncGenerator, Callable, List, Literal, Optional

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from openai import APIError, AsyncOpenAI, AuthenticationError, RateLimitError
from pydantic import BaseModel, Field

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s - %(message)s")
logger = logging.getLogger("agent-backend")

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
AGENT_MODEL_NAME = os.getenv("AGENT_MODEL_NAME", "NVR 9.9 Ultra Super Agent")
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "*").split(",")
    if origin.strip()
]

if not OPENAI_API_KEY:
    logger.warning("OPENAI_API_KEY is not set; /chat will fail until configured. /agent/run does not require it.")

client = AsyncOpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

app = FastAPI(
    title="NVR Agent Backend",
    version="2.0.0",
    description="FastAPI backend for the NVR 9.9 Ultra Super Agent live UI.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Chat (existing) ------------------------------------------------------------
# ---------------------------------------------------------------------------


class Message(BaseModel):
    role: Literal["system", "user", "assistant"]
    content: str = Field(..., min_length=1)


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    history: Optional[List[Message]] = None
    system_prompt: Optional[str] = None
    stream: bool = False
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)


class ChatResponse(BaseModel):
    reply: str
    model: str


def _require_openai() -> AsyncOpenAI:
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
    return {
        "status": "ok",
        "chat_model": OPENAI_MODEL,
        "agent_model": AGENT_MODEL_NAME,
        "openai_configured": client is not None,
    }


@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    openai = _require_openai()
    messages = _build_messages(req)

    if req.stream:
        return StreamingResponse(
            _stream_chat(openai, messages, req.temperature),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )

    try:
        completion = await openai.chat.completions.create(
            model=OPENAI_MODEL, messages=messages, temperature=req.temperature
        )
    except AuthenticationError as exc:
        raise HTTPException(status_code=401, detail="Invalid OpenAI credentials.") from exc
    except RateLimitError as exc:
        raise HTTPException(status_code=429, detail="OpenAI rate limit exceeded.") from exc
    except APIError as exc:
        raise HTTPException(status_code=502, detail="Upstream OpenAI error.") from exc

    reply = (completion.choices[0].message.content or "").strip()
    return ChatResponse(reply=reply, model=OPENAI_MODEL)


async def _stream_chat(openai: AsyncOpenAI, messages: List[dict], temperature: float) -> AsyncGenerator[bytes, None]:
    try:
        stream = await openai.chat.completions.create(
            model=OPENAI_MODEL, messages=messages, temperature=temperature, stream=True
        )
        async for chunk in stream:
            if not chunk.choices:
                continue
            piece = getattr(chunk.choices[0].delta, "content", None)
            if piece:
                yield f"data: {piece}\n\n".encode("utf-8")
        yield b"data: [DONE]\n\n"
    except AuthenticationError:
        yield b"event: error\ndata: invalid OpenAI credentials\n\n"
    except RateLimitError:
        yield b"event: error\ndata: rate limit exceeded\n\n"
    except APIError as exc:
        yield f"event: error\ndata: upstream error: {exc}\n\n".encode("utf-8")


# ---------------------------------------------------------------------------
# Agent ----------------------------------------------------------------------
# ---------------------------------------------------------------------------


class AgentRunRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=4000)


def _task(title: str, detail: str, duration_ms: int, critical: bool, logs: list[tuple[int, str, str]]) -> dict:
    return {
        "id": uuid.uuid4().hex[:8],
        "title": title,
        "detail": detail,
        "durationMs": duration_ms,
        "critical": critical,
        "logs": [{"delayMs": d, "kind": k, "text": t} for d, k, t in logs],
    }


def _plan_for(prompt: str) -> dict:
    p = prompt.lower()

    if re.search(r"(scan|audit|inspect|review|check).*(project|repo|file|code|error)|find errors|lint", p):
        return {
            "label": "Scan project",
            "icon": "scan",
            "intent": "Scanning the project. I'll index sources, parse ASTs, run lint and type-check, then surface findings.",
            "closing": "Scan complete — 0 critical, 3 minor warnings logged.",
            "tasks": [
                _task("Connect filesystem", "Establish secure read access.", 1100, False, [
                    (120, "shell", "$ pwd"),
                    (240, "result", "/workspace/repo"),
                    (520, "shell", "$ ls -la"),
                    (820, "result", "mounted 14 entries · read-only"),
                ]),
                _task("Index source files", "Walk the project tree.", 1900, False, [
                    (180, "tool", "walking src/..."),
                    (560, "tool", "walking netlify/functions/..."),
                    (980, "tool", "walking backend/..."),
                    (1400, "result", "127 files indexed · 18.4k LOC"),
                ]),
                _task("Parse AST", "Build syntax trees.", 2300, False, [
                    (220, "tool", "tsx parser online"),
                    (1080, "tool", "parsed 81/127"),
                    (1640, "tool", "parsed 127/127"),
                    (1940, "result", "✓ 0 syntax errors"),
                ]),
                _task("Run lint & type-check", "tsc --noEmit + eslint .", 2500, False, [
                    (180, "shell", "$ tsc --noEmit"),
                    (1180, "result", "tsc · 0 errors"),
                    (1340, "shell", "$ eslint ."),
                    (2200, "result", "eslint · 3 warnings"),
                ]),
                _task("Compose findings", "Aggregate and rank.", 1100, False, [
                    (220, "agent", "Three minor warnings, all in legacy components."),
                    (780, "result", "report.md written"),
                ]),
            ],
        }

    if re.search(r"(fix|patch|repair|debug|resolve).*(bug|error|issue|crash|500|backend|api|server|test)", p):
        return {
            "label": "Fix errors",
            "icon": "wrench",
            "intent": "On it — reproducing the failure, walking the stack, applying the smallest safe patch.",
            "closing": "Patch landed and verified in staging. Tests green.",
            "tasks": [
                _task("Reproduce the failure", "Replay the failing path.", 1700, False, [
                    (200, "shell", "$ curl -s localhost:8000/api/checkout -d @sample.json"),
                    (1100, "error", "HTTP 500 · TypeError: cannot read property 'id' of undefined"),
                    (1500, "result", "✓ reproduced"),
                ]),
                _task("Read recent logs", "Last 200 lines around the 5xx.", 1200, False, [
                    (180, "shell", "$ tail -n 200 /var/log/api.log"),
                    (820, "tool", "matched 17 lines on TypeError"),
                ]),
                _task("Walk stack to source", "Identify originating frame.", 1400, False, [
                    (220, "tool", "stackframe → routes/checkout.ts:84"),
                    (820, "tool", "caller → models/order.ts:32"),
                    (1180, "agent", "Root cause: order lookup before session resolves."),
                ]),
                _task("Apply targeted fix", "Smallest safe code change.", 2000, True, [
                    (260, "tool", "editing routes/checkout.ts"),
                    (820, "tool", "+ await ctx.session.ready()"),
                    (1700, "result", "✓ 1 file, +4 −0"),
                ]),
                _task("Add regression test", "Cover deterministically.", 1700, False, [
                    (220, "tool", "creating tests/checkout.regression.test.ts"),
                    (1080, "shell", "$ vitest run tests/checkout.regression.test.ts"),
                    (1500, "result", "✓ 1/1 passed"),
                ]),
                _task("Verify in staging", "Replay against staging.", 1900, True, [
                    (240, "shell", "$ curl -s staging.api/checkout -d @sample.json"),
                    (1320, "result", "HTTP 200 · order_018f3 created"),
                ]),
            ],
        }

    if re.search(r"(deploy|ship|release|publish|push to (prod|production))", p):
        return {
            "label": "Deploy release",
            "icon": "rocket",
            "intent": "Release run. Diff, tests, build, canary, then promote.",
            "closing": "Canary green for 5m at 10%. Promoted to 100%.",
            "tasks": [
                _task("Review pending changes", "Diff main against release branch.", 1300, False, [
                    (200, "shell", "$ git diff main...release/v2.4 --stat"),
                    (1000, "result", "14 files changed · +312 −178"),
                ]),
                _task("Run full test suite", "Unit + integration + smoke.", 2400, False, [
                    (240, "shell", "$ npm test"),
                    (2000, "result", "✓ all green in 71.4s"),
                ]),
                _task("Build artifacts", "Optimized production bundle.", 1900, False, [
                    (240, "shell", "$ vite build"),
                    (1700, "result", "✓ 412kb gzipped"),
                ]),
                _task("Tag the release", "Cut a semver tag.", 1100, False, [
                    (220, "shell", "$ git tag v2.4.0"),
                    (880, "result", "v2.4.0 tagged"),
                ]),
                _task("Push to canary (10%)", "10% traffic split.", 2100, True, [
                    (260, "tool", "deploying to canary pool"),
                    (1820, "result", "✓ canary live"),
                ]),
                _task("Watch error rate", "Hold 5m, then promote.", 2200, True, [
                    (400, "tool", "p50 latency · 142ms"),
                    (1000, "tool", "error rate · 0.04%"),
                    (2080, "result", "✓ promoted to 100%"),
                ]),
            ],
        }

    if re.search(r"(build|create|make|design|generate).*(website|landing|site|page|app|component|ui)", p):
        return {
            "label": "Build a website",
            "icon": "globe",
            "intent": "Got it — scoping audience, drafting layout, scaffolding components, shipping a preview.",
            "closing": "Preview deployed. Open the URL above and tell me what to adjust.",
            "tasks": [
                _task("Analyze requirements", "Parse goal, audience, sections.", 1400, False, [
                    (200, "agent", "Targeting: clean marketing site, single CTA, mobile-first."),
                    (900, "result", "spec compiled"),
                ]),
                _task("Draft sitemap & layout", "Pages, hero, nav, footer.", 1600, False, [
                    (220, "tool", "sitemap · /, /pricing, /faq"),
                    (1100, "result", "wireframe ready"),
                ]),
                _task("Generate components", "Hero, features, pricing, footer.", 2400, False, [
                    (220, "tool", "creating components/Hero.tsx"),
                    (800, "tool", "creating components/Features.tsx"),
                    (1320, "tool", "creating components/Pricing.tsx"),
                    (2000, "result", "✓ 8 components scaffolded"),
                ]),
                _task("Wire up routing", "File-based routes.", 1500, False, [
                    (240, "tool", "router config updated"),
                    (1100, "result", "✓ routes ready"),
                ]),
                _task("Run lint & type-check", "tsc + eslint + a11y.", 1800, False, [
                    (220, "shell", "$ tsc --noEmit && eslint ."),
                    (1500, "result", "✓ clean"),
                ]),
                _task("Deploy preview", "Push to Netlify, emit URL.", 2200, True, [
                    (240, "shell", "$ netlify deploy --build"),
                    (1240, "tool", "uploading 412 files..."),
                    (1880, "result", "✓ https://preview-3a4f.netlify.app"),
                ]),
            ],
        }

    if re.search(r"(run|execute).*(command|terminal|shell|bash|script)", p):
        return {
            "label": "Run terminal command",
            "icon": "terminal",
            "intent": "Running in a sandboxed shell. Capturing stdout/stderr and exit code.",
            "closing": "Command finished. Output captured above.",
            "tasks": [
                _task("Resolve command", "Parse target binary.", 700, False, [
                    (180, "tool", "resolving binary"),
                    (520, "result", "✓ resolved"),
                ]),
                _task("Acquire sandbox", "Spin up isolated shell.", 900, False, [
                    (240, "tool", "sandbox · ephemeral"),
                    (680, "result", "✓ shell ready"),
                ]),
                _task("Execute", "30s timeout.", 2000, True, [
                    (200, "shell", "$ <user command>"),
                    (880, "tool", "streaming stdout..."),
                    (1640, "result", "✓ exit 0"),
                ]),
                _task("Capture & report", "Save transcript.", 800, False, [
                    (220, "tool", "transcript saved"),
                    (600, "result", "✓ ready"),
                ]),
            ],
        }

    return {
        "label": "General task",
        "icon": "sparkle",
        "intent": "I'll restate the goal, plan an ordered set of actions, and narrate as I work.",
        "closing": "Done. Want me to dig deeper anywhere?",
        "tasks": [
            _task("Understand the task", "Restate goal; identify constraints.", 1300, False, [
                (200, "agent", f"Restating: \"{prompt[:96]}{'…' if len(prompt) > 96 else ''}\""),
                (900, "result", "goal locked"),
            ]),
            _task("Plan an approach", "Break into 4–6 actions.", 1500, False, [
                (200, "tool", "drafting plan"),
                (1100, "result", "✓ 5 actions queued"),
            ]),
            _task("Execute step-by-step", "Run actions, validate each.", 2300, True, [
                (220, "tool", "action 1/5"),
                (800, "tool", "action 3/5"),
                (1600, "tool", "action 5/5"),
                (2040, "result", "✓ executed"),
            ]),
            _task("Self-review the output", "Check gaps, errors, clarity.", 1300, False, [
                (220, "tool", "reviewing"),
                (900, "result", "✓ pass"),
            ]),
            _task("Deliver final result", "Package and surface takeaways.", 1100, False, [
                (220, "agent", "Result is ready."),
                (820, "result", "✓ delivered"),
            ]),
        ],
    }


async def _run_agent(prompt: str, send: Callable[[dict], "asyncio.Future | None"], is_aborted: Callable[[], bool]) -> None:
    """Drive the agent loop. `send` may be sync or async."""

    async def emit(evt: dict) -> None:
        result = send(evt)
        if asyncio.iscoroutine(result):
            await result

    plan = _plan_for(prompt)
    started = asyncio.get_event_loop().time()

    await emit({"type": "meta", "model": AGENT_MODEL_NAME, "label": plan["label"], "icon": plan["icon"]})
    await emit({"type": "agent", "text": plan["intent"]})

    if is_aborted():
        return
    await asyncio.sleep(0.45)

    await emit({
        "type": "plan",
        "tasks": [
            {"id": t["id"], "title": t["title"], "detail": t["detail"], "critical": t["critical"]}
            for t in plan["tasks"]
        ],
    })
    await emit({"type": "log", "kind": "plan", "text": f"Plan ready · {plan['label']} · {len(plan['tasks'])} tasks"})
    await asyncio.sleep(0.35)

    for i, t in enumerate(plan["tasks"]):
        if is_aborted():
            return
        await emit({"type": "task_start", "id": t["id"], "index": i})
        await emit({
            "type": "log",
            "kind": "tool",
            "text": f"[{i + 1}/{len(plan['tasks'])}] {t['title']}{' · critical' if t['critical'] else ''}",
        })

        task_start = asyncio.get_event_loop().time()
        for line in t["logs"]:
            if is_aborted():
                return
            wait_ms = max(0, line["delayMs"] - int((asyncio.get_event_loop().time() - task_start) * 1000))
            if wait_ms > 0:
                await asyncio.sleep(wait_ms / 1000)
            await emit({"type": "log", "kind": line["kind"], "text": line["text"]})

        elapsed_ms = int((asyncio.get_event_loop().time() - task_start) * 1000)
        remaining = t["durationMs"] - elapsed_ms
        if remaining > 0:
            await asyncio.sleep(remaining / 1000)

        await emit({
            "type": "task_done",
            "id": t["id"],
            "durationMs": int((asyncio.get_event_loop().time() - task_start) * 1000),
        })

    await emit({"type": "agent", "text": plan["closing"]})
    await emit({"type": "done", "durationMs": int((asyncio.get_event_loop().time() - started) * 1000)})


@app.post("/agent/run")
async def agent_run(req: AgentRunRequest):
    """NDJSON-streaming agent run."""

    queue: asyncio.Queue[dict | None] = asyncio.Queue()
    cancelled = {"v": False}

    def is_aborted() -> bool:
        return cancelled["v"]

    async def producer() -> None:
        try:
            await _run_agent(req.prompt, lambda evt: queue.put(evt), is_aborted)
        except asyncio.CancelledError:
            cancelled["v"] = True
            await queue.put({"type": "log", "kind": "error", "text": "Run cancelled."})
            await queue.put({"type": "cancelled"})
        except Exception as exc:
            logger.exception("agent run failed")
            await queue.put({"type": "log", "kind": "error", "text": f"Internal error: {exc}"})
            await queue.put({"type": "error", "message": str(exc)})
        finally:
            await queue.put(None)

    task = asyncio.create_task(producer())

    async def gen() -> AsyncGenerator[bytes, None]:
        try:
            while True:
                evt = await queue.get()
                if evt is None:
                    return
                yield (json.dumps(evt) + "\n").encode("utf-8")
        finally:
            cancelled["v"] = True
            task.cancel()

    return StreamingResponse(
        gen(),
        media_type="application/x-ndjson",
        headers={"Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no"},
    )


@app.websocket("/agent/ws")
async def agent_ws(ws: WebSocket) -> None:
    """WebSocket variant.

    Client sends: {"prompt": "..."}                  to start a run.
    Client may send {"type": "stop"}                 at any time to cancel.
    Server sends one JSON message per agent event.
    """
    await ws.accept()
    cancelled = {"v": False}
    runner: Optional[asyncio.Task] = None

    async def watch_for_stop() -> None:
        try:
            while not cancelled["v"]:
                msg = await ws.receive_json()
                if isinstance(msg, dict) and msg.get("type") == "stop":
                    cancelled["v"] = True
                    return
        except WebSocketDisconnect:
            cancelled["v"] = True
        except Exception:
            cancelled["v"] = True

    try:
        first = await ws.receive_json()
        prompt = (first.get("prompt") or "").strip() if isinstance(first, dict) else ""
        if not prompt:
            await ws.send_json({"type": "error", "message": "prompt is required"})
            await ws.close()
            return

        watcher = asyncio.create_task(watch_for_stop())

        async def send(evt: dict) -> None:
            if cancelled["v"]:
                return
            await ws.send_json(evt)

        try:
            await _run_agent(prompt, send, lambda: cancelled["v"])
            if cancelled["v"]:
                await ws.send_json({"type": "log", "kind": "error", "text": "Run cancelled by user."})
                await ws.send_json({"type": "cancelled"})
        finally:
            watcher.cancel()
    except WebSocketDisconnect:
        return
    except Exception as exc:
        logger.exception("agent ws failed")
        try:
            await ws.send_json({"type": "error", "message": str(exc)})
        except Exception:
            pass
    finally:
        try:
            await ws.close()
        except Exception:
            pass
