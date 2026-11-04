# Economy

This file tracks the actor-driven economy for Space Teamster. It is a working design ledger for faction contract generation now, and for reputation/certification locking later.

## Physical contract destinations — 2026-10-23

Every contract displays the physical station/asteroid name instead of an internal receiving dock: The Still, The Caravanserai, Cupola Station, etc. Shared construction covers every public/contact provider; render-time views also cover cached/accepted contracts. Titles, source/destination fields, paths and endpoint references use physical names. Berth IDs, access, quotes, actual flights and settlement remain unchanged. Surface settlements remain distinct. See [Contract presentation](contract-presentation.md).

## Current contract model

Career contracts are generated from the player's current dock and career world time. On stations and asteroids, the local BBS pools postings from every selectable POI aboard the same station/asteroid; accepting a posting from a sibling POI silently starts the run from that POI. Planet and moon surface POIs do not share local boards. Faction providers produce explicit contract candidates with an issuer, tag, route, cargo label, cargo mass class, and likelihood. The freight board shows only authored issuer postings, weighted-picking up to10 candidates; passenger boards pick up to18. These include named factions and Gaia/Dahai/Camps' descriptive unnamed civilian issuers, not generic all-to-all open-market filler.

Mission pay follows the contract pay model (see below): a fixed reward plus optional fuel compensation, computed at settlement from the actual ΔV flown. Contract generators must choose cargo before cost estimation; `estimateEstellaMissionCost()` must not generate cargo internally.

2026-10-10 station-orbit correction: parent-frame station/captive ↔ child routes use the actual station orbital radius for departure/rendezvous, rather than imposing a low parent-parking detour. Selected interplanetary transfers departing from or arriving at a station in the transfer body's frame likewise escape/capture directly at that orbit. Surface launch/landing parking and the giant-child capture ellipse remain separate, unchanged terms. Academy of Sublime Measures → Daedalus Systems Campus changes from `8,083` to `383 m/s` par; reverse `8,095` to `395`. Using the recorded transfer parameters, Mirror Clinic → Academy changes from `7,201` to `1,063 m/s` (recorded actual `2,385`), and Academy → Mirror Clinic from `7,478` to `1,354` (recorded actual `1,615`). These are direct-route reference estimates, not replacements for measured ΔV; committed flight ledgers are not rewritten. `npm run test:par` covers these records, parent-surface cases, inward/outward parent-child routes, and published Academy board quotes.

For an interplanetary/inter-giant arrival whose operational destination is a moon of the destination gas giant, par uses a direct capture ellipse rather than full capture into low giant parking orbit followed by a separate Hohmann transfer back out to the moon. The standard plan targets a `3,000 km` periapsis altitude, performs one retrograde burn into an ellipse whose apoapsis radius is `2×` the target moon’s orbital radius (clamped to `90%` of the giant gameplay patch), crosses the moon’s orbit prograde, and then captures into child parking orbit from the resulting radial/tangential relative velocity. This is an attainable phased-intercept allowance; same-giant local routes, outbound nested-body escape, non-giant parents, and direct destinations at the giant retain their existing models. Six logged external/cross-giant Wells arrivals changed from `36,857 m/s` aggregate par to `13,200 m/s` against `10,957 m/s` actual (`83.0% actual/par`), matching the broader recent non-cross-giant calibration.

Current implementation:

- Faction provider registry and shared types: `src/content/estella/faction-contracts/index.ts`
- Miners Mutual generator: `src/content/estella/faction-contracts/miners-mutual-contracts.ts`
- Cerberus generator: `src/content/estella/faction-contracts/cerberus-contracts.ts`
- Balor Advanced Materials generator: `src/content/estella/faction-contracts/bam-contracts.ts`; paired dispatch routing: `src/content/estella/balor-logistics.ts`
- Bruckner Field Services generator: `src/content/estella/faction-contracts/bruckner-contracts.ts`
- Voss-Heinkel Metricwerke generator: `src/content/estella/faction-contracts/vhm-contracts.ts`
- Kisaragi Shipyards Estella generator: `src/content/estella/faction-contracts/kisaragi-estella-contracts.ts`
- Kisaragi Harmony Shipyards generator: `src/content/estella/faction-contracts/kisaragi-contracts.ts`
- Teamsters' Guild generator: `src/content/estella/faction-contracts/teamsters-guild-contracts.ts`
- Steel Combine generator: `src/content/estella/faction-contracts/steel-combine-contracts.ts`
- Glitterfield miners generator: `src/content/estella/faction-contracts/glitterfield-miners-contracts.ts`
- Halloran Smelting House generator: `src/content/estella/faction-contracts/halloran-contracts.ts`
- Pike mining companies generator: `src/content/estella/faction-contracts/pike-miners-contracts.ts`
- Cinderhook refining houses generator: `src/content/estella/faction-contracts/cinderhook-refiners-contracts.ts`
- Roadstead export brokers generator: `src/content/estella/faction-contracts/roadstead-export-contracts.ts`
- Hartwell machinery brokers generator: `src/content/estella/faction-contracts/hartwell-machinery-contracts.ts`
- Merren Conservatory generator: `src/content/estella/faction-contracts/merren-contracts.ts`
- House Nunes generator and Inquiry state: `src/content/estella/faction-contracts/nunes-contracts.ts`, `nunes-inquiries.ts`
- Covenant remnants generator: `src/content/estella/faction-contracts/covenant-contracts.ts`
- Daedalus Systems generator: `src/content/estella/faction-contracts/daedalus-contracts.ts`
- Pay model and cost estimation: `src/mission-cost.ts`
- Board/cost integration: `src/career-contracts.ts`
- BBS display: `src/game.ts`

## Contract pay model

Gross pay is two buckets summed, settled from the *actual* ΔV flown:

```
fixedReward = generosity * parFuel + flatReward
fuelComp    = compensationRatio * min(actualFuel, maxCompAllowance * parFuel)
grossPay    = fixedReward + fuelComp
net         = grossPay - actualFuel
```

Dials live on the faction contract candidate; unset dials fall back to defaults:

- `generosity` — fixed reward scaled with route difficulty (× par fuel). Default 0.75 for providers that omit a specific value.
- `flatReward` — flat credit floor/bonus. Default 0.
- `compensationRatio` + `maxCompAllowance` — reimburse actual fuel up to a cap. Default 0.4 / 2.

Most contracts now split pay between fixed reward and fuel reimbursement. Zero reimbursement is reserved for high-end high-risk/high-reward work where sloppy fuel use is the hauler's problem. Precision-risk (fragile cargo, landing quality, deadlines) belongs in contract requirements, not the pay curve.

Per-faction pay formulas (`fixed + reimbursement`, at-par net in parentheses):

| Faction | routine formula | notable overrides |
|---|---|---|
| New Canaan Miners Mutual | 0.60 + 0.45 (+5%) | emergency 0.85 + 0.45 (+30%); exports 0.70 + 0.35 (+5%) |
| Teamsters' Guild | 0.85 + 0.40 (+25%) | paperwork 0.90 + 0.35 (+25%); staging 1.30 + 0.15 (+45%); skim 1.70 + 0 (+70%) |
| Bruckner Field Services | 0.80 + 0.45 (+25%) | returns 1.20 + 0.25 (+45%); crew passengers 0.50 + 0.60 (+10%) |
| Cerberus Human Resources | 0.85 + 0.40 (+25%) | rare-metal/corporate 1.20 + 0.25 (+45%); workforce manifests 1.25 + 0.20 (+45%); people 0.50 + 0.60 (+10%) |
| Balor Advanced Materials | 1.00 + 0.40 (+40%) | personnel 1.00 + 0.50 (+50%); cap2; no flat rewards |
| Kisaragi Shipyards Estella | 0.80 + 0.45 (+25%) | freight-only |
| Voss-Heinkel Metricwerke | 1.55 + 0 (+55%) | hazard returns 1.70 + 0 (+70%); people 1.15 + 0 (+15%) |
| Kisaragi Harmony Shipyards | 1.50 + 0 (+50%) | Celadon 1.70 + 0 (+70%); people 1.20 + 0 (+20%) |
| Steel Combine | 0 + 1.00 fuel comp (0%) | exports 0.15 + 1.00 (+15%); no flat rewards |
| Glitterfield mining companies | outbound ore/ingots 0.80 + 0.40 (+20%) | depot→Cupola ore 0.35 + 0.65 (0%); supplies 0.65 + 0.45 (+10%); crews 0.30 + 0.60 (-10%) |
| Halloran Smelting House | 0.80 + 0.40 (+20%) | refinery crews 0.40 + 0.60 (0%); Gaia experts/delegations 0.50 + 0.60 (+10%) |
| Pike mining companies | depot exports 0.80 + 0.40 (+20%) | strip→depot ore 0.35 + 0.65 (0%); strip→Cinderhook 0.70 + 0.40 (+10%); shipyard/Veles Terminal exports 0.85 + 0.40 (+25%) |
| Cinderhook refining houses | refined exports 0.80 + 0.40 (+20%) | Roadstead staging 0.75 + 0.40 (+15%); certified shipyard/Tessera lots 0.85 + 0.35 (+20%) |
| Roadstead export brokers | brokered metal exports 0.75 + 0.40 (+15%) | certified lots 0.80 + 0.35 (+15%) |
| Hartwell machinery brokers | routine machinery 0.75 + 0.45 (+20%) | heavy equipment 0.85 + 0.40 (+25%); finance/legal packets 0.70 + 0.45 (+15%) |
| Covenant remnants | essential imports 0.25 + 0.80 (+5%) | Nunes dues 0.20 + 0.85 (+5%); compact service 0.25 + 0.80 (+5%); Postulants/pilgrims 0.15 + 0.90 (+5%); no flat rewards |
| Daedalus Systems | procurement/products 0.70 + 0.45 (+15%) | validation/data 0.80 + 0.40 (+20%); personnel 0.55 + 0.60 (+15%); Icarus intake 0.75 + 0.50 plus 20,000 cr (+25% + fee) |

## Balor multi-provider shipping — 2026-10-21

Hartwell Shipping (6 logical consignments), Merren (7), Daedalus (7), KIS-E (9), Steel Combine (4), Halloran (1), Cinderhook refiners (1) and Guild (10) now supplement BAM. Each retains its normal economics/role; Guild uses existing1.70+0 skim terms. Ordinary orders use paired50/50 Balor Orbital/direct handling; Guild skim work stays orbital. Existing seeded company rosters, Merren passenger distribution and pre-existing contracts remain unchanged. No forced second player leg, flat bounty or global board quota.

