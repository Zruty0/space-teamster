import medievalStationSvg from '../art/stations/medieval-station.svg?raw';
import smallStation1Svg from '../art/stations/small-station-1.svg?raw';
import smallStation2Svg from '../art/stations/small-station-2.svg?raw';

export interface LocalLayoutPaint {
  fill?: string;
  fillOpacity: number;
  stroke?: string;
  strokeOpacity: number;
  strokeWidth: number;
  strokeDash: number[];
  opacity: number;
}

export interface LocalLayoutTransform {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
}

interface LocalLayoutShapeBase {
  id: string;
  paint: LocalLayoutPaint;
  transform: LocalLayoutTransform;
  // Filled geometry in final SVG coordinates. Open decorative paths have no
  // polygon and therefore render without becoming collision surfaces.
  collisionPolygon?: { x: number; y: number }[];
  strokeCollisionPolygons?: { x: number; y: number }[][];
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

export interface LocalLayoutEllipse extends LocalLayoutShapeBase {
  kind: 'ellipse';
  cx: number;
  cy: number;
  radiusX: number;
  radiusY: number;
}

export interface LocalLayoutPath extends LocalLayoutShapeBase {
  kind: 'path';
  data: string;
}

export type LocalLayoutShape = LocalLayoutRect | LocalLayoutCircle | LocalLayoutEllipse | LocalLayoutPath;

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
  'medieval-station': { id: 'medieval-station', svg: medievalStationSvg },
  'small-station-1': { id: 'small-station-1', svg: smallStation1Svg },
  'small-station-2': { id: 'small-station-2', svg: smallStation2Svg },
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

function styleValue(element: Element, styles: Map<string, string>, name: string): string | undefined {
  return element.getAttribute(name) ?? styles.get(name);
}

const DEFAULT_PAINT: LocalLayoutPaint = {
  fill: '#000000',
  fillOpacity: 1,
  stroke: undefined,
  strokeOpacity: 1,
  strokeWidth: 1,
  strokeDash: [],
  opacity: 1,
};

function parsePaint(element: Element, inherited: LocalLayoutPaint = DEFAULT_PAINT): LocalLayoutPaint {
  const styles = styleMap(element);
  const fillText = styleValue(element, styles, 'fill');
  const strokeText = styleValue(element, styles, 'stroke');
  const dashText = styleValue(element, styles, 'stroke-dasharray');
  const ownOpacity = finiteNumber(styleValue(element, styles, 'opacity') ?? '1', 'opacity');
  return {
    fill: fillText === undefined ? inherited.fill : fillText === 'none' ? undefined : fillText,
    fillOpacity: finiteNumber(styleValue(element, styles, 'fill-opacity') ?? String(inherited.fillOpacity), 'fill opacity'),
    stroke: strokeText === undefined ? inherited.stroke : strokeText === 'none' ? undefined : strokeText,
    strokeOpacity: finiteNumber(styleValue(element, styles, 'stroke-opacity') ?? String(inherited.strokeOpacity), 'stroke opacity'),
    strokeWidth: finiteNumber(styleValue(element, styles, 'stroke-width') ?? String(inherited.strokeWidth), 'stroke width'),
    strokeDash: dashText === undefined
      ? inherited.strokeDash
      : dashText === 'none' ? [] : dashText.split(/[ ,]+/).filter(Boolean).map(value => finiteNumber(value, 'stroke dash')),
    opacity: inherited.opacity * ownOpacity,
  };
}

const IDENTITY_TRANSFORM: LocalLayoutTransform = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };

function multiplyTransforms(left: LocalLayoutTransform, right: LocalLayoutTransform): LocalLayoutTransform {
  return {
    a: left.a * right.a + left.c * right.b,
    b: left.b * right.a + left.d * right.b,
    c: left.a * right.c + left.c * right.d,
    d: left.b * right.c + left.d * right.d,
    e: left.a * right.e + left.c * right.f + left.e,
    f: left.b * right.e + left.d * right.f + left.f,
  };
}

