# Balor shipping audit and BAM rollout

Updated: 2026-10-20

## Method and limits

- `npm run audit:balor`: all186 catalogued POIs,120 daily epochs, all regular providers (24 before BAM,25 after).
- Deduplicate raw candidates by provider/source/destination/cargo. These combinations are NOT shipment volumes, tonnage or completed deliveries. Internal routes count at both endpoint sites.
- Actual freight/passenger board generators sampled at12 epochs (days0,10,...110), only from selectable sources that have incident Balor candidates:41 sources before,49 after. Existing board caps and competition apply. No browser, player profile, save changes or simulated completions.
- `BALOR_AUDIT_BASELINE=1 npm run audit:balor` removes BAM only in the isolated audit process to reproduce the pre-BAM registry. Other providers' code and economics are unchanged.
- Initial120-epoch board census exceeded the bounded240s run; final board sample is12 epochs, not120. Raw census remains120.

## Existing participants

Only Bruckner Field Services, Voss-Heinkel Metricwerke and the Teamsters' Guild touched Balor before this pass. No existing provider served Extraction One or Shade.

| Provider | Distinct route/cargo combinations | Raw candidate occurrences | Board rows before → after BAM |
|---|---:|---:|---:|
| Bruckner Field Services |384|1537|146 →137|
| Voss-Heinkel Metricwerke |34|501|49 →37|
| Teamsters' Guild |1|120|12 →9|
| BAM, newly added |112|6720|0 →471|

Other providers' raw offerings are unchanged. Their visible rows fall slightly because BAM participates in the same capped boards; none of the existing providers disappeared. BAM's471 sampled board rows cover102 distinct endpoint/cargo combinations.

| Balor site | Distinct inbound before → after | Distinct outbound before → after | Incident board rows before → after |
|---|---:|---:|---:|
| Balor Orbital |109 →139|129 →155|117 →316|
| BAM Extraction One |0 →8|0 →6|0 →59|
| BAM Foundry One |55 →63|130 →147|90 →203|
| Shade |0 →14|0 →3|0 →76|

Bruckner supplies drive/RCS maintenance, calibration, vibration isolation, overhaul/warranty stock, technicians and inspection crews. It takes failed hardware, quarantined controllers, telemetry and evidence back through its service network. Its Balor nodes are Orbital and Foundry One. VHM's corresponding traffic is proprietary core/field hardware, factory personnel and sensitive returns through Weymark/Gaia finance. Guild work is currently just Balor Orbital→Still Skim-Runner Berth with staged precursor.

## BAM implementation

26 lane families produce56 logical route/cargo consignments per day, using27 labels and18 external sites. Thirteen labels are new; existing classifications are retained for the other14. Both freight and passenger boards are populated.

- **Extraction:** cutters/actuators/sensors/seals inbound; concentrates and worn actuators outbound; specialist deployment/return.
- **Foundry:** pumps, finished Daedalus controller racks and predictive-maintenance processors, Olympos graphite/oxygen inbound; alloy billets, refractory linings, thermal tiles, ceramic packages and overhaul returns outbound; commissioning crews.
- **Shade:** food from Gaia, medical lockers from Kalyna Orbital, bonded water from Cadiz, scrubbers from Anvil/Veles; rated furnace/extraction recruits and paid leave/return rotations.
- **Customers/suppliers:** Hammer, Anvil, Veles, Svarog, Mosaic, Gaia tech/agriculture/main customs, Concord, Dahai's primary port, Olympos, Kalyna Orbital, Cadiz, Systems Campus, Cupola intake, Cinderhook, Caravanserai outfitter and Still public dock. These are BAM-issued orders, not new seller-issued provider branches.
- **Terms:** freight1.00+0.40, personnel1.00+0.50, compensation cap2, no flat rewards. At par these are40%/50% margins before condition/comfort penalties and maintenance. Passenger manifests have elevated comfort; higher wages are setting context, not a new employment simulation.
- **50/50:** each logical order posts once per day, via Orbital OR direct. A deterministic two-day pair assigns one day to each; pair-specific mixing avoids a universal switch. Same cargo mass/pay/weight across gateways. Over120 epochs,3360 hub and3360 direct candidates, balanced separately for freight/passengers and inbound/outbound. No duplicate alternatives and no required second player leg.
- **Other actors' offworld raw routing:** BFS55.1% hub, VHM51.9%, Guild100% (specialised staging). BAM plus ordinary BFS/VHM is about51.0% hub by raw occurrences; no global board/player quota is imposed.
- Only operational handling facts added to Details. Existing shared neutral completion text used; no unapproved BAM narrative scenes, recruitment slogan, director or contact dialogue.

