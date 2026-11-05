# Origin-aware contract income

Updated: 2026-11-04 (Pacific)
Status: **Implemented in `0c6c7dc`.** Pete asks to fix Fuyuan's missing tier-0 work and permits generosity adjustments to increase lower-band supply. This supersedes provider-wide workload ranking for ordinary local-market pricing; [the reputation rollout](reputation-rollout.md) remains authoritative for earning, trust and settlement.

## Diagnosis and implementation

Before this change, Fuyuan had **zero tier-0 offers in 308 postings across eleven dates**. Its cheapest day-0 civilian work cost 639,636 fuel credits at par and paid 65,120 net, while the provider's entry-workload cutoff was only 169,252.5. Employer-wide statistics compared expensive surface launches against cheap departures elsewhere. Correct aggregate medians did not establish usable local entry supply.

New ordinary pricing separates three things:

1. **Local workload bands:** fixed references for **226 physical departure markets**, freight/passengers separately, pooled across ordinary trust-zero issuers. Directory aliases share a market; surface and orbital ports do not. Important/entrusted/direct-parent assignments retain their separate policies.
2. **Stable route/load effort:** **2,393 directed route references** give fuel workload per loaded tonne. Multiplying by the quoted load measures relative effort without letting today's launch window push all known starter routes upward. This is a pricing reference, not a replacement fuel estimate or a new physics model.
3. **Employer-specific fees:** after local band selection, separate employer median anchors reproduce the approved net-at-par targets. Thus institutions, Houses, corporations and independent shippers keep their own pay scales and recognition rules; sharing a market does not merge employers, ownership or earning attribution.

Selected local routine-market planning shares are **30/50/20 for freight**, with an entry buffer, and **20/60/20 for passengers**. Entry cuts round upward to whole workload groups. These are fixed-reference targets, **not quotas on each daily board**. One/two-group markets cannot honestly support three distinct bands and remain entry markets. This intentionally increases lower-band supply relative to the earlier system-wide 20/60/20 aim; most commercial postings still land in band 1. Small/tied pools and authored trust floors cause deviations.

The new fee can rise or fall relative to the old network curve. It is not a blanket discount. A rejected discount-only candidate produced roughly 41/50/9, undesirably hollowing out premium work; a provider-by-origin fit also overfragmented small markets. Those were development experiments, not the shipped rule.

**Covenant exception:** its separately reviewed provision/import curve is retained unchanged. Naively pooling its bulky imports removed all public introductory freight in a check window; a partial discount ceiling also depleted its premium pool. Preserve the approved public import on-ramp and compact 5k/25k/50k economy rather than inventing new access, cargo, or trust exceptions. Covenant important work remains 5k/trust 1. **Near-star Guild programmes** (`skim-precursor-alpha`, `skim-precursor-beta`, `balor-skim-*`) also retain their existing calibrated network rates: sparse single-programme departures must not turn approved risk premiums into 8k starter pay. This does not restore the old multimillion-credit generosity. Programme exceptions are excluded from fitting new employer fee anchors. Combine, direct VHM/KIS, entrusted CHR/Daedalus, all important pools and Inquiry financial terms are likewise unchanged.

## Pay and compatibility

- Fee/generosity changes occur only when constructing **new quotes**. `fixed pay = target net + current par fuel − reimbursement at par`. The existing `generosity=0` plus route-specific `flatReward` encoding carries that adjustment.
- Actual par fuel, selected transfers, actual-fuel reimbursement ratios/caps, cargo/handling, IDs, seeds, posting order and qualifications are unchanged. High fuel pass-through can still produce large gross payments on a tier-0 job.
- Existing quoted income still determines its gate. **No repricing on acceptance, retry, settlement or career load**; already accepted work stays payable. No save schema/key/metadata migration or donor-point grants.
- Local pricing never overrides authored trust or political refusal. Low-paid important work still requires trust 1; private/contract-only arrivals remain governed by existing access rules.
- Previously cached board offers retain their old quotes. Reload at a terminal to clear the in-memory board/worker cache and see newly generated prices; do not reset the career or edit its save.

## Evidence

