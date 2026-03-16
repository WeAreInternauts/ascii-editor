import { type Tool } from "@/lib/ascii-engine";
import {
  MousePointer2,
  Pencil,
  Minus,
  Square,
  Circle,
  Type,
  Eraser,
  PaintBucket,
  Pipette,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ToolbarProps {
  activeTool: Tool;
  onSetTool: (tool: Tool) => void;
}

const tools: { tool: Tool; icon: typeof Pencil; label: string; shortcut: string }[] = [
  { tool: "select", icon: MousePointer2, label: "Select", shortcut: "V" },
  { tool: "pencil", icon: Pencil, label: "Pencil", shortcut: "P" },
  { tool: "line", icon: Minus, label: "Line", shortcut: "L" },
  { tool: "rect", icon: Square, label: "Rectangle", shortcut: "R" },
  { tool: "ellipse", icon: Circle, label: "Ellipse", shortcut: "O" },
  { tool: "text", icon: Type, label: "Text", shortcut: "T" },
  { tool: "eraser", icon: Eraser, label: "Eraser", shortcut: "E" },
  { tool: "fill", icon: PaintBucket, label: "Fill", shortcut: "G" },
  { tool: "eyedropper", icon: Pipette, label: "Eyedropper", shortcut: "I" },
];

export default function Toolbar({ activeTool, onSetTool }: ToolbarProps) {
  return (
    <div
      className="w-11 bg-card border-r border-border flex flex-col items-center py-2 gap-0.5"
      data-testid="toolbar"
    >
      {tools.map(({ tool, icon: Icon, label, shortcut }) => (
        <Tooltip key={tool} delayDuration={200}>
          <TooltipTrigger asChild>
            <button
              className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${
                activeTool === tool
                  ? "bg-primary/20 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              onClick={() => onSetTool(tool)}
              data-testid={`tool-${tool}`}
            >
              <Icon size={16} strokeWidth={1.5} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs">
            {label} <kbd className="ml-1.5 px-1 py-0.5 bg-muted rounded text-[10px] font-mono">{shortcut}</kbd>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
