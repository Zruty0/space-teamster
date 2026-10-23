# Planet / moon visual inventory

Updated: 2026-10-23
Status: Stages1–2 approved; Pete authorized Stage3 icy rollout, now implemented and awaiting review. Later families remain staged proposals; await go-ahead before Stage4. See [approval gates](planet-visual-stages.md). Scope is globe artwork, not settlement scenery or physics.

## Current rendering

Verified against nodes.ts, physics.ts, orbital.ts and world-disc-appearance.ts:
-33 catalog bodies:7 planets,18 moons,5 dwarf planets,3 gas giants. Star/stations/asteroid clusters excluded. Two additional explicitly moon-tagged captured asteroids are noted below.
- Balor has its bespoke lava Eye; Gaia has continents/ocean/large ice caps; the13 rocky worlds listed below now use individually seeded crater profiles.
- Giants share nine straight bands and the same oval storm placement, with palette differences.
- Other listed globes are predominantly plain tinted discs/noisy outlines plus their existing atmosphere treatment.
- Celeste retains58 craters from seed41873 and its original two basins, unchanged. Stage1 added optional per-body profiles with seeded craters AND basins, bounded immutable caching and density/scale/coverage/contrast controls. Stage2 applies explicit profiles to all13 rocky worlds, retaining the existing palettes. Stage3 adds the eight icy variants below, preserving existing hue families and Mercy's atmosphere. Other families remain deferred.

## Rocky cratered family — 13, implemented in Stage2

Palette descriptions follow current body colors. Density/basin differences are visual treatments, not new geological canon. Authored parameters live in `src/content/estella/rocky-world-appearance.ts`; review `/tests/rocky-world-preview.html`.

| ID | World | Visual character |
|---|---|---|
| estella-iiia | Celeste | Preserve current warm grey/tan appearance and seed as baseline. |
| estella-va | Pike | Dusty brown; denser small impacts, fewer broad smooth basins. |
| estella-via | Svarog | Steel grey; stronger basin contrast. Orbital shipyard remains separate. |
| estella-vib | Kalyna | Saturated hematite red; same geology family, distinct palette. |
| estella-vii | Tessera | Dark neutral/violet-grey; restrained, fine crater relief. |
| estella-viii | Weymark | Blue-grey; several broad recognizable basins. |
| estella-xb | Tinto | Warm brown/copper; mixed crater sizes. |
| estella-xc | Thronehold | Muted grey/olive; one or two prominent old-looking impact basins. |
| estella-xid | Cadiz | Warm stone-grey; varied medium impacts and plains. |
| estella-xie | Oathmark | Subtle violet-grey; sharper small-crater relief. |
| estella-xif | Coimbra | Cool steel-blue grey; subdued smooth areas and scattered impacts. |
| estella-xiib | Vigil | Dark brown-grey; denser pitting. |
| estella-xiid | Ceuta | Dark violet-grey; sparse large basins and smaller impacts. |

Their settlements/political importance alone do not require custom planetary geology. No artificial circuit-board continents, giant castles or secret installations visible from orbit.

## Shared icy-surface variant — 8, implemented in Stage3

Shared disc/clipping/seed/crater machinery with configurable seeded frost patches, layered old ice exposures and softened impacts. Pete rejected cracks during review: fracture geometry/painter and thin frost outlines removed; original field/impact layouts/counts retained. Art-only palettes now vary more clearly. Eight explicit profiles in `src/content/estella/icy-world-appearance.ts`, not eight renderers. Review `/tests/icy-world-preview.html`. Dark areas are solid old/dirty ice, not open water; no sites moved.

| ID | World | Visual treatment |
|---|---|---|
| estella-ix | Estella IX | Muted lavender-grey frosted terrain/dark ice exposures; possible sand-world reinterpretation remains a proposal below. |
| estella-xa | Beira | Glacial cyan-white; broad frost fields and relatively few impacts. Its ocean stays beneath the ice. |
| estella-xic | Macao | Pale jade ice; darker exposures and moderate crater relief. |
| estella-xiia | Mercy | Broad ivory icy plains; retain existing thin nitrogen atmosphere treatment. Not literally an airless body. |
| estella-xiic | Teide | Dusty taupe comet/KBO ice; mottled dark material and heavier pitting. |
| estella-xiii | Estella XIII | Pearl-blue bright frost fields with darker old terrain. |
| estella-xiv | Estella XIV | Dusky violet-grey ice with a different frost/crater distribution. |
| reach-rogue-kbo-fragment | Captured Rogue Planetoid / KBO Fragment | Subdued ash/sage dirty ice, strong mottling and impacts. |

