# How to explain this assignment

## Lead with the job

“A shopper tried a mattress and left undecided. The associate needs to understand the hesitation, agree a useful next step and give the store enough context to follow through. I built the required Call Centre screens around that job and connected a real phone conversation.”

Avoid claiming conversion lift. One authorized roleplay establishes that the calling and handoff can work; it does not establish business impact.

## Explain the product and design contribution

The mock provides the required destinations and information. The design refinement changes their prominence: the next useful action appears first, while metrics, edits and evidence expand when needed. The agent should not have to re-enter a day, time, language and budget that the customer already stated.

The call review therefore offers a prepared next-step request, with the original transcript available as evidence. A request is distinct from a confirmed store booking. This matters in Indian retail, where price/payment questions, language preference and a family return visit can be more useful context than a generic “warm lead” label.

One observed model failure changed the design: an extraction claimed to quote the customer but returned transliterated text. Supporting evidence now comes from actual customer transcript lines, rather than treating a generated quotation as proof. That is a concrete reason for the expandable evidence, not just a decorative trust label.

## Explain the six role experiences

- **Recovery:** the AI speaks to a consenting participant’s phone, asks about the obstacle and captures a requested next step.
- **Pitch Coach:** the shopper role pushes back on price. The associate practises by text or browser voice, then receives feedback on their actual turns, with evidence and one better next line.
- **ASM:** the assistant reads the current workspace, prioritises commitments and proposes tasks. Approval creates internal work; no store employee is silently notified.
- **Human Tele-caller:** a person speaks from the browser to the test phone, with context, mute/end controls and an explicitly human-reported outcome.
- **Follow-up:** saving a request does not dial. A separate approval sends one immediate or scheduled provider call, with the unresolved context carried forward.
- **AvaniBot:** a scoped assistant for workspace questions and suggested next steps. It does not invent a catalogue, store availability or a WhatsApp delivery.

The labels represent different jobs, rather than six copies of the same chat interface.

## Explain the implementation

**Original UI.** React and TypeScript handle navigation, expansion, lead paging, dialogs and calendar state. Recharts renders the required trends. Store metrics and profiles are marked fixtures, as the brief permits. The supplied HTML’s implementation was not copied.

**Server-owned effects.** Provider master credentials stay on the server. A paid operation is reserved and a call record is written before the external request. Repeated or competing copies of a request cannot create two calls. A response timeout is uncertain acceptance, so it blocks blind redial.

**Truthful states.** “Queued” is not “answered.” A disconnected line can still be processing. Final transcript, duration and cost wait for provider finalisation. Human browser events do not manufacture provider completion; notes and dispositions remain operator-reported.

**Durable workspaces.** Signed HttpOnly cookies separate anonymous reviewer sessions. Private Vercel Blob and conditional writes preserve workspace changes across serverless instances; local JSON writes are serialized and atomic. This is an assignment workspace, not production employee authentication or a CRM.

**Scheduled work.** Bolna receives an explicit scheduled time after approval. The provider executes it after the page closes. There is no local timer masquerading as autonomous follow-up, and no automatic redial policy.

**Pragmatic reasoning integration.** ASM, AvaniBot and text coaching use GPT-4.1-mini through Bolna’s configured disposition-analysis test interface. The input is a workspace snapshot or practice conversation; answer/proposal/rubric fields are validated. Reusing the configured provider kept the assignment within the available account setup. It is a constrained analytical integration, not a new general-purpose model service. A production iteration should give this a dedicated typed reasoning API and evaluations.

## Show evidence in the right order

1. Demonstrate the required navigation and a lead’s context.
2. Show the verified real call’s saved result: **completed, 88 seconds, 9 US cents**, Hindi conversation, ₹10,000 stated budget and a requested 9 November 10 AM Hindi callback. Store confirmation stayed pending.
3. Show the proposed request, then the saved agenda item. Do not imply that this alone proves a scheduled phone callback happened.
4. Run a live workspace question or coaching exchange, inspect the proposed output, approve an appropriate task and show persistence.
5. Show human/voice/scheduled-call acceptance only when those specific live checks have actually completed. JWT mint and SIP registration prove readiness to register; they do not prove two-way audio.

## Be precise about ownership and limits

Arnav chose the scenario, reviewed the opening, participated in the phone call, judged voice naturalness and directed the reduction of unnecessary UI. Codex assisted research, original implementation, design iteration and tests. Explain that division plainly.

Desk research and one roleplay informed the Indian retail choices. They do not replace interviews with multiple stores. The demo has no live inventory, WhatsApp, staff calendar or independently measured conversion uplift. Trial telephone recipients may need provider verification. Shared count-based allowances bound demo use, but do not guarantee a rupee-denominated cap.

The release checklist must keep the final evidence honest: 32 passing tests, a compiled build, registration, browser interaction, real audio and a scheduled callback each validate different parts of the system.
