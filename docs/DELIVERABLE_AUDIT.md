# Assignment deliverable audit · 8 November 2026

This maps Rashmi’s assignment email, five-page PDF and supplied HTML mock to the current implementation. It separates implementation from provider and browser acceptance. Final public links and recording checks belong in [SUBMISSION.md](SUBMISSION.md).

**Current position:** required screen coverage and all requested role workflows are implemented. Real AI telephone calling is proved. Final release acceptance, two-way human audio, voice-practice audio, live scheduled callback/cancellation and the submission recording must be recorded before claiming submission completion.

## Required screen coverage

| Requirement                 | Implemented behaviour                                                                                               | Evidence / boundary                                                                        |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Sidebar and topbar          | Responsive shell and six required navigation destinations.                                                          | Earlier local laptop/phone checks; final hosted pass pending.                              |
| Dashboard                   | KPI/progress, waiting leads, earnings, tasks and seven-day trends.                                                  | Performance details expand on demand. Metrics and lead scores are sample data.             |
| Calls to make               | Score-ranked queue, search, expandable context and pagination.                                                      | Earlier local interaction checks. No live lead-scoring model.                              |
| Incoming                    | Missed-call rows, indicative opportunity and callback action on every row.                                          | Callback requests save into the workspace; human calling has its own screen.               |
| Recent                      | Call type/time/duration and review. Actual provider records show asynchronous states, final transcript and summary. | One real 88-second AI phone call; sample history stays distinct.                           |
| Calendar                    | Month switching, Today, dots and day agenda with saved callback requests.                                           | No external staff-calendar integration. A request is not a confirmed booking.              |
| Pulse home                  | AvaniBot, Recovery, Pitch Coach, ASM, Tele-caller, Follow-up, channels and Kudos.                                   | All requested role entries now lead to distinct implemented workflows.                     |
| Pulse channel               | Back/header, pinned Needs your input card with two actions and typed reply, left/right conversation and timestamps. | Messages and responses persist in the private workspace; no external team is messaged.     |
| Lead modal                  | Dashboard task entry, ICP/intent, collapsible buying signals and previous/next navigation.                          | Sample lead data; earlier local checks.                                                    |
| Working real telephone call | Dedicated Bolna recovery agent reaches an authorized participant.                                                   | Provider reported completed, 88 seconds, 9 US cents. Participant approved its naturalness. |

## Role-agent acceptance

| Role              | Current implementation                                                                                                            | Acceptance established                                                             | Remaining acceptance                                                                   |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Walk-out Recovery | Real AI phone conversation, actual transcript/summary, structured handoff draft and review.                                       | One Hindi roleplay with an authorized participant.                                 | Independent recipient/trial-number acceptance and broader language/objection coverage. |
| Pitch Coach       | Text roleplay and feedback from actual associate turns; evidence/rubric/better line; separate browser voice customer agent.       | Managed model integration and application routes exist.                            | Complete text browser check and browser voice/audio acceptance.                        |
| ASM               | Reads workspace facts, prioritises work, proposes tasks, user approval and task completion.                                       | Live GPT-4.1-mini analysis returned task proposals.                                | Final browser proposal/approval/reload check.                                          |
| Tele-caller       | Vobiz browser-to-phone workflow, short-lived individual JWT, one-use dial grant, mute/end, provider status and saved human notes. | Dedicated application, JWT mint and SIP registration 200; no new number purchased. | Two-way microphone-to-phone conversation and live webhook lifecycle.                   |
| Follow-up         | Request → reviewed call-now/schedule → native provider execution/status; cancellation route.                                      | Durable server workflow implemented.                                               | Live schedule/cancel and executed callback acceptance.                                 |
| AvaniBot          | Live scoped workspace questions and reviewed task suggestions.                                                                    | Managed model integration and application routes exist.                            | Final browser query/persistence check.                                                 |

The cover’s broader meta-agent vision is not implemented: users do not create arbitrary new agents through AvaniBot. ASM, AvaniBot and text coaching use Bolna’s GPT-4.1-mini disposition-analysis interface over supplied workspace/practice data, rather than a dedicated general-purpose chat endpoint.

## Good-to-haves

| Bonus                                 | Implementation                                                                            | Acceptance                                                                                 |
| ------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Send a channel message                | Server-saved internal channel messages.                                                   | Earlier local interaction checked; hosted persistence check pending.                       |
| Answer Needs your input               | Two buttons or typed reply, saved server-side.                                            | Earlier local interaction checked; hosted persistence check pending.                       |
| Practise a call and Call back screens | Pitch Coach text/voice practice, callback review/scheduling and human tele-caller screen. | New complete journeys require final browser and audio/provider acceptance.                 |
| Phone-width layout                    | Responsive navigation, panels and dialogs.                                                | Earlier 390×844 check had no horizontal overflow; new agent flows need a phone-width pass. |
| Charts with a library                 | Recharts seven-day charts.                                                                | Build passes; final hosted visual check pending.                                           |

The DEMO strip and floating dial button are optional in the brief. Their absence is not a mandatory-feature gap.

## Engineering checks

- **22 tests pass:** hosted API contracts, isolation, duplicate/concurrent paid requests, durable reservations, uncertain calls, one-use human grants, event ordering, notes preservation, practice-run ownership, handoff evidence and storage validation.
- **TypeScript and production build pass.** These do not prove provider audio or hosted execution.
- **Persistence:** private Vercel Blob with conditional writes; serialized atomic local JSON without a cloud token. Browser workspaces use signed HttpOnly cookies, not employee authentication.
- **Calling controls:** consented own-number entry; no automatic retries; provider time limit; shared global caps of 5 phone / 5 web voice / 3 human / 70 analysis operations. Count caps are not a guaranteed monetary ceiling.
- **Original implementation and AI disclosure:** reference implementation not copied; Codex assistance and Arnav’s actual input documented.
- **Sample-data boundaries:** no live CRM, inventory, WhatsApp or staff calendar; no invented discounts, EMI eligibility, medical promises or confirmed bookings.
- **Reference inspection boundary:** static HTML/screenshots were inspected; a complete click-through of the original local-file mock in latest Chrome was not established. Do not claim otherwise.

## Submission package gates

| Item                           | Gate before submission                                                                                                                       |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Hosted application             | Verify the final HTTPS alias, all required routes, API health and independent browser-workspace isolation.                                   |
| Public source                  | Publish the repository, open it without owner login, inspect committed files for secrets/private call data.                                  |
| README                         | Keep final links, setup, calling implementation, limitations, acceptance and AI disclosure accurate.                                         |
| Recording, at most two minutes | Show actual UI and real telephone evidence; verify duration, sharing and absence of full phone numbers/secrets.                              |
| Email                          | Prepare the final links for sales@on-ground.ai only, subject `Assignment Submission: Arnav Madan`. Sending requires an explicit instruction. |

The explicit assignment deadline is **9 November 2026 at 01:44:22 IST**. Nothing in this audit means the email has been sent.
