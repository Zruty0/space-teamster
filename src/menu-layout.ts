// Canvas menu text is wrapped, never abbreviated. Also split long unbroken names.
export function wrapMenuText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const width = Math.max(1, maxWidth);
  const lines: string[] = [];
  for (const paragraph of text.split('\n')) {
    let line = '';
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      if (line && ctx.measureText(`${line} ${word}`).width <= width) {
        line += ` ${word}`;
        continue;
      }
      if (line) lines.push(line);
      line = '';
      for (const char of word) {
        if (line && ctx.measureText(line + char).width > width) {
          lines.push(line);
          line = '';
        }
        line += char;
      }
    }
    lines.push(line);
  }
  return lines.length ? lines : [''];
}

// Keep the selected variable-height row fully visible, then add nearby rows.
export function visibleMenuRange(heights: readonly number[], selectedIndex: number, availableHeight: number): { start: number; end: number } {
  if (!heights.length) return { start: 0, end: 0 };
  const selected = Math.max(0, Math.min(heights.length - 1, selectedIndex));
  let start = selected, end = selected + 1, used = heights[selected];
  while (start > 0 && used + heights[start - 1] <= availableHeight / 2 + heights[selected] / 2) used += heights[--start];
  while (end < heights.length && used + heights[end] <= availableHeight) used += heights[end++];
  while (start > 0 && used + heights[start - 1] <= availableHeight) used += heights[--start];
  return { start, end };
}
