# All-contract reputation / income coverage audit

Updated: 2026-11-04 (Pacific)
Status: **Pete approved all recommendations and requested implementation; all 34 paid providers now have runtime gates and calibrated new quotes.** Guild skim work uses commercial targets; all five civilian pools read Institutions. See [rollout validation](reputation-rollout.md). The audit below records the earlier gap, not current runtime omissions.

Status at audit (historical): **Audit and gap-closing policy, not live enforcement.** Pete approves the [remaining-stage pack](faction-reputation-remaining.md) and directs auditing all contracts, specifically requiring expensive Gaia/Dahai-origin civilian work to use GOV reputation and similar income limits. This supersedes the previous design exclusion of those civilian pools. Only Combine/CHR runtime gates currently exist; a complete review is not a complete rollout.

## Finding: the civilian loophole is real

Production maps 28 of 34 public providers to reputation recognition and income calibration. **Five civilian pools and the Guild are excluded from both**, not just from their own reputation meters. In addition, 26 mapped employers have reviewed but not yet implemented gates. Thus many contracts remain freely available regardless of quoted profit, even though their intended progression is approved.

Reference census: **29,687 public-board appearances, all 34 providers, days 0–15**. Fresh independent census: **29,648 appearances, all 34 providers, days 160–175**. A current zero-standing career lacks reputation locks on **24,954 / 24,735** offers that the full policy would classify above level 0 using their *current* quoted income/trust. This is a gate-coverage finding, not the number that should be removed from boards: prospective repricing changes the bands, and locked offers stay visible.

| Previously excluded provider | Reference appearances | Current median net at par | Current maximum net | Current quotes requiring 0 / 1 / 2 under proposed limits |
|---|---:|---:|---:|---|
| Gaia civilian bookings | 3,529 | 102,060 | 310,209 | **0 / 1,279 / 2,250** |
| Dahai civilian bookings | 3,084 | 89,908 | 299,163 | **20 / 1,102 / 1,962** |
| Camps civilian bookings | 1,182 | 68,800 | 186,611 | 105 / 587 / 490 |
| Sahra civilian bookings | 632 | 39,201 | 303,094 | 214 / 296 / 122 |
| Weymark independent operators | 329 | 33,396 | 72,732 | 101 / 228 / 0 |
| Guild paid operations | 736 | 48,754 | **17,605,862** | 258 / 272 / 206 |

Gaia/Dahai median **gross** payments are 604,800 / 539,448, but a large part covers fuel. Approved limits are **net at par**, not gross cash receipts. Gross alone must not turn a fuel-heavy low-profit job into high-level work. Conversely, these civilian net figures confirm that the present problem is not merely fuel reimbursement making the headline look large.

Simply applying locks to old prices would leave **no Gaia civilian entry job**, and only 20 of 3,084 Dahai jobs at level 0. New-offer calibration and earning paths must accompany the gates. Accepted quotes/history remain unchanged and accepted jobs are not retroactively cancelled.

## Coverage rules — all paid contracts, explicit noncommercial exceptions

**Level 0 is a real eligibility band**, not an omission. Making every contract require positive reputation would eliminate the route to earning it. Every paid offer needs an assigned recognition rule, net-income band and authored trust minimum where applicable. Unknown providers/templates must fail the audit, not silently default to unlocked.

| Contract set | Recognition / gate | Income and earning treatment |
|---|---|---|
| Named faction jobs, including those originating on Gaia/Dahai | Existing own/shared faction rule; economic AND authored trust minimum | Keep approved faction-specific targets/classes/earning. Location does not override issuer. |
| Gaia and Dahai civilian bookings | **GOV = shared Estella Institutions**; minimum 0/1/2 from quoted net | User-directed gate/limits: **5k/50k/100k** medians, **27.5k/75k** ceilings, approximate 20/60/20. Independent issuers remain independent. |
| Camps/Sahra/Weymark civilian pools | Recommend the same **Institutions recognition** rule | Same 5k/50k/100k limits, separately fitted provider curves. This extends the all-contract requirement consistently; not a government ownership claim. |
| Paid Guild freight/passengers, including skim work | Recommend capped **commercial recognition maximum** | Audit candidate uses existing other-commercial **8k/75k/125k**, ceilings **40k/100k**. **Guild pay extension needs explicit confirmation**, especially skim rates; see below. No Guild meter or political grind. |
| Twelve inherited noble/commercial providers | Approved House/corporate maximum rules | No new meter, donor credit or donor counter reset. Existing approved income targets. |
| Guild certification/checkrides | Explicit reputation minimum **0**, existing progress/certification requirements | Preserve authored pay/reimbursement; not ordinary income calibration. No new reputation reward. Do not gate the license behind work that requires it. |
| Old Nell travel/checkride transfer | Explicit transit exception, existing tutorial/basic-certificate requirements | Preserve its special transport settlement, not a paid job or reputation-earning shortcut. |
| Empty repositioning | Explicit non-employment exception | No pay; existing equipment/fuel/private-arrival requirements still apply. |
| Nunes Inquiry delivery | **Trust 1**, not exempt from access | Preserve 20k reward/fuel/progress terms as an income exception; it is not a reputation-gate exception. No passive Inquiry/closure reputation gain. |

