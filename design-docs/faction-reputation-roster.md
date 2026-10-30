# Faction reputation — roster review

Updated: 2026-10-30 (Pacific)
Status: **Design only, not implemented; 20-track proposal rejected as too many.** Pete now targets about ten meaningful factions: three Wells Houses, Steel, the two interstellar corporations and story-interesting entities such as Covenant and Daedalus. Pete explicitly excludes the Guild: no Guild plots are planned. Pete approves a shared **Notoriety** track across smugglers, with missions supplied by individual contacts. This fills the tenth track alongside the current nine-entity working roster. Pete specifies four reputation levels (0–3), partial bar progress with effects only at full-bar thresholds, and Combine titles below. Pete specifies that VHM and KIS begin offering direct parent-company contracts at level 2. Earning/loss rates, other concrete benefits and implementation remain undecided; no organization mergers or save changes are approved. The current flavor-revision naming table below is a proposal except for Pete's two Combine titles; the plainer first draft is retained as superseded review history. Preserve any future `zzz` comments verbatim and record resolutions alongside them.

## Verified starting point

Baseline: `d82c7af`. There are **34 registered contract providers and 23 distinct emitted mission entity tags**, not 34 tagged factions. Eleven providers emit no tag. The other 23 each emit one distinct tag, although a provider need not tag every contract.

Evidence: read-only census of every registered provider across all catalog source IDs on world days 0–15, yielding 63,800 raw candidates; cross-checked tag assignments, shared helpers and display terminology in source. This is an inventory, not a board-frequency, economy or balance test. Temporary census script: `C:/Users/zruty/AppData/Local/Temp/audit-faction-tags-20261028.mjs` (filename is not the review date). No saves or browser state were used.

Source boundaries:
- `src/content/estella/faction-contracts/index.ts`: provider registry and candidate `factionId` / `factionTag` / issuer overrides.
- `src/career-contracts.ts`: candidate `factionTag` becomes the posting's `issuerTag`.
- `src/game.ts`: the board renders `issuerTag`.
- `src/content-terminology.ts`: current player-facing Shipyards wording; old operational IDs remain.
- `src/content/estella/faction-contracts/reach-settlement-contracts.ts`: `HSC` is present on sparse Thule/Barataria work. Most older Hartwell carrier work has individual company names and no tag. Do not miss HSC by scanning only the carrier's primary file.

## Current direction: nine faction candidates plus Notoriety

Pete's specified groups plus Covenant and Daedalus give **eight**, counting Kisaragi once across parent/local subsidiary. Cerberus occupies the ninth slot in the current working roster, used for Pete's subsequent request to name all ten tracks. On October 30 Pete rejects the Guild because no Guild plots are planned. Its existing services, certification missions, fuel role and contacts remain; do not invent Guild politics or a reputation grind to justify a slot.

October 30 follow-up: Pete supplies the tenth track, **Notoriety**, shared across all smugglers even though individual contacts give the missions. This supersedes the suggestion to leave slot ten open. A shared reputation-like measure does not create a unified smuggler organization.

| # | Proposed standing track | Narrative purpose |
|---|---|---|
| 1 | House Alvares | Civil authority, law, taxation and succession |
| 2 | House Mendes | Military patronage, mobilization and martial politics |
| 3 | House Nunes | Outer secrets, wardenship and learned patronage |
| 4 | The Steel Combine | Kuznia's industrial/social order and outsider relations |
| 5 | Voss-Heinkel Metricwerke | Interstellar propulsion power, certification and corporate trust |
| 6 | Kisaragi Harmony Shipyards | Interstellar prestige industry, exacting clients and corporate access |
| 7 | Covenant Remnants | Enclave society, competing orders and reserved succession stories |
| 8 | Daedalus Systems | Research, advanced technology and its reserved story material |
| 9 | Cerberus Human Resources | Acheron's coercive economy, Olympos interests and Pandemonium tensions |
| 10 | Notoriety — approved shared-track concept | Reputation across smuggling circles; missions remain contact-issued |

### Notoriety and individual contacts

Approved: one cross-smuggler reputation-like track, not one faction score per network or contact. Missions are offered by individual contacts rather than a newly invented centralized smuggler board.

