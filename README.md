# On-Ground Call Centre

**An Indian retail call-centre workbench, built for the On-Ground engineering assignment.**

Arnav Madan · React + TypeScript

[Try the app](https://onground-arnav.vercel.app) · [Watch the 1:50 demo](https://onground-arnav.vercel.app/submission.mp4) · [Reviewer guide](docs/REVIEWER_GUIDE.md)

## The product decision

I chose walk-out recovery: a shopper liked a mattress, but left because of price and wanted to discuss it with family. That gives the call a useful job—understand the hesitation and agree on a next step.

My main design direction was to let AI remove repeated work. The default dashboard puts the next action first. Performance, earnings and trends are still there, behind an expansion. After a call, the requested time, language, budget and unresolved question are prepared for review, so the associate has less to re-enter.

One detail mattered in the test: a **₹10,000 budget** is the shopper’s budget, not a product quote. A **Hindi callback at 10 am tomorrow** is a request, not confirmed store availability. I kept that distinction in the interface and the calling prompts.

## Take a quick tour

1. **Dashboard → Review allocated leads.** Check Mukunda’s scores and buying signals, then page through the leads.
2. **Calls to make → Incoming → Recent.** Expand and page the queue, open a human callback, or review the clearly labelled real-call test.
3. **Save a callback request → Calendar.** The saved time and language appear in the agenda. Month navigation and Today work independently of the sample events.
4. **Pulse.** Answer a pinned handoff, send a channel message, or try a role agent. AvaniBot can answer questions about this workspace.

The supplied green/purple visual language and screen structure remain. I reduced what is visible by default, while keeping the required information available. [Design notes](docs/DESIGN_REVIEW.md) explain the tradeoffs.

## What works

| Workflow          | Verified result                                                                                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Walk-out recovery | A real Hindi telephone call completed in **88 seconds**; the customer’s budget and callback request were captured.                                                  |
| Pitch Coach       | Text practice and a **31.9-second browser voice session**, followed by feedback grounded in the actual associate’s words. An unsupported dimension stayed unscored. |
| ASM Agent         | Three proposed tasks were approved and saved. Repeating approval did not duplicate them; task completion survived reload.                                           |
| Human Tele-caller | Browser-to-phone call completed. I checked audio in both directions; the provider recorded **27 seconds** of conversation.                                          |
| Follow-up         | Native provider scheduling/cancellation and a real **90-second AI callback** completed. Busy attempts remain in history; retry is an explicit reviewed action.      |
| AvaniBot          | Live workspace questions, persisted conversations and reviewed task proposals.                                                                                      |

All required screens are implemented. The five bonuses are included: channel messages, pinned replies, Practise a call/Call back screens, phone-width layouts and Recharts charts. The [PDF checklist](docs/DELIVERABLE_AUDIT.md) maps each requirement to its implementation and evidence.

## Stack and why

I used **React, TypeScript and Vite** for the stateful screens and reusable dialogs. A small **Node API on Vercel** keeps calling credentials out of the browser. **Private Vercel Blob** persists each reviewer’s workspace and protects concurrent writes.

**Bolna** handles AI telephone calls and browser voice practice; **Vobiz** provides the human browser-to-phone route. **Cloudflare Workers AI**, behind a server-only authenticated endpoint, handles the workspace reasoning and structured coaching feedback. These services keep the prototype focused on the associate’s workflow.

## Run locally

Use Node 22 or later:

```sh
npm ci
cp .env.example .env.local
# Fill the private settings described in docs/SETUP.md.
npm run dev
```

Open `http://127.0.0.1:4317`. For checks:

```sh
npm test
npm run build
```

[Setup and architecture](docs/SETUP.md) covers every setting, provider provisioning and deployment. The example contains no credentials. Keep `.env.local`, `.private/`, `data/` and `.vercel/` out of Git.

## How calling works

For an AI phone call, the server saves a durable reservation before sending Bolna’s `POST /call`, then polls the execution record. Ringing, conversation, processing and completed are separate states. Final transcript, summary and cost wait for the provider’s final result.

For human calls, the server issues a short-lived Vobiz token. A protected answer route consumes a one-use grant for the consented destination; provider callbacks update the result. Notes remain the associate’s own report.

A scheduled callback uses Bolna’s native `scheduled_at`, so closing the browser does not stop execution. Calls are limited to 90 seconds. There are no automatic redials; a busy or unanswered attempt can be reviewed for a manual retry, while an active or uncertain attempt remains blocked.

## Demo boundaries

The store metrics, leads, scores and sample history are fixtures. Live call records and model responses are labelled separately. Inventory, WhatsApp, a CRM and the store’s staff calendar are not connected, so the app captures requests without inventing stock, discounts, EMI eligibility or bookings.

Use your own Indian mobile number and consent when trying a telephone call. The provider’s trial may require recipient verification, and the demo has a shared usage allowance. Browser voice practice needs a microphone but no telephone number. These limits are documented in [setup](docs/SETUP.md).

## Checks and evidence

The automated checks cover workspace isolation, duplicate calls and approvals, concurrent reservations, uncertain results, callback state, one-use human grants, transcript ownership and quoted coaching evidence. TypeScript and the production build pass.

The [verification records](docs/verification) include the real recovery call, browser practice, two-way human call, executed follow-up, hosted agent flows and the 109.8-second recording. The recording shows the actual app and clearly dated playback of the original telephone test. [Submission details](docs/SUBMISSION.md) contain the final links and email copy.

## AI assistance and my role

I used **OpenAI Codex** for research, implementation, debugging and checks. I chose the recovery scenario, reviewed the opening, tested the phone and microphone flows, and directed the product/design iterations toward less unnecessary UI. The research was desk research plus these roleplays, not interviews with a representative set of retailers.

The code was written for this assignment. The supplied HTML was used as a visual/behavioural reference, and its implementation was not copied into the repository. The incremental commit history is preserved. [My walkthrough notes](docs/EXPLAIN.md) cover the main product and engineering decisions.
