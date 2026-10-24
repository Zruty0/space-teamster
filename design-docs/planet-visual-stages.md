# Planet visual stages — operator approval gates

Updated: 2026-10-24

Pete requires this work in stages, with confirmation between stages. Scope/assignments: [visual inventory](planet-visual-inventory.md).

## Approval protocol

- Pete approved Stages1–7 and authorized Stage8 on2026-10-24. Stage8 Kuznia is implemented and awaiting review; STOP before Stage9 until he explicitly authorizes continuing. Stages9–11 have not started. Labels retain the approved contrasting style. IX's possible sand-world conversion remains a separate pending choice.
- Implement only the approved current stage. Show a desktop preview, summarize validation and make a scoped local commit; then STOP for explicit go-ahead before the next stage.
- Cloud review follow-up: Pete rejects Dahai's storm swirls and asks for no clouds for now. A separate future weather-art pass should cover ALL worlds with atmospheres using more realistic, animated cloud patterns. No animation or physics/weather tuning is authorized now; do not add new cloud layers during the remaining base-globe stages. Existing other-world artwork remains unchanged pending that pass.
- Requested revisions stay within the current stage. Approval of a preview does not authorize unrelated features or an automatic multi-stage rollout.
- No push/deployment, mobile testing, settlement scenery, new gameplay hazards or physics/weather tuning. Preserve other workers' changes, saves, accepted contracts and history.
- Shared artwork must remain deterministic across frames, visits, renames and map scales. Check actual rim-site alignment where geographic features matter; include any necessary proposed placement changes in that stage's review.
- Existing Gaia/Balor artwork remains unchanged. Captured moonlets/dock-only asteroid scenes and giant rings are outside this sequence unless separately authorized.

## Sequence

| Stage | Deliverable | Live-world scope | Status |
|---|---|---|---|
| 1 | Seeded rocky renderer foundation; vary craters AND basins, density/scale/contrast controls, cached normalized geometry. Desktop comparison sheet using representative palettes/seeds. Preserve current Celeste appearance exactly. | Infrastructure/preview only at this stage; Celeste preserved. | Approved |
| 2 | Roll out approved rocky family with individual persistent seeds/palettes and modest per-world settings. | Celeste baseline; Pike, Svarog, Kalyna, Tessera, Weymark, Tinto, Thronehold, Cadiz, Oathmark, Coimbra, Vigil, Ceuta. | Approved |
| 3 | Shared icy-world family: layered frost/material contrast, sparse impacts; review revision removes cracks and varies tints; review a full comparison sheet. Retain Mercy's existing thin atmosphere. | Estella IX, Beira, Macao, Mercy, Teide, Estella XIII, Estella XIV, captured rogue/KBO planetoid. | Approved after crack-free/tint revision |
| 4 | Richer shared giant renderer with individually authored band/storm profiles. No rings in this stage. | Gryphon, Hydra, Manticore. | Approved |
| 5 | Opaque ochre/cream cloud world, broad atmospheric swirls. | Acheron only. | Approved; requested label contrast correction implemented |
| 6 | Ocean and ice only; cloud/storm artwork removed for a later animated-weather pass. Zhulong on open water, Bingjie on ice; no invented continents. | Dahai only. | Approved after ocean/ice-only revision |
| 7 | Rusty dry plains, dark uplands/erosion features and dust; craters secondary. | Hartwell only. | Approved |
| 8 | Cold slate/blue-grey base globe, distinct from volcanic worlds; retain existing atmosphere, new clouds deferred. | Kuznia only. | Implemented; awaiting review / Stage9 go-ahead |
| 9 | Rocky-crater hybrid with localized tectonic/geothermal belts and resurfaced areas. | Calatrava only. | Not started |
| 10 | Sulfur-volcanic globe, dark calderas and contrasting resurfaced areas; existing thin atmosphere retained. | Almaden only. | Not started |
| 11 | Cool base globe and retained existing atmosphere; new haze/cloud artwork deferred to the separate weather pass. | Marisma only. | Not started |

## Per-stage review checklist

