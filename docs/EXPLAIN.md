# Why I built it this way

The starting point was a mattress shopper who liked the product but walked out over price. I chose this because it gives the associate something specific to do: find out what is holding the customer back and arrange a useful follow-up.

I wanted this to feel like a tool for an Indian store associate. Language, price and a decision involving family all belong in the conversation. They shouldn't get flattened into a “warm lead” badge. The research behind this is in [PRODUCT.md](PRODUCT.md); it was desk research, followed by demo calls with me playing the shopper.

## The bit I cared about most

Once the calling worked, I asked for another pass on the interface. My direction was simple: if AI has already heard the customer, why should the associate fill out the same details again?

That changed the order of the screen. The dashboard starts with the next customer or request that needs attention. The KPIs and charts from the brief are still available, but they open when you need them. After a call, the app prepares the callback details. The associate can save them, edit them, or open the conversation to check what was said.

There is a small but useful distinction in the test result. The customer said ₹10,000 was their budget and asked for a Hindi callback at 10 am the next day. Neither statement means the mattress costs ₹10,000 or that the store has confirmed the slot. The app keeps those as customer requests.

The reference gave me the screen structure and visual direction. I kept its destinations, green/purple palette and required information. Moving the performance panels into expansions was a deliberate change to make room for the work.

## What the calls taught us

The first recovery call lasted 88 seconds. I played the shopper, used Hindi and raised the price objection. The voice felt natural enough to continue with the screens. We later checked human calling in both directions, browser voice practice, and an AI follow-up. The [README](../README.md) links to those results.

One extraction result was more revealing than the successful call: the model presented transliterated Hindi as an exact quote. The call review now takes supporting lines from the original customer transcript. Coaching feedback also checks its quoted evidence against what the associate actually said. If there isn't enough evidence to score something, that part stays unscored.

These were demo roleplays with me, so I don't have evidence yet that the product improves store conversion or saves associates time. Those are the next things I would test with a store team.

## How the pieces fit

React handles the screens. The Node server owns calls and saved work, so credentials stay off the page. Bolna handles the AI phone calls and voice practice; Vobiz connects the browser microphone to a phone for the human workflow. Text coaching, ASM and AvaniBot use a small Workers AI service.

The roles have different jobs. Pitch Coach plays the shopper and reviews the associate's response. ASM suggests work that someone must approve. AvaniBot answers questions about the current workspace. Follow-up carries the saved customer context into a new call. Saving a callback request alone does not dial the customer.

There are a couple of engineering decisions I'd walk through in a review. A call is reserved before the provider is contacted, which prevents two clicks from placing two calls. If the provider times out, the app treats the result as uncertain instead of inviting another dial. Scheduled calls are handed to Bolna, so execution doesn't depend on someone leaving a browser tab open. Private Blob storage keeps each reviewer's messages, requests and results between visits.

## What I'd do next

I'd put this in front of a few store associates and watch the handoff. Can they act on the prepared request without rereading the call? What do they still have to ask the customer again? That would tell me more than adding another agent to Pulse.

The next integration would be the store's real availability and product information. Right now those are deliberately absent: a staff member still needs to confirm a visit, a price or a payment option.

I used Codex for the implementation, research and checks. My contribution was choosing the use case, testing the conversations, and directing the product and visual iterations. The source and [setup guide](SETUP.md) explain the implementation in more detail.
