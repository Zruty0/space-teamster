// Mission definitions for Space Teamster campaign.

export interface Mission {
  id: number;
  name: string;
  subtitle: string;
  completionText: string;
  stub: boolean;           // true = "coming soon", not playable yet
  startWorldTime: number;  // absolute system time to reset to on mission start
  // Phase chain for this mission (first phase is starting phase)
  startPhase: 'docking' | 'orbital' | 'approach' | 'landing';
}

export const MISSIONS: Mission[] = [
  {
    id: 1,
    name: 'Mail Run',
    subtitle: 'Deliver supplies from Orbital Hub Calloway to the mining settlement on Castor.',
    completionText: 'Mail, rations, snacks, packages — small pleasures for the hard-working miners. You\'re invited to join the evening at The Rusty Vein.',
    stub: false,
    startWorldTime: 0,
    startPhase: 'docking',
  },
  {
    id: 2,
    name: 'Core Samples',
    subtitle: 'Haul geological survey cores from Castor\'s mining camp back to Calloway Station.',
    completionText: 'The lab techs have been waiting weeks for these. Dr. Vasquez is already pulling the first core before your container clamps disengage.',
    stub: false,
    startWorldTime: 0,
    startPhase: 'landing',
  },
  {
    id: 3,
    name: 'Festival Freight',
    subtitle: 'Deliver decorations from Anchor Station to Port Kessler on Tycho for Founders\' Day.',
    completionText: 'The whole town turns out to unload. Kids are already hanging lanterns. The festival committee insists you stay for the opening ceremony at Kessler Square.',
    stub: false,
    startWorldTime: 0,
    startPhase: 'docking',
  },
  {
    id: 4,
    name: 'The Morning After',
    subtitle: 'Haul recycling and festival waste from Port Kessler back up to Anchor Station.',
    completionText: 'Not glamorous, but Anchor\'s waste chief slips you a bonus for the quick turnaround. \'Fastest cleanup in three years,\' she says.',
    stub: false,
    startWorldTime: 0,
    startPhase: 'landing',
  },
  {
    id: 5,
    name: 'Twin Run',
    subtitle: 'Transport drilling equipment from Castor to the new outpost on Pollux, its sister moon.',
    completionText: 'The Pollux crew has been working with improvised tools for months. The foreman shakes your hand and won\'t let go.',
    stub: false,
    startWorldTime: 0,
    startPhase: 'landing',
  },
  {
    id: 6,
    name: 'The Hard Way Up',
    subtitle: 'Deliver medical supplies from Port Kessler on Tycho to Morrow Station in high Castor orbit.',
    completionText: 'The station medic checks every crate twice. \'You have no idea how long we\'ve been rationing,\' she says quietly.',
    stub: false,
    startWorldTime: 0,
    startPhase: 'landing',
  },
  {
    id: 7,
    name: 'Long Haul',
    subtitle: 'Priority cargo from Calloway Station in Castor orbit to Port Kessler on Tycho.',
    completionText: 'Dock workers at Kessler give you the nod — the one reserved for drivers who\'ve done the long haul. Your name goes on the board at The Rusty Anchor.',
    stub: true,
    startWorldTime: 0,
    startPhase: 'docking',
  },
];
