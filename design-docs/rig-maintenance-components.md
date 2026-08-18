# Rig Maintenance Components

Confirmed component catalog for the persistent rig maintenance system. Global HP/AP, grade, strike, threshold, service, repair, and replacement rules are defined in `non-flight-interaction-plan.md`.

## Body and Frame

### Main Chassis

- **ID:** `body-main-chassis`
- **Function:** Primary load-bearing frame carrying thrust, landing, docking, and cargo stresses through the rig.
- **Grade-D HP/AP:** `6/4`
- **Grade-D cost:** `120,000 cr`
- **Minor threshold:** `4 HP`
- **Major threshold:** `2 HP`
- **Total threshold:** `0 HP`
- **Replacement labor:** `24 hours`
- **Fault source:** Authored component-local tables; no fault library or separate location pool.

Severity impacts:

- **Minor — Working distortion:** Rig remains operational. Thrust, landing, docking, and collision telemetry produces 25% more Body and Frame strike weight.
- **Major — Load-bearing damage:** High thrust is disabled. Thrust, landing, docking, and collision telemetry produces twice the normal Body and Frame strike weight.
- **Total — Frame failure:** Rig is grounded and the chassis must be replaced.

Minor faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Chassis out of square | Square and align chassis | 6 hours | C |
| Crossmember fasteners working loose | Retorque and lock crossmember fasteners | 2 hours | F |
| Frame rail stress cracking | Stop-drill and reinforce frame rail | 5 hours | C |
| Cab cradle shifted | Reset and align cab cradle | 4 hours | D |
| Cargo-spine joint fretting | Rebed and secure cargo-spine joint | 4 hours | D |

Major faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Main frame rail cracked through | Plate and weld main frame rail | 12 hours | B |
| Central keel buckled | Straighten and reinforce central keel | 18 hours | A |
| Cargo-spine junction torn | Rebuild cargo-spine junction | 14 hours | B |
| Cab cradle partially separated | Reconstruct and align cab cradle | 12 hours | B |
| Primary crossmember collapsed | Cut out and replace primary crossmember | 10 hours | C |

### Cab Pressure Shell

- **ID:** `body-cab-pressure-shell`
- **Function:** Sealed structural body protecting the crew compartment and cockpit equipment.
- **Grade-D HP/AP:** `4/2`
- **Grade-D cost:** `80,000 cr`
- **Minor threshold:** `3 HP`
- **Major threshold:** `1 HP`
- **Total threshold:** `0 HP`
- **Fault libraries:** Pressure Vessel; Seals and Penetrations
- **Fault locations:** Cab shell; aft pressure bulkhead; service penetration cluster
- **Replacement labor:** `16 hours`

Severity impacts:

- **Minor — Pressure leakage:** Passenger comfort loss from active flight time increases by 25%. Flight-time telemetry produces 25% more Auxiliary Systems strike weight. Freight work and ordinary flight remain available.
- **Major — Pressure integrity compromised:** Passenger contracts cannot be accepted. Flight-time telemetry produces twice the normal Auxiliary Systems strike weight. The pilot operates in pressure gear and may continue non-passenger work to reach a repair shop.
- **Total — Pressure shell failure:** The crew compartment cannot maintain a survivable environment. The rig is grounded and the Cab Pressure Shell must be replaced.

### Cargo Spine

- **ID:** `body-cargo-spine`
- **Function:** Rear load frame connecting the rig to its cargo coupling and transmitting hauling forces.
- **Grade-D HP/AP:** `4/2`
- **Grade-D cost:** `60,000 cr`
- **Minor threshold:** `3 HP`
- **Major threshold:** `1 HP`
- **Total threshold:** `0 HP`
- **Fault libraries:** Load-Bearing Structure; Joints and Fasteners
- **Fault locations:** Forward spine root; mid-spine load rail; cargo-coupling cradle
- **Replacement labor:** `12 hours`

Severity impacts:

- **Minor — Load-path vibration:** Fragile integrity and passenger comfort losses caused by thrust and turbulence increase by 25%. Loaded thrust and docking telemetry produces 25% more Body and Frame strike weight.
- **Major — Load path compromised:** High thrust is unavailable.
- **Total — Cargo spine failure:** The rig is grounded.

### Bodywork and Mounts

