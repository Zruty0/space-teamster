import { type HighlinerSeedDef, type InstitutionDef } from '../types';

export const ESTELLA_INSTITUTIONS: InstitutionDef[] = [
  {
    id: 'teamsters-guild',
    name: 'The Teamsters\' Guild',
    tags: ['fuel-monopoly', 'engine-monopoly', 'certification', 'insurance', 'debt'],
    summary: 'System-wide fuel-and-engine monopoly; formally neutral, practically the strongest institution in Estella.',
    services: ['fuel', 'engines', 'maneuvering', 'rcs', 'certifications', 'insurance', 'debt'],
    constraints: ['Does not sell hulls, electronics, life support, cargo systems, or weapons.', 'Controls stable fuel canister synthesis through the Still.'],
  },
  {
    id: 'highliners',
    name: 'Highliners',
    tags: ['interstellar', 'era-event', 'cargo', 'immigration'],
    summary: 'Great interstellar cargo vessels whose arrivals create temporary Eras of intensified trade, immigration, politics, and contract volume.',
    services: ['interstellar-cargo', 'immigration', 'premium-contracts'],
  },
];

export const ESTELLA_HIGHLINER_SEEDS: HighlinerSeedDef[] = [
  { id: 'highliner-religious-vessel', name: 'Religious Highliner Archetype', role: 'pilgrim/missionary arrival', notes: 'Writer-authored named Highliner seed; biases contracts toward pilgrims, relics, and religious faction work.', cargoBias: ['pilgrims', 'cultural-goods', 'supplies'], factionTags: ['religious'] },
  { id: 'highliner-mercenary-contract-carrier', name: 'Mercenary Contract Carrier Archetype', role: 'security/military-adjacent arrival', notes: 'Writer-authored named Highliner seed; biases contracts toward restricted cargo and politically sharp work.', cargoBias: ['secure-cargo', 'classified-cargo', 'weapons'], factionTags: ['mercenary'] },
  { id: 'highliner-corporate-freight-monolith', name: 'Corporate Freight Monolith Archetype', role: 'bulk commercial arrival', notes: 'Writer-authored named Highliner seed; biases contracts toward high-volume industrial cargo.', cargoBias: ['machinery', 'finished-goods', 'bulk-food'], factionTags: ['corporate'] },
  { id: 'highliner-colony-ship-pilgrims', name: 'Colony Ship of Pilgrims Archetype', role: 'immigration wave', notes: 'Writer-authored named Highliner seed; biases contracts toward passengers, life support, and settlement supply.', cargoBias: ['passengers', 'life-support', 'bulk-food'], factionTags: ['settler'] },
  { id: 'highliner-research-consortium', name: 'Research Consortium Archetype', role: 'science arrival', notes: 'Writer-authored named Highliner seed; biases contracts toward instruments, samples, and restricted science runs.', cargoBias: ['science-data', 'instruments', 'biological-samples'], factionTags: ['science'] },
  { id: 'highliner-smuggler-in-good-standing', name: 'Smuggler-in-Good-Standing Archetype', role: 'gray-market arrival', notes: 'Writer-authored named Highliner seed; biases contracts toward deniable cargo and shady destinations.', cargoBias: ['deniable-cargo', 'fenced-goods', 'luxury-goods'], factionTags: ['smuggling'] },
];