Recommended interpretation for the next design pass: Notoriety measures how well known the pilot is in smuggling circles, while personal trust concerns an individual contact's willingness to rely on them. Being widely known does not mean every contact trusts the pilot. Keep authority attention / wanted status (if implemented later) distinct rather than automatically treating Notoriety as police heat. Exact benefits, earning/loss rules, contact thresholds and visibility remain undecided. Notoriety alone must not silently reveal hidden sites or grant blanket private travel access.

KIS/KIS-E would share the Kisaragi relationship; Bruckner can be the local contact/entry point to VHM without becoming its subsidiary. Whether particular BFS work earns VHM standing remains undecided: no automatic tag-to-score mapping is approved.

Other organizations remain employers, institutions, shops and potential contacts, but need not have independent faction-wide meters. Omitting GOV, EDF or ACCORD from this shortlist does not merge their authority into a House or corporation. Their legal/operational permissions need not be faction reputation. Smuggling now has the approved shared Notoriety concept alongside the intended personal contact-trust layer. Their interaction remains to be designed; neither is implemented.

## Approved reputation levels and bar progression — 2026-10-30

Pete specifies four effective levels, **0, 1, 2, 3**, presented as bars in the visual language of cargo condition / maintenance. Bars can be partially filled, but a level's effect is reached only when its bar is fully filled.

| Effective level | General meaning | Steel Combine title supplied by Pete |
|---|---|---|
| 0 | Unknown | No special title specified |
| 1 | Reliable contractor | No special title specified |
| 2 | Trusted friend | Honorary citizen |
| 3 | Almost “one of us” | Honorary Udarnik |

Display interpretation: **three fillable bars represent the three advances above level 0**. Zero full bars is level 0; one, two or three full bars gives the matching level. Fill them sequentially; a partially filled next bar shows progress, not a fractional benefit or an early promotion.

Illustrative text diagram, not a final widget design:

```text
[....] [....] [....]  Unknown
[####] [##..] [....]  Reliable contractor; halfway toward level 2
[####] [####] [....]  Trusted friend / Honorary citizen
[####] [####] [####]  Almost “one of us” / Honorary Udarnik
```

These are progress segments, not a chosen point economy: no 100-point thresholds, equal effort per level or specific task awards are implied. Existing level effects remain while the next bar fills; no next-level effect is granted early. If later rules permit reputation loss, the full-bar condition must be considered when deciding how current standing and reversible privileges fall; loss rates, permanent rewards and revocation details are not yet designed.

The common meanings can support faction-specific titles, as in the Combine examples. Those honorary titles do not by themselves authorize citizenship rights, actual Udarnik membership, prices, equipment, access or mission unlocks; concrete effects still need authoring. Notoriety's exact displayed titles and its interaction with individual contacts remain to be defined. This does not authorize additional per-contact numerical bars or a police-heat system.

Next design choices: earning/loss rules and progression effort; meaningful effects at each full-bar threshold; remaining faction-specific labels and Notoriety wording. No runtime or save work has started.

## Approved direct-contract threshold and first naming draft — 2026-10-30

Pete specifies that **VHM and KIS start offering direct contracts at level 2**. His message says “VFM”; interpreted as the existing VHM (Voss-Heinkel Metricwerke), not a corporation/tag rename. Parent-company direct work is distinct from Bruckner's local dealer/service work and KIS-E's local subsidiary work. Level 3 is closer insider standing, not the first direct-contract threshold. How pre-threshold offers are displayed, precise contract attribution and the treatment of existing accepted jobs still need design; no live board or contract has been changed.

First naming draft, superseded by the flavor revision below: all ten tracks, with level 0 consistently **Unknown**. These were proposals, except **Honorary Citizen / Honorary Udarnik**, supplied by Pete. Labels express standing; they do not independently grant military commissions, employment, religious membership or new benefits beyond the stated direct-contract milestone.

