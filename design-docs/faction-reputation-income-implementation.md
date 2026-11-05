# Income calibration — first runtime pass

Updated: 2026-11-04 (Pacific)
Current implementation: **Full approved reputation/income rollout is live for all 34 public providers.** Ordinary pricing now uses [fixed origin markets and employer fee anchors](contract-income-origins.md) (`0c6c7dc`), following Fuyuan's missing-entry report. This increases lower-band freight supply without changing reimbursement, trust or accepted quotes. See [current fit, tests and remaining balance sensitivity](reputation-rollout.md). The following first-pass/audit entries are retained history; their six-pool exclusions and deferred gates no longer describe runtime.

Initial implementation: **`c8037f5` — new-posting prices live.** Subsequent **CHR progression/gates/refit `7992ffb`** is live; only the remaining factions stay deferred. [Current Cerberus ledger](faction-reputation-cerberus.md). Pete authorized proceeding after approving the [medians](faction-reputation-income-targets.md), [caps and 20/60/20 mix](faction-reputation-income-calibration.md). No push/deploy or live-save edits.

## Coverage follow-up — November 4, audit only

Pete approves the remaining-stage design and directs GOV/Institutions gates and similar income limits for Gaia/Dahai civilian bookings. The [all-contract audit](contract-reputation-coverage.md) accounts for all 34 public providers plus direct/contact, certification and transit paths. It confirms that the six excluded paid pools are a live coverage gap, not an enduring permission to bypass reputation. Gaia/Dahai candidate medians are 5k/50k/100k with 27.5k/75k ceilings; additional civilian/Guild recommendations, Sahra entry-supply failure and the Guild's exceptional-pay decision are explicit. Production scope below remains historical/current runtime, not a claim these extensions have shipped.

## Follow-up — Cerberus `7992ffb`

Nine important CHR families now pay 20k net and require level 1; they are excluded from the commercial mix. Three entrusted commercial classes require level 2 and share a premium curve with high-earning ordinary freight. Only CHR is refitted; other employer prices remain unchanged. Reference mix 20.7/59.6/19.7 with exact 20k/200k/300k medians; fresh days 48–63 mix 17.4/61.6/21.0, medians 19,994/200k/299,845.5. Important pool is separate (240 reference / 213 holdout, all 20k and minimum 1). Full implementation and tests are in the linked CHR ledger. The following statistics retain the **original first-pass** evidence, not the later refit's results.

## Initial runtime scope

- `src/contract-income.ts`: 22 approved target rows, midpoint economic boundaries, independent trust-minimum calculation, and route/load-to-net-credit pricing. Stable provider IDs only; no invented smuggling organization.
- `src/contract-income-curves.ts`: independent fixed workload curves for 28 existing providers. Same targets/standing do not merge their economies. Ordinary commercial pools aim at 20/60/20; direct VHM/Kisaragi work is a single paid pool with the authored level-2 minimum in the shared calculation. Combine exports are a separate 30k pool.
- Only `makeFactionContract` applies calibration, while constructing a **new** quote. Worker and synchronous fallback share that path. No repricing on acceptance, phase retry, settlement or career load. No new save field/key/schema/version.
- New fixed completion pay is `target net + par fuel − reimbursement at par`. Encoded using existing pay fields (`generosity=0`, `flatReward=fixed completion pay`); this is a **route-specific quoted amount**, not one universal flat fee. Compensation ratio/cap, route, transfer, manifest, IDs, seeds, posting order, likelihoods and visibility remain unchanged.
- **Reviewed ordinary fee replacement:** Alvares liege/occasion fees, Mendes muster fees, ordinary Nunes watch/recovery/custody fees, Accord warrants, other noble household fees and Daedalus Icarus ordinary fees are baseline authoring inputs, not extra bonuses on top of calibrated new quotes. The new fixed component replaces their old fixed-pay calculation. Historical accepted fees remain exact. Nunes Inquiry-linked rewards are excluded and unchanged. No fee text quoting a superseded amount was found in these generated descriptions.
- Combine internal/import/own-pilgrimage work stays zero-fee with existing reimbursement. Only newly quoted exports replace the old 0.15 generosity with the 30k-centered credit curve. Their trust minimum 2, progression, grace, rivalry and refusal remain live and unchanged.
- Guild, mixed civilian booking pools, empty runs, Old Nell and Nunes Inquiry-linked work stay outside calibration. Smuggling targets exist as approved design data only; no contact jobs or personal-trust system are invented.

**Staging:** the first pass left non-Combine gates off to avoid locking work without earned progression. Cerberus now has progression and live gates; Houses and the remaining entities now have design reviews, with the final public-employer stages batched in [the remaining-stage pack](faction-reputation-remaining.md). Their selected important classes remain in ordinary production commercial pools until authorized rollout/refit; review projections do not change current prices. Audit tiers outside Combine/CHR are planned-access classifications, not a claim that all gates are live.

## Fitting and variation

