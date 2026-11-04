# Remaining reputation stages — combined review

Updated: 2026-11-04 (Pacific)
Status: **Batch design approved November 4; runtime rollout pending.** Pete approved this pack and requested a complete contract-gate audit, explicitly including Gaia/Dahai civilian work under GOV/Institutions limits. See [all-contract coverage](contract-reputation-coverage.md). Pete approved [Covenant](faction-reputation-covenant.md) (`ee2f04c`) and requested all next stages together, replacing the entity-by-entity pauses. This pack completes the policy review coverage of all **28 mapped public employers**. Guild/five mixed civilian pools were unassigned at this review stage; the subsequent [all-contract audit](contract-reputation-coverage.md) closes that design gap, starting with Pete's explicit Gaia/Dahai GOV direction. Production remains unchanged. Notoriety and rank-3 stories have explicit content boundaries rather than invented jobs.

The following batch choices are now approved. The new all-contract audit extends recognition/pricing coverage beyond this pack's previously unassigned civilian/Guild pools; it does not waive calibration or funded-path prerequisites. Existing House/VHM/Kisaragi/Covenant decisions remain intact. In particular, Kisaragi stays **4/20, K=10/D=1/50**, Houses retain their shared introductions/rivalry, and Covenant stays **1/15, K=5/D=1/30**. Runtime still authors only Combine/CHR.

## 1. Common rules for the remaining earning tracks

| Track | Introductory jobs | Important jobs 1→2 | Grace / decay | Ordinary ceiling |
|---|---:|---:|---|---:|
| Daedalus Systems | 2 (+1/2) | 15 (+1/15) | K=5, D=1/30 | 2; 3 reserved for quests |
| Balor Advanced Materials | 2 (+1/2) | 15 (+1/15) | K=5, D=1/30 | 2, intrinsic cap |
| Merren Conservatory | 2 (+1/2) | 15 (+1/15) | K=5, D=1/30 | 2, intrinsic cap |
| Estella Institutions — GOV/EDF/EIP together | 2 (+1/2) | 15 (+1/15) | K=5, D=1/30 | 2, intrinsic cap |

Any successful directly attributed job earns introductory credit, independently of whether it is routine or important. Cap at the next integer; no spill or simultaneous advanced credit. Important work advances 1→2; other related work only maintains and resets grace. The sixth unrelated completion starts decay; protect the current integer floor, with no below-1 erosion. Empty/Old Nell travel, waiting, maintenance, failures/abandonments and retry callbacks award/count nothing. No faction gets a new perfection/fuel-efficiency scoring rule in this batch.

Important new quotes pay the employer's **entry net-at-par median**: Daedalus 15k, BAM 20k, Merren 10k, Institutions 5k. These pools are excluded from the commercial 20/60/20 denominator. Preserve existing actual-fuel ratios/caps; fixed completion pay is `net target + par fuel − reimbursement at par`. Do not stack historical fees on the new quote or reprice accepted/history records. These financial targets exclude maintenance, positioning and time.

For commercial work, access is the maximum of the **accepted offer's quoted-income band** and authored trust, plus qualifications/equipment. Use completed standing levels, never rounded partial bars. Public locked offers remain visible. Hiring restrictions do not restrict docking, services or emergency help; no implicit equipment, contacts or discovery rewards. Completion and its neutral ship-computer notices must share the same eventual atomic settlement calculation.

## 2. Daedalus Systems

