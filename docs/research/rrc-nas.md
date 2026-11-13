# Research — Module: RRC and NAS

Status: **done (R1)**, 2026-11-13. Covers the 10 lessons in `src/content/lessons/rrc/`.

## Method
- Primary sources only for facts: the 3GPP specifications below, read as full text (ETSI PDF → `pdftotext`). A claim is **checked** only when the clause text itself was read; quotes below are copied from that text.
- Each v1 claim gets a verdict: **Confirmed**, **Corrected** (the spec says something different or more precise), **Added** (new, from the spec), or **Gap** (not checkable from the sources read; listed in `docs/CONTENT_GAPS.md`).
- Secondary sources were used only to find file names, never for facts.

## Sources

| Spec | Title | Version used |
|---|---|---|
| TS 38.331 | NR; Radio Resource Control (RRC); Protocol specification | V17.7.0 (ETSI TS 138 331, 2024-02), Rel-17 |
| TS 36.331 | E-UTRA; RRC; Protocol specification | V17.7.0 (ETSI TS 136 331), Rel-17 |
| TS 38.304 | NR; UE procedures in Idle mode and in RRC Inactive state | V17.9.0 (ETSI TS 138 304, 2024-08), Rel-17 |
| TS 24.501 | NAS protocol for 5G System (5GS); Stage 3 | V17.13.0 (ETSI TS 124 501, 2024-01), Rel-17 |
| TS 24.301 | NAS protocol for EPS; Stage 3 | V17.11.0 (ETSI TS 124 301), Rel-17 |
| TS 23.122 | NAS functions related to MS in idle mode | V17.10.0 (ETSI TS 123 122), Rel-17 |

Download pattern that works from the cloud session (Cloudflare blocks curl, but the web-fetch tool works):
`https://www.etsi.org/deliver/etsi_ts/<range>/<number>/<version>_60/ts_<number>v<version>p.pdf`; the folder listing (e.g. `.../123100_123199/123122/`) shows the versions.

---

## Lesson e1 — RRC states

| v1 claim | Verdict | Source |
|---|---|---|
| LTE has RRC_IDLE and RRC_CONNECTED | **Corrected**: LTE connected to 5GC also has RRC_INACTIVE | 36.331 §4.2.1: "A UE is in RRC_CONNECTED when an RRC connection has been established or in RRC_INACTIVE (if the UE is connected to 5GC) when RRC connection is suspended." |
| NR has IDLE, CONNECTED, INACTIVE; inactive keeps context | Confirmed | 38.331 §4.2.1: RRC_INACTIVE: "The UE stores the UE Inactive AS context; A RAN-based notification area is configured by RRC layer" |
| Idle: UE picks cells, listens for paging, no radio bearers | Confirmed (wording: "no RRC connection") | 38.331 §4.2.1: idle = "no RRC connection is established"; "UE controlled mobility based on network configuration"; "Monitors a Paging channel for CN paging using 5G-S-TMSI" |
| Connected: network controls mobility, UE reports measurements | Confirmed | 38.331 §4.2.1: "Network controlled mobility within NR, to/from E-UTRA, and to UTRA-FDD" |
| Inactive UE is paged by RAN too | **Added** | 38.331 §4.2.1: inactive UE "monitors a Paging channel for CN paging using 5G-S-TMSI and RAN paging using fullI-RNTI"; "Performs RAN-based notification area updates periodically and when moving outside the configured RAN-based notification area" |
| An inactivity timer in the base station releases idle connections | **Corrected / Added**: the gNB's own release policy is implementation; NR also has a UE-side `dataInactivityTimer` | 38.331 §5.3.8.5: "Upon receiving the expiry of DataInactivityTimer from lower layers while in RRC_CONNECTED, the UE shall: perform the actions upon going to RRC_IDLE … with release cause 'RRC connection failure'." Values `s1 … s180` (DataInactivityTimer ASN.1). |

## Lesson e2 — System information

