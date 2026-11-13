# Research — Case files (`src/content/cases/`)

Status: **done (R5)**, 2026-11-13. The 12 cases are teaching scenarios with simplified logs; this check covers the spec facts in their feedback, causes and take-aways.

| Case | Result | Source |
|---|---|---|
| RAN-001 c-forbidden | **Corrected in R1**: forbidden PLMNs list on the SIM survives power-off; airplane mode does not clear it | 23.122 §3.1 |
| RAN-002 c-rach-silent | Confirmed: `powerRampingStep {dB0, dB2, dB4, dB6}` (0 dB legal), `preambleInitialReceivedTargetPower` range includes −112 dBm | 36.331 ASN.1 |
| RAN-003 c-msg3 | Confirmed: LTE RAR TA maximum 1282 (= 20512 Ts / 16, ≈ 100 km) | 36.211 §8.1 |
| RAN-004 c-mcs | Consistent (practice; 10% from the CQI definition) | 38.214 §5.2.2.1 |
| RAN-005 c-tcp | Consistent for LTE (RLC t-Reordering, 8 ms UL HARQ RTT). In NR the reordering timer is PDCP's | 38.300 §6.3–6.4 |
| RAN-006 c-40s | Consistent (LTE handover command name) | 36.331 |
| RAN-007 c-t304 | Consistent (T304 guards access to the target) | 36.331 / 38.331 §5.3.5.8.3 |
| RAN-008 c-qrx | Consistent: LTE Q-RxLevMin INTEGER (−70..−22); the ×2 dBm scaling (→ −140 dBm) is in TS 36.304 (not read) | 36.331 ASN.1 |
| RAN-009 c-backoff | **Corrected**: power-cycle, not airplane mode; counter reset "when the UE is powered on" / "a USIM is inserted"; T3410 15 s, T3411 10 s, T3402 12 min confirmed | 24.301 §5.5.1.1, §10.2 |
| RAN-010 c-bler | Consistent with recomputed physics (Doppler rate peaks overhead) | `ntn.md` |
| RAN-011 c-dnn | Confirmed: 5GSM #27 "Missing or unknown DNN"; PDU session separate from registration | 24.501 Annex B, §6.4.1 |
| RAN-012 c-sms | Scenario (core retry schedule); no spec claim to check | — |
