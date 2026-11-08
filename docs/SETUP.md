# Running the project

Use Node **22.12 or newer** and npm. I developed it with Node 25.

```sh
npm ci
cp .env.example .env.local
```

Fill in `.env.local` before starting. `APP_SESSION_SECRET` needs a random secret; keep it stable so existing browser workspaces keep working. Leave `CALLING_ENABLED=false` until the calling accounts are ready.

```sh
npm run dev
```

Open [localhost:4317](http://127.0.0.1:4317). The dev server runs on this machine only. Without a Blob token, it saves workspace data in local JSON files under `data/`.

```sh
npm test
npm run build
```

## Settings

These values stay on the server. The example file explains where each one is used.

| Setting                             | What to put here                                                                              |
| ----------------------------------- | --------------------------------------------------------------------------------------------- |
| `APP_SESSION_SECRET`                | A random secret for signing workspace cookies.                                                |
| `APP_URL`                           | `http://127.0.0.1:4317` locally; the public HTTPS app URL when deployed.                      |
| `INFERENCE_URL`, `INFERENCE_SECRET` | The Workers AI endpoint and its bearer secret. See [inference setup](../inference/README.md). |
| `BOLNA_API_KEY`                     | Your Bolna API key.                                                                           |
| `BOLNA_AGENT_ID`                    | The walk-out recovery agent ID.                                                               |
| `BOLNA_COACH_AGENT_ID`              | The practice agent ID; this agent plays the shopper.                                          |
| `BOLNA_FOLLOWUP_AGENT_ID`           | The follow-up agent ID.                                                                       |
| `VOBIZ_AUTH_ID`, `VOBIZ_AUTH_TOKEN` | Your Vobiz account credentials.                                                               |
| `VOBIZ_APP_ID`, `VOBIZ_CALLER_ID`   | The voice application and an existing voice-enabled number.                                   |
| `VOBIZ_WEBHOOK_SECRET`              | A random secret for the carrier callback routes.                                              |
| `BLOB_READ_WRITE_TOKEN`             | A **private** Vercel Blob store token, required for hosted persistence. Optional locally.     |
| `CALLING_ENABLED`                   | Set to `true` once the provider setup is complete.                                            |
| `PORT`                              | Optional; defaults to `4317`.                                                                 |

`BOLNA_ANALYST_AGENT_ID` supports the earlier analysis implementation when `INFERENCE_URL` is absent. The hosted text agents use Workers AI. `BOLNA_FROM_NUMBER`, `TEST_PHONE_NUMBER` and `MAX_TEST_CALLS` belong to the earlier fixed-number test harness; the workspace uses its own calling form and server-side allowances.

## Connect the providers

The prompts and extraction questions live in `config/`. Run the Bolna setup script to create or reuse the corresponding account-side agents:

```sh
node --env-file=.env.local scripts/provision-agents.mjs
```

It saves each agent ID in `.env.local` and adds any missing extraction fields. It doesn't place calls or replace existing prompts.

For Vobiz, deploy the app first and set `APP_URL` to its HTTPS address. Then run:

```sh
node --env-file=.env.local scripts/provision-vobiz.mjs
```

This uses an existing caller number and creates the voice application. It doesn't buy a number. Test human calling through the hosted app: Vobiz must be able to reach the answer and status URLs, which it cannot do on localhost.

The text agents need the separate [Workers AI service](../inference/README.md). Deploy the repository root to Vercel using `vercel.json`, add the server settings above, and connect a private Blob store. Redeploy after changing environment variables. Keep `.env.local`, `.private/`, `data/` and `.vercel/` out of Git.

## The calling paths

**AI calls:** the app saves a call request and reserves an allowance before sending Bolna `POST /call`. It polls `GET /executions/{execution_id}` for progress and the final transcript, summary and cost. An uncertain provider response stays unresolved until checked. The tested recovery agent uses GPT-4.1-mini, Deepgram Nova-3 and the Tripti ElevenLabs voice, with a 90-second provider limit and automatic rescheduling off. The demo used Bolna's shared/default number.

**Human calls:** Vobiz issues a short-lived JWT for that browser workspace. Its SDK connects the browser to the phone network; the answer route permits one dial to the approved destination. Carrier callbacks supply the final call status. Notes and outcomes are entered by the person making the call.

**Follow-up:** saving a callback request doesn't dial anyone. After the user approves a number and time, the server sends `scheduled_at` to Bolna. Bolna then runs the call even if the browser is closed. The demo accepts times within seven days, between 9 am and 8 pm IST, with automatic retries off. Store availability still needs staff confirmation.

The calling form asks for the participant's own Indian mobile number and consent. Trial accounts may require recipient verification. The shared demo allowances are 5 telephone operations, 5 browser voice sessions, 3 human-call operations and 70 analysis requests, with a call cooldown per workspace. These allowances limit operations rather than spend. The recorded tests used existing trial credit and numbers within the owner's ₹200 budget; no upgrade or number rental was purchased.

Provider references: [Bolna calling API](https://www.bolna.ai/docs/api-reference/calls/make), [Bolna browser voice SDK](https://github.com/bolna-ai/web-call), [Vobiz browser calling example](https://github.com/vobiz-ai/Vobiz-RTC-demo).

## Data and text agents

ASM, AvaniBot and text coaching use Llama 3.3 JSON mode through the authenticated Workers AI service. The app sends the relevant workspace context, checks proposed lead IDs and task owners, and compares coaching evidence with the associate's actual words. Suggested tasks are saved after approval. Context is trimmed to the service's 32 KiB limit; original workspace records remain available. A configured inference service error is shown to the user.

Private Blob storage keeps calls, callbacks, messages, pinned replies, conversations, coaching and tasks across refreshes. Signed HttpOnly cookies give each browser a separate anonymous workspace. Conditional writes prevent competing server requests from overwriting each other's changes.

This is a retail demo with sample leads and intent scores. CRM, inventory, WhatsApp and the staff calendar are not connected. A requested callback or visit therefore remains a request until the store confirms it.
