import ascensionScaffoldSvg from '../art/stations/spacestation1.svg?raw';

export interface LocalLayoutPaint {
  fill?: string;
  fillOpacity: number;
  stroke?: string;
  strokeOpacity: number;
  strokeWidth: number;
  strokeDash: number[];
  opacity: number;
}

interface LocalLayoutShapeBase {
  id: string;
  paint: LocalLayoutPaint;
}

export interface LocalLayoutRect extends LocalLayoutShapeBase {
  kind: 'rect';
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LocalLayoutCircle extends LocalLayoutShapeBase {
  kind: 'circle';
  cx: number;
  cy: number;
  radius: number;
}

export interface LocalLayoutPath extends LocalLayoutShapeBase {
  kind: 'path';
  data: string;
  collisionPolygon: { x: number; y: number }[];
}

export type LocalLayoutShape = LocalLayoutRect | LocalLayoutCircle | LocalLayoutPath;

export interface LocalLayoutBerth {
  id: string;
  svgCenterX: number;
  svgCenterY: number;
  noseAngle: number;
}

export interface LocalLayout {
  id: string;
  centerX: number;
  centerY: number;
  widthMeters: number;
  heightMeters: number;
  svgUnitsPerMeter: number;
  shapes: LocalLayoutShape[];
  berths: LocalLayoutBerth[];
}

interface LocalLayoutAsset {
  id: string;
  svg: string;
}

const LOCAL_LAYOUT_ASSETS: Record<string, LocalLayoutAsset> = {
  'ascension-scaffold': { id: 'ascension-scaffold', svg: ascensionScaffoldSvg },
};

const parsedLayouts = new Map<string, LocalLayout>();

function finiteNumber(value: string | null, description: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`Invalid ${description}: ${value ?? 'missing'}`);
  return parsed;
}

function styleMap(element: Element): Map<string, string> {
  const styles = new Map<string, string>();
  for (const part of (element.getAttribute('style') ?? '').split(';')) {
    const colon = part.indexOf(':');
    if (colon <= 0) continue;
    styles.set(part.slice(0, colon).trim(), part.slice(colon + 1).trim());
  }
  return styles;
}

function styleValue(element: Element, styles: Map<string, string>, name: string, fallback: string): string {
  return element.getAttribute(name) ?? styles.get(name) ?? fallback;
}

function parsePaint(element: Element): LocalLayoutPaint {
  const styles = styleMap(element);
  const fill = styleValue(element, styles, 'fill', '#000000');
  const stroke = styleValue(element, styles, 'stroke', 'none');
  const dashText = styleValue(element, styles, 'stroke-dasharray', 'none');
  return {
    fill: fill === 'none' ? undefined : fill,
    fillOpacity: finiteNumber(styleValue(element, styles, 'fill-opacity', '1'), 'fill opacity'),
    stroke: stroke === 'none' ? undefined : stroke,
    strokeOpacity: finiteNumber(styleValue(element, styles, 'stroke-opacity', '1'), 'stroke opacity'),
    strokeWidth: finiteNumber(styleValue(element, styles, 'stroke-width', '1'), 'stroke width'),
    strokeDash: dashText === 'none' ? [] : dashText.split(/[ ,]+/).filter(Boolean).map(value => finiteNumber(value, 'stroke dash')),
    opacity: finiteNumber(styleValue(element, styles, 'opacity', '1'), 'opacity'),
  };
}

function pathTokens(data: string): string[] {
  return data.match(/[a-zA-Z]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g) ?? [];
}

