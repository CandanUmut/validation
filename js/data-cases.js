/* Case files: failure cases to work through.
   The log extracts are simplified teaching logs. They are not output from any real tool.
   nodes: decisions. Each option = [text, score 0..2, feedback]. 2 = best next move, 1 = reasonable but slower, 0 = wrong turn.
   cause: the root cause question. bug: a model bug title. learn: what to remember. */
const CASES = [
{id:"c-forbidden", t:"Attach works, then never again", tag:"Attach",
 brief:"A phone attaches fine in test 1. In test 7 of the same suite it shows no service on the same cell. Running test 7 alone passes.",
 setup:"LTE band 25, 5 MHz, one phone in a shield box, automated suite of 12 tests.",
 log:["10:02:11.120 [NAS] UL Attach Request","10:02:11.480 [NAS] DL Attach Accept","...","10:14:40.031 [TEST] test_05 start: reject_handling (network sends cause 11)","10:14:41.220 [NAS] UL Attach Request","10:14:41.515 [NAS] DL Attach Reject cause=11","10:14:41.520 [NAS] plmn 310-260 added to forbidden list","...","10:19:02.004 [TEST] test_07 start: attach_and_data","10:19:02.300 [RRC] cell found pci=214 plmn=310-260","10:19:02.301 [NAS] plmn forbidden, no attach attempt","10:20:02.010 [TEST] test_07 FAIL: UE not registered after 60s"],
 nodes:[
  {q:"Test 7 fails in the suite but passes alone. What is your first move?", o:[
   ["Read the log backwards from the failure to the last time attach worked",2,"Yes. Find the last good state and what happened between then and the failure."],
   ["Check the RF path: cables, attenuation, cell power",1,"Reasonable habit, but the log already shows the cell was found at 10:19:02. The radio is fine."],
   ["File a bug against the base station build",0,"Too early. You have not shown the product did anything wrong."]]},
  {q:"At 10:19:02 the phone finds the cell and then does nothing. Which line explains it?", o:[
   ["'plmn forbidden, no attach attempt'",2,"Right. The phone is obeying a rule it stored earlier."],
   ["'cell found pci=214'",0,"That line shows the radio works. It does not explain the silence."],
   ["'UE not registered after 60s'",0,"That is the test noticing the symptom, not the reason."]]},
  {q:"Where did the forbidden entry come from?", o:[
   ["Test 5 sent Attach Reject cause 11 on purpose and never cleaned up",2,"Yes. Cause 11 (PLMN not allowed) puts the PLMN on the forbidden list until it is cleared."],
   ["The SIM is faulty",0,"The SIM attached fine at 10:02."],
   ["The base station barred the cell",0,"SIB barring would show as 'cell barred', and the phone would not select the cell at all."]]}
 ],
 cause:{q:"Root cause?", o:["Phone bug: it ignores the cell","Test bug: test 5 leaves the PLMN on the phone's forbidden list","Base station bug: Attach Accept not sent","RF leakage in the shield box"], a:1,
  fb:"The phone behaves correctly. The suite leaves hidden state behind. Test 5 needs a teardown that clears the forbidden list (for example an airplane mode cycle or SIM refresh)."},
 bug:"test_05 reject_handling leaves PLMN 310-260 on the UE forbidden list; later attach tests fail (suite only)",
 learn:["Some reject causes change what the phone will try next, for a long time.","A test that passes alone and fails in a suite points to leftover state.","Every test must return the phone and the network to a known state."]},

{id:"c-rach-silent", t:"Preambles into the void", tag:"Random access",
 brief:"After a parameter change on the cell, phones at the edge of coverage can no longer connect. Phones near the cell are fine.",
 setup:"LTE 5 MHz. Yesterday someone changed PRACH settings to 'reduce uplink interference'.",
 log:["[RRC] SIB2 prach_cfg=3 target_pwr=-112dBm ramp=0dB preamble_max=4","[RRC] cell_select rsrp=-118dBm srxlev=6dB","[MAC] Msg1 preamble_id=21 tx_pwr=10dBm attempt=1","[MAC] RAR window expired","[MAC] Msg1 preamble_id=21 tx_pwr=10dBm attempt=2","[MAC] RAR window expired","[MAC] Msg1 preamble_id=21 tx_pwr=10dBm attempt=3","[MAC] RAR window expired","[MAC] Msg1 preamble_id=21 tx_pwr=10dBm attempt=4","[MAC] RA failed: max preamble attempts","[RRC] T300 expiry"],
 nodes:[
  {q:"Msg1 is sent four times with no response. What do you want to know first?", o:[
   ["Did the base station detect any preamble at those times?",2,"Yes. That splits the problem in two: not heard, or heard and the answer was lost."],
   ["Is the SIM provisioned?",0,"The phone has not sent any identity yet. The core is not involved at this stage."],
   ["Is downlink throughput normal?",0,"Not relevant before a connection exists."]]},
  {q:"The base station log shows no PRACH detection. Look at the four attempts. What stands out?", o:[
   ["Transmit power is 10 dBm every time",2,"Right. It never ramps, and it stays far below the phone's 23 dBm maximum."],
   ["The preamble ID is the same each time",1,"True, and unusual, but it would not stop detection. The power is the real clue."],
   ["Only four attempts were made",1,"That limits the chances, but four attempts at a good level would normally be enough."]]},
  {q:"Which settings explain a flat 10 dBm?", o:[
   ["ramp=0dB and a low target of -112 dBm",2,"Yes. The low target gives a weak first try, and a zero ramping step means it never gets stronger."],
   ["prach_cfg=3",0,"That sets when PRACH occurs, not the power."],
   ["q-RxLevMin",0,"That decides camping, not preamble power."]]}
 ],
 cause:{q:"Root cause?", o:["Phone bug: it does not ramp power","Configuration: PRACH target power too low and ramping step set to 0","RF path loss wrongly calibrated","Core network rejects the phone"], a:1,
  fb:"The phone follows SIB2 exactly. With no ramping, edge phones never reach a detectable level. Restore the ramping step and raise the target, then check uplink interference as the guard KPI."},
 bug:"RACH fails at cell edge after PRACH change: powerRampingStep=0 dB and target -112 dBm keep preamble at 10 dBm for all attempts",
 learn:["Preamble power is open loop: target plus path loss, then ramping.","A change that helps one KPI (interference) can break another (access at the edge).","Always check whether the receiver detected anything before blaming the sender."]},

{id:"c-msg3", t:"Heard, answered, then silence", tag:"Random access",
 brief:"On a long-delay test link, the phone gets a random access response every time but never completes the connection.",
 setup:"LTE cell through a channel emulator adding 2 ms of one-way delay.",
 log:["[MAC] Msg1 preamble_id=9 tx_pwr=14dBm attempt=1","[MAC] Msg2 RAR ta=1282 tc_rnti=0x51C0","[RRC] UL-CCCH RRCConnectionRequest","[MAC] Msg3 tx harq_tx=1","[MAC] Msg3 tx harq_tx=2","[MAC] Msg3 tx harq_tx=3","[MAC] Msg3 tx harq_tx=4","[MAC] contention resolution timer expired","[MAC] Msg1 preamble_id=40 tx_pwr=14dBm attempt=2","[MAC] Msg2 RAR ta=1282 tc_rnti=0x51C4"],
 nodes:[
  {q:"Msg2 arrives, Msg3 is sent four times, Msg4 never comes. Which direction is failing?", o:[
   ["Uplink: the base station is not decoding Msg3",2,"Yes. Msg3 keeps being retransmitted, which means it is never acknowledged."],
   ["Downlink: the phone cannot hear the cell",0,"It decoded Msg2, so the downlink works."],
   ["The core network",0,"Nothing has reached the core yet."]]},
  {q:"Look at Msg2. Which value deserves a closer look?", o:[
   ["ta=1282",2,"Right. 1282 is the maximum value the response can carry. It has hit the ceiling."],
   ["tc_rnti changes between attempts",0,"That is normal. Each attempt gets a new temporary identity."],
   ["preamble_id changes between attempts",0,"Normal. The phone picks a random preamble each time."]]},
  {q:"TA is stuck at its maximum of 1282, which covers about 100 km. The link has 2 ms one-way delay. What follows?", o:[
   ["The real delay needs more timing advance than the field can express, so Msg3 arrives late and cannot be decoded",2,"Yes. 2 ms one way is about 600 km. The phone advances as far as it is told, and it is not enough."],
   ["The phone ignores timing advance",0,"There is no sign of that. It applies what it gets."],
   ["Msg3 power is too low",1,"Possible in general, but power is 14 dBm with headroom, and the saturated TA is a direct explanation."]]}
 ],
 cause:{q:"Root cause?", o:["Phone transmits Msg3 with wrong power","Timing advance needed exceeds the LTE range; the common delay is not being absorbed on the network side","Contention between two phones","Wrong PRACH root sequence"], a:1,
  fb:"Standard timing advance tops out near 100 km. On a long link the network has to shift its own receive timeline by the common delay so that the phone's timing advance only covers the remainder."},
 bug:"Msg3 never decoded with 2 ms one-way delay: RAR timing advance saturates at 1282; common delay not compensated in eNB receive timing",
 learn:["A value sitting exactly at its maximum is a clue, not a coincidence.","Msg2 received and Msg3 failing points to timing advance or uplink quality.","Long-delay links need the common delay handled by the network."]},

{id:"c-mcs", t:"Twenty percent slower", tag:"Throughput",
 brief:"Downlink throughput dropped about 20% between build 4411 and build 4412. Same phone, same bench, same signal level.",
 setup:"LTE 10 MHz, conducted, RSRP -85 dBm, full-buffer UDP.",
 log:["build 4411:  cqi=12  mcs=22  rb=50  rank=2  bler=9.8%  dl=58.1 Mbps","build 4411:  cqi=12  mcs=22  rb=50  rank=2  bler=10.3%  dl=57.6 Mbps","build 4412:  cqi=12  mcs=18  rb=50  rank=2  bler=0.4%  dl=46.2 Mbps","build 4412:  cqi=12  mcs=18  rb=50  rank=2  bler=0.6%  dl=46.5 Mbps"],
 nodes:[
  {q:"Before you look for a cause, what do you confirm?", o:[
   ["That the drop repeats over several runs on both builds",2,"Yes. One run each proves nothing. Here both builds are stable across runs, so the drop is real."],
   ["That the developers changed the scheduler",0,"You do not know that yet. Evidence first."],
   ["Nothing, 20% is obviously a bug",0,"Run-to-run spread can be large. Always check it."]]},
  {q:"Throughput is made of RBs, MCS, rank and block errors. Which of them moved?", o:[
   ["MCS fell from 22 to 18 and BLER fell from 10% to under 1%",2,"Right. Same CQI, same RBs, same rank. The link is being driven more carefully than before."],
   ["The number of resource blocks",0,"It is 50 in both builds."],
   ["Rank",0,"Rank is 2 in both builds."]]},
  {q:"Same CQI, lower MCS, almost no block errors. What does that point to?", o:[
   ["Link adaptation: the CQI-to-MCS mapping or the outer loop target changed",2,"Yes. BLER far below 10% means the MCS is too conservative. Throughput is being left unused."],
   ["Worse radio conditions",0,"The CQI is unchanged, and BLER went down, not up."],
   ["A phone problem",0,"Same phone on both builds, and it reports the same CQI."]]}
 ],
 cause:{q:"Root cause?", o:["RF path degraded between runs","Link adaptation regression: the outer loop now settles far below the 10% BLER target","The phone reports wrong CQI","TCP window too small"], a:1,
  fb:"A BLER near zero is not good news here. The scheduler is too cautious. The next step is to bisect the changes between 4411 and 4412 and look at the outer-loop settings."},
 bug:"DL throughput -20% in build 4412: MCS 22 -> 18 at same CQI 12, BLER 10% -> 0.5% (outer-loop link adaptation too conservative)",
 learn:["Break throughput into RBs, MCS, rank and BLER. One of them will have moved.","Very low BLER usually means lost throughput.","State the evidence in the bug title: numbers, builds, conditions."]},

{id:"c-tcp", t:"UDP is fine, TCP is not", tag:"Throughput",
 brief:"On a link with extra delay, UDP downlink reaches the expected rate but TCP gets less than half of it.",
 setup:"LTE cell with added delay. HARQ round trip is now about 16 ms instead of 8.",
 log:["[IPERF] udp dl=17.6 Mbps loss=0.1%","[IPERF] tcp dl=7.9 Mbps retrans=3120","[RLC] rx sn=204 missing, t_reordering start 15ms","[RLC] t_reordering expiry, STATUS nack_sn=204","[MAC] harq=5 retx rv=2 crc=ok (sn=204 delivered)","[RLC] duplicate sn=204 discarded","[RLC] rx sn=231 missing, t_reordering start 15ms","[RLC] t_reordering expiry, STATUS nack_sn=231","[RLC] duplicate sn=231 discarded"],
 nodes:[
  {q:"UDP gets the full rate and TCP gets half. What does that tell you first?", o:[
   ["The radio capacity is there. Something TCP is sensitive to is wrong: delay, reordering or loss patterns",2,"Yes. UDP shows what the link can carry. TCP shows what the user gets."],
   ["The radio link is too weak",0,"UDP at full rate with 0.1% loss says the link is fine."],
   ["The server is too slow",1,"Worth ruling out, but the same server delivers UDP at full rate, and the RLC lines show something specific."]]},
  {q:"Read the RLC lines. What pattern repeats?", o:[
   ["The reordering timer expires, RLC asks for a retransmission, then the original arrives anyway and one copy is thrown away",2,"Right. RLC gives up on data that was still coming through HARQ."],
   ["HARQ is failing completely",0,"The HARQ retransmission succeeds each time (crc=ok)."],
   ["Sequence numbers are random",0,"They are in order. Only single PDUs are late."]]},
  {q:"The timer is 15 ms. The HARQ round trip is about 16 ms. What is the fix to test?", o:[
   ["Raise t-Reordering above the worst-case HARQ delay",2,"Yes. The timer has to outlast HARQ, or RLC retransmits needlessly and TCP sees delay and duplicates."],
   ["Lower the MCS",0,"The first-transmission errors are normal. The problem is the reaction to them."],
   ["Switch RLC to unacknowledged mode",0,"That removes reliability and would hurt TCP more."]]}
 ],
 cause:{q:"Root cause?", o:["Backhaul congestion","RLC t-Reordering (15 ms) shorter than the HARQ round trip on this link","iperf server CPU limit","Phone category too low"], a:1,
  fb:"Timers tuned for a normal 8 ms HARQ round trip break when the link gets longer. Every layer 2 timer needs to be checked against the real delay."},
 bug:"TCP DL at 45% of UDP rate with added delay: t-Reordering 15 ms < HARQ RTT 16 ms causes spurious RLC retransmissions and duplicates",
 learn:["Run UDP and TCP side by side to separate radio from transport.","Layer 2 timers must be longer than the delays below them.","Duplicates in a log mean something was retransmitted that did not need to be."]},

{id:"c-40s", t:"A drop every forty seconds", tag:"Mobility",
 brief:"In a field test under a satellite, the data session drops at a regular interval, about every 40 seconds.",
 setup:"Phone outdoors, clear sky, logging on. Network-side log available.",
 log:["12:00:41.210 [RRC] meas serv pci=301 rsrp=-119","12:00:41.900 [NET] beam switch 301 -> 302 scheduled 12:00:42.000","12:00:42.050 [PHY] rlm out_of_sync","12:00:42.250 [RRC] T310 start","12:00:43.250 [RRC] T310 expiry RLF","12:00:43.900 [RRC] ReestablishmentRequest pci=302 cause=otherFailure","12:00:44.010 [RRC] ReestablishmentReject","12:01:21.880 [NET] beam switch 302 -> 303 scheduled 12:01:22.000","12:01:22.040 [PHY] rlm out_of_sync","12:01:23.240 [RRC] T310 expiry RLF"],
 nodes:[
  {q:"The drops are regular. What does a fixed period suggest?", o:[
   ["Something scheduled, such as a beam or satellite change",2,"Yes. Random fading does not keep time. Line the drops up against scheduled events."],
   ["Random interference",0,"Interference would not repeat every 40 seconds to the second."],
   ["A weak battery",0,"Nothing in the log supports that."]]},
  {q:"Each drop follows a beam switch by about 50 ms. What is missing from the phone log before each switch?", o:[
   ["A handover command (RRCConnectionReconfiguration with mobility info)",2,"Right. The beam changes and the phone was never told to move."],
   ["A paging message",0,"Paging is for idle phones. This phone is connected."],
   ["A SIB1 update",0,"System information does not move a connected phone."]]},
  {q:"Re-establishment on the new beam is rejected. What does that add?", o:[
   ["The new beam has no context for the phone, so no handover was prepared",2,"Yes. Both findings agree: the switch happens with no handover preparation."],
   ["The phone's security keys are wrong",1,"A token mismatch can cause a reject, but together with the missing handover command, an unprepared target is the simpler explanation."],
   ["The new beam is overloaded",0,"Possible in general, but it would not explain the missing handover command."]]}
 ],
 cause:{q:"Root cause?", o:["Phone bug in radio link monitoring","Beam switch happens without a handover being triggered or prepared for connected phones","T310 is set too short","The phone moved out of coverage"], a:1,
  fb:"The phone does what the standard says when its cell vanishes. The network side must trigger a handover before each scheduled switch, and prepare the target so re-establishment can work as a fallback."},
 bug:"RLF 50 ms after every beam switch (period ~40 s): no handover command sent before switch; re-establishment on new beam rejected (no UE context)",
 learn:["A regular pattern points to a scheduled cause.","Check what is missing, not only what is present.","Two independent clues that agree make a strong root cause."]},

{id:"c-t304", t:"The handover that goes nowhere", tag:"Mobility",
 brief:"Handover from cell 214 to cell 37 fails about one time in three. The other direction is fine.",
 setup:"Two LTE cells on a bench with programmable attenuators.",
 log:["[RRC] MeasurementReport event=A3 nbr_pci=37 rsrp=-101","[X2AP] HandoverRequest target_pci=37","[X2AP] HandoverRequestAcknowledge preamble_id=52","[RRC] RRCConnectionReconfiguration mobilityControlInfo target_pci=37 t304=100ms","[MAC] RA target pci=37 preamble_id=52 attempt=1 tx_pwr=2dBm","[MAC] RAR window expired","[MAC] RA target pci=37 preamble_id=52 attempt=2 tx_pwr=4dBm","[MAC] RAR window expired","[RRC] T304 expiry: handover failure","[RRC] ReestablishmentRequest pci=214 cause=handoverFailure"],
 nodes:[
  {q:"Which half of the handover failed?", o:[
   ["Execution: preparation finished, the command arrived, access to the target failed",2,"Yes. Request, acknowledge and command are all in the log."],
   ["Preparation: the target refused",0,"The target acknowledged and assigned preamble 52."],
   ["The measurement report was lost",0,"The report is the first line of the log."]]},
  {q:"The phone made two preamble attempts before T304 expired. What do you notice?", o:[
   ["Power started low (2 dBm) and only two attempts fit into 100 ms",2,"Right. The phone was still ramping when the timer ran out."],
   ["The preamble ID is wrong",0,"It uses 52, the one the target assigned."],
   ["The phone used contention-based access",0,"It used the dedicated preamble."]]},
  {q:"What do you test next?", o:[
   ["A longer T304, and the target cell's PRACH target power",2,"Yes. Either give the phone time to ramp, or let it start closer to a detectable level. Then check that failures stop."],
   ["A smaller A3 offset",1,"That changes when handover starts. It may help a little by handing over at a stronger target level, but it does not address the short timer."],
   ["Disable handover",0,"That removes the feature, not the bug."]]}
 ],
 cause:{q:"Root cause?", o:["Phone ignores the handover command","T304 of 100 ms is too short for the power ramping needed on the target cell","X2 link failure","PCI confusion"], a:1,
  fb:"T304 must cover the worst realistic access time to the target, including several ramping steps. On long-delay links it needs even more room."},
 bug:"HO 214 -> 37 execution fails 1 in 3: T304=100 ms expires after 2 preamble attempts (2, 4 dBm) while still ramping",
 learn:["Split handover into preparation and execution before anything else.","Timers and power ramping interact. A short timer hides behind a 'radio' symptom.","Asymmetric failures (one direction only) point to one cell's settings."]},

{id:"c-qrx", t:"Camped but cannot connect", tag:"Coverage",
 brief:"At low signal, phones show service bars but most connection attempts fail with T300 expiry.",
 setup:"LTE 5 MHz. Coverage test stepping the attenuation up.",
 log:["[RRC] SIB1 q_rxlevmin=-140dBm","[RRC] cell_select rsrp=-131dBm srxlev=9dB state=IDLE camped","[MAC] Msg1 tx_pwr=23dBm attempt=1","[MAC] RAR window expired","[MAC] Msg1 tx_pwr=23dBm attempt=2","[MAC] RAR window expired","[MAC] Msg1 tx_pwr=23dBm attempt=5","[MAC] Msg2 RAR ta=3","[MAC] Msg3 tx harq_tx=4 (max)","[RRC] T300 expiry"],
 nodes:[
  {q:"The phone is camped at RSRP -131 dBm. What is the preamble power on the first attempt?", o:[
   ["23 dBm, the phone's maximum, from the first try",2,"Yes. The phone has nothing left to give. This is a link budget limit, not a tuning detail."],
   ["Low, with room to ramp",0,"Look again: attempt 1 is already at 23 dBm."],
   ["It is not shown",0,"It is in the first MAC line."]]},
  {q:"Downlink still works well enough to camp and decode Msg2 once. Uplink fails. Why would the phone camp here at all?", o:[
   ["q-RxLevMin is -140 dBm, so the S criterion passes far below where the uplink can reach",2,"Right. The camping threshold only looks at downlink level. It is set lower than the uplink can support."],
   ["The phone has a bug in cell selection",0,"srxlev=9 dB is correct arithmetic for the broadcast value."],
   ["The cell is barred",0,"A barred cell would not be selected."]]},
  {q:"What is the right change to test, and what is the cost?", o:[
   ["Raise q-RxLevMin so phones only camp where the uplink works. Cost: a smaller service area on paper",2,"Yes. Honest coverage is better than bars that do not work. Check access success rate at the edge before and after."],
   ["Raise the PRACH target power",0,"The phone is already at maximum power. A higher target changes nothing."],
   ["Lengthen T300",1,"More time allows a few more tries, but the uplink still cannot close. It hides the problem."]]}
 ],
 cause:{q:"Root cause?", o:["Phone transmit power is faulty","q-RxLevMin set too low: phones camp where the uplink cannot reach the cell","Core network overload","Wrong band"], a:1,
  fb:"Downlink and uplink budgets differ. The base station can transmit far more power than a phone. The camping threshold has to reflect the weaker direction."},
 bug:"T300 expiry on most attempts below RSRP -128 dBm: q-RxLevMin=-140 dBm lets UEs camp beyond uplink reach (preamble at 23 dBm from first attempt)",
 learn:["Service bars come from the downlink. Access needs the uplink.","When the phone is already at 23 dBm, look at link budget, not power settings.","Name the cost of every parameter change."]},

{id:"c-backoff", t:"Fails for exactly twelve minutes", tag:"Attach",
 brief:"After a core network restart during a test, a phone refuses to attach. An engineer power-cycles the cell and still nothing. Twelve minutes later it attaches by itself.",
 setup:"LTE lab cell and core. The core was restarted at 14:00:10.",
 log:["14:00:12 [NAS] UL Attach Request (attempt 1)","14:00:27 [NAS] T3410 expiry","14:00:37 [NAS] UL Attach Request (attempt 2)","14:00:52 [NAS] T3410 expiry","...","14:01:52 [NAS] UL Attach Request (attempt 5)","14:02:07 [NAS] T3410 expiry","14:02:07 [NAS] attempt counter=5, T3402 start","14:05:00 [TEST] core is back, cell restarted by operator","14:05:30 [RRC] camped pci=214, no attach attempt","14:14:07 [NAS] T3402 expiry","14:14:07 [NAS] UL Attach Request","14:14:08 [NAS] DL Attach Accept"],
 nodes:[
  {q:"From 14:00 to 14:02 the phone tries five times, 25 seconds apart. Is the phone misbehaving?", o:[
   ["No. That is T3410 (15 s) plus T3411 (10 s), repeated five times, as specified",2,"Right. The spacing matches the standard timers exactly."],
   ["Yes, it should retry faster",0,"The retry timing is defined by the standard."],
   ["Yes, it should stop after one failure",0,"Five attempts is the specified behavior."]]},
  {q:"At 14:05 the core is back and the phone is camped, but it does not try. Why?", o:[
   ["T3402 is running: after five failures the phone waits 12 minutes before it tries again",2,"Yes. 14:02:07 plus 12 minutes is 14:14:07, exactly when it attaches."],
   ["The cell is barred after restart",0,"The phone camped on it, so it is not barred."],
   ["The phone crashed",0,"It attaches by itself later, on a timer."]]},
  {q:"How should the test automation handle this?", o:[
   ["Reset the phone's NAS state (airplane mode cycle) after any core outage, and record that it did so",2,"Yes. That clears the attempt counter and T3402, and the log shows why."],
   ["Add a 15-minute sleep to every test",0,"That wastes hours and hides the state problem."],
   ["Report it as a phone bug",0,"The phone follows the specification."]]}
 ],
 cause:{q:"Root cause?", o:["Phone firmware hang","Standard NAS back-off: T3402 (12 min) after five failed attach attempts during the core outage","Cell misconfigured after restart","SIM blocked"], a:1,
  fb:"Nothing is broken. The lab and the automation need to know about NAS back-off, and recover the phone deliberately after an outage."},
 bug:"Not a product bug. Lab note: after core outage, UEs sit in T3402 back-off for 12 min; framework must cycle airplane mode before the next test",
 learn:["Retry patterns with exact spacing are usually timers working as designed.","Know T3410 (15 s), T3411 (10 s) and T3402 (12 min) by heart.","Not every failure is a bug. Saying so, with evidence, is part of the job."]},

{id:"c-bler", t:"Good signal, bad blocks", tag:"PHY",
 brief:"During an emulated satellite pass, block errors climb to 40% in the middle of the pass even though reported signal quality stays good.",
 setup:"LTE cell, channel emulator replaying delay and Doppler of an overhead pass.",
 log:["t=20s  elev=35deg  sinr=11dB  freq_err=+0.4kHz  drift=-60Hz/s   mcs=12  bler=9%","t=40s  elev=62deg  sinr=13dB  freq_err=+1.1kHz  drift=-210Hz/s  mcs=14  bler=24%","t=50s  elev=88deg  sinr=14dB  freq_err=+2.3kHz  drift=-390Hz/s  mcs=14  bler=41%","t=60s  elev=64deg  sinr=13dB  freq_err=+1.2kHz  drift=-220Hz/s  mcs=13  bler=26%","t=80s  elev=36deg  sinr=11dB  freq_err=+0.3kHz  drift=-55Hz/s   mcs=12  bler=10%"],
 nodes:[
  {q:"BLER is worst at t=50 s. What else peaks at that moment?", o:[
   ["Frequency error and its rate of change (drift)",2,"Yes. Both peak when the satellite is overhead, which is where Doppler changes fastest."],
   ["Nothing, the SINR is at its best",1,"SINR is at its best, which is exactly why it cannot be the cause. Look at the other columns."],
   ["The MCS",0,"MCS 14 is also used at t=40 s with a lower BLER."]]},
  {q:"Why is the Doppler rate highest at the top of the pass, where the Doppler shift itself is near zero?", o:[
   ["The satellite's motion toward the phone turns into motion away, so the shift changes sign quickly",2,"Right. The shift crosses zero overhead, and that is where it changes fastest."],
   ["The satellite speeds up overhead",0,"Orbital speed is constant. The geometry changes."],
   ["The path loss is lowest overhead",0,"True, but that is about signal level, not frequency."]]},
  {q:"A leftover frequency error of 2.3 kHz against 15 kHz subcarriers. What does it do to the signal, and why does the reported SINR not show it?", o:[
   ["It causes interference between subcarriers. An averaged SINR measured on reference signals can miss it",2,"Yes. Always ask whether a quality number is measured on the same thing, at the same time, as the data."],
   ["It lowers the received power",0,"Power is unchanged. The damage is to orthogonality."],
   ["It delays the HARQ feedback",0,"Frequency error does not change timing."]]}
 ],
 cause:{q:"Root cause?", o:["Too little transmit power overhead","Doppler pre-compensation does not follow the fast Doppler change near the top of the pass, leaving a large residual offset","Wrong TDD pattern","RLC timer too short"], a:1,
  fb:"The compensation has to update fast enough for the highest Doppler rate, not only for the largest shift. The test to add: BLER against Doppler rate, across the whole pass."},
 bug:"BLER 41% at max elevation despite SINR 14 dB: residual frequency error 2.3 kHz when Doppler rate peaks (-390 Hz/s); pre-compensation update too slow",
 learn:["Find which column moves together with the symptom.","An average quality number can hide short or structured impairments.","On a satellite pass, Doppler shift and Doppler rate peak at different moments."]},

{id:"c-dnn", t:"Registered, no internet", tag:"5G SA",
 brief:"A new phone model registers on the 5G standalone network but has no data. Other models work.",
 setup:"NR SA, n25. Lab core with one data network configured: 'internet'.",
 log:["[NAS] UL Registration Request","[NAS] DL Registration Accept","[NAS] UL Registration Complete","[NAS] UL PDU Session Establishment Request dnn=ims","[NAS] DL PDU Session Establishment Reject cause=27","[NAS] UL PDU Session Establishment Request dnn=ims","[NAS] DL PDU Session Establishment Reject cause=27","[APP] no network connection"],
 nodes:[
  {q:"Registration completed. Which procedure failed?", o:[
   ["PDU session establishment",2,"Yes. In 5G the data session is a separate step after registration."],
   ["Authentication",0,"Registration was accepted, so authentication passed."],
   ["Random access",0,"The phone is connected and exchanging NAS messages."]]},
  {q:"The reject carries cause 27. What does that mean for a session request?", o:[
   ["Missing or unknown DNN: the core does not know the data network the phone asked for",2,"Right. The phone asks for 'ims' and this core only has 'internet'."],
   ["Congestion",0,"That is cause 22 at mobility level, or 26 (insufficient resources) at session level."],
   ["Illegal UE",0,"That is cause 3, and it would have stopped registration."]]},
  {q:"Is this a phone bug, a network bug or a lab setup gap?", o:[
   ["A lab setup gap first: this model asks for a data network the test core does not offer. Then check that it also requests 'internet'",2,"Yes. Decide by evidence. The fix may be in the lab config or in the phone's profile for this network."],
   ["A phone bug, because other phones work",1,"Other phones may simply request 'internet' first. The difference matters, but it does not prove a defect."],
   ["A base station bug",0,"The base station only relays these NAS messages."]]}
 ],
 cause:{q:"Root cause?", o:["gNB drops the data bearer","Phone requests DNN 'ims' only; the lab core has no such DNN and rejects with cause 27","SIM not provisioned for 5G","Wrong frequency band"], a:1,
  fb:"Interoperability work is full of this: one model takes a different path. Record exactly what it asked for and what the network offers, then decide where the fix belongs."},
 bug:"Model X: registered but no data on SA. PDU session request uses dnn=ims only; core rejects cause 27 (unknown DNN). Other models request dnn=internet",
 learn:["In 5G, 'registered' does not mean 'has data'.","Read the cause value and the requested names before anything else.","One model failing is a difference to explain, not automatically a phone defect."]},

{id:"c-sms", t:"The late text", tag:"Paging",
 brief:"Text messages over a satellite link sometimes arrive three to four minutes late. Most arrive in seconds.",
 setup:"Phone in idle, outdoors, partial constellation with gaps between passes.",
 log:["09:10:02 [CORE] SMS for ue A queued","09:10:02 [CORE] paging attempt 1 tai_list=A1","09:10:08 [CORE] paging attempt 2","09:10:20 [CORE] paging attempt 3, no response, retry in 180s","09:09:40 [UE] no service","09:12:15 [UE] service restored pci=330","09:13:20 [CORE] paging attempt 4","09:13:21 [UE] Paging match, Service Request","09:13:23 [UE] SMS received"],
 nodes:[
  {q:"The log has timestamps from two sources. What must you check before trusting the order?", o:[
   ["That the phone clock and the core clock are synchronized",2,"Yes. A timeline built from unsynchronized clocks leads to wrong conclusions. Here they are, so carry on."],
   ["Nothing, logs are always in order",0,"Notice the 09:09:40 phone line appears after 09:10:20. Sources are interleaved."],
   ["The SMS length",0,"Not relevant to delay of this size."]]},
  {q:"Where was the phone during paging attempts 1 to 3?", o:[
   ["Out of coverage, from 09:09:40 to 09:12:15",2,"Right. All three pages were sent into a gap."],
   ["Connected and busy",0,"The log shows 'no service'."],
   ["In another tracking area",0,"Nothing suggests it moved. It simply had no satellite in view."]]},
  {q:"Coverage came back at 09:12:15 but the SMS arrived at 09:13:23. What caused the extra minute?", o:[
   ["The core's retry timer: it waits 180 s after the third failed page",2,"Yes. The phone was reachable for over a minute before anyone tried again."],
   ["The paging cycle of the phone",0,"A paging cycle is around a second, not a minute."],
   ["Slow random access",0,"Once paged at 09:13:20, the phone answered within a second."]]}
 ],
 cause:{q:"Root cause?", o:["Phone missed its paging occasion due to a clock error","Pages sent during a coverage gap, then a fixed 180 s core retry delay after coverage returned","SMS center overload","Wrong tracking area list"], a:1,
  fb:"Nothing failed on the radio. The delay is a design interaction between coverage gaps and the paging retry schedule. A better schedule would page again when coverage is predicted to return."},
 bug:"SMS delayed 3 min 21 s: three pages sent during a coverage gap (09:09:40 to 09:12:15); next page only after fixed 180 s retry",
 learn:["Synchronize clocks before a field test, and confirm it in the log.","End-to-end delays often come from retry timers, not from the radio.","Split a delay into its parts and give each part a number."]}
];
