# Reputation income — approved boundaries and calibration direction

Updated: 2026-11-04 (Pacific)
Status: **Approved calibrated pricing and gates are implemented for all 34 public providers.** Important-work pools are separate; broader GOV/Sahra references and gentle entry shoulders resolve the rollout blockers. Seasonal mix variation is reported, not hidden with quotas. [Current fit/validation](reputation-rollout.md).

Prior implementation status (historical): **Approved November 3; first new-posting pricing pass implemented in `c8037f5`.** See [runtime scope, fit and remaining drift](faction-reputation-income-implementation.md). Combine and Cerberus gates/progression are active (CHR `7992ffb`); the remaining factions are still deferred. Pete approves the cap proposal and calibration, replacing the suggested 40/40/20 offer mix with **20/60/20**, so most offers unlock at tier 1. The [22-row median table](faction-reputation-income-targets.md) was approved in `d3ca63a`. Initial fitting/tail behavior is implemented; broader balance and other factions' reputation gains/political outcomes remain unresolved. Wind work remains separate.

## 1. Approved economic boundaries

For employers with three paid commercial bands, let M0/M1/M2 be their approved median net credits at par:

- Level-0 ceiling **B0 = min(40,000, (M0 + M1) / 2)**.
- Level-1 ceiling **B1 = (M1 + M2) / 2**.
- Final quoted net earnings **N ≤ B0** require economic level 0; **B0 < N ≤ B1** require 1; **N > B1** require 2.
- Compare integer quoted credits; equality stays in the lower band. No rounding displayed thousands before evaluating eligibility.

Midpoints give a simple initial separator between approved medians. Pete explicitly approved these separators; they are not mathematically implied by the medians alone. The 40k ceiling is a global maximum for entry-level commercial work, not a single boundary forced on poorer employers: Covenant's level-1 median is only 25k, so a universal 40k boundary would defeat its progression.

| Employer/group | Level 0 up to | Level 1 up to | Level 2 above |
|---|---:|---:|---:|
| Cerberus / BAM | 40,000 | 250,000 | 250,000 |
| Daedalus | 40,000 | 237,500 | 237,500 |
| Bruckner / KIS-E / Merren / Accord / Halloran / Miners Mutual / SSC | 40,000 | 125,000 | 125,000 |
| Hartwell shippers / other independent commercial employers | 40,000 | 100,000 | 100,000 |
| House Alvares / smuggling contacts | 32,500 | 80,000 | 80,000 |
| House Mendes | 27,500 | 70,000 | 70,000 |
| House Nunes | 22,500 | 57,500 | 57,500 |
| Covenant Remnants | 15,000 | 37,500 | 37,500 |
| Estella Institutions | 27,500 | 75,000 | 75,000 |
| Other noble households | 17,500 | 45,000 | 45,000 |

Shared rows mean identical approved boundaries, not merged employers or standing. Their existing recognition rules remain authoritative.

Exceptions retain explicit authored trust requirements:
- **Combine:** zero-fee work at levels 0/1, distinguished by trust/importance; exports require 2 and target a 30k median. Do not classify those exports as level 0 just because 30k is cheap elsewhere. There is no paid level-1 Combine band to interpolate.
- **VHM/Kisaragi direct work:** minimum 2 regardless of quote; paid work targets their approved 300k median. Do not invent parent-company level-0/1 offers. Bruckner/KIS-E retain their own pay schedules and use the shared standings.

Final eligibility remains **economic minimum AND authored trust minimum**, plus licenses, equipment, contact/access conditions and explicit employer refusal. A high-paying ordinary shipment can move up economically without becoming reputation-advancing.

## 2. Calibration process

Do not merely reclassify current expensive postings and call the targets met. The CHR audit found no ordinary freight below about 52k, so entry-level work would disappear.

