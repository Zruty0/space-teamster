import type { CareerProfile } from './career-state';
import type { InteractiveScene } from './interactive-scene';
import { formatCredits } from './mission-cost';
import { RIG_EQUIPMENT, equipmentPayment, equipmentQuote, equipmentUnavailableReason } from './maintenance/equipment';
import { stockedComponentGrades, type MaintenanceShopDef } from './maintenance/shops';
import type { ComponentGrade, RigEquipmentId } from './maintenance/types';

function hours(value: number): string { return `${Number(value.toFixed(2))}h`; }

export function equipmentScene(profile: CareerProfile, shop: MaintenanceShopDef, local: boolean, selection?: { id: RigEquipmentId; grade: ComponentGrade }, receipt?: string): InteractiveScene {
  const subtitle = `${shop.organizationName ?? shop.name}   CASH: ${formatCredits(profile.money)}`;
  const quote = selection && equipmentQuote(profile.rig, shop, selection.id, selection.grade);
  if (selection && quote) {
    const equipment = RIG_EQUIPMENT[selection.id];
    const payment = equipmentPayment(profile, shop, quote);
    return {
      title: equipment.name.toUpperCase(), subtitle,
      bodyRows: [
        { kind: 'text', text: equipment.description },
        ...(quote.grade ? [{ kind: 'kv' as const, label: 'Component grade', value: quote.grade }] : []),
        { kind: 'kv', label: 'Parts', value: formatCredits(quote.partsCredits) },
        { kind: 'kv', label: 'Installation', value: hours(quote.laborHours) },
        { kind: 'kv', label: 'Labor', value: formatCredits(Math.round(quote.laborHours * shop.laborRate)) },
        { kind: 'kv', label: 'Price', value: formatCredits(quote.credits) },
        ...(payment.credit ? [{ kind: 'kv' as const, label: 'Service Credit', value: formatCredits(payment.credit), tone: 'success' as const }] : []),
        { kind: 'kv', label: 'Cash after', value: formatCredits(profile.money - payment.due), tone: profile.money >= payment.due ? 'success' : 'danger' },
      ],
      footer: 'Enter/Space: choose   Esc: start menu',
      options: [
        { label: `Authorize ${formatCredits(payment.due)} and ${hours(quote.laborHours)} of work`, labelLineCount: 2, detail: equipment.name, action: `equipmentBuy:${shop.id}:${selection.id}:${selection.grade}`, tone: 'primary', disabled: !local || profile.money < payment.due },
        { label: 'Cancel', detail: 'Return without spending money or time.', action: `equipmentList:${shop.id}`, tone: 'back' },
      ],
    };
  }
  return {
    title: 'EQUIPMENT', subtitle,
    bodyRows: [
      ...(receipt ? [{ kind: 'text' as const, text: receipt, tone: 'success' as const }] : []),
      ...(shop.equipmentIds ?? []).map(id => ({ kind: 'text' as const, text: `${RIG_EQUIPMENT[id].name}: ${RIG_EQUIPMENT[id].description}` })),
    ],
    footer: 'W/S or ↑↓: select   Enter/Space: choose   Esc: start menu',
    options: [
      ...(shop.equipmentIds ?? []).flatMap(id => {
        const reason = equipmentUnavailableReason(profile.rig, shop, id);
        const grades: ComponentGrade[] = id === 'atmospheric-package' && !reason ? stockedComponentGrades(shop) : ['D'];
        return grades.map(grade => {
          const quote = equipmentQuote(profile.rig, shop, id, grade);
          return {
            label: `${RIG_EQUIPMENT[id].name}${id === 'atmospheric-package' && !reason ? ` — Grade ${grade}` : ''}`,
            detail: reason ?? (id === 'atmospheric-package' ? 'Install missing package components.' : 'Install additional thermal protection.'),
            rightText: quote ? formatCredits(quote.credits) : undefined,
            rightDetail: quote ? hours(quote.laborHours) : undefined,
            action: `equipmentConfirm:${shop.id}:${id}:${grade}`,
            tone: reason ? 'muted' as const : 'primary' as const,
            disabled: !local || !quote,
          };
        });
      }),
      { label: 'Back to Service Desk', detail: 'Return to shop services.', action: `maintenanceShop:${shop.id}`, tone: 'back' },
    ],
  };
}
