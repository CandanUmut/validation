# Research — Module: PHY layer

Status: **done (R2)**, 2026-11-13. Covers the 10 lessons in `src/content/lessons/phy/`. Method as in `rrc-nas.md`: full spec text, clause and quote per verdict; **Practice** marks rules of thumb and reasoning that no spec states (kept, but labelled as such in the lessons).

## Sources (all Release 17, ETSI PDFs)

| Spec | Title | Version |
|---|---|---|
| TS 38.211 | NR; Physical channels and modulation | 17.11.0 |
| TS 38.212 | NR; Multiplexing and channel coding | 17.13.0 |
| TS 38.213 | NR; Physical layer procedures for control | 17.14.0 |
| TS 38.214 | NR; Physical layer procedures for data | 17.16.0 |
| TS 38.215 | NR; Physical layer measurements | 17.5.0 |
| TS 38.321 | NR; MAC protocol specification | 17.15.0 |
| TS 38.306 | NR; UE radio access capabilities | 17.17.0 |
| TS 38.101-1 | NR; UE radio transmission and reception; Part 1: Range 1 standalone | 17.23.0 |
| TS 38.331 | NR; RRC (from R1) | 17.7.0 |
| TS 36.211 / 36.212 / 36.213 / 36.214 | E-UTRA physical channels / coding / procedures / measurements | 17.4.0 / 17.1.0 / 17.8.0 / 17.0.0 |
| TS 36.306 | E-UTRA UE radio access capabilities | 17.11.0 |
| TS 36.331 | E-UTRA RRC (from R1) | 17.7.0 |

## b1 — OFDM grid and numerology

| v1 claim | Verdict | Source |
|---|---|---|
| LTE: 15 kHz, 1 ms subframe, 7 symbols per slot (normal CP) | Confirmed | 36.211 §4: "Tf = 307200 · Ts = 10 ms long and consists of 10 subframes of length 30720 · Ts = 1 ms"; Table 6.12-1 normal CP Δf = 15 kHz, l = 0…6 |
| RB = 12 subcarriers | Confirmed | 38.211 §4.4.4.1: "A resource block is defined as N_sc^RB = 12 consecutive subcarriers in the frequency domain." |
| LTE 6/15/25/50/75/100 RBs | Confirmed (RB values); MHz pairing **Gap** (TS 36.101 Table 5.6-1 too large to fetch) | 36.331 MIB `dl-Bandwidth {n6, n15, n25, n50, n75, n100}`: "n6 corresponds to 6 resource blocks …" |
| NR SCS = 15·2^μ, μ = 0..3 | **Corrected**: Rel-17 Table 4.2-1 lists μ = 0…6 (15 to 960 kHz); extended CP only at 60 kHz | 38.211 Table 4.2-1 |
| A slot is always 14 symbols | Confirmed (normal CP); 12 with extended CP | 38.211 Table 4.3.2-1 (14 symbols, slots per subframe 1, 2, 4 … 64) and Table 4.3.2-2 (12) |
| FR1 410–7125 MHz, 15/30/60 kHz, up to 100 MHz | Confirmed + detail: at 15 kHz the maximum is 50 MHz (270 RB); 100 MHz at 30 kHz = 273 RB | 38.101-1 §5.1 "FR1 410 MHz – 7125 MHz"; Table 5.3.2-1 |
| FR2 24.25 GHz+, 60/120 kHz, up to 400 MHz | **Gap** (TS 38.101-2 not read) | — |
| LTE normal CP ≈ 4.7 µs | Confirmed | 36.211 Table 6.12-1: 160 Ts (l = 0), 144 Ts (l = 1…6); Ts = 1/(15000 × 2048) s → 144 Ts = 4.69 µs |
| RE = one subcarrier × one symbol | Confirmed | 38.211 §4.4.3: "Each element in the resource grid … is called a resource element" |

## b2 — FDD, TDD and TDD patterns

