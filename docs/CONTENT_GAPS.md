# Content gaps

Things the app does not yet state as checked, with why. Each gap is shown in the app as "check this" or left out until a module's research closes it. Never fill a gap from memory.

| # | Where | Gap | Needs | Found in |
|---|---|---|---|---|
| G1 | Lesson e4 (v1 text) | "A satellite network that works as a roaming partner … the phone must decide to use the satellite PLMN only when it has no terrestrial coverage." No such rule in the specs read; PLMN choice is PLMN selection (TS 23.122) plus operator preferred-PLMN lists. **Removed from the lesson.** | TS 23.122 §4.4 (PLMN selection), operator practice | R1 |
| G2 | Lesson e8 | **Closed for NR in R4** (TS 38.423, 38.413). Still open for LTE X2/S1. Network-side handover messages (Handover Request/Acknowledge, SN Status Transfer, Path Switch, UE Context Release) are named from general knowledge. | TS 38.423 (XnAP), TS 38.413 (NGAP), TS 36.423, TS 36.413 | R1 |
| G3 | Lesson e4 | AKA internals (how the USIM checks AUTN, SQN, MAC) not read. | TS 33.501 §6.1, TS 33.102 | R1 |
| G4 | **Closed in R5**: case now says power-cycle, and that airplane mode is phone-specific. Case RAN-009 "Fails for exactly twelve minutes" | Its best move is "reset the phone's NAS state (airplane mode cycle)". TS 24.301 §5.5.1.1 resets the attach attempt counter "when the UE is powered on" or "a USIM is inserted"; whether an airplane-mode toggle counts is up to each phone. | Case review (module 12 research) | R1 |
| G5 | Journey ch. 01 (LTE) | LTE S criterion stated without Squal and Qoffsettemp. NR's rule is checked (TS 38.304 §5.2.3.2); LTE's is in TS 36.304, not read. | TS 36.304 §5.2.3.2 | R1 |
| G6 | Lesson e10 | Order of PLMN selection (HPLMN/EHPLMN, user and operator controlled lists) kept general. | TS 23.122 §4.4.3 | R1 |
| G8 | Lesson b1 | LTE RB counts are checked (MIB `dl-Bandwidth`); the pairing with 1.4/3/5/10/15/20 MHz is in TS 36.101 Table 5.6-1, too large for the fetch tool. | TS 36.101 (or TS 36.104) | R2 |
| G9 | Lesson b1 | FR2 ranges now checked (FR2-1 24.25–52.6 GHz, FR2-2 52.6–71 GHz, TS 38.101-1 Table 5.1-1). FR2 spacing and maximum bandwidth still left out until TS 38.101-2 is read. | TS 38.101-2 §5 | R2 |
| G10 | Lesson a4 | SpaceX's public description of its direct-to-cell satellites (on-board LTE base station, laser links) could not be re-checked: starlink.com/direct-to-cell returned 404 on 2026-11-13. **Removed from the lesson.** | A current public SpaceX source | R4 |
| G11 | Lessons a1, a3 | HSS role (TS 23.401) and LTE QCI values (TS 23.203) not read; 5QI values checked. | TS 23.401, TS 23.203 | R4 |
| G12 | Lesson i1 | Conformance spec numbers TS 38.523, TS 36.521, TS 36.523 named but not opened (TS 38.521-1 confirmed). | ETSI TS 138 523-1, 136 521-1, 136 523-1 | R4 |
| G7 | All other modules | v1 lessons, journey steps, cases and facts outside RRC and NAS are unchecked and labelled so in the app. | Module research in the order of `CONTENT_PLAN.md` §4 | — |
