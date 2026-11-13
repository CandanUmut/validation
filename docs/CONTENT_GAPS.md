# Content gaps

Things the app does not yet state as checked, with why. Each gap is shown in the app as "check this" or left out until a module's research closes it. Never fill a gap from memory.

| # | Where | Gap | Needs | Found in |
|---|---|---|---|---|
| G1 | Lesson e4 (v1 text) | "A satellite network that works as a roaming partner … the phone must decide to use the satellite PLMN only when it has no terrestrial coverage." No such rule in the specs read; PLMN choice is PLMN selection (TS 23.122) plus operator preferred-PLMN lists. **Removed from the lesson.** | TS 23.122 §4.4 (PLMN selection), operator practice | R1 |
| G2 | Lesson e8 | Network-side handover messages (Handover Request/Acknowledge, SN Status Transfer, Path Switch, UE Context Release) are named from general knowledge. | TS 38.423 (XnAP), TS 38.413 (NGAP), TS 36.423, TS 36.413 | R1 |
| G3 | Lesson e4 | AKA internals (how the USIM checks AUTN, SQN, MAC) not read. | TS 33.501 §6.1, TS 33.102 | R1 |
| G4 | Case RAN-009 "Fails for exactly twelve minutes" | Its best move is "reset the phone's NAS state (airplane mode cycle)". TS 24.301 §5.5.1.1 resets the attach attempt counter "when the UE is powered on" or "a USIM is inserted"; whether an airplane-mode toggle counts is up to each phone. | Case review (module 12 research) | R1 |
| G5 | Journey ch. 01 (LTE) | LTE S criterion stated without Squal and Qoffsettemp. NR's rule is checked (TS 38.304 §5.2.3.2); LTE's is in TS 36.304, not read. | TS 36.304 §5.2.3.2 | R1 |
| G6 | Lesson e10 | Order of PLMN selection (HPLMN/EHPLMN, user and operator controlled lists) kept general. | TS 23.122 §4.4.3 | R1 |
| G7 | All other modules | v1 lessons, journey steps, cases and facts outside RRC and NAS are unchecked and labelled so in the app. | Module research in the order of `CONTENT_PLAN.md` §4 | — |
