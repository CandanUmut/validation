# Research — Module: Network architecture

Status: **done (R4)**, 2026-11-13. Sources (Rel-17): TS 23.501 V17.15.0, TS 38.300 V17.17.0, TS 38.401 V17.10.0, TS 36.300 V17.13.0, TS 38.331 V17.7.0, TS 38.211 V17.11.0.

| Lesson | v1 claim | Verdict | Source |
|---|---|---|---|
| a1 | EPC: MME, S-GW, P-GW; S1-MME, S1-U, X2 | Confirmed | 36.300 §4: eNBs "connected by means of the S1 interface to the EPC …, more specifically to the MME … by means of the S1-MME interface and to the Serving Gateway (S-GW) by means of the S1-U interface"; "interconnected with each other by means of the X2 interface"; MME, S-GW, P-GW function lists in §4.1 |
| a1 | HSS | **Gap** (TS 23.401 not read) | — |
| a1 | 5GC: AMF, SMF, UPF, UDM, AUSF | Confirmed | 23.501 §4.2.2 NF list |
| a1 | N2 = gNB–AMF (NGAP), N3 = gNB–UPF; NG | Confirmed | 23.501 §4.2.7: "N2: Reference point between the (R)AN and the AMF"; "N3: Reference point between the (R)AN and the UPF"; 38.300 §3.2 NG-C / NG-U |
| a2 | Stack: NAS terminated in AMF; RRC, PDCP, RLC, MAC in gNB; SDAP in user plane | Confirmed | 38.300 §4.4.1, §4.4.2: "NAS control protocol (terminated in AMF on the network side)" |
| a3 | SRB0–SRB3 roles | Confirmed + completed: SRB3 for (NG)EN-DC **or NR-DC**; SRB4 for application-layer measurement reports | 38.331 §4.2.2 SRB list |
| a3 | NSA "option 3x", SA "option 2" | **Practice** (deployment-option names from industry, not 3GPP spec text) | — |
| a3 | QCI 9/1/5 | 5QI values confirmed (1 Conversational Voice, 5 IMS Signalling, 9 TCP-based); LTE QCI table **Gap** (TS 23.203 not read) | 23.501 Table 5.7.4-1 |
| a4 | CU = RRC, PDCP; DU = RLC, MAC, upper PHY; RU = lower PHY | **Corrected**: 3GPP: gNB-CU hosts RRC, SDAP, PDCP; gNB-DU hosts RLC, MAC **and PHY**; F1 between them; CU-CP/CU-UP with E1. The DU/RU split of the PHY is the O-RAN Alliance's (7.2x), not 3GPP | 38.401 §3.1 definitions |
| a4 | Rel-17 NTN is transparent | Confirmed | 38.300 §16.14.1: "The NTN payload transparently forwards the radio protocol received from the UE … to the NTN Gateway … and vice-versa" |
| a4 | "Regenerative is being added in later releases" | **Gap** (later releases not read) | — |
| a4 | SpaceX public description (LTE modem as a cell tower in space, laser links) | **Removed / Gap**: the cited page (starlink.com/direct-to-cell) returned 404 on 2026-11-13; not re-checked | — |
| a5 | Logical channels BCCH, PCCH, CCCH, DCCH, DTCH | Confirmed | 38.300 §6.2.2 |
| a5 | NR DL physical channels PBCH, PDCCH, PDSCH; no PCFICH/PHICH | Confirmed (NR defines only PDSCH, PBCH, PDCCH) | 38.211 §7.1.1 |
| a6 | PCI 504 / 1008; NCGI; GSCN; SUCI | Confirmed | 36.211 §6.11; 38.211 §7.4.2.1; 38.300 abbreviations; 38.101-1 §5.4.3; 23.501 §5.9.2a |
