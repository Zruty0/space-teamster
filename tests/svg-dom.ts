import { DOMParser as XmlParser, type Element as XmlElement } from '@xmldom/xmldom';

// Parse the real SVG assets in Node. Adapt only the browser Element APIs used by
// the production importer; no hardcoded geometry or stale generated fixtures.
function element(node: XmlElement): unknown {
  return {
    localName: node.localName,
    getAttribute: (name: string) => node.getAttribute(name),
    children: Array.from(node.childNodes).filter(child => child.nodeType === 1).map(child => element(child as XmlElement)),
  };
}
Object.defineProperty(globalThis, 'DOMParser', { configurable: true, value: class {
  parseFromString(source: string, mimeType: string) {
    const doc = new XmlParser({ onError: (_level, message) => { throw new Error(message); } }).parseFromString(source, mimeType);
    return { documentElement: element(doc.documentElement!), querySelector: (name: string) => doc.getElementsByTagName(name)[0] ?? null };
  }
} });
