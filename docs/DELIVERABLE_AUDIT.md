# Assignment deliverable audit · 8 November 2026

This maps Rashmi’s assignment email, five-page PDF and supplied HTML mock to the current implementation. It separates implementation from provider and browser acceptance. Final public links and recording checks belong in [SUBMISSION.md](SUBMISSION.md).

**Current position:** required screen coverage and all requested role workflows are implemented. Real AI telephone calling is proved. The public Vercel app and public GitHub source are live. Hosted persistence, isolated reviewer sessions, the rendered core flows and native scheduled-call cancellation are verified. The dedicated intelligence service has passed hosted roleplay, feedback, workspace-question and task approval/completion checks. Browser voice practice, two-way human phone audio and the executed AI follow-up are now verified. The finished 109.80-second Safari recording shows the actual interface and dated real-call playback.

## Required screen coverage

| Requirement                 | Implemented behaviour                                                                                               | Evidence / boundary                                                                                                                    |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Sidebar and topbar          | Responsive shell and six required navigation destinations.                                                          | Hosted rendered shell checked at laptop and narrow widths.                                                                             |
| Dashboard                   | KPI/progress, waiting leads, earnings, tasks and seven-day trends.                                                  | Performance details expand on demand. Metrics and lead scores are sample data.                                                         |
| Calls to make               | Score-ranked queue, search, expandable context and pagination.                                                      | Earlier local interaction checks. No live lead-scoring model.                                                                          |
| Incoming                    | Missed-call rows, indicative opportunity and callback action on every row.                                          | Each missed row opens human calling with the selected shopper and product context; saved requests also have a separate follow-up flow. |
| Recent                      | Call type/time/duration and review. Actual provider records show asynchronous states, final transcript and summary. | One real 88-second AI phone call; sample history stays distinct.                                                                       |
| Calendar                    | Month switching, Today, dots and day agenda with saved callback requests.                                           | No external staff-calendar integration. A request is not a confirmed booking.                                                          |
| Pulse home                  | AvaniBot, Recovery, Pitch Coach, ASM, Tele-caller, Follow-up, channels and Kudos.                                   | All requested role entries now lead to distinct implemented workflows.                                                                 |
| Pulse channel               | Back/header, pinned Needs your input card with two actions and typed reply, left/right conversation and timestamps. | Messages and responses persist in the private workspace; no external team is messaged.                                                 |
| Lead modal                  | Dashboard task entry, ICP/intent, collapsible buying signals and previous/next navigation.                          | Sample lead data; earlier local checks.                                                                                                |
| Working real telephone call | Dedicated Bolna recovery agent reaches an authorized participant.                                                   | Provider reported completed, 88 seconds, 9 US cents. Participant approved its naturalness.                                             |

## Role-agent acceptance

| Role              | Current implementation                                                                       | Acceptance established                                                                                                                            | Remaining acceptance                                                                            |
| ----------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Walk-out Recovery | Real AI phone conversation, actual transcript/summary, structured handoff draft and review.  | One Hindi roleplay with an authorized participant.                                                                                                | Independent recipient/trial-number acceptance and broader language/objection coverage.          |
| Pitch Coach       | Text and browser voice practice, evidence/rubric and better next line.                       | Actual 31.9-second browser conversation, five saved turns and subsequent transcript-based feedback verified.                                      | Broader independent-user and language testing.                                                  |
| ASM               | Reads workspace facts, prioritises work, proposes tasks, user approval and task completion.  | Hosted inference proposed three valid tasks; approval saved three, repeated approval did not duplicate them, and task completion survived reload. | Final rendered click-through of the latest model route; its full API workflow is verified.      |
| Tele-caller       | Vobiz browser-to-phone, short JWT, one-use grant, mute/end, provider record and saved notes. | User confirmed both audio directions; provider completed 27-second conversation; notes saved; ₹0.76 debit verified.                               | Independent-user/carrier coverage.                                                              |
| Follow-up         | Reviewed request → provider call-now/schedule, native execution/status and cancellation.     | Hosted schedule/cancel verified, then real 90-second AI follow-up completed with transcript, summary and handoff. Earlier busy outcome retained.  | Broader field testing; no automatic redials.                                                    |
| AvaniBot          | Live scoped workspace questions and reviewed task suggestions.                               | Hosted Workers AI answer distinguished a requested callback from a scheduled call and unknown stock; private conversations persisted.             | Final rendered click-through of the latest model route; API questions/persistence are verified. |

