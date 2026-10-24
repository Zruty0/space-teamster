# Dahai shipping

Updated: 2026-10-24
Status: implemented in71fe113 after Pete's approval to integrate all existing providers, unnamed Dahai originators and the Institute. No push/deploy.

Follow-ups: Camps89317da added14 Institute orders; Sahra c49726d adds14 more (10 occasional), bringing EIP to106 distinct orders/98.5 average daily availability. Sahra also retires all dedicated finished-fuel jobs, including Dahai's two port orders: **338 original-programme Dahai orders/day remain**. Eligible Hartwell/Tessera/Sahra counterparts independently dispatch through their gateways. [Camps review](camps-review.md), [Sahra ledger](locations/sahra.md). No Dahai city/physics/save changes.

## Cities and Institute

| Stable operational ID | Name | Role |
|---|---|---|
| `estella-iv-primary-city` | **Fuyuan / 浮苑** | Floating Garden; founding settlement, old capital and cultural heart in a calm latitude belt. Aquaculture/food processing, historic core and Institute headquarters. No capital relocation implied. |
| `estella-iv-climate-poi-1` | **Zhulong / 逐龙** | Dragon-Chaser; fixed home port for fleets working storm belts, fisheries, sea-crop cultivation, weather observation and repairs. |
| `estella-iv-climate-poi-2` | **Jiuyuan / 九渊** | Nine Abysses; extraction/processing primarily supplies Dahai's own cultivation economy through local maritime transport. Import-heavy offworld trade; limited samples and service returns outbound. |
| `estella-iv-climate-poi-3` | **Bingjie / 冰界** | Ice Boundary; polar port, archives and cold-environment field base. Complements other cities, not an exclusive gateway. |
| `estella-iv-main-orbital-station` | **Dahai Main Orbital Station** | Offworld freight/passenger consolidation; parent station ID remains `estella-iv-main-station`. No new proper name selected. |

Existing POIs are reused, not supplemented with four extra cities. Roles/descriptions appear in actual terminal scenes, navigation and contract labels. The former mariculture placeholder becomes Jiuyuan: its inappropriate biological-production routes move to Fuyuan/Zhulong rather than persisting under a misleading city name. Physical coordinates/flight profiles stay unchanged; Bingjie's polar identity is lore/site-role metadata in the current2D model, not a new3D latitude mechanic. Surface scenery remains the separate approval-gated visual task.

**Estella Institute of Planetology (EIP)** is the system's most prestigious planetological institute, headquartered in Fuyuan. Comparative laboratories, collections and fellowships support geology, interiors, volcanism, atmospheres/climate, oceans, ice, magnetospheres and habitability. It operates partnerships throughout Estella; host facilities retain their existing operators. Institutional catalog and contract provider registered. No extra campus dock, named director, mission contact, detailed governance or reputation mechanics introduced.

Pete rejected a named industrial entity. There is no Jiuyuan Deepworks provider. Ordinary local industrial, agricultural and household customers use descriptive issuers.

## Dispatch policy

- Approximately50% orbital /50% direct, independently inbound/outbound and freight/passengers. Each new logical consignment uses an exact deterministic two-day pair, one day each route, with stable mass and demand weight. Not a tonnage quota or a forced fraction of every capped board.
- Orbital delivery/pickup includes issuer-arranged background distribution. Settlement finishes at the contracted station/city; no mandatory second player leg.
- All33 current providers pass the public-candidate adapters: Gaia first for each queried source, then Dahai, Camps and Sahra. The Dahai orbital query collects all four cities plus native terminal work so redirected departures are not lost.
- New lanes have stable dispatch identities. Existing-provider keys ignore rotating cargo labels and normalize the independently selected Gaia/Balor gateway. Neither planet's dispatch undoes the other. New Balor-linked Institute/holiday work uses Balor's established dispatcher and explains handling at both worlds.
- Native orbital services, local same-body trips, certification/contact work and timed departures keep their actual endpoints. Native station activity explains small deviations from50% when auditing ALL traffic.
- Routing happens before quotes. Accepted contracts, recorded prices/history, saves, access rules, original berth IDs and existing provider pay remain untouched. Renames require no eager save migration.

