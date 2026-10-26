# System-wide maintenance coverage — proposed staged plan

Updated: 2026-10-26
Status: **five-stage outline approved2026-10-26, with exhaustive Stage3 Markdown copy review required before rollout.** No individual implementation stage started; retain separate approval gates. Outline approval is not blanket authorization to roll out shops.

## Requested shape

Four internal facility tiers, never shown to the player:

| Internal tier | Player experience | Distribution/copy |
|---|---|---|
| 0 | Look for a local mechanic; limited tools, basic diagnosis/service/repairs and inexpensive replacement parts | Fallback at staffed working destinations; regional/planetary shared archetypes, not a named NPC at every dock |
| 1 | Modest professional workshop; ordinary servicing and repairs, standard parts | Common facilities; usually one shared copy set per planet, local shop/location substitutions |
| 2 | Full-service workshop; everything except the most complex repair work | Bespoke business, staff and dialogue; approximately one per inhabited planet or practical settlement group, explicit exceptions |
| 3 | Exceptional specialist service; all existing repair complexities and full equipment-installation capability | Few system-wide landmarks; fully bespoke |

“Everywhere” is proposed to mean every staffed, operational destination, including private sites once legitimately reached. Unstaffed drops, abandoned outposts and reserved sites need explicit exclusions rather than invented resident mechanics. Existing access rules remain unchanged. Coverage is by physical terminal scope, not raw catalog IDs or duplicate city districts.

Honesty is independent of facility capability. Recommend new generic mechanics and ordinary professional shops be honest by default; scarcity/tools/stock differentiate them. Preserve deliberate characters such as Red Dust's Calder family. Stage 1 explicitly reviews whether the existing Wells generic's honesty should increase; do not silently change its social setting or export its dishonesty everywhere.

## Verified starting point

Read against game0324dea on2026-10-26:
- Twelve authored shops plus generated Wells fallback shops. Bruckner Central Service Hall and Serrat Domain Civil Refit Office already have A diagnostic/work capability. Other named shops vary independently in capability, stock, prices, hours and honesty.
- `src/maintenance/shops.ts` separates diagnostic/work/stock grades, labor rate, hours multiplier, markup and honesty. Current maintenance transactions, inspections/credits, fault knowledge, optional equipment and shop-local access already exist.
- `src/local-directory.ts` independently generates Wells fallback entries. Consolidate coverage decisions so shop and directory registries cannot disagree; retain authored bespoke entries and avoid circular imports.
- **Universal replacement is intentional:** existing design makes standardized component replacement F-complexity, available at every mechanic, even when the mechanic cannot identify or repair the fault. Parts quality/service result differ. Preserve this safety valve, not a new capability restriction that grounds players permanently.
- Existing A–F component/work grades are separate from the new four facility tiers. Parts grades remain in replacement quotes; facility tiers never appear in player text. Replace the current generic profile heading “Shop level” with “Facilities” or “Services”.

## Proposed implementation principles

### Capability and economics

Provisional new-shop defaults: tier0 diagnostic E/work F; tier1 diagnostic C/work D (current standard professional baseline); tier2 diagnostic B/work B (repairs B–F); tier3 diagnostic A/work A (repairs A–F). Stage 1 verifies these against the actual fault catalog and representative quotes before approval. Existing named B/C and other intermediate shops need individual classification; no automatic capability upgrade just because a shop is bespoke.

Tier is organizational metadata, not a second competing quote/capability engine. Existing grades still drive diagnosis, repair eligibility and service results. Stock, equipment installations, markup, labor speed, honesty and price remain explicit shop attributes. Stage 1 specifies each default and exception, including sensible upgrade/install availability. Tier3 means all supported kinds of work, not that every business must stock every component grade. Do not silently change existing named-shop rates/stock/capabilities to force a neat ladder.

Shared planetary copy does not mean shared shop state: each physical branch keeps its own stable ID, inspection and credit. Upgrade existing shops in place where possible. If a fallback is replaced by a different business or duplicate scopes are consolidated, explicitly approve a legacy-ID/credit-history mapping rather than dropping old balances or granting credit at unrelated branches.

No wear/telemetry/RNG rebalance, changed fault libraries, new equipment, finite inventory, parts-delivery simulation, towing/rescue or added transport missions. No new system-wide corporation/faction required. Preserve existing shop IDs, branch-specific inspections, unused credits, saved claims, career state, quotes outside approved changes and all shipping programmes.

### One referral interaction

Every lower-tier shop gets a free service-desk action, available before paid inspection: **“Where can I get more advanced work done?”** The response names a real higher-tier shop, its physical location and useful capabilities. Shared archetypes frame the same data in regional language; bespoke shops speak in their own voice. It is advice, not teleportation or automatic flight booking.

Proposed definition of nearest: another shop in the same physical terminal scope first; otherwise shortest normal flight-time estimate using existing route machinery at inquiry time, deterministic tie-breaking. Choose among **all strictly higher tiers**, not necessarily exactly the next tier. No raw catalog-coordinate distance across unrelated reference frames. Stage 1 confirms estimator suitability/cost and records any necessary explicitly authored fallback before implementation. No expensive route search each render frame.

Only activated shops with legitimate destination access qualify as ordinary referrals. Default to public destinations; respect exact known-contact access where applicable. Never reveal undiscovered Barataria surfaces, grant contact reputation, or imply Farwatch permits an empty arrival. Private destination servicing may exist locally without becoming a public referral. No referral cycles (strictly increasing tiers), self-referrals, duplicate physical destinations or references to future-stage shops.

