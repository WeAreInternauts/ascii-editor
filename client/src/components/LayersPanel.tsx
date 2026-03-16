import { type Layer } from "@/lib/ascii-engine";
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Plus,
  Trash2,
  GripVertical,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface LayersPanelProps {
  layers: Layer[];
  activeLayerId: string;
  onSetActiveLayerId: (id: string) => void;
  onAddLayer: () => void;
  onDeleteLayer: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onRenameLayer: (id: string, name: string) => void;
}

export default function LayersPanel({
  layers,
  activeLayerId,
  onSetActiveLayerId,
  onAddLayer,
  onDeleteLayer,
  onToggleVisibility,
  onToggleLock,
  onRenameLayer,
}: LayersPanelProps) {
  return (
    <div
      className="bg-card flex flex-col h-full"
      data-testid="layers-panel"
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          Layers
        </h3>
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <button
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              onClick={onAddLayer}
              data-testid="button-add-layer"
            >
              <Plus size={14} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" className="text-xs">
            Add layer
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {[...layers].reverse().map((layer) => (
          <div
            key={layer.id}
            className={`group flex items-center gap-1 px-2 py-1.5 mx-1 rounded-md cursor-pointer transition-colors ${
              activeLayerId === layer.id
                ? "bg-primary/10 border border-primary/20"
                : "hover:bg-muted border border-transparent"
            }`}
            onClick={() => onSetActiveLayerId(layer.id)}
            data-testid={`layer-${layer.id}`}
          >
            <GripVertical
              size={12}
              className="text-muted-foreground/30 flex-shrink-0"
            />

            <button
              className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onToggleVisibility(layer.id);
              }}
              data-testid={`toggle-visibility-${layer.id}`}
            >
              {layer.visible ? (
                <Eye size={13} />
              ) : (
                <EyeOff size={13} className="opacity-40" />
              )}
            </button>

            <button
              className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onToggleLock(layer.id);
              }}
              data-testid={`toggle-lock-${layer.id}`}
            >
              {layer.locked ? (
                <Lock size={13} className="text-orange-400" />
              ) : (
                <Unlock size={13} className="opacity-40" />
              )}
            </button>

            <span
              className="flex-1 text-[11px] text-foreground truncate"
              onDoubleClick={(e) => {
                const target = e.currentTarget;
                target.contentEditable = "true";
                target.focus();
                const range = document.createRange();
                range.selectNodeContents(target);
                window.getSelection()?.removeAllRanges();
                window.getSelection()?.addRange(range);
              }}
              onBlur={(e) => {
                const target = e.currentTarget;
                target.contentEditable = "false";
                onRenameLayer(layer.id, target.textContent || layer.name);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  (e.currentTarget as HTMLElement).blur();
                }
              }}
            >
              {layer.name}
            </span>

            <button
              className="flex-shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-all"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteLayer(layer.id);
              }}
              data-testid={`delete-layer-${layer.id}`}
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
