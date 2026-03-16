import { useState } from "react";
import { type Tool } from "@/lib/ascii-engine";
import { Separator } from "@/components/ui/separator";

interface PropertiesPanelProps {
  activeTool: Tool;
  activeChar: string;
  activeFg: string;
  rectStyle: "ascii" | "unicode" | "double";
  zoom: number;
  showGrid: boolean;
  width: number;
  height: number;
  onSetActiveChar: (char: string) => void;
  onSetActiveFg: (fg: string) => void;
  onSetRectStyle: (style: "ascii" | "unicode" | "double") => void;
  onSetZoom: (zoom: number) => void;
  onToggleGrid: () => void;
  onResizeCanvas: (w: number, h: number) => void;
}

const CHAR_PALETTES = {
  "Box Drawing": ["─", "│", "┌", "┐", "└", "┘", "├", "┤", "┬", "┴", "┼", "═", "║", "╔", "╗", "╚", "╝", "╠", "╣", "╦", "╩", "╬"],
  "Blocks": ["█", "▓", "▒", "░", "▀", "▄", "▌", "▐", "■", "□", "▪", "▫"],
  "Symbols": ["●", "○", "◆", "◇", "★", "☆", "♠", "♣", "♥", "♦", "►", "◄", "▲", "▼", "←", "→", "↑", "↓", "↔", "↕"],
  "Basic": ["#", "@", "*", "+", "-", "|", "/", "\\", ".", ":", ";", "~", "^", "=", "_", "(", ")", "[", "]", "{", "}", "<", ">"],
};

const COLORS = [
  "#e2e8f0", "#94a3b8", "#64748b", "#475569",
  "#2dd4bf", "#14b8a6", "#0d9488", "#0f766e",
  "#60a5fa", "#3b82f6", "#2563eb", "#1d4ed8",
  "#a78bfa", "#8b5cf6", "#7c3aed", "#6d28d9",
  "#fb923c", "#f97316", "#ea580c", "#c2410c",
  "#f87171", "#ef4444", "#dc2626", "#b91c1c",
  "#fbbf24", "#f59e0b", "#d97706", "#b45309",
  "#4ade80", "#22c55e", "#16a34a", "#15803d",
];

export default function PropertiesPanel({
  activeTool,
  activeChar,
  activeFg,
  rectStyle,
  zoom,
  showGrid,
  width,
  height,
  onSetActiveChar,
  onSetActiveFg,
  onSetRectStyle,
  onSetZoom,
  onToggleGrid,
  onResizeCanvas,
}: PropertiesPanelProps) {
  const [newWidth, setNewWidth] = useState(width.toString());
  const [newHeight, setNewHeight] = useState(height.toString());

  return (
    <div
      className="bg-card"
      data-testid="properties-panel"
    >
      {/* Character */}
      <div className="p-3">
        <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
          Character
        </h3>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-10 h-10 bg-muted rounded-md flex items-center justify-center font-mono text-lg text-primary border border-border">
            {activeChar}
          </div>
          <input
            type="text"
            maxLength={1}
            value={activeChar}
            onChange={(e) => {
              if (e.target.value.length > 0) {
                onSetActiveChar(e.target.value[e.target.value.length - 1]);
              }
            }}
            className="w-full h-8 bg-muted border border-border rounded-md px-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            data-testid="input-char"
          />
        </div>

        {Object.entries(CHAR_PALETTES).map(([group, chars]) => (
          <div key={group} className="mb-2">
            <span className="text-[10px] text-muted-foreground">{group}</span>
            <div className="flex flex-wrap gap-0.5 mt-1">
              {chars.map((ch) => (
                <button
                  key={ch}
                  className={`w-6 h-6 flex items-center justify-center rounded text-xs font-mono transition-colors ${
                    activeChar === ch
                      ? "bg-primary/20 text-primary ring-1 ring-primary"
                      : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  }`}
                  onClick={() => onSetActiveChar(ch)}
                  data-testid={`char-${ch}`}
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Separator />

      {/* Color */}
      <div className="p-3">
        <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
          Color
        </h3>
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-8 h-8 rounded-md border border-border"
            style={{ backgroundColor: activeFg }}
          />
          <input
            type="text"
            value={activeFg}
            onChange={(e) => onSetActiveFg(e.target.value)}
            className="w-full h-7 bg-muted border border-border rounded-md px-2 text-[11px] font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            data-testid="input-color"
          />
        </div>
        <div className="grid grid-cols-8 gap-0.5">
          {COLORS.map((color) => (
            <button
              key={color}
              className={`w-5 h-5 rounded-sm border transition-all ${
                activeFg === color
                  ? "border-primary ring-1 ring-primary scale-110"
                  : "border-transparent hover:border-muted-foreground/30"
              }`}
              style={{ backgroundColor: color }}
              onClick={() => onSetActiveFg(color)}
              data-testid={`color-${color}`}
            />
          ))}
        </div>
      </div>

      <Separator />

      {/* Tool Options */}
      {activeTool === "rect" && (
        <div className="p-3">
          <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Rectangle Style
          </h3>
          <div className="flex gap-1">
            {(["ascii", "unicode", "double"] as const).map((style) => (
              <button
                key={style}
                className={`flex-1 h-7 rounded-md text-[11px] font-mono transition-colors ${
                  rectStyle === style
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => onSetRectStyle(style)}
                data-testid={`rect-style-${style}`}
              >
                {style === "ascii" ? "+--+" : style === "unicode" ? "┌──┐" : "╔══╗"}
              </button>
            ))}
          </div>
          <Separator className="mt-3" />
        </div>
      )}

      {/* Canvas Settings */}
      <div className="p-3">
        <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
          Canvas
        </h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="text-[11px] text-muted-foreground w-7">W</label>
            <input
              type="number"
              value={newWidth}
              onChange={(e) => setNewWidth(e.target.value)}
              onBlur={() => {
                const w = parseInt(newWidth);
                if (w > 0 && w <= 200) onResizeCanvas(w, height);
              }}
              className="w-full h-7 bg-muted border border-border rounded-md px-2 text-[11px] font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              data-testid="input-width"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[11px] text-muted-foreground w-7">H</label>
            <input
              type="number"
              value={newHeight}
              onChange={(e) => setNewHeight(e.target.value)}
              onBlur={() => {
                const h = parseInt(newHeight);
                if (h > 0 && h <= 200) onResizeCanvas(width, h);
              }}
              className="w-full h-7 bg-muted border border-border rounded-md px-2 text-[11px] font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              data-testid="input-height"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* View */}
      <div className="p-3">
        <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
          View
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">Zoom</span>
            <span className="text-[11px] font-mono text-foreground">{Math.round(zoom * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="3"
            step="0.1"
            value={zoom}
            onChange={(e) => onSetZoom(parseFloat(e.target.value))}
            className="w-full h-1 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
            data-testid="zoom-slider"
          />
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showGrid}
              onChange={onToggleGrid}
              className="w-3 h-3 accent-primary"
              data-testid="toggle-grid"
            />
            <span className="text-[11px] text-muted-foreground">Show grid</span>
          </label>
        </div>
      </div>
    </div>
  );
}
