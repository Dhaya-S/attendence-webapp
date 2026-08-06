import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Send,
  Star,
  Megaphone,
  CalendarDays,
  FileText,
  UserPlus,
  Check,
  ArrowRight,
  Upload,
  X,
  Search,
  CheckCircle2,
  Users,
  UserCheck,
  RefreshCw,
  Paperclip,
  Clock,
  Sparkles,
} from "lucide-react";
import { cn } from "@/shared/utils";
import { Btn, Drawer, Avt } from "@/shared/components";
import { db } from "@/shared/utils/firebase";
import {
  collection,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

interface AnnouncementsTabProps {
  showCreateAnnouncement: boolean;
  setShowCreateAnnouncement: (b: boolean) => void;
  teamMembers?: any[];
  companyId?: string;
  currentUser?: {
    name: string;
    email: string;
    initials: string;
    color: string;
    designation: string;
    dept: string;
    role: string;
  };
}

export function AnnouncementsTab({
  showCreateAnnouncement,
  setShowCreateAnnouncement,
  teamMembers = [],
  companyId,
  currentUser,
}: AnnouncementsTabProps) {
  const [teamAnnDetailId, setTeamAnnDetailId] = useState<string | null>(null);

  // Firestore Announcements State
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Announcement Modal State (3-Step Wizard)
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [annTitle, setAnnTitle] = useState("");
  const [annMessage, setAnnMessage] = useState("");
  const [priority, setPriority] = useState("Normal");
  const [publishMode, setPublishMode] = useState("Immediately");
  const [attachments, setAttachments] = useState<{ name: string; size: string }[]>([]);
  const [audienceType, setAudienceType] = useState<"all" | "particular">("all");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [publishing, setPublishing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset modal when opened
  useEffect(() => {
    if (showCreateAnnouncement) {
      setStep(1);
      setAnnTitle("");
      setAnnMessage("");
      setPriority("Normal");
      setPublishMode("Immediately");
      setAttachments([]);
      setAudienceType("all");
      setSelectedMemberIds([]);
      setMemberSearch("");
      setPublishing(false);
    }
  }, [showCreateAnnouncement]);

  // Realtime Firestore Listener for Announcements
  useEffect(() => {
    const compId = companyId && companyId !== "default" ? companyId : "default";
    const colRef = collection(db, "organizations", compId, "team_announcements");

    const unsub = onSnapshot(
      colRef,
      (snap) => {
        const list = snap.docs.map((docSnap) => {
          const data = docSnap.data();
          let createdTime = Date.now();
          if (data.createdAt?.toDate) {
            createdTime = data.createdAt.toDate().getTime();
          } else if (typeof data.createdAt === "number") {
            createdTime = data.createdAt;
          } else if (data.createdAt) {
            createdTime = new Date(data.createdAt).getTime();
          }

          let formattedDate = "Recently";
          if (!isNaN(createdTime) && createdTime > 0) {
            formattedDate = new Date(createdTime).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });
          }

          return {
            id: docSnap.id,
            title: data.title || "Announcement",
            body: data.body || "",
            author: data.author || "Admin",
            authorEmail: data.authorEmail || "",
            time: formattedDate,
            createdAt: createdTime,
            category: data.category || (data.priority === "High" ? "Important" : "General"),
            priority: data.priority || "Normal",
            pinned: !!data.pinned,
            dept: data.dept || "All Team Members",
            audienceType: data.audienceType || "all",
            targetMemberIds: data.targetMemberIds || [],
            attachments: data.attachments || [],
            status: data.status || "Published",
          };
        });

        // Sort by timestamp descending
        list.sort((a, b) => b.createdAt - a.createdAt);
        setAnnouncements(list);
        setLoading(false);
      },
      (err) => {
        console.warn("Error listening to team_announcements:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [companyId]);

  // Realtime Celebrations calculation from Firestore team members
  const celebrations = useMemo(() => {
    const list: any[] = [];
    const today = new Date();
    const currentMonth = today.getMonth();
    const todayDate = today.getDate();

    teamMembers.forEach((emp) => {
      // Birthdays
      const dobStr = emp.dob || emp.dateOfBirth;
      if (dobStr) {
        try {
          const dobDate = new Date(dobStr);
          if (!isNaN(dobDate.getTime()) && dobDate.getMonth() === currentMonth) {
            const isToday = dobDate.getDate() === todayDate;
            const age = today.getFullYear() - dobDate.getFullYear();
            list.push({
              type: "Birthday",
              employee: emp.name || `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || emp.email,
              detail: isToday
                ? `Turning ${age} today 🎂`
                : `Turning ${age} on ${dobDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
              date: isToday ? "Today" : dobDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
              color: emp.color || "#EC4899",
            });
          }
        } catch (_) {}
      }

      // New Joiners / Anniversaries
      const joinStr = emp.joinDate || emp.joiningDate || emp.hireDate || emp.createdAt;
      if (joinStr) {
        try {
          const joinD = new Date(joinStr);
          if (!isNaN(joinD.getTime())) {
            const diffDays = (joinD.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

            // New joiner if joined in last 60 days or starting in next 30 days
            if (diffDays >= -60 && diffDays <= 30) {
              const joinDateStr = joinD.toLocaleDateString("en-US", { month: "short", day: "numeric" });
              list.push({
                type: "New Joiner",
                employee: emp.name || `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || emp.email,
                detail: `Joined ${joinDateStr} · ${emp.dept || emp.department || "Team"}`,
                date: joinDateStr,
                color: emp.color || "#10B981",
              });
            } else if (joinD.getMonth() === currentMonth) {
              const years = today.getFullYear() - joinD.getFullYear();
              if (years > 0) {
                list.push({
                  type: "Anniversary",
                  employee: emp.name || `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || emp.email,
                  detail: `${years} year${years > 1 ? "s" : ""} with team 🎉`,
                  date: joinD.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                  color: emp.color || "#8B5CF6",
                });
              }
            }
          }
        } catch (_) {}
      }
    });

    return list;
  }, [teamMembers]);

  // Filtered Team Members for step 2 selection
  const filteredMembers = useMemo(() => {
    if (!memberSearch.trim()) return teamMembers;
    const low = memberSearch.toLowerCase();
    return teamMembers.filter(
      (m) =>
        (m.name || "").toLowerCase().includes(low) ||
        (m.email || "").toLowerCase().includes(low) ||
        (m.dept || m.department || "").toLowerCase().includes(low) ||
        (m.designation || "").toLowerCase().includes(low)
    );
  }, [teamMembers, memberSearch]);

  const toggleMemberSelection = (idOrEmail: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(idOrEmail)
        ? prev.filter((i) => i !== idOrEmail)
        : [...prev, idOrEmail]
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const newFiles = files.map((f) => ({
        name: f.name,
        size: `${(f.size / 1024).toFixed(1)} KB`,
      }));
      setAttachments((prev) => [...prev, ...newFiles]);
    }
  };

  const handlePublish = async (isDraft = false) => {
    if (!annTitle.trim() && !isDraft) return;
    setPublishing(true);

    const audienceLabel =
      audienceType === "all"
        ? "All Team Members"
        : `${selectedMemberIds.length} Team Member${selectedMemberIds.length === 1 ? "" : "s"}`;

    const newAnn = {
      id: `T_ANN_${Date.now()}`,
      title: annTitle.trim() || (isDraft ? "Draft Announcement" : "Untitled Announcement"),
      body: annMessage.trim(),
      priority,
      publishMode,
      category: priority === "High" ? "Important" : "General",
      audienceType,
      targetMemberIds: audienceType === "particular" ? selectedMemberIds : [],
      dept: audienceLabel,
      author: currentUser?.name || "Alex Admin",
      authorEmail: currentUser?.email || "",
      pinned: priority === "High",
      isDraft,
      status: isDraft ? "Draft" : "Published",
      attachments,
      time: "Today",
      createdAt: Date.now(),
    };

    // Optimistic UI update
    setAnnouncements((prev) => [newAnn, ...prev]);
    setShowCreateAnnouncement(false);

    try {
      const compId = companyId && companyId !== "default" ? companyId : "default";
      const colRef = collection(db, "organizations", compId, "team_announcements");

      await addDoc(colRef, {
        ...newAnn,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn("Error creating announcement in Firestore:", err);
    } finally {
      setPublishing(false);
    }
  };

  // Filter announcements visible to current user
  const visibleAnnouncements = useMemo(() => {
    return announcements.filter((ann) => {
      if (ann.status === "Draft") {
        return ann.authorEmail === currentUser?.email;
      }
      if (ann.audienceType === "particular") {
        const currentUserEmail = currentUser?.email || "";
        const isAuthor = ann.authorEmail === currentUserEmail;
        const isTargeted = ann.targetMemberIds.some(
          (id: string) =>
            id.toLowerCase() === currentUserEmail.toLowerCase() ||
            teamMembers.some(
              (m) =>
                m.id === id &&
                String(m.email || "").toLowerCase() === currentUserEmail.toLowerCase()
            )
        );
        return isAuthor || isTargeted;
      }
      return true;
    });
  }, [announcements, currentUser, teamMembers]);

  const teamAnnDetail =
    visibleAnnouncements.find((a) => a.id === teamAnnDetailId) || null;

  const audienceSummaryText =
    audienceType === "all"
      ? "All Team Members"
      : `${selectedMemberIds.length} Team Member${selectedMemberIds.length === 1 ? "" : "s"}`;

  return (
    <div className="flex flex-col h-full w-full text-left">
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-6 py-5 space-y-6">
          {/* Celebrations & Milestones */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Star size={13} className="text-amber-400 fill-amber-400" />
              Celebrations &amp; Milestones
            </p>
            {celebrations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {celebrations.map((c, i) => (
                  <div
                    key={i}
                    className="bg-white border border-gray-200 rounded-xl p-4 hover:border-[#5C5CFF]/30 hover:shadow-sm transition-all cursor-pointer flex items-center gap-3"
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-base flex-shrink-0"
                      style={{ backgroundColor: c.color }}
                    >
                      {c.type === "Birthday"
                        ? "🎂"
                        : c.type === "Anniversary"
                        ? "🎉"
                        : "👋"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-gray-900 truncate">
                          {c.employee}
                        </p>
                        <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                          {c.date}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5 truncate">
                        {c.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl p-4 text-center text-xs text-gray-400">
                No upcoming birthdays or team milestones this month.
              </div>
            )}
          </div>

          {/* Team Announcements List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                <Megaphone size={13} className="text-[#5C5CFF]" />
                Team Announcements
              </p>
              <Btn
                size="sm"
                onClick={() => setShowCreateAnnouncement(true)}
                className="bg-[#5C5CFF] hover:bg-[#4B4BEE] text-white text-xs h-8 px-3"
              >
                + Create Announcement
              </Btn>
            </div>

            {loading ? (
              <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
                <RefreshCw size={16} className="animate-spin text-[#5C5CFF]" />
                Loading announcements...
              </div>
            ) : visibleAnnouncements.length > 0 ? (
              <div className="space-y-3">
                {visibleAnnouncements.map((a) => (
                  <div
                    key={a.id}
                    onClick={() => setTeamAnnDetailId(a.id)}
                    className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:border-[#5C5CFF]/30 hover:shadow-sm transition-all flex items-start gap-3.5 group"
                  >
                    <div
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white shadow-sm",
                        a.priority === "High"
                          ? "bg-[#5C5CFF]"
                          : a.category === "New Joiner"
                          ? "bg-green-500"
                          : "bg-indigo-400"
                      )}
                    >
                      {a.category === "Event" ? (
                        <CalendarDays size={18} />
                      ) : a.category === "Policy" ? (
                        <FileText size={18} />
                      ) : a.category === "New Joiner" ? (
                        <UserPlus size={18} />
                      ) : (
                        <Megaphone size={18} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={cn(
                            "text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider",
                            a.priority === "High"
                              ? "bg-red-50 text-red-600"
                              : "bg-[#EEF2FF] text-[#5C5CFF]"
                          )}
                        >
                          {a.category}
                        </span>
                        {a.status === "Draft" && (
                          <span className="text-[10px] font-semibold bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded uppercase">
                            Draft
                          </span>
                        )}
                        <span className="text-[10px] text-gray-400 ml-auto flex items-center gap-1">
                          <Clock size={11} />
                          {a.time}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900 group-hover:text-[#5C5CFF] transition-colors mb-1">
                        {a.title}
                      </h3>
                      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                        {a.body}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text.xs text-gray-400">
                        <Avt
                          initials={(a.author || "Admin")
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .toUpperCase()}
                          color="#5C5CFF"
                          size="xs"
                        />
                        <span className="text-[11px] font-medium text-gray-600">
                          {a.author}
                        </span>
                        <span>·</span>
                        <span className="text-[11px] text-gray-400">
                          {a.dept}
                        </span>
                        {a.attachments && a.attachments.length > 0 && (
                          <>
                            <span>·</span>
                            <span className="text-[11px] text-[#5C5CFF] flex items-center gap-1">
                              <Paperclip size={10} />
                              {a.attachments.length} file(s)
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#EEF2FF] text-[#5C5CFF] flex items-center justify-center mx-auto">
                  <Megaphone size={22} />
                </div>
                <h3 className="text-sm font-semibold text-gray-900">
                  No Team Announcements
                </h3>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  Create an announcement to share important updates, meetings, or news with your team members.
                </p>
                <Btn
                  size="sm"
                  onClick={() => setShowCreateAnnouncement(true)}
                  className="bg-[#5C5CFF] hover:bg-[#4B4BEE] text-white text-xs h-9 px-4 mx-auto"
                >
                  + Create Announcement
                </Btn>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── CREATE ANNOUNCEMENT MODAL (3-STEP WIZARD UI) ── */}
      {showCreateAnnouncement && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Create Announcement
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Step {step} of 3
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handlePublish(true)}
                  className="px-3.5 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateAnnouncement(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Step Progress Stepper Bar */}
            <div className="px-6 py-3.5 bg-gray-50/60 border-b border-gray-100 flex items-center justify-center gap-3">
              {/* Step 1 Pill */}
              {step === 1 ? (
                <span className="bg-[#5C5CFF] text-white px-3.5 py-1 rounded-full text-xs font-semibold shadow-sm">
                  1 Details
                </span>
              ) : (
                <span className="bg-[#DCFCE7] text-[#15803D] px-3.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                  <Check size={12} /> Details
                </span>
              )}

              <div className="w-8 h-[2px] bg-gray-200" />

              {/* Step 2 Pill */}
              {step === 1 ? (
                <span className="bg-gray-100 text-gray-500 px-3.5 py-1 rounded-full text-xs font-medium">
                  2 Audience
                </span>
              ) : step === 2 ? (
                <span className="bg-[#5C5CFF] text-white px-3.5 py-1 rounded-full text-xs font-semibold shadow-sm">
                  2 Audience
                </span>
              ) : (
                <span className="bg-[#DCFCE7] text-[#15803D] px-3.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                  <Check size={12} /> Audience
                </span>
              )}

              <div className="w-8 h-[2px] bg-gray-200" />

              {/* Step 3 Pill */}
              {step === 3 ? (
                <span className="bg-[#5C5CFF] text-white px-3.5 py-1 rounded-full text-xs font-semibold shadow-sm">
                  3 Preview
                </span>
              ) : (
                <span className="bg-gray-100 text-gray-500 px-3.5 py-1 rounded-full text-xs font-medium">
                  3 Preview
                </span>
              )}
            </div>

            {/* Modal Body Content */}
            <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
              {/* ── STEP 1: DETAILS ── */}
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Announcement Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Q3 All-Hands Meeting"
                      value={annTitle}
                      onChange={(e) => setAnnTitle(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#5C5CFF] focus:ring-1 focus:ring-[#5C5CFF] transition-all bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Write your announcement message..."
                      value={annMessage}
                      onChange={(e) => setAnnMessage(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#5C5CFF] focus:ring-1 focus:ring-[#5C5CFF] transition-all resize-none bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        Priority
                      </label>
                      <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:border-[#5C5CFF]"
                      >
                        <option value="Normal">Normal</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        Publish
                      </label>
                      <select
                        value={publishMode}
                        onChange={(e) => setPublishMode(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:border-[#5C5CFF]"
                      >
                        <option value="Immediately">Immediately</option>
                        <option value="Schedule for Later">Schedule for Later</option>
                        <option value="Save as Draft">Save as Draft</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Attachments
                    </label>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      className="hidden"
                      multiple
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="border border-dashed border-gray-300 rounded-xl px-3.5 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Upload size={14} className="text-gray-500" />
                      Attach files
                    </button>

                    {attachments.length > 0 && (
                      <div className="mt-2 space-y-1.5">
                        {attachments.map((file, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between bg-gray-50 px-3 py-1.5 rounded-lg text-xs border border-gray-150"
                          >
                            <span className="text-gray-700 font-medium truncate">
                              {file.name} ({file.size})
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setAttachments((prev) =>
                                  prev.filter((_, i) => i !== idx)
                                )
                              }
                              className="text-gray-400 hover:text-red-500 ml-2"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── STEP 2: AUDIENCE (TAILORED FOR TEAM ANNOUNCEMENTS) ── */}
              {step === 2 && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Select Audience
                  </h4>

                  {/* Audience Option 1: All Team Members */}
                  <div
                    onClick={() => setAudienceType("all")}
                    className={cn(
                      "border rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all",
                      audienceType === "all"
                        ? "border-[#5C5CFF] bg-[#F5F5FF] shadow-sm"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-5 h-5 rounded-full border flex items-center justify-center transition-colors",
                          audienceType === "all"
                            ? "border-[#5C5CFF] bg-[#5C5CFF] text-white"
                            : "border-gray-300 bg-white"
                        )}
                      >
                        {audienceType === "all" && <Check size={12} strokeWidth={3} />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          All Team Members
                        </p>
                        <p className="text-xs text-gray-500">
                          Broadcast to everyone on your team
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-gray-500 bg-white px-2.5 py-1 rounded-lg border border-gray-150">
                      {teamMembers.length} people
                    </span>
                  </div>

                  {/* Audience Option 2: Particular Team Member */}
                  <div
                    onClick={() => setAudienceType("particular")}
                    className={cn(
                      "border rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all",
                      audienceType === "particular"
                        ? "border-[#5C5CFF] bg-[#F5F5FF] shadow-sm"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-5 h-5 rounded-full border flex items-center justify-center transition-colors",
                          audienceType === "particular"
                            ? "border-[#5C5CFF] bg-[#5C5CFF] text-white"
                            : "border-gray-300 bg-white"
                        )}
                      >
                        {audienceType === "particular" && (
                          <Check size={12} strokeWidth={3} />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          Particular Team Member
                        </p>
                        <p className="text-xs text-gray-500">
                          Select specific members to receive this announcement
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-gray-500 bg-white px-2.5 py-1 rounded-lg border border-gray-150">
                      {selectedMemberIds.length} selected
                    </span>
                  </div>

                  {/* Expandable Particular Team Member Picker */}
                  {audienceType === "particular" && (
                    <div className="border border-gray-200 rounded-xl p-3 bg-gray-50/50 space-y-3 animate-in fade-in duration-150">
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <Search
                            size={14}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                          />
                          <input
                            type="text"
                            placeholder="Search team member..."
                            value={memberSearch}
                            onChange={(e) => setMemberSearch(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-900 outline-none focus:border-[#5C5CFF]"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (selectedMemberIds.length === teamMembers.length) {
                              setSelectedMemberIds([]);
                            } else {
                              setSelectedMemberIds(
                                teamMembers.map((m) => m.id || m.email)
                              );
                            }
                          }}
                          className="text-xs text-[#5C5CFF] font-semibold px-2 py-1 hover:underline"
                        >
                          {selectedMemberIds.length === teamMembers.length
                            ? "Deselect All"
                            : "Select All"}
                        </button>
                      </div>

                      <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                        {filteredMembers.map((m) => {
                          const idVal = m.id || m.email;
                          const isSelected = selectedMemberIds.includes(idVal);
                          return (
                            <div
                              key={idVal}
                              onClick={() => toggleMemberSelection(idVal)}
                              className={cn(
                                "flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors border",
                                isSelected
                                  ? "bg-white border-[#5C5CFF]/30 shadow-2xs"
                                  : "bg-white border-transparent hover:bg-gray-100/60"
                              )}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <Avt
                                  initials={m.initials || (m.name || "EM").slice(0, 2).toUpperCase()}
                                  color={m.color || "#5C5CFF"}
                                  size="xs"
                                />
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-gray-900 truncate">
                                    {m.name || m.email}
                                  </p>
                                  <p className="text-[10px] text-gray-400 truncate">
                                    {m.designation || m.dept || "Team Member"}
                                  </p>
                                </div>
                              </div>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                className="w-4 h-4 rounded text-[#5C5CFF] focus:ring-[#5C5CFF] accent-[#5C5CFF]"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── STEP 3: PREVIEW ── */}
              {step === 3 && (
                <div className="space-y-4">
                  {/* Announcement Card Preview */}
                  <div className="bg-gray-50/80 rounded-2xl p-5 border border-gray-200/80 space-y-4 shadow-2xs">
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] text-[#5C5CFF] flex items-center justify-center flex-shrink-0">
                        <Megaphone size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-base font-bold text-gray-900 truncate">
                          {annTitle.trim() || "Untitled Announcement"}
                        </h4>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {audienceSummaryText} · by{" "}
                          {currentUser?.name || "Alex Admin"}
                        </p>
                      </div>
                    </div>

                    <div className="text-xs text-gray-600 leading-relaxed whitespace-pre-line bg-white rounded-xl p-3.5 border border-gray-150 min-h-[80px]">
                      {annMessage.trim() || "No message yet"}
                    </div>

                    {attachments.length > 0 && (
                      <div className="flex items-center gap-2 text-xs text-[#5C5CFF] font-medium">
                        <Paperclip size={12} />
                        <span>{attachments.length} attachment(s) attached</span>
                      </div>
                    )}
                  </div>

                  {/* Ready to Publish Success Alert Banner */}
                  <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl p-3.5 flex items-center gap-2.5 text-xs text-[#047857] font-semibold">
                    <CheckCircle2 size={16} className="text-[#10B981] flex-shrink-0" />
                    <span>Ready to publish to {audienceSummaryText}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Bottom Footer Bar */}
            <div className="px-6 py-4 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between">
              {step === 1 ? (
                <button
                  type="button"
                  onClick={() => setShowCreateAnnouncement(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setStep((s) => (s - 1) as any)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
              )}

              {step === 1 && (
                <button
                  type="button"
                  disabled={!annTitle.trim() || !annMessage.trim()}
                  onClick={() => setStep(2)}
                  className="px-5 py-2 bg-[#5C5CFF] hover:bg-[#4B4BEE] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  Next <ArrowRight size={14} />
                </button>
              )}

              {step === 2 && (
                <button
                  type="button"
                  disabled={
                    audienceType === "particular" &&
                    selectedMemberIds.length === 0
                  }
                  onClick={() => setStep(3)}
                  className="px-5 py-2 bg-[#5C5CFF] hover:bg-[#4B4BEE] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  Next <ArrowRight size={14} />
                </button>
              )}

              {step === 3 && (
                <button
                  type="button"
                  disabled={publishing}
                  onClick={() => handlePublish(false)}
                  className="px-5 py-2 bg-[#5C5CFF] hover:bg-[#4B4BEE] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  {publishing ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      Publish
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Contextual Overlay Drawer for Announcement Details */}
      <Drawer
        isOpen={!!teamAnnDetailId}
        onClose={() => setTeamAnnDetailId(null)}
        title={teamAnnDetail?.title || "Announcement"}
        avatar={
          teamAnnDetail ? (
            <Avt
              initials={(teamAnnDetail.author || "Admin")
                .split(" ")
                .map((n: string) => n[0])
                .join("")
                .toUpperCase()}
              color="#5C5CFF"
              size="sm"
            />
          ) : null
        }
        headerAddon={
          teamAnnDetail ? (
            <span className="text-[10px] font-semibold bg-[#EEF2FF] text-[#5C5CFF] px-2 py-0.5 rounded uppercase">
              {teamAnnDetail.category}
            </span>
          ) : null
        }
        footer={
          <Btn variant="outline" onClick={() => setTeamAnnDetailId(null)}>
            Close Details
          </Btn>
        }
      >
        {teamAnnDetail && (
          <div className="space-y-6 text-left">
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between text-xs text-gray-400 pb-3 border-b border-gray-100">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                    Published By
                  </p>
                  <p className="text-xs font-semibold text-gray-800 mt-1">
                    {teamAnnDetail.author} ({teamAnnDetail.dept})
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                    Date
                  </p>
                  <p className="text-xs font-semibold text-gray-800 mt-1">
                    {teamAnnDetail.time}
                  </p>
                </div>
              </div>
              <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line font-medium">
                {teamAnnDetail.body}
              </div>

              {teamAnnDetail.attachments &&
                teamAnnDetail.attachments.length > 0 && (
                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-700 mb-2">
                      Attachments ({teamAnnDetail.attachments.length})
                    </p>
                    <div className="space-y-1.5">
                      {teamAnnDetail.attachments.map((file: any, i: number) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg text-xs border border-gray-200 text-gray-700"
                        >
                          <Paperclip size={13} className="text-[#5C5CFF]" />
                          <span className="font-medium truncate">{file.name}</span>
                          <span className="text-gray-400 ml-auto">{file.size}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
