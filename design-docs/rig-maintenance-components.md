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
- **Fault locations:** Forward pressure section; aft pressure section; service-bay pressure section
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
- **Fault libraries:** Fluid and Propellant; Flow Control Hardware
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
- **Fault libraries:** Fluid and Propellant; Flow Control Hardware; Heat Exchange
- **Fault locations:** Core cooling branch; coil cooling branch; heat-exchanger branch
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
- **Fault libraries:** Fluid and Propellant; Flow Control Hardware
- **Fault locations:** Forward distribution branch; aft distribution branch; thruster accumulator
- **Replacement labor:** `4 hours`

Severity impacts:

- **Minor — Feed pressure uneven:** Steering and Thrusters strike likelihood is multiplied by `1.25×`.
- **Major — Feed capacity restricted:** Steering and Thrusters strike likelihood is multiplied by `1.75×`.
- **Total — Thruster feed failure:** The rig is grounded.

### Thruster Valve Bank

- **ID:** `steering-thruster-valves`
- **Function:** Meters and times individual thruster firings from commands issued by the flight controls.
- **Grade-D HP/AP:** `3/2`
- **Grade-D cost:** `30,000 cr`
- **Minor threshold:** `2 HP`
- **Major threshold:** `1 HP`
- **Total threshold:** `0 HP`
- **Fault libraries:** Flow Control Hardware; Control Electronics
- **Fault locations:** Forward valve block; aft valve block; pulse-control valve rack
- **Replacement labor:** `5 hours`

Severity impacts:

- **Minor — Firing response uneven:** Steering and Thrusters strike likelihood is multiplied by `1.25×`.
- **Major — Firing control unreliable:** Braking SAS is unavailable. Steering and Thrusters strike likelihood is multiplied by `1.75×`.
- **Total — Thruster valve failure:** The rig is grounded.

## Atmospheric Package

| Component | Function | Grade-D HP/AP | Grade-D cost |
|---|---|---:|---:|
| Heat Shielding | Protects the rig and its internal equipment from atmospheric-entry heat. | `4/2` | `30,000 cr` |
| Atmospheric Surfaces | Provides aerodynamic lift, drag, and stability through deployable wings and control surfaces. | `3/1` | `60,000 cr` |
| Surface Actuators | Deploys, angles, and locks the atmospheric surfaces in response to flight controls. | `3/2` | `30,000 cr` |

The complete Atmospheric Package is optional equipment purchased and installed later rather than standard rig equipment. An uninstalled package appears as not installed rather than damaged. Its components receive no telemetry strike weight outside atmospheric flight, so vacuum and airless missions cannot damage them. Atmospheric work requires the package.

### Heat Shielding

- **ID:** `atmospheric-heat-shielding`
- **Function:** Protects the rig and its internal equipment from atmospheric-entry heat.
- **Grade-D HP/AP:** `4/2`
- **Grade-D cost:** `30,000 cr`
- **Minor threshold:** `3 HP`
- **Major threshold:** `1 HP`
- **Total threshold:** `0 HP`
- **Fault libraries:** Thermal Protection; Panel Bonding
- **Fault locations:** Forward belly shield; central belly shield; aft drive shield
- **Replacement labor:** `6 hours`

Severity impacts:

- **Minor — Shield protection degraded:** Atmospheric-heat-derived Atmospheric Package strike likelihood is multiplied by `1.25×`.
- **Major — Shield protection compromised:** Atmospheric-heat-derived Atmospheric Package strike likelihood is multiplied by `1.75×`.
- **Total — Heat shielding failure:** The Atmospheric Package is grounded. Atmospheric missions are unavailable until replacement; vacuum and airless work remains available.

### Atmospheric Surfaces

- **ID:** `atmospheric-surfaces`
- **Function:** Provides aerodynamic lift, drag, and stability through deployable wings and control surfaces.
- **Grade-D HP/AP:** `3/1`
- **Grade-D cost:** `60,000 cr`
- **Minor threshold:** `2 HP`
- **Major threshold:** `1 HP`
- **Total threshold:** `0 HP`
- **Fault libraries:** Aerodynamic Surfaces; Panel Bonding
- **Fault locations:** Port winglet; starboard winglet; aft stabilizer
- **Replacement labor:** `8 hours`

Severity impacts:

- **Minor — Surface wear:** Aerodynamic-load-derived Atmospheric Package strike likelihood is multiplied by `1.25×`.
- **Major — Surface integrity compromised:** Wings are unavailable during atmospheric flight. Aerodynamic-load-derived Atmospheric Package strike likelihood is multiplied by `1.75×`.
- **Total — Atmospheric surface failure:** The Atmospheric Package is grounded. Atmospheric missions are unavailable until replacement; vacuum and airless work remains available.

### Surface Actuators

- **ID:** `atmospheric-surface-actuators`
- **Function:** Deploys, angles, and locks the atmospheric surfaces in response to flight controls.
- **Grade-D HP/AP:** `3/2`
- **Grade-D cost:** `30,000 cr`
- **Minor threshold:** `2 HP`
- **Major threshold:** `1 HP`
- **Total threshold:** `0 HP`
- **Fault libraries:** Actuators and Linkages; Control Electronics
- **Fault locations:** Port winglet actuator bay; starboard winglet actuator bay; aft stabilizer actuator bay
- **Replacement labor:** `5 hours`