- Full disc and small-marker previews; production orbital rendering for affected families. Check body/site label contrast over bright artwork; Acheron and Dahai now use dark glyph outlines, retaining colours and anchors.
- Stable seed/geometry across repeated renders and visits; no per-frame generation.
- Celeste baseline preserved in stage1; unaffected body artwork preserved in every stage.
- Surface positions/landing objectives agree with approved geography; no cosmetic-only target offsets.
- Scoped regressions and production build, with unrelated concurrent failures identified separately.
- Update this stage's status and handoff; wait for confirmation before continuing.

## Stage1 result — 2026-10-23

- `src/cratered-world-geometry.ts`: stable ID-derived seeds, independent crater/basin random streams, immutable normalized geometry, bounded64-entry LRU. Controls: crater count0–160, scale0.35–1.8, basin coverage0–1.75, relief contrast0–2. Defaults preserve original58-crater density/scale/contrast. Palette/contrast/zoom do not regenerate geometry.
- `crateredWorldProfile(bodyId, overrides?)` creates a frozen profile; Celeste explicitly retains seed41873 and its original two basin shapes. Non-Celeste profiles seed basin positions, shapes and rotations as well as craters. Changing crater count preserves existing crater positions and does not move basins.
- `drawCrateredDisc` accepts an optional profile; the existing call/default retains Celeste pixel-for-pixel. Stage1 did not add bodies to the production dispatch; Gaia/Balor/site positions/physics were untouched.
- Original review `/tests/cratered-world-preview.html`: Celeste baseline plus Pike/Kalyna/Weymark examples, preview-only at Stage1. Upper row shows tint/detail settings; lower row uses identical grey/default settings to isolate seed/layout variation. Stage2 subsequently adopted these examples unchanged; the page now identifies them as live.
-5069 seeded-foundation assertions plus294 existing world-disc checks; native58 pixel/state checks pass on initial load and reload. Independent frozen pre-Stage1 source in `tests/fixtures/world-disc-v1.ts` verifies exact Celeste/Gaia paint at multiple sizes/tints; native pixels verify Celeste at6 sizes. Cache eviction/rebuild is deterministic. Existing Gaia/Celeste native45 checks, Balor/Eye, markers, empty/rendering and production build pass.
- No live saves, mobile testing, push/deployment, settlement scenery or extra atmosphere. Pete subsequently approved this stage and authorized Stage2.

## Stage2 result — 2026-10-23

- `src/content/estella/rocky-world-appearance.ts` explicitly opts in the13 approved rocky worlds. Frozen per-body profiles use stable ID seeds, existing `BodyDef.color` palettes and modest crater-density/scale/basin/contrast settings. Pike/Kalyna/Weymark match their approved Stage1 examples; Celeste retains exact original geometry/paint.
- `drawAuthoredWorldDisc` now dispatches all13 through those profiles in both central orbital discs and moving parent/system markers. No atmosphere-based auto-selection: icy worlds, Calatrava, other custom worlds, giants and dock-only captured bodies remain excluded. Gaia/Balor retain their existing painters.
- No body/terrain/atmosphere/orbit tuning, site moves, station art, landing scenes, contracts or save changes. Rocky rim positions remain valid ground; markers/landing objectives stay at their authored angles.
- Review `/tests/rocky-world-preview.html`: all13 live worlds, small-marker samples and same-grey comparison toggle. `?view=flight&body=estella-vib` (or choose a body) shows actual production orbital rendering. Stage1 comparison remains usable and now verifies its example pixels against live dispatch.
- Validation:5069 foundation +610 rollout +294 world-disc assertions. Rollout checks all13 central/parent-frame painters at two epochs, exact approved IDs/prototype rejection, distinct seeds/layouts, frozen profiles, exact Celeste baseline and unchanged world/flight state.240 native checks pass plus production orbital rendering for every one of the13 worlds. Stage1 native58, Balor/Eye, markers, empty/rendering and production build pass. No mobile/live-save work or push.
- Pete subsequently approved Stage2 and authorized Stage3.

## Initial Stage3 result — 2026-10-23 (revision below)

