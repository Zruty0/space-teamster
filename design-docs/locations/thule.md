# Thule / Estella XIII

Updated: 2026-10-25
Status: approved names/refuge identity and sparse Thule/Barataria public missions implemented. No new entities/providers;34 remain. No push/deploy.

## Refuge and five surface sites

Thule is the safe, lonely place at the inhabited edge: leave an old life behind, contribute, and be welcome. Residency requires buying a community share funding one's life-support capacity, or indentured work paying it off. This is authored social context, not a new player loan/admission/ownership simulation. Share prices, voting rights, transferability and a personal debt UI are not implemented. The governor remains an unnamed pragmatic, disillusioned politician, not a new faction or interactive NPC.

| Name | Existing operational ID | Role |
|---|---|---|
| Thule Anchorage | `estella-xiii-main-port` | Public civilian port, arrival accommodation, share registration and regional servicing/expedition support |
| Common Ground | `estella-xiii-governors-outpost` | Tiny governor/civic settlement: share registry, clinic, infrastructure administration and communal rooms |
| Deepwell | `estella-xiii-deep-ice-mining` | Shared ice/processing/maintenance works; local life support, not an inner-system resource monopoly |
| Freehold | `estella-xiii-prison-exile-colony` | Escaped Wells serfs and others leaving House authority; cultural continuity without hereditary obligations |
| Volya | `estella-xiii-long-range-observatory` | Udarnik dissenters, cooperative workshops and communal life organized on their own terms |
| Bellevue | `estella-xiii-classified-research` | Disgraced Gaian politicians, displaced officials and households; old titles have no local authority |

All six receiving sites are public; Freehold/Bellevue are no longer a restricted prison/laboratory. Visiting a dock is not purchasing permanent residence. Original IDs, body/station orbits, surface angles, airlessness, radius, gravity, rotation and physical flight profiles retained. Only obsolete restricted-site label metadata removed. No new artwork, buildings, terrain or underground mechanics.

## Sparse new Thule work — 22 logical orders

**Six GOV /16 Hartwell Shipping**, comprising8 freight and14 passenger orders. Each is available for a whole two-day window every8,12 or16 days, with deterministic independent phases and ordinary board competition. Mean new availability **43/12 ≈3.58 orders/day across all six sites**, not22 daily departures. Most surface distribution remains ground transport. Every return is optional and separately booked.

| Issuer | Route | Manifest | Mass | Window |
|---|---|---|---:|---|
| GOV | Anchorage → Common Ground | Civic maintenance stores |2t|2 days /12|
| GOV | Anchorage → Common Ground | Clinic consumables |1t|2 /12|
| GOV | Anchorage ↔ Common Ground | Community service personnel |3t each|2 /12 each direction|
| GOV | Anchorage ↔ Deepwell | Technical service personnel |3t each|2 /12 each direction|
| HSC | Deepwell → Anchorage | Processed water containers |12t|2 /8|
| HSC | Anchorage → Deepwell | Refurbished utility pumps |4t|2 /12|
| HSC | Deepwell → Anchorage | Utility pump cores for overhaul |4t|2 /12|
| HSC | Anchorage → each of Freehold/Volya/Bellevue | Household supplies/habitat fittings |2t each|2 /12 each site|
| HSC | Anchorage ↔ each enclave | Household arrivals, visits and onward travel |3t each|2 /12 each direction/site|
| HSC | Caravanserai ↔ Anchorage | Civilian household passage |4t each|2 /16 each direction|
| HSC | Cadiz Highport ↔ Anchorage | Civilian household passage |4t each|2 /16 each direction|

Passengers are ordinary voluntary travellers, not prisoners or sold indentures; settlement arrangements are handled locally. Public port passage is not a clandestine extraction run from a private Wells estate. No new industry-owning corporation, labor broker, refugee faction or regional civilian aggregator.

## Barataria Observatory — six public orders

**Two Hartwell Shipping /four EIP**,4 freight/2 passenger orders; mean **19/24 ≈0.79/day**. Legitimate small-observatory work only:

