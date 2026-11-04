# Cerberus reputation

Updated: 2026-11-03 (Pacific)
Status: **Implemented in `7992ffb` after Pete's instruction to proceed.** This pass adopts the proposed 2/15 progression baseline and records/audits alternative under that implementation authorization, with the previously approved income caps/mix. Houses are next. Framework: [progression](faction-reputation-progression.md); previous entity: [Combine](faction-reputation-combine.md); [income baseline](faction-reputation-income-implementation.md).

## Runtime ledger — November 3

- **0→1:** +0.5 per successful CHR job, capped at the next integer. **1→2:** +1/15 per important job, fifteen completions exactly. No routine gains above 2; level 3 still needs future quests.
- Every successful CHR job refreshes its own grace. Five unrelated completions, then −1/30 per additional completion; current integer floor protected. Empty/personal travel, failed saves and retries earn/count nothing. Combine work is unrelated for passive decay, never direct CHR hostility or refusal.
- Important families: `custody-transfer-to-olympos`, `local-custody-processing`, `surface-labor-allocation`, `local-surface-labor-processing`, `local-workforce-manifests`, `local-shareholder-packets`, `local-legal-archives`, `local-audit-records`, `audit-records-to-acheron`. All require trust level 1 and new quotes pay **20,000 cr net at par**. Records/audits provide a non-custody route, including an Acheron Hub↔Olympos return pair. Importance does not imply Combine disapproval.
- `shareholder-packets-to-finance`, `legal-archives-to-capital`, `executive-delegation` require trust level 2, remain routine for advancement, and join high-earning ordinary freight in the premium commercial pool.
- Other routine work uses earnings alone: **≤40,000 → 0; 40,001–250,000 → 1; >250,000 → 2**. Actual requirement is the maximum of economic and authored trust minima; licenses/equipment still apply. Cargo labels, issuer display text and destination ownership do not decide eligibility or rewards. Generic `workforce-transfer-to-hub` stays routine, with no new consent/coercion claim or Combine penalty.
- `src/contract-work.ts` now holds stable Combine/CHR classifications, re-exported from the old reputation API. This avoids an income/progression import cycle. The shared pure settlement loops over just these two tracks; the other eleven scores/counters remain untouched. Employer recognition reads earned CHR levels but awards no donor points.
- Public offers stay visible with locks. Both scene and acceptance handler use current standing against the accepted posting's quoted earnings. No quote rewriting, accepted-job cancellation, docking/service restrictions, new save key/schema/version or eager historical credit inference.
- Existing Combine penalties stay −0.20 for explicit custody/labor and −0.10 for workforce manifests, floor 1; no double passive charge on the same rival event. CHR advancement and Combine loss can occur together in one save. The standard neutral notices show both when applicable. CHR 3 still blocks new Combine work; no reciprocal block.

### Income refit and evidence

The old CHR curve included advancement jobs and ignored the newly authored trust-2 floor. Only CHR is refitted; other employer quotes are unchanged. Important jobs are removed from the commercial denominator. The reference premium budget first includes the three entrusted classes, then enough high-workload ordinary jobs to approach 20%. Their combined workload median supplies the premium curve, preserving the 300k commercial median instead of letting trust floors distort the mix.

Entry quotes vary gently around 20k rather than pushing the last starter loads toward the 40k eligibility ceiling. A cap need not be fully occupied; the first level-1 offers remain above 40k. Important jobs have constant 20k **net at par**, not identical gross/fixed payouts: unreimbursed par fuel is still included in the fixed component. All actual-fuel reimbursement ratios/caps remain unchanged.

| Sample | All CHR postings | Important, separately | Ordinary mix 0 / 1 / 2 | Ordinary medians 0 / 1 / 2 |
|---|---:|---:|---|---|
| Reference days 0–15 | 787 | 240 | 20.7% / 59.6% / 19.7% | 20k / 200k / 300k |
| Check days 16–31 | 761 | 224 | 21.8% / 58.3% / 19.9% | 20,271 / 200k / 299,805 |
| Fresh holdout days 48–63 | 736 | 213 | 17.4% / 61.6% / 21.0% | 19,994 / 200k / 299,845.5 |