- **ID:** `body-bodywork-mounts`
- **Function:** Exterior panels, access seals, impact strips, equipment brackets, and vibration isolators.
- **Grade-D HP/AP:** `3/1`
- **Grade-D cost:** `30,000 cr`
- **Minor threshold:** `2 HP`
- **Major threshold:** `1 HP`
- **Total threshold:** `0 HP`
- **Fault libraries:** Exterior Bodywork; Mounts and Isolation
- **Fault locations:** Cab exterior; equipment bay; underbody rack
- **Replacement labor:** `6 hours`

Severity impacts:

- **Minor — Loose bodywork and mount vibration:** Auxiliary Systems strike likelihood is multiplied by `1.25×`.
- **Major — Exposed and unsecured equipment:** Auxiliary Systems strike likelihood is multiplied by `1.75×`.
- **Total — Bodywork and mounting failure:** The rig is grounded.

## Powertrain

| Component | Function | Grade-D HP/AP | Grade-D cost |
|---|---|---:|---:|
| Main Drive Core | Converts Guild fuel into the motive force that provides standard and high thrust. | `5/4` | `300,000 cr` |
| Field Coil Bank | Shapes and contains the drive field while transferring thrust into the rig's frame. | `4/4` | `200,000 cr` |
| Regulator Bank | Maintains field phase, output stability, and safe transitions between standard and high thrust. | `3/3` | `120,000 cr` |
| Fuel Feed Assembly | Filters, meters, and delivers Guild fuel to the drive core. | `3/2` | `60,000 cr` |
| Drive Cooling Loop | Removes waste heat from the core, coils, and regulator hardware. | `3/1` | `50,000 cr` |

### Main Drive Core

- **ID:** `powertrain-main-drive-core`
- **Function:** Converts Guild fuel into the motive force that provides standard and high thrust.
- **Grade-D HP/AP:** `5/4`
- **Grade-D cost:** `300,000 cr`
- **Minor threshold:** `3 HP`
- **Major threshold:** `1 HP`
- **Total threshold:** `0 HP`
- **Replacement labor:** `18 hours`
- **Fault source:** Authored component-local tables; no fault library or separate location pool.

Severity impacts:

- **Minor — Drive efficiency degraded:** Fuel use per unit of Delta-V is multiplied by `1.10×`. Thrust-derived Powertrain strike likelihood is multiplied by `1.25×`. Standard and high thrust remain available.
- **Major — Drive output unstable:** High thrust is unavailable. Fuel use per unit of Delta-V is multiplied by `1.25×`. Thrust-derived Powertrain strike likelihood is multiplied by `1.75×`.
- **Total — Drive core failure:** The rig is grounded.

Minor faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Core reaction face fouled | Clean and recondition core reaction face | 5 hours | E |
| Converter lattice out of balance | Balance and recertify converter lattice | 6 hours | C |
| Thrust-transfer collar out of alignment | Align and lock thrust-transfer collar | 5 hours | C |
| Core support preload relaxed | Reset and secure core support preload | 3 hours | F |
| Fuel injector plate uneven | Clean, match, and calibrate injector plate | 4 hours | D |

Major faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Core reaction chamber cracked | Sleeve and reinforce reaction chamber | 14 hours | B |
| Converter lattice fractured | Replace and balance converter lattice section | 16 hours | A |
| Thrust-transfer collar warped | Jig and restore thrust-transfer collar | 12 hours | B |
| Core containment housing distorted | Straighten and reinforce containment housing | 18 hours | A |
| Fuel conversion face burned through | Replace and certify fuel conversion face | 15 hours | B |

### Field Coil Bank

- **ID:** `powertrain-field-coil-bank`
- **Function:** Shapes and contains the drive field while transferring thrust into the rig's frame.
- **Grade-D HP/AP:** `4/4`
- **Grade-D cost:** `200,000 cr`
- **Minor threshold:** `3 HP`
- **Major threshold:** `1 HP`
- **Total threshold:** `0 HP`
- **Fault library:** Field Coils
- **Fault locations:** Forward coil ring; center coil ring; aft coil ring
- **Replacement labor:** `14 hours`

Severity impacts:

- **Minor — Field geometry degraded:** Thrust-derived Powertrain strike likelihood is multiplied by `1.25×`.
- **Major — Field containment unstable:** High thrust is unavailable. Thrust-derived Powertrain strike likelihood is multiplied by `1.75×`.
- **Total — Field coil failure:** The rig is grounded.

