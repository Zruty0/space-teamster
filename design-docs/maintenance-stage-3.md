# Maintenance Stage 3 — everyday coverage rollout

Updated: 2026-10-27
Status: approved copy implemented in `c4dd734`; **stop for Stage 3 rollout review before Stage 4**.

Pete explicitly approved the [complete copy review](maintenance-stage-3-copy-review.md) and requested implementation. No new prose was invented during rollout; the approved 49 shared sets and 15 retained authored sets remain the copy contract.

## Live coverage

| Internal class (never displayed) | Physical locations |
|---|---:|
| Basic mechanic | 57 |
| Professional workshop | 90 |
| Full-service pilot: Nell’s Rest | 1 |
| Existing elites: Bruckner and Serrat | 2 |
| Emergency self-help only | 9 |
| **Total** | **159** |

All 177 operational receiving IDs resolve to exactly one local service entry. There are **150 staffed facilities**, up from 66: 84 previously emergency-only locations now have the approved ordinary service. Another 25 existing Wells fallback accounts become professional workshops; the other 26 Wells basics retain their scarcity markup and 0.8 honesty.

The nine permanent emergency-only sites remain unstaffed. Science-cell, commune, Merren, institutional, beacon, Pandemonium and Warren variants use precisely the approved prose; no new named NPCs, shipping providers, hidden-site discoveries or arrival permissions are added.

## Service and compatibility boundaries

- General basics: E/F diagnosis/work, F stock, 250 cr/hour, 1.15 parts markup, honesty 0.95. Wells basics retain the 1.5 markup and 0.8 honesty.
- New/promoted professionals: C/D diagnosis/work, D stock, 500 cr/hour, standard time/parts multipliers and honesty 1. All four existing optional equipment installations are offered under their existing prerequisites.
- All 15 authored businesses, including the three Weymark pilot shops, retain their established terms and text. Red Dust remains deliberately dishonest. Cadiz still has C-quality work.
- All 63 original staffed accounts and the three pilot accounts retain their IDs. Shared prose does not share inspection reports or credits. No policy-version or save-migration machinery was added.
- Universal standardized component replacement remains available at staffed mechanics. Emergency restart still requires actual damage-caused grounding, costs no credits or work time, and does not grant equipment or access. Its removed routine-maintenance disclaimer stays removed.
- Every referral matches the approved expanded text and public receiving entrance. Rochefort and Svarog now use the approved on-site specialist sentence. Their elite capability, and the remaining bespoke full-service upgrades, are still future work; naming them does not activate those capabilities.

## Implementation

- `src/maintenance/coverage-copy.ts`: exact approved shared prose; the original Wells side-trade set is reused rather than duplicated.
- `src/maintenance/coverage-sites.ts`: explicit physical/receiving/account/name/family/terms mapping, excluding the retained authored businesses.
- `src/maintenance/coverage.ts`: small ordinary-service factory; only `{place}` is substituted, using the physical location name.
- `shops.ts` joins these entries to the retained authored registry. `local-directory.ts` reads each shop’s approved directory summary. No second independent coverage scan.
- `referrals.ts` resolves names from actual branches and retains the approved final catchments. `game.ts` uses the shared approved referral sentence formatter.
- The Markdown is not imported by production code. The acceptance audit compares runtime fields and outputs against it independently.

## Verification

- `npm run test:maintenance-coverage`: **157,008 gameplay checks** plus **6,802 runtime-copy/terms checks**. Every approved field, location, account and all 281 public referral lines match.
- Real fault/capability matrix exercised at all 150 staffed shops. Independent gross quote examples checked at every generic staffed branch; real diagnosis actions at all 135 templated staffed branches and service/credit/time actions at all 80 templated professional branches.
- All 63 old accounts retained: **38 exact legacy commercial quote sets** remain unchanged; only the **25 approved Wells professional promotions** change commercial terms. The original pre-edit fixture was not regenerated.
- All receiving locations, private departures, branch credits, remote-operation denial, unknown faults, grounded-only gating, zero/negative-funds recovery and existing atomic inspection/recovery failure checks pass.
- Maintenance inspection: 55 checks; equipment: 5,879; menus: 452,518 assertions across 4,218 scenes; empty runs: 2,913 plus 35 rendering checks; contract presentation: 119,370. Farwatch, Barataria, Weymark, Thule and Camps regressions pass.
- Typecheck and production build pass, with existing Vite deprecation/chunk-size warnings. A transient renderer typing error in concurrent visual work was resolved by that worker; no maintenance workaround or visual edit was made here.
- [Desktop preview](http://127.0.0.1:5173/tests/maintenance-coverage-preview.html): **687 native checks**, every branch plus focused directions, equipment, inspection, service, unknown-fault and recovery views. Fifteen views captured; workshop, Raqib, on-site directions and service-receipt images inspected. Page-local synthetic storage only; no mobile tests or live-save edits.

## Next gate

Review Stage 3 in the normal game or the isolated preview. Stage 4 may then promote the remaining 25 full-service anchors, including Cadiz, with their approved-stage bespoke identities. **Do not start that work automatically.** Rochefort and Svarog elites remain Stage 5. No push or deploy has been requested.
