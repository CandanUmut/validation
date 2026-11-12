# RAN Validation Trainer

A small web app for daily practice in LTE and 5G RAN validation. It installs to the home screen and works offline after the first visit.


**Open it:** https://candanumut.github.io/validation/

## What is inside

| Tab | What you do | Why it helps |
|---|---|---|
| **Today** | See what is due, start a focus timer | One short plan per day |
| **Journey** | Follow one phone from power-on to data, handover and failure, in 10 chapters and 93 steps. Three passes per chapter: predict each step, fill the gaps, rebuild from memory | Builds one connected picture. Predicting before seeing, and rebuilding from memory, make it last |
| **Cases** | Work 12 failure cases: read a log extract, choose what to check next, name the root cause, write the bug title | Practice in log reading and debugging method |
| **Review** | Answer cards out loud and grade yourself. Missed cards come back tomorrow. Known cards come back after 2, 4, 8, 16 days and on | Spaced recall keeps what you learned |
| **Library** | 59 short lessons and 186 terms | Reference for when a step does not make sense yet |

## Things to know

- **Progress stays on your device.** It is kept in the browser's local storage. Use *Settings and backup* on the Today tab to export a file and import it elsewhere.
- **Log lines are simplified.** They were written for teaching. They are not output from any real tool.
- **Check details before you rely on them.** Timer values, cause numbers and spec references were written from general knowledge of the 3GPP standards. Verify against the specifications for anything that matters.
- **The satellite chapter is reasoning.** It works from physics and public information, not from any vendor's design.

## Run it locally

No build step. Serve the folder with any static server:

```
python3 -m http.server 8000
```

Then open http://localhost:8000/.

## Change the content

All content is plain data in `js/`:

- `data-journey.js`: chapters and steps. Each step's why-question also becomes a review card.
- `data-cases.js`: the case files.
- `data-cards.js`: extra fact cards.
- `data-library.js`: lessons and terms.

After adding or renaming files, bump `VERSION` in `sw.js` so installed copies refresh their offline cache.