Fixed reference: actual public freight/passenger boards, 175 canonical source IDs, world days 0–15. Equal weight per posting occurrence, not per unique route or pilot hour. Separate curves per provider; reference input is quoted par fuel workload. Cut positions approximate cumulative 20% and 80% without splitting equal-workload groups. Within-band median plateaus cover both middle observations of an even sample. Cubic shoulders flatten around each target median to reduce excessive fee changes from small transfer/load variation. Premium tails grow logarithmically; single-band pools use a square-root lower tail and logarithmic upper tail. There is no universal level-2 payout cap.

Days 16–31 exposed starter-price drift under the initial linear curve and informed that generic smoothing choice. **Days 32–47 were then generated as a fresh holdout.** No live-board refitting, randomized surcharges, rank-dependent prices, changed job selection or hard board quotas.

| Sample | All postings | Ordinary mix 0 / 1 / 2 | CHR medians 0 / 1 / 2 | Combine export median |
|---|---:|---|---|---:|
| Reference 0–15 | 29,687 | 20.3% / 59.8% / 19.9% | 20k / 200k / 300k | 30,000 |
| Tuning check 16–31 | 29,646 | 21.4% / 59.4% / 19.2% | 24,381 / 200k / 300k | 29,686 |
| Fresh holdout 32–47 | 29,626 | 21.8% / 59.3% / 19.0% | 20k / 200k / 300k | 29,714 |

All 78 populated reference-band medians match their approved targets exactly. The first 32-day before/after generated census preserves all **59,333 posting identities and fuel terms**, with 38,978 new quotes changed and 20,355 unchanged; final smoothing is also checked against that frozen census. The fresh holdout generates the final runtime code directly.

### Remaining balance limitations

- These are approximate offer proportions, not exact per-employer/per-board promises. Co-op's inseparable low-workload group gives **30.0/50.5/19.5** in the reference and **28.7/48.6/22.7** in the holdout. Do not hide it with random premiums or change existing identities just to force a percentile.
- Cinderhook, Glitterfield, Hartwell Labor Exchange, Mendes and tiny Roadstead pools show additional mix drift. Roadstead has no premium offer in the 32–47 sample; Glitterfield has 4.3%. Review broader epochs/seasonality before claiming long-run per-employer balance. GOV holdout entry median is 6,332 versus its 5k target; no other populated holdout median exceeds 25% deviation.
- Reference starter offers appear on 1,260 of 2,157 ordinary-offer source/day boards, across 97 sources. Caravanserai has 42 starter occurrences over those 16 days; CHR has 25 starter freight occurrences. Fresh holdout: 1,270/2,141 boards, 98 sources, 72 Caravanserai starters and 22 CHR starter freight occurrences. This is supply evidence, not proof of every license/equipment/faction onboarding route. Halloran, SSC and Labor Exchange entry offers are passenger-only in these samples; inherited standing is relevant when their gates are authored.
- Separate important-work classes, their low-pay spread and enough opportunities to earn 2 remain per-entity work. No CHR/House gains, rival penalties or quest requirements are silently selected here.

## Validation and reproduction

- `npm run test:income`: **44,209** checks; approved boundaries, all profiles/curves, monotonicity/ties, fuel caps and off-par behavior, independent trust floors, exclusions, legacy/new accepted quote settlement, failed save/retry and duplicate protection.
- `npm run test:reputation`: 10,045 standing + 9,264 Combine checks; menus 475,841 assertions / 4,434 scenes. Regional/history, presentation, empty-run, BAM/Acheron, maintenance persistence and mission-cost regressions pass; typecheck/build pass.
- `tests/contract-income-preview.html`: **28 native checks**, including real board worker/fallback equality; desktop screenshots inspected. Existing isolated constructed-Game Combine test still passes **41 checks** with new pricing. Synthetic profiles only.
- Historical snapshot JSON is unchanged. `tests/fixtures/pre-income-quotes.ts` reconstructs exact authored pre-calibration quotes, checks today's quote equals the approved transformation, then compares the full reconstructed board against its old fingerprint. No blanket quote exemption. Accepted historical records/quotes remain untouched.
- `npm run audit:income`: live days 0–31 census, fixed-fit/median assertions and per-provider warnings (several minutes). `node tests/run-income-audit.mjs --first-day 32 --days 16`: fresh holdout. `--fit` prints reference knots; `--input FILE` reuses an explicit census; `--project-new-quotes` explicitly labels a pricing projection; `--baseline FILE` verifies identity/fuel/authorized-pay preservation; `--save-census FILE` creates a non-overwriting artifact.
- Temp artifacts: `income-baseline-20261103.json`, `income-current-20261103.json`, `income-final-20261103.json`, `income-holdout-census-20261103.json`, `income-holdout-20261103.json`; `income-20261103-*.png`. The older Cerberus audit now reports original pre-calibration earnings separately from live prices and reconstructs its historical coefficient comparison correctly.
