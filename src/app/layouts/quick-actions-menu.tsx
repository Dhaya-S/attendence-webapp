import React from "react";
import {
  UserPlus,
  GitBranch,
  ClipboardList,
  Megaphone,
  CalendarDays,
  Clock,
  X,
} from "lucide-react";
import { AppPage } from "@/shared/types";

export function QuickActionsMenu({
  onClose,
  navigate,
}: {
  onClose: () => void;
  navigate: (p: AppPage) => void;
}) {
  const actions = [
    {
      icon: UserPlus,
      label: "Add Employee",
      page: "employee-add" as AppPage,
      desc: "Create a new employee profile",
    },
    {
      icon: GitBranch,
      label: "Add Department",
      page: "organization" as AppPage,
      desc: "Add a new department",
    },
    {
      icon: ClipboardList,
      label: "Create Task",
      page: "tasks" as AppPage,
      desc: "Assign a task to a team member",
    },
    {
      icon: Megaphone,
      label: "Create Announcement",
      page: "my-space" as AppPage,
      desc: "Post to the organization",
    },
    {
      icon: CalendarDays,
      label: "Create Holiday",
      page: "organization" as AppPage,
      desc: "Add to the holiday calendar",
    },
    {
      icon: Clock,
      label: "Create Shift",
      page: "organization" as AppPage,
      desc: "Define a new shift template",
    },
  ];

  return (
    <div
      className="absolute left-1/2 top-14 -translate-x-1/2 w-80 bg-white rounded-xl border border-gray-200 shadow-xl z-50"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-800">Quick Actions</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={14} />
        </button>
      </div>
      <div className="p-2 grid grid-cols-2 gap-1">
        {actions.map((a) => (
          <button
            key={a.label}
            onClick={() => {
              navigate(a.page);
              onClose();
            }}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-[#EEF2FF] text-left transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-[#5C5CFF]/10 transition-colors">
              <a.icon
                size={15}
                className="text-gray-505 group-hover:text-[#5C5CFF] transition-colors"
              />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-800 group-hover:text-[#5C5CFF] transition-colors leading-snug">
                {a.label}
              </p>
              <p className="text-[10px] text-gray-400 truncate">{a.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
