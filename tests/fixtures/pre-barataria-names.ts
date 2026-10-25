/** Approved display-only XIV renames; historic numeric/seed fixtures stay frozen. */
export function preBaratariaNames(text: string): string {
  return text.split('Barataria Observatory').join('Estella XIV Transit Dock')
    .replace(/\bBarataria\b/g, 'Estella XIV')
    .split('False Bottom Cache').join('Religious Retreat / Monastery')
    .split('The Warren').join('Smuggler Haven')
    .split('Blind Drop').join('Abandoned-but-Active Site');
}
