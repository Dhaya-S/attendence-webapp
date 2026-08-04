import React, { useState } from "react";
import {
  Plus,
  MoreHorizontal,
  Play,
  CheckCircle,
  Circle,
  Trash2,
  Check,
} from "lucide-react";
import { AppPage } from "@/shared/types";
import { cn } from "@/shared/utils";
import {
  Btn,
  InputField,
  SelectField,
  Modal,
  Avt,
} from "@/shared/components";
import { EMP_COLORS } from "@/shared/constants/colors";

export function TasksPage({ navigate }: { navigate: (p: AppPage) => void }) {
  const [filter, setFilter] = useState("All");
  const [tasks, setTasks] = useState([
    {
      id: "T001",
      title: "Review Q2 attendance report",
      assignee: "Alex Admin",
      dept: "HR",
      priority: "High",
      due: "Jul 3, 2024",
      status: "In Progress",
    },
    {
      id: "T002",
      title: "Update leave policy for FY2025",
      assignee: "Aisha Thompson",
      dept: "HR",
      priority: "High",
      due: "Jul 5, 2024",
      status: "Todo",
    },
    {
      id: "T003",
      title: "Onboard 3 new engineering hires",
      assignee: "David Chen",
      dept: "Engineering",
      priority: "Medium",
      due: "Jul 8, 2024",
      status: "Todo",
    },
    {
      id: "T004",
      title: "Prepare department headcount report",
      assignee: "Jennifer Walsh",
      dept: "Finance",
      priority: "Medium",
      due: "Jul 10, 2024",
      status: "In Progress",
    },
    {
      id: "T005",
      title: "Configure geo-fence for Austin office",
      assignee: "Alex Admin",
      dept: "Operations",
      priority: "Low",
      due: "Jul 15, 2024",
      status: "Todo",
    },
    {
      id: "T006",
      title: "Send welcome email to new joiners",
      assignee: "Aisha Thompson",
      dept: "HR",
      priority: "Low",
      due: "Jul 1, 2024",
      status: "Done",
    },
    {
      id: "T007",
      title: "Audit access roles for Finance team",
      assignee: "Alex Admin",
      dept: "Security",
      priority: "High",
      due: "Jul 2, 2024",
      status: "Done",
    },
  ]);
  const [showCreate, setShowCreate] = useState(false);
  const [taskMenu, setTaskMenu] = useState<string | null>(null);
  const deleteTask = (id: string) => setTasks((ts) => ts.filter((t) => t.id !== id));
  const setTaskStatus = (id: string, status: string) =>
    setTasks((ts) =>
      ts.map((t) => (t.id === id ? { ...t, status } : t))
    );

  const toggleDone = (id: string) =>
    setTasks((ts) =>
      ts.map((t) =>
        t.id === id ? { ...t, status: t.status === "Done" ? "Todo" : "Done" } : t
      )
    );
  const filtered = filter === "All" ? tasks : tasks.filter((t) => t.status === filter);

  const priorityColor: Record<string, string> = {
    High: "text-red-600 bg-red-50",
    Medium: "text-amber-600 bg-amber-50",
    Low: "text-gray-555 bg-gray-100",
  };
  const statusColor: Record<string, string> = {
    Todo: "text-gray-555 bg-gray-100",
    "In Progress": "text-blue-600 bg-blue-50",
    Done: "text-green-700 bg-green-50",
  };

  return (
    <div className="flex flex-col h-full text-left">
      <div className="bg-white border-b border-gray-200 px-6 pt-5 pb-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Tasks</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {tasks.filter((t) => t.status !== "Done").length} open ·{" "}
              {tasks.filter((t) => t.status === "Done").length} completed
            </p>
          </div>
          <Btn onClick={() => setShowCreate(true)}>
            <Plus size={14} />
            Create Task
          </Btn>
        </div>
        <div className="flex items-center gap-1 pb-3">
          {["All", "Todo", "In Progress", "Done"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer",
                filter === f ? "bg-[#5C5CFF] text-white" : "text-gray-600 hover:bg-gray-100"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {[
                  "Task",
                  "Assignee",
                  "Department",
                  "Priority",
                  "Due Date",
                  "Status",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((t) => (
                <tr
                  key={t.id}
                  className={cn(
                    "hover:bg-gray-50 transition-colors",
                    t.status === "Done" && "opacity-60"
                  )}
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={t.status === "Done"}
                        onChange={() => toggleDone(t.id)}
                        className="rounded border-gray-300 accent-[#5C5CFF] flex-shrink-0 cursor-pointer"
                      />
                      <span
                        className={cn(
                          "font-medium text-gray-800",
                          t.status === "Done" && "line-through text-gray-400"
                        )}
                      >
                        {t.title}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <Avt
                        initials={t.assignee
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                        color={
                          EMP_COLORS[
                            parseInt(t.id.slice(-1)) % EMP_COLORS.length
                          ]
                        }
                        size="sm"
                      />
                      <span className="text-gray-600 text-xs">{t.assignee}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-505 text-xs">{t.dept}</td>
                  <td className="px-5 py-3">
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded text-xs font-medium",
                        priorityColor[t.priority]
                      )}
                    >
                      {t.priority}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-505 text-xs">{t.due}</td>
                  <td className="px-5 py-3">
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded text-xs font-medium",
                        statusColor[t.status]
                      )}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 relative">
                    <button
                      onClick={() => setTaskMenu(taskMenu === t.id ? null : t.id)}
                      className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 cursor-pointer"
                    >
                      <MoreHorizontal size={14} />
                    </button>
                    {taskMenu === t.id && (
                      <div
                        className="absolute right-5 top-full z-30 mt-1 w-44 bg-white rounded-xl border border-gray-200 shadow-lg py-1"
                        onClick={() => setTaskMenu(null)}
                      >
                        <button
                          onClick={() => setTaskStatus(t.id, "In Progress")}
                          className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                        >
                          <Play size={11} className="text-blue-500" />
                          Mark In Progress
                        </button>
                        <button
                          onClick={() => setTaskStatus(t.id, "Done")}
                          className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                        >
                          <CheckCircle size={11} className="text-green-500" />
                          Mark Done
                        </button>
                        <button
                          onClick={() => setTaskStatus(t.id, "Todo")}
                          className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                        >
                          <Circle size={11} className="text-gray-400" />
                          Reset to Todo
                        </button>
                        <div className="border-t border-gray-100 my-1" />
                        <button
                          onClick={() => deleteTask(t.id)}
                          className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                        >
                          <Trash2 size={11} />
                          Delete Task
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && (
        <Modal title="Create Task" onClose={() => setShowCreate(false)}>
          <div className="space-y-4">
            <InputField
              label="Task Title"
              placeholder="Describe the task…"
              required
            />
            <SelectField
              label="Assignee"
              options={[
                "Alex Admin",
                "Aisha Thompson",
                "David Chen",
                "Jennifer Walsh",
                "Marcus Johnson",
              ]}
            />
            <div className="grid grid-cols-2 gap-4">
              <SelectField label="Priority" options={["High", "Medium", "Low"]} />
              <InputField label="Due Date" type="date" />
            </div>
            <SelectField
              label="Department"
              options={[
                "HR",
                "Engineering",
                "Finance",
                "Marketing",
                "Sales",
                "Design",
                "Legal",
                "Operations",
              ]}
            />
            <InputField label="Description" placeholder="Optional notes…" />
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Btn variant="outline" onClick={() => setShowCreate(false)}>
                Cancel
              </Btn>
              <Btn onClick={() => setShowCreate(false)}>
                <Check size={14} />
                Create Task
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
