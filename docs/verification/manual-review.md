# First local review · 8 November 2026

These notes cover the local prototype before hosting and the later agent integrations.

Arnav answered the recovery agent’s telephone call and roleplayed a shopper. Bolna reported an 88-second completed conversation costing 9 US cents; the wallet moved from 500 to 491 cents. His feedback was “natural enough; continue to screens.” The review showed the provider’s summary and original Hindi transcript.

The local screen checks covered:

- Dashboard shell, KPI cards, progress, waiting customers, earnings, tasks and charts.
- The dashboard lead modal, next/previous paging and disabled previous control on the first lead.
- Expandable outgoing rows, the remaining three leads on page two, and the disabled next control on the last page.
- Five Incoming rows, each with a callback action.
- A reviewed callback request for 9 November, 10:00 IST, Hindi, retaining the ₹10,000 budget context. Calendar showed it; switching to December and returning with Today worked.
- A Pulse message on the right with its time, plus a custom response to the pinned handoff.

At this stage, callback requests and channel responses used browser local storage. Reload preserved the callback request. The laptop layout was checked at 1440×1000. At 390×844, navigation and Recent remained usable, and the body, document and viewport each measured 390 pixels wide. The browser error log was empty during these flows.

The early visual comparison used the PDF screenshots. The browser blocked the reference HTML’s local-file click-through; its source was not copied. This was a manual review with Arnav, without a pixel-diff comparison or an independent customer study.

## Later checks

The hosted version replaced local storage with server persistence. See [hosted UI notes](hosted-ui.md) for those checks. Browser practice, human calling, follow-up calling and the submission package were completed later the same day:

- [Browser voice practice and saved coaching feedback](browser-voice.json)
- [Human browser-to-phone call and two-way audio confirmation](human-call.json)
- [Completed follow-up telephone call](followup-live.json)
- [109.8-second screen recording](recording.json)
- [Production release, repository and public-link checks](release.json)
