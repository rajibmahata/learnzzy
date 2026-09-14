// Deterministic tracing evaluation (BR-071/072). Dependency-free so tests
// import the real code. No AI vision in the MVP loop.
export interface TracePoint {
  x: number;
  y: number;
}

export interface TraceResult {
  coverage: number;
  drawnPoints: number;
  completed: boolean;
}

function downsample<T>(arr: T[], max: number): T[] {
  if (arr.length <= max) return arr;
  const step = arr.length / max;
  const out: T[] = [];
  for (let i = 0; i < max; i++) out.push(arr[Math.floor(i * step)]);
  return out;
}

export function evaluateTracing(
  guide: TracePoint[],
  strokes: TracePoint[][],
  opts: { tolerance: number; coverageThreshold?: number; minDrawnPoints?: number }
): TraceResult {
  const drawn = downsample(strokes.flat(), 600);
  if (guide.length === 0 || drawn.length < (opts.minDrawnPoints ?? 10)) {
    return { coverage: 0, drawnPoints: drawn.length, completed: false };
  }
  const tol2 = opts.tolerance * opts.tolerance;
  let hit = 0;
  for (const g of guide) {
    for (const d of drawn) {
      const dx = g.x - d.x;
      const dy = g.y - d.y;
      if (dx * dx + dy * dy <= tol2) {
        hit++;
        break;
      }
    }
  }
  const coverage = hit / guide.length;
  return { coverage, drawnPoints: drawn.length, completed: coverage >= (opts.coverageThreshold ?? 0.6) };
}
