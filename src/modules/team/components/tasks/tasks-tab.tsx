import React from "react";
import { CalendarDays } from "lucide-react";
import { cn } from "@/shared/utils";
import { TEAM_TASKS } from "../../data/team-data";

interface TasksTabProps {
  search: string;
  setSelectedTeamTask: (task: any) => void;
}

export function TasksTab({ search, setSelectedTeamTask }: TasksTabProps) {
  return (
    <div className="flex h-full overflow-hidden p-6 gap-6 max-w-7xl mx-auto w-full text-left">
      {/* Left Panel: Profile and Summary Cards */}
      <div className="w-80 space-y-6 flex-shrink-0">
        {/* Profile Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-[#5B57E8] text-white text-2xl font-semibold flex items-center justify-center mb-4">
            AA
          </div>
          <h3 className="text-base font-semibold text-gray-900">Alex Admin</h3>
          <p className="text-xs text-gray-500 mt-1">
            Administrator · Department Head
          </p>
          <div className="mt-4 flex items-center gap-2.5 px-3 py-1.5 bg-[#F6F7F9] rounded-lg text-xs text-gray-600">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>Active Session</span>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4 text-left">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
              Total Tasks
            </span>
            <div className="text-2xl font-bold text-gray-950 mt-1">
              {TEAM_TASKS.length}
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
              In Progress
            </span>
            <div className="text-2xl font-bold text-[#5B57E8] mt-1">
              {TEAM_TASKS.filter((t) => t.status === "In Progress").length}
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
              Overdue
            </span>
            <div className="text-2xl font-bold text-red-500 mt-1">
              {TEAM_TASKS.filter((t) => t.status === "Overdue").length}
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
              Completed
            </span>
            <div className="text-2xl font-bold text-green-500 mt-1">
              {TEAM_TASKS.filter((t) => t.status === "Done").length}
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel: Task List */}
      <div className="flex-1 bg-white border border-gray-200 rounded-xl flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-805">Team Tasks List</h3>
          <span className="text-xs text-gray-500">
            {TEAM_TASKS.length} tasks assigned
          </span>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-3">
          {TEAM_TASKS.filter(
            (t) =>
              t.title.toLowerCase().includes(search.toLowerCase()) ||
              t.assignee.toLowerCase().includes(search.toLowerCase())
          ).map((t) => {
            const progressPct =
              t.status === "Done"
                ? 100
                : t.status === "In Progress"
                ? 50
                : t.status === "Overdue"
                ? 30
                : 0;
            return (
              <div
                key={t.id}
                onClick={() => setSelectedTeamTask(t)}
                className="bg-white border border-gray-200 rounded-xl p-4 hover:border-[#5B57E8]/40 hover:shadow-sm transition-all cursor-pointer flex flex-col gap-3"
              >
                <div className="flex items-center gap-3">
                  {/* Creator avatar (Manager/Department Head) */}
                  <div className="w-8 h-8 rounded-full bg-[#5B57E8] text-white text-xs font-semibold flex items-center justify-center flex-shrink-0">
                    AA
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-908 truncate hover:text-[#5B57E8] transition-colors text-left">
                      {t.title}
                    </h4>
                    <p className="text-xs text-gray-500 truncate mt-0.5 text-left">
                      Assigned to: {t.assignee}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                        t.priority === "High"
                          ? "bg-red-50 text-red-500"
                          : t.priority === "Medium"
                          ? "bg-amber-50 text-amber-500"
                          : "bg-gray-100 text-gray-400"
                      )}
                    >
                      {t.priority}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                        t.status === "Done"
                          ? "bg-green-50 text-green-600"
                          : t.status === "Overdue"
                          ? "bg-red-50 text-red-500"
                          : t.status === "In Progress"
                          ? "bg-blue-50 text-blue-600"
                          : "bg-gray-100 text-gray-500"
                      )}
                    >
                      {t.status}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-1">
                    <CalendarDays size={12} />
                    <span>Due {t.due}</span>
                  </div>
                  <div className="w-1/3 flex items-center gap-3">
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          t.status === "Done"
                            ? "bg-green-500"
                            : t.status === "Overdue"
                            ? "bg-red-500"
                            : "bg-[#5B57E8]"
                        )}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-gray-500">
                      {progressPct}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