Skim Alpha/Beta are now selectable/dockable in clockwise stellar orbits at120/180million metres. Coronal remains a reserved endgame site. New contracts use operational Details and neutral receipts, not new unreviewed narrative copy. Full routes, terms and current audit in [Balor shipping](balor-shipping-audit.md); regression `npm run test:balor-shipping`.

## Gaia civilian / GOV / EDF shipping — 2026-10-23

Richelieu Orbital Terminal is the renamed main Gaia customs hub and the system's biggest transit hub (IDs retained). The original three-provider programme now has318 logical consignments/day:270 unnamed civilian bookings,27 Sector Government (`GOV`) and21 Estella Defence Force (`EDF`,18 personnel). Dahai reconciliation removes the obsolete Jiuyuan→Valenne nutrient export from the initial319-order roster; additional Dahai GOV/EDF work is counted below. Civilian issuers have descriptive names and no market tag. Existing25 provider rosters/pay remain intact.

New freight pays0.80+0.45 reimbursement; passengers0.60+0.60; cap2, no flat rewards. Civilian demand weight2.0 versus GOV/EDF0.65 creates a majority civilian economy without priority quotas. Each new order dispatches once/day, exactly50/50 Richelieu/direct over paired days. The public-candidate adapter also routes existing Gaia surface/offworld orders; native station services and local/contact/certification routes keep their original endpoints. New quotes use the actual dispatch endpoint; accepted quotes/history/saves are untouched.

City-specific imports/exports, EDF's Orselle interface after military-spaceport deletion, compatibility/narrative handling, raw-vs-capped-board distinctions and audit percentages: [Gaia shipping](gaia-shipping.md). Implementation `faction-contracts/gaia-contracts.ts` and `gaia-logistics.ts`; tests `npm run test:gaia-shipping`, read-only audit `npm run audit:gaia`.

## Dahai cities / civilians / planetology — 2026-10-23

Fuyuan, Zhulong, Jiuyuan and Bingjie reuse the four existing surface IDs. Fuyuan is the old capital and headquarters of the system-wide Estella Institute of Planetology (EIP). Jiuyuan supplies Dahai locally and remains import-heavy offworld; no new industrial faction.The original340-order programme now has338 daily orders after the approved finished-fuel retirement:214 unnamed civilian,78 EIP and46 from eight existing provider families. Existing Gaia/Merren counterpart roles corrected; unrelated seeded rosters/pay protected by frozen baselines.

All eligible public Dahai surface/offworld candidates use approximately50/50 orbital/direct dispatch before quoting; new orders exact paired50/50. Gaia/Balor choices remain independent. Native station/local/contact/timed work, accepted quotes/history/saves and physical-terminal naming remain intact. No forced second player leg. Civilian/Institute freight0.80+0.45, passengers0.60+0.60, cap2; other providers retain their own terms. Scientific specimens/archival originals travel physically, ordinary data electronically. Detailed ledger, roles, scope and120-epoch audit: [Dahai shipping](dahai-shipping.md); `npm run test:dahai-shipping`, `npm run audit:dahai`.

## Sahra / IX — implemented2026-10-24

Identity`d08aea7`; economy`c49726d`.78 distinct additions,67 average daily availability:40 civilian,15 Hartwell Shipping,7 machinery brokers,2 Steel,14 EIP. Ice/water staple exports, rare small veil-opal lots, household/merchant/education/clinical travel and equipment/service work.33 provider families. No water monopoly, miracle mineral or new Guild shipments.

Ordinary surface/offworld work uses independently paired50/50 Suhail/direct, including old eligible traffic. Native station/local work retained. **Raqib traffic is exclusively EIP**, including provisions, staff and instrument returns; ten occasional orders, one paired epoch per eight days. Three cut-opal lots0.08t available one pair per six days; two rough lots0.18t one pair per eight days; fragile/shock-protected at1.25+0.45. Standard civilian/Institute terms elsewhere; existing actors retain rates. Full ledger, coverage, compatibility and validation: [Sahra](locations/sahra.md).

**System-wide finished-fuel policy:** no dedicated full-container spacecraft-fuel jobs; fuel mass is too small. Remove11 Guild orders (eight legacy destinations, Scaffold1, Dahai2). Fuel services/background dispensary distribution and proprietary propulsion remain; industrial skim precursor feedstock/hardware/certifications unchanged. Old accepted fuel jobs retain classification/quotes and still settle. No new fuel chemistry or consumption tuning.

## Thule and sparse Barataria public work — implemented2026-10-25

Thule's tiny civic centre/common-share refuge and three cultural enclaves replace XIII's governor/relay/prison/classified placeholders.22 additional Thule orders (6 GOV/16 HSC;8 freight/14 passenger), six Barataria Observatory orders (2 HSC/4 EIP;4 freight/2 passenger).34 existing providers only; no new faction, company, broker or civilian aggregator. Two-day windows every8/12/16 days yield mean3.58 Thule/0.79 Barataria orders daily, ordinary board selection. Supplies, local water, repair returns, community/household passage and legitimate instruments/observers; no finished-fuel/speculative exports, compelled returns or surface smuggling.

Nunes's old Thule custody/watch/inquiry-field roles and Daedalus's old XIII relay field work retired by post-generation filtering, preserving original seed pools/all unrelated programmes. All12 Inquiries remain playable; accepted retired jobs/history/quotes untouched. All six Thule receiving sites public; share/indenture residency policy is lore, not a new player debt system. Exact roster, manifests, cadence and validation: [Thule](locations/thule.md). Barataria's hidden surface contracts still await contact reputation.

## Barataria identity only — initial pass2026-10-25

Estella XIV becomes Barataria; orbital station Barataria Observatory remains public. The three surface slots are now **The Warren** (concealed settlement), **False Bottom Cache** (storage) and **Blind Drop** (unstaffed handoff). **No surface contracts yet**, no new providers or economic templates. All three are unlisted; future smuggling work must be contact-reputation-gated. Existing BFS/VHM orbital service jobs remain unchanged. [Barataria ledger](locations/barataria.md).

## EDF Farwatch Station — implemented2026-10-25

Former Deepest Dock, now an EDF expedition/observation base investigating the Reach space-ghost phenomena. Contract-only arrivals: no empty runs even for known contacts. Public commercial postings supply authorization; existing BFS/VHM service traffic remains. No new provider or assumed ghost harvesting/data-courier trade.

15 additional logical orders:9 EDF (station provisions/maintenance, equipment returns, duty/technical rotations),6 EIP (observation instruments/recalibration, researchers, Tessera optics).9 freight/6 passenger. Whole two-day windows every4/6/8 days:mean16/3 available orders daily, ordinary weighted boards, not guaranteed departures. Freight.80+.45/passengers.60+.60, cap2; instruments protected, standard passenger comfort. Existing Orselle/Fuyuan/Mosaic orbital/direct policies retained; no new Reach gateway. Detailed manifests, baseline and validation: [Farwatch](locations/farwatch.md).

## Weymark small mining and crew travel — implemented2026-10-24

`66d2dfb`:20 daily additional orders through descriptive Independent Weymark bookings (34 providers total):8 modest mining/supply/repair consignments and12 crew bookings across six bidirectional pairs. Low Gauge produces selected12t concentrates for Cupola/Hammer and16t shielding stock for Nell's Rest; assay samples, drill heads, pressure stores and pump overhauls support the workings. Crews connect mine/town/Nell's Rest/Bruckner depot with limited Caravanserai/Harlan/Veles visits. Existing food/civilian/Bruckner/VHM/Guild networks remain intact.

Freight0.75+0.40, passengers0.60+0.60, cap2; standard crew comfort, assay fragility retained. Town/mine surface movement stays on the ground; no blanket Weymark gateway rerouting or compulsory second leg. **Nell's Lantern is an abandoned navigation outpost with zero freight/passenger traffic**; Old Survey Camp remains reserved. IDs/access/physics and all15899 old routed candidates preserved. Ledger/testing: [Weymark](locations/weymark.md).

## Camps completion pass — review corrections implemented2026-10-24

Runtime/tests89317da. All31 existing site roles now appear in terminal copy; Pike functional names become Flint Mine/Switchback/Pike Depot. Ascension Scaffold operates as a refit/remanufacturing station. Svarog Shipyard Company names the existing single independent landlord, separate from Kisaragi tenants and the commune. Tessera has independent physical-metrology/precision-workshop identity and ordinary civic services.

Original programme now163 daily logical orders after Scaffold fuel retirement:110 unnamed civilian,17 SSC,14 EIP,7 Steel,4 Hartwell Shipping,4 Daedalus,3 machinery brokers,3 GOV,1 Guild drive-service order. Additions remain outside legacy seeded pools; the Sahra follow-up explicitly removes only finished-fuel work from those old pools. The Camps pass brought the provider count to32; Sahra adds the33rd. Existing company rates preserved; new civilians freight0.80+0.45/passengers0.60+0.60; SSC0.75+0.45/0.55+0.60; cap2.

Hartwell/Tessera eligible ordinary surface/offworld trade chooses50/50 gateway/direct, independently at each end and alongside Gaia/Dahai/Balor. Native station business is not relocated to force an overall quota: Roadstead's brokerage creates substantially higher whole-world gateway shares. Dedicated Pike ore/refinery legs, Kuznia/Kalyna trade membranes, local/contact/timed work and saved/accepted contracts remain intact. First Landing and Black Tile stay reserves; the other29 Camps sites now have sampled traffic both ways. No new NPC/service/physics/visual layer. Full decisions, routes, audit and operator `zzz` comments: [Camps review](camps-review.md). Commands: `npm run test:camps`, `npm run audit:camps`. Both `zzz` comments resolved: Flint Mine and Svarog Shipyard Company/SSC; public shipbuilding terminology now uses shipyard throughout, including Kisaragi/maintenance copy. Legacy internal names/IDs/cargo labels are retained where they seed economics; presentation aliases do not reprice or rewrite records. The original pre-review b4f3a6c snapshot remains preserved. The authorized Sahra routing/additions and fuel deletions now have a separate pre-change6067506 regression baseline; all surviving old raw orders are protected, alongside4273 exact postings on untouched source boards.

## Faction: Balor Advanced Materials (BAM)

