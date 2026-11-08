# Assignment deliverable audit · 8 November 2026

Source: Rashmi Sehgal’s Gmail message “Your On-Ground.ai engineering assignment” (message 1a1ba42e995dffed), re-read during this audit, and its five-page assignment PDF. Compared with current source, README, local verification notes and saved live-call evidence. No new end-to-end/browser run was performed for this status audit.

**Overall: not submission-complete and not all bonuses complete.** “All required screens built” previously described local screen coverage, not every agent, bonus, mock interaction or final deliverable.

## Required build and screen details

| Requirement | Current status | Limit / gap |
| --- | --- | --- |
| Sidebar and topbar | Implemented locally | Layout changed deliberately; strict mock fidelity not signed off |
| Dashboard KPI/progress/waiting/earnings/tasks/seven-day charts | Implemented locally | Performance/charts behind expansions; sample data |
| Calls to make: score ranking, expandable rows and paging | Implemented and locally checked | Illustrative scores; not a scoring model |
| Incoming: missed calls/value/callback action on every row | Implemented locally | Callback actions open local request flow, not a full human calling screen |
| Recent: call type/time/length, open review | Implemented locally | Actual transcript for live test; sample history has generic review, not full SOP-scored reviews |
| Calendar: month/dots/Today/month navigation | Implemented and locally checked | Requests local; no mailbox integration required or implemented |
| Pulse home: AvaniBot, role/task agents, channels/Kudos | Partial content coverage | Three agent entries and generic sample threads; full mock catalogue/roles not recreated |
| Pulse channel: header/back, pinned two buttons/reply, bubbles/times | Implemented and locally checked | Local storage; no external staff messaging |
| Leads modal: dashboard task entry, ICP/intent, buying signal collapse, next/previous | Implemented and locally checked | Sample scores and lead data |
| Working real telephone calling | Verified | One authorized Hindi AI-to-human call, 88 sec, 9 US cents; not independent customer acceptance |
| Human-to-human plus AI-to-human “where possible” | AI-to-human done; human-to-human absent | Encouraged by PDF; human calling is not separately on mandatory screen checklist |

## Agent scope

The cover presents Walk-out Recovery, Pitch Coach, ASM Agent, Tele-caller and Follow-up. The explicit mission/checklist asks to rebuild the Call Centre app; it does not separately specify five fully functional agent backends.

- Walk-out Recovery: functioning Bolna telephone agent and structured next-step extraction.
- Pitch Coach: sample Pulse entry/thread only; no working coaching/practice agent.
- ASM Agent: not implemented; catalogue entry missing.
- Tele-caller: no separate human tele-caller workflow or agent implementation. The recovery agent can place an AI call.
- Follow-up: sample Pulse entry plus local callback request handling; no autonomous follow-up calls/reminders or dedicated agent.
- AvaniBot: sample UI/threads; not a general live assistant.
- Meta-agent that creates role agents: not implemented. Treat cover statement as product vision, not an achieved capability.

## Listed bonuses

| Bonus | Status |
| --- | --- |
| Send a message in a channel | Done locally; not external messaging |
| Answer Needs your input | Done locally |
| Practise a call and Call back screens | Incomplete: practice absent; callback request UI present but not full reference callback/calling experience |
| Phone-width screen | Local navigation/layout checked at 390×844; not every mobile flow verified |
| Charts with a library | Not done: charts implemented with custom CSS |

DEMO strip and floating dial button are explicitly optional; not implemented in the recreated workspace.

## Ground rules / evidence

- React + TypeScript: meets preferred stack.
- Sample module: implemented; allowed by brief.
- Original implementation: mock source not copied into repository.
- AI tools disclosed: README documents Codex.
- Incremental Git commits: present locally; no remote configured.
- Restrained design: applied, but mock fidelity needs a final review after the agent-first changes.
- Open HTML and click every screen in latest Chrome/laptop: not completed as instructed. Local-file browser opening was blocked; reference screenshots/static content were inspected, and recreated app checked in the in-app browser. Do not claim a full original-mock walkthrough or latest Chrome acceptance.

## Required submission package

| Item | Status |
| --- | --- |
| Working app live link | Missing; localhost only |
| GitHub repository link | Missing; local Git only, no remote |
| README: setup, stack/why, done/skipped, AI tools and calling explanation | Draft present locally; needs final deployed setup and validation |
| Screen recording up to two minutes showing real telephone call | Missing; test call evidence exists, submission recording not created |
| Email to sales@on-ground.ai only | Not sent |
| Subject Assignment Submission: Arnav Madan | Specified, not submitted |
| Deadline 9 November 2026, 01:44:22 IST | Explicit in email/PDF |

## Next work order

1. Close catalogue and reference-review gaps; implement the practice and proper callback experiences if aiming for all bonuses. Preserve the user-directed reduction in unnecessary UI and explain deliberate visual changes.
2. Validate call controls/failure paths, first-visit prepared-request flow, and laptop Chrome acceptance.
3. Host with controlled calling, publish a reviewable repository and finish README.
4. Record up-to-two-minute demo, review submission package with Arnav, and send only on explicit instruction.
