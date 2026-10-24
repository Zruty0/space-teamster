# Planet visual stages — operator approval gates

Updated: 2026-10-23

Pete requires this work in stages, with confirmation between stages. Scope/assignments: [visual inventory](planet-visual-inventory.md).

## Approval protocol

- Pete approved Stages1–4 and authorized Stage5 on2026-10-23. Stage5 is implemented and awaiting review; STOP before Stage6 until he explicitly authorizes continuing. Stages6–11 have not started. IX's possible sand-world conversion remains a separate pending choice.
- Implement only the approved current stage. Show a desktop preview, summarize validation and make a scoped local commit; then STOP for explicit go-ahead before the next stage.
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
| 5 | Opaque ochre/cream cloud world, broad atmospheric swirls. | Acheron only. | Implemented; awaiting review / Stage6 go-ahead |
| 6 | Ocean world with cloud patterns distinguishing calm latitude belts; no invented continental settlement foundation. | Dahai only. | Not started |
| 7 | Rusty dry plains, dark uplands/erosion features and dust; craters secondary. | Hartwell only. | Not started |
| 8 | Cold slate/blue-grey world under heavy weather, distinct from volcanic worlds. | Kuznia only. | Not started |
| 9 | Rocky-crater hybrid with localized tectonic/geothermal belts and resurfaced areas. | Calatrava only. | Not started |
| 10 | Sulfur-volcanic globe, dark calderas and contrasting resurfaced areas; existing thin atmosphere retained. | Almaden only. | Not started |
| 11 | Thick cold haze and cloud layers, preserving the current cool palette family. | Marisma only. | Not started |

## Per-stage review checklist

- Full disc and small-marker previews; production orbital rendering for affected families.
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
- STOP here. Stage6 (Dahai ocean/cloud globe only) requires explicit confirmation.
