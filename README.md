# On-Ground Call Centre

Arnav Madan's submission for the On-Ground engineering assignment.

[Live app](https://onground-arnav.vercel.app) · [1:50 demo](https://onground-arnav.vercel.app/submission.mp4) · [Try the demo](docs/REVIEWER_GUIDE.md)

I built this around a shopper who tried a mattress, liked it, and left undecided over price. The associate's job is to understand the hesitation and agree on a next step.

My main product direction was to cut the work after the call. If the customer has already given a time, language and budget, the associate shouldn't have to enter them again. The app prepares the callback request for review. The dashboard puts that work first; the required KPIs and charts are one expansion away.

[Why I built it this way](docs/EXPLAIN.md) goes into the decisions and what changed during testing. [Research notes](docs/PRODUCT.md) cover the Indian retail context.

## What works

The required Dashboard, Calls, Incoming, Recent, Calendar, Pulse/channel and lead modal are built. All five bonuses are included: channel messages, pinned replies, practice/callback screens, phone-width layouts and library charts. The [PDF checklist](docs/DELIVERABLE_AUDIT.md) maps the details.

| Workflow      | What was tested                                                                                                  |
| ------------- | ---------------------------------------------------------------------------------------------------------------- |
| Recovery      | An 88-second Hindi telephone call; budget and requested callback captured.                                       |
| Pitch Coach   | Text practice and a 31.9-second browser voice session, with feedback based on the associate's actual responses.  |
| ASM           | Three suggested tasks approved and saved; repeated approval created no duplicates; completion survived a reload. |
| Human calling | Browser microphone to a phone, with 27 seconds of conversation. I checked audio in both directions.              |
| Follow-up     | Provider scheduling and cancellation, followed by a completed 90-second AI callback.                             |
| AvaniBot      | Workspace questions, saved conversations and task suggestions that can be reviewed before saving.                |

The demo video shows the app and labelled playback of the original telephone test. These calls were roleplays with me. Store metrics, leads and scores are sample data.

## Run it

Use Node 22.12 or later.

```sh
npm ci
cp .env.example .env.local
# Add the provider settings listed in docs/SETUP.md.
npm run dev
```

Open `http://127.0.0.1:4317`. Run `npm test` for the 37 automated checks, and `npm run build` for TypeScript and the production build. Both pass for the published app.

The [setup guide](docs/SETUP.md) has the settings and provisioning commands. Credentials belong in `.env.local`, which is ignored by Git.

## Stack and calling

React, TypeScript and Vite handle the screens; Recharts supplies the seven-day charts. A Node API on Vercel keeps provider credentials on the server. Private Vercel Blob stores each reviewer's workspace and handles competing writes.

Bolna runs the AI calls and browser voice practice. The server reserves a call before sending `POST /call`, then polls the provider for its result. Ringing, conversation and processing have separate states. Transcript, duration and cost appear when the provider finalises them.

Vobiz handles human calling. The browser gets a short-lived token, and a one-use server grant limits the call to the destination the user confirmed. Scheduled AI callbacks use Bolna's `scheduled_at`, so they can run after the page closes. A failed or busy call can be reviewed for a manual retry; the app won't redial automatically.

ASM, AvaniBot and text coaching use Llama 3.3 through a small authenticated Cloudflare Workers AI service. This lets those roles work with workspace context without putting another telephone call through the voice provider.

## A few limits

You can browse without a number. Trying a phone call asks for your own Indian mobile number and consent. The trial provider may require recipient verification, and the demo has a shared usage allowance. Voice practice needs microphone access instead.

The app isn't connected to store inventory, WhatsApp, a CRM or staff availability. A callback or visit stays a request until the store confirms it. In the test, ₹10,000 was the customer's budget, not a price offered by the agent.

[Test records](docs/verification) contain the saved results. [Submission details](docs/SUBMISSION.md) have the final links and email copy.

## AI assistance

I used OpenAI Codex for research, implementation, debugging and checks. I chose the scenario, reviewed the opening, took the test calls and directed the product and visual iterations. The research was desk research and demo roleplays, rather than interviews with store teams.

The app code was written for this assignment. The supplied HTML was the reference; its implementation wasn't copied into the repo. The commit history records the build as it happened.