| Track | Level 0 | Level 1 | Level 2 | Level 3 |
|---|---|---|---|---|
| House Alvares | Unknown | Recognized Contractor | Court Favourite | Court Confidant |
| House Mendes | Unknown | Proven Contractor | Trusted Ally | Companion-in-Arms |
| House Nunes | Unknown | Discreet Contractor | Trusted Associate | House Confidant |
| Steel Combine | Unknown | Reliable Contractor | Honorary Citizen | Honorary Udarnik |
| Voss-Heinkel Metricwerke | Unknown | Recognized Subcontractor | Authorized Carrier | Trusted Partner |
| Kisaragi | Unknown | Approved Subcontractor | Accredited Carrier | Privileged Partner |
| Covenant Remnants | Unknown | Welcome Outsider | Friend of the Covenant | Honoured Companion |
| Daedalus Systems | Unknown | Reliable Contractor | Trusted Collaborator | Inner Circle |
| Cerberus Human Resources | Unknown | Approved Contractor | Trusted Agent | Company Insider |
| Notoriety | Unknown | Known Runner | Respected Smuggler | Underworld Insider |

Rationale: Alvares speaks in court/patronage terms, Mendes in martial companionship, Nunes in discretion/confidence; corporate tracks progress from intermediary work to direct dealings and privileged relationships. Covenant titles leave the pilot an honoured external associate, not a sealed member or holder of a religious office. Daedalus titles disclose no hidden research plot. Notoriety expresses a name recognized across smuggling circles, not universal trust from every contact or authority heat. Individual contact relationships remain separate.

## Current naming proposal — flavor revision, 2026-10-30

Pete requests level-0 variations, more ostentatious/feudal House titles and more flavor across every track. The following supersedes the plain naming draft as the current proposal, not as approved runtime copy. Level 0 still means no established standing, not hostility. The 0–3 meanings, full-bar thresholds, Combine's approved titles and level-2 direct VHM/KIS contracts are unchanged.

| Track | Level 0 | Level 1 | Level 2 | Level 3 |
|---|---|---|---|---|
| House Alvares | Unpresented Stranger | Carrier by Ducal Warrant | Favoured Client of the Court | Intimate of the Ducal Household |
| House Mendes | Unproven Outsider | Provisioner to the Banners | Honoured Ally of the House | Companion of the Marshal’s Table |
| House Nunes | Unintroduced Stranger | Bearer of the Watch Warrant | Esteemed Friend of the Outer Watch | Keeper of the House’s Confidence |
| Steel Combine | Outside the Plan | Recognized Contributor | Honorary Citizen | Honorary Udarnik |
| Voss-Heinkel Metricwerke | Unrated Operator | Field-Proven Contractor | Factory-Warranted Carrier | Partner of the Works |
| Kisaragi | Without Introduction | Proven Hand | Carrier of the Marque | Honoured Friend of the House |
| Covenant Remnants | Unsealed Stranger | Guest at the Gate | Friend of the Covenant | Unsealed Kindred |
| Daedalus Systems | Unknown Quantity | Known Quantity | Cleared Collaborator | Inside the Black Box |
| Cerberus Human Resources | Unassessed Asset | Useful Asset | Trusted Instrument | Friend of the Board |
| Notoriety | No Name | Safe Pair of Hands | A Name Worth Trusting | One of Our Own |

Naming rationale:
- House language is deliberately ceremonious: Alvares recognizes the pilot through court patronage; Mendes through supply service and proximity to the Marshal; Nunes through warrants, the outer watch and guarded confidence. These are proposed honorific relationship labels, not grants of nobility, office or military commissions.
- VHM uses severe factory/industrial recognition; Kisaragi uses craft and prestige-house vocabulary. Factory-Warranted Carrier and Carrier of the Marque are the proposed **level-2 direct-contract** titles, not delayed level-3 unlocks. No legal partnership/equity is implied by Partner of the Works.
- Covenant's Unsealed Kindred offers belonging without claiming the pilot has accepted a Seal. Daedalus's technical wordplay suggests increasing discretion without disclosing its hidden plot.
- Cerberus deliberately moves from assessing the pilot as an asset, through usefulness, to boardroom intimacy. The impersonal wording is the corporation's attitude, not a new custody/employment mechanic.
- Notoriety sounds like what smugglers say about someone rather than ranks awarded by a central authority. It does not establish universal personal trust or actual membership in an invented organization.

No proposed title is a new contract item, certification, institution, access permission or runtime change. Keep any future operator comments intact; title alternatives remain subject to review.

## Complete current tagged roster — original census

