# Gaia shipping

Updated: 2026-10-23
Status: implemented after Pete's “okay, execute.” Dahai integration71fe113 subsequently corrects its counterpart sites and removes one obsolete nutrient-export order; original Gaia program now318 orders/day. New Dahai-origin GOV/EDF lanes are counted separately in [Dahai shipping](dahai-shipping.md).

## Approved direction

- **Richelieu Orbital Terminal** replaces Gaia Main Customs Station / Main Customs and Arrival Hub. This is the biggest transit hub in the Estella system. Station ID `estella-iii-main-customs-station` and terminal ID `estella-iii-main-customs` remain stable.
- Approximately50% of Gaia-bound traffic and50% of Gaia-origin traffic uses Richelieu; the remainder serves surface destinations directly. Freight and passenger dispatches both follow this policy. Surface distribution behind consolidated shipments is background logistics, not a mandatory second player flight.
- **GOV** represents the sector government (existing Estella Commonwealth/Council); **EDF** is the Estella Defence Force, predominantly personnel transfers.
- The majority of transit comes from non-named civilian entities, rather than the institutions and established named corporations alone. Descriptive issuers do not introduce a new roster of named companies.
- No new mission contacts, special missions, reputation, customs gameplay or access unlocks. Pete separately removed the government/military spaceport: EDF now uses Orselle/Richelieu, not a new base. Retired-ID compatibility remains separate from shipping.

## Added orders

`src/content/estella/faction-contracts/gaia-contracts.ts` is the exact lane/commodity ledger.318 logical consignments/day after Dahai role reconciliation:

| Provider | Freight | Passengers | Total | Presentation |
|---|---:|---:|---:|---|
| Independent civilian bookings |96|174|270|Descriptive issuers; no market tag or invented corporate name|
| Sector Government |7|20|27|GOV|
| Estella Defence Force |3|18|21|EDF|

Civilian identities include agricultural cooperatives, medical/instrument/equipment manufacturers, produce wholesalers, university/technical-college travel offices, ordinary passenger and relocation agencies, cultural offices and polar research contractors. Their internal aggregator ID is `gaia-civilian-bookings`, not a player-facing megacorporation. GOV/EDF also have institutional catalog entries.

| Gaian site | Main inbound work | Main outbound work |
|---|---|---|
| Orselle | Specialist medical/research inputs, samples; residents, students, patients, business visitors | Medical equipment, scientific instruments; resident/business/study/medical travel; GOV/EDF assignments |
| Rochefort | Certified alloys, ceramics, specialized fabrication inputs, equipment for overhaul | Civil machinery, agricultural equipment, floating-habitat kits, precision components; engineers and technical students |
| Valenne | Agricultural spares, selected nutrients, breeding stock | Preserved/fresh food, seeds; agricultural specialists |
| Mirabel | Specialty foods, touring returns; family visitors and holidaymakers | Regional food specialties, touring equipment; holidays, family visits and cultural exchanges |
| Cousteau Station | Cold-rated habitats, field machinery, instruments; research/engineering crews | Physical polar specimens, calibration returns; crew rotations |

- Celeste receives food, medical/civil equipment, instruments and ordinary passenger travel. Ampere supplies specialized fabrication materials; Descartes supplies specimens/instruments and scientific rotations. No same-body surface shuttles or bulk lunar rock/water imports to Gaia were added.
- Dahai links emphasize floating-habitat infrastructure, marine research, cultivation and civilian travel. Camps/Belt/Wells links serve actual factories, civic settlements, ports, universities, clinics and households. Kuznia and Kalyna retain orbital interfaces; no private Daedalus/Arkfall or other unplayable sites were opened.
- EDF's18 passenger consignments cover shipyard relief, training/exercise-observer exchanges, port liaison and leave. Three freight consignments carry routine support stores. All21 use the same Orselle/Richelieu dispatch policy.
- GOV's20 passenger consignments cover civil administration, inspections and polar fieldwork. Seven freight consignments supply public clinics, research procurement and physical administrative archives.

## Dispatch implementation

`src/content/estella/gaia-logistics.ts` adapts newly generated public candidates before quoting. It applies to new AND existing providers' Gaia-surface/offworld lanes; their original provider rosters/templates/pay remain unchanged.