- Explicit eight-body registry `src/content/estella/icy-world-appearance.ts`, one shared `drawIcyDisc` painter. Existing body tints mixed with frost/old-ice/dirty material, independently seeded frost fields and long branched fractures, configurable softened crater relief. No ice or atmosphere inference for unlisted bodies.
- `icy-world-geometry.ts` reuses the rocky crater/basin model and stable ID seeds; independent versioned frost/fracture streams, deeply frozen normalized coordinates and32-entry LRU. Controls: frost footprint0–1, fractures0–16, dirt0–1, inherited crater/basin/relief controls. These are art parameters, not measured coverage/climate. Count changes preserve prefixes and unrelated layers; tint/dirt/contrast/LOD do not move geography. Small markers omit fine fractures/impacts, retaining the same frost fields.
- Beira stays completely solid at the surface; dark areas are older exposed ice, not water. Mercy retains its original34km/.12kg m^-3/9km atmosphere profile and existing orbital atmospheric ring. No weather/physics/orbits/sites/hazards/scenery changes; all existing rim objectives remain on solid ice, with no placement offsets or relocations.
- Shared clipping/shading helpers extracted unchanged to `world-disc-primitives.ts`; original Celeste/Gaia paint/pixels and all13 rocky profiles preserved. Balor and deferred giant/custom/dock-only bodies unchanged.
- Review `/tests/icy-world-preview.html`: eight full discs/small markers, same-tint toggle, full wrapped names, production orbital selector (`?view=flight&body=estella-xiia` for Mercy).146 native checks, all eight production orbital views, cache-eviction pixels and exact reload hashes pass. Identical tint AND identical controls yield eight distinct seeded images; original Celeste/Gaia pixels match at six sizes.
- Tests: icy7786 + foundation5069 + rocky610 + world-disc294 assertions, including actual central/parent render paths at two epochs and preserved atmosphere/physical state. Prior native previews pass (rocky232 after excluding the eight newly authorized icy bodies from fallback checks; foundation58; Gaia/Celeste45). Balor8393+Eye2204, markers41, empty2872+render35 and production build pass on the shared tree including concurrent Dahai work. Existing Vite warnings only; other worker files untouched. No live saves/mobile/push.
- STOP here. Stage4 (Gryphon/Hydra/Manticore, no rings) requires explicit go-ahead.

### Stage3 review revision — 2026-10-23

- Pete likes the restrained crater coverage/multiple shades, rejects cracks and requests more varied tints. Removed fracture generator/profile control/painter, plus thin frost-field outlines. Existing frost fields, dark basins, crater positions/sizes/counts are unchanged; pre-edit geometry hashes from8fb004b now pin all eight retained models.
- Added eight frozen art-only palettes: muted lavender IX, glacial cyan Beira, jade Macao, ivory Mercy, dusty taupe Teide, pearl-blue XIII, dusky violet-grey XIV, ash/sage rogue. Common production dispatcher uses these in both local and parent-frame views; core body/terrain/atmosphere colors remain unchanged. Preview same-tint mode remains a genuine override.
- Revised preview stays `/tests/icy-world-preview.html`;146 native checks, identical reload/rebuild pixels and all eight actual orbital renders pass. Icy5664 + foundation5069 + rocky610 + world294 assertions; Balor8393/Eye2204, markers41, build/diff pass. Tests explicitly reject crack paths and non-crater strokes. No physics/sites/saves/mobile/push changes.
- IX sand-world question remains a proposal: cold airless regolith over buried ice fits its present Belt/dwarf role and ice mine; ordinary wind-carved dunes require an atmosphere and revisiting retention/lore. Do not derive a real equilibrium temperature from gameplay-scaled orbital distances. No IX terrain-type/atmosphere/role conversion authorized or implemented.
- Pete subsequently approved this revision and authorized Stage4. IX conversion was not included.

## Stage4 result — 2026-10-23

