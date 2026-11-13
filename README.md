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

## Built for daily use

- **Today's test plan.** Three numbered test cases (review, one journey pass, one case), each stamped PASS when you execute it.
- **Link status.** Uptime (days in a row), retained cards, throughput, and **review BLER**: your first-try miss rate over 7 days. A radio link aims for about 10% block errors; spaced practice works best near the same number. Under 5% means you can take more new cards per day. Over 15% means slow down.
- **Drive log and forecast.** An 18-week activity heatmap and the number of cards due over the next 14 days.
- **Weak signals.** The cards you miss most, in one place.
- **Protocol layers in colour.** PHY, MAC, RLC, RRC, NAS and S1AP/X2AP are colour-coded in the ladder diagrams, the step cards and the log viewer.
- **Search everything.** Press `/` (or Ctrl/Cmd + K) to search terms, lessons, journey steps, cases and facts.
- **Keyboard.** `1`–`9` picks an option or grades a card, `Space` shows the answer, `Enter` continues, `T J C R L` switch tabs.
- **Case log viewer.** Line numbers, layer tags, and tap-to-mark lines as evidence. On purpose it does not colour clue words like "reject" or "expired": spotting them is the exercise.

## Things to know

- **Progress stays on your device.** It is kept in the browser's local storage. Use *Settings & backup* (the sliders icon) to export a file and import it elsewhere. Progress from the earlier version carries over; the activity history and BLER start counting from your first review in this version.
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