A referral does not diagnose unknown faults or promise that every higher shop can repair every problem. When discussing already confirmed work, distinguish general improvement from a destination actually capable of that work. Current rig/flight restrictions remain enforced; a grounded player may receive advice but cannot fly away until locally restored. Universal local replacement supports recovery at staffed sites, subject to normal money/stock rules. Exhausted funds and deliberately unstaffed sites are not silently solved by a new rescue system.

## Five approval-gated stages

### 1 — Coverage map and service specification (design only)

- Audit every playable physical destination and current shop, including aliases, orbital/surface separation, private access and unstaffed reserves.
- Produce a reviewable table: location, existing/proposed shop, tier, planet/copy family, operators, diagnostic/work/stock/equipment capability, prices/time/honesty, referral options and exclusions.
- Select the approximately one-per-world tier2 anchors and small tier3 shortlist; state exceptions for moons, gas-giant systems, sparse Reach sites and large industrial worlds.
- Inventory existing named-shop exceptions, grade coverage, earliest-career equipment access, local replacement recovery and preservation of old inspection IDs.
- Recommend the exact Wells honesty policy. No invented staffing at Nell's Lantern, Old Survey Camp, hidden dead drops or other deliberately empty sites.
- **Review gate:** approve the coverage roster, economic defaults, exceptions and nearest-referral rule. No runtime changes in this stage.

### 2 — Shared implementation and Weymark pilot

- Add internal tier metadata, coverage/copy-family resolution and shared directory registration; preserve stable existing shop IDs. Reuse existing service/quote/transaction code.
- Implement the free referral interaction and player-safe facilities descriptions. Test hidden tier labels, stale actions, physical scope, access, deterministic referrals and no remote transactions.
- Proposed pilot: Low Gauge local mechanic (0), Weymark Town professional workshop (1), bespoke Nell's Rest facility (2), existing Bruckner Central Service Hall (3). Leave Nell's Lantern and Old Survey Camp unstaffed. Exact names/capabilities come from the approved stage1 roster.
- Synthetic desktop walkthrough of all four experiences, service/repair/replacement/equipment and referral chains. Test old credits/reports and a grounded rig; retain current Bruckner behavior unless explicitly changed in stage1.
- **Review gate:** approve the actual interaction, copy style, capability/price distinctions and four-level pilot. No automatic system-wide expansion.

### 3 — Everyday system-wide coverage (0 and 1)

- First generate `design-docs/maintenance-stage-3-copy-review.md` for Pete's inline comments, covering **all Stage3 copy, not samples**: shop/directory names and descriptions, facilities summaries, profiles, diagnosis, service, repairs, referral prompts/responses and any other new or revised player-facing strings.
- Include every shared planetary/regional text set (including reused copy), all exceptions/overrides, and an exact location-to-template mapping with substitution values. Shared prose need only appear once, but no unique wording or local variant may be omitted. Small location substitutions; moon/cluster exceptions only where setting warrants them. Tier0 may share broader regional archetypes, but Wells serf copy stays local to its setting.
- **Pre-rollout copy gate:** deliver the complete Markdown for review, preserve Pete's `zzz` comments verbatim with resolutions alongside, revise, and wait for explicit copy approval. Do not implement unreviewed Stage3 prose. Later wording changes must be reflected in the review Markdown.
- After approval, apply the per-location map outside the pilot, using mechanic fallbacks and modest professional facilities; authored shops take precedence. No blanket generation at every catalog node. Apply only approved Wells honesty/template changes; retain distinct named businesses and historical saved state.
- Referral searches use only currently live shops; existing advanced anchors remain available while later shops await implementation.
- **Completion gate:** coverage report and desktop checks verifying runtime text against the approved full Markdown; every intended working stop has a functioning service option, exclusions explicit, no shop/directory duplication or leaked private destinations.

### 4 — Bespoke full-service regional anchors (2)

- Author the approved roughly one-per-world facilities, with distinctive premises, operator/personality, prices/stock, and separate diagnosis/service/repair/referral dialogue.
- Use existing industrial/civic operators where appropriate; local shop names/staff do not require new economic providers. Do not make every shop another diagnostic cradle/flight recorder scene; describe competence affirmatively.
- Existing named businesses are retained, explicitly reclassified or deliberately upgraded according to the approved roster, never overwritten by generated prose.
- All repairs except the highest complexity are actually available; routine equipment installations and stock follow the approved matrix. Referral names/destinations update from live data automatically.
- **Review gate:** regional shop roster, bespoke text, actual service coverage/quotes and equipment availability. Stop before adding further elite sites.

### 5 — Elite landmarks and system-wide acceptance (3)

- Retain Bruckner/Weymark and Serrat Domain as natural existing advanced anchors. Propose only a small additional shortlist, likely a Hearth industrial hub; exact count/locations approved in stage1, not one per region by default.
- Finish bespoke elite service identities and the complete existing-work/equipment capability, preserving approved specialist stock/pricing differences. No new engine technology or unsupported work categories.
- Exhaustive coverage/referral tests, representative damaged/grounded rigs at every facility class, money/time/inspection-credit accounting, old save/reload behavior, hidden/internal labels, private and contract-only access, atomic failures and all equipment/replacement rules.
- Verify all non-maintenance economies/flight physics/accepted contracts remain unchanged. Run relevant regressions/build and isolated native desktop flows; no mobile or live-save edits.
- **Review gate:** final coverage matrix, remaining intentional exceptions, referral destinations and price/service comparisons. Only then declare maintenance coverage complete.

Every runtime stage is independently testable, committed locally and followed by review. Approval of a stage does not approve the next stage; no push/deploy without request.
