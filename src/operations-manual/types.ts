export type OperationsManualArticleId = 'local-transfer' | 'docking-undocking' | 'airless-approach' | 'surface-flight' | 'orbit-deorbit' | 'orbital-rendezvous';
export type ManualDiagramId = 'orbital-rendezvous-phasing' | 'orbital-rendezvous-closest-pass';
export type OperationsManualTutorialEvent = 'landing' | 'approach' | 'docking' | 'cluster' | 'orbital';

export interface ManualControl {
  keys: string[];
  action: string;
  description: string;
  modeSpecific?: boolean;
}

export interface ManualProcedureSection {
  title?: string;
  steps: string[];
  diagram?: ManualDiagramId;
}

export interface ManualTipsSection {
  items: string[];
  diagram?: ManualDiagramId;
}

export interface OperationsManualArticle {
  id: OperationsManualArticleId;
  title: string;
  introduction: string;
  controls: ManualControl[];
  tips: ManualTipsSection;
  procedure?: string[];
  procedureSections?: ManualProcedureSection[];
  hud: { label: string; description: string }[];
}

export interface OperationsManualEntry {
  article: OperationsManualArticle;
  menuSummary: string;
}

export interface OperationsManualTutorialTrigger {
  missionTemplateId: string;
  event: OperationsManualTutorialEvent;
  articleId: OperationsManualArticleId;
}
