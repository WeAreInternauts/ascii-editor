import { useEffect, useCallback } from "react";
import { useEditorState } from "@/hooks/use-editor-state";
import AsciiCanvas from "@/components/AsciiCanvas";
import Toolbar from "@/components/Toolbar";
import PropertiesPanel from "@/components/PropertiesPanel";
import LayersPanel from "@/components/LayersPanel";
import TopBar from "@/components/TopBar";
import StatusBar from "@/components/StatusBar";
import TextInput from "@/components/TextInput";
import type { Tool } from "@/lib/ascii-engine";

export default function Editor() {
  const editor = useEditorState();

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't intercept if text tool is active and no modifier
      if (
        editor.activeTool === "text" &&
        !e.ctrlKey &&
        !e.metaKey &&
        e.key.length === 1
      ) {
        return;
      }

      // Undo/Redo
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        editor.undo();
        return;
      }
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "Z" || (e.key === "z" && e.shiftKey))
      ) {
        e.preventDefault();
        editor.redo();
        return;
      }

      // Tool shortcuts
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const toolMap: Record<string, Tool> = {
        v: "select",
        p: "pencil",
        l: "line",
        r: "rect",
        o: "ellipse",
        t: "text",
        e: "eraser",
        g: "fill",
        i: "eyedropper",
      };

      const tool = toolMap[e.key.toLowerCase()];
      if (tool) {
        e.preventDefault();
        editor.setTool(tool);
      }
    },
    [editor]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-background" data-testid="editor-root">
      <TopBar
        layers={editor.layers}
        width={editor.width}
        height={editor.height}
        zoom={editor.zoom}
        canUndo={editor.canUndo}
        canRedo={editor.canRedo}
        onUndo={editor.undo}
        onRedo={editor.redo}
        onSetZoom={editor.setZoom}
        onClearCanvas={editor.clearCanvas}
      />

      <div className="flex flex-1 overflow-hidden">
        <Toolbar activeTool={editor.activeTool} onSetTool={editor.setTool} />

        <AsciiCanvas
          width={editor.width}
          height={editor.height}
          layers={editor.layers}
          preview={editor.preview}
          zoom={editor.zoom}
          showGrid={editor.showGrid}
          activeTool={editor.activeTool}
          onMouseDown={editor.handleMouseDown}
          onMouseDrag={editor.handleMouseDrag}
          onMouseUp={editor.handleMouseUp}
          onMouseMove={editor.handleMouseMove}
        />

        <div className="flex flex-col border-l border-border" style={{ width: '224px' }}>
          <div className="flex-1 overflow-y-auto min-h-0">
            <PropertiesPanel
              activeTool={editor.activeTool}
              activeChar={editor.activeChar}
              activeFg={editor.activeFg}
              rectStyle={editor.rectStyle}
              zoom={editor.zoom}
              showGrid={editor.showGrid}
              width={editor.width}
              height={editor.height}
              onSetActiveChar={editor.setActiveChar}
              onSetActiveFg={editor.setActiveFg}
              onSetRectStyle={editor.setRectStyle}
              onSetZoom={editor.setZoom}
              onToggleGrid={editor.toggleGrid}
              onResizeCanvas={editor.resizeCanvas}
            />
          </div>

          <div className="flex-shrink-0 border-t border-border" style={{ maxHeight: '200px' }}>
            <LayersPanel
            layers={editor.layers}
            activeLayerId={editor.activeLayerId}
            onSetActiveLayerId={editor.setActiveLayerId}
            onAddLayer={editor.addLayer}
            onDeleteLayer={editor.deleteLayer}
            onToggleVisibility={editor.toggleLayerVisibility}
            onToggleLock={editor.toggleLayerLock}
            onRenameLayer={editor.renameLayer}
            />
          </div>
        </div>
      </div>

      <StatusBar
        activeTool={editor.activeTool}
        activeChar={editor.activeChar}
        width={editor.width}
        height={editor.height}
      />

      <TextInput
        onInput={editor.handleTextInput}
        activeTool={editor.activeTool}
      />

    </div>
  );
}
