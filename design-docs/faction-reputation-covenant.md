# Covenant Remnants — progression review

Updated: 2026-11-04 (Pacific)
Status: **Approved Covenant 1/15 progression, 5/30 decay, important prices, broader-reference commercial curve and gates are implemented.** See [rollout validation](reputation-rollout.md).

Prior review status (historical): **Design approved November 4; runtime pending.** Pete approves this review and requests all remaining review stages together, replacing the entity-by-entity pauses. The approval does not change income targets or waive the calibration/return-path prerequisites. Next after resolving Pete's [Kisaragi pacing comment](faction-reputation-kisaragi.md) in `cd1ff64` (4/20, K=10/D=1/50). Covenant already has a stored reputation track and calibrated ordinary quotes; this earning path, important-price separation and contract locks are not live. The initial candidate's holdout deviation is preserved below; the [batch follow-up](faction-reputation-remaining.md#covenant-calibration-follow-up--improved-candidate-not-live) adds a broader-reference, gently varying entry-price candidate with a new untouched test window. Funded return-path validation and runtime rollout remain pending.

## Existing authority

One track, `covenant-remnants`: **Unsealed Stranger → Guest at the Gate → Friend of the Covenant → Unsealed Kindred**. Holy Orders do not get separate meters. Titles describe an external relationship: even level 3 does not implant a Seal, confer an Order's office or grant command authority.

The existing provider has only four legal families:

1. Toil/Genesis essential imports from twelve sources, all delivered to **Pilgrim Gate**.
2. Toil's in-kind compact dues from Pilgrim Gate to Castle Nunes.
3. Genesis physicians/researchers from Pilgrim Gate to Mirror Clinic for compact service.
4. Notarized Postulants and sanctioned pilgrims from six external sources to Pilgrim Gate.

The approved ordinary net-at-par medians remain **5k / 25k / 50k**, with ceilings **15k / 37.5k**, equality in the lower band, approximate **20/60/20** mix excluding important work. Price access and authored trust are independent: use their maximum, plus existing qualifications/equipment. No board discovery gate.

Sources: [economy](economy.md#faction-covenant-remnants), [geography and Seal history](space-teamster-geography.md#the-covenant-remnants), [income targets](faction-reputation-income-targets.md), [progression framework](faction-reputation-progression.md), and `src/content/estella/faction-contracts/covenant-contracts.ts` / `hartwell-shipping-contracts.ts`.

## Proposed progression

| Band | Successful work | Gain |
|---|---|---|
| 0→1 | Covenant contract; new entry through essential imports | +1, one job |
| 1→2 | Compact dues, compact service or the two documented passage types | +1/15, fifteen important jobs |
| 2→3 | Future authored quests | No ordinary-contract gain |

**Why one introductory job:** routine supply is inbound-only. After the first essential delivery, recognizing the pilot as Guest at the Gate opens compact backhauls immediately. Requiring two imports would instead force a return funded independently or work for another employer before the second introduction. One shipment establishes an external carrier account, not intimate trust or internal access; fifteen important completions still distinguish Friend of the Covenant. This is a separate recommendation, not a copy of Kisaragi's harder 4/20 ladder.

Cap each award at the next integer, with no spill or simultaneous introductory/advanced gain. All successful Covenant work refreshes its own counter, including routine imports at established levels and accepted legacy jobs. Recommend **K=5 unrelated completions, then D=1/30 starting on the sixth**, protecting the current integer floor. No erosion below 1. Empty/Old Nell travel, waiting, failures, abandonments and retries award/count nothing; settlement is once per successful completion, not once per callback or once per repeated template ID.

At 1, ordinary imports maintain standing, not advance it. At 2, more expensive essential imports unlock through their quoted-income band; this is not permission for military or secret work. No extra authored trust-2 class is needed in these four public lanes.

## Proposed important work — trust 1, 5k net at par

| Stable family/identity | Selection | Reason |
|---|---|---|
| `compact-dues-{0,1}-{cargo}` | All ten existing identities: each of two slots for cryogenic valve blocks, proofed pressure doors, cold-rated habitat fittings, relay cooling plants and ice-work pumps | Discharge the legal compact that protects the enclave |
| `compact-service-genesis-mirror-clinic` | Existing physician/researcher party | Entrusted institutional service under that compact |
| `passage-notarized Covenant postulants` | Existing recorded passage | Matched declarations and household sponsorship, not generic recruitment |
| `passage-sanctioned Covenant pilgrims` | Existing recorded passage | Testimony warrants and receiving-household register |

Thirteen persistent identities, three important families. Essential imports (`provision-...-toil` / `provision-...-genesis`) remain ordinary commerce; medical or neural-interface wording alone does not turn a supply crate into a Seal quest. Dues provide a **freight-only advancement path**: no requirement to carry Postulants or fit a passenger rig to reach 2.

New important quotes target **5,000 cr net at par**, excluding maintenance, positioning and time. Preserve actual-fuel ratios: provision/service **0.80**, dues **0.85**, passage **0.90**, each capped at **2×** par. Fixed pay is `5k + par fuel − reimbursement at par`, not a flat 5k gross payment or a bonus stacked on the old ordinary quote. Only newly generated offers are repriced. Accepted quotes, stored history, IDs, daily seeds, cargo, manifests and posting order remain unchanged.

Postulant declarations are made **while unsealed and outside Covenant custody**; arrival matches the paperwork and admits them to the **unsealed house**. Preserve that exact distinction. The delivery neither performs implantation nor proves future post-implant consent. No new forced-recruitment story, consent shortcut or universal moral endorsement is inferred from legal passage.

## Attribution, politics and access boundaries

- **Credit follows the Covenant provider**, not cargo origin, destination or receiving Order. Compact delivery to Nunes does not earn Nunes points or the Houses' shared introductory credit. Nunes protection does not give a pilot inherited Covenant standing.
- Hartwell factors buy Toil goods and export under **their own company contracts**. Those jobs remain HSC work, not Covenant advancement or grace refresh; do not absorb the four factors into an enclave export arm. Covenant is not a corporate donor for generic commercial recognition.
- The compact angered Alvares/Mendes historically, but this pass proposes **no new automatic House penalties or refusal** for Covenant contracts. Existing House favor penalties select House-issued escheat/musters/Inquiries, not any shipment that reaches Nunes. No new cross-faction rewards or hostility are inferred from geography or lore.
- Pilgrim Gate stays the Covenant provider's sole legal public trade/passenger interface. Existing specifically authored Merren stewardship deliveries to Mercy/Vigil and their reusable returns remain contract-authorized third-party exceptions; this review neither removes them nor expands them into general Covenant trade. Preceptory of Toil, Cathedral of Testimony and Vigil Keep remain restricted; standing does not unlock their interiors. Existing public access at Vigil Gate is not a new Covenant contract lane.
- Castle Nunes remains restricted and Mirror Clinic unlisted for empty arrival without the requisite existing access. A public compact contract authorizes its own destination; the board must not be hidden to preserve that restriction. No general discovery/access reward is granted at completion.
- No public weapons, Second Crusade preparation, Seal freight, ordinary-Seal succession, Grandmaster authority, Arkfall recovery or internal Mercy/Vigil distribution. Smuggling remains future individual-contact work; no centralized smuggler faction or automatic access to Apocrypha Cache. Unsealed Kindred can only come from future explicitly authored quests, not repeated passenger deliveries or adopting a Seal automatically.

## Read-only pricing and supply audit

`tests/audit-covenant-reputation.ts` and `tests/run-covenant-audit.mjs` classify current offers without changing production. Fit the candidate commercial curve on **day-0–15 essential imports only**, freeze it, and project important work separately at 5k/trust 1. No rank-based prices, daily refits, new routes, supply weighting changes or board quotas.

| Sample | Commercial / important appearances | Commercial mix 0 / 1 / 2 | Commercial medians | Entry freight: all / public pickups |
|---|---|---|---|---|
| Days 0–15 reference | 89 / 91 | 20.2 / 59.6 / 20.2 | 5,000 / 25,000 / 50,000 | 18 / 14 |
| Days 16–31 check | 81 / 88 | 16.0 / 67.9 / 16.0 | 5,005 / 25,000 / 50,000 | 13 / 9 |
| Fresh days 96–111 | 85 / 91 | 31.8 / 51.8 / 16.5 | **11,037** / 25,000 / 50,000 | 27 / 11 |

**Pricing caveat — not rollout-ready:** the fresh entry median is about **121% above the approved 5k target**, despite exact reference medians. This small pool changes composition with cargo rotation, route workload and board selection. Do not describe it as a stable 20/60/20 fit, silently approve an 11k target or retune against this holdout and keep calling it unseen. Before live repricing, fit/validate against a broader fixed reference and a new untouched window, or explicitly review an alternative fixed curve. Preserve equal-workload prices and the approved medians/caps; report remaining small/tied-pool drift rather than force per-board quotas.

**Batch follow-up — November 4:** [Remaining-stage review](faction-reputation-remaining.md) fits days 0–127 (1,422 Covenant appearances) and uses a fixed gentler entry shoulder. New untouched days 128–143 yield 19.3/60.2/20.5, medians 5,192/25,000/50,058, with thirteen public starter freight appearances. The earlier days 96–111 are development evidence, not relabeled unseen validation. Approved targets/classes and production quotes remain unchanged; this is an improved candidate, not a funded flown-loop proof.

The 27 fresh entry appearances do not mean a broad public starting route: **16 are at restricted Frostglass Collegium**. Public starter counts are only 14 / 9 / 11 across these windows. The price table includes all actual public-board postings, including private-source boards; onboarding must distinguish arrival permission from board visibility.

Important supply is 32 freight-dues appearances and 16 physician-service appearances in each window, plus **43 / 40 / 43** passenger-passage appearances. Both dues offers are present at Pilgrim Gate on all sixteen sampled days in each window; that supports a freight alternative, not a promise of a flown loop or future daily availability. Repeated service offers can share one ID across many days: the generator's IDs do not contain the day. Neither total appearances nor distinct ID strings count unique consignments or a pilot's attainable earnings/hour.

### Entry and actual route constraints

- Reference public entry pickups: **Cadiz main port (5)**, **Bruckner Weymark Depot (4)**, **Kalyna Orbital (1)** and **Caravanserai terminals combined (4)**. Fragile-cargo qualifications apply to some; there is no guaranteed entry job on each board/day. Private Frostglass is not required to justify entry.
- One completed import reaches 1 **at Pilgrim Gate**, where compact freight can then advance standing. No passenger-only gate is introduced. At day 0 the other freight exits are four Hartwell jobs with no cargo qualification requirement, but **all four quotes fall in HSC economic band 1**. Once that employer's future gates are authored, they cannot be assumed available to a pilot with no corporate recognition. Covenant standing does not supply that recognition. This is why the one-job introduction does not rely on HSC backhaul.
- Compact dues end at Castle Nunes, and physician service at Mirror Clinic. Neither is a Covenant procurement/passenger pickup. Returning to Pilgrim Gate may require another employer, positioning to a supplier/passage origin, or a funded empty leg. The grace counter counts unrelated completions, not elapsed days; ordinary own imports refresh it. Important work does not guarantee a convenient paid return.
- Before enabling locks, test actual credential/equipment and funding paths, repeated Gate→Nunes→supplier→Gate itineraries, and atomic completion/failure/retry. Board census plus arithmetic is **not a flown campaign**, and does not establish that 5k net covers maintenance or empty positioning.

## Validation and review focus

- Review tests: **6,813 checks / 672 raw candidates / 46 actual day-0–3 postings**. All four legal families, twelve procurement sources and thirteen important identities; fuel ratios/caps, consent copy, external-only topology, freight entry/advancement, attribution, private access, proposed 1/15 and K=5/D=1/30 arithmetic, quoted ceilings and production policy remaining inactive.
- Typecheck, Kisaragi/House/VHM reviews (9,667 / 4,491 / 17,235), standing/Combine/CHR (10,046 / 9,260 / 2,009) and income (44,245) pass. Reproduce with `node tests/run-equipment.mjs tests/covenant-reputation-review.test.ts` and `node tests/run-covenant-audit.mjs`. Runner supports `--input FILE`, `--reference FILE`, `--first-day N --days N`, `--save-census FILE` (refuses overwrite). Reference/check reuse retained censuses at reconstructed current prices; days 96–111 were freshly generated. Temp `covenant-review-20261104-{reference,check,fresh}.json`, fresh census and matching `*-final.json` reports retain evidence.
- No production/save/UI/fixture changes, browser/mobile/live-save tests, push or deploy.

**Approved design:** one-job external introduction, compact and documented passage work at trust 1/5k, fifteen important completions to 2, K=5/D=1/30, no inferred political/access/Seal effects. Holdout pricing and funded return-path validation remain explicit implementation prerequisites, not a request to change approved income targets. The remaining Daedalus/BAM/Merren/Institutions, inherited-employer and reserved-story stages are now batched in [the remaining-stage review](faction-reputation-remaining.md).