Severity impacts:

- **Minor — Actuator response degraded:** Atmospheric-control-derived Atmospheric Package strike likelihood is multiplied by `1.25×`.
- **Major — Surface control unavailable:** Wings are unavailable during atmospheric flight. Atmospheric-control-derived Atmospheric Package strike likelihood is multiplied by `1.75×`.
- **Total — Surface actuator failure:** The Atmospheric Package is grounded. Atmospheric missions are unavailable until replacement; vacuum and airless work remains available.

## Landing and Docking

| Component | Function | Grade-D HP/AP | Grade-D cost |
|---|---|---:|---:|
| Landing Gear Assembly | Supports touchdown, absorbs landing loads, and keeps the rig stable on prepared or rough surfaces. | `4/1` | `50,000 cr` |
| Docking Coupler | Aligns, captures, and mechanically secures the rig to station docking fixtures. | `3/1` | `30,000 cr` |
| Tractor Capture Receiver | Lets station tractor beams acquire, align, and safely move the rig during docking operations. | `3/2` | `40,000 cr` |

### Landing Gear Assembly

- **ID:** `landing-gear-assembly`
- **Function:** Supports touchdown, absorbs landing loads, and keeps the rig stable on prepared or rough surfaces.
- **Grade-D HP/AP:** `4/1`
- **Grade-D cost:** `50,000 cr`
- **Minor threshold:** `3 HP`
- **Major threshold:** `1 HP`
- **Total threshold:** `0 HP`
- **Fault libraries:** Load-Bearing Structure; Actuators and Linkages; Dampers and Suspension
- **Fault locations:** Forward landing gear; port main landing gear; starboard main landing gear
- **Replacement labor:** `8 hours`

Severity impacts:

- **Minor — Landing gear wear:** Landing-impact-derived Landing and Docking strike likelihood is multiplied by `1.25×`.
- **Major — Landing gear unsafe:** Surface landings are unavailable; station docking remains available. Landing-impact-derived Landing and Docking strike likelihood is multiplied by `1.75×`.
- **Total — Landing gear failure:** The rig is grounded until the assembly is replaced.

### Docking Coupler

- **ID:** `landing-docking-coupler`
- **Function:** Aligns, captures, and mechanically secures the rig to station docking fixtures.
- **Grade-D HP/AP:** `3/1`
- **Grade-D cost:** `30,000 cr`
- **Minor threshold:** `2 HP`
- **Major threshold:** `1 HP`
- **Total threshold:** `0 HP`
- **Fault libraries:** Docking Coupler Hardware; Joints and Fasteners
- **Fault locations:** Port coupler sector; starboard coupler sector; lower coupler sector
- **Replacement labor:** `5 hours`

Severity impacts:

- **Minor — Coupler wear:** Docking-operation and docking-contact-derived Landing and Docking strike likelihood is multiplied by `1.25×`.
- **Major — Capture integrity compromised:** Station docking is unavailable; surface landing remains available. Docking-operation and docking-contact-derived Landing and Docking strike likelihood is multiplied by `1.75×`.
- **Total — Docking coupler failure:** The rig is grounded until the coupler is replaced.

### Tractor Capture Receiver

- **ID:** `landing-tractor-capture-receiver`
- **Function:** Lets station tractor beams acquire, align, and safely move the rig during docking operations.
- **Grade-D HP/AP:** `3/2`
- **Grade-D cost:** `40,000 cr`
- **Minor threshold:** `2 HP`
- **Major threshold:** `1 HP`
- **Total threshold:** `0 HP`
- **Fault libraries:** Tractor Field Hardware; Control Electronics
- **Fault locations:** Port receiver panel; starboard receiver panel; aft receiver panel
- **Replacement labor:** `6 hours`

Severity impacts:

- **Minor — Capture response degraded:** Tractor-load-derived Landing and Docking strike likelihood is multiplied by `1.25×`.
- **Major — Capture lock unreliable:** Station docking is unavailable. Tractor-load-derived Landing and Docking strike likelihood is multiplied by `1.75×`.
- **Total — Tractor receiver failure:** The rig is grounded until the receiver is replaced.

## Cab and Controls

| Component | Function | Grade-D HP/AP | Grade-D cost |
|---|---|---:|---:|
| Driver Controls | Converts the teamster's throttle, steering, rotation, wing, and mode inputs into flight commands. | `3/2` | `25,000 cr` |
| Flight Computer | Performs control mixing, stabilization, guidance, and transfer calculations. | `3/2` | `55,000 cr` |
| Navigation Instruments | Measures attitude, motion, range, atmospheric state, and relative position. | `3/2` | `40,000 cr` |
| Instrument Panel | Displays flight data, equipment condition, warnings, and control-mode status. | `3/1` | `20,000 cr` |

### Driver Controls

- **ID:** `cab-driver-controls`
- **Function:** Converts throttle, steering, rotation, wing, and mode inputs into flight commands.
- **Grade-D HP/AP:** `3/2`
- **Grade-D cost:** `25,000 cr`
- **Minor threshold:** `2 HP`
- **Major threshold:** `1 HP`
- **Total threshold:** `0 HP`
- **Replacement labor:** `4 hours`
- **Fault source:** Authored component-local tables; no separate location pool.

Severity impacts:

- **Minor — Control input wear:** Control-use-derived Cab and Controls strike likelihood is multiplied by `1.25×`.
- **Major — Command integrity compromised:** The rig is grounded until repaired.
- **Total — Driver control failure:** The rig remains grounded and the Driver Controls must be replaced.

Minor faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Switch contact oxidized | Clean and certify switch contacts | 1.5 hours | F |
| Throttle detent worn | Replace and adjust throttle detent | 2 hours | F |
| Control-return spring weak | Replace and balance return spring | 2 hours | E |
| Control-input calibration drift | Calibrate and certify control input | 2 hours | E |
| Input sensor producing noise | Replace and calibrate input sensor | 3 hours | E |

Major faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Throttle mechanism jammed | Rebuild and calibrate throttle mechanism | 4 hours | D |
| Steering-control linkage fractured | Replace and align control linkage | 5 hours | C |
| Command-bus interface failed | Replace and commission command interface | 4 hours | D |
| Control assembly shorted | Rebuild wiring and replace damaged control hardware | 5 hours | C |
| Emergency cutoff interlock failed | Rebuild and certify cutoff interlock | 3 hours | D |

### Flight Computer

- **ID:** `cab-flight-computer`
- **Function:** Performs control mixing, stabilization, guidance, and transfer calculations.
- **Grade-D HP/AP:** `3/2`
- **Grade-D cost:** `55,000 cr`
- **Minor threshold:** `2 HP`
- **Major threshold:** `1 HP`
- **Total threshold:** `0 HP`
- **Fault libraries:** Control Electronics; Flight Software
- **Replacement labor:** `4 hours`
- **Fault locations:** None; diagnoses are generated without a location.

Severity impacts:

- **Minor — Processing reliability degraded:** Computation-load-derived Cab and Controls strike likelihood is multiplied by `1.25×`.
- **Major — Flight computer unreliable:** The rig is grounded until repaired.
- **Total — Flight computer failure:** The rig remains grounded and the Flight Computer must be replaced.

### Navigation Instruments

- **ID:** `cab-navigation-instruments`
- **Function:** Measures attitude, motion, range, atmospheric state, and relative position.
- **Grade-D HP/AP:** `3/2`
- **Grade-D cost:** `40,000 cr`
- **Minor threshold:** `2 HP`
- **Major threshold:** `1 HP`
- **Total threshold:** `0 HP`
- **Fault libraries:** Navigation Sensors; Control Electronics
- **Replacement labor:** `5 hours`
- **Fault locations:** None; diagnoses are generated without a location.

Severity impacts:

- **Minor — Instrument accuracy degraded:** Sensor-use-derived Cab and Controls strike likelihood is multiplied by `1.25×`.
- **Major — Navigation instruments unreliable:** The rig is grounded until repaired.
- **Total — Navigation instrument failure:** The rig remains grounded and the Navigation Instruments must be replaced.

### Instrument Panel

- **ID:** `cab-instrument-panel`
- **Function:** Displays flight data, equipment condition, warnings, and control-mode status.
- **Grade-D HP/AP:** `3/1`
- **Grade-D cost:** `20,000 cr`
- **Minor threshold:** `2 HP`
- **Major threshold:** `1 HP`
- **Total threshold:** `0 HP`
- **Fault libraries:** Displays and Indicators; Control Electronics
- **Replacement labor:** `3 hours`
- **Fault locations:** None; diagnoses are generated without a location.

Severity impacts:

- **Minor — Display reliability degraded:** Display-use-derived Cab and Controls strike likelihood is multiplied by `1.25×`.
- **Major — Flight information unreliable:** The rig is grounded until repaired.
- **Total — Instrument panel failure:** The rig remains grounded and the Instrument Panel must be replaced.

## Auxiliary Systems

| Component | Function | Grade-D HP/AP | Grade-D cost |
|---|---|---:|---:|
| Service Power Unit | Stores, converts, and distributes electrical power for cab, control, environmental, communication, and utility equipment. | `3/2` | `50,000 cr` |
| Environmental Control Unit | Maintains breathable air, temperature, ventilation, and filtration for crew and passengers. | `3/2` | `40,000 cr` |
| Communications Set | Provides voice, data, beacon, station, Guild, and BBS communications. | `3/1` | `20,000 cr` |
| Cargo Handling Gear | Operates powered cargo locks, loading aids, winches, and cargo-interface hardware. | `3/1` | `30,000 cr` |

Auxiliary Systems is also the home for optional installed equipment added later, including extra shock absorbers, passenger-comfort systems, and other specialized modules. These additions are not part of the baseline `140,000 cr` replacement value and will define their own condition and maintenance fields when designed.

### Service Power Unit

- **ID:** `auxiliary-service-power`
- **Function:** Stores, converts, and distributes electrical power for cab, control, environmental, communication, and utility equipment.
- **Grade-D HP/AP:** `3/2`
- **Grade-D cost:** `50,000 cr`
- **Minor threshold:** `2 HP`
- **Major threshold:** `1 HP`
- **Total threshold:** `0 HP`
- **Fault libraries:** Energy Storage and Conversion; Electrical Distribution
- **Replacement labor:** `6 hours`
- **Fault locations:** None; diagnoses are generated without a location.

Severity impacts:

- **Minor — Power quality degraded:** Auxiliary Systems strike likelihood is multiplied by `1.25×`. Cab and Controls strike likelihood is independently multiplied by `1.25×`. Each modifier preserves zero telemetry-derived weight.
- **Major — Service power unreliable:** The rig is grounded until repaired.
- **Total — Service power failure:** The rig remains grounded and the Service Power Unit must be replaced.

### Environmental Control Unit

- **ID:** `auxiliary-environmental-control`
- **Function:** Maintains breathable air, temperature, ventilation, and filtration for crew and passengers.
- **Grade-D HP/AP:** `3/2`
- **Grade-D cost:** `40,000 cr`
- **Minor threshold:** `2 HP`
- **Major threshold:** `1 HP`
- **Total threshold:** `0 HP`
- **Fault libraries:** Atmosphere Processing; Environmental Machinery
- **Replacement labor:** `5 hours`
- **Fault locations:** None; diagnoses are generated without a location.

Severity impacts:

- **Minor — Environmental performance degraded:** Passenger comfort loss from active flight time is multiplied by `1.25×`. Flight-time-derived Auxiliary Systems strike likelihood is multiplied by `1.25×`.
- **Major — Habitable environment unreliable:** Passenger contracts cannot be accepted. The pilot may continue non-passenger work in pressure gear. Flight-time-derived Auxiliary Systems strike likelihood is multiplied by `1.75×`.
- **Total — Environmental control failure:** The rig is grounded until the unit is replaced.

### Communications Set

- **ID:** `auxiliary-communications`
- **Function:** Provides voice, data, beacon, station, Guild, and BBS communications.
- **Grade-D HP/AP:** `3/1`
- **Grade-D cost:** `20,000 cr`
- **Minor threshold:** `2 HP`
- **Major threshold:** `1 HP`
- **Total threshold:** `0 HP`
- **Fault libraries:** Communications Hardware; Control Electronics
- **Fault locations:** Forward communications pod; aft communications pod
- **Replacement labor:** `3 hours`

Severity impacts:

- **Minor — Signal quality degraded:** Communications-use-derived Auxiliary Systems strike likelihood is multiplied by `1.25×`.
- **Major — Communications unreliable:** Communications-use-derived Auxiliary Systems strike likelihood is multiplied by `1.75×`.
- **Total — Communications failure:** The rig is grounded until the Communications Set is replaced.

### Cargo Handling Gear

- **ID:** `auxiliary-cargo-handling`
- **Function:** Operates powered cargo locks, loading aids, winches, and cargo-interface hardware.
- **Grade-D HP/AP:** `3/1`
- **Grade-D cost:** `30,000 cr`
- **Minor threshold:** `2 HP`
- **Major threshold:** `1 HP`
- **Total threshold:** `0 HP`
- **Fault libraries:** Cargo Handling Hardware; Actuators and Linkages
- **Fault locations:** Port cargo-handling rack; aft cargo-handling rack
- **Replacement labor:** `5 hours`

Severity impacts:

- **Minor — Cargo securement degraded:** Fragile-cargo integrity loss caused by thrust, turbulence, and docking is multiplied by `1.25×`. Cargo-handling-derived Auxiliary Systems strike likelihood is multiplied by `1.25×`.
- **Major — Cargo handling unsafe:** Freight contracts cannot be accepted. Cargo-handling-derived Auxiliary Systems strike likelihood is multiplied by `1.75×`.
- **Total — Cargo handling failure:** The rig is grounded until the Cargo Handling Gear is replaced.

## Fault Libraries

Fault-library diagnoses combine with one of the component's authored flavor locations. Every fault in a library attached to a component must be physically valid at every one of that component's locations; fault and location can therefore be selected independently, with no applicability tags or filtering. Gameplay effects come from the affected component's current severity, not the library entry.

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
| Mode-transfer timing late | Adjust and certify mode-transfer timing | 5 hours | C |
| Phase setpoint wandering | Recalibrate phase setpoint | 4 hours | D |

Major faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Regulator channel dropped out | Rebuild and recommission regulator channel | 8 hours | C |
| Output clamping stage failed | Replace and calibrate clamping stage | 8 hours | C |
| Phase lock lost under load | Rebuild and certify phase-lock section | 10 hours | B |
| Load-balancing bus unstable | Rebuild regulator synchronization bus | 10 hours | B |
| Output transition contactor welded | Replace and certify output transition contactor | 7 hours | D |

### Cargo Handling Hardware

Minor faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Cargo-lock jaw contaminated | Clean and certify cargo-lock jaw | 2 hours | F |
| Roller guide binding | Clean and service roller guide | 2 hours | E |
| Winch cable beginning to fray | Replace and proof-test winch cable | 3 hours | E |
| Cargo-clamp preload low | Reset and certify clamp preload | 3 hours | E |
| Cargo-interface alignment drift | Align and certify cargo interface | 4 hours | D |

Major faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Cargo lock fractured | Replace and certify cargo lock | 4 hours | D |
| Load cable snapped | Replace and proof-test load cable | 4 hours | D |
| Winch drum cracked | Replace and align winch drum | 5 hours | C |
| Cargo-interface frame bent | Jig and restore interface frame | 6 hours | C |
| Restraint anchor torn free | Rebuild and reinforce restraint anchor | 7 hours | B |

### Communications Hardware