Fixed reference: **88,981 actual-board appearances**, days **0–31 and 160–175**. Generated fit provenance and reference days are embedded in `src/contract-income-origin-curves.ts`. No fitting runs in the game. `src/origin-income-math.ts` contains only pure band/fee evaluation; `contract-income.ts` applies it in the existing new-quote constructor.

Development checks included cached days 32–47, Fuyuan/Dahai probes through day 1000, and days 256–287. Final validation uses a new **288–303 census, 29,851 appearances**, not used for fitting local reference knots or employer anchors. Final report reconstructs current quotes from that census after restoring Covenant's unchanged prior pricing and protecting the Guild's already-calibrated near-star risk premiums.

- **Fuyuan:** tier-0 work every validation day: **3–11 total, including 1–5 freight**. No additional cargo/passenger license is needed for some starter freight on 15/16 days; existing Line authority/equipment requirements still apply.
- **System-wide commercial mix:** **29.0/50.9/20.2** (rounding totals). This is increased entry supply, not a claim the former 20/60/20 target was met unchanged.
- **Public-location check:** 113 active public origins / 1,738 observed port-days. Among dates with ordinary freight eligible for local repricing, completely starter-free boards fall from **718 to 79**. Counts use one representative board per physical port/day; appearances are not unique consignments or guaranteed hourly income.
- **Covenant:** all **14 previously observed public starter freight** remain available; final commercial bands have 14/58/14 offers with medians **4,951 / 25,000.5 / 50,122.5**. Other earning tracks also retain observed public starter freight (VHM through BFS, Kisaragi through KIS-E, Institutions through GOV/EDF/EIP).
- **Known limits:** board selection is unchanged. Sparse ports and isolated dates can still lack starter work. A distant day-1000 Fuyuan probe has seven passenger starters but no starter freight; this is not concealed as a universal daily guarantee. One previously unrepresented market (`estella-xc-castle-alvares|freight`) uses the prior provider fallback; 120 unrepresented route pairs use actual quoted workload within their known local market. Audits expose both fallback lists.
- **57,488 new checks / 3,718 actual postings** cover fixed targets, monotonic bands, physical aliases, high-fuel entry stability, real zero-standing acceptance, unchanged important/entrusted/Covenant terms, actual-fuel compensation, old high quotes, failed saves/retries/stale callbacks and quote immutability.
- Income, reputation, complete rollout/coverage and all faction-review guards pass; historical Gaia/Dahai/Camps/Sahra/Weymark/Farwatch/Barataria/Thule/Balor, empty-run, presentation, maintenance-persistence and menu tests pass without fixture exemptions. Typecheck/build pass; existing Vite/chunk warnings remain.
- Disposable desktop Edge: **1,900 checks / 1,857 offers**, eight-source real Worker/fallback parity including Fuyuan, real entry acceptance/launch/par settlement, failed-save/retry/reload regression and inspected screenshot. Fuyuan frozen seafood to Roadstead: **5,000 net**, unchanged **639,636 par fuel / 45% reimbursement**, accepted at zero standing. No live-save/mobile/push/deploy changes or flown-campaign claim.

## Reproduce and next balance work

- `npm run test:income-origins`
- `npm run audit:income-origins -- --first-day N --days N --save-census NEW.json` audits the shipped fixed data; no reference argument required.
- `npm run audit:income-origins -- --input CENSUS.json` audits an existing census at reconstructed current quotes.
- Offline refit only: `--reference FILE[,FILE] --input-reference --save-curves NEW_FIT.json`.
- Publish an explicitly reviewed fit with `node tests/write-origin-income-data.mjs FIT.json OUTPUT.ts`; overwriting requires `--replace`. Never regenerate source data from a live player's board.

Temp evidence: `origin-income-programme-safe-fit.json`, `origin-income-release-reference-report.json`, `origin-income-validation-census.json`, `origin-income-final-report.json`, earlier `origin-income-*development*` reports, `check-origin-income-live.mjs`, `origin-income-fuyuan-live.png`. Prior reputation route-smoke capital/time figures predate this repricing and are not current campaign balance evidence.

Next simulations should measure affordable **qualified** freight, public faction introductions, return journeys, realistic fuel use/maintenance and cash flow—not just total tier-0 counts. Address remaining sparse-market gaps through explicit content/selection decisions or further reviewed calibration, not hidden board quotas, arbitrary reputation gifts or altered historical quotes.
