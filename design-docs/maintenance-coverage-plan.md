# System-wide maintenance coverage — approved staged plan

Updated: 2026-10-27
Status: Stage 3 copy approved and everyday coverage implemented. Stop for rollout review before Stage 4. Each stage requires separate approval.

Canonical details: [reviewed specification](maintenance-stage-1-specification.md), [complete roster](maintenance-stage-1-roster.md), [Stage 2 handoff](maintenance-stage-2.md). Pete's original `zzz` comments and their resolutions remain in the specification.

## Service model

| Internal class | Experience |
|---|---|
| −1 | Free emergency self-help where no staffed service exists; no invented resident mechanic |
| 0 | Look for a local mechanic; basic servicing, limited repairs and inexpensive parts |
| 1 | Modest professional workshop; mostly shared planetary prose |
| 2 | Bespoke full-service workshop, approximately one per inhabited world or practical service area |
| 3 | Rare elite facility supporting all existing repair complexities and equipment installations |

Never show these numbers or the word “tier” to players. Existing A–F diagnosis, work quality and stock rules remain distinct from facility classification. Preserve universal standardized component replacement at staffed workshops.

Approved basic-mechanic honesty: **0.95 generally, 0.8 in the Wells**. Professional defaults remain honest; deliberate named exceptions such as Red Dust remain. Four elite landmarks: Bruckner, Serrat, Rochefort and Svarog. Only the first two already exist as staffed elite businesses.

One free referral interaction names the normal higher facility and, if it is not already elite, an elite alternative. Authored practical service catchments are approved; do not claim dynamically shortest travel times. Approved future shops may be named before implementation. Referrals do not activate shops, expose private locations or grant flight permission.

Emergency restart is also available at staffed shops, avoiding maintenance stranding when the player cannot afford work. It restores minimum operating condition without replenishing routine service protection, changing component grades or granting optional equipment. No towing, teleportation, new economic provider or wear-system rewrite.

## Stage 1 — Coverage map and specification

**Completed and reviewed.** Audit physical scopes rather than raw catalog IDs. The final map specifies 150 staffed facilities and nine emergency-only locations across 159 physical destinations; nonselectable Coronal remains outside the rollout.

The specification records exact service defaults, commercial exceptions, 26 full-service anchors, four elites, account IDs and all review resolutions. Existing reports/credits use existing rules; no policy-version migration layer.

## Stage 2 — Shared machinery and Weymark pilot

**Implemented and reviewed**, including the grounded-only restart correction (`429b54a`).
- One shop registry supplies generated directory entries; shared physical scope logic prevents duplicate berth services.
- Internal facility metadata and natural-language facilities descriptions.
- Free normal/elite referrals, including references to approved future facilities.
- Low Gauge mechanic, Weymark Town Workshop, bespoke Nell's Rest Shipworks and existing Bruckner.
- Emergency self-help fills current unserved locations; the same recovery action is available at normal shops. Abandoned sites remain unstaffed.
- Approved basic honesty values. Existing named shops otherwise retain prices, capabilities and prose; Cadiz's later upgrade has not happened.
- Synthetic-profile desktop preview, real transaction tests, save-failure checks and ordinary regressions.

**Gate passed:** Pete asked to proceed after the emergency-copy and grounded-only corrections. This authorizes preparing the Stage 3 copy review, not bypassing it.

## Stage 3 — Everyday system-wide coverage

**Approved and implemented (`c4dd734`):** [complete copy](maintenance-stage-3-copy-review.md) contains 49 shared sets, 15 retained authored sets, all 159 location/account mappings and all 281 expanded referral lines. Runtime copy audit: `node tests/audit-maintenance-stage-3-copy.mjs`. Live coverage is 150 staffed facilities and nine emergency-only stops. See the [rollout handoff](maintenance-stage-3.md).

1. Generate `maintenance-stage-3-copy-review.md` containing **all Stage 3 copy, not samples**: shared planetary/regional sets, reused text, local exceptions, shop/directory names, profiles, facilities, diagnosis, service, repairs, referrals and any new UI wording.
2. Include the exact location-to-template mapping and substitution values. Shared prose appears once; every distinct variant is included.
3. Deliver the Markdown for comments. Preserve every `zzz` comment verbatim, record resolutions alongside it and wait for explicit copy approval.
4. Only then implement the approved ordinary coverage, including professional interim workshops at future bespoke sites. Existing authored businesses take precedence. Temporary emergency entries disappear when staffed service opens; the free restart remains available there.
5. Check runtime prose against the approved Markdown and audit every physical scope.

**Copy gate passed. Current gate:** coverage and desktop rollout review before Stage 4. No automatic continuation.

## Stage 4 — Bespoke full-service anchors

Implement the remaining 25 full-service anchors beyond the pilot. Each receives distinctive premises, personnel and separate diagnosis/service/repair/referral dialogue. Vary staging and describe competence affirmatively. Existing civic/industrial operators can host workshops without creating new system-wide corporations.

Cadiz's Vilar flagship gains B-quality work while retaining its other commercial terms. Preserve existing account IDs. All but the highest-complexity repairs must actually work, not merely be advertised.

**Gate:** review the complete bespoke roster, writing and actual offerings before elite expansion.

## Stage 5 — Elite landmarks and acceptance

Add Rochefort and Svarog elite service, retaining Bruckner and Serrat's established identities. Do not invent new equipment, technologies, dealership rights or additional locations merely to fill a regional quota.

Validate final coverage, referrals, all repair complexities, equipment, emergency departure, inspection credits, exact charges/time, failed persistence, private access and hidden internal labels. Shipping and flight physics remain unchanged. Desktop/synthetic profiles only unless asked otherwise.

**Gate:** final network review. Commit locally at each stage; no push or deploy without request.