The cover’s broader meta-agent vision is not implemented: users do not create arbitrary new agents through AvaniBot. ASM, AvaniBot and text coaching use a dedicated authenticated Cloudflare Workers AI service with Llama 3.3 JSON mode. The earlier Bolna extraction reuse proved unreliable for general reasoning and is retained only as an optional development compatibility path. The live calling agents remain on Bolna.

## Good-to-haves

| Bonus                                 | Implementation                                                       | Acceptance                                                                                                                                      |
| ------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Send a channel message                | Server-saved internal channel messages.                              | Hosted message rendering and server persistence verified; separate sessions remain isolated.                                                    |
| Answer Needs your input               | Two buttons or typed reply, saved server-side.                       | Hosted pinned response and typed reply rendering/persistence verified.                                                                          |
| Practise a call and Call back screens | Text/voice coaching, reviewed callback/scheduling and human calling. | Actual voice practice, two-way human audio and executed AI callback verified.                                                                   |
| Phone-width layout                    | Responsive navigation, panels and dialogs.                           | Earlier 390×844 shell check and a hosted 390px practice-dialog check had no horizontal overflow. Full mobile audio acceptance remains separate. |
| Charts with a library                 | Recharts seven-day charts.                                           | Hosted laptop rendering checked: both seven-day bar charts and tooltips render.                                                                 |

The DEMO strip and floating dial button are optional in the brief. Their absence is not a mandatory-feature gap.

## Engineering checks

- **37 tests pass:** hosted API contracts, isolation, duplicate/concurrent paid requests, durable reservations, uncertain calls, one-use human grants, event ordering, notes preservation, practice-run ownership, handoff evidence and storage validation.
- **TypeScript and production build pass.** These do not prove provider audio or hosted execution.
- **Persistence:** private Vercel Blob with conditional writes; serialized atomic local JSON without a cloud token. Browser workspaces use signed HttpOnly cookies, not employee authentication.
- **Calling controls:** consented own-number entry; no automatic retries; provider time limit; shared global caps of 5 phone / 5 web voice / 3 human / 70 analysis operations. Count caps are not a guaranteed monetary ceiling.
- **Original implementation and AI disclosure:** reference implementation not copied; Codex assistance and Arnav’s actual input documented.
- **Sample-data boundaries:** no live CRM, inventory, WhatsApp or staff calendar; no invented discounts, EMI eligibility, medical promises or confirmed bookings.
- **Reference inspection boundary:** static HTML/screenshots were inspected; a complete click-through of the original local-file mock in latest Chrome was not established. Do not claim otherwise.

## Submission package gates

| Item                           | Gate before submission                                                                                                                        |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Hosted application             | Public app and APIs respond; isolated workspaces, core rendered journeys, real browser voice, human audio and executed AI follow-up verified. |
| Public source                  | Public repository opens via unauthenticated GitHub API; source is published. Final revision and secret scan stay part of release checks.      |
| README                         | Keep final links, setup, calling implementation, limitations, acceptance and AI disclosure accurate.                                          |
| Recording, at most two minutes | Show actual UI and real telephone evidence; verify duration, sharing and absence of full phone numbers/secrets.                               |
| Email                          | Prepare the final links for sales@on-ground.ai only, subject `Assignment Submission: Arnav Madan`. Sending requires an explicit instruction.  |

Evidence: [hosted UI](verification/hosted-ui.md), [hosted sessions/agents](verification/hosted-agents.json), [real call](verification/live-call.json), [schedule/cancel](verification/scheduled-callback.json), [dedicated inference](verification/direct-intelligence.json). These records state the specific scope of each check.

The explicit assignment deadline is **9 November 2026 at 01:44:22 IST**. Nothing in this audit means the email has been sent.
