/** Display-only inverse for frozen pre-Thule fixtures, never runtime data. */
export function preThuleNames(text:string):string {
  return text.split('Thule Anchorage').join('Estella XIII Main Port')
    .replace(/\bThule\b/g,'Estella XIII')
    .split('Common Ground').join("Governor's Outpost / Settlement")
    .split('Deepwell').join('Deep Ice Mining')
    .split('Volya').join('Long-Range Comm Relay / Observatory')
    .split('Freehold').join('Prison / Exile Colony')
    .split('Bellevue').join('Sealed Classified Research Outpost');
}
