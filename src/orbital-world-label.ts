// Opt in as each bright globe is reviewed. Keep target/status colours, text,
// anchors and font metrics; only add an opaque dark halo behind the glyphs.
export function drawOrbitalWorldLabel(
  ctx: CanvasRenderingContext2D, bodyId: string, text: string, x: number, y: number,
): void {
  if (bodyId === 'estella-ii' || bodyId === 'estella-iv' || bodyId === 'estella-v') {
    ctx.save();
    ctx.strokeStyle = '#071019';
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.setLineDash([]);
    ctx.strokeText(text, x, y);
    ctx.restore();
  }
  ctx.fillText(text, x, y);
}