| v1 claim | Verdict | Source |
|---|---|---|
| LTE TDD: 7 configurations 0–6, special subframe DwPTS/GP/UpPTS | Confirmed | 36.211 Table 4.2-2; §4.2 "S denotes a special subframe with the three fields DwPTS, GP and UpPTS" |
| NR TDD set by `tdd-UL-DL-ConfigurationCommon`: period, DL slots/symbols, UL slots/symbols | Confirmed + detail: optional second pattern; periods 0.5–10 ms | 38.331 TDD-UL-DL-ConfigCommon `{referenceSubcarrierSpacing, pattern1, pattern2 OPTIONAL}`; TDD-UL-DL-Pattern `dl-UL-TransmissionPeriodicity {ms0p5 … ms10}` (+ ms3, ms4), `nrofDownlinkSlots`, `nrofDownlinkSymbols`, `nrofUplinkSlots`, `nrofUplinkSymbols` |
| DDDSU is common; guard period must cover round trip; misaligned patterns cause cross-link interference | **Practice** (labelled). Rel-16 adds UE measurements for it: SRS-RSRP and CLI-RSSI | 38.215 §5.1.19, §5.1.20 |

## b3 — Cell search and synchronization

| v1 claim | Verdict | Source |
|---|---|---|
| PSS+SSS give the PCI | Confirmed: 1008 PCIs in NR | 38.211 §7.4.2.1: "There are 1008 unique physical-layer cell identities" |
| LTE PSS/SSS every 5 ms | Confirmed (FDD: slots 0 and 10 = subframes 0 and 5) | 36.211 §6.11.1.2 / §6.11.2.2 "in slots 0 and 10" |
| LTE MIB on PBCH, 40 ms, gives bandwidth, PHICH config, SFN | Confirmed | 36.211 PBCH "in a 40 ms period"; 36.331 MasterInformationBlock `dl-Bandwidth`, `phich-Config`, `systemFrameNumber` |
| NR SSB: 4 symbols, 20 RBs | Confirmed | 38.211 §7.4.3.1: "an SS/PBCH block consists of 4 OFDM symbols … 240 contiguous subcarriers" |
| UE assumes 20 ms for initial search | Confirmed | 38.213 §4.1: "For initial cell selection, a UE may assume that half frames with SS/PBCH blocks occur with a periodicity of 2 frames." |
| MIB points to CORESET 0 and search space 0 | Confirmed | 38.213 §4.1: "the UE determines from MIB that a CORESET for Type0-PDCCH CSS set … is present"; §13 `controlResourceSetZero`, `searchSpaceZero` in `pdcch-ConfigSIB1` |
| Large uncorrected Doppler can hide the cell | **Practice / reasoning** | — |

## b4 — PDCCH and DCI

| v1 claim | Verdict | Source |
|---|---|---|
| NR DCI 0_0, 0_1 (UL), 1_0, 1_1 (DL) | Confirmed, **completed**: also 0_2 and 1_2 | 38.212 Table 7.3.1-1 |
| LTE formats 0, 1, 1A, 2, 2A … | Confirmed | 36.212 §5.3.3.1.x (Format 0 … 3A) |
| Aggregation levels 1, 2, 4, 8, 16 | Confirmed | 38.331 SearchSpace `nrofCandidates {aggregationLevel1 … aggregationLevel16}` |
| CORESET + search space; blind decoding; CRC scrambled by RNTI | Confirmed (CORESET/search space in 38.213 §10.1) | 38.213 §10.1 |
| Missed DCI shows as DTX, not NACK | **Practice / reasoning** (no PDSCH received → no HARQ-ACK) | — |

## b5 — Data channels, coding and reference signals