### Regulator Bank

- **ID:** `powertrain-regulator-bank`
- **Function:** Maintains field phase, output stability, and safe transitions between standard and high thrust.
- **Grade-D HP/AP:** `3/3`
- **Grade-D cost:** `120,000 cr`
- **Minor threshold:** `2 HP`
- **Major threshold:** `1 HP`
- **Total threshold:** `0 HP`
- **Fault libraries:** Power Regulation; Control Electronics
- **Fault locations:** Primary regulator rack; secondary regulator rack; high-thrust regulator rack
- **Replacement labor:** `10 hours`

Severity impacts:

- **Minor — Regulation drift:** Thrust-derived Powertrain strike likelihood is multiplied by `1.25×`.
- **Major — Regulation instability:** High thrust is unavailable. Thrust-derived Powertrain strike likelihood is multiplied by `1.75×`.
- **Total — Regulator failure:** The rig is grounded.

### Fuel Feed Assembly

- **ID:** `powertrain-fuel-feed`
- **Function:** Filters, meters, and delivers Guild fuel to the drive core.
- **Grade-D HP/AP:** `3/2`
- **Grade-D cost:** `60,000 cr`
- **Minor threshold:** `2 HP`
- **Major threshold:** `1 HP`
- **Total threshold:** `0 HP`
- **Fault libraries:** Fluid and Propellant; Pumps and Valves
- **Fault locations:** Supply manifold; metering block; core inlet
- **Replacement labor:** `8 hours`

Severity impacts:

- **Minor — Feed efficiency degraded:** Thrust-derived Powertrain strike likelihood is multiplied by `1.25×`.
- **Major — Fuel delivery restricted:** High thrust is unavailable. Thrust-derived Powertrain strike likelihood is multiplied by `1.75×`.
- **Total — Fuel feed failure:** The rig is grounded.

### Drive Cooling Loop

- **ID:** `powertrain-drive-cooling`
- **Function:** Removes waste heat from the drive core, field coils, and regulator hardware.
- **Grade-D HP/AP:** `3/1`
- **Grade-D cost:** `50,000 cr`
- **Minor threshold:** `2 HP`
- **Major threshold:** `1 HP`
- **Total threshold:** `0 HP`
- **Fault libraries:** Fluid and Propellant; Pumps and Valves; Heat Exchange
- **Fault locations:** Core cooling jacket; coil cooling manifold; drive heat exchanger
- **Replacement labor:** `7 hours`

Severity impacts:

- **Minor — Cooling capacity degraded:** Thrust-derived Powertrain strike likelihood is multiplied by `1.25×`.
- **Major — Cooling capacity restricted:** High thrust is unavailable. Thrust-derived Powertrain strike likelihood is multiplied by `1.75×`.
- **Total — Drive cooling failure:** The rig is grounded.

## Steering and Thrusters

| Component | Function | Grade-D HP/AP | Grade-D cost |
|---|---|---:|---:|
| Maneuvering Thruster Array | Provides lateral, rotational, braking, and fine-positioning thrust throughout every flight mode. | `3/2` | `50,000 cr` |
| Thruster Feed Assembly | Distributes fuel and maintains delivery pressure for the maneuvering thrusters. | `3/2` | `20,000 cr` |
| Thruster Valve Bank | Meters and times individual thruster firings from commands issued by the flight controls. | `3/2` | `30,000 cr` |

The Landing and Docking system will include a separate **Tractor Capture Receiver** for the rig-side receiver, alignment hardware, and force-coupling equipment used by station tractor beams.

### Maneuvering Thruster Array

- **ID:** `steering-maneuvering-thrusters`
- **Function:** Provides lateral, rotational, braking, and fine-positioning thrust throughout every flight mode.
- **Grade-D HP/AP:** `3/2`
- **Grade-D cost:** `50,000 cr`
- **Minor threshold:** `2 HP`
- **Major threshold:** `1 HP`
- **Total threshold:** `0 HP`
- **Fault library:** Maneuvering Thrusters
- **Fault locations:** Forward-port, forward-starboard, aft-port, and aft-starboard thruster clusters
- **Replacement labor:** `6 hours`

Severity impacts:

