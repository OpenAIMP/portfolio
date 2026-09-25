# OpenAIMP AI Playground

An AI chat interface powered by Cloudflare Workers AI, deployed at `projectai.openaimp.com`.

## Features

- Chat interface with multiple AI models
- Conversation history (multi-turn chat)
- System prompt for natural responses
- Reasoning model support (falls back to reasoning_content)
- Models available (free plan):
  - `@cf/zai-org/glm-4.7-flash` (fast, reasoning model)
  - `@cf/google/gemma-4-26b-a4b-it`
  - `@cf/nvidia/nemotron-3-120b-a12b`
- API endpoints:
  - `POST /api/chat` — send messages, get AI response
  - `GET /api/info` — service info

## Free Plan Limits

- 10,000 Neurons per day
- 300 requests/minute for text generation
- No cost — runs entirely on the Workers Free plan

## Deploy with Wrangler

```bash
npx wrangler deploy
```

## API Usage

```bash
curl -X POST https://projectai.openaimp.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Hello!"}], "model": "@cf/zai-org/glm-4.7-flash"}'
```

## Notes

- GLM-4.7 Flash is a reasoning model — it may spend tokens on internal thinking before responding.
- If responses are empty, try Gemma 4 26B which responds more directly.
- max_tokens is set to 4096 to accommodate reasoning models.

## License

MIT
