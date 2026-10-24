# Sahra — Estella IX

Updated: 2026-10-24
Status: identity/locations implemented in `d08aea7`; approved economic programme implemented in `c49726d`. Pete's corrections: **Raqib traffic exclusively Institute-issued; no Sahra Guild shipments; no dedicated finished-fuel container jobs anywhere.** No push/deploy.

## Approved identity

Cold, airless dwarf planet with sandy regolith over buried ice and fractured opal-bearing rock. Same size, gravity, rotation and orbit as the former IX: gameplay radius165000m, gravity1.45m/s², rotation52000s. No atmosphere added; no wind-driven dunes or moving landing sites.

A society with Bedouin cultural roots: travelling extended households, sealed caravan habitats, hospitality, negotiated water rights, navigation expertise and trusted trading relationships. Permanent settlements receive those communities. Local ground travel remains background activity; players use fixed ports.

Ice extraction supplies dependable ordinary work. Distinctive **veil opals** supply the exceptional-value trade: dark precious opals with natural colour patterns and local provenance. This is a luxury gemstone, not a unique element, indispensable industrial input or Guild-fuel ingredient. The trade programme below is implemented; detailed deposit maps, gemstone grades and new market-price mechanics remain outside this pass.

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

Two existing Gaia instrument/interface consignments formerly addressed to the removed station now arrive at Suhail for onward research handling. Their original template/dispatch keys, masses and rate terms remain stable; new quotes reflect the actual receiving station. All other raw orders are unchanged apart from display names. That identity commit added no new jobs/providers; the subsequent programme below adds them without reseeding these existing orders.

## Artwork and verification

IX now uses the existing rocky renderer with a muted warm regolith palette,38 subdued impacts and lower relief contrast. Exposed lavender frost removed; ice is buried. The original13 rocky profiles and other7 icy profiles remain unchanged. Orbital labels get the established dark glyph outline. Raqib's asteroid/docking artwork and the other agent's atmosphere prototype are untouched.

`npm run test:sahra`:15754 assertions. Pre-edit snapshot at`05fe774` protects all15669 raw candidates modulo approved names/two receiving-point redirects;7463 unrelated complete postings/quotes remain exact. Checks five real destinations both directions, deletion, unchanged physics/placements/profiles, terminal prose, save migration, cached/accepted views and actual old-contract settlement. Older Camps/Dahai economic snapshots remain frozen; explicit name/retirement normalization only.

Camps, Gaia/Dahai shipping, contract presentation, Balor expansion, empty-run, menus, markers, all world-disc families and build pass. Native desktop `/tests/sahra-preview.html`:14 actual worker requests/120 postings, five terminals and five orbital views. Isolated profile, no live-save/mobile/push/deployment work.

## Economic programme — implemented2026-10-24

`c49726d`: **78 distinct additional logical orders**, averaging **67 available per day**.63 daily, three cut-opal lots available one paired epoch per six days, two rough-opal lots one pair per eight days, ten Raqib orders one pair per eight days. Cadence phase is deterministically seeded per order; availability is not guaranteed board placement or a simulated cargo throughput quota.33 provider families total.

| Issuer family | Distinct orders | Mean daily availability |
|---|---:|---:|
| Independent Sahra bookings |40|36.5|
| Hartwell Shipping |15|15|
| Hartwell Machinery Brokers |7|7|
| Steel Combine Foreign Trade Committee |2|2|
| Estella Institute of Planetology |14|6.5|

Civilian aggregation represents separate households, cooperatives and merchants, not a corporation. Existing companies own their additions outside legacy seeded pools. The Institute retains its original92 daily orders elsewhere and adds four Wadi orders plus ten occasional Raqib orders;106 distinct Institute orders overall,98.5 average daily availability.

### Ownership and scale

Predominantly independent caravan households, prospecting partnerships, ice operators, cutters, merchants and civic purchasing offices. No new planet-owning megacorporation or compulsory named faction. The ice industry supplies regular freight; opals are scarce, valuable consignments rather than daily tonnes of finished gems. Some households work both sectors; not every resident is a prospector.

### Implemented flows

| Place | Outbound work | Inbound work |
|---|---|---|
| **Bir Safa** | Bulk ice/water to nearby Belt habitats and selected Camps orbital/airless customers; empty tank/container returns | Extraction/purification machinery, filters, seals, pumps, habitat supplies and specialist technicians |
| **Multaqa** | Graded rough/cut veil opals, small merchant consignments, physical research specimens; buyers, cutters, students and family travellers | Food, medicine, clothing, cutting/inspection equipment, protected packaging, lab instruments and ordinary consumer goods |
| **Wadi al-Layl** | Selected rough-opal consignments for offworld buyers, geological specimens, equipment overhaul returns | Survey instruments, excavation spares, seals/batteries, field supplies; prospectors and technical visitors |
| **Suhail Anchorage** | Consolidated exports, onward dispatch and passenger interchange | Imports, warehousing supplies, handling equipment and visiting crews |
| **Raqib** | **Institute only:** observer rotations, physical calibration artifacts and instrument returns | **Institute only:** instruments, provisions and life-support stores |

