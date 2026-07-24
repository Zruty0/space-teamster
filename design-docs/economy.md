# Economy

This file tracks the actor-driven economy for Space Teamster. It is a working design ledger for faction contract generation now, and for reputation/certification locking later.

## Current contract model

Career contracts are generated from the player's current dock and career world time. Faction providers produce explicit contract candidates with an issuer, tag, route, cargo label, cargo mass class, and likelihood. The contract board weighted-picks at least 2 and at most 10 faction contracts when candidates are available, then fills remaining board space with generic open-market freight.

Mission pay follows the contract pay model (see below): a fixed reward plus optional fuel compensation, computed at settlement from the actual ΔV flown. Contract generators must choose cargo before cost estimation; `estimateEstellaMissionCost()` must not generate cargo internally.

Current implementation:

- Faction provider registry and shared types: `src/content/estella/faction-contracts/index.ts`
- Miners Mutual generator: `src/content/estella/faction-contracts/miners-mutual-contracts.ts`
- Cerberus generator: `src/content/estella/faction-contracts/cerberus-contracts.ts`
- Bruckner Field Services generator: `src/content/estella/faction-contracts/bruckner-contracts.ts`
- Voss-Heinkel Metricwerke generator: `src/content/estella/faction-contracts/vhm-contracts.ts`
- Kisaragi Yards Estella generator: `src/content/estella/faction-contracts/kisaragi-estella-contracts.ts`
- Kisaragi Harmony Yards generator: `src/content/estella/faction-contracts/kisaragi-contracts.ts`
- Teamsters' Guild generator: `src/content/estella/faction-contracts/teamsters-guild-contracts.ts`
- Steel Combine generator: `src/content/estella/faction-contracts/steel-combine-contracts.ts`
- Glitterfield miners generator: `src/content/estella/faction-contracts/glitterfield-miners-contracts.ts`
- Halloran Smelting House generator: `src/content/estella/faction-contracts/halloran-contracts.ts`
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

- `generosity` — reward scaled with route difficulty (× par fuel). Default 1.25 (open-market baseline).
- `flatReward` — flat credit floor/bonus. Default 0.
- `compensationRatio` + `maxCompAllowance` — reimburse actual fuel up to a cap. Default 0 / 2.

A thin fixed reward is naturally tight (break-even near par); a fat one is forgiving — so pay level already encodes a risk gradient without a dedicated dial. Precision-risk (fragile cargo, landing quality, deadlines) belongs in contract requirements, not the pay curve.

Per-faction generosity, rank preserved in a [1.10, 1.70] band (open market and Guild sit at the 1.25 baseline):

| Faction | base | notable overrides |
|---|---|---|
| New Canaan Miners Mutual | 1.10 | emergency relief 1.4 |
| Open market / Teamsters' Guild | 1.25 | Guild: skim 1.7, staging 1.5, paperwork 1.35 |
| Bruckner Field Services | 1.30 | returns/incident 1.5, crew 1.45 |
| Cerberus Human Resources | 1.30 | custody/Pandemonium 1.6, rare-metal/corporate 1.45 |
| Kisaragi Yards Estella | 1.40 | — |
| Voss-Heinkel Metricwerke | 1.50 | hazard returns 1.7, exec/audit 1.6 |
| Kisaragi Harmony Yards | 1.60 | Celadon-tier 1.7 |
| Steel Combine | 0 (compensation-only) | exports add flatReward 10,000; comp 1.0, cap 2 |
| Glitterfield mining companies | 1.30 | in-cluster ore (depot → Cupola) is 0.8 + 50% fuel comp (low-risk/low-reward) |
| Halloran Smelting House | 1.30 | — |

## Faction: The Steel Combine

- ID: `steel-combine`
- Tag: `STEEL`
- Public name: The Steel Combine
- Home world: Kuznia (Estella VI) — a People's Republic that is at once republic, company, and commune
- Posting authorities (both STEEL): Steel Combine Planning Office (internal), Steel Combine Foreign Trade Committee (external)
- Key nodes: Hammer Station (`estella-vi-heavy-cargo-station`, bulk membrane), Anvil Station (`estella-vi-main-transit-dispatch`, light/passengers/paperwork membrane), Gornilo Crucible (`estella-vi-foundry-complex`), Perun City (`estella-vi-industrial-city`), Mokosh Lowlands (`estella-vi-agricultural-lowlands`), Veles Mine (`estella-vi-mountain-mining`), Morana Station (`estella-vi-polar-weather-research`), Port Stribog (`estella-vi-spaceport`)

