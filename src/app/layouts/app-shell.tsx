import React, { useState, useEffect } from "react";
import {
  LayoutDashboard, Users, Clock, Calendar, FileText,
  Megaphone, BarChart2, Settings, ChevronLeft, ChevronRight,
  Search, Bell, Plus, Filter, Download, Upload, MoreHorizontal,
  Check, X, ChevronDown, ArrowUpRight, ArrowDownRight, UserPlus,
  Building2, MapPin, Briefcase, LogOut, Bot, Zap, TrendingUp,
  CheckCircle, Edit, Trash2, Eye, Shield, HelpCircle, Activity,
  List, ChevronUp, Globe, Phone, Mail, Lock, User, AlertCircle,
  ArrowRight, SlidersHorizontal, Database, AlertTriangle,
  RefreshCw, Send, UserCheck, UserX, ExternalLink, CalendarDays,
  Award, FileBarChart, GitBranch, BookOpen, Building, Hash,
  Layers, ClipboardList, Network, Key, Target, Star, Info,
  ChevronRight as CR, Inbox, Package, Copy, XCircle,
  Pin, Bookmark, Share2, Printer, Paperclip, MessageCircle, MessageSquare, Archive, Monitor,
  Play, Circle, LayoutGrid
} from "lucide-react";
import {
  AppPage, Employee,
  EMPLOYEES, NOTIFICATIONS,
  cn
} from "@/app/data";
import { Sidebar } from "./sidebar";
import { AIPanel } from "./ai-panel";
import { NotificationsPanel } from "./notifications-panel";
import { QuickActionsMenu } from "./quick-actions-menu";
import { AppHeader, SegmentedControl } from "../AppHeader";
import { AppRouter } from "../router/app-router";
import { signOut } from "firebase/auth";
import { auth } from "@/shared/utils";
import { useAuth } from "@/shared/context/AuthContext";


