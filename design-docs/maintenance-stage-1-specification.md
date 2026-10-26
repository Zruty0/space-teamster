# Maintenance Stage 1 — coverage and service specification

Updated: 2026-10-26
Status: **Stage1 design deliverable for approval. No runtime/shop rollout. Stage2 awaits approval.**

Review this specification together with the [complete location roster](maintenance-stage-1-roster.md). All proposed names, prices, capability changes and exceptions below await approval. The [five-stage outline](maintenance-coverage-plan.md) remains the delivery plan. Preserve Pete's inline `zzz` comments and record resolutions alongside them.

## 1. Verified inventory and proposed coverage

Read-only audit against6f52a62 (the concurrent Dawes Cut scenery work is retained):178 catalogued POIs,177 selectable operational destinations, **159 physical terminal/site scopes** after consolidating shared stations and Orselle's districts. Coronal is the sole catalogued POI without an exact selectable chain. Current maintenance:12 authored shops +51 Wells fallback shops = **63 physical sites covered**; shop and Local Directory registries agree at every site.

Proposal: **150 serviced physical sites**, nine deliberately unstaffed/reserved selectable sites, plus nonselectable Coronal. This adds service at87 previously unserved physical sites. It does not create extra worlds, settlements, transport missions, economic providers or access permissions.

| Region | Physical sites | Tier0 | Tier1 | Tier2 | Tier3 | No service |
|---|---:|---:|---:|---:|---:|---:|
| Hearth |26|7|13|5|1|0|
| Camps |31|12|10|7|0|2|
| Belt |22|4|10|4|1|3|
| Wells |61|26|24|10|1|0|
| Reach |19|8|6|1|0|4|
| **Total** |**159**|**57**|**63**|**27**|**3**|**9**|

These are final proposed facility classes, **not live counts or exposed player labels**. Every site, receiving-ID mapping, copy family, commercial terms code and proposed referral appears in the roster. Shared station berths get one service account, not duplicate mechanics. A surface city never gets free access to its orbital shop merely by sharing a planet.

## 2. Proposed default service standards

Tier is internal categorization only. Existing A–F mechanics continue to determine actual repair/diagnosis/parts outcomes; do not build a second parallel rules engine.

| Code | Internal tier | Diagnosis / work | Parts stock | Labor cr/h | Hours multiplier | Parts multiplier | Honesty |
|---|---:|---|---|---:|---:|---:|---:|
| S0 |0|E / F|F only|250|1.00|1.15|1.00|
| W0 |0|E / F|F only|250|1.00|1.50|**1.00**, changed from0.25|
| S1 |1|C / D|D only|500|1.00|1.00|1.00|
| S2 |2|B / B|B–D|800|0.90|1.00|1.00|
| S3 |3|A / A|A–D|1400|0.80|1.10|1.00|

S3 applies only to the proposed Rochefort elite shop. Existing Bruckner and Serrat retain their individual terms below. Two authored hours per diagnostic inspection before the hours multiplier. These are proposed defaults, not a forced price ladder: a constrained remote mechanic may charge more for inferior parts than a well-supplied professional shop.

### What the capability steps actually buy

The actual catalog contains320 unique repairable fault definitions, reused across520 component/fault combinations:

| Work capability | Unique repairable faults | Component/fault combinations |
|---|---:|---:|
| F (S0/W0) |45/320|71/520|
| D (S1) |201/320|340/520|
| B (S2) |314/320|513/520|
| A (elite) |320/320|520/520|

These are catalog coverage counts, not probability-weighted failure rates. Tier2 therefore really does cover all but the most complex repair work. The six A-only fault definitions concern a buckled keel, collapsed pressure section, partly collapsed structural member (cargo spine or landing gear), fractured converter lattice, distorted core containment housing, and coil-insulation breakdown.

Diagnosis remains separate: a C diagnostic shop can identify a C fault even when its D workshop cannot repair it. An unknown fault stays unknown until an adequate diagnosis; referral text cannot reveal hidden fault truth. Total failure still requires replacement at every facility, not miraculous repair at an elite shop.

### Servicing, replacement and equipment

