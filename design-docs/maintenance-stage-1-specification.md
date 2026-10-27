# Maintenance coverage — reviewed specification

Updated: 2026-10-27 (Pacific)
Status: Stages 1–4 reviewed; [Stage 5](maintenance-stage-5.md) implemented and tested. Await final network review. The original comments below remain unchanged.

See the [complete roster](maintenance-stage-1-roster.md), [delivery plan](maintenance-coverage-plan.md) and [Stage 2 handoff](maintenance-stage-2.md). Original comments were committed unchanged in `23821fa`; each is preserved verbatim below with its resolution.

## 1. Coverage

The initial read-only audit at `6f52a62` found 178 catalogued POIs, 177 selectable operational destinations and **159 physical terminal/site scopes**. Shared station berths and Orselle's compatibility districts are not separate maintenance locations. Coronal is nonselectable and remains outside the rollout.

The reviewed final network contains **150 staffed facilities plus nine emergency-only self-help locations**. No permanent crew or commercial service is invented at abandoned sites or caches.

| Region | Physical sites | Basic mechanic | Professional | Full service | Elite | Emergency only |
|---|---:|---:|---:|---:|---:|---:|
| Hearth | 26 | 7 | 13 | 5 | 1 | 0 |
| Camps | 31 | 12 | 10 | 6 | 1 | 2 |
| Belt | 22 | 4 | 10 | 4 | 1 | 3 |
| Wells | 61 | 26 | 24 | 10 | 1 | 0 |
| Reach | 19 | 8 | 6 | 1 | 0 | 4 |
| **Total** | **159** | **57** | **63** | **26** | **4** | **9** |

The internal classes are −1, 0, 1, 2 and 3. These numbers and the word “tier” never appear in player-facing shop UI. The player sees a mechanic, workshop, service centre or emergency procedure and a plain description of its facilities.

Before this pass there were 63 shops: 12 authored businesses and 51 Wells fallbacks. Stage 2 added three staffed Weymark facilities, for **66 staffed shops**, and supplied self-help at the remaining **93 physical locations**. Stage 3 now has **150 staffed facilities and nine emergency-only sites**: 84 temporary self-help entries were replaced by ordinary workshops. The final nine emergency-only sites remain unstaffed.

## 2. Service standards and honesty

| Terms code | Internal class | Diagnosis / work | Stock | Labor, cr/hour | Hours multiplier | Parts multiplier | Honesty |
|---|---:|---|---|---:|---:|---:|---:|
| E0 | −1 | Self-help only | None | 0 | No elapsed work time | No sales | No fabricated findings |
| S0 | 0 | E / F | F | 250 | 1.00 | 1.15 | **0.95** |
| W0 | 0 | E / F | F | 250 | 1.00 | 1.50 | **0.80** |
| S1 | 1 | C / D | D | 500 | 1.00 | 1.00 | 1.00 |
| S2 | 2 | B / B | B–D | 800 | 0.90 | 1.00 | 1.00 |
| S3 | 3 | A / A | A–D | 1,400 | 0.80 | 1.10 | 1.00 |

(zzz: for S0, make them all 0.95 honesty, except the Wells ones, who should be 0.8 honesty)

**Resolution:** Adopted. Low Gauge's new basic mechanic uses 0.95; the existing Wells fallback mechanics now use 0.8. Ordinary professional facilities remain honest. Red Dust retains its deliberately dishonest authored exception. These probabilities use the existing eligible-system fabrication checks, not a public honesty score or a simple per-visit scam percentage.

S3 now applies to the active Rochefort and Svarog elite facilities. Bruckner and Serrat retain their established commercial terms. Ordinary inspections take two authored hours before the hours multiplier. Work quality, stock, speed, price and honesty remain separate attributes; classification does not replace the existing A–F rules.

### Actual capability coverage

The repair catalog contains 320 unique fault definitions, reused in 520 component/fault combinations.

| Work capability | Unique repairable faults | Component/fault combinations |
|---|---:|---:|
| F | 45 / 320 | 71 / 520 |
| D | 201 / 320 | 340 / 520 |
| B | 314 / 320 | 513 / 520 |
| A | 320 / 320 | 520 / 520 |

These are catalog counts, not probability-weighted failure rates. The six A-only definitions concern a buckled keel, a collapsed pressure section, a partly collapsed structural member, a fractured converter lattice, distorted core containment and coil-insulation breakdown. B-quality workshops therefore handle all but the most complex repairs.

Diagnosis remains separate from repair skill. A C diagnostic facility can identify a C fault that its D workshop cannot repair. Unknown faults remain unknown; referral text does not reveal hidden fault truth. Total failures require replacement, including at elite shops.

### Service, replacement and equipment