| v1 claim | Verdict | Source |
|---|---|---|
| MIB: the minimum to find SIB1 | Confirmed | 38.331 MIB ASN.1: `systemFrameNumber`, `subCarrierSpacingCommon`, `ssb-SubcarrierOffset`, `dmrs-TypeA-Position`, `pdcch-ConfigSIB1`, `cellBarred`, `intraFreqReselection` |
| SIB1 carries barring | **Corrected** for NR: `cellBarred` is in the **MIB** (LTE carries it in SIB1) | 38.331 MIB ASN.1 `cellBarred ENUMERATED {barred, notBarred}` |
| SIB1: PLMN list, TAC, cell identity, q-RxLevMin, schedule of other SIBs, common serving cell config | Confirmed | 38.331 SIB1 ASN.1: `cellSelectionInfo { q-RxLevMin … }`, `cellAccessRelatedInfo`, `si-SchedulingInfo`, `servingCellConfigCommon`; PLMN-IdentityInfo: `plmn-IdentityList`, `trackingAreaCode`, `ranac`, `cellIdentity` |
| NR SIB1 also carries the UE timers and access barring | **Added** | 38.331 SIB1 ASN.1: `ue-TimersAndConstants` (t300, t301, t310, n310, t311, n311, t319); `uac-BarringInfo` |
| LTE SIB2: RACH, PRACH, power control, timers | Confirmed (LTE) | 36.331 SystemInformationBlockType2 (not re-quoted here) |
| SIB3 to SIB5: reselection rules and neighbours | **Corrected** for NR: SIB2 = common reselection info, SIB3 = intra-freq neighbours, SIB4 = inter-freq, SIB5 = E-UTRA | 38.331 SIB2–SIB5 descriptions: "SIB2 contains cell re-selection information common for intra-frequency, inter-frequency and/or inter-RAT cell re-selection …"; "SIB5 contains information relevant only for inter-RAT cell re-selection i.e. information about E-UTRA frequencies" |
| NTN: SIB19 carries ephemeris, common TA, offsets | Confirmed | 38.331: "SIB19 contains satellite assistance information for NTN access." NTN-Config-r17: `epochTime`, `ntn-UlSyncValidityDuration`, `cellSpecificKoffset`, `kmac`, `ta-Info`, `ephemerisInfo` |
| LTE IoT-NTN uses SIB31 | Confirmed | 36.331: "The IE SystemInformationBlockType31 contains satellite assistance information for the serving cell." |
| SI change is notified through paging or a value tag | **Corrected** (NR): Short Message with P-RNTI on DCI, applied from the next modification period | 38.331 §5.2.2.2.2: "The UE receives indications about SI modifications and/or PWS notifications using Short Message transmitted with P-RNTI over DCI"; "updated SI message … is broadcasted in the modification period following the one where SI change indication is transmitted" |

## Lesson e3 — RRC connection setup

| v1 claim | Verdict | Source |
|---|---|---|
| NR: RRCSetupRequest, RRCSetup, RRCSetupComplete; reject with RRCReject | Confirmed | 38.331 §5.3.3.1 figures |
| Setup establishes SRB1 and carries the first NAS message | Confirmed | 38.331 §5.3.3.1: "RRC connection establishment involves SRB1 establishment. The procedure is also used to transfer the initial NAS dedicated information/ message"; RRCSetupComplete-IEs: `dedicatedNAS-Message`, `selectedPLMN-Identity`, `registeredAMF`, `s-NSSAI-List` |
| RRCSetup can answer a resume or re-establishment | **Added** | 38.331 §5.3.3.1: "When UE is resuming or re-establishing an RRC connection, and the network is not able to retrieve or verify the UE context. In this case, UE receives RRCSetup and responds with RRCSetupComplete." |
| Security mode at RRC comes before SRB2 and DRBs | Confirmed | 38.331 §5.3.4.2: network applies it "when only SRB1 is established, i.e. prior to establishment of SRB2, multicast MRBs and/ or DRBs" |
| Establishment causes (mo-Signalling, mo-Data, mt-Access, emergency) | Confirmed, list completed | 38.331 EstablishmentCause: `emergency, highPriorityAccess, mt-Access, mo-Signalling, mo-Data, mo-VoiceCall, mo-VideoCall, mo-SMS, mps-PriorityAccess, mcs-PriorityAccess` |
| RRCReject with a wait time | Confirmed + detail | 38.331 §5.3.15.2: UE stops T300 and, "if waitTime is configured in the RRCReject: start timer T302, with the timer value set to the waitTime"; waitTime: "Wait time value in seconds", `INTEGER (1..16)` |
| T300 behaviour | **Added** | 38.331 timer table: T300 starts "Upon transmission of" RRCSetupRequest, stops on RRCSetup/RRCReject; §5.3.3.7 on expiry: "inform upper layers about the failure to establish the RRC connection"; if `connEstFailureControl` is in SIB1 and T300 expired `connEstFailCount` times on the same cell, the UE uses `connEstFailOffset` as Qoffsettemp for that cell for `connEstFailOffsetValidity` |

