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

## Fault Libraries

Fault-library diagnoses combine with one of the component's authored flavor locations. Gameplay effects come from the affected component's current severity, not the library entry.

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