## Other participants worth adding later

These are audit recommendations, NOT changes made to those providers.

| Actor | Appropriate Balor role | Boundaries / overlap |
|---|---|---|
| **Hartwell Shipping Companies** | Highest-priority independent carrier expansion: life-support/industrial-consumable imports and refractory-product backhauls | Add deliberate Balor lanes, not Balor to every Wells pool. Keep existing seeded company rosters stable; appending to the general lane pool can reshuffle unrelated company identities. Avoid duplicating BAM's exact procurement contracts. |
| **Merren Conservatory** | Shade's restaurants, recovery clinics and sheltered gardens: game-bird cuts, cultured delicacies, medical nutriments/medicinal stock; return cassettes | Use Kalyna Orbital and product-appropriate destinations. Do not alter its50/25/25 passenger network just to add Balor. BAM's medical purchase already connects the hub, but Merren's own export/return pools do not. |
| **Daedalus Systems** | Finished controllers, maintenance processors and later explicitly isolated hot-environment validation; BAM ceramics as production inputs | BAM now buys finished products from Systems Campus. Seller-issued routes/validation/RMA could add distinct work later; do not introduce Icarus/Server Farm output or treat experimental control hardware as ordinary safety-critical procurement. |
| **Bruckner / VHM** | Existing strong service network; possible Extraction One extension for VHM-equipped vehicles/plant | No generic medical/food/industrial-electronics expansion. Existing hub/foundry service already substantial; do not flood the board or assume every BAM machine needs proprietary drive support. |
| **Teamsters' Guild** | Skim crew departure/recovery rotations, support equipment and organised precursor handling | Preserve Guild custody and Still fuel refining. Current Balor service identity is much broader than its single implemented staging route. Near-star physical placement must be resolved before adding practical hub/crew routes. |
| **Kisaragi Yards Estella** | Buyer-issued procurement of certified thermal tiles, refractory blanks and ceramics for its existing yard tenants | BAM already exports to Svarog/Caravanserai yards. Add specific fit-out purchases rather than cloning those rows. KIS-E is the local tenant representative, not planetary owner or generic transport operator. |
| **Steel Combine / Halloran / Cinderhook** | Industrial customers for refractory linings/concentrates and suppliers of machinery/feedstock | BAM orders already reach their orbital/industrial interfaces. Respect Hammer/Anvil-only foreign access to Kuznia and Halloran's no-metal-export policy for its own provider. |
| **CHR / Carbonvale** | Commercial supplier of graphite/oxygen; Olympos customer for foundry linings | BAM procurement/product lanes already establish this trade. No CHR custody labor or Pandemonium hydrogen/ordinary bulk-feedstock expansion. Buying Carbonvale stock does not make BAM a CHR labor client. |
| **Hartwell Labor Exchange** | Optional future curated placement of rated specialists | Do not merely append Balor to cheap worksite/bonded-crew pools. Existing pricing and cynical generic completion copy clash with BAM's deliberate high-pay, competence-first recruitment. BAM now directly sponsors recruitment. |

No clear first-pass need for Nunes/Alvares/Mendes/Covenant, a new generic carrier, or a blanket Highliner/executive route. Existing faction identities and reserved story arcs remain intact.

## Important reachability finding

Skim Hub Alpha and Beta have catalog entries/layouts and existing raw Guild/Bruckner templates, but **no exact authored orbital placements**, so they are not selectable navigation origins/destinations. The Coronal Observation Post likewise still lacks an authored orbit. The final board audit explicitly excludes nonselectable sources; raw route lists still show them as planned network connections.

Initial BAM thermal-tile destinations included the skim hubs; endpoint regression caught the gap before commit. Final BAM deliveries use reachable Svarog, Caravanserai outfitter and Still public dock instead. No new near-star orbits were invented in this pass. Author the near-star stations deliberately before treating Balor's full skim-service loop as playable.

## Checks

`npm run test:bam`:120-day logical dispatch audit, exact pair balance by count/weight, no local shuttles, deterministic masses/queries, explicit fragility/comfort, faction access constraints, real payable boards and generation of playable mission phases for sampled board pairs. Other providers were audited only. Existing acceptance/settlement/persistence machinery unchanged; no live saves, push or deployment.