For civilian recognition, recommend **read-only use of Institutions**, not awarding GOV points for delivering groceries, transporting private tourists or visiting a government-owned port. Ordinary civilian work does not refresh the Institutions counter either. Earn Institutions through actual GOV/EDF/EIP contracts, with the approved two-job introduction and important-work advancement. This follows the recipient model already approved for commercial and lesser-noble employers. Mixed pools retain their actual issuers; no new standing meter or implied public appointment.

Likewise, Guild paid operations would recognize external commercial reliability without awarding arbitrary corporate donor points. Existing qualifications remain independent: volatile precursor freight still needs `volatile-cargo`, passengers need their existing qualification/accommodation, and skim work still has its actual physical demands. A certification badge is not a replacement for income-based reputation access on profitable operational work.

These new civilian/Guild recognition policies are distinct from attribution. **Never infer GOV work just from a Gaia/Dahai endpoint**: Kisaragi, Daedalus, CHR, Houses, EIP, EDF, Merren and other named issuers keep their existing rules, including return legs. Civilian pool identity applies consistently to its inbound and outbound bookings.

## New-pool fixed-curve projection

Read-only per-provider fits use days **0–15**, never live board ranks. Existing actual-fuel ratios/caps stay unchanged; fixed pay becomes `target net + par fuel − reimbursement at par`. Existing accepted quotes are not reconstructed with these curves. All eighteen new-pool reference band medians hit their selected targets exactly; tied workloads remain together.

| Provider | Reference mix 0/1/2 | Fresh days 160–175 mix | Fresh medians | Fresh public starter freight |
|---|---|---|---|---:|
| Gaia civilian | 20.2/59.8/20.0 | **20.0/60.1/19.9** | **5,000 / 50,000 / 99,997** | 112 |
| Dahai civilian | 20.0/60.1/20.0 | **19.2/60.1/20.7** | **5,000 / 50,000 / 100,113** | 162 |
| Camps civilian | 20.0/60.0/20.1 | 20.2/60.8/19.0 | 4,998 / 50,000 / 100,010 | 110 |
| Sahra civilian | 21.2/58.7/20.1 | **0 / 78.9/21.1** | **absent** / 49,993.5 / 99,958 | **0** |
| Weymark independent | 21.9/57.1/21.0 | 22.0/55.6/22.4 | 5,000 / 50,000 / 100,000 | 16 |
| Guild operational candidate | 22.6/57.6/19.8 | 21.4/61.5/17.0 | 8,000 / 75,000 / 125,000 | 37 |

**Sahra is not rollout-ready:** the frozen short-window curve puts every observed fresh civilian posting above level 0. A reference fit with an exact median is insufficient. Broaden the fixed reference/validate new untouched windows and review local/public entry supply before enabling these locks. No per-board quota, random price splitting, forced new route or silent standing gift is justified by the shortfall. This adds to the previously reported GOV-provider calibration issue; it does not invalidate Gaia/Dahai's separately fitted curves.

**Guild requires a deliberate pay decision:** it was excluded from the approved median table, and current precursor work has exceptional authored rates. Applying the generic commercial candidate would reduce the reference maximum net from **17,605,862 to 266,295**. This report exposes that consequence; it does **not** silently approve or implement it. The paid Guild gate gap must be closed either with confirmed generic-commercial targets or an explicitly authored exceptional-pay policy with appropriate standing requirements. Leaving it unmapped is not an acceptable permanent resolution. Bootstrap/checkrides/Old Nell are not part of that commercial decision.

