# Retail intelligence service

A separate Cloudflare Worker runs the text agents on Workers AI. Vercel remains the application host. The browser never receives the inference credential.

## Reproduce

Use an existing Cloudflare account with Workers AI access. Check `account_id` in `wrangler.jsonc` before deploying; it must identify your intended account. Commands below run from the repository root and pin the CLI version used for verification.

```sh
npx --yes wrangler@4.71.0 login
npx --yes wrangler@4.71.0 deploy --dry-run --config inference/wrangler.jsonc
npx --yes wrangler@4.71.0 deploy --config inference/wrangler.jsonc
```

Generate a private credential once, preserving existing local settings:

```sh
node --env-file-if-exists=.env.local --input-type=module <<'JS'
import { appendFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
if (!process.env.INFERENCE_SECRET) {
  appendFileSync('.env.local', '\nINFERENCE_SECRET=' + randomBytes(32).toString('hex') + '\n', { mode: 0o600 });
}
JS
```

Upload it through stdin. This keeps its value out of command arguments, shell history and terminal output:

```sh
node --env-file=.env.local --input-type=module -e 'if (!process.env.INFERENCE_SECRET) process.exit(1); process.stdout.write(process.env.INFERENCE_SECRET)' \
  | npx --yes wrangler@4.71.0 secret put INFERENCE_SECRET --config inference/wrangler.jsonc
```

Set two **server-only** Vercel environment variables, then redeploy the application:

- `INFERENCE_URL`: the Worker HTTPS URL printed by deployment.
- `INFERENCE_SECRET`: the identical private credential, stored as an encrypted/sensitive environment variable.

Keep these in the local ignored `.env.local` for development. Never use a `VITE_` prefix, commit a secret file, print the credential, or include it in a URL. Deployment initially returns 503 until its secret is configured.

## Contract and limits

Authenticated `POST` with `Authorization: Bearer <private credential>` and `Content-Type: application/json`:

```json
{
  "messages": [
    { "role": "system", "content": "Return a JSON object." },
    { "role": "user", "content": "Your workspace question" }
  ],
  "max_tokens": 1400,
  "response_format": { "type": "json_object" }
}
```

Returns `{ "response": "<JSON object encoded as a string>", "model": "...", "usage": {} }`. The app validates the model's proposed fields and requires approval before creating tasks. JSON mode does not establish factual correctness.

The bridge limits the request to 32 KiB, 24 text messages and 1,400 output tokens. It rejects unauthenticated requests, exposes no browser CORS access, and logs no prompts or credentials. The application separately limits demo operations. A provider or allowance failure returns an error; it is not replaced with a simulated answer.

## Model and cost

The verified model is [`@cf/meta/llama-3.3-70b-instruct-fp8-fast`](https://developers.cloudflare.com/workers-ai/models/llama-3.3-70b-instruct-fp8-fast/), with a 24,000-token context and [JSON mode support](https://developers.cloudflare.com/workers-ai/features/json-mode/).

As checked on 8 November 2026, [Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/) lists $0.293 per million input tokens and $2.253 per million output tokens for this model. The shared account allocation is 10,000 Neurons per day at no charge. Usage by other applications counts toward it; paid-plan overages, account limits and future pricing can change the cost or availability. No account upgrade was made for this demo.

The live smoke check returned HTTP 200 and valid JSON in 2.9 seconds, using 181 tokens / 15.69 Neurons. Unauthenticated access returned 401. Sanitized evidence is in [`docs/verification/inference.json`](../docs/verification/inference.json).