| Issuer | Route | Manifest | Mass | Window |
|---|---|---|---:|---|
| HSC | Thule Anchorage → Observatory | Ordinary provisions |3t|2 days /12|
| HSC | Observatory → Thule Anchorage | Utility pump cores for service |2t|2 /16|
| EIP | Fuyuan ↔ Observatory | Field instrument chests, supply/recalibration |1t each|2 /16 each direction|
| EIP | Fuyuan ↔ Observatory | Visiting observers and returns |3t each|2 /16 each direction|

The Warren, False Bottom Cache and Blind Drop remain unlisted with **zero public freight/passenger traffic**. Their future smuggling contracts require contact reputation; that system is not implemented or bypassed by this programme. Institute bookings do not transfer ownership of Barataria Observatory to EIP. Existing BFS/VHM station-service work remains.

Combined additions:28 logical orders, mean35/8 =4.375/day;48-day counts172 Thule and38 Barataria occurrences. These counts exclude retained pre-existing service programmes.

## Terms and routing

- GOV/EIP freight0.80 fixed +0.45 actual-fuel reimbursement; HSC freight0.75+0.40. All new passengers0.60+0.60. Cap2×par, weight0.6; no flat bounties or forced board slots.
- Standard passenger comfort and passenger qualification. Existing Institute instrument fragility/credential retained. No finished spacecraft fuel, ghost specimens, data-courier cargo or mandatory balanced exports.
- Authored Thule local legs keep their actual surface/orbit endpoints; no new blanket50/50 Thule gateway policy. Issuers handle background onward distribution, not compulsory player chains. Fuyuan uses the existing independent paired Dahai surface/orbital rule before quoting.

## Retirement of incompatible old roles

Old Nunes custody/watch/recovery/field-inquiry orders incident on Thule are no longer generated, including custody departures from the Anchorage. Old Daedalus field/validation work at the former XIII relay (now Volya) is retired. The refuge is not secretly a prison, Nunes observation station or classified lab. Compatible Daedalus/BFS/VHM/other port work and Farwatch logistics remain.

**Keep original seeded pools intact, filter only generated incompatible candidates.** This avoids resampling unrelated destinations, cargo, masses or rates. All12 Nunes Inquiries retain playable contribution work; their state, principals, progress and accepted contracts are untouched. On epochs selecting a retired field site, those field legs are absent rather than silently relocated. Other Nunes wardenship/custody remains unchanged outside Thule.

Old accepted contracts—even retired custody work—still settle under their original quote, endpoint and inquiry terms. Historical records are not rewritten. Cached/accepted display names update at render time; old parked saves retain IDs. No migrations/forced relocations.

## Validation

- `npm run test:thule`:385356 checks,20 actual playable endpoint pairs; all seven working destinations have occasional traffic both ways.48-day added counts: Anchorage78in/108out, Common Ground24/8, Deepwell16/28, Freehold16/8, Volya16/8, Bellevue16/8, Barataria Observatory20/18. All hidden Barataria surface sites0/0.
- Frozen pre-edit7ed42b6 fixture:82 retired candidate instances over four baseline epochs; all15913 surviving old dispatched candidates and all34 surviving raw provider rosters exact.5956 quoted postings on608 unaffected boards retain IDs/selection/order/mass/quotes. Historical fixtures remain unchanged; older whole-system tests delegate authorized retirement to the new independent fixture, not broad unverified exemptions.
- Six actual Thule terminal introductions, normal passenger/fragility requirements, original geometry/physics/saves, old retired and new civilian settlement, and custom snapshots covering every Nunes Inquiry verified.
- Regional shipping, Barataria/Farwatch/Weymark/Sahra, Camps review, physical presentation, empty runs, equipment, menus, icy worlds and build pass.119 empty-run physical destinations after opening the two former controlled sites.
- Native `/tests/thule-preview.html`:264 worker requests/3314 postings (96 new), seven terminals and five real job views; screenshots inspected. Synthetic profile only; ordinary rig restrictions remain enforced. No mobile/live-save testing or push.

Files: `thule-sites.ts`, `faction-contracts/reach-settlement-contracts.ts`, existing GOV/HSC/EIP integrations, narrow Nunes/Daedalus retirement filters, explicit access/catalog/cargo/comfort/cached-name edits; `tests/thule.test.ts`, baseline and native preview.
