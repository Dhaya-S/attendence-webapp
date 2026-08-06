import React, { useState, useEffect, useRef } from "react";
import { X, Search, Check, Plus } from "lucide-react";
import { cn } from "@/shared/utils";

interface LabelsSelectorProps {
  selectedLabels: string[];
  onChange: (labels: string[]) => void;
  availableLabels?: string[];
}

const DEFAULT_LABELS = ["Onboarding", "HR", "Engineering", "Design", "Compliance", "Operations", "Training"];

export function LabelsSelector({
  selectedLabels,
  onChange,
  availableLabels = DEFAULT_LABELS,
}: LabelsSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [customLabels, setCustomLabels] = useState<string[]>([]);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const allLabels = Array.from(new Set([...availableLabels, ...customLabels]));
  
  const filtered = allLabels.filter((label) =>
    label.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggleLabel = (label: string) => {
    if (selectedLabels.includes(label)) {
      onChange(selectedLabels.filter((l) => l !== label));
    } else {
      onChange([...selectedLabels, label]);
    }
    setSearch("");
  };

  const handleCreateLabel = () => {
    const trimmed = search.trim();
    if (trimmed && !allLabels.some((l) => l.toLowerCase() === trimmed.toLowerCase())) {
      setCustomLabels((prev) => [...prev, trimmed]);
      onChange([...selectedLabels, trimmed]);
      setSearch("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const trimmed = search.trim();
      if (trimmed) {
        const exists = allLabels.find((l) => l.toLowerCase() === trimmed.toLowerCase());
        if (exists) {
          if (!selectedLabels.includes(exists)) {
            onChange([...selectedLabels, exists]);
          }
          setSearch("");
        } else {
          handleCreateLabel();
        }
      }
    }
  };

  return (
    <div className="relative text-left" ref={containerRef}>
      <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
        Labels
      </label>

      {/* Input container / Trigger */}
      <div
        onClick={() => setIsOpen(true)}
        className="w-full min-h-10 px-3 py-1.5 bg-white border border-[#E5E7EB] rounded-xl flex flex-wrap gap-1.5 items-center hover:border-gray-300 transition-all cursor-pointer focus-within:ring-1 focus-within:ring-[#5C5CFF]"
      >
        {selectedLabels.length === 0 ? (
          <span className="text-xs text-gray-400 font-medium py-1">Add labels...</span>
        ) : (
          selectedLabels.map((label) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#EEF2FF] text-[#5C5CFF] text-[10px] font-bold border border-[#E5E7EB]"
            >
              {label}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleLabel(label);
                }}
                className="text-[#5C5CFF] hover:text-[#5B57E8] focus:outline-none cursor-pointer"
              >
                <X size={10} />
              </button>
            </span>
          ))
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-[44px] left-0 right-0 z-50 bg-white border border-[#E5E7EB] rounded-xl shadow-xl flex flex-col overflow-hidden max-h-[220px]">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-100 flex items-center gap-2">
            <Search size={14} className="text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search or type new label..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full text-xs text-gray-900 placeholder-gray-400 bg-transparent border-0 outline-none"
              autoFocus
            />
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto py-1">
            {filtered.map((label) => {
              const isSelected = selectedLabels.includes(label);
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => handleToggleLabel(label)}
                  className="w-full px-3.5 py-1.5 flex items-center justify-between hover:bg-gray-55 transition-colors cursor-pointer text-left focus:outline-none text-xs font-semibold text-gray-800"
                >
                  <span>{label}</span>
                  {isSelected && <Check size={14} className="text-[#5C5CFF]" />}
                </button>
              );
            })}

            {search.trim() && !allLabels.some((l) => l.toLowerCase() === search.trim().toLowerCase()) && (
              <button
                type="button"
                onClick={handleCreateLabel}
                className="w-full px-3.5 py-2 flex items-center gap-2 hover:bg-[#EEF2FF]/40 text-[#5C5CFF] transition-colors cursor-pointer text-left focus:outline-none text-xs font-bold border-t border-gray-55"
              >
                <Plus size={14} />
                <span>Create new label "{search.trim()}"</span>
              </button>
            )}

            {filtered.length === 0 && !search.trim() && (
              <div className="p-3 text-center text-xs text-gray-400">
                No labels available
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