- ID `balor-advanced-materials`, tag `BAM`; engineer-led Balor operator, safety/competence and well-paid skilled labor are sincere.
-26 authored lane families,56 logical route/cargo consignments/day,27 cargo labels.13 labels newly classified (five ordinary freight, one fragile sensor package, seven elevated-comfort passenger manifests); others reuse existing classifications.
- Extraction: cutters, hot-zone actuators/sensors and seals inbound; refractory concentrates and overhaul returns outbound.
- Foundry: pumps, finished Daedalus controller racks/predictive-maintenance processors, Olympos graphite/oxygen inbound; refractory alloy billets, linings, thermal tiles, high-purity ceramics and rebuildable pumps outbound. No unqualified prototype hardware in ordinary production procurement.
- Shade: food, medical lockers, water and scrubbers; rated specialist recruitment and paid leave/return rotations. Field/commissioning deployment and return also serve the industrial sites. Passenger manifests use elevated comfort; no coerced or cheap crew blocks.
-18 external sites; Kuznia uses Hammer/Anvil, Kalyna uses its orbital hub, Daedalus uses Systems Campus (not Server Farm/Icarus). Shipyard and Still thermal-material orders do not manufacture Guild fuel or proprietary drives.
- Each logical consignment has one posting per day, either consolidated at Balor Orbital or direct to its proper surface site. Two-day dispatch pairs assign one day to each route, with pair-specific deterministic hashing. This gives exactly50/50 over complete pairs by count AND likelihood, independently inbound/outbound and freight/passenger. Cargo mass is keyed to the logical order, not gateway/day. Posting details preserve the originating/receiving surface site and explain BAM-arranged local handling.
- No extra player leg, self-route, local Balor shuttle or mine-to-foundry posting. Actual completed flights and capped boards are not constrained to50/50. The subsequent multi-provider expansion adds35 ordinary logical orders with the same paired dispatch policy and10 orbital-only Guild skim orders; existing candidate paths remain unchanged.
- Existing shared neutral completion receipt used; bespoke narrative copy/recruitment slogans remain subject to approval. No new named contact, save schema, deadline or heat mechanic.

`npm run test:bam` validates route completeness, routing balance/determinism, classification/comfort/licenses, payable boards and playable phases. `npm run audit:balor` audits120 raw epochs and12 sampled board epochs from selectable sources. See [Balor](locations/estella-01-balor.md) and [shipping audit](balor-shipping-audit.md).

## Faction: The Steel Combine

- ID: `steel-combine`
- Tag: `STEEL`
- Public name: The Steel Combine
- Home world: Kuznia (Estella VI) — a People's Republic that is at once republic, company, and commune
- Posting authorities (both STEEL): Steel Combine Planning Office (internal), Steel Combine Foreign Trade Committee (external)
- Key nodes: Hammer Station (`estella-vi-heavy-cargo-station`, bulk membrane), Anvil Station (`estella-vi-main-transit-dispatch`, light/passengers/paperwork membrane), Gornilo Crucible (`estella-vi-foundry-complex`), Perun City (`estella-vi-industrial-city`), Mokosh Lowlands (`estella-vi-agricultural-lowlands`), Kopanka Mine (`estella-vi-mountain-mining`), Morana Station (`estella-vi-polar-weather-research`), Port Stribog (`estella-vi-spaceport`)

The Combine runs Kuznia as a planned economy behind an orbital trade membrane. It does market profit only grudgingly: nearly all its posted work is fuel-compensation only (net-zero, no-loss "safe transfer"), the real reward being in-kind/reputation (deferred until reputation exists). Full lore: `design-docs/locations/kuznia.md`.

### Job kinds

- Internal distribution (common): Hammer/Anvil ↔ surface, both ways. Planning Office. Compensation-only. Hammer legs are bulk/heavy; Anvil legs are light/passengers/paperwork.
- Imports (sparse): likely feedstock sources (New Canaan `harlan-dock`/`mercer-dock`, Caravanserai) → Hammer. Foreign Trade Committee. Compensation-only.
- Exports (sparse, lucrative): Hammer → external buyers (Svarog Shipyard, Veles Terminal, Caravanserai outfitter, Mosaic Assembly Lab, and Oathmark shipyard/forge buyers). Foreign Trade Committee. Compensation + a modest fixed premium.

Imports and exports are deliberately sparse — the Combine leans on other companies' shipping for most external trade.

### Cargo

Each lane draws from a cargo pool, sampled per route and world-day, so goods vary across contracts and over time:

- Hammer → works (feedstock/supplies): smelter feedstock, iron-ore pellets, coke and flux, scrap charge, alloying additives, refractory brick (Gornilo); billet/plate/bar stock, casting blanks, machine-tool stock (Perun); mining supplies, drill stock, blasting charges, shoring timber, cutting heads (Kopanka).
- Works → Hammer (finished/ore): rolled structural sections, steel billets, plate steel, rail/beam stock, alloy ingots, pressure-pipe stock (Gornilo); finished machinery, machine tools, pumps/compressors, gear assemblies, prefab modules, vehicle chassis (Perun); specialty/rare-earth/refractory/high-grade ore (Kopanka).
- Anvil ↔ surface (light): work crews, shift rotations, plan directives, quota allocations, tooling and spares, medical supplies (down); quota reports, production returns, work rotations, spent-tooling returns, personnel transfers (up); food allotments from Mokosh; weather/forecast/survey data from Morana.
- Imports: titanium tailings concentrate, basalt fiber feedstock, scrap pressure alloy, regolith aggregate, bulk silicates (New Canaan); imported refractory feedstock, off-world alloy stock, bulk industrial chemicals, imported machine parts (Caravanserai).
- Exports: structural sections, hull plate, pressure-shell blanks, frame members (Svarog); certified steel stock, structural billets, fastener stock, welded assemblies (Veles Terminal); heavy machinery, prefab modules, cargo-frame stock, structural components (Caravanserai outfitter); precision alloy billets, tool-steel stock, high-purity ingots, instrument-grade alloy (Tessera); outer-spec hull plate, certified frame members, shipyard machine-tool stock, armor-grade plate, and proofed structural billets (Oathmark).

### Kuznia membrane rule

Only the Steel Combine operates on Kuznia's surface. Every other faction interfaces exclusively at the orbital membrane — Hammer (bulk) and Anvil (parts/personnel/light) — never a surface node. Redirected accordingly: Co-op (tailings/basalt → Hammer; seals/recycler/rations → Anvil), Cerberus (rare metals/carbon-fiber/valves → Hammer; workforce recruitment removed from Kuznia entirely), Bruckner & VHM (parts/technicians → Anvil), Kisaragi Shipyards Estella (supplier inputs → Hammer). The moons Svarog and Kalyna are independent polities and exempt.

### Pay

Compensation model: `generosity 0`, `compensationRatio 1.0`, `maxCompAllowance 2` for routine internal distribution/import/passenger work. Exports use `generosity 0.15`, `compensationRatio 1.0`, and no flat reward.

### Reputation hooks later

Combine reputation is a cost-and-access ladder, not a pay ladder: at-cost repair/refit at Perun City, at-cost resupply, priority weather-gated berthing, sanctuary/CHR-defector work, and — the cash tier — trusted-carrier access to the paying export runs. Combine standing is most valuable to a poor early-game Teamster. The 2× compensation cap still leaves large botch losses on the big surface↔orbit runs.

## Glitterfield (Belt mining cluster)

- Cluster: `glitterfield` — a metal-rich Belt cluster (renamed from the former "The Working"); denser than the mined-out New Canaan Field.
- Stations: Cupola Station (`industrial-refinery-asteroid-es-m-0002`, the refinery) plus four ore depots — Grubstake (`grubstake-depot-dock`), Highgrade (`highgrade-depot-dock`), Slagfoot (`slagfoot-depot-dock`), Deepcut (`deepcut-depot-dock`).
- Model: a swarm of small Hartwell mining companies work the field; all ore funnels through the single Cupola Station refinery. Ore and metal stay in-system.

### Glitterfield mining companies

- ID: `glitterfield-miners` (shared). No market tag — too small to appear on the system market, so contracts show only the company name.
- 20 companies sampled from a name pool, each assigned 1–2 ores and one home depot (stable roster).
- Ores: nickel-iron, cobalt, platinum-group, chromite, nickel concentrate, rare-earth-bearing.
- Flows: shift crews in (Hartwell → depot); mining and life-support supplies in (Caravanserai / Hartwell → depot); ore to the refinery (depot → Cupola, in-cluster); occasional raw ore direct to in-system buyers (depot → Hammer / Svarog); refined ingots out (Cupola → Hammer / Svarog).
- Pay: outbound ore/ingots use `generosity 0.8`, `compensationRatio 0.4` (+20% at par). In-cluster depot → Cupola ore is deliberately low-risk / low-reward: `0.35 + 0.65` (break-even at par). Supplies use `0.65 + 0.45` (+10%). Shift crews use `0.3 + 0.6` (-10%).

### Halloran Smelting House

- ID: `halloran-smelting-house`, tag `HALL`.
- A Hartwell firm that took its cut instead of digging — it runs the Cupola Station refinery, the chokepoint all Glitterfield ore must pass through ("the House always takes its cut"). It ships no metal itself; the miners and buyers move the ingots.
- Flows: refinery consumables in (flux, electrodes, reagents); crew in from Hartwell; experts and executives in from Gaia (the House is wealthy); crew and executive rotations out.
- Pay: consumables use `generosity 0.8`, `compensationRatio 0.4` (+20% at par). Refinery crews use `0.4 + 0.6` (break-even), and Gaia experts/executives use `0.5 + 0.6` (+10%).

### Buyer side

Refined metal reaches the Camps two ways: the miners haul ingots out, and buyers source directly from Cupola — the Steel Combine's `import-glitterfield` lane (Cupola → Hammer) and Kisaragi Shipyards Estella's finished-goods sourcing.

## Pike mining companies