Minor faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Antenna radome contaminated | Clean and certify antenna radome | 1.5 hours | F |
| Feedline connector oxidized | Clean and reseat feedline connector | 2 hours | F |
| Antenna coupler out of tune | Tune and certify antenna coupler | 2 hours | E |
| Beacon-power calibration drift | Calibrate and certify beacon output | 2 hours | E |
| Transceiver thermal contact poor | Renew and seat transceiver thermal interface | 2 hours | E |

Major faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Antenna element fractured | Replace and align antenna element | 3 hours | D |
| Feedline shorted | Replace and certify feedline | 3 hours | D |
| Pod enclosure cracked | Repair and reseal communications pod | 4 hours | D |
| Transceiver power stage failed | Replace and certify transceiver power stage | 4 hours | C |
| Signal duplexer burned out | Replace and certify signal duplexer | 4 hours | C |

### Atmosphere Processing

Minor faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Air filter loaded | Replace filter and clean housing | 1.5 hours | F |
| Scrubber bed nearing saturation | Replace and certify scrubber medium | 2 hours | F |
| Oxygen-mix calibration drift | Calibrate and certify atmosphere mix | 2 hours | E |
| Humidity separator fouled | Clean and service humidity separator | 2 hours | E |
| Cabin-air sensor biased | Calibrate and certify cabin-air sensor | 2 hours | E |

Major faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Scrubber canister ruptured | Replace and pressure-test scrubber canister | 4 hours | D |
| Oxygen mixer failed | Rebuild and certify oxygen mixer | 4 hours | D |
| Filtration housing cracked | Replace and pressure-test filtration housing | 4 hours | D |
| Atmosphere separator seized | Rebuild and commission atmosphere separator | 5 hours | C |
| Contamination bypass stuck open | Replace and certify contamination bypass | 5 hours | C |

### Environmental Machinery

Minor faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Compressor mounts loose | Secure and align compressor mounts | 2 hours | F |
| Heater output drifting | Calibrate and test heater bank | 2 hours | E |
| Circulation-fan bearing noisy | Replace and align fan bearing | 3 hours | E |
| Cooling valve responding slowly | Clean and calibrate cooling valve | 3 hours | E |
| Airflow damper out of tolerance | Calibrate and certify airflow damper | 3 hours | D |

Major faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Circulation blower seized | Replace and commission circulation blower | 4 hours | D |
| Heater bank shorted | Rebuild and certify heater bank | 4 hours | D |
| Coolant pump seized | Rebuild and commission coolant pump | 5 hours | D |
| Environmental compressor failed | Replace and certify compressor | 5 hours | C |
| Machinery frame cracked | Repair and reinforce machinery frame | 6 hours | C |

### Energy Storage and Conversion

Minor faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Battery-terminal resistance high | Clean, torque, and certify battery terminals | 1.5 hours | F |
| Battery cells imbalanced | Balance and test battery cells | 2 hours | E |
| Charge-controller calibration drift | Calibrate and certify charge controller | 2 hours | E |
| Converter thermal interface compressed | Renew and seat converter thermal interface | 2 hours | E |
| Converter output ripple high | Replace filter stage and calibrate converter | 3 hours | D |

Major faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Charge controller failed | Replace and commission charge controller | 4 hours | D |
| Battery module shorted | Isolate and replace battery module | 4 hours | D |
| Converter stage burned out | Replace and certify converter stage | 5 hours | C |
| Battery containment distorted | Replace and certify battery containment module | 6 hours | C |
| Converter power bus arcing | Rebuild and certify converter power bus | 5 hours | B |

### Electrical Distribution

Minor faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Bus connection loose | Clean, torque, and certify bus connection | 1.5 hours | F |
| Contactor contacts pitted | Dress and test contactor contacts | 2 hours | E |
| Circuit breaker nuisance-tripping | Replace and certify circuit breaker | 2 hours | E |
| Harness insulation chafed | Repair insulation and secure harness | 3 hours | E |
| Ground reference noisy | Clean and restore ground bonding | 3 hours | D |

Major faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Distribution contactor welded | Replace and certify distribution contactor | 4 hours | D |
| Ground bond fractured | Rebuild and certify ground bond | 4 hours | D |
| Feeder cable burned open | Replace and certify feeder cable | 5 hours | C |
| Breaker panel heat-damaged | Rebuild and certify breaker panel | 6 hours | C |
| Main service bus shorted | Rebuild and certify main service bus | 6 hours | B |

### Displays and Indicators

Minor faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Warning indicator burned out | Replace and test warning indicator | 1 hour | F |
| Display backlight intermittent | Replace and certify backlight driver | 1.5 hours | F |
| Alarm speaker distorted | Replace and test alarm speaker | 1.5 hours | F |
| Display calibration drifting | Calibrate and certify display output | 2 hours | E |
| Display row dropping out | Replace and test display module | 2 hours | E |

Major faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Primary display blank | Replace and commission primary display | 3 hours | D |
| Warning annunciator bank failed | Rebuild and certify annunciator bank | 3 hours | D |
| Panel data receiver failed | Replace and commission panel data receiver | 4 hours | C |
| Display controller failed | Replace and certify display controller | 4 hours | C |
| Panel power bus shorted | Rebuild and certify panel power bus | 4 hours | C |

### Navigation Sensors

