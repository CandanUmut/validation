# Progress and decisions

## Phases

| Phase | What | Status |
|---|---|---|
| v1 | Static PWA: journey, cases, review, library | Live on `main` |
| v2 | "Instrument bench" redesign (draft PR #1) | **Superseded** by the plan below. Its review logic, BLER readout and search are reference for Phase 2. |
| 0 | Design brief, content plan, phone mockup | **Approved** 2026-11-13 |
| 1+2+3 | Astro rebuild with the approved design: every feature ported, content collections with schema checks, self-hosted fonts, offline, contrast check, phone e2e test, GitHub Actions deploy | **Done**, waiting for review (PR #1) |
| R1 | Research setup and first module (RRC and NAS) | **Done**: 10 lessons rewritten from TS 38.331, 36.331, 38.304, 24.501, 24.301, 23.122 (all Rel-17); 15 corrections; 1 case corrected; 6 gaps listed |
| R2 | PHY module | **Done**: 10 lessons rewritten from TS 38.211–38.215, 38.321, 38.306, 38.101-1, 36.211–36.214, 36.306 (Rel-17); 2 gaps added |
| R3 | MAC and RLC/PDCP modules | **Done**: 8 lessons rewritten (TS 38.321, 38.322, 38.323, 37.324, 38.300 …) |
| R4 | Remaining modules: arch, ntn, kpi, logs, test, lab | In progress |
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
- **2026-11-13** — Source access solved: the web-fetch tool downloads ETSI PDFs of the 3GPP specs (curl is blocked by Cloudflare). Full spec text is read locally with pdftotext; claims are marked checked only from that text. PDFs are not committed.
- **2026-11-13** — R1 found a wrong teardown in case RAN-001: an airplane-mode cycle does not clear the forbidden PLMNs list (it is on the SIM, TS 23.122 §3.1). Corrected. Case RAN-009 has a similar doubt, listed as gap G4 for the case review.
