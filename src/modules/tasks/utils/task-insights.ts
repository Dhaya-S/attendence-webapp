import { TeamTask } from "../types";

export interface TaskInsights {
  totalTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  completedTasks: number;
  dueTasks: TeamTask[];
  stuckTasks: TeamTask[];
  blockedTasks: TeamTask[];
  flaggedTasks: TeamTask[];
  priorityBreakdown: {
    High: number;
    Medium: number;
    Low: number;
  };
  completionPercentage: number;
  upcomingDeadlines: TeamTask[];
  timeInStatus: {
    Todo: { count: number; avgDays: number };
    "In Progress": { count: number; avgDays: number };
    Review: { count: number; avgDays: number };
    Done: { count: number; avgDays: number };
  };
}

const REFERENCE_DATE = new Date("2026-07-05");
const STUCK_THRESHOLD_DAYS = 5;

export function deriveTaskInsights(tasks: TeamTask[] = []): TaskInsights {
  const safeTasks = tasks || [];
  const totalTasks = safeTasks.length;
  const inProgressTasks = safeTasks.filter(t => t.status === "In Progress").length;
  
  // Overdue = tasks where dueDate < current date AND task is not Completed
  const overdueTasks = safeTasks.filter(t => {
    if (t.status === "Done") return false;
    const dueTime = new Date(t.dueDate).getTime();
    return dueTime < REFERENCE_DATE.getTime();
  }).length;

  const completedTasks = safeTasks.filter(t => t.status === "Done").length;

  // Due soon/overdue tasks: overdue or due today/approaching (within 3 days)
  const dueTasksList = safeTasks.filter(t => {
    if (t.status === "Done") return false;
    const dueTime = new Date(t.dueDate).getTime();
    const diffTime = dueTime - REFERENCE_DATE.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3; // Overdue, due today, or due in next 3 days
  }).sort((a, b) => {
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  // Stuck tasks: status = In Progress AND daysInStatus >= STUCK_THRESHOLD_DAYS
  const stuckTasksList = safeTasks.filter(t => {
    return t.status === "In Progress" && (t.daysInStatus ?? 0) >= STUCK_THRESHOLD_DAYS;
  });

  // Blocked tasks
  const blockedTasksList = safeTasks.filter(t => !!t.isBlocked);

  // Flagged tasks
  const flaggedTasksList = safeTasks.filter(t => !!t.isFlagged);

  // Priority Breakdown
  const priorityBreakdown = {
    High: safeTasks.filter(t => t.priority === "High").length,
    Medium: safeTasks.filter(t => t.priority === "Medium").length,
    Low: safeTasks.filter(t => t.priority === "Low").length,
  };

  // Completion Percentage
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Upcoming Deadlines: nearest 3-5 incomplete tasks sorted by due date
  const upcomingDeadlines = safeTasks
    .filter(t => t.status !== "Done")
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 4);

  // Time in Status calculation
  const statusHistorySum = {
    Todo: { sum: 0, count: 0 },
    "In Progress": { sum: 0, count: 0 },
    Review: { sum: 0, count: 0 },
    Done: { sum: 0, count: 0 },
  };

  safeTasks.forEach(t => {
    if (t.statusHistory) {
      if (t.statusHistory.Todo !== undefined) {
        statusHistorySum.Todo.sum += t.statusHistory.Todo;
        statusHistorySum.Todo.count += 1;
      }
      if (t.statusHistory["In Progress"] !== undefined) {
        statusHistorySum["In Progress"].sum += t.statusHistory["In Progress"];
        statusHistorySum["In Progress"].count += 1;
      }
      if (t.statusHistory.Review !== undefined) {
        statusHistorySum.Review.sum += t.statusHistory.Review;
        statusHistorySum.Review.count += 1;
      }
      if (t.statusHistory.Done !== undefined) {
        statusHistorySum.Done.sum += t.statusHistory.Done;
        statusHistorySum.Done.count += 1;
      }
    }
  });

  const getAvg = (sum: number, count: number) => (count > 0 ? Math.round((sum / count) * 10) / 10 : 0);

  const timeInStatus = {
    Todo: { count: statusHistorySum.Todo.count, avgDays: getAvg(statusHistorySum.Todo.sum, statusHistorySum.Todo.count) },
    "In Progress": { count: statusHistorySum["In Progress"].count, avgDays: getAvg(statusHistorySum["In Progress"].sum, statusHistorySum["In Progress"].count) },
    Review: { count: statusHistorySum.Review.count, avgDays: getAvg(statusHistorySum.Review.sum, statusHistorySum.Review.count) },
    Done: { count: statusHistorySum.Done.count, avgDays: getAvg(statusHistorySum.Done.sum, statusHistorySum.Done.count) },
  };

  return {
    totalTasks,
    inProgressTasks,
    overdueTasks,
    completedTasks,
    dueTasks: dueTasksList,
    stuckTasks: stuckTasksList,
    blockedTasks: blockedTasksList,
    flaggedTasks: flaggedTasksList,
    priorityBreakdown,
    completionPercentage,
    upcomingDeadlines,
    timeInStatus,
  };
}

export function getOverdueDays(dueDateStr: string): number {
  const due = new Date(dueDateStr);
  const diffTime = REFERENCE_DATE.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}
