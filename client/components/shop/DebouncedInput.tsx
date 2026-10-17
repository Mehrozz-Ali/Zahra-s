"use client";

import { useEffect, useRef, useState, type InputHTMLAttributes } from "react";

interface DebouncedInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value: string;
  onCommit: (value: string) => void;
  delay?: number;
}

/** Waits until the user pauses typing (or presses Enter) before committing, so we don't query on every keystroke. */
export function DebouncedInput({ value, onCommit, delay = 400, ...rest }: DebouncedInputProps) {
  const [text, setText] = useState(value);
  const commit = useRef(onCommit);
  commit.current = onCommit; // always call the latest handler, never a stale one

  useEffect(() => setText(value), [value]); // follow external changes, e.g. "Clear filters"
  useEffect(() => {
    if (text === value) return;
    const timer = setTimeout(() => commit.current(text), delay);
    return () => clearTimeout(timer);
  }, [text, value, delay]);

  return (
    <input
      {...rest}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          commit.current(text);
        }
      }}
    />
  );
}
