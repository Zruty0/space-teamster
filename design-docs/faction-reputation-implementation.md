# Reputation ranks — storage, career view and developer editor

Updated: 2026-11-02 (Pacific)
Status: implemented. Pete authorized the ranks system, career display and Tilde editor, explicitly **without gameplay effects**. Original pre-edit baseline: `c9b7467`; November 2 extension baseline: `d9b00b6`. Names follow [the roster review](faction-reputation-roster.md), including Authorized Partner for Daedalus, Unaffiliated Worker for Combine 0 and Unproven Hand for Kisaragi 0.

## Live model

- Twelve tracks: Alvares, Mendes, Nunes, Steel Combine, VHM, Kisaragi, Covenant, Daedalus, Cerberus, **BAM, Merren** and shared smuggler Notoriety. The November 2 extension caps BAM/Merren at level 2; all original tracks retain level 3. No Guild standing or separate BFS/KIS-E/Accord/Halloran meters. No ownership or provider changes.
- `src/reputation.ts` owns stable track IDs, forty original rank titles, six reviewed commercial titles, per-track caps, validation, defaults and bar calculations. Pete selected **Unrated contractor / Rated contractor / Trusted contractor** for both BAM and Merren, superseding the provisional general labels. Production does not import Markdown or test fixtures.
- `CareerProfile.reputations` stores progress in **bar units from 0 through the track's maximum (2 or 3)**. `1.5` means one full bar and half the second, not a chosen XP or reward scale. Progress is not rounded across thresholds. Effective rank is the integer number of full bars; 0 is no established standing.
- Two sequential cyan segments for BAM/Merren, three for the original tracks, show progress. Rank names always belong to the completed level; a nearly full next bar never promotes the title early.
- New careers start at zero on all twelve tracks. Missing legacy fields/entries default to zero, with no inference from missions, money, qualifications or contacts. Invalid nonnumeric/nonfinite saved entries become zero; finite values outside the track's range clamp to its bounds; unknown keys are ignored.
- The existing `space-teamster.career.v1` save holds the data. No new storage key, schema/policy revision or eager rank-only migration write. The profile field is optional for existing callers/old profiles; normal load/default paths populate it. Existing rig/Inquiry load normalization remains unchanged.

## Inherited standings — November 2

Read-only `inheritedReputationLevel()` computes completed levels; partial bars do not combine or promote early. No derived record is saved or edited, and no donor gains points from another donor.
- Bruckner (BFS) uses VHM; KIS-E uses Kisaragi.
- Accord uses the maximum of Alvares, Mendes and Nunes—the three Houses with implemented tracks.
- Halloran uses the maximum of corporate tracks: VHM, Kisaragi, Daedalus, Cerberus, BAM and Merren. This explicitly stated interpretation of corporate levels excludes Steel Combine (political/industrial society), Houses, Covenant and Notoriety. BAM/Merren contributions cannot exceed 2; the other corporations can supply 3.
- Lowering/resetting a donor immediately changes the derived maximum. Tilde shows these four shared levels read-only. Contract boards do not consume these rules yet; no fictional common ownership or loyalty transfer.

## Player view

**Station Terminal → Career Status** retains location, cash, world time and professional Teamster rank, then displays **FACTION REPUTATION**, with full current titles and fractional bars. No explanatory paragraph or numeric rank suffix is shown. **Every track is hidden at exactly zero progress**, and appears at any positive progress, even a partial level 0. Returning to zero hides it again. The section heading/separator are omitted when all tracks are zero. The developer editor still exposes all twelve tracks. This is read-only. The subtitle no longer suggests that these are Guild standings.

Long names wrap without ellipses. The existing PgUp/PgDn detail scrolling handles shorter desktop viewports. `InteractiveScene` key/value rows gain optional bar fills; existing rows without bars retain their layout.

## Tilde / F2 → Ranks

