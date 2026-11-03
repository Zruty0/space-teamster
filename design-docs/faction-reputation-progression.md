# Reputation progression — design discussion

Updated: 2026-11-02 (Pacific)
Status: **Design only.** Runtime baseline `43772dc` has thirteen tracks, employer recognition, persistence and editing, but no automatic changes or gates. Pete specifies the progression framework below; exact mission classes, gains/losses, grace periods and decay rates are not chosen. See [roster](faction-reputation-roster.md) and [implemented model](faction-reputation-implementation.md).

## Pete's direction

- Some contracts require a minimum effective reputation level.
- Reaching level 1 should take roughly **1–3 faction contracts**, without pressure to complete them quickly.
- Reaching level 2 should take roughly **10–20 important contracts**, with reasonably few unrelated missions between them. These are indicative ranges, not finalized per-faction values.
- Introduce decay after level 1: after **K unrelated missions**, each additional unrelated mission removes some progress.
- Passive decay cannot cross an integer boundary: **1.9 may decay to 1, never below 1**.
- Rival/disqualifying contracts impose losses that **can cross integer boundaries**.
- Define, per faction and progression level: qualifying missions; gain per qualifying mission (typically `1/M`); disqualifying missions and losses; unrelated-mission grace and subsequent decay rate.

## Recommended rule structure — not yet approved

Define rules for the **current progression band**: 0→1, 1→2, and 2→3 where that track permits 3. Interpret the 10–20 important contracts as advancement within 1→2, rather than a lifetime total. Level-2-capped tracks have no 2→3 advancement, but still need relationship-maintenance and rival-loss rules at their ceiling.

| Band | Proposed qualification pattern | Indicative M | Passive decay |
|---|---|---|---|
| 0→1 | Ordinary qualifying faction work | 1–3 | None |
| 1→2 | Important qualifying work available at level 1 | 10–20 | Grace K, then D per unrelated completion |
| 2→3 | Faction-specific higher-trust work; not specified yet | Undecided | Separate K/D if desired |

Contract access and advancement qualification are separate: work required to earn level 2 must be available before level 2. Do not make the next tier require itself. Stable provider/template/mission-class identity should determine qualification, not rendered issuer or cargo-name guessing.

Suggested per-band configuration:
- Qualifying mission predicate/class IDs and gain, normally `1/M` bar units.
- Rival/disqualifying mission predicates and loss per class.
- Unrelated-completion grace K and decay D per subsequent completion.
- Relationship-maintenance qualification (see below); this is an extra decision, not implicitly identical to positive credit.

## Event semantics proposed for review

1. **Qualifying completion:** add its credit and reset the unrelated counter. Recommend capping that award at the next integer, so a final routine 0→1 job cannot spill credit into an advanced band for which it does not qualify. Clamp to track maximum.
2. **Related but non-advancing completion:** recommend ordinary work for the same faction resets grace without adding progress once it no longer qualifies for advancement. This keeps maintenance of a relationship distinct from earning higher trust. Pete has not yet chosen whether only advancing work should refresh grace instead.
3. **Unrelated completion:** increment the counter. For the first K completions, no passive loss; starting with K+1, subtract D, bounded by the current integer floor: `max(floor(repBeforeDecay), repBeforeDecay - D)`. No passive decay while current reputation is below 1.
4. **Rival completion:** apply the explicit rival loss, bounded at zero but not at an integer. Recommend incrementing the non-qualifying counter without also charging passive decay on this same event (avoid implicit double punishment). It does not refresh grace. This ordering/counting choice remains proposed.

Evaluate qualification/loss against the pre-event band; each faction gets one classification for an event. A job may legitimately help one faction and hurt a rival. Conflicting positive/rival rules for the same faction need explicit resolution rather than accidental evaluator order.

Recommend counting **completed contracts**, not flight legs, launch attempts, retries, menus or elapsed time. Waiting/maintenance does not consume grace under this mission-count model. Whether empty runs, failed jobs and abandoned contracts also count or cause explicit losses needs a deliberate decision. Do not add those penalties automatically.

A rival loss can put a pilot back into a lower band: if 2 falls to 1.9, subsequent passive decay would protect 1, not the historical high-water mark of 2. If a rival lowers 1 to 0.9, the proposed current-band model suspends passive decay there and allows level-0 recovery rules. Confirm this consequence before coding.

## Example — illustrative values, not balance decisions

For 1→2, suppose M=15, K=3 and D=0.02. At reputation 1.60:
- Three unrelated completed jobs leave 1.60.
- The fourth leaves 1.58, the fifth 1.56.
- A qualifying important job adds 1/15 and resets grace.
- Long passive neglect can reduce fractional progress to 1, never below.
- An explicit rival penalty of 0.15 at 1.10 would instead leave 0.95.

## Inheritance and gain attribution

Recognition is already implemented; earning is not. Accord/other nobles read capped House maxima, commercial employers read capped corporate maxima, BFS reads VHM, KIS-E reads Kisaragi, and GOV/EDF/EIP share Estella Institutions.

A contract's access reputation does **not** automatically identify recipients of reputation credit. In particular an HSC or Accord job must not silently award every corporate/House donor, nor automatically award whichever currently supplies the maximum. Define the credited stored track(s) or named sponsor through explicit qualification rules. Likewise define relatedness for each donor rather than resetting all counters merely because a recipient recognizes a common standing.

## Implementation considerations for the later authorized pass

- Track progress and per-track unrelated-completion counters together; default missing counters safely. Existing scores/accepted contracts/history must not be reinterpreted as past rewards.
- Apply settlement and reputation changes atomically with save-before-publish; failed saves/retries must not duplicate gains, rival penalties or decay events.
- Exact arithmetic must honor M completions per bar (for example ten 0.1 awards), without broadly rounding arbitrary near-threshold stored/developer progress into an early rank.
- Recheck gate visibility, loss-driven revocation, and accepted-job handling explicitly; no retroactive cancellation or public/private travel change is implied.
- Next: agree on these event semantics, then author a per-track/per-band mission and parameter table. No runtime changes, numerical balance or contract gates are implemented by this document.