- **Minor — Thruster imbalance:** Steering and Thrusters strike likelihood is multiplied by `1.25×`.
- **Major — Maneuvering authority compromised:** Braking SAS is unavailable. Steering and Thrusters strike likelihood is multiplied by `1.75×`.
- **Total — Maneuvering thruster failure:** The rig is grounded.

### Thruster Feed Assembly

- **ID:** `steering-thruster-feed`
- **Function:** Distributes fuel and maintains delivery pressure for the maneuvering thrusters.
- **Grade-D HP/AP:** `3/2`
- **Grade-D cost:** `20,000 cr`
- **Minor threshold:** `2 HP`
- **Major threshold:** `1 HP`
- **Total threshold:** `0 HP`
- **Fault libraries:** Fluid and Propellant; Pumps and Valves
- **Fault locations:** Forward distribution branch; aft distribution branch; thruster accumulator
- **Replacement labor:** `4 hours`

Severity impacts:

- **Minor — Feed pressure uneven:** Steering and Thrusters strike likelihood is multiplied by `1.25×`.
- **Major — Feed capacity restricted:** Steering and Thrusters strike likelihood is multiplied by `1.75×`.
- **Total — Thruster feed failure:** The rig is grounded.

## Fault Libraries

Fault-library diagnoses combine with one of the component's authored flavor locations. Gameplay effects come from the affected component's current severity, not the library entry.

### Maneuvering Thrusters

Minor faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Injector face fouled | Clean and flow-test injector face | 2 hours | F |
| Ignition electrode worn | Replace and gap ignition electrode | 2 hours | F |
| Nozzle throat erosion beginning | Dress and recoat nozzle throat | 3 hours | E |
| Nozzle alignment drift | Align and lock maneuvering nozzle | 4 hours | D |
| Thruster-mount preload relaxed | Reset and secure thruster-mount preload | 3 hours | E |

Major faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Injector face fractured | Replace and flow-match injector face | 5 hours | D |
| Nozzle body split | Replace and align nozzle body | 5 hours | D |
| Thrust-chamber liner burned through | Replace and certify thrust chamber | 7 hours | C |
| Thruster mount fractured | Rebuild and align thruster mount | 6 hours | C |
| Thruster cluster frame distorted | Jig and restore thruster cluster frame | 8 hours | B |

### Field Coils

Minor faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Coil-terminal fasteners loose | Retorque and lock coil-terminal fasteners | 2 hours | F |
| Terminal contact resistance high | Clean, dress, and reseat coil terminals | 3 hours | E |
| Coil preload relaxed | Reset and secure coil preload | 4 hours | E |
| Winding insulation abraded | Reinsulate and test affected winding | 5 hours | D |
| Coil segment alignment drift | Align and lock coil segment | 6 hours | C |

Major faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Coil winding shorted | Replace and recertify winding section | 12 hours | B |
| Field conductor burned open | Splice, reinforce, and recertify field conductor | 10 hours | B |
| Coil ring cracked | Sleeve and reinforce coil ring | 14 hours | B |
| Coil segment displaced | Jig and reseat coil segment | 12 hours | B |
| Coil insulation breakdown | Strip, reinsulate, and recertify coil ring | 16 hours | A |

### Power Regulation

Minor faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Output trim drifting | Calibrate and lock output trim | 3 hours | E |
| Current limit out of tolerance | Calibrate regulator current limit | 4 hours | D |
| Load sharing uneven | Balance regulator channels | 4 hours | D |
| High-thrust transfer timing late | Adjust and certify transfer timing | 5 hours | C |
| Phase setpoint wandering | Recalibrate phase setpoint | 4 hours | D |

Major faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Regulator channel dropped out | Rebuild and recommission regulator channel | 8 hours | C |
| Output clamping stage failed | Replace and calibrate clamping stage | 8 hours | C |
| Phase lock lost under load | Rebuild and certify phase-lock section | 10 hours | B |
| Load-balancing bus unstable | Rebuild regulator synchronization bus | 10 hours | B |
| High-thrust transition contactor welded | Replace and certify transition contactor | 7 hours | D |

### Control Electronics

Minor faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Control-board connector oxidized | Clean and reseat control-board connector | 2 hours | F |
| Calibration memory errors | Reflash and verify calibration memory | 2 hours | E |
| Sensing input biased | Calibrate regulator sensing input | 3 hours | E |
| Gate-driver timing drift | Calibrate gate-driver timing | 4 hours | D |
| Board thermal contact poor | Renew control-board thermal interface | 3 hours | E |

