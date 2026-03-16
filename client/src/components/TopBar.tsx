import {
  Undo2,
  Redo2,
  Download,
  Trash2,
  Grid3X3,
  ZoomIn,
  ZoomOut,
  Copy,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { exportToText, type Layer } from "@/lib/ascii-engine";
import { useToast } from "@/hooks/use-toast";

interface TopBarProps {
  layers: Layer[];
  width: number;
  height: number;
  zoom: number;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onSetZoom: (z: number) => void;
  onClearCanvas: () => void;
}

export default function TopBar({
  layers,
  width,
  height,
  zoom,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSetZoom,
  onClearCanvas,
}: TopBarProps) {
  const { toast } = useToast();

  const handleExport = () => {
    const text = exportToText(layers, width, height);
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ascii-art.txt";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: "ASCII art saved as text file." });
  };

  const handleCopy = () => {
    const text = exportToText(layers, width, height);
    navigator.clipboard.writeText(text).then(
      () => toast({ title: "Copied", description: "ASCII art copied to clipboard." }),
      () => toast({ title: "Error", description: "Could not copy to clipboard.", variant: "destructive" })
    );
  };

  return (
    <div
      className="h-10 bg-card border-b border-border flex items-center px-3 gap-1 flex-shrink-0"
      data-testid="top-bar"
    >
      {/* Logo */}
      <div className="flex items-center gap-2 mr-3">
        <div className="w-6 h-6 bg-primary/20 rounded flex items-center justify-center">
          <span className="font-mono text-xs text-primary font-bold">A</span>
        </div>
        <span className="text-xs font-medium text-foreground tracking-tight hidden sm:block">
          ASCII Editor
        </span>
      </div>

      <Separator orientation="vertical" className="h-5" />

      {/* History */}
      <div className="flex items-center gap-0.5 ml-1">
        <BarButton
          icon={Undo2}
          label="Undo"
          shortcut="Ctrl+Z"
          onClick={onUndo}
          disabled={!canUndo}
        />
        <BarButton
          icon={Redo2}
          label="Redo"
          shortcut="Ctrl+Shift+Z"
          onClick={onRedo}
          disabled={!canRedo}
        />
      </div>

      <Separator orientation="vertical" className="h-5" />

      {/* Zoom */}
      <div className="flex items-center gap-0.5 ml-1">
        <BarButton
          icon={ZoomOut}
          label="Zoom out"
          onClick={() => onSetZoom(zoom - 0.2)}
        />
        <span className="text-[11px] font-mono text-muted-foreground w-10 text-center">
          {Math.round(zoom * 100)}%
        </span>
        <BarButton
          icon={ZoomIn}
          label="Zoom in"
          onClick={() => onSetZoom(zoom + 0.2)}
        />
      </div>

      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-0.5">
        <BarButton icon={Copy} label="Copy to clipboard" onClick={handleCopy} />
        <BarButton icon={Download} label="Export as .txt" onClick={handleExport} />
        <BarButton
          icon={Trash2}
          label="Clear active layer"
          onClick={onClearCanvas}
          className="text-destructive/70 hover:text-destructive"
        />
      </div>
    </div>
  );
}

function BarButton({
  icon: Icon,
  label,
  shortcut,
  onClick,
  disabled,
  className,
}: {
  icon: typeof Undo2;
  label: string;
  shortcut?: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <button
          className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${
            disabled
              ? "text-muted-foreground/30 cursor-not-allowed"
              : className || "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
          onClick={disabled ? undefined : onClick}
          disabled={disabled}
          data-testid={`button-${label.toLowerCase().replace(/\s+/g, "-")}`}
        >
          <Icon size={15} strokeWidth={1.5} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {label}
        {shortcut && (
          <kbd className="ml-1.5 px-1 py-0.5 bg-muted rounded text-[10px] font-mono">
            {shortcut}
          </kbd>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
