import React from "react";

interface StatusDuration {
  count: number;
  avgDays: number;
}

interface TimeInStatusProps {
  timeInStatus: {
    Todo: StatusDuration;
    "In Progress": StatusDuration;
    Review: StatusDuration;
    Done: StatusDuration;
  };
}

export function TimeInStatus({ timeInStatus }: TimeInStatusProps) {
  const rows = [
    { label: "To Do", count: timeInStatus.Todo.count, avg: timeInStatus.Todo.avgDays },
    { label: "In Progress", count: timeInStatus["In Progress"].count, avg: timeInStatus["In Progress"].avgDays },
    { label: "Review", count: timeInStatus.Review.count, avg: timeInStatus.Review.avgDays },
    { label: "Completed", count: timeInStatus.Done.count, avg: timeInStatus.Done.avgDays },
  ];

  return (
    <div className="space-y-3 text-left">
      <div>
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
          Time Spent in Status
        </h4>
        <p className="text-[11px] text-gray-400 mt-0.5">
          Identify where tasks remain the longest.
        </p>
      </div>

      <div className="border border-[#E5E7EB] rounded-xl bg-white p-3.5 divide-y divide-gray-100 shadow-sm">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between text-xs py-2.5 first:pt-0 last:pb-0"
          >
            <span className="font-semibold text-gray-800">{row.label}</span>
            <div className="flex items-center gap-4 text-gray-500 font-medium">
              <span>{row.count} task{row.count !== 1 ? "s" : ""}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-gray-200" />
              <span className="text-[#111827] font-semibold">Avg. {row.avg} days</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
