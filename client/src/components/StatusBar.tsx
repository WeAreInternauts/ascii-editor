import { type Tool } from "@/lib/ascii-engine";

interface StatusBarProps {
  activeTool: Tool;
  activeChar: string;
  width: number;
  height: number;
}

const TOOL_HINTS: Record<Tool, string> = {
  select: "Click to select",
  pencil: "Click and drag to draw",
  line: "Click and drag to draw a line",
  rect: "Click and drag to draw a rectangle",
  ellipse: "Click and drag to draw an ellipse",
  text: "Click to place cursor, then type",
  eraser: "Click and drag to erase",
  fill: "Click to flood fill area",
  eyedropper: "Click to pick character and color",
};

export default function StatusBar({
  activeTool,
  activeChar,
  width,
  height,
}: StatusBarProps) {
  return (
    <div
      className="h-6 bg-card border-t border-border flex items-center px-3 text-[10px] font-mono text-muted-foreground flex-shrink-0"
      data-testid="status-bar"
    >
      <span className="text-primary/80">{TOOL_HINTS[activeTool]}</span>
      <div className="flex-1" />
      <span>
        char: <span className="text-foreground">{activeChar === " " ? "space" : activeChar}</span>
      </span>
      <span className="mx-3 text-border">|</span>
      <span>
        canvas: <span className="text-foreground">{width}×{height}</span>
      </span>
    </div>
  );
}
