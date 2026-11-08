# Design notes

I wanted the agent to open the app and know what to do next. The mock had the right screens, but the dashboard gave a lot of space to scores, earnings and charts before the calling work. I kept those sections and moved them behind **Performance & earnings**. The first card now points to a waiting customer or a callback that needs attention.

The biggest change is after the call. In the first phone test, I said my budget was ₹10,000 and asked for a Hindi callback the next morning at 10. Those details were already in the conversation. Asking the agent to type them into another form felt like work the AI should remove.

The review screen now prepares that request. The agent can check the date, time, language and unresolved question, then save it. Missing details open the relevant inputs. The transcript and longer summary are there when the agent needs to check something. Store availability still needs confirmation, so the saved item stays a request.

That led to a few smaller decisions:

- Queue rows show the reason for calling and the preferred language. The agent should have some context before opening a lead.
- Lead fit and intent stay with the lead details, along with the buying signals. They are sample scores in this demo.
- Saving the same customer’s callback updates the existing request. It also removes that customer from the waiting shortlist.
- A busy call stays visibly busy. A retry needs a separate decision; the app keeps the earlier attempt in its history.

One detail changed because of an actual model error. The extraction returned transliterated Hindi while labelling it as an exact customer quote. The fix was to use the original transcript lines as supporting evidence. Coaching scores also need an excerpt that matches something the associate actually said.

I kept the sidebar, Plan views, Calendar, Pulse and paged Leads modal from the brief. The main departure is the order of attention within those screens. It follows the way I wanted to use the product: context, conversation, next step, then performance detail.

I have checked the flows through roleplay calls and the prototype. I have not measured time saved with a retail team. The next useful test would be to give an associate a completed call and watch whether they can finish the handoff without copying information between screens. The current checks are in [verification](verification).
