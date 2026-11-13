# Research — Journey chapters (`src/content/journey/`)

Status: **done (R5)**, 2026-11-13. All 93 steps compared with the module research and the spec text. Step counts unchanged (review card ids `jq-<chapter>-<n>` kept).

| Chapter | Change | Source |
|---|---|---|
| j-attach step 11 | T3410 stops on ATTACH ACCEPT, not at Attach Complete | 24.301 §10.2 timer table: T3410 "ATTACH ACCEPT received" / "ATTACH REJECT received" |
| j-dl step 8 | Outer-loop MCS control labelled as vendor practice; 10% tied to the CQI definition | 38.214 §5.2.2.1 |
| j-idle step 9 | Service Request: authentication usually not needed, but the network may authenticate | 24.301 (service request procedure) — wording softened |
| j-idle step 10 | Exception for RRC suspend / RRC_INACTIVE (LTE connected to 5GC) | 36.331 §4.2.1 |
| j-rlf step 3 | LTE RLF triggers: T310, T312, random access problem (no T300/T301/T304/T311 running), RLC max retransmissions; T304 failure is separate | 36.331 §5.3.11.3 |
| j-5g step 7 | T3510 stops on REGISTRATION ACCEPT, not at Registration Complete | 24.501 §10.2 timer table |
| j-sat step 1 | Doppler recomputed: ~44 kHz (line-of-sight component), labelled as reasoning | physics, see `ntn.md` |
| j-sat step 6 | Path loss 163 dB at 10° elevation | physics, see `ntn.md` |
| j-sat step 11 | PLMN choice is PLMN selection plus operator configuration (gap G1) | 23.122 |

Checked and unchanged: all other steps, including LTE 64 preambles per cell ("up to two sets of 64 preambles available in a cell", 36.211 §5.7.2), EMM #20 MAC failure / #21 Synch failure (24.301 Annex A), LTE n+4 and 8 ms UL HARQ (36.213 §8.0, §8.3), NR SSB/CORESET 0/SIB1 steps (38.211, 38.213, 38.331), handover message flow (38.423 names; LTE X2AP not read, gap G2).