All important quotes in those samples are 20k and require 1. Starter freight counts are 14 / 17 / 15 respectively; it is not necessary to transport captive labor to establish standing or advance. Existing certifications, equipment, travel and posting schedules remain real prerequisites. This is not a claim that every board always offers each tier or a complete flown-campaign playtest.

- 2,009 CHR checks / 187 generated offers cover all nine important families, non-custody return routing, quote/trust boundaries, exact 2+15 Game settlements, decay, no reciprocal hostility, independent counters and atomic old/new accepted-quote settlement.
- 10,046 standing + 9,260 Combine checks; 44,245 income checks. Menus 475,953 assertions / 4,434 scenes; regional/history/presentation/empty-run/maintenance-persistence regressions, typecheck and build pass.
- **40 native CHR checks**; **36 actual constructed-Game checks** in disposable Edge cover launch/retry, failed save/overlay retry, 2+15 forced synthetic par completions, money/history, simultaneous gain/loss and reload. These use fixture repositioning, not a claim of a flown campaign. Existing Combine native 38 / constructed Game 41 and income native 28 (including worker/fallback equality) pass. Screenshots inspected.
- Actual day-0–31 census preserves 1,548 CHR posting identities and fuel terms; a separate full cached census comparison checks that no other employer's quote changed. Historical fixture JSON is untouched.
- Reproduce: `npm run test:reputation`, `npm run test:income`, `node tests/run-income-audit.mjs --cerberus-only`, and `--cerberus-only --first-day 48 --days 16`. Preview `/tests/cerberus-reputation-preview.html`. Temp `cerberus-live-audit-20261103.json`, `cerberus-live-holdout-20261103.json`, `cerberus-other-employers-preserved-20261103.json`, `check-cerberus-live-20261103.mjs` and screenshots retain evidence. No push/deploy/mobile/live-save edits.

## Earlier review context

The following proposal/audit records the earlier reasoning. The runtime ledger above is authoritative; category-first economic gates and historical fee suggestions below are superseded.

## Latest direction — earnings-based access across all entities

Pete rejects current basic-freight earnings as too high for level 0: target median generally 10k cr, within 5k–20k across entities, with roughly 40k maximum even at Cerberus. More profitable ordinary shipments belong in higher access bands, based on expected credits rather than cargo/job type. Level-1 target medians reach 200k for wealthy entities; level 2+ is around 300k for high-paying corporations such as CHR/BAM. Follow-up places Halloran/Accord/Co-op at roughly half that scale, non-corporations lower still, and Combine exports at about 30k; the previous universal 300k interpretation is superseded. Pete subsequently approved the revised [cross-entity median table](faction-reputation-income-targets.md), including CHR **20k / 200k / 300k**. Targets and the subsequent cap proposal are approved: CHR economic level 0 up to 40k, level 1 above 40k through 250k, level 2 above 250k. Pete selects roughly 20%/60%/20% newly unlocked commercial offers at levels 0/1/2. The shared quote fit was subsequently refined for CHR's implemented important/trust classes; see the runtime ledger.

The old category table below is retained as an audit grouping and earlier proposal, **not the final economic gate policy**. Important jobs can pay at level-0 rates while requiring level 1: economic access **AND** authored trust. Advancement qualification remains independent of pay. Income boundaries are approved and new prices calibrated; current reference/holdout CHR medians are 20k/200k/300k. Starter freight exists (25 reference, 22 fresh-holdout occurrences), and the subsequent entity pass activates gates with earned progression and a separately priced important pool (ledger above).

## Pay-review direction — expected earnings in credits at par

Pete redirects the review from percentages of par fuel cost to **expected earnings at par in credits**. Use the existing quote's `expectedMargin`: total contract pay including fuel reimbursement, minus fuel consumed at par. This excludes handling/comfort penalties, maintenance, positioning travel and the value of elapsed time. Do not treat it as gross pay or a guaranteed realized profit.

Choose/compare credit earnings first; coefficients are implementation details, not approved balance targets. This direction does **not** by itself select flat rewards, new absolute target bands, or an automatic change to current quotes.

### Historical postings before income calibration