- Preserve universal standardized replacement, including unknown faults and Total failures, with the shop's stocked grade and explicit downgrade/upgrade confirmation. Tier0 can help an adequately funded grounded rig recover through replacement; it cannot perform advanced rebuilding or restore elite service quality.
- Service never reduces existing protection, restores HP, or clears faults. Higher-quality service uses the existing nonstacking AP rules; no wear/telemetry changes.
- S0/W0 sell no new optional installations. They can maintain/replace already installed optional components under the existing engine rules.
- S1 supplies all four existing equipment installations at D: Atmospheric Package, Heavy Heat Shielding, Cargo Shock Absorbers, Passenger Comfort Package. Existing requirements such as shielding needing an Atmospheric Package remain.
- S2 supplies those installations with B/C/D component choices where grades apply; S3 with A/B/C/D. Heavy Heat Shielding itself has no component-grade choice. No new equipment invented.
- Existing named shops retain current equipment catalogs; all eleven non-Red-Dust authored shops already offer all four installations. Red Dust retains no equipment sales.

### Representative quotes, computed with the actual engine

Gross quotes before inspection credit. Service sample: installed baseline grade-D rig including Atmospheric Package, no optional cargo/passenger modules, all AP depleted, no faults. Drive sample: Total main-drive failure, originally D. Costs are not promises of affordability; player cash rules remain.

| Facility | Diagnosis cr / hours | Depleted service cr / hours | Replacement drive cr / hours / resulting grade |
|---|---|---|---|
| S0 |500 /2|3625 /14.5|280500 /18 /F|
| W0 |500 /2|3625 /14.5|364500 /18 /F|
| S1 |1000 /2|10000 /20|309000 /18 /D|
| S2 |1440 /1.8|14400 /18|312960 /16.2 /D|
| Proposed Rochefort S3 |2240 /1.6|22400 /16|350160 /14.4 /D|
| Existing Bruckner |2400 /1.5|24000 /15|321600 /13.5 /D|
| Existing Serrat |2000 /2|20000 /20|318000 /18 /D|

Tier0's14.5-hour service reflects fewer components able to gain protection at F-quality work, **not faster or equally protective full servicing**. Prices/hours vary with actual installed components and condition.

| Installation at D where applicable | S1 cr / hours | S2 cr / hours | Rochefort S3 cr / hours |
|---|---|---|---|
| Atmospheric Package |129500 /19|133680 /17.1|153280 /15.2|
| Heavy Heat Shielding |63000 /6|64320 /5.4|72720 /4.8|
| Cargo Shock Absorbers |42000 /4|42880 /3.6|48480 /3.2|
| Passenger Comfort Package |52500 /5|53600 /4.5|60600 /4|

Caravanserai gets standard installations during Stage3, then the S2 workshop in Stage4; Nell's Rest offers them in the Stage2 pilot. Existing Still/Nell certification locations and Old Nell passage remain unchanged. New careers start with zero cash and a healthy rig; this pass adds availability, **not free equipment, loans or a guaranteed rescue from insolvency**. No paid inspection is needed to ask for directions or buy equipment; normal local inspection is still needed for service/repair/replacement. The existing one-use, nonstacking diagnostic credit offsets subsequent work, not cash refunds.

## 3. Existing authored shops — explicit treatment

Preserve all12 stable shop IDs, people, staging, organizations and commercial terms except the one stated flagship capability upgrade. Bespoke text does not automatically make a shop tier2. Several existing intermediate B/C shops remain superior professionals within tier1, not additional fractional tiers.