- Shared `drawGasGiantDisc` plus three explicit frozen profiles in `content/estella/gas-giant-appearance.ts`. Gryphon:22 fine gold/cream bands,2 subdued storms; Hydra:15 stronger rust/cream bands,4 vortices including a dominant storm; Manticore:7 broad subtle blue/cyan bands,2 dark storms. Different widths, turbulence, detail density, storm positions/scales and palettes, not merely recolors.
- `gas-giant-geometry.ts`: stable ID-derived v1 seeds (1305871086/166064809/1677540320), independent band/filament/storm streams, deeply immutable normalized models and16-entry LRU. Author profiles validated/bounded. Colors/opacity do not move features; changing fine-detail count preserves bands/storms. Small markers use an exact subset of band-edge points and the same main storm outline; fine filaments/swirl ribbons and secondary storms appear at larger scales. No frame/visit randomness or weather simulation.
- `drawAuthoredWorldDisc` serves both local and stellar markers. Removed old nine-straight-band/single-oval painter. Existing atmosphere layers, skim/observatory targets, marker sizing, moon orbits, gravity and hazards unchanged. No planetary rings or landing sites added/moved. All previous approved world artwork remains intact; IX still icy pending its separate decision.
- Review `/tests/gas-giant-preview.html`: three full globes, small markers, shared-grey comparison, actual orbital selector (`?view=flight&body=estella-xi` for Hydra).63 native checks pass, identical reload/cache-rebuild pixels, distinct same-palette images, original Celeste/Gaia pixels at six sizes, all three actual orbital views. Gallery and Hydra flight screenshot inspected.
- Validation: giants12058 + foundation5069 + rocky610 + ice5664 + world294 assertions. Covers exact IDs/seeds, frozen profiles/data, stable LOD, non-crossing bands, cache eviction, author input guards, actual central/stellar paint at two epochs and retained atmospheric rendering/physical state. Prior native ice143 and rocky229 pass including all their actual orbital views (three newly authorized giants removed from former fallback checks); ice pixel hashes match the accepted revision. Balor8721+Eye2204, markers41, empty2872+render35 and production build pass; existing Vite warnings only. No saves/mobile/push.
- Pete subsequently approved Stage4 and authorized Stage5.

## Stage5 result — 2026-10-23

- `src/acheron-appearance.ts`: opaque ochre/cream cloud globe with seven broad cloud systems, filled feather layers and six fine wisps. Two large sheared circulations distinguish it from the giants' latitude belts. No crater/terrain/city drawings or crack-like contour strokes; opaque cloud base remains beneath all shading.
- One lazily cached, deeply immutable normalized map; seed869881717 derives from `cloud-world-v1:estella-ii`, not name/time/visit. Independent broad/wisp streams. Small markers subset the same cloud-edge points and omit fine wisps; full paths use129 samples per edge. Shared clipping/shading and common local/stellar dispatcher; only Acheron newly opted in.
- Illustration stays within the existing disc radius, not a new physical cloud-top altitude. Existing120km atmospheric envelope/density/scale height, Olympos/Nimbus altitudes, Pandemonium surface angle, hub/orbits and objectives unchanged. No chemistry decision, weather/hazard tuning, scenery, dialogue or economy/save changes. Earlier approved worlds intact; IX sand conversion still pending.
- Review `/tests/acheron-world-preview.html`: full globe and markers, unchanged Gryphon/Hydra comparison, real orbital selector for Commercial Hub/Olympos/Nimbus/Pandemonium.162 native checks, opaque interior samples, exact repeat/reload hashes and all four orbital views pass. Final gallery and Pandemonium flight screenshot inspected; Olympos view also checked during work.
- Tests: cloud9020 + foundation5069 + rocky610 + ice5664 + giants12058 + world294 assertions. Real local/stellar paths at two epochs for all four targets preserve atmosphere/flight state. Acheron gameplay10388, Balor8721+Eye2204, markers41, empty2872+render35 and build pass. Giant native62/all three orbital views pass with unchanged hashes (Acheron removed from former fallback checks); prior ice142/rocky228 native previews and all their orbital views also pass with that single fallback exclusion updated. Existing Vite warnings only; concurrent Camps review changes untouched. No live saves/mobile/push.
- Pete subsequently approved Stage5, requested contrasting Acheron labels and authorized Stage6.

