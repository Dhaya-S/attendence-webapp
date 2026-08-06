import React, { useState, useEffect } from "react";
import { TeamTask } from "../types";
import { TaskBoard } from "../components/Board/task-board";
import { BoardInsightsPanel } from "../components/Board/board-insights-panel";
import { TaskFilters } from "../components/Board/TaskFilters";
import { CreateTaskDrawer } from "../components/create-task-drawer";
import { TaskDetailsDrawer } from "../components/task-details-drawer";
import { Avt } from "@/shared/components";
import { EMP_COLORS } from "@/shared/constants/colors";
import { cn } from "@/shared/utils";
import { useAuth } from "@/shared/context/AuthContext";
import { db } from "@/shared/utils/firebase";
import { collection, onSnapshot, setDoc, doc } from "firebase/firestore";

interface TasksPageProps {
  navigate: (p: any, emp?: any, tabOrSection?: string) => void;
  tasks?: TeamTask[];
  setTasks?: React.Dispatch<React.SetStateAction<TeamTask[]>>;
  activeTab?: string;
  
  // AppShell controls
  search?: string;
  showTasksFilter?: boolean;
  setShowTasksFilter?: (b: boolean) => void;
  boardInsightsOpen?: boolean;
  setBoardInsightsOpen?: (b: boolean) => void;
  showCreateTask?: boolean;
  setShowCreateTask?: (b: boolean) => void;
}

function sanitizeDoc(obj: any): any {
  if (!obj) return obj;
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch (_) {
    return obj;
  }
}