function arcPoints(
  x1: number, y1: number, rxValue: number, ryValue: number, rotationDegrees: number,
  largeArc: number, sweep: number, x2: number, y2: number,
): { x: number; y: number }[] {
  let rx = Math.abs(rxValue);
  let ry = Math.abs(ryValue);
  if (rx === 0 || ry === 0 || (x1 === x2 && y1 === y2)) return [{ x: x2, y: y2 }];
  const phi = rotationDegrees * Math.PI / 180;
  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);
  const dx = (x1 - x2) / 2;
  const dy = (y1 - y2) / 2;
  const xPrime = cosPhi * dx + sinPhi * dy;
  const yPrime = -sinPhi * dx + cosPhi * dy;
  const lambda = (xPrime * xPrime) / (rx * rx) + (yPrime * yPrime) / (ry * ry);
  if (lambda > 1) {
    const scale = Math.sqrt(lambda);
    rx *= scale;
    ry *= scale;
  }
  const rx2 = rx * rx;
  const ry2 = ry * ry;
  const numerator = Math.max(0, rx2 * ry2 - rx2 * yPrime * yPrime - ry2 * xPrime * xPrime);
  const denominator = rx2 * yPrime * yPrime + ry2 * xPrime * xPrime;
  const coefficient = (largeArc === sweep ? -1 : 1) * Math.sqrt(denominator > 0 ? numerator / denominator : 0);
  const cxPrime = coefficient * (rx * yPrime / ry);
  const cyPrime = coefficient * (-ry * xPrime / rx);
  const cx = cosPhi * cxPrime - sinPhi * cyPrime + (x1 + x2) / 2;
  const cy = sinPhi * cxPrime + cosPhi * cyPrime + (y1 + y2) / 2;
  const angle = (ux: number, uy: number, vx: number, vy: number): number => {
    const dot = ux * vx + uy * vy;
    const cross = ux * vy - uy * vx;
    return Math.atan2(cross, dot);
  };
  const ux = (xPrime - cxPrime) / rx;
  const uy = (yPrime - cyPrime) / ry;
  const vx = (-xPrime - cxPrime) / rx;
  const vy = (-yPrime - cyPrime) / ry;
  const start = angle(1, 0, ux, uy);
  let delta = angle(ux, uy, vx, vy);
  if (!sweep && delta > 0) delta -= Math.PI * 2;
  if (sweep && delta < 0) delta += Math.PI * 2;
  const segments = Math.max(1, Math.ceil(Math.abs(delta) / (Math.PI / 24)));
  const points: { x: number; y: number }[] = [];
  for (let i = 1; i <= segments; i++) {
    const theta = start + delta * i / segments;
    const cosTheta = Math.cos(theta);
    const sinTheta = Math.sin(theta);
    points.push({
      x: cx + cosPhi * rx * cosTheta - sinPhi * ry * sinTheta,
      y: cy + sinPhi * rx * cosTheta + cosPhi * ry * sinTheta,
    });
  }
  return points;
}

function flattenPath(data: string): { x: number; y: number }[] {
  const tokens = pathTokens(data);
  const points: { x: number; y: number }[] = [];
  let index = 0;
  let command = '';
  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;
  const isCommand = (token: string | undefined) => !!token && /^[a-zA-Z]$/.test(token);
  const number = (): number => finiteNumber(tokens[index++] ?? null, 'path coordinate');

  while (index < tokens.length) {
    if (isCommand(tokens[index])) command = tokens[index++];
    if (!command) throw new Error('SVG path starts without a command');
    const relative = command === command.toLowerCase();
    switch (command.toUpperCase()) {
      case 'M': {
        const nx = number();
        const ny = number();
        x = relative ? x + nx : nx;
        y = relative ? y + ny : ny;
        startX = x;
        startY = y;
        points.push({ x, y });
        command = relative ? 'l' : 'L';
        break;
      }
      case 'L': {
        const nx = number();
        const ny = number();
        x = relative ? x + nx : nx;
        y = relative ? y + ny : ny;
        points.push({ x, y });
        break;
      }
      case 'H': {
        const nx = number();
        x = relative ? x + nx : nx;
        points.push({ x, y });
        break;
      }
      case 'V': {
        const ny = number();
        y = relative ? y + ny : ny;
        points.push({ x, y });
        break;
      }
      case 'A': {
        const rx = number();
        const ry = number();
        const rotation = number();
        const largeArc = number();
        const sweep = number();
        const nx = number();
        const ny = number();
        const x2 = relative ? x + nx : nx;
        const y2 = relative ? y + ny : ny;
        points.push(...arcPoints(x, y, rx, ry, rotation, largeArc, sweep, x2, y2));
        x = x2;
        y = y2;
        break;
      }
      case 'Z':
        if (x !== startX || y !== startY) points.push({ x: startX, y: startY });
        x = startX;
        y = startY;
        command = '';
        break;
      default:
        throw new Error(`Unsupported local-layout SVG path command: ${command}`);
    }
  }
  return points;
}

function berthNoseAngle(direction: string): number {
  if (direction === 'right') return 0;
  if (direction === 'up') return Math.PI / 2;
  if (direction === 'left') return Math.PI;
  return -Math.PI / 2;
}

