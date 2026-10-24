# Camps complete pass — review copy

Updated: 2026-10-24
Status: **implemented; both zzz comments addressed**. Original runtime/tests: `89317da`; review implementation: `4a3ca52` (details below). Nothing pushed or deployed.

Sahra/fuel follow-up`c49726d`: Pete removes dedicated finished-fuel shipments system-wide. Scaffold's one fuel order is retired; **163 original Camps-programme orders/day remain**. Guild drive-service work is retained. New Sahra counterpart traffic is counted separately in [Sahra](locations/sahra.md). Original audit figures below remain dated history; no operator comments removed.

Leave comments beginning with **`zzz`** anywhere under the relevant section. These are implemented choices, not a list of work waiting to start. Pete authorized the reviewed pass and requested implementation of his two comments; both are resolved below. Preserve operator comments when revising this file.

## 1. Quick review: the consequential choices

1. **Pike names:** Flint Mine (zzz: rename Ridgeback, to not sound too similar to Switchback), Switchback and Pike Depot replace the three functional labels. **Resolved2026-10-24: Flint Mine replaces the rejected name throughout live content.** IDs and existing mining companies remain unchanged.
2. **Ascension Scaffold is still working:** a populated refit/remanufacturing station with a preserved historical core, rather than a dead museum or another Svarog-scale new-build shipyard.
3. **Svarog's landlord is named Svarog Shipyard Company (SSC):** independent commercial infrastructure operator of the shipyard (zzz: it's not a yard, it's a shipyard. Rename accordingly. No 'yards' anywhere please), Veles and Anchorhold. **Resolved2026-10-24: name/tag and player-facing terminology updated throughout the game; details below.** Kisaragi and other tenants retain their own brands/contracts. No named owner or new planetary government.
4. **Hartwell and Tessera use50/50 orbital/direct for eligible surface trade.** This does NOT mean50% of all planetary activity: Roadstead's large pre-existing native brokerage business remains at Roadstead. Actual all-traffic percentages are in section9.
5. **Kuznia/Kalyna retain their existing controlled trade interfaces.** No automatic50/50 direct surface imports. Pike's dedicated ore lifts and direct Cinderhook refinery legs also remain intact.
6. **Tessera specializes in physical metrology and precision fabrication:** independent workshops, not another giant electronics corporation. Roster Hall has ordinary civic life alongside shift work.
7. **First Landing and Black Tile remain deliberate reserves.** No filler shipments, automatic access or invented secrets.
8. **The economic pass retains163 daily logical orders after fuel retirement:**110 ordinary civilian,17 SSC,36 across existing providers including14 Institute orders. Original pass164; one Scaffold fuel order removed by explicit later direction.

The pass covers settlement identity, economic relationships, shipping and visible terminal descriptions. Bespoke NPCs, mission chains, new shop mechanics and planetary/settlement art remain later layers; this pass does not quietly start them.

## 2. Hartwell — a functioning frontier society

**World identity:** a competitive frontier world of mining houses, family businesses, pressure gardens, surveyors and machinery factors. Concord is its old outward gateway and current civic centre. Ostrander remains a diminished claimant among many; no new Ostrander faction/provider or resolved reclamation storyline.

All seven existing locations retain their names and IDs. Their expanded descriptions now appear in the actual terminal, not just this document.

### Roadstead Station / Roadstead Customs

- Customs, warehouses, assay desks, passenger dispatch and machinery factors.
- Remains a substantial independent commercial hub, not merely an elevator lobby for Concord.
- New eligible surface trade can consolidate here, while existing native station contracts keep their endpoints.
- The operational POI is still called Roadstead Customs internally; contracts display the physical **Roadstead Station** under the existing presentation policy.

### Concord

- Civic city with sealed residential streets, clinics, technical schools, claim offices and independent workshops.
- Pressure gardens provide some regional fresh produce; not a replacement for Gaia/Dahai food imports.
- Municipal workshops refurbish utility pumps. Added ordinary household, family, study, cultural and small-business travel instead of treating every passenger as a labour cohort.
- Existing Red Dust Mechanical & Reclamation/Honest Abe and Guild offices are untouched. No new named officials, mayor, police system or service interface.

### Dawes Cut

