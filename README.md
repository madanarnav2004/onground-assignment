# On-Ground · Call Centre

An original React and TypeScript implementation of the supplied Call Centre mock, shaped around an Indian retail associate’s next useful action. The central journey is **walk-out recovery → real conversation → reviewed next step → follow-up**.

Deployment target: [onground-arnav.vercel.app](https://onground-arnav.vercel.app). Production acceptance, the published source link and the submission recording are tracked in [the delivery checklist](docs/SUBMISSION.md); a target URL alone is not evidence of a completed release.

The store metrics, lead profiles, intent scores and historical examples are sample data. Actual provider calls and assistant responses are handled separately. This is an assignment demonstration, with consenting participants roleplaying shoppers.

## Explore the product

Start with **Dashboard → Hot leads → Mukunda**. Inspect the buying signals, expand the queue, review a call, save a callback request and find it in Calendar. In **Pulse**, try the role agents or open a channel, answer its pinned request and send a message.

The working view puts the next action first. Required metrics, charts and supporting evidence remain available on expansion. The aim is to remove repeated work without removing the reference’s required screens. See [the reviewer guide](docs/REVIEWER_GUIDE.md) for a short walkthrough and [the design review](docs/DESIGN_REVIEW.md) for the decisions.

| Role              | Implemented workflow                                                                                                                                               | Current acceptance evidence                                                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Walk-out Recovery | Bolna calls the participant’s phone, handles an objection, returns status/transcript/summary and prepares a callback draft.                                        | One real Hindi phone call completed: **88 seconds, 9 US cents** on 8 November 2026. Participant approved its naturalness.                              |
| Pitch Coach       | Text roleplay, review of actual associate turns, evidence-based rubric and a better next line. Browser voice practice uses a separate customer-role agent.         | Live analytical model integration is connected. Browser microphone/audio and the complete voice-practice journey still require acceptance.             |
| ASM Agent         | Reads the workspace, proposes priorities and tasks; the user approves tasks before they are saved. Tasks can be completed in the workspace.                        | Live GPT-4.1-mini workspace analysis has returned proposals. Final browser acceptance is tracked separately.                                           |
| Human Tele-caller | Browser microphone to a test phone through Vobiz; mute/end controls, customer context and saved human-reported outcomes.                                           | Dedicated application, short-lived JWT mint and SIP registration returned **200**. Two-way browser/phone audio is a separate, pending acceptance test. |
| Follow-up Agent   | A saved request can be called now or scheduled with Bolna, with context carried forward and cancellation available. Provider scheduling survives closing the page. | Hosted scheduling and immediate cancellation verified against Bolna; provider reported stopped and no phone rang. A full executed callback conversation remains a separate acceptance test.                                                             |
| AvaniBot          | Answers workspace questions and can propose reviewed next steps.                                                                                                   | Live analytical model integration is connected; scoped to the workspace, with no invented store facts.                                                 |

These are distinct workflows. An implemented route, a provider registration and a completed telephone conversation establish different things; [the audit](docs/DELIVERABLE_AUDIT.md) records that distinction.

## Run locally

Use **Node 22 or later** and npm. Node 25 was used during development.

```sh
npm ci
cp .env.example .env.local
# Fill the required private settings in .env.local.
npm run dev
```

Open `http://127.0.0.1:4317`. The development server binds to loopback. Do not expose the Vite development server publicly.

```sh
npm test
npm run build
```

The example file contains no credentials. Keep `.env.local`, `.private/`, `data/` and `.vercel/` out of Git. Provider configurations and prompts are under `config/`. The relevant agents and extraction/disposition fields must also be configured in the Bolna account; source configuration files alone do not provision a provider account.

| Private setting                     | Purpose                                                                                                                                                   |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `APP_SESSION_SECRET`                | Random, high-entropy secret used to sign workspace cookies.                                                                                               |
| `APP_URL`                           | Application origin. Use the production HTTPS alias for deployed provider callbacks. Local requests to the documented loopback origins are also supported. |
| `BOLNA_API_KEY`                     | Server-only Bolna API access.                                                                                                                             |
| `BOLNA_AGENT_ID`                    | Walk-out recovery agent, including its Retail Handoff extraction fields.                                                                                  |
| `BOLNA_COACH_AGENT_ID`              | Voice practice agent that plays the shopper.                                                                                                              |
| `BOLNA_FOLLOWUP_AGENT_ID`           | Context-aware callback agent.                                                                                                                             |
| `BOLNA_ANALYST_AGENT_ID`            | Workspace reasoning agent and configured analysis fields.                                                                                                 |
| `VOBIZ_AUTH_ID`, `VOBIZ_AUTH_TOKEN` | Server-side carrier authentication; the master token is never sent to the browser.                                                                        |
| `VOBIZ_APP_ID`, `VOBIZ_CALLER_ID`   | Dedicated voice application and existing voice-enabled caller number.                                                                                     |
| `VOBIZ_WEBHOOK_SECRET`              | Random, high-entropy secret protecting the voice callback routes.                                                                                         |
| `BLOB_READ_WRITE_TOKEN`             | Private Vercel Blob storage. Omit for durable local JSON storage during local development.                                                                |
| `CALLING_ENABLED`                   | Must be `true` to enable demo calling. Keep `false` while configuring an account.                                                                         |
| `PORT`                              | Local development port; defaults to `4317`.                                                                                                               |

`BOLNA_FROM_NUMBER`, `TEST_PHONE_NUMBER` and `MAX_TEST_CALLS` are retained only for the earlier fixed-recipient calling-service test harness. The current workspace asks the participant for their own number; the shared hosted allowance is enforced in `server/api.mjs`.

## How real calling works

**AI telephone calling.** The browser sends a consented request to the app server. The server reserves the operation durably, writes a call record before contacting Bolna, and sends `POST /call`. The verified shared/default carrier route does not require buying a new number. The tested recovery agent uses GPT-4.1-mini, Deepgram Nova-3 and the Tripti ElevenLabs voice, with a provider-configured 90-second maximum and automatic rescheduling disabled.

The app reads `GET /executions/{execution_id}` through its server. Queued, ringing, in-progress, disconnected/processing and completed are different states. Final transcript, summary and cost appear only when the provider returns them. A lost response or unknown acceptance blocks blind redial; the app never manufactures a successful call.

**Human calling.** The server mints a short-lived Vobiz JWT with an individual workspace identity and a dedicated application. The browser SDK registers and places the call. The protected answer route consumes a single-use dial grant and returns XML for the consented destination. Provider callbacks update the saved status; browser “ended” events cannot fabricate provider completion. Human notes and dispositions remain explicitly operator-reported.

**Scheduled follow-up.** A callback request is initially just a request. The user must supply their own test phone and approve execution. Scheduling sends an explicit `scheduled_at` value to Bolna, within seven days and between 9 am and 8 pm IST. The provider owns execution after that point; no open browser or local timer is required. No automatic retries are configured, and a scheduled call is distinct from a store booking.

**Trial limits.** A first-time visitor can explore without entering a number. A telephone action asks for their own Indian mobile number and consent. Trial accounts may require that recipient to be verified by the provider; entering a number does not bypass that restriction. The shared assignment allowance is **5 telephone operations, 5 web voice sessions, 3 human-call operations and 70 analysis operations**, with a per-session call cooldown. Reservations persist across server instances. These count limits are not a guaranteed currency ceiling; actual provider spend is reviewed against the owner’s ₹200 test budget. No paid upgrade or new number rental is assumed.

Official interfaces: [Bolna calling](https://www.bolna.ai/docs/api-reference/calls/make), [Bolna browser voice SDK](https://github.com/bolna-ai/web-call), [Vobiz browser calling reference](https://github.com/vobiz-ai/Vobiz-RTC-demo).

## Intelligence and persistence

ASM, AvaniBot and text coaching use **GPT-4.1-mini through Bolna’s configured disposition-analysis test interface**, over a workspace snapshot or practice transcript. This is a constrained reuse of the existing voice provider’s analysis service, not a direct general-purpose chat API. Answers, proposals and rubric fields are validated before rendering; task proposals require approval before mutation. A production iteration should use a dedicated typed reasoning interface with its own evaluations and budget controls.

The hosted app uses **private Vercel Blob**. Signed, HttpOnly cookies identify separate anonymous browser workspaces; they are not employee accounts or an enterprise authentication system. Conditional writes protect reservations and workspace updates against competing serverless instances. Locally, serialized atomic JSON writes provide persistence without a cloud token. Messages, pinned responses, callbacks, conversations, coaching reviews, tasks and call records are saved server-side.

The app does not connect to a live CRM, store inventory, staff calendar or WhatsApp service. Channel messages are internal demo records. Requested visits and callback times never become confirmed availability by implication. The sample intent scores are fixtures, not a trained scoring system. No conversion or revenue improvement is claimed.

## Validation and evidence

**32 tests pass.** They cover call enablement, duplicate/concurrent requests, durable reservations, uncertain-send protection, finalized call data, workspace isolation, invalid inputs/origins, exact voice-run ownership, one-use human dial grants, provider event ordering and preservation of human notes, handoff validation, storage isolation and rejected writes. TypeScript and production compilation pass.

Earlier local browser checks covered required navigation, lead/queue paging, expansion, call review, callback requests, Calendar, channel messages and pinned responses at laptop and phone widths. Recharts supplies the seven-day charts. The newly integrated agent journeys and hosted release have their own acceptance gates; fixture-backed tests do not prove two-way audio or a real scheduled callback.

The verified telephone roleplay captured a **₹10,000 customer budget** and a requested **Hindi callback on 9 November at 10:00 IST**. Store confirmation remained pending. The original provider wallet change matched the reported 9-cent cost. Sanitized evidence is in [live-call.json](docs/verification/live-call.json); full numbers, provider secrets and private recording URLs are excluded. [Vobiz registration evidence](docs/verification/vobiz-registration.json) proves registration only.

## Product decisions and AI assistance

Indian retail context informed language choice, budget discovery, family-involved decisions and the distinction between a requested visit and confirmed store availability. This combines desk research and one authorized roleplay, not broad customer discovery. Research and evidence limits are in [PRODUCT.md](docs/PRODUCT.md).

OpenAI Codex assisted research, original implementation, product/design iteration and tests. Arnav selected the recovery scenario, reviewed the opening, participated in the phone call, judged voice naturalness and directed the reduction of unnecessary UI. The supplied HTML is a visual and behavioural reference; its implementation is not copied into this repository. Incremental Git history records the build. [EXPLAIN.md](docs/EXPLAIN.md) supports an honest product and engineering walkthrough.
