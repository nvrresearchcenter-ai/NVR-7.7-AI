# AI Chat Backend (FastAPI)

A small, production-ready FastAPI service that proxies chat requests to OpenAI
(`gpt-4o-mini` by default), with optional Server-Sent Events streaming.

## Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate         # Windows: .venv\Scripts\activate
pip install -r requirements.txt
export OPENAI_API_KEY=sk-...      # required
export ALLOWED_ORIGINS="http://localhost:3000,https://your-frontend.example"  # optional
```

## Run

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Production:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

## Endpoints

### `GET /health`

Returns service status and whether `OPENAI_API_KEY` is configured.

### `POST /chat`

Request body:

```json
{
  "message": "Hello!",
  "history": [
    { "role": "user", "content": "Hi" },
    { "role": "assistant", "content": "Hello! How can I help?" }
  ],
  "system_prompt": "You are a concise assistant.",
  "stream": false,
  "temperature": 0.7
}
```

Non-streaming response:

```json
{ "reply": "...", "model": "gpt-4o-mini" }
```

Streaming response (`stream: true`) is `text/event-stream`:

```
data: Hello
data:  there
data: [DONE]
```

## Frontend example (fetch + SSE)

```js
const res = await fetch("http://localhost:8000/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ message: "Hi!", stream: true }),
});

const reader = res.body.getReader();
const decoder = new TextDecoder();
while (true) {
  const { value, done } = await reader.read();
  if (done) break;
  const text = decoder.decode(value);
  for (const line of text.split("\n")) {
    if (line.startsWith("data: ")) {
      const piece = line.slice(6);
      if (piece === "[DONE]") return;
      process.stdout.write(piece);
    }
  }
}
```