## New consignments

338 original-programme logical orders/day, across10 issuer families (originally340/11 before the two finished-fuel retirements):

| Provider | Added orders/day | Scope |
|---|---:|---|
| Unnamed Dahai civilian bookings |214|Food, cultures/processed ingredients, household goods, habitat/repair supplies, archive loans and ordinary passenger travel |
| Estella Institute of Planetology |78|Field instruments/specimens, researchers/fellows and comparative work across Estella |
| Sector Government |9|Civic exchanges, port inspection, clinic procurement and physical administrative custody copies |
| Estella Defence Force |5|Four personnel consignments and one support-store order; no new base |
| Hartwell Shipping |6|Brokered food exports, workwear, farm/fleet/polar stores |
| Hartwell Machinery Brokers |5|Heavy processing/port/workshop machinery and Jiuyuan overhaul cores |
| Daedalus Systems |12|Public control/sensor/storage hardware, service returns and integration engineers |
| Merren Conservatory |4|Certified cultivation inputs, processed marine ingredients and reusable racks |
| Steel Combine |4|Material/machinery exports under Foreign Trade Committee terms |
| Cinderhook Refining Houses |1|Certified material for local maintenance workshops, from an existing roster company |

The 214 civilian orders represent many unnamed customers, not one new corporation. No market tag. They receive demand weight2; Institute and most additions to existing providers use0.6 (Cinderhook0.3). No forced board priority, flat bounty or minimum provider slot. Established seeded company rosters are unchanged; additive lanes belong to their existing provider modules.

New civilian/Institute/GOV/EDF freight uses0.80×par fuel fixed plus45% actual-fuel reimbursement; passengers0.60+0.60. Cap2×par. Existing-company additions use those companies' established rate families, including Steel export0.15+1.00, Merren standard0.30+0.75/return0.25+0.80. Explicit handling/comfort catalogs cover new manifests. Refrigeration/preservation travels with packaged consignments; no new decay or cold-chain simulation.

### City trade

- **Fuyuan:** everyday frozen/preserved seafood, dried sea vegetables, processed marine ingredients and heritage loans outbound. Dietary variety, hatchery/processing supplies and ordinary goods inbound. Broad family, holiday, study, business/civic and cultural travel. Institute fieldwork is separate from ordinary university travel.
- **Jiuyuan:** machinery, corrosion-resistant materials, membranes/seals, robotics, electronics and household supplies inbound. Failed equipment, overhaul cores, customer hardware and scientific specimens outbound. New freight is21 inbound versus7 outbound daily. No assumed system-wide machinery export industry, miracle product, nutrient monopoly or artificial trade balance.
- **Zhulong:** packaged catches/sea crops, screened storm-wake specimens and service returns outbound; fleet gear, electronics and repair supplies inbound. Marine technical rotations plus ordinary resident travel. Storm work occurs in local fleets; the city does not move.
- **Bingjie:** archive originals/custody copies, polar specimens and calibrated cold-field kits outbound; archive hardware, conservation supplies, port fittings and ordinary goods inbound. Conservators, port staff, polar researchers and households travel both ways. Routine digital data uses communications, not fictitious physical courier demand.

Institute field programs connect Fuyuan with Balor extraction, Olympos, Cousteau, Descartes, Cinderhook, Hammer/Kalyna orbital interfaces, icy-dwarf research, Gryphon/Hydra-moon/Manticore sites, Teide and the Reach port. Selected specimens originate at the other Dahai cities. No private Daedalus Server Farm/Icarus/Arkfall access or ownership transfer of partner facilities.

## Existing-provider reconciliation

