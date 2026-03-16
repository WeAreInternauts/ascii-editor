import { useEffect, useRef } from "react";

interface TextInputProps {
  onInput: (text: string) => void;
  activeTool: string;
}

export default function TextInput({ onInput, activeTool }: TextInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeTool !== "text") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore modifier combos
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      // Ignore special keys
      if (e.key.length > 1 && e.key !== "Backspace") return;

      if (e.key === "Backspace") {
        // handled elsewhere if needed
        return;
      }

      e.preventDefault();
      onInput(e.key);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTool, onInput]);

  return null;
}
