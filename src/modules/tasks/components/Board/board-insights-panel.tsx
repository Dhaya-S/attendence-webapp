import React from "react";
import { X } from "lucide-react";
import { cn } from "@/shared/utils";
import { TeamTask } from "../../types";
import { useTaskInsights } from "../../hooks/use-task-insights";
import { BoardInsightsSummary } from "./board-insights-summary";
import { AttentionItems } from "./attention-items";
import { TimeInStatus } from "./time-in-status";
import { UpcomingDeadlines } from "./upcoming-deadlines";

interface BoardInsightsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TeamTask[];
  onSelectTask: (task: TeamTask) => void;
}

export function BoardInsightsPanel({
  isOpen,
  onClose,
  tasks,
  onSelectTask,
}: BoardInsightsPanelProps) {
  const insights = useTaskInsights(tasks);

  return (
    <div
      className={cn(
        "fixed top-[64px] right-0 bottom-0 z-30 bg-white border-l border-gray-200 shadow-xl flex flex-col transition-all duration-200 ease-in-out",
        isOpen ? "translate-x-0 w-full md:w-[420px]" : "translate-x-full w-0"
      )}
      style={{
        maxHeight: "calc(100vh - 64px)",
        maxWidth: "min(420px, 90vw)",
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between p-5 border-b border-gray-100 flex-shrink-0 text-left">
        <div>
          <h3 className="text-base font-bold text-gray-900">Board Insights</h3>
          <p className="text-xs text-gray-500 mt-1">
            Stay up to date with your team's work.
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-55 border-0 bg-transparent cursor-pointer flex items-center justify-center"
        >
          <X size={16} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Task Overview */}
        <BoardInsightsSummary
          totalTasks={insights.totalTasks}
          inProgressTasks={insights.inProgressTasks}
          overdueTasks={insights.overdueTasks}
          completedTasks={insights.completedTasks}
        />

        {/* Work Items for Attention */}
        <AttentionItems
          dueTasks={insights.dueTasks}
          stuckTasks={insights.stuckTasks}
          blockedTasks={insights.blockedTasks}
          flaggedTasks={insights.flaggedTasks}
          onSelectTask={onSelectTask}
        />

        {/* Time Spent in Status */}
        <TimeInStatus timeInStatus={insights.timeInStatus} />

        {/* Completion Progress */}
        <div className="space-y-2.5 text-left">
          <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
            <span>Completion</span>
            <span className="text-[#111827] font-semibold text-right lowercase normal-case">
              Completed {insights.completedTasks} / {insights.totalTasks}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#5C5CFF] transition-all duration-300"
                style={{ width: `${insights.completionPercentage}%` }}
              />
            </div>
            <span className="text-xs font-bold text-[#111827] min-w-[32px] text-right">
              {insights.completionPercentage}%
            </span>
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="space-y-3 text-left">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Priority
          </h4>
          <div className="border border-[#E5E7EB] rounded-xl bg-white p-3.5 divide-y divide-gray-100 shadow-sm">
            {[
              { label: "High", count: insights.priorityBreakdown.High, color: "bg-red-500" },
              { label: "Medium", count: insights.priorityBreakdown.Medium, color: "bg-amber-500" },
              { label: "Low", count: insights.priorityBreakdown.Low, color: "bg-gray-400" },
            ].map((p) => (
              <div
                key={p.label}
                className="flex items-center justify-between text-xs py-2.5 first:pt-0 last:pb-0 font-medium"
              >
                <div className="flex items-center gap-2">
                  <span className={cn("w-2 h-2 rounded-full", p.color)} />
                  <span className="font-semibold text-gray-800">{p.label}</span>
                </div>
                <span className="font-bold text-[#111827]">{p.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <UpcomingDeadlines
          deadlines={insights.upcomingDeadlines}
          onSelectTask={onSelectTask}
        />
      </div>
    </div>
  );
}
