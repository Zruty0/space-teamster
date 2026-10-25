# Barataria / Estella XIV

Updated: 2026-10-25
Status: approved world/station names and three surface roles implemented. **No surface contracts yet.** Smuggling contracts/contact reputation remain a separate future pass.

## Identity

Airless Reach ice dwarf with a porous, fractured upper crust and extensive caves. Concealed entrances lead to buried habitats and storage chambers that cannot be picked out from above. No atmosphere, cavern flight mechanic, procedural underground map or new terrain artwork added; the existing orbital/surface flight geometry remains.

**Barataria Observatory** is publicly approachable: a small working observation post and technical stop, also the social hub for a smuggling network. Legitimate observation-post work may appear publicly; smuggling work must eventually be behind **contact reputation**, not merely discovering a contact. This pass neither creates smuggling jobs nor implements a reputation system. Existing BFS/VHM station-service contracts are retained without new additions or reseeding.

## Retained locations, new roles

| Name | Persistent POI ID | Role |
|---|---|---|
| Barataria Observatory | `estella-xiv-transit-dock` | Public orbital observation-post cover / smuggling meeting point |
| **The Warren** | `estella-xiv-smuggler-haven` | Sole surface settlement: sealed habitats, households, bunks, stores and small workshops inside branching caverns |
| **False Bottom Cache** | `estella-xiv-religious-retreat` | Storage chambers hidden beyond an apparent shallow recess; consignments await separate pickup, no permanent settlement |
| **Blind Drop** | `estella-xiv-abandoned-active-site` | Unstaffed handoff lockers behind a dogleg fissure; crews need not meet |

The former monastery and abandoned-but-active mystery are superseded. These are the three existing surface slots, not three extra sites. The old religious/mystery IDs are compatibility identifiers only, not promises to retain those roles.

All three surface sites are **unlisted** for empty travel, with target-only flight-label metadata; none has a current mission contact. The old publicly accessible monastery becomes hidden False Bottom Cache. Normal public observatory approaches show no ground-site markers. A future explicitly targeted flight retains its own site marker, not the other concealed locations. No faction/office/contact/shop/settlement population simulation added.

## Compatibility and limits

- Body `estella-xiv`, station parent and all POI/access IDs retained. Radius107000m, gravity0.45m/s², rotation54000s, airlessness, orbit radii/senses, site angles and original physical flight profiles unchanged. Only the former monastery's label-visibility metadata changes.
- Existing parked saves stay at their original IDs; empty departure to the public observatory remains possible. Accepted/cached contract endpoint prose receives the approved display names without rewriting stored quotes, history or original snapshots.
- No new or removed freight/passenger templates, rates, commodity classifications or providers. All surface sites have zero inbound/outbound regular contracts across all34 providers over24 days. Existing orbital programme69 incoming/168 outgoing candidates in that sample is retained, not newly authored traffic.
- No new cave artwork/stealth simulation, legal/customs system, contraband rules or reputation thresholds. Future smuggling must author those mechanics deliberately rather than treating known-contact knowledge as reputation. XIII still awaits its identity pass.

## Validation

`npm run test:barataria`:96074 checks. Pre-edit3ffd4bf baseline pins all34 raw provider rosters,15995 dispatched candidates and7704 actual postings: names normalize for historical comparison, while actual new labels are asserted independently. Exact selection/order/IDs/masses/quotes preserved; no baseline regeneration. Existing coordinates/physical profiles/saves/access and actual observatory/future-target mission construction checked.

Empty runs2877 +35 rendering checks (117 accessible physical destinations after hiding the old monastery); Farwatch, Weymark, Dahai shipping, Camps review, contract presentation, orbital markers, menus and build pass. Native `/tests/barataria-preview.html`:16 worker requests/28 existing orbital postings, all three surface boards empty, four terminal scenes and an actual orbital view; screenshots inspected. Synthetic profile only, no mobile/live-save edits. No push/deploy.
