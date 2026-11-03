# Reputation contract income — target medians

Updated: 2026-11-03 (Pacific)
Status: **Approved by Pete on November 3; not yet implemented.** Approval covers the full revised 22-row median table and income/trust separation; exact band boundaries and quote calibration remain open. User direction supersedes the Cerberus proposal's job-type-first economic gating. Combine runtime `3e36373` still uses its authored template classes until a revised implementation is authorized. [Progression framework](faction-reputation-progression.md); [Cerberus audit and earlier proposal](faction-reputation-cerberus.md).

## Direction and interpretation

- Review **expected net credits at par**: total contract pay including fuel reimbursement minus par fuel cost, before handling/comfort penalties, maintenance, positioning and time costs.
- Pete wants level-0 target medians **5,000–20,000 cr**, generally around **10,000 cr**. Even Cerberus level-0 jobs should offer no more than **roughly 40,000 cr**. Treat this as a proposed level-0 upper boundary, not its median or a finalized exact rounding rule.
- Higher-earning work moves to a higher economic access band, regardless of whether its cargo sounds routine. Do not leave a 134,000 cr ordinary freight job at level 0 solely because it carries basic industrial goods.
- Level-1 medians vary by employer, reaching **200,000 cr for the wealthiest**. This is a median ceiling, not yet a universal per-job cap.
- **Follow-up correction:** 300,000 cr is the level-2+ anchor for high-paying corporations, **not a common target for everyone**. Pete places lower-paying commercial employers such as Halloran, Accord and Miners Mutual at roughly half the higher-paying CHR/BAM scale. Non-corporations should pay less again. These are economic bands, not changes to an entity's legal form or ownership.
- **Steel Combine:** retain zero fees plus fuel compensation at levels 0/1; Pete sets the level-2 export median at **about 30,000 cr**. This supersedes the previous 300,000 cr export proposal.
- Level 3 remains quest-only advancement; the level-2+ column does not add a third level to capped tracks or require another ordinary pay class.

## Approved target table

All cells are **median net credits at par for the newly unlocked commercial work**, not the median of every lower-level job still available to a pilot. Important low-paying reputation work is measured separately, as below. Pete approved these individual allocations after the wealth-scaling correction.

| Employer/entity | Level 0 | Level 1 | Level 2+ |
|---|---:|---:|---:|
| House Alvares | 5,000 | 60,000 | 100,000 |
| House Mendes | 5,000 | 50,000 | 90,000 |
| House Nunes | 5,000 | 40,000 | 75,000 |
| Steel Combine | 0 | 0 | 30,000 (exports) |
| VHM — direct parent work | — | — | 300,000 |
| Bruckner | 10,000 | 100,000 | 150,000 |
| Kisaragi — direct parent work | — | — | 300,000 |
| KIS-E | 10,000 | 100,000 | 150,000 |
| Covenant Remnants | 5,000 | 25,000 | 50,000 |
| Daedalus Systems | 15,000 | 175,000 | 300,000 |
| Cerberus Human Resources | 20,000 | 200,000 | 300,000 |
| Balor Advanced Materials | 20,000 | 200,000 | 300,000 |
| Merren Conservatory | 10,000 | 100,000 | 150,000 |
| Estella Institutions (GOV/EDF/EIP) | 5,000 | 50,000 | 100,000 |
| Oathmark Accord | 10,000 | 100,000 | 150,000 |
| Other noble households | 5,000 | 30,000 | 60,000 |
| Halloran | 10,000 | 100,000 | 150,000 |
| Hartwell shippers | 8,000 | 75,000 | 125,000 |
| Miners Mutual | 10,000 | 100,000 | 150,000 |
| Svarog Shipyard Company | 10,000 | 100,000 | 150,000 |
| Other independent commercial employers | 8,000 | 75,000 | 125,000 |
| Smuggling contacts (Notoriety recognition) | 5,000 | 60,000 | 100,000 |

VHM/Kisaragi direct work still conceptually begins at 2; Bruckner/KIS-E offer earlier work using those standings. Bruckner remains independent, not a VHM subsidiary. Shared recognition does not require identical pay schedules or merge employers. The independent commercial row groups the six currently mapped mining/refining/export/machinery/labor providers for these shared targets only. GOV/EDF/EIP share a standing; their separate programmes can be refined later. Smuggling remains individual-contact work with separate personal trust, not a unified faction board or automatic hidden-site access. Guild and mixed civilian pools have no assigned reputation rule and are excluded rather than inventing new rank gates.

## Economic gate AND authored trust gate

Eligibility must satisfy both:

`effective employer reputation >= economic minimum for expected earnings`

**AND**

`effective employer reputation >= authored trust minimum for this assignment`.

Equivalently, required reputation is the maximum of those two minima. Existing licenses, equipment, contacts and explicit employer refusals still apply; neither test overrides them.

Important reputation-driving work may pay at roughly that entity's **level-0 median while requiring level 1**. It should be a separate reward/qualification class, not treated as a high-paying posting merely because its trust gate is 1. Higher-paying routine work does not automatically become advancement work.

Examples (illustrative, not extra approved cutoff rules):
- Cerberus ordinary industrial freight earning 134,000 cr: level-1 economic work, even with a routine cargo; no advanced reputation award unless separately authored.
- A Cerberus important assignment earning 15,000 cr: economic minimum 0, trust minimum 1; only available at 1, and can advance 1→2.
- Paying 300,000 cr does not earn level-3 reputation; 2→3 still needs special quests.

## Still to choose before implementation

- Exact per-entity earning-band boundaries versus these median targets; do not manufacture a 1→2 cutoff from the median alone. Earnings below a boundary need not imply employer trust.
- How to provide enough real low-earning jobs to establish standing: reclassifying all current high-paying CHR freight upward alone would leave no basic freight at 0 in the measured sample (minimum 51,597 cr). Rebalance/select low-paying work deliberately rather than silently granting free rank or leaving a circular gate.
- Credit-first quote calibration without rewriting accepted quotes. No flat-fee model, universal coefficient, hard income clamp or blanket reduction of all existing contracts is selected by approval of these targets.
- Validate distributions per newly unlocked economic band, with important low-paying work reported separately; do not claim that a median is a per-job cap or a minimum guarantee. Freeze/recompute policy for quote-dependent gates and historical accepted work needs explicit implementation review.
