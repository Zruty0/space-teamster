# EDF Farwatch Station

Updated: 2026-10-25
Status: approved rename/operator/access and regular contract programme implemented. Formerly The Deepest Dock; existing `deepest-dock-body`, `deepest-dock-poi`, berth ID, comet-fragment anchorage, coordinates and flight geometry retained.

## Role and access

EDF-operated forward expedition/observation base supporting investigation of the unexplained phenomena first reported in Reach outer space, informally **space ghosts**. EDF handles station operations; an Institute scientific attachment conducts research. No chosen ghost appearance, biology, intelligence, origin or practical product is implied. No sightings, capture mechanics, new NPCs or military patrol gameplay added. Nunes's existing outer-route wardenship remains untouched.

**Contract-only arrival.** Farwatch is absent from empty-run navigation; even a future known local mission contact cannot unlock independent arrival. Regular public postings carry authorization both to/from it. Delivering a contract does not permanently unlock access. A player already there may depart empty to an allowed public destination; no stranding or retroactive cancellation of accepted flights.

The new explicit `contract-only` access class applies only here. Existing public/restricted/unlisted policies, including known-contact exceptions elsewhere, remain intact. Cached/accepted old Farwatch names are updated at presentation time; IDs, quote objects, save snapshots and history are not rewritten.

## Additional orders

**15 distinct logical orders:9 EDF,6 EIP;9 freight,6 passenger.** No new provider;34 overall. Availability is occasional but recurring: whole two-day windows every4,6 or8 days, with deterministic independent order phases. Mean availability16/3 orders per day, not15 daily departures. Ordinary weighted board selection can omit an available order; no forced slots, new bounties or chained obligations.

### EDF — station operations

| Route | Manifest | Mass | Window |
|---|---|---:|---|
| Reach main port → Farwatch | Shelf-stable provisions and everyday stores |8t|2 days /4|
| Reach main port → Farwatch | Life-support filters, seals and recovery service kits |4t|2 days /4|
| Reach main port → Farwatch | Power, communications and docking maintenance assemblies |6t|2 days /4|
| Farwatch → Reach main port | Utility pump cores for overhaul |4t|2 days /4|
| Farwatch → Reach main port | Reusable expedition fittings/cases for inspection/reissue |3t|2 days /4|
| Orselle ↔ Farwatch | EDF duty personnel; relief and return travel |4t each|2 days /8, each direction|
| Reach main port ↔ Farwatch | EDF-contracted facility technicians |3t each|2 days /6, each direction|

### EIP — scientific attachment

| Route | Manifest | Mass | Window |
|---|---|---:|---|
| Fuyuan → Farwatch | Observation instrument chests |2t|2 days /6|
| Farwatch → Fuyuan | Instruments for bench inspection/recalibration |2t|2 days /6|
| Fuyuan ↔ Farwatch | Institute field researchers |4t each|2 days /8, each direction|
| Mosaic ↔ Farwatch | Institute-owned optical mounting assemblies for installation/service |1t each|2 days /8, each direction|

No assumed captured ghosts, harvested alien material, specimen exports, couriered ordinary data or dedicated finished-fuel loads. No anonymous leisure visitors. Existing BFS/VHM equipment, returns and technician work remains; EDF ownership does not convert third-party suppliers into EDF issuers or replace their established networks.

## Dispatch and terms

Farwatch and its native Reach port support legs stay at their actual endpoints. Orselle, Fuyuan and Mosaic use their existing independent50/50 surface/orbital policies, yielding Richelieu, Dahai Orbital and Tessera Orbital alternatives before quoting. Adjacent-day availability preserves the paired split even for occasional orders. There is no new Reach gateway rerouting rule.

Freight0.80 fixed +0.45 actual-fuel reimbursement; passengers0.60+0.60; allowance2×par. Weight0.65, no flat bounty. Small party manifests have standard comfort and require the passenger qualification. Observation instruments and optical assemblies retain very-fragile handling/protected containers and fragile-cargo qualification. Long-haul pay uses normal actual-route estimation, not an arbitrary Reach premium.

## Verification

- Independent pre-change fixture from `f0ff98e`, captured before rename/economy edits. All34 original raw provider rosters and15979 old dispatched candidates retained. Approved endpoint rename normalized only in historical test fingerprints; new actual names asserted independently.6743 old postings on668 untouched boards preserve full availability/order/IDs/quotes. Sources receiving new demand can legitimately change board competition.
- `npm run test:farwatch`:1894 checks;15 logical orders,14 actual playable endpoint pairs;24-day added traffic70in/58out (88 EDF occurrences,40 EIP). Actual quotes/missions, paired cadence, cargo/comfort qualifications, no empty arrival including a synthetic known contact, public contract access, legacy parked saves and old/new delivery settlement verified.
- All six new passenger directions and nine freight orders remain separately booked; no compulsory return. Original BFS/VHM board traffic appears both inbound/outbound.
- Weymark, Sahra, Gaia/Dahai/Camps shipping, Balor expansion, physical contract presentation, empty runs, equipment, menus and build checked. Historical fixtures were not regenerated to bless the change.
- Desktop preview: `/tests/farwatch-preview.html`;192 native worker requests/4434 postings (102 new), terminal and five real EDF/EIP posting views. Screenshots inspected; default rig's atmospheric restrictions remain correctly visible on direct Fuyuan work. Synthetic profile, no live save or mobile testing. No push/deploy.

Runtime: `faction-contracts/farwatch-contracts.ts` appended only to existing EDF/EIP providers; catalog/terminal naming, explicit access policy and cargo/comfort classifications. Test: `tests/farwatch.test.ts`, frozen fixture and native preview.
