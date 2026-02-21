"use client";

import { useRef, KeyboardEvent, ClipboardEvent } from "react";
import { cn } from "@/lib/utils";

interface PinInputProps {
  onComplete: (pin: string) => void;
  disabled?: boolean;
}

export function PinInput({ onComplete, disabled }: PinInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const values = useRef<string[]>(Array(6).fill(""));

  function handleChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    values.current[index] = digit;

    if (digit && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }

    if (values.current.every((v) => v !== "")) {
      onComplete(values.current.join(""));
    }
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (values.current[index]) {
        values.current[index] = "";
        if (inputsRef.current[index]) {
          inputsRef.current[index]!.value = "";
        }
      } else if (index > 0) {
        values.current[index - 1] = "";
        if (inputsRef.current[index - 1]) {
          inputsRef.current[index - 1]!.value = "";
        }
        inputsRef.current[index - 1]?.focus();
      }
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    // Prevent paste to avoid clipboard leakage
    e.preventDefault();
  }

  return (
    <div className="flex gap-3 justify-center">
      {Array.from({ length: 6 }, (_, i) => (
        <input
          key={i}
          ref={(el) => {
            inputsRef.current[i] = el;
          }}
          type="password"
          inputMode="numeric"
          maxLength={1}
          disabled={disabled}
          onPaste={handlePaste}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className={cn(
            "w-12 h-14 text-center text-2xl font-bold rounded-lg border bg-muted/50",
            "border-border focus:border-primary focus:ring-2 focus:ring-primary/30",
            "outline-none transition-all",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        />
      ))}
    </div>
  );
}
