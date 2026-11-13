# Research — Module: KPIs and parameter tuning

Status: **done (R4)**, 2026-11-13. Sources: TS 32.450 V17.0.0 (E-UTRAN KPIs), TS 28.554 V17.17.0 (5G end-to-end KPIs), TS 38.331 V17.7.0, TS 36.331 V17.7.0, TS 38.322 V17.4.0.

| Lesson | v1 claim | Verdict | Source |
|---|---|---|---|
| g1 | Families: accessibility, retainability, mobility, integrity, availability/utilization | Confirmed + completed. LTE: Accessibility, Retainability, Integrity, Availability, Mobility, Energy Efficiency. 5G: Accessibility, Integrity, Utilization, Retainability, Mobility, Energy Efficiency, Reliability | 32.450 §6.1–6.6; 28.554 §6.2–6.8 |
| g1 | Drop rate = abnormal releases / all releases | **Corrected**: the 3GPP retainability KPI is abnormal releases of bearers/QoS flows "with data in a buffer", **normalized by session time** (5G unit "active release / second"). A per-release ratio is an operator practice | 32.450 §6.2.1; 28.554 §6.5.1 |
| g1 | Accessibility as success ratios | Confirmed (e.g. "ratio of the number of successfully performed registration procedures to the number of attempted registration procedures") | 28.554 §6.2.3 |
| g2 | Parameter names | **Corrected**: v1 used LTE names for everything. NR: `preambleReceivedTargetPower`, `prach-ConfigurationIndex`, `p0-NominalWithGrant` (PUSCH), `p0-nominal` (PUCCH); LTE: `preambleInitialReceivedTargetPower`, `prach-ConfigIndex`, `p0-NominalPUSCH`, `p0-NominalPUCCH`. RLC `t-Reordering` is LTE; NR has `t-Reassembly` | 38.331, 36.331 ASN.1 (name search); 38.322 §7.3 |
| g2 | Which parameter moves which KPI | **Practice** (labelled) | — |
| g3, g4 | Tuning method, dashboards | **Practice** (labelled) | — |
