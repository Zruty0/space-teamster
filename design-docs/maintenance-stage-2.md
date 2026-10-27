# Maintenance Stage 2 — Weymark pilot and shared services

Updated: 2026-10-27 (Pacific)
Status: reviewed, including the grounded-only restart correction. This document records the Stage 2 snapshot; [Stage 5](maintenance-stage-5.md) is implemented and awaits final network review.

## Review

Open [the synthetic desktop preview](http://127.0.0.1:5173/tests/maintenance-pilot-preview.html). It uses production scenes and transaction handlers with page-local synthetic storage, never the live career. Select a view, click the canvas, then use arrows and Enter. Page Up/Down scrolls longer text.

| Location | Facility | Internal class | Notes |
|---|---|---:|---|
| Low Gauge | Look for a local mechanic | 0 | E/F capability, F parts, 0.95 honesty |
| Weymark Town | Weymark Town Workshop | 1 | C/D capability, D parts, standard installations |
| Nell's Rest | Nell's Rest Shipworks | 2 | Forewoman Mara Venn; B/B capability, B–D parts, full service except A-complexity repairs |
| Bruckner Depot | Existing Central Service Hall | 3 | Original capabilities, parts, prices and Anja Riedel copy retained |

Internal class numbers never appear in the player interface. “Shop level” is now “Facilities”. No new mission contacts, companies in the shipping-provider registry, flight changes or planetary expansion.

## Review comments applied

All eight `zzz` comments remain verbatim in the [reviewed specification](maintenance-stage-1-specification.md), with resolutions beside them. The untouched original review is also preserved in commit `23821fa`.

- Basic honesty: 0.95 generally; all 51 existing Wells fallbacks now use 0.8. Red Dust remains the authored dishonest exception.
- Svarog joins the final elite network alongside Bruckner, Serrat and Rochefort. Its staffed shop is scheduled for Stage 5, not silently rolled out now.
- Fixed practical referral catchments are approved. Future shops may be named before implementation; no temporary active-shop fallback graph.
- If the normal recommendation is not elite, the same interaction adds an elite alternative. Low Gauge names the Town Workshop plus Bruckner. Nell's Rest names Bruckner once. Red Dust names future Roadstead and Svarog facilities.
- No shop-policy revision or compatibility migration system. Existing reports and credits use existing rules.
- Free emergency restart prevents maintenance damage from trapping a rig at an unserved location or behind an unaffordable workshop bill.

## Coverage and recovery

There are now **66 staffed shops and 93 self-help entries**, exactly one maintenance entry per physical scope across all **159 playable physical destinations / 177 operational POIs**. The 93 entries are not 93 newly populated workshops. They are the rig's own emergency procedure; staffed service replaces these placeholders only in later approved stages. Nine sites remain permanently emergency-only in the final roster.

The free restart is available before diagnosis at both normal shops and self-help entries, **only when damage causes the actual `grounded` restriction**. Lesser operating restrictions alone do not enable it. This ground-only gate applies to both the button and the transaction; the “routine maintenance is separate” disclaimer has been removed from player-facing copy. It clears damage-caused operating restrictions and restores affected installed components to minimum fault-free HP, leaving AP, grade and equipment unchanged. Nonblocking faults remain for ordinary repairs. It costs no credits or world time, changes no RNG or mission counters and works with negative funds. It invalidates superseded inspection findings while retaining unused service credits.

This is deliberately a recovery safety valve, not a full restoration, parts upgrade, equipment grant, rescue flight or teleport. Optional equipment never installed remains absent. Travel clearance and qualifications remain unchanged. Public outbound empty routes are checked from every operational POI after recovery; Farwatch still forbids empty arrivals, and private destinations remain undisclosed by ordinary referrals.

A restart saves once before publishing state. Save failure leaves everything unchanged; duplicate recovery is a no-op. Self-help entries cannot sell inspections, service, repairs, replacement parts or equipment.

## Implementation

- `src/physical-terminals.ts`: shared station/city scope logic, factored unchanged from Local Directory.
- `src/maintenance/shops.ts`: internal metadata, existing shop registry, Wells honesty and generated emergency coverage.
- `src/maintenance/weymark-shops.ts`: three new pilot facilities.
- `src/local-directory.ts`: generated entries derive from the shop registry rather than a second independent coverage scan; authored entries and IDs remain.
- `src/maintenance/referral-network.ts`: approved final catchments, including future locations and elite alternatives. Tested against the review roster; no production import of planning JSON.
- `src/maintenance/referrals.ts`: public operational entrances, physical location presentation, no access grants or transactions.
- `src/maintenance/emergency.ts`: pure, minimal recovery transaction.
- `src/game.ts`: directions, confirmation/restart and natural-language facility presentation.

## Validation

- `npm run test:maintenance-coverage`: 12,078 checks; grounded-only recovery eligibility, all physical scopes, live directories, normal/elite referrals, future-shop references, public permissions, pilot fault-capability matrix, recovery, zero/negative funds, immutable inputs and atomic failure.
- Independent pre-edit Stage 1 fixture protects **all 63 legacy shop commercial attributes and exact diagnosis, service, replacement and equipment quotes**, except the approved Wells honesty change. No baseline regenerated from the implementation.
- Existing maintenance inspection tests: 55 checks; equipment: 4,599; menus: 386,790; empty runs: 2,913 plus 35 rendering checks; contract presentation: 119,370. Typecheck and production build pass with existing Vite warnings.
- Native desktop preview: 12 real scenes, 21 checks; diagnosis and emergency transactions use synthetic storage. All views captured; workshop, directions and recovered-state screenshots inspected. No mobile testing or live-save changes.
- Concurrent planet/atmosphere outline work remains separate and unmodified by this pass.

## Next gate

Review the pilot and the emergency safety valve. Stage 3 begins with the **complete copy-review Markdown**, including every regional template and local variant, before any ordinary system-wide staffed rollout. Svarog/Rochefort elite facilities and the Cadiz capability upgrade remain later-stage work.
