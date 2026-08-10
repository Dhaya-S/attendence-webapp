import React, { useState, useEffect, useRef } from "react";
import { X, Paperclip, AlertCircle, Bold, Italic, List, Link } from "lucide-react";
import { TeamTask, TaskAttachment, TaskStatus } from "../types";
import { AssigneeSelector } from "./assignee-selector";
import { LabelsSelector } from "./labels-selector";
import { CURRENT_USER } from "@/shared/constants/session";
import { useAuth } from "@/shared/context/AuthContext";
import { Btn, SelectField } from "@/shared/components";
import { cn } from "@/shared/utils";
import { DiscardChangesDialog } from "./discard-changes-dialog";

interface CreateTaskDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (taskData: Omit<TeamTask, "id" | "key" | "createdAt">) => void;
}

export function CreateTaskDrawer({ isOpen, onClose, onCreate }: CreateTaskDrawerProps) {
  const { user, displayName, email, role, companyId } = useAuth();
  const realReporterName = displayName || user?.displayName || (email ? email.split("@")[0] : "Me");
  const realReporterInitials = realReporterName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "??";
  const realReporterRole = role ? (role.charAt(0).toUpperCase() + role.slice(1)) : "Member";
  const [render, setRender] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const [showConfirmDiscard, setShowConfirmDiscard] = useState(false);
  
  const [title, setTitle] = useState("");
  const [titleError, setTitleError] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("Todo");
  const [statusError, setStatusError] = useState<string | null>(null);
  const [priority, setPriority] = useState<"High" | "Medium" | "Low">("Medium");
  const [priorityError, setPriorityError] = useState<string | null>(null);
  
  const [assignee, setAssignee] = useState<{ id: string; name: string; email: string } | null>(null);
  const [assigneeError, setAssigneeError] = useState<string | null>(null);
  
  const [labels, setLabels] = useState<string[]>([]);
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dateError, setDateError] = useState<string | null>(null);
  
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  const isDirty = !!(
    title.trim() ||
    description.trim() ||
    assignee ||
    labels.length > 0 ||
    startDate ||
    dueDate ||
    attachments.length > 0
  );

  useEffect(() => {
    if (isOpen) {
      setRender(true);
      setIsClosing(false);
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
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        if (showConfirmDiscard) {
          setShowConfirmDiscard(false);
        } else if (isDirty) {
          setShowConfirmDiscard(true);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isDirty, showConfirmDiscard]);

  if (!render) return null;

  const handleCloseRequest = () => {
    if (isDirty) {
      setShowConfirmDiscard(true);
    } else {
      onClose();
    }
  };

  const validateDates = (start: string, due: string) => {
    if (start && due) {
      const sDate = new Date(start);
      const dDate = new Date(due);
      if (dDate < sDate) {
        setDateError("Due date cannot be earlier than start date.");
        return false;
      }
    }
    setDateError(null);
    return true;
  };

  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    validateDates(val, dueDate);
  };

  const handleDueDateChange = (val: string) => {
    setDueDate(val);
    validateDates(startDate, val);
  };

  const insertText = (before: string, after: string = "") => {
    const textarea = editorRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);
    const replacement = before + (selected || "") + after;

    setDescription(text.substring(0, start) + replacement + text.substring(end));
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + (selected ? selected.length : 0));
    }, 0);
  };

  const handleFileSelection = (files: FileList | null) => {
    if (!files) return;
    const newAttachments: TaskAttachment[] = [];
    
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
    }
    setAttachments((prev) => [...prev, ...newAttachments]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelection(e.dataTransfer.files);
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTitleError(null);
    setStatusError(null);
    setPriorityError(null);
    setAssigneeError(null);

    let hasErr = false;

    if (!title.trim()) {
      setTitleError("Task title is required.");
      hasErr = true;
    }

    if (!status) {
      setStatusError("Status is required.");
      hasErr = true;
    }

    if (!priority) {
      setPriorityError("Priority is required.");
      hasErr = true;
    }

    // Assignee is optional - skip validation if not selected

    if (assigneeError || dateError) {
      hasErr = true;
    }

    if (!validateDates(startDate, dueDate)) {
      hasErr = true;
    }

    if (hasErr) {
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    const dueFormatted = dueDate
      ? new Date(dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : "";

    onCreate({
      title: title.trim(),
      description: description.trim() || "",
      status,
      priority,
      assignee: assignee ? assignee.name : "Unassigned",
      assigneeId: assignee?.id || "",
      assigneeName: assignee?.name || "",
      assigneeEmail: assignee?.email || "",
      reporterId: user?.uid || "",
      reporterName: realReporterName,
      dept: "",
      due: dueFormatted,
      dueDate: dueDate || "",
      startDate: startDate || "",
      labels: labels || [],
      attachments: attachments || [],
      isBlocked: false,
      isFlagged: false,
      statusHistory: { Todo: 1 }
    });

    setTitle("");
    setDescription("");
    setStatus("Todo");
    setPriority("Medium");
    setAssignee(null);
    setLabels([]);
    setStartDate("");
    setDueDate("");
    setAttachments([]);
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
          <h2 className="text-base font-bold text-gray-900">Create Task</h2>
          <button
            onClick={handleCloseRequest}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 bg-[#F8FAFC] overflow-hidden">
          <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
            <div className="flex-1 p-6 space-y-6 md:border-r md:border-gray-200 overflow-y-auto text-left">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Task Title *
                </label>
                <input
                  type="text"
                  placeholder="What needs to be done?"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (e.target.value.trim()) setTitleError(null);
                  }}
                  className={cn(
                    "w-full h-11 px-4 text-sm font-semibold text-gray-900 border bg-white rounded-xl placeholder-gray-400 transition-all outline-none focus:ring-2 focus:ring-[#5C5CFF]/20 focus:border-[#5C5CFF]",
                    titleError ? "border-red-500" : "border-gray-200"
                  )}
                />
                {titleError && (
                  <div className="flex items-center gap-1 mt-1 text-[11px] text-red-500 font-semibold">
                    <AlertCircle size={12} />
                    <span>{titleError}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Description
                </label>
                <div className="border border-gray-200 rounded-xl bg-white overflow-hidden focus-within:border-[#5C5CFF] focus-within:ring-1 focus-within:ring-[#5C5CFF]">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-gray-100 bg-gray-50 flex-wrap">
                    <button
                      type="button"
                      title="Bold"
                      onClick={() => insertText("**", "**")}
                      className="p-1 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded cursor-pointer"
                    >
                      <Bold size={13} />
                    </button>
                    <button
                      type="button"
                      title="Italic"
                      onClick={() => insertText("*", "*")}
                      className="p-1 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded cursor-pointer"
                    >
                      <Italic size={13} />
                    </button>
                    <button
                      type="button"
                      title="Bullet List"
                      onClick={() => insertText("- ", "")}
                      className="p-1 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded cursor-pointer"
                    >
                      <List size={13} />
                    </button>
                    <button
                      type="button"
                      title="Numbered List"
                      onClick={() => insertText("1. ", "")}
                      className="p-1 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded cursor-pointer"
                    >
                      <List size={13} />
                    </button>
                    <button
                      type="button"
                      title="Insert Link"
                      onClick={() => insertText("[", "](url)")}
                      className="p-1 text-gray-555 hover:text-gray-900 hover:bg-gray-200 rounded cursor-pointer"
                    >
                      <Link size={13} />
                    </button>
                  </div>
                  <textarea
                    ref={editorRef}
                    placeholder="Add a description…"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full min-h-[140px] px-4 py-3 text-xs text-gray-800 placeholder-gray-400 bg-transparent border-0 outline-none resize-y"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Attachments
                </label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "border border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2",
                    isDragOver
                      ? "border-[#5C5CFF] bg-[#EEF2FF]/40"
                      : "border-gray-200 bg-white hover:border-[#5C5CFF]/45"
                  )}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => handleFileSelection(e.target.files)}
                    multiple
                    className="hidden"
                  />
                  <Paperclip size={18} className="text-gray-400" />
                  <span className="text-xs text-gray-555 font-semibold">
                    Drag and drop files here, or <span className="text-[#5C5CFF]">browse</span>
                  </span>
                </div>

                {attachments.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 pt-2">
                    {attachments.map((att) => (
                      <div
                        key={att.id}
                        className="border border-[#E5E7EB] bg-white rounded-xl p-2.5 flex items-center justify-between relative group shadow-sm min-w-0"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {att.type === "image" && att.url ? (
                            <img
                              src={att.url}
                              alt="preview"
                              className="w-8 h-8 rounded-lg object-cover flex-shrink-0 border border-gray-100"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 text-gray-400 font-bold border border-gray-150">
                              📄
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-semibold text-gray-900 truncate">
                              {att.name}
                            </p>
                            <p className="text-[9px] text-gray-400 font-medium">
                              {att.size}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveAttachment(att.id);
                          }}
                          className="p-1 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-50 flex-shrink-0 cursor-pointer"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
                  value={status}
                  onChange={(v: any) => {
                    const val = typeof v === "string" ? v : v?.target?.value || "Todo";
                    setStatus(val as TaskStatus);
                    if (val) setStatusError(null);
                  }}
                  className={cn(statusError ? "border-red-500 bg-red-50/10 focus:ring-red-200" : "")}
                >
                  <option value="Todo">To Do</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Done">Completed</option>
                  <option value="Archived">Archived</option>
                </SelectField>
                {statusError && (
                  <div className="flex items-center gap-1 mt-1 text-[11px] text-red-500 font-semibold">
                    <AlertCircle size={12} />
                    <span>{statusError}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  Priority
                </label>
                <SelectField
                  value={priority}
                  onChange={(v: any) => {
                    const val = typeof v === "string" ? v : v?.target?.value || "Medium";
                    setPriority(val as any);
                    if (val) setPriorityError(null);
                  }}
                  className={cn(priorityError ? "border-red-500 bg-red-50/10 focus:ring-red-200" : "")}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </SelectField>
                {priorityError && (
                  <div className="flex items-center gap-1 mt-1 text-[11px] text-red-500 font-semibold">
                    <AlertCircle size={12} />
                    <span>{priorityError}</span>
                  </div>
                )}
              </div>

              <AssigneeSelector
                selectedAssigneeId={assignee?.id}
                selectedAssigneeEmail={assignee?.email}
                onSelect={(val, err) => {
                  setAssignee(val);
                  setAssigneeError(err || null);
                }}
              />

              <LabelsSelector selectedLabels={labels} onChange={setLabels} />

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
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
                    value={dueDate}
                    onChange={(e) => handleDueDateChange(e.target.value)}
                    className={cn(
                      "w-full h-10 px-3 bg-white border rounded-xl text-xs font-semibold text-gray-900 outline-none hover:border-gray-300 focus:ring-1 focus:ring-[#5C5CFF]",
                      dateError ? "border-red-500" : "border-[#E5E7EB]"
                    )}
                  />
                </div>
              </div>

              {dateError && (
                <div className="flex items-center gap-1.5 text-[11px] text-red-500 font-medium bg-red-50/50 p-2 rounded-lg border border-red-100">
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
                    {realReporterInitials}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-800 leading-none">
                      {realReporterName}
                    </p>
                    <p className="text-[9px] text-gray-500 leading-none mt-1">
                      {realReporterRole}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="px-6 py-4 border-t border-gray-200 bg-white flex gap-3 justify-end shadow-[0_-4px_12px_rgba(0,0,0,0.03)] flex-shrink-0 text-right w-full">
            <Btn type="button" variant="outline" onClick={handleCloseRequest}>
              Cancel
            </Btn>
            <Btn
              type="submit"
              className="bg-[#5C5CFF] hover:bg-[#5B57E8] text-white"
            >
              Create Task
            </Btn>
          </div>
        </form>
        <DiscardChangesDialog
          isOpen={showConfirmDiscard}
          onClose={() => setShowConfirmDiscard(false)}
          onDiscard={() => {
            setShowConfirmDiscard(false);
            onClose();
          }}
        />
      </div>
    </div>
  );
}