Read-only audit at `9825058`: all 175 canonical navigation-source boards over world days 0–15, actual freight/passenger selection and preferred transfers. **787 CHR postings / 30 observed templates**. Each posting occurrence has equal weight; medians are not weighted by player travel time or unique routes. Class labels below use the still-proposed reputation grouping, not live CHR gates.

| Proposed work class | Postings | Pre-calibration median net at par | Pre-calibration observed range |
|---|---:|---:|---:|
| Basic routine freight | 140 | 133,534 cr | 51,597–264,579 cr |
| Generic workforce intake | 181 | 25,810 cr | 18,600–73,951 cr |
| Elevated routine freight | 162 | 329,527 cr | 114,796–594,576 cr |
| Important corporate records/audits | 36 | 242,716 cr | 184,810–421,804 cr |
| Important custody/labor passengers | 197 | 55,800 cr | 43,450–119,082 cr |
| Workforce manifests | 7 | 240,944 cr | 240,944 cr |
| Proposed level-2 corporate freight | 30 | 246,236 cr | 89,704–422,541 cr |
| Proposed level-2 executive passengers | 34 | 75,900 cr | 58,623–93,734 cr |

Examples: industrial oxygen Acheron Hub→Hammer earns 51,597 cr at par; ordinary graphite Olympos→Veles can earn 264,579 cr. Rare-metal staging Olympos→Acheron Hub earns 329,527 cr in a median example. Workforce manifests on that local route earn 240,944 cr. A low-paying central legal delivery Acheron Hub→Richelieu earns 89,704 cr, while Olympos→Orselle shareholder packets can earn 422,541 cr.

**Implication:** current proposed level-2 categories are not automatically the most lucrative in credits. Their corporate-freight median is below elevated routine freight, and executive passengers pay much less. Route/load costs cause substantial overlap; a larger percentage alone cannot establish a useful credit-based access ladder. Important advancement work and lucrative work remain separate classifications.

Reproduce: `node tests/run-equipment.mjs tests/audit-cerberus-earnings.ts`. The audit now reports live prices separately from reconstructed pre-calibration earnings and the historical unapproved coefficient comparison. Original local output remains preserved as Temp `cerberus-earnings-20261103.json`; do not overwrite it. The audit itself is read-only.

## Authored baseline source facts — before new-quote calibration

`src/content/estella/faction-contracts/cerberus-contracts.ts` distinguishes ordinary freight, premium corporate/extraction freight, workforce manifests and passenger work. Stable issuer is `cerberus-human-resources` / CHR.

These baseline dials remain in candidate authoring; `c8037f5` replaces fixed pay on new quotes while retaining fuel compensation. They no longer describe live calibrated profit fractions.

| Baseline class | Generosity | Fuel compensation | Baseline net at par, as fraction of par fuel cost |
|---|---:|---:|---:|
| Ordinary freight | 0.85 | 0.40 | +0.25 |
| Premium freight | 1.20 | 0.25 | +0.45 |
| Workforce manifests | 1.25 | 0.20 | +0.45 |
| All passengers, including executives/custody | 0.50 | 0.60 | +0.10 |

Maximum fuel-compensation allowance is 2. Passenger selection overrides the premium set, so executive delegations do **not** currently receive premium-freight terms. Net figures exclude handling/comfort penalties and maintenance. The proposed level-1 routine category uses freight with higher median credit earnings, but not a guarantee that every posting pays more than every basic job.

## Earlier proposed eligibility and work classes — not the runtime economic gates

| CHR level | Newly available work |
|---|---|
| 0 — Unverified Asset | Basic routine industrial supplies/exports, oxygen/hydrogen, ordinary equipment and medicines; generic workforce intake provisionally remains here pending its context review |
| 1 — Verified Asset | Better-paid routine premium freight **and**, separately, important custody/labor operations and entrusted local corporate records/audit work |
| 2 — Trusted Instrument | Premium shareholder/central legal deliveries and executive delegations |
| 3 — Friend of the Board | Special quests only; no new generic contract class required |