- Preserve universal standardized replacement at every staffed mechanic, including unknown faults and Total failures. The player explicitly confirms the closest stocked grade, including downgrades. Emergency-only self-help does not sell parts.
- Routine service restores protection using existing nonstacking AP rules; it does not restore HP or clear faults. No wear, telemetry or RNG rebalance.
- S0/W0 do not sell new optional installations. They can maintain or replace already installed optional components under the existing rules.
- S1 offers all four current installations at D: Atmospheric Package, Heavy Heat Shielding, Cargo Shock Absorbers and Passenger Comfort Package.
- S2 offers B/C/D choices where grades apply; S3 offers A/B/C/D. Heavy Heat Shielding has no component-grade choice and still requires an Atmospheric Package.
- Existing named shops retain their equipment catalogs. All eleven non-Red-Dust authored businesses already offer the four installations; Red Dust sells none.

### Representative engine-computed quotes

Gross quotes before inspection credit. Service uses a baseline D-grade rig with Atmospheric Package, no optional cargo/passenger modules, all AP depleted and no faults. Drive replacement starts with a Total failure of a D-grade main drive.

| Facility | Diagnosis: cr / hours | Depleted service: cr / hours | Drive replacement: cr / hours / grade |
|---|---|---|---|
| S0 | 500 / 2 | 3,625 / 14.5 | 280,500 / 18 / F |
| W0 | 500 / 2 | 3,625 / 14.5 | 364,500 / 18 / F |
| S1 | 1,000 / 2 | 10,000 / 20 | 309,000 / 18 / D |
| S2 | 1,440 / 1.8 | 14,400 / 18 | 312,960 / 16.2 / D |
| S3 | 2,240 / 1.6 | 22,400 / 16 | 350,160 / 14.4 / D |
| Bruckner | 2,400 / 1.5 | 24,000 / 15 | 321,600 / 13.5 / D |
| Serrat | 2,000 / 2 | 20,000 / 20 | 318,000 / 18 / D |

The basic mechanic's 14.5-hour service reflects fewer components able to gain protection at F quality, not faster or equally protective service. The Wells scarcity markup is deliberately retained; a lower-quality fallback need not be the cheapest supplier.

| Installation at D where applicable | S1: cr / hours | S2: cr / hours | S3: cr / hours |
|---|---|---|---|
| Atmospheric Package | 129,500 / 19 | 133,680 / 17.1 | 153,280 / 15.2 |
| Heavy Heat Shielding | 63,000 / 6 | 64,320 / 5.4 | 72,720 / 4.8 |
| Cargo Shock Absorbers | 42,000 / 4 | 42,880 / 3.6 | 48,480 / 3.2 |
| Passenger Comfort Package | 52,500 / 5 | 53,600 / 4.5 | 60,600 / 4 |

Normal inspections, branch-specific one-use credits, payments and elapsed work time remain. Directions, emergency recovery and equipment browsing do not require a paid inspection. Equipment purchases retain their existing credit rules. New careers still start with a healthy rig and no cash; this pass adds free emergency recovery, not free optional equipment or a loan system.

## 3. Existing businesses

Retain all 12 authored shops, names, staff, accounts, equipment, prices and timing. The Stage 4 capability upgrade is Cadiz's Vilar flagship: Work C is now B; its diagnosis, C–D stock, 600 cr/hour rate and normal hours remain unchanged.

