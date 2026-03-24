"use client";

import { useState, useEffect, useRef } from "react";
import { getAllTags } from "@/lib/posts";

interface TagsInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function TagsInput({ value, onChange, className }: TagsInputProps) {
  const [allTags, setAllTags] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getAllTags().then(setAllTags);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get the current tag being typed (after the last comma)
  const parts = value.split(",");
  const currentInput = parts[parts.length - 1].trimStart().toLowerCase();
  const existingTags = parts.slice(0, -1).map((t) => t.trim().toLowerCase());

  const suggestions = currentInput
    ? allTags.filter(
        (t) => t.startsWith(currentInput) && !existingTags.includes(t)
      )
    : [];

  function selectSuggestion(tag: string) {
    const prefix = parts.slice(0, -1).join(", ");
    const newValue = prefix ? `${prefix}, ${tag}, ` : `${tag}, `;
    onChange(newValue);
    setShowSuggestions(false);
    setSelectedIndex(0);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" || e.key === "Tab") {
      if (suggestions[selectedIndex]) {
        e.preventDefault();
        selectSuggestion(suggestions[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        placeholder="Tags (comma separated)"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShowSuggestions(true);
          setSelectedIndex(0);
        }}
        onFocus={() => setShowSuggestions(true)}
        onKeyDown={handleKeyDown}
        className={className}
      />
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-50 top-full left-0 mt-1 bg-base-200 rounded-lg shadow-lg border border-base-300 max-h-48 overflow-y-auto w-64">
          {suggestions.map((tag, i) => (
            <li
              key={tag}
              onMouseDown={() => selectSuggestion(tag)}
              className={`px-3 py-1.5 text-sm font-mono cursor-pointer transition-colors ${
                i === selectedIndex
                  ? "bg-primary text-primary-content"
                  : "hover:bg-base-300"
              }`}
            >
              {tag}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