Suggested exact existing families:
- **Level-1 elevated routine:** `local-rare-metal-export-staging`, `local-carbonvale-export-staging`, `local-paradiso-hospitality`, `rare-metals-to-gaia-tech`, `rare-metals-to-foundry`, `paradiso-hospitality-cargo`. Maintain standing, but do not advance 1→2. Current median earnings are 329,527 cr versus 133,534 cr for basic freight, with overlapping ranges; the percentage terms alone are not a credit guarantee.
- **Level-1 important custody/labor:** `custody-transfer-to-olympos`, `local-custody-processing`, `surface-labor-allocation`, `local-surface-labor-processing`, plus `local-workforce-manifests`.
- **Level-1 important corporate records:** `local-shareholder-packets`, `local-legal-archives`, `local-audit-records`, `audit-records-to-acheron`. This is the proposed alternative route to level 2 without directly transporting captive labor. Advancement importance is not automatically Combine-hostile impact.
- **Level-2 premium:** `shareholder-packets-to-finance`, `legal-archives-to-capital`, `executive-delegation`. Keeping the local records/audit classes at 1 avoids requiring level-2 work to earn 2.
- Remaining current ordinary industrial/medical/logistics templates stay level 0. The ambiguous `workforce-transfer-to-hub` remains non-advancing above 1 and carries no new Combine penalty pending review. Its generic label does not establish consent; **do not rewrite coerced work as voluntary recruitment**.

## Previous fee suggestion translated into credits — not selected targets

The earlier coefficient suggestions are retained only as comparison, pending a credit-first balance decision. On the same sampled postings they would produce:

| Class | Current median | Earlier suggestion's median | Earlier suggestion's range |
|---|---:|---:|---:|
| Important custody/labor passengers | 55,800 cr | 195,300 cr | 152,074–416,787 cr |
| Level-2 shareholder/central legal freight | 246,236 cr | 410,393 cr | 149,507–704,235 cr |
| Level-2 executive delegations | 75,900 cr | 455,400 cr | 351,734–562,405 cr |

These came from generosity/compensation .75/.60, 1.50/.25 and 1.00/.60 respectively; they are **not approved earnings targets**. Other classes were unchanged in that suggestion. Next select the desired credit earnings, then decide whether existing classes/terms achieve them. This older fee suggestion authorized no fee change; the subsequent approved credit calibration supersedes it for new postings only, never historical quotes.

## Proposed reputation parameters — subsequently adopted

Use the Combine baseline initially:
- **0→1: two successful CHR contracts, +0.5 each**, capped at 1 for the award.
- **1→2: fifteen important contracts, +1/15 each**, capped at 2; only the important families above qualify. Elevated routine freight maintains standing, despite its better pay.
- **2→3: special quests only**; rewards/content remain to be authored. Ordinary premium level-2 work maintains, not advances, standing.
- Every successful CHR job resets CHR grace. **K=5** unrelated completed jobs; from the sixth, **D=1/30**, bounded by the current integer floor. Empty travel/personal passage excluded; failure/abandonment/retry produces no award or new penalty under this baseline.
- No point transfer from corporate-recognition recipients, no automatic simultaneous donor gains, no changes to other factions' counters until their own rules are authored.

## Rivalry and commitment

- **No ordinary CHR penalty for Combine work**, including Combine level 3. Keep the stated indifference; no invented reciprocal refusal. Future authored sabotage/defection outcomes could have explicit CHR consequences, but none are selected here.
- The four explicit custody/labor families already cost Combine 0.20; workforce manifests cost 0.10, normally floored at 1. Routine exports, medicines and corporate records have no automatic direct Combine penalty. Do not use profit, Acheron/Pandemonium destination or mere importance as a substitute for authored political impact.
- CHR level 3 already blocks new Combine contracts. This is separate from reducing/truncating stored Combine reputation. No docking, maintenance or general travel ban. Persistent quest allegiance/recovery remains open.
- Once CHR's own effects are authorized, acceptance can show **both** improvement with CHR and loss with Combine using the same neutral computer templates. Do not show hypothetical CHR improvement before implementation.

## Review resolution and remaining work

The implemented pass adopts records/audits as an alternative to direct custody/labor participation. Earnings and trust independently govern access; the former cargo-family table is not the economic policy. Generic workforce intake remains contextually ambiguous and mechanically routine, with no new disapproval. Future quests, political commitment/reinstatement, broader-epoch balance and full-campaign pacing remain open. Houses are next.