- ID: `pike-mining-companies` (shared). No market tag — small Hartwell mining houses post under company names.
- Roster: 20 stable Pike companies sampled from a name pool, each assigned 1–2 clean-metal product families.
- Core nodes: Pike Strip Mine (`estella-va-strip-mine`), Pike Ore-Handling Depot (`estella-va-ore-handling-depot`), Cinderhook Refinery (`estella-v-atmo-refinery`), Roadstead Customs, Hammer Station, Svarog Shipyard, Veles Terminal.
- Surface flow: Pike Strip Mine → Pike Ore-Handling Depot for orbital export lots, and Pike Strip Mine → Cinderhook for Hartwell refining.
- Export flow: all off-Pike system sales originate at Pike Ore-Handling Depot. Common Hartwell-brokered lots go first to Roadstead; direct buyer contracts still go to Kuznia/Svarog buyers. There are no direct strip-mine-to-Kuznia/Svarog contracts.
- Cargo palette: nickel-iron strip ore/ingots, clean sulfide concentrate, reduced metal lots/billets, magnesium-aluminum silicate feedstock, clean pressure-metal billets, certified Pike ballast slabs.
- Pay: strip → depot uses `0.35 + 0.65` (break-even at par), strip → Cinderhook uses `0.70 + 0.40` (+10%), depot exports use `0.80 + 0.40` (+20%), and shipyard/Veles Terminal exports use `0.85 + 0.40` (+25%).

## Cinderhook refining houses

- ID: `cinderhook-refining-houses` (shared). Small Hartwell refining houses post under company names.
- Roster: 16 stable Cinderhook houses sampled from a name pool.
- Source: Cinderhook Refinery only. Pike/Dawes extractors own inbound raw-feed legs; Cinderhook houses own outbound refined lots.
- Destinations: Roadstead Customs for export staging and brokerage; Hammer Station for industrial feedstock; Svarog Shipyard and Veles Terminal for shipyard-certified stock; Mosaic Assembly Lab for precision metal/feedstock. Roadstead staging is intentionally the densest lane.
- Cargo palette: certified clean-metal lots, pressure-alloy billets, reduced-metal ingots, low-carbon plate feedstock, certified weld stock, instrument-grade alloy blanks, sulfide byproduct drums, ceramic flux precursors, clean ballast slabs.
- Pay: Roadstead staging uses `0.75 + 0.40` (+15% at par), routine refined exports use `0.80 + 0.40` (+20%), and certified shipyard/Tessera lots use `0.85 + 0.35` (+20%).

## Roadstead export brokers

- ID: `roadstead-export-brokers` (shared). Hartwell broker houses post under company names.
- Roster: 16 stable export brokers sampled from a name pool.
- Source: Roadstead Customs only. Roadstead is Hartwell's orbital trade membrane: customs, brokerage, consolidation, and clean-title export.
- Destinations: Hammer Station, Svarog Shipyard, Veles Terminal, Mosaic Assembly Lab, Caravanserai, Serrat Domain Shipyard, Keelwright Works, and Banner Forge.
- Cargo palette: Hartwell clean-metal lots, brokered Pike nickel-iron ingots, Cinderhook pressure-alloy billets, low-carbon plate stock, instrument-grade alloy blanks, reduced-metal billets, Pike sulfide concentrate, certified Pike ballast slabs.
- Pay: routine brokered lots use `0.75 + 0.40` (+15% at par); certified lots use `0.80 + 0.35` (+15%).

## Hartwell machinery brokers

- ID: `hartwell-machinery-brokers` (shared). Hartwell broker houses post under company names.
- Roster: 18 stable brokers sampled from a name pool.
- Model: brokers finance, charter, and lease Kuznia/Svarog machinery into Hartwell, Pike, and Wells industrial works. They are not manufacturers; they convert claims, liens, and future ore into equipment today.
- Sources: Hammer Station, Anvil Station, Svarog Shipyard, Veles Terminal, and Roadstead Customs.
- Hartwell/Pike destinations: Roadstead Customs, Concord, Dawes Cut, Cinderhook Refinery, Gale Survey, Pike Strip Mine, Pike Miner Hab, and Pike Ore-Handling Depot. Roadstead imports machinery from Kuznia/Svarog and can then post onward Hartwell/Pike/Wells distribution.
- Wells destinations: non-noble industrial sites only, including The Count's Well, Red Vein Works, Ember Court Foundry, Marcher Wells, Alembic Ring, Yellow Pit, Almaden Orbital, Cinnabar Cut, Coldgate, Blue Fen Refinery, Marisma Cauldron, Blackwater Fields, Bottom Court, Keelwright Works, Bluefire Mine, and Castle Teide's isotope charter office. Noble castles, Covenant sites, Daedalus, and Ratline House are excluded.
- Cargo palette: drill heads, pump skids, hoist drums, crusher modules, compressors, vacuum loaders, ore sorters, refinery maintenance skids, sulfur-rated loader frames, cryo pump skids, hydrocarbon separator skids, survey instruments, claim beacons, assay benches, sealed title/export-lien packets, control cabinets, valve kits, and cryo-safe valve racks.
- Pay: routine machinery uses `0.75 + 0.45` (+20% at par), heavy/awkward equipment uses `0.85 + 0.40` (+25%), and paper/legal packets use `0.70 + 0.45` (+15%).

## Hartwell shipping companies

- ID: `hartwell-shipping-companies` (shared). Small Hartwell carriers and spot-freight houses post under company names.
- Roster: 18 stable companies sampled from a name pool.
- Model: route arbitrage and backhaul. These firms buy or charter underpriced Wells resource lots into Camps demand, then keep ships earning with basic Hartwell/Kuznia life-support into all Wells destinations and industrial consumables back into Wells worksites. They are carriers/speculators, not machinery financiers.
- Wells -> Camps sources: Gryphon Aerie, The Count's Well, Red Vein Works, Ember Court Foundry, Marcher Wells, Alembic Ring, Hydra Maw Orbital, Yellow Pit, Almaden Orbital, Cinnabar Cut, Coldgate, Blue Fen Refinery, Marisma Cauldron, Blackwater Fields, Bottom Court, Bluefire Mine, Castle Teide's isotope office, Serrat Domain Shipyard, and Keelwright Works.
- Wells -> Camps destinations: roughly 80% of Wells resource/export freight first goes to Cadiz Highport for consolidation; roughly 20% posts as direct buyer legs to Hammer Station, Anvil Station for light/bonded lots, Svarog Shipyard, Veles Terminal, Kalyna Orbital for cold-chain/industrial inputs, Zhitomir Hydroponics for specialty chemical inputs, Teteriv Broiler Farm for organic inputs, and Mosaic Assembly Lab for precision feedstock/isotopes. Cadiz Highport then posts consolidated Wells export lots onward to those Camps buyers.
- Hartwell/Kuznia -> Wells backhaul: Roadstead, Concord, and Anvil send life-support filter pallets, pressure-suit consumables, frontier ration lockers, medical clinic lockers, scrubber beds, and habitat sealant to all Wells destinations, weighted toward population and traffic hubs such as Cadiz Highport, Serratine Goods Exchange, Serratine, Herald Gate, and Macao Palace. Hammer, Anvil, and Veles Terminal send compressor cartridges, cryo-safe valves, lubricants, worksite batteries, and worker supply pallets to Wells industrial works and Cadiz/Serratine Goods Exchange.
- Distinctive Kalyna exports belong to Merren Conservatory rather than generic Hartwell carriers. Hartwell companies retain ordinary third-party procurement and inbound arbitrage into Kalyna.
- Pay: routine resource/bulk arbitrage uses `0.75 + 0.40` (+15% at par), certified/rare lots use `0.85 + 0.40` (+25%), isotopes use `0.95 + 0.30` (+25% with more fuel risk), and basic backhaul uses `0.70 + 0.45` (+15%).

## Passenger board: Hartwell Labor Exchange

- ID: `hartwell-labor-exchange`. No market tag — this is an institutional posting network used by several labor, clinic, registry, and charter desks, not one company.
- Board: passenger contracts only; freight board excludes them.
- Core nodes: Roadstead Customs and Concord.
- Model: Hartwell is a frontier finance, charter, and labor-export world. It sends crews, contractors, specialists, claim-office parties, and return rotations through the system rather than posting profitable freight.
- Coverage: Camps work sites, Belt work sites, Wells hubs, and a limited set of non-noble Wells work sites: Marcher Wells, Yellow Pit, Blackwater Fields, Keelwright Works, and Bluefire Mine. Passenger traffic to Kuznia proper terminates at Anvil Station; the Steel Combine handles surface distribution. Svarog and Tessera remain direct passenger destinations. Kalyna is excluded because Merren and the Work Union control its narrow passenger network.
- Hearth/Hartwell traffic is special: not ordinary worksite crew blocks, but long-term shift cohorts, completed shift returnees, claim-office parties, and executive/supervisor staff moving into Hartwell.
- Pay: connectivity work, not profit work. Special passenger postings use `generosity 0.4`, `compensationRatio 0.6`, `maxCompAllowance 2`, so par breaks even. Regular Hartwell crew transfers use `generosity 0.45`, `compensationRatio 0.5`, `maxCompAllowance 2`, so par is about -5% and 1.5× par fuel use is about -30%.

Current passenger families: Hartwell worksite crew blocks, bonded contractor crews, technical specialist parties, Hartwell return rotations, medical return passengers, long-term Hartwell shift cohorts, executive/supervisor staff, completed shift returnees, and claims-office passenger parties.

Other factions can also post passenger-board work when the manifested load is people rather than freight: Cerberus workforce/custody/labor/delegation groups; BFS technician and inspection crews; VHM engineers/auditors/commissioning parties; Kisaragi shipwright, inspector, representative, and rotation parties; Steel Combine Anvil work/shift/personnel movements; Glitterfield shift crews; and Halloran refinery crews, experts, executives, and delegations. Most are low-margin connectivity work; VHM and Kisaragi are exceptions that pay fixed premium rates with no reimbursement.

## Faction: Merren Conservatory

Merren Conservatory, formerly Merren Colonial, owns independent Kalyna and underwrites the moon’s Udarniki producer communities. Its economy is biological, condition-sensitive, and vertically integrated. Teteriv Broiler Farm, Zhitomir Hydroponics, and Dnipro Pools send inspected cultures, specialty foods, pharmaceutical botanicals, conservatory stock, and aquaculture to Kalyna Orbital. Orbital distributes controlled inputs back to the surface and is the sole external freight gateway. Long-haul output consists of pre-sold medical, living, culinary, conservatory, off-system, and stewardship orders; it is not speculative bulk food.

External procurement brings clean volatiles, organic feedstock, environmental equipment, cold-chain hardware, and certified biological reference cultures into Kalyna Orbital. Customer sites independently return reusable cassettes, culture racks, transport frames, and quarantine samples. Existing customer-authored purchases and ordinary third-party Hartwell imports remain, but the former generic Kalyna luxury-export lane is removed.

