# Hosted UI acceptance — 8 November 2026

Production: https://onground-arnav.vercel.app

Checked through the actual rendered app in the in-app browser, not an HTML screenshot reconstruction:

- 1440px laptop shell and 525px narrow shell render with the correct navigation.
- Pulse exposes recovery, Pitch Coach, ASM, Follow-up, Tele-caller and AvaniBot.
- Historical acceptance call is explicitly marked **RECORDED TEST · 8 NOV**, completed/88s, with native original-call audio controls.
- Original handoff retains the requested 9 November 10:00 IST, Hindi, ₹10,000 customer budget; the store confirmation remains pending.
- The callback request saved to private server storage survives page refresh and appears on Calendar → 9 November with its language and unresolved price question.
- Server-scoped hosted channel/callback persistence and separate reviewer sessions were checked through the API; see hosted-agents.json.

Live human microphone/call audio and native screen recording remain separate final acceptance steps while the user’s Mac is locked. Neither is claimed by these checks.
