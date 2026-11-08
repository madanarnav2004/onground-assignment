# Hosted UI review · 8 November 2026

Checked the rendered app at [onground-arnav.vercel.app](https://onground-arnav.vercel.app) in the in-app browser.

The laptop shell worked at 1440 pixels wide, and the narrower 525-pixel view kept its navigation. At 390 pixels, the practice dialog measured 366 pixels inside the page, with no horizontal overflow.

Pulse showed Walk-out Recovery, Pitch Coach, ASM, Follow-up, Tele-caller and AvaniBot. A pinned handoff response and a typed channel message saved successfully and appeared in the conversation. Separate reviewer sessions and server persistence were also checked through the API; see [hosted agent checks](hosted-agents.json).

Recent showed the original recovery call as **RECORDED TEST · 8 NOV**, completed in 88 seconds, with controls to play the original audio. Its handoff retained 9 November at 10:00 IST, Hindi and the customer’s ₹10,000 budget. Saving the request survived a refresh and placed it on Calendar → 9 November, with the price question and store confirmation still pending.

Incoming → Call back opened the separate human calling screen. The Faizan row carried through Faizan A., Recliner and English preference. Opening that screen did not start a call or microphone session.

Expanding Performance & earnings → Seven-day trends showed both Recharts bar charts and their tooltips at 1440 pixels.

## Live checks completed later that day

- [Browser practice](browser-voice.json): a 31.9-second conversation, five stored turns and saved feedback based on the actual associate statements.
- [Human calling](human-call.json): browser-to-phone calling completed, with 27 seconds of phone talk time. Arnav confirmed that audio worked in both directions. The outcome and notes were saved. Phone-to-browser calling was not part of this test.
- [Follow-up](followup-live.json): the separately authorised retry completed a 90-second telephone conversation and saved its transcript, summary and handoff. The earlier busy result remains in the history.
- [Recording](recording.json): the actual hosted Safari walkthrough was exported at 109.8 seconds, including labelled playback of the original telephone test.
- [Release](release.json): production was READY; the app, API and video returned HTTP 200, the downloaded video hash matched, and the GitHub repository was public. The release record also contains the 37-test result and successful build. No submission email was sent.
