# Rig equipment

Updated: 2026-10-08

## Implemented: atmospheric equipment

Equipment is purchased through **Local Directory → shop → Equipment**. Ship Status remains inspection-only with seven systems and a separate Optional Equipment list.

| Equipment | Baseline parts | Authored installation | Behavior |
|---|---:|---:|---|
| Atmospheric Package | 120,000 cr, grade D | 19h | Installs Heat Shielding (30k/6h), Atmospheric Surfaces (60k/8h), and Surface Actuators (30k/5h). |
| Heavy Heat Shielding | 60,000 cr | 6h | Augments the installed package with 4× normal thermal resistance. |

Package components may be purchased at each stocked grade. Existing grade price/HP/AP rules apply. Shop parts markup and labor-hours multiplier apply to both products; displayed, billed, and elapsed hours agree. New package components receive full HP and the installing shop's serviced AP. A partial package order installs and charges only for missing components, preserving all existing grades, HP/AP, faults, and service records.

Heavy shielding has no separate component grade or condition pool: its protection belongs to the existing Heat Shielding component, whose faults, restrictions, and maintenance still apply. Buying the augmentation does not service or repair anything. A later Heat Shielding component replacement retains the augmentation. Removing the Atmospheric Package removes Heavy Heat Shielding too.

Vendors: all six Vilar orbital outlets, Cadiz Armorial Shipwrights, Serrat Domain Civil Refit Office, Keelwright Seconds Gate, Oathmark High Pennant Yard, and Bruckner Central Service Hall. Stock is explicit (`MaintenanceShopDef.equipmentIds`); Red Dust and generated frontier mechanics do not sell these installations. The orbital outlets provide acquisition without prior atmospheric access.

No diagnosis is required for equipment purchases. An existing local Service Credit applies to the first successful installation and is consumed; other shops' inspections/credits remain intact. Purchases recheck location, stock, dependencies, installed state, and money; no duplicate purchase or charge is possible. The transaction creates a new career, saves it once, then publishes it. Failed persistence leaves the active career unchanged. Installations commit immediately, independent of later flight success or retries. Atmospheric endorsements remain separate contract requirements.

Approved descriptions:
- **Atmospheric Package:** Heat shielding, deployable atmospheric surfaces, and powered actuators equip your rig for atmospheric flight.
- **Heavy Heat Shielding:** Additional thermal protection provides four times the heat resistance of the standard Atmospheric Package. Requires an installed Atmospheric Package.

## Thermal model and migration

Authored heat coefficients are the heavy-shielding baseline. Normal shielding multiplies incoming normalized heat by `4`; heavy shielding uses `1`. Cooling, drag, lift, and thrust are unchanged. Approach and orbital integration and predictions use the same thermal update. Overheating at `temperature >= 1` is fatal in either flight mode; orbital predictions mark burned-up segments red. Orbital/approach handoffs carry temperature rather than resetting it, and phase retries restore entry temperature. This closes the former orbital overheating/phase-reset loophole; it does not retune the underlying heavy heat coefficients.

No package still means fatal atmospheric entry. Package component faults retain their existing wear multipliers and restrictions; component grade does not independently change thermal resistance.

Rig schema is now `2`. A schema-1 rig with a complete Atmospheric Package receives Heavy Heat Shielding once, preserving its existing components and intended old protection level. Pre-rig saves with atmospheric endorsements receive the same protection via existing package migration. Explicitly absent or partial packages receive no augmentation. New careers start with neither product, and purchasing a normal package does not grant heavy shielding. Migration is persisted on load when storage is available.

## Regression entry point

`npm run test:equipment` type-checks source/tests and bundles a headless regression into a temporary directory. It uses isolated in-memory storage and does not touch a real career, browser, or dev server. Covers vendor grades/pricing, partial and duplicate installs, credits, failed persistence, actual game purchase actions, migration/removal, condition preservation, thermal physics/predictions/handoffs/retries, deterministic settlement, and short thin/thick/breathable atmosphere probes. Balance remains provisional; these are correctness checks, not full-route playtests.

## Later families

Shock absorbers, passenger-comfort equipment, and Economic Computer remain unimplemented. Reuse the equipment transaction/scene boundary once their effects, prices, grades, and maintenance rules are approved. Cargo insulation remains a separate scope decision. No autoresearch balancing loop is running.
