# On-Ground · Call Centre

An independently implemented Indian retail call-centre prototype, recreated from the supplied visual reference. Real AI-to-human telephone calling is verified. Dashboard/store data is illustrative; call states, summary and transcript come from Bolna.

## Run locally

Node 22+ required (Node 25 used for validation).

```sh
npm install
cp .env.example .env.local
# Fill the private provider settings. Never commit keys or phone numbers.
npm run dev
```

Open http://127.0.0.1:4317. A standalone calling proof view remains at `/proof`. `npm test` checks the calling boundary; `npm run build` checks TypeScript and compiles the UI.

React + TypeScript keep the interactive screens in a familiar stack. A small Node server keeps the provider credential out of the browser. Local fixtures meet the assignment's sample-data allowance. CSS charts avoid an extra chart dependency; Lucide supplies consistent icons. Components for dialog focus, call data and provider access are separate from fixtures and styles.

## Implemented

- Sidebar/topbar, responsive navigation and dashboard with KPI cards, progress, waiting leads, earnings, tasks and seven-day charts.
- Calls to make: sample intent ranking, search, expandable rows and pagination.
- Incoming: missed-call queue with indicative opportunity and callback action per row.
- Recent: live-call review with actual summary/transcript plus explicitly marked sample history.
- Calendar: month switching, Today control, event dots, day agenda and locally saved callback requests.
- Pulse: home, AvaniBot/role/task-agent entries, channels, kudos and a channel conversation.
- Leads modal: opens from dashboard tasks, previous/next navigation, ICP/intent scores and collapsible buying signals.
- Bonus interactions: channel message sending, pinned request responses and a phone-width layout. These use local storage, not an external messaging system.

## Real calling

Bolna handles the voice conversation and telephone carrier connection. The app server sends `POST https://api.bolna.ai/call` with the dedicated agent ID and single authorized test number, omitting caller ID to use the provider's default route. The verified configuration uses Plivo input/output, GPT-4.1-mini, Deepgram Nova-3 Hindi recognition and the Tripti ElevenLabs voice. The account does not need a purchased number for the tested shared/default caller path.

The app polls `GET /executions/{execution_id}` through its own server every five seconds. It waits through `call-disconnected` until `completed` before presenting finalized results. Nothing generates a simulated transcript or successful outcome when the provider fails.

The call attempt is saved before sending; duplicate request IDs reuse it. A timeout or missing execution ID blocks further calls until manually reconciled with provider history. Default cap: three attempts. That cap is not a monetary guarantee: the provider enforces a 90-second maximum per call, automatic rescheduling is off, and actual provider spend must be checked between attempts against Arnav's ₹200 total authorization.

### Verified live test

On 8 November 2026, the app called Arnav's authorized telephone number. Bolna reported **completed, 88 seconds, 9 US cents, user_hung_up**. Its wallet decreased from 500 to 491 cents. Arnav roleplayed a shopper, stated a ₹10,000 budget and requested a Hindi callback for 9 November at 10:00 IST. The assistant left confirmation with store staff. Arnav's feedback: “Natural enough; continue to screens.” Sanitized evidence is in `docs/verification/live-call.json`; original call data remains private. This proves one Hindi AI-to-human call, not human-to-human calling or independently measured business impact.

API references: https://www.bolna.ai/docs/api-reference/calls/make and https://www.bolna.ai/docs/api-reference/executions/get_execution . The reproducible agent configuration is `config/bolna-agent.json`.

## Product rationale

The demo focuses on walk-out recovery: understand one obstacle, capture the customer's preferred next step and preserve context for store staff. See `docs/PRODUCT.md` for Indian retail research, evidence limitations and decisions. `docs/EXPLAIN.md` supports the technical/product discussion.

## Local boundaries and remaining work

- Local only: development server binds to loopback. Hosted calling needs authenticated access, durable hosted storage and spending controls. Do not expose this development server publicly.
- Callback requests, channel messages and pinned responses persist in this browser's local storage. They do not create calendar invitations, call schedules or WhatsApp messages.
- Store prices, scores, KPIs, earnings and historical calls are sample data. No scoring model, commerce catalogue, mailbox or CRM is connected.
- Agent entries in Pulse open sample conversations; only the walk-out recovery telephone agent is implemented.
- The operator interface has no live-call hangup control. The recipient can hang up, and Bolna applies the 90-second limit.
- Practice-call screen, real inbound telephony, human-to-human calling and provider extraction fields remain outside the current implementation.
- Hosted deployment, GitHub publication and up-to-two-minute submission recording remain pending user review. Nothing has been submitted.

## Validation

Five provider-boundary tests pass: disabled calling, duplicate/restarted request reuse, uncertain-send redial protection, finalized result handling and attempt caps. TypeScript and production compilation pass. Manual browser checks covered all required screens, lead/queue paging, row expansion, the live transcript, callback creation and reload persistence, calendar month/Today controls, channel messages and pinned responses. Laptop layout checked at 1440×1000; phone navigation checked at 390×844 with no horizontal overflow. No browser console errors were observed during that review. Full hosted acceptance remains open.

## AI assistance and Git history

OpenAI Codex assisted research, product scoping, original implementation and tests. The reference HTML is a visual/behavioural specification; its implementation is not copied into this repository. Arnav selected the recovery scenario, reviewed the opening, participated in the telephone test and provided voice-quality feedback. Git records incremental work. He should be able to explain the calling boundary, state lifecycle, sample-data choices and local persistence limitations.

Submission details from the brief: sales@on-ground.ai; subject `Assignment Submission: Arnav Madan`; deadline 9 November 2026 at 01:44:22 IST.
