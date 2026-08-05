import React, { useState, useEffect, useMemo } from "react";
import { X, CheckCircle, Search } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Area,
} from "recharts";
import { AppPage } from "@/shared/types";
import { cn, db } from "@/shared/utils";
import { Avt, StatusBadge, Btn } from "@/shared/components";
import { MySpacePage } from "@/modules/my-space";
import { EMP_COLORS } from "@/shared/constants/colors";
import { useAuth } from "@/shared/context/AuthContext";
import { collection, onSnapshot, query, where } from "firebase/firestore";

export function AttendancePage({
  navigate,
  section,
  onSectionChange,
  activeTab,
}: {
  navigate: (p: AppPage, emp?: any, tabOrSection?: string) => void;
  section: "My Space" | "My Team";
  onSectionChange: (s: "My Space" | "My Team") => void;
  activeTab: string;
}) {
  const { companyId, email, user, role, displayName } = useAuth();
  const [tab, setTab] = useState("Overview");
  const [attView, setAttView] = useState<"summary" | "timeline" | "calendar" | "issues">("summary");
  const [attPeriod, setAttPeriod] = useState<"Weekly" | "Monthly" | "Yearly">("Monthly");

  // Firestore realtime state
  const [dbUsers, setDbUsers] = useState<any[]>([]);
  const [dbAttendance, setDbAttendance] = useState<any[]>([]);
  const [dbLeaveRequests, setDbLeaveRequests] = useState<any[]>([]);
  const [loadingAtt, setLoadingAtt] = useState(true);

  // Filters for team view
  const [teamDeptFilter, setTeamDeptFilter] = useState("All");
  const [teamStatusFilter, setTeamStatusFilter] = useState("All");
  const [teamEmpSearch, setTeamEmpSearch] = useState("");
  const [attFMonth, setAttFMonth] = useState("All");
  const [attFQuarter, setAttFQuarter] = useState("All");
  const [attFShift, setAttFShift] = useState("All");
  const [showAttFilter, setShowAttFilter] = useState(false);
  const [exTab, setExTab] = useState("Missing Check-In");
  const [attToast, setAttToast] = useState<string | null>(null);

  const attMsg = (m: string) => {
    setAttToast(m);
    setTimeout(() => setAttToast(null), 2500);
  };

  useEffect(() => {
    if (section === "My Space") {
      if (activeTab === "Overview") setAttView("summary");
      else if (activeTab === "Exceptions") setAttView("issues");
      else if (activeTab === "Analytics") setAttView("timeline");
    } else {
      setTab(activeTab);
    }
  }, [activeTab, section]);

  // Firestore: users
  useEffect(() => {
    if (!companyId || companyId === "default") return;
    const ref = collection(db, "organizations", companyId, "users");
    return onSnapshot(ref, (snap) => {
      setDbUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.warn("AttPage: users error:", err));
  }, [companyId]);

  // Firestore: today's attendance
  useEffect(() => {
    if (!companyId || companyId === "default") return;
    const today = new Date().toISOString().split("T")[0];
    const ref = collection(db, "organizations", companyId, "attendance");
    const q = query(ref, where("date", "==", today));
    return onSnapshot(q, (snap) => {
      setDbAttendance(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoadingAtt(false);
    }, (err) => { console.warn("AttPage: attendance error:", err); setLoadingAtt(false); });
  }, [companyId]);

  // Firestore: leave requests
  useEffect(() => {
    if (!companyId || companyId === "default") return;
    const ref = collection(db, "organizations", companyId, "leave_requests");
    return onSnapshot(ref, (snap) => {
      setDbLeaveRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.warn("AttPage: leave_requests error:", err));
  }, [companyId]);

  const normalizedEmail = String(email || user?.email || "").toLowerCase();
  const currentUserProfile = dbUsers.find(e => String(e.email || e.workEmail || "").toLowerCase() === normalizedEmail);
  const userRole = String(role || currentUserProfile?.role || "employee").toLowerCase();
  const currentUserName = currentUserProfile?.name || displayName || "";

  const myTeamMembers = useMemo(() => {
    if (!dbUsers.length) return [];
    if (userRole === "super_admin" || userRole === "admin") return dbUsers;
    if (userRole === "hr_admin") {
      return dbUsers.filter(e => {
        const r = String(e.role || "").toLowerCase();
        const desig = String(e.designation || "").toLowerCase();
        return r === "hr_admin" || desig.includes("hr");
      });
    }
    if (userRole === "manager") {
      const mgrDepts = new Set<string>();
      const ownDept = currentUserProfile?.dept || currentUserProfile?.department;
      if (ownDept) mgrDepts.add(ownDept);
      dbUsers.forEach(e => {
        const isReportee = (e.manager && currentUserName && String(e.manager).toLowerCase() === currentUserName.toLowerCase()) ||
          (e.managerEmail && normalizedEmail && String(e.managerEmail).toLowerCase() === normalizedEmail);
        if (isReportee && e.dept) mgrDepts.add(e.dept);
      });
      return dbUsers.filter(e => { const d = e.dept || e.department; return d && mgrDepts.has(d); });
    }
    const empDept = currentUserProfile?.dept || currentUserProfile?.department || "";
    return dbUsers.filter(e => (e.dept || e.department) === empDept);
  }, [dbUsers, userRole, currentUserProfile, currentUserName, normalizedEmail]);

  // Enrich team members with today's attendance
  const teamRows = useMemo(() => {
    return myTeamMembers.map(emp => {
      const empEmail = String(emp.email || emp.workEmail || "").toLowerCase();
      const empId = String(emp.id || emp.employeeId || "");
      const attRecord = dbAttendance.find(a => {
        const aEmail = String(a.employeeEmail || a.email || "").toLowerCase();
        return aEmail === empEmail || a.employeeId === empId;
      });
      const rawStatus = attRecord?.status || emp.attendanceStatus || "Absent";
      const s = String(rawStatus).toLowerCase();
      let displayStatus = "Absent";
      if (s === "present" || s === "checked in" || s === "working") displayStatus = "Present";
      else if (s === "late") displayStatus = "Late";
      else if (s === "wfh" || s === "remote") displayStatus = "WFH";
      else if (s === "on leave" || s === "leave") displayStatus = "On Leave";
      else if (s !== "absent" && s !== "checked out" && s !== "offline") {
        const today = new Date().toISOString().split("T")[0];
        const onLeave = dbLeaveRequests.some(lr => {
          const lEmail = String(lr.employeeEmail || lr.email || "").toLowerCase();
          return lEmail === empEmail && lr.status === "Approved" && lr.from <= today && lr.to >= today;
        });
        displayStatus = onLeave ? "On Leave" : "Absent";
      }
      const checkIn = attRecord?.checkIn || attRecord?.checkInTime || "–";
      const checkOut = attRecord?.checkOut || attRecord?.checkOutTime || "–";
      let hours = "–";
      const parseT = (t: string) => { const m = t.match(/(\d+):(\d+)/); return m ? parseInt(m[1]) * 60 + parseInt(m[2]) : null; };
      if (checkIn && checkIn !== "–" && checkIn !== "—") {
        const inMin = parseT(checkIn);
        if (inMin !== null) {
          const now = new Date();
          const outVal = (checkOut && checkOut !== "–" && checkOut !== "—") ? parseT(checkOut) : (now.getHours() * 60 + now.getMinutes());
          if (outVal !== null && outVal > inMin) {
            const diff = outVal - inMin;
            const h = Math.floor(diff / 60), m = diff % 60;
            hours = m > 0 ? `${h}h ${m}m` : `${h}h`;
          }
        }
      }
      const initials = (emp.name || "??").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
      const color = emp.color || EMP_COLORS[myTeamMembers.indexOf(emp) % EMP_COLORS.length] || "#5C5CFF";
      return {
        id: emp.employeeId || emp.id || empEmail,
        name: emp.name || emp.fullName || empEmail,
        dept: emp.dept || emp.department || "–",
        checkIn: checkIn !== "–" && checkIn !== "—" ? checkIn : "–",
        checkOut: checkOut !== "–" && checkOut !== "—" ? checkOut : "–",
        hours, status: displayStatus, initials, color,
      };
    });
  }, [myTeamMembers, dbAttendance, dbLeaveRequests]);

  const statusCounts = useMemo(() => {
    const c: Record<string, number> = { Present: 0, Late: 0, "On Leave": 0, WFH: 0, Absent: 0 };
    teamRows.forEach(r => { if (r.status in c) c[r.status]++; });
    return c;
  }, [teamRows]);

  const depts = useMemo(() => {
    const s = new Set<string>(["All"]);
    teamRows.forEach(r => { if (r.dept && r.dept !== "–") s.add(r.dept); });
    return Array.from(s);
  }, [teamRows]);

  const filteredRows = useMemo(() => {
    return teamRows.filter(r =>
      (teamDeptFilter === "All" || r.dept === teamDeptFilter) &&
      (teamStatusFilter === "All" || r.status === teamStatusFilter) &&
      (!teamEmpSearch || r.name.toLowerCase().includes(teamEmpSearch.toLowerCase()))
    );
  }, [teamRows, teamDeptFilter, teamStatusFilter, teamEmpSearch]);

  const exceptionRows = useMemo(() => {
    return myTeamMembers.map(emp => {
      const empEmail = String(emp.email || emp.workEmail || "").toLowerCase();
      const empId = String(emp.id || emp.employeeId || "");
      const attRecord = dbAttendance.find(a => {
        const aEmail = String(a.employeeEmail || a.email || "").toLowerCase();
        return aEmail === empEmail || a.employeeId === empId;
      });
      const checkIn = attRecord?.checkIn || attRecord?.checkInTime || null;
      const checkOut = attRecord?.checkOut || attRecord?.checkOutTime || null;
      const status = String(attRecord?.status || emp.attendanceStatus || "").toLowerCase();
      const initials = (emp.name || "??").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
      const color = emp.color || "#5C5CFF";
      return { ...emp, checkIn, checkOut, status, initials, color, attRecord };
    }).filter(emp => {
      if (exTab === "Missing Check-In") return !emp.checkIn && emp.status !== "on leave" && emp.status !== "leave";
      if (exTab === "Missing Check-Out") return emp.checkIn && !emp.checkOut && emp.status !== "on leave";
      if (exTab === "Geo Fence Violations") return !!(emp.attRecord as any)?.geoViolation;
      if (exTab === "Attendance Corrections") return !!(emp.attRecord as any)?.correctionRequested;
      return false;
    });
  }, [myTeamMembers, dbAttendance, exTab]);

  const wfhByDept = useMemo(() => {
    const m: Record<string, { wfh: number; total: number }> = {};
    teamRows.forEach(r => {
      if (!r.dept || r.dept === "–") return;
      if (!m[r.dept]) m[r.dept] = { wfh: 0, total: 0 };
      m[r.dept].total++;
      if (r.status === "WFH") m[r.dept].wfh++;
    });
    return Object.entries(m).map(([dept, { wfh, total }]) => ({ dept, wfh, total }));
  }, [teamRows]);

  const attTrendData = useMemo(() => {
    const present = statusCounts.Present || 0;
    const late = statusCounts.Late || 0;
    const total = teamRows.length || 1;
    const rate = Math.round(((present + late) / total) * 100);
    const today = new Date();
    return [{ date: today.toLocaleDateString("en-US", { month: "short", day: "numeric" }), rate }];
  }, [statusCounts, teamRows]);

  return (
    <div className="flex flex-col h-full bg-[#F7F8FA] overflow-hidden text-left">
      {/* Floating Filter Popover */}
      {showAttFilter && (
        <div className="absolute right-8 top-4 w-72 bg-white border border-gray-200 rounded-xl shadow-xl z-40 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-700">Filters</p>
            <button onClick={() => setShowAttFilter(false)} className="cursor-pointer">
              <X size={13} className="text-gray-400" />
            </button>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
              Quarter
            </p>
            <div className="flex gap-1">
              {["All", "Q1", "Q2", "Q3", "Q4"].map((q) => (
                <button
                  key={q}
                  onClick={() => setAttFQuarter(q)}
                  className={cn(
                    "flex-1 py-1 text-[10px] font-medium border rounded-lg transition-colors cursor-pointer",
                    attFQuarter === q
                      ? "border-[#5C5CFF] bg-[#EEF2FF] text-[#5C5CFF]"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  )}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
              Month
            </p>
            <select
              value={attFMonth}
              onChange={(e) => setAttFMonth(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#5C5CFF]"
            >
              {[
                "All",
                "January",
                "February",
                "March",
                "April",
                "May",
                "June",
                "July",
                "August",
                "September",
                "October",
                "November",
                "December",
              ].map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
              Shift
            </p>
            <select
              value={attFShift}
              onChange={(e) => setAttFShift(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#5C5CFF]"
            >
              {[
                "All",
                "General (09:00–18:00)",
                "Morning (06:00–15:00)",
                "Evening (14:00–23:00)",
                "Night (22:00–07:00)",
              ].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="pt-2 border-t border-gray-100 flex gap-2">
            <button
              onClick={() => {
                setAttFMonth("All");
                setAttFQuarter("All");
                setAttFShift("All");
                setShowAttFilter(false);
              }}
              className="flex-1 px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 cursor-pointer"
            >
              Reset
            </button>
            <button
              onClick={() => setShowAttFilter(false)}
              className="flex-1 px-3 py-1.5 text-xs bg-[#5C5CFF] text-white rounded-lg hover:bg-[#4A4AE0] cursor-pointer"
            >
              Apply
            </button>
          </div>
        </div>
      )}

      {section === "My Team" && tab === "Exceptions" && (
        <div className="bg-white border-b border-gray-100 px-6 py-2.5 flex items-center justify-between flex-shrink-0">
          <div className="flex gap-1 bg-gray-50 border border-gray-200 rounded-lg p-0.5">
            {[
              "Missing Check-In",
              "Missing Check-Out",
              "Geo Fence Violations",
              "Attendance Corrections",
            ].map((t) => (
              <button
                key={t}
                onClick={() => setExTab(t)}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer",
                  exTab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                )}
              >
                {t}
                <span className={cn("px-1.5 py-0.5 rounded-full text-[9px] font-bold", exTab === t ? "bg-[#5C5CFF] text-white" : "bg-gray-200 text-gray-600")}>
                  {exceptionRows.length}
                </span>
              </button>
            ))}
          </div>
          <span className="text-[11px] text-gray-400 font-medium">
            Auto-detected exceptions
          </span>
        </div>
      )}

      {/* ── Content Area ── */}
      <div className="flex-1 overflow-auto bg-[#F7F8FA]">
        {section === "My Space" ? (
          <MySpacePage
            navigate={navigate}
            activeTab="Attendance"
            hideTabs={true}
            hideAttendanceHeader={true}
            attViewProp={attView}
            setAttViewProp={setAttView}
            attPeriodProp={attPeriod}
            setAttPeriodProp={setAttPeriod}
          />
        ) : (
          <div className="h-full">
            {tab === "Overview" && (
              <div>
                {/* Status Summary Cards */}
                <div className="bg-white border-b border-gray-200 px-6 py-3 grid grid-cols-5 gap-3">
                  {([
                    ["Present", statusCounts["Present"] || 0, "bg-green-50 text-green-600"],
                    ["Late", statusCounts["Late"] || 0, "bg-amber-50 text-amber-600"],
                    ["On Leave", statusCounts["On Leave"] || 0, "bg-purple-50 text-purple-600"],
                    ["WFH", statusCounts["WFH"] || 0, "bg-blue-50 text-blue-600"],
                    ["Absent", statusCounts["Absent"] || 0, "bg-red-50 text-red-600"],
                  ] as [string, number, string][]).map(([l, v, cls]) => (
                    <div key={l} className={cn("rounded-lg px-4 py-2.5 flex items-center justify-between", cls)}>
                      <span className="text-sm text-gray-700">{l}</span>
                      <span className="text-lg font-semibold">{v}</span>
                    </div>
                  ))}
                </div>

                {/* Search + Filters */}
                <div className="px-4 pt-3 pb-1 flex items-center gap-2">
                  <div className="relative">
                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="Search employee..." value={teamEmpSearch} onChange={(e) => setTeamEmpSearch(e.target.value)} className="pl-7 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white outline-none focus:ring-1 focus:ring-[#5C5CFF] w-48" />
                  </div>
                  <select value={teamDeptFilter} onChange={(e) => setTeamDeptFilter(e.target.value)} className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-white outline-none">
                    {depts.map(d => <option key={d}>{d}</option>)}
                  </select>
                  <select value={teamStatusFilter} onChange={(e) => setTeamStatusFilter(e.target.value)} className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-white outline-none">
                    {["All", "Present", "Late", "WFH", "On Leave", "Absent"].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>

                <div className="p-4">
                  <table className="w-full text-sm bg-white rounded-lg border border-gray-200">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        {["Employee", "Department", "Check In", "Check Out", "Hours", "Status"].map((h) => (
                          <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {loadingAtt ? (
                        <tr><td colSpan={6} className="px-5 py-8 text-center text-xs text-gray-400">Loading attendance data...</td></tr>
                      ) : filteredRows.length === 0 ? (
                        <tr><td colSpan={6} className="px-5 py-8 text-center text-xs text-gray-400">No team attendance records found for today.</td></tr>
                      ) : filteredRows.map((r) => (
                        <tr key={r.id} className="hover:bg-gray-50">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2.5">
                              <Avt initials={r.initials} color={r.color} size="sm" />
                              <div>
                                <div className="font-medium text-gray-800">{r.name}</div>
                                <div className="text-xs text-gray-400">{r.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-gray-600">{r.dept}</td>
                          <td className="px-5 py-3 font-mono text-xs text-gray-700">{r.checkIn}</td>
                          <td className="px-5 py-3 font-mono text-xs text-gray-700">{r.checkOut}</td>
                          <td className="px-5 py-3 font-mono text-xs text-gray-600">{r.hours}</td>
                          <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {tab === "Exceptions" && (
              <div className="flex flex-col h-full">
                <div className="flex-1 overflow-auto p-6">
                  <div className="bg-white rounded-lg border border-gray-200">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-800">{exTab}</h3>
                      <button onClick={() => attMsg("Bulk correction applied")} className="text-xs text-[#5C5CFF] hover:underline cursor-pointer">
                        Batch Action ({exceptionRows.length} pending)
                      </button>
                    </div>
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>{["Employee", "Details", "Date", "Actions"].map((h) => <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {exceptionRows.length === 0 ? (
                          <tr><td colSpan={4} className="px-5 py-8 text-center text-xs text-gray-400">No {exTab.toLowerCase()} exceptions for your team today.</td></tr>
                        ) : exceptionRows.map((emp: any) => (
                          <tr key={emp.id} className="hover:bg-gray-50">
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2.5">
                                <Avt initials={emp.initials} color={emp.color} size="sm" />
                                <div>
                                  <div className="font-medium text-gray-800">{emp.name}</div>
                                  <div className="text-xs text-gray-400">{emp.dept || emp.department}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3 text-xs text-red-600 font-medium">
                              {exTab === "Geo Fence Violations" ? "Checked in outside geofence" : exTab}
                            </td>
                            <td className="px-5 py-3 text-xs text-gray-500">
                              {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex gap-1.5">
                                <button onClick={() => attMsg("Request approved")} className="px-2.5 py-1.5 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold rounded-lg hover:bg-green-100 cursor-pointer">Approve</button>
                                <button onClick={() => attMsg("Request rejected")} className="px-2.5 py-1.5 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-100 cursor-pointer">Reject</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {tab === "Analytics" && (
              <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg border border-gray-200 p-5">
                    <h4 className="text-sm font-semibold text-gray-800 mb-3">Attendance Rate Trend</h4>
                    {attTrendData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={200}>
                        <AreaChart id="att-rate" data={attTrendData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                          <Area type="monotone" dataKey="rate" stroke="#5C5CFF" fill="#5C5CFF" fillOpacity={0.1} />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-48 text-xs text-gray-400">No data yet</div>
                    )}
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-5">
                    <h4 className="text-sm font-semibold text-gray-800 mb-3">WFH Trends by Department</h4>
                    {wfhByDept.length === 0 ? (
                      <div className="flex items-center justify-center h-48 text-xs text-gray-400">No data yet</div>
                    ) : (
                      <div className="space-y-3 mt-2">
                        {wfhByDept.map(({ dept, wfh, total }) => (
                          <div key={dept} className="flex items-center gap-3">
                            <div className="w-24 text-xs text-gray-600 text-right truncate">{dept}</div>
                            <div className="flex-1 bg-gray-100 rounded-full h-2">
                              <div className="h-2 bg-blue-400 rounded-full" style={{ width: `${total > 0 ? Math.round((wfh / total) * 100) : 0}%` }} />
                            </div>
                            <div className="w-20 text-xs text-gray-500 text-left">{wfh}/{total} ({total > 0 ? Math.round((wfh / total) * 100) : 0}%)</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {attToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg">
          <CheckCircle size={15} className="text-green-400 flex-shrink-0" />
          {attToast}
        </div>
      )}
    </div>
  );
}
