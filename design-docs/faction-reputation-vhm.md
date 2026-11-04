# Voss-Heinkel / Bruckner — progression review

Updated: 2026-11-04 (Pacific)
Status: **Approved VHM/BFS earning, refresh, decay, important prices and gates are implemented.** See [rollout validation](reputation-rollout.md). Independent ownership is unchanged.

Prior review status (historical): **Approved November 4; runtime implementation pending.** Pete approved the reviewed VHM/Bruckner design and directed proceeding to the next entity. Approval covers explicit BFS earning/refresh into VHM, 2/15 progression, K=5/D=1/30, the nineteen important identities at 10k/trust 1 and the isolated commercial refit. Existing income prices and BFS→VHM recognition are live; these new gains/decay, important prices and direct-contract locks are not. Next: [Kisaragi/KIS-E review](faction-reputation-kisaragi.md). No ownership changes.

## Existing authority and boundaries

- **Bruckner Field Services is independent**, the authorized service/parts bureau and exclusive Estella dealer for the civilian VHM line. It is not a VHM subsidiary. Its logistics lattice, employer/provider identity and commercial terms stay separate from direct Voss-Heinkel work.
- The saved relationship is **Voss-Heinkel Metricwerke**. BFS already reads that track directly, including level 3. This read-only recognition rule does not currently award points for BFS completions; the proposed earning rule below must be explicitly implemented.
- Approved income: Bruckner newly unlocked commercial medians **10k / 100k / 150k**, economic ceilings **40k / 125k** (equality stays lower). Approximate commercial mix **20/60/20**, excluding important work. VHM proper has a **single level-2+ pool at 300k median**, not invented level-0/1 factory work.
- Access is quoted-income minimum **AND** authored trust minimum, plus existing qualifications/equipment. Net is pay plus reimbursement minus par fuel, before penalties, maintenance, positioning and time. Medians are neither guarantees nor per-job caps.
- VHM direct work retains **zero fuel reimbursement**. BFS stock/returns/crews retain their existing reimbursement ratios/caps. New important net pricing replaces the fixed component only; no old quote, ID, route, cargo, schedule or seed changes.