function parseTransform(value: string | null): LocalLayoutTransform {
  if (!value?.trim()) return IDENTITY_TRANSFORM;
  let result = IDENTITY_TRANSFORM;
  const expression = /([a-zA-Z]+)\s*\(([^)]*)\)/g;
  let match: RegExpExecArray | null;
  let consumed = '';
  while ((match = expression.exec(value))) {
    consumed += match[0];
    const args = match[2].split(/[ ,]+/).filter(Boolean).map(number => finiteNumber(number, `transform ${match![1]}`));
    const name = match[1].toLowerCase();
    let operation: LocalLayoutTransform;
    if (name === 'matrix' && args.length === 6) {
      operation = { a: args[0], b: args[1], c: args[2], d: args[3], e: args[4], f: args[5] };
    } else if (name === 'translate' && (args.length === 1 || args.length === 2)) {
      operation = { a: 1, b: 0, c: 0, d: 1, e: args[0], f: args[1] ?? 0 };
    } else if (name === 'scale' && (args.length === 1 || args.length === 2)) {
      operation = { a: args[0], b: 0, c: 0, d: args[1] ?? args[0], e: 0, f: 0 };
    } else if (name === 'rotate' && (args.length === 1 || args.length === 3)) {
      const angle = args[0] * Math.PI / 180;
      const rotation = { a: Math.cos(angle), b: Math.sin(angle), c: -Math.sin(angle), d: Math.cos(angle), e: 0, f: 0 };
      operation = args.length === 3
        ? multiplyTransforms(
            multiplyTransforms({ a: 1, b: 0, c: 0, d: 1, e: args[1], f: args[2] }, rotation),
            { a: 1, b: 0, c: 0, d: 1, e: -args[1], f: -args[2] },
          )
        : rotation;
    } else if ((name === 'skewx' || name === 'skewy') && args.length === 1) {
      const tangent = Math.tan(args[0] * Math.PI / 180);
      operation = name === 'skewx'
        ? { a: 1, b: 0, c: tangent, d: 1, e: 0, f: 0 }
        : { a: 1, b: tangent, c: 0, d: 1, e: 0, f: 0 };
    } else {
      throw new Error(`Unsupported local-layout SVG transform: ${match[0]}`);
    }
    result = multiplyTransforms(result, operation);
  }
  if (consumed.replace(/\s/g, '') !== value.replace(/\s/g, '')) {
    throw new Error(`Invalid local-layout SVG transform: ${value}`);
  }
  return result;
}

function transformPoint(transform: LocalLayoutTransform, x: number, y: number): { x: number; y: number } {
  return {
    x: transform.a * x + transform.c * y + transform.e,
    y: transform.b * x + transform.d * y + transform.f,
  };
}

function transformedVectorLength(transform: LocalLayoutTransform, x: number, y: number): number {
  return Math.hypot(transform.a * x + transform.c * y, transform.b * x + transform.d * y);
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

function flattenPath(data: string): { points: { x: number; y: number }[]; closed: boolean } {
  const tokens = pathTokens(data);
  const points: { x: number; y: number }[] = [];
  let index = 0;
  let command = '';
  let closed = false;
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
      case 'C': {
        const c1xValue = number();
        const c1yValue = number();
        const c2xValue = number();
        const c2yValue = number();
        const endXValue = number();
        const endYValue = number();
        const c1x = relative ? x + c1xValue : c1xValue;
        const c1y = relative ? y + c1yValue : c1yValue;
        const c2x = relative ? x + c2xValue : c2xValue;
        const c2y = relative ? y + c2yValue : c2yValue;
        const endX = relative ? x + endXValue : endXValue;
        const endY = relative ? y + endYValue : endYValue;
        const startCurveX = x;
        const startCurveY = y;
        for (let i = 1; i <= 24; i++) {
          const t = i / 24;
          const mt = 1 - t;
          points.push({
            x: mt ** 3 * startCurveX + 3 * mt * mt * t * c1x + 3 * mt * t * t * c2x + t ** 3 * endX,
            y: mt ** 3 * startCurveY + 3 * mt * mt * t * c1y + 3 * mt * t * t * c2y + t ** 3 * endY,
          });
        }
        x = endX;
        y = endY;
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
        closed = true;
        command = '';
        break;
      default:
        throw new Error(`Unsupported local-layout SVG path command: ${command}`);
    }
  }
  return { points, closed };
}

