# Estella I — Balor

Updated: 2026-10-20

## Approved identity

Airless, tidally locked inner planet with a permanent substellar magma sea: the lava eye. Its visible surface arc is about30° total (±15° from the substellar point), not a molten hemisphere. Solid hotter terrain surrounds the eye, with cooler margins and a sheltered night side. Tidal locking alone does not melt the surface; sufficient stellar heating is part of the intended setting. The lava eye is Balor's main visual feature.

Presentation rule: orient the Eye toward Estella when the orbital view is first entered, using entry world time, then freeze it for the visit. No continuous planet rotation or lava animation. Retry and a descent/return detour preserve the same snapshot. A fresh visit can have a different orientation.

Industry and skim-work services define the inhabited planet. No observatory. The hostile environment contrasts with a competent, professional and rewarding place to work.

## Four destinations

| Name | Stable game ID | Role |
|---|---|---|
| Balor Orbital | estella-i-transit-customs (station estella-i-low-orbit-station) | Skim servicing, crew handling, precursor staging and general planetary freight hub |
| Shade | estella-i-worker-hab | Resident-named recreation/recovery town; permanent community and off-duty industrial/skim crews |
| BAM Extraction One | estella-i-refractory-mine | Company-named mining hub on stable solid ground nearer the eye; supports hot-zone operations |
| BAM Foundry One | estella-i-hot-processing | Company-named processing/manufacturing complex on a cooler margin, with access to solar energy and sheltered cooling infrastructure |

The town is a place to live and enjoy earnings, not just a workers' dormitory. Its name is Shade, not Afterglow or Sundown. The industrial numbering reflects the company's early stage and ambitions for further installations.

## Balor Advanced Materials — BAM

Early-stage, already successful corporation. Leadership are still engineers; operations are professional and merit-based, with safety and competence paramount. Corporate managerial dysfunction has not set in. Portray this sincerely, not as a facade concealing abuse.

BAM recruits the highest-rated skilled blue-collar workers: high pay for high-risk work, with competence rather than recklessness as the qualification. “Hotheads” belongs to its recruitment/motto identity, not its company name. Exact recruitment slogan remains unselected.

BAM operates both industrial sites. Detailed ownership/governance of Shade and Balor Orbital remains open; earlier joint-port and independent-municipality suggestions are not settled canon. No named directors or personal contacts yet.

## Economy direction

- Main industrial business: refractory extraction, refining and specialised high-temperature materials. Authored products include refractory concentrates, alloy billets, linings, thermal tiles and high-purity ceramic packages. Procurement covers mining equipment, pumps, finished industrial electronics and consumables; worn actuators and pumps return for overhaul.
- Inputs: specialised machinery, precision components, cooling equipment, seals, life-support supplies, food and volatiles. Hot processing is not free processing: heat rejection, maintenance and reliable equipment remain costly.
- Services: skim staging, maintenance, inspection, crew changes, accommodation and recovery.
- Preserve the Still's role as fuel-refining centre. Balor supports the upstream operation; it does not replace the Guild's fuel production.
- Ordinary offworld deliveries/collections should split roughly50% through Balor Orbital and50% direct to/from the three surface sites. This is aggregate routing, not a mandatory second player leg. Skim-specific port operations naturally remain orbital.
- Local distribution, mine-to-foundry transport and ordinary surface-to-surface supply remain background logistics.

## Implementation boundary

This pass implements names, site summaries/tags and the four-destination catalog. Existing Guild/Bruckner/VHM work resolves the renamed endpoints through unchanged IDs. The observatory node, placement and flight profile are removed; old career locations there resolve to Shade on load, preserving finances, rig, time, certifications and other state. Historical records are not rewritten; no live save is edited by the development tools.

BAM contract provider, cargo roster and50/50 paired dispatch routing are now implemented:26 lane families,56 logical consignments/day,27 labels,18 external sites. Each logical order posts either orbital or direct handling on a given day, not duplicate alternatives. Complete two-day pairs balance count and weight; player choices/capped boards need not reproduce that ratio. Operational details explain the relevant surface site and background local transfer. Freight terms1.00+0.40, personnel1.00+0.50, cap2; elevated passenger comfort. Detailed narrative/recruitment copy still awaits review; the existing neutral completion receipt is used. See [economy](../economy.md) and [shipping audit](../balor-shipping-audit.md).

2026-10-21 shipping expansion: eight existing actors add45 logical consignments (35 ordinary50/50 hub/direct orders,10 orbital-only Guild skim orders). Hartwell supplies/backhauls; Merren Shade food/medical/gardens and packaging returns; Daedalus finished controls/isolated trials/RMA; KIS-E yard material purchases; Steel imports/machinery; Halloran furnace stores; Cinderhook refined feedstock. Guild duty/recovery crews, support stores and precursor consolidation now reach Alpha/Beta at120/180million-metre stellar orbits. Existing direct precursor routes to the Still remain; local recovery transfer to Shade stays background. Coronal remains an unauthored endgame reserve. Existing provider work/rosters and narrative approvals preserved; no new contact/governance decisions.

The subsequent Eye pass adds a shared procedural Canvas appearance to local orbit and small system markers. The old42000s spin metadata is removed. Canonical site longitudes are now Eye-relative: Extraction One−0.35rad (solid ground just outside the small cap), Foundry One−1.65rad (cooler margin), Shade−2.6rad (night side). The entry snapshot rotates these markers and the landing reference together; descent inherits the frame, and first ascent transforms its canonical ship position/velocity once at orbital entry. No moving ground, angular surface velocity, new heat/collision rules or historical/save rewrites. See [Balor Eye rendering](../balor-eye.md).
