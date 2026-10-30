# Reputation ranks — storage, career view and developer editor

Updated: 2026-10-30 (Pacific)
Status: implemented. Pete authorized the ranks system, career display and Tilde editor, explicitly **without gameplay effects**. Pre-edit baseline: `c9b7467`. Names follow [the roster review](faction-reputation-roster.md), including Authorized Partner for Daedalus, Unaffiliated Worker for Combine 0 and Unproven Hand for Kisaragi 0.

## Live model

- Ten tracks: Alvares, Mendes, Nunes, Steel Combine, VHM, Kisaragi, Covenant, Daedalus, Cerberus and shared smuggler Notoriety. No Guild standing and no separate BFS/KIS-E meters. No ownership or provider changes.
- `src/reputation.ts` owns stable track IDs, forty rank titles, validation, defaults and bar calculations. Production does not import Markdown or test fixtures.
- `CareerProfile.reputations` stores progress in **bar units from 0 through 3**. `1.5` means one full bar and half the second, not a chosen XP or reward scale. Progress is not rounded across thresholds. Effective rank is the integer number of full bars; 0 is no established standing and 3 is maximum.
- Three sequential cyan segments show progress. Rank names always belong to the completed level; a nearly full next bar never promotes the title early.
- New careers start at zero on all ten tracks. Missing legacy fields/entries default to zero, with no inference from missions, money, qualifications or contacts. Invalid nonnumeric/nonfinite saved entries become zero; finite values outside 0–3 clamp to bounds; unknown keys are ignored.
- The existing `space-teamster.career.v1` save holds the data. No new storage key, schema/policy revision or eager rank-only migration write. The profile field is optional for existing callers/old profiles; normal load/default paths populate it. Existing rig/Inquiry load normalization remains unchanged.

## Player view

**Station Terminal → Career Status** retains location, cash, world time and professional Teamster rank, then displays all ten faction/Notoriety standings, full current titles and fractional bars. This is read-only. The subtitle no longer suggests that these are Guild standings.

Long names wrap without ellipses. The existing PgUp/PgDn detail scrolling handles shorter desktop viewports. `InteractiveScene` key/value rows gain optional bar fills; existing rows without bars retain their layout.

## Tilde / F2 → Ranks

The existing developer panel retains Mechanic and Telemetry Ledger and gains **Ranks**:
- Each track shows its current title, effective level and three bars.
- Buttons 0/1/2/3 set a whole rank. The Progress field accepts a fractional value such as 1.5; Apply or Enter saves it.
- Only recognized tracks and finite input in 0–3 are accepted. Native form constraints and the Game callback both validate. No-op edits do not write.
- Edits copy the profile/standing record, save, then publish. Failed persistence leaves both active and durable state unchanged, displays an error, and can be retried once. No money, time, condition, credits, contacts, Inquiry, contract or flight snapshot changes.
- Native inputs own their number/arrows/Backspace/Enter keys; typing cannot launch, retry, navigate or fly the underlying game. Tilde/F2 still works while editing. Focus is restored after an edit, held gameplay input clears when focus enters the panel, and rebuilding a Game replaces rather than duplicates panel handlers.
- The new tab does not poll/rebuild while typing. New-career reset refreshes its state and clears old editor notices. Existing developer controls remain available.

## Deliberately inactive

No reputation gain from deliveries, passive growth/decay, penalties, faction-pair effects, mission gating, prices, equipment rights, contact introductions, travel permissions, police heat or smuggling gameplay. All current public offers/qualifications/quotes/access rules remain. In particular the planned VHM/KIS direct-contract threshold at level 2 is **not enforced yet**, per this implementation request. Rank titles alone grant no employment, office, membership, citizenship rights or ownership.

## Validation

- `npm run test:reputation`: **1,034 checks**. Independent reviewed title expectations, all ten tracks and exact fractional boundaries, old/partial/malformed saves, independent defaults, normal round-trips/reset, strict developer input, atomic failure/retry, other-state preservation, actual successful delivery with no rank gain, unchanged offers/locks/travel/equipment, desktop drawing/paging and half-width bars.
- [Synthetic desktop preview](http://127.0.0.1:5173/tests/reputation-preview.html): **322 checks** using real Game construction, native forms/buttons, all forty titles, fractions, save failure/retry, same-value edits, keyboard isolation, all three tabs, scrolling and reset. Page-local synthetic storage only. Six review views captured; maximum/partial titles and editor/error views inspected. Run focused for keyboard-focus checks (headless CDP uses focus emulation).
- Actual main-game desktop pass: **14 checks** in a disposable Edge profile, including Station Terminal → Career Status navigation, Tilde/F2, native Enter/Backspace, immediate status refresh, all ten editor entries, field focus and full-page reload persistence. Four screenshots captured; no operator profile used. Temporary runner: `C:/Users/zruty/AppData/Local/Temp/check-reputation-live-20261030.mjs`.
- Maintenance coverage 157,109; full-service 28,067; elite 10,916; maintenance persistence 49; historical copy/fingerprint audit 10,233. Menus 475,774 assertions / 4,434 scenes. Equipment 6,743; empty travel 2,913 plus 35 rig-view checks; contract presentation 119,370; inspection 55. Typechecks and production build pass; existing Vite CJS/chunk-size warnings only.
- Old fixtures, approved maintenance copy/comments, mission generators and gameplay terms were not rewritten. No mobile tests, live-save edits, push or deploy. Atmosphere pilot `c41ccb6` is retained.
