import type { OperationsManualArticleId, OperationsManualTutorialEvent, OperationsManualTutorialTrigger } from './types';

export const OPERATIONS_MANUAL_TUTORIAL_TRIGGERS: readonly OperationsManualTutorialTrigger[] = [
  { missionTemplateId: 'basic-certification-still-transfer', event: 'cluster', articleId: 'local-transfer' },
  { missionTemplateId: 'basic-certification-still-transfer', event: 'docking', articleId: 'docking-undocking' },
  { missionTemplateId: 'basic-certification-weymark-landing', event: 'orbital', articleId: 'orbit-deorbit' },
  { missionTemplateId: 'basic-certification-weymark-landing', event: 'approach', articleId: 'airless-approach' },
  { missionTemplateId: 'basic-certification-weymark-landing', event: 'landing', articleId: 'surface-flight' },
  { missionTemplateId: 'basic-certification-nells-rest-return', event: 'orbital', articleId: 'orbital-rendezvous' },
];

export function operationsManualTutorialFor(
  missionTemplateId: string | undefined,
  event: OperationsManualTutorialEvent,
): OperationsManualArticleId | undefined {
  if (!missionTemplateId) return undefined;
  return OPERATIONS_MANUAL_TUTORIAL_TRIGGERS.find(trigger => (
    trigger.missionTemplateId === missionTemplateId && trigger.event === event
  ))?.articleId;
}