## Lesson e4 — NAS: attach and registration

| v1 claim | Verdict | Source |
|---|---|---|
| LTE attach carries PDN CONNECTIVITY REQUEST; Attach Accept carries ACTIVATE DEFAULT EPS BEARER CONTEXT REQUEST | Confirmed | 24.301 §5.5.1.2.4: "the UE shall send an ATTACH COMPLETE message together with an ACTIVATE DEFAULT EPS BEARER CONTEXT ACCEPT message contained in the ESM message container"; "If the attach request included the PDN CONNECTIVITY REQUEST message in the ESM message container …" |
| 5G: Registration, authentication, security mode, Registration Accept, Registration Complete, then PDU session | Confirmed + precise rule | 24.501 §5.5.1.2.4: in initial registration the AMF includes "the new assigned 5G-GUTI"; §5.5.1.3.4: "If the REGISTRATION ACCEPT message contains a 5G-GUTI, the UE shall return a REGISTRATION COMPLETE message to the AMF to acknowledge the received 5G-GUTI" |
| PDU session is a separate procedure | Confirmed + detail | 24.501 §6.4.1.2: the PDU SESSION ESTABLISHMENT REQUEST is sent "using the NAS transport procedure" (inside UL NAS TRANSPORT) "and the UE shall start timer T3580" |
| AKA: RAND/AUTN, SIM checks AUTN, answers RES | **Corrected** for 5G: the UE answers with **RES\*** | 24.501 §5.4.1.3.3: "The USIM will compute the authentication response (RES) … From the RES, RES* is then generated according to Annex A of 3GPP TS 33.501" |
| Satellite PLMN is used only without terrestrial coverage | **Gap** — PLMN selection policy (TS 23.122, operator lists); not a rule found in the specs read | — |

## Lesson e5 — Reject causes