| v1 claim | Verdict | Source |
|---|---|---|
| QPSK … 256QAM | **Corrected**: PDSCH also 1024QAM (Rel-17); PUSCH adds π/2-BPSK with transform precoding | 38.211 Table 7.3.1.2-1 (QPSK … 1024QAM, Qm 2…10); Table 6.3.1.2-1 |
| NR: LDPC for data, polar for control | Confirmed, **precise**: LDPC for UL-SCH, DL-SCH **and PCH**; polar for BCH and DCI; UCI polar or block code (small payloads) | 38.212 Tables 5.3-1, 5.3-2 |
| LTE turbo codes for data | Confirmed: turbo, rate 1/3; BCH tail-biting convolutional | 36.212 Table 5.1.3-1 |
| LTE CRS always on | Confirmed | 36.211 §6.10.1: "transmitted in all downlink subframes for frame structure type 1" |
| NR RS: DMRS, CSI-RS, TRS, PT-RS, SRS | Confirmed (TRS = "CSI-RS for tracking") | 38.211 §7.4.1.1–7.4.1.7; 38.214 §5.1.6.1.1 |
| PT-RS mainly FR2 | **Practice** (spec allows it wherever configured) | — |
| TBS from MCS, RBs, layers | Confirmed | 38.214 §5.1.3.2: "N_info = N_RE · R · Qm · υ" |
| NR RSRP is SS-RSRP or CSI-RSRP | Confirmed + detail: SS-RSRP measures the **SSS** resource elements within the SMTC window | 38.215 §5.1.1, §5.1.2 |

## b6 — Link adaptation

| v1 claim | Verdict | Source |
|---|---|---|
| CQI 0–15, RI, PMI | Confirmed | 38.214 §5.2.2.1 CQI tables |
| Scheduler targets 10% BLER | **Corrected / sharpened**: 10% is the **CQI definition**: the UE reports the highest CQI it could receive with block error probability "not exceeding 0.1" (0.00001 for cqi-Table 'table3'). The scheduler's own target and outer loop are implementation | 38.214 §5.2.2.1 |
| OLLA, uplink MCS by the gNB, troubleshooting list, residual BLER near zero | **Practice** (labelled) | — |

## b7 — Measurements

| v1 claim | Verdict | Source |
|---|---|---|
| RSRP = average power of one RS resource element | Confirmed: LTE on CRS (R0), NR SS-RSRP on SSS | 36.214 §5.1.1; 38.215 §5.1.1 |
| RSRQ = N × RSRP / RSSI | Confirmed | 38.215 §5.1.3: "the ratio of N×SS-RSRP / NR carrier RSSI, where N is the number of resource blocks in the NR carrier RSSI measurement bandwidth" |
| SINR | Confirmed (SS-SINR defined) | 38.215 §5.1.5 |
| Rule-of-thumb RSRP/SINR ranges | **Practice** (labelled; not spec values) | — |
| RSRP ≈ 25 dB below total power on 5 MHz | Confirmed by arithmetic: 25 RB × 12 = 300 subcarriers, 10·log10(300) = 24.8 dB (equal power per RE) | — |

## b8 — Uplink power control and timing advance

| v1 claim | Verdict | Source |
|---|---|---|
| `P = min(Pcmax, P0 + α·PL + 10log10(M) + Δ + f)` | **Corrected** for NR: `10·log10(2^μ · M_RB)` | 38.213 §7.1.1: "P_O_PUSCH(j) + 10 log10(2^μ · M_RB(i)) + α(j)·PL(qd) + Δ_TF(i) + f(i,l)" |
| Power class 3 = 23 dBm | Confirmed | 38.101-1 Table 6.2.1-1 (e.g. n1: Class 3 23 dBm, ±2 dB) |
| PHR = headroom | Confirmed | 38.321 §5.4.6: "Type 1 power headroom: the difference between the nominal UE maximum transmit power and the estimated power for UL-SCH transmission" |
| First TA in RAR, then MAC CE | Confirmed + NR ranges | 38.213 §4.2: RAR/absolute TA "T_A = 0, 1, 2, ..., 3846"; later commands "T_A = 0, 1, 2,..., 63"; step "16·64·Tc/2^μ" |
| LTE step 16 Ts ≈ 0.52 µs ≈ 78 m; max 1282 ≈ 100 km | Confirmed | 36.211 §8.1 "0 ≤ N_TA ≤ 20512" (= 1282 × 16 Ts ≈ 668 µs ≈ 100 km); 38.211 §4.1 κ = Ts/Tc = 64, so 16·64·Tc = 16 Ts |
| timeAlignmentTimer expiry → RACH again | Confirmed + detail | 38.321 §5.2: on expiry "flush all HARQ buffers … notify RRC to release PUCCH … SRS"; "shall not perform any uplink transmission … except the Random Access Preamble and MSGA transmission" |
| ~100 km TA limit is a direct-to-cell problem | **Reasoning** (labelled) | — |

