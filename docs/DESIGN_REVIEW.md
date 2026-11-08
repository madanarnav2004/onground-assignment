# Agent-first visual review · 8 November 2026

Arnav asked to approach this as a product manager/designer, remove UI where the system can do the work, and respect the assignment constraints. The outcome is a task-led interface within the supplied screen structure.

## The design thesis

The agent should not reconstruct a conversation by reading a transcript and completing another form. The system prepares the next step; the agent reviews it, saves it or handles an exception. This is a workflow change supported by progressive disclosure, rather than an extra AI panel.

## Findings and implemented changes

| Finding from the agent's perspective | Decision |
| --- | --- |
| Four KPI cards and two charts preceded the work | Put a single next-action card first. Performance, earnings and trends remain in labeled expansions. |
| Scores were repeated in the header and dashboard | Remove header score/rank controls; preserve them in the relevant performance/Kudos areas. |
| Queue rows hid the reason for calling | Show customer, stage, short reason, language and intent without expansion. Put history and actions inside the expanded row. |
| A completed call left stale pre-call context in the queue | Show the actual callback request, preferred time and budget from that call. Lead details use the same context. |
| Call review began with a long generated summary and full transcript | Lead with the suggested next action and its date/time/language. Summary, evidence and original transcript expand separately. |
| Callback planning asked for details already captured on the phone | Use structured model extraction to prepare the request. Complete suggestions can be saved directly. Editing is optional; missing details open inputs. |
| Repeated saves could create duplicate callbacks | Edit the existing local request instead of adding another request for the same lead. |
| Requested callbacks still appeared in Who's waiting | Exclude leads with locally saved callback requests from that waiting shortlist. |
| Small pale text competed with labels and badges | Increase working text and control sizes, improve contrast and reduce secondary emphasis. |

## What the AI actually does

A dedicated Retail Handoff extraction category is linked to the Bolna assignment agent. It asks about callback consent, requested date/time/language, stated budget, concern and supporting utterances. The actual completed transcript was analyzed using Bolna's dispositions test API with the original call date supplied. It returned 9 November 2026, 10:00 IST, Hindi and ₹10,000 correctly for this one test.

The analysis is distinct from the original finalized telephone record. It did not place another call. The provider wallet still returned 491 US cents after analysis, unchanged from the post-call balance. This is not a guarantee about future extraction billing.

An important observed failure: the model labeled transliterated Hindi as exact customer quotes. The application therefore ignores model-written evidence and displays the original `user:` lines from the transcript. It also validates dates, times and language values, ignores unanswered fields and keeps requests unconfirmed. Missing or invalid fields require editing. One successful extraction is not evidence of general accuracy.

## Constraint map

- Sidebar, topbar and all required screen destinations remain.
- Dashboard KPI cards, progress, earnings, tasks and seven-day charts remain accessible; passive performance is collapsed by default.
- Plan still includes ranked outgoing leads, expandable rows/paging, incoming callback actions and recent call review.
- Calendar retains month navigation, Today, dots and day details.
- Pulse retains home/agents/channels/Kudos and the pinned two-action/reply-card pattern. Chat and replies are saved in a private reviewer workspace.
- Lead modal still opens from dashboard tasks, pages between leads, shows fit/intent scores and expandable buying signals. Score mechanics and long summaries are secondary details.
- Real telephone calling remains available. No mock source was copied.

This deliberately changes default dashboard prominence from the supplied screenshot while preserving its information and destinations. The rationale is the agent's next task; it should be made explicit in the submission.

## Validation and limits

The current suite has 32 passing tests, including no implied callback consent, invalid/missing model output, original customer evidence and uncertain-send protection. Local browser review checked the prepared actual-call result, exact transcript expansion, callback detail expansion, all required dashboard panels and charts, and 390px layouts without horizontal overflow. The existing saved-request path was exercised in the browser. The direct first-save path is implemented but was not separately exercised in a clean browser profile during this pass.

Callback requests remain separate from staff confirmations. The Follow-up agent can now schedule and cancel native provider calls, verified in the hosted app. Private hosted persistence, signed reviewer sessions and concurrent writes are implemented and checked. Independent agent usability tests and measured time savings remain open.
