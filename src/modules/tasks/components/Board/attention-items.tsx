import React, { useState } from "react";
import { AlertCircle, Calendar, Flag, ShieldAlert } from "lucide-react";
import { cn } from "@/shared/utils";
import { TeamTask } from "../../types";
import { getOverdueDays } from "../../utils/task-insights";

interface AttentionItemsProps {
  dueTasks: TeamTask[];
  stuckTasks: TeamTask[];
  blockedTasks: TeamTask[];
  flaggedTasks: TeamTask[];
  onSelectTask: (task: TeamTask) => void;
}

type TabType = "All" | "Due" | "Stuck" | "Blocked" | "Flagged";

export function AttentionItems({
  dueTasks,
  stuckTasks,
  blockedTasks,
  flaggedTasks,
  onSelectTask,
}: AttentionItemsProps) {
  const [activeTab, setActiveTab] = useState<TabType>("All");

  // Get All items: union of all items requiring attention (no duplicates)
  const allTasksMap = new Map<string, TeamTask>();
  dueTasks.forEach(t => allTasksMap.set(t.id, t));
  stuckTasks.forEach(t => allTasksMap.set(t.id, t));
  blockedTasks.forEach(t => allTasksMap.set(t.id, t));
  flaggedTasks.forEach(t => allTasksMap.set(t.id, t));
  
  const REFERENCE_DATE = new Date("2026-07-05");

  const getUrgencyScore = (t: TeamTask) => {
    let score = 0;
    if (t.isBlocked) score += 100;
    if (t.isFlagged) score += 50;
    
    const dueTime = new Date(t.dueDate).getTime();
    const diff = REFERENCE_DATE.getTime() - dueTime;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (days > 0) {
      score += days * 5; // overdue
    } else {
      score += (10 - Math.abs(days)); // due soon
    }
    return score;
  };

  const allTasksList = Array.from(allTasksMap.values()).sort((a, b) => {
    return getUrgencyScore(b) - getUrgencyScore(a);
  });

  const getFilteredTasks = (): TeamTask[] => {
    switch (activeTab) {
      case "Due":
        return dueTasks;
      case "Stuck":
        return stuckTasks;
      case "Blocked":
        return blockedTasks;
      case "Flagged":
        return flaggedTasks;
      case "All":
      default:
        return allTasksList;
    }
  };

  const currentTasks = getFilteredTasks();

  const tabs: { key: TabType; label: string; count: number }[] = [
    { key: "All", label: "All", count: allTasksList.length },
    { key: "Due", label: "Due", count: dueTasks.length },
    { key: "Stuck", label: "Stuck", count: stuckTasks.length },
    { key: "Blocked", label: "Blocked", count: blockedTasks.length },
    { key: "Flagged", label: "Flagged", count: flaggedTasks.length },
  ];

  const getEmptyStateContent = () => {
    switch (activeTab) {
      case "Due":
        return {
          title: "✓ No urgent deadlines",
          desc: "Your team has no overdue or near-due tasks.",
        };
      case "Stuck":
        return {
          title: "✓ No stuck tasks",
          desc: "All tasks are progressing smoothly in their active statuses.",
        };
      case "Blocked":
        return {
          title: "✓ No blocked tasks",
          desc: "Your team currently has no blocked work items.",
        };
      case "Flagged":
        return {
          title: "✓ No flagged tasks",
          desc: "No tasks have been flagged for special attention.",
        };
      case "All":
      default:
        return {
          title: "✓ All clear!",
          desc: "Your team has no tasks requiring attention.",
        };
    }
  };

  return (
    <div className="space-y-4 text-left">
      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
        Work Items for Attention
      </h4>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 h-[32px] gap-4">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={cn(
              "text-[13px] font-medium pb-2 border-b-2 transition-all relative flex items-center gap-1 bg-transparent border-transparent text-gray-555 cursor-pointer hover:text-[#5C5CFF]",
              activeTab === t.key
                ? "text-[#5C5CFF] border-[#5C5CFF] font-semibold"
                : "border-transparent"
            )}
          >
            <span>{t.label}</span>
            {t.count > 0 && (
              <span className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none",
                activeTab === t.key
                  ? "bg-[#EEF2FF] text-[#5C5CFF]"
                  : "bg-gray-100 text-gray-500"
              )}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {currentTasks.length === 0 ? (
          (() => {
            const empty = getEmptyStateContent();
            return (
              <div className="border border-dashed border-gray-255 bg-white/40 rounded-xl p-6 text-center space-y-1">
                <AlertCircle size={20} className="mx-auto text-gray-400 mb-1" />
                <p className="text-xs font-semibold text-gray-700">{empty.title}</p>
                <p className="text-[11px] text-gray-400 leading-relaxed">{empty.desc}</p>
              </div>
            );
          })()
        ) : (
          currentTasks.map((t) => {
            const overdueDays = getOverdueDays(t.dueDate);
            const isTaskOverdue = overdueDays > 0;
            return (
              <div
                key={t.id}
                onClick={() => onSelectTask(t)}
                className="border border-[#E5E7EB] rounded-xl p-4 bg-white hover:border-[#5C5CFF]/30 hover:shadow-sm transition-all cursor-pointer space-y-3"
              >
                <div className="space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h5 className="text-xs font-bold text-gray-900 leading-snug">
                      {t.title}
                    </h5>
                    {t.isFlagged && (
                      <Flag size={12} className="text-red-500 fill-red-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 font-medium">
                    Assigned to: {t.assignee}
                  </p>
                </div>

                {/* Stuck info */}
                {t.status === "In Progress" && (t.daysInStatus ?? 0) >= 5 && (
                  <div className="bg-amber-50 border border-amber-100 rounded-lg p-2 text-[11px] text-amber-800 font-semibold">
                    Stuck in “In Progress” for {t.daysInStatus} days
                  </div>
                )}

                {/* Blocked info */}
                {t.isBlocked && (
                  <div className="bg-red-50 border border-red-100 rounded-lg p-2 space-y-1 text-[11px]">
                    <div className="flex items-center gap-1 text-red-700 font-bold uppercase tracking-wider text-[10px]">
                      <ShieldAlert size={12} />
                      <span>Blocked</span>
                    </div>
                    <p className="text-red-600 font-semibold">{t.blockedReason}</p>
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-gray-100 font-medium">
                  <div className="flex items-center gap-1">
                    <Calendar size={12} className={cn(isTaskOverdue ? "text-red-500" : "text-gray-400")} />
                    {isTaskOverdue ? (
                      <span className="text-red-500 font-semibold">
                        Overdue by {overdueDays} day{overdueDays > 1 ? "s" : ""}
                      </span>
                    ) : (
                      <span>Due {t.due}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase",
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
                        "text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase",
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
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
