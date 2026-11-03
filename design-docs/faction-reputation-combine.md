# Steel Combine reputation

Updated: 2026-11-03 (Pacific)
Status: **Implemented November 3 after Pete's authorization.** This completes the Combine pass and shared acceptance notices; proceed to Cerberus design next, then Houses. Thirteen-track model `43772dc` and nonlinear orbital haze `de95091` retained. Shared framework: [progression discussion](faction-reputation-progression.md).

## Implementation ledger — November 3

- `src/contract-reputation.ts` classifies stable faction/template identities without changing generators, IDs, seeds, cargo, quotes or fees. All 816 raw Combine candidates across sixteen days are classified. Public postings stay visible with locks, evaluated against current standing in both the board/acceptance scene and the acceptance handler, not cached into generated offers.
- M=2 to 1; important imports/Combine-funded pilgrimages M=15 to 2; no ordinary gains above 2. Every completed own job resets grace. K=5 unrelated completions, then D=1/30, protecting the current integer floor. Exact authored thirtieth-bar arithmetic reaches level 2 on the fifteenth important completion without rounding arbitrary developer/saved scores.
- Explicit CHR custody/labor jobs cost 0.20, manifests 0.10; floor 1, below-1 no-op. A rivalry hit consumes grace but replaces passive decay on that event. No direct loss for ordinary/premium/ambiguous CHR commerce. Other twelve tracks remain unchanged; no inherited credit or reciprocal CHR loss.
- Elevated internal variants: machine-tool stock on `hammer-to-perun`; blasting charges/replacement cutting heads on `hammer-to-veles`; finished machinery, machine tools, pumps/compressors, gear assemblies and heavy vehicle chassis on `perun-to-hammer`; tooling/spares on `anvil-to-surface`; Camps `morana-instruments` and `mokosh-farm-spares`. Remaining internal variants, including structural modules, crew rotations and spent-tooling returns, stay at 0. Imports/pilgrimages require 1; all named export programmes require 2.
- Current **CHR level 3 refuses all new Combine work**, irrespective of Combine standing. No persistent allegiance flag, score truncation, reciprocal refusal, docking/service ban or retroactive accepted-job cancellation. Persistent quest/renunciation lifecycle remains for later design.
- Optional `CareerProfile.reputationUnrelatedContracts` in the existing career key; safe integer counters, missing/invalid entries mean full grace, unknown keys ignored. No schema revision, eager migration write or historical reward inference. Successful paid/certification jobs consume unrelated grace; empty flights and personal Old Nell passage do not. Failed/abandoned work and retries award/count nothing.
- Shared neutral computer notices preview real completion effects; gain supersedes maintenance, floors/caps suppress false promises. Maintenance only for vulnerable fractional standing. Reputation-locked postings show their restriction rather than an unattainable reward preview. Passive unrelated decay is not labeled faction disapproval.
- Delivery commits cloned money/location/time/certifications/Inquiry/wear/reputation/counters before publishing. Save failure restores the completion overlay; retry commits once. Flight logging follows a successful career save, preserving previous entries; consumed bookings/stale callbacks cannot repeat settlement. No new mission-history transaction/version system.
- Validation: 9,264 progression checks / 816 candidates, 10,045 standing checks, 36 native preview checks, 41 real-Game isolated Edge checks (launch/retry, 2+15 completions, decay, save failure, reconstructed Game). Menu/maintenance/economy/history regressions and build pass; screenshots inspected. Preview `/tests/contract-reputation-preview.html`. No mobile/live-save/push/deploy changes.

The sections below retain the rationale and quest/asymmetry questions from the review. Implemented ordinary-work rules are the ledger above.

## Income follow-up — `c8037f5`

New export quotes now use a route-specific credit curve centered on **30,000 cr net at par** (reference median 30k; fresh holdout 29,714). Old accepted export quotes remain exact; internal/import/pilgrimage fees and all fuel reimbursement terms are unchanged. All progression/gates/refusals above remain live. [Income implementation and validation](faction-reputation-income-implementation.md).

## Existing source facts

- `src/content/estella/faction-contracts/steel-combine-contracts.ts` distinguishes Planning Office internal distribution from Foreign Trade Committee imports/exports, plus Combine-sponsored Kalyna work pilgrimages and partner lanes.
- Internal work, imports and Combine-funded pilgrimages use zero generosity and 100% fuel compensation, capped at 2× allowance. Export candidate authoring still contains the old 0.15 generosity baseline; new postings replace that fixed-pay calculation with the approved 30k-centered quote, retaining full fuel compensation. It is not a universal flat export bounty.
- Core imports: `import-new-canaan`, `import-serai`, `import-glitterfield`; Balor `ore-purchase` / `brick-purchase` are additional Combine procurement.
- Core exports: `export-svarog`, `export-yardstock`, `export-serai`, `export-tessera`, `export-oathmark`; Balor `foundry-machine-tools` / `extraction-chassis`, four Dahai STEEL lanes and two Sahra STEEL lanes supplement them. Camps STEEL additions are Planning Office internal support.
- `kalyna-work-pilgrimage:*` is Combine-funded reciprocal passenger work; Merren/Work Union-funded pilgrimages have their own issuer. Neither Svarog nor Kalyna is part of the Combine merely because it is a Kuznia moon.
- Existing CHR templates distinguish explicit custody/labor allocation, workforce manifests, ordinary industrial/medical supply and premium corporate commerce. Price or Pandemonium/Olympos destination alone does not identify political harm.

## Contract eligibility

