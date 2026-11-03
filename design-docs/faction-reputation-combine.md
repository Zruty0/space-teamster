# Steel Combine reputation — first parameter proposal

Updated: 2026-11-03 (Pacific)
Status: **Design only; baseline accepted as reasonable, with the routine-work amendment below.** Numbers remain the working baseline; exact mission assignments and previously open questions still need review. Nothing here is implemented. Review order: Combine, then Cerberus, then Houses. Do not advance automatically. Shared directions: [progression discussion](faction-reputation-progression.md). Runtime reputation baseline remains `43772dc`; concurrent orbital haze `bc3ddf3` preserved.

## Existing source facts

- `src/content/estella/faction-contracts/steel-combine-contracts.ts` distinguishes Planning Office internal distribution from Foreign Trade Committee imports/exports, plus Combine-sponsored Kalyna work pilgrimages and partner lanes.
- Internal work, imports and Combine-funded pilgrimages use zero generosity and 100% fuel compensation, capped at 2× allowance. Export programmes add generosity 0.15 with full compensation; **no flat export bounty**. Preserve these economics. The old lane comment mentioning a flat bounty is not the live pay rule.
- Core imports: `import-new-canaan`, `import-serai`, `import-glitterfield`; Balor `ore-purchase` / `brick-purchase` are additional Combine procurement.
- Core exports: `export-svarog`, `export-yardstock`, `export-serai`, `export-tessera`, `export-oathmark`; Balor `foundry-machine-tools` / `extraction-chassis`, four Dahai STEEL lanes and two Sahra STEEL lanes supplement them. Camps STEEL additions are Planning Office internal support.
- `kalyna-work-pilgrimage:*` is Combine-funded reciprocal passenger work; Merren/Work Union-funded pilgrimages have their own issuer. Neither Svarog nor Kalyna is part of the Combine merely because it is a Kuznia moon.
- Existing CHR templates distinguish explicit custody/labor allocation, workforce manifests, ordinary industrial/medical supply and premium corporate commerce. Price or Pandemonium/Olympos destination alone does not identify political harm.

## Proposed contract eligibility

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

Suggested split for review, not an approved template mapping: leave ordinary food/raw-stock distribution and regular crew rotations at 0; reserve selected finished machinery, specialist tooling/spares and blasting-charge shipments for 1. Keep sufficient entry-level bookings to earn the first rank. Classify stable authored mission/cargo variants rather than matching displayed names; do not accidentally gate an entire mixed routine lane because one variant is restricted.

## Proposed positive credit

- **0→1: M=2, +0.5 per successful Combine-issued contract**, capped at 1 for that award. Normally the available work here is internal distribution.
- **1→2: M=15, +1/15 per successful qualifying import/procurement or Combine-funded work-pilgrimage contract**, capped at 2. These are the entrusted-work classes proposed above. Routine internal work gives no advancement after 1.
- **2→3: special quests only.** No ordinary contract gives advancement above 2, including exports. Exact quest content, milestone rewards and any reinstatement route remain for quest design; do not invent a generic M or one-shot permanent promotion yet.
- Every successfully completed Combine-issued contract resets Combine decay grace, whether it awards points or not. Exports therefore maintain standing even though they cannot earn level 3.
- Qualification uses stable provider and authored logical mission-family identity. A contract from another issuer does not award Combine points merely because it goes to Hammer/Anvil/Kuznia. No automatic credit from Merren pilgrimage work, HALL/HSC/SSC jobs or Institute visits without an explicit later decision.
- Proposal: ordinary repeat bookings count as separate jobs; retries/flight legs do not. Failures/abandonment give no positive credit or grace reset. No new failure penalty or decay count is proposed in this pass; special quest consequences would need authoring.

## Proposed passive decay

Use the same initial parameters in bands 1→2 and 2→3:
- **K=5 unrelated completed contracts** of grace after a successful Combine job.
- From the sixth onward, **D=1/30 (about 0.0333)** per unrelated completed contract—half one important job's credit.
- Clamp passive loss at the current integer floor. None below level 1; exactly 1/2/3 cannot be demoted by passive decay.
- Empty runs and elapsed time do not consume grace. Routine Combine work resets it without awarding advanced progress.
- A routine CHR job is unrelated for this counter, but carries no direct rivalry penalty merely because it is CHR.

## Proposed disqualifying work and losses

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

## Decisions requested on this proposal

The baseline is accepted as reasonable, amended to **entry-level routine → elevated routine plus important imports/exchanges → exports**. Retain M=2 / M=15, K=5 / D=1/30 and the CHR loss table as working parameters. Next settle exact level-0/1 routine assignments. Other employers' elevated routine premiums, quest rewards, global cap/refusal lifecycle and the CHR-indifference edge remain open. No runtime implementation is authorized by this discussion.