Passenger traffic is deliberately narrow. Merren sponsors permanent worker-household immigration from Roadstead and Concord. Biological, clinical, aquaculture, quarantine, and conservatory specialists travel only between Kalyna and Gaia/Dahai. Generic Hartwell Labor traffic no longer serves Kalyna. Reciprocal Udarniki work pilgrimages use a global route mix of 50% Anvil↔Kalyna Orbital, 25% Anvil↔a Kalyna surface producer, and 25% Kalyna Orbital↔a Kuznia surface worksite. The Combine explicitly grants these exchange parties direct surface access. Combine-funded Kuznia cohorts and returns use `0.00 + 1.00`; Merren Work Union-funded Kalyna cohorts and returns use `0.10 + 0.90`. Both are zero-flat, `2×`-cap, near-zero-profit connectivity work.

All Merren contracts have zero flat award. Internal movement, procurement, and reusable returns use `0.25 + 0.80` (+5% at par); standard exports use `0.30 + 0.75` (+5%); premium biological cargo, immigration, and specialists use `0.40 + 0.70` (+10%). Kalyna Orbital hosts the Merren Conservatory Export House, while all four Kalyna locations host Merren Work Union Passage Halls.

## Faction: The Teamsters' Guild

- ID: `teamsters-guild`
- Tag: `GUILD`
- Public name: The Teamsters' Guild
- Key nodes: the Still (`still-distribution-bay`, `still-guild-hq`, `still-skim-runner-berth-poi`), Skim Hubs (`skim-hub-alpha-precursor-dock`, `skim-hub-beta-precursor-dock`), Certification Authority (`caravanserai-certification-authority`)

The system-wide fuel-and-engine monopoly. Guild work is posted only at Guild nodes — it is not a jobs-everywhere faction. Route families: industrial precursor skim-in (near-star hubs / Balor Orbital → the Still, hazard-premium pay), engine/RCS supply (the Still → outfitters and shipyards), and certification/insurance/debt paperwork. Finished spacecraft fuel has too little mass to justify dedicated container jobs:11 such orders retired inc49726d, with dispensary supply handled in background logistics. Fuel services and already accepted jobs remain intact.

### Pay

Base routine formula is `generosity 0.85`, `compensationRatio 0.4` (+25% at par). Paperwork uses `0.9 + 0.35` (+25%). Skim staging uses `1.3 + 0.15` (+45%). Skim precursor uses `1.7 + 0` (+70%) as high-risk/high-reward work with no reimbursement.

### Notes

The marquee1.7 skim-precursor runs at Alpha/Beta are now reachable: both hubs have exact stellar orbits and docking layouts. Additional1.7 skim duty/recovery rotations, supply runs and precursor consolidation connect them with Balor Orbital. Passengers get elevated comfort; precursor still requires volatile certification, and refining stays at the Still. Coronal remains an unauthored endgame reserve. Reputation later should gate the skim and cert/insurance/debt work.

## Faction: New Canaan Miners Mutual

- ID: `new-canaan-miners-mutual`
- Tag: `CO-OP`
- Public name: New Canaan Miners Mutual
- Colloquial name: the Co-op
- Home region: New Canaan Field
- Key docks: `harlan-dock`, `mercer-dock`
- HQ: Harlan's Station / Harlan Dock

The Co-op is a miner mutual and bulk supply broker for the worn-down New Canaan Field. It survives on low margins by aggregating member output, finding buyers with better processors, and buying life-support/maintenance supplies in bulk from cheaper external suppliers. It does not source much from Caravanserai except in emergencies because Serai prices are high.

### Business needs

Inbound to New Canaan:

- filters, recycler membranes, pump cartridges
- pressure seals and valve blocks
- rotary bearing kits
- airlock actuator assemblies
- bulk ration packs
- medical cold-chain lockers
- oxygen bottles and certified pressure gas
- emergency patch kits when cheaper suppliers are unavailable

Outbound from New Canaan:

- low-grade titanium tailings concentrate
- basalt fiber feedstock
- scrap pressure alloy
- regolith shielding blocks
- sealed assay cores

### Current route families

Emergency Caravanserai sourcing:

- `caravanserai-main-commercial-dock` -> `harlan-dock` / `mercer-dock`: emergency patch kits
- `caravanserai-refuel-depot` -> `harlan-dock` / `mercer-dock`: emergency oxygen bottles

Preferred inbound suppliers:

- Anvil Station (`estella-vi-main-transit-dispatch`) -> New Canaan docks: pressure seals and valve blocks
- Anvil Station (`estella-vi-main-transit-dispatch`) -> New Canaan docks: recycler pump cartridges
- Veles Terminal (`estella-via-component-supply-station`) -> `harlan-dock`: rotary bearing kits
- Svarog Shipyard (`estella-via-drydock-station`) -> New Canaan docks: airlock actuator assemblies
- Anvil Station (`estella-vi-main-transit-dispatch`) -> New Canaan docks: bulk ration packs
- Kalyna Orbital (`estella-vib-cold-chain-station`) -> New Canaan docks: medical cold-chain lockers
- `still-public-approach-dock` -> New Canaan docks: certified pressure gas cylinders

Outbound brokerage:

- New Canaan docks -> Hammer Station (`estella-vi-heavy-cargo-station`): low-grade titanium tailings concentrate
- New Canaan docks -> Hammer Station (`estella-vi-heavy-cargo-station`): basalt fiber feedstock
- New Canaan docks -> Svarog Shipyard (`estella-via-drydock-station`): scrap pressure alloy
- New Canaan docks -> Veles Terminal (`estella-via-component-supply-station`): regolith shielding blocks
- New Canaan docks -> `estella-iii-high-tech-city`: sealed assay cores

### Reputation hooks later

Low-rep Co-op work should be ordinary freight and emergency errands. Higher reputation can unlock member-only relief work, distressed-claim salvage, arbitration-adjacent courier jobs, oxygen-credit rescue deliveries, and better-margin aggregated export lots. Co-op reputation should also affect how Harlan/Mercer locals talk to the player in BBS/dialogue scenes.

## Faction: Cerberus Human Resources

- ID: `cerberus-human-resources`
- Tag: `CHR`
- Public name: Cerberus Human Resources
- Home world: Acheron / Estella II
- Key nodes: `estella-ii-commercial-hub-dock`, `estella-ii-olympos`, `estella-ii-pandemonium`

Cerberus Human Resources is a vertically integrated extraction, custody, and labor-management corporation. Its business loop is: people and hydrogen go down; rare metals and profit go up; carbon materials, paperwork, and influence move everywhere.

Acheron Commercial Hub and Olympos serve different business roles. The Commercial Hub is the offworld interface: customs, staging, brokerage, inspection, paperwork, and routine transshipment. Olympos is the city and headquarters: high-value direct delivery, CHR offices, Carbonvale production, Paradiso luxury demand, executive traffic, and the atmospheric interface to the Pandemonium chain. When CHR templates point at Acheron destinations, their intended destination mix is roughly 60% Commercial Hub, 30% Olympos, and 10% Pandemonium.

Pandemonium's ordinary flight traffic is personnel and heavy equipment inbound, metals outbound. Its workers self-govern under Thomas Thorne; CHR controls resources from Olympos rather than staffing a surface prison. Hydrogen is strictly rationed and delivered by the Olympos tether, not public flight contracts. Nimbus supplies Olympos locally in background logistics; direct Nimbus–Pandemonium aid is reserved for a later vignette. CHR imports industrial H2 from Gryphon Aerie directly to Olympos through ordinary freight contracts, separate from Guild fuel. Avoid routine same-body surface-to-surface postings; orbital Hub–surface work remains valid.

### Business needs

Inbound custody/workforce traffic:

- workforce transfer groups
- custody transfer passengers
- surface labor allocations
- executive delegations and compliance teams

Surface operations inputs:

- deep-pressure valve assemblies
- mining cutting assemblies
- industrial pressure seal crates
- acid-rated lift bearings
- executive medicine lockers
- other pressure/chain/smelter equipment

Acheron exports:

- platinum-group metal ingots
- pressure-mined rare metal pallets
- silica crystal stock
- carbon-fiber structural rolls
- graphene cable stock
- graphite heat-sink blocks
- industrial oxygen bottles

Corporate/luxury traffic:

- shareholder packets
- sealed legal archives
- sealed audit records
- Paradiso hospitality cargo
- executive delegations

Acheron-local transshipment:

- custody processing passengers
- workforce transfer manifests
- rare-metal export staging pallets
- Carbonvale export lots
- pressure-chain equipment pallets
- local hospitality, medicine, audit, and orbital custody staging

### Current route families

Workforce and custody origins are system-wide population, legal, and industrial hubs:

- `estella-iii-capital-city`
- `estella-iii-finance-city`
- `estella-iii-main-customs`
- `estella-iv-primary-city`
- `estella-iv-main-orbital-station`
- Concord (`estella-v-capital-settlement`)
- `caravanserai-main-commercial-dock`
- `caravanserai-customs-inspection`
- `caravanserai-free-trader-anchorage`
- `estella-xid-main-port`
- `estella-xid-customs-transit`

Custody/workforce destinations:

- origins -> `estella-ii-commercial-hub-dock`: workforce transfer group
- origins -> `estella-ii-olympos`: custody transfer passengers
- origins -> `estella-ii-pandemonium`: surface labor allocation

Acheron-local traffic:

- `estella-ii-commercial-hub-dock` -> `estella-ii-olympos`: custody processing passengers, pressure-chain equipment pallets, Paradiso hospitality cargo, executive medicine lockers, sealed audit records
- `estella-ii-olympos` -> `estella-ii-commercial-hub-dock`: workforce transfer manifests, rare-metal export staging pallets, Carbonvale export lots, shareholder packets, sealed legal archives
- `estella-ii-commercial-hub-dock` -> `estella-ii-pandemonium`: surface labor allocation (orbital intake, not a surface-to-surface shuttle)
- `estella-ii-pandemonium` -> `estella-ii-commercial-hub-dock`: rare-metal export staging pallets

Carbonvale and Olympos exports:

- `estella-ii-commercial-hub-dock` / `estella-ii-olympos` -> `estella-vi-heavy-cargo-station` (Kuznia membrane): carbon-fiber structural rolls
- Acheron corporate nodes -> `estella-via-drydock-station` / `caravanserai-outfitter-drydock`: graphene cable stock
- Acheron corporate nodes -> `estella-via-component-supply-station`: graphite heat-sink blocks
- Acheron corporate nodes -> `estella-xid-main-port` / `estella-vi-heavy-cargo-station`: industrial oxygen bottles

