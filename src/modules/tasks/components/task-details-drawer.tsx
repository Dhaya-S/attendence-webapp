import React, { useState, useEffect, useRef } from "react";
import { X, Paperclip, AlertCircle, Edit2, Check, Download, Trash, Eye, Bold, Italic, List, Link } from "lucide-react";
import { TeamTask, TaskComment, WorkLog, TaskActivity, TaskAttachment, TaskStatus } from "../types";
import { AssigneeSelector } from "./assignee-selector";
import { LabelsSelector } from "./labels-selector";
import { TaskActivityList } from "./task-activity-list";
import { TimeTrackingDialog } from "./time-tracking-dialog";
import { formatDuration } from "../utils/duration-parser";
import { CURRENT_USER } from "@/shared/constants/session";
import { Btn, SelectField } from "@/shared/components";
import { cn } from "@/shared/utils";
import { DiscardChangesDialog, ConfirmDialog, CustomAlertDialog } from "./discard-changes-dialog";

interface TaskDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  task: TeamTask | null;
  onUpdateTask: (updatedTask: TeamTask) => void;
}

export function TaskDetailsDrawer({
  isOpen,
  onClose,
  task,
  onUpdateTask,
}: TaskDetailsDrawerProps) {
  const [render, setRender] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editedDesc, setEditedDesc] = useState("");

  const [dateError, setDateError] = useState<string | null>(null);
  const [isLogTimeOpen, setIsLogTimeOpen] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<TaskAttachment | null>(null);

  // Custom Confirmation / Alert States
  const [showConfirmDiscard, setShowConfirmDiscard] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteName, setConfirmDeleteName] = useState<string | null>(null);
  const [confirmDeleteCommentId, setConfirmDeleteCommentId] = useState<string | null>(null);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const descTextareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && task) {
      setRender(true);
      setIsClosing(false);
      setEditedTitle(task.title);
      setEditedDesc(task.description || "");
      document.body.style.overflow = "hidden";
    } else {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setRender(false);
        setIsClosing(false);
        document.body.style.overflow = "";
      }, 220);
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = "";
      };
    }
  }, [isOpen, task]);

  const isDirty = !!(
    (isEditingTitle && editedTitle.trim() !== task?.title) ||
    (isEditingDesc && editedDesc.trim() !== (task?.description || ""))
  );

  const handleCloseRequest = () => {
    if (isDirty) {
      setShowConfirmDiscard(true);
    } else {
      onClose();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        if (showConfirmDiscard) {
          setShowConfirmDiscard(false);
        } else if (confirmDeleteName) {
          setConfirmDeleteName(null);
          setConfirmDeleteId(null);
        } else if (confirmDeleteCommentId) {
          setConfirmDeleteCommentId(null);
        } else if (alertMsg) {
          setAlertMsg(null);
        } else if (isDirty) {
          setShowConfirmDiscard(true);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isDirty, showConfirmDiscard, confirmDeleteName, confirmDeleteCommentId, alertMsg, onClose]);

  if (!render || !task) return null;

  const taskKey = task.key || `TASK-${task.id.replace(/\D/g, "") || "100"}`;

  const logActivity = (type: any, details: string, currentTask: TeamTask): TaskActivity => {
    return {
      id: `act-${Date.now()}`,
      taskId: currentTask.id,
      userId: CURRENT_USER.id,
      userName: CURRENT_USER.name,
      userInitials: CURRENT_USER.initials,
      type,
      details,
      createdAt: new Date().toISOString()
    };
  };

  const triggerUpdate = (updatedFields: Partial<TeamTask>, activityLog?: TaskActivity) => {
    const freshActivity = activityLog ? [activityLog, ...(task.activity || [])] : (task.activity || []);
    onUpdateTask({
      ...task,
      ...updatedFields,
      activity: freshActivity,
      updatedAt: new Date().toISOString()
    });
  };

  const handleSaveTitle = () => {
    if (!editedTitle.trim()) {
      setEditedTitle(task.title);
      setIsEditingTitle(false);
      return;
    }

    if (editedTitle.trim() !== task.title) {
      const oldTitle = task.title;
      const newTitle = editedTitle.trim();
      const activity = logActivity(
        "status_change",
        `changed title from "${oldTitle}" to "${newTitle}"`,
        task
      );
      triggerUpdate({ title: newTitle }, activity);
    }
    setIsEditingTitle(false);
  };

  const handleSaveDesc = () => {
    if (editedDesc.trim() !== (task.description || "")) {
      const activity = logActivity(
        "status_change",
        `updated task description`,
        task
      );
      triggerUpdate({ description: editedDesc.trim() || undefined }, activity);
    }
    setIsEditingDesc(false);
  };

  const handleStatusChange = (newStatus: TaskStatus) => {
    if (newStatus !== task.status) {
      const activity = logActivity(
        "status_change",
        `changed status: ${task.status} → ${newStatus}`,
        task
      );
      
      const history = { ...task.statusHistory };
      if (newStatus === "Done") {
        history.Done = (history.Done || 0) + 1;
      } else if (newStatus === "In Progress") {
        history["In Progress"] = (history["In Progress"] || 0) + 1;
      }
      
      triggerUpdate({ status: newStatus, statusHistory: history }, activity);
    }
  };

  const handlePriorityChange = (newPriority: "High" | "Medium" | "Low") => {
    if (newPriority !== task.priority) {
      const activity = logActivity(
        "status_change",
        `changed priority from ${task.priority} to ${newPriority}`,
        task
      );
      triggerUpdate({ priority: newPriority }, activity);
    }
  };

  const handleAssigneeChange = (newAssignee: { id: string; name: string; email: string } | null) => {
    const oldName = task.assigneeName || task.assignee || "Unassigned";
    const newName = newAssignee ? newAssignee.name : "Unassigned";

    if (newName !== oldName) {
      const activity = logActivity(
        "assignee_change",
        `assigned task to ${newName}`,
        task
      );
      triggerUpdate(
        {
          assignee: newName,
          assigneeId: newAssignee?.id || undefined,
          assigneeName: newAssignee?.name || undefined,
          assigneeEmail: newAssignee?.email || undefined,
        },
        activity
      );
    }
  };

  const handleLabelsChange = (newLabels: string[]) => {
    const oldLabels = task.labels || [];
    const added = newLabels.filter((l) => !oldLabels.includes(l));
    const removed = oldLabels.filter((l) => !newLabels.includes(l));

    let details = "";
    if (added.length > 0) details = `added label "${added.join(", ")}"`;
    if (removed.length > 0) details = `removed label "${removed.join(", ")}"`;

    if (details) {
      const activity = logActivity("label_add", details, task);
      triggerUpdate({ labels: newLabels }, activity);
    }
  };

  const handleStartDateChange = (val: string) => {
    if (val && task.dueDate) {
      if (new Date(task.dueDate) < new Date(val)) {
        setDateError("Due date cannot be earlier than start date.");
        return;
      }
    }
    setDateError(null);
    const activity = logActivity("due_date_change", `set start date to ${val}`, task);
    triggerUpdate({ startDate: val || undefined }, activity);
  };

  const handleDueDateChange = (val: string) => {
    if (val && task.startDate) {
      if (new Date(val) < new Date(task.startDate)) {
        setDateError("Due date cannot be earlier than start date.");
        return;
      }
    }
    setDateError(null);
    const dueFormatted = val
      ? new Date(val).toLocaleDateString("en-US", { month: "short", day: "numeric" })
      : task.due;
    const activity = logActivity("due_date_change", `set due date to ${val}`, task);
    triggerUpdate({ dueDate: val, due: dueFormatted }, activity);
  };

  const handleFileSelection = (files: FileList | null) => {
    if (!files) return;
    const newAttachments: TaskAttachment[] = [];
    const names: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isImg = file.type.startsWith("image/");
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      
      newAttachments.push({
        id: `att-${Date.now()}-${i}`,
        name: file.name,
        size: `${sizeMB} MB`,
        type: isImg ? "image" : "file",
        url: isImg ? URL.createObjectURL(file) : undefined
      });
      names.push(file.name);
    }

    const activity = logActivity(
      "attachment_add",
      `added attachment "${names.join(", ")}"`,
      task
    );
    triggerUpdate(
      { attachments: [...(task.attachments || []), ...newAttachments] },
      activity
    );
  };

  const handleRemoveAttachment = (id: string, name: string) => {
    setConfirmDeleteId(id);
    setConfirmDeleteName(name);
  };

  const handleAddComment = (text: string) => {
    const newComment: TaskComment = {
      id: `comm-${Date.now()}`,
      authorId: CURRENT_USER.id,
      authorName: CURRENT_USER.name,
      authorInitials: CURRENT_USER.initials,
      authorColor: CURRENT_USER.color,
      text,
      createdAt: new Date().toISOString()
    };
    const activity = logActivity("comment_add", `commented on the task`, task);
    triggerUpdate({ comments: [newComment, ...(task.comments || [])] }, activity);
  };

  const handleDeleteComment = (commentId: string) => {
    setConfirmDeleteCommentId(commentId);
  };

  const handleEditComment = (commentId: string, newText: string) => {
    const updated = (task.comments || []).map((c) =>
      c.id === commentId ? { ...c, text: newText, createdAt: new Date().toISOString() } : c
    );
    const activity = logActivity("status_change", `edited a comment`, task);
    triggerUpdate({ comments: updated }, activity);
  };

  const handleSaveWorkLog = (
    spentMin: number,
    remainingMin: number,
    dateStartedStr: string,
    descStr: string
  ) => {
    const newLog: WorkLog = {
      id: `wlog-${Date.now()}`,
      taskId: task.id,
      userId: CURRENT_USER.id,
      userName: CURRENT_USER.name,
      userInitials: CURRENT_USER.initials,
      timeSpentMinutes: spentMin,
      remainingMinutes: remainingMin,
      startedAt: dateStartedStr,
      description: descStr || undefined,
      createdAt: new Date().toISOString()
    };

    const spentStr = formatDuration(spentMin);
    const activity = logActivity(
      "time_log",
      `logged work effort of ${spentStr}`,
      task
    );

    const oldLogged = task.totalLoggedMinutes || 0;
    triggerUpdate(
      {
        workLogs: [newLog, ...(task.workLogs || [])],
        totalLoggedMinutes: oldLogged + spentMin,
        remainingEstimateMinutes: remainingMin
      },
      activity
    );
  };

  const insertText = (before: string, after: string = "") => {
    const textarea = descTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);
    const replacement = before + (selected || "") + after;

    setEditedDesc(text.substring(0, start) + replacement + text.substring(end));
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + (selected ? selected.length : 0));
    }, 0);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex justify-end bg-[#0F172A]/30 backdrop-blur-[2px] transition-opacity duration-200"
      style={{
        animation: isClosing ? "backdropOut 220ms ease-in forwards" : "backdropIn 220ms ease-out forwards"
      }}
      onClick={handleCloseRequest}
    >
      <div
        className="flex flex-col h-full bg-white border-l border-gray-200 shadow-2xl relative w-full md:w-[960px] max-w-[90vw]"
        style={{
          animation: isClosing ? "drawerOut 220ms ease-in forwards" : "drawerIn 220ms cubic-bezier(0.16, 1, 0.3, 1) forwards"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-white sticky top-0 z-10 text-left flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="px-2.5 py-1 bg-gray-100 rounded-lg text-center">
              <span className="text-[10px] font-extrabold text-gray-500 block leading-none tracking-wider">
                {taskKey}
              </span>
            </div>
            {task.isBlocked && (
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100 uppercase">
                BLOCKED
              </span>
            )}
          </div>
          <button
            onClick={handleCloseRequest}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col md:flex-row min-h-0 bg-[#F8FAFC]">
          <div className="flex-1 p-6 space-y-6 md:border-r md:border-gray-200 overflow-y-auto text-left">
            <div className="space-y-1.5">
              {isEditingTitle ? (
                <div className="flex gap-2 items-center">
                  <input
                    ref={titleInputRef}
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onBlur={handleSaveTitle}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveTitle();
                    }}
                    className="w-full text-base font-bold text-gray-900 border border-[#5C5CFF] bg-white rounded-xl px-3 py-1.5 outline-none"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleSaveTitle}
                    className="p-1.5 bg-[#5C5CFF] text-white rounded-lg hover:bg-[#5B57E8] cursor-pointer"
                  >
                    <Check size={14} />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => setIsEditingTitle(true)}
                  className="group flex items-start gap-2.5 cursor-pointer hover:bg-gray-55 rounded-lg p-1.5"
                >
                  <h1 className="text-base font-bold text-gray-900 leading-snug">
                    {task.title}
                  </h1>
                  <Edit2 size={13} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity mt-1 flex-shrink-0" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Description
              </h4>
              
              {isEditingDesc ? (
                <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-gray-100 bg-gray-50 flex-wrap">
                    <button
                      type="button"
                      onClick={() => insertText("**", "**")}
                      className="p-1 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded cursor-pointer"
                    >
                      <Bold size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertText("*", "*")}
                      className="p-1 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded cursor-pointer"
                    >
                      <Italic size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertText("- ", "")}
                      className="p-1 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded cursor-pointer"
                    >
                      <List size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertText("1. ", "")}
                      className="p-1 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded cursor-pointer"
                    >
                      <List size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertText("[", "](url)")}
                      className="p-1 text-gray-555 hover:text-gray-900 hover:bg-gray-200 rounded cursor-pointer"
                    >
                      <Link size={13} />
                    </button>
                  </div>
                  <textarea
                    ref={descTextareaRef}
                    value={editedDesc}
                    onChange={(e) => setEditedDesc(e.target.value)}
                    className="w-full min-h-[120px] px-3.5 py-2.5 text-xs text-gray-800 bg-transparent border-0 outline-none resize-y"
                    autoFocus
                  />
                  <div className="flex gap-2 justify-end p-2 border-t border-gray-55">
                    <Btn variant="outline" size="sm" onClick={() => setIsEditingDesc(false)}>
                      Cancel
                    </Btn>
                    <Btn
                      className="bg-[#5C5CFF] hover:bg-[#5B57E8] text-white"
                      size="sm"
                      onClick={handleSaveDesc}
                    >
                      Save
                    </Btn>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setIsEditingDesc(true)}
                  className="border border-gray-150 rounded-xl bg-white p-3.5 hover:border-gray-300 transition-all cursor-pointer min-h-[50px]"
                >
                  {task.description ? (
                    <p className="text-xs text-gray-705 leading-relaxed whitespace-pre-wrap font-semibold">
                      {task.description}
                    </p>
                  ) : (
                    <span className="text-xs text-gray-400 italic font-medium">Add a description…</span>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2.5">
              <div className="flex justify-between items-center">
                <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Attachments
                </h4>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-bold text-[#5C5CFF] hover:underline flex items-center gap-1 cursor-pointer animate-pulse"
                >
                  Add attachment
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => handleFileSelection(e.target.files)}
                  multiple
                  className="hidden"
                />
              </div>

              {(!task.attachments || task.attachments.length === 0) ? (
                <div className="border border-dashed border-gray-200 bg-white rounded-xl p-4 text-center text-xs text-gray-400 font-semibold">
                  No attachments yet. Click Add attachment to upload.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {task.attachments.map((att) => (
                    <div
                      key={att.id}
                      className="border border-[#E5E7EB] bg-white rounded-xl p-3 flex items-center justify-between group shadow-sm text-left"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {att.type === "image" && att.url ? (
                          <img
                            src={att.url}
                            alt="preview"
                            className="w-9 h-9 rounded-lg object-cover flex-shrink-0 border border-gray-100 cursor-pointer"
                            onClick={() => setPreviewAttachment(att)}
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 text-gray-400 font-bold border border-gray-150">
                            📄
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-gray-900 truncate">
                            {att.name}
                          </p>
                          <p className="text-[9px] text-gray-400 font-semibold mt-0.5">
                            {att.size}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-1 flex-shrink-0">
                        {att.type === "image" && att.url && (
                          <button
                            type="button"
                            title="Preview"
                            onClick={() => setPreviewAttachment(att)}
                            className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded"
                          >
                            <Eye size={13} />
                          </button>
                        )}
                        <button
                          type="button"
                          title="Download"
                          onClick={() => setAlertMsg(`Downloading ${att.name}...`)}
                          className="p-1 text-gray-400 hover:text-[#5C5CFF] hover:bg-gray-55 rounded"
                        >
                          <Download size={13} />
                        </button>
                        <button
                          type="button"
                          title="Delete"
                          onClick={() => handleRemoveAttachment(att.id, att.name)}
                          className="p-1 text-gray-400 hover:text-red-500 hover:bg-gray-55 rounded"
                        >
                          <Trash size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <hr className="border-gray-150" />

            <TaskActivityList
              task={task}
              comments={task.comments || []}
              workLogs={task.workLogs || []}
              activities={task.activity || []}
              onAddComment={handleAddComment}
              onDeleteComment={handleDeleteComment}
              onEditComment={handleEditComment}
              onOpenLogTime={() => setIsLogTimeOpen(true)}
            />
          </div>

          <div className="w-full md:w-[320px] p-6 space-y-5 overflow-y-auto text-left flex-shrink-0">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Details
            </h3>

            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Status
              </label>
              <SelectField
                value={task.status}
                onChange={(v: any) => {
                  const val = typeof v === "string" ? v : v?.target?.value || "Todo";
                  handleStatusChange(val as TaskStatus);
                }}
              >
                <option value="Todo">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Done">Completed</option>
                <option value="Archived">Archived</option>
              </SelectField>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Priority
              </label>
              <SelectField
                value={task.priority}
                onChange={(v: any) => {
                  const val = typeof v === "string" ? v : v?.target?.value || "Medium";
                  handlePriorityChange(val as any);
                }}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </SelectField>
            </div>

            <AssigneeSelector
              selectedAssigneeId={task.assigneeId}
              selectedAssigneeEmail={task.assigneeEmail}
              onSelect={handleAssigneeChange}
              currentUserDept={CURRENT_USER.dept}
            />

            <LabelsSelector
              selectedLabels={task.labels || []}
              onChange={handleLabelsChange}
            />

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Start Date
                </label>
                <input
                  type="date"
                  value={task.startDate || ""}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="w-full h-10 px-3 bg-white border border-[#E5E7EB] rounded-xl text-xs font-semibold text-gray-900 outline-none hover:border-gray-300 focus:ring-1 focus:ring-[#5C5CFF]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Due Date
                </label>
                <input
                  type="date"
                  value={task.dueDate || ""}
                  onChange={(e) => handleDueDateChange(e.target.value)}
                  className={cn(
                    "w-full h-10 px-3 bg-white border rounded-xl text-xs font-semibold text-gray-900 outline-none hover:border-gray-300 focus:ring-1 focus:ring-[#5C5CFF]",
                    dateError ? "border-red-500" : "border-[#E5E7EB]"
                  )}
                />
              </div>
            </div>

            {dateError && (
              <div className="flex items-center gap-1.5 text-[11px] text-red-500 font-medium bg-red-50/55 p-2 rounded-lg border border-red-100">
                <AlertCircle size={12} className="flex-shrink-0" />
                <span>{dateError}</span>
              </div>
            )}

            <div className="pt-2 border-t border-gray-100">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Reporter
              </label>
              <div className="flex items-center gap-2.5 bg-gray-50 border border-gray-150 p-2.5 rounded-xl">
                <div className="w-6 h-6 rounded-full bg-[#5C5CFF] text-white flex items-center justify-center text-[10px] font-bold">
                  {task.reporterName
                    ? task.reporterName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                    : "EM"}
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#111827] leading-none">
                    {task.reporterName || "Employee"}
                  </p>
                  <p className="text-[9px] text-gray-500 leading-none mt-1">
                    Reporter
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-white flex gap-3 justify-end shadow-[0_-4px_12px_rgba(0,0,0,0.03)] flex-shrink-0 text-right">
          <Btn variant="outline" onClick={onClose}>
            Close Details
          </Btn>
        </div>
      </div>

      <TimeTrackingDialog
        isOpen={isLogTimeOpen}
        onClose={() => setIsLogTimeOpen(false)}
        originalEstimateMinutes={task.originalEstimateMinutes}
        totalLoggedMinutes={task.totalLoggedMinutes || 0}
        remainingEstimateMinutes={task.remainingEstimateMinutes || 0}
        onSave={handleSaveWorkLog}
      />

      {previewAttachment && (
        <div
          className="fixed inset-0 z-[120] bg-black/75 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setPreviewAttachment(null)}
        >
          <div
            className="bg-white rounded-2xl overflow-hidden max-w-2xl max-h-[85vh] relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-3 right-3 z-10">
              <button
                onClick={() => setPreviewAttachment(null)}
                className="p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <img
              src={previewAttachment.url}
              alt={previewAttachment.name}
              className="w-full h-auto max-h-[75vh] object-contain block mx-auto"
            />
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-900 truncate pr-6">
                {previewAttachment.name} ({previewAttachment.size})
              </span>
            </div>
          </div>
        </div>
      )}

      <DiscardChangesDialog
        isOpen={showConfirmDiscard}
        onClose={() => setShowConfirmDiscard(false)}
        onDiscard={() => {
          setShowConfirmDiscard(false);
          setIsEditingTitle(false);
          setIsEditingDesc(false);
          onClose();
        }}
      />

      <ConfirmDialog
        isOpen={!!confirmDeleteName}
        onClose={() => { setConfirmDeleteId(null); setConfirmDeleteName(null); }}
        onConfirm={() => {
          if (confirmDeleteId && confirmDeleteName) {
            const filtered = (task.attachments || []).filter((a) => a.id !== confirmDeleteId);
            const activity = logActivity("attachment_remove", `removed attachment "${confirmDeleteName}"`, task);
            triggerUpdate({ attachments: filtered }, activity);
          }
          setConfirmDeleteId(null);
          setConfirmDeleteName(null);
        }}
        title="Delete attachment?"
        description={`Are you sure you want to delete attachment "${confirmDeleteName}"?`}
        confirmText="Delete"
        variant="destructive"
      />

      <ConfirmDialog
        isOpen={!!confirmDeleteCommentId}
        onClose={() => setConfirmDeleteCommentId(null)}
        onConfirm={() => {
          if (confirmDeleteCommentId) {
            const filtered = (task.comments || []).filter((c) => c.id !== confirmDeleteCommentId);
            const activity = logActivity("status_change", `deleted a comment`, task);
            triggerUpdate({ comments: filtered }, activity);
          }
          setConfirmDeleteCommentId(null);
        }}
        title="Delete comment?"
        description="Are you sure you want to delete this comment?"
        confirmText="Delete"
        variant="destructive"
      />

      <CustomAlertDialog
        isOpen={!!alertMsg}
        onClose={() => setAlertMsg(null)}
        title="Downloading file"
        description={alertMsg || ""}
      />
    </div>
  );
}