Major faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Control processor intermittent | Replace and recommission control processor | 6 hours | C |
| Gate-driver bank burned out | Replace and calibrate gate-driver bank | 7 hours | C |
| Reference supply collapsed | Rebuild control-reference supply | 6 hours | D |
| Control backplane cracked | Replace and certify control backplane | 9 hours | B |
| Safety interlock false-tripping | Rebuild and validate safety-interlock circuit | 5 hours | D |

### Fluid and Propellant

Minor faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Filter element loaded | Replace filter element and flush housing | 1.5 hours | F |
| Line union seeping | Reseat and seal line union | 2 hours | F |
| Working fluid contaminated | Flush and polish fluid circuit | 3 hours | E |
| Manifold pressure uneven | Balance and test manifold branches | 4 hours | D |
| Accumulator precharge low | Recharge and test accumulator | 2 hours | E |

Major faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Fluid line ruptured | Replace line section and pressure-test circuit | 5 hours | D |
| Manifold body cracked | Replace and certify manifold body | 7 hours | C |
| Circuit contamination severe | Decontaminate and recertify fluid circuit | 8 hours | C |
| Accumulator diaphragm failed | Replace diaphragm and rebuild accumulator | 5 hours | D |
| Isolation barrier compromised | Rebuild and pressure-test isolation section | 9 hours | B |

### Pumps and Valves

Minor faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Pump inlet restricted | Clear inlet and service pump intake | 2 hours | E |
| Metering valve sticking | Clean and lap metering valve | 3 hours | E |
| Check valve leaking back | Replace check-valve cartridge | 2 hours | F |
| Pump bearing running rough | Replace and align pump bearing | 4 hours | D |
| Valve actuator travel out of tolerance | Calibrate valve actuator travel | 3 hours | D |

Major faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Feed pump seized | Replace and commission feed pump | 6 hours | D |
| Metering valve jammed | Rebuild and calibrate metering valve | 5 hours | D |
| Valve actuator burned out | Replace and certify valve actuator | 4 hours | D |
| Pump impeller fractured | Rebuild and balance pump assembly | 7 hours | C |
| Bypass valve failed shut | Replace and recommission bypass valve | 5 hours | C |

### Heat Exchange

Minor faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Heat-exchanger surfaces fouled | Clean and restore heat-exchanger surfaces | 2 hours | F |
| Thermal interface compound dried | Renew and seat thermal interface | 2 hours | F |
| Cooling jacket scaled internally | Descale and flush cooling jacket | 3 hours | E |
| Cold-plate contact uneven | Rebed and secure cold plate | 4 hours | D |
| Heat-exchanger flow unbalanced | Balance and test heat-exchanger flow | 4 hours | D |

Major faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Heat-exchanger core blocked | Strip, clear, and pressure-test exchanger core | 6 hours | D |
| Cooling jacket cracked | Repair and pressure-test cooling jacket | 8 hours | C |
| Heat-exchanger matrix ruptured | Replace and certify exchanger matrix | 8 hours | C |
| Cold plate warped | Machine or replace cold plate | 9 hours | B |
| Thermal-transfer surface delaminated | Replace and recertify thermal-transfer assembly | 10 hours | B |

### Pressure Vessel

Minor faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Shell panel dented | Re-form and stress-relieve shell panel | 4 hours | E |
| Pressure seam working loose | Rework and reseal pressure seam | 5 hours | D |
| Pressure-cycle fatigue found | Stop-drill and reinforce fatigued area | 6 hours | C |
| Bulkhead out of plane | Square and brace pressure bulkhead | 7 hours | C |
| Reinforcement ring shifted | Reset and secure reinforcement ring | 5 hours | D |

Major faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Pressure shell cracked through | Weld and plate pressure shell | 12 hours | B |
| Structural seam separated | Rebuild structural pressure seam | 14 hours | B |
| Pressure bulkhead buckled | Jig, straighten, and reinforce bulkhead | 18 hours | B |
| Reinforcement ring torn free | Rebuild reinforcement-ring attachment | 15 hours | B |
| Shell section collapsed | Cut out and replace pressure-shell section | 20 hours | A |

### Seals and Penetrations

