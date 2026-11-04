# Kisaragi / KIS-E — progression review

Updated: 2026-11-04 (Pacific)
Status: **Approved KIS/KIS-E 4/20 progression, 10/50 decay, important prices and gates are implemented.** See [rollout validation](reputation-rollout.md). Comments below remain verbatim.

Prior review status (historical): **Reviewed; November 4 pacing comment resolved in design, not implemented.** Pete approved [VHM/Bruckner](faction-reputation-vhm.md) in `fbd06e9` and directed proceeding. Kisaragi's prices, stored track and KIS-E recognition already exist; this proposed earning path, important-price separation and contract locks do not. Runtime rollout remains separate from this review.

## Existing authority and distinctions

- **Kisaragi Shipyards Estella is the local subsidiary** of Kisaragi Harmony Shipyards. This differs from independent Bruckner's dealer relationship with VHM. Kisaragi leases facilities at Caravanserai Outfitter/Drydock, Svarog Shipyard and Serrat Domain Shipyard; it does not acquire the host stations. SSC and the Oathmark Accord remain independent operators, not Kisaragi employers.
- One saved track, **`kisaragi`**, with Unproven Hand → Proven Hand → Carrier of the Marque → Honoured Friend of the House. Stable provider IDs remain `kisaragi-harmony-yards` and `kisaragi-yards-estella`; public naming remains “Shipyards.” KIS-E already reads the full Kisaragi completed level, including 3, without a separate meter.
- **Silk, Porcelain and Celadon are product quality classes, not reputation ranks.** A Porcelain shipment is not automatically level-1 or important work; a Silk-class parent contract is still direct parent work. Celadon does not require reputation 3 under the approved direct-work minimum of 2. No local finished Celadon manufacture is introduced.
- KIS-E's approved newly unlocked commercial medians are **10k / 100k / 150k**, with economic ceilings **40k / 125k** and approximate **20/60/20** commercial mix. Parent KIS has a **single level-2+ commercial pool at 300k median**, not three paid bands. Eligibility meets quoted economic AND authored trust minima; equality at a ceiling remains in the lower band.
- KIS-E remains **freight-only**. Parent KIS handles personnel as well as prestige freight. No beginner passenger service is invented to bypass the direct-work floor.

