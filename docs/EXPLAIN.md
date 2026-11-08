# How to explain this assignment

## The product job

A retail customer tried a mattress and left undecided. The agent needs to know why, choose a useful next action and give store staff enough context to follow through. The demo validates a phone conversation and its handoff, not a conversion lift.

## The five implementation ideas

1. **An original interface from a supplied reference.** React state controls navigation, expanded rows, lead pagination, calendar dates and dialogs. Fixtures supply store data. The reference's source is not part of the app.
2. **A server-owned call boundary.** The browser asks to start the authorized test; it cannot select an arbitrary recipient or access the Bolna key. The Node service sends the telephone request and stores a call record first.
3. **Truthful asynchronous state.** A queued request is not an answered call. Provider states move through ringing, conversation, disconnected/processing and finalized completion. Transcript and summary appear only when returned by the provider.
4. **No blind retries.** A timeout can mean the call was placed but the response was lost. Persisting an uncertain state prevents a duplicate call, even after restarting. This matters more than an optimistic “Try again” button.
5. **A human-owned next step.** AI summarizes what the shopper asked for. The agent reviews it and creates a callback request. Requested time and confirmed availability are distinct. In this prototype that request is stored locally; it does not schedule a real callback.

## Why this fits Indian retail

Language preference is explicit. The demonstrated flow handles Hindi and English retail words. Budget and payment questions are captured without inventing EMI or discount terms. A return visit or staff callback can be useful before the customer is ready to buy. These are design choices backed by desk research and one roleplay, not customer discovery across India.

## Evidence to show

Open Recent → live test. Show the provider reference, 88-second duration, 9-cent reported cost and actual Hindi transcript. The customer requested a 9 November 10 AM Hindi callback and stated a ₹10,000 budget. Open Calendar → 9 November to show the reviewed local request. The provider wallet decrease independently matches the reported cost.

## Tradeoffs to acknowledge

A managed voice platform reduces telephony setup time, but voice quality and call status depend on it. Polling is sufficient for this prototype; authenticated webhooks would suit a hosted service. Local storage makes the required UI reviewable without pretending a CRM exists, but it is device-specific. A production version needs authenticated operators, shared persistent data, permissioned recordings, budget enforcement and supported human calling.

## Next validation

Test interrupting, declining a call, asking an unsupported policy question, switching languages and no-answer handling. Use consenting test participants. Measure whether the recorded next action matches what they said. Do not report model accuracy or business impact from one call.

## The design contribution

The app preserves the assignment’s required screens but shifts prominence to the work. AI extracts the requested next step from the actual call. The agent sees the suggested callback details before the transcript and can save a complete request directly. Editing and supporting evidence are secondary. No booking is claimed until a store confirms it. Required performance cards/charts are accessible on expansion. Explain the deliberate tradeoff against strict screenshot matching.

An observed model failure shaped the design: the extraction returned transliterated text while claiming exact quotes. Evidence now comes directly from the transcript rather than generated quotations. This is a concrete trust decision, not a generic “human in the loop” claim.