The role column summarizes existing identity, not proposed reputation rewards. The treatment column records the **superseded 20-track recommendation**, retained for comparison; the narrowed roster above is the current discussion. No mission tags or providers have changed.

| Tag | Current public entity | Stable provider ID | Existing identity / role | Proposed standing treatment |
|---|---|---|---|---|
| GUILD | The Teamsters' Guild | `teamsters-guild` | Professional organization, certification and fuel monopoly | Separate |
| GOV | Sector Government | `estella-government` | Commonwealth/Council civilian administration | Separate |
| EDF | Estella Defence Force | `estella-defence-force` | Military and system security | Separate |
| STEEL | The Steel Combine | `steel-combine` | Kuznia's planned industrial economy and political authority | Separate |
| CO-OP | New Canaan Miners Mutual | `new-canaan-miners-mutual` | Member claims, pooled supplies and mutual aid | Separate |
| EIP | Estella Institute of Planetology | `estella-institute-of-planetology` | Fuyuan-based system-wide scientific institute | Separate |
| BAM | Balor Advanced Materials | `balor-advanced-materials` | Engineer-led high-temperature materials industry | Separate |
| CHR | Cerberus Human Resources | `cerberus-human-resources` | Acheron custody/labor/extraction corporation | Separate |
| BFS | Bruckner Field Services | `bruckner-field-services` | Independent Estella service/dealer business closely tied to VHM | Separate from VHM |
| VHM | Voss-Heinkel Metricwerke | `voss-heinkel-metricwerke` | Interstellar propulsion manufacturer, sealed hardware and corporate authority | Separate from BFS |
| KIS | Kisaragi Harmony Shipyards | `kisaragi-harmony-yards` | Interstellar prestige shipbuilder and parent custody/acceptance work | Shared Kisaragi standing with KIS-E |
| KIS-E | Kisaragi Shipyards Estella | `kisaragi-yards-estella` | Local subsidiary supplying and coordinating leased facilities | Shared Kisaragi standing with KIS |
| HALL | Halloran Smelting House | `halloran-smelting-house` | Established Belt smelting business | Separate |
| MERREN | Merren Conservatory | `merren-conservatory` | Kalyna owner, biological industry and producer-community patron | Separate |
| SSC | Svarog Shipyard Company | `svarog-yard-company` | Independent operator of shared shipyard infrastructure; not its tenant builders | Separate |
| DAEDALUS | Daedalus Systems | `daedalus-systems` | Coimbra electronics, compute and research company | Separate |
| ACCORD | Oathmark Accord Authority | `oathmark-accord-authority` | Neutral statutory infrastructure, certification and arbitration authority | Separate |
| ALVARES | House Alvares | `house-alvares` | Ducal civil authority, assessment, courts and ceremony | Separate |
| MENDES | House Mendes | `house-mendes` | Muster logistics, military readiness and martial patronage | Separate |
| NUNES | House Nunes | `house-nunes` | Outer wardenship, sensitive custody and learned patronage | Separate |
| COVENANT | Covenant Remnants | `covenant-remnants` | Enclave society with distinct religious/medical/industrial/military orders | Separate, no automatic order-level split |
| NOBLE | Wells Noble Houses | `wells-noble-houses` | Shared provider for lesser households, not one united House | No single faction-loyalty meter |
| HSC | Hartwell Shipping Companies | `hartwell-shipping-companies` | Shared provider for independent carriers and spot-freight houses | No single corporate-loyalty meter |

## Initial assessment — superseded by the ten-faction direction

**Enough to start; not too many organizations for Estella, but too many if every tag automatically becomes an equal-size faction campaign or mandatory grind.** A useful standing belongs to an organization that can remember the pilot, make coherent decisions and offer distinctive consequences. Neither a code module nor a board abbreviation proves that such an organization exists.

Initial recommendation, now rejected as too many: **20 independent standing tracks** from the current tagged set:

`23 tags − HSC aggregate − NOBLE aggregate − one duplicated Kisaragi track = 20`.

This means 19 other organizations plus one Kisaragi family standing. It does not mean removing three tags, rewriting any providers or requiring twenty mission chains immediately. Reveal standings as relevant organizations are encountered; ordinary commercial reliability need not carry the same narrative weight as political allegiance. Exact discovery/display rules remain to be designed.

### Decisions worth making explicitly

