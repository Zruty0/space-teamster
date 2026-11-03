# Cerberus reputation — first parameter proposal

Updated: 2026-11-03 (Pacific)
Status: **Proposal only; not approved or implemented.** Pete authorized the Combine pass (`3e36373`) and requests the next entity. Cerberus is next, then Houses. Existing CHR contracts can already cause the reviewed Combine losses, but CHR's own gains/gates/pay remain unchanged. Framework: [progression](faction-reputation-progression.md); previous entity: [Combine](faction-reputation-combine.md).

## Existing source facts

`src/content/estella/faction-contracts/cerberus-contracts.ts` distinguishes ordinary freight, premium corporate/extraction freight, workforce manifests and passenger work. Stable issuer is `cerberus-human-resources` / CHR.

| Current class | Generosity | Fuel compensation | Net at par, as fraction of par fuel cost |
|---|---:|---:|---:|
| Ordinary freight | 0.85 | 0.40 | +0.25 |
| Premium freight | 1.20 | 0.25 | +0.45 |
| Workforce manifests | 1.25 | 0.20 | +0.45 |
| All passengers, including executives/custody | 0.50 | 0.60 | +0.10 |

Maximum fuel-compensation allowance is 2. Passenger selection overrides the premium set, so executive delegations do **not** currently receive premium-freight terms. Net figures exclude handling/comfort penalties and maintenance. The proposed level-1 routine category below uses existing better-paid freight rather than inventing a blanket rank raise.

## Proposed eligibility and work classes

| CHR level | Newly available work |
|---|---|
| 0 — Unverified Asset | Basic routine industrial supplies/exports, oxygen/hydrogen, ordinary equipment and medicines; generic workforce intake provisionally remains here pending its context review |
| 1 — Verified Asset | Better-paid routine premium freight **and**, separately, important custody/labor operations and entrusted local corporate records/audit work |
| 2 — Trusted Instrument | Premium shareholder/central legal deliveries and executive delegations |
| 3 — Friend of the Board | Special quests only; no new generic contract class required |

Suggested exact existing families:
- **Level-1 elevated routine:** `local-rare-metal-export-staging`, `local-carbonvale-export-staging`, `local-paradiso-hospitality`, `rare-metals-to-gaia-tech`, `rare-metals-to-foundry`, `paradiso-hospitality-cargo`. Maintain standing, but do not advance 1→2. Existing 1.20/0.25 terms already pay more than basic freight.
- **Level-1 important custody/labor:** `custody-transfer-to-olympos`, `local-custody-processing`, `surface-labor-allocation`, `local-surface-labor-processing`, plus `local-workforce-manifests`.
- **Level-1 important corporate records:** `local-shareholder-packets`, `local-legal-archives`, `local-audit-records`, `audit-records-to-acheron`. This is the proposed alternative route to level 2 without directly transporting captive labor. Advancement importance is not automatically Combine-hostile impact.
- **Level-2 premium:** `shareholder-packets-to-finance`, `legal-archives-to-capital`, `executive-delegation`. Keeping the local records/audit classes at 1 avoids requiring level-2 work to earn 2.
- Remaining current ordinary industrial/medical/logistics templates stay level 0. The ambiguous `workforce-transfer-to-hub` remains non-advancing above 1 and carries no new Combine penalty pending review. Its generic label does not establish consent; **do not rewrite coerced work as voluntary recruitment**.

## Proposed fees

Retain basic and elevated routine freight terms, manifest terms and compensation caps. Suggested targeted changes only:
- Important custody/labor passengers: **generosity 0.75 + compensation 0.60**, net +0.35 at par instead of +0.10. This gives the higher-trust passenger work an actual premium rather than assuming that its existing fee is high.
- Level-2 shareholder/central legal freight: **1.50 + 0.25**, net +0.75 instead of +0.45 at par.
- Level-2 executive delegations: **1.00 + 0.60**, net +0.60 instead of +0.10 at par.

These are initial balance suggestions, not selected amounts or runtime changes. No blanket raise on level-0 jobs, new flat fee, new commodity, procedural emergency or historical quote rewrite.

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

The main eligibility choice is whether entrusted corporate records/audits should also advance 1→2, allowing a non-custody route to Trusted Instrument, or whether CHR should demand direct custody/labor participation. Recommend the former: commercial trust and explicitly hostile labor work remain distinct. Confirm the higher routine/premium split, targeted fee suggestions and generic workforce-intake context before implementation. Houses follow this review.
