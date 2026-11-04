# Three Houses — progression review

Updated: 2026-11-03 (Pacific)
Status: **Proposal and read-only audit, not implemented.** Pete said to proceed to Houses after the Cerberus pass. House-specific important classes, rates and political consequences had not yet been selected. This review supplies those choices without silently activating gates or rewriting Inquiry rewards. Combine/CHR runtime remains live; the three House tracks currently have no automatic gains, decay or contract locks.

Authority: [approved income targets](faction-reputation-income-targets.md), [caps/mix](faction-reputation-income-calibration.md), [progression framework](faction-reputation-progression.md). Existing programmes: [economy](economy.md#faction-house-mendes), `alvares-contracts.ts`, `mendes-contracts.ts`, `nunes-contracts.ts`, `nunes-inquiries.ts` under `src/content/estella/faction-contracts/`. Prior entity: [Cerberus](faction-reputation-cerberus.md).

## Approved constraints, not reopened

| House | Newly unlocked commercial medians 0 / 1 / 2 | Level-0 ceiling | Level-1 ceiling |
|---|---|---:|---:|
| Alvares | 5k / 60k / 100k | 32,500 | 80,000 |
| Mendes | 5k / 50k / 90k | 27,500 | 70,000 |
| Nunes | 5k / 40k / 75k | 22,500 | 57,500 |

Net means completion pay plus reimbursement minus par fuel, before penalties, maintenance, positioning and time. Equality stays in the lower band. Access meets **both quoted-income and authored trust minima**. Approximate 20/60/20 applies to the remaining commercial pool, not important work or a quota on each board. Importance does not imply hostility. No direct penalty merely for serving another House. Only special quests can advance 2→3.

## Recommended gains and maintenance

- All three: **two successful own contracts reach 1**, +0.5 each, cap at 1. No passive erosion below 1; no time pressure on introductions.
- Alvares/Nunes: important completions add **1/15 from 1 to 2**. Fifteen important deliveries, not fifteen lifetime jobs.
- Mendes: preserve the earlier **proposed 3:4:2** preference for Hydra-local outbound / outer outbound / returns, scaled to a bar of 40. Local outbound +3/40 (**14 jobs**), outer outbound +4/40 (**10 jobs**), all returns +2/40 (**20 jobs**). These are proposed normalized awards; the older raw point weights were never implemented. A mixture accumulates the same weights; the final award stops at 2. This preserves the old programme's distinction while fitting the 10–20-job direction.
- Ordinary own work stops awarding progress at 1; every successful own job still resets that House's grace. Important work also stops awarding progress at 2 and maintains any quest-earned fraction above it.
- Independent **K=5** unrelated completed contracts, then **D=1/30**, protecting the current integer floor. Empty/Old Nell travel, waiting and maintenance do not consume grace. Failures/retries/abandonments award/count nothing under this initial pass, matching Combine/CHR.
- Serving one House neither advances nor refreshes another, nor does Accord/other-noble recognition identify a donor to reward. Other-House routine work can consume passive grace but is not a direct rivalry hit.
- Implement exact rational increments without broadly rounding arbitrary saved standings. A 1/120 arithmetic grid accommodates halves, fifteenths, thirtieths and fortieths; this requires no new save field or eager migration. Integer floors and award caps still apply.

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

## Rivalry: what current content establishes

**Recommend no direct inter-House penalty on the existing repeatable pools yet.** This does not remove the rivalry group or its approved level-3 refusal direction. It avoids pretending that every favour to one House is an attack on the other two:

- An Alvares escheat order names a judgment and receiving institution, but not which senior House owns the seized property or contests the writ. Ordinary dues/grants are not automatically anti-Mendes or anti-Nunes.
- Mendes musters include standards inspections, exercises, casualty work and returns. Even a weapons shipment has no authored campaign target; neither the provider tag nor a landing at another House's region supplies one.
- Nunes quiet custody mixes evidence, protected witnesses, counter-interrogation patients, released exiles and guarded transfers. The family does not identify an opposing senior House. Its passenger variants share the same template structure; cargo-label inference would be especially unsafe.
- Nunes recovery/medical work and learned patronage do not automatically antagonize Alvares/Mendes. An official Alvares delegation does not establish a contested succession just because its occasion is a succession recognition.

Direct losses need explicitly authored **contested writs, targeted mobilizations or rival-sensitive custody assignments**, with the affected House and consequence stated in the posting before acceptance. Leave their rates/pairs unselected instead of quietly assigning symmetric penalties. When authored, use the existing rival floor 1, below-1 no-op, counter consumption without an extra passive hit, and neutral per-faction disapproval previews. No new contracts/story events are created by this review.

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
- **Mendes:** all sampled level-0 intake freight starts at **Serrat Domain Shipyard**, not Cadiz. Both the shipyard and Banner Forge are public. A first intake job ends at the Forge with 0.5; return empty or via other employers for a second pickup. Below-1 progress does not decay. Then the Forge's muster pool opens. Do not claim that every Forge board has an entry job or that Cadiz currently supplies the entry band.
- **Nunes:** the publicly accessible **Far Bell Tower → Blackglass** watch-return route supplies starter freight. Most starter freight needs the existing fragile-cargo qualification; occasional alternatives have no explicit specialist certificate. Castle Nunes/Blackglass also have entry offers but remain restricted empty-arrival sites. A public contract authorizes arrival; do not invent a discovery/contact prerequisite. Guild qualification and funding remain independent prerequisites, not House-reputation rewards.
- The audit reports explicit `requiredCertification`, not every flight/equipment requirement. It does not prove that a fresh, unqualified, cashless career can immediately start at any House. Empty positioning costs, maintenance, calendar waiting, current equipment and return routing need actual completion-path/playtest validation before enabling gates.
- Important freight exists for all three; no passenger-only compulsory path is proposed. Nunes can advance through recovery and learned work without custody; Alvares through grants without escheat. Neither is a claim that every posting is harmless or that custody implies a particular rival target.

## Validation and implementation boundary

- `node tests/run-equipment.mjs tests/house-reputation-review.test.ts`: **4,388 checks / 731 real raw candidates**, all Alvares movement families, ordinary Nunes families and all twelve Inquiry subjects; actual first sampled outer muster at day 59. Weighted return/local/outer formula cases, candidate immutability, public entry endpoints, restricted Blackglass, and runtime House gains/gates/counters remaining inactive are checked. This is audit validation, not a playable House implementation test.
- `npx tsc -p tsconfig.tests.json`, `npm run test:reputation` (10,046 standing / 9,260 Combine / 2,009 CHR checks), and `npm run test:income` (44,245 checks) pass. No production, save, generator, quote, UI or historical fixture changes; no browser/mobile/live-save testing or push/deploy.
- Reproduce reference from scratch: `node tests/run-house-audit.mjs`. To reuse a retained census: `--input FILE --reference FILE`; `--first-day N --days N` selects samples. Fresh seasons: `--first-day 59`, `120` or `180`, each `--days 16`; use `--reference FILE` to avoid regenerating day 0–15. `--save-census FILE` refuses overwrites.
- Temp evidence: `houses-review-20261103-fit.json`, `houses-review-20261103-reference.json` (combined 0–31), `houses-review-20261103-outer.json`, `houses-review-20261103-return.json`, `houses-review-20261103-next.json` and matching fresh censuses. No claim of an uninterrupted flown campaign.

**Next decision:** accept/adjust the important classes, Mendes normalized weights, Inquiry trust-1/reward exception and targeted-only rivalry recommendation. Then implement House gains and gates together, refit only House new quotes, validate actual 0→1→2 routes/atomic settlement and mutual current-level-3 refusal, and preserve accepted terms, neutral notices, existing Inquiry state and unrelated employers. The approved medians/caps/mix do not need reapproval.
