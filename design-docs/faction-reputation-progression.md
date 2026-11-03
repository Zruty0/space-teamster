# Reputation progression — design discussion

Updated: 2026-11-02 (Pacific)
Status: **Design only.** Runtime baseline `43772dc` has thirteen tracks, employer recognition, persistence and editing, but no automatic changes or gates. Pete specifies the progression framework below; exact mission classes, gains/losses, grace periods and decay rates are not chosen. See [roster](faction-reputation-roster.md) and [implemented model](faction-reputation-implementation.md).

## Pete's direction

- Some contracts require a minimum effective reputation level.
- Reaching level 1 should take roughly **1–3 faction contracts**, without pressure to complete them quickly.
- Reaching level 2 should take roughly **10–20 important contracts**, with reasonably few unrelated missions between them. These are indicative ranges, not finalized per-faction values.
- Introduce decay after level 1: after **K unrelated missions**, each additional unrelated mission removes some progress.
- Passive decay cannot cross an integer boundary: **1.9 may decay to 1, never below 1**.
- Rival/disqualifying contracts impose losses that **can cross integer boundaries**, but generally **cannot reduce reputation below 1.0**. Exceptions require explicit design; no exceptional event is selected yet.
- Routine work for a faction **resets its decay grace**, even when it does not advance reputation. **Empty runs do not count toward decay.**
- **2→3 advances only through special quests**, not ordinary mission work. Decay and rivalry still apply to this band.
- Rival groups: the three Houses, and **one-way Combine opposition to Cerberus**. Cerberus is indifferent to Combine work. Routine rival deliveries should remain possible without direct rivalry penalties; only specifically consequential work should cause them.
- Attaining level 3 may cap other faction reputations at 2 or 1. Follow-up: **rival employers' contracts become unavailable at level 3 because those rivals no longer trust the pilot**. This is an access refusal, not merely a lower reward or numerical cap. Exact cap/block persistence and the asymmetric exception still need clarification.
- Define, per faction and progression level: qualifying missions; gain per qualifying mission (typically `1/M`); disqualifying missions and losses; unrelated-mission grace and subsequent decay rate.

## Rule structure — directions and remaining recommendations

Define rules for the **current progression band**: 0→1, 1→2, and 2→3 where that track permits 3. Interpret the 10–20 important contracts as advancement within 1→2, rather than a lifetime total. Level-2-capped tracks have no 2→3 advancement, but still need relationship-maintenance and rival-loss rules at their ceiling.

| Band | Proposed qualification pattern | Indicative M | Passive decay |
|---|---|---|---|
| 0→1 | Ordinary qualifying faction work | 1–3 | None |
| 1→2 | Important qualifying work available at level 1 | 10–20 | Grace K, then D per unrelated completion |
| 2→3 | Special quests only; ordinary contracts give no advancement | Authored quest rewards/milestones, not a routine-contract M | Still applies; K/D pending |

Contract access and advancement qualification are separate: work required to earn level 2 must be available before level 2. Do not make the next tier require itself. Stable provider/template/mission-class identity should determine qualification, not rendered issuer or cargo-name guessing.

Suggested per-band configuration:
- Qualifying mission predicate/class IDs and gain, normally `1/M` bar units.
- Rival/disqualifying mission predicates and loss per class.
- Unrelated-completion grace K and decay D per subsequent completion.
- Relationship-maintenance qualification: routine same-faction work resets grace even if it gives no advancement. Explicit donor attribution for inherited employers is still needed.
- Special-quest progression for 2→3, and a separate directed level-3 exclusivity/cap table.

## Event semantics proposed for review