The existing developer panel retains Mechanic and Telemetry Ledger and gains **Ranks**:
- Each track shows its current title, effective level and two or three bars according to its cap.
- Buttons 0/1/2 (BAM/Merren) or 0/1/2/3 (others) set a whole rank. The Progress field accepts a fractional value such as 1.5; Apply or Enter saves it.
- Only independently stored tracks and finite input within their own cap are accepted. Native form constraints and the Game callback both validate. No-op edits do not write.
- Edits copy the profile/standing record, save, then publish. Failed persistence leaves both active and durable state unchanged, displays an error, and can be retried once. No money, time, condition, credits, contacts, Inquiry, contract or flight snapshot changes.
- Native inputs own their number/arrows/Backspace/Enter keys; typing cannot launch, retry, navigate or fly the underlying game. Tilde/F2 still works while editing. Focus is restored after an edit, held gameplay input clears when focus enters the panel, and rebuilding a Game replaces rather than duplicates panel handlers.
- The new tab does not poll/rebuild while typing. New-career reset refreshes its state and clears old editor notices. Existing developer controls remain available.

## Deliberately inactive

No reputation gain from deliveries, passive growth/decay, penalties, faction-pair effects, mission gating, prices, equipment rights, contact introductions, travel permissions, police heat or smuggling gameplay. All current public offers/qualifications/quotes/access rules remain. In particular the planned VHM/KIS direct-contract threshold at level 2 is **not enforced yet**, per this implementation request. Rank titles alone grant no employment, office, membership, citizenship rights or ownership.

## November 2 extension validation

- Reputation suite **1,976 checks**: twelve tracks, exact per-track caps, mixed zero/positive visibility, ten-track save compatibility, no eager migration, cap validation and atomic failure/retry, inherited donor sets/maxima/floor thresholds, reset/decrease and no saved derived records. Original no-gameplay-effects checks retained.
- Native synthetic preview **497 checks**: twelve editable tracks, two/three bars and buttons/input limits, zero hiding, fractions, invalid forged submissions, inherited readouts, save/reload/reset and keyboard isolation. Five desktop views captured, including empty standings and commercial controls; no live profile.
- Actual main-game disposable Edge **21 checks**, including native Enter, capped BAM/Merren editors and reload persistence, Halloran's changing maximum, Tilde/F2 and zero-only Career Status. Temporary runner `check-reputation-live-20261102.mjs` in the operator's local Temp directory.
- Menus **475,774 assertions / 4,434 scenes**, maintenance coverage/full-service/elite/persistence/copy audits and typechecks/build pass; existing Vite warnings only. Concurrent wind-tracer/atmosphere work is preserved and excluded from this change.

## Original October 30 validation (historical)

- `npm run test:reputation`: **1,034 checks**. Independent reviewed title expectations, all ten tracks and exact fractional boundaries, old/partial/malformed saves, independent defaults, normal round-trips/reset, strict developer input, atomic failure/retry, other-state preservation, actual successful delivery with no rank gain, unchanged offers/locks/travel/equipment, desktop drawing/paging and half-width bars.
- [Synthetic desktop preview](http://127.0.0.1:5173/tests/reputation-preview.html): **322 checks** using real Game construction, native forms/buttons, all forty titles, fractions, save failure/retry, same-value edits, keyboard isolation, all three tabs, scrolling and reset. Page-local synthetic storage only. Six review views captured; maximum/partial titles and editor/error views inspected. Run focused for keyboard-focus checks (headless CDP uses focus emulation).
- Actual main-game desktop pass: **14 checks** in a disposable Edge profile, including Station Terminal → Career Status navigation, Tilde/F2, native Enter/Backspace, immediate status refresh, all ten editor entries, field focus and full-page reload persistence. Four screenshots captured; no operator profile used. Temporary runner: `C:/Users/zruty/AppData/Local/Temp/check-reputation-live-20261030.mjs`.
- Maintenance coverage 157,109; full-service 28,067; elite 10,916; maintenance persistence 49; historical copy/fingerprint audit 10,233. Menus 475,774 assertions / 4,434 scenes. Equipment 6,743; empty travel 2,913 plus 35 rig-view checks; contract presentation 119,370; inspection 55. Typechecks and production build pass; existing Vite CJS/chunk-size warnings only.
- Old fixtures, approved maintenance copy/comments, mission generators and gameplay terms were not rewritten. No mobile tests, live-save edits, push or deploy. Atmosphere pilot `c41ccb6` is retained.