Sources: [income targets](faction-reputation-income-targets.md), [framework](faction-reputation-progression.md), [manufacturer lore](interstellar-giant-corporations.md#kisaragi-harmony-shipyards), [economy](economy.md#kisaragi-harmony-shipyards--kisaragi-shipyards-estella), and `src/content/estella/faction-contracts/{kisaragi,kisaragi-estella,balor-trade}-contracts.ts`.

## Proposed progression and attribution

| Band | Qualifying work | Proposed gain |
|---|---|---|
| 0→1 | Successful KIS-E work | +1/4, four jobs |
| 1→2 | Seven KIS-E acceptance/rework identities below | +1/20, twenty important jobs |
| 2→3 | Future authored quests only | No ordinary-contract progress |
(zzz: KIS is harder to gain trust of, but more forgiving. So, let's say 4 jobs to level 1, 20 jobs to level 2, and K=10, D=1/50 for the decay)

**Resolution — November 4:** Adopted: introductory +1/4, important +1/20; ten unrelated completions are free, the eleventh starts −1/50 decay. Own KIS/KIS-E work refreshes the shared counter, integer floors remain protected. This replaces the initial 2/15 and 5/30 recommendation only for Kisaragi. No automatic production change or supply boost. Price/supply tables below remain valid; they do not simulate the revised twenty-job progression path.

Cap an award at the next integer. Every successful **KIS-E or direct KIS** contract refreshes the one Kisaragi grace counter, even when routine or above the ordinary cap. Already accepted legacy parent work remains valid and counts as related work; below 1 it can receive the ordinary introductory credit, rather than being cancelled by a newly enforced trust minimum.

Use **K=10** unrelated completions, then **D=1/50**, protecting the current integer floor. No passive erosion below 1. Empty/Old Nell travel, waiting, maintenance, retries, failed/abandoned jobs award/count nothing in the initial pass. These are Pete's selected Kisaragi parameters, distinct from VHM's K=5/D=1/30 and the Houses' K=7/D=1/40.

Credit/refresh goes explicitly to **`kisaragi`**, from these two provider IDs only. A KIS-E purchase at BAM Foundry earns Kisaragi standing, not BAM standing; SSC or Accord work at a shared shipyard does not earn Kisaragi standing. No points for whichever corporate track supplies a recognition maximum, no shared introductory corporate credit, and no House vassal-service credit because a title mentions a “House.” Existing recipient recognition can read an earned Kisaragi level but remains read-only.

No new rivalry penalties, competitor refusal, access perks or performance-based reputation penalties are proposed. The parent generator's “Sloppy burns are reputation damage” comment describes an unimplemented idea, not an existing scoring rule or authorization to invent one. Fuel overspend and existing delivery penalties keep their financial consequences; this pass proposes successful-completion credit, not a new perfection/fuel-efficiency threshold. No free shipyard services, equipment upgrades, ownership, contacts or hidden-site access follows from the titles.

## Proposed important work at level 1

New important KIS-E offers pay **10,000 cr net at par**, the local employer's approved entry median, while requiring **trust 1**. Preserve its existing 0.45 actual-fuel compensation and 2× cap: fixed completion pay includes unreimbursed par fuel in addition to the 10k net anchor. Existing accepted quotes are never rewritten.

| Persistent template ID | Reason for the proposed trust/advancement class |
|---|---|
| `facility-admin:yard-acceptance-documents` | Formal acceptance custody |
| `facility-admin:client-specification-archives` | Controlled client specification archive |
| `facility-admin:hull-warranty-packets` | Warranty-chain custody |
| `facility-admin:registry-and-fit-out-records` | Registry and final fit-out records |
| `facility-balancing:silk-class-acceptance-mockup-sections` | Physical acceptance proof work |
| `facility-balancing:porcelain-class-acceptance-mockup-sections` | Same role at another quality class |
| `facility-balancing:porcelain-class-pressure-shell-rework-lots` | Pressure-boundary corrective work |

These are explicit authoring choices, not generic cargo-name guesses. Other supplier freight, tooling, unfinished sections, viewport frames, fit-out modules and regional procurement remain ordinary commerce, with access determined by quoted earnings. Expensive ordinary KIS-E jobs may require 2 but do not advance 1→2. No additional local trust-2 class is proposed.

**Balor `tenant-fit-out-purchase` remains ordinary KIS-E work**, retaining its nine logical orders and paired orbital/direct dispatch behavior. The contractor's provider identity, not the BAM origin or the receiving shipyard's landlord, determines the credited relationship. Physical stock sourcing remains unchanged.

All five direct parent families stay **trust 2 and non-advancing**: `celadon-import`, `facility-prestige-transfer`, `prestige-records`, `people-outbound`, `people-return-hearth`. Parent acceptance records and inspectors cannot be the only way to earn the standing needed to accept them. Existing parent calibrated prices and **zero fuel reimbursement** remain unchanged; no Celadon-only rank-3 gate or stricter implicit quality gate is added.

## Read-only income and supply projection

`tests/audit-kisaragi-reputation.ts` / `tests/run-kisaragi-audit.mjs` classify the proposal in tooling only. The candidate KIS-E commercial curve excludes the seven important identities and is fitted on day-0–15 workloads, keeping equal workloads together. Important work is separately projected at 10k/trust 1. Parent prices are copied unchanged and classified at trust 2. No production curves or postings change.

| Sample | KIS-E commercial / important | Parent KIS | Projected commercial mix 0 / 1 / 2 | Commercial medians | Parent median |
|---|---|---:|---|---|---:|
| Days 0–15 reference | 341 / 29 | 205 | 19.6 / 60.4 / 19.9 | 10k / 100k / 150k | 300,000 |
| Days 16–31 check | 314 / 33 | 254 | 21.0 / 61.8 / 17.2 | 9,461 / 100,001 / 150,160.5 | 319,682 |
| Fresh days 80–95 | 305 / 38 | 232 | 20.7 / 58.4 / 21.0 | 9,549 / 99,780.5 / 149,964 | 292,307 |

Reference medians exactly meet the approved targets; later commercial medians remain within 6% in these windows. The parent pool's drift is reported, not refitted by this proposal. All important offers are freight, 10k net, minimum 1. Starter freight appearances are **67 / 66 / 63** respectively. Reference parent quotes span **172,033–529,852** net, all still trust 2; a median is not a guaranteed payout.

Counts weight each public-board appearance equally, including distinct canonical terminals sharing a scope; they are not unique loads, itineraries or earnings/hour. Reference/check use retained censuses reconstructed at current prices; days 80–95 are freshly generated. No per-board quotas, price-by-rank or seasonal refits.

### Important work is materially scarcer than Bruckner's

The reference's 29 important appearances represent **26 unique posting IDs**, across only **three physical facilities**, not twelve independent hubs. Of those appearances, 25 are acceptance/rework balancing and only four are admin shipments. Fresh sampling has 38 appearances / 34 IDs. Presence by physical source:

| Physical source | Days with important work, reference / 16 | Fresh / 16 |
|---|---:|---:|
| Caravanserai, across its terminal boards | 8 | 10 |
| Svarog Shipyard | 5 | 4 |
| Serrat Domain Shipyard | 5 | 8 |

Do not claim a daily important offer, a guaranteed twenty-job loop or BFS-like advancement speed. A single pilot cannot collect all simultaneous postings; even unique IDs are not a flight plan. The recommendation retains the seven meaningful classes rather than relabeling every Porcelain lot or changing posting weights to hide the scarcity. Actual completion-path/calendar pacing needs validation before gates are enabled; if it proves too sparse, review supply or qualifying classes explicitly and refit, rather than silently increasing gain or priority.

### Entry and onward access

- Public supplier pickups include **Hammer, Veles Terminal and Keelwright Works**, delivering to the leased facilities. The reference has 8 / 10 / 15 projected entry freight appearances at those respective sources, with a mix of ordinary and fragile-cargo qualification requirements. No House Mendes/Banner Forge loyalty is inferred from the Wells location.
- Public shipyard-to-shipyard commercial freight also supplies entry work. Caravanserai Main Commercial Dock has only **one** projected entry KIS-E appearance in the reference window; starting there does not guarantee immediate KIS-E work. Other employers or empty travel can reach another public pickup without eroding introductory progress.
- At 1, acceptance mockups/rework move between the same facilities, so important work can end at another important-work source. Admin work instead ends at Highliner Bay/Gaia offices; reaching a subsequent qualifying source can require ordinary own work, other employers or empty repositioning. Parent return-passenger jobs are not an entry shortcut: they remain at 2.
- KIS-E has no passenger-only progression requirement. Qualification, equipment, funds, maintenance and positioning costs remain independent constraints. Balor starter eligibility would not make its severe surface conditions easy; the sampled entry supply does not depend on inventing a new Balor route or changing dispatches.
- At 2, both higher-paying KIS-E commerce and all parent KIS families are available on reputation grounds, still subject to actual qualifications. At 3, no new ordinary income band or rights are invented. Public contracts continue to authorize their own arrivals; boards are not discovery-gated.

## Validation and next review

- `node tests/run-equipment.mjs tests/kisaragi-reputation-review.test.ts`: **9,667 checks / 1,232 raw candidates / 40 actual day-0 postings**. Includes review-only 4→1 / 20→2 arithmetic, eleventh-job decay, own-provider refresh, caps/floors, exclusions and preservation of arbitrary saved fractions; no production event handler imports this model. All seven important identities and nine lane families observed; local freight-only/no finished Celadon, parent zero reimbursement, Balor issuer attribution, host/supplier independence, quality-versus-standing separation, quote immutability and runtime gains/gates remaining inactive.
- Typecheck, House/VHM review checks (4,491 / 17,235), existing standing/Combine/CHR checks (10,046 / 9,260 / 2,009) and income checks (44,245) pass. Reproduce with `node tests/run-kisaragi-audit.mjs`; `--input FILE` uses a cached census, `--reference FILE --first-day 80 --days 16` generates a later sample against the fixed reference. `--save-census FILE` refuses overwrites. Temp `kisaragi-review-20261104-{reference,check,fresh}.json`, the fresh census, and `reference-supply` / `fresh-supply` reports retain evidence.
- No production/save/UI/historical fixture changes, browser/mobile/live-save tests, push or deploy. The approval of VHM/Bruckner remains a design approval, not an unreported runtime rollout.

**Review focus:** the seven important KIS-E identities at 10k/trust 1; explicit shared Kisaragi earning/refresh; Pete's selected 4/20, K=10/D=1/50; and the sparse important-work cadence. Approved income targets and direct-parent minimum 2 are not reopened. **[Covenant Remnants review](faction-reputation-covenant.md) next**, with its restricted external lanes and Seal/quest boundaries reviewed separately.