- Independent claims, crushing and assay infrastructure rather than an unexplained consumer of machinery.
- Most low-grade output goes to Cinderhook by background ground transport. No same-surface Teamster ore hops.
- Added assayed alloy concentrates to Hammer, physical assay specimens to Descartes, and reusable containers back from Hammer.
- Offworld trade can use Roadstead or direct handling. This is a modest output chain, not an invented dominant mining corporation.

### Cinderhook Refinery

- Clarified the existing combination of atmospheric processing, mineral refining, maintenance shops and shift settlements.
- Continues receiving Pike feedstock and exporting the established refining houses' products.
- Local Dawes/Concord distribution stays on the ground.
- Existing company roster, cargo sampling and rates unchanged. Pike's dedicated strip-to-Cinderhook process consignments remain direct rather than being randomly diverted to customs.

### Gale Survey

- Practical dust-storm forecasting and field research for local industry, plus Institute partnerships.
- Added physical instrument service returns to Mosaic and calibrated instruments back.
- Institute sends equipment/researchers and receives specimens.
- Live forecasts travel electronically. Older forecast/log manifest names remain in the existing provider roster; the location copy distinguishes original recorder hardware/records from routine transmitted forecasts. No new weather or closure simulation.

### First Landing

- Explicitly Hartwell's failed first colony attempt, earlier than Concord—not Estella's first settlement.
- Remains abandoned, with failed pressure halls and equipment giving it a clear reason to exist.
- No routine shipping or new population. Unlisted empty-travel policy retained.
- Salvage, investigations and reasons for the failure remain available for contact-led stories. Nothing about a hidden survivor/corporation/alien discovery was invented.

### Ascension Scaffold — the Old Scaffold

- Remains a historic Camps orbital factory and outward-colonization staging point.
- **Present function:** independent workshops refit tugs and survey craft, remanufacture standard service modules, restore pressure-room fittings and inspect reclaimed hardware.
- Svarog handles the largest new-build work; the Scaffold serves the older working fleet. Its industrial heritage is a preserved core within a living station.
- Imports: machine tools, lifting gear, inspection benches, controllers, shared tooling, lubricants and authorized Guild drive-service kits. Finished fuel reaches dispensaries in background logistics, not full-container jobs.
- Exports/returns: remanufactured tug modules, refurbished pressure-room modules, handling equipment and heritage exhibition loans; worn units return for rework.
- People: refit specialists, small-business visitors, shipyard infrastructure staff, heritage visitors and commissioning engineers.
- No new dominant named Scaffold corporation. Workshops/purchasing offices use descriptive issuers or existing brokers.

## 3. Pike — three names and a resident community

| Existing ID | Previous name | Implemented name |
|---|---|---|
| `estella-va-strip-mine` | Pike Strip Mine | **Flint Mine** |
| `estella-va-miner-hab` | Pike Miner Hab | **Switchback** |
| `estella-va-ore-handling-depot` | Pike Ore-Handling Depot | **Pike Depot** |

- **Flint Mine:** linked claims and sorting benches. Existing20-company Pike mining roster still owns its orders; no consolidation into one new corporation.
- **Switchback:** a settled mining community around protected haul-road junctions, with permanent households, workshops, a clinic, technical classrooms and rotational accommodation. Added civilian supplies, clinical stock, study and family visits.
- **Pike Depot:** weighing, storage, assay segregation and export dispatch. Institute field teams/specimens use it as their lunar interface.
- Existing strip→depot lifts, strip→Cinderhook processing and depot exports retain their authored structure and economics. No blanket lunar50/50 conversion.
- The station's parent object and POI both acquire the new display name through the existing station factory. Operational IDs, placement, flight parameters and saved location references stay unchanged.

## 4. Kuznia — preserve the commune, complete its internal logistics

The established history, collective life-support, quotas, Udarniki, Steel Combine and orbital trade membrane remain the foundation. Expanded descriptions make those roles visible at all eight locations.

| Location | Description/content refinement |
|---|---|
| **Anvil Station** | Light freight, passengers, customs and surface coordination; foreign Institute visitors use this interface. Existing specially cleared work-pilgrimage exceptions remain. |
| **Hammer Station** | Bulk feedstock/finished goods and hard-currency trade, distinct from the internal Planning Office network. |
| **Perun City** | Finished-machinery city with technical training and shared residential services; stock/output through Hammer. |
| **Gornilo Crucible** | Founding industrial heart of the republic, still a working furnace/refining complex rather than just a revolutionary monument. |
| **Port Stribog** | Internal surface personnel/food coordination. New returning personnel and spent-tooling consignments to Anvil close its outbound gap. |
| **Mokosh Lowlands** | Staple food for the commune, distinct from Kalyna's specialties. Added planned farm-spare delivery from Hammer. |
| **Morana Station** | Working polar environmental/weather station. Added instruments, life-support stores and staff rotations through the Combine's own offices. |
| **Kopanka Mine** | Specialty-ore workings within the plan, with high-altitude maintenance/shelter needs; not an independent foreign exporter. |