function parseLocalLayout(asset: LocalLayoutAsset): LocalLayout {
  const document = new DOMParser().parseFromString(asset.svg, 'image/svg+xml');
  const parseError = document.querySelector('parsererror');
  if (parseError) throw new Error(`Invalid local-layout SVG ${asset.id}: ${parseError.textContent ?? 'parse error'}`);
  const shapes: LocalLayoutShape[] = [];
  const berthElements: { id: string; element: Element; direction: string }[] = [];
  const bounds: { minX: number; minY: number; maxX: number; maxY: number }[] = [];

  for (const element of Array.from(document.querySelectorAll('rect,circle,path'))) {
    const id = element.getAttribute('id') ?? '';
    const berthMatch = /^berth-(.+)-nose-(left|right|up|down)$/.exec(id);
    if (berthMatch) {
      if (element.localName !== 'rect') throw new Error(`Local-layout berth ${id} must be a rectangle`);
      berthElements.push({ id, element, direction: berthMatch[2] });
      continue;
    }
    const paint = parsePaint(element);
    if (element.localName === 'rect') {
      const shape: LocalLayoutRect = {
        kind: 'rect', id, paint,
        x: finiteNumber(element.getAttribute('x') ?? '0', `${id} x`),
        y: finiteNumber(element.getAttribute('y') ?? '0', `${id} y`),
        width: finiteNumber(element.getAttribute('width'), `${id} width`),
        height: finiteNumber(element.getAttribute('height'), `${id} height`),
      };
      shapes.push(shape);
      bounds.push({ minX: shape.x, minY: shape.y, maxX: shape.x + shape.width, maxY: shape.y + shape.height });
    } else if (element.localName === 'circle') {
      const shape: LocalLayoutCircle = {
        kind: 'circle', id, paint,
        cx: finiteNumber(element.getAttribute('cx') ?? '0', `${id} cx`),
        cy: finiteNumber(element.getAttribute('cy') ?? '0', `${id} cy`),
        radius: finiteNumber(element.getAttribute('r'), `${id} radius`),
      };
      shapes.push(shape);
      bounds.push({ minX: shape.cx - shape.radius, minY: shape.cy - shape.radius, maxX: shape.cx + shape.radius, maxY: shape.cy + shape.radius });
    } else {
      const data = element.getAttribute('d') ?? '';
      const collisionPolygon = flattenPath(data);
      if (collisionPolygon.length < 3) throw new Error(`Local-layout path ${id} has no closed collision area`);
      const shape: LocalLayoutPath = { kind: 'path', id, paint, data, collisionPolygon };
      shapes.push(shape);
      bounds.push({
        minX: Math.min(...collisionPolygon.map(point => point.x)),
        minY: Math.min(...collisionPolygon.map(point => point.y)),
        maxX: Math.max(...collisionPolygon.map(point => point.x)),
        maxY: Math.max(...collisionPolygon.map(point => point.y)),
      });
    }
  }
  if (!bounds.length) throw new Error(`Local layout ${asset.id} contains no renderable geometry`);
  if (!berthElements.length) throw new Error(`Local layout ${asset.id} contains no named berths`);
  const markerScales = berthElements.map(({ id, element, direction }) => {
    const width = finiteNumber(element.getAttribute('width'), `${id} width`);
    const height = finiteNumber(element.getAttribute('height'), `${id} height`);
    const longSide = direction === 'left' || direction === 'right' ? width : height;
    const shortSide = direction === 'left' || direction === 'right' ? height : width;
    const longScale = longSide / 14;
    const shortScale = shortSide / 4;
    if (Math.abs(longScale - shortScale) > Math.max(longScale, shortScale) * 0.01) {
      throw new Error(`Local-layout berth ${id} is not a 14×4 cargo footprint`);
    }
    return (longScale + shortScale) / 2;
  });
  const svgUnitsPerMeter = markerScales[0];
  if (markerScales.some(scale => Math.abs(scale - svgUnitsPerMeter) > svgUnitsPerMeter * 0.01)) {
    throw new Error(`Local-layout berths in ${asset.id} do not use a consistent scale`);
  }
  const minX = Math.min(...bounds.map(bound => bound.minX));
  const minY = Math.min(...bounds.map(bound => bound.minY));
  const maxX = Math.max(...bounds.map(bound => bound.maxX));
  const maxY = Math.max(...bounds.map(bound => bound.maxY));
  const berths: LocalLayoutBerth[] = berthElements.map(({ id, element, direction }) => {
    const x = finiteNumber(element.getAttribute('x') ?? '0', `${id} x`);
    const y = finiteNumber(element.getAttribute('y') ?? '0', `${id} y`);
    const width = finiteNumber(element.getAttribute('width'), `${id} width`);
    const height = finiteNumber(element.getAttribute('height'), `${id} height`);
    return { id, svgCenterX: x + width / 2, svgCenterY: y + height / 2, noseAngle: berthNoseAngle(direction) };
  });
  return {
    id: asset.id,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
    widthMeters: (maxX - minX) / svgUnitsPerMeter,
    heightMeters: (maxY - minY) / svgUnitsPerMeter,
    svgUnitsPerMeter,
    shapes,
    berths,
  };
}

export function localLayoutById(id: string | undefined): LocalLayout | undefined {
  if (!id) return undefined;
  const cached = parsedLayouts.get(id);
  if (cached) return cached;
  const asset = LOCAL_LAYOUT_ASSETS[id];
  if (!asset) return undefined;
  const parsed = parseLocalLayout(asset);
  parsedLayouts.set(id, parsed);
  return parsed;
}
