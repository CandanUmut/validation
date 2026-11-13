# Progress and decisions

## Phases

| Phase | What | Status |
|---|---|---|
| v1 | Static PWA: journey, cases, review, library | Live on `main` |
| v2 | "Instrument bench" redesign (draft PR #1) | **Superseded** by the plan below. Its review logic, BLER readout and search are reference for Phase 2. |
| 0 | Design brief, content plan, phone mockup | **Waiting for Umut's approval** |
| 1 | Research setup: source access, research doc template, first module research (RRC and NAS) | Not started |
| 2 | Astro rebuild: port every feature, content collections with schema checks, self-hosted fonts, offline, tests, GitHub Actions deploy | Not started |
| 3 | Design system from the approved brief: trace, constellation, spectrum strip, ladders, annotated logs | Not started |
| 4+ | Content, module by module, in the order in `CONTENT_PLAN.md` §4. One PR per module | Not started |

Each phase ends with phone-size screenshots, test results and a PR.

## Decisions log

- **2026-11-13** — Umut: main device is a **phone**. Touch first; keyboard support only as a quiet extra.
- **2026-11-13** — Umut: content covers **UE validation, RAN/gNB validation, operator side, interview prep**.
- **2026-11-13** — Umut: **research first**, with spec references; gaps listed, nothing invented.
- **2026-11-13** — Umut: signature direction **signal & spectrum**.
- **2026-11-13** — Umut asked for Astro. Agreed for content structure and build-time checks, matching `reflection`. Astro alone does not change the look; the design brief does.
- **2026-11-13** — Found: 3GPP and ETSI block automated downloads from the cloud environment (Cloudflare 403). Source access needs Umut's choice (`CONTENT_PLAN.md` §1).
