# Three Houses — progression review

Updated: 2026-11-04 (Pacific)
Status: **Review amended to Pete's November 4 comments; not implemented.** Shared introductory recognition, contracting-House-only refresh, gentler decay and favor-based rivalry below supersede the initial recommendations. The working rivalry amount adopts Pete's suggested 1/20. Other class/pay recommendations remain as previously reviewed. Continuing to [VHM/Bruckner](faction-reputation-vhm.md); Combine/CHR runtime remains live, while House gains/decay/locks and repricing remain pending.

Authority: [approved income targets](faction-reputation-income-targets.md), [caps/mix](faction-reputation-income-calibration.md), [progression framework](faction-reputation-progression.md). Existing programmes: [economy](economy.md#faction-house-mendes), `alvares-contracts.ts`, `mendes-contracts.ts`, `nunes-contracts.ts`, `nunes-inquiries.ts` under `src/content/estella/faction-contracts/`. Prior entity: [Cerberus](faction-reputation-cerberus.md).

## Approved constraints, not reopened

| House | Newly unlocked commercial medians 0 / 1 / 2 | Level-0 ceiling | Level-1 ceiling |
|---|---|---:|---:|
| Alvares | 5k / 60k / 100k | 32,500 | 80,000 |
| Mendes | 5k / 50k / 90k | 27,500 | 70,000 |
| Nunes | 5k / 40k / 75k | 22,500 | 57,500 |

Net means completion pay plus reimbursement minus par fuel, before penalties, maintenance, positioning and time. Equality stays in the lower band. Access meets **both quoted-income and authored trust minima**. Approximate 20/60/20 applies to the remaining commercial pool, not important work or a quota on each board. Importance does not imply hostility. No direct penalty merely for serving another House. Only special quests can advance 2→3.

## Revised gains and maintenance

- All three: below 1, each successful direct House contract gives **+1/4 to the contracting House and +1/8 to each other House**, independently capped at 1. Four own jobs reach recognition; eight jobs solely for other Houses can also introduce a House. Mixed service combines these credits. No introductory award spills above 1; no passive erosion below 1.
(zzz: I recommend that one House's job gives +1/4 to the House rep, and also +1/8 to the OTHER houses' rep. This is to represent the common framework of vassal service. Capped at 1, of course - this is just to earn recognition)

**Resolution:** adopted. This is explicit cross-House completion credit for shared vassal service, not a merger of tracks or an automatic consequence of inherited employer recognition. It applies to both routine and important direct House jobs; Accord/lesser-noble contracts do not acquire these awards.
- Alvares/Nunes: important completions add **1/15 from 1 to 2**. Fifteen important deliveries, not fifteen lifetime jobs.
- Mendes: preserve the earlier **proposed 3:4:2** preference for Hydra-local outbound / outer outbound / returns, scaled to a bar of 40. Local outbound +3/40 (**14 jobs**), outer outbound +4/40 (**10 jobs**), all returns +2/40 (**20 jobs**). These are proposed normalized awards; the older raw point weights were never implemented. A mixture accumulates the same weights; the final award stops at 2. This preserves the old programme's distinction while fitting the 10–20-job direction.
- Ordinary own work stops awarding progress at 1; every successful own job still resets that House's grace. Important work also stops awarding progress at 2 and maintains any quest-earned fraction above it. (zzz: grace is only reset for the contracting house, not all 3)

**Resolution:** confirmed: reset only the contracting House. The other two do not refresh grace even when receiving +1/8 introductory recognition; the completion consumes one unrelated-count slot for each. At/above 1, shared recognition awards nothing.

- Independent **K=7** unrelated completed contracts, then **D=1/40** starting on the eighth, protecting the current integer floor. Empty/Old Nell travel, waiting and maintenance do not consume grace. Failures/retries/abandonments award/count nothing under this initial pass. Combine/CHR retain their separate K=5, D=1/30 rules. (zzz: change it to K=7 and D=1/40, the Houses are more forgiving)

**Resolution:** adopted for the Houses only. A specified favor-rivalry hit replaces passive decay for that House on the event, not its unrelated-counter increment.

- Above the introductory band, serving one House never advances or refreshes another. Other-House routine work consumes passive grace but is not a direct rivalry hit unless explicitly listed below. Accord/other-noble recognition does not identify a donor to reward.
- Implement exact rational increments without broadly rounding arbitrary saved standings. A 1/120 arithmetic grid accommodates quarters, eighths, fifteenths, twentieths and fortieths; this requires no new save field or eager migration. Integer floors and award caps still apply.

## Recommended important classes and trust

All newly selected important jobs below require **1**, not 2. New non-Inquiry important quotes target **5,000 cr net at par**, independently of route fuel reimbursement. Preserve existing actual-fuel ratio/cap. A higher-priced **existing unaccepted quote** still has its quoted economic minimum; an already accepted job is neither repriced nor cancelled.

| House | Important at 1 | Remaining commercial work |
|---|---|---|
| Alvares | `grant:*`, `escheat:*`; official `occasion:*:delegation:*` and `delegation-return` movements | `due:*`, `assigned:*`; occasion freight, subsidized retinues, retinue returns and reusable-equipment returns |
| Mendes | All named local/outer muster outbound freight/passengers and return freight/passengers | `forge-intake:*` from Serrat Domain Shipyard and Cadiz Highport |
| Nunes | `recovery:*`, `recovery-return:*`, `recovery-passengers:*`, `quiet-custody:*`, `quiet-custody-passengers:*`; linked `inquiry:*` with the exception below | `outer-watch:*`, `outer-watch-passengers:*`, `outer-watch-return:*` |

For Alvares, routine assessments are the way to earn initial recognition; grants, court custody and official representation are entrusted service. No premium threshold follows simply from being a noble passenger. For Mendes, all muster copy already calls the movement an important service: do not arbitrarily declare some cargo names ordinary to force the commercial ratios. For Nunes, recovery and learned patronage give alternatives to sensitive custody.

**No extra trust-2 classes proposed in this pass.** Expensive ordinary work requires 2 economically; it remains non-advancing. In particular do not lock Nunes recovery or Mendes outbound work behind the standing they are supposed to earn. Stable provider/template structure selects the class, never display names, cargo label searches, endpoint ownership or salary.

### Nunes Inquiry exception — explicit proposal

Keep the existing Inquiry authoring terms **0.25 generosity + 0.75 fuel reimbursement, 20,000 cr flat fee, cap 2×**. Current net at par is 20,000–20,001 cr because fixed/reimbursement buckets round separately. Do not silently reduce this to 5k or add a second 5k reward. Inquiry work stays out of the commercial calibration, as it already does.

Recommend trust **1** and +1/15 per successful linked delivery from 1→2, alongside its existing **+8 Inquiry progress**. The trust requirement would be a new access restriction; it is not live now. Existing accepted Inquiry contracts remain valid. Regular outer-watch work supplies the path to 1 before taking these learned patronage assignments.

Keep all twelve subjects, three active Inquiries, 100-point target, 0.25/day passive progress, ordinals, rollover/history and accepted-instance protection. **Passive research progress or Inquiry closure grants no House reputation.** These repeatable programmes are not rank-3 special quests. A delivery that closes an Inquiry receives one normal delivery award, not a closure bonus. Calendar advancement must never create unearned House levels.

## Rivalry — favor, not an inferred attack

**Initial reasoning below is retained as review history, not the selected policy.** Pete rejects requiring an explicit opposing-House target: certain work earns a rival's favor and is disfavored for that reason. The following content observations remain factual but no longer justify omitting all direct losses:

- An Alvares escheat order names a judgment and receiving institution, but not which senior House owns the seized property or contests the writ. Ordinary dues/grants are not automatically anti-Mendes or anti-Nunes.
- Mendes musters include standards inspections, exercises, casualty work and returns. Even a weapons shipment has no authored campaign target; neither the provider tag nor a landing at another House's region supplies one.
- Nunes quiet custody mixes evidence, protected witnesses, counter-interrogation patients, released exiles and guarded transfers. The family does not identify an opposing senior House. Its passenger variants share the same template structure; cargo-label inference would be especially unsafe.
- Nunes recovery/medical work and learned patronage do not automatically antagonize Alvares/Mendes. An official Alvares delegation does not establish a contested succession just because its occasion is a succession recognition.

(zzz: I disagree. It's not that the teamster is working against the House, it's the fact they they are working FOR the rivals' favor. So, Alvares escheat, Mendes musters and Nunes inquiries work should impose a slight rep penalty with the other 2 houses. maybe 1/20).

**Resolution:** adopt favor-based losses for exactly these existing classes, using **−1/20 (−0.05) to each other House** as the working amount Pete suggested:

| Completed favor work | Disapproving Houses |
|---|---|
| Alvares `escheat:*` | Mendes and Nunes |
| All Mendes named muster outbound/return freight/passengers | Alvares and Nunes |
| Nunes linked `inquiry:*` deliveries | Alvares and Mendes |

This is a political assessment of service, not a claim that cargo attacks another House or that an Inquiry is espionage. Alvares grants/delegations, Mendes forge intake, Nunes recovery/quiet custody/watch and other routine jobs receive no new direct penalty. No invented story event or contract rewording is needed to infer a target; standardized ship-computer notices disclose the authored disapproval.

**Event ordering:** evaluate each recipient's pre-event band. The contracting House earns its applicable introductory/important award and alone resets grace. Each other House below 1 receives capped +1/8 recognition; the rival loss cannot lower a below-1 score or turn this into a free promotion to 1. At/above 1 there is no shared credit, and listed favor work applies −0.05, floored at 1, with no additional passive loss that event. Other completions use the seven-job grace then −1/40, with integer floor. Every non-own completion increments the counter once; introductory recognition never resets it. Thus a single favor delivery can advance the employer, introduce one unestablished House and reduce another established House. An award reaching 1 does not also qualify for a 1→2 award on that same completion.

Examples: a recipient at 0.90 becomes 1, not 0.95; one at 1 remains 1; one at 2 becomes 1.95. For a mixed state, successful Alvares escheat at Alvares 1 / Mendes 0.75 / Nunes 2 yields 1+1/15 / 0.875 / 1.95. The protected first rank and early common recognition remain compatible with the later rivalry. At exact floors the UI must not promise a loss it cannot apply.

For the approved **House level 3 → other two Houses refuse new work**, recommend following the current Combine implementation: evaluate current completed standing, retain visible locked postings, no persistent allegiance flag or score truncation, no cancellation of accepted jobs. This would apply to all new direct House work, including routine and Inquiry postings, regardless of a sufficient income/trust minimum. Accord and lesser nobles remain independent and keep their capped recognition; they do not inherit a senior House's refusal. No docking, service, emergency-repair or public-board discovery ban. Future rank-3 quests still need commitment warnings, outstanding-obligation handling and a recovery/renunciation design.

## Read-only income/access projection

`tests/audit-house-reputation.ts` classifies the proposal **only in test tooling**. It refits each remaining commercial pool using the existing fixed-workload fitting/evaluation algorithm; important pay is separately projected at 5k and Inquiry quotes are copied unchanged. This is a candidate refit, not new runtime price curves. It counts actual public freight/passenger postings equally, including appearance at distinct canonical terminals, rather than raw candidates, unique routes or earnings/hour.

Reference uses the retained day-0–15 census, reconstructed with current pricing; House source generators have not changed. Fresh live boards cover the first sampled outer-muster window, the Alvares return phase, and a later occasion. Reference curves remain fixed for all later samples; no seasonal refit or random splitting of tied workloads.

| Days | House | Commercial / important / Inquiry offers | Proposed ordinary mix 0 / 1 / 2 | Starter freight |
|---|---|---|---|---:|
| 0–15 reference | Alvares | 331 / 139 / 0 | 19.9 / 60.1 / 19.9 | 50 |
| 0–15 reference | Mendes | 49 / 96 / 0 | 24.5 / 55.1 / 20.4 | 12 |
| 0–15 reference | Nunes | 119 / 181 / 329 | 20.2 / 59.7 / 20.2 | 21 |
| 59–74 outer muster | Alvares | 336 / 134 / 0 | 19.9 / 57.7 / 22.3 | 51 |
| 59–74 outer muster | Mendes | 51 / 207 / 0 | 23.5 / 54.9 / 21.6 | 12 |
| 59–74 outer muster | Nunes | 98 / 172 / 326 | 20.4 / 61.2 / 18.4 | 18 |
| 120–135 occasion returns | Alvares | 335 / 137 / 0 | 18.5 / 58.5 / 23.0 | 46 |
| 120–135 occasion returns | Mendes | 49 / 156 / 0 | 16.3 / 63.3 / 20.4 | 8 |
| 120–135 occasion returns | Nunes | 101 / 175 / 352 | 18.8 / 58.4 / 22.8 | 17 |
| 180–195 next occasion | Alvares | 331 / 138 / 0 | 26.9 / 52.0 / 21.1 | 76 |
| 180–195 next occasion | Mendes | 46 / 155 / 0 | 21.7 / 63.0 / 15.2 | 10 |
| 180–195 next occasion | Nunes | 103 / 177 / 350 | 20.4 / 56.3 / 23.3 | 19 |

All nine reference commercial medians exactly match the approved targets. Later medians stay within 7% in these samples; mix drift is more noticeable, especially Alvares's next occasion and Mendes's small intake pool. The 20/60/20 goal remains approximate, not an excuse to relabel important jobs or manufacture per-board supply. Excluding important jobs means most **total** Nunes/Mendes postings are not commercial; the 20/60/20 denominator must be shown explicitly.

### Practical entry, and limits of the evidence

- **Alvares:** public producer pickups include The Count's Well (Beira), Ember Court Foundry (Tinto) and Marcher Wells (Calatrava) → Herald Gate. These provide freight introductions without requiring the House's higher-trust grants. Empty relocation back to a public producer is allowed; after 1, grants provide an outbound service route. Other employers can fund travel between jobs.
- **Mendes:** all sampled level-0 intake freight starts at **Serrat Domain Shipyard**, not Cadiz. Both the shipyard and Banner Forge are public. Starting from zero, a first intake job ends at the Forge with 0.25 Mendes recognition; return empty or via other employers for more pickups. Four own jobs reach 1, or recognition from service to the other Houses can contribute before arrival. Below-1 progress does not decay. Then the Forge's muster pool opens. Do not claim that every Forge board has an entry job or that Cadiz currently supplies the entry band.
- **Nunes:** the publicly accessible **Far Bell Tower → Blackglass** watch-return route supplies starter freight. Most starter freight needs the existing fragile-cargo qualification; occasional alternatives have no explicit specialist certificate. Castle Nunes/Blackglass also have entry offers but remain restricted empty-arrival sites. A public contract authorizes arrival; do not invent a discovery/contact prerequisite. Guild qualification and funding remain independent prerequisites, not House-reputation rewards.
- The audit reports explicit `requiredCertification`, not every flight/equipment requirement. It does not prove that a fresh, unqualified, cashless career can immediately start at any House. Empty positioning costs, maintenance, calendar waiting, current equipment and return routing need actual completion-path/playtest validation before enabling gates.
- Important freight exists for all three; no passenger-only compulsory path is proposed. Nunes recovery gives a non-custody, non-disapproved advancement path; Inquiry work avoids custody but now carries favor-based disapproval. Alvares grants advance without escheat/disapproval. All Mendes advancement musters carry the selected slight losses. Shared introductory credit also lets service elsewhere introduce a House before visiting its own starter route. The income/supply tables above are unchanged by these progression amendments; they do not simulate shared recognition or rivalry pacing.

## Validation and implementation boundary

- **November 4 amendment:** 4,491 review checks now include quarter/eighth introductions, contracting-House-only counter reset, seventh/eighth unrelated completions, the three explicit favor classes, fractional/integer floors and simultaneous employer gain/other-House introduction/rival loss. Four `zzz` comments are retained verbatim with resolutions. This remains a test-only event projection; Game settlement has not changed. The following 4,388-check evidence describes the original November 3 review.

- `node tests/run-equipment.mjs tests/house-reputation-review.test.ts`: **4,388 checks / 731 real raw candidates**, all Alvares movement families, ordinary Nunes families and all twelve Inquiry subjects; actual first sampled outer muster at day 59. Weighted return/local/outer formula cases, candidate immutability, public entry endpoints, restricted Blackglass, and runtime House gains/gates/counters remaining inactive are checked. This is audit validation, not a playable House implementation test.
- `npx tsc -p tsconfig.tests.json`, `npm run test:reputation` (10,046 standing / 9,260 Combine / 2,009 CHR checks), and `npm run test:income` (44,245 checks) pass. No production, save, generator, quote, UI or historical fixture changes; no browser/mobile/live-save testing or push/deploy.
- Reproduce reference from scratch: `node tests/run-house-audit.mjs`. To reuse a retained census: `--input FILE --reference FILE`; `--first-day N --days N` selects samples. Fresh seasons: `--first-day 59`, `120` or `180`, each `--days 16`; use `--reference FILE` to avoid regenerating day 0–15. `--save-census FILE` refuses overwrites.
- Temp evidence: `houses-review-20261103-fit.json`, `houses-review-20261103-reference.json` (combined 0–31), `houses-review-20261103-outer.json`, `houses-review-20261103-return.json`, `houses-review-20261103-next.json` and matching fresh censuses. No claim of an uninterrupted flown campaign.

**Next review:** [VHM/Bruckner](faction-reputation-vhm.md). House runtime remains a separate rollout: implement the amended event rules and gates together, refit only House new quotes, validate 4-job/shared-recognition entry, rivalry/decay interaction and actual 1→2 paths/atomic settlement. Preserve accepted terms, neutral notices, existing Inquiry state, mutual current-level-3 refusal and unrelated employers. The approved medians/caps/mix do not need reapproval.
