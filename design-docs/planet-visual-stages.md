# Planet visual stages — operator approval gates

Updated: 2026-10-23

Pete requires this work in stages, with confirmation between stages. Scope/assignments: [visual inventory](planet-visual-inventory.md).

## Approval protocol

- This file is the proposed sequence. Stage1 has NOT started; await Pete's confirmation to begin.
- Implement only the approved current stage. Show a desktop preview, summarize validation and make a scoped local commit; then STOP for explicit go-ahead before the next stage.
- Requested revisions stay within the current stage. Approval of a preview does not authorize unrelated features or an automatic multi-stage rollout.
- No push/deployment, mobile testing, settlement scenery, new gameplay hazards or physics/weather tuning. Preserve other workers' changes, saves, accepted contracts and history.
- Shared artwork must remain deterministic across frames, visits, renames and map scales. Check actual rim-site alignment where geographic features matter; include any necessary proposed placement changes in that stage's review.
- Existing Gaia/Balor artwork remains unchanged. Captured moonlets/dock-only asteroid scenes and giant rings are outside this sequence unless separately authorized.

## Sequence

| Stage | Deliverable | Live-world scope | Status |
|---|---|---|---|
| 1 | Seeded rocky renderer foundation; vary craters AND basins, density/scale/contrast controls, cached normalized geometry. Desktop comparison sheet using representative palettes/seeds. Preserve current Celeste appearance exactly. | Infrastructure/preview only; no additional bodies opted in. | Awaiting permission to start |
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

This staged plan adds no runtime behavior by itself.
