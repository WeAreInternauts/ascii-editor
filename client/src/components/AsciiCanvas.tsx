import { useRef, useCallback, useEffect, useState, useMemo } from "react";
import { flattenLayers, type Layer, type Cell, type Point } from "@/lib/ascii-engine";

interface AsciiCanvasProps {
  width: number;
  height: number;
  layers: Layer[];
  preview: { point: Point; char: string; fg?: string }[];
  zoom: number;
  showGrid: boolean;
  activeTool: string;
  onMouseDown: (x: number, y: number) => void;
  onMouseDrag: (x: number, y: number) => void;
  onMouseUp: () => void;
  onMouseMove: (x: number, y: number) => void;
}

const CELL_W = 9.6;
const CELL_H = 18;

export default function AsciiCanvas({
  width,
  height,
  layers,
  preview,
  zoom,
  showGrid,
  activeTool,
  onMouseDown,
  onMouseDrag,
  onMouseUp,
  onMouseMove,
}: AsciiCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const [hoverPos, setHoverPos] = useState<Point | null>(null);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });

  const cellW = CELL_W * zoom;
  const cellH = CELL_H * zoom;
  const canvasWidth = width * cellW;
  const canvasHeight = height * cellH;

  const flattened = useMemo(
    () => flattenLayers(layers, width, height),
    [layers, width, height]
  );

  const getGridPos = useCallback(
    (e: React.MouseEvent): Point | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const x = Math.floor((e.clientX - rect.left) / cellW);
      const y = Math.floor((e.clientY - rect.top) / cellH);
      if (x < 0 || x >= width || y < 0 || y >= height) return null;
      return { x, y };
    },
    [cellW, cellH, width, height]
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    ctx.scale(dpr, dpr);

    // Background
    ctx.fillStyle = "#0f1219";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Grid
    if (showGrid) {
      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.lineWidth = 0.5;
      for (let x = 0; x <= width; x++) {
        ctx.beginPath();
        ctx.moveTo(x * cellW, 0);
        ctx.lineTo(x * cellW, canvasHeight);
        ctx.stroke();
      }
      for (let y = 0; y <= height; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * cellH);
        ctx.lineTo(canvasWidth, y * cellH);
        ctx.stroke();
      }
    }

    // Draw cells
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    const fontSize = Math.max(10, 14 * zoom);
    ctx.font = `${fontSize}px 'JetBrains Mono', monospace`;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const cell = flattened[y]?.[x];
        if (!cell || cell.char === " ") continue;

        if (cell.bg) {
          ctx.fillStyle = cell.bg;
          ctx.fillRect(x * cellW, y * cellH, cellW, cellH);
        }

        ctx.fillStyle = cell.fg || "#e2e8f0";
        ctx.fillText(
          cell.char,
          x * cellW + cellW / 2,
          y * cellH + cellH / 2 + 1
        );
      }
    }

    // Draw preview
    if (preview.length > 0) {
      for (const p of preview) {
        const px = p.point.x;
        const py = p.point.y;
        if (px < 0 || px >= width || py < 0 || py >= height) continue;

        ctx.fillStyle = "rgba(45, 212, 191, 0.12)";
        ctx.fillRect(px * cellW, py * cellH, cellW, cellH);
        ctx.fillStyle = p.fg || "#2dd4bf";
        ctx.fillText(
          p.char,
          px * cellW + cellW / 2,
          py * cellH + cellH / 2 + 1
        );
      }
    }

    // Hover highlight
    if (hoverPos) {
      ctx.fillStyle = "rgba(45, 212, 191, 0.08)";
      ctx.fillRect(hoverPos.x * cellW, hoverPos.y * cellH, cellW, cellH);
      ctx.strokeStyle = "rgba(45, 212, 191, 0.3)";
      ctx.lineWidth = 1;
      ctx.strokeRect(
        hoverPos.x * cellW + 0.5,
        hoverPos.y * cellH + 0.5,
        cellW - 1,
        cellH - 1
      );
    }
  }, [
    canvasWidth,
    canvasHeight,
    width,
    height,
    cellW,
    cellH,
    zoom,
    showGrid,
    flattened,
    preview,
    hoverPos,
  ]);

  useEffect(() => {
    draw();
  }, [draw]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 1 || (e.button === 0 && e.altKey)) {
        isPanning.current = true;
        panStart.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
        return;
      }
      const pos = getGridPos(e);
      if (!pos) return;
      isDragging.current = true;
      onMouseDown(pos.x, pos.y);
    },
    [getGridPos, onMouseDown, panOffset]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning.current) {
        setPanOffset({
          x: e.clientX - panStart.current.x,
          y: e.clientY - panStart.current.y,
        });
        return;
      }
      const pos = getGridPos(e);
      if (!pos) {
        setHoverPos(null);
        return;
      }
      setHoverPos(pos);
      if (isDragging.current) {
        onMouseDrag(pos.x, pos.y);
      } else {
        onMouseMove(pos.x, pos.y);
      }
    },
    [getGridPos, onMouseDrag, onMouseMove]
  );

  const handleMouseUp = useCallback(() => {
    if (isPanning.current) {
      isPanning.current = false;
      return;
    }
    isDragging.current = false;
    onMouseUp();
  }, [onMouseUp]);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    },
    []
  );

  const getCursorStyle = () => {
    switch (activeTool) {
      case "pencil":
        return "crosshair";
      case "eraser":
        return "crosshair";
      case "fill":
        return "crosshair";
      case "eyedropper":
        return "crosshair";
      case "text":
        return "text";
      case "line":
      case "rect":
      case "ellipse":
        return "crosshair";
      default:
        return "default";
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-auto bg-[#080a0f] flex items-center justify-center"
      onWheel={handleWheel}
    >
      <div
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
          padding: "40px",
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            cursor: getCursorStyle(),
            imageRendering: "pixelated",
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            isDragging.current = false;
            isPanning.current = false;
            setHoverPos(null);
            onMouseUp();
          }}
          data-testid="ascii-canvas"
        />
      </div>
    </div>
  );
}