**Seven new Steel Combine orders/day:** Anvil→Morana instruments; Hammer→Morana filter stores; Anvil↔Morana researchers; Stribog→Anvil personnel; Stribog→Anvil spent tooling; Hammer→Mokosh farm spares.

The geography table's stale **Steel Combine** place label was corrected to the already-established **Gornilo Crucible**; this is a documentation correction, not another runtime rename.

These are **Planning Office** orders at the existing internal rate: zero fixed markup plus100% actual-fuel reimbursement, capped at2×par. Public contracts authorize the specific assignment; empty-run access to restricted surface sites does not change.

The Institute's new outward partnership ends at **Anvil**, not an automatically opened Morana landing. The host handles local coordination. This is not ownership of the weather station by EIP.

A small documentation cleanup removes the old blanket statement that no standing military exists in the Interim, which conflicts with the subsequently established EDF. The historical point remains: reconquering Kuznia would have threatened the supply chain on which the system depended. No war, intervention or new EDF base is added.

## 5. Svarog — distinguish landlord from shipbuilders

### Svarog Shipyard Company (SSC)

This names the previously unspecified **single independent commercial landlord/operator**. It grew with Kuznia's industrial transport demand, while remaining politically separate from the commune.

It operates shared shipyard infrastructure, Veles logistics and Anchorhold support; it leases working space to tenant manufacturers. Kisaragi remains a tenant with its own facilities, products, staff arrangements and contracts. SSC does not manufacture proprietary Guild drives or own every supplier/mine.

No shareholder genealogy, named CEO, detailed charter, new local NPC or political allegiance was invented.

| Location | Implemented clarification |
|---|---|
| **Svarog Shipyard** | Largest conventional shipyard; landlord's shared docks/utilities/alignment work separated from tenant new-build production. |
| **Veles Terminal** | Landlord-controlled certified materials/handling interface; each tenant's custody and consignments remain distinct. |
| **Anchorhold** | Ground-side power, ballast, mooring/alignment and worker infrastructure maintained by SSC. |
| **Black Vein Mine** | Existing extraction contractors supply certified specialty material into the shipyard chain. Not declared SSC property. |

**17 SSC orders/day:**9 freight and8 passenger.

- Hammer supplies shared drydock utility assemblies.
- Mosaic supplies physical shipyard-alignment instruments.
- Veles supplies Anchorhold power modules.
- Shipyard↔Anchorhold carries maintenance kits, overhaul cores and staff rotations.
- Old Scaffold workshops supply/refit shared handling equipment via Veles.
- Counterpart docks receive physical survey instrument sets.
- Infrastructure technicians travel between Svarog, Ascension, Concord, Cadiz and Anchorhold.

Rates: freight0.75 fixed +0.45 reimbursement; people0.55+0.60; cap2. No flat bounty or guaranteed board slot. `SSC` is its contract tag, not a new stock-trading mechanic.

## 6. Kalyna — clarify, do not rebuild Merren's economy

No new Kalyna provider or surface access policy. The existing Merren programme already supplies its identity and traffic.

| Location | Description refinement |
|---|---|
| **Kalyna Orbital** | Ordinary cold-chain/inspection/trade interface; Export House, sponsored households and producer-hall arrangements retained. |
| **Teteriv Broiler Farm** | Settled producer halls for selected cultured poultry/protein, not a generic unpopulated vat. |
| **Zhitomir Hydroponics** | Pharmaceutical/specialty growers, certified stock, local clinics and Merren stewardship. |
| **Dnipro Pools** | Commissioned delicacies, breeding stock and living ornament; explicitly complementary to Dahai's everyday marine food economy. |

The wider pass adds ordinary clinic purchases **at Kalyna Orbital** for Concord, Switchback and Roster Hall. Existing Merren settlement, specialist and work-union programmes are unchanged. Existing authorized exceptions elsewhere in the old provider network are preserved rather than silently revoked.

## 7. Tessera — precision work with a civilian society