function berthNoseAngle(direction: string): number {
  if (direction === 'right') return 0;
  if (direction === 'up') return Math.PI / 2;
  if (direction === 'left') return Math.PI;
  return -Math.PI / 2;
}

interface BerthElement {
  id: string;
  element: Element;
  direction: string;
  transform: LocalLayoutTransform;
}

function pointsBounds(points: readonly { x: number; y: number }[]): { minX: number; minY: number; maxX: number; maxY: number } {
  return {
    minX: Math.min(...points.map(point => point.x)),
    minY: Math.min(...points.map(point => point.y)),
    maxX: Math.max(...points.map(point => point.x)),
    maxY: Math.max(...points.map(point => point.y)),
  };
}

function ellipsePolygon(
  cx: number, cy: number, radiusX: number, radiusY: number, transform: LocalLayoutTransform,
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i < 64; i++) {
    const angle = i / 64 * Math.PI * 2;
    points.push(transformPoint(transform, cx + Math.cos(angle) * radiusX, cy + Math.sin(angle) * radiusY));
  }
  return points;
}

function strokePolygons(
  points: readonly { x: number; y: number }[], strokeWidth: number, transform: LocalLayoutTransform,
): { x: number; y: number }[][] {
  if (strokeWidth <= 0 || points.length < 2) return [];
  const polygons: { x: number; y: number }[][] = [];
  const halfWidth = strokeWidth / 2;
  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i];
    const end = points[i + 1];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.hypot(dx, dy);
    if (length < 1e-9) continue;
    const nx = -dy / length * halfWidth;
    const ny = dx / length * halfWidth;
    polygons.push([
      transformPoint(transform, start.x + nx, start.y + ny),
      transformPoint(transform, end.x + nx, end.y + ny),
      transformPoint(transform, end.x - nx, end.y - ny),
      transformPoint(transform, start.x - nx, start.y - ny),
    ]);
  }
  return polygons;
}

