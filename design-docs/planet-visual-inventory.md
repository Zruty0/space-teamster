# Planet / moon visual inventory

Updated: 2026-10-23
Status: recommendations for discussion, not a rollout authorization. Pete explicitly wants reused worlds to vary, e.g. by crater-generation seed. Scope is globe artwork, not settlement scenery or physics.

## Current rendering

Verified against nodes.ts, physics.ts, orbital.ts and world-disc-appearance.ts:
-33 catalog bodies:7 planets,18 moons,5 dwarf planets,3 gas giants. Star/stations/asteroid clusters excluded. Two additional explicitly moon-tagged captured asteroids are noted below.
- Balor has its bespoke lava Eye; Gaia has continents/ocean/large ice caps; Celeste alone uses the new cratered renderer.
- Giants share nine straight bands and the same oval storm placement, with palette differences.
- Other listed globes are predominantly plain tinted discs/noisy outlines plus their existing atmosphere treatment.
- Celeste currently has58 craters from one fixed seed41873 and two fixed basin shapes. Tint is configurable; per-body geometry variation is not implemented yet.

## Reuse the rocky cratered family — 13

Palette descriptions follow current body colors. Crater density/basin adjustments below are art proposals, not new geological canon.

| ID | World | Suggested variation |
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

## Shared icy-surface variant — 8

Reuse the disc/clipping/seed/crater machinery, add configurable frost patches, fractured plates and fewer/different basins. Ice should read as a distinct material rather than a white lunar reskin. Not eight separate renderers.

| ID | World | Suggested treatment |
|---|---|---|
| estella-ix | Estella IX | Preserve lavender-grey identity in pale frosted terrain and dark ice exposures. |
| estella-xa | Beira | Pale blue-white; long fractures and relatively few impacts. Its ocean stays beneath the ice. |
| estella-xic | Macao | Blue-grey ice; darker fractured plates and moderate crater relief. |
| estella-xiia | Mercy | Broad pale icy plains; retain existing thin nitrogen atmosphere treatment. Not literally an airless body. |
| estella-xiic | Teide | Dirty comet/KBO ice; mottled dark material and heavier pitting. |
| estella-xiii | Estella XIII | Broad bright frost fields with darker old terrain. |
| estella-xiv | Estella XIV | Darker, rougher blue-grey ice with a different frost/crater distribution. |
| reach-rogue-kbo-fragment | Captured Rogue Planetoid / KBO Fragment | Very subdued dirty ice, strong mottling and impacts. |

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
- Small authored controls: crater density/size range, basin coverage, relief contrast, palette; icy family adds frost coverage/fracture density.
- Build/cache immutable normalized geometry once per body/profile. Close-up and system markers use the same underlying layout; small scales omit fine detail, not regenerate the world.
- Each world stays recognizable across visits, save reloads and renames. Seed changes never alter landing physics or orbit ephemerides.
- For custom land/ocean/ice/volcanic globes, review actual rim-site placement against the approved art as done for Gaia. Avoid cosmetic marker offsets that diverge from landing objectives; do not relocate sites without approval.

Suggested order: per-body seeded rocky family → shared ice family → distinct giant profiles → remaining custom atmospheric/volcanic globes one at a time. No runtime changes in this inventory pass.
