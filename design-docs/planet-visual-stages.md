# Planet visual stages — operator approval gates

Updated: 2026-10-23

Pete requires this work in stages, with confirmation between stages. Scope/assignments: [visual inventory](planet-visual-inventory.md).

## Approval protocol

- Pete confirmed Stage1 on2026-10-23. Stage1 is implemented and awaiting review; STOP before Stage2 until he explicitly authorizes continuing. Stages2–11 have not started.
- Implement only the approved current stage. Show a desktop preview, summarize validation and make a scoped local commit; then STOP for explicit go-ahead before the next stage.
- Requested revisions stay within the current stage. Approval of a preview does not authorize unrelated features or an automatic multi-stage rollout.
- No push/deployment, mobile testing, settlement scenery, new gameplay hazards or physics/weather tuning. Preserve other workers' changes, saves, accepted contracts and history.
- Shared artwork must remain deterministic across frames, visits, renames and map scales. Check actual rim-site alignment where geographic features matter; include any necessary proposed placement changes in that stage's review.
- Existing Gaia/Balor artwork remains unchanged. Captured moonlets/dock-only asteroid scenes and giant rings are outside this sequence unless separately authorized.

## Sequence

| Stage | Deliverable | Live-world scope | Status |
|---|---|---|---|
| 1 | Seeded rocky renderer foundation; vary craters AND basins, density/scale/contrast controls, cached normalized geometry. Desktop comparison sheet using representative palettes/seeds. Preserve current Celeste appearance exactly. | Infrastructure/preview only; no additional bodies opted in. | Implemented; awaiting review / Stage2 go-ahead |
| 2 | Roll out approved rocky family with individual persistent seeds/palettes and modest per-world settings. | Celeste baseline; Pike, Svarog, Kalyna, Tessera, Weymark, Tinto, Thronehold, Cadiz, Oathmark, Coimbra, Vigil, Ceuta. | Not started |
| 3 | Shared icy-world family: frost, fractures, material contrast, configurable crater coverage; review a full comparison sheet. Retain Mercy's existing thin atmosphere. | Estella IX, Beira, Macao, Mercy, Teide, Estella XIII, Estella XIV, captured rogue/KBO planetoid. | Not started |
| 4 | Richer shared giant renderer with individually authored band/storm profiles. No rings in this stage. | Gryphon, Hydra, Manticore. | Not started |
| 5 | Opaque ochre/cream cloud world, broad atmospheric swirls. | Acheron only. | Not started |
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
- `drawCrateredDisc` accepts an optional profile; the existing call/default retains Celeste pixel-for-pixel. No new body has been added to the production dispatch, and Gaia/Balor/site positions/physics are untouched.
- Review `/tests/cratered-world-preview.html`: Celeste baseline plus Pike/Kalyna/Weymark preview-only examples. Upper row shows proposed tint/detail settings; lower row uses identical grey/default settings to isolate seed/layout variation. These demonstration settings do not authorize or configure the Stage2 rollout.
-5069 seeded-foundation assertions plus294 existing world-disc checks; native58 pixel/state checks pass on initial load and reload. Independent frozen pre-Stage1 source in `tests/fixtures/world-disc-v1.ts` verifies exact Celeste/Gaia paint at multiple sizes/tints; native pixels verify Celeste at6 sizes. Cache eviction/rebuild is deterministic. Existing Gaia/Celeste native45 checks, Balor/Eye, markers, empty/rendering and production build pass.
- No live saves, mobile testing, push/deployment, settlement scenery or extra atmosphere. Stage2 remains blocked on operator confirmation.
