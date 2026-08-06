import React from "react";
import { InputField, SelectField } from "@/shared/components";
import { AssigneeSelector } from "./assignee-selector";
import { LabelsSelector } from "./labels-selector";
import { TaskStatus } from "../types";

interface TaskFormProps {
  title: string;
  setTitle: (val: string) => void;
  description: string;
  setDescription: (val: string) => void;
  status: TaskStatus;
  setStatus: (val: TaskStatus) => void;
  priority: "High" | "Medium" | "Low";
  setPriority: (val: "High" | "Medium" | "Low") => void;
  assignee: { id: string; name: string; email: string } | null;
  setAssignee: (val: { id: string; name: string; email: string } | null) => void;
  labels: string[];
  setLabels: (val: string[]) => void;
  startDate: string;
  setStartDate: (val: string) => void;
  dueDate: string;
  setDueDate: (val: string) => void;
}

export function TaskForm({
  title,
  setTitle,
  description,
  setDescription,
  status,
  setStatus,
  priority,
  setPriority,
  assignee,
  setAssignee,
  labels,
  setLabels,
  startDate,
  setStartDate,
  dueDate,
  setDueDate,
}: TaskFormProps) {
  return (
    <div className="space-y-4">
      <InputField
        label="Task Title *"
        placeholder="What needs to be done?"
        value={title}
        onChange={(v) => setTitle(v)}
        required
      />

      <div className="space-y-1">
        <label className="block text-xs font-semibold text-gray-700">Description</label>
        <textarea
          placeholder="Add description..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full min-h-[100px] p-3 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#5C5CFF]"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <SelectField
          label="Status"
          value={status}
          onChange={(v) => setStatus(v as TaskStatus)}
        >
          <option value="Todo">To Do</option>
          <option value="In Progress">In Progress</option>
          <option value="Done">Completed</option>
          <option value="Archived">Archived</option>
        </SelectField>

        <SelectField
          label="Priority"
          value={priority}
          onChange={(v) => setPriority(v as any)}
        >
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </SelectField>
      </div>

      <AssigneeSelector
        selectedAssigneeId={assignee?.id}
        selectedAssigneeEmail={assignee?.email}
        onSelect={(val) => setAssignee(val)}
      />

      <LabelsSelector selectedLabels={labels} onChange={setLabels} />

      <div className="grid grid-cols-2 gap-3">
        <InputField
          label="Start Date"
          type="date"
          value={startDate}
          onChange={(v) => setStartDate(v)}
        />
        <InputField
          label="Due Date"
          type="date"
          value={dueDate}
          onChange={(v) => setDueDate(v)}
        />
      </div>
    </div>
  );
}