The Combine runs Kuznia as a planned economy behind an orbital trade membrane. It does market profit only grudgingly: nearly all its posted work is fuel-compensation only (net-zero, no-loss "safe transfer"), the real reward being in-kind/reputation (deferred until reputation exists). Full lore: `design-docs/locations/kuznia.md`.

### Job kinds

- Internal distribution (common): Hammer/Anvil ↔ surface, both ways. Planning Office. Compensation-only. Hammer legs are bulk/heavy; Anvil legs are light/passengers/paperwork.
- Imports (sparse): likely feedstock sources (New Canaan `harlan-dock`/`mercer-dock`, Caravanserai) → Hammer. Foreign Trade Committee. Compensation-only.
- Exports (sparse, lucrative): Hammer → external buyers (Svarog Shipyard, Yardstock Terminal, Caravanserai outfitter, Mosaic Assembly Lab). Foreign Trade Committee. Compensation + a modest flat bounty (10,000 cr).

Imports and exports are deliberately sparse — the Combine leans on other companies' shipping for most external trade.

### Cargo

Each lane draws from a cargo pool, sampled per route and world-day, so goods vary across contracts and over time:

- Hammer → works (feedstock/supplies): smelter feedstock, iron-ore pellets, coke and flux, scrap charge, alloying additives, refractory brick (Gornilo); billet/plate/bar stock, casting blanks, machine-tool stock (Perun); mining supplies, drill stock, blasting charges, shoring timber, cutting heads (Veles).
- Works → Hammer (finished/ore): rolled structural sections, steel billets, plate steel, rail/beam stock, alloy ingots, pressure-pipe stock (Gornilo); finished machinery, machine tools, pumps/compressors, gear assemblies, prefab modules, vehicle chassis (Perun); specialty/rare-earth/refractory/high-grade ore (Veles).
- Anvil ↔ surface (light): work crews, shift rotations, plan directives, quota allocations, tooling and spares, medical supplies (down); quota reports, production returns, work rotations, spent-tooling returns, personnel transfers (up); food allotments from Mokosh; weather/forecast/survey data from Morana.
- Imports: titanium tailings concentrate, basalt fiber feedstock, scrap pressure alloy, regolith aggregate, bulk silicates (New Canaan); imported refractory feedstock, off-world alloy stock, bulk industrial chemicals, imported machine parts (Caravanserai).
- Exports: structural sections, hull plate, pressure-shell blanks, frame members (Svarog); certified steel stock, structural billets, fastener stock, welded assemblies (Yardstock); heavy machinery, prefab modules, cargo-frame stock, structural components (Caravanserai outfitter); precision alloy billets, tool-steel stock, high-purity ingots, instrument-grade alloy (Tessera).

### Kuznia membrane rule

Only the Steel Combine operates on Kuznia's surface. Every other faction interfaces exclusively at the orbital membrane — Hammer (bulk) and Anvil (parts/personnel/light) — never a surface node. Redirected accordingly: Co-op (tailings/basalt → Hammer; seals/recycler/rations → Anvil), Cerberus (rare metals/carbon-fiber/valves → Hammer; workforce recruitment removed from Kuznia entirely), Bruckner & VHM (parts/technicians → Anvil), Kisaragi Yards Estella (supplier inputs → Hammer). The moons Svarog and Kalyna are independent polities and exempt.

### Pay

Compensation-only: `generosity 0, compensationRatio 1.0, maxCompAllowance 2`. Exports add `flatReward 10,000`.

### Reputation hooks later

Combine reputation is a cost-and-access ladder, not a pay ladder: at-cost repair/refit at Perun City, at-cost resupply, priority weather-gated berthing, sanctuary/CHR-defector work, and — the cash tier — trusted-carrier access to the paying export runs. Combine standing is most valuable to a poor early-game Teamster. Known tuning debts (deferred): the flat export bounty does not scale with route size/risk, and the 2× compensation cap leaves large botch losses on the big surface↔orbit runs.

## Glitterfield (Belt mining cluster)

- Cluster: `glitterfield` — a metal-rich Belt cluster (renamed from the former "The Working"); denser than the mined-out New Canaan Field.
- Stations: Cupola Station (`industrial-refinery-asteroid-es-m-0002`, the refinery) plus four ore depots — Grubstake (`grubstake-depot-dock`), Highgrade (`highgrade-depot-dock`), Slagfoot (`slagfoot-depot-dock`), Deepcut (`deepcut-depot-dock`).
- Model: a swarm of small Hartwell mining companies work the field; all ore funnels through the single Cupola Station refinery. Ore and metal stay in-system.

