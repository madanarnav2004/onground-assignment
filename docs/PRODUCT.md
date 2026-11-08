# Product direction · 8 November 2026

Arnav chose walk-out recovery after asking for Indian retail research before building. Test budget: ₹200. Only the authorized test recipient is stored in private settings.

## Evidence and implications

1. The Sleep Company operates experience stores with staff assisting product selection, ordering, delivery and payment. Its store page lists UPI, cards and EMI. Design implication: capture a visit/callback request and the customer's blocker; do not optimize the demo for an immediate online checkout. Source: https://thesleepcompany.in/pages/our-store
2. IAMAI/Kantar Internet in India 2024 reports 57% of urban internet users prefer Indic-language content. This is internet-content research, not evidence of phone-language preference. Hypothesis: ask for preference and test Hindi/Hinglish and English rather than assuming English or Hindi. Source: https://www.iamai.in/research/internet-india-2024-kantariamai-report
3. Meta/RAI describes journeys spanning online research and store purchases. This is platform-associated research and not proof of our product's conversion impact. Design implication: retain walk-in, call and follow-up context in one lead. Source: https://about.fb.com/news/2026/02/ai-fuels-indias-omnichannel-shopping-surge-meta-retailers-association-of-india/
4. The Sleep Company's trial page restricts eligibility by channel and product; EMI terms can include bank charges. Its location-specific EMI page contains inconsistent geography. Do not encode an unconditional trial, discount, delivery or EMI promise. Capture the question and hand it to store staff. Sources: https://thesleepcompany.in/pages/100-nights-trial and https://thesleepcompany.in/pages/no-cost-emi-mumbai

This is desk research, not customer discovery. Budget, family discussion, mattress fit and timing are scenario hypotheses; no prevalence or revenue uplift is claimed.

## First journey

Sample shopper Mukunda tried a mattress and left undecided. AI identifies itself as an assignment demo, asks whether now is convenient, asks language preference, understands one blocker, and captures a callback or visit request. It confirms the request as a request; a human confirms store availability and commercial details.

## Product principles proposed to Arnav

- Preserve the supplied screen hierarchy and restrained design.
- Lead with a user's next action and the reason for it.
- Maintain conversation continuity across the queue, lead detail, call and recent history.
- Explain priority from observable facts; sample scores must not pretend to be a predictive model.
- Distinguish requested, confirmed and completed actions.
- Show only provider-backed call states and transcript data.
- AI reduces repetition and prepares handoffs; staff own commercial commitments.

## Review checkpoints

1. Account and caller number ready; review exact agent script before the first call.
2. Listen to first call together; assess interruption, language switching, objections and next-step accuracy.
3. Review dashboard → lead → call → outcome flow against mock before expanding.
4. Required-screen pass, then two-minute evidence-led demo and README review.

## Required screens · implemented locally

Sidebar/topbar, dashboard, Plan outgoing/incoming/recent, calendar, Pulse home/channel, leads modal with paging. The standalone calling proof remains at /proof. See verification/manual-review.md for observed checks and limits.

## Success and failure tests

Success: recipient answers, AI identifies the demo, handles one natural objection, accurately captures a next step, provider completes the execution, app displays its actual result. No purchase or conversion claim.

Failure tests: not a good time → callback request; no interest → stop; unsupported policy question → human handoff; no answer → honest status; uncertain provider response → no automatic redial.