| Existing business | Final internal class | Diagnostic/work; stock | Rate; hours multiplier; parts multiplier |
|---|---:|---|---|
| Vilar, Gryphon Aerie | 1 | C/D; D | 500; 1; 1 |
| Vilar, Herald Gate | 1 | C/D; D | 500; 1; 1 |
| Vilar, Cadiz Highport | 2 | B/**B**; C–D | 600; 1; 1 |
| Vilar, Hydra Maw | 1 | C/D; D | 500; 1; 1 |
| Vilar, Macao Palace | 1 | C/D; D | 500; 1; 1 |
| Vilar, Manticore Observatory | 1 | C/D; D | 500; 1; 1 |
| Armorial Shipwrights | 1 | B/C; C–D | 600; 2; 2 |
| Serrat Domain Civil Refit Office | 3 | A/A; C–D | 1,000; 1; 1 |
| Seconds Gate, Keelwright Works | 1 | B/C; B–C | 1,600; 0.5; 0.85 |
| High Pennant Shipyard | 1 | C/D; D | 500; 1.5; 1.5 |
| Bruckner Central Service Hall | 3 | A/A; A–D | 1,600; 0.75; 1 |
| Red Dust, Concord | 0 exception | D/E; E | 500; 1; 1.35 |

Red Dust remains a named, limited workshop rather than an anonymous search; its honesty stays at 0. Several B/C specialists remain stronger professional exceptions within class 1. Bespoke prose alone does not turn a facility into a full-service centre.

### Wells fallbacks

(zzz: as mentioned above raise honesty to 0.8 to these 0-tier shops)

**Resolution:** Adopted as 0.8, not the original proposal's 1.0. The 51 original Wells fallback accounts retained their existing prices in Stage 2. In the final map, 26 remain basic mechanics, 16 become professionals, and nine become full-service anchors. Stage 3 converted those 25 branches to S1 professional terms; Stage 4 now promotes the nine full-service anchors to S2. Wells serf-side-trade prose stays local to appropriate settings; Daedalus and Covenant institutional variants belong to the complete Stage 3 copy review.

## 4. Full-service and elite locations

Twenty-six full-service anchors remain after moving Svarog into the elite group. Their names and bespoke copy are implemented through Stages 2 and 4; none establishes a new economic provider.

| Location | Working shop name | Operator/role |
|---|---|---|
| Balor Orbital | Balor Orbital Service Works | Independent orbital workshop |
| Acheron Commercial Hub | Acheron Transfer Engineering | Port service contractor |
| Richelieu | Richelieu Fleet Service | Independent commercial workshop |
| Celeste Main Port | Celeste Port Engineering | Lunar port workshop |
| Fuyuan | Fuyuan Ship Service Cooperative | Local cooperative |
| Roadstead | Roadstead Rig Works | Independent workshop |
| Switchback | Switchback Service Hall | Mining-settlement workshop |
| Anvil | Anvil Visiting-Rig Works | Combine external interface |
| Perun | Perun Rig Workshop | Combine controlled surface economy |
| Kalyna Orbital | Kalyna Port Engineering | Port service contractor |
| Mosaic | Mosaic Rig and Instrument Service | Local workshop consortium |
| Caravanserai | Caravanserai Drydock Service | Existing outfitter district |
| Cupola | Halloran Rig Service | Halloran Smelting House |
| Bir Safa | Bir Safa Service House | Local service households |
| Nell's Rest | Nell's Rest Shipworks | Independent station workshop; pilot |
| Thule Anchorage | Anchorage Community Workshop | Community service team |
| Castle Beira | Beira Port Workshop | Licensed port workshop |
| Ember Court | Ember Court Rig Works | Foundry concession |
| Serratine | Serratine Civil Workshop | Civilian licensed workshop |
| Alembic Ring | Alembic Ring Service Works | Orbital industrial workshop |
| Almaden Orbital | Almaden Orbital Engineering | Station concession |
| Coldgate | Coldgate Cryogenic Service | Port engineering |
| Cadiz Highport | Existing Vilar flagship | Work B upgrade implemented in Stage 4 |
| Daedalus Systems Campus | Daedalus Visiting-Rig Workshop | Public commercial campus service |
| Pilgrim Gate | Pilgrim Gate Repair Hall | Covenant receiving-gate service |
| Castle Teide | Teide Charter Workshop | Licensed service workshop |

Oathmark's elite substitutes for a separate full-service shop. Kuznia has both Anvil and Perun because ordinary foreign visitors cannot freely enter its surface economy. Macao and Vigil use neighbouring Cadiz/Mercy advanced services; gas giants use their moon networks. Small science, mining and comet outposts do not become full-service centres. Barataria Observatory stays modest, with Thule supporting advanced work.

### Four elite landmarks

(zzz: add also an elite workshop at Svarog Shipyard)

**Resolution:** Added Svarog as the fourth elite, replacing its proposed class 2 workshop rather than adding a duplicate business. Camps elite referrals now name Svarog. Its elite workshop opened in Stage 5; earlier referrals were explicitly permitted to name the future facility.

1. **Bruckner Central Service Hall, Weymark** — existing precision/dealer landmark; broad stock and fast service.
2. **Serrat Domain Civil Refit Office, Oathmark** — existing complete repair capability with conservative C–D stock.
3. **Rochefort Precision Service, Gaia** — active S3 industrial precision workshop.
4. **Svarog Visiting-Rig Service, Svarog Shipyard** — active S3 elite workshop using SSC's shared infrastructure; tenant builders retain their own identity.

Bruckner remains the established VHM dealer; other shops obtain proprietary parts through existing channels without claiming a new dealership or warranty monopoly.

## 5. Referrals

(zzz: approved)

**Resolution:** Authored practical service catchments are approved. The initial planner audit found no comparable end-to-end ETA for local, cluster and interbody routes. Referrals therefore give stable local recommendations, not unmeasured fastest-trip claims. The roster records the normal destination and elite alternative.

(zzz: no need, do not worry of inconsistency, refer to non-implemented shop. We will implement all.)

**Resolution:** Removed temporary availability/fallback-chain machinery. A referral can name its approved future facility before that shop is implemented. This is advice only: it does not activate a shop, sell work remotely or change arrival permission. A temporary self-help desk at a future elite site may name the eventual on-site workshop.

(zzz: if the referral is not the top tier workshop, add also referral to the top tier one. "Or, of course, you can go to XXX - they do all sorts of wonders" type of message)

**Resolution:** One free interaction gives the normal higher-facility recommendation and, unless that destination is already elite, an additional elite recommendation. An elite primary is not repeated. Low Gauge therefore names the Town Workshop and Bruckner; Nell's Rest names Bruckner once. Camps recommendations include Svarog, even while it is a future shop.

The interaction is available before paid diagnosis. It names the shop and physical location, never an internal class or hidden fault. Ordinary referral destinations have public operational entrances; The Still uses its public approach, not a restricted berth. Private service remains local after legitimate arrival. No hidden Barataria coordinates, reputation, contact knowledge, Farwatch empty-arrival bypass or travel booking is granted. Actual flight requirements still apply.

## 6. Emergency recovery and unstaffed sites

(zzz: we need to ensure that there's no way to get completely stuck. For locations with no S0 shop, add a (-1) tier shop that just 'resets the lights' and un-grounds the rig.)

**Resolution:** Added a free **Emergency restart procedure** wherever no staffed workshop currently exists. It is self-help, not invented resident staff. Staffed shops expose the same free restart so a zero or negative balance cannot leave operational damage unrepairable merely because a paid mechanic is present.

The restart:
- Is enabled only when damage causes the actual `grounded` restriction; lesser operating restrictions alone do not qualify (Stage 2 review clarification).
- Requires no paid inspection, credits, work time or parts purchase.
- Clears faults causing operating restrictions and raises those installed components only to minimum fault-free operating HP.
- Preserves component grade, AP, installed equipment, RNG, mission counters, money and world time. It does not provide full servicing, improve parts or repair unrelated nonblocking faults.
- Clears stale inspection findings after the reset while retaining unused credits. No new compatibility schema is introduced.
- Saves once before publishing the new state; failed persistence changes nothing. Repeating a completed reset does nothing.
- Retains permissions, certifications and requirements for equipment never installed. It does not give a free Atmospheric Package, teleport the rig or clear legitimate restricted-site access rules.

Every selectable physical location has either staffed service or the self-help procedure. Tests exercise operational recovery and a public outbound empty route from every selectable POI with zero/negative funds; normal travel can still incur fuel costs. The mechanism addresses maintenance stranding, not an unrelated qualification or save-corruption repair system.

The final emergency-only sites are **First Landing, Black Tile, Nell's Lantern, Old Survey Camp, Apocrypha Cache, False Bottom Cache, Blind Drop, Comet Fragment 2's cache and Comet Fragment 3's dead drop**. Coronal remains nonselectable. Limited local help at working science cells, Raqib and the lone-operator beacon does not create additional settlements or shipping.

## 7. Accounts and compatibility

(zzz: do not worry about back compat, do the least code solution)

**Resolution:** Removed the proposed shop-policy revision system and migration layer. Retain existing account IDs naturally; use existing inspection expiry, credits and save fields. Historical reports follow their ordinary mission-based expiry, rather than an extra policy-version check. A fresh inspection uses current honesty/capability. Emergency reset explicitly invalidates its superseded findings without erasing credits.

New staffed accounts use `maintenance-<physicalId>`; self-help uses `emergency-<physicalId>`. Generated directory IDs append `-office`; authored existing directory IDs remain. Upgrading a later professional placeholder to a bespoke shop does not require a new account. Shared planetary prose never means shared inspection or credit state.

## 8. Stage gates and verification

- **Stage 2:** Low Gauge mechanic, Town workshop, Nell's Rest Shipworks, existing Bruckner; shared registry, referrals, approved honesty and universal emergency fallback. Other staffed facilities remain unchanged.
- **Stage 3:** Complete ordinary coverage, with professional interim shops where later bespoke anchors will open. Expected final-stage snapshot: 57 basic, 90 professional, one full-service pilot, two existing elites and nine emergency-only locations. Supply **all copy in Markdown for comments before implementation**: every shared/reused set, variant, name, substitution, referral and location map. Preserve `zzz` comments.
- **Stage 4:** Remaining 25 full-service anchors, including Cadiz, implemented and reviewed. Stage snapshot 57 / 65 / 26 / 2, plus nine emergency-only sites.
- **Stage 5:** Rochefort and Svarog elites implemented. Final live 57 / 63 / 26 / 4, plus nine emergency-only sites. Await final network review.

`tests/audit-maintenance-coverage.ts` inventories physical scopes, account/directory agreement, service quotes, fault coverage and referral records. The roster JSON is review data, not imported into production. The production referral network is checked against it. `npm run test:maintenance-coverage` validates the pilot, emergency coverage, public directions, exact legacy quotes, atomic save failure and hidden internal labels. See the Stage 2 handoff for validation and the desktop preview.
