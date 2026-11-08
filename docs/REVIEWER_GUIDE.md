# Reviewer guide

This is an independently built React and TypeScript implementation of the On-Ground Call Centre brief, designed around an Indian retail associate’s next useful action. Seeded store metrics, leads and history are illustrative. A provider call result is labelled separately from sample data.

## A useful first pass

1. **Dashboard → Hot leads → Mukunda.** Open the lead, inspect the buying signals, and move to the next lead. Required metrics and seven-day trends are available under expansions so the working view stays focused.
2. **Calls to make → Incoming → Recent.** Expand a queue row, change pages, and open a recent call. Incoming rows expose a callback action. Actual calls show their provider status and finalized result; sample history stays labelled.
3. **Calendar.** Switch months, return to Today, and select a dotted day. A saved callback request appears in the agenda. A request is distinct from an executed call or a confirmed store booking.
4. **Pulse.** Open a channel, answer its pinned request using either button or a typed reply, then send a message. These changes are scoped to this browser’s demo workspace; no external store team is messaged.
5. **Pulse → role agents.** Explore the recovery, coaching, manager, human calling and follow-up journeys. AvaniBot handles workspace questions. See the current deployment’s README for the verified status of each integration.

## Trying a telephone call

Use your own Indian mobile number with country code `+91`, and confirm that you consent to receiving the demonstration call. The agent identifies itself as an AI demo. Play a shopper who liked a mattress but wants to discuss price before returning. You can hang up at any time.

The account is a trial. Its provider may require your recipient number to be verified before accepting a phone call, and the assignment has a shared test allowance. A provider rejection, exhausted allowance or uncertain request is shown explicitly. The application does not replace those outcomes with a simulated success. Browser voice practice, where enabled, uses the browser microphone rather than a telephone recipient.

The original verified telephone test completed on 8 November 2026: **88 seconds, 9 US cents**, with an authorized participant speaking Hindi. Sanitized evidence: [live-call.json](verification/live-call.json). This is evidence of an actual call, not a claim of measured sales impact or independent customer testing.

## Product choices to notice

- The next action appears before passive performance metrics; required information remains available on expansion.
- A requested callback preserves language, time and the unresolved question. It never becomes a confirmed booking by implication.
- Assistant proposals require review before changing work. Call state and saved evidence are visible when useful.
- No invented discount, EMI eligibility, medical benefit, stock availability or delivery promise is used to close an objection.

## Data and limits

The workspace uses sample retail leads. It does not connect to an actual store catalogue, commerce inventory, WhatsApp account or staff calendar. Channel messages are internal demo records. Calling and intelligence integrations require the private server settings described in the README. The demo is scoped to an assignment, with bounded calling and deliberate failure states.
