# Rig Maintenance Telemetry

Approved telemetry-to-strike model for persistent rig maintenance. Component HP/AP, grades, faults, and repair rules are defined in `non-flight-interaction-plan.md`; the component catalog is in `rig-maintenance-components.md`.

## Strike generation

Every telemetry channel adds expected-strike weight to one or more of the seven systems:

```text
baseWeight[system] = sum(telemetryUnits[channel] × coefficient[channel][system])
adjustedWeight[system] = baseWeight[system] × product(activeFaultMultipliers[system])
missionMean = sum(adjustedWeight)
strikeCount ~ Poisson(missionMean)
```

Each generated strike selects a system in proportion to its adjusted weight, then selects an installed component uniformly within that system. There is no hidden baseline and no normalization after telemetry is evaluated. A gentle mission may have a mean below one; demanding or abusive flight may exceed one. Zero base weight remains zero after fault modifiers.

At a mission mean of `1.0`, strike-count probabilities are `36.8%` zero, `36.8%` one, `18.4%` two, `6.1%` three, and `1.9%` four or more.

## Distorted player time

All duration and time-integral channels use wall-clock player time distorted by the same logarithmic rule used for passenger comfort:

```text
warpDistortion(userWarp) = 1 + 0.5 × log10(max(1, userWarp))
distortedDt = wallClockDt × warpDistortion(userWarp)
```

Thus `1×` warp counts at `1×`, `10×` at `1.5×`, and `100×` at `2×`. Fixed simulation/base-time scaling does not multiply exposure. Paused time and terminal/menu time add nothing.

## Thrust and maneuvering

| Telemetry | One unit | Weight added per unit |
|---|---|---|
| Standard main-drive thrust | `1,000 m/s` standard-thrust Delta-V | Body and Frame `0.10`; Powertrain `0.028`; Cab and Controls `0.04` |
| High main-drive thrust | `1,000 m/s` high-thrust Delta-V | Body and Frame `0.20`; Powertrain `0.06`; Cab and Controls `0.06` |
| Sustained main-drive operation | 5 distorted player minutes with the main drive firing | Powertrain `0.06`; Auxiliary Systems `0.02` |
| Standard maneuvering thrust | `100 m/s` maneuvering-thruster Delta-V | Body and Frame `0.02`; Steering and Thrusters `0.10`; Cab and Controls `0.02` |
| High maneuvering thrust | `100 m/s` high-thrust maneuvering Delta-V | Body and Frame `0.04`; Steering and Thrusters `0.20`; Cab and Controls `0.02` |
| Braking SAS operation | 60 distorted player seconds of active SAS firing | Steering and Thrusters `0.04`; Cab and Controls `0.01` |

Standard and high-thrust Delta-V are recorded separately; high-thrust Delta-V does not also receive the standard-thrust row. Main-drive Powertrain coefficients retain approximately the same standard/high ratio while remaining one-fifth of their original values. The displaced wear is assigned primarily to Body and Frame, then Cab and Controls, because ordinary hauling thrust is expected to stress the rig's load path and controls more often than it damages the main powerplant.

## Duration and manifest load

| Telemetry | One unit | Weight added per unit |
|---|---|---|
| Flight duration | 10 distorted player minutes in flight phases | Cab and Controls `0.06`; Auxiliary Systems `0.08` |
| Passenger occupancy | 10 distorted player minutes with passengers aboard | Auxiliary Systems `0.05` |
| Loaded thrust stress | `(manifest mass / 30 t) × (total thrust Delta-V / 1,000 m/s)` | Body and Frame `0.05`; Auxiliary Systems `0.03` |
| Freight handling cycle | One completed pickup-to-delivery cycle | Body and Frame `0.01`; Auxiliary Systems `0.05` |
| Passenger service cycle | One completed passenger trip | Auxiliary Systems `0.04` |
| Communications cycle | One completed mission | Auxiliary Systems `0.02` |

Empty-flight manifest mass is zero. Container tare is included in freight manifest mass.

## Atmospheric flight

These channels remain exactly zero outside atmospheric flight. Time integrals use distorted player time.