export function TasksPage({
  navigate,
  tasks: tasksProp,
  setTasks: setTasksProp,
  activeTab = "Board",
  search = "",
  showTasksFilter = false,
  setShowTasksFilter = () => {},
  boardInsightsOpen = false,
  setBoardInsightsOpen = () => {},
  showCreateTask = false,
  setShowCreateTask = () => {},
}: TasksPageProps) {
  const { companyId, displayName, user } = useAuth();
  const targetCompanyId = companyId && companyId !== "default" ? companyId : "default";

  const [realtimeTasks, setRealtimeTasks] = useState<TeamTask[]>([]);

  // Real-Time Firestore Listener for organizations/{companyId}/tasks
  useEffect(() => {
    const colRef = collection(db, "organizations", targetCompanyId, "tasks");
    const unsub = onSnapshot(
      colRef,
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as TeamTask[];
        setRealtimeTasks(list);
      },
      (err) => {
        console.warn("Error listening to tasks in real-time:", err);
      }
    );
    return () => unsub();
  }, [targetCompanyId]);

  const tasks = tasksProp || realtimeTasks;

  const setTasks: React.Dispatch<React.SetStateAction<TeamTask[]>> =
    setTasksProp ||
    ((action) => {
      setRealtimeTasks((prev) => {
        const next = typeof action === "function" ? action(prev) : action;
        next.forEach((t) => {
          const prevTask = prev.find((p) => p.id === t.id);
          if (!prevTask || JSON.stringify(prevTask) !== JSON.stringify(t)) {
            const cleanT = sanitizeDoc(t);
            setDoc(doc(db, "organizations", targetCompanyId, "tasks", t.id), cleanT).catch(() => {});
            if (targetCompanyId !== "default") {
              setDoc(doc(db, "organizations", "default", "tasks", t.id), cleanT).catch(() => {});
            }
          }
        });
        return next;
      });
    });

  const [selectedTask, setSelectedTask] = useState<TeamTask | null>(null);

  // Filter states
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dueDateFilter, setDueDateFilter] = useState("All");
  const [deptFilter, setDeptFilter] = useState("All");
  const [reporterFilter, setReporterFilter] = useState("All");
  const [assigneeFilter, setAssigneeFilter] = useState("All");
  const [labelFilter, setLabelFilter] = useState("All");
  const [archivedFilter, setArchivedFilter] = useState("All");

  // Dynamic filter options based on tasks
  const depts = Array.from(new Set(tasks.map((t) => t.dept).filter(Boolean))).sort();
  const assignees = Array.from(new Set(tasks.map((t) => t.assignee).filter(Boolean))).sort();
  const reporters = Array.from(new Set(tasks.map((t) => t.reporterName).filter(Boolean))).sort();
  const labels = Array.from(new Set(tasks.flatMap((t) => t.labels || []).filter(Boolean))).sort();

  // Helper function to detect overdue tasks
  const isTaskOverdue = (t: TeamTask) => {
    if (t.status === "Done" || t.status === "Archived") return false;
    if (!t.dueDate) return false;
    const today = new Date("2026-07-05");
    today.setHours(0, 0, 0, 0);
    const due = new Date(t.dueDate);
    return due < today;
  };

  // Shared filtering logic for List and Calendar views
  const getFilteredTasks = () => {
    let filtered = tasks;

    // Filter by Priority
    if (priorityFilter && priorityFilter !== "All") {
      filtered = filtered.filter((t) => t.priority === priorityFilter);
    }

    // Filter by Dept
    if (deptFilter && deptFilter !== "All") {
      filtered = filtered.filter((t) => t.dept === deptFilter);
    }

    // Filter by Status
    if (statusFilter && statusFilter !== "All") {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }

    // Filter by Reporter
    if (reporterFilter && reporterFilter !== "All") {
      filtered = filtered.filter((t) => t.reporterId === reporterFilter || t.reporterName === reporterFilter);
    }

    // Filter by Assignee
    if (assigneeFilter && assigneeFilter !== "All") {
      filtered = filtered.filter((t) => t.assigneeId === assigneeFilter || t.assigneeName === assigneeFilter || t.assignee === assigneeFilter);
    }

    // Filter by Label
    if (labelFilter && labelFilter !== "All") {
      filtered = filtered.filter((t) => t.labels && t.labels.includes(labelFilter));
    }

    // Filter by Due Date
    if (dueDateFilter && dueDateFilter !== "All") {
      const today = new Date("2026-07-05");
      today.setHours(0, 0, 0, 0);

      filtered = filtered.filter((t) => {
        if (!t.dueDate) return false;
        const due = new Date(t.dueDate);
        due.setHours(0, 0, 0, 0);

        if (dueDateFilter === "Overdue") {
          return due < today && t.status !== "Done" && t.status !== "Archived";
        }
        if (dueDateFilter === "Due Today") {
          return due.getTime() === today.getTime();
        }
        if (dueDateFilter === "Due This Week") {
          const diffDays = (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
          return diffDays >= 0 && diffDays <= 7;
        }
        return true;
      });
    }

    // Filter by Archive State
    if (archivedFilter && archivedFilter !== "All") {
      if (archivedFilter === "Active Only") {
        filtered = filtered.filter((t) => t.status !== "Archived");
      } else if (archivedFilter === "Archived Only") {
        filtered = filtered.filter((t) => t.status === "Archived");
      }
    }

    // Filter based on Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.assignee.toLowerCase().includes(q) ||
          (t.labels && t.labels.some((l) => l.toLowerCase().includes(q)))
      );
    }

    return filtered;
  };

  const filteredTasksList = getFilteredTasks();

  return (
    <div className="flex flex-col h-full bg-[#F7F8FA] overflow-hidden relative">
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === "List" ? (
          <TaskListView tasks={filteredTasksList} setSelectedTask={setSelectedTask} />
        ) : activeTab === "Calendar" ? (
          <TaskCalendarView tasks={filteredTasksList} setSelectedTask={setSelectedTask} isTaskOverdue={isTaskOverdue} />
        ) : (
          <TaskBoard
            search={search}
            setSelectedTask={setSelectedTask}
            tasks={tasks}
            setTasks={setTasks}
            priorityFilter={priorityFilter}
            deptFilter={deptFilter}
            statusFilter={statusFilter}
            dueDateFilter={dueDateFilter}
            reporterFilter={reporterFilter}
            labelFilter={labelFilter}
            archivedFilter={archivedFilter}
          />
        )}
      </div>

      {/* Task Details Drawer */}
      <TaskDetailsDrawer
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        task={selectedTask}
        onUpdateTask={(updatedTask) => {
          setTasks((prev) =>
            prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
          );
          setSelectedTask(updatedTask);
        }}
      />

      {/* Create Task Drawer */}
      <CreateTaskDrawer
        isOpen={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        onCreate={async (taskData) => {
          const newTaskId = `TT_${Date.now()}`;
          const taskIndex = tasks.length + 1;
          const authorName = displayName || user?.displayName || "Alex Admin";
          const newTask: TeamTask = {
            ...taskData,
            id: newTaskId,
            key: `TASK-${taskIndex}`,
            createdAt: new Date().toISOString(),
            originalEstimateMinutes: 0,
            totalLoggedMinutes: 0,
            remainingEstimateMinutes: 0,
            comments: [],
            workLogs: [],
            activity: [
              {
                id: `act-${Date.now()}`,
                taskId: newTaskId,
                userId: user?.uid || "E004",
                userName: authorName,
                userInitials: authorName.slice(0, 2).toUpperCase(),
                type: "created",
                details: `Task created by ${authorName}`,
                createdAt: new Date().toISOString(),
              },
            ],
          };
          setTasks((prev) => [newTask, ...prev]);
          setShowCreateTask(false);

          // Real-Time persistence to Firestore
          const cleanNewTask = sanitizeDoc(newTask);
          await setDoc(doc(db, "organizations", targetCompanyId, "tasks", newTaskId), cleanNewTask);
          if (targetCompanyId !== "default") {
            try {
              await setDoc(doc(db, "organizations", "default", "tasks", newTaskId), cleanNewTask);
            } catch (_) {}
          }
        }}
      />

      {/* Task Filters Modal */}
      <TaskFilters
        isOpen={showTasksFilter}
        onClose={() => setShowTasksFilter(false)}
        mode="all"
        priorityFilter={priorityFilter}
        setPriorityFilter={setPriorityFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        dueDateFilter={dueDateFilter}
        setDueDateFilter={setDueDateFilter}
        deptFilter={deptFilter}
        setDeptFilter={setDeptFilter}
        reporterFilter={reporterFilter}
        setReporterFilter={setReporterFilter}
        assigneeFilter={assigneeFilter}
        setAssigneeFilter={setAssigneeFilter}
        labelFilter={labelFilter}
        setLabelFilter={setLabelFilter}
        archivedFilter={archivedFilter}
        setArchivedFilter={setArchivedFilter}
        depts={depts}
        reporters={reporters}
        assignees={assignees}
        labels={labels}
      />

      {/* Board Insights Right Panel */}
      <BoardInsightsPanel
        isOpen={boardInsightsOpen}
        onClose={() => setBoardInsightsOpen(false)}
        tasks={tasks}
        onSelectTask={setSelectedTask}
      />
    </div>
  );
}

