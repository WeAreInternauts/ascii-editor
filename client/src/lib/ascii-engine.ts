// ASCII Art Engine — Core data structures and algorithms

export interface Cell {
  char: string;
  fg?: string;
  bg?: string;
}

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  cells: Cell[][];
}

export interface Point {
  x: number;
  y: number;
}

export type Tool =
  | "select"
  | "pencil"
  | "line"
  | "rect"
  | "ellipse"
  | "text"
  | "eraser"
  | "fill"
  | "eyedropper";

export function createEmptyGrid(w: number, h: number): Cell[][] {
  return Array.from({ length: h }, () =>
    Array.from({ length: w }, () => ({ char: " " }))
  );
}

export function createLayer(
  id: string,
  name: string,
  w: number,
  h: number
): Layer {
  return {
    id,
    name,
    visible: true,
    locked: false,
    opacity: 1,
    cells: createEmptyGrid(w, h),
  };
}

export function cloneGrid(grid: Cell[][]): Cell[][] {
  return grid.map((row) => row.map((cell) => ({ ...cell })));
}

export function cloneLayer(layer: Layer): Layer {
  return {
    ...layer,
    cells: cloneGrid(layer.cells),
  };
}

// Bresenham's line algorithm
export function getLinePoints(p0: Point, p1: Point): Point[] {
  const points: Point[] = [];
  let { x: x0, y: y0 } = p0;
  const { x: x1, y: y1 } = p1;
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  while (true) {
    points.push({ x: x0, y: y0 });
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x0 += sx;
    }
    if (e2 < dx) {
      err += dx;
      y0 += sy;
    }
  }
  return points;
}

// Get rectangle outline points
export function getRectPoints(p0: Point, p1: Point): Point[] {
  const points: Point[] = [];
  const minX = Math.min(p0.x, p1.x);
  const maxX = Math.max(p0.x, p1.x);
  const minY = Math.min(p0.y, p1.y);
  const maxY = Math.max(p0.y, p1.y);

  for (let x = minX; x <= maxX; x++) {
    points.push({ x, y: minY });
    points.push({ x, y: maxY });
  }
  for (let y = minY + 1; y < maxY; y++) {
    points.push({ x: minX, y });
    points.push({ x: maxX, y });
  }
  return points;
}

// ASCII box drawing characters
export function getRectChars(
  p0: Point,
  p1: Point,
  style: "ascii" | "unicode" | "double"
): { point: Point; char: string }[] {
  const result: { point: Point; char: string }[] = [];
  const minX = Math.min(p0.x, p1.x);
  const maxX = Math.max(p0.x, p1.x);
  const minY = Math.min(p0.y, p1.y);
  const maxY = Math.max(p0.y, p1.y);

  const chars =
    style === "unicode"
      ? { tl: "┌", tr: "┐", bl: "└", br: "┘", h: "─", v: "│" }
      : style === "double"
        ? { tl: "╔", tr: "╗", bl: "╚", br: "╝", h: "═", v: "║" }
        : { tl: "+", tr: "+", bl: "+", bl2: "+", br: "+", h: "-", v: "|" };

  // Corners
  result.push({ point: { x: minX, y: minY }, char: chars.tl });
  result.push({ point: { x: maxX, y: minY }, char: chars.tr });
  result.push({ point: { x: minX, y: maxY }, char: chars.bl });
  result.push({ point: { x: maxX, y: maxY }, char: chars.br });

  // Horizontal edges
  for (let x = minX + 1; x < maxX; x++) {
    result.push({ point: { x, y: minY }, char: chars.h });
    result.push({ point: { x, y: maxY }, char: chars.h });
  }

  // Vertical edges
  for (let y = minY + 1; y < maxY; y++) {
    result.push({ point: { x: minX, y }, char: chars.v });
    result.push({ point: { x: maxX, y }, char: chars.v });
  }

  return result;
}

// Midpoint ellipse algorithm
export function getEllipsePoints(p0: Point, p1: Point): Point[] {
  const points: Point[] = [];
  const cx = Math.round((p0.x + p1.x) / 2);
  const cy = Math.round((p0.y + p1.y) / 2);
  const rx = Math.abs(p1.x - p0.x) / 2;
  const ry = Math.abs(p1.y - p0.y) / 2;

  if (rx < 1 || ry < 1) {
    points.push({ x: cx, y: cy });
    return points;
  }

  // Use parametric approach for better ASCII representation
  const steps = Math.max(Math.round(Math.PI * (rx + ry)), 40);
  const seen = new Set<string>();

  for (let i = 0; i < steps; i++) {
    const angle = (2 * Math.PI * i) / steps;
    const x = Math.round(cx + rx * Math.cos(angle));
    const y = Math.round(cy + ry * Math.sin(angle));
    const key = `${x},${y}`;
    if (!seen.has(key)) {
      seen.add(key);
      points.push({ x, y });
    }
  }

  return points;
}

// Flood fill algorithm
export function floodFill(
  grid: Cell[][],
  start: Point,
  fillChar: string,
  fillFg?: string
): Point[] {
  const h = grid.length;
  const w = grid[0]?.length ?? 0;
  if (start.y < 0 || start.y >= h || start.x < 0 || start.x >= w)
    return [];

  const targetChar = grid[start.y][start.x].char;
  const targetFg = grid[start.y][start.x].fg;
  if (targetChar === fillChar && targetFg === fillFg) return [];

  const filled: Point[] = [];
  const visited = new Set<string>();
  const stack: Point[] = [start];

  while (stack.length > 0) {
    const p = stack.pop()!;
    const key = `${p.x},${p.y}`;
    if (visited.has(key)) continue;
    if (p.y < 0 || p.y >= h || p.x < 0 || p.x >= w) continue;
    if (grid[p.y][p.x].char !== targetChar || grid[p.y][p.x].fg !== targetFg)
      continue;

    visited.add(key);
    filled.push(p);

    stack.push({ x: p.x + 1, y: p.y });
    stack.push({ x: p.x - 1, y: p.y });
    stack.push({ x: p.x, y: p.y + 1 });
    stack.push({ x: p.x, y: p.y - 1 });
  }

  return filled;
}

// Export to plain text
export function exportToText(layers: Layer[], w: number, h: number): string {
  const result: string[][] = Array.from({ length: h }, () =>
    Array.from({ length: w }, () => " ")
  );

  for (const layer of layers) {
    if (!layer.visible) continue;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const cell = layer.cells[y]?.[x];
        if (cell && cell.char !== " ") {
          result[y][x] = cell.char;
        }
      }
    }
  }

  return result.map((row) => row.join("")).join("\n");
}

// Flatten visible layers into a single view grid
export function flattenLayers(
  layers: Layer[],
  w: number,
  h: number
): Cell[][] {
  const result = createEmptyGrid(w, h);

  for (const layer of layers) {
    if (!layer.visible) continue;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const cell = layer.cells[y]?.[x];
        if (cell && cell.char !== " ") {
          result[y][x] = { ...cell };
        }
      }
    }
  }

  return result;
}
