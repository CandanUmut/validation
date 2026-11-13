# Research — Module: Satellite RAN and direct-to-cell (NTN)

Status: **done (R4)**, 2026-11-13. Sources (Rel-17): TS 38.300 V17.17.0 §16.14, TS 38.331 V17.7.0, TS 38.321 V17.15.0, TS 38.213 V17.14.0, TS 38.101-5 V17.16.0, TS 36.331 V17.7.0, TS 36.213 V17.8.0. Physics recomputed (script values below: GM = 3.986×10¹⁴ m³/s², Earth radius 6371 km, c = 299 792 458 m/s).

## Physics (recomputed, not from a spec)

| Quantity | v1 | Recomputed |
|---|---|---|
| Orbital speed | ~7.7 km/s | 7.70 km/s at 350 km, **7.59 km/s at 550 km** |
| One-way delay at 550 km | 1.8 ms overhead | 1.83 ms at 90°, 3.31 ms at 30°, **6.05 ms at 10°** (slant 1815 km) |
| Max Doppler at 1.9 GHz | ~48 kHz | **~44 kHz**: only the line-of-sight part of the velocity counts; at the horizon it is v·R/(R+h) = 6.99 km/s |
| FSPL 550 km, 1900 MHz | ~153 dB | 152.8 dB overhead; 163.2 dB at 10° elevation |
| FSPL 5 km terrestrial | ~112 dB | 112.0 dB |
| Noise in 180 kHz | −121.4 dBm | −121.4 dBm (−174 + 10·log10(180 000)) |

## Spec claims

| Lesson | v1 claim | Verdict | Source |
|---|---|---|---|
| f2, f3 | NTN UE has GNSS, reads ephemeris, pre-corrects timing and frequency | Confirmed | 38.300 §16.14.2: "In this release, the UE supporting NTN is GNSS-capable"; §16.14.2.2: UE "shall have valid GNSS position as well as ephemeris and Common TA before connecting"; "shall compute the frequency Doppler shift of the service link, and autonomously pre-compensate for it in the uplink"; without them "it shall not transmit until both are regained" |
| f3 | Common TA "for the feeder link" | **Corrected**: Common TA "is a configured timing offset that is equal to the RTT between the RP and the NTN payload" (RP = uplink time synchronization reference point) | 38.300 §16.14.2 |
| f3 | K_offset | Confirmed: "needs to be larger or equal to the sum of the service link RTT and the Common TA"; k_mac ≈ RTT between RP and gNB | 38.300 §16.14.2; 38.213 (cellSpecificKoffset) |
| f3 | SIB19 contents | Confirmed (R1) | 38.331 SIB19, NTN-Config |
| f3 | HARQ up to 32, feedback can be disabled | Confirmed + UL: HARQ mode A/B per process | 38.300 §16.14.2: "For downlink, HARQ feedback can be enabled or disabled per HARQ process"; "For uplink, HARQ mode … can be configured per HARQ process"; 38.331 n32 |
| f3 | Timers extended | Confirmed (specific): RAR window starts after an extra T_TA + k_mac; contention resolution and DRX HARQ RTT timers add the UE–gNB RTT; `sr-ProhibitTimer-v1700` up to 1082 ms; `t-ReassemblyExt-r17`; `discardTimerExt2-r17` (2000 ms) | 38.213 §8.2; 38.321 §5.1.5, §5.7; 38.331 |
| f3 | Earth-fixed, quasi-earth-fixed, earth-moving | Confirmed | 38.300 §16.14 |
| f3 | CHO with time- and location-based triggers | Confirmed + detail: always configured together with a measurement trigger (A3/A4/A5); `condEventT1`, `condEventD1` | 38.300 §16.14.3.2.2; 38.331 §5.3.5.13 |
| f3 | Transparent payload, FR1, n255 and n256 | Confirmed: n256 UL 1980–2010 / DL 2170–2200 MHz; n255 UL 1626.5–1660.5 / DL 1525–1559 MHz, FDD | 38.300 §16.14.1; 38.101-5 Table 5.2-1 |
| f3 | IoT-NTN for NB-IoT/LTE-M in Rel-17 | Confirmed (E-UTRA SIB31 for satellite assistance) | 36.331 SystemInformationBlockType31 |
| f4 | LTE FDD n+4 HARQ timing | Confirmed | 36.213 §8.0, §7.3.1 |
| f4 | Other "what breaks" items | **Reasoning** (labelled) | — |
| f5 | Test list | **Practice** (labelled) | — |
| f2, f6 | SpaceX statements: unmodified LTE phones, 1.6–2.7 GHz partner spectrum, "edge of where LTE works", 2.7 m × 2.3 m arrays, NR-NTN plans | **Removed / Gap G10**: source not reachable on 2026-11-13 | — |