## Stage6 initial result / Acheron label follow-up — 2026-10-23

Cloud/storm portion superseded by the revision below; retained here as the initial review record.

- `src/dahai-appearance.ts`: continuous blue ocean, tonal water layers, three broken silver cloud decks with clear-water belts, two storm spirals and a small floating sea-ice margin. No continents/islands, city scenery, ice cracks or new weather mechanics. Permanent ID seed1709551853; independent water/cloud/storm/wisp streams, one lazy deep-frozen normalized map. Small markers subset the same points and omit fine wisps; shared central/stellar dispatcher adds only Dahai.
- Art composition matches existing rim positions: Fuyuan−0.1/Jiuyuan2.45 in clear water, Zhulong1.15 at the cloudy work belt, Bingjie−2.0 on sea ice. No site relocation or cosmetic marker offsets. This chart orientation is not physical axial tilt/3D latitude or a global climate claim; the current2D equatorial placement metadata is unchanged. Atmosphere75km/density1/scale height8500, targets, orbits, flight profiles and established floating-settlement history retained. No hydrogen-canopy chemistry, moving cities/decks, underwater flight, hazards, economy or save edits.
- `orbital-world-label.ts`:3px dark rounded glyph halo for Acheron and Dahai central names, visible system labels, POIs and legacy LZ. Original text, colours, fonts, anchors and visibility rules preserved; canvas state restored. Other worlds remain unchanged pending readability review. Acheron globe pixels unchanged.
- `/tests/dahai-world-preview.html`: full/small globe, actual rim guides, Acheron before/after label comparison, five real orbital destinations.56 native checks, identical reload pixels, all five orbital views pass; gallery and Bingjie flight inspected. Acheron161 native/all four orbital views pass; Pandemonium label correction inspected.
- Tests: Dahai8285 + labels28 + Acheron9036 + foundation5069 + rocky610 + ice5664 + giants12058 + general294; actual local/stellar render, marker anchors, rim alignment at both LODs and unchanged flight state/atmosphere. Dahai shipping82652/240 playable pairs, Acheron10388, Balor8721+Eye2204, markers41, empty2872+render35 and build pass. Prior native giant61/ice141/rocky227 and all their orbital views pass (Dahai newly excluded from fallback checks); previous image hashes unchanged. No saves/mobile/push; Vite available.
- STOP here. Stage7 (Hartwell only) requires explicit confirmation.

### Stage6 revision — ocean/ice only, 2026-10-23

- Pete rejects storm swirls and requests ocean/ice only, deferring more realistic animated clouds to a later all-atmospheric-world weather pass. Labels approved. Follow-up explicitly requires Zhulong on water, not ice.
- Removed cloud/storm/wisp geometry, generation and painting entirely from Dahai. Exact original water and sea-ice shapes/palettes retained; pre-edit hashes95071542/855573291 captured from6515c25/88ae24d and pinned in tests. Existing seed1709551853, immutable cache, point-subset LOD and label halos unchanged. No site movement, atmosphere/physics/lore changes or changes to other worlds.
- Zhulong's former white patch was cloud, not ice; removal reveals blue water at its unchanged1.15 angle. Tests cover its marker/inward-label region at both LODs; Bingjie−2 stays on the retained sea-ice margin. No new opposite ice cap added under Zhulong.
- Revised preview65 native checks, identical reload pixels and all five actual orbital destinations pass. Gallery/Zhulong flight inspected. Dahai929 + all existing world/label suites, markers41 and build/diff pass. Assertion count drops because removed cloud geometry is no longer traversed; retained geometry and no-cloud scope are now explicitly pinned.
- Pete subsequently approved this revision and authorized Stage7; the future animated-weather pass remains unstarted.

## Stage7 result — Hartwell, 2026-10-23

