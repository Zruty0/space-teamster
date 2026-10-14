# Rig equipment

Updated: 2026-10-13

## Implemented: atmospheric equipment

Equipment is purchased through **Local Directory → shop → Equipment**. Ship Status remains inspection-only with seven systems and a separate Optional Equipment list. The Equipment overview opens with `Select an upgrade to view its details.`; approved product descriptions remain on the individual detail/authorization pages. Menu names, grade suffixes, descriptions and price/time columns wrap without ellipses.

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

## Implemented: shock and comfort equipment

Both are separately purchased, component-backed optional modules within **Auxiliary Systems**. They use the same eleven vendors, stocked component grades, pricing/labor modifiers, Service Credits, and atomic installation path as the Atmospheric Package. Neither requires atmospheric equipment. Catalog now contains 26 baseline components plus these two optional components; the seven-system structure is unchanged.

| Equipment | Grade-D parts | Installation / replacement | Service | Healthy bonus |
|---|---:|---:|---:|---|
| Cargo Shock Absorbers | 40,000 cr | 4h | 0.5h | +2 integrity buffer units for fragile cargo |
| Passenger Comfort Package | 50,000 cr | 5h | 0.5h | +2 comfort buffer units for passenger manifests |

Both use grade-D `3 HP / 2 AP`, Minor at `2 HP`, Major at `1 HP`, Total at `0 HP`. Minor reduces the respective bonus to `+1`; Major/Total remove the bonus. No grade changes the bonus itself: grades change durability and price through the existing A–F rules. AP depletion and sub-threshold HP damage do not reduce the bonus. Faults never add grounding, freight, or passenger restrictions. Service restores AP only; diagnosed repair restores full HP and serviced AP; Total requires replacement. Full service of the baseline rig with atmospheric equipment remains `20h`; installing both optional modules raises this to `21h`.

Damage uses the unmodified Auxiliary Systems telemetry weights and uniform selection among installed Auxiliary components. Both modules remain eligible even on missions that do not use their benefits. Consuming manifest buffer units causes no extra component damage. Installed optional modules share the Auxiliary strike pool rather than adding new telemetry weights or special component targeting. Successful-delivery settlement commits wear; failed flights/retries do not.

Bonuses are calculated once when the mission starts. Shock protection stacks with the existing manifest/container buffer; comfort protection stacks with the manifest expectation buffer. Buffers absorb normal losses first and do not regenerate during flight. Physical damage/comfort-loss rates, flight dynamics, expectation tiers, and maximum delivery penalties are unchanged. Phase retries restore the entry snapshot; whole-mission retries rebuild the starting buffers. Delivery-acquired faults affect the next mission, not the completed flight.

Component installation state is authoritative. Old schema-1/schema-2 saves receive absent optional-component entries, not free upgrades; stale equipment flags without installed components are discarded. Schema remains `2`. Optional Equipment display and saved/cloned equipment lists derive component-backed membership from installation state. Mechanic Auxiliary exchange installs the modules, and all existing component damage/service/repair controls support them.

Approved descriptions:
- **Cargo Shock Absorbers:** Additional cargo-mount dampers absorb vibration and handling shocks, giving fragile consignments extra protection during flight.
- **Passenger Comfort Package:** Improved seating, acoustic isolation, and cabin amenities give passengers a more comfortable journey.

## Thermal model and migration

Authored heat coefficients are the heavy-shielding baseline. Normal shielding multiplies incoming normalized heat by `4`; heavy shielding uses `1`. Cooling, drag, lift, and thrust are unchanged. Approach and orbital integration and predictions use the same thermal update. Overheating at `temperature >= 1` is fatal in either flight mode; orbital predictions mark burned-up segments red. Orbital/approach handoffs carry temperature rather than resetting it, and phase retries restore entry temperature. This closes the former orbital overheating/phase-reset loophole; it does not retune the underlying heavy heat coefficients.

No package still means fatal atmospheric entry. Package component faults retain their existing wear multipliers and restrictions; component grade does not independently change thermal resistance.

Rig schema is now `2`. A schema-1 rig with a complete Atmospheric Package receives Heavy Heat Shielding once, preserving its existing components and intended old protection level. Pre-rig saves with atmospheric endorsements receive the same protection via existing package migration. Explicitly absent or partial packages receive no augmentation. New careers start with neither product, and purchasing a normal package does not grant heavy shielding. Migration is persisted on load when storage is available.

## Regression entry point

`npm run test:equipment` type-checks source/tests and bundles a headless regression into a temporary directory. It uses isolated in-memory storage and does not touch a real career, browser, or dev server. Covers vendor grades/pricing, partial and duplicate installs, credits, failed persistence, actual game purchase actions, migration/removal, condition preservation, thermal physics/predictions/handoffs/retries, deterministic settlement, and short thin/thick/breathable atmosphere probes. Auxiliary regressions additionally cover the full vendor/grade matrix, absent-save migration, HP/AP/fault thresholds, diagnosis/repair/replacement, buffer stacking/exhaustion, unchanged maximum penalties, uniform Auxiliary selection, and actual mission-launch/retry wiring. Balance remains provisional; these are correctness checks, not full-route playtests.

## Later families

Economic Computer remains unimplemented. Reuse the equipment transaction/scene boundary once its effects, prices, grades, and maintenance rules are approved. Cargo insulation remains a separate scope decision. No autoresearch balancing loop is running.
