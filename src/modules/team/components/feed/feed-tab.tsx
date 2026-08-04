import React, { useState, useEffect } from "react";
import {
  Search,
  SlidersHorizontal,
  MessageSquare,
  CheckCircle,
  Paperclip,
  FileText,
  X,
} from "lucide-react";
import { FeedPost, FeedComment } from "../../types";
import { cn } from "@/shared/utils";
import { Btn, Modal, Drawer } from "@/shared/components";
import { DiscussionCard } from "./discussion-card";
import { MentionPopup } from "./mention-popup";

interface FeedTabProps {
  posts: FeedPost[];
  setPosts: React.Dispatch<React.SetStateAction<FeedPost[]>>;
  depts: string[];
  showCreateDiscussion: boolean;
  setShowCreateDiscussion: (b: boolean) => void;
}

export function FeedTab({
  posts,
  setPosts,
  depts,
  showCreateDiscussion,
  setShowCreateDiscussion,
}: FeedTabProps) {
  // Feed Filter States
  const [feedPinnedOnly, setFeedPinnedOnly] = useState(false);
  const [feedSavedOnly, setFeedSavedOnly] = useState(false);
  const [feedResolvedFilter, setFeedResolvedFilter] = useState<
    "All" | "Resolved" | "Unresolved"
  >("All");
  const [feedPriorityFilter, setFeedPriorityFilter] = useState("All");
  const [feedDeptFilter, setFeedDeptFilter] = useState("All");
  const [feedSearch, setFeedSearch] = useState("");
  const [showFeedFilterPanel, setShowFeedFilterPanel] = useState(false);

  // Discussion create state
  const [newDiscText, setNewDiscText] = useState("");
  const [newDiscPriority, setNewDiscPriority] = useState<
    "High" | "Medium" | "Low" | "None"
  >("None");
  const [newDiscDept, setNewDiscDept] = useState("All");
  const [newDiscAttachments, setNewDiscAttachments] = useState<
    { name: string; type: "image" | "file"; size: string }[]
  >([]);

  // Discussion Edit state
  const [editingPost, setEditingPost] = useState<FeedPost | null>(null);

  // Centralized Modal State System
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedToast, setFeedToast] = useState<string | null>(null);
  const triggerFeedToast = (msg: string) => {
    setFeedToast(msg);
    setTimeout(() => setFeedToast(null), 2500);
  };

  const handleCloseModal = () => {
    setActiveModal(null);
    setShowCreateDiscussion(false);
    setEditingPost(null);
    setConfirmDeleteId(null);
    setIsDeleting(false);
  };

  // Sync prop-based triggers to activeModal
  useEffect(() => {
    if (showCreateDiscussion) {
      setActiveModal("new-discussion");
    }
  }, [showCreateDiscussion]);

  // Discussion Delete state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // --- FEED COLLABORATION HELPER FUNCTIONS ---
  const togglePin = (id: string) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, pinned: !p.pinned } : p))
    );
  };

  const toggleSave = (id: string) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, saved: !p.saved } : p))
    );
  };

  const toggleResolve = (id: string) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, resolved: !p.resolved } : p))
    );
  };

  const toggleFollow = (id: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const followers = p.followers || [];
        const isFollowing = followers.includes("Alex Admin");
        return {
          ...p,
          followers: isFollowing
            ? followers.filter((f) => f !== "Alex Admin")
            : [...followers, "Alex Admin"],
        };
      })
    );
  };

  const toggleReaction = (
    postId: string,
    emoji: string,
    commentId?: string
  ) => {
    const currentUser = "Alex Admin";
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;

        if (!commentId) {
          // Toggle on post
          const reactions = [...p.reactions];
          const existing = reactions.find((r) => r.emoji === emoji);
          if (existing) {
            if (existing.users.includes(currentUser)) {
              existing.users = existing.users.filter((u) => u !== currentUser);
            } else {
              existing.users.push(currentUser);
            }
          } else {
            reactions.push({ emoji, users: [currentUser] });
          }
          return {
            ...p,
            reactions: reactions.filter((r) => r.users.length > 0),
          };
        } else {
          // Toggle on comment
          const updateComments = (list: FeedComment[]): FeedComment[] => {
            return list.map((c) => {
              if (c.id === commentId) {
                const reactions = [...(c.reactions || [])];
                const existing = reactions.find((r) => r.emoji === emoji);
                if (existing) {
                  if (existing.users.includes(currentUser)) {
                    existing.users = existing.users.filter(
                      (u) => u !== currentUser
                    );
                  } else {
                    existing.users.push(currentUser);
                  }
                } else {
                  reactions.push({ emoji, users: [currentUser] });
                }
                return {
                  ...c,
                  reactions: reactions.filter((r) => r.users.length > 0),
                };
              }
              if (c.replies) {
                return { ...c, replies: updateComments(c.replies) };
              }
              return c;
            });
          };
          return { ...p, comments: updateComments(p.comments) };
        }
      })
    );
  };

  const handleCreatePost = (
    text: string,
    priority: "High" | "Medium" | "Low" | "None",
    dept: string,
    attachments: any[]
  ) => {
    const newPost: FeedPost = {
      id: `F${Date.now()}`,
      author: "Alex Admin",
      initials: "AA",
      color: "#5C5CFF",
      time: "Just now",
      text,
      dept: dept === "All" ? "All" : dept,
      designation: "VP of HR",
      pinned: false,
      saved: false,
      priority: priority === "None" ? undefined : priority,
      resolved: false,
      reactions: [],
      comments: [],
      followers: ["Alex Admin"],
      attachments: attachments.length > 0 ? attachments : undefined,
    };
    setPosts((prev) => [newPost, ...prev]);
  };

  const handleEditPost = (
    id: string,
    text: string,
    priority: "High" | "Medium" | "Low" | "None",
    attachments: any[]
  ) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        return {
          ...p,
          text,
          priority: priority === "None" ? undefined : priority,
          attachments: attachments.length > 0 ? attachments : undefined,
          edited: true,
          editedTime: "Just now",
        };
      })
    );
  };

  const handleDeletePost = (id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleAddComment = (
    postId: string,
    parentCommentId: string | null,
    text: string,
    attachment?: any
  ) => {
    const newComment: FeedComment = {
      id: `FC${Date.now()}`,
      author: "Alex Admin",
      initials: "AA",
      color: "#5C5CFF",
      text,
      time: "Just now",
      attachment,
      replies: [],
    };

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;

        if (!parentCommentId) {
          return { ...p, comments: [...p.comments, newComment] };
        } else {
          const insertReply = (list: FeedComment[]): FeedComment[] => {
            return list.map((c) => {
              if (c.id === parentCommentId) {
                return { ...c, replies: [...(c.replies || []), newComment] };
              }
              if (c.replies) {
                return { ...c, replies: insertReply(c.replies) };
              }
              return c;
            });
          };
          return { ...p, comments: insertReply(p.comments) };
        }
      })
    );
  };

  const handleEditComment = (
    postId: string,
    commentId: string,
    text: string
  ) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const updateText = (list: FeedComment[]): FeedComment[] => {
          return list.map((c) => {
            if (c.id === commentId) {
              return { ...c, text, edited: true, editedTime: "Just now" };
            }
            if (c.replies) {
              return { ...c, replies: updateText(c.replies) };
            }
            return c;
          });
        };
        return { ...p, comments: updateText(p.comments) };
      })
    );
  };

  const handleDeleteComment = (postId: string, commentId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const removeComment = (list: FeedComment[]): FeedComment[] => {
          return list
            .filter((c) => c.id !== commentId)
            .map((c) => {
              if (c.replies) {
                return { ...c, replies: removeComment(c.replies) };
              }
              return c;
            });
        };
        return { ...p, comments: removeComment(p.comments) };
      })
    );
  };

  return (
    <div className="flex h-full w-full bg-[#F7F8FA] overflow-hidden text-left">
      {/* Timeline container */}
      <div className="flex-1 flex flex-col h-full overflow-hidden p-6 max-w-4xl mx-auto w-full">
        {/* Header inside feed tab */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200 mb-5 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-905">
              Collaboration Feed
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Share ideas, ask questions, and collaborate with your team
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-64 h-[34px] flex items-center gap-2 px-3 bg-white border border-[#E8E9ED] rounded-[8px]">
              <Search size={13} className="text-[#9CA0AB] flex-shrink-0" />
              <input
                type="text"
                placeholder="Search discussions..."
                value={feedSearch}
                onChange={(e) => setFeedSearch(e.target.value)}
                className="w-full bg-transparent text-xs text-[#16181D] placeholder-[#9CA0AB] outline-none"
              />
            </div>
            <button
              onClick={() => setShowFeedFilterPanel(true)}
              className={cn(
                "flex items-center gap-1.5 h-[34px] px-3 border rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors bg-white cursor-pointer",
                feedPinnedOnly ||
                  feedSavedOnly ||
                  feedResolvedFilter !== "All" ||
                  feedPriorityFilter !== "All" ||
                  feedDeptFilter !== "All"
                  ? "border-[#5C5CFF] bg-[#EEF2FF] text-[#5C5CFF]"
                  : "border-gray-200 text-gray-600"
              )}
              title="Filters"
            >
              <SlidersHorizontal size={13} />
              <span>Filter</span>
            </button>
          </div>
        </div>

        {/* Discussion timeline list */}
        <div className="flex-1 overflow-auto space-y-4 pr-1 pb-10">
          {(() => {
            const filteredPosts = posts.filter((p) => {
              // Pinned filter
              if (feedPinnedOnly && !p.pinned) return false;
              // Saved filter
              if (feedSavedOnly && !p.saved) return false;
              // Resolved filter
              if (feedResolvedFilter === "Resolved" && !p.resolved) return false;
              if (feedResolvedFilter === "Unresolved" && p.resolved) return false;
              // Priority filter
              if (feedPriorityFilter !== "All" && p.priority !== feedPriorityFilter)
                return false;
              // Dept filter
              if (
                feedDeptFilter !== "All" &&
                p.dept !== feedDeptFilter &&
                p.dept !== "All"
              )
                return false;
              // Search query
              if (feedSearch.trim() !== "") {
                const q = feedSearch.toLowerCase();
                const matchText = p.text.toLowerCase().includes(q);
                const matchAuthor = p.author.toLowerCase().includes(q);
                const matchComments = p.comments.some(
                  (c) =>
                    c.text.toLowerCase().includes(q) ||
                    c.author.toLowerCase().includes(q) ||
                    (c.replies || []).some((r) => r.text.toLowerCase().includes(q))
                );
                if (!matchText && !matchAuthor && !matchComments) return false;
              }
              return true;
            });

            if (filteredPosts.length === 0) {
              return (
                <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-sm">
                  <MessageSquare size={32} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-gray-808">
                    No discussions match your filters
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Try resetting the filters or creating a new discussion.
                  </p>
                </div>
              );
            }

            return filteredPosts.map((p) => {
              const isPinned = p.pinned;
              const isSaved = p.saved || false;
              const isResolved = p.resolved || false;
              const isFollower = (p.followers || []).includes("Alex Admin");
              const isAuthor = p.author === "Alex Admin";
              const isManagerOrAdmin = true;

              return (
                <DiscussionCard
                  key={p.id}
                  post={p}
                  isPinned={isPinned}
                  isSaved={isSaved}
                  isResolved={isResolved}
                  isFollower={isFollower}
                  isAuthor={isAuthor}
                  isManagerOrAdmin={isManagerOrAdmin}
                  onTogglePin={togglePin}
                  onToggleSave={toggleSave}
                  onToggleResolve={toggleResolve}
                  onToggleFollow={toggleFollow}
                  onDelete={(id) => {
                    setConfirmDeleteId(id);
                    setActiveModal("delete-discussion");
                  }}
                  onEdit={(post) => {
                    setEditingPost(post);
                    setActiveModal("edit-discussion");
                  }}
                  onToggleReaction={toggleReaction}
                  onAddComment={handleAddComment}
                  onEditComment={handleEditComment}
                  onDeleteComment={handleDeleteComment}
                />
              );
            });
          })()}
        </div>
      </div>

      {/* Filter Drawer */}
      <Drawer
        isOpen={showFeedFilterPanel}
        onClose={() => setShowFeedFilterPanel(false)}
        title="Filter Discussions"
        footer={
          <div className="flex gap-2 w-full justify-end">
            <Btn
              variant="outline"
              onClick={() => {
                setFeedPinnedOnly(false);
                setFeedSavedOnly(false);
                setFeedResolvedFilter("All");
                setFeedPriorityFilter("All");
                setFeedDeptFilter("All");
                setShowFeedFilterPanel(false);
              }}
            >
              Reset Filters
            </Btn>
            <Btn variant="primary" onClick={() => setShowFeedFilterPanel(false)}>
              Apply
            </Btn>
          </div>
        }
      >
        <div className="space-y-5 text-left">
          {/* Fast toggles */}
          <div className="bg-white rounded-xl border border-gray-150 p-4 space-y-3.5 shadow-sm">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Fast Filters
            </h4>
            <div className="space-y-2">
              <label className="flex items-center gap-2.5 text-xs text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={feedPinnedOnly}
                  onChange={(e) => setFeedPinnedOnly(e.target.checked)}
                  className="rounded border-gray-300 text-[#5C5CFF] focus:ring-[#5C5CFF]"
                />
                <span>Pinned items only</span>
              </label>
              <label className="flex items-center gap-2.5 text-xs text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={feedSavedOnly}
                  onChange={(e) => setFeedSavedOnly(e.target.checked)}
                  className="rounded border-gray-300 text-[#5C5CFF] focus:ring-[#5C5CFF]"
                />
                <span>Saved Discussions only</span>
              </label>
            </div>
          </div>

          {/* Status Filter */}
          <div className="bg-white rounded-xl border border-gray-150 p-4 space-y-3 shadow-sm">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Status
            </h4>
            <div className="flex rounded-lg border border-gray-200 overflow-hidden bg-gray-50 p-0.5 gap-0.5 text-xs">
              {(["All", "Resolved", "Unresolved"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setFeedResolvedFilter(v)}
                  className={cn(
                    "flex-1 py-1.5 rounded-md font-semibold transition-all cursor-pointer border-0 bg-transparent",
                    feedResolvedFilter === v
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-750"
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Priority Filter */}
          <div className="bg-white rounded-xl border border-gray-150 p-4 space-y-3 shadow-sm">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Priority
            </h4>
            <select
              value={feedPriorityFilter}
              onChange={(e) => setFeedPriorityFilter(e.target.value)}
              className="w-full text-xs bg-white border border-gray-200 rounded-lg p-2.5 font-medium outline-none"
            >
              <option value="All">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Department Filter */}
          <div className="bg-white rounded-xl border border-gray-155 p-4 shadow-sm">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              Department
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {depts.map((d) => (
                <button
                  key={d}
                  onClick={() => setFeedDeptFilter(d)}
                  className={cn(
                    "px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer",
                    feedDeptFilter === d
                      ? "border-[#5C5CFF] bg-[#EEF2FF] text-[#5C5CFF]"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  )}
                >
                  {d === "All" ? "All Departments" : d}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Drawer>

      {/* Create Discussion Modal */}
      {activeModal === "new-discussion" && (
        <Modal title="New Discussion" onClose={handleCloseModal}>
          <div className="space-y-4 text-left">
            <div className="relative">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                What would you like to discuss?
              </label>
              <textarea
                rows={4}
                value={newDiscText}
                onChange={(e) => setNewDiscText(e.target.value)}
                placeholder="Type your message... use @ to mention teammates"
                className="w-full text-xs border border-gray-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-[#5C5CFF] resize-none text-gray-900 bg-white"
              />
              <MentionPopup text={newDiscText} setText={setNewDiscText} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Audience / Department
                </label>
                <select
                  value={newDiscDept}
                  onChange={(e) => setNewDiscDept(e.target.value)}
                  className="w-full text-xs bg-white border border-gray-200 rounded-lg p-2 font-medium outline-none text-gray-900"
                >
                  {depts.map((d) => (
                    <option key={d} value={d}>
                      {d === "All" ? "All Departments" : d}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Priority Badge{" "}
                  <span className="text-gray-450 font-normal">(optional)</span>
                </label>
                <select
                  value={newDiscPriority}
                  onChange={(e) => setNewDiscPriority(e.target.value as any)}
                  className="w-full text-xs bg-white border border-gray-200 rounded-lg p-2 font-medium outline-none text-gray-900"
                >
                  <option value="None">None</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            {/* Simulated Attachments UI */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Attachments
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setNewDiscAttachments((prev) => [
                        ...prev,
                        {
                          name: `Image_${Date.now()
                            .toString()
                            .slice(-4)}.jpg`,
                          type: "image",
                          size: "1.4 MB",
                        },
                      ]);
                    }}
                    className="text-[10px] text-[#5C5CFF] font-semibold hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-0"
                  >
                    <Paperclip size={10} /> Add Image
                  </button>
                  <button
                    onClick={() => {
                      setNewDiscAttachments((prev) => [
                        ...prev,
                        {
                          name: `Doc_${Date.now()
                            .toString()
                            .slice(-4)}.pdf`,
                          type: "file",
                          size: "0.8 MB",
                        },
                      ]);
                    }}
                    className="text-[10px] text-[#5C5CFF] font-semibold hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-0"
                  >
                    <Paperclip size={10} /> Add File
                  </button>
                </div>
              </div>
              {newDiscAttachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {newDiscAttachments.map((att, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1.5 bg-gray-55 border border-gray-200 rounded-lg p-1.5 text-[10px] text-gray-700"
                    >
                      <FileText size={10} className="text-gray-455" />
                      <span className="truncate max-w-[120px]">{att.name}</span>
                      <span className="text-gray-400">({att.size})</span>
                      <button
                        onClick={() =>
                          setNewDiscAttachments((prev) =>
                            prev.filter((_, idx) => idx !== i)
                          )
                        }
                        className="text-red-500 hover:text-red-750 ml-1 cursor-pointer bg-transparent border-0"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <Btn variant="outline" onClick={handleCloseModal}>
                Cancel
              </Btn>
              <Btn
                variant="primary"
                disabled={!newDiscText.trim()}
                onClick={() => {
                  handleCreatePost(
                    newDiscText,
                    newDiscPriority,
                    newDiscDept,
                    newDiscAttachments
                  );
                  handleCloseModal();
                  setNewDiscText("");
                  setNewDiscPriority("None");
                  setNewDiscDept("All");
                  setNewDiscAttachments([]);
                }}
              >
                Create Discussion
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Discussion Modal */}
      {activeModal === "edit-discussion" && editingPost && (
        <Modal title="Edit Discussion" onClose={handleCloseModal}>
          <div className="space-y-4 text-left">
            <div className="relative">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                Edit Message
              </label>
              <textarea
                rows={4}
                value={editingPost.text}
                onChange={(e) => {
                  const val = e.target.value;
                  setEditingPost((prev) => (prev ? { ...prev, text: val } : null));
                }}
                className="w-full text-xs border border-gray-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-[#5C5CFF] resize-none text-gray-900 bg-white"
              />
              <MentionPopup
                text={editingPost.text}
                setText={(t) =>
                  setEditingPost((prev) => (prev ? { ...prev, text: t } : null))
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Priority Badge
                </label>
                <select
                  value={editingPost.priority || "None"}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditingPost((prev) =>
                      prev
                        ? {
                            ...prev,
                            priority: val === "None" ? undefined : (val as any),
                          }
                        : null
                    );
                  }}
                  className="w-full text-xs bg-white border border-gray-200 rounded-lg p-2 font-medium outline-none text-gray-900"
                >
                  <option value="None">None</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            {/* Simulated Attachments UI for Edit */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Attachments
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const currentAtts = editingPost.attachments || [];
                      setEditingPost((prev) =>
                        prev
                          ? {
                              ...prev,
                              attachments: [
                                ...currentAtts,
                                {
                                  name: `Image_${Date.now()
                                    .toString()
                                    .slice(-4)}.jpg`,
                                  type: "image",
                                  size: "1.4 MB",
                                },
                              ],
                            }
                          : null
                      );
                    }}
                    className="text-[10px] text-[#5C5CFF] font-semibold hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-0"
                  >
                    <Paperclip size={10} /> Add Image
                  </button>
                  <button
                    onClick={() => {
                      const currentAtts = editingPost.attachments || [];
                      setEditingPost((prev) =>
                        prev
                          ? {
                              ...prev,
                              attachments: [
                                ...currentAtts,
                                {
                                  name: `Doc_${Date.now()
                                    .toString()
                                    .slice(-4)}.pdf`,
                                  type: "file",
                                  size: "0.8 MB",
                                },
                              ],
                            }
                          : null
                      );
                    }}
                    className="text-[10px] text-[#5C5CFF] font-semibold hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-0"
                  >
                    <Paperclip size={10} /> Add File
                  </button>
                </div>
              </div>
              {(editingPost.attachments || []).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {(editingPost.attachments || []).map((att, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1.5 bg-gray-55 border border-gray-200 rounded-lg p-1.5 text-[10px] text-gray-700"
                    >
                      <FileText size={10} className="text-gray-455" />
                      <span className="truncate max-w-[120px]">{att.name}</span>
                      <span className="text-gray-400">({att.size})</span>
                      <button
                        onClick={() => {
                          const currentAtts = editingPost.attachments || [];
                          setEditingPost((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  attachments: currentAtts.filter(
                                    (_, idx) => idx !== i
                                  ),
                                }
                              : null
                          );
                        }}
                        className="text-red-500 hover:text-red-750 ml-1 cursor-pointer bg-transparent border-0"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <Btn variant="outline" onClick={handleCloseModal}>
                Cancel
              </Btn>
              <Btn
                variant="primary"
                disabled={!editingPost.text.trim()}
                onClick={() => {
                  handleEditPost(
                    editingPost.id,
                    editingPost.text,
                    editingPost.priority || "None",
                    editingPost.attachments || []
                  );
                  handleCloseModal();
                }}
              >
                Save Changes
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {activeModal === "delete-discussion" && confirmDeleteId && (
        <Modal title="Delete discussion?" onClose={handleCloseModal} width="max-w-[520px]">
          <div className="space-y-4 text-left">
            <p className="text-xs text-gray-500 leading-relaxed">
              Are you sure you want to delete this discussion? All comments and
              replies will also be permanently deleted. This action cannot be
              undone.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Btn
                variant="outline"
                disabled={isDeleting}
                onClick={handleCloseModal}
              >
                Cancel
              </Btn>
              <Btn
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white border-transparent"
                onClick={() => {
                  setIsDeleting(true);
                  setTimeout(() => {
                    handleDeletePost(confirmDeleteId);
                    triggerFeedToast("Discussion deleted");
                    handleCloseModal();
                  }, 800);
                }}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* Feed dynamic toast */}
      {feedToast && (
        <div className="fixed bottom-6 right-6 z-[150] flex items-center gap-2.5 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium">
          <CheckCircle size={15} className="text-green-400" />
          <span>{feedToast}</span>
        </div>
      )}
    </div>
  );
}