### IX sand-world discussion — not implemented

Pete asks whether IX could be a sand world. Current canon/runtime: small airless Belt dwarf, scientific role, ice mine. A cold dusty/regolith-covered dwarf with buried ice is physically plausible and preserves that infrastructure. Ordinary wind-blown dunes require an atmosphere, with retention/size/temperature reconsidered; cold dunes are possible, sand does not imply a hot world. Gameplay-scaled star/orbit values are not a literal climate model. Recommended direction is an airless regolith desert over buried ice; no conversion, atmospheric change or new terrain approved yet.

## Individually authored globe identities — 9

Custom composition can still reuse common rendering helpers; it does not imply nine independent engines.

| ID | World | Recommendation |
|---|---|---|
| estella-i | Balor | Keep existing narrow lava Eye and local/system-facing rules. |
| estella-ii | Acheron | Opaque ochre/cream cloud deck, large atmospheric swirls; surface largely hidden. Do not settle the unresolved chemistry through artwork. |
| estella-iii | Gaia | Keep approved green continents, smaller oceans and oversized caps; current site/rim alignment preserved. |
| estella-iv | Dahai | Ocean-dominated blue globe, cloud patterns with readable calm latitude belts. Floating settlements do not imply large continents/islands. |
| estella-v | Hartwell | Rusty dry plains, dark uplands/large erosion features and dust; impact craters secondary. |
| estella-vi | Kuznia | Cold slate/blue-grey world under heavy weather. Industry alone is not a reason for global lava or orange pollution. |
| estella-xd | Calatrava | Hybrid: rocky crater base with distinctive tectonic/geothermal belts and smoother resurfaced patches. Local heat, not a second Balor. |
| estella-xia | Almaden | Sulfur-yellow/ochre volcanic terrain, dark calderas and resurfaced areas. Thin SO2 atmosphere retained. |
| estella-xib | Marisma | Thick cold haze and broad cloud layers, keeping current cool blue-grey family; terrain mostly obscured. No automatic Titan-orange palette change. |

## Giants: one richer cloud-band family, three authored profiles

| ID | World | Recommendation |
|---|---|---|
| estella-x | Gryphon | Cream/gold, softer finer bands and restrained storms. Rings are an optional future proposal, not implied/approved by Saturn-flavored lore. |
| estella-xi | Hydra | High-contrast cream/rust belts, turbulent edges, multiple vortices and a dominant storm. |
| estella-xii | Manticore | Deep blue/cyan, broad subtler bands and a few dark storm features. |

Existing shared straight bands/same storm are too uniform. Use separate stable seeds and authored band widths/contrast/storm distributions, not cratered terrain.

## Captured moonlets / small-body boundary

Nell's Lantern (`estella-viii-captured-moonlet`) and Estella IX Captured Moonlet (`estella-ix-captured-moonlet`) are dock-only asteroid-kind satellites, not ordinary landable globe scenes. Crater texture is reusable, but a later small-body art pass should respect their existing docking/collision geometry. Other captured asteroids/comets and trojans likewise belong to that separate pipeline, not an automatic spherical-planet conversion.

## Stable variation requirement / proposed implementation

- Seed from stable body ID, not display name, time, visit, current mission or frame RNG. Preserve Celeste's existing seed41873/art via an explicit baseline override.
- Seed BOTH crater placement/size and basin outlines/positions, so recolored worlds do not retain the same two giant splotches.
- Small authored controls: crater density/size range, basin coverage, relief contrast, palette; icy family adds frost coverage/dirty-material contrast and art-only palettes (fractures rejected during review).
- Build/cache immutable normalized geometry once per body/profile. Close-up and system markers use the same underlying layout; small scales omit fine detail, not regenerate the world.
- Each world stays recognizable across visits, save reloads and renames. Seed changes never alter landing physics or orbit ephemerides.
- For custom land/ocean/ice/volcanic globes, review actual rim-site placement against the approved art as done for Gaia. Avoid cosmetic marker offsets that diverge from landing objectives; do not relocate sites without approval.

Sequence and current approval status are tracked in [planet visual stages](planet-visual-stages.md). Seeded foundation, rocky rollout and icy family implemented. Stage4 and later work require separate confirmations.