| Combine level | Ordinary work available |
|---|---|
| 0 — Unaffiliated Worker | Entry-level subset of Planning Office routine work; not all internal shipments |
| 1 — Registered Sympathizer | All prior work plus elevated routine Planning Office shipments, entrusted Foreign Trade Committee imports and Combine-funded Kalyna work pilgrimages |
| 2 — Honorary Citizen | All prior work plus paying export programmes, including Balor/Dahai/Sahra partner exports |
| 3 — Honorary Udarnik | Same ordinary contract access as 2; earned through special quest content, not another generated-contract pay class |

This deliberately makes important **imports/exchanges available at 1** so they can earn 2, while **exports are the cash-paying reward at 2**. No circular requirement to fly level-2-gated jobs to reach level 2. These are proposed assignments of existing mission families, not newly authored crises or shipping programmes. Physical access remains contract-authorized; no general private-arrival permission or at-cost maintenance perk is added.

### November 3 amendment — elevated routine work

Pete wants level 1 to unlock **more routine work**, not only important advancement jobs. Some existing routine shipments therefore require level 1. For the Combine, both entry-level and elevated routine work remain **zero fee plus existing fuel compensation**. The level-2 export bonus is unaffected. For other entities, the newly available elevated routine contracts should also pay more than entry-level routine contracts; exact premiums are not chosen. This is a better-paying contract category, not an automatic raise on every previously available job.

Access, pay and advancement qualification remain separate. Elevated routine work resets grace but **does not earn 1→2 progress** merely because it requires level 1. Imports/work pilgrimages remain the proposed important-work classes.

The implemented split leaves ordinary food/raw-stock distribution and regular crew rotations at 0; selected finished machinery, specialist tooling/spares and blasting-charge shipments require 1. The ledger above lists exact variants. Entry-level bookings remain available to earn the first rank. Classification uses stable authored mission/cargo variants, not displayed names; a restricted variant does not gate its entire mixed lane.

## Positive credit

- **0→1: M=2, +0.5 per successful Combine-issued contract**, capped at 1 for that award. Normally the available work here is internal distribution.
- **1→2: M=15, +1/15 per successful qualifying import/procurement or Combine-funded work-pilgrimage contract**, capped at 2. These are the entrusted-work classes proposed above. Routine internal work gives no advancement after 1.
- **2→3: special quests only.** No ordinary contract gives advancement above 2, including exports. Exact quest content, milestone rewards and any reinstatement route remain for quest design; do not invent a generic M or one-shot permanent promotion yet.
- Every successfully completed Combine-issued contract resets Combine decay grace, whether it awards points or not. Exports therefore maintain standing even though they cannot earn level 3.
- Qualification uses stable provider and authored logical mission-family identity. A contract from another issuer does not award Combine points merely because it goes to Hammer/Anvil/Kuznia. No automatic credit from Merren pilgrimage work, HALL/HSC/SSC jobs or Institute visits without an explicit later decision.
- Proposal: ordinary repeat bookings count as separate jobs; retries/flight legs do not. Failures/abandonment give no positive credit or grace reset. No new failure penalty or decay count is proposed in this pass; special quest consequences would need authoring.

## Passive decay

Use the same initial parameters in bands 1→2 and 2→3:
- **K=5 unrelated completed contracts** of grace after a successful Combine job.
- From the sixth onward, **D=1/30 (about 0.0333)** per unrelated completed contract—half one important job's credit.
- Clamp passive loss at the current integer floor. None below level 1; exactly 1/2/3 cannot be demoted by passive decay.
- Empty runs and elapsed time do not consume grace. Routine Combine work resets it without awarding advanced progress.
- A routine CHR job is unrelated for this counter, but carries no direct rivalry penalty merely because it is CHR.

## Disqualifying work and losses

Keep explicit coercive operations distinct from merely profitable commerce:

| Existing CHR mission family | Proposed Combine loss |
|---|---|
| `custody-transfer-to-olympos`, `local-custody-processing`, `surface-labor-allocation`, `local-surface-labor-processing` | −0.20 per completed contract |
| `local-workforce-manifests` | −0.10 per completed contract |
| Ordinary supplies, medicines, industrial stock, routine equipment, luxury/corporate shipments and rare-metal sales | No automatic direct penalty |

The narrower penalty list is a recommendation, not an assertion that all other CHR activities are harmless. `workforce-transfer-to-hub` is ambiguous in its current generic label; do not classify every workforce booking as coercive without reviewing its intended context in the Cerberus pass. Future political/strategic story contracts can carry explicit losses.

Normal rival penalties stop at **1.0**. Recommended below-1 treatment: no-op rather than promoting an unestablished score to 1. Each penalty-bearing completion increments the unrelated counter but substitutes for passive decay on that event (no hidden double charge); this ordering is still proposed. No reciprocal CHR loss from Combine work.

## Level-3 access conflict — proposed directional interpretation

- At **CHR 3**, the Combine refuses new contracts, including routine work, regardless of existing Combine score or whether an ordinary minimum is met.
- At **Combine 3**, Cerberus would still offer work if its stated indifference governs hiring as well as reputation. This is the asymmetry to confirm during these reviews; do not silently add mutual refusal. Consequential CHR jobs could still risk Combine standing under that interpretation.
- No numerical erasure of stored standing, extra cross-faction ceiling, docking ban or cancellation of accepted contracts is selected here. Warn before commitment; resolve any conflicting outstanding bookings before promotion if they can coexist.

## Next review

Combine ordinary progression and the routine split are implemented in `3e36373`. Next is [**Cerberus**](faction-reputation-cerberus.md), including its elevated routine premiums and important-work classes. Special quest rewards/reinstatement, global political caps and persistent refusal/renunciation remain open. Do not implement Cerberus/Houses progression without their review.
