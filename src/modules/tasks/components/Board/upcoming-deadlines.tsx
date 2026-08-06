import React from "react";
import { CalendarDays } from "lucide-react";
import { TeamTask } from "../../types";

interface UpcomingDeadlinesProps {
  deadlines: TeamTask[];
  onSelectTask: (task: TeamTask) => void;
}

export function UpcomingDeadlines({ deadlines, onSelectTask }: UpcomingDeadlinesProps) {
  return (
    <div className="space-y-3 text-left">
      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
        Upcoming Deadlines
      </h4>

      <div className="space-y-2.5">
        {deadlines.length === 0 ? (
          <div className="border border-dashed border-gray-200 rounded-xl p-4 text-center text-xs text-gray-400">
            No upcoming deadlines
          </div>
        ) : (
          deadlines.map((t) => (
            <div
              key={t.id}
              onClick={() => onSelectTask(t)}
              className="border border-[#E5E7EB] rounded-xl bg-white p-3.5 hover:border-[#5C5CFF]/30 hover:shadow-sm transition-all cursor-pointer flex gap-3.5 items-start"
            >
              {/* Date chip */}
              <div className="px-2.5 py-1.5 bg-[#EEF2FF] rounded-lg text-center flex-shrink-0 min-w-[54px]">
                <CalendarDays size={13} className="text-[#5C5CFF] mx-auto mb-0.5" />
                <span className="text-[10px] font-extrabold text-[#5C5CFF] block leading-none">
                  {t.due}
                </span>
              </div>

              {/* Task title and assignee */}
              <div className="flex-1 min-w-0">
                <h5 className="text-xs font-bold text-gray-900 leading-snug truncate">
                  {t.title}
                </h5>
                <p className="text-[11px] text-gray-500 mt-0.5 truncate font-medium">
                  Assigned to: {t.assignee}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
