import React, { useState, useRef } from "react";
import { Clock, Send, Edit2, Trash2, CalendarDays, Plus } from "lucide-react";
import { TeamTask, TaskComment, WorkLog, TaskActivity } from "../types";
import { formatDuration } from "../utils/duration-parser";
import { CURRENT_USER } from "@/shared/constants/session";
import { Btn } from "@/shared/components";
import { cn } from "@/shared/utils";

interface TaskActivityListProps {
  task: TeamTask;
  comments: TaskComment[];
  workLogs: WorkLog[];
  activities: TaskActivity[];
  onAddComment: (text: string) => void;
  onDeleteComment: (commentId: string) => void;
  onEditComment: (commentId: string, newText: string) => void;
  onOpenLogTime: () => void;
}

export function TaskActivityList({
  task,
  comments,
  workLogs,
  activities,
  onAddComment,
  onDeleteComment,
  onEditComment,
  onOpenLogTime,
}: TaskActivityListProps) {
  const [activeTab, setActiveTab] = useState<"all" | "comments" | "worklog">("all");
  const [commentText, setCommentText] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const quickReplies = [
    "🎉 Looks good!",
    "👋 Need help?",
    "⛔ This is blocked...",
    "🔍 Can you clarify...?",
  ];

  const handleQuickReplyClick = (reply: string) => {
    setCommentText((prev) => (prev ? `${prev} ${reply}` : reply));
    textareaRef.current?.focus();
  };

  const handlePostComment = () => {
    if (!commentText.trim()) return;
    onAddComment(commentText.trim());
    setCommentText("");
  };

  const handleSaveEdit = (commentId: string) => {
    if (!editingText.trim()) return;
    onEditComment(commentId, editingText.trim());
    setEditingCommentId(null);
    setEditingText("");
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true
      }).replace(",", " ·");
    } catch {
      return "Just now";
    }
  };

  return (
    <div className="space-y-4 text-left">
      {/* Activity tabs */}
      <div className="flex border-b border-gray-150">
        {[
          { id: "all", label: "All" },
          { id: "comments", label: "Comments" },
          { id: "worklog", label: "Work Log" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer",
              activeTab === tab.id
                ? "border-[#5C5CFF] text-[#111827]"
                : "border-transparent text-[#6B7280] hover:text-gray-900"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── ALL ACTIVITY TAB ── */}
      {activeTab === "all" && (
        <div className="space-y-4">
          {activities.length === 0 ? (
            <p className="text-xs text-gray-400 italic">No activity yet.</p>
          ) : (
            activities.map((act) => (
              <div key={act.id} className="flex gap-3 items-start text-xs">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                  style={{ backgroundColor: act.userId === CURRENT_USER.id ? CURRENT_USER.color : "#6B7280" }}
                >
                  {act.userInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 leading-snug">
                    <span className="font-semibold">{act.userName}</span>{" "}
                    <span className="text-gray-600">{act.details}</span>
                  </p>
                  <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                    {formatDate(act.createdAt)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── COMMENTS TAB ── */}
      {activeTab === "comments" && (
        <div className="space-y-5">
          {/* Comments List */}
          <div className="space-y-3.5">
            {comments.map((comm) => (
              <div key={comm.id} className="flex gap-3 items-start text-xs group">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                  style={{ backgroundColor: comm.authorColor || "#6B7280" }}
                >
                  {comm.authorInitials}
                </div>
                
                <div className="flex-1 min-w-0 bg-white border border-gray-150 rounded-xl p-3.5 relative shadow-sm text-left">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-semibold text-gray-900">{comm.authorName}</span>
                      <span className="text-[10px] text-gray-400 font-semibold ml-2">
                        {formatDate(comm.createdAt)}
                      </span>
                    </div>

                    {comm.authorId === CURRENT_USER.id && (
                      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCommentId(comm.id);
                            setEditingText(comm.text);
                          }}
                          className="p-1 text-gray-400 hover:text-[#5C5CFF] rounded cursor-pointer"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteComment(comm.id)}
                          className="p-1 text-gray-400 hover:text-red-500 rounded cursor-pointer"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>

                  {editingCommentId === comm.id ? (
                    <div className="mt-2.5 space-y-2">
                      <textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="w-full p-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#5C5CFF]"
                      />
                      <div className="flex gap-2 justify-end">
                        <Btn variant="outline" size="sm" onClick={() => setEditingCommentId(null)}>
                          Cancel
                        </Btn>
                        <Btn
                          className="bg-[#5C5CFF] hover:bg-[#5B57E8] text-white"
                          size="sm"
                          onClick={() => handleSaveEdit(comm.id)}
                        >
                          Save
                        </Btn>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-700 leading-relaxed font-semibold mt-1 whitespace-pre-wrap">
                      {comm.text}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Comments Composer */}
          <div className="flex gap-3 items-start text-xs pt-3 border-t border-gray-100">
            <div className="w-8 h-8 rounded-full bg-[#5C5CFF] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
              {CURRENT_USER.initials}
            </div>
            
            <div className="flex-1 space-y-2.5">
              <div className="border border-gray-200 rounded-xl bg-white focus-within:border-[#5C5CFF] focus-within:ring-1 focus-within:ring-[#5C5CFF] overflow-hidden">
                <textarea
                  ref={textareaRef}
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="w-full min-h-[70px] px-3.5 py-2.5 text-xs text-gray-800 placeholder-gray-400 bg-transparent border-0 outline-none resize-y"
                />
              </div>

              {/* Quick actions & Send button */}
              <div className="flex justify-between items-center flex-wrap gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {quickReplies.map((reply) => (
                    <button
                      key={reply}
                      type="button"
                      onClick={() => handleQuickReplyClick(reply)}
                      className="px-2.5 py-1 text-[10px] font-bold text-gray-500 bg-gray-50 hover:bg-gray-200 border border-gray-150 rounded-lg transition-colors cursor-pointer"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
                <Btn
                  onClick={handlePostComment}
                  className="bg-[#5C5CFF] hover:bg-[#5B57E8] text-white flex items-center gap-1.5"
                  disabled={!commentText.trim()}
                >
                  <Send size={12} />
                  Comment
                </Btn>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── WORK LOG TAB ── */}
      {activeTab === "worklog" && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-150 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-left">
            <div>
              <h5 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Time Tracking Summary
              </h5>
              <div className="flex items-center gap-4 text-xs font-semibold text-gray-900 mt-1">
                <span>Logged: <strong className="text-[#5C5CFF]">{formatDuration(task.totalLoggedMinutes || 0)}</strong></span>
                <span className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                <span>Remaining: <strong className="text-gray-700">{formatDuration(task.remainingEstimateMinutes || 0)}</strong></span>
              </div>
            </div>
            <Btn
              variant="outline"
              size="sm"
              onClick={onOpenLogTime}
              className="flex items-center gap-1.5 cursor-pointer self-start md:self-auto"
            >
              <Clock size={13} />
              Log Time
            </Btn>
          </div>

          {/* List of Entries */}
          {workLogs.length === 0 ? (
            <div className="border border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center text-center gap-2.5 bg-white">
              <div className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 font-bold border border-gray-100">
                ⏱️
              </div>
              <div className="max-w-[280px]">
                <h5 className="text-xs font-bold text-gray-800">No time logged</h5>
                <p className="text-[10px] text-gray-500 mt-1">
                  No time has been logged for this task yet. Log time to track how much effort has been spent on this work.
                </p>
              </div>
              <Btn
                onClick={onOpenLogTime}
                className="bg-[#5C5CFF] hover:bg-[#5B57E8] text-white text-[11px] mt-1.5 flex items-center gap-1.5"
              >
                <Plus size={12} />
                Log Time
              </Btn>
            </div>
          ) : (
            <div className="space-y-3.5">
              {workLogs.map((log) => (
                <div key={log.id} className="flex gap-3 items-start text-xs">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: log.userId === CURRENT_USER.id ? CURRENT_USER.color : "#6B7280" }}
                  >
                    {log.userInitials}
                  </div>
                  <div className="flex-1 min-w-0 bg-white border border-gray-150 rounded-xl p-3.5 shadow-sm text-left">
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <p className="text-gray-900">
                        <span className="font-semibold">{log.userName}</span>{" "}
                        <span className="text-gray-555 font-semibold">logged</span>{" "}
                        <span className="font-bold text-[#5C5CFF]">{formatDuration(log.timeSpentMinutes)}</span>
                      </p>
                      <span className="text-[10px] text-gray-400 font-semibold">
                        {formatDate(log.startedAt)}
                      </span>
                    </div>
                    {log.description && (
                      <p className="text-gray-600 font-semibold mt-1.5 text-[11px] pl-1.5 border-l-2 border-gray-150 italic leading-snug">
                        {log.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
