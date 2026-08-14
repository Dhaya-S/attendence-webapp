import React, { useState } from "react";
import { TeamTask } from "../types";
import { TaskBoard } from "../components/Board/task-board";
import { TaskFilters } from "../components/Board/TaskFilters";
import { CreateTaskDrawer } from "../components/create-task-drawer";
import { TaskDetailsDrawer } from "../components/task-details-drawer";
import { useAuth } from "@/shared/context/AuthContext";
import { db } from "@/shared/utils/firebase";
import { doc, updateDoc } from "firebase/firestore";

interface MyTasksPageProps {
  navigate: (p: any, emp?: any, tabOrSection?: string) => void;
  tasks: TeamTask[];
  setTasks: React.Dispatch<React.SetStateAction<TeamTask[]>>;
  currentUser: { name: string; id: string; initials?: string };
  
  search?: string;
  showTasksFilter?: boolean;
  setShowTasksFilter?: (b: boolean) => void;
  showCreateTask?: boolean;
  setShowCreateTask?: (b: boolean) => void;
}

export function MyTasksPage({
  navigate,
  tasks,
  setTasks,
  currentUser,
  search = "",
  showTasksFilter = false,
  setShowTasksFilter = () => {},
  showCreateTask = false,
  setShowCreateTask = () => {},
}: MyTasksPageProps) {
  const [selectedTask, setSelectedTask] = useState<TeamTask | null>(null);

  const { companyId } = useAuth();
  const targetCompanyId = companyId && companyId !== "default" ? companyId : "default";

  // State for filters
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dueDateFilter, setDueDateFilter] = useState("All");

  return (
    <div className="flex flex-col h-full bg-[#F7F8FA] overflow-hidden relative">
      <div className="flex-1 overflow-hidden">
        <TaskBoard
          search={search}
          setSelectedTask={setSelectedTask}
          tasks={tasks}
          setTasks={setTasks}
          assigneeFilter={currentUser.name} // Display only tasks assigned to the logged-in user
          priorityFilter={priorityFilter}
          statusFilter={statusFilter}
          dueDateFilter={dueDateFilter}
        />
      </div>

      {/* Task Details Drawer */}
      <TaskDetailsDrawer
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        task={selectedTask}
        onUpdateTask={async (updatedTask) => {
          setTasks((prev) =>
            prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
          );
          setSelectedTask(updatedTask);
          try {
            await updateDoc(doc(db, "organizations", targetCompanyId, "tasks", updatedTask.id), updatedTask as any);
          } catch (err) {
            console.error("Failed to save task update:", err);
          }
        }}
      />

      {/* Create Task Drawer */}
      <CreateTaskDrawer
        isOpen={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        onCreate={(taskData) => {
          const newTaskId = `TT${Date.now()}`;
          const taskIndex = tasks.length + 1;
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
                userId: currentUser.id,
                userName: currentUser.name,
                userInitials: currentUser.initials || "UN",
                type: "created",
                details: `Task created by ${currentUser.name}`,
                createdAt: new Date().toISOString(),
              },
            ],
          };
          setTasks((prev) => [newTask, ...prev]);
          setShowCreateTask(false);
        }}
      />

      {/* Task Filters Modal (Personal Mode) */}
      <TaskFilters
        isOpen={showTasksFilter}
        onClose={() => setShowTasksFilter(false)}
        mode="personal"
        priorityFilter={priorityFilter}
        setPriorityFilter={setPriorityFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        dueDateFilter={dueDateFilter}
        setDueDateFilter={setDueDateFilter}
      />
    </div>
  );
}
