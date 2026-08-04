import React from "react";
import { EMPLOYEES } from "@/modules/organization/data/employees";
import { Avt } from "@/shared/components";

export function MentionPopup({
  text,
  setText,
}: {
  text: string;
  setText: (s: string) => void;
}) {
  const atIndex = text.lastIndexOf("@");
  if (atIndex === -1) return null;

  // Verify there is no whitespace after @
  const postAt = text.slice(atIndex);
  if (postAt.includes(" ")) return null;

  const query = postAt.slice(1).toLowerCase();
  const matched = EMPLOYEES.filter((e) =>
    e.name.toLowerCase().includes(query)
  ).slice(0, 4);

  if (matched.length === 0) return null;

  return (
    <div className="absolute left-3 bottom-full mb-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-1 w-56 text-left">
      <div className="px-3 py-1.5 border-b border-gray-100">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
          Mention Teammate
        </span>
      </div>
      <div className="max-h-36 overflow-auto">
        {matched.map((emp) => (
          <button
            key={emp.id}
            onClick={() => {
              const before = text.slice(0, atIndex);
              setText(before + `@${emp.name} `);
            }}
            className="w-full px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer bg-white text-left"
          >
            <Avt initials={emp.initials} color={emp.color} size="xs" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-808 truncate">{emp.name}</p>
              <p className="text-[9px] text-gray-400 truncate">{emp.dept}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
