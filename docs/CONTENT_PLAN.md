# Content Plan

> Status: **proposal** for Umut's approval. Counts are targets, not promises; a module is done when its research is done, not when it hits a number.

Audience (Umut, 2026-11-13): UE / device validation, RAN / gNB validation, operator-side work, and interview prep.

## 1. Rules

1. **Research first.** Every module starts as `docs/research/<module>.md`. App content is written only from that research.
2. **Every factual claim has a source**: spec number, section, and release (e.g. *TS 38.331 §5.3.10, Rel-17*). Secondary sources (books, ShareTechnote, vendor notes) may explain, but never stand alone for a number, timer, cause value or message name.
3. **Gaps are listed, not filled.** Anything not verified goes in `docs/CONTENT_GAPS.md` and is shown in the app with a "check this" note.
4. **Our own words.** No copied text from books, courses or vendor documents. Spec message and field names are quoted exactly.
5. **Simplified logs stay labelled** as teaching logs, not real tool output.
6. **Existing content is re-checked.** The current 59 lessons, 93 journey steps, 12 cases and 49 facts were written from general knowledge. Each one gets a source or a gap entry during its module's research.

### Source access (problem to solve)
3GPP and ETSI block automated downloads from this cloud environment (Cloudflare returns 403). Options:
- **A.** Umut downloads the spec list below (free from 3gpp.org) and puts them in a local folder that a session can read. They are not committed to the repo.
- **B.** Research uses web search for spec text and cites sections, marking a claim "verified" only when the section text itself was read.
- **C.** Both.

## 2. Modules

| # | Module | For | Key specs | Lessons (target) |
|---|---|---|---|---|
| 1 | RF and signal basics: dB, noise, SINR, OFDM, modulation, MIMO, link budget | all | 38.211, 38.101-1 | 14 |
| 2 | Architecture: EPC, 5GC, NG-RAN, CU/DU/RU splits, O-RAN fronthaul | RAN, all | 23.501, 38.401, 38.470, O-RAN WG4 | 12 |
| 3 | NR physical layer: numerology, BWP, SSB and beams, CORESET and search space, PDSCH/PUSCH, DMRS, CSI-RS, SRS, HARQ, CSI | UE, RAN | 38.211, 38.212, 38.213, 38.214 | 18 |
| 4 | Layer 2: MAC, RLC, PDCP, SDAP, scheduling, BSR, DRX | UE, RAN | 38.321, 38.322, 38.323, 37.324 | 12 |
| 5 | RRC and NAS: states, setup, registration, PDU sessions, security, RRC_INACTIVE | all | 38.331, 24.501, 33.501 | 16 |
| 6 | Mobility: measurement events, handover, conditional handover, reselection, inter-RAT | all | 38.331, 38.133, 38.304 | 12 |
| 7 | Dual connectivity and carrier aggregation: EN-DC, NR-DC, SCell, SCG failure | UE, RAN | 37.340, 38.331 | 10 |
| 8 | Voice: IMS, VoLTE, VoNR, EPS fallback | UE, operator | 23.502, 24.229 | 8 |
| 9 | Satellite (NTN) | UE, RAN | 38.300, 38.821 | 8 |
| 10 | UE conformance: RF (38.521), RRM (38.533), protocol (38.523), GCF / PTCRB, test systems | UE | 38.521-x, 38.533, 38.523-1 | 12 |
| 11 | RAN feature validation and IOT: test plans, entry and exit criteria, regression, interop with real UEs | RAN | vendor-neutral practice | 12 |
| 12 | Logs and debugging: UE logs, gNB traces, Wireshark, ASN.1 decoding, building timelines | all | 38.331 ASN.1, 38.413 | 12 |
| 13 | KPIs and optimisation: accessibility, retainability, mobility, integrity; drive tests; parameter tuning | operator, RAN | 28.552, 32.450 | 12 |
| 14 | Lab and RF setups: shield boxes, channel emulators, fading models, attenuation, calibration | UE, RAN | 38.141, 38.521 annexes | 8 |
| 15 | Test automation: Python, frameworks, CI for test benches, flaky-test hunting | all | practice | 8 |
| 16 | Interview prep: explain-out-loud scripts, question bank, debugging stories | all | built from modules 1–15 | 10 |
| | **Total** | | | **~190** |

## 3. Practice content

- **Journey:** from 10 to 16 chapters. New: 5G registration and PDU session in full, beam management, CA and EN-DC addition, a VoNR call, RRC_INACTIVE and resume, conditional handover.
- **Cases:** from 12 to about 40, spread across the four roles (UE conformance failures, gNB regressions, operator KPI drops, lab setup mistakes).
- **Review cards:** generated from lessons, journey steps and terms as today, about 600 in total.
- **Interview drills:** "explain X in one minute" prompts, graded by yourself against a model answer.

## 4. Order of work

Modules 5 → 3 → 6 → 12 → 10 → 11 → 13 first: they are the core of daily validation work and the most common interview topics. The rest follow. Each module ends with a PR showing the research doc, the app pages, and a short list of gaps.