Wadi→Multaqa raw stones and Bir Safa→surface-settlement water normally move with ground caravans, not invented same-surface Teamster flights. Local orbital lifts can be separate voluntary jobs, never a mandatory second leg after an already completed shipment.

### Partners and customers

- **Hartwell carriers/machinery brokers:** regular equipment, consumables, returns and bulk-water distribution.
- **Steel Combine through Hammer/Anvil:** heavy machinery and industrial spare parts; do not open Kuznia's surface membrane.
- **Gaia/Dahai civilian suppliers:** household necessities, food and clinical supplies. No implausible bulk-water exports to their wet planetary surfaces.
- **Independent jewellers/dealers on Gaia, Caravanserai and selected Wells luxury destinations:** graded stones/cut gems and buyer visits. Premium is natural quality/provenance; synthetic alternatives still exist. Small, carefully packed consignments, not arbitrary gemstone tonnage.
- **Estella Institute of Planetology:** Multaqa field partnerships, specimens, researchers and instruments. It does not acquire the town, claims or Raqib.
- **Guild:** no Sahra shipments. System-wide refuelling and fuel/propulsion monopolies remain, but tiny finished-fuel consignments use background distribution rather than dedicated container contracts. Existing non-fuel Guild work elsewhere is retained.

### Routing and terms

Multaqa/Bir Safa/Wadi ordinary offworld work uses50/50 orbital/direct dispatch, independently at each world. Sahra's outer adapter runs after Camps/Dahai/Gaia, before quotes, and collects redirected departures at Suhail. Existing Sahra-facing surface orders inherit the policy too. New orders have stable per-consignment keys for each world. Occasional orders retain whole adjacent-day pairs, preserving exact50/50 across their active epochs. Native Suhail work, Raqib and local Institute flights retain their actual endpoints. Total planetary traffic/capped boards need not be50/50.

- Civilian/Institute freight:0.80 fixed +0.45 actual-fuel reimbursement; passengers0.60+0.60. Cap2×par, no flat bounty/forced slots.
- Opals:1.25+0.45, demand weight0.35. Cut lots0.08t including cases/packaging, very fragile; rough lots0.18t, fragile. Both shock-protected and qualification-gated. No theft, insurance, price speculation or humidity simulation.
- Ordinary civilians: weight1.4. Ice/water: weight1, Hartwell routine0.75+0.40, regular bulk trade. Machinery uses its existing heavy/routine rates. Steel exports use0.15+1.00 under Foreign Trade Committee authority. All caps2.
- Raqib: all10 distinct freight/passenger orders belong to EIP, both directions and including stores. Fuyuan instruments/returns/observers; Multaqa standards/calibration returns/local observers; Suhail filters1.2t and provisions2.4t. Each available one two-day pair per eight days, weight0.35. No general visitors, supplier-branded orders or new ownership/governance claim.

### Finished-fuel retirement — system-wide

Removed **11 daily Guild orders**: eight destinations from the three legacy fuel-distribution templates, one Scaffold order and two Dahai port orders. No replacement full-container fuel loads under another issuer. The original Camps programme is now163 rather than164 orders/day; Dahai338 rather than340. Guild hardware/certification/paperwork, fuel purchases/services, the Still and industrial skim-precursor feedstock remain. Cargo classification for `stable fuel canisters` stays for accepted/history compatibility; an actual pre-change accepted fuel job still settles at its original quote.

### Current validation

`npm run test:sahra` includes identity15981 + economy247174 assertions. Pre-change6067506 fixture protects all32 original providers' non-fuel raw rosters at six epochs; only the11 explicit fuel deletions are permitted. Across four routed epochs15569 unrelated candidates remain exact;4273 postings on540 unaffected boards retain complete ordering/IDs/quotes. Boards with added/removed demand may legitimately change selection. Old snapshots remain historical fixtures, not regenerated to hide changes.

48-day new-programme coverage (not whole-system traffic):

| Site | In | Out |
|---|---:|---:|
| Suhail Anchorage |960|732|
| Multaqa |384|288|
| Bir Safa |216|288|
| Wadi al-Layl |192|108|
| Raqib (all EIP) |72|48|

All108 new physical endpoint pairs construct actual flights and positive finite quotes. Native desktop `/tests/sahra-preview.html`:72 real-worker requests/937 postings; five terminals, five orbital views and actual opal/ice/Institute/household postings. Desktop images inspected, including Raqib's Institute-only terminal copy. Camps, Dahai/Gaia shipping, Balor expansion, contract presentation, empty runs, Acheron, equipment, maintenance, par, menus and build pass. Existing Vite warnings only. Physics, artwork, access, saved/accepted objects and history untouched by this economic pass.

Implementation: `sahra-sites.ts`, `sahra-logistics.ts`, `faction-contracts/sahra-{contracts,partner-lanes,trade-contracts}.ts`; additions integrated into existing actor modules; `tests/sahra-economy.test.ts` and the frozen fixture. No automatic further Belt or visual rollout.