**World identity:** independent metrology/fabrication workshops and rotational industrial labour, with settled civic services. No new planet-owning company.

Airlessness alone is not treated as a cleanroom: the copy explicitly places production in protected, temperature-controlled facilities with regolith kept outside the process.

| Location | Implemented role |
|---|---|
| **Tessera Orbital** | Transit, inspection and consolidation for independent workshops, with native station work retained. |
| **Mosaic Assembly Lab** | Workshop/laboratory cluster producing physical dimensional/optical standards, precision mounts and vacuum-bonded assemblies. Receives artifacts back for recalibration and sends commissioning teams. |
| **White Ceramic Quarry** | Grading and processing ceramic/optical mineral stock. Most local material goes to Mosaic by ground transport; selected certified stock is exported. Worn cutting tools return offworld for reconditioning. |
| **Roster Hall** | Clinics, accommodation, technical classrooms, recreation, assignment offices and household services. Family/cultural/study travel complements—not replaces—employer crew rotations. |
| **Black Tile** | Operator/programme remain undisclosed. No invented public supply chain, revealed secret, new access or ordinary traffic. Deliberate story reserve. |

Mosaic sells physical standards/assemblies to appropriate manufacturers, labs, shipyards and field operators. Daedalus remains the supplier of electronic systems; Gaia still has its own precision/civil manufacturing. These are differentiated specialties, not exclusive monopolies.

## 8. Routing choice: which worlds get50/50?

### Changed

Eligible **Hartwell** surface sites: Concord, Dawes Cut, Cinderhook and Gale Survey. Gateway: **Roadstead Station**.

Eligible **Tessera** surface sites: Mosaic, White Ceramic Quarry and Roster Hall. Gateway: **Tessera Orbital**.

Ordinary offworld freight/passenger consignments choose orbital/direct independently in each direction. New orders use deterministic two-day pairs, one each way, with stable mass and demand weight. Existing surface work uses stable keys independent of rotating labels or the other world's gateway choice.

The adapters handle both ends of Hartwell↔Tessera work and compose with existing Gaia/Dahai/Balor decisions. Local onward handling is arranged by the issuer; settlement ends at the actual contracted terminal. No mandatory second player leg.

### Explicitly unchanged/exempt

- **Kuznia and Kalyna:** existing trade membranes and authorized exceptions.
- **Svarog:** shipyard/station infrastructure and existing physical sites; no blanket moon gateway.
- **Pike:** explicit ore lift/refinery/depot chain. Dedicated Pike strip→Cinderhook consignments remain direct facility-bound deliveries.
- **Ascension and native Roadstead/Tessera Orbital work:** stations keep their own orders.
- Same-body station/surface services, certification/contact work, Old Nell and timed departures.
- First Landing/Black Tile reserves.
- Accepted contracts, quotes, saved history, permissions and flight/settlement IDs.

**Important:** Roadstead's native brokerage/dispatch economy is large. The implementation does not relocate those orders to invented surface customers merely to make the whole-world aggregate equal50%. If you want a different overall split, comment here; it would be a separate economic decision, not a routing bug.

## 9. Shipping ledger and measured coverage

### Added orders

| Originator/provider | Orders/day | Main additions |
|---|---:|---|
| Unnamed Camps civilian customers |110|Concord produce/utility work; Dawes concentrate/assays; Gale instruments; Scaffold refit/heritage; Pike civilian life; Tessera precision products; household/study/family/cultural travel |
| Svarog Shipyard Company |17|Shared infrastructure, upkeep, contractor work and technicians |
| Estella Institute of Planetology |14|Gale/Pike/Kuznia partnerships plus Mosaic reference calibration |
| Steel Combine |7|Morana supply/rotations, Stribog returns, Mokosh upkeep |
| Hartwell Shipping |4|Scaffold consumables, refurbished habitats and rework fittings |
| Daedalus Systems |4|Scaffold controls, hardware returns and integration engineers |
| Hartwell Machinery Brokers |3|Scaffold tools, assay benches and lifting machinery |
| Sector Government |3|Concord/Roster civic exchanges and Switchback clinic equipment |
| Teamsters' Guild |1|Authorized drive-service kits; finished-fuel order retired |
| **Total** |**163**|Original-programme additions after fuel retirement, not the entire regional volume |

Two provider registrations were added: unnamed Camps bookings and SSC. **32 total providers** now. The Institute totals92 daily orders across its original78 and these14; its original Dahai-programme identities remain stable.