// ── SUB-COMPONENTS ────────────────────────────────────────────────────────────

function TaskListView({
  tasks,
  setSelectedTask,
}: {
  tasks: TeamTask[];
  setSelectedTask: (t: TeamTask) => void;
}) {
  return (
    <div className="flex-1 overflow-auto p-6 text-left">
      <div className="bg-white rounded-2xl border border-[#E8E9ED] overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#F8FAFC] border-b border-[#E8E9ED] text-[#4A4E57] font-semibold uppercase tracking-wider">
              <th className="py-3.5 px-5">Key</th>
              <th className="py-3.5 px-5">Title</th>
              <th className="py-3.5 px-5">Status</th>
              <th className="py-3.5 px-5">Priority</th>
              <th className="py-3.5 px-5">Assignee</th>
              <th className="py-3.5 px-5">Due Date</th>
              <th className="py-3.5 px-5">Progress</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8E9ED] text-[#16181D]">
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-gray-400 italic font-semibold">
                  No tasks found
                </td>
              </tr>
            ) : (
              tasks.map((t) => {
                const initials = t.assignee
                  ? t.assignee.split(" ").map((n) => n[0]).join("").toUpperCase()
                  : "UN";
                const charSum = t.assignee
                  ? t.assignee.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
                  : 0;
                const avColor = EMP_COLORS[charSum % EMP_COLORS.length];
                
                // Progress
                const progress = t.status === "Done" ? 100 : t.status === "In Progress" ? 50 : 0;

                return (
                  <tr
                    key={t.id}
                    onClick={() => setSelectedTask(t)}
                    className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                  >
                    <td className="py-4 px-5 font-mono text-[11px] text-gray-400 font-bold">{t.key || t.id}</td>
                    <td className="py-4 px-5 font-bold text-gray-900">{t.title}</td>
                    <td className="py-4 px-5">
                      <span className={cn(
                        "text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider",
                        t.status === "Done" ? "bg-green-50 text-green-700 border border-green-100" :
                        t.status === "In Progress" ? "bg-blue-50 text-blue-700 border border-blue-100" : "bg-gray-100 text-gray-500"
                      )}>
                        {t.status === "Done" ? "Completed" : t.status || "Todo"}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <span className={cn(
                        "text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider",
                        t.priority === "High" ? "bg-red-50 text-red-600 border border-red-100" :
                        t.priority === "Medium" ? "bg-amber-50 text-amber-600 border border-amber-100" : "bg-gray-55 text-gray-500 border border-gray-150"
                      )}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2">
                        <Avt initials={initials} color={avColor} size="sm" className="w-5 h-5" />
                        <span className="font-semibold text-gray-700">{t.assignee}</span>
                      </div>
                    </td>
                    <td className="py-4 px-5 font-medium text-gray-500">{t.due || "Jul 8"}</td>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div className={cn("h-full rounded-full", t.status === "Done" ? "bg-green-500" : "bg-[#5C5CFF]")} style={{ width: `${progress}%` }} />
                        </div>
                        <span className="font-semibold text-gray-400">{progress}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TaskCalendarView({
  tasks,
  setSelectedTask,
  isTaskOverdue,
}: {
  tasks: TeamTask[];
  setSelectedTask: (t: TeamTask) => void;
  isTaskOverdue: (t: TeamTask) => boolean;
}) {
  const daysInMonth = 31;
  const startDayOffset = 3; // Wednesday (0=Sun, 1=Mon, 2=Tue, 3=Wed)
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDayOffset; i++) {
    cells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(d);
  }

  const getTasksForDay = (day: number) => {
    const dateStr = `2026-07-${String(day).padStart(2, "0")}`;
    return tasks.filter((t) => t.dueDate === dateStr || (t.due && t.due.includes(`Jul ${day}`)));
  };

  return (
    <div className="flex-1 overflow-auto p-6 flex flex-col text-left">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">July 2026</h3>
      </div>
      <div className="bg-white rounded-2xl border border-[#E8E9ED] overflow-hidden shadow-sm flex-1 flex flex-col min-h-[480px]">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-[#E8E9ED] bg-[#F8FAFC]">
          {weekdays.map((w) => (
            <div key={w} className="py-2.5 text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider border-r border-[#E8E9ED] last:border-r-0">
              {w}
            </div>
          ))}
        </div>
        {/* Calendar days grid */}
        <div className="grid grid-cols-7 grid-rows-5 flex-1 divide-x divide-y divide-[#E8E9ED]">
          {cells.map((day, idx) => {
            const dayTasks = day ? getTasksForDay(day) : [];
            const isToday = day === 5; // Reference date 2026-07-05
            return (
              <div
                key={idx}
                className={cn(
                  "p-2 flex flex-col gap-1 min-h-[90px] hover:bg-gray-55/30 transition-colors border-r border-b border-[#E8E9ED] last:border-r-0",
                  !day && "bg-gray-50/10",
                  isToday && "bg-[#5C5CFF]/5"
                )}
              >
                {day && (
                  <div className="flex justify-between items-center">
                    <span className={cn(
                      "text-xs font-bold font-mono p-1 rounded-full w-6 h-6 flex items-center justify-center",
                      isToday ? "bg-[#5C5CFF] text-white" : "text-gray-700"
                    )}>
                      {day}
                    </span>
                    {dayTasks.length > 0 && (
                      <span className="text-[9px] font-bold text-[#5C5CFF] bg-[#EEF2FF] px-1.5 py-0.5 rounded-full">
                        {dayTasks.length} {dayTasks.length === 1 ? "task" : "tasks"}
                      </span>
                    )}
                  </div>
                )}
                <div className="flex-1 overflow-y-auto space-y-1 mt-1 scrollbar-none">
                  {dayTasks.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTask(t)}
                      className={cn(
                        "text-[9px] font-bold p-1 rounded bg-white border border-gray-150 hover:border-[#5C5CFF]/45 hover:shadow-sm cursor-pointer transition-all truncate text-left",
                        t.status === "Done" && "line-through text-gray-400 opacity-60"
                      )}
                      title={t.title}
                    >
                      {t.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
