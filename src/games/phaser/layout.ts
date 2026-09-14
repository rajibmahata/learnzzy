// Pure, testable layout helper for Phaser stages (LZ-040/043).
// Computes centered grid positions for N items inside a rectangular zone.
// Deterministic: same inputs always produce the same outputs.
export interface Zone {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PlacedPoint {
  x: number;
  y: number;
  /** Suggested emoji font size so items fit their cells. */
  size: number;
}

export function gridPositions(
  count: number,
  zone: Zone,
  maxSize = 46,
  minSize = 26,
  gapPad = 8
): PlacedPoint[] {
  if (!Number.isInteger(count) || count <= 0) return [];
  if (zone.w <= 0 || zone.h <= 0) return [];
  const cols = Math.max(1, Math.ceil(Math.sqrt((count * zone.w) / zone.h)));
  const rows = Math.max(1, Math.ceil(count / cols));
  const cellW = zone.w / cols;
  const cellH = zone.h / rows;
  const size = Math.max(minSize, Math.min(maxSize, Math.floor(Math.min(cellW, cellH) - gapPad)));
  const points: PlacedPoint[] = [];
  for (let i = 0; i < count; i++) {
    const c = i % cols;
    const r = Math.floor(i / cols);
    points.push({
      x: Math.round(zone.x + (c + 0.5) * cellW),
      y: Math.round(zone.y + (r + 0.5) * cellH),
      size,
    });
  }
  return points;
}