Civilian manifests have descriptive issuer names and no faction/market tag. Weight1.6 represents aggregated ordinary demand; SSC and most other additions use0.6. No forced sampling priority. Existing Hartwell/Daedalus/Guild/Combine rate families are retained. New civilian/GOV/EIP freight uses0.80+0.45 and passengers0.60+0.60, cap2. Fresh produce travels in shipper packaging; no new refrigeration/decay simulation.

The precise route/cargo ledger is in `src/content/estella/faction-contracts/camps-contracts.ts` and `camps-partner-lanes.ts`. Existing companies call the additions from their own provider modules, outside the seeded legacy lane pools.

### Previously incomplete working sites —120-day raw sample

Counts are generated candidates, not completed flights or every row simultaneously displayed on a capped board.

| Site | Before incoming / outgoing | After incoming / outgoing |
|---|---|---|
| Dawes Cut |1920 /0|1440 /120|
| Ascension Scaffold |0 /0|3120 /2280|
| Port Stribog |120 /0|120 /240|
| Morana Station |0 /120|360 /240|
| First Landing |0 /0|0 /0 — intentional reserve|
| Black Tile |0 /0|0 /0 — intentional reserve|

Dawes' direct arrivals decrease because eligible supply orders now sometimes arrive at Roadstead, not because those orders were deleted. The same distinction applies to lower surface totals elsewhere after consolidation.

Across the31 Camps POIs, the scan changes from26 outbound/27 inbound sites to **29 with traffic in both directions**. The remaining two are intentional reserves.

### Actual gateway shares —120-day raw sample

| Scope | Eligible surface trade via hub | All offworld activity via hub, including native station business |
|---|---:|---:|
| Hartwell inbound freight |50.0%|53.2%|
| Hartwell outbound freight |50.0%|84.6%|
| Hartwell inbound passengers |50.0%|63.2%|
| Hartwell outbound passengers |50.0%|70.2%|
| Tessera inbound freight |49.9%|50.5%|
| Tessera outbound freight |50.1%|54.8%|
| Tessera inbound passengers |49.8%|58.0%|
| Tessera outbound passengers |50.1%|57.3%|

Small eligible-trade departures from exactly50% come from legacy daily cargo/destination sampling. Each newly authored eligible consignment is exactly paired50/50. No board-count or tonnage quota is claimed.

## 10. Preservation, technical changes and tests

### Changed files and behaviour

- `nodes.ts`: all31 Camps POI roles plus six body summaries; three Pike display-name changes (including depot parent station), stable IDs/tags/physical definitions.
- `location-copy.ts`: expose all31 existing site summaries in terminal scenes.
- `institutions.ts`: register SSC and its bounded landlord role.
- `camps-sites.ts`: stable IDs and the two explicitly eligible gateway groups.
- `camps-logistics.ts`: outermost public-candidate adapter, before quotes; gathers redirected departures at the correct hubs and preserves independent decisions at other worlds.
- `camps-contracts.ts`:110 civilian and17 SSC orders.
- `camps-partner-lanes.ts` / `camps-trade-contracts.ts`:37 additive actor-owned orders and shared stable consignment construction.
- Existing provider modules: Institute, GOV, Steel, Daedalus, Hartwell carriers/brokers and Guild integrate those additions; Pike's source comment reflects its renamed depot.
- `cargo-handling.ts` / `passenger-comfort.ts`: explicit classifications for new manifest labels. Physical standards/optics/heritage objects receive appropriate fragile handling; new civilian/technical passengers standard comfort. Fuel retains its volatile qualification.
- Provider registry: two registrations plus the Camps dispatch adapter; contact generation remains separate.
- Package scripts: `test:camps`, `audit:camps`.
- New tests/fixtures and desktop preview; existing regression fixtures normalize only the three place-name substitutions and exclude the explicit new `camps:` orders when comparing original raw economies.

### Protected

- Frozen pre-pass baseline from`dae6547` checks **all30 established providers' complete raw output** across four epochs: roster identities, seeded sampling, cargo mass, prices and receipts. Only the three documented display-name substitutions are normalized. All pass.
- No site IDs, orbit positions, gravity, atmosphere, weather parameters, terrain, flight profiles or save migration changed.
- No access registry changes. No automatically opened factory, religious or classified site.
- No accepted contract, stored quote, completed history or player save edits.
- No new NPC dialogue, named character, mission-contact chain, maintenance-shop implementation or hidden lore revelation.
- No art changes. Other agent's ongoing icy-world/visual-stage work remained separate.