function parseLocalLayout(asset: LocalLayoutAsset): LocalLayout {
  const document = new DOMParser().parseFromString(asset.svg, 'image/svg+xml');
  const parseError = document.querySelector('parsererror');
  if (parseError) throw new Error(`Invalid local-layout SVG ${asset.id}: ${parseError.textContent ?? 'parse error'}`);
  const shapes: LocalLayoutShape[] = [];
  const berthElements: BerthElement[] = [];
  const bounds: { minX: number; minY: number; maxX: number; maxY: number }[] = [];

  const visit = (element: Element, parentTransform: LocalLayoutTransform, inheritedPaint: LocalLayoutPaint): void => {
    if (element.localName === 'defs') return;
    const transform = multiplyTransforms(parentTransform, parseTransform(element.getAttribute('transform')));
    const paint = parsePaint(element, inheritedPaint);
    const id = element.getAttribute('id') ?? '';
    const berthMatch = /^berth-(.+)-nose-(left|right|up|down)$/.exec(id);
    if (berthMatch) {
      if (element.localName !== 'rect') throw new Error(`Local-layout berth ${id} must be a rectangle`);
      berthElements.push({ id, element, direction: berthMatch[2], transform });
      return;
    }

    if (element.localName === 'rect') {
      const x = finiteNumber(element.getAttribute('x') ?? '0', `${id} x`);
      const y = finiteNumber(element.getAttribute('y') ?? '0', `${id} y`);
      const width = finiteNumber(element.getAttribute('width'), `${id} width`);
      const height = finiteNumber(element.getAttribute('height'), `${id} height`);
      const collisionPolygon = [
        transformPoint(transform, x, y),
        transformPoint(transform, x + width, y),
        transformPoint(transform, x + width, y + height),
        transformPoint(transform, x, y + height),
      ];
      const shape: LocalLayoutRect = { kind: 'rect', id, paint, transform, collisionPolygon, x, y, width, height };
      shapes.push(shape);
      bounds.push(pointsBounds(collisionPolygon));
    } else if (element.localName === 'circle') {
      const cx = finiteNumber(element.getAttribute('cx') ?? '0', `${id} cx`);
      const cy = finiteNumber(element.getAttribute('cy') ?? '0', `${id} cy`);
      const radius = finiteNumber(element.getAttribute('r'), `${id} radius`);
      const collisionPolygon = ellipsePolygon(cx, cy, radius, radius, transform);
      const shape: LocalLayoutCircle = { kind: 'circle', id, paint, transform, collisionPolygon, cx, cy, radius };
      shapes.push(shape);
      bounds.push(pointsBounds(collisionPolygon));
    } else if (element.localName === 'ellipse') {
      const cx = finiteNumber(element.getAttribute('cx') ?? '0', `${id} cx`);
      const cy = finiteNumber(element.getAttribute('cy') ?? '0', `${id} cy`);
      const radiusX = finiteNumber(element.getAttribute('rx'), `${id} radius x`);
      const radiusY = finiteNumber(element.getAttribute('ry'), `${id} radius y`);
      const collisionPolygon = ellipsePolygon(cx, cy, radiusX, radiusY, transform);
      const shape: LocalLayoutEllipse = { kind: 'ellipse', id, paint, transform, collisionPolygon, cx, cy, radiusX, radiusY };
      shapes.push(shape);
      bounds.push(pointsBounds(collisionPolygon));
    } else if (element.localName === 'path') {
      const data = element.getAttribute('d') ?? '';
      const flattened = flattenPath(data);
      const transformedPoints = flattened.points.map(point => transformPoint(transform, point.x, point.y));
      const collisionPolygon = flattened.closed && transformedPoints.length >= 3 ? transformedPoints : undefined;
      const strokeCollisionPolygons = paint.stroke && paint.strokeOpacity > 0 && paint.opacity > 0
        ? strokePolygons(flattened.points, paint.strokeWidth, transform)
        : undefined;
      const shape: LocalLayoutPath = { kind: 'path', id, paint, transform, data, collisionPolygon, strokeCollisionPolygons };
      shapes.push(shape);
      if (transformedPoints.length) bounds.push(pointsBounds(transformedPoints));
      for (const polygon of strokeCollisionPolygons ?? []) bounds.push(pointsBounds(polygon));
    }

    for (const child of Array.from(element.children)) visit(child, transform, paint);
  };

  visit(document.documentElement, IDENTITY_TRANSFORM, DEFAULT_PAINT);
  if (!bounds.length) throw new Error(`Local layout ${asset.id} contains no renderable geometry`);
  if (!berthElements.length) throw new Error(`Local layout ${asset.id} contains no named berths`);
  const markerScales = berthElements.map(({ id, element, direction, transform }) => {
    const width = finiteNumber(element.getAttribute('width'), `${id} width`);
    const height = finiteNumber(element.getAttribute('height'), `${id} height`);
    const transformedWidth = transformedVectorLength(transform, width, 0);
    const transformedHeight = transformedVectorLength(transform, 0, height);
    const longScale = Math.max(transformedWidth, transformedHeight) / 14;
    const shortScale = Math.min(transformedWidth, transformedHeight) / 4;
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
  const berths: LocalLayoutBerth[] = berthElements.map(({ id, element, direction, transform }) => {
    const x = finiteNumber(element.getAttribute('x') ?? '0', `${id} x`);
    const y = finiteNumber(element.getAttribute('y') ?? '0', `${id} y`);
    const width = finiteNumber(element.getAttribute('width'), `${id} width`);
    const height = finiteNumber(element.getAttribute('height'), `${id} height`);
    const center = transformPoint(transform, x + width / 2, y + height / 2);
    return { id, svgCenterX: center.x, svgCenterY: center.y, noseAngle: berthNoseAngle(direction) };
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
