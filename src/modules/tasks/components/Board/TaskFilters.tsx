import React from "react";
import { Modal, SelectField, Btn } from "@/shared/components";

interface TaskFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: "all" | "personal";
  
  // Filter states
  priorityFilter: string;
  setPriorityFilter: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  dueDateFilter: string;
  setDueDateFilter: (val: string) => void;
  
  // Org-only filter states
  deptFilter?: string;
  setDeptFilter?: (val: string) => void;
  reporterFilter?: string;
  setReporterFilter?: (val: string) => void;
  assigneeFilter?: string;
  setAssigneeFilter?: (val: string) => void;
  labelFilter?: string;
  setLabelFilter?: (val: string) => void;
  archivedFilter?: string;
  setArchivedFilter?: (val: string) => void;

  // Options lists
  depts?: string[];
  reporters?: string[];
  assignees?: string[];
  labels?: string[];
}

export function TaskFilters({
  isOpen,
  onClose,
  mode = "all",
  priorityFilter,
  setPriorityFilter,
  statusFilter,
  setStatusFilter,
  dueDateFilter,
  setDueDateFilter,
  deptFilter = "All",
  setDeptFilter = () => {},
  reporterFilter = "All",
  setReporterFilter = () => {},
  assigneeFilter = "All",
  setAssigneeFilter = () => {},
  labelFilter = "All",
  setLabelFilter = () => {},
  archivedFilter = "All",
  setArchivedFilter = () => {},
  depts = [],
  reporters = [],
  assignees = [],
  labels = [],
}: TaskFiltersProps) {
  if (!isOpen) return null;

  const priorities = ["All", "High", "Medium", "Low"];
  const statuses = ["All", "Todo", "In Progress", "Overdue", "Done", "Archived"];
  const dueDates = ["All", "Overdue", "Due Today", "Due This Week"];
  const archivedOptions = ["All", "Active Only", "Archived Only"];

  const handleReset = () => {
    setPriorityFilter("All");
    setStatusFilter("All");
    setDueDateFilter("All");
    if (mode === "all") {
      setDeptFilter("All");
      setReporterFilter("All");
      setAssigneeFilter("All");
      setLabelFilter("All");
      setArchivedFilter("All");
    }
    onClose();
  };

  return (
    <Modal title="Task Filters" onClose={onClose} width="max-w-md">
      <div className="space-y-4 p-1 text-left">
        <SelectField
          label="Priority"
          options={priorities}
          value={priorityFilter}
          onChange={(v: any) => setPriorityFilter(typeof v === "string" ? v : v?.target?.value || "All")}
        />
        
        <SelectField
          label="Status"
          options={statuses}
          value={statusFilter}
          onChange={(v: any) => setStatusFilter(typeof v === "string" ? v : v?.target?.value || "All")}
        />

        <SelectField
          label="Due Date"
          options={dueDates}
          value={dueDateFilter}
          onChange={(v: any) => setDueDateFilter(typeof v === "string" ? v : v?.target?.value || "All")}
        />

        {mode === "all" && (
          <>
            <SelectField
              label="Department"
              options={["All", ...depts]}
              value={deptFilter}
              onChange={(v: any) => setDeptFilter(typeof v === "string" ? v : v?.target?.value || "All")}
            />

            <SelectField
              label="Reporter"
              options={["All", ...reporters]}
              value={reporterFilter}
              onChange={(v: any) => setReporterFilter(typeof v === "string" ? v : v?.target?.value || "All")}
            />

            <SelectField
              label="Assignee"
              options={["All", ...assignees]}
              value={assigneeFilter}
              onChange={(v: any) => setAssigneeFilter(typeof v === "string" ? v : v?.target?.value || "All")}
            />

            <SelectField
              label="Label"
              options={["All", ...labels]}
              value={labelFilter}
              onChange={(v: any) => setLabelFilter(typeof v === "string" ? v : v?.target?.value || "All")}
            />

            <SelectField
              label="Archive State"
              options={archivedOptions}
              value={archivedFilter}
              onChange={(v: any) => setArchivedFilter(typeof v === "string" ? v : v?.target?.value || "All")}
            />
          </>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-150">
          <Btn variant="outline" size="sm" onClick={handleReset}>
            Reset
          </Btn>
          <Btn size="sm" onClick={onClose}>
            Apply Filters
          </Btn>
        </div>
      </div>
    </Modal>
  );
}