Minor faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Cable gland leaking | Repack and reseal cable gland | 2 hours | F |
| Pipe penetration seal hardened | Replace pipe penetration seal | 2 hours | F |
| Feedthrough gasket weeping | Renew gasket and pressure-test feedthrough | 2.5 hours | F |
| Penetration collar out of seat | Reset and lock penetration collar | 3 hours | E |
| Sealant bed cracked | Strip and renew sealant bed | 4 hours | E |

Major faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Cable penetration block blown | Replace and repot penetration block | 6 hours | D |
| Pipe penetration collar fractured | Replace collar and pressure-test penetration | 8 hours | C |
| Feedthrough cluster pulled loose | Rebuild and secure feedthrough cluster | 10 hours | C |
| Pressure seal channel torn | Rebuild pressure seal channel | 7 hours | D |
| Penetration plate warped | Straighten and reseat penetration plate | 9 hours | C |

### Load-Bearing Structure

Minor faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Load rail bowed | Straighten and stress-relieve load rail | 5 hours | D |
| Load flange distorted | Press and reinforce load flange | 4 hours | D |
| Fatigue crack initiated | Stop-drill and plate fatigued area | 6 hours | C |
| Web stiffener working loose | Secure and reinforce web stiffener | 3 hours | E |
| Load path out of alignment | Jig and align load-bearing structure | 6 hours | C |

Major faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Load rail cracked through | Weld and plate load rail | 10 hours | C |
| Structural web buckled | Replace and reinforce structural web | 12 hours | B |
| Load-bearing flange torn | Reconstruct load-bearing flange | 12 hours | B |
| Frame section twisted | Jig, straighten, and brace frame section | 14 hours | B |
| Structural member partially collapsed | Cut out and replace structural member | 16 hours | A |

### Joints and Fasteners

Minor faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Fasteners under-torqued | Retorque and witness-mark fasteners | 1.5 hours | F |
| Locking hardware backed off | Replace locking hardware and torque joint | 2 hours | F |
| Joint faces fretting | Dress and rebed joint faces | 4 hours | E |
| Load-joint bushings worn | Replace load-joint bushings | 3 hours | E |
| Load pin working in bore | Refit load pin and restore bore fit | 5 hours | D |

Major faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Fastener group sheared | Extract and replace fastener group | 6 hours | D |
| Joint bore elongated | Sleeve and ream joint bore | 8 hours | C |
| Load pin cracked | Replace load pin and inspect joint | 5 hours | D |
| Joint faces separated | Rebuild and clamp structural joint | 9 hours | C |
| Attachment lug torn | Rebuild lug and line-bore joint | 12 hours | B |

### Exterior Bodywork

Minor faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Panel fasteners loose | Secure and witness-mark panel fasteners | 1 hour | F |
| Access-panel seal lifted | Reseat and bond access-panel seal | 1.5 hours | F |
| Impact strip dented | Straighten and secure impact strip | 2 hours | E |
| Body panel buckled | Straighten and brace body panel | 3 hours | E |
| Panel seam opened | Dress, close, and reseal panel seam | 3 hours | E |

Major faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Body panel torn away | Fit replacement panel and restore attachments | 5 hours | D |
| Access bay exposed | Rebuild and seal access-bay closure | 6 hours | D |
| Impact rail crushed | Replace impact rail and repair mounting points | 7 hours | C |
| Body seam split | Rebuild and reinforce body seam | 8 hours | C |
| Panel support frame collapsed | Reconstruct panel support frame | 10 hours | B |

### Mounts and Isolation

Minor faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Mounting bolts loose | Retorque and lock mounting bolts | 1.5 hours | F |
| Vibration isolator compressed | Replace vibration isolator | 2 hours | F |
| Equipment tray shifted | Realign and secure equipment tray | 3 hours | E |
| Mount bushing worn | Replace mount bushing | 3 hours | E |
| Support bracket cracked | Stop-drill and reinforce support bracket | 4 hours | D |

Major faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Isolator bank failed | Replace and balance isolator bank | 5 hours | D |
| Mounting bracket fractured | Replace and reinforce mounting bracket | 6 hours | C |
| Equipment bed warped | Jig and straighten equipment bed | 8 hours | C |
| Anchor points pulled through | Rebuild and reinforce anchor points | 10 hours | B |
| Equipment rack partially detached | Remount and reinforce equipment rack | 9 hours | B |