Recommended first calibration pass:
1. Audit a fixed reference period (initially world days 0–15, then validate against separate later days), using real generated offers and their route/load par costs. Keep each employer's economy separate even where standing is inherited.
2. Separate important low-paying reputation work from ordinary commercial work. Also exclude Guild certification/personal passage, mixed civilian pools without assigned standing, and unauthored smuggling/quest content rather than creating policies for them implicitly.
3. For ordinary commercial work, fit a stable monotonic credit curve against existing route/load workload (par fuel cost), using the approved medians and boundaries. Use that curve to quote net credits **before** checking pilot standing; never make the same posting pay more merely because this pilot has more reputation.
4. **Approved reference-sample mix: about 20% level-0, 60% newly unlocked at level-1 and 20% newly unlocked at level-2 commercial offers** for ordinary three-band employers. Tier 1 unlocks the bulk of work; roughly 80% is available by tier 1 on reputation grounds, subject to other requirements. This supersedes the 40/40/20 proposal. It is an approximate calibration goal, not an enforced per-board quota or a new gate. Measure the final reputation requirement (maximum of economic and authored trust minima), not just economic bands, so trust gates cannot silently move the intended tier-1 majority to tier 2. Report economic-band counts separately. Important low-paying work remains a separate pool; Combine/direct-parent exceptions use their own available bands. Exact tails and fitting details remain for validation.
5. Report actual per-band median/range/count, separated from important-work earnings. Tune against the real discrete distribution; repeated identical jobs/ties may prevent an exact requested split. Do not invent random surcharges or change existing IDs/seeds to manufacture an exact percentile.
6. Verify adequate level-0 work at practical entry locations, and enough level-1 important jobs to reach 2. Whole-world percentages alone are not sufficient. Refit/author the low-paying supply rather than granting free reputation or creating circular gates.

Calibration data must be stable configuration, not recalculated from whichever other jobs happen to be visible on today's board. Individual quoted earnings may vary with real route/load/transfer conditions, but existing accepted quotes remain frozen. Public offers remain visible with requirements; don't discovery-gate boards.

## 3. Turning target earnings into a real quote

For a newly created posting:
- **N** = calibrated net earnings at par, in integer credits.
- **F** = quoted par fuel cost.
- **R(F)** = fuel reimbursement at par under the contract's existing reimbursement ratio/cap, using the production rounding rule.
- Required fixed completion pay: **P = N + F − R(F)**.

Then net at par is exactly **P + R(F) − F = N**. Away from par, existing actual-fuel reimbursement/caps still apply; efficient flying can improve net earnings, and excess fuel/penalties/wear can reduce it.

Example: N=20,000 cr, F=200,000 cr, reimbursement at par=80,000 cr. Quote fixed pay=140,000 cr plus the existing actual-fuel reimbursement. At par the pilot receives 220,000 cr, spends 200,000 cr on fuel and earns **20,000 cr**, not 140,000 or 220,000.

This recommends preserving fuel reimbursement behavior while replacing the old percentage-derived profit with calibrated credit earnings. The existing pay fields can represent a quoted fixed amount; no career schema or policy-version mechanism is inherently needed. Exact field encoding is an implementation choice, not a newly selected flat fee for every route. Existing authored special fees must be reviewed explicitly when calibrating affected new quotes, not silently deleted or double-counted. If reimbursement alone exceeds the desired total, flag that contract for explicit review rather than inventing a negative fee or quietly changing fuel terms.

## 4. Important assignments stay a separate low-paying pool

Use the employer's approved **level-0 median** as the initial earnings anchor for important work; a trust minimum of 1 still applies. Combine's anchor remains zero. Any variation must remain compatible with the intended low-pay economic band. The exact spread and qualifying templates remain per-entity decisions, not selected by this approval. The subsequent CHR implementation selects nine important families at 20k net, requires level 1, and excludes them from its commercial mix.

Example: a CHR important job at 15k has economic minimum 0 and trust minimum 1, so requires level 1 and can advance 1→2. A routine CHR job at 134k has economic minimum 1 but does not award advanced reputation merely because it pays more.

## Rollout boundaries

The median targets, midpoint boundaries and calibration direction with a 20/60/20 reference mix are approved. `c8037f5` implements the first fixed workload curves, smooth median shoulders and logarithmic premium tails for new quotes. Existing quotes/history and fuel terms survive. Cerberus `7992ffb` subsequently implements earned progression, nine low-paying important families and live economic/trust gates, refitting only CHR. Other factions' earning/loss policies, important classes and live gates still need entity review; enabling their locks now would strand pilots without an earned progression path. Combine `3e36373` progression remains live, with exports newly calibrated around 30k. Remaining audit limitations are recorded in the implementation ledger.
