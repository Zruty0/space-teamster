# Sahra — Estella IX

Updated: 2026-10-24
Status: approved identity/locations implemented in `d08aea7`. **New economic programme below is a proposal, not implemented.**

## Approved identity

Cold, airless dwarf planet with sandy regolith over buried ice and fractured opal-bearing rock. Same size, gravity, rotation and orbit as the former IX: gameplay radius165000m, gravity1.45m/s², rotation52000s. No atmosphere added; no wind-driven dunes or moving landing sites.

A society with Bedouin cultural roots: travelling extended households, sealed caravan habitats, hospitality, negotiated water rights, navigation expertise and trusted trading relationships. Permanent settlements receive those communities. Local ground travel remains background activity; players use fixed ports.

Ice extraction supplies dependable ordinary work. Distinctive **veil opals** supply the exceptional-value trade: dark precious opals with natural colour patterns and local provenance. This is a luxury gemstone, not a unique element, indispensable industrial input or Guild-fuel ingredient. Detailed deposits, grades, counterparties, trade volumes and rates remain to be approved.

## Five destinations — implemented

| Existing ID | Name | Role |
|---|---|---|
| `estella-ix-opposite-sense-supply-depot` | **Suhail Anchorage** | Surviving orbital supply/trade station; warehousing, passage bookings, ice exports and imported necessities. |
| `estella-ix-research-base` | **Multaqa** | Principal caravan meeting settlement; auctions, cutting workshops, clinics, schools, brokers and arbitration. Original research base retained as its scientific quarter. |
| `estella-ix-ice-mine` | **Bir Safa** | Ice extraction, purification, reservoirs and caravan servicing; older than the gemstone boom. Emergency water/shelter as hospitality, ordinary commercial supplies paid. |
| `estella-ix-geological-feature` | **Wadi al-Layl** | Opal-bearing fracture valley, dispersed prospecting and fixed survey/field landing. Original discovery exposures protected; extraction elsewhere. |
| `estella-ix-moonlet-observation-outpost` | **Raqib** | Captured-moonlet astronomical/navigation outpost. Parent moonlet also named Raqib; existing docking geometry retained. |

All five roles appear in the actual terminal. Surface flight subtitles and navigation use their names. Existing IDs, coordinates, surface collision geometry, orbit senses and receiving berths remain intact. Wadi's fixed field landing is now public for empty travel, replacing its previous unlisted geological-placeholder status; the protected exposures are not a second landing site.

**Manara/research station removed altogether:** `estella-ix-research-station` and its POI `estella-ix-low-orbit-research-station` have no nodes, placement, layout or access entry. No replacement orbital laboratory. Retired IDs resolve to Suhail only for old saves/accepted flights; they are not districts or newly advertised provider scopes. Existing saved finances, rig, quotes and history are not rewritten.

Two existing Gaia instrument/interface consignments formerly addressed to the removed station now arrive at Suhail for onward research handling. Their original template/dispatch keys, masses and rate terms remain stable; new quotes reflect the actual receiving station. All other raw orders are unchanged apart from display names. No new water/gem/caravan jobs or providers have been added yet.

## Artwork and verification

IX now uses the existing rocky renderer with a muted warm regolith palette,38 subdued impacts and lower relief contrast. Exposed lavender frost removed; ice is buried. The original13 rocky profiles and other7 icy profiles remain unchanged. Orbital labels get the established dark glyph outline. Raqib's asteroid/docking artwork and the other agent's atmosphere prototype are untouched.

`npm run test:sahra`:15754 assertions. Pre-edit snapshot at`05fe774` protects all15669 raw candidates modulo approved names/two receiving-point redirects;7463 unrelated complete postings/quotes remain exact. Checks five real destinations both directions, deletion, unchanged physics/placements/profiles, terminal prose, save migration, cached/accepted views and actual old-contract settlement. Older Camps/Dahai economic snapshots remain frozen; explicit name/retirement normalization only.

Camps, Gaia/Dahai shipping, contract presentation, Balor expansion, empty-run, menus, markers, all world-disc families and build pass. Native desktop `/tests/sahra-preview.html`:14 actual worker requests/120 postings, five terminals and five orbital views. Isolated profile, no live-save/mobile/push/deployment work.

## Economic proposal — awaiting approval

### Ownership and scale

Predominantly independent caravan households, prospecting partnerships, ice operators, cutters, merchants and civic purchasing offices. No new planet-owning megacorporation or compulsory named faction. The ice industry supplies regular freight; opals are scarce, valuable consignments rather than daily tonnes of finished gems. Some households work both sectors; not every resident is a prospector.

### Proposed flows

| Place | Outbound work | Inbound work |
|---|---|---|
| **Bir Safa** | Bulk ice/water to nearby Belt habitats and selected Camps orbital/airless customers; empty tank/container returns | Extraction/purification machinery, filters, seals, pumps, habitat supplies and specialist technicians |
| **Multaqa** | Graded rough/cut veil opals, small merchant consignments, physical research specimens; buyers, cutters, students and family travellers | Food, medicine, clothing, cutting/inspection equipment, protected packaging, lab instruments and ordinary consumer goods |
| **Wadi al-Layl** | Selected rough-opal consignments for offworld buyers, geological specimens, equipment overhaul returns | Survey instruments, excavation spares, seals/batteries, field supplies; prospectors and technical visitors |
| **Suhail Anchorage** | Consolidated exports, onward dispatch and passenger interchange | Imports, warehousing supplies, handling equipment and visiting crews |
| **Raqib** | Observer rotations, physical calibration artifacts and instrument returns | Instruments, life-support stores and small maintenance shipments |

Wadi→Multaqa raw stones and Bir Safa→surface-settlement water normally move with ground caravans, not invented same-surface Teamster flights. Local orbital lifts can be separate voluntary jobs, never a mandatory second leg after an already completed shipment.

### Existing partners to use

- **Hartwell carriers/machinery brokers:** regular equipment, consumables, returns and bulk-water distribution.
- **Steel Combine through Hammer/Anvil:** heavy machinery and industrial spare parts; do not open Kuznia's surface membrane.
- **Gaia/Dahai civilian suppliers:** household necessities, food and clinical supplies. No implausible bulk-water exports to their wet planetary surfaces.
- **Independent jewellers/dealers on Gaia, Caravanserai and selected Wells luxury destinations:** graded stones/cut gems and buyer visits. Premium is natural quality/provenance; synthetic alternatives still exist. Small, carefully packed consignments, not arbitrary gemstone tonnage.
- **Estella Institute of Planetology:** Multaqa field partnerships, specimens, researchers and instruments. It does not acquire the town, claims or Raqib.
- **Existing service firms and Guild:** appropriate servicing/support; Guild fuel and propulsion monopolies retained. No new drive/fuel chemistry.

### Routing and pay recommendation

Allow both direct surface work and orbital consolidation. Suggested starting policy: the established50/50 ordinary offworld dispatch model for Multaqa/Bir Safa/Wadi, independently at each world; native Suhail/Raqib work and deliberate local orbital service legs retain their endpoints. **Not yet implemented or approved.** Do not force total planetary traffic or capped boards to equal50%.

Ice: frequent bulk, modest margins. Ordinary supply/passenger work: standard civilian terms. Opals: less frequent, low-mass/high-care freight with a higher fixed-pay premium and fragility qualification; do not invent theft, insurance, price speculation or humidity simulation for this pass. Raqib: modest research/support demand, no need for a balanced export economy. Exact rates, counts, cargo classifications and specific lanes should follow approval of this outline.