Rare-metal/surface exports:

- Acheron surface-ops nodes -> `estella-iii-high-tech-city`: platinum-group metal ingots
- Acheron corporate nodes (Commercial Hub/Olympos) -> Mosaic Assembly Lab (`estella-vii-high-vacuum-factory`): silica crystal stock; not direct Pandemonium flight cargo
- Acheron surface-ops nodes -> `estella-vi-heavy-cargo-station` (Kuznia membrane): pressure-mined rare metal pallets

Surface operations inputs:

- `estella-vi-heavy-cargo-station` (Kuznia membrane) -> Acheron surface-ops nodes: deep-pressure valve assemblies
- `estella-via-component-supply-station` / `estella-via-drydock-station` -> `estella-ii-olympos`: acid-rated lift bearings
- `estella-vib-cold-chain-station` -> `estella-ii-olympos` / `estella-ii-commercial-hub-dock`: executive medicine lockers
- Hammer Station -> Pandemonium: mining cutting assemblies
- Hammer Station / Veles Terminal -> Pandemonium: industrial pressure seal crates
- Gryphon Aerie (`estella-x-observation-skim-hub`) -> Olympos: industrial hydrogen tanks, ordinary CHR freight economics (`0.85+0.40`, cap2)
- No public H2 flight to Pandemonium and no public Nimbus–Pandemonium route. Legitimate local hydrogen transfers are background logistics.

Pandemonium arrivals use approved worker-led completion scenes: personnel, cutting assemblies, or industrial parts. Metal-export pickup prose appears in posting Details; offworld receiving messages remain at the destination. The terminal and catalog use the approved location introduction. Thorne is named in contact markup; no warden/compliance-officer reception or Renard-secret disclosure. Existing accepted contracts/history are not rewritten.

Corporate/governance/luxury:

- Acheron corporate nodes -> `estella-iii-finance-city`: shareholder packets
- Acheron corporate nodes -> `estella-iii-capital-city`: sealed legal archives
- `estella-iii-finance-city` / `estella-iii-capital-city` -> Acheron corporate nodes: sealed audit records
- `estella-iii-luxury-orbital-habitat` / `estella-iv-primary-city` / `caravanserai-highliner-bay-poi` -> `estella-ii-olympos` / Macao Palace (`estella-xic-research-station-poi`): Paradiso hospitality cargo
- `estella-iii-finance-city` / `estella-iii-capital-city` / `estella-ii-olympos` -> `estella-ii-olympos` / `estella-iii-finance-city` / Macao Palace: executive delegation

### Reputation hooks later

Low-rep CHR work can be ordinary corporate cargo, legal archives, and bulk materials. Higher reputation can unlock custody work, direct Olympos deliveries, surface labor allocations, Pandemonium-linked work, higher-value rare-metal lots, and private executive traffic. CHR reputation should eventually conflict with some factions and alter BBS/dialogue tone: corporate clients trust reliable CHR carriers, while labor/Union/Co-op actors may react badly to visible CHR association.

## Interstellar shipbuilding actors

### Kisaragi Harmony Shipyards / Kisaragi Shipyards Estella

- Parent: Kisaragi Harmony Shipyards
- Parent ID: `kisaragi-harmony-yards`
- Parent tag: `KIS`
- Estella subsidiary: Kisaragi Shipyards Estella
- Subsidiary ID: `kisaragi-yards-estella`
- Subsidiary tag: `KIS-E`
- Gaia corporate HQ for now: `estella-iii-finance-city`

Kisaragi is the luxury-prestige hull side of the hulls/engines duo. It does not build normal rank-and-file Teamster rigs. It rents substantial facilities at massive shipyard stations instead of owning whole shipyards: Caravanserai Outfitter/Drydock, Svarog Shipyard, and Estella XIe Outer-Spec Drydock. The Svarog Shipyard facility focuses on luxury yachts, specialty ships, and high-end cruise liners. The XIe facility focuses on extra-large mobile refineries and gas-giant industrial hulls. KIS-E handles in-system freight and local shipping representation; it does not generate passenger contracts. KIS proper handles prestige cargo and Kisaragi personnel movement.

Kisaragi ship tiers:

- Silk-class: superbly crafted Kisaragi vessels, already far above ordinary working ships
- Porcelain-class: true luxury vessels for clients who expect quiet perfection in every finish, fit, and pressure boundary
- Celadon-class: barely-affordable masterpieces; Celadon personal yachts are numbered in the hundreds across the whole galaxy

Kisaragi sells finished ships, not loose components. Cargo labels such as `Porcelain-class viewport assemblies` or `Celadon-class hull elements` refer to internal Kisaragi-certified parts and modules moving through the shipyard chain for those vessels. A ship may use components of its own class or higher, so a Porcelain-class liner uses Porcelain-or-better parts, while a Celadon-class yacht requires Celadon-grade work throughout. Finished Celadon-class components generally originate off-system through Highliner Bay or move between Kisaragi facilities after import, matching, or rework. Estella suppliers do not manufacture finished Celadon-class components; they provide Silk/Porcelain-class goods and non-classed premium inputs.

KIS-E current route families:

- Supplier -> Kisaragi facilities: Silk/Porcelain-class cargo and non-classed premium inputs only. Oathmark supplier legs use Keelwright Works for ship components, not Banner Forge martial production.
- Kisaragi facility -> Kisaragi facility: Silk/Porcelain-class balancing, unfinished sections, fit-out modules, tooling, rework lots
- Kisaragi facility -> Highliner Bay / Gaia HQ: light documents and records only

KIS-E cargo palette:

- Silk-class cabin liner panels
- Porcelain-class cabin liner panels
- Silk-class acoustic isolation kits
- Porcelain-class acoustic isolation kits
- Silk-class promenade fit-out crates
- Porcelain-class pressure-door frames
- Porcelain-class panoramic viewport assemblies
- Porcelain-class exterior fairing panels
- Porcelain-class pressure-shell sections
- Porcelain-class refinery frame reinforcement lots
- Porcelain-class gas-giant corrosion shielding panels
- prestige ceramic feedstock
- high-finish pressure alloy lots
- viewport crystal blanks
- acoustic metamaterial stock
- corrosion-shield laminate blanks
- precision frame castings
- shipyard acceptance documents
- client specification archives
- hull warranty packets

KIS proper current route families:

- Highliner Bay -> Kisaragi facilities: off-system Celadon-class imports
- Kisaragi facility -> Kisaragi facility: Silk/Porcelain/Celadon-class prestige balancing, matching, and rework cargo
- Kisaragi facility -> Highliner Bay / Gaia prestige destinations: acceptance records, registry vaults, warranty evidence, client suites, and archives
- Gaia HQ -> Kisaragi facilities: parent-company shipwright, fitting, inspection, and recovery crews
- Kisaragi facilities -> Gaia HQ: return legs to the Hearth for Kisaragi personnel

KIS proper cargo/passenger palette:

- Silk/Porcelain/Celadon-class cabin liner panels
- Silk/Porcelain/Celadon-class acoustic fit-out kits
- Porcelain/Celadon-class panoramic viewport assemblies
- Porcelain/Celadon-class docking collar assemblies
- Celadon-class hull elements, from Highliner Bay imports only
- Celadon-class pressure-shell sections, from Highliner Bay imports only
- Celadon-class luxury liner modules, from Highliner Bay imports or facility rework
- Celadon-class signature shell modules, from Highliner Bay imports only
- Celadon-class highliner frame interface rings, from Highliner Bay imports only
- Celadon-class matching shell sections, facility-to-facility after import/rework
- Celadon-class acceptance mockup sections, facility-to-facility after import/rework
- Kisaragi master shipwright delegation
- hull acceptance board
- interior finish inspectors
- executive fitting delegation
- owner representative party
- Kisaragi recovery rotation crew

Reputation hooks later: KIS-E should be the entry path for Kisaragi shipyard logistics and should never carry Celadon-class items. KIS proper should unlock after trust/reputation and should carry Celadon-class prestige work, shipwright delegations, client-facing acceptance work, and luxury/highliner hull contracts.

**November 4 review:** [Kisaragi progression proposal](faction-reputation-kisaragi.md) selects seven local acceptance/rework identities as a proposed 1→2 path while preserving all parent work at trust 2. Silk/Porcelain/Celadon remain quality classes, not standing levels. Existing parent prices and zero reimbursement, local freight-only behavior, Balor purchases and host-shipyard independence are unchanged. The supply audit flags sparse important postings; no new gates, performance penalties or prices are live.

## Faction: Voss-Heinkel Metricwerke

- ID: `voss-heinkel-metricwerke`
- Tag: `VHM`
- Public name: Voss-Heinkel Metricwerke
- Independent local service/dealer partner: Bruckner Field Services
- Primary Estella corporate home: `estella-iii-finance-city`
- Primary hardware custody point: `estella-viii-harder-approach-station`

VHM proper is the rare, high-value parent-company layer above BFS. BFS moves service packages through an aggregation lattice; VHM moves sealed parent hardware and corporate authority directly. Precision manufacturing/testing as a separate VHM in-system subsidiary is deferred.

Current VHM route families:

- Bruckner Weymark Depot -> weighted BFS service leaves: direct rare hardware, with dockyards, outfitter/service nodes, vacuum stations, and component/fabrication nodes weighted highest; surface precision-industry sites are low-weight exceptions
- BFS service leaves -> Bruckner Weymark Depot: sealed evidence, warranty, and failed critical-system returns
- Gaia corporate HQ -> Weymark Depot / weighted service leaves: VHM factory engineers, audit teams, commissioning crews, warranty boards, incident teams, executive inspectors, and dealer compliance auditors
- Weymark Depot / service leaves -> Gaia corporate HQ: return legs home for VHM personnel after inspections, audits, and incident work

Current VHM cargo palette:

- VHM propulsion core assembly
- factory-certified main drive module
- metric field coil cartridge
- phase-locked field regulator bank
- field geometry control stack
- sealed orbital maneuvering engine package
- null-field stabilization crate
- prototype field regulator package
- restricted civilian driveware crate
- sealed accident telemetry core
- VHM warranty black-box vault
- drive incident evidence locker
- failed field regulator vault
- quarantined propulsion control stack
- VHM factory engineer delegation
- metric-drive audit team
- warranty arbitration board
- senior commissioning crew
- field geometry incident team
- executive inspection party
- dealer compliance auditors

