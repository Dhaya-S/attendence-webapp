import React from "react";
import { Avt } from "@/shared/components";

export function MentionPopup({
  text,
  setText,
  teamMembers = [],
}: {
  text: string;
  setText: (s: string) => void;
  teamMembers?: any[];
}) {
  const atIndex = text.lastIndexOf("@");
  if (atIndex === -1) return null;

  // Verify there is no whitespace after @
  const postAt = text.slice(atIndex);
  if (postAt.includes(" ")) return null;

  const query = postAt.slice(1).toLowerCase();
  const matched = (teamMembers && teamMembers.length > 0 ? teamMembers : []).filter((e) =>
    (e.name || e.email || "").toLowerCase().includes(query)
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
            key={emp.id || emp.email || emp.name}
            onClick={() => {
              const before = text.slice(0, atIndex);
              setText(before + `@${emp.name || emp.email} `);
            }}
            className="w-full px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer bg-white text-left"
          >
            <Avt initials={emp.initials || (emp.name ? emp.name[0] : "T")} color={emp.color || "#5C5CFF"} size="xs" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-808 truncate">{emp.name || emp.email}</p>
              <p className="text-[9px] text-gray-400 truncate">{emp.dept || emp.department || "General"}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