Minor faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Rangefinder optics contaminated | Clean and certify rangefinder optics | 1.5 hours | F |
| Inertial datum drifting | Calibrate and certify inertial reference | 2 hours | E |
| Atmospheric sensor biased | Calibrate atmospheric sensor package | 2 hours | E |
| Attitude reference producing vibration noise | Isolate and recalibrate attitude reference | 3 hours | D |
| Rangefinder phase alignment skewed | Align and certify rangefinder channels | 3 hours | D |

Major faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Air-data sensor failed | Replace and calibrate air-data sensor | 4 hours | D |
| Rangefinding transceiver failed | Replace and certify rangefinding transceiver | 4 hours | C |
| Attitude sensor array desynchronized | Rebuild and synchronize attitude sensor array | 4 hours | C |
| Inertial reference lost | Rebuild and certify inertial-reference package | 5 hours | C |
| Sensor timing bus failed | Rebuild and certify sensor timing bus | 5 hours | B |

### Flight Software

Minor faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Sensor-fusion cache stale | Purge and rebuild sensor-fusion cache | 1 hour | F |
| Stabilization gains corrupted | Restore and certify stabilization gains | 1.5 hours | E |
| Control-mixer calibration drift | Recalibrate and validate control mixer | 2 hours | E |
| Guidance scheduler timing jitter | Retune and verify guidance scheduler | 2 hours | D |
| Transfer solver validation errors | Reinstall and certify transfer-solver library | 2 hours | D |

Major faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Flight-state estimator diverging | Rebuild and validate state-estimation service | 3 hours | D |
| Boot-integrity check failing | Restore and certify secure boot image | 4 hours | C |
| Guidance kernel corrupted | Reinstall and certify guidance kernel | 4 hours | C |
| Control loop deadlocked | Rebuild and validate control runtime | 4 hours | C |
| Failover image unreadable | Reconstruct and certify failover partition | 5 hours | B |

### Control Electronics

Minor faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Control-board connector oxidized | Clean and reseat control-board connector | 2 hours | F |
| Calibration memory errors | Reflash and verify calibration memory | 2 hours | E |
| Sensing input biased | Calibrate control sensing input | 3 hours | E |
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
| Local fluid passage restricted | Clear passage and flush local circuit | 1.5 hours | F |
| Line union seeping | Reseat and seal line union | 2 hours | F |
| Working fluid contaminated | Flush and polish fluid circuit | 3 hours | E |
| Local flow pressure uneven | Balance and test local flow path | 4 hours | D |
| Pressure fluctuation detected | Stabilize and test local fluid circuit | 2 hours | E |

Major faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Internal fluid passage ruptured | Replace passage section and pressure-test circuit | 5 hours | D |
| Fluid housing cracked | Replace and certify local fluid housing | 7 hours | C |
| Circuit contamination severe | Decontaminate and recertify fluid circuit | 8 hours | C |
| Pressure boundary failed | Rebuild and pressure-test local boundary | 5 hours | D |
| Isolation barrier compromised | Rebuild and pressure-test isolation section | 9 hours | B |

### Flow Control Hardware

Minor faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Flow-control inlet restricted | Clear inlet and service flow-control unit | 2 hours | E |
| Metering element sticking | Clean and lap metering element | 3 hours | E |
| Check element leaking back | Replace check-element cartridge | 2 hours | F |
| Flow-control mechanism running rough | Service and align flow-control mechanism | 4 hours | D |
| Flow actuator travel out of tolerance | Calibrate flow-actuator travel | 3 hours | D |

Major faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Flow-control unit seized | Rebuild and commission flow-control unit | 6 hours | D |
| Metering element jammed | Rebuild and calibrate metering element | 5 hours | D |
| Flow actuator burned out | Replace and certify flow actuator | 4 hours | D |
| Flow-control mechanism fractured | Rebuild and align flow-control mechanism | 7 hours | C |
| Bypass element failed shut | Replace and recommission bypass element | 5 hours | C |

### Heat Exchange

Minor faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Thermal-transfer surfaces fouled | Clean and restore thermal-transfer surfaces | 2 hours | F |
| Thermal interface compound dried | Renew and seat thermal interface | 2 hours | F |
| Internal thermal passage scaled | Descale and flush thermal passage | 3 hours | E |
| Thermal contact uneven | Rebed and secure thermal-transfer contact | 4 hours | D |
| Heat-transfer flow unbalanced | Balance and test local heat-transfer flow | 4 hours | D |

Major faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Thermal-transfer passage blocked | Strip, clear, and pressure-test thermal passage | 6 hours | D |
| Thermal-transfer housing cracked | Repair and pressure-test thermal-transfer housing | 8 hours | C |
| Thermal-transfer passage ruptured | Replace and certify thermal-transfer passage | 8 hours | C |
| Thermal contact surface warped | Machine or replace thermal contact surface | 9 hours | B |
| Thermal-transfer surface delaminated | Replace and recertify thermal-transfer assembly | 10 hours | B |

### Tractor Field Hardware

Minor faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Receiver face contaminated | Clean and certify receiver face | 2 hours | F |
| Pickup-coil connector loose | Secure and test pickup-coil connector | 2 hours | F |
| Flux-guide alignment drift | Align and lock flux guide | 3 hours | E |
| Field-coupling gap uneven | Set and certify field-coupling gap | 4 hours | D |
| Receiver-panel isolator compressed | Replace and balance panel isolator | 3 hours | E |