- Each new logical order uses a deterministic two-day pair: one day direct, one day via Richelieu, with route-specific hashed ordering. Exact50/50 count and likelihood over complete pairs, independently of direction/category. Stable cargo mass; no competing duplicate gateway/direct offer.
- Existing surface lanes use stable provider/site/external/category keys rather than rotating cargo labels. Balor's independently selected gateway is grouped for this key, preserving its own dispatch split.
- A Richelieu source query collects all five physical cities and the two historical Orselle district scopes, then retains only postings dispatched there. Direct-source boards retain the other postings. Identical former district orders deduplicate at the hub.
- Details identify the originating/receiving city and who arranges local handling. Direct receipts and external destination scenes remain intact. Gaia-terminal arrivals use a neutral receipt rather than incorrectly staging delivery inside the city. Approved Pandemonium pickup prose remains byte-for-byte intact before appended Gaia handling information.
- Native terminal services, the luxury habitat's own traffic, local surface/orbit travel, certification/contact work and timed departures keep their actual endpoints. Do not turn a station's own service order into a fictitious city order merely to force a quota.
- Accepted contract objects, quotes, historical records and user saves are never rewritten. Stable terminal IDs require no name migration. New quotes and playable phases use the dispatched endpoints; consolidated settlement finishes at Richelieu.

## Economics and board sampling

- New freight: fixed reward0.80×par fuel plus45% actual-fuel reimbursement, capped at2×par allowance; +25% net at par.
- New passengers: fixed reward0.60×par fuel plus60% reimbursement, same cap; +20% net at par.
- Civilian likelihood2.0 represents aggregated ordinary customer demand; GOV/EDF0.65. No flat bounty, mandatory board slot or priority override. Existing providers' rates/likelihoods remain unchanged.
- Explicit handling/comfort catalogs: fresh produce somewhat fragile, polar sample cabinets fragile, new passengers standard except elevated medical travel. Produce's supplied packaging explains its transport; no new temperature/decay mechanic.
- The50/50 rule describes dispatch traffic, NOT a forced player's itinerary or a quota on each capped board. Each source still displays at most10 freight and18 passenger candidates; existing priority behavior is retained. Richelieu has one capped board while five cities have five boards, so summing displayed outbound rows across locations understates terminal throughput.

## Initial rollout audit — 2026-10-23 (before Dahai expansion)

Historical results below describe the initial319-order roster. Current Gaia regression covers318 original-program orders and219 playable pairs; Dahai additions use independent gateway choices at both ends. See the Dahai report for current cross-planet scope.

`npm run audit:gaia`:120 raw epochs, including all legacy providers/native terminal services;12 capped-board epochs. Overall inbound and outbound raw traffic each about54% through Richelieu. New orders alone are exactly50/50 in complete pairs.

| Direction/type | Raw terminal share (count / likelihood) | Unnamed civilian share (count / likelihood) | Sampled board civilian share |
|---|---|---|---|
| Inbound freight |58.6% /55.9%|50.9% /73.6%|57.0%|
| Outbound freight |53.6% /51.8%|62.5% /83.3%|67.1%|
| Inbound passengers |51.9% /51.1%|51.1% /79.9%|55.8%|
| Outbound passengers |53.9% /52.4%|54.0% /78.0%|73.7%|

The inbound freight excess is existing terminal-native demand, not duplicate city postings. Summed capped-board terminal shares were58.8% inbound freight/51.6% inbound passengers but15.3% outbound freight/18.4% outbound passengers, for the source-count reason above. No50% claim applies to those displayed-row totals or to actual player choices.

Validation: `npm run test:gaia-shipping` covers319 daily consignments, exact paired dispatch, majority civilian traffic,211 physical endpoint pairs, real quotes/flight phases/boards/settlement, narrative preservation, legacy aliases and unchanged saves. Existing equipment/maintenance/par/menu/Acheron/Balor/BAM/expansion/empty/station/marker/globe suites and production build pass. Original eight-provider legacy hashes remain unchanged after explicit approved place-name normalization. Desktop preview `tests/gaia-shipping-preview.html` exercises native Canvas2D and16 real module-worker requests, including retired-ID compatibility:448 postings, all three new provider groups, about1.7s total. Isolated browser profile only; no mobile/live-save changes or push/deploy.

Related: [Gaia/Celeste](locations/estella-03-gaia.md), [Economy](economy.md).
