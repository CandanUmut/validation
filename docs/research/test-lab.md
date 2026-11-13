# Research — Modules: Test strategy and automation; Lab and RF

Status: **done (R4)**, 2026-11-13. These are engineering-practice topics. Lessons carry `source: practice`: spec facts are checked, everything else is labelled *In practice*.

| Lesson | Claim | Verdict | Source |
|---|---|---|---|
| i1 | UE RF conformance spec TS 38.521-1 | Confirmed (title) | Reference [4] in TS 38.101-5: "NR; User Equipment (UE) conformance specification; Radio transmission and reception; Part 1: Range 1 Standalone" |
| i1 | TS 38.523, TS 36.521, TS 36.523; GCF, PTCRB | **Gap G12**: numbers not opened in this research; certification bodies are industry practice | — |
| i1–i6 | Test types, plans, frameworks, flaky tests, CI, base station as DUT | **Practice** | — |
| j1 | dB arithmetic | Confirmed by calculation: 10^0.3 = 1.995; 23 dBm = 199.5 mW; −174 + 10·log10(4.5 MHz) = −107.5 dBm; +7 dB NF → −100.5 dBm; 10·log10(12 × 25) = 24.8 dB | — |
| j1 | 23 dBm power class 3 | Confirmed | TS 38.101-1 Table 6.2.1-1 |
| j2–j5 | Lab components, conducted vs OTA, troubleshooting, reliability | **Practice** | — |

Lessons re-marked `practice` in other modules (spec facts in them already checked): d3, f5, g3, g4, h1, h2, h3.
