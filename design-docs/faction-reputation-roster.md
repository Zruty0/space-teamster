# Faction reputation — roster review

Updated: 2026-10-29 (Pacific)
Status: **Design proposal only.** Pete requests the mission-tag roster and an assessment of whether it supplies too many or too few factions. No reputation scores, mergers, new factions, gates or save changes are approved here. Preserve any future `zzz` comments verbatim and record resolutions alongside them.

## Verified starting point

Baseline: `d82c7af`. There are **34 registered contract providers and 23 distinct emitted mission entity tags**, not 34 tagged factions. Eleven providers emit no tag. The other 23 each emit one distinct tag, although a provider need not tag every contract.

Evidence: read-only census of every registered provider across all catalog source IDs on world days 0–15, yielding 63,800 raw candidates; cross-checked tag assignments, shared helpers and display terminology in source. This is an inventory, not a board-frequency, economy or balance test. Temporary census script: `C:/Users/zruty/AppData/Local/Temp/audit-faction-tags-20261028.mjs` (filename is not the review date). No saves or browser state were used.

Source boundaries:
- `src/content/estella/faction-contracts/index.ts`: provider registry and candidate `factionId` / `factionTag` / issuer overrides.
- `src/career-contracts.ts`: candidate `factionTag` becomes the posting's `issuerTag`.
- `src/game.ts`: the board renders `issuerTag`.
- `src/content-terminology.ts`: current player-facing Shipyards wording; old operational IDs remain.
- `src/content/estella/faction-contracts/reach-settlement-contracts.ts`: `HSC` is present on sparse Thule/Barataria work. Most older Hartwell carrier work has individual company names and no tag. Do not miss HSC by scanning only the carrier's primary file.

## Complete current tagged roster

The role column summarizes existing identity, not proposed reputation rewards. Recommendations concern future standing ownership, not changes to mission tags or economic providers.

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

## Is this too many?

**Enough to start; not too many organizations for Estella, but too many if every tag automatically becomes an equal-size faction campaign or mandatory grind.** A useful standing belongs to an organization that can remember the pilot, make coherent decisions and offer distinctive consequences. Neither a code module nor a board abbreviation proves that such an organization exists.

Preferred starting roster: **20 independent standing tracks** from the current tagged set:

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
- **Smuggling network(s):** the clearest later addition, needed for Barataria's contact-trust-gated work. One network versus several, identity and membership are still open. Do not invent a universal criminal faction just to fill the gap.
- **Local communities / opposing interests:** Pandemonium's self-governing workers should not be represented solely by CHR standing. Thule's refuge communities or a specific lesser House might also need their own relationship when an authored story makes it meaningful. Start with local contacts if that is sufficient; no automatic system-wide resistance or settler faction.
- **Special story actors:** keep future private actors private; do not expose secrets as public reputation rows. A story contact does not necessarily need a faction-wide numerical score.

No additional faction is required before designing standing for the existing organizations. Leave room for specific later additions rather than pre-populating dozens of empty meters.

## Boundary for the next design step

After roster decisions: define what a standing measures, earning/loss rules, ranks, meaningful benefits and faction-specific exceptions. Keep personal contact trust distinct from organization-wide standing. Preserve ordinary public-board visibility/access unless an explicit later policy approves a change; existing public contracts authorize private arrivals and Farwatch remains contract-only. Do not infer hostility changes from routine commerce or apply a blanket reputation formula yet.

No runtime change, new provider, tag rename, company merger, reward rebalance, contact unlock, save migration, push or deploy is part of this review.
