import React, { useState } from "react";
import {
  CalendarDays,
  Clock,
  UserPlus,
  CheckCircle,
  ClipboardList,
  Megaphone,
  Search,
  Download,
  Bell,
  Archive,
  Trash2,
} from "lucide-react";
import { AppPage } from "@/shared/types";
import { cn, fmtDate } from "@/shared/utils";
import { Btn, PageHeader } from "@/shared/components";

export function NotificationCenterPage({
  navigate,
}: {
  navigate: (p: AppPage) => void;
}) {
  const ALL_NOTIFS = [
    {
      id: "n1",
      type: "leave",
      title: "Leave Request – Sarah Mitchell",
      msg: "Applied for 5 days Annual Leave (Jul 8–12)",
      time: "10 min ago",
      read: false,
      page: "leave" as AppPage,
    },
    {
      id: "n2",
      type: "attendance",
      title: "Missing Punch – 14 Employees",
      msg: "14 employees have missing check-out today",
      time: "1 hr ago",
      read: false,
      page: "attendance" as AppPage,
    },
    {
      id: "n3",
      type: "employee",
      title: "New Joiner – Yuki Tanaka",
      msg: "Yuki Tanaka joins Engineering team today",
      time: "3 hr ago",
      read: true,
      page: "organization" as AppPage,
    },
    {
      id: "n4",
      type: "leave",
      title: "Leave Approved – Marcus Johnson",
      msg: "Sick leave request approved for 2 days",
      time: "5 hr ago",
      read: true,
      page: "leave" as AppPage,
    },
    {
      id: "n5",
      type: "system",
      title: "Attendance Sync Complete",
      msg: "Biometric sync completed — 834 records updated",
      time: "1 day ago",
      read: true,
      page: "attendance" as AppPage,
    },
    {
      id: "n6",
      type: "approval",
      title: "Approval Required – Shift Change",
      msg: "David Chen requested shift modification for Engineering",
      time: "2 days ago",
      read: false,
      page: "my-space" as AppPage,
    },
    {
      id: "n7",
      type: "tasks",
      title: "Task Overdue – Q2 Report",
      msg: "Q2 Performance Report submission is 2 days overdue",
      time: "2 days ago",
      read: false,
      page: "tasks" as AppPage,
    },
    {
      id: "n8",
      type: "announcement",
      title: "New Announcement – Policy Update",
      msg: "Leave policy FY2025 has been published",
      time: "3 days ago",
      read: true,
      page: "my-space" as AppPage,
    },
    {
      id: "n9",
      type: "attendance",
      title: "Late Arrivals – 8 Employees",
      msg: "8 employees arrived more than 30 minutes late today",
      time: "3 days ago",
      read: true,
      page: "attendance" as AppPage,
    },
    {
      id: "n10",
      type: "system",
      title: "System Maintenance Scheduled",
      msg: "Platform maintenance Jul 7, 11 PM – 3 AM EST",
      time: "4 days ago",
      read: true,
      page: "support" as AppPage,
    },
  ];

  const [notifs, setNotifs] = useState(ALL_NOTIFS);
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  const [archived, setArchived] = useState<string[]>([]);

  const TABS = [
    "All",
    "Unread",
    "Approvals",
    "Attendance",
    "Leave",
    "Tasks",
    "Announcements",
    "System",
  ];
  const TYPE_MAP: Record<string, { icon: any; color: string }> = {
    leave: { icon: CalendarDays, color: "#F59E0B" },
    attendance: { icon: Clock, color: "#5C5CFF" },
    employee: { icon: UserPlus, color: "#3B82F6" },
    system: { icon: CheckCircle, color: "#6B7280" },
    approval: { icon: CheckCircle, color: "#8B5CF6" },
    tasks: { icon: ClipboardList, color: "#22C55E" },
    announcement: { icon: Megaphone, color: "#EC4899" },
  };

  const filtered = notifs
    .filter((n) => !archived.includes(n.id))
    .filter((n) =>
      activeTab === "All"
        ? true
        : activeTab === "Unread"
        ? !n.read
        : n.type === activeTab.toLowerCase() ||
          n.type === activeTab.slice(0, -1).toLowerCase()
    )
    .filter(
      (n) =>
        !search ||
        (n.title + n.msg).toLowerCase().includes(search.toLowerCase())
    );

  const markRead = (id: string) =>
    setNotifs((ns) => ns.map((n) => (n.id === id ? { ...n, read: true } : n)));
  const markAllRead = () => setNotifs((ns) => ns.map((n) => ({ ...n, read: true })));
  const archive = (id: string) => setArchived((a) => [...a, id]);
  const del = (id: string) => setNotifs((ns) => ns.filter((n) => n.id !== id));
  const unreadCount = notifs.filter(
    (n) => !n.read && !archived.includes(n.id)
  ).length;

  return (
    <div className="flex flex-col h-full text-left">
      <PageHeader
        title="Notification Center"
        breadcrumbs={[
          { label: "Home", onClick: () => navigate("my-space") },
          { label: "Notifications" },
        ]}
      >
        <div className="flex gap-2">
          <Btn variant="outline" size="sm" onClick={markAllRead}>
            <CheckCircle size={12} />
            Mark All Read
          </Btn>
          <Btn variant="outline" size="sm">
            <Download size={12} />
            Export
          </Btn>
        </div>
      </PageHeader>
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3 flex-shrink-0">
          <div className="relative flex-1 max-w-xs">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search notifications…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5C5CFF] text-gray-900"
            />
          </div>
          {unreadCount > 0 && (
            <span className="text-xs text-[#5C5CFF] font-medium">
              {unreadCount} unread
            </span>
          )}
        </div>
        {/* Tab bar */}
        <div className="bg-white border-b border-gray-200 px-6 flex gap-0 flex-shrink-0 overflow-x-auto">
          {TABS.map((t) => {
            const cnt =
              t === "Unread"
                ? unreadCount
                : t === "All"
                ? notifs.filter((n) => !archived.includes(n.id)).length
                : notifs.filter(
                    (n) =>
                      !archived.includes(n.id) &&
                      (n.type === t.toLowerCase() ||
                        n.type === t.slice(0, -1).toLowerCase())
                  ).length;
            return (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={cn(
                  "px-4 py-3 text-xs font-medium border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer",
                  activeTab === t
                    ? "border-[#5C5CFF] text-[#5C5CFF]"
                    : "border-transparent text-gray-505 hover:text-gray-700"
                )}
              >
                {t}
                {cnt > 0 && (
                  <span
                    className={cn(
                      "text-[9px] font-bold px-1.5 py-0.5 rounded-full",
                      activeTab === t
                        ? "bg-[#5C5CFF] text-white"
                        : "bg-gray-100 text-gray-500"
                    )}
                  >
                    {cnt}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {/* List */}
        <div className="flex-1 overflow-auto">
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <Bell size={32} className="mb-3 opacity-30" />
              <p className="text-sm font-medium">No notifications</p>
              <p className="text-xs mt-0.5">You're all caught up!</p>
            </div>
          )}
          {filtered.map((n) => {
            const { icon: Icon, color } = TYPE_MAP[n.type] || TYPE_MAP.system;
            return (
              <div
                key={n.id}
                className={cn(
                  "flex items-start gap-4 px-6 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors group",
                  !n.read && "bg-[#EEF2FF]/30"
                )}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: color + "18" }}
                >
                  <Icon size={15} style={{ color }} />
                </div>
                <button
                  className="flex-1 text-left min-w-0 cursor-pointer"
                  onClick={() => {
                    markRead(n.id);
                    navigate(n.page);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <p
                      className={cn(
                        "text-sm font-medium",
                        !n.read ? "text-gray-900" : "text-gray-755"
                      )}
                    >
                      {n.title}
                    </p>
                    {!n.read && (
                      <div className="w-2 h-2 rounded-full bg-[#5C5CFF] flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{n.msg}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{n.time}</p>
                </button>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  {!n.read && (
                    <button
                      onClick={() => markRead(n.id)}
                      title="Mark as read"
                      className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <CheckCircle size={13} />
                    </button>
                  )}
                  <button
                    onClick={() => archive(n.id)}
                    title="Archive"
                    className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <Archive size={13} />
                  </button>
                  <button
                    onClick={() => del(n.id)}
                    title="Delete"
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