## b9 — MIMO and beams

| v1 claim | Verdict | Source |
|---|---|---|
| LTE TM1–TM4 | Confirmed | 36.213 Table 7.1-5: Mode 1 single-antenna port 0, Mode 2 transmit diversity, Mode 3 large delay CDD, Mode 4 closed-loop spatial multiplexing |
| NR: best SSB sets the PRACH occasion | Confirmed | 38.213 §8.1, mapping by `ssb-perRACH-OccasionAndCB-PreamblesPerSSB` |
| Beam failure recovery | Confirmed | 38.321 §5.17 "Beam Failure Detection and Recovery procedure" (`beamFailureInstanceMaxCount`) |
| NR DL layers | **Added**: UE capability 2, 4 or 8 layers | 38.331 `MIMO-LayersDL {twoLayers, fourLayers, eightLayers}` |
| Satellite spot beams; rank 1 at cell edge | **Reasoning / practice** | — |

## b10 — Throughput math

| v1 claim | Verdict | Source |
|---|---|---|
| Peak ≈ REs/s × bits × rate × layers − ~25% overhead | **Replaced** by the official NR formula | 38.306 §4.1.2: `rate = 10^-6 · Σ v·Qm·f·Rmax·(N_PRB·12)/Ts^μ·(1−OH)`, Rmax = 948/1024, Ts^μ = 10^-3/(14·2^μ), OH = 0.14 FR1 DL, 0.18 FR2 DL, 0.08 FR1 UL, 0.10 FR2 UL |
| LTE Cat 4 ≈ 150 Mbps with 2 layers | Confirmed | 36.306 Table 4.1-1: Category 4 "150752" bits per TTI, 2 layers |
| LTE 20 MHz: 16.8 M RE/s | Confirmed by arithmetic (100 × 12 × 14 × 1000) | — |
| Worked NR examples | Computed with the 38.306 formula: 100 MHz/30 kHz (273 PRB), 4 layers, 256QAM ≈ 2337 Mbps; 5 MHz/15 kHz (25 PRB), 2 layers, 64QAM ≈ 40 Mbps; same with 1 layer QPSK ≈ 6.7 Mbps | — |

## Self-check of sentences added while rewriting

| Sentence | Source |
|---|---|
| LTE has 504 PCIs | 36.211 §6.11: "There are 504 unique physical-layer cell identities" |
| LTE transmission modes go up to TM10 | 36.213 Table 7.1-5 lists Mode 9 and Mode 10 |
| Beam failure recovery uses random access | 38.321 §5.17: when BFI_COUNTER ≥ beamFailureInstanceMaxCount, "initiate a Random Access procedure (see clause 5.1) on the SpCell" |
| Later TA commands are 0–63 (MAC CE) | 38.213 §4.2: "In other cases, a timing advance command … T_A = 0, 1, 2,..., 63" |
| NR downlink RS includes PRS; DMRS also for PDCCH and PBCH | 38.211 §7.4.1.3, §7.4.1.4, §7.4.1.7 |

Two phrases were softened rather than checked: the release in which CLI measurements arrived, and calling DCI 0_2/1_2 "compact".