Major faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Flux guide cracked | Replace and align flux guide | 5 hours | D |
| Pickup winding shorted | Replace and recertify pickup winding | 6 hours | C |
| Field-coupling core fractured | Replace and certify coupling core | 7 hours | C |
| Receiver face warped | Machine or replace receiver face | 7 hours | B |
| Receiver-panel mount torn free | Rebuild and reinforce panel mount | 8 hours | B |

### Docking Coupler Hardware

Minor faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Capture guide scuffed | Dress and polish capture guide | 2 hours | F |
| Locking-dog travel uneven | Clean and adjust locking dog | 3 hours | E |
| Capture-spring preload low | Reset and certify capture-spring preload | 3 hours | E |
| Coupler face out of true | Align and certify coupler-face section | 4 hours | D |
| Locking-collar segment worn | Dress and calibrate locking-collar segment | 4 hours | D |

Major faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Capture guide bent | Replace and align capture guide | 5 hours | D |
| Locking dog fractured | Replace and certify locking dog | 5 hours | D |
| Coupler-face section warped | Machine and realign coupler-face section | 7 hours | C |
| Capture socket cracked | Sleeve and reinforce capture socket | 8 hours | C |
| Locking-collar segment split | Replace and certify locking-collar segment | 9 hours | B |

### Dampers and Suspension

Minor faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Damper fluid low | Recharge and bleed landing damper | 2 hours | F |
| Strut seal weeping | Replace seal and pressure-test strut | 2 hours | E |
| Suspension preload uneven | Reset and balance suspension preload | 3 hours | E |
| Rebound valve responding slowly | Clean and calibrate rebound valve | 3 hours | D |
| Shock-mount bushing worn | Replace and align shock-mount bushing | 3 hours | E |

Major faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Damper seal blown | Rebuild and pressure-test landing damper | 4 hours | D |
| Damper cylinder scored | Hone and rebuild damper cylinder | 5 hours | D |
| Strut piston bent | Replace and align strut piston | 6 hours | C |
| Energy absorber fractured | Replace and certify energy absorber | 6 hours | C |
| Damper attachment torn free | Rebuild and reinforce damper attachment | 8 hours | B |

### Actuators and Linkages

Minor faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Actuator lubrication depleted | Clean and lubricate actuator mechanism | 2 hours | F |
| Actuator rod-end play excessive | Adjust and rebush actuator rod end | 3 hours | E |
| Travel stop out of tolerance | Reset and certify actuator travel stop | 3 hours | E |
| Linkage preload uneven | Balance and secure linkage preload | 4 hours | D |
| Position coupling loose | Secure and calibrate position coupling | 3 hours | D |

Major faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Actuator drive screw stripped | Rebuild actuator drive mechanism | 5 hours | D |
| Linkage arm bent | Replace and align linkage arm | 6 hours | C |
| Actuator housing cracked | Replace and certify actuator housing | 7 hours | C |
| Pivot bearing seized | Replace and align pivot bearing | 5 hours | D |
| Linkage attachment torn free | Rebuild and reinforce linkage attachment | 8 hours | B |

### Aerodynamic Surfaces

Minor faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Surface-joint fairing loose | Secure and align surface-joint fairing | 1.5 hours | F |
| Leading edge dented | Straighten and dress leading edge | 2 hours | E |
| Surface skin wrinkled | Tension and secure surface skin | 3 hours | E |
| Trailing edge out of true | Align and lock trailing edge | 3 hours | D |
| Surface balance shifted | Rebalance and certify aerodynamic surface | 4 hours | D |

Major faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Leading edge crushed | Replace and align leading-edge section | 5 hours | D |
| Surface skin torn | Reskin and load-test aerodynamic surface | 6 hours | C |
| Internal surface spar cracked | Reinforce or replace internal surface spar | 7 hours | C |
| Aerodynamic panel separated | Rebuild panel attachments and realign surface | 7 hours | C |
| Aerodynamic surface warped | Jig and restore aerodynamic surface | 8 hours | B |

### Thermal Protection

Minor faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Thermal tile chipped | Replace and seal thermal tile | 2 hours | F |
| Ablative coating glazed | Strip and renew ablative coating | 2 hours | E |
| Char layer uneven | Dress and recoat shield surface | 3 hours | E |
| Heat-spreader contact poor | Rebed and secure heat spreader | 4 hours | D |
| Shield surface crazed | Seal and recoat crazed shield area | 4 hours | D |

Major faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Shield panel burned through | Replace and certify shield panel | 6 hours | C |
| Thermal barrier delaminated | Remove and rebond thermal barrier | 8 hours | C |
| Heat spreader cracked | Replace and test heat spreader | 7 hours | C |
| Insulation blanket carbonized | Replace and seal insulation blanket | 5 hours | D |
| Shield substrate warped | Jig and restore shield substrate | 10 hours | B |

### Panel Bonding

Minor faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Bonding strip lifted | Clean and rebond panel strip | 2 hours | F |
| Panel edge seal cracked | Renew panel edge seal | 1.5 hours | F |
| Panel fasteners relaxed | Retorque and lock panel fasteners | 1.5 hours | F |
| Adhesive void detected | Inject and cure panel adhesive | 3 hours | E |
| Panel joint binding | Clean, reset, and lubricate panel joint | 3 hours | E |

