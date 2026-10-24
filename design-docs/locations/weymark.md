# Weymark

Updated: 2026-10-24
Status: approved small-mining/crew pass implemented in `66d2dfb`. Nell's Lantern explicitly stays traffic-free with an abandoned navigation outpost. No push/deploy.

Weymark, officially Estella VIII, is a small airless dwarf planet in the Belt, close enough to the Caravanserai to serve as a practical next stop but far enough from its glare to have a life of its own. Its name is usually traced to an old survey contraction of "way-mark," though locals pronounce it **WEE-mark** and insist the spelling matters. Early prospectors found little to make anyone rich: workable stone, a few modest metal seams, and a captured moonlet bright enough to become a navigational comfort on approach. The first settlements survived as road stations more than boom towns, with Weymark Town and Low Gauge Mine serving the thin traffic that passed through.

Today Weymark is where Belt road culture meets precision corporate logistics. The Guild uses Nell's Rest as a forgiving first-rendezvous station, maintenance shipyard and mechanics hub for Teamsters learning real orbital work after Caravanserai; cheap rooms, mess tables and longer-term living are down in Weymark Town. Higher up, Bruckner Weymark Depot handles sealed VHM civilian parts, service kits, calibration cargo and warranty traffic away from the crowded Highliner docks. Small independent claims and quarries share Low Gauge's landing, assay and service facilities without becoming a single planetary corporation. Ordinary stone and town-to-mine movement stay on the ground; selected metal lots earn offworld processing.

Nell's Lantern carries an **abandoned navigation outpost**, with idle tracking equipment, empty pressure rooms and no permanent crew. **No freight, supply runs, staff rotations or passenger bookings.** Lantern Dock remains visitable at the player's own expense under its existing access policy. Old Survey Camp remains mostly abandoned, unlisted for empty travel and outside the regular shipping network. No reserve-filling jobs or new mysteries are implied.

## Six retained destinations

| Existing site | Role after this pass |
|---|---|
| Nell's Rest | Training/maintenance shipyard, independent repair shops and crew interchange; original Guild/Old Nell roles retained |
| Bruckner Weymark Depot | Existing precision distribution hub; locally contracted handling/facility staff commute from town |
| Weymark Town | Homes, rented rooms, mess halls, clinics and everyday commerce for households, miners, station workers and trainees |
| Low Gauge Mine | Shared landing/service settlement for modest independent metal claims and quarries; small concentrates, repairs and crew parties |
| Nell's Lantern / Lantern Dock | Abandoned navigation outpost; zero regular traffic, no new access restriction |
| Old Survey Camp | Abandoned reserve; no new activity or access change |

All six introductions appear in actual terminal scenes. IDs, positions, orbital senses, physical parameters, terrain and surface-flight profiles stay unchanged. No moving sites, new NPC/service interface or artwork added.

## New bookings — 20 daily logical orders

`weymark-independent-operators` / **Independent Weymark bookings** is a descriptive aggregator, with separate claim, quarry, workshop, crew-office and contractor issuers. No market tag or new owning institution. Total provider count34. Existing33 providers and every old routed order remain untouched; no reseeding or replacement of existing civilian/industrial demand.

### Freight — 8

| Route | Manifest | Mass |
|---|---|---:|
| Low Gauge → Cupola | Selected nickel-iron concentrates |12t|
| Low Gauge → Hammer | Selected nickel-iron concentrates |12t|
| Low Gauge → Nell's Rest | Local regolith shielding blocks |16t|
| Low Gauge → Mosaic / Tessera Orbital | Physical assay cores for grade verification |0.6t|
| Veles → Low Gauge | Replacement drill heads |4t|
| Nell's Rest → Low Gauge | Pressure seals and valve blocks |3t|
| Low Gauge → Nell's Rest | Customer utility pump cores for overhaul |4t|
| Nell's Rest → Low Gauge | Serviced utility pumps |4t|

These are contract opportunities, not a new simulation of mine output. Low-grade spoil stays local. No industrial megamine, miraculous resource, new refinery, finished-fuel cargo or proprietary propulsion work.

### Passengers — 12, six bidirectional pairs

- Nell's Rest ↔ Low Gauge: small mine crews.
- Nell's Rest ↔ Weymark Town: arrivals, leave and return travel.
- Bruckner Weymark Depot ↔ Weymark Town: local handling/facility contractors.
- Caravanserai ↔ Weymark Town: voluntary short mine assignments and returns.
- Harlan's Station ↔ Nell's Rest: visiting independent claim teams and survey consultations.
- Veles ↔ Low Gauge: mine-equipment technicians.

Each party has a4t manifest and standard comfort expectations. No new coerced-labor pool, compulsory Co-op membership or transfer of Bruckner/VHM operations.

## Routing and pay

Weymark keeps its actual direct endpoints and established station roles. **No blanket new50/50 Weymark gateway policy.** Town↔mine road movement remains background transport; the authored surface↔orbit jobs are legitimate flights. Repairs/crew returns are separate voluntary bookings, not compulsory chained missions. Tessera independently applies its existing50/50 rule to the assay destination; controlled Kuznia trade uses Hammer, never its surface.

Freight0.75 fixed +0.40 actual-fuel reimbursement, demand weight0.6. Passengers0.60+0.60, weight0.8. Cap2×par; no flat bounties, board quotas or priority slots. Ordinary goods use their existing classifications; assay cores retain shock protection/fragile qualification; passenger work retains its passenger credential. Accepted quotes/history/saves and existing Guild certification/timed training/Old Nell passage remain intact.

## Validation

- `npm run test:weymark`:198282 assertions. Frozen pre-change678a9c0 fixture pins all33 original raw provider rosters, all15899 old routed candidates, physical/access/placement/flight data and an old accepted contract.6200 postings on644 untouched source boards retain full IDs, selection/order and quotes. Sources with new demand may legitimately change board selection.
-20 daily orders (8 freight/12 crew),16 distinct playable endpoint pairs; all build actual missions and positive finite quotes.24-day added traffic: Low Gauge120in/168out, Town72/72, Nell's Rest120/120, Bruckner24/24. **Lantern and Survey Camp0/0 across every provider**, not merely this new aggregator.
- Six actual terminal introductions, original timed return checkride/Old Nell passage, Lantern save compatibility and old/new contract settlement verified.
- Native desktop `/tests/weymark-preview.html`:40 actual worker requests/544 postings, six terminals and real mining/crew postings; both abandoned sites' boards empty. Screenshots inspected. Isolated synthetic profile, no live saves or mobile testing.
- Camps/Sahra/Gaia/Dahai shipping, Balor expansion, contract presentation, empty runs, menus, equipment and build pass. Existing Vite warnings only. Other worker's weather/Balor artwork changes left untouched.

Files: `src/content/estella/weymark-sites.ts`, `faction-contracts/weymark-contracts.ts`, catalog/terminal copy, explicit cargo/comfort entries and provider registration; `tests/weymark.test.ts`, preview and independent pre-change fixture.
