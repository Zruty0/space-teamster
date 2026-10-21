# Empty runs — proposed access roster

Updated: 2026-10-21
Status: design recommendation for review; no runtime implementation or access-policy changes yet.

## Requested mechanism

Station Terminal → Plan Empty Run → region/body/moon/station navigation → destination → route/cost confirmation → normal playable mission. Origin is the current career location. No cargo, pay or fuel reimbursement; normal fuel/time/wear and flight restrictions. Destination must be public and physically playable. Departures from restricted delivery sites must remain possible. Existing contract-authorized access is unaffected.

Proposed bookkeeping: distinguish empty runs from commercial deliveries, no qualification/reputation rewards; settlement and wear commit only on successful arrival, normal deterministic retries. Public surface-to-surface personal relocation is allowed; this does not add routine local supply jobs to boards. Omit current-terminal destinations and prune empty folders.

Sort regions inner-to-outer; orbiting siblings by radius around their shared parent (semi-major axis for eccentric orbits). Surface sites separately/alphabetically; non-orbiting cluster members have no orbital radius and use a stable alphabetical fallback. Preserve back navigation and readable wrapping.

## Meaning of public

Public means an independent Teamster may arrive at the site's receiving pad/dock without a sponsoring assignment. It does not grant access to a factory floor, palace interior, data centre or every onboard department. Danger, remoteness, private ownership, expensive clientele and scientific work do not by themselves make a destination restricted.

Recommend explicit per-POI access: public / restricted / clandestine, with a short author-facing reason. Classify existing inventory deliberately; require review for new POIs rather than automatically exposing them. Do not derive access from free-text tags or propagate a parent's restriction without public-entry exceptions. Access metadata for this feature is not a new universal law/customs simulation.

## Public by recommendation

All ordinary commercial/civic destinations not excepted below, including:

- All four Balor sites; Skim Alpha and Beta. Precursor handling remains certified, but empty arrival at the working ports is permitted.
- Acheron Commercial Hub, Olympos, Nimbus Crucible and Pandemonium. Pandemonium's hazard is not a blanket prohibition; preserve worker self-government rather than introducing wardens.
- Gaia/Dahai civilian ports, towns, industry, heritage and ordinary science facilities.
- Hartwell/Pike commercial and civic sites; Svarog Shipyard, Veles Terminal, Anchorhold and Black Vein Mine. Svarog is not part of Kuznia's commune.
- Anvil, Hammer and Kalyna Orbital; controlled surface destinations are excepted below.
- Caravanserai's public receiving/services, ordinary claim/mining depots, Cupola cargo facilities, Weymark and the public approach dock at the Still.
- Ordinary Wells ports, mines, yards, administrative courts and castles, including Castle Mendes and Calatrava Keep's receiving gates. Oathmark Academy and Iron Lists remain open receiving destinations; actual exercise ranges are not.
- Daedalus Systems Campus's commercial receiving area; not Server Farm or Icarus.
- Pilgrim Gate and Vigil Gate as external trade/arrival interfaces; not unrestricted admission to the Covenant interiors.
- Macao Palace and Great Arena; ordinary legal resorts/casinos, not invitation-only or hidden facilities.
- Reach settlements, ordinary science cells, monasteries, prospector supply caches, beacon stations and Deepest Dock. Remote/isolated/mysterious does not automatically mean secret.
- Known abandoned sites such as First Landing and Old Survey Camp. Visiting does not grant salvage rights.

Public classifications do not manufacture missing placements: casino Concourse and civilian Main Observatory Dock should be public when playable, but unfinished placement chains remain unavailable.

## Restricted — proposed exclusions

| Area | POI IDs | Reason |
|---|---|---|
| Gaia | `estella-iii-military-spaceport` | Restricted military/government installation |
| Kuznia surface | `estella-vi-industrial-city`, `estella-vi-foundry-complex`, `estella-vi-spaceport`, `estella-vi-agricultural-lowlands`, `estella-vi-polar-weather-research`, `estella-vi-mountain-mining` | Recommend assignment-only arrival for this version; preserve Combine dispatch/clearance rather than invent a visitor-permit system |
| Kalyna surface | `estella-vib-vat-protein`, `estella-vib-pharma-horticulture`, `estella-vib-aquaculture` | Controlled producer facilities; use Kalyna Orbital for unsponsored arrivals |
| Tessera | `estella-vii-black-project-outpost` | Black Tile sealed research |
| Still internal destinations | `still-guild-hq`, `still-refinery-core`, `still-distribution-bay`, `still-worker-hab`, `still-skim-runner-berth-poi` | Empty flights use Public Approach Dock; local Directory/training access remains unchanged |
| Arkfall | `ark-quarantine-station-poi` | Military quarantine/salvage control; no unrestricted arrival |
| Casino private berth | `casino-private-berth` | Reserved/authorized arrivals rather than public concourse |
| Science asteroid interiors | `science-asteroid-listening-array`, `science-asteroid-sealed-research` | Restricted facilities; civilian dock remains public when playable |
| Beira | `estella-xa-exobiology-research` | Frostglass Collegium's controlled biological research |
| Tinto | `estella-xb-luxury-retreat` | Velvet City is an invitation-only enclave, unlike ordinary resort ports |
| Calatrava | `estella-xd-redoubt-field` | Active military exercise range; distinguish from court/spectator receiving sites |
| Macao | `estella-xic-deep-ice-exobiology` | Garden of Rebirth appointment/commission-controlled access |
| Coimbra | `estella-xif-observatory`, `estella-xif-sealed-research-outpost` | Daedalus Server Farm and Icarus Lab; Campus commercial receiving remains public |
| Covenant interiors | `estella-xiia-deep-ice-mine`, `estella-xiia-isolated-settlement`, `estella-xiib-outpost` | Preceptory of Toil, Cathedral of Testimony and Vigil Keep require sanctioned work/visits |
| Ceuta | `estella-xiid-black-project-exile`, `estella-xiid-blackglass-observatory` | Castle Nunes and Blackglass Observatory controlled access |
| Reach | `estella-xiii-prison-exile-colony`, `estella-xiii-classified-research` | Prison custody and classified research |

## Clandestine — proposed exclusions

- `arkfall-apocrypha-cache-poi` — Apocrypha Cache.
- `casino-backstairs-bay` — Backstairs Bay.
- `estella-xid-specialty-cargo` — Ratline House.
- `estella-xi-smuggler-deaddrop-poi` — Thieves' Guild.
- `estella-xi-fence-poi` — Black Exchange.
- `estella-xii-smuggler-waypoint-poi` — Rookery of Knives.
- `estella-xiid-mirror-clinic` — Mirror Clinic.
- `estella-xiv-smuggler-haven` — Smuggler Haven.
- `reach-comet-fragment-3-poi` — Reach comet Dead-Drop.

Hide these from the public destination picker, including empty parent branches. Existing contracts/contact mechanics can still name and authorize them. Do not add public explanations that reveal hidden operations.

## Reserved / not ready

- Coronal Observation Post: retain endgame reserve and missing authored orbit; no new placement as part of empty runs.
- `estella-xiv-abandoned-active-site`: recommend excluding the Abandoned-but-Active Site until its mystery/entry conditions are authored. Treat as reserved access, not a claim of military ownership.

## Review points

These are recommendations, not settled new canon: unsponsored Kuznia/Kalyna surface restrictions; public receiving access at courts/academies, Covenant gates and Pandemonium; appointment-only Garden of Rebirth/Velvet City. Use this roster to implement only after review. No new general docking fees, debt rules, permits, faction reputation or exploration rewards in the initial version.