### Glitterfield mining companies

- ID: `glitterfield-miners` (shared). No market tag — too small to appear on the system market, so contracts show only the company name.
- 20 companies sampled from a name pool, each assigned 1–2 ores and one home depot (stable roster).
- Ores: nickel-iron, cobalt, platinum-group, chromite, nickel concentrate, rare-earth-bearing.
- Flows: shift crews in (Hartwell → depot); mining and life-support supplies in (Caravanserai / Hartwell → depot); ore to the refinery (depot → Cupola, in-cluster); occasional raw ore direct to in-system buyers (depot → Hammer / Svarog); refined ingots out (Cupola → Hammer / Svarog).
- Pay: standard fixed-price 1.30, except in-cluster ore (depot → Cupola), which is deliberately low-risk / low-reward: generosity 0.8 plus 50% fuel compensation (cap 2×).

### Halloran Smelting House

- ID: `halloran-smelting-house`, tag `HALL`.
- A Hartwell firm that took its cut instead of digging — it runs the Cupola Station refinery, the chokepoint all Glitterfield ore must pass through ("the House always takes its cut"). It ships no metal itself; the miners and buyers move the ingots.
- Flows: refinery consumables in (flux, electrodes, reagents); crew in from Hartwell; experts and executives in from Gaia (the House is wealthy); crew and executive rotations out.
- Pay: standard fixed-price 1.30.

### Buyer side

Refined metal reaches the Camps two ways: the miners haul ingots out, and buyers source directly from Cupola — the Steel Combine's `import-glitterfield` lane (Cupola → Hammer) and Kisaragi Yards Estella's finished-goods sourcing.

## Faction: The Teamsters' Guild

- ID: `teamsters-guild`
- Tag: `GUILD`
- Public name: The Teamsters' Guild
- Key nodes: the Still (`still-distribution-bay`, `still-guild-hq`, `still-skim-runner-berth-poi`), Skim Hubs (`skim-hub-alpha-precursor-dock`, `skim-hub-beta-precursor-dock`), Certification Authority (`caravanserai-certification-authority`)

The system-wide fuel-and-engine monopoly. Guild work is posted only at Guild nodes — it is not a jobs-everywhere faction. Route families: precursor skim-in (near-star hubs / Estella I staging → the Still, hazard-premium pay), fuel distribution (the Still → a few high-traffic hubs only, since bulk fuel canisters are rarely needed elsewhere), engine/RCS supply (the Still → outfitters and yards), and certification/insurance/debt paperwork.

### Pay

Base generosity 1.25 (neutral market-setter). Overrides: skim precursor 1.7 (extreme hazard pay), staging 1.5, paperwork 1.35.

### Notes

The marquee 1.7 skim-precursor runs currently post only at the near-star skim hubs, which are not yet selectable nav targets — so they are unreachable until those nodes become dockable. Reputation later should gate the skim and cert/insurance/debt work.

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
- Yardstock Terminal (`estella-via-component-supply-station`) -> `harlan-dock`: rotary bearing kits
- Svarog Shipyard (`estella-via-drydock-station`) -> New Canaan docks: airlock actuator assemblies
- Anvil Station (`estella-vi-main-transit-dispatch`) -> New Canaan docks: bulk ration packs
- Kalyna Orbital (`estella-vib-cold-chain-station`) -> New Canaan docks: medical cold-chain lockers
- `still-public-approach-dock` -> New Canaan docks: certified pressure gas cylinders

Outbound brokerage:

- New Canaan docks -> Hammer Station (`estella-vi-heavy-cargo-station`): low-grade titanium tailings concentrate
- New Canaan docks -> Hammer Station (`estella-vi-heavy-cargo-station`): basalt fiber feedstock
- New Canaan docks -> Svarog Shipyard (`estella-via-drydock-station`): scrap pressure alloy
- New Canaan docks -> Yardstock Terminal (`estella-via-component-supply-station`): regolith shielding blocks
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

### Business needs

Inbound custody/workforce traffic:

- workforce transfer groups
- custody transfer passengers
- surface labor allocations
- executive delegations and compliance teams

Surface operations inputs:

- surface hydrogen ration tanks
- deep-pressure valve assemblies
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
- local hospitality, medicine, audit, hydrogen, and surface-labor staging

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

