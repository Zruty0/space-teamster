# Economy

This file tracks the actor-driven economy for Space Teamster. It is a working design ledger for faction contract generation now, and for reputation/certification locking later.

## Current contract model

Career contracts are generated from the player's current dock and career world time. Faction providers produce explicit contract candidates with an issuer, tag, route, cargo label, cargo mass class, and likelihood. The contract board weighted-picks at least 2 and at most 10 faction contracts when candidates are available, then fills remaining board space with generic open-market freight.

Mission pay is based on par fuel economics for the specified cargo. Contract generators must choose cargo before cost estimation; `estimateEstellaMissionCost()` must not generate cargo internally.

Current implementation:

- Generator file: `src/content/estella/faction-contracts.ts`
- Board/cost integration: `src/career-contracts.ts`
- BBS display: `src/game.ts`

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

- `estella-vi-industrial-city` -> New Canaan docks: pressure seals and valve blocks
- `estella-vi-foundry-complex` -> New Canaan docks: recycler pump cartridges
- `estella-via-component-supply-station` -> `harlan-dock`: rotary bearing kits
- `estella-via-drydock-station` -> New Canaan docks: airlock actuator assemblies
- `estella-vi-agricultural-lowlands` -> New Canaan docks: bulk ration packs
- `estella-vib-cold-chain-station` -> New Canaan docks: medical cold-chain lockers
- `still-public-approach-dock` -> New Canaan docks: certified pressure gas cylinders

Outbound brokerage:

- New Canaan docks -> `estella-vi-foundry-complex`: low-grade titanium tailings concentrate
- New Canaan docks -> `estella-vi-industrial-city`: basalt fiber feedstock
- New Canaan docks -> `estella-via-drydock-station`: scrap pressure alloy
- New Canaan docks -> `estella-via-component-supply-station`: regolith shielding blocks
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
- `estella-v-capital-settlement`
- `estella-vi-industrial-city`
- `estella-vi-spaceport`
- `estella-vi-main-transit-dispatch`
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

- `estella-ii-commercial-hub-dock` / `estella-ii-olympos` -> `estella-vi-industrial-city`: carbon-fiber structural rolls
- Acheron corporate nodes -> `estella-via-drydock-station` / `caravanserai-outfitter-drydock`: graphene cable stock
- Acheron corporate nodes -> `estella-via-component-supply-station`: graphite heat-sink blocks
- Acheron corporate nodes -> `estella-xid-main-port` / `estella-vi-heavy-cargo-station`: industrial oxygen bottles

Rare-metal/surface exports:

- Acheron surface-ops nodes -> `estella-iii-high-tech-city`: platinum-group metal ingots
- Acheron surface-ops nodes -> `estella-vii-high-vacuum-factory`: silica crystal stock
- Acheron surface-ops nodes -> `estella-vi-foundry-complex`: pressure-mined rare metal pallets

Surface operations inputs:

- `estella-vi-foundry-complex` / `estella-vi-industrial-city` -> Acheron surface-ops nodes: deep-pressure valve assemblies
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

## Known design questions

- Reputation should probably be faction-specific, with some faction-pair consequences later.
- Contract templates need metadata for reputation gates, legality/suspicion, certification requirements, and narrative flags.
- Passenger transport currently uses cargo-equivalent mass classes; later it needs distinct containers, handling requirements, and presentation.
- Faction contract weighting may need local saturation controls once more providers exist.
- Acheron direct-atmosphere deliveries should eventually differ mechanically and economically from Commercial Hub transshipment.
