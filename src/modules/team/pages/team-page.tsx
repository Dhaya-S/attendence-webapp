import React, { useState, useEffect, useMemo } from "react";
import { Clock, Plus, Send, Check, X, Phone } from "lucide-react";
import { FeedPost, Employee, AppPage } from "@/shared/types";
import { cn } from "@/shared/utils";
import { Btn, Modal, Drawer, InputField, SelectField, Avt } from "@/shared/components";
import { OverviewTab } from "../components/overview/overview-tab";
import { ReporteesTab } from "../components/reportees/reportees-tab";
import { ApprovalsTab } from "../components/approvals/approvals-tab";
import { FeedTab } from "../components/feed/feed-tab";
import { AnnouncementsTab } from "../components/announcements/announcements-tab";
import { EMPLOYEES } from "@/modules/organization/data/employees";
import { LEAVE_REQUESTS } from "@/modules/leave/data/leave-requests";
import { useAuth } from "@/shared/context/AuthContext";
import { db } from "@/shared/utils/firebase";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";

interface TeamPageProps {
  navigate: (p: AppPage, emp?: any, tabOrSection?: string) => void;
  activeTab: string;
  search?: string;
  showCreatePost: boolean;
  setShowCreatePost: (b: boolean) => void;
  showCreateAnnouncement: boolean;
  setShowCreateAnnouncement: (b: boolean) => void;
  showCreateTask: boolean;
  setShowCreateTask: (b: boolean) => void;
  reporteesViewMode: "list" | "grid";
  showTeamFilter: boolean;
  setShowTeamFilter: (b: boolean) => void;
  deptFilter: string;
  setDeptFilter: (v: string) => void;
  locationFilter: string;
  setLocationFilter: (v: string) => void;
  showCreateDiscussion: boolean;
  setShowCreateDiscussion: (b: boolean) => void;
  setAttendanceSection: (sec: "My Space" | "My Team") => void;
  setLeaveSection: (sec: "My Space" | "My Team") => void;
}