| Telemetry | One unit | Weight added per unit |
|---|---|---|
| Heat exposure | `integral(temperature^2 × distortedDt) / 30 seconds` | Body and Frame `0.01`; Powertrain `0.02`; Atmospheric Package `0.10`; Auxiliary Systems `0.01` |
| Severe heat exposure | `integral(max(0, (temperature - 0.8) / 0.2)^2 × distortedDt) / 10 seconds` | Body and Frame `0.05`; Powertrain `0.10`; Atmospheric Package `0.30`; Cab and Controls `0.05`; Auxiliary Systems `0.05` |
| Aerodynamic loading | `integral((aerodynamic acceleration / 1g)^2 × distortedDt) / 30 seconds` | Body and Frame `0.03`; Steering and Thrusters `0.02`; Atmospheric Package `0.08` |
| Turbulence exposure | 30 distorted player seconds in active turbulence | Body and Frame `0.03`; Steering and Thrusters `0.03`; Atmospheric Package `0.05`; Cab and Controls `0.01` |
| Wing operation | Ten full-range-equivalent wing movements | Atmospheric Package `0.03`; Cab and Controls `0.01` |

Severe heat is added on top of ordinary heat exposure. Its quadratic curve allows sustained overheating to add multiple strike-equivalents.

## Surface operations

| Telemetry | One unit | Weight added per unit |
|---|---|---|
| Surface operation cycle | One launch or one successful landing | Body and Frame `0.01`; Landing and Docking `0.05` |
| Touchdown stress | One normalized touchdown-stress unit | Body and Frame `0.15`; Steering and Thrusters `0.05`; Landing and Docking `0.35`; Auxiliary Systems `0.05` |

Touchdown stress is:

```text
r = max(
  abs(verticalSpeed) / maximumAcceptedVerticalSpeed,
  abs(horizontalSpeed) / maximumAcceptedHorizontalSpeed,
  abs(angleError) / maximumAcceptedAngle
)

touchdownStress = clamp((r - 0.2) / 0.8, 0, 1)^2
```

At or below 20% of accepted limits this adds zero. At 50%, 75%, and 100% of limits it adds approximately `0.084`, `0.284`, and `0.600` total expected strikes respectively.

## Docking operations

| Telemetry | One unit | Weight added per unit |
|---|---|---|
| Docking operation cycle | One successful docking or undocking | Body and Frame `0.01`; Landing and Docking `0.05`; Auxiliary Systems `0.01` |
| Tractor capture | One completed tractor capture | Body and Frame `0.01`; Landing and Docking `0.07` |
| Docking collision | `(impact speed / 5 m/s)^2` for each contact | Body and Frame `0.12`; Steering and Thrusters `0.08`; Landing and Docking `0.30`; Auxiliary Systems `0.05` |

Multiple docking contacts add independently. A `5 m/s` contact adds `0.55` total expected strikes; two add `1.10`.

## Other nonfatal collisions

A collision not already counted as touchdown or docking contact uses:

```text
collisionStress = (impact speed / authored safe speed)^2
```

Each collision-stress unit adds Body and Frame `0.45`, Powertrain `0.05`, Steering and Thrusters `0.15`, Landing and Docking `0.10`, Cab and Controls `0.05`, and Auxiliary Systems `0.10`. It additionally adds Atmospheric Package `0.10` only when the collision occurs during atmospheric flight. The total is `0.90` outside atmosphere or `1.00` in atmosphere.

## Calibration example

A clean station freight mission with `900 m/s` standard main-drive Delta-V, `100 m/s` high-thrust Delta-V, five distorted drive-firing minutes, `100 m/s` standard maneuvering Delta-V, 30 distorted SAS seconds, ten distorted flight minutes, 30 tonnes of freight, one freight cycle, an undocking and docking, one tractor capture, and no collision produces:

```text
main drive              0.183
firing duration         0.080
maneuvering             0.140
braking SAS             0.025
flight duration         0.140
loaded thrust stress    0.088
freight handling        0.060
dock + undock           0.140
tractor capture         0.080
communications          0.020
                        -----
mission mean            0.956 strikes
```
