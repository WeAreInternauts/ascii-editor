import { useState, useCallback, useRef } from "react";
import {
  type Layer,
  type Tool,
  type Point,
  type Cell,
  createLayer,
  cloneLayer,
  cloneGrid,
  getLinePoints,
  getRectChars,
  getEllipsePoints,
  floodFill,
} from "@/lib/ascii-engine";

interface EditorState {
  width: number;
  height: number;
  layers: Layer[];
  activeLayerId: string;
  activeTool: Tool;
  activeChar: string;
  activeFg: string;
  rectStyle: "ascii" | "unicode" | "double";
  zoom: number;
  showGrid: boolean;
}

interface HistoryEntry {
  layers: Layer[];
  activeLayerId: string;
}

const DEFAULT_WIDTH = 80;
const DEFAULT_HEIGHT = 40;

function createInitialState(): EditorState {
  const layer = createLayer("layer-1", "Layer 1", DEFAULT_WIDTH, DEFAULT_HEIGHT);
  return {
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    layers: [layer],
    activeLayerId: layer.id,
    activeTool: "pencil",
    activeChar: "#",
    activeFg: "#e2e8f0",
    rectStyle: "unicode",
    zoom: 1,
    showGrid: true,
  };
}

export function useEditorState() {
  const [state, setState] = useState<EditorState>(createInitialState);
  const historyRef = useRef<HistoryEntry[]>([]);
  const futureRef = useRef<HistoryEntry[]>([]);
  const drawStartRef = useRef<Point | null>(null);
  const previewRef = useRef<{ point: Point; char: string; fg?: string }[]>([]);
  const [preview, setPreview] = useState<
    { point: Point; char: string; fg?: string }[]
  >([]);

  const pushHistory = useCallback(() => {
    setState((s) => {
      historyRef.current.push({
        layers: s.layers.map(cloneLayer),
        activeLayerId: s.activeLayerId,
      });
      if (historyRef.current.length > 100) {
        historyRef.current.shift();
      }
      futureRef.current = [];
      return s;
    });
  }, []);

  const undo = useCallback(() => {
    setState((s) => {
      if (historyRef.current.length === 0) return s;
      futureRef.current.push({
        layers: s.layers.map(cloneLayer),
        activeLayerId: s.activeLayerId,
      });
      const prev = historyRef.current.pop()!;
      return { ...s, layers: prev.layers, activeLayerId: prev.activeLayerId };
    });
  }, []);

  const redo = useCallback(() => {
    setState((s) => {
      if (futureRef.current.length === 0) return s;
      historyRef.current.push({
        layers: s.layers.map(cloneLayer),
        activeLayerId: s.activeLayerId,
      });
      const next = futureRef.current.pop()!;
      return { ...s, layers: next.layers, activeLayerId: next.activeLayerId };
    });
  }, []);

  const getActiveLayer = useCallback((): Layer | undefined => {
    return state.layers.find((l) => l.id === state.activeLayerId);
  }, [state.layers, state.activeLayerId]);

  const setCell = useCallback(
    (x: number, y: number, char: string, fg?: string) => {
      setState((s) => {
        const newLayers = s.layers.map((l) => {
          if (l.id !== s.activeLayerId || l.locked) return l;
          const newCells = cloneGrid(l.cells);
          if (y >= 0 && y < s.height && x >= 0 && x < s.width) {
            newCells[y][x] = { char, fg };
          }
          return { ...l, cells: newCells };
        });
        return { ...s, layers: newLayers };
      });
    },
    []
  );

  const setCells = useCallback(
    (changes: { x: number; y: number; char: string; fg?: string }[]) => {
      setState((s) => {
        const newLayers = s.layers.map((l) => {
          if (l.id !== s.activeLayerId || l.locked) return l;
          const newCells = cloneGrid(l.cells);
          for (const c of changes) {
            if (c.y >= 0 && c.y < s.height && c.x >= 0 && c.x < s.width) {
              newCells[c.y][c.x] = { char: c.char, fg: c.fg };
            }
          }
          return { ...l, cells: newCells };
        });
        return { ...s, layers: newLayers };
      });
    },
    []
  );

  const handleMouseDown = useCallback(
    (x: number, y: number) => {
      const layer = state.layers.find((l) => l.id === state.activeLayerId);
      if (!layer || layer.locked) return;

      if (
        state.activeTool === "pencil" ||
        state.activeTool === "eraser"
      ) {
        pushHistory();
        const char = state.activeTool === "eraser" ? " " : state.activeChar;
        const fg =
          state.activeTool === "eraser" ? undefined : state.activeFg;
        setCell(x, y, char, fg);
      } else if (state.activeTool === "fill") {
        pushHistory();
        const pts = floodFill(
          layer.cells,
          { x, y },
          state.activeChar,
          state.activeFg
        );
        setCells(
          pts.map((p) => ({
            x: p.x,
            y: p.y,
            char: state.activeChar,
            fg: state.activeFg,
          }))
        );
      } else if (state.activeTool === "eyedropper") {
        const cell = layer.cells[y]?.[x];
        if (cell && cell.char !== " ") {
          setState((s) => ({
            ...s,
            activeChar: cell.char,
            activeFg: cell.fg || s.activeFg,
          }));
        }
      } else if (
        state.activeTool === "line" ||
        state.activeTool === "rect" ||
        state.activeTool === "ellipse"
      ) {
        pushHistory();
        drawStartRef.current = { x, y };
      } else if (state.activeTool === "text") {
        pushHistory();
        drawStartRef.current = { x, y };
      }
    },
    [state, pushHistory, setCell, setCells]
  );

  const handleMouseMove = useCallback(
    (x: number, y: number) => {
      if (!drawStartRef.current) {
        if (
          state.activeTool === "pencil" ||
          state.activeTool === "eraser"
        ) {
          return;
        }
        return;
      }

      const start = drawStartRef.current;

      if (state.activeTool === "pencil" || state.activeTool === "eraser") {
        const char = state.activeTool === "eraser" ? " " : state.activeChar;
        const fg = state.activeTool === "eraser" ? undefined : state.activeFg;
        setCell(x, y, char, fg);
        return;
      }

      if (state.activeTool === "line") {
        const pts = getLinePoints(start, { x, y });
        const lineChar = getLineChar(start, { x, y });
        previewRef.current = pts.map((p) => ({
          point: p,
          char: lineChar,
          fg: state.activeFg,
        }));
        setPreview([...previewRef.current]);
      } else if (state.activeTool === "rect") {
        const chars = getRectChars(start, { x, y }, state.rectStyle);
        previewRef.current = chars.map((c) => ({
          point: c.point,
          char: c.char,
          fg: state.activeFg,
        }));
        setPreview([...previewRef.current]);
      } else if (state.activeTool === "ellipse") {
        const pts = getEllipsePoints(start, { x, y });
        previewRef.current = pts.map((p) => ({
          point: p,
          char: state.activeChar,
          fg: state.activeFg,
        }));
        setPreview([...previewRef.current]);
      }
    },
    [state.activeTool, state.activeChar, state.activeFg, state.rectStyle, setCell]
  );

  const handleMouseDrag = useCallback(
    (x: number, y: number) => {
      if (state.activeTool === "pencil" || state.activeTool === "eraser") {
        const char = state.activeTool === "eraser" ? " " : state.activeChar;
        const fg = state.activeTool === "eraser" ? undefined : state.activeFg;
        setCell(x, y, char, fg);
      } else {
        handleMouseMove(x, y);
      }
    },
    [state.activeTool, state.activeChar, state.activeFg, setCell, handleMouseMove]
  );

  const handleMouseUp = useCallback(() => {
    if (previewRef.current.length > 0) {
      setCells(
        previewRef.current.map((p) => ({
          x: p.point.x,
          y: p.point.y,
          char: p.char,
          fg: p.fg,
        }))
      );
      previewRef.current = [];
      setPreview([]);
    }
    drawStartRef.current = null;
  }, [setCells]);

  const addLayer = useCallback(() => {
    setState((s) => {
      pushHistory();
      const id = `layer-${Date.now()}`;
      const newLayer = createLayer(
        id,
        `Layer ${s.layers.length + 1}`,
        s.width,
        s.height
      );
      return {
        ...s,
        layers: [...s.layers, newLayer],
        activeLayerId: id,
      };
    });
  }, [pushHistory]);

  const deleteLayer = useCallback(
    (id: string) => {
      setState((s) => {
        if (s.layers.length <= 1) return s;
        pushHistory();
        const newLayers = s.layers.filter((l) => l.id !== id);
        const newActive =
          s.activeLayerId === id ? newLayers[0].id : s.activeLayerId;
        return { ...s, layers: newLayers, activeLayerId: newActive };
      });
    },
    [pushHistory]
  );

  const toggleLayerVisibility = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      layers: s.layers.map((l) =>
        l.id === id ? { ...l, visible: !l.visible } : l
      ),
    }));
  }, []);

  const toggleLayerLock = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      layers: s.layers.map((l) =>
        l.id === id ? { ...l, locked: !l.locked } : l
      ),
    }));
  }, []);

  const renameLayer = useCallback((id: string, name: string) => {
    setState((s) => ({
      ...s,
      layers: s.layers.map((l) => (l.id === id ? { ...l, name } : l)),
    }));
  }, []);

  const reorderLayers = useCallback((fromIdx: number, toIdx: number) => {
    setState((s) => {
      const newLayers = [...s.layers];
      const [moved] = newLayers.splice(fromIdx, 1);
      newLayers.splice(toIdx, 0, moved);
      return { ...s, layers: newLayers };
    });
  }, []);

  const setTool = useCallback((tool: Tool) => {
    setState((s) => ({ ...s, activeTool: tool }));
  }, []);

  const setActiveChar = useCallback((char: string) => {
    setState((s) => ({ ...s, activeChar: char }));
  }, []);

  const setActiveFg = useCallback((fg: string) => {
    setState((s) => ({ ...s, activeFg: fg }));
  }, []);

  const setRectStyle = useCallback(
    (style: "ascii" | "unicode" | "double") => {
      setState((s) => ({ ...s, rectStyle: style }));
    },
    []
  );

  const setActiveLayerId = useCallback((id: string) => {
    setState((s) => ({ ...s, activeLayerId: id }));
  }, []);

  const setZoom = useCallback((zoom: number) => {
    setState((s) => ({ ...s, zoom: Math.max(0.5, Math.min(3, zoom)) }));
  }, []);

  const toggleGrid = useCallback(() => {
    setState((s) => ({ ...s, showGrid: !s.showGrid }));
  }, []);

  const clearCanvas = useCallback(() => {
    pushHistory();
    setState((s) => ({
      ...s,
      layers: s.layers.map((l) =>
        l.id === s.activeLayerId
          ? { ...l, cells: createLayer("", "", s.width, s.height).cells }
          : l
      ),
    }));
  }, [pushHistory]);

  const resizeCanvas = useCallback(
    (newWidth: number, newHeight: number) => {
      pushHistory();
      setState((s) => {
        const newLayers = s.layers.map((l) => {
          const newCells: Cell[][] = Array.from({ length: newHeight }, (_, y) =>
            Array.from({ length: newWidth }, (_, x) => {
              if (y < s.height && x < s.width) {
                return { ...l.cells[y][x] };
              }
              return { char: " " };
            })
          );
          return { ...l, cells: newCells };
        });
        return { ...s, width: newWidth, height: newHeight, layers: newLayers };
      });
    },
    [pushHistory]
  );

  const handleTextInput = useCallback(
    (text: string) => {
      if (!drawStartRef.current) return;
      const start = drawStartRef.current;
      const changes = text.split("").map((ch, i) => ({
        x: start.x + i,
        y: start.y,
        char: ch,
        fg: state.activeFg,
      }));
      setCells(changes);
      drawStartRef.current = {
        x: start.x + text.length,
        y: start.y,
      };
    },
    [state.activeFg, setCells]
  );

  return {
    ...state,
    preview,
    undo,
    redo,
    canUndo: historyRef.current.length > 0,
    canRedo: futureRef.current.length > 0,
    getActiveLayer,
    handleMouseDown,
    handleMouseDrag,
    handleMouseUp,
    handleMouseMove,
    handleTextInput,
    addLayer,
    deleteLayer,
    toggleLayerVisibility,
    toggleLayerLock,
    renameLayer,
    reorderLayers,
    setTool,
    setActiveChar,
    setActiveFg,
    setRectStyle,
    setActiveLayerId,
    setZoom,
    toggleGrid,
    clearCanvas,
    resizeCanvas,
  };
}

function getLineChar(start: Point, end: Point): string {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (Math.abs(dx) > Math.abs(dy) * 2) return "─";
  if (Math.abs(dy) > Math.abs(dx) * 2) return "│";
  if ((dx > 0 && dy > 0) || (dx < 0 && dy < 0)) return "╲";
  return "╱";
}