| v1 claim | Verdict | Source |
|---|---|---|
| #3, #6, #7, #11, #12, #13, #15, #22 | Confirmed in both 24.301 and 24.501 (5GMM #7 = "5GS services not allowed") | 24.501 Annex A; 24.301 Annex A |
| #17 Network failure, #19 ESM failure | **Corrected**: EMM (LTE) only; **not 5GMM causes** | 24.501 Table 9.11.3.2.1 has no #17 or #19 |
| 5G-only #27 N1 mode not allowed, #62 No network slices available | Confirmed | 24.501 Annex A |
| Other 5GMM causes worth knowing | **Added**: #20 MAC failure, #21 Synch failure, #31 Redirection to EPC required, #65 Maximum number of PDU sessions reached | 24.501 Table 9.11.3.2.1 |
| ESM/5GSM #27 missing or unknown APN/DNN, #33 not subscribed | Confirmed | 24.301 Annex B: "Missing or unknown APN"; 24.501 Annex B: "Missing or unknown DNN"; both #33 "Requested service option not subscribed" |
| Forbidden lists last until reboot or a timer | **Corrected** | TAs: 24.501 §5.3.13 lists are erased when "the UE is switched off, the UICC containing the USIM is removed …" and "periodically (with a period in the range 12 to 24 hours)". PLMNs (#11): 24.501 §5.5.1.2.5 "store the PLMN identity in the forbidden PLMN list"; 23.122 §3.1: "A VPLMN is added to a list of "forbidden PLMNs" in the SIM"; "This list is retained when the MS is switched off or the SIM is removed"; HPLMN/EHPLMN "shall not be stored on the list". Removal: after a successful manual selection, or when T3245 expires (if configured). |

## Lesson e6 — Timers and counters

| v1 claim | Verdict | Source |
|---|---|---|
| T300 setup, T301 re-establishment request, T304 handover, T311 cell search after failure | Confirmed | 38.331 §7.1.1 timer table (T300 "Upon transmission of RRCSetupRequest"; T311 "Upon initiating the RRC connection re-establishment procedure" … on expiry "Enter RRC_IDLE") |
| N310/T310/N311 | Confirmed | 38.331 §7.1.1: T310 starts "Upon detecting physical layer problems"; stops "Upon receiving N311 consecutive in-sync indications" |
| NR value ranges | **Added** | 38.331 UE-TimersAndConstants: t300 100–2000 ms; t310 0–2000 ms; n310 1–20; t311 1–30 s; n311 1–10 |
| T3410 15 s, T3411 10 s, T3402 12 min after 5 failures, T3412 periodic TAU | Confirmed + default | 24.301 §10.2: T3410 15s; T3411 10s; T3402 "Default 12 min", started "At attach failure and the attempt counter is equal to 5"; T3412 "Default 54 min" |
| T3510 15 s, T3511 10 s, T3502 12 min, T3512 periodic registration | Confirmed + default | 24.501 §10.2: T3510 15s; T3511 10s; T3502 "Default 12 min" when "the attempt counter is equal to 5"; T3512 "Default 54 min" |

## Lesson e7 — Measurement events

| v1 claim | Verdict | Source |
|---|---|---|
| A1–A5, B1/B2 meanings | Confirmed | 38.331 §5.5.4.2–5.5.4.9 headings, e.g. "Event A3 (Neighbour becomes offset better than SpCell)" |
| (missing) A6 | **Added**: "Neighbour becomes offset better than SCell" | 38.331 §5.5.4.7 |
| A3 condition | **Added**: exact inequality | 38.331 §5.5.4.4: "Mn + Ofn + Ocn – Hys > Mp + Ofp + Ocp + Off" (entering); leaving: "Mn + Ofn + Ocn + Hys < Mp + Ofp + Ocp + Off"; Ofn/Ofp = `offsetMO`, Ocn/Ocp = `cellIndividualOffset`, Off = `a3-Offset` |
| Hysteresis, time-to-trigger, L3 filter | Confirmed | 38.331 reportConfigNR `hysteresis`, `timeToTrigger`; `filterCoefficient` |
| NTN event | **Added**: D1 (distance to a reference location) | 38.331 §5.5.4.15 |

## Lesson e8 — Handover

| v1 claim | Verdict | Source |
|---|---|---|
| NR command is RRCReconfiguration with reconfigurationWithSync; UE starts T304 | Confirmed | 38.331 §5.3.5.5.2: "start timer T304 for the corresponding SpCell with the timer value set to t304" |
| T304 expiry → handover failure → re-establishment | Confirmed + detail | 38.331 §5.3.5.8.3 "T304 expiry (Reconfiguration with sync Failure)": UE reverts to the source configuration, stores handover failure information in VarRLF-Report, and initiates re-establishment |
| Conditional handover | Confirmed | 38.331 §5.3.5.13.1: "The UE applies the conditional reconfiguration associated with one of the target SpCells which fulfils associated execution condition"; Event A3 note: "The definition of Event A3 also applies to CondEvent A3" |
| Xn/X2 Handover Request, path switch, context release | **Gap** — network-side messages are in TS 38.423 / 38.413 / 36.423 / 36.413 (not read in R1) | — |

## Lesson e9 — Radio link failure and re-establishment

| v1 claim | Verdict | Source |
|---|---|---|
| RLF triggers: T310 expiry, RA failure, RLC max retransmissions | Confirmed + precise | 38.331 §5.3.10.3: "upon T310 expiry in PCell; or upon T312 expiry in PCell; or upon random access problem indication from MCG MAC while neither T300, T301, T304, T311 nor T319 are running …; or upon indication from MCG RLC that the maximum number of retransmissions has been reached …; or upon consistent uplink LBT failure indication" |
| (missing) T312 | **Added** | as above |
| Handover failure (T304) is an RLF trigger | **Corrected**: in NR it is a separate trigger, "re-configuration with sync failure"; both lead to re-establishment | 38.331 §5.3.7.2 lists both separately |
| Re-establishment causes | Confirmed | 38.331 ReestablishmentCause: `reconfigurationFailure, handoverFailure, otherFailure` |
| Needs active security | Confirmed | 38.331 §5.3.10.3: "if AS security has not been activated: perform the actions upon going to RRC_IDLE … with release cause 'other'" |
| Other re-establishment triggers | **Added**: integrity check failure on SRB1/SRB2, RRC reconfiguration failure, mobility from NR failure; with `t316` configured an MCG failure can first be reported via the SCG | 38.331 §5.3.7.2 |

## Lesson e10 — Idle mode

| v1 claim | Verdict | Source |
|---|---|---|
| S criterion `Srxlev = RSRP − (q-RxLevMin + offset) − Pcompensation > 0` | **Corrected** (NR): both Srxlev > 0 **and** Squal > 0, and both subtract Qoffsettemp | 38.304 §5.2.3.2: "Srxlev > 0 AND Squal > 0 where: Srxlev = Qrxlevmeas – (Qrxlevmin + Qrxlevminoffset) – Pcompensation – Qoffsettemp; Squal = Qqualmeas – (Qqualmin + Qqualminoffset) – Qoffsettemp" |
| Reselection by priority, then ranking with hysteresis | Confirmed + formula | 38.304 §5.2.4.6: "Rs = Qmeas,s + Qhyst – Qoffsettemp; Rn = Qmeas,n – Qoffset – Qoffsettemp" |
| One paging occasion per DRX cycle, e.g. 1.28 s | Confirmed | 38.304 §7.1: "The UE monitors one paging occasion (PO) per DRX cycle"; T "is determined by the shortest of the UE specific DRX value configured by RRC (if any), the UE specific DRX value configured by upper layers (if any), and a default DRX value broadcast in system information"; 38.331 PagingCycle `{rf32, rf64, rf128, rf256}` (rf128 = 1.28 s) |
| A paged UE answers with RACH and a Service Request | **Corrected**: true for CN paging; for RAN paging in RRC_INACTIVE the UE resumes | 38.331 §5.3.2.3: CN paging identity → "forward the ue-Identity … to the upper layers"; match on stored `fullI-RNTI` → "initiate the RRC connection resumption procedure" |
| PLMN selection: home and preferred PLMNs first | Partly checked | 23.122 §3.1 (PLMN selection and roaming) — order not quoted in R1; kept general |

## Corrections outside this module (same evidence)

- **Case RAN-001 "Attach works, then never again"**: v1 said a teardown could clear the forbidden list "for example an airplane mode cycle or SIM refresh". 23.122 §3.1: the forbidden PLMN list is "in the SIM" and "retained when the MS is switched off or the SIM is removed". Corrected in `src/content/cases/01-c-forbidden.yaml`.

## Self-check of sentences added while rewriting

Sentences in the rewritten lessons that went beyond the tables above, each checked against the text:

| Sentence | Source |
|---|---|
| #12 → "forbidden tracking areas for regional provision of service"; #13 and #15 → "forbidden tracking areas for roaming" | 24.501 §5.5.1.2.5, cause handling for #12, #13, #15 |
| T319 guards resume | 38.331 §7.1.1: T319 starts "Upon transmission of" RRCResumeRequest, stops "Upon reception of RRCResume" |
| Registration types: initial, mobility, periodic, emergency (+ SNPN onboarding, disaster roaming) | 24.501 Table 9.11.3.7.1 |
| After reconfiguration with sync the UE sends RRCReconfigurationComplete "using the new configuration" | 38.331 §5.3.5.3 |
| LTE handover command = RRCConnectionReconfiguration with mobilityControlInfo | 36.331 §5.3.5.4 ("If the RRCConnectionReconfiguration message includes the mobilityControlInfo …") |
| CN paging is answered by NAS with a Service Request | 24.501 §5.6.1: "service request procedure as a response to paging or notification" |
| Using the SIM's home PLMN avoids the forbidden list after #11 | 23.122 §3.1: the HPLMN or an EHPLMN "shall not be stored on the list of "forbidden PLMNs"" |
