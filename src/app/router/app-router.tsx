import React from "react";
import { AppPage, Employee } from "@/shared/types";
import { SetupWizard, LoginPage, CreateAdminAccountPage, GettingStartedPage } from "@/modules/auth";
import { MySpacePage, ViewProfilePage } from "@/modules/my-space";
import { TeamPage } from "@/modules/team";
import { OrganizationPage, EmployeeProfilePage, AddEmployeePage } from "@/modules/organization";
import { AttendancePage } from "@/modules/attendance";
import { LeavePage } from "@/modules/leave";
import { TasksPage } from "@/modules/tasks";
import { DocumentsPage } from "@/modules/documents";
import { SettingsPage, ManageAccountPage } from "@/modules/settings";
import { SupportPage } from "@/modules/support";
import { NotificationCenterPage } from "@/modules/notifications";
import { useAuth } from "@/shared/context/AuthContext";

interface AppRouterProps {
  page: AppPage;
  navigate: (p: AppPage, emp?: any, tabOrSection?: string) => void;
  mySpaceTab: string;
  teamTab: string;
  teamSearch: string;
  showCreatePost: boolean;
  setShowCreatePost: (b: boolean) => void;
  showCreateAnnouncement: boolean;
  setShowCreateAnnouncement: (b: boolean) => void;
  showCreateTask: boolean;
  setShowCreateTask: (b: boolean) => void;
  reporteesViewMode: "list" | "grid";
  showTeamFilter: boolean;
  setShowTeamFilter: (b: boolean) => void;
  teamDeptFilter: string;
  setTeamDeptFilter: (v: string) => void;
  teamLocationFilter: string;
  setTeamLocationFilter: (v: string) => void;
  showCreateDiscussion: boolean;
  setShowCreateDiscussion: (b: boolean) => void;
  orgTab: string;
  setOrgTab: (v: string) => void;
  orgSearch: string;
  attendanceSection: "My Space" | "My Team";
  setAttendanceSection: (sec: "My Space" | "My Team") => void;
  attendanceTab: string;
  leaveSection: "My Space" | "My Team";
  setLeaveSection: (sec: "My Space" | "My Team") => void;
  leaveTab: string;
  tasksTab: string;
  selectedEmployee: Employee | null;
  profileOrigin: string | null;
  documentsTab: string;
  settingsTab: string;
}

export function AppRouter({
  page,
  navigate,
  mySpaceTab,
  teamTab,
  teamSearch,
  showCreatePost,
  setShowCreatePost,
  showCreateAnnouncement,
  setShowCreateAnnouncement,
  showCreateTask,
  setShowCreateTask,
  reporteesViewMode,
  showTeamFilter,
  setShowTeamFilter,
  teamDeptFilter,
  setTeamDeptFilter,
  teamLocationFilter,
  setTeamLocationFilter,
  showCreateDiscussion,
  setShowCreateDiscussion,
  orgTab,
  setOrgTab,
  orgSearch,
  attendanceSection,
  setAttendanceSection,
  attendanceTab,
  leaveSection,
  setLeaveSection,
  leaveTab,
  tasksTab,
  selectedEmployee,
  profileOrigin,
  documentsTab,
  settingsTab,
}: AppRouterProps) {
  const { role } = useAuth();

  // Bootstrap/Auth pages
  if (page === "login") {
    return (
      <LoginPage
        onLogin={() => navigate("my-space")}
        onRegister={() => navigate("admin-account")}
      />
    );
  }
  if (page === "admin-account") {
    return (
      <CreateAdminAccountPage
        onContinue={() => navigate("getting-started")}
        onBack={() => navigate("login")}
      />
    );
  }
  if (page === "getting-started") {
    return (
      <GettingStartedPage
        onStart={() => navigate("setup")}
        onSkip={() => navigate("my-space")}
      />
    );
  }
  if (page === "setup") {
    return <SetupWizard onComplete={() => navigate("my-space")} />;
  }

  // Shell pages
  switch (page) {
    case "my-space":
      return <MySpacePage navigate={navigate} activeTab={mySpaceTab} role={role} />;
    case "team":
      return (
        <TeamPage
          navigate={navigate}
          activeTab={teamTab}
          search={teamSearch}
          showCreatePost={showCreatePost}
          setShowCreatePost={setShowCreatePost}
          showCreateAnnouncement={showCreateAnnouncement}
          setShowCreateAnnouncement={setShowCreateAnnouncement}
          showCreateTask={showCreateTask}
          setShowCreateTask={setShowCreateTask}
          reporteesViewMode={reporteesViewMode}
          showTeamFilter={showTeamFilter}
          setShowTeamFilter={setShowTeamFilter}
          deptFilter={teamDeptFilter}
          setDeptFilter={setTeamDeptFilter}
          locationFilter={teamLocationFilter}
          setLocationFilter={setTeamLocationFilter}
          showCreateDiscussion={showCreateDiscussion}
          setShowCreateDiscussion={setShowCreateDiscussion}
          setAttendanceSection={setAttendanceSection}
          setLeaveSection={setLeaveSection}
        />
      );
    case "organization":
      return (
        <OrganizationPage
          navigate={navigate}
          onSelectEmployee={(e) => navigate("employee-profile", e)}
          activeTab={orgTab}
          onTabChange={setOrgTab}
          showTeamFilter={showTeamFilter}
          setShowTeamFilter={setShowTeamFilter}
          search={orgSearch}
        />
      );
    case "attendance":
      return (
        <AttendancePage
          navigate={navigate}
          section={attendanceSection}
          onSectionChange={setAttendanceSection}
          activeTab={attendanceTab}
        />
      );
    case "leave":
      return (
        <LeavePage
          navigate={navigate}
          section={leaveSection}
          onSectionChange={setLeaveSection}
          activeTab={leaveTab}
        />
      );
    case "tasks":
      return <TasksPage navigate={navigate} activeTab={tasksTab} />;
    case "employee-profile":
      return (
        <EmployeeProfilePage
          employee={selectedEmployee!}
          navigate={navigate}
          origin={profileOrigin || undefined}
        />
      );
    case "employee-add":
      return <AddEmployeePage navigate={navigate} />;
    case "documents":
      return <DocumentsPage navigate={navigate} activeTab={documentsTab} />;
    case "settings":
      return <SettingsPage navigate={navigate} activeTab={settingsTab} />;
    case "support":
      return <SupportPage navigate={navigate} />;
    case "profile":
      return <ViewProfilePage navigate={navigate} />;
    case "notifications":
      return <NotificationCenterPage navigate={navigate} />;
    case "manage-account":
      return <ManageAccountPage onBack={() => navigate("settings")} />;
    default:
      return <MySpacePage navigate={navigate} activeTab={mySpaceTab} />;
  }
}