1. **Share KIS / KIS-E standing.** They are parent and local subsidiary serving the same marque; two parallel meters risk duplicating the same career ladder. Keep both tags and their distinct contracts. Parent-company prestige/custody work can still require additional qualifications or a particular introduction; a shared score must not automatically grant every clearance. Keep two standings instead only if disagreement between local and parent management is a deliberate gameplay feature. That alternative gives 21 rather than 20 tracks.
2. **Keep BFS / VHM separate.** Bruckner is an independent dealer/service business, not simply VHM's local company name. A reliable relationship with Bruckner and acceptance by VHM's factory auditors have different meaning. Referrals or endorsements could connect them later; no automatic equal gains or corporate merger is implied.
3. **Keep GOV / EDF separate.** Civilian political favor is different from military operational trust. One should not automatically substitute for the other.
4. **Keep the three senior Houses separate, and ACCORD independent.** Their competing claims are central to Wells politics. Do not collapse them into a generic Wells reputation, or treat neutral Accord work as Mendes loyalty merely because facilities share a region/history.
5. **Do not make HSC a fictional shipping cartel.** The shared tag does not establish shared ownership, leadership or a common customer blacklist. Individual authored carrier contacts can have personal trust later; ordinary work can remain part of the pilot's professional record without a new faction bar.
6. **Do not turn NOBLE into a fourth united House.** Seven named lesser seats currently share its provider: Beira, Tinto, Calatrava, Almaden, Marisma, Cadiz and Teide. A later story can give a particular household its own standing/contact. Cross-court social prestige is another possible mechanic, but it would be prestige, not loyalty to a united faction. Current candidate code chooses the paying office by source/destination; future per-house attribution needs an explicit stable identity, not a name-string guess or credit for both endpoints.
7. **Retain small but coherent firms.** BAM, Halloran and SSC are real organizations with different interests. Their standing can be simpler than a major House's without merging unrelated companies into an invented industrial bloc. SSC does not own Kisaragi; EIP, Merren and Nunes' learned estate are not one science faction.

## Untagged providers — not missing factions by default

The eleven providers with no emitted tag are:
- Glitterfield Mining Companies.
- Pike Mining Companies.
- Cinderhook Refining Houses.
- Roadstead Export Brokers.
- Hartwell Machinery Brokers.
- Hartwell Labor Exchange.
- Independent Gaia, Dahai, Camps and Sahra bookings (four providers).
- Independent Weymark bookings.

Most represent multiple small firms or civilian customers. Hartwell Labor Exchange is an institutional posting network used by multiple desks, not one company. Do not create one faction per generated business or turn a whole planet's civilian bookings into political allegiance. A particular institution/customer can become a faction later if it gains coherent authored agency. Maintenance businesses likewise do not become factions merely because they have named staff and service accounts.

## Where the roster is thin

The imbalance is **institutional/corporate coverage versus informal or oppositional networks**, not a shortage of total names.
- **Smuggling contacts/network(s):** still need authored people and relationships for Barataria's work. The shared Notoriety track is now approved above; one network versus several, identities and membership remain open. A common reputation-like track does not imply a universal criminal faction or centralized mission issuer.
- **Local communities / opposing interests:** Pandemonium's self-governing workers should not be represented solely by CHR standing. Thule's refuge communities or a specific lesser House might also need their own relationship when an authored story makes it meaningful. Start with local contacts if that is sufficient; no automatic system-wide resistance or settler faction.
- **Special story actors:** keep future private actors private; do not expose secrets as public reputation rows. A story contact does not necessarily need a faction-wide numerical score.

No additional faction is required before designing standing for the existing organizations. Leave room for specific later additions rather than pre-populating dozens of empty meters.

## Boundary for the next design step

Next: finalize roster details, earning/loss rules, progression effort, meaningful benefits at the four approved levels, remaining faction-specific titles and exceptions. Keep personal contact trust distinct from organization-wide standing. Preserve ordinary public-board visibility/access unless an explicit later policy approves a change; existing public contracts authorize private arrivals and Farwatch remains contract-only. Do not infer hostility changes from routine commerce or apply a blanket reputation formula yet.

No runtime change, new provider, tag rename, company merger, reward rebalance, contact unlock, save migration, push or deploy is part of this review.
