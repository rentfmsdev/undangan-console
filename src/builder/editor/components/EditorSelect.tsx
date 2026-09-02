"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export type SelectOption = {
  value: string;
  label: string;
  subtitle?: string;
};

type Props = {
  id?: string;
  value: string;
  options: SelectOption[];
  disabled?: boolean;
  placeholder?: string;
  onChange: (value: string) => void;
  className?: string;
};

export function EditorSelect({
  id,
  value,
  options,
  disabled = false,
  placeholder = "Pilih opsi...",
  onChange,
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger Button */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex h-9 w-full items-center justify-between gap-2 rounded-xl border bg-white px-3 text-left transition focus:outline-none ${
          open
            ? "border-emerald-600 ring-2 ring-emerald-100"
            : "border-slate-300 hover:border-slate-400"
        } ${disabled ? "cursor-not-allowed opacity-55" : "cursor-pointer"}`}
      >
        <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-800">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-slate-400 transition-transform duration-200 ${
            open ? "rotate-180 text-emerald-600" : ""
          }`}
        />
      </button>

      {/* Custom Dropdown Menu */}
      {open && (
        <div
          role="listbox"
          className="console-scrollbar absolute left-0 top-[calc(100%+4px)] z-50 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl animate-in fade-in zoom-in-95 duration-150"
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left transition ${
                  isSelected
                    ? "bg-emerald-50 text-emerald-950 font-bold"
                    : "text-slate-800 font-semibold hover:bg-slate-100"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs leading-tight">
                    {option.label}
                  </p>
                  {option.subtitle && (
                    <p className="truncate text-[10px] font-normal text-slate-400 mt-0.5">
                      {option.subtitle}
                    </p>
                  )}
                </div>
                {isSelected && (
                  <Check size={13} className="shrink-0 text-emerald-600 ml-1.5" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
