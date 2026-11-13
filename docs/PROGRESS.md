# Progress and decisions

## Phases

| Phase | What | Status |
|---|---|---|
| v1 | Static PWA: journey, cases, review, library | Live on `main` |
| v2 | "Instrument bench" redesign (draft PR #1) | **Superseded** by the plan below. Its review logic, BLER readout and search are reference for Phase 2. |
| 0 | Design brief, content plan, phone mockup | **Approved** 2026-11-13 |
| 1+2+3 | Astro rebuild with the approved design: every feature ported, content collections with schema checks, self-hosted fonts, offline, contrast check, phone e2e test, GitHub Actions deploy | **Done**, waiting for review (PR #1) |
| R1 | Research setup and first module (RRC and NAS), by web search | Next |
| 4+ | Content, module by module, in the order in `CONTENT_PLAN.md` §4. One PR per module | Not started |

Each phase ends with phone-size screenshots, test results and a PR.

## Decisions log

- **2026-11-13** — Umut: main device is a **phone**. Touch first; keyboard support only as a quiet extra.
- **2026-11-13** — Umut: content covers **UE validation, RAN/gNB validation, operator side, interview prep**.
- **2026-11-13** — Umut: **research first**, with spec references; gaps listed, nothing invented.
- **2026-11-13** — Umut: signature direction **signal & spectrum**.
- **2026-11-13** — Umut asked for Astro. Agreed for content structure and build-time checks, matching `reflection`. Astro alone does not change the look; the design brief does.
- **2026-11-13** — Found: 3GPP and ETSI block automated downloads from the cloud environment (Cloudflare 403).
- **2026-11-13** — Umut: mockup **approved**. Research by **web search** (option B): a claim is marked checked only when the spec section text itself was read.
- **2026-11-13** — Umut asked Claude to find a better name. Chosen: **Uu** ("read the air"), the 3GPP name of the radio interface. Lives in `src/config.ts`; easy to change.
- **2026-11-13** — Astro pinned to 6.4.8 (same as `reflection`), not 7.x.
- **2026-11-13** — Content ported from v1 with a strict read-back check (`scripts/port-content.mjs`): every field equal to v1. Review card ids unchanged so progress carries over. Only addition: short module codes (ARC, PHY, …) for the spectrum strip.
- **2026-11-13** — Tap targets: the e2e test enforces >= 48px. Log lines, filter chips and toggles were raised to 48px to meet it.