- **Gaia civilians:** retain existing marine/civilian exchanges, but floating-habitat deliveries now serve the three floating cities; agricultural supplies and delicacies use Fuyuan/Zhulong. Remove the former mariculture/Jiuyuan nutrient export to Valenne. Original Gaia program becomes318 orders/day (270 civilian/27 GOV/21 EDF), down from319; new Dahai GOV/EDF additions counted separately above.
- **Merren:** old reference-culture sources become Fuyuan/Zhulong. Specialist travel uses Fuyuan/Zhulong/Bingjie rather than treating Jiuyuan as a cultivation platform. Kalyna's orbital trade membrane and unrelated immigration/work-union programs retained.
- **BAM, Cerberus, Hartwell Labor:** existing Dahai-facing leave, commercial and personnel work inherits names and dispatch; no new coercive-labor expansion, corporate claims or story events.
- **Other providers:** Miners Mutual, BFS, VHM, KIS-E, Kisaragi parent, Halloran, Glitterfield, Pike, Roadstead brokers, Oathmark, the three senior Houses, Covenant and minor Wells nobility were audited through the shared registry. Their unrelated roles/routes/pay remain intact; do not manufacture Dahai ore exports, direct factory franchises, noble claims or restricted religious/research access just to give every actor an arbitrary new lane. They automatically use the shared policy for any eligible Dahai surface consignment.
- Keep local nutrient distribution and same-body Institute coordination in the background. Do not mirror an existing counterparty's procurement order as a duplicate new civilian posting. Notably Merren owns the new Kalyna marine-ingredient purchase; it is absent from the civilian lane roster.

## Historical original-pass audit — 2026-10-23

Current follow-up regression:89077 assertions,338 original-programme orders/242 playable endpoint pairs. Authorized fuel deletions and Sahra routing supersede affected aggregate hashes; the independent pre-Sahra economy snapshot protects all surviving old raw orders. The figures below describe the original pass, not a fresh full-system census.

`npm run audit:dahai`:120 raw epochs and12 sampled-board epochs. Civilian share below includes unnamed Gaia and Dahai issuers; native terminal services remain included.

| Direction/type | Orbital count / demand share | Civilian count / demand share | Sampled board civilian share |
|---|---|---|---|
| Inbound freight |50.0% /50.2%|62.2% /83.4%|68.3%|
| Outbound freight |50.6% /50.6%|57.3% /78.1%|68.3%|
| Inbound passengers |52.1% /51.2%|62.8% /83.2%|67.2%|
| Outbound passengers |54.2% /52.5%|55.9% /76.5%|73.2%|

`npm run test:dahai-shipping`:82362 assertions;340 daily orders,230 playable endpoint pairs; paired dispatch, independent Gaia/Balor ends, location/cargo/access integrity, quotes, actual terminal/settlement and save immutability. Frozen pre-change fixture from1aa0309 protects all28 providers' unrelated candidates over four epochs. Existing Balor original hashes retained except the deliberately reauthored Merren Dahai subset, covered by the separate non-Dahai snapshot. Balor board sampling widened to120 days to observe rare actors amid the added demand; rates/weights were not inflated to force their presence.

Full equipment, maintenance, par, Gaia, Acheron, Balor/BAM/expansion, empty-run, marker, menu, station/parked-ship and globe suites/build pass. Contract-presentation audit now covers30 providers,113010 assertions,7284 public and9 contact postings. Native desktop preview `tests/dahai-shipping-preview.html` exercises the real module worker:32 requests/647 postings, all four city terminals plus civilian/EIP postings. Isolated profile; no live saves or mobile testing. Existing Vite warnings only.

Implementation: `dahai-sites.ts`, `dahai-logistics.ts`, `faction-contracts/dahai-{contracts,partner-lanes,trade-contracts}.ts`; provider integrations remain actor-owned. Naming/role summaries in `nodes.ts`/`location-copy.ts`, institution in `institutions.ts`.

Scientific explanations from the [recovered source review](locations/estella-04-dahai-review.md) remain proposals where not separately accepted. No hydrogen canopy, moving city/deck, underwater flight, global climate/ecosystem simulation, physics changes or automatic visual-stage rollout introduced.
