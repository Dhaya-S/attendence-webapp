import React, { useState, useMemo } from "react";
import {
  Send,
  Star,
  Megaphone,
  CalendarDays,
  FileText,
  UserPlus,
} from "lucide-react";
import { cn } from "@/shared/utils";
import { Btn, Drawer, Avt } from "@/shared/components";
import { TEAM_CELEBRATIONS } from "../../data/team-data";

interface AnnouncementsTabProps {
  showCreateAnnouncement: boolean;
  setShowCreateAnnouncement: (b: boolean) => void;
  teamMembers?: any[];
}

export function AnnouncementsTab({
  showCreateAnnouncement,
  setShowCreateAnnouncement,
  teamMembers,
}: AnnouncementsTabProps) {
  const [teamAnnDetailId, setTeamAnnDetailId] = useState<string | null>(null);

  const today = useMemo(() => new Date(), []);
  const currentMonth = useMemo(() => today.getMonth(), [today]);
  const todayDate = useMemo(() => today.getDate(), [today]);
  const baseMembers = teamMembers || [];

  const celebrations = useMemo(() => {
    const list: any[] = [];
    baseMembers.forEach((emp) => {
      // Birthdays
      if (emp.dob) {
        try {
          const dobDate = new Date(emp.dob);
          if (!isNaN(dobDate.getTime()) && dobDate.getMonth() === currentMonth) {
            const isToday = dobDate.getDate() === todayDate;
            const age = today.getFullYear() - dobDate.getFullYear();
            list.push({
              type: "Birthday",
              employee: emp.name || emp.email,
              detail: isToday ? `Turning ${age} today 🎂` : `Turning ${age} on ${dobDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
              date: isToday ? "Today" : dobDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
              color: emp.color || "#EC4899",
            });
          }
        } catch (_) {}
      }
      
      // Anniversaries
      const joinStr = emp.joinDate || emp.createdAt;
      if (joinStr) {
        try {
          const joinD = new Date(joinStr);
          if (!isNaN(joinD.getTime()) && joinD.getMonth() === currentMonth) {
            const years = today.getFullYear() - joinD.getFullYear();
            if (years > 0) {
              list.push({
                type: "Anniversary",
                employee: emp.name || emp.email,
                detail: `${years} year${years > 1 ? 's' : ''} at Acme 🎉`,
                date: joinD.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                color: emp.color || "#8B5CF6",
              });
            }
          }
        } catch (_) {}
      }
    });

    if (list.length === 0) {
      return TEAM_CELEBRATIONS;
    }
    return list;
  }, [baseMembers, currentMonth, todayDate, today]);

  const TEAM_ANN = [
    {
      id: "TA1",
      title: "Q2 All-Hands Meeting – July 15",
      body: "Join us on July 15th at 3:00 PM EST. Attendance mandatory for all team leads. The meeting covers Q2 performance, roadmap for H2, and team recognition.",
      author: "Alex Admin",
      time: "Jul 1",
      category: "Event",
      priority: "High",
      pinned: true,
      dept: "All Teams",
    },
    {
      id: "TA2",
      title: "Updated Leave Policy – FY2025",
      body: "Annual leave increased to 20 days for 3+ year employees effective Jan 1, 2025. Please review the attached document.",
      author: "Aisha Thompson",
      time: "Jun 28",
      category: "Policy",
      priority: "High",
      pinned: false,
      dept: "All Teams",
    },
    {
      id: "TA3",
      title: "Engineering Sync – New Architecture Decision",
      body: "The engineering team will adopt a microservices architecture for the new billing module. All engineers must review the ADR document before Jul 10.",
      author: "David Chen",
      time: "Jun 25",
      category: "Technical",
      priority: "Medium",
      pinned: false,
      dept: "Engineering",
    },
    {
      id: "TA4",
      title: "Welcome Yuki Tanaka to the Engineering Team!",
      body: "Please join us in welcoming Yuki Tanaka who joins the engineering team on July 8 as a Senior Frontend Engineer. Yuki comes from Meta and brings 7 years of React expertise.",
      author: "David Chen",
      time: "Jun 22",
      category: "New Joiner",
      priority: "Low",
      pinned: false,
      dept: "Engineering",
    },
  ];

  const filteredTeamAnn = TEAM_ANN;
  const teamAnnDetail = TEAM_ANN.find((a) => a.id === teamAnnDetailId) || null;

  return (
    <div className="flex flex-col h-full w-full text-left">
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-6 py-5 space-y-5">
          {showCreateAnnouncement && (
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h4 className="text-xs font-semibold text-gray-700 mb-2">
                Compose Announcement
              </h4>
              <textarea
                rows={3}
                placeholder="Compose team announcement..."
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#5C5CFF] text-gray-900 bg-white"
              />
              <div className="flex justify-end gap-2 mt-2">
                <Btn
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateAnnouncement(false)}
                >
                  Cancel
                </Btn>
                <Btn size="sm" onClick={() => setShowCreateAnnouncement(false)}>
                  <Send size={12} />
                  Publish
                </Btn>
              </div>
            </div>
          )}
          {/* Celebrations */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Star size={12} className="text-amber-400" />
              Celebrations &amp; Milestones
            </p>
            <div className="grid grid-cols-3 gap-3">
              {celebrations.map((c, i) => (
                <div
                  key={i}
                  className="bg-white border border-gray-200 rounded-xl p-4 hover:border-[#5C5CFF]/30 hover:shadow-sm transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                      style={{ backgroundColor: c.color }}
                    >
                      {c.type === "Birthday"
                        ? "🎂"
                        : c.type === "Anniversary"
                        ? "🎉"
                        : "👋"}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-808">
                        {c.employee}
                      </p>
                      <p className="text-[10px] text-gray-400">{c.date}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600">{c.detail}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Announcements list */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Megaphone size={12} className="text-[#5C5CFF]" />
              Team Announcements
            </p>
            <div className="space-y-3">
              {filteredTeamAnn.map((a) => (
                <div
                  key={a.id}
                  onClick={() => setTeamAnnDetailId(a.id)}
                  className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:border-[#5C5CFF]/30 hover:shadow-sm transition-all flex items-start gap-3"
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white",
                      a.priority === "High"
                        ? "bg-[#5C5CFF]"
                        : a.category === "New Joiner"
                        ? "bg-green-500"
                        : "bg-gray-400"
                    )}
                  >
                    {a.category === "Event" ? (
                      <CalendarDays size={16} />
                    ) : a.category === "Policy" ? (
                      <FileText size={16} />
                    ) : a.category === "New Joiner" ? (
                      <UserPlus size={16} />
                    ) : (
                      <Megaphone size={16} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-semibold bg-[#EEF2FF] text-[#5C5CFF] px-1.5 py-0.5 rounded uppercase">
                        {a.category}
                      </span>
                      <span className="text-[10px] text-gray-400 ml-auto">
                        {a.time}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">
                      {a.title}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed font-semibold">
                      {a.body.split("\n")[0]}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-400">
                      <Avt
                        initials={a.author
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                        color="#5C5CFF"
                        size="xs"
                      />
                      <span>{a.author}</span>
                      <span>·</span>
                      <span>{a.dept}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Contextual Overlay Drawer for Announcement Details */}
      <Drawer
        isOpen={!!teamAnnDetailId}
        onClose={() => setTeamAnnDetailId(null)}
        title={teamAnnDetail?.title || "Announcement"}
        avatar={
          teamAnnDetail ? (
            <Avt
              initials={teamAnnDetail.author
                .split(" ")
                .map((n) => n[0])
                .join("")}
              color="#5C5CFF"
              size="sm"
            />
          ) : null
        }
        headerAddon={
          teamAnnDetail ? (
            <span className="text-[10px] font-semibold bg-[#EEF2FF] text-[#5C5CFF] px-1.5 py-0.5 rounded uppercase">
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
                  <p className="text-xs font-semibold text-gray-808 mt-1">
                    {teamAnnDetail.author} ({teamAnnDetail.dept})
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                    Date
                  </p>
                  <p className="text-xs font-semibold text-gray-855 mt-1">
                    {teamAnnDetail.time}
                  </p>
                </div>
              </div>
              <div className="text-sm text-gray-707 leading-relaxed whitespace-pre-line font-semibold">
                {teamAnnDetail.body}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