Sources: [income targets](faction-reputation-income-targets.md), [calibration](faction-reputation-income-calibration.md), [framework](faction-reputation-progression.md), [manufacturer](interstellar-giant-corporations.md#voss-heinkel-metricwerke), [independent dealer](system-level-corporations.md#bruckner-field-services); `src/content/estella/faction-contracts/{bruckner,vhm}-contracts.ts`.

## Approved progression

| Band | Work that earns progress | Gain / effort |
|---|---|---|
| 0→1 | Successful BFS contracts | +1/2, two jobs |
| 1→2 | Selected BFS warranty/incident/commissioning work below | +1/15, fifteen important jobs |
| 2→3 | Future authored quests only | No ordinary-job gains |

Cap each award at the next integer; no introductory spill into the advanced band. Every successful BFS **or** direct VHM job refreshes the **one VHM grace counter**, even if routine or already at the ordinary cap. A legacy already-accepted direct VHM contract still counts as related work and can receive the ordinary below-1 introduction credit; it is not cancelled by a new minimum.

Use **K=5** unrelated completed contracts, then **D=1/30**, protecting the current integer floor. No passive erosion below 1; empty/Old Nell travel, waiting, maintenance, failures, retries and abandonment award/count nothing in the initial pass. Pete's more forgiving K=7/D=1/40 amendment is House-specific, not a global change.

**Credit attribution is the new explicit decision:** these two stable providers earn/maintain VHM only. Bruckner work demonstrates reliability within the manufacturer's authorized service chain; that does not make the employer a subsidiary. No second BFS meter, ownership merger, generic corporate donor awards, House-style cross-introduction or points for whichever track currently supplies a recognition maximum. Corporate-recipient recognition can read an earned VHM level, but completing their jobs does not thereby refresh VHM.

No automatic rivalry loss or level-3 refusal against Kisaragi/other corporations is proposed. Commercial competition alone is not a selected political penalty. Existing Combine/CHR and amended House effects stay separate. Rank titles grant no free maintenance, warranty coverage, equipment upgrades, manufacturing licence, hidden contacts or unrestricted private arrivals.

## Approved important work — available at 1

New important BFS jobs pay **10,000 cr net at par** (its approved level-0 anchor) and require **trust 1**. Their low pay does not make them entry jobs. Keep this pool separate from ordinary commercial medians and mix.

| Stable template components | Treatment |
|---|---|
| `warranty-black-box-packages`, `incident-review-evidence-crates`, `quarantined-controller-returns` on the five BFS return lanes | Important, trust 1, +1/15 in the advanced band |
| `crew-direct:commissioning-engineer-team`, `crew-direct:warranty-inspector-party`, `crew-direct:incident-review-board`, `crew-direct:emergency-propulsion-service-crew` | Important, trust 1, +1/15; existing passenger requirements remain |
| Import feeder, hub/sub-hub/local service-stock distribution | Ordinary commerce, economic gate only |
| `failed-drive-service-returns`, `sealed-telemetry-return-lots` on those return lanes | Ordinary commercial recovery/collection, not automatically advanced trust work |
| `crew-direct:bruckner-field-technician-team`, `crew-direct:drive-alignment-crew` | Ordinary crew connectivity, economic gate only |

The five return lanes are `export-return-to-highliner`, `subhub-return-to-hub`, `leaf-return-to-subhub`, `leaf-return-to-hub`, `local-leaf-return-to-hub`. This yields **19 explicit important template identities**: 3 variants × 5 lanes + 4 crews. Match provider and persistent template parts, not displayed cargo strings or location ownership. The dividing line is the approved authoring choice: warranty/incident custody and specialist deployment build deeper trust, while generic returned hardware/telemetry and routine crews remain commercial. A different selection would require refitting the remaining pool.

All four direct VHM families—`direct-hardware`, `direct-return-to-weymark`, `people-outbound`, `people-return-home`—remain **trust 2**, ordinary for advancement, with current calibrated prices. Some of their own descriptions sound important, but they must not be the only way to earn the standing needed to accept them. Direct VHM is the unlocked commercial reward, not a circular 1→2 prerequisite.

No additional BFS trust-2 class is selected: expensive ordinary BFS work uses the 125k economic separator. A cheap direct VHM quote still requires 2; the reference direct range is roughly **91k–585k**, despite the pooled 300k median. This is the approved direct-work exception, not a guarantee that every factory posting pays more than every BFS posting.

## Read-only projection and entry supply

`tests/audit-vhm-reputation.ts` / `tests/run-vhm-audit.mjs` classify this proposal only in tooling. They fit the remaining BFS commercial curve on day-0–15 workloads, preserving ties, and reuse that fixed candidate curve later. Important quotes are projected at 10k/trust 1; direct VHM quotes are copied unchanged and classified at trust 2. Nothing replaces production price curves.

| Sample | BFS commercial | BFS important | Direct VHM | Projected commercial mix 0 / 1 / 2 | Commercial medians | Direct median |
|---|---:|---:|---:|---|---|---:|
| Days 0–15 reference | 1,604 | 1,611 | 1,208 | 20.0 / 60.0 / 20.0 | 10k / 100k / 150k | 300,000 |
| Days 16–31 check | 1,602 | 1,581 | 1,212 | 21.2 / 59.1 / 19.8 | 10k / 99,984 / 150,027 | 300,844.5 |
| Fresh days 64–79 | 1,613 | 1,584 | 1,239 | 19.9 / 61.2 / 18.9 | 10,002 / 99,708 / 150,489 | 299,436 |

All proposed important quotes are 10k and require 1. Reference contains **271 starter freight appearances** and **845 important freight appearances**; fresh sample has **273 / 818**. Important jobs appear at 56 canonical source boards in both samples, so advancement is not passenger-only. Commercial supply and important supply are separate denominators: about half of BFS offers in this proposal are important.

Sampling weights each public-board appearance equally, including appearances at different terminals sharing a local scope. These counts are not unique independent cargo loads, flight itineraries or earnings/hour. Reference/check use retained censuses reconstructed at current prices; fresh days 64–79 are newly generated boards. No forced board slots or rank-sensitive prices.

Practical candidates:
- **Caravanserai → Bruckner Weymark Depot:** ordinary import feeder / local service returns supply freight introductions; Main Commercial Dock has nine projected entry freight appearances in the reference window. Existing specialist qualifications vary; some need none beyond ordinary flight requirements.
- **Harlan's Stop ↔ Weymark Depot** and **Svarog drydock ↔ component station:** local commercial routes also provide sampled starter freight. The depot's operational arrival is public already, not a new reputation privilege. Other employers and empty relocation can connect jobs without eroding below-1 progress.
- At 1, selected warranty/incident return freight across the existing lattice and specialist crew jobs become advancement work. Both outbound service work and return movement remain available through the network; do not promise a same-day perfect loop or fifteen consecutive important offers at one terminal.
- **Farwatch remains contract-only**, even if its board has cheap BFS offers or the pilot knows a contact. It is not a public entry shortcut. The Still's public approach is not blanket permission to every restricted internal receiving location. Public contracts continue to authorize their own arrivals.

This is supply/price evidence, not a completed campaign or equipment/funding proof. Before runtime gates, verify actual 2+15 settlements, re-positioning costs, qualifications, current-standing checks and save-failure/retry behavior. Preserve earlier accepted BFS/VHM quotes—including expensive important-class bookings—and unrelated employers exactly.

## Validation and next review

- `node tests/run-equipment.mjs tests/vhm-reputation-review.test.ts`: **17,235 checks / 5,088 raw candidates / 282 actual day-0 postings**. All ten BFS and four direct VHM lane families, all nineteen important identities, unchanged source candidates/quotes, independent issuer matching, preserved zero VHM reimbursement, public depot/contract-only Farwatch and runtime gains/gates still inactive.
- Typecheck and existing standing/Combine/CHR (10,046 / 9,260 / 2,009) and income (44,245) checks pass; amended House review checks 4,491. Reproduce with `node tests/run-vhm-audit.mjs`; cached reference via `--input FILE`, later samples via `--reference FILE --first-day 64 --days 16`. `--save-census FILE` refuses overwrites. Temp `vhm-review-20261104-{reference,check,fresh}.json` and `vhm-review-20261104-fresh-census.json` retain evidence.
- No production/save/UI/fixture changes, no browser/mobile/live-save testing, no push/deploy. Neutral acceptance notices and atomic settlement will be reused during implementation, not advertised as already active here.

**Approval recorded:** explicit BFS→VHM earning/refresh, the nineteen important identities at 10k/trust 1, 2/15 progression and K=5/D=1/30 are accepted design, not live gameplay. Direct minimum 2, independence, approved incomes and accepted-quote preservation remain unchanged. **Kisaragi/KIS-E is next**; its classes and ownership are reviewed independently rather than copied automatically.
