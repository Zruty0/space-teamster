# Cerberus reputation — first parameter proposal

Updated: 2026-11-03 (Pacific)
Status: **Proposal only; not approved or implemented.** Pete authorized the Combine pass (`3e36373`) and requests the next entity. Cerberus is next, then Houses. Existing CHR contracts can already cause the reviewed Combine losses, but CHR's own gains/gates/pay remain unchanged. Framework: [progression](faction-reputation-progression.md); previous entity: [Combine](faction-reputation-combine.md).

## Latest direction — earnings-based access across all entities

Pete rejects current basic-freight earnings as too high for level 0: target median generally 10k cr, within 5k–20k across entities, with roughly 40k maximum even at Cerberus. More profitable ordinary shipments belong in higher access bands, based on expected credits rather than cargo/job type. Level-1 target medians reach 200k for wealthy entities; level 2+ is around 300k for high-paying corporations such as CHR/BAM. Follow-up places Halloran/Accord/Co-op at roughly half that scale, non-corporations lower still, and Combine exports at about 30k; the previous universal 300k interpretation is superseded. See the [cross-entity median table](faction-reputation-income-targets.md) for the requested draft; proposed CHR row is **20k / 200k / 300k**, not yet approved individually.

The old category table below is retained as an audit grouping and earlier proposal, **not the final economic gate policy**. Important jobs can pay at level-0 rates while requiring level 1: economic access **AND** authored trust. Advancement qualification remains independent of pay. Exact income boundaries, calibrated payouts and the low-paid onboarding supply still need agreement; no CHR runtime changes.

## Pay-review direction — expected earnings in credits at par

Pete redirects the review from percentages of par fuel cost to **expected earnings at par in credits**. Use the existing quote's `expectedMargin`: total contract pay including fuel reimbursement, minus fuel consumed at par. This excludes handling/comfort penalties, maintenance, positioning travel and the value of elapsed time. Do not treat it as gross pay or a guaranteed realized profit.

Choose/compare credit earnings first; coefficients are implementation details, not approved balance targets. This direction does **not** by itself select flat rewards, new absolute target bands, or an automatic change to current quotes.

### Measured current postings

Read-only audit at `9825058`: all 175 canonical navigation-source boards over world days 0–15, actual freight/passenger selection and preferred transfers. **787 CHR postings / 30 observed templates**. Each posting occurrence has equal weight; medians are not weighted by player travel time or unique routes. Class labels below use the still-proposed reputation grouping, not live CHR gates.

| Proposed work class | Postings | Current median net at par | Current observed range |
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

Reproduce: `node tests/run-equipment.mjs tests/audit-cerberus-earnings.ts`. The audit also reports per-template distributions and converts the previous unapproved coefficient proposal to credits. Full local output: Temp `cerberus-earnings-20261103.json`. No runtime or save changes.

## Existing source facts — implementation details

`src/content/estella/faction-contracts/cerberus-contracts.ts` distinguishes ordinary freight, premium corporate/extraction freight, workforce manifests and passenger work. Stable issuer is `cerberus-human-resources` / CHR.

| Current class | Generosity | Fuel compensation | Net at par, as fraction of par fuel cost |
|---|---:|---:|---:|
| Ordinary freight | 0.85 | 0.40 | +0.25 |
| Premium freight | 1.20 | 0.25 | +0.45 |
| Workforce manifests | 1.25 | 0.20 | +0.45 |
| All passengers, including executives/custody | 0.50 | 0.60 | +0.10 |

Maximum fuel-compensation allowance is 2. Passenger selection overrides the premium set, so executive delegations do **not** currently receive premium-freight terms. Net figures exclude handling/comfort penalties and maintenance. The proposed level-1 routine category uses freight with higher median credit earnings, but not a guarantee that every posting pays more than every basic job.

## Proposed eligibility and work classes

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

These came from generosity/compensation .75/.60, 1.50/.25 and 1.00/.60 respectively; they are **not approved earnings targets**. Other classes were unchanged in that suggestion. Next select the desired credit earnings, then decide whether existing classes/terms achieve them. No fee model change, blanket raise, new flat reward or historical quote rewrite is authorized.

## Proposed reputation parameters

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

## Review focus

The main eligibility choice is whether entrusted corporate records/audits should also advance 1→2, allowing a non-custody route to Trusted Instrument, or whether CHR should demand direct custody/labor participation. Recommend the former: commercial trust and explicitly hostile labor work remain distinct. First review the cross-entity median table and earnings-based access boundaries, then calibrate fees/low-paid onboarding and important-work requirements. Also settle generic workforce-intake context before implementation. The earlier cargo-family grouping must not silently become the income gate. Houses follow this review.
