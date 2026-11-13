# Uu — read the air

A phone-first app for becoming an excellent cellular validation engineer: UE / device validation, RAN / gNB validation, operator work and interview prep. It installs to the home screen and works offline.

**Open it:** https://candanumut.github.io/validation/

*Uu* is the 3GPP name for the radio interface between the phone and the network: the place this job tests.

## What is inside

| Tab | What you do |
|---|---|
| **Today** | Three things to do, with honest time estimates. The *trace* shows this week's practice; the *constellation* shows your weakest area (one dot per review card, scattered when shaky); the *spectrum strip* shows coverage across modules. |
| **Journey** | Follow one phone from power-on to data, handover and failure. Each chapter has three passes: predict each step, fill the gaps, rebuild from memory. |
| **Cases** | Debug failures: read the log (tap lines to highlight evidence), choose what to check next, name the root cause, write the bug title. |
| **Review** | Spaced review. Missed cards come back tomorrow; known ones after 2, 4, 8, 16 days and on. Shows your 7-day miss rate (aim for 5–15%). |
| **Library** | Lessons as real pages, each ending with its spec trail, plus the glossary. Search everything from the top bar. |

## Things to know

- **Progress stays on your device**, in the browser. Export a backup in *Settings*. Progress from the earlier versions carries over.
- **Logs are simplified teaching logs**, not output from any real tool.
- **Research first.** New content is written from `docs/research/` with spec references. Lessons from the first version show "not yet checked against the specs" until their module is researched. Verify numbers and names before you rely on them.

## Develop

```
npm install
npm run dev        # http://localhost:4321/validation/
npm run build      # validates all content, builds to dist/
npm run check      # type check + colour contrast (WCAG AA)
npm run e2e        # phone-size browser tests and screenshots (after build)
```

Content lives in `src/content/` (YAML and Markdown); a wrong field fails the build. Plans and decisions: `docs/PROGRESS.md`, `docs/design/DESIGN.md`, `docs/CONTENT_PLAN.md`.

Deploys to GitHub Pages from `main` through GitHub Actions (one-time setup: Settings → Pages → Source: GitHub Actions).