Reputation hooks later: VHM work should be locked behind proven BFS/VHEP-style trust, high reliability, and probably certification. VHM reputation should unlock parent-company hardware, warranty evidence, executive travel, and Highliner/Big Iron-adjacent work.

**November 4 review:** [VHM/Bruckner progression proposal](faction-reputation-vhm.md) gives BFS the explicit earning path to the already planned direct minimum 2. It separates selected important work from commercial calibration while retaining independent ownership and existing fuel/accepted-quote terms. This is not runtime progression or a new reliability/certification meter.

## Faction: Bruckner Field Services

- ID: `bruckner-field-services`
- Tag: `BFS`
- Local partner/dealer: Bruckner Field Services
- Principal manufacturer/supplier: Voss-Heinkel Metricwerke
- Manufacturer tag, later high-tier: `VHM`

VHM is the metric-drive side of the hulls/engines duo. It is centralized around interstellar imports rather than distributed local manufacturing. Bruckner Field Services is independent: the authorized service, parts, and maintenance bureau and exclusive Estella dealer for the full civilian VHM line. Shared VHM standing does not make it a subsidiary. BFS sells, stores, certifies, refurbishes, dispatches technicians, and preserves warranty chain-of-custody; it does not manufacture VHM core systems.

BFS's central Estella logistics foothold is on Weymark, not Caravanserai. Caravanserai Highliner Bay remains the import touchdown and customs interface, but Bruckner Weymark Depot is the private distribution, certification, and service hub.

Weymark naming:

- `estella-viii`: Weymark
- `estella-viii-first-rendezvous-station`: Nell's Rest, Guild-facing first-rendezvous station, maintenance shipyard, and mechanics hub
- `estella-viii-harder-approach-station`: Bruckner Weymark Depot, BFS distribution and precision-service hub
- `estella-viii-settlement`: Weymark Town
- `estella-viii-mining-site`: Low Gauge Mine
- `estella-viii-captured-moonlet`: Nell's Lantern
- `estella-viii-moonlet-docking-site`: Lantern Dock
- `estella-viii-abandoned-site`: Old Survey Camp

### Current BFS network model

BFS cargo follows a service lattice rather than a commodity flow. It uses Caravanserai Highliner Bay as the interstellar import/export touchdown, Bruckner Weymark Depot as the central owned distribution hub, one regional sub-hub in the Hearth, one in the Camps, one at each Wells gas giant, and one in the Reach. Practical final destinations are mostly vacuum stations, dockyards, service nodes, and industrial clients; ordinary population centers and research sites are avoided. Surface work is deliberately rare and weighted low, limited to precision machinery support at factories, mines, and specialized industrial sites. Dockyards and ship-service nodes carry the highest leaf weights. In the Wells, BFS/VHM service networks avoid Ratline House and Covenant enclave sites; ship-component service traffic uses Keelwright Works rather than Banner Forge.

Core nodes:

- Import touchdown: `caravanserai-highliner-bay-poi`
- Central hub: `estella-viii-harder-approach-station`
- Hearth sub-hub: `estella-iii-main-customs`
- Camps sub-hub: Veles Terminal (`estella-via-component-supply-station`)
- Estella X sub-hub: `estella-xc-transit-refuel`
- Estella XI sub-hub: `estella-xid-main-port`
- Estella XII sub-hub: `estella-xii-observation-post`
- Reach sub-hub: `estella-xiii-main-port`

Current route families:

- Highliner Bay -> Bruckner Weymark Depot: VHM civilian drive inventory, certified propulsion service stock, metric-drive dealer inventory, sealed warranty replacement lots
- Bruckner Weymark Depot -> Highliner Bay: failed drive service returns, warranty black-box packages, sealed telemetry return lots
- Bruckner Weymark Depot -> regional sub-hubs: main drive maintenance supplies, RCS installation kits, field calibration service kits, propulsion diagnostics kits, thermal-control maintenance kits, drive alignment certification kits
- Regional sub-hubs -> weighted service leaves: main drive maintenance supplies, field calibration service kits, RCS maintenance supplies, warranty recertification packages, certified drive overhaul kits, vibration isolation service kits
- Leaves -> sub-hub / Weymark: failed drive service returns, warranty black-box packages, sealed telemetry return lots, incident review evidence crates, quarantined controller returns
- Sub-hub/leaf -> up to two weighted direct crew destinations per board: Bruckner field technician teams, drive alignment crews, commissioning engineer teams, warranty inspector parties, incident review boards, and emergency propulsion service crews

BFS cargo palette:

- VHM civilian drive inventory
- certified propulsion service stock
- metric-drive dealer inventory
- sealed warranty replacement lots
- main drive maintenance supplies
- RCS installation kits
- field calibration service kits
- propulsion diagnostics kits
- thermal-control maintenance kits
- drive alignment certification kits
- certified drive overhaul kits
- failed drive service returns
- warranty black-box packages
- sealed telemetry return lots
- Bruckner field technician teams
- drive alignment crews

## Faction: Oathmark Accord Authority

The Oathmark Accord Authority is the neutral operator of Serrat Domain Shipyard, Keelwright Works, and Oathmark Academy. It issues grey-sealed single-leg warrants through Serrat Domain Shipyard Dispatch, the Keelwright Works Warrant Office, the Oathmark Academy Registrar, and the Accord Custody Office. Banner Forge and overt House military traffic belong to the separate House Mendes provider.

Core flows:

- Keelwright Works → Serrat Domain Shipyard: proofed structural stock, actuator assemblies, calibration kits, control cabinets, and other production output.
- Serrat Domain Shipyard → Keelwright Works: failed service returns, rework lots, quarantined controllers, spent tooling, and specification archives.
- Shipyard/Keelwright → Oathmark Academy: referee telemetry, training drones, and verdict material.
- Oathmark Academy → the shipyard, Wells courts, and tournament sites: certified telemetry packages, drone packs, and verdict rolls.
- Shipyard/Keelwright → Svarog, Veles Terminal, Hammer, Mosaic, Cadiz, and major Wells orbital facilities: certified refit and component exports.
- Oathmark Academy → neutral examinations and dispute sites: referees, review boards, technical parties, appraisers, and arbitration counsel.
- Rare Emergency Mediation Warrants carry Accord arbitrators, seal clerks, truce witnesses, charter-combat referees, succession mediators, and evidence registrars to Wells courts, castles, and arenas.

Routine terms use `0.15` generosity plus `0.85` actual-fuel compensation capped at twice par. Flat warrant fees are `6,000 cr` for internal freight, `12,000 cr` for exports, `10,000 cr` for ordinary neutral passengers, and `20,000 cr` for emergency mediation. Courier work and multi-hop mission sequences remain future design candidates; the initial provider uses ordinary single-leg settlement only.

## Faction: House Mendes

**November 3 update:** the authored fee/percentage paragraphs for all three Houses below describe generator inputs and historical quotes. [Income calibration](faction-reputation-income-implementation.md) now replaces fixed pay on new ordinary offers; accepted quotes and Inquiry terms remain intact. The [House progression review](faction-reputation-houses.md) proposes important classes, normalized Mendes 3:4:2 weights and an isolated income refit, but is not implemented.

House Mendes operates the Wells muster-logistics network from Banner Forge. Lord Marshal Vasco Mendes directs its warrants from the House Mendes Marshalcy at Castle Mendes. Banner Forge stages both material and personnel: proofed armor, shock lances, robotic destriers, target automata, field fortifications, command equipment, guard inspectors, captains, surgeons, adjudicators, clerks, and logistics officers.

Permanent Forge Intake postings provide reliable access to Banner Forge from Serrat Domain Shipyard and Cadiz Highport. They carry armor plate, instrument-grade alloy blanks, machine-tool stock, and carbon-fiber structure under routine `15,000 cr` Mendes terms. Wider industrial flows already supply the Forge: the Steel Combine exports Kuznia plate and structural stock from Hammer, while Roadstead brokers deliver Cinderhook pressure-alloy billets and instrument-grade Hartwell blanks. Glitterfield/Cupola Belt metal continues through Hammer before onward Steel Combine delivery rather than bypassing the established bulk membrane.

The generator allocates a named muster to every favorable Hydra→Gryphon and Hydra→Manticore transfer opportunity. A fixed three-day allowance covers escape from Hydra before the parent-SOI transfer. Gryphon and Manticore mobilizations remain simultaneous when their windows overlap; either one suppresses new Hydra-local outbound muster postings. In their absence, Banner Forge supports rotating Almaden, Marisma, Macao, and Cadiz musters. This timing is internal: player-facing postings name the muster and Lord Marshal but never expose a receiving period or muster calendar.

Each muster later produces independent return work. Equipment, telemetry, damaged armor, target automata, and after-action records return to Banner Forge; inspectors, captains, surgeons, adjudicators, clerks, and logistics officers return to Castle Mendes. Outer returns use favorable reverse transfers. Return postings do not require the player to have flown an outbound contract and remain ordinary single-leg missions.

Muster titles remain `Deliver X to Y` or `Transport X to Y`. Details and completion text always name both the muster and Lord Marshal Vasco Mendes. Terms use `0.40` generosity plus `0.60` actual-fuel compensation capped at twice par, with a `25,000 cr` outbound muster fee and `15,000 cr` return fee. Future Mendes reputation should make muster deliveries the House’s strongest repeatable source of standing; the planned weights are `+3` for Hydra outbound, `+4` for outer outbound, and `+2` for return work.

## Faction: House Alvares

House Alvares hires Teamsters for the bulk physical consequences of liege authority rather than documents, couriers, ordinary commerce, or wealthy principals. The Ducal Weights Office collects in-kind dues; the Governor’s Reserve releases public allotments; and the Court of Escheat removes and reassigns property under judgment. Goods may be physically ordinary ice, metal, hydrocarbons, isotopes, machinery, or infrastructure, but their source and destination have already been determined by assessment, grant, or court order.

Each assessed producer emits one Herald Gate due and one direct assigned levy, with daily priority alternating between the two. Herald Gate emits four grants, and five selected commercial/industrial sites emit escheat removals to auction, public, or court-authorized recipients. This gives `48%` of generated dues/grants/escheat candidates a Herald Gate endpoint, meeting the target of roughly half while preserving direct assignments. Herald Gate hosts the Governor’s Reserve and Ducal Weights Office directory listing.