- `estella-ii-commercial-hub-dock` -> `estella-ii-olympos`: custody processing passengers, pressure-chain equipment pallets, Paradiso hospitality cargo, executive medicine lockers, sealed audit records, surface hydrogen ration tanks
- `estella-ii-olympos` -> `estella-ii-commercial-hub-dock`: workforce transfer manifests, rare-metal export staging pallets, Carbonvale export lots, shareholder packets, sealed legal archives
- `estella-ii-commercial-hub-dock` / `estella-ii-olympos` -> `estella-ii-pandemonium`: surface labor allocation and surface hydrogen ration tanks
- `estella-ii-pandemonium` -> `estella-ii-commercial-hub-dock`: rare-metal export staging pallets

Carbonvale and Olympos exports:

- `estella-ii-commercial-hub-dock` / `estella-ii-olympos` -> `estella-vi-heavy-cargo-station` (Kuznia membrane): carbon-fiber structural rolls
- Acheron corporate nodes -> `estella-via-drydock-station` / `caravanserai-outfitter-drydock`: graphene cable stock
- Acheron corporate nodes -> `estella-via-component-supply-station`: graphite heat-sink blocks
- Acheron corporate nodes -> `estella-xid-main-port` / `estella-vi-heavy-cargo-station`: industrial oxygen bottles

Rare-metal/surface exports:

- Acheron surface-ops nodes -> `estella-iii-high-tech-city`: platinum-group metal ingots
- Acheron surface-ops nodes -> Mosaic Assembly Lab (`estella-vii-high-vacuum-factory`): silica crystal stock
- Acheron surface-ops nodes -> `estella-vi-heavy-cargo-station` (Kuznia membrane): pressure-mined rare metal pallets

Surface operations inputs:

- `estella-vi-heavy-cargo-station` (Kuznia membrane) -> Acheron surface-ops nodes: deep-pressure valve assemblies
- `estella-via-component-supply-station` / `estella-via-drydock-station` -> `estella-ii-olympos`: acid-rated lift bearings
- `estella-vib-cold-chain-station` -> `estella-ii-olympos` / `estella-ii-commercial-hub-dock`: executive medicine lockers
- `estella-ii-nimbus-crucible` / `estella-ii-commercial-hub-dock` / `estella-ii-olympos` -> `estella-ii-pandemonium`: surface hydrogen ration tanks

Corporate/governance/luxury:

- Acheron corporate nodes -> `estella-iii-finance-city`: shareholder packets
- Acheron corporate nodes -> `estella-iii-capital-city`: sealed legal archives
- `estella-iii-finance-city` / `estella-iii-capital-city` -> Acheron corporate nodes: sealed audit records
- `estella-iii-luxury-orbital-habitat` / `estella-iv-primary-city` / `caravanserai-highliner-bay-poi` -> `estella-ii-olympos`: Paradiso hospitality cargo
- `estella-iii-finance-city` / `estella-iii-capital-city` / `estella-ii-olympos` -> `estella-ii-olympos` / `estella-iii-finance-city`: executive delegation

### Reputation hooks later

Low-rep CHR work can be ordinary corporate cargo, legal archives, and bulk materials. Higher reputation can unlock custody work, direct Olympos deliveries, surface labor allocations, Pandemonium-linked work, higher-value rare-metal lots, and private executive traffic. CHR reputation should eventually conflict with some factions and alter BBS/dialogue tone: corporate clients trust reliable CHR carriers, while labor/Union/Co-op actors may react badly to visible CHR association.

## Interstellar shipbuilding actors

### Kisaragi Harmony Yards / Kisaragi Yards Estella

- Parent: Kisaragi Harmony Yards
- Parent ID: `kisaragi-harmony-yards`
- Parent tag: `KIS`
- Estella subsidiary: Kisaragi Yards Estella
- Subsidiary ID: `kisaragi-yards-estella`
- Subsidiary tag: `KIS-E`
- Gaia corporate HQ for now: `estella-iii-finance-city`

Kisaragi is the luxury-prestige hull side of the hulls/engines duo. It does not build normal rank-and-file Teamster rigs. It rents substantial facilities at massive shipyard stations instead of owning whole yards: Caravanserai Outfitter/Drydock, Svarog Shipyard, and Estella XIe Outer-Spec Drydock. The Svarog Shipyard facility focuses on luxury yachts, specialty ships, and high-end cruise liners. The XIe facility focuses on extra-large mobile refineries and gas-giant industrial hulls. KIS-E handles in-system freight and local shipping representation; it does not generate passenger contracts. KIS proper handles prestige cargo and Kisaragi personnel movement.

Kisaragi ship tiers:

- Silk-class: superbly crafted Kisaragi vessels, already far above ordinary working ships
- Porcelain-class: true luxury vessels for clients who expect quiet perfection in every finish, fit, and pressure boundary
- Celadon-class: barely-affordable masterpieces; Celadon personal yachts are numbered in the hundreds across the whole galaxy