## Path audit — public boards are not the only entry point

- Freight and passenger boards both construct offers through `makeFactionContract`; the worker/fallback paths must use the same eventual quote/gate policy.
- `generateDirectoryEntryContracts` is a separate candidate path but uses that constructor too. Auditing only visible directory entries **misses the remote Gid tutorial feed**, reached through office actions. The audit therefore enumerates all mission-tagged entries across source/certification states, rather than assuming remotely hidden means unreachable.
- **43 contact/state appearances, nine unique identities** were generated: initial Still landing, Old Nell checkride transfer, Weymark landing, Nell's Rest return, line checkride, thin/thick atmospheric endorsements and the two ordinary Old Nell directions. These are synthetic eligibility states, not a flown tutorial. No positive-net-at-par contact-only bypass was found; existing fuel-efficiency settlement on checkrides remains separate from that metric. Old Nell's nominal quote can differ between tutorial and ordinary passage; preserve its special settlement rather than treating its quote as paid employment.
- Empty runs are made by `createEmptyRun`, outside public boards. They carry no employer or pay; the audit verifies the explicit exception without weakening existing private/contract-only arrival rules.
- Nunes Inquiries are on public boards but intentionally bypass ordinary **pricing** calibration. Their reviewed trust minimum must still be enforced. `contractIncomeMinimum` currently returns undefined for Inquiry-linked records; a future all-contract handler must not interpret that as authorization to skip their separate gate.
- Scene locks and the acceptance handler currently share `contractReputationLockReasons`; that function still authors **only Combine/CHR**. The full rollout must add policy there, not just draw lock labels on boards. Recheck current standing when accepting; honor the offered quote and existing accepted bookings. Current refusal rules remain separate from satisfying a minimum.
- This audit does not introduce a counter exemption for certifications. Existing unrelated-completion behavior is distinct from a zero-standing bootstrap gate; no silent decay-rule change is bundled into this coverage pass.

## Validation, approval ledger and rollout conditions

- **206,098 checks / 63,800 raw candidates / 7,427 actual day-0–3 board postings**, covering all 34 public providers, plus 43 contact/state appearances, all nine bootstrap/transit identities and an actual generated empty run. Tests cover quoted thresholds/equality, issuer-vs-location attribution, Inquiry exception, unknown-policy rejection, current live-gate gaps, immutable quotes/cargo/fuel terms and exact proposed net reconstruction.
- Typecheck, existing standing/Combine/CHR tests (10,046 / 9,260 / 2,009), income (44,245) and the remaining-stage review (157,388) pass. These do not imply the planned gates are implemented.
- Tools: `tests/audit-contract-gate-coverage.ts`, `tests/run-contract-gate-audit.mjs`, `tests/contract-gate-coverage.test.ts`. Reproduce with `node tests/run-equipment.mjs tests/contract-gate-coverage.test.ts`; runner takes `--reference FILE --covenant-reference FILE`, optional `--input FILE`, `--first-day N --days N`, `--save-census FILE` (refuses overwrites).
- Full projection reuses the approved House/VHM/KIS/Covenant/remaining-stage classifications/refits, rather than auditing only the new pools. Reference uses retained census days 0–15 at reconstructed current prices; the full days 160–175 census is freshly generated. Temp `contract-gates-20261104-{reference,fresh}-final.json` and `contract-gates-20261104-fresh-census.json` preserve evidence. Earlier non-final reports missed the three direct Gid flight practicals; final reports include them.
- **Approved now:** the previous combined-stage design, plus the requested Gaia/Dahai GOV-recognition/income-limit direction. **Additional recommendations:** extend Institutions recognition to the other three civilian pools; use commercial recognition for paid Guild operations, with its pay scope explicitly unresolved. No government ownership, donor-point transfer or new Guild meter follows.
- **Before rollout:** resolve Sahra's missing entry band and GOV's earlier income drift; settle Guild pay treatment; validate actual institutional/corporate earning and funded positioning routes. Ship new pricing, earning and real acceptance gates together. Preserve accepted quotes, refunds/fuel caps, Inquiry state, certification progression, private access, maintenance, source identities and concurrent weather work.
- Audit-only changes: no production gates/prices, live-save edits, browser/mobile testing, push or deploy. No claim that all contracts are already gated or that sampled opportunities establish a funded campaign.