| Existing shop | Proposed tier | Diagnostic/work; stock | cr/h; hours×; parts× | Decision |
|---|---:|---|---|---|
| Vilar, Gryphon Aerie |1|C/D; D|500;1;1|Retain |
| Vilar, Herald Gate |1|C/D; D|500;1;1|Retain |
| Vilar, Cadiz Highport |2|B/**B**; C–D|600;1;1|**Only named-shop capability upgrade:** Work C→B in Stage4; rates, hours, stock and diagnosis unchanged. Terms code V2. |
| Vilar, Hydra Maw |1|C/D; D|500;1;1|Retain |
| Vilar, Macao Palace |1|C/D; D|500;1;1|Retain; Cadiz provides nearby advanced work |
| Vilar, Manticore Observatory |1|C/D; D|500;1;1|Retain; Teide supplies the local full-service anchor |
| Armorial Shipwrights, Shipwright Keep |1|B/C; C–D|600;2;2|Retain skilled-but-ceremonial intermediate capability and price |
| Serrat Domain Civil Refit Office |3|A/A; C–D|1000;1;1|Retain elite work with limited stock range |
| Seconds Gate, Keelwright Works |1|B/C; B–C|1600;0.5;0.85|Retain industrial seconds/exchange specialization |
| High Pennant Shipyard, Oathmark Academy |1|C/D; D|500;1.5;1.5|Retain yacht-oriented service |
| Bruckner Central Service Hall |3|A/A; A–D|1600;0.75;1|Retain elite precision/dealer identity |
| Red Dust, Concord |0 exception|D/E; E|500;1;1.35|Retain named premises and deliberate dishonesty0; tier0 here means limited workshop, not anonymous search |

All other authored shops have honesty1. Cadiz's change adds B-complexity repairs and B-quality service protection, **not merely a new label**; its price/hours remain unchanged. It retains its branch account and requires the report compatibility treatment below.

### Wells fallback recommendation

Make all remaining anonymous/local fallback mechanics honest: honesty0.25→1.00. Keep their constrained E/F capability, F parts,250cr/hour and1.5× parts price. Scarce stock and lower quality still distinguish them; low facility quality no longer automatically means fabricated bills. Honesty is an internal probability parameter, not a public score or a75%-per-visit statistic.

Of the51 existing fallback accounts,26 remain basic mechanics,16 become professional shops, nine become future full-service anchors (professional interim service in Stage3). Their existing IDs remain the account identity. Professional conversions use S1/S2 terms, not W0. Wells serf-side-trade copy is retained/revised only where appropriate; Daedalus and Covenant sites get institutional copy, not implausible rotating serfs. This text is subject to the full Stage3 Markdown review. Deliberate named Red Dust dishonesty is not changed or generalized elsewhere.

## 4. Proposed bespoke full-service anchors

Names below are **working names for roster approval**, not final dialogue or a new economic-provider registry. Local service shops/teams can exist without establishing new system-wide corporations. Twenty-seven tier2 facilities, including the Weymark pilot and upgraded Cadiz flagship:

| Location | Working shop name | Operator/role |
|---|---|---|
| Balor Orbital | Balor Orbital Service Works | Independent orbital workshop |
| Acheron Commercial Hub | Acheron Transfer Engineering | Port service contractor |
| Richelieu Orbital Terminal | Richelieu Fleet Service | Independent commercial workshop |
| Celeste Main Port | Celeste Port Engineering | Lunar port workshop |
| Fuyuan | Fuyuan Ship Service Cooperative | Local workshop cooperative |
| Roadstead Station | Roadstead Rig Works | Independent workshop |
| Switchback | Switchback Service Hall | Mining-settlement workshop |
| Anvil Station | Anvil Visiting-Rig Works | Steel Combine's external interface |
| Perun City | Perun Rig Workshop | Steel Combine, for legitimate local arrivals |
| Svarog Shipyard | Svarog Visiting-Rig Service | SSC shared visiting-rig infrastructure; tenant builders retain their identity |
| Kalyna Orbital | Kalyna Port Engineering | Port service contractor |
| Mosaic Assembly Lab | Mosaic Rig and Instrument Service | Local workshop consortium |
| Caravanserai | Caravanserai Drydock Service | Existing outfitter/drydock district |
| Cupola Station | Halloran Rig Service | Halloran Smelting House |
| Bir Safa | Bir Safa Service House | Local service households |
| Nell's Rest | Nell's Rest Shipworks | Independent station workshop; pilot |
| Thule Anchorage | Anchorage Community Workshop | Community service team |
| Castle Beira | Beira Port Workshop | Count's licensed port workshop |
| Ember Court Foundry | Ember Court Rig Works | Foundry service concession |
| Serratine | Serratine Civil Workshop | Civilian licensed workshop |
| Alembic Ring | Alembic Ring Service Works | Orbital industrial workshop |
| Almaden Orbital | Almaden Orbital Engineering | Station service concession |
| Coldgate | Coldgate Cryogenic Service | Port engineering concession |
| Cadiz Highport | Existing Vilar flagship | Existing House Vilar business, explicit V2 upgrade |
| Daedalus Systems Campus | Daedalus Visiting-Rig Workshop | Public commercial campus services; no Icarus disclosure |
| Pilgrim Gate | Pilgrim Gate Repair Hall | Covenant receiving-gate service |
| Castle Teide | Teide Charter Workshop | Count's licensed service workshop |

All use S2 except V2. The count is not one shop for every rock: inhabited moons and industrial asteroid hubs count as practical service areas. Kuznia has both Anvil for ordinary foreign traffic and Perun for its controlled surface economy. Oathmark's existing elite shop substitutes for a separate tier2. Macao and sparse Vigil use neighboring Cadiz/Mercy advanced services; the gas giants rely on their moon networks. Barataria Observatory is modest tier1, with Thule providing full service. Comet fragments, rogue outposts, Raqib and Farwatch do not become implausible full-service centres.

### Three elite landmarks

1. **Bruckner Central Service Hall, Weymark** — existing; widest civilian stock and fastest benchmark service.
2. **Serrat Domain Civil Refit Office, Oathmark** — existing; complete repair capability, conservative C–D stock.
3. **Rochefort Precision Service, Gaia** — proposed new industrial precision workshop; S3 terms. No new manufacturing monopoly, VHM dealership or warranty authority: obtain proprietary parts through existing supply channels. Bruckner retains its established dealer role.

No automatic elite shop at Svarog, a government capital, every gas giant, or every region. Existing repair competence and parts inventory are separate; an elite can rebuild any repairable fault without promising every possible replacement grade.

## 5. Referrals — explicit decision needed

**Audit finding:** the current route planner does not provide complete end-to-end travel time. `generateEstellaMission()` supplies transfer options for certain interbody pairs; ordinary same-body and cluster legs can return no transfer options. An empty array is not zero travel time. `waitTime` is an absolute departure timestamp, not a duration; existing empty travel selects the `soon` preference, not necessarily the fastest possible arrival. Comparing raw X/Y between unrelated frames would also be wrong.

**Recommendation for this pass: authored nearest-practical-service catchments**, rather than inventing a new ETA/routing simulation. The roster's referral column gives the proposed normal next facility, chosen by local service geography and existing port interfaces. This is a **change from the outline's provisional shortest-flight-time suggestion** and requires approval. It means a stable local recommendation, not a mathematically proven minimum over current orbital configurations. Player wording should say “For more advanced work, go to…” rather than assert an unmeasured exact travel time or universal fastest route.

If Pete wants dynamically shortest actual trips instead, design a complete comparable route metric before Stage2; do not pretend the current transfer-only estimator already solves that requirement.

### Referral implementation contract, if the catchment approach is approved

- Free before diagnosis; one action with shop name, physical destination and useful capabilities. No tier, hidden fault, raw ID or honesty score in the response.
- Same-terminal higher shop first if such a shop exists. Otherwise follow the roster's approved ordered service chain to a currently active strictly higher-tier shop. It may skip tiers. No hidden/private primary referrals appear in this proposed roster.
- If an intermediate future-stage shop is not implemented, walk its proposed chain without displaying unimplemented names. If that ends at future Rochefort before it is active, use existing Bruckner as the explicit Hearth fallback; Camps/Belt also use Bruckner, Wells/Reach use Serrat. Stop only at an active accessible higher facility. Strictly increasing tiers prevent cycles. No extra tier3 recruitment/unlock mechanic.
- Treat public receiving permission per **operational POI**, then display its physical parent. The Still is reached through its public approach dock, not a restricted sibling. Never bypass a permit, reveal a secret surface site or turn Farwatch into an empty-arrival destination. No new contact/reputation knowledge is granted.
- Private shops can serve rigs already legitimately present. The Warren's shop remains entirely local, with no public smuggling bookings or referrals disclosing its coordinates. Farwatch remains contract-only for arrivals.
- A generic higher-shop referral is not a claim that it fixes every fault. For a confirmed unsupported repair, follow the same chain until diagnosis/work capabilities suffice, or state the limitation honestly. A tier3 shop has no mandatory upward referral.
- Advice does not launch a ship. Current grounding, route/atmosphere restrictions, normal cost and payment constraints remain. In particular, an unequipped rig cannot fly to surface Rochefort for repairs; it may still replace components locally or use another accessible elite. Any route-specific accessibility filtering must not make the free advice screen disappear simply because the rig is grounded.

## 6. Explicit exclusions and local-only cases

No resident mechanic at: **First Landing, Black Tile, Nell's Lantern, Old Survey Camp, Apocrypha Cache, False Bottom Cache, Blind Drop, Comet Fragment2's prospector cache, Comet Fragment3's dead drop.** Coronal remains nonselectable/unexpanded. These are deliberate exclusions, not unexplained coverage holes.

Working but isolated sites such as Raqib, Gale Survey, the two comet science cells and the lone-operator rogue beacon get limited on-site technical help only. Their ordinary staff are not expanded into new settlements or named mechanics; science-cell staffing is a proposed reading of their working-site role, not new lore canon. Restricted facilities require legitimate arrival. Concealment, reputation and story reserves remain untouched.

No new rescue/towing system is included. A player at an unstaffed site can still be stranded by existing damage/funds rules; exclusions explicitly retain that limitation rather than conjuring a mechanic. If universal rescue is wanted, that is a separate design decision.

## 7. IDs, reports, credits and staged delivery

- Keep all63 existing shop IDs and matching directory IDs. The51 `wells-frontier-outfitter-*` IDs remain compatibility identifiers even when a location gains a proper workshop; no gratuitous save rename.
- New shops use `maintenance-<physicalId>` and directory ID `maintenance-<physicalId>-office`, one stable account per physical scope from their first introduction. The companion JSON explicitly records every proposed and retained account/directory ID. A Stage3 professional placeholder promoted to bespoke2/3 keeps its account ID. Planetary shared prose never means shared credits or diagnosis state.
- Introduce a small **shop policy revision** on inspection records when implementing capability/honesty changes. Old reports at unchanged shops remain valid under existing mission-expiry rules. Reports at changed shops become stale once, without modifying rig condition, past receipts, money, mission counters or unused credit balances. A fresh inspection uses current skill/honesty; stale fabricated claims cannot authorize new fake work. Normal successful reinspection supersedes active claims and replaces rather than stacks its credit, just as today. Equipment may still consume an unused old credit under existing rules. Test old saves with claims/credits explicitly; do not refund old transactions or silently transfer credit between unrelated branches.
- Stage2: existing12 shops gain metadata without repricing; add Low Gauge0/Town1/Nell's Rest2, using existing Bruckner3. Expected66 covered physical sites; no other coverage expansion.
- Stage3: complete150-site baseline, including professional interim workshops at future bespoke locations; preserve existing authored exceptions. Expected57 tier0 /90 tier1 /1 tier2 /2 tier3. All Stage3 copy must first be delivered in Markdown, including shared/reused text, overrides, names, substitutions, referrals and location mapping. The proposed family mapping currently has43 shared families before bespoke/existing exceptions; it is a review inventory, not permission to skip any prose. Pilot/existing named text remains identifiable separately.
- Stage4: promote the remaining26 tier2 anchors, including Cadiz; expected57/64/27/2. Review bespoke identities and retain old accounts.
- Stage5: promote Rochefort to the third elite, final57/63/27/3. No additional location count or filler businesses.

## 8. Reproduction and acceptance scope

`node tests/run-equipment.mjs tests/audit-maintenance-coverage.ts > <report.json>` inventories live physical scopes, memberships, shop/directory agreement, actual existing/default quotes, fault coverage and four representative route-planner probes. It reads the companion `maintenance-stage-1-roster.json` and checks exact159-site coverage, exact177 receiving-ID membership, unique proposed accounts, preservation of all63 existing account/directory IDs, retained authored-shop references, all proposed upward referrals and public arrival permission. JSON is planning data only; no production module imports it.

The prose roster and specification are the human review documents; update the companion JSON when locations/tiers/referrals change. Proposed operational restrictions, sparse service-site exclusions and legacy report migrations receive runtime tests in Stage2 and later; Stage1 does not claim those unimplemented systems already pass.

**Approve or comment on:** the complete location map; nine service exclusions; S0/W0/S1/S2/S3 economics; honest Wells defaults while retaining named Red Dust; the single Cadiz capability upgrade;27 full-service anchors/three elites; and especially the authored-referral interpretation versus a new dynamic nearest-trip metric. Stop here for review before Stage2.
