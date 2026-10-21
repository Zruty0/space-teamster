# Estella I — Balor

Updated: 2026-10-20

## Approved identity

Airless, tidally locked inner planet with a permanent substellar magma sea: the lava eye. Solid hotter terrain surrounds the eye, with cooler margins and a sheltered night side. Tidal locking alone does not melt the surface; sufficient stellar heating is part of the intended setting. The lava eye is Balor's main visual feature.

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

- Main industrial business: refractory extraction, refining and specialised high-temperature materials. Potential products include metal billets, alloy feedstock, furnace linings, ceramics and thermal protection. Detailed manifest roster and individual routes still need authoring.
- Inputs: specialised machinery, precision components, cooling equipment, seals, life-support supplies, food and volatiles. Hot processing is not free processing: heat rejection, maintenance and reliable equipment remain costly.
- Services: skim staging, maintenance, inspection, crew changes, accommodation and recovery.
- Preserve the Still's role as fuel-refining centre. Balor supports the upstream operation; it does not replace the Guild's fuel production.
- Ordinary offworld deliveries/collections should split roughly50% through Balor Orbital and50% direct to/from the three surface sites. This is aggregate routing, not a mandatory second player leg. Skim-specific port operations naturally remain orbital.
- Local distribution, mine-to-foundry transport and ordinary surface-to-surface supply remain background logistics.

## Implementation boundary

This pass implements names, site summaries/tags and the four-destination catalog. Existing Guild/Bruckner/VHM work resolves the renamed endpoints through unchanged IDs. The observatory node, placement and flight profile are removed; old career locations there resolve to Shade on load, preserving finances, rig, time, certifications and other state. Historical records are not rewritten; no live save is edited by the development tools.

BAM contract provider, new cargo roster,50/50 routing distribution and detailed recruitment/dialogue copy are not implemented in this naming pass. Current rotation period42000s, surface coordinates and planet rendering are unchanged. Tidally locked orientation, lava-eye artwork and geographic alignment are the next planet-visuals discussion, not a claimed finished simulation.
