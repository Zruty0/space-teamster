# Empty runs and contact-authorized travel

Updated: 2026-10-22
Status: implemented. Pete approved the access roster, made all eight abandoned/remote/lore sites unlisted, and clarified that public contracts include authorization. A known mission-giving contact permits empty travel to that contact's site.

## Requested mechanism

Station Terminal → Plan Empty Run → region/body/moon/station navigation → destination → route/cost confirmation → normal playable mission. Origin is the current career location. No cargo, pay or fuel reimbursement; normal fuel/time/wear and flight restrictions. Destination must be physically playable and either public or the location of a known mission contact. Departures from restricted delivery sites remain possible. Public postings may freely direct to non-public sites: the assignment supplies authorization. Existing contract generation is unaffected.

Bookkeeping: distinguish empty runs from commercial deliveries, no qualification/reputation rewards; settlement and wear commit only on successful arrival, normal deterministic retries. Public surface-to-surface personal relocation is allowed; this does not add routine local supply jobs to boards. Omit current-terminal destinations and prune empty folders.

Sort regions inner-to-outer; orbiting siblings by radius around their shared parent (semi-major axis for eccentric orbits). Surface sites separately/alphabetically; non-orbiting cluster members have no orbital radius and use a stable alphabetical fallback. Preserve back navigation and readable wrapping.

## Meaning of public

Public means an independent Teamster may arrive at the site's receiving pad/dock without a sponsoring assignment. It does not grant access to a factory floor, palace interior, data centre or every onboard department. Danger, remoteness, private ownership, expensive clientele and scientific work do not by themselves make a destination restricted.

Explicit per-POI empty-travel access: public / restricted / unlisted. Unlisted includes clandestine, abandoned and remote/lore destinations; it does NOT hide contracts or require discoveries before commercial postings. Classify existing inventory deliberately; require review for new POIs rather than automatically exposing them. Do not derive access from free-text tags or propagate a parent's restriction without public-entry exceptions. Access metadata for this feature is not a new universal law/customs simulation.

## Public receiving destinations

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
- Reach settlements and monasteries. The eight abandoned/remote/lore sites listed below are unlisted for empty travel.

Public classifications do not manufacture missing placements: casino Concourse and civilian Main Observatory Dock should be public when playable, but unfinished placement chains remain unavailable.

## Restricted empty-arrival sites

These are absent unless a known mission contact is physically based at the exact destination. Contact knowledge does not open every sibling berth, department or site on the same body.

| Area | POI IDs | Reason |
|---|---|---|
| Gaia | `estella-iii-military-spaceport` | Restricted military/government installation |
| Kuznia surface | `estella-vi-industrial-city`, `estella-vi-foundry-complex`, `estella-vi-spaceport`, `estella-vi-agricultural-lowlands`, `estella-vi-polar-weather-research`, `estella-vi-mountain-mining` | Contract or known-contact authorization; preserve Combine dispatch/clearance without a visitor-permit simulation |
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

## Unlisted clandestine sites

- `arkfall-apocrypha-cache-poi` — Apocrypha Cache.
- `casino-backstairs-bay` — Backstairs Bay.
- `estella-xid-specialty-cargo` — Ratline House.
- `estella-xi-smuggler-deaddrop-poi` — Thieves' Guild.
- `estella-xi-fence-poi` — Black Exchange.
- `estella-xii-smuggler-waypoint-poi` — Rookery of Knives.
- `estella-xiid-mirror-clinic` — Mirror Clinic.
- `estella-xiv-smuggler-haven` — Smuggler Haven.
- `reach-comet-fragment-3-poi` — Reach comet Dead-Drop.

Hide these from the empty-run picker, including empty parent branches, unless a mission contact there is known. Public postings may name and authorize them. Visiting on a contract does not automatically teach a contact or permanently unlock empty travel.

## Reserved / not ready

- Coronal Observation Post: retain endgame reserve and missing authored orbit; no new placement as part of empty runs.
- `estella-xiv-abandoned-active-site`: recommend excluding the Abandoned-but-Active Site until its mystery/entry conditions are authored. Treat as reserved access, not a claim of military ownership.

## Unlisted abandoned / remote / lore sites

All eight are now unlisted for empty travel, as requested:

| Site | ID | Existing description |
|---|---|---|
| First Landing | `estella-v-abandoned-colony` | Abandoned original Hartwell colony; historical/salvage site |
| Old Survey Camp | `estella-viii-abandoned-site` | Abandoned Weymark survey camp |
| Prospector Cache | `reach-comet-fragment-2-poi` | Reach comet fragment2 supply/salvage cache |
| Lonely Beacon / Lone-Operator Station | `reach-rogue-lonely-beacon` | Isolated, inhabited station on the rogue KBO fragment |
| The Deepest Dock | `deepest-dock-poi` | Writer-defined settled outer-limit dock; not explicitly abandoned |