1. **Qualifying completion:** add its credit and reset the unrelated counter. Recommend capping that award at the next integer, so a final routine 0→1 job cannot spill credit into an advanced band for which it does not qualify. Clamp to track maximum.
2. **Related but non-advancing completion (approved):** ordinary work for the same faction resets grace without adding progress once it no longer qualifies for advancement. This also maintains fractional quest-earned progress above 2 without adding to it.
3. **Unrelated completion:** increment the counter. For the first K completions, no passive loss; starting with K+1, subtract D, bounded by the current integer floor: `max(floor(repBeforeDecay), repBeforeDecay - D)`. No passive decay while current reputation is below 1.
4. **Rival completion:** apply the explicit rival loss, crossing integer boundaries but normally bounded at 1.0. For an existing reputation below 1, recommend leaving it unchanged under ordinary rival penalties rather than accidentally raising it to 1; equivalent default formula: `min(oldRep, max(1, oldRep - loss))`. Below-1 treatment and any exceptional lower floor still need explicit confirmation. Recommend incrementing the non-qualifying counter without also charging passive decay on this same event (avoid implicit double punishment). It does not refresh grace. This ordering/counting choice remains proposed.

Evaluate qualification/loss against the pre-event band; each faction gets one classification for an event. A job may legitimately help one faction and hurt a rival. Conflicting positive/rival rules for the same faction need explicit resolution rather than accidental evaluator order.

Recommend counting **completed contracts**, not flight legs, launch attempts, retries, menus or elapsed time. Waiting/maintenance does not consume grace under this mission-count model. **Empty runs are explicitly excluded** and neither consume grace nor incur decay. Failed/abandoned job counting and penalties remain undecided; do not add them automatically.

A rival loss can put a pilot back into a lower band: if 2 falls to 1.9, subsequent passive decay would protect 1, not the historical high-water mark of 2. The earlier suggestion that ordinary rivalry could lower 1 to 0.9 is superseded by the default 1.0 rival floor. Exceptional betrayals/lower-floor outcomes are not authored or approved.

## Example — illustrative values, not balance decisions

For 1→2, suppose M=15, K=3 and D=0.02. At reputation 1.60:
- Three unrelated completed jobs leave 1.60.
- The fourth leaves 1.58, the fifth 1.56.
- A qualifying important job adds 1/15 and resets grace.
- Long passive neglect can reduce fractional progress to 1, never below.
- A normal rival penalty of 0.15 at 1.10 leaves **1.0**, not 0.95.

## Nuanced, directed rivalry

- Treat Alvares, Mendes and Nunes as the House rivalry group; penalty amounts and eligible work may differ by direction and context. Do not assume identical penalties for all pairs.
- Explicitly consequential CHR work can cost Combine standing. Combine work does **not** automatically cost CHR standing: Cerberus is indifferent.
- **Importance for advancement and political impact are distinct classifications.** A valuable/important delivery is not automatically hostile to another faction. Use explicit mission-class/story context, not price, issuer tag alone or destination ownership, to select rival penalties.
- Routine work for a rival can still count as unrelated work for a different faction's decay counter, but receives no direct rival penalty merely for its issuer. Likewise, shared employer recognition must not broadcast rival penalties to every donor.

## Level-3 contract refusal — latest direction

Approved direction: reaching level 3 makes rival contracts unavailable. This includes their routine contracts, unlike the earlier stages where routine rival deliveries remain permitted without a direct rivalry penalty. Refusal takes precedence over satisfying a contract's minimum level; inherited House/corporate maxima must not bypass an explicit employer refusal. It does not automatically zero the stored rival reputation.

Interpreting refusal according to the existing distrust directions:

| Level-3 affiliation | Employer refusing new contracts |
|---|---|
| Alvares | Mendes and Nunes |
| Mendes | Alvares and Nunes |
| Nunes | Alvares and Mendes |
| Cerberus | Steel Combine |
| Steel Combine | No automatic Cerberus refusal, if CHR's stated indifference also governs contract availability |