### Validation

- `npm run test:camps`:43488 assertions;164 orders;180 playable endpoint pairs;31 actual terminal scenes; independent gateway choices, protected refinery legs/trade membranes, real quotes, save/accepted-object immutability and actual hub settlement.
- `npm run audit:camps`:120 raw epochs plus four public-board epochs/1341 rows. Both new providers and existing partner families appear in real boards; Guild origin is at the Still, outside the Camps-only board sample.
- Existing equipment, maintenance, par, Balor/BAM/expansion, Gaia, Dahai, Acheron, empty-run, menu, marker, station/parked-ship and globe tests pass; production build passes with pre-existing Vite warnings.
- Contract-presentation audit covers32 providers and nine contact postings. Menus tested2429 scenes.
- Acheron's rare-board follow-up test now waits for both equipment templates at both original sources over the existing one-year window, rather than stopping as soon as only the cutter order appears. No production weight/priority was changed to satisfy it.
- Desktop preview: `http://127.0.0.1:5173/tests/camps-preview.html`. Real module worker:66 requests/783 postings; all31 terminal screens plus civilian/SSC/EIP views rendered. Isolated browser profile; no mobile tests or live-save access.

## Review implementation — 2026-10-24

Both original comments remain verbatim in section1, with their resolutions beside them.

- **Flint Mine** replaces the rejected Pike name in the catalog, navigation, terminal copy and contract presentation, including cached titles. Switchback and Pike Depot are unchanged. The mining location ID stays `estella-va-strip-mine`.
- **Svarog Shipyard Company / SSC** replaces the initial company name/tag. Its institution, issuer and provider IDs remain unchanged; no roster, order or route replacement.
- The terminology instruction also applies outside this new company: public names now read **Kisaragi Harmony Shipyards**, **Kisaragi Shipyards Estella**, **Serrat Domain Shipyard Office/Dispatch**, **High Pennant Shipyard**, and **Keeper of the Shipyard Seal**. These are wording changes to existing entities, not new companies/services. Shipbuilding contracts, manifest captions, receipts, shop dialogue and terminal descriptions consistently say shipyard. Non-shipbuilding uses become assay works, cargo/equipment depots, cargo tractors or tilting-ground drones as appropriate.
- `src/content-terminology.ts` normalizes player-facing text at the existing contract-presentation boundary, after routing, sampling and pricing. Legacy generator strings and IDs remain internal because some participate in deterministic economic seeds. Historical source documents, test baselines and operator comments are not rewritten to erase the old wording.
- Cached/accepted postings get current wording through read-only views. Quotes, saved objects, histories, cargo type IDs, handling and passenger comfort are unchanged. Cargo/comfort catalogs accept both old and displayed labels; the posting's manifest row uses the current display caption rather than exposing the quote's historical label.
- New `tests/camps-review.test.ts` runs under `npm run test:camps`:17055 assertions. Frozen pre-review snapshot from`b4f3a6c` verifies15669 generated candidates and7503 complete quoted postings across all32 providers. Comparison permits only reviewed text/tag changes; source traversal uses stable IDs because alphabetic navigation legitimately moves Flint Mine.714 old/new manifest-label combinations checked. Existing frozen economic baselines remain intact.
- Camps43488, presentation117393, equipment4535, maintenance55, menus273502, Gaia shipping100357, Dahai82652, Balor expansion67782, Acheron10388, empty-runs2872+35 and par60 assertions pass; production build passes with existing Vite warnings. Desktop worker66 requests/783 postings passes, with Flint Mine/SSC screens inspected. No live-save/mobile/push/deploy work. Concurrent Stage5 Acheron artwork was left to the other agent.

## 11. Deliberately still later work
- Named local characters, personal contacts, mission chains, bespoke shops and fuller political/governance detail.
- Ostrander's contact-led storyline; First Landing investigations/salvage; Black Tile's undisclosed programme.
- Actual weather closures, surface transport simulation, manufacturing inventories or a full population economy.
- Planetary/settlement art under the other agent's explicit stage approvals.

The broad Camps settlement-and-shipping pass and the two requested review corrections are implemented. It is not a claim that every later narrative/service layer is implemented, and it does not authorize automatically moving on to the Belt.