A separate Office of Investitures and Public Occasions operates at Castle Alvares and Serratine. Deterministic occasions rotate among weddings, birth presentations, comings of age, investitures, succession recognitions, and public-works dedications at lesser House seats. The Office sends official delegations and feast apparatus from Castle Alvares or Serratine, subsidizes passenger movement for three less-wealthy household retinues, and later offers independent passenger and reusable-equipment returns. Senior nobles and ordinary couriers still use House craft; Teamster passages move complete delegations, support households, and bulky feast installations.

Dues, grants, and routine assigned levies use `0.25 + 0.75` with `15,000 cr` flat pay; heavy escheat uses `25,000 cr`. Occasion freight and subsidized/return passages use `0.30 + 0.70` with `20,000 cr`; official Alvares delegations use `25,000 cr`. Titles remain ordinary `Deliver X to Y` / `Transport X to Y`, while authored details identify the obligation or occasion.

## Faction: House Nunes

House Nunes expresses Rodrigo Serrat’s inherited “watch”: Manticore and Reach wardenship, outer relays, recovery, quarantine, exile administration, private archives, sensitive custody, hidden medicine, and patronage of the Wells’ sparse learned institutions. It does not absorb Oathmark martial work, Covenant internal traffic, Coimbra AI research, smuggling, ordinary commerce, or the public authority of Alvares and Mendes.

The learned estate uses medieval categories rather than modern academic disciplines. Common-born and lesser-cadet Magisters practice natural and celestial philosophy, alchemy, physic and physiology, optics, cosmography, and occult or magisterial arts as universalists. Nunes patronage circulates apparatus, specimens, recorder vaults, field parties, and disputing Magisters among the Academy of Sublime Measures, Blackglass Observatory, Mirror Clinic, Frostglass Collegium, Teide Survey Collegium, Manticore Observatory, the Far Bell Tower, and practical alchemical houses. Patronage does not imply House ownership.

Three persistent **Inquiries** remain open at once. Each has an authored subject, principal institution, ordinal, and `100` progress. It gains `0.25` progress per elapsed game-world day and `8` from each successfully delivered Inquiry contract. Retries and abandoned contracts add nothing. An accepted contract remains attached to its Inquiry through delivery even if passive progress would otherwise close it. Closure records a short history and opens the next catalog Inquiry; repeated names gain ordinals such as `4th Inquiry of Captive Stone`. Contract prose rotates among `in furtherance of`, `for the learned advancement of`, and `in service of the observations and proofs belonging to` the named Inquiry. The economy does not evolve with progress: all Inquiry legs use `0.25 + 0.75`, `20,000 cr`, and a `2×` cap.

Routine Outer Ward work uses `0.20 + 0.80` plus `15,000 cr`; recovery and quarantine use `0.10 + 0.90` plus `35,000 cr`; quiet custody uses `0.25 + 0.75` plus `30,000 cr`. Four Local Directory offices represent the Chamber of Inquiry, Academy patronage, Blackglass observations, and Mirror Clinic custody. The first two provide a live Open Inquiries view.

## Faction: Covenant Remnants

The `[COVENANT]` provider is deliberately narrow. Estella generally shuns Covenant commerce, internal Mercy/Vigil distribution stays off the public board, and ordinary-Seal succession is reserved for a future quest line. The Covenant itself posts only four legal lanes:

- Essential imports from Wells sources to Pilgrim Gate, with lower-volume Camps and Belt procurement. Cargo rotates among clinic stores, biological reference cultures, implant-compatible pharmaceuticals, neural-interface media, cultivation inputs, environmental controls, machine-tool stock, ceramics, and power-conditioning assemblies.
- In-kind compact dues from Pilgrim Gate to Castle Nunes: high-quality Toil valve blocks, pressure doors, habitat fittings, relay cooling plants, and ice-work pumps.
- Genesis physicians and neural researchers from Pilgrim Gate to Mirror Clinic for the research and medical service promised to Nunes after Arkfall.
- Sparse notarized Postulant and sanctioned-pilgrim passage to Pilgrim Gate. Postulants have made the required declarations while unsealed and outside Covenant custody; the manifest explicitly carries the matched notarial and household-sponsorship record.

Pilgrim Gate is the sole public trade membrane. Procurement uses `0.25 + 0.80`; material dues use `0.20 + 0.85`; compact service uses `0.25 + 0.80`; passage uses `0.15 + 0.90`. All have a `2×` fuel-compensation cap and no flat reward.

Covenant production does not become a Covenant export lane. Four deterministic Hartwell shipping factors occasionally buy unpopular but excellent Toil goods directly at Pilgrim Gate and move them under their own company contracts at low likelihood to Cadiz, Hartwell/Kuznia, or the Reach. Smuggling through Pilgrim Gate belongs to the future smuggler provider, not this one. Public work excludes weapons, Second Crusade preparation, Seal freight, command authority, Arkfall recovery, and forced recruitment.

**November 4 review:** [Covenant progression proposal](faction-reputation-covenant.md) selects one introductory import, then compact dues/service and documented passage at trust 1 / 5k net for advancement. The candidate essential-import refit has substantial holdout entry-median drift; approved 5k/25k/50k targets remain unchanged and broader calibration plus funded return-path validation are required before rollout. No production prices/gates, Seal privileges, internal lanes or Nunes/Hartwell attribution change.

## Faction: Daedalus Systems

The `[DAEDALUS]` provider presents Coimbra as an ambitious human-run electronics and compute campus. Public contracts never mention autonomous general intelligence, machine governance, Icarus 3.0, alignment, personality simulation, or the project's deceptive progress layers. Institutional issuers are Daedalus Systems Procurement, Product Fulfillment, Field Validation, Research Personnel, and Research Administration; routine copy uses no named contacts.

Physical topology is intentionally asymmetric:

- External suppliers send processor wafers, hardened memory, optical interconnects, storage substrates, power hardware, radiators, cleanroom stores, fabrication stock, ceramics, sensors, and electronics consumables to Server Farm or Systems Campus.
- Systems Campus exports navigation accelerators, industrial controllers, driver-stack appliances, predictive-maintenance processors, sensor-fusion cabinets, simulation modules, hardened flight computers, and automation interfaces to system-wide customers below VHM's proprietary metric-drive layer.
- Campus sends prototype control hardware to selected field sites. Independent returns carry tested/failed units to Campus and physical telemetry, fault, environmental, and operator-response archives to Server Farm.
- Narrow professional passengers move between Campus and external customer/research sites.
- Icarus Lab rarely receives restricted compute from external suppliers or selected Daedalus research principals recalled directly from off-Coimbra assignments. It has no routine public output.

No contract connects two Coimbra POIs; all same-body Campus/Server Farm/Icarus movement occurs locally off-board. Campus boards rotate three product destinations, two validation deployments, and one personnel assignment per world day. External procurement and independent field returns are source-specific. Procurement/products use `0.70 + 0.45`, validation/data `0.80 + 0.40`, ordinary personnel `0.55 + 0.60`, and Icarus intake `0.75 + 0.50` plus a `20,000 cr` restricted-transfer fee, all with `2×` fuel-compensation caps.

## Faction: Wells Noble Houses

Minor Wells nobility is represented by one combined provider. Houses Mendes, Alvares, and Nunes have dedicated providers because the three senior Houses are in active conflict. Counts, marquises, and lesser households share this minor-noble charter traffic.

Scope:

- Most routes stay inside the Wells.
- For Gryphon and Hydra origins, roughly 80% of generated destinations stay inside the same gas-giant SOI; the remainder may cross to another Wells SOI or occasionally a Hearth elite destination.
- Manticore is sparse for minor-noble traffic, so Castle Teide mostly routes through Manticore Observatory plus cross-SOI/Hearth work until more Manticore minor seats exist.
- Seat-to-seat traffic is the majority and may be funded by either the source or destination household office.
- Occasional routes touch the Hearth: capital, finance, resort, or historic/pilgrimage destinations.
- Nobles do not normally travel by Teamster. Incognito noble movement appears as private researchers, pilgrim scholars, or other titled-adjacent parties with unusually lavish retinues; the explicit exception is Alvares-subsidized formal passage for complete lesser-household retinues attending public occasions.
- Minor houses do not charter ordinary economic cargo and do not usually route to Daedalus or Covenant sites. Macao, Oathmark, and the shipyard are acceptable noble destinations.

Current source pool: Castle Beira, Castle Tinto, Calatrava Keep, Castle Almaden, Castle Marisma, Shipwright Keep, Castle Teide, Serratine, Herald Gate, Macao Palace, Garden of Rebirth, The Great Arena, Manticore Observatory, and selected Hearth elite origins. Serrat Domain Shipyard, Keelwright Works, Oathmark Academy, and Banner Forge remain eligible noble destinations but no longer originate generic Wells Noble Houses work.

Current cargo families: exotic gift caskets, ceremonial armor cases, court wine and stasis delicacies, sculpted hunting beasts, marriage exchange gifts, tournament prizes, sealed petition archives, petition counsel, household guards, duelists/seconds, heralds, and incognito luxury retinues. Oathmark/shipyard legs use specialized names by direction: house yacht refit bonds, heraldic hull patterns, stateroom fittings, shipyard counsel, proofed yacht components, shipwright witnesses, household guard candidates, challenge writs, unproofed armor, disassembled siege engine kits, robotic destriers, shock-lance racks, tilting-ground drones, proofed honor blades, academy verdict rolls, and graduated guard cadres.

Pay: noble work uses `0.30 + 0.70` plus a flat honorarium. At par, net is the honorarium only; beating par keeps 30% of fuel savings and overruns cost 30% until the compensation cap. Same-SOI/ordinary legs use `12,000 cr`; Macao/Oathmark/court/special legs use `20,000 cr`; rare Hearth elite legs use `30,000 cr`. This prevents overestimated cross-SOI par costs from creating giant windfalls while still rewarding efficient flying.

## Known design questions

- Reputation should probably be faction-specific, with some faction-pair consequences later.
- Contract templates need metadata for reputation gates, legality/suspicion, certification requirements, and narrative flags.
- Passenger transport currently uses cargo-equivalent mass classes; later it needs distinct containers, handling requirements, and presentation.
- Faction contract weighting may need local saturation controls once more providers exist.
- Acheron direct-atmosphere deliveries should eventually differ mechanically and economically from Commercial Hub transshipment.