Major faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Panel bond line separated | Strip and rebond panel | 5 hours | D |
| Attachment studs pulled through | Replace and reinforce attachment studs | 6 hours | C |
| Panel joint torn | Rebuild bonded panel joint | 5 hours | D |
| Bonded panel shifted | Realign and rebond panel | 7 hours | C |
| Mounting bed distorted | Restore and reinforce panel mounting bed | 8 hours | B |

### Pressure Vessel

Minor faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Pressure skin dented | Re-form and stress-relieve pressure skin | 4 hours | E |
| Pressure seam working loose | Rework and reseal pressure seam | 5 hours | D |
| Pressure-cycle fatigue found | Stop-drill and reinforce fatigued area | 6 hours | C |
| Pressure structure out of plane | Square and brace pressure structure | 7 hours | C |
| Reinforcement member shifted | Reset and secure reinforcement member | 5 hours | D |

Major faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Pressure structure cracked through | Weld and plate pressure structure | 12 hours | B |
| Structural seam separated | Rebuild structural pressure seam | 14 hours | B |
| Pressure section buckled | Jig, straighten, and reinforce pressure section | 18 hours | B |
| Reinforcement member torn free | Rebuild reinforcement-member attachment | 15 hours | B |
| Pressure section collapsed | Cut out and replace pressure section | 20 hours | A |

### Seals and Penetrations

Minor faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Penetration seal leaking | Repack and reseal pressure penetration | 2 hours | F |
| Seal insert hardened | Replace penetration seal insert | 2 hours | F |
| Feedthrough gasket weeping | Renew gasket and pressure-test feedthrough | 2.5 hours | F |
| Penetration collar out of seat | Reset and lock penetration collar | 3 hours | E |
| Sealant bed cracked | Strip and renew sealant bed | 4 hours | E |

Major faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Penetration block blown | Replace and repot penetration block | 6 hours | D |
| Penetration collar fractured | Replace collar and pressure-test penetration | 8 hours | C |
| Feedthrough assembly pulled loose | Rebuild and secure feedthrough assembly | 10 hours | C |
| Pressure seal channel torn | Rebuild pressure seal channel | 7 hours | D |
| Penetration plate warped | Straighten and reseat penetration plate | 9 hours | C |

### Load-Bearing Structure

Minor faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Load-bearing member bowed | Straighten and stress-relieve load-bearing member | 5 hours | D |
| Load flange distorted | Press and reinforce load flange | 4 hours | D |
| Fatigue crack initiated | Stop-drill and plate fatigued area | 6 hours | C |
| Web stiffener working loose | Secure and reinforce web stiffener | 3 hours | E |
| Load path out of alignment | Jig and align load-bearing structure | 6 hours | C |

Major faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Load-bearing member cracked through | Weld and plate load-bearing member | 10 hours | C |
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
| Joint bushings worn | Replace joint bushings | 3 hours | E |
| Joint pin working in bore | Refit joint pin and restore bore fit | 5 hours | D |

Major faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Fastener group sheared | Extract and replace fastener group | 6 hours | D |
| Joint bore elongated | Sleeve and ream joint bore | 8 hours | C |
| Joint pin cracked | Replace joint pin and inspect joint | 5 hours | D |
| Joint faces separated | Rebuild and clamp structural joint | 9 hours | C |
| Attachment lug torn | Rebuild lug and line-bore joint | 12 hours | B |

### Exterior Bodywork

Minor faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Panel fasteners loose | Secure and witness-mark panel fasteners | 1 hour | F |
| Panel edge seal lifted | Reseat and bond panel edge seal | 1.5 hours | F |
| Protective strip dented | Straighten and secure protective strip | 2 hours | E |
| Exterior panel buckled | Straighten and brace exterior panel | 3 hours | E |
| Panel seam opened | Dress, close, and reseal panel seam | 3 hours | E |

Major faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Exterior panel torn away | Fit replacement panel and restore attachments | 5 hours | D |
| Exterior enclosure exposed | Rebuild and seal exterior enclosure | 6 hours | D |
| Protective rail crushed | Replace protective rail and repair mounting points | 7 hours | C |
| Exterior seam split | Rebuild and reinforce exterior seam | 8 hours | C |
| Panel support frame collapsed | Reconstruct panel support frame | 10 hours | B |

### Mounts and Isolation

Minor faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Mounting bolts loose | Retorque and lock mounting bolts | 1.5 hours | F |
| Vibration isolator compressed | Replace vibration isolator | 2 hours | F |
| Mounted assembly shifted | Realign and secure mounted assembly | 3 hours | E |
| Mount bushing worn | Replace mount bushing | 3 hours | E |
| Support bracket cracked | Stop-drill and reinforce support bracket | 4 hours | D |

Major faults:

| Fault | Repair | Labor | Work grade |
|---|---|---:|:---:|
| Isolator bank failed | Replace and balance isolator bank | 5 hours | D |
| Mounting bracket fractured | Replace and reinforce mounting bracket | 6 hours | C |
| Mounting bed warped | Jig and straighten mounting bed | 8 hours | C |
| Anchor points pulled through | Rebuild and reinforce anchor points | 10 hours | B |
| Mounted assembly partially detached | Remount and reinforce mounted assembly | 9 hours | B |