The Combine/CHR asymmetry needs explicit confirmation: CHR being indifferent means Combine 3 alone would not make CHR distrust the pilot. Under that interpretation, taking consequential CHR work could still reduce Combine standing. Do not silently turn one-way reputation hostility into mutual contract refusal or invent a player-side prohibition on serving CHR.

Recommended presentation/handling, not yet approved implementation:
- Show refused postings as locked with the responsible affiliation explained, rather than silently disappearing. Final board presentation is undecided.
- Warn about lost employers before committing to the level-3 quest.
- Preserve already accepted contracts. If outstanding rival obligations can coexist with the promotion, require them to be resolved before commitment rather than retroactively cancelling them or leaving a loophole through old bookings.
- Refusal concerns employer contract access, not a blanket docking ban, discovery change, shop closure or loss of emergency services.
- Decide whether refusal follows current level or an explicit persistent quest allegiance, and how renunciation restores access. No lifecycle chosen yet.

## Level-3 commitments and recovery — decisions still open

Pete intends some level-3 relationships to limit other factions to 2 or 1. Keep this as a **separate directed cap table**, not an automatic consequence of every rivalry edge. No specific target/cap pair has yet been approved. Existing intrinsic caps (BAM/Merren/Institutions at 2) and inherited recipient caps are separate from these future political limits.

Recommendations:
- Make a restrictive level-3 quest an explicit informed choice, with affected relationships and limits shown before commitment.
- Decide whether a cap truncates stored reputation or only limits effective standing, and whether it persists after demotion or is removed by a deliberate allegiance change. Do not silently restore old rank-3 standing or create mutually oscillating caps.
- Prefer an explicit quest commitment/renunciation rule over switching allegiance caps on/off whenever a small penalty crosses 3. This is a proposal, not a new approved persistent flag.
- With the existing integer decay floor, **2.8 can decay to 2, while exactly 3 cannot passively decay below 3**. The new refusal rule removes ordinary future rival-contract demotion paths where those employers actually refuse work (notably the mutually rival Houses). If demotion remains possible through the Combine/CHR asymmetric case, earlier obligations or explicitly authored events, ordinary work still cannot rebuild 2→3; an authored recovery route or quest-achievement recovery policy remains to be chosen for those cases.

## Inheritance and gain attribution

Recognition is already implemented; earning is not. Accord/other nobles read capped House maxima, commercial employers read capped corporate maxima, BFS reads VHM, KIS-E reads Kisaragi, and GOV/EDF/EIP share Estella Institutions.

A contract's access reputation does **not** automatically identify recipients of reputation credit. In particular an HSC or Accord job must not silently award every corporate/House donor, nor automatically award whichever currently supplies the maximum. Define the credited stored track(s) or named sponsor through explicit qualification rules. Likewise define relatedness for each donor rather than resetting all counters merely because a recipient recognizes a common standing.

## Per-faction parameter review

Pete requests **Combine first, then Cerberus, then Houses**, one entity at a time. [Steel Combine's first proposal](faction-reputation-combine.md) is grounded in its existing internal/import/pilgrimage/export programmes. Its gates, M=2 / M=15, K=5 / D=1/30, and CHR loss amounts are recommendations awaiting review, not approved balance. No Cerberus or House parameter table is selected yet.

## Implementation considerations for the later authorized pass

- Track progress and per-track unrelated-completion counters together; default missing counters safely. Existing scores/accepted contracts/history must not be reinterpreted as past rewards.
- Apply settlement and reputation changes atomically with save-before-publish; failed saves/retries must not duplicate gains, rival penalties or decay events.
- Exact arithmetic must honor M completions per bar (for example ten 0.1 awards), without broadly rounding arbitrary near-threshold stored/developer progress into an early rank.
- Recheck gate visibility, loss-driven revocation, and accepted-job handling explicitly; no retroactive cancellation or public/private travel change is implied.
- Next: agree on these event semantics, then author a per-track/per-band mission and parameter table. No runtime changes, numerical balance or contract gates are implemented by this document.