- `src/hartwell-appearance.ts`: rusty plains, four dark upland layers, three ochre sediment/dust deposits, two broad dry erosion paths with three filled terraces each,14 subdued impacts. Surface dust only, no airborne haze/clouds, animated storms, ice cracks or settlement scenery. This is illustrative geology, not new flight terrain or named lore features.
- Permanent body-ID seed2051664115; independent upland/deposit streams and impact profile reuse the stable crater geometry machinery without opting Hartwell into the rocky-world registry. One lazy deeply frozen normalized model; full/coarse paths share exact points. Craters occupy less than3% of projected disc area before overlap/clipping; omit them below14px, show first3 below60px, all14 above. No crater-cache eviction can change retained geography.
- Shared central/stellar dispatcher adds only Hartwell. Existing55km thin CO2 atmosphere/density.18/scale height11km, all five ground angles, Roadstead/Ascension targets, Pike/orbits, weather, physics, access and saves unchanged. First Landing remains reserved in actual gameplay; preview uses synthetic missions, not new public travel authorization.
- Reused approved dark3px label halo for Hartwell only; existing Acheron/Dahai labels and other-world pixels unchanged. `/tests/hartwell-world-preview.html`: full/small globe, true rim guides, unchanged Pike and approved ocean-only Dahai comparisons, seven actual orbital destinations.64 native checks/reload/all7 views pass; final gallery and Dawes Cut flight inspected. Warm opaque ground at all actual rim sites checked at two LODs.
- Tests: Hartwell2056, labels34, all prior world suites (foundation5069/rocky610/ice5664/giants12058/Acheron9036/Dahai929/general294), markers41, Camps43488+review17055, Balor8721+Eye2204, empty2872+render35 and build/diff pass. Prior native Dahai64/Acheron160/giants60/ice140/rocky226 and all orbital views pass; prior image hashes unchanged. Each former fallback count drops by one for Hartwell's new opt-in.
- Vite initially served a stale label helper after a missed file event; touching that source invalidated the cache without restarting the service. All final native checks use current code. No mobile/live saves/push.
- Pete subsequently approved Stage7 and authorized Stage8.

## Stage8 result — Kuznia, 2026-10-24

- `src/kuznia-appearance.ts`: cold slate/blue-grey solid terrain, three lowland layers, three highland masses, five relief/slopes and two lighter polar-ground layers. No clouds, storm symbols, airborne haze, lava, industrial glow, cities, ice cracks or new resource claims. Pale polar colouring is not an authored water/ice reserve.
- Permanent body-ID seed248294852; independent lowland/highland/slope/polar streams; one lazy deeply frozen normalized model with exact full/coarse point subsets. Both marker and central views share the same map; no generic lunar craters or reused Hartwell valleys.
- Actual geography/objectives retained: Mokosh2.7 in lowlands, Kopanka−1.25 on the main massif with existing4000m marker altitude, Morana−2.55 in lighter polar ground. Perun−.15/Gornilo.95/Stribog1.85 unchanged. Existing95km N2/CO2 atmosphere/density2.2/scale11.5km, weather/physics, Anvil/Hammer trade membrane, moons/access/economy/saves intact. No site relocation or cosmetic marker offsets.
- Approved dark label halo extended to Kuznia. `/tests/kuznia-world-preview.html`: full/small globe, actual rim/altitude guides, Hartwell/Dahai comparisons and all eight synthetic production orbital destinations.67 native checks, identical reload pixels and all8 views pass; gallery/Kopanka flight inspected. Cool opaque ground and lowland/massif contrast checked at two LODs.
- Kuznia1660 + labels40 + all prior world suites pass. Markers41 required adding the standard radial-gradient API to its recording canvas now that its Kuznia fixture uses shared disc shading; no production workaround/assertion removal. Camps43488+review17055, Balor8721+Eye2204, empty2872+render35 and build/diff pass. Prior native Hartwell63/Dahai63/Acheron159/giants59/ice139/rocky225 and all their views pass with old image hashes unchanged (one fallback exclusion per newly opted-in Kuznia).
- No mobile/live-save/push work. Vite remains available. STOP for explicit Stage9 Calatrava approval; realistic animated clouds across atmospheric worlds remain a separate future pass.
