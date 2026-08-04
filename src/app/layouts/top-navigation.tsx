import React, { useState, useEffect, useRef } from "react";
import {
  Search, Plus, Bell, Settings, ChevronDown, User, Shield, Zap, Globe, LogOut,
  UserPlus, Building2, Clock, CheckCircle, Calendar, Gift, Megaphone, ClipboardList,
  FileText, X, Bookmark, History, LayoutDashboard, Database, Info, Key, FileBarChart, Play, MessageSquare
} from "lucide-react";
import { cn } from "@/shared/utils";
import { EMPLOYEES } from "@/modules/organization/data/employees";
import { DEPT_DIST } from "@/modules/organization/data/analytics";
import { DOCUMENTS_LIST } from "@/modules/documents/data/documents-list";
import { Avt } from "@/shared/components";

// Reusable Segmented Control Component
export function SegmentedControl<T extends string>({
  items,
  activeItem,
  onChange
}: {
  items: readonly T[] | T[];
  activeItem: T;
  onChange: (item: T) => void;
}) {
  return (
    <div className="flex items-center bg-[#F1F2F5] rounded-[10px] p-[3px] gap-[2px] h-[38px] w-fit">
      {items.map(item => (
        <button
          key={item}
          onClick={() => onChange(item)}
          className={cn(
            "h-8 px-4 flex items-center justify-center text-[13px] font-medium transition-all duration-150 rounded-[8px] whitespace-nowrap",
            activeItem === item
              ? "bg-[#FFFFFF] text-[#16181D] shadow-[0_1px_2px_rgba(16,18,24,0.08)]"
              : "text-[#6B6F7B] hover:text-[#16181D]"
          )}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

// Reusable Tab Control Component
export function TabControl<T extends string>({
  items,
  activeItem,
  onChange
}: {
  items: readonly T[] | T[];
  activeItem: T;
  onChange: (item: T) => void;
}) {
  return (
    <div className="flex gap-8 h-full">
      {items.map(item => (
        <button
          key={item}
          onClick={() => onChange(item)}
          className={cn(
            "h-full flex items-center text-[14px] transition-colors relative hover:bg-gray-50 px-2",
            activeItem === item
              ? "text-[#5B57E8] font-semibold after:content-[''] after:absolute after:left-0 after:right-0 after:bottom-[-1px] after:h-[2px] after:bg-[#5B57E8] after:rounded-[2px_2px_0_0]"
              : "text-[#6B6F7B] font-medium hover:text-gray-900"
          )}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

const QUICK_CREATE_ITEMS = [
  { label: "Employee", shortcut: "⌥E", icon: UserPlus, action: "employee" },
  { label: "Department", shortcut: "⌥D", icon: Building2, action: "department" },
  { label: "Shift", shortcut: "⌥S", icon: Clock, action: "shift" },
  { label: "Attendance Correction", shortcut: "⌥C", icon: CheckCircle, action: "attendance" },
  { label: "Leave Request", shortcut: "⌥L", icon: Calendar, action: "leave" },
  { label: "Holiday", shortcut: "⌥H", icon: Gift, action: "holiday" },
  { label: "Announcement", shortcut: "⌥A", icon: Megaphone, action: "announcement" },
  { label: "Task", shortcut: "⌥T", icon: ClipboardList, action: "task" },
  { label: "Document", shortcut: "⌥O", icon: FileText, action: "document" },
  { label: "Policy", shortcut: "⌥P", icon: Shield, action: "policy" },
  { label: "Discussion", shortcut: "⌥F", icon: MessageSquare, action: "discussion" }
];

const MOCK_ATTENDANCE_SEARCH = [
  { text: "Check In Log - Sarah Mitchell (Present)", desc: "Engineering • NY HQ" },
  { text: "Check Out Log - Sarah Mitchell", desc: "Engineering • NY HQ" },
  { text: "Missing Punch Exceptions List", desc: "Chicago Office" },
  { text: "Biometric Sync Status", desc: "Online" }
];
const MOCK_LEAVE_SEARCH = [
  { text: "Annual Leave - Sarah Mitchell (Pending)", desc: "5 days • vacation" },
  { text: "Sick Leave - Marcus Johnson (Approved)", desc: "2 days • medical" },
  { text: "Casual Leave - Yuki Tanaka (Pending)", desc: "1 day • personal" }
];
const MOCK_TASKS_SEARCH = [
  { text: "Review Sarah's leave documentation", desc: "High Priority • Due Jul 3" },
  { text: "Update onboarding checklist for Q3", desc: "Medium Priority • Due Jul 8" },
  { text: "Schedule Q3 performance reviews", desc: "Medium Priority • Due Jul 15" },
  { text: "Configure biometric for Chicago office", desc: "High Priority • Due Jul 5" }
];
const MOCK_ANN_SEARCH = [
  { text: "Q2 All-Hands Meeting – July 15", desc: "Event • Pinned" },
  { text: "Updated Leave Policy – FY2025", desc: "Policy • Aisha Thompson" },
  { text: "Engineering Sync – Architecture Decision", desc: "Technical • David Chen" },
  { text: "Welcome Yuki Tanaka to the Team!", desc: "New Joiner • Yuki Tanaka" }
];
const MOCK_ORG_SEARCH = [
  { text: "New York HQ Location", desc: "Main Office" },
  { text: "San Francisco Branch Location", desc: "West Coast Office" },
  { text: "Chicago Branch Location", desc: "Midwest Office" },
  { text: "Austin Branch Location", desc: "South Office" }
];
const MOCK_POLICIES_SEARCH = [
  { text: "Work from Home Policy", desc: "Updated Jan 2024" },
  { text: "Data Protection and Privacy Policy", desc: "Compliance" },
  { text: "Leave Policy 2024", desc: "FY2025 Updates" }
];
const MOCK_SETTINGS_SEARCH = [
  { text: "Theme settings (Dark / Light Mode)", desc: "Appearance" },
  { text: "Security & password configuration", desc: "Security" },
  { text: "Notification preferences", desc: "General Settings" },
  { text: "Integrations with Slack and Jira", desc: "Integrations" }
];

// Reusable AppHeader Layout
export function AppHeader({
  title,
  workspaceSwitch,
  tabs = [],
  activeTab = "",
  onTabChange = () => {},
  toolbar,
  onQuickCreate = () => {},
  onSearchResultClick = () => {},
  onNotifClick = () => {},
  onSettingsClick = () => {},
  onProfileClick = () => {},
  onLogout = () => {},
  unreadNotifications = 0
}: {
  title: string;
  workspaceSwitch?: React.ReactNode;
  tabs?: string[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  toolbar?: React.ReactNode;
  onQuickCreate?: (action: string) => void;
  onSearchResultClick?: (category: string, item: any) => void;
  onNotifClick?: () => void;
  onSettingsClick?: () => void;
  onProfileClick?: () => void;
  onLogout?: () => void;
  unreadNotifications?: number;
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [focusedShortcutIndex, setFocusedShortcutIndex] = useState(-1);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const quickCreateRef = useRef<HTMLDivElement>(null);
  const quickCreateBtnRef = useRef<HTMLButtonElement>(null);

  // Focus search input when open
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      setSearchQuery("");
    }
  }, [searchOpen]);

  // Click outside and Esc handlers
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setSearchOpen(false);
        setQuickCreateOpen(false);
      }
      
      // Quick create keyboard navigation
      if (quickCreateOpen) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setFocusedShortcutIndex(prev => (prev + 1) % QUICK_CREATE_ITEMS.length);
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setFocusedShortcutIndex(prev => (prev - 1 + QUICK_CREATE_ITEMS.length) % QUICK_CREATE_ITEMS.length);
        } else if (e.key === "Enter" && focusedShortcutIndex >= 0) {
          e.preventDefault();
          onQuickCreate(QUICK_CREATE_ITEMS[focusedShortcutIndex].action);
          setQuickCreateOpen(false);
        }
      }
    }

    function handleClickOutside(e: MouseEvent) {
      if (quickCreateOpen && 
          quickCreateRef.current && 
          !quickCreateRef.current.contains(e.target as Node) &&
          quickCreateBtnRef.current &&
          !quickCreateBtnRef.current.contains(e.target as Node)) {
        setQuickCreateOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [quickCreateOpen, focusedShortcutIndex]);

  // Filtered search results
  const q = searchQuery.toLowerCase();
  const searchResults = searchQuery.trim() === "" ? null : {
    employees: EMPLOYEES.filter(e => e.name.toLowerCase().includes(q) || e.designation.toLowerCase().includes(q) || e.dept.toLowerCase().includes(q)),
    departments: DEPT_DIST.filter(d => d.name.toLowerCase().includes(q)),
    attendance: MOCK_ATTENDANCE_SEARCH.filter(a => a.text.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q)),
    leave: MOCK_LEAVE_SEARCH.filter(l => l.text.toLowerCase().includes(q) || l.desc.toLowerCase().includes(q)),
    tasks: MOCK_TASKS_SEARCH.filter(t => t.text.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q)),
    announcements: MOCK_ANN_SEARCH.filter(a => a.text.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q)),
    documents: DOCUMENTS_LIST.filter(d => d.name.toLowerCase().includes(q) || d.category.toLowerCase().includes(q)),
    organization: MOCK_ORG_SEARCH.filter(o => o.text.toLowerCase().includes(q) || o.desc.toLowerCase().includes(q)),
    policies: MOCK_POLICIES_SEARCH.filter(p => p.text.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)),
    settings: MOCK_SETTINGS_SEARCH.filter(s => s.text.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q))
  };

  const hasAnyResults = searchResults && (
    searchResults.employees.length > 0 ||
    searchResults.departments.length > 0 ||
    searchResults.attendance.length > 0 ||
    searchResults.leave.length > 0 ||
    searchResults.tasks.length > 0 ||
    searchResults.announcements.length > 0 ||
    searchResults.documents.length > 0 ||
    searchResults.organization.length > 0 ||
    searchResults.policies.length > 0 ||
    searchResults.settings.length > 0
  );

  return (
    <div className="w-full bg-[#FFFFFF] border-b border-[#E8E9ED] flex flex-col flex-shrink-0 relative z-25 sticky top-0">
      
      {/* Search Backdrop */}
      {searchOpen && (
        <div 
          onClick={() => setSearchOpen(false)} 
          className="fixed inset-0 bg-black/20 backdrop-blur-[1px] z-40 transition-opacity duration-200"
        />
      )}

      {/* Floating Search Bar Overlay */}
      <div 
        className={cn(
          "absolute inset-x-0 top-0 bg-white border-b border-gray-200 z-50 transition-all duration-200 ease-in-out origin-top shadow-md flex flex-col",
          searchOpen ? "opacity-100 translate-y-0 scale-y-100" : "opacity-0 -translate-y-4 scale-y-95 pointer-events-none"
        )}
      >
        <div className="h-[72px] flex items-center px-8 gap-4 border-b border-gray-100">
          <Search size={18} className="text-[#9CA0AB] flex-shrink-0" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search employees, departments, tasks, announcements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-[15px] text-[#16181D] placeholder-[#9CA0AB] outline-none font-medium h-full"
          />
          <span className="text-[11px] text-[#9CA0AB] bg-gray-150 px-2 py-1 rounded-[6px] border border-gray-200 font-medium">ESC to close</span>
          <button 
            onClick={() => setSearchOpen(false)} 
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700"
          >
            <X size={18} />
          </button>
        </div>

        {/* Live Search Results area */}
        {searchOpen && (
          <div className="max-h-[480px] overflow-y-auto p-6 bg-white text-left">
            {!searchResults ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#9CA0AB] uppercase tracking-wider">
                  <History size={13} />
                  <span>Recent Searches</span>
                </div>
                <div className="flex flex-col gap-1">
                  {["Attendance", "Leave Requests"].map(term => (
                    <button 
                      key={term}
                      onClick={() => setSearchQuery(term)}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2"
                    >
                      <Search size={13} className="text-gray-400" />
                      <span>{term}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : !hasAnyResults ? (
              <div className="py-12 text-center text-gray-400 flex flex-col items-center">
                <Search size={28} strokeWidth={1.5} className="mb-2" />
                <p className="text-sm font-medium">No results found for "{searchQuery}"</p>
                <p className="text-xs mt-0.5">Check spelling or try a different term</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                
                {/* Employees */}
                {searchResults.employees.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5"><User size={12}/>Employees</h4>
                    <div className="space-y-1">
                      {searchResults.employees.slice(0, 4).map(e => (
                        <div key={e.id} onClick={() => { onSearchResultClick("employee", e); setSearchOpen(false); }} className="p-2 hover:bg-gray-50 rounded-lg flex items-center gap-3 cursor-pointer">
                          <Avt initials={e.initials} color={e.color} size="sm" />
                          <div>
                            <p className="text-xs font-semibold text-gray-800">{e.name}</p>
                            <p className="text-[10px] text-gray-400">{e.designation} • {e.dept}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Departments */}
                {searchResults.departments.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5"><Building2 size={12}/>Departments</h4>
                    <div className="space-y-1">
                      {searchResults.departments.slice(0, 4).map(d => (
                        <div key={d.name} onClick={() => { onSearchResultClick("department", d); setSearchOpen(false); }} className="p-2 hover:bg-gray-50 rounded-lg flex items-center gap-3 cursor-pointer">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold" style={{backgroundColor: d.color + "1A", color: d.color}}>{d.name[0]}</div>
                          <div>
                            <p className="text-xs font-semibold text-gray-800">{d.name}</p>
                            <p className="text-[10px] text-gray-400">{d.value} Employee members</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tasks */}
                {searchResults.tasks.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5"><ClipboardList size={12}/>Tasks</h4>
                    <div className="space-y-1">
                      {searchResults.tasks.slice(0, 3).map((t, idx) => (
                        <div key={idx} onClick={() => { onSearchResultClick("task", t); setSearchOpen(false); }} className="p-2 hover:bg-gray-50 rounded-lg flex flex-col cursor-pointer">
                          <p className="text-xs font-semibold text-gray-800">{t.text}</p>
                          <p className="text-[10px] text-gray-450 mt-0.5">{t.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Leave */}
                {searchResults.leave.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5"><Calendar size={12}/>Leave Requests</h4>
                    <div className="space-y-1">
                      {searchResults.leave.slice(0, 3).map((l, idx) => (
                        <div key={idx} onClick={() => { onSearchResultClick("leave", l); setSearchOpen(false); }} className="p-2 hover:bg-gray-50 rounded-lg flex flex-col cursor-pointer">
                          <p className="text-xs font-semibold text-gray-800">{l.text}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{l.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Announcements */}
                {searchResults.announcements.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5"><Megaphone size={12}/>Announcements</h4>
                    <div className="space-y-1">
                      {searchResults.announcements.slice(0, 3).map((a, idx) => (
                        <div key={idx} onClick={() => { onSearchResultClick("announcement", a); setSearchOpen(false); }} className="p-2 hover:bg-gray-50 rounded-lg flex flex-col cursor-pointer">
                          <p className="text-xs font-semibold text-gray-800">{a.text}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{a.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Documents */}
                {searchResults.documents.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5"><FileText size={12}/>Documents & Policies</h4>
                    <div className="space-y-1">
                      {searchResults.documents.slice(0, 3).map(d => (
                        <div key={d.id} onClick={() => { onSearchResultClick("document", d); setSearchOpen(false); }} className="p-2 hover:bg-gray-50 rounded-lg flex items-center gap-3 cursor-pointer">
                          <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center"><FileText size={14} className="text-red-500"/></div>
                          <div>
                            <p className="text-xs font-semibold text-gray-800">{d.name}</p>
                            <p className="text-[10px] text-gray-400">{d.category} • {d.size}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Settings & Organization */}
                {(searchResults.settings.length > 0 || searchResults.organization.length > 0) && (
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5"><Settings size={12}/>System & Settings</h4>
                    <div className="space-y-1">
                      {searchResults.settings.slice(0, 2).map((s, idx) => (
                        <div key={idx} onClick={() => { onSearchResultClick("settings", s); setSearchOpen(false); }} className="p-2 hover:bg-gray-50 rounded-lg flex flex-col cursor-pointer">
                          <p className="text-xs font-semibold text-gray-800">{s.text}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{s.desc}</p>
                        </div>
                      ))}
                      {searchResults.organization.slice(0, 2).map((o, idx) => (
                        <div key={idx} onClick={() => { onSearchResultClick("organization", o); setSearchOpen(false); }} className="p-2 hover:bg-gray-50 rounded-lg flex flex-col cursor-pointer">
                          <p className="text-xs font-semibold text-gray-800">{o.text}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{o.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        )}
      </div>

      {/* ROW 1: Primary Header */}
      <div className="h-[72px] flex items-center justify-between px-8 gap-6 border-b border-[#EEEFF2]">
        <div className="flex items-center gap-6">
          <span className="text-[18px] font-semibold text-[#16181D] tracking-[-0.2px]">{title}</span>
          {workspaceSwitch}
        </div>

        {/* Center: Empty (No search input) */}
        <div className="flex-1" />

        {/* Actions (Right Side) */}
        <div className="flex items-center gap-3">
          
          {/* Quick Create Plus Popover */}
          <div className="relative">
            <button
              ref={quickCreateBtnRef}
              onClick={() => {
                setQuickCreateOpen(prev => !prev);
                setFocusedShortcutIndex(-1);
              }}
              className="w-[38px] h-[38px] flex items-center justify-center border border-[#E8E9ED] rounded-[9px] text-[#565A66] hover:bg-gray-50"
            >
              <Plus size={18} strokeWidth={2.2} />
            </button>

            {quickCreateOpen && (
              <div 
                ref={quickCreateRef}
                className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl border border-gray-200 shadow-xl z-50 py-1"
              >
                <div className="px-4 py-2 border-b border-gray-100"><p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Quick Create</p></div>
                <div className="py-1">
                  {QUICK_CREATE_ITEMS.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.label}
                        onClick={() => {
                          onQuickCreate(item.action);
                          setQuickCreateOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center justify-between px-4 py-2 text-xs text-left text-gray-700 hover:bg-gray-50",
                          focusedShortcutIndex === idx && "bg-gray-100 text-gray-900"
                        )}
                      >
                        <span className="flex items-center gap-2.5">
                          <Icon size={14} className="text-gray-400" />
                          <span>{item.label}</span>
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium font-mono">{item.shortcut}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Search Icon Trigger */}
          <button
            onClick={() => setSearchOpen(true)}
            className="w-[38px] h-[38px] flex items-center justify-center border border-[#E8E9ED] rounded-[9px] text-[#565A66] hover:bg-gray-50"
          >
            <Search size={17} strokeWidth={1.8} />
          </button>

          {/* Notifications */}
          <button
            onClick={onNotifClick}
            className="w-[38px] h-[38px] flex items-center justify-center border border-[#E8E9ED] rounded-[9px] text-[#565A66] hover:bg-gray-50 relative"
          >
            <Bell size={17} strokeWidth={1.8} />
            {unreadNotifications > 0 && (
              <div className="absolute top-[-5px] right-[-5px] min-w-4 h-4 px-1 rounded-full bg-[#E5484D] text-white text-[10px] font-semibold flex items-center justify-center border-2 border-[#FFFFFF]">
                {unreadNotifications}
              </div>
            )}
          </button>

          {/* Settings */}
          <button
            onClick={onSettingsClick}
            className="w-[38px] h-[38px] flex items-center justify-center border border-[#E8E9ED] rounded-[9px] text-[#565A66] hover:bg-gray-50"
          >
            <Settings size={17} strokeWidth={1.8} />
          </button>

          <div className="w-[1px] h-6 bg-[#E8E9ED]" />

          {/* Account Profile block */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(prev => !prev)}
              className="flex items-center gap-2.5 hover:opacity-90 transition-opacity"
            >
              <div className="w-9 h-9 rounded-full bg-[#5B57E8] text-white text-[13px] font-semibold flex items-center justify-center">
                AA
              </div>
              <div className="text-left line-height-[1.3] hidden md:block">
                <div className="text-[13px] font-semibold text-[#16181D]">Alex Admin</div>
                <div className="text-[12px] text-[#9CA0AB]">Administrator</div>
              </div>
              <ChevronDown size={14} className="text-[#9CA0AB]" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-60 bg-white rounded-xl border border-gray-200 shadow-xl z-50 overflow-hidden" onClick={() => setProfileOpen(false)}>
                <div className="px-4 py-3 bg-gradient-to-br from-[#EEF2FF] to-white border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#5B57E8] text-white text-[14px] font-semibold flex items-center justify-center">AA</div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">Alex Admin</p>
                      <p className="text-[10px] text-gray-505">alex.admin@acmecorp.com</p>
                    </div>
                  </div>
                </div>
                <div className="py-1">
                  <button onClick={onProfileClick} className="w-full flex items-center gap-3 px-4 py-2 text-xs text-left hover:bg-gray-50 text-gray-700">
                    <User size={13} className="text-gray-400" />
                    View Profile
                  </button>
                  <button onClick={onSettingsClick} className="w-full flex items-center gap-3 px-4 py-2 text-xs text-left hover:bg-gray-50 text-gray-700">
                    <Settings size={13} className="text-gray-400" />
                    Account Settings
                  </button>
                </div>
                <div className="border-t border-gray-100 py-1">
                  <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-2 text-xs text-red-650 hover:bg-red-50 text-red-600 font-semibold">
                    <LogOut size={13} />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ROW 2: Context Navigation (Tabs) */}
      {tabs.length > 0 && (
        <div className="h-[52px] flex items-center px-8 border-b border-[#EEEFF2] overflow-x-auto overflow-y-hidden whitespace-nowrap no-scrollbar">
          <TabControl items={tabs} activeItem={activeTab} onChange={onTabChange} />
        </div>
      )}

      {/* ROW 3: Context Toolbar */}
      {toolbar && (
        <div className="h-[60px] flex items-center px-8 gap-4">
          {toolbar}
        </div>
      )}
    </div>
  );
}