Authority: [existing economy](economy.md#faction-daedalus-systems), `daedalus-contracts.ts`, Camps/Dahai/Balor partner lanes. Existing titles Unknown Quantity → Known Quantity → Authorized Contractor → Authorized Partner remain unchanged.

**Important, trust 1, 15k net:**

- All `validation-outbound-*`, `validation-return-*`, `validation-team-return-*` and `dataset-intake-*` identities.
- Only the `personnel-outbound-*` variant ending in literal **`-driver-validation teams`**, not every customer installer.
- Balor `isolated-hot-zone-trial`, `trial-hardware-return`, `trial-record-return`, in both existing orbital/direct dispatch forms.

This gives physical prototype, custody-record and return-work paths without requiring passenger equipment. Ordinary procurement, product fulfillment, recruited research fellows and general commissioning personnel remain commercial. Ordinary product servicing is not silently relabeled validation: Balor `interface-rma`, Camps controller returns/integration and Dahai hardware returns/integration remain routine.

**Entrusted commercial, minimum 2:** `icarus-restricted-inputs-*` and `icarus-research-principals-*`. They maintain standing, not unlock their own prerequisite. New prices remain within the approved Daedalus commercial structure (15k/175k/300k, ceilings 40k/237.5k), with Icarus budgeted inside the premium 20% rather than added on top of it. Like CHR's entrusted pool, its premium pricing uses a fixed combined workload reference with the highest-workload ordinary jobs. No extra old 20k restricted-transfer bonus is added. Legacy accepted Icarus jobs remain valid even if current standing is below the new minimum.

Server Farm and Icarus Lab remain restricted for empty arrivals; an accepted delivery authorizes its destination. Systems Campus stays the public external hub. No same-Coimbra-POI contracts, new Icarus outbound work or general lab-access reward. Public copy continues to describe human-run electronics/research: no new disclosure of the reserved hidden research plot. Authorized Partner remains a future quest relationship, not what the fifteenth validation run grants.

## 3. Balor Advanced Materials

Authority: `bam-contracts.ts`, [Balor economy](economy.md#faction-balor-advanced-materials-bam). Rated/Trusted contractor titles and intrinsic level-2 ceiling stay unchanged.

**Important, trust 1, 20k net:** six exact lane families:

- `extraction-overhaul`, `foundry-overhaul` — recovery of rebuildable critical operating equipment.
- `extraction-specialists`, `foundry-specialists`, `extraction-specialist-return`, `foundry-specialist-return` — field maintenance/precision commissioning specialists and returns.

Routine procurement, food/water/life support, finished products, `rated-recruitment` and leave rotations stay commercial. High pay, direct surface handling and the word “rated” do not independently select importance. Approved ordinary medians 20k/200k/300k, ceilings 40k/250k. No extra trust-2 family or reputation-3 quest is created.

The same logical order gets the same progression classification whether dispatched through Balor Orbital or directly to Extraction One, Foundry One or Shade. Preserve the two-day paired 50/50 dispatch scheme, seeds, cargo mass and BAM-arranged local handling. Do not inflate danger, introduce hidden accidents/fraud, classify sponsored crews as coercive CHR labor or demand direct-surface exposure to advance. Freight overhaul work supplies a non-passenger path; extreme surface operations remain a separate qualification/equipment/funding constraint.

## 4. Merren Conservatory

Authority: `merren-contracts.ts`, [Merren economy](economy.md#faction-merren-conservatory). Merren owns independent Kalyna; no ownership merger with Combine or institutional/scientific neighbors. Intrinsic cap 2.

**Important, trust 1, 10k net:**

- `procurement:biological-reference-stock:*` — controlled reference cultures/quarantined breeding stock, not ordinary feedstock.
- `stewardship:*` — reserve-funded allotments rather than ordinary sales.
- `immigration:*` — complete sponsored households, preserving existing voluntary settlement/receiving copy.
- `union-pilgrimage:*`, `union-return:*` — Merren-funded reciprocal service, in both directions.
- `specialist-inbound:*`, `specialist-outbound:*` — the existing narrow biological/clinical/quarantine/conservatory specialist exchange.

Routine surface consolidation, distribution, other procurement, standard/premium/highliner sales, reusable returns and Dahai/Balor commercial additions retain the ordinary ladder: 10k/100k/150k, ceilings 40k/125k. Expensive living stock can require 2 economically without becoming an advancement job. A returned empty quarantine locker is not automatically a quarantined biological consignment. Reference procurement and stewardship give freight advancement alternatives to sponsored passengers.

**Issuer attribution is decisive:** Merren Work Union jobs earn/refresh Merren, not Combine. Combine-funded exchanges still follow Combine rules and do not earn Merren. Visits to a Covenant enclave do not earn Covenant standing; ordinary sales to noble clients do not earn House points. Existing specifically authored stewardship deliveries to Mercy/Vigil and their reusable returns remain valid contract-authorized exceptions, not an opening of a general Covenant/internal passenger network.

Preserve the narrow Gaia/Dahai specialist network and Roadstead/Concord immigration sources. No generic labor-exchange expansion, new passenger destinations, residency shares or personal sponsorship granted to the pilot. Old near-zero-profit Union prose refers to pre-income compensation: the current calibrated quotes are not retroactively restored or cancelled. The proposed important 10k net applies only to new offers while retaining the 0.90 Union reimbursement and existing cap.

## 5. Estella Institutions — one shared track

GOV, EDF and EIP **earn and refresh the single `estella-institutions` score/counter**. One GOV introduction and one EIP introduction reach 1; important EDF work then advances the same bar. This is explicit earning attribution, not generic recognition-donor credit. All three keep separate employers, copy, route networks, fuel terms and price curves, with the same approved medians 5k/50k/100k and ceilings 27.5k/75k. No extra meters, institutional rank 3, enlistment, legal authority, emergency access or scientific-campus ownership.

**Important, trust 1, 5k net:** exact lane selections below; both existing directions qualify where authored.

| Issuer / namespace | Important lane IDs |
|---|---|
| GOV / `gaia` | `inspection`, `public-records` |
| GOV / `dahai` | `dahai-port-inspection`, `dahai-physical-archives` |
| EDF / `gaia` | `training-exchange`, `liaison` |
| EDF / `dahai` | `dahai-port-liaison` |
| EDF / `farwatch` | `station-equipment`, `duty-rotations`, `technical-rotations` |
| EIP / `dahai` | `field-specimens`, `polar-comparisons`, `deep-assays`, `storm-comparisons` |
| EIP / `camps` | `camps-field-specimens`, `institute-metrology-return`, `institute-certified-standards` |
| EIP / `sahra` | `wadi-specimens`, `raqib-instrument-returns`, `raqib-local-standards`, `raqib-local-returns` |
| EIP / `farwatch` | `observation-equipment`, `instrument-returns`, `optical-service` |
| EIP / `barataria` | `observatory-instruments` |

Everything else in the reviewed GOV/EDF/EIP lane sets stays ordinary commerce: clinic procurement, civic/leave/ordinary field travel, routine instruments and station provisions, Thule community services, Raqib food/life support and other unselected work. No additional trust-2 family. Scientific subject matter alone does not select importance, and civilian university/museum/archive bookings do not become EIP/GOV work because of their wording.

**Preservation boundaries:**

- Farwatch remains **contract-only**, even with standing 2 and known contacts. EIP equipment there is physical instrument service, not invented “space ghost” specimens or data courier work; ordinary observations travel electronically. EDF keeps station authority; BFS propulsion service stays separate.
- Raqib remains EIP-only and retains sparse paired scheduling and physical sites. No tourist/Guild/broker lane or standing-based discovery reward.
- Barataria work ends at its public orbital observatory, not hidden surface sites. Thule stays small civic/household logistics, not a debt, custody or residency-share mechanic.
- EIP host partnerships do not transfer ownership or grant universal private-surface access. Shared standing can qualify a carrier across the three employers, but every contract still needs its own authorization and equipment.

## 6. Inherited employers — recognition, not new advancement grinds

These **twelve** providers get no new meter, important-pay pool, donor awards or donor grace refresh. Their existing ordinary prices are unchanged by this batch. Recommend quoted-income gates only, using the existing completed-level recognition maximum, capped at 2. No additional trust floor or automatic refusal is inferred from a mediation, petition or custody-flavored title.

| Providers | Recognition source | Approved ordinary medians |
|---|---|---|
| Oathmark Accord Authority | Maximum completed Alvares/Mendes/Nunes, capped 2 | 10k/100k/150k |
| Wells Noble Houses | Same House maximum | 5k/30k/60k |
| Halloran, Miners Mutual, SSC | Maximum completed VHM/Kisaragi/Daedalus/CHR/BAM/Merren, capped 2 | 10k/100k/150k each |
| Hartwell shipping | Same corporate maximum | 8k/75k/125k |
| Glitterfield miners, Pike miners, Cinderhook refiners, Roadstead export brokers, Hartwell machinery brokers, Hartwell Labor Exchange | Same corporate maximum, each separate provider/curve | 8k/75k/125k each |

House/Company identities remain distinct; no aggregate company is invented. Accord mediation is neutral ordinary contract service, not a House-favor penalty, rank-3 quest or political-allegiance test. Receiving minor-noble work at a major House site does not make that House the employer. The three senior Houses' mutual refusal must not spread to neutral Accord/minor nobles.

Recipient work consumes an unrelated-completion slot on earning tracks; it cannot feed whichever donor currently supplies the maximum. At an exact earned integer this does not reduce standing. A carrier who wants higher recipient access must establish the relevant House/corporate standing elsewhere. This is not circular: the earlier reviews and the four tracks above provide independent entry/advancement paths. **Halloran/SSC have no public starter freight in sampled windows**, and Labor Exchange is passenger work: do not claim every recipient supplies a freight introduction or can bootstrap its own recognition.

BFS→VHM and KIS-E→Kisaragi remain full-track explicit exceptions, not members of this capped fallback. A high Merren/BAM score must not bypass direct VHM/KIS own-track gates. Guild and five mixed civilian pools remain unassigned in production. The later [coverage audit](contract-reputation-coverage.md) extends recognition/income policy to these paid pools while preserving bootstrap certification, services and transit exceptions.

## 7. Reserved stages — explicit boundaries, not fabricated content

**Notoriety/contact trust:** no smuggling provider is currently registered. Keep the existing Notoriety meter and approved income targets as future policy, without classifying ordinary HSC exports, custody work, hidden-site names or scientific specimens as smuggling. Future contracts need an actual individual issuer/contact, authored illegality and earning event, their own trust/access requirements and a noncircular introduction. Global notoriety is not universal local trust or authority heat. Do not fabricate a central organization, distribute donor points, add law/customs confiscation or open hidden Barataria/Arkfall sites to manufacture a progression loop.

**Level 3 and commitments:** ordinary work stops at 2. BAM/Merren/Institutions intrinsically stop there; the original tracks with rank 3 need authored quest events. No automatic Seal adoption, Inquiry closure reward, corporate equity, new contacts or secret-plot disclosure. Retain existing authored refusal behavior (CHR 3 blocks Combine) and reviewed current-House-3 mutual refusal. Other directed allegiance caps, commitment reversal/reinstatement and exceptional floor-crossing rival events remain content decisions; no specific new target/cap pair is invented by this batch. A later quest implementation needs explicit rewards and replay/failed-save tests, not a permanent allegiance flag smuggled into routine completions.

This closes review coverage/disposition, **not implementation of absent stories**. No new save schema is justified until those events and contacts exist.

## 8. Fixed-reference audits

Tooling: `tests/audit-remaining-reputation.ts`, `tests/run-remaining-audit.mjs`. Six new earning-provider curves fit on days **0–15**, excluding important pools. Daedalus budgets Icarus entrusted commerce first within the premium share and fits the combined premium workload pool; it does not force an extra premium quota. Twelve inherited providers keep current calibrated prices exactly. Reference/check use retained actual-board censuses reconstructed at current prices; **days 128–143 were freshly generated after fitting**, with no holdout tuning.

| Provider | Reference commercial / important | Reference mix | Fresh commercial / important | Fresh mix | Fresh commercial medians |
|---|---|---|---|---|---|
| Daedalus | 410 / 459 | 19.0/60.7/20.2 | 416 / 474 | 18.8/61.3/20.0 | 15,645 / 174,290 / 307,164 |
| BAM | 297 / 148 | 20.2/60.3/19.5 | 302 / 146 | 18.9/63.6/17.5 | 20,000 / 200,000 / 302,259 |
| Merren | 683 / 240 | 20.1/60.2/19.8 | 672 / 235 | 19.9/60.6/19.5 | 10,000 / 100,000 / 149,999 |
| GOV | 161 / 113 | 19.9/60.2/19.9 | 168 / 118 | 15.5/60.1/24.4 | **7,052** / 49,997 / 99,957 |
| EDF | 186 / 137 | 19.9/61.3/18.8 | 192 / 136 | 18.8/60.9/20.3 | 5,000 / **43,040** / 99,899 |
| EIP | 515 / 280 | 19.6/60.4/20.0 | 521 / 283 | 19.2/62.0/18.8 | 5,021 / 50,000 / 99,988.5 |

All eighteen reference band medians are exact. Fresh important freight appearances: Daedalus **257**, BAM **33**, Merren **29**, GOV **34**, EDF **8**, EIP **283**. Fresh public entry freight: **40 / 20 / 38 / 7 / 13 / 12**. Counts are board appearances, not unique consignments, verified available itineraries or flights. Qualifications, balancing cash and private-source access remain separate.

**Unresolved new-provider deviations:** GOV entry median is about **41% high** versus approved 5k; EDF middle median is about **14% low** versus 50k. GOV needs wider fixed-reference calibration/new untouched validation before rollout; do not quietly change its target to 7k. Broader-epoch testing remains advisable for all six, not just the flagged windows.

### Covenant calibration follow-up — improved candidate, not live

The initial days-96–111 result remains preserved: entry median 11,037, mix 31.8/51.8/16.5. It is now **development evidence**, never relabeled unseen. Fit the unchanged approved classes on **days 0–127**, 1,422 Covenant appearances, before sampling the new days-128–143 window. Use a fixed gentler entry shoulder around the 5k median (the same square-root/log shape already used for CHR entry), retaining the ordinary economic ceiling; entry prices need not fill the entire 0–15k access band. No per-board quantiles, random splitting or quota enforcement.

Fresh days 128–143: **88 commercial / 85 important**, mix **19.3/60.2/20.5**, medians **5,192 / 25,000 / 50,058**; **13 public starter freight**, **32 important freight**. This substantially reduces the earlier entry-median error without changing targets or post counts. The old day-0–15 slice under this broad fit is 15.7/62.9/21.3 with entry median 4,627; it is no longer the fitting denominator. This is an improved rollout candidate, not a guarantee over every epoch or a completed funded return loop.

### Inherited-provider audit — prices unchanged, deviations visible

| Provider | Fresh ordinary mix 0/1/2 | Notable limitation |
|---|---|---|
| Accord | 22.0/54.4/23.7 | Slightly thin middle share |
| Other nobles | 18.7/61.0/20.3 | Seasonal route/retinue pool still matters |
| Halloran | 22.6/56.1/21.2 | No public starter freight in these samples |
| HSC | 16.9/63.2/19.9 | Regional/route mix varies |
| Miners Mutual | 28.5/53.7/17.7 | Large tied workload groups; reference already ~30/50/20 |
| SSC | 23.0/65.2/11.9 | Thin premium share; no public starter freight |
| Glitterfield miners | 21.4/60.5/18.1 | Prior check window premium share only 9.1% |
| Pike miners | 21.2/59.8/19.0 | Modest sampled drift |
| Cinderhook refiners | 28.5/54.4/17.1 | Small/tied pool drifts |
| Roadstead export brokers | 32.4/67.6/0 | Only 37 postings; no premium offer in fresh window |
| Machinery brokers | 20.2/62.7/17.2 | Modest sampled drift |
| Labor Exchange | 33.2/48.2/18.6 | Passenger-only; tied/rotating manifests |

Do not randomize prices to break ties, assign forced premiums or present approximate 20/60/20 as a per-board guarantee. These are existing inherited-provider deviations, not changes to their prices by this review. The test checks every projected recipient net against its unchanged current quote.

## 9. Validation and remaining implementation stages

- **157,388 review checks / 42,724 raw candidates / 3,182 actual day-0–3 postings**; eighteen remaining providers, all mapped-provider coverage, all six new providers' ordinary/important freight, shared institutional arithmetic, caps/floors/grace, recipient no-credit/no-refresh, explicit exclusions, pricing reconstruction with original reimbursements, quote immutability, private access and current runtime still inactive. Typecheck, Kisaragi/Covenant/House/VHM reviews (9,667 / 6,813 / 4,491 / 17,235), existing standing/Combine/CHR (10,046 / 9,260 / 2,009) and income (44,245) pass. Synthetic arithmetic and board generation, not a flown campaign.
- Reproduce: `node tests/run-equipment.mjs tests/remaining-reputation-review.test.ts`; `node tests/run-remaining-audit.mjs --reference FILE --covenant-reference FILE --first-day 128 --days 16`. `--input FILE` reuses a census; `--save-census FILE` refuses overwrite. Temp `remaining-review-20261104-{reference,check,fresh}.json`, `remaining-review-20261104-fresh-census.json`, and `covenant-broad-20261104-census.json` preserve fitted/held-out evidence. Without references the runner generates the declared development windows, not a rolling live fit.
- **Next implementation stage:** resolve GOV calibration, then move stable classifications/selected parameters into production without importing audit modules. Gains, counters, neutral notices, new-quote important pricing/refits and gates must ship together per coherent group; never enable all locks first.
- **Route/settlement stage:** exercise each earning track's actual 0→1→2 itinerary with qualifications/equipment/funding, current quotes, independent placement, refresh/decay and accepted legacy jobs. Verify atomic save failure/retry/stale callbacks including simultaneous House rivalry and CHR/Combine effects. Recipient-only employers must not change donor points or reset their counters.
- **Regression stage:** worker/fallback offer equality, unchanged IDs/seeds/order/fuel terms and unrelated prices, regional snapshots, Inquiry state, access/privacy, maintenance/equipment/economics, UI lock/notice layout and synthetic desktop native completion tests. No live-save edits or mobile testing without request. Full flown-campaign and broader balance evidence remain separate.
- No production/save/UI/fixture changes, browser/mobile/live-save tests, push or deploy in this review. No more entity-by-entity review pauses are needed to enumerate the public employers; this is the combined review pack and implementation backlog.