Kisaragi sells finished ships, not loose components. Cargo labels such as `Porcelain-class viewport assemblies` or `Celadon-class hull elements` refer to internal Kisaragi-certified parts and modules moving through the yard chain for those vessels. A ship may use components of its own class or higher, so a Porcelain-class liner uses Porcelain-or-better parts, while a Celadon-class yacht requires Celadon-grade work throughout. Finished Celadon-class components generally originate off-system through Highliner Bay or move between Kisaragi facilities after import, matching, or rework. Estella suppliers do not manufacture finished Celadon-class components; they provide Silk/Porcelain-class goods and non-classed premium inputs.

KIS-E current route families:

- Supplier -> Kisaragi facilities: Silk/Porcelain-class cargo and non-classed premium inputs only
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
- yard acceptance documents
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

Reputation hooks later: KIS-E should be the entry path for Kisaragi yard logistics and should never carry Celadon-class items. KIS proper should unlock after trust/reputation and should carry Celadon-class prestige work, shipwright delegations, client-facing acceptance work, and luxury/highliner hull contracts.

## Faction: Voss-Heinkel Metricwerke

- ID: `voss-heinkel-metricwerke`
- Tag: `VHM`
- Public name: Voss-Heinkel Metricwerke
- Local service/dealer arm: Bruckner Field Services
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

## Faction: Bruckner Field Services

- ID: `bruckner-field-services`
- Tag: `BFS`
- Local partner/dealer: Bruckner Field Services
- Parent/supplier: Voss-Heinkel Metricwerke
- Parent tag, later high-tier: `VHM`

VHM is the metric-drive side of the hulls/engines duo. It is centralized around interstellar imports rather than distributed local manufacturing. Bruckner Field Services is ostensibly independent, but it is an authorized service, parts, and maintenance bureau and exclusive Estella dealer for the full civilian VHM line. BFS sells, stores, certifies, refurbishes, dispatches technicians, and preserves warranty chain-of-custody; it does not manufacture VHM core systems.

BFS's central Estella logistics foothold is on Weymark, not Caravanserai. Caravanserai Highliner Bay remains the import touchdown and customs interface, but Bruckner Weymark Depot is the private distribution, certification, and service hub.

Weymark naming:

- `estella-viii`: Weymark
- `estella-viii-first-rendezvous-station`: Nell's Rest, Guild-facing first-rendezvous station, maintenance yard, and mechanics hub
- `estella-viii-harder-approach-station`: Bruckner Weymark Depot, BFS distribution and precision-service hub
- `estella-viii-settlement`: Weymark Town
- `estella-viii-mining-site`: Low Gauge Mine
- `estella-viii-captured-moonlet`: Nell's Lantern
- `estella-viii-moonlet-docking-site`: Lantern Dock
- `estella-viii-abandoned-site`: Old Survey Camp

### Current BFS network model

BFS cargo follows a service lattice rather than a commodity flow. It uses Caravanserai Highliner Bay as the interstellar import/export touchdown, Bruckner Weymark Depot as the central owned distribution hub, one regional sub-hub in the Hearth, one in the Camps, one at each Wells gas giant, and one in the Reach. Practical final destinations are mostly vacuum stations, dockyards, service nodes, and industrial clients; ordinary population centers and research sites are avoided. Surface work is deliberately rare and weighted low, limited to precision machinery support at factories, mines, and specialized industrial sites. Dockyards and ship-service nodes carry the highest leaf weights.

Core nodes:

- Import touchdown: `caravanserai-highliner-bay-poi`
- Central hub: `estella-viii-harder-approach-station`
- Hearth sub-hub: `estella-iii-main-customs`
- Camps sub-hub: Yardstock Terminal (`estella-via-component-supply-station`)
- Estella X sub-hub: `estella-xc-transit-refuel`
- Estella XI sub-hub: `estella-xid-main-port`
- Estella XII sub-hub: `estella-xiib-transit-station-poi`
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

## Known design questions

- Reputation should probably be faction-specific, with some faction-pair consequences later.
- Contract templates need metadata for reputation gates, legality/suspicion, certification requirements, and narrative flags.
- Passenger transport currently uses cargo-equivalent mass classes; later it needs distinct containers, handling requirements, and presentation.
- Faction contract weighting may need local saturation controls once more providers exist.
- Acheron direct-atmosphere deliveries should eventually differ mechanically and economically from Commercial Hub transshipment.
