# Submission package

## Source and delivery instructions

Source: Rashmi Sehgal’s email, **“Your On-Ground.ai engineering assignment”**, and the attached five-page `OnGround_Engineering_Assignment.pdf` plus `OnGround_CallCentre_App_Mock.html`.

- Submit only to **sales@on-ground.ai**.
- Subject: **Assignment Submission: Arnav Madan**.
- Explicit deadline: **9 November 2026, 01:44:22 IST**. The source also describes a twelve-hour window; use the explicit timestamp.
- Required package: working hosted application, GitHub repository, README explaining setup and the calling path, and a screen recording **up to two minutes** that shows real telephone calling.
- React/Angular is preferred; sample data is permitted. Build original code, disclose AI assistance, and keep incremental Git history.

Nothing in this file indicates that an email has been sent.

## Links to finalize after release checks

| Item      | Final link                                            | Acceptance evidence required                                                                   |
| --------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Live app  | https://onground-arnav.vercel.app                     | Public page loads, routes work, API healthy, isolated reviewer workspace                       |
| Source    | https://github.com/madanarnav2004/onground-assignment | Opens without owner login, no credentials or private call data committed                       |
| Recording | https://onground-arnav.vercel.app/submission.mp4      | Opens without owner login, at most 120 seconds, actual UI and actual calling evidence          |
| Readme    | Repository README                                     | Fresh install/run instructions, feature status, calling architecture, limits and AI disclosure |

## Recording status

The finished Safari screen recording is 109.80 seconds (under two minutes), with the actual interface and the clearly dated original real-call playback. The recording file is at `public/submission.mp4`; final export checks are in [recording.json](verification/recording.json).

## Final acceptance gates

- [x] Deployed production URL independently loads.
- [x] Dashboard, ranked/expandable/paged queue, Incoming, Recent/review, Calendar, Pulse/channel and Leads modal checked in the hosted build.
- [x] Channel send, pinned response, practice and callback journeys checked.
- [x] Phone-width navigation and charts checked; sample data remains labelled.
- [x] Recovery, Pitch Coach, ASM, human tele-caller, executed follow-up and AvaniBot have verified results recorded. Calling trial limits remain explicit.
- [x] Real telephone call evidence is accessible in the app, with the full number and credentials omitted.
- [x] Hosted persistence and separate reviewer sessions checked.
- [x] Provider errors and exhausted allowances never appear as completed calls.
- [x] Tests and production build pass (37 tests); final published revision tracked in verification/release.json.
- [x] Public app and repository open for a reviewer without owner permissions. Recording link remains pending.
- [x] Recording runtime verified at or below two minutes.
- [ ] README and submission email use final links and accurate completion claims.

## Email copy

Use after final release checks. This copy has not been sent.

**To:** sales@on-ground.ai  
**Subject:** Assignment Submission: Arnav Madan

Hi Rashmi,

Sharing my On-Ground engineering assignment:

- Live app: https://onground-arnav.vercel.app
- GitHub: https://github.com/madanarnav2004/onground-assignment
- Demo recording, 1 minute 50 seconds: https://onground-arnav.vercel.app/submission.mp4

I recreated the required Call Centre journeys and shaped the interface around the associate’s next useful action. The demo focuses on Indian retail walk-out recovery: understanding an objection, preserving language and callback context, and keeping store confirmation explicit.

The README explains the implementation, real telephone calling, verified features, sample-data boundaries and AI assistance. It also documents the calling trial’s recipient and test-allowance limits.

Thanks for the assignment. Happy to walk through the product decisions and implementation.

Best,  
Arnav Madan