export function TeamPage({
  navigate,
  activeTab,
  search = "",
  showCreatePost,
  setShowCreatePost,
  showCreateAnnouncement,
  setShowCreateAnnouncement,
  showCreateTask,
  setShowCreateTask,
  reporteesViewMode,
  showTeamFilter,
  setShowTeamFilter,
  deptFilter,
  setDeptFilter,
  locationFilter,
  setLocationFilter,
  showCreateDiscussion,
  setShowCreateDiscussion,
  setAttendanceSection,
  setLeaveSection,
}: TeamPageProps) {
  const [tab, setTab] = useState("Overview");

  // Sync activeTab to local tab state
  useEffect(() => {
    setTab(activeTab);
  }, [activeTab]);

  const { user, role, companyId, email, displayName } = useAuth();
  const [dbUsers, setDbUsers] = useState<any[]>([]);

  useEffect(() => {
    if (!companyId || companyId === "default") return;
    const usersCol = collection(db, "organizations", companyId, "users");
    const unsub = onSnapshot(usersCol, (snap) => {
      const formatRole = (r?: string): string => {
        if (!r) return "";
        const low = String(r).toLowerCase().trim();
        if (low === "super_admin" || low === "super admin") return "Super Admin";
        if (low === "hr_admin" || low === "hr admin") return "HR Admin";
        if (low === "manager") return "Manager";
        if (low === "employee") return "Employee";
        return r;
      };

      const list = snap.docs.map((d) => {
        const u = d.data();
        const name = u.name || `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email || "Employee";
        const initials = u.initials || name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "EM";
        return {
          ...u,
          id: d.id || u.id || u.email,
          name,
          initials,
          color: u.color || "#5C5CFF",
          email: u.email || u.workEmail,
          dept: u.dept || u.department || "General",
          designation: u.designation || u.roleLabel || formatRole(u.role) || u.jobTitle || "Staff",
          status: u.status || "Active",
          branch: u.branch || "Headquarters",
          empType: u.empType || "Full-Time",
          joinDate: u.joinDate || "Recent",
          attendance: u.attendance || 100,
          manager: u.manager || "",
        };
      });
      setDbUsers(list);
    }, (err) => {
      console.warn("Error listening to users in team page:", err);
    });
    return () => unsub();
  }, [companyId]);

  const myTeamMembers = useMemo(() => {
    const baseList = dbUsers.length > 0 ? dbUsers : EMPLOYEES;

    const normalizedEmail = String(email || user?.email || "").toLowerCase();
    const currentUserProfile = baseList.find(e => String(e.email || e.workEmail || "").toLowerCase() === normalizedEmail);

    const userRole = String(role || currentUserProfile?.role || "employee").toLowerCase();
    const currentUserName = currentUserProfile?.name || displayName || "";

    if (userRole === "super_admin" || userRole === "admin") {
      return baseList.filter(e => {
        const r = String(e.role || "").toLowerCase();
        const desig = String(e.designation || "").toLowerCase();
        return r === "super_admin" || r === "admin" || desig.includes("ceo") || desig.includes("cfo") || desig.includes("vp") || desig.includes("director") || desig.includes("admin");
      });
    }

    if (userRole === "hr_admin") {
      return baseList.filter(e => {
        const r = String(e.role || "").toLowerCase();
        const desig = String(e.designation || "").toLowerCase();
        return r === "hr_admin" || desig.includes("hr");
      });
    }

    if (userRole === "manager") {
      const mgrDepts = new Set<string>();
      
      const ownDept = currentUserProfile?.dept || currentUserProfile?.department;
      if (ownDept) mgrDepts.add(ownDept);

      baseList.forEach(e => {
        const isReportee = (e.manager && currentUserName && String(e.manager).toLowerCase() === currentUserName.toLowerCase()) ||
                           (e.managerEmail && normalizedEmail && String(e.managerEmail).toLowerCase() === normalizedEmail);
        if (isReportee && e.dept) {
          mgrDepts.add(e.dept);
        }
      });

      return baseList.filter(e => {
        const d = e.dept || e.department;
        return d && mgrDepts.has(d);
      });
    }

    const empDept = currentUserProfile?.dept || currentUserProfile?.department || "General";
    return baseList.filter(e => (e.dept || e.department) === empDept);
  }, [dbUsers, email, user, role, displayName]);

  // Sync activeTab to local tab state
  const [dbLeaveRequests, setDbLeaveRequests] = useState<any[]>([]);

  useEffect(() => {
    if (!companyId || companyId === "default") return;
    const colRef = collection(db, "organizations", companyId, "leave_requests");
    const unsub = onSnapshot(colRef, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setDbLeaveRequests(list);
    }, (err) => {
      console.warn("Error listening to leave requests in team-page:", err);
    });
    return () => unsub();
  }, [companyId]);

  const [statusFilter, setStatusFilter] = useState("All");
  const [desigFilter, setDesigFilter] = useState("All");
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [teamReqs, setTeamReqs] = useState<any[]>([]);

  useEffect(() => {
    const baseList = dbLeaveRequests.length > 0 ? dbLeaveRequests : LEAVE_REQUESTS;
    
    // Filter requests where the applicant is in myTeamMembers
    const filteredReqs = baseList.filter((req) => {
      if (!req) return false;
      const applicantEmail = String(req.applicantEmail || "").toLowerCase();
      const employeeName = String(req.employee || "").toLowerCase();
      
      return myTeamMembers.some((m) => {
        const mEmail = String(m.email || m.workEmail || "").toLowerCase();
        const mName = String(m.name || "").toLowerCase();
        return (applicantEmail && mEmail === applicantEmail) || (employeeName && mName === employeeName);
      });
    });

    setTeamReqs(filteredReqs);
  }, [dbLeaveRequests, myTeamMembers]);

  const [tApproveId, setTApproveId] = useState<string | null>(null);
  const [tRejectId, setTRejectId] = useState<string | null>(null);
  const [tRejectReason, setTRejectReason] = useState("");
  const [tApprovalDetailId, setTApprovalDetailId] = useState<string | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailBody, setEmailBody] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [showCallModal, setShowCallModal] = useState(false);
  const [showAssignTask, setShowAssignTask] = useState(false);
  const [showAssignShift, setShowAssignShift] = useState(false);

  // --- FEED COLLABORATION SPACE STATE ---
  const [posts, setPosts] = useState<FeedPost[]>([]);

  useEffect(() => {
    if (!companyId || companyId === "default") return;
    const colRef = collection(db, "organizations", companyId, "team_feed");
    const unsub = onSnapshot(colRef, (snap) => {
      const rawList = snap.docs.map(d => ({ id: d.id, ...d.data() } as FeedPost));
      
      rawList.sort((a, b) => {
        const tA = typeof a.createdAt === 'number' ? a.createdAt : new Date(a.createdAt || 0).getTime();
        const tB = typeof b.createdAt === 'number' ? b.createdAt : new Date(b.createdAt || 0).getTime();
        return tB - tA;
      });

      const normalizedEmail = String(email || user?.email || "").toLowerCase();
      const currentUserProfile = dbUsers.find(e => String(e.email || e.workEmail || "").toLowerCase() === normalizedEmail);
      const userDept = String(currentUserProfile?.dept || currentUserProfile?.department || "").toLowerCase();
      const userName = String(displayName || "").toLowerCase();

      const teamFiltered = rawList.filter((post) => {
        if (!post) return false;
        const pEmail = String(post.authorEmail || "").toLowerCase();
        const pAuthor = String(post.author || "").toLowerCase();
        const pDept = String(post.dept || "").toLowerCase();

        // 1. Current user authored this post
        if ((pEmail && normalizedEmail && pEmail === normalizedEmail) || (pAuthor && userName && pAuthor === userName)) {
          return true;
        }

        // 2. Author is in myTeamMembers (matching role scope: super_admin, hr_admin, manager, or employee department)
        const isAuthorInTeam = myTeamMembers.some((m) => {
          const mEmail = String(m.email || m.workEmail || "").toLowerCase();
          const mName = String(m.name || "").toLowerCase();
          return (pEmail && mEmail === pEmail) || (pAuthor && mName === pAuthor);
        });
        if (isAuthorInTeam) return true;

        // 3. Post department matches user's department
        if (pDept && pDept !== "all" && userDept && pDept === userDept) {
          return true;
        }

        return false;
      });

      setPosts(teamFiltered);
    }, (err) => {
      console.warn("Error listening to team_feed in team-page:", err);
    });
    return () => unsub();
  }, [companyId, myTeamMembers, dbUsers, email, user, displayName]);

  const currentUserInfo = useMemo(() => {
    const normalizedEmail = String(email || user?.email || "").toLowerCase();
    const currentUserProfile = dbUsers.find(e => String(e.email || e.workEmail || "").toLowerCase() === normalizedEmail);
    const currentUserName = currentUserProfile?.name || displayName || email || "Team Member";
    const currentUserInitials = currentUserProfile?.initials || (currentUserName ? currentUserName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) : "TM");
    const currentUserColor = currentUserProfile?.color || "#5C5CFF";
    const currentUserDesignation = currentUserProfile?.designation || currentUserProfile?.roleLabel || currentUserProfile?.role || "Member";

    return {
      name: currentUserName,
      email: normalizedEmail,
      initials: currentUserInitials,
      color: currentUserColor,
      designation: currentUserDesignation,
      dept: currentUserProfile?.dept || currentUserProfile?.department || "General",
      role: String(role || currentUserProfile?.role || "employee"),
    };
  }, [dbUsers, email, user, displayName, role]);

  // Centralized Modal State System
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const handleCloseModal = () => {
    setActiveModal(null);
    setShowCreateDiscussion(false);
    setTApproveId(null);
    setTRejectId(null);
    setShowTeamFilter(false);
    setShowEmailModal(false);
    setShowCallModal(false);
    setShowAssignTask(false);
    setShowAssignShift(false);
  };

  // Sync prop-based triggers to activeModal
  useEffect(() => {
    if (showCreateDiscussion) {
      setActiveModal("new-discussion");
    }
  }, [showCreateDiscussion]);

  useEffect(() => {
    if (showAssignTask) {
      setActiveModal("assign-task");
    } else if (activeModal === "assign-task") {
      setActiveModal(null);
    }
  }, [showAssignTask]);

  useEffect(() => {
    if (showAssignShift) {
      setActiveModal("assign-shift");
    } else if (activeModal === "assign-shift") {
      setActiveModal(null);
    }
  }, [showAssignShift]);

  useEffect(() => {
    if (showEmailModal) {
      setActiveModal("email");
    } else if (activeModal === "email") {
      setActiveModal(null);
    }
  }, [showEmailModal]);

  useEffect(() => {
    if (showCallModal) {
      setActiveModal("call");
    } else if (activeModal === "call") {
      setActiveModal(null);
    }
  }, [showCallModal]);

  useEffect(() => {
    if (tApproveId) {
      setActiveModal("approve-leave");
    } else if (activeModal === "approve-leave") {
      setActiveModal(null);
    }
  }, [tApproveId]);

  useEffect(() => {
    if (tRejectId) {
      setActiveModal("reject-leave");
    } else if (activeModal === "reject-leave") {
      setActiveModal(null);
    }
  }, [tRejectId]);

  useEffect(() => {
    if (showTeamFilter) {
      setActiveModal("filter-members");
    } else if (activeModal === "filter-members") {
      setActiveModal(null);
    }
  }, [showTeamFilter]);

  const approveT = (id: string) => {
    setTApprovalDetailId(null);
    setTApproveId(id);
    setActiveModal("approve-leave");
  };
  const rejectT = (id: string) => {
    setTApprovalDetailId(null);
    setTRejectId(id);
    setTRejectReason("");
    setActiveModal("reject-leave");
  };
  const confirmApproveT = async () => {
    if (!tApproveId) return;
    const isDbReq = dbLeaveRequests.some((x) => x.id === tApproveId);
    if (isDbReq && companyId && companyId !== "default") {
      try {
        const docRef = doc(db, "organizations", companyId, "leave_requests", tApproveId);
        await updateDoc(docRef, { status: "Approved" });
      } catch (err) {
        console.error("Error approving leave request in Firestore:", err);
      }
    } else {
      setTeamReqs((r) =>
        r.map((x) => (x.id === tApproveId ? { ...x, status: "Approved" } : x))
      );
    }
    handleCloseModal();
  };

  const confirmRejectT = async () => {
    if (!tRejectId || !tRejectReason.trim()) return;
    const isDbReq = dbLeaveRequests.some((x) => x.id === tRejectId);
    if (isDbReq && companyId && companyId !== "default") {
      try {
        const docRef = doc(db, "organizations", companyId, "leave_requests", tRejectId);
        await updateDoc(docRef, { status: "Rejected", rejectReason: tRejectReason });
      } catch (err) {
        console.error("Error rejecting leave request in Firestore:", err);
      }
    } else {
      setTeamReqs((r) =>
        r.map((x) =>
          x.id === tRejectId
            ? { ...x, status: "Rejected", rejectReason: tRejectReason }
            : x
        )
      );
    }
    handleCloseModal();
  };

  const filtered = useMemo(() => {
    return myTeamMembers.filter((e) => {
      const ms =
        (e.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (e.designation || "").toLowerCase().includes(search.toLowerCase());
      const d = e.dept || e.department || "";
      const md = deptFilter === "All" || d === deptFilter;
      const mst = statusFilter === "All" || (e.status || "") === statusFilter;
      const mdg = desigFilter === "All" || (e.designation || "") === desigFilter;
      const loc = e.branch || e.location || "";
      const mloc = locationFilter === "All" || loc === locationFilter;
      return ms && md && mst && mdg && mloc;
    });
  }, [myTeamMembers, search, deptFilter, statusFilter, desigFilter, locationFilter]);

  const depts = useMemo(() => {
    const list = myTeamMembers.map((e) => e.dept || e.department).filter(Boolean);
    return ["All", ...Array.from(new Set(list))].sort() as string[];
  }, [myTeamMembers]);

  const desigs = useMemo(() => {
    const list = myTeamMembers.map((e) => e.designation).filter(Boolean);
    return ["All", ...Array.from(new Set(list))].sort() as string[];
  }, [myTeamMembers]);

  const locations = useMemo(() => {
    const list = myTeamMembers.map((e) => e.branch || e.location).filter(Boolean);
    return ["All", ...Array.from(new Set(list))].sort() as string[];
  }, [myTeamMembers]);

  // Redesigned Tasks selection
  const [selectedTeamTask, setSelectedTeamTask] = useState<any>(null);

  return (
    <div className="flex flex-col h-full bg-[#F7F8FA] overflow-hidden">
      <div className="flex-1 overflow-hidden">
        {/* ── OVERVIEW TAB ── */}
        {tab === "Overview" && (
          <OverviewTab
            deptFilter={deptFilter}
            teamReqs={teamReqs}
            setTeamTab={setTab}
            setAttendanceSection={setAttendanceSection}
            setLeaveSection={setLeaveSection}
            navigate={navigate}
            teamMembers={myTeamMembers}
          />
        )}

        {/* ── FEED TAB ── */}
        {tab === "Feed" && (
          <FeedTab
            posts={posts}
            setPosts={setPosts}
            depts={depts}
            showCreateDiscussion={showCreateDiscussion}
            setShowCreateDiscussion={setShowCreateDiscussion}
            teamMembers={myTeamMembers}
            companyId={companyId}
            currentUser={currentUserInfo}
          />
        )}

        {/* ── ANNOUNCEMENTS TAB ── */}
        {tab === "Announcements" && (
          <AnnouncementsTab
            showCreateAnnouncement={showCreateAnnouncement}
            setShowCreateAnnouncement={setShowCreateAnnouncement}
            teamMembers={myTeamMembers}
          />
        )}

        {/* ── REPORTEES TAB ── */}
        {tab === "Reportees" && (
          <ReporteesTab
            filtered={filtered}
            reporteesViewMode={reporteesViewMode}
            navigate={navigate}
          />
        )}

        {/* ── APPROVALS TAB ── */}
        {tab === "Approvals" && (
          <ApprovalsTab
            teamReqs={teamReqs}
            tApprovalDetailId={tApprovalDetailId}
            setTApprovalDetailId={setTApprovalDetailId}
            approveT={approveT}
            rejectT={rejectT}
          />
        )}
      </div>

      {/* ── TeamPage: Task Detail Drawer ── */}
      <Drawer
        isOpen={!!selectedTeamTask}
        onClose={() => setSelectedTeamTask(null)}
        title={selectedTeamTask?.title || "Task Details"}
        avatar={
          <div className="w-10 h-10 rounded-full bg-[#5B57E8] text-white text-sm font-semibold flex items-center justify-center">
            AA
          </div>
        }
        headerAddon={
          selectedTeamTask ? (
            <StatusBadge status={selectedTeamTask.status} />
          ) : null
        }
        footer={
          <Btn variant="outline" onClick={() => setSelectedTeamTask(null)}>
            Close Details
          </Btn>
        }
      >
        {selectedTeamTask && (
          <div className="space-y-6 text-left">
            <div className="bg-white rounded-xl border border-gray-150 p-4 shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Task Assignment
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                    Assigned To
                  </p>
                  <p className="text-xs font-semibold text-gray-808 mt-1">
                    {selectedTeamTask.assignee}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                    Department
                  </p>
                  <p className="text-xs font-semibold text-gray-850 mt-1">
                    {selectedTeamTask.dept}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                    Due Date
                  </p>
                  <p className="text-xs font-semibold text-gray-855 mt-1">
                    {selectedTeamTask.due}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                    Priority
                  </p>
                  <p className="text-xs font-semibold text-gray-855 mt-1">
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                        selectedTeamTask.priority === "High"
                          ? "bg-red-50 text-red-500"
                          : selectedTeamTask.priority === "Medium"
                          ? "bg-amber-50 text-amber-500"
                          : "bg-gray-100 text-gray-400"
                      )}
                    >
                      {selectedTeamTask.priority}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-150 p-4 shadow-sm space-y-2">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Description
              </h4>
              <p className="text-xs text-gray-700 leading-relaxed font-semibold">
                Please complete the reviews and log the results in the system.
                Follow the standard guidelines for evaluations.
              </p>
            </div>
          </div>
        )}
      </Drawer>

      {/* ── TeamPage: Assign Task Modal ── */}
      {activeModal === "assign-task" && (
        <Modal
          title="Assign Task"
          onClose={() => {
            setShowAssignTask(false);
            handleCloseModal();
          }}
        >
          <div className="space-y-3">
            <InputField
              label="Task Title"
              placeholder="e.g. Complete Q3 Performance Review…"
            />
            <div className="grid grid-cols-2 gap-3">
              <SelectField label="Priority">
                <option>Medium</option>
                <option>High</option>
                <option>Low</option>
                <option>Critical</option>
              </SelectField>
              <SelectField label="Category">
                <option>Admin</option>
                <option>Project</option>
                <option>Compliance</option>
                <option>Training</option>
              </SelectField>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <InputField label="Due Date" type="date" />
              <SelectField label="Linked To">
                <option>None</option>
                <option>Q3 Review</option>
                <option>Onboarding</option>
              </SelectField>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <Btn
                variant="outline"
                onClick={() => {
                  setShowAssignTask(false);
                  handleCloseModal();
                }}
              >
                Cancel
              </Btn>
              <Btn
                onClick={() => {
                  setShowAssignTask(false);
                  handleCloseModal();
                }}
              >
                <Plus size={13} />
                Assign Task
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* ── TeamPage: Assign Shift Modal ── */}
      {activeModal === "assign-shift" && selectedEmp && (
        <Modal
          title={`Assign Shift · ${selectedEmp.name}`}
          onClose={() => {
            setShowAssignShift(false);
            handleCloseModal();
          }}
          width="max-w-md"
        >
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-4 bg-gray-55 rounded-xl">
              <Avt initials={selectedEmp.initials} color={selectedEmp.color} size="sm" />
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {selectedEmp.name}
                </p>
                <p className="text-xs text-gray-500">
                  Current: {selectedEmp.shift}
                </p>
              </div>
            </div>
            <SelectField label="New Shift">
              <option>Morning (6AM–2PM)</option>
              <option>General (9AM–6PM)</option>
              <option>Evening (2PM–10PM)</option>
              <option>Night (10PM–6AM)</option>
              <option>Flexible</option>
            </SelectField>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <Btn
                variant="outline"
                onClick={() => {
                  setShowAssignShift(false);
                  handleCloseModal();
                }}
              >
                Cancel
              </Btn>
              <Btn
                onClick={() => {
                  setShowAssignShift(false);
                  handleCloseModal();
                }}
              >
                <Clock size={13} />
                Save Shift
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* ── TeamPage: Approve Leave Modal ── */}
      {activeModal === "approve-leave" &&
        tApproveId &&
        (() => {
          const req = teamReqs.find((r) => r.id === tApproveId);
          return req ? (
            <Modal
              title="Approve Leave"
              onClose={() => {
                setTApproveId(null);
                handleCloseModal();
              }}
            >
              <div className="space-y-4 text-left">
                <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-start gap-3">
                  <CheckCircle
                    size={18}
                    className="text-green-500 flex-shrink-0 mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-semibold text-green-808">
                      Confirm Approval
                    </p>
                    <p className="text-xs text-green-700 mt-0.5">
                      This will notify the employee and update their leave balance.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {(
                    [
                      ["Employee", req.employee],
                      ["Leave Type", req.type],
                      ["Date Range", `${fmtDate(req.from)} – ${fmtDate(req.to)}`],
                      ["Total Days", req.days + " days"],
                    ] as [string, string][]
                  ).map(([k, v]) => (
                    <div key={k} className="bg-gray-55 rounded-lg p-3">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">
                        {k}
                      </p>
                      <p className="text-sm font-semibold text-gray-808">{v}</p>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
                  <Btn
                    variant="outline"
                    onClick={() => {
                      setTApproveId(null);
                      handleCloseModal();
                    }}
                  >
                    Cancel
                  </Btn>
                  <Btn
                    onClick={confirmApproveT}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Check size={13} />
                    Approve
                  </Btn>
                </div>
              </div>
            </Modal>
          ) : null;
        })()}

      {/* ── TeamPage: Reject Leave Modal ── */}
      {activeModal === "reject-leave" &&
        tRejectId &&
        (() => {
          const req = teamReqs.find((r) => r.id === tRejectId);
          return req ? (
            <Modal
              title="Reject Leave Request"
              onClose={() => {
                setTRejectId(null);
                handleCloseModal();
              }}
            >
              <div className="space-y-4 text-left">
                <div className="grid grid-cols-2 gap-3">
                  {(
                    [
                      ["Employee", req.employee],
                      ["Type", req.type],
                      ["Period", `${fmtDate(req.from)} – ${fmtDate(req.to)}`],
                      ["Days", req.days + " days"],
                    ] as [string, string][]
                  ).map(([k, v]) => (
                    <div key={k} className="bg-gray-55 rounded-lg p-3">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">
                        {k}
                      </p>
                      <p className="text-sm font-semibold text-gray-808">{v}</p>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
                  <Btn
                    variant="outline"
                    onClick={() => {
                      setTRejectId(null);
                      handleCloseModal();
                    }}
                  >
                    Cancel
                  </Btn>
                  <Btn
                    onClick={confirmRejectT}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <X size={13} />
                    Reject Leave
                  </Btn>
                </div>
              </div>
            </Modal>
          ) : null;
        })()}

      {/* ── TeamPage: Email Modal ── */}
      {activeModal === "email" && selectedEmp && (
        <Modal
          title={`Email · ${selectedEmp.name}`}
          onClose={() => {
            setShowEmailModal(false);
            handleCloseModal();
          }}
          width="max-w-xl"
        >
          <div className="space-y-3 text-left">
            <InputField
              label="Subject"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              placeholder="Subject…"
            />
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500">Message</label>
              <textarea
                rows={6}
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                placeholder="Write your message…"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#5C5CFF] text-gray-900 bg-white"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <Btn
                variant="outline"
                onClick={() => {
                  setShowEmailModal(false);
                  handleCloseModal();
                }}
              >
                Cancel
              </Btn>
              <Btn
                onClick={() => {
                  setShowEmailModal(false);
                  handleCloseModal();
                }}
              >
                <Send size={13} />
                Send Email
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* ── TeamPage: Call Modal ── */}
      {activeModal === "call" && selectedEmp && (
        <Modal
          title="Contact Details"
          onClose={() => {
            setShowCallModal(false);
            handleCloseModal();
          }}
          width="max-w-sm"
        >
          <div className="space-y-3 text-left">
            <div className="flex items-center gap-3 p-4 bg-gray-55 rounded-xl">
              <Avt initials={selectedEmp.initials} color={selectedEmp.color} size="md" />
              <div>
                <p className="font-semibold text-gray-900">{selectedEmp.name}</p>
                <p className="text-xs text-gray-500">{selectedEmp.designation}</p>
              </div>
            </div>
            <Btn
              className="w-full justify-center"
              onClick={() => {
                setShowCallModal(false);
                handleCloseModal();
              }}
            >
              <Phone size={13} />
              Call Now
            </Btn>
          </div>
        </Modal>
      )}

      {/* ── TeamPage: Filters Modal ── */}
      {activeModal === "filter-members" && (
        <Modal
          title="Filter Members &amp; Reportees"
          onClose={() => {
            setShowTeamFilter(false);
            handleCloseModal();
          }}
          width="max-w-md"
        >
          <div className="space-y-4 text-left">
            <SelectField
              label="Department"
              options={depts}
              value={deptFilter}
              onChange={(v) => setDeptFilter(v)}
            />
            <SelectField
              label="Location"
              options={locations}
              value={locationFilter}
              onChange={(v) => setLocationFilter(v)}
            />
            <SelectField
              label="Designation"
              options={desigs}
              value={desigFilter}
              onChange={(v) => setDesigFilter(v)}
            />
            <SelectField
              label="Status"
              options={["All", "Active", "On Leave", "Inactive"]}
              value={statusFilter}
              onChange={(v) => setStatusFilter(v)}
            />
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-150">
              <Btn
                variant="outline"
                size="sm"
                onClick={() => {
                  setDeptFilter("All");
                  setLocationFilter("All");
                  setDesigFilter("All");
                  setStatusFilter("All");
                  setShowTeamFilter(false);
                  handleCloseModal();
                }}
              >
                Reset
              </Btn>
              <Btn
                size="sm"
                onClick={() => {
                  setShowTeamFilter(false);
                  handleCloseModal();
                }}
              >
                Apply Filters
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