Also unlisted: Estella IX Geological Feature (`estella-ix-geological-feature`), Isolated Science Cell (`reach-comet-fragment-4-poi`) and Outer Science Cell (`reach-comet-fragment-6-poi`). These are not described as abandoned. The XIV Abandoned-but-Active Site and Apocrypha Cache were already excluded/reserved.

**No public-advertisement removal.** Prospector Cache, Lonely Beacon and Deepest Dock retain their ordinary BFS/VHM work. Posting authorization and independent empty-travel access are separate.

## Contacts and implementation

- Contacts are mission-giving people/faction representatives. Only `gideon-gid-bell` currently qualifies; named shop staff and institutional offices do not.
- `CareerProfile.knownContactIds` persists introductions. Viewing a locally accessible office's introduction or an actual contact listing learns registered mission contacts, atomically clone→save→publish. Failures do not unlock travel. A new career knows nobody. Legacy saves without this field infer Gid only from completed basic/line practicals; explicit new-save empty knowledge is authoritative.
- Known contacts authorize their exact `locationIds`, not all physical-terminal siblings. Gid is at Guild HQ, not every office carrying his remote link.
- The destination tree shows a single known person's name, or `N contacts` for multiple known people; zero omitted. Parent folders aggregate distinct known contacts at eligible descendant destinations. Local Directory also summarizes known people physically present. Contact views show their location.
- `empty-travel-access.ts`:186 explicit POIs,134 public/33 restricted/19 unlisted. New IDs fail closed pending authoring. Missing physical placement still blocks travel even when a contact is known.
- `empty-runs.ts`: allowed destinations, filtered annotated tree, on-demand zero-mass/zero-pay `CareerContract` with category `empty`. Source always current location; no source privacy gate. Current physical terminal excluded. Public surface-to-surface relocation supported.
- 2026-10-22 simplification: station/small-body terminal rows (including comet fragments) lead directly to confirmation, without a final dock/department selection. Choose the first authored allowed public receiving POI, otherwise an allowed known-contact site. No broader access granted. Contact annotations aggregate authorized sites at that terminal. Every tree level shows its available-destination count (regions, bodies, moons, clusters and selectable sites): distinct allowed physical destinations, not internal dock aliases or immediate subfolders. Leaf sites report one; non-region rows retain placement/orbital details after the count. Empty contract names/paths/completion use the physical terminal, retaining actual POI IDs internally for flight/settlement. Surface landing sites remain separate choices.
- Empty-flight rendering omits container fill/outline/ribs in landing, approach, orbital, cluster and docking views. Cab/frame/engines/gear remain; physics, collision footprint, camera and mass tuning are unchanged. Default freight/passenger/training rendering remains loaded. The active contract drives presentation across phase transitions and retries; no new persistent visual state.
- `navigation.ts`: shared radius ordering and optional target filter; pruning applies only to the supplied target set. Commercial board generation and its full target inventory are untouched.
- Terminal uses ordinary readable/scrollable InteractiveScene menus. Confirmation displays estimated fuel cost, with no transfer-choice/lowest-delta-v/wait notice; existing computed departure-window waiting is advanced automatically on launch. Nav-computer-dependent waiting is deferred. Basic certification required, ordinary line/rig restrictions rechecked at launch. No freight/passenger handling credential or condition meter for an empty manifest.
- Empty runs use normal deterministic phase retries and maintenance telemetry with `manifestKind: empty`. Successful arrival saves fuel debit/time/location/rig before publishing; failed save retains the arrival screen for retry. Debug ledger/profile logs follow commit. No certification or inquiry rewards. History JSON/CSV includes `missionKind`; old entries remain untouched.
- Regression: `npm run test:empty-runs`, including full access coverage, filtered/radius-sorted physical-destination tree, authorized automatic dock choice, synthetic future two-contact cases, Gid-only production registry, migration/save failure, every eligible destination, real terminal launch/retry/arrival and automatic departure-window advance, and unchanged authorization for public postings into non-public sites. Includes `empty-rig-rendering.test.ts` paint-trace checks across all five views: container-only removal, unchanged chassis/cab, default loaded rendering, no state mutation. Desktop native-canvas preview/pixel checks: `/tests/empty-rig-preview.html`.

No new general docking fees, debt rules, permits, faction reputation or exploration rewards in the initial version.