export function AppShell() {
  const { user, role, isLoading, isSetupComplete, displayName, email, hasPermission } = useAuth();
  const [page, setPage] = useState<AppPage>("login");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee>(EMPLOYEES[0]);

  // demoMode = true when user clicks 'Demo access' (no real Firebase session)
  const [demoMode, setDemoMode] = useState(false);

  // Route based on Firebase auth state from AuthContext
  useEffect(() => {
    if (isLoading) return;
    if (demoMode) return; // demo login bypasses Firebase gate
    if (!user) {
      setPage("login");
      return;
    }
    // Route newly created or setting-up users into onboarding flow
    setPage((prevPage) => {
      const justRegistered = localStorage.getItem("hrms_just_registered") === "true";
      if (justRegistered) {
        localStorage.removeItem("hrms_just_registered");
        return "admin-account";
      }
      // Preserve onboarding flow pages if user is currently on them
      if (["admin-account", "getting-started", "setup"].includes(prevPage)) {
        return prevPage;
      }
      if (prevPage === "login") {
        if (!isSetupComplete && localStorage.getItem("hrms_setup_completed") !== "true") {
          return "getting-started";
        }
        return "my-space";
      }
      return prevPage;
    });
  }, [user, isLoading, isSetupComplete, demoMode]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [attendanceSection, setAttendanceSection] = useState<"My Space" | "My Team">("My Space");
  const [leaveSection, setLeaveSection] = useState<"My Space" | "My Team">("My Space");
  const [teamSection, setTeamSection] = useState<"Overview" | "Management">("Overview");
  const [orgSection, setOrgSection] = useState<"Overview" | "Management">("Overview");
  const [mySpaceTab, setMySpaceTab] = useState<string>("Dashboard");

  const [attendanceTab, setAttendanceTab] = useState<string>("Overview");
  const [leaveTab, setLeaveTab] = useState<string>("Overview");
  const [tasksTab, setTasksTab] = useState<string>("Board");
  const [documentsTab, setDocumentsTab] = useState<string>("Company");
  const [settingsTab, setSettingsTab] = useState<string>("General");
  const [manageAccountSection, setManageAccountSection] = useState<string>("Users");

  // Lifted child views & filter toolbar states
  const [teamTab, setTeamTab] = useState<string>("Overview");
  const [orgTab, setOrgTab] = useState<string>("Overview");
  const [supportTab, setSupportTab] = useState<string>("Home");
  const [attPeriod, setAttPeriod] = useState<"Weekly" | "Monthly" | "Yearly">("Monthly");
  const [checkedIn, setCheckedIn] = useState<boolean>(true);
  const [teamDeptFilter, setTeamDeptFilter] = useState<string>("All");
  const [teamLocationFilter, setTeamLocationFilter] = useState<string>("All");
  const [reporteesViewMode, setReporteesViewMode] = useState<"list"|"grid">(
    () => (sessionStorage.getItem("reportees_view_mode") as "list"|"grid") || "list"
  );

  useEffect(() => {
    sessionStorage.setItem("reportees_view_mode", reporteesViewMode);
  }, [reporteesViewMode]);

  // Search input states
  const [profileOrigin, setProfileOrigin] = useState<string | null>(null);

  useEffect(() => {
    const handleUrl = () => {
      const path = window.location.pathname;
      const match = path.match(/\/team\/reportees\/([A-Za-z0-9E-]+)/);
      if (match) {
        const empId = match[1];
        const emp = EMPLOYEES.find(e => e.id === empId);
        if (emp) {
          setSelectedEmployee(emp);
          setPage("employee-profile");
          setProfileOrigin("team");
        }
      } else if (path === "/team") {
        setPage("team");
      } else if (path === "/organization") {
        setPage("organization");
      }
    };

    handleUrl();
    window.addEventListener("popstate", handleUrl);
    return () => window.removeEventListener("popstate", handleUrl);
  }, []);

  const [tasksSearch, setTasksSearch] = useState<string>("");
  const [orgSearch, setOrgSearch] = useState<string>("");
  const [teamSearch, setTeamSearch] = useState<string>("");
  const [docsSearch, setDocsSearch] = useState<string>("");

  // Modal / popups trigger states
  const [showAttFilter, setShowAttFilter] = useState(false);
  const [showLeaveFilter, setShowLeaveFilter] = useState(false);
  const [showTeamFilter, setShowTeamFilter] = useState(false);
  const [showTasksFilter, setShowTasksFilter] = useState(false);
  const [showApplyLeave, setShowApplyLeave] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [boardInsightsOpen, setBoardInsightsOpen] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false);
  const [showCreateDiscussion, setShowCreateDiscussion] = useState(false);
  const [showUploadDoc, setShowUploadDoc] = useState(false);
  const [showNewDoc, setShowNewDoc] = useState(false);

  const [attToast, setAttToast] = useState<string|null>(null);
  const attMsg = (m:string) => { setAttToast(m); setTimeout(()=>setAttToast(null),2500); };

  const navigate = (p: AppPage, emp?: Employee, tabOrSection?: string) => {
    if(emp) setSelectedEmployee(emp);
    if(p === "my-space" && tabOrSection) {
      setMySpaceTab(tabOrSection);
    }
    if(p === "attendance" && tabOrSection) {
      setAttendanceSection(tabOrSection as any);
    }
    if(p === "leave" && tabOrSection) {
      setLeaveSection(tabOrSection as any);
    }
    if(p === "team" && tabOrSection) {
      setTeamSection(tabOrSection as any);
    }
    if(p === "organization" && tabOrSection) {
      setOrgTab(tabOrSection);
    }

    if (p === "employee-profile" && emp) {
      setProfileOrigin(page === "team" ? "team" : "organization");
      window.history.pushState(null, "", `/team/reportees/${emp.id}`);
    } else {
      if (p === "team") {
        window.history.pushState(null, "", "/team");
      } else if (p === "organization") {
        window.history.pushState(null, "", "/organization");
      } else {
        window.history.pushState(null, "", "/");
      }
    }

    if (p === "my-space") {
      localStorage.setItem("hrms_setup_completed", "true");
      // If no real Firebase user, enable demo mode so auth gate doesn't redirect back
      if (!user) setDemoMode(true);
    }

    setPage(p);
    setNotifOpen(false);
    setQuickActionsOpen(false);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      if (user) {
        await signOut(auth);
      }
      setDemoMode(false);
      setPage("login");
      setShowLogoutConfirm(false);
    } catch (err) {
      console.error("Error signing out:", err);
    } finally {
      setLoggingOut(false);
    }
  };

  // Sync sub-tabs on workspace changes
  useEffect(() => {
    if (teamSection === "Overview") {
      setTeamTab("Members");
    } else {
      setTeamTab("Approvals");
    }
  }, [teamSection]);

  const depts = ["All",...Array.from(new Set(EMPLOYEES.map(e=>e.dept))).sort()];

  // Show a full-page loading spinner while Firebase resolves auth state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F7F8FA]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-[#5C5CFF] rounded-2xl flex items-center justify-center shadow-lg">
            <RefreshCw size={22} className="text-white animate-spin" />
          </div>
          <p className="text-sm text-gray-500 font-medium">Loading your workspace…</p>
        </div>
      </div>
    );
  }

  // Bootstrap/Auth pages (rendered standalone, without sidebar or header)
  if (["login", "admin-account", "getting-started", "setup"].includes(page)) {

    return (
      <AppRouter
        page={page}
        navigate={navigate}
        mySpaceTab={mySpaceTab}
        teamTab={teamTab}
        teamSearch={teamSearch}
        showCreatePost={showCreatePost}
        setShowCreatePost={setShowCreatePost}
        showCreateAnnouncement={showCreateAnnouncement}
        setShowCreateAnnouncement={setShowCreateAnnouncement}
        showCreateTask={showCreateTask}
        setShowCreateTask={setShowCreateTask}
        reporteesViewMode={reporteesViewMode}
        showTeamFilter={showTeamFilter}
        setShowTeamFilter={setShowTeamFilter}
        teamDeptFilter={teamDeptFilter}
        setTeamDeptFilter={setTeamDeptFilter}
        teamLocationFilter={teamLocationFilter}
        setTeamLocationFilter={setTeamLocationFilter}
        showCreateDiscussion={showCreateDiscussion}
        setShowCreateDiscussion={setShowCreateDiscussion}
        orgTab={orgTab}
        setOrgTab={setOrgTab}
        orgSearch={orgSearch}
        attendanceSection={attendanceSection}
        setAttendanceSection={setAttendanceSection}
        attendanceTab={attendanceTab}
        leaveSection={leaveSection}
        setLeaveSection={setLeaveSection}
        leaveTab={leaveTab}
        tasksTab={tasksTab}
        selectedEmployee={selectedEmployee}
        profileOrigin={profileOrigin}
        documentsTab={documentsTab}
        settingsTab={settingsTab}
      />
    );
  }

  const unread = NOTIFICATIONS.filter(n=>!n.read).length;

  // Row 1 Title
  let headerTitle = "";
  if (page === "my-space") headerTitle = "My Space";
  else if (page === "team") headerTitle = "Team";
  else if (page === "organization") headerTitle = "Organization";
  else if (page === "attendance") headerTitle = "Attendance";
  else if (page === "leave") headerTitle = "Leave";
  else if (page === "tasks") headerTitle = "Tasks";
  else if (page === "documents") headerTitle = "Documents";
  else if (page === "settings") headerTitle = "Settings";
  else if (page === "support") headerTitle = "Help & Support";
  else if (page === "profile") headerTitle = "User Profile";
  else if (page === "employee-profile") headerTitle = "Employee Profile";
  else if (page === "employee-add") headerTitle = "Add Employee";

  // Row 1 Switcher
  let workspaceSwitch: React.ReactNode = null;
  if (page === "attendance") {
    workspaceSwitch = (
      <SegmentedControl
        items={["My Space", "My Team"] as const}
        activeItem={attendanceSection}
        onChange={setAttendanceSection}
      />
    );
  } else if (page === "leave") {
    workspaceSwitch = (
      <SegmentedControl
        items={["My Space", "My Team"] as const}
        activeItem={leaveSection}
        onChange={setLeaveSection}
      />
    );
  }

  // Row 2 Tabs
  let headerTabs: string[] = [];
  let activeHeaderTab = "";
  let onHeaderTabChange: (t: string) => void = () => {};

  if (page === "my-space") {
    headerTabs = ["Dashboard", "Attendance"];
    if (hasPermission("dashboard-leave")) headerTabs.push("Leave");
    if (hasPermission("dashboard-approval")) headerTabs.push("Approvals");
    headerTabs.push("Calendar");
    activeHeaderTab = mySpaceTab;
    onHeaderTabChange = setMySpaceTab;
  } else if (page === "attendance") {
    headerTabs = ["Overview", "Exceptions", "Analytics"];
    activeHeaderTab = attendanceTab;
    onHeaderTabChange = setAttendanceTab;
  } else if (page === "leave") {
    headerTabs = ["Overview", "Requests", "Analytics"];
    activeHeaderTab = leaveTab;
    onHeaderTabChange = setLeaveTab;
  } else if (page === "team") {
    headerTabs = ["Overview", "Reportees"];
    if (hasPermission("team-approval")) headerTabs.push("Approvals");
    headerTabs.push("Feed", "Announcements");
    activeHeaderTab = teamTab;
    onHeaderTabChange = setTeamTab;
  } else if (page === "organization") {
    headerTabs = ["Overview", "Employees", "Employee Tree", "Departments", "Operations", "Policies", "Announcements", "Reports"];
    activeHeaderTab = orgTab;
    onHeaderTabChange = setOrgTab;
  } else if (page === "tasks") {
    headerTabs = ["Board", "List", "Calendar"];
    activeHeaderTab = tasksTab;
    onHeaderTabChange = setTasksTab;
  } else if (page === "documents") {
    headerTabs = ["Company", "My Space", "Shared", "Uploads", "Signatures", "Trash"];
    activeHeaderTab = documentsTab;
    onHeaderTabChange = setDocumentsTab;
  } else if (page === "settings") {
    headerTabs = ["General", "Customization", "Integrations", "Security", "Billing", "Developer"];
    activeHeaderTab = settingsTab;
    onHeaderTabChange = setSettingsTab;
  }

  // Row 3 Toolbar
  let headerToolbar: React.ReactNode = null;
  if (page === "team") {
    if (teamTab === "Overview") {
      headerToolbar = (
        <>
          <div className="flex-1" />
          <button
            onClick={() => setShowTeamFilter(true)}
            className="h-10 w-10 flex items-center justify-center p-0 rounded-[10px] border border-[#E5E7EB] bg-[#FFFFFF] text-[#16181D] hover:bg-gray-55 transition-colors cursor-pointer"
            title="Filters"
          >
            <SlidersHorizontal size={16} />
          </button>
        </>
      );
    } else if (teamTab === "Feed") {
      headerToolbar = null;
    } else if (teamTab === "Announcements") {
      headerToolbar = (
        <>
          <div className="relative w-64 h-[38px] flex items-center gap-2 px-3 bg-[#F6F7F9] border border-[#E8E9ED] rounded-[9px]">
            <Search size={14} className="text-[#9CA0AB] flex-shrink-0" />
            <input
              type="text"
              placeholder="Search..."
              value={teamSearch}
              onChange={(e) => setTeamSearch(e.target.value)}
              className="w-full bg-transparent text-[13px] text-[#16181D] placeholder-[#9CA0AB] outline-none"
            />
          </div>
          <div className="flex-1" />
          <button
            onClick={() => setShowTeamFilter(true)}
            className="h-10 w-10 flex items-center justify-center p-0 rounded-[10px] border border-[#E5E7EB] bg-[#FFFFFF] text-[#16181D] hover:bg-gray-55 transition-colors cursor-pointer"
          >
            <SlidersHorizontal size={16} />
          </button>
          {hasPermission("create-announcement") && (
            <button
              onClick={() => setShowCreateAnnouncement(v => !v)}
              className="h-10 px-[18px] rounded-[10px] border border-[#E5E7EB] bg-[#FFFFFF] text-[#16181D] text-[14px] font-semibold flex items-center gap-2 hover:bg-gray-55 transition-colors cursor-pointer"
            >
              <Plus size={16} strokeWidth={2.2} />
              Create Announcement
            </button>
          )}
        </>
      );
    } else if (teamTab === "Reportees") {
      headerToolbar = (
        <>
          <div className="relative w-64 h-[38px] flex items-center gap-2 px-3 bg-[#F6F7F9] border border-[#E8E9ED] rounded-[9px]">
            <Search size={14} className="text-[#9CA0AB] flex-shrink-0" />
            <input
              type="text"
              placeholder="Search Reportees..."
              value={teamSearch}
              onChange={(e) => setTeamSearch(e.target.value)}
              className="w-full bg-transparent text-[13px] text-[#16181D] placeholder-[#9CA0AB] outline-none"
            />
          </div>
          <div className="flex-1" />
          
          {/* View Switcher Container */}
          <div className="flex items-center border border-[#E5E7EB] rounded-[10px] bg-[#FFFFFF] overflow-hidden h-10">
            <button
              onClick={() => setReporteesViewMode("list")}
              title="List view"
              className={cn(
                "h-full w-10 flex items-center justify-center transition-colors border-r border-[#E5E7EB] cursor-pointer",
                reporteesViewMode === "list"
                  ? "bg-[#EEF2FF] text-[#5C5CFF]"
                  : "text-gray-500 hover:bg-gray-55"
              )}
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setReporteesViewMode("grid")}
              title="Grid view"
              className={cn(
                "h-full w-10 flex items-center justify-center transition-colors cursor-pointer",
                reporteesViewMode === "grid"
                  ? "bg-[#EEF2FF] text-[#5C5CFF]"
                  : "text-gray-500 hover:bg-gray-55"
              )}
            >
              <LayoutGrid size={16} />
            </button>
          </div>

          <button
            onClick={() => setShowTeamFilter(true)}
            title="Filter"
            className="h-10 w-10 flex items-center justify-center p-0 rounded-[10px] border border-[#E5E7EB] bg-[#FFFFFF] text-[#16181D] hover:bg-gray-55 transition-colors cursor-pointer"
          >
            <SlidersHorizontal size={16} />
          </button>
          <button
            onClick={() => attMsg("Reportees directory exported")}
            className="h-10 px-[18px] rounded-[10px] border border-[#E5E7EB] bg-[#FFFFFF] text-[#16181D] text-[14px] font-semibold flex items-center gap-2 hover:bg-gray-55 transition-colors cursor-pointer"
          >
            <Download size={16} />
            Export
          </button>
        </>
      );
    } else if (teamTab === "Approvals") {
      headerToolbar = (
        <>
          <div className="flex-1" />
          <button
            onClick={() => setShowTeamFilter(true)}
            className="h-10 w-10 flex items-center justify-center p-0 rounded-[10px] border border-[#E5E7EB] bg-[#FFFFFF] text-[#16181D] hover:bg-gray-55 transition-colors cursor-pointer"
          >
            <SlidersHorizontal size={16} />
          </button>
          <button
            onClick={() => attMsg("Approvals list exported")}
            className="h-10 px-[18px] rounded-[10px] border border-[#E5E7EB] bg-[#FFFFFF] text-[#16181D] text-[14px] font-semibold flex items-center gap-2 hover:bg-gray-55 transition-colors cursor-pointer"
          >
            <Download size={16} />
            Export
          </button>
        </>
      );
    }
  } else if (page === "tasks") {
    headerToolbar = (
      <>
        <div className="relative w-64 h-[38px] flex items-center gap-2 px-3 bg-[#F6F7F9] border border-[#E8E9ED] rounded-[9px]">
          <Search size={14} className="text-[#9CA0AB] flex-shrink-0" />
          <input
            type="text"
            placeholder="Search Tasks..."
            value={tasksSearch}
            onChange={(e) => setTasksSearch(e.target.value)}
            className="w-full bg-transparent text-[13px] text-[#16181D] placeholder-[#9CA0AB] outline-none"
          />
        </div>
        <div className="flex-1" />
        <button
          onClick={() => setShowTasksFilter(true)}
          className="h-10 w-10 flex items-center justify-center p-0 rounded-[10px] border border-[#E5E7EB] bg-[#FFFFFF] text-[#16181D] hover:bg-gray-55 transition-colors cursor-pointer"
          title="Filters"
        >
          <SlidersHorizontal size={16} />
        </button>
        <button
          onClick={() => setBoardInsightsOpen((v) => !v)}
          className="h-10 w-10 flex items-center justify-center p-0 rounded-[10px] border border-[#E5E7EB] bg-[#FFFFFF] text-[#16181D] hover:bg-gray-55 transition-colors cursor-pointer"
          title="Board Insights"
        >
          <TrendingUp size={16} />
        </button>
        {hasPermission("create-task") && (
          <button
            onClick={() => setShowCreateTask(true)}
            className="h-10 px-[18px] rounded-[10px] border border-[#E5E7EB] bg-[#FFFFFF] text-[#16181D] text-[14px] font-semibold flex items-center gap-2 hover:bg-gray-55 transition-colors cursor-pointer"
          >
            <Plus size={16} strokeWidth={2.2} />
            Create Task
          </button>
        )}
      </>
    );
  } else if (page === "documents") {
    headerToolbar = null;
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar
        page={page}
        navigate={navigate}
        collapsed={sidebarCollapsed}
        onToggle={()=>setSidebarCollapsed(!sidebarCollapsed)}
        onLogout={()=>setShowLogoutConfirm(true)}
        role={role}
        displayName={displayName}
        email={email}
        attendanceSection={attendanceSection}
        leaveSection={leaveSection}
        teamSection={teamSection}
        orgSection={orgSection}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <AppHeader
          title={headerTitle}
          workspaceSwitch={workspaceSwitch}
          tabs={headerTabs}
          activeTab={activeHeaderTab}
          onTabChange={onHeaderTabChange}
          toolbar={headerToolbar}
          onQuickCreate={(action) => {
            if (action === "employee") {
              navigate("employee-add");
            } else if (action === "department") {
              setManageAccountSection("Organization Setup");
              navigate("manage-account");
            } else if (action === "shift") {
              setManageAccountSection("Automation");
              navigate("manage-account");
            } else if (action === "attendance") {
              setAttendanceSection("My Space");
              navigate("attendance");
            } else if (action === "leave") {
              setLeaveSection("My Space");
              navigate("leave");
              setShowApplyLeave(true);
            } else if (action === "holiday") {
              setAttendanceSection("My Space");
              setAttendanceTab("Holidays");
              navigate("attendance");
            } else if (action === "announcement") {
              navigate("team");
              setTeamTab("Announcements");
              setShowCreateAnnouncement(true);
            } else if (action === "task") {
              navigate("tasks");
              setShowCreateTask(true);
            } else if (action === "document") {
              navigate("documents");
              setShowNewDoc(true);
            } else if (action === "policy") {
              setManageAccountSection("Organization Setup");
              navigate("manage-account");
            } else if (action === "discussion") {
              navigate("team");
              setTeamTab("Feed");
              setShowCreateDiscussion(true);
            }
          }}
          onSearchResultClick={(category, item) => {
            if (category === "employee") {
              navigate("employee-profile", item);
            } else if (category === "department") {
              navigate("organization");
              setOrgSection("Management");
            } else if (category === "attendance") {
              navigate("attendance");
            } else if (category === "leave") {
              navigate("leave");
            } else if (category === "task") {
              navigate("tasks");
            } else if (category === "announcement") {
              navigate("team");
              setTeamTab("Announcements");
            } else if (category === "document") {
              navigate("documents");
            } else if (category === "organization") {
              navigate("organization");
            } else if (category === "policies") {
              navigate("organization");
              setOrgSection("Management");
            } else if (category === "settings") {
              navigate("settings");
            }
          }}
          onNotifClick={()=>{setNotifOpen(true);}}
          onSettingsClick={()=>{navigate("settings");}}
          onProfileClick={()=>{navigate("profile");}}
          onLogout={()=>setShowLogoutConfirm(true)}
          unreadNotifications={unread}
        />
        <main className="flex-1 overflow-auto bg-[#F7F8FA]">
          <AppRouter
            page={page}
            navigate={navigate}
            mySpaceTab={mySpaceTab}
            teamTab={teamTab}
            teamSearch={teamSearch}
            showCreatePost={showCreatePost}
            setShowCreatePost={setShowCreatePost}
            showCreateAnnouncement={showCreateAnnouncement}
            setShowCreateAnnouncement={setShowCreateAnnouncement}
            showCreateTask={showCreateTask}
            setShowCreateTask={setShowCreateTask}
            reporteesViewMode={reporteesViewMode}
            showTeamFilter={showTeamFilter}
            setShowTeamFilter={setShowTeamFilter}
            teamDeptFilter={teamDeptFilter}
            setTeamDeptFilter={setTeamDeptFilter}
            teamLocationFilter={teamLocationFilter}
            setTeamLocationFilter={setTeamLocationFilter}
            showCreateDiscussion={showCreateDiscussion}
            setShowCreateDiscussion={setShowCreateDiscussion}
            orgTab={orgTab}
            setOrgTab={setOrgTab}
            orgSearch={orgSearch}
            attendanceSection={attendanceSection}
            setAttendanceSection={setAttendanceSection}
            attendanceTab={attendanceTab}
            leaveSection={leaveSection}
            setLeaveSection={setLeaveSection}
            leaveTab={leaveTab}
            tasksTab={tasksTab}
            tasksSearch={tasksSearch}
            showTasksFilter={showTasksFilter}
            setShowTasksFilter={setShowTasksFilter}
            boardInsightsOpen={boardInsightsOpen}
            setBoardInsightsOpen={setBoardInsightsOpen}
            selectedEmployee={selectedEmployee}
            profileOrigin={profileOrigin}
            documentsTab={documentsTab}
            settingsTab={settingsTab}
            manageAccountSection={manageAccountSection}
          />
        </main>

        {notifOpen&&(
          <div className="fixed inset-0 z-40" onClick={()=>setNotifOpen(false)}>
            <div onClick={e=>e.stopPropagation()}><NotificationsPanel onClose={()=>{ setNotifOpen(false); }} navigate={navigate} onViewAll={()=>{ setNotifOpen(false); navigate("notifications"); }}/></div>
          </div>
        )}
        {quickActionsOpen&&(
          <div className="fixed inset-0 z-40" onClick={()=>setQuickActionsOpen(false)}>
            <div onClick={e=>e.stopPropagation()}><QuickActionsMenu onClose={()=>setQuickActionsOpen(false)} navigate={navigate}/></div>
          </div>
        )}
      </div>
      {aiOpen&&<AIPanel onClose={()=>setAiOpen(false)} navigate={navigate}/>}

      {/* Logout Confirmation */}
      {showLogoutConfirm&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={()=>setShowLogoutConfirm(false)}/>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4"><LogOut size={24} className="text-red-500"/></div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">Sign out of Attendance HRMS?</h3>
            <p className="text-sm text-gray-500 mb-6">Are you sure you want to sign out? Any unsaved changes will be lost.</p>
            <div className="flex gap-3">
              <button onClick={()=>setShowLogoutConfirm(false)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleLogout} disabled={loggingOut} className="flex-1 px-4 py-2.5 bg-red-500 rounded-xl text-sm font-medium text-white hover:bg-red-650 transition-colors disabled:opacity-70 flex items-center justify-center gap-2">
                {loggingOut?<><RefreshCw size={14} className="animate-spin"/>Signing out…</>:<><LogOut size={14}/>Sign Out</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Alert */}
      {attToast && (
        <div className="fixed bottom-6 right-6 z-[150] flex items-center gap-2.5 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium">
          <CheckCircle size={15} className="text-green-400" />
          <span>{attToast}</span>
        </div>
      )}
    </div>
  );
}
