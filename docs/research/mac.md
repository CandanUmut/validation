# Research — Module: MAC layer

Status: **done (R3)**, 2026-11-13. Method as in `rrc-nas.md`. Sources (Rel-17): TS 38.321 V17.15.0, TS 38.300 V17.17.0, TS 38.211 V17.11.0, TS 38.213 V17.14.0, TS 38.214 V17.16.0, TS 38.331 V17.7.0, TS 36.213 V17.8.0.

| Lesson | v1 claim | Verdict | Source |
|---|---|---|---|
| c1 | RACH triggers: first access, re-establishment, handover, UL data out of sync, SR failure, BFR | Confirmed + completed: also DL data arrival out of sync, no PUCCH for SR, RRC resume, other-SI request, sTAG alignment, consistent UL LBT failure, SDT, positioning | 38.300 §9.2.6 trigger list |
| c1 | 64 preambles per cell, Zadoff-Chu | **Corrected**: "There are 64 preambles defined in each time-frequency PRACH occasion" | 38.211 §6.3.3.1 |
| c1 | RAR to RA-RNTI within ra-ResponseWindow, with TA, UL grant, temporary C-RNTI | Confirmed | 38.321 §6.2.3 (Timing Advance Command, UL Grant, Temporary C-RNTI fields) |
| c1 | `mac-ContentionResolutionTimer` | **Corrected** for NR: `ra-ContentionResolutionTimer` (the v1 name is LTE's) | 38.321 §5.1.1 |
| c1 | powerRampingStep, preambleTransMax | Confirmed + values: `powerRampingStep {dB0, dB2, dB4, dB6}`, `preambleTransMax {n3 … n200}` | 38.331 RACH-ConfigGeneric |
| c1 | 2-step RACH MsgA/MsgB | Confirmed | 38.300 §3.2: "MSGA: preamble and payload transmissions of the random access procedure for 2-step RA type" |
| c1 | Preamble format / zeroCorrelationZoneConfig limit cell radius | **Practice/physics** (labelled) | — |
| c2 | LTE FDD n+4 | Confirmed | 36.213 §8.0 (PUSCH: "for FDD, k = 4") and §7.3.1 (FDD HARQ-ACK for PDSCH in subframe n−4) |
| c2 | NR K0, K1, K2 | Confirmed: `k0` 0–32 slots (PDSCH-TimeDomainResourceAllocation), K1 from `dl-DataToUL-ACK` 0–15, K2 in PUSCH-TimeDomainResourceAllocation | 38.331; 38.214 §5.1.2.1 |
| c2 | SR → grant → BSR; configured grants | Confirmed (SR when no UL resources; configured grant MAC CE exists) | 38.321 §5.4.4, §5.4.5, §6.1.3.7 |
| c2 | Scheduler policies (RR, max C/I, PF) | **Practice** (implementation) | — |
| c3 | LTE FDD 8 DL processes | Confirmed | 36.213 §7: "a maximum of 8 downlink HARQ processes per serving cell" |
| c3 | NR up to 16, 32 for NTN | Confirmed + default: absent → 8; `{n2 … n16}`, Rel-17 `n32` | 38.331 PDSCH-ServingCellConfig field description |
| c3 | RV order 0, 2, 3, 1 | Confirmed for PUSCH repetitions (rv_id sequence starting 0 → 0, 2, 3, 1) | 38.214 Table 6.1.2.1-2 |
| c4 | MAC CEs: TA, BSR, PHR, DRX, contention resolution, SCell activation | Confirmed | 38.321 §6.1.3.1–6.1.3.10 |
| c4 | DRX timers onDurationTimer, drx-InactivityTimer … | **Corrected** names for NR: `drx-onDurationTimer`, `drx-InactivityTimer`, `drx-RetransmissionTimerDL/UL`, `drx-LongCycleStartOffset`, `drx-ShortCycle` | 38.321 §5.7 |
| c5 | sr-TransMax forces RACH | Confirmed + detail | 38.321 §5.4.4: when SR_COUNTER reaches sr-TransMax: "notify RRC to release PUCCH … release SRS … clear any configured downlink assignments and uplink grants … initiate a Random Access procedure … on the SpCell" |
| c5 | Other symptom lists | **Practice** (reading MAC stats) | — |

Self-check: CFRA for beam failure recovery — 38.321 §5.1.1 "contention-free Random Access Resources for beam failure recovery request"; CFRA ends at the RAR and an RSRP threshold selects 2-step vs 4-step when CFRA is not configured — 38.300 §9.2.6.
