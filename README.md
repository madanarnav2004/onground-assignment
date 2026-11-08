# On-Ground assignment

An independently implemented retail call-centre workspace. Current milestone: local calling proof. Required reference screens are not implemented yet.

## Run

Node 22+ required. `npm install`, copy `.env.example` to `.env.local`, fill private provider settings, then `npm run dev`. Open http://127.0.0.1:4317. React + TypeScript for UI, Node server to keep provider keys off the client. `npm test` checks calling boundaries; `npm run build` checks types and compiles the UI.

## Calling

Bolna handles the AI conversation and telephone carrier connection (Vobiz proposed). Server sends `POST https://api.bolna.ai/call` with configured agent ID and the single authorized destination. It tracks `GET /executions/{execution_id}` every five seconds through the local API. Provider key stays on the server. There is no simulated call, transcript or successful outcome fallback.

The call attempt is persisted before sending; duplicate request IDs reuse it. A timeout, missing ID or uncertain response blocks new attempts. Check Bolna history before reconciliation; never delete the local ledger merely to retry. The default test cap is three attempts, not a guaranteed monetary cap. Before enabling, check actual credit and per-minute pricing, configure a provider maximum duration of 90 seconds, disable provider auto-retries, and review actual spend after each call against Arnav's ₹200 limit. Do not enable until those checks pass.

Current integration is LOCAL ONLY and binds to loopback. Hosted calling requires authentication, durable hosted storage, budget enforcement and an access-controlled evidence view. Do not expose this development server publicly. Hangup is not implemented; the recipient can hang up. Polling continues until provider completion so unfinished results aren't presented as final.

## Provider setup pending

- API key created with Arnav's permission; local save must be verified.
- Account shows $5 balance, no linked phone numbers on 8 Nov 2026.
- Need dedicated assignment agent, usable shared/default or linked caller number, verified recipient where required, duration limit, retry settings and summary enabled. An empty My Numbers page alone does not establish that calling is blocked: Bolna documents shared/default numbers at https://www.bolna.ai/ai-outbound-calling . Check availability before buying or linking a number.
- No real phone call has been demonstrated yet.

API references: https://www.bolna.ai/docs/api-reference/calls/make and https://www.bolna.ai/docs/api-reference/executions/get_execution . Product research and review checkpoints: `docs/PRODUCT.md`; proposed agent script: `docs/AGENT_PROMPT.md`.

## AI assistance

OpenAI Codex assisted research, product scoping, original code and tests. The reference HTML is treated as a visual/behavioural specification; its implementation is not copied into this repository. Arnav reviews product choices, the conversation and demo evidence. Commit history records incremental work.

## Submission remains open

Required screens, live deployment, real-call evidence, final README and up-to-two-minute recording are outstanding. Submission target from the brief is sales@on-ground.ai, deadline 9 Nov 2026 at 01:44:22 IST. Nothing has been submitted.
