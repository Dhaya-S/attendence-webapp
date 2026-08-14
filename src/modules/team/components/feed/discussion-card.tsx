import React, { useState } from "react";
import {
  Star,
  MessageCircle,
  Bookmark,
  Bell,
  MoreHorizontal,
  Edit,
  Pin,
  Share2,
  CheckCircle,
  Trash2,
  Paperclip,
  X,
  Download,
  FileText,
} from "lucide-react";
import { FeedPost, FeedComment } from "../../types";
import { cn } from "@/shared/utils";
import { Avt } from "@/shared/components";
import { MentionPopup } from "./mention-popup";

function CornerDownRight(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width={props.size || "24"}
      height={props.size || "24"}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="15 10 20 15 15 20" />
      <path d="M4 4v7a4 4 0 0 0 4 4h12" />
    </svg>
  );
}

export function DiscussionCard({
  post,
  isPinned,
  isSaved,
  isResolved,
  isFollower,
  isAuthor,
  isManagerOrAdmin,
  onTogglePin,
  onToggleSave,
  onToggleResolve,
  onToggleFollow,
  onDelete,
  onEdit,
  onToggleReaction,
  onAddComment,
  onEditComment,
  onDeleteComment,
  currentUser,
  teamMembers = [],
}: {
  post: FeedPost;
  isPinned: boolean;
  isSaved: boolean;
  isResolved: boolean;
  isFollower: boolean;
  isAuthor: boolean;
  isManagerOrAdmin: boolean;
  onTogglePin: (id: string) => void;
  onToggleSave: (id: string) => void;
  onToggleResolve: (id: string) => void;
  onToggleFollow: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (post: FeedPost) => void;
  onToggleReaction: (postId: string, emoji: string, commentId?: string) => void;
  onAddComment: (
    postId: string,
    parentCommentId: string | null,
    text: string,
    attachment?: any
  ) => void;
  onEditComment: (postId: string, commentId: string, text: string) => void;
  onDeleteComment: (postId: string, commentId: string) => void;
  currentUser?: {
    name?: string;
    email?: string;
    initials?: string;
    color?: string;
  };
  teamMembers?: any[];
}) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showComments, setShowComments] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [commentAttachment, setCommentAttachment] = useState<any>(null);

  // Threading/Reply target state
  const [replyToCommentId, setReplyToCommentId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  // Comment Edit target state
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");

  // Collapse replies state
  const [collapsedReplies, setCollapsedReplies] = useState<Record<string, boolean>>({});

  const emojiOptions = ["👍", "❤️", "🎉", "😮", "👏", "💡", "📌"];

  const handleCopyLink = () => {
    navigator.clipboard.writeText(
      `${window.location.origin}/feed/discussion/${post.id}`
    );
    alert("Discussion link copied to clipboard!");
    setShowMenu(false);
  };

  return (
    <div className="group relative bg-white border border-[#EEEFF2] rounded-[12px] p-5 shadow-sm hover:border-[#5C5CFF]/30 transition-all text-left">
      {/* Floating Hover Action Bar */}
      <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center bg-white border border-[#E8E9ED] rounded-[8px] shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-1 gap-1 z-10">
        {/* React Trigger */}
        <div className="relative">
          <button
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            className={cn(
              "p-1.5 rounded hover:bg-gray-50 text-gray-500 hover:text-gray-755 cursor-pointer",
              showEmojiPicker && "bg-gray-100"
            )}
            title="React"
          >
            <Star size={14} />
          </button>
          {showEmojiPicker && (
            <div className="absolute bottom-full right-0 mb-2 bg-white border border-gray-200 rounded-full shadow-lg p-1.5 flex gap-1 z-25">
              {emojiOptions.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    onToggleReaction(post.id, emoji);
                    setShowEmojiPicker(false);
                  }}
                  className="w-7 h-7 flex items-center justify-center text-sm rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Comment Trigger */}
        <button
          onClick={() => setShowComments((prev) => !prev)}
          className="p-1.5 rounded hover:bg-gray-50 text-gray-550 hover:text-gray-700 cursor-pointer"
          title="Comment"
        >
          <MessageCircle size={14} />
        </button>

        {/* Save Toggle */}
        <button
          onClick={() => onToggleSave(post.id)}
          className={cn(
            "p-1.5 rounded hover:bg-gray-50 cursor-pointer",
            isSaved ? "text-[#5C5CFF]" : "text-gray-500"
          )}
          title={isSaved ? "Saved" : "Save"}
        >
          <Bookmark size={14} fill={isSaved ? "currentColor" : "none"} />
        </button>

        {/* Follow Toggle */}
        <button
          onClick={() => onToggleFollow(post.id)}
          className={cn(
            "p-1.5 rounded hover:bg-gray-50 text-xs font-semibold px-2 flex items-center gap-1 cursor-pointer",
            isFollower ? "text-green-600 bg-green-50" : "text-gray-500"
          )}
          title={isFollower ? "Following" : "Follow"}
        >
          <Bell size={12} fill={isFollower ? "currentColor" : "none"} />
          <span>{isFollower ? "Following" : "Follow"}</span>
        </button>

        {/* Overflow Menu trigger */}
        <div className="relative">
          <button
            onClick={() => setShowMenu((prev) => !prev)}
            className="p-1.5 rounded hover:bg-gray-50 text-gray-550 hover:text-gray-700 cursor-pointer"
          >
            <MoreHorizontal size={14} />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-20 py-1 w-44 text-left">
              {(isAuthor || isManagerOrAdmin) && (
                <button
                  onClick={() => {
                    onEdit(post);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer bg-white text-left"
                >
                  <Edit size={12} />
                  <span>Edit Post</span>
                </button>
              )}
              {isManagerOrAdmin && (
                <button
                  onClick={() => {
                    onTogglePin(post.id);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer bg-white text-left"
                >
                  <Pin size={12} />
                  <span>{isPinned ? "Unpin Post" : "Pin Post"}</span>
                </button>
              )}
              <button
                onClick={() => {
                  onToggleSave(post.id);
                  setShowMenu(false);
                }}
                className="w-full px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer bg-white text-left"
              >
                <Bookmark size={12} />
                <span>{isSaved ? "Unsave Post" : "Save Post"}</span>
              </button>
              <button
                onClick={handleCopyLink}
                className="w-full px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer bg-white text-left"
              >
                <Share2 size={12} />
                <span>Copy Link</span>
              </button>
              {(isAuthor || isManagerOrAdmin) && (
                <button
                  onClick={() => {
                    onToggleResolve(post.id);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer bg-white text-left"
                >
                  <CheckCircle size={12} />
                  <span>{isResolved ? "Mark as Unresolved" : "Mark as Resolved"}</span>
                </button>
              )}
              {(isAuthor || isManagerOrAdmin) && (
                <button
                  onClick={() => {
                    onDelete(post.id);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-1.5 text-xs text-red-650 hover:bg-red-50 flex items-center gap-2 border-t border-gray-100 cursor-pointer bg-white text-left"
                >
                  <Trash2 size={12} />
                  <span>Delete Post</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Card Header */}
      <div className="flex items-start gap-3 mb-3">
        <Avt initials={post.initials} color={post.color} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-gray-808">{post.author}</span>
            <span className="text-[10px] text-gray-400">{post.designation}</span>
            <span className="text-[9px] font-bold bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded uppercase">
              {post.dept}
            </span>
            {isPinned && (
              <span className="text-[9px] font-bold bg-[#EEF2FF] text-[#5C5CFF] px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                <Pin size={8} /> Pinned
              </span>
            )}
            {isResolved && (
              <span className="text-[9px] font-bold bg-green-50 text-green-700 px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                <CheckCircle size={8} /> Resolved
              </span>
            )}
            {post.priority && (
              <span
                className={cn(
                  "text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                  post.priority === "High"
                    ? "bg-red-50 text-red-500"
                    : post.priority === "Medium"
                    ? "bg-amber-50 text-amber-600"
                    : "bg-blue-50 text-blue-600"
                )}
              >
                {post.priority} Priority
              </span>
            )}
            <span className="text-[10px] text-gray-400 ml-auto">{post.time}</span>
          </div>
        </div>
      </div>

      {/* Discussion Body */}
      <div className="space-y-2">
        <p className="text-xs text-gray-707 leading-relaxed font-medium whitespace-pre-line">
          {post.text}
        </p>

        {post.edited && (
          <p className="text-[10px] text-gray-400 italic">
            Edited • {post.editedTime || "2 mins ago"}
          </p>
        )}

        {/* Attachments rendering */}
        {post.attachments && post.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2.5 mt-2">
            {post.attachments.map((att, i) => (
              <div
                key={i}
                className="border border-gray-150 rounded-xl overflow-hidden bg-gray-50 flex items-center gap-3 p-2.5 pr-4 max-w-[320px]"
              >
                {att.type === "image" ? (
                  <div className="w-10 h-10 bg-indigo-50 text-[#5C5CFF] rounded-lg flex-shrink-0 flex items-center justify-center font-bold text-xs">
                    🖼️
                  </div>
                ) : (
                  <div className="w-10 h-10 bg-red-50 text-red-500 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold">
                    <FileText size={18} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-gray-800 truncate">
                    {att.name}
                  </p>
                  <p className="text-[10px] text-gray-400">{att.size}</p>
                </div>
                <button
                  type="button"
                  className="text-xs text-[#5C5CFF] font-semibold hover:underline ml-auto flex items-center gap-1 cursor-pointer bg-transparent border-0"
                >
                  <Download size={12} />
                  Download
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reactions Display */}
      {post.reactions.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap mt-3.5">
          {post.reactions.map((r) => {
            const usersList = r.users || [];
            const hasReacted = usersList.includes(currentUser?.name || "") || (!!currentUser?.email && usersList.includes(currentUser.email));
            return (
              <button
                key={r.emoji}
                onClick={() => onToggleReaction(post.id, r.emoji)}
                className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-xs transition-colors cursor-pointer",
                  hasReacted
                    ? "border-[#5C5CFF]/30 bg-[#EEF2FF] text-[#5C5CFF] font-bold"
                    : "border-gray-150 hover:border-gray-205 text-gray-500 bg-white"
                )}
                title={usersList.join(", ")}
              >
                <span>{r.emoji}</span>
                <span>{usersList.length}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Comment Section (Collapsible) */}
      {showComments && (
        <div className="border-t border-gray-100 mt-4 pt-4 space-y-4">
          {/* Threaded list of comments */}
          {post.comments.length > 0 && (
            <div className="space-y-4 max-h-[400px] overflow-auto pr-1">
              {post.comments.map((comment) => {
                const replies = comment.replies || [];
                const isCollapsed = collapsedReplies[comment.id];

                return (
                  <div
                    key={comment.id}
                    className="space-y-3 pl-1 border-l-2 border-gray-100 hover:border-[#5C5CFF]/30 transition-colors"
                  >
                    {/* Main comment card */}
                    <div className="group/comment relative flex items-start gap-2.5">
                      <Avt initials={comment.initials} color={comment.color} size="xs" />
                      <div className="flex-1 bg-gray-50 rounded-xl p-3 text-left">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-gray-808">
                            {comment.author}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {comment.time}
                          </span>
                          {comment.edited && (
                            <span className="text-[9px] text-gray-400 italic">
                              (edited)
                            </span>
                          )}
                        </div>
                        {editingCommentId === comment.id ? (
                          <div className="space-y-2">
                            <textarea
                              rows={2}
                              value={editingCommentText}
                              onChange={(e) => setEditingCommentText(e.target.value)}
                              className="w-full text-xs border border-gray-200 rounded-lg p-2 focus:ring-1 focus:ring-[#5C5CFF] outline-none bg-white text-gray-900"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  onEditComment(post.id, comment.id, editingCommentText);
                                  setEditingCommentId(null);
                                }}
                                className="px-2.5 py-1 bg-[#5C5CFF] text-white text-[10px] rounded-lg font-bold cursor-pointer"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingCommentId(null)}
                                className="px-2.5 py-1 text-[10px] text-gray-500 border border-gray-200 rounded-lg cursor-pointer bg-white"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-750 leading-relaxed font-semibold">
                            {comment.text}
                          </p>
                        )}

                        {comment.attachment && (
                          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-[#5C5CFF] font-semibold bg-white border border-gray-150 rounded px-2 py-1 max-w-[180px]">
                            <Paperclip size={10} />
                            <span className="truncate">
                              {comment.attachment.name}
                            </span>
                          </div>
                        )}

                        {/* Comment Reactions */}
                        {(comment.reactions || []).length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {(comment.reactions || []).map((cr) => (
                              <button
                                key={cr.emoji}
                                onClick={() =>
                                  onToggleReaction(post.id, cr.emoji, comment.id)
                                }
                                className="px-1.5 py-0.5 bg-white border border-gray-150 rounded-full text-[10px] text-gray-605 hover:bg-gray-100 flex items-center gap-0.5 font-bold cursor-pointer"
                              >
                                <span>{cr.emoji}</span>
                                <span>{(cr.users || []).length}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Comment hover action bar */}
                      <div className="absolute right-3 top-3 opacity-0 group-hover/comment:opacity-100 transition-opacity flex items-center bg-white border border-gray-155 rounded shadow p-0.5 gap-0.5">
                        <button
                          onClick={() => onToggleReaction(post.id, "👍", comment.id)}
                          className="p-1 hover:bg-gray-100 text-[10px] text-gray-500 cursor-pointer bg-white border-0"
                          title="React 👍"
                        >
                          👍
                        </button>
                        <button
                          onClick={() => {
                            setReplyToCommentId(comment.id);
                            setReplyText("");
                          }}
                          className="p-1 hover:bg-gray-100 text-gray-450 hover:text-gray-700 cursor-pointer bg-white border-0"
                          title="Reply"
                        >
                          <CornerDownRight size={10} />
                        </button>
                        {(comment.author === (currentUser?.name || "") || (!!comment.authorEmail && comment.authorEmail === currentUser?.email) || isManagerOrAdmin) && (
                          <>
                            <button
                              onClick={() => {
                                setEditingCommentId(comment.id);
                                setEditingCommentText(comment.text);
                              }}
                              className="p-1 hover:bg-gray-100 text-gray-455 hover:text-[#5C5CFF] cursor-pointer bg-white border-0"
                              title="Edit"
                            >
                              <Edit size={10} />
                            </button>
                            <button
                              onClick={() => onDeleteComment(post.id, comment.id)}
                              className="p-1 hover:bg-gray-100 text-gray-455 hover:text-red-500 cursor-pointer bg-white border-0"
                              title="Delete"
                            >
                              <Trash2 size={10} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Collapsible replies indicator */}
                    {replies.length > 0 && (
                      <div className="pl-6 flex items-center gap-2">
                        <button
                          onClick={() =>
                            setCollapsedReplies((prev) => ({
                              ...prev,
                              [comment.id]: !prev[comment.id],
                            }))
                          }
                          className="text-[10px] text-gray-400 hover:text-[#5C5CFF] font-semibold flex items-center gap-1 cursor-pointer bg-transparent border-0"
                        >
                          {isCollapsed
                            ? `Expand ${replies.length} replies`
                            : `Collapse replies`}
                        </button>
                      </div>
                    )}

                    {/* Replies timeline */}
                    {!isCollapsed &&
                      replies.map((reply) => (
                        <div
                          key={reply.id}
                          className="group/reply relative flex items-start gap-2.5 pl-6"
                        >
                          <Avt initials={reply.initials} color={reply.color} size="xs" />
                          <div className="flex-1 bg-white border border-gray-150 rounded-xl p-2.5 text-left shadow-sm">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-[10px] font-bold text-gray-808">
                                {reply.author}
                              </span>
                              <span className="text-[9px] text-gray-400">
                                {reply.time}
                              </span>
                            </div>
                            <p className="text-xs text-gray-605 leading-relaxed font-semibold">
                              {reply.text}
                            </p>
                          </div>
                          {(reply.author === (currentUser?.name || "") || (!!reply.authorEmail && reply.authorEmail === currentUser?.email) || isManagerOrAdmin) && (
                            <div className="absolute right-3 top-3 opacity-0 group-hover/reply:opacity-100 transition-opacity flex items-center bg-white border border-gray-150 rounded shadow p-0.5 gap-0.5 z-10">
                              <button
                                onClick={() => onDeleteComment(post.id, reply.id)}
                                className="p-1 hover:bg-gray-100 text-gray-455 hover:text-red-500 cursor-pointer bg-white border-0"
                                title="Delete Reply"
                              >
                                <Trash2 size={10} />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}

                    {/* Nested reply input box */}
                    {replyToCommentId === comment.id && (
                      <div className="pl-6 relative">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && replyText.trim()) {
                                onAddComment(post.id, comment.id, replyText);
                                setReplyToCommentId(null);
                                setReplyText("");
                              }
                            }}
                            placeholder={`Reply to ${comment.author}...`}
                            className="flex-1 px-3 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-[#5C5CFF] text-gray-900 bg-white"
                          />
                          <button
                            onClick={() => {
                              if (replyText.trim()) {
                                onAddComment(post.id, comment.id, replyText);
                                setReplyToCommentId(null);
                                setReplyText("");
                              }
                            }}
                            className="px-3 py-1.5 bg-[#5C5CFF] text-white text-[10px] font-bold rounded-lg cursor-pointer"
                          >
                            Reply
                          </button>
                          <button
                            onClick={() => setReplyToCommentId(null)}
                            className="p-1.5 text-gray-450 hover:text-gray-700 border border-gray-200 rounded-lg bg-white cursor-pointer"
                          >
                            <X size={12} />
                          </button>
                        </div>
                        <MentionPopup text={replyText} setText={setReplyText} teamMembers={teamMembers} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* New comment input area */}
          <div className="flex items-center gap-2.5 pt-2 relative">
            <Avt initials={currentUser?.initials || "TM"} color={currentUser?.color || "#5C5CFF"} size="xs" />
            <div className="flex-1 flex items-center gap-2">
              <div className="flex-1 border border-gray-200 rounded-full px-4 py-1.5 flex items-center gap-2 bg-gray-50/50 focus-within:ring-2 focus-within:ring-[#5C5CFF] focus-within:bg-white transition-all">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && commentText.trim()) {
                      onAddComment(post.id, null, commentText, commentAttachment);
                      setCommentText("");
                      setCommentAttachment(null);
                    }
                  }}
                  placeholder="Write a comment..."
                  className="w-full bg-transparent border-0 outline-none text-xs text-gray-900 placeholder:text-gray-400 font-medium"
                />

                <label className="text-gray-400 hover:text-gray-600 cursor-pointer flex-shrink-0">
                  <Paperclip size={14} />
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setCommentAttachment({
                          name: file.name,
                          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
                        });
                      }
                    }}
                  />
                </label>
              </div>

              <button
                type="button"
                disabled={!commentText.trim()}
                onClick={() => {
                  if (commentText.trim()) {
                    onAddComment(post.id, null, commentText, commentAttachment);
                    setCommentText("");
                    setCommentAttachment(null);
                  }
                }}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all border-0",
                  commentText.trim()
                    ? "bg-[#5C5CFF] text-white hover:bg-[#4B4BEE] shadow-sm cursor-pointer"
                    : "bg-[#5C5CFF] text-white/80 cursor-pointer"
                )}
              >
                Post
              </button>

              {commentAttachment && (
                <div className="flex items-center gap-1.5 text-[9px] text-[#5C5CFF] font-semibold bg-white border border-gray-150 rounded px-2 py-0.5 max-w-[180px]">
                  <Paperclip size={8} />
                  <span className="truncate">{commentAttachment.name}</span>
                  <button
                    onClick={() => setCommentAttachment(null)}
                    className="text-red-505 ml-auto cursor-pointer bg-transparent border-0"
                  >
                    <X size={8} />
                  </button>
                </div>
              )}

              <MentionPopup text={commentText} setText={setCommentText} teamMembers={teamMembers} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
