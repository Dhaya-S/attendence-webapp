import React from "react";

interface BoardInsightsSummaryProps {
  totalTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  completedTasks: number;
}

export function BoardInsightsSummary({
  totalTasks,
  inProgressTasks,
  overdueTasks,
  completedTasks,
}: BoardInsightsSummaryProps) {
  const stats = [
    { label: "Total Tasks", value: totalTasks, valueClass: "text-[#111827]" },
    { label: "In Progress", value: inProgressTasks, valueClass: "text-[#5C5CFF]" },
    { label: "Overdue", value: overdueTasks, valueClass: "text-red-500" },
    { label: "Completed", value: completedTasks, valueClass: "text-green-500" },
  ];

  return (
    <div className="space-y-3.5 text-left">
      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
        Task Overview
      </h4>
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="h-[84px] border border-[#E5E7EB] rounded-xl bg-white p-4 flex flex-col justify-between shadow-sm"
          >
            <span className="text-[12px] font-medium text-gray-500 uppercase tracking-wide">
              {s.label}
            </span>
            <span className={`text-[24px] font-bold ${s.valueClass} leading-none`}>
              {s.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
