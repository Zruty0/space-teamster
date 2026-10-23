# Contract destination presentation

Updated: 2026-10-23
Status: implemented at Pete's request.

## Rule

Contracts name the physical destination, not its internal receiving POI: **The Still**, **The Caravanserai**, **Cupola Station**, etc. The rule applies to every provider, freight/passenger boards, contact/certification work and empty runs. Planetary/lunar surface settlements remain distinct.

Examples:
- `Deliver … to Public Approach Dock` → `Deliver … to The Still`
- `Deliver … to Outfitter / Drydock` → `Deliver … to The Caravanserai`
- First practical: `Land at the Public Approach Dock at The Still` → `Land at The Still`

## Implementation and boundaries

- `src/contract-presentation.ts`: shared physical-location name/path resolution, using the existing terminal-parent rule from empty travel. Paths stop at the station/asteroid rather than listing the final dock. Existing Orselle alias normalization remains in force.
- `career-contracts.ts`: the shared constructor applies presentation to every new public and contact contract. Ordinary titles are rebuilt from the unchanged cargo label and physical destination; authored titles retain their purpose while endpoint references are normalized. Details, legacy briefing and receipts normalize only this contract's endpoint labels, with whole-word/article/parent-name handling.
- `game.ts`: scene rendering, active HUD destination fields, completion text/title and new maintenance-context titles use presentation copies. Already cached/accepted postings display correctly without rewriting the original object or storage.
- No change to source/destination IDs, provider templates/selection, quote computation, payouts, restrictions, authorization, cargo, scheduled transfers, docking access points or actual receiving-POI settlement. Raw provider text may still use internal labels; the contract presentation boundary is authoritative. Empty runs already used physical names and retain their behavior.
- No bulk text replacement across world lore, NPC names, cargo catalogs or historical logs. Unknown historical location IDs retain their stored display fallback.

## Validation

`npm run test:contract-presentation`:103900 assertions;85 consolidated catalog endpoints,13657 raw candidates across all28 providers,6820 public and9 contact postings. Covers generic/authored/legacy titles, descriptions/receipts, paths, actual scene/HUD consumers, unchanged accepted objects and storage, real acceptance using original berth IDs and real settlement retaining the receiving POI. Ordinary cargo labels containing a dock name are not accidentally renamed.

Gaia/shipping, Acheron, Balor expansion/BAM, empty-run and menu suites plus build pass. Original provider hashes remain protected. Desktop `tests/contract-presentation-preview.html`:8 actual module-worker requests/130 postings, native Canvas2D views for Still/Caravanserai/old cached posting. Isolated profile; no live-save or mobile changes.
