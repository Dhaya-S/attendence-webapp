import React, { useState, useEffect, useMemo } from "react";
import { ChevronDown, Check, X, CalendarDays, CheckCircle } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart as RBarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  Legend,
} from "recharts";
import { AppPage } from "@/shared/types";
import { cn, fmtDate, db } from "@/shared/utils";
import {
  Avt,
  StatusBadge,
  Btn,
  SelectField,
  InputField,
  Modal,
} from "@/shared/components";
import { EMP_COLORS } from "@/shared/constants/colors";
import { MySpacePage } from "@/modules/my-space";
import { useAuth } from "@/shared/context/AuthContext";
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  query,
  orderBy,
} from "firebase/firestore";

export function LeavePage({
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
  const { companyId, email, user, displayName, role } = useAuth();
  const [tab, setTab] = useState("Overview");
  const [leaveView, setLeaveView] = useState<"Balance" | "Requests" | "Calendar" | "Analytics" | "Status">("Balance");

  // Firestore realtime state
  const [dbUsers, setDbUsers] = useState<any[]>([]);
  const [reqs, setReqs] = useState<any[]>([]);
  const [showApply, setShowApply] = useState(false);

  // Apply leave form state
  const [applyType, setApplyType] = useState("Annual Leave");
  const [applyFrom, setApplyFrom] = useState("");
  const [applyTo, setApplyTo] = useState("");
  const [applyReason, setApplyReason] = useState("");
  const [applySubmitting, setApplySubmitting] = useState(false);

  const normalizedEmail = String(email || user?.email || "").toLowerCase();

  // Load org users (for team overview)
  useEffect(() => {
    if (!companyId || companyId === "default") return;
    const ref = collection(db, "organizations", companyId, "users");
    return onSnapshot(ref, (snap) => {
      setDbUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.warn("LeavePage: users error:", err));
  }, [companyId]);

  // Load leave requests realtime
  useEffect(() => {
    if (!companyId || companyId === "default") return;
    const ref = collection(db, "organizations", companyId, "leave_requests");
    const q = query(ref, orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      setReqs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.warn("LeavePage: leave_requests error:", err);
    });
  }, [companyId]);

  const approve = async (id: string) => {
    if (!companyId) return;
    try {
      await updateDoc(doc(db, "organizations", companyId, "leave_requests", id), { status: "Approved", approvedAt: new Date().toISOString(), approvedBy: normalizedEmail });
    } catch (err) { console.warn("approve error:", err); }
  };

  const reject = async (id: string) => {
    if (!companyId) return;
    try {
      await updateDoc(doc(db, "organizations", companyId, "leave_requests", id), { status: "Rejected", rejectedAt: new Date().toISOString(), rejectedBy: normalizedEmail });
    } catch (err) { console.warn("reject error:", err); }
  };

  const submitLeave = async () => {
    if (!applyFrom || !applyTo || !applyReason.trim()) {
      attMsg("Please fill all required fields.");
      return;
    }
    if (!companyId) { attMsg("Company not configured."); return; }
    setApplySubmitting(true);
    try {
      const from = new Date(applyFrom);
      const to = new Date(applyTo);
      const days = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / 86400000) + 1);
      const id = `lr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const currentUserProfile = dbUsers.find(e => String(e.email || e.workEmail || "").toLowerCase() === normalizedEmail);
      const empName = currentUserProfile?.name || displayName || normalizedEmail;
      const empRole = String(role || currentUserProfile?.role || "employee").toLowerCase();

      // Determine approver: manager > hr_admin > super_admin
      let approverId = "";
      if (currentUserProfile?.managerEmail) {
        approverId = String(currentUserProfile.managerEmail).toLowerCase();
      } else if (currentUserProfile?.manager) {
        const mgr = dbUsers.find(e => String(e.name || "").toLowerCase() === String(currentUserProfile.manager).toLowerCase());
        approverId = String(mgr?.email || mgr?.workEmail || "").toLowerCase();
      }
      if (!approverId) {
        const hrAdmin = dbUsers.find(e => String(e.role || "").toLowerCase() === "hr_admin");
        approverId = String(hrAdmin?.email || hrAdmin?.workEmail || "").toLowerCase();
      }
      if (!approverId) {
        const superAdmin = dbUsers.find(e => ["super_admin", "admin"].includes(String(e.role || "").toLowerCase()));
        approverId = String(superAdmin?.email || superAdmin?.workEmail || "").toLowerCase();
      }

      await setDoc(doc(db, "organizations", companyId, "leave_requests", id), {
        id,
        employee: empName,
        employeeEmail: normalizedEmail,
        type: applyType,
        from: applyFrom,
        to: applyTo,
        days,
        reason: applyReason.trim(),
        status: "Pending",
        approverId,
        createdAt: new Date().toISOString(),
        dept: currentUserProfile?.dept || currentUserProfile?.department || "",
      });
      attMsg("Leave request submitted successfully!");
      setShowApply(false);
      setApplyReason("");
      setApplyFrom("");
      setApplyTo("");
    } catch (err) {
      console.error("submitLeave error:", err);
      attMsg("Failed to submit leave request.");
    } finally {
      setApplySubmitting(false);
    }
  };

  // Scope requests visible to current user based on role
  const visibleReqs = useMemo(() => {
    const currentUserProfile = dbUsers.find(e => String(e.email || e.workEmail || "").toLowerCase() === normalizedEmail);
    const userRole = String(role || currentUserProfile?.role || "employee").toLowerCase();
    if (userRole === "super_admin" || userRole === "admin") return reqs;
    if (userRole === "hr_admin") return reqs.filter(r => String(r.approverId || "").toLowerCase() === normalizedEmail || String(r.employeeEmail || "").toLowerCase() === normalizedEmail);
    if (userRole === "manager") return reqs.filter(r => String(r.approverId || "").toLowerCase() === normalizedEmail || String(r.employeeEmail || "").toLowerCase() === normalizedEmail);
    return reqs.filter(r => String(r.employeeEmail || "").toLowerCase() === normalizedEmail);
  }, [reqs, dbUsers, role, normalizedEmail]);

  const [attToast, setAttToast] = useState<string | null>(null);
  const attMsg = (m: string) => {
    setAttToast(m);
    setTimeout(() => setAttToast(null), 2500);
  };

  // Leave balance from Firestore user profile
  const currentUserProfile = dbUsers.find(e => String(e.email || e.workEmail || "").toLowerCase() === normalizedEmail);
  const annualBalance = currentUserProfile?.leaveBalance?.annual ?? 0;
  const annualTotal = currentUserProfile?.leaveBalance?.annualTotal ?? 18;

  useEffect(() => {
    if (section === "My Space") {
      if (activeTab === "Overview") setLeaveView("Balance");
      else if (activeTab === "Requests") setLeaveView("Requests");
      else if (activeTab === "Analytics") setLeaveView("Analytics");
    } else {
      setTab(activeTab);
    }
  }, [activeTab, section]);

  return (
    <div className="flex flex-col h-full bg-[#F7F8FA] overflow-hidden text-left">
      {/* ── Content Area ── */}
      <div className="flex-1 overflow-auto bg-[#F7F8FA]">
        {section === "My Space" ? (
          <MySpacePage
            navigate={navigate}
            activeTab="Leave"
            hideTabs={true}
            hideLeaveHeader={true}
            leaveViewProp={leaveView}
            setLeaveViewProp={setLeaveView}
          />
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden h-full">
            <div className="flex-1 overflow-auto">
              {tab === "Overview" && (
                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-4 gap-4">
                    {[
                      ["Pending Approval", "3", "text-amber-600", "bg-amber-50"],
                      ["Approved Today", "2", "text-green-600", "bg-green-50"],
                      ["On Leave Now", "43", "text-blue-600", "bg-blue-50"],
                      ["Upcoming (7 days)", "18", "text-purple-600", "bg-purple-50"],
                    ].map(([l, v, tc, bc]) => (
                      <div
                        key={l as string}
                        className={cn(
                          "flex items-center justify-between px-5 py-3.5 rounded-lg",
                          bc
                        )}
                      >
                        <span className="text-sm text-gray-700">{l}</span>
                        <span className={cn("text-xl font-semibold", tc)}>{v}</span>
                      </div>
                    ))}
                  </div>
                  {dbUsers.length === 0 ? (
                    <div className="text-center py-8 text-xs text-gray-400">Loading team data...</div>
                  ) : (
                    <div className="grid grid-cols-3 gap-4">
                      {dbUsers.slice(0, 9).map((emp, idx) => {
                        const annual = emp.leaveBalance?.annual ?? 12;
                        const sick = emp.leaveBalance?.sick ?? 8;
                        const casual = emp.leaveBalance?.casual ?? 5;
                        const annualTotalVal = emp.leaveBalance?.annualTotal ?? 18;
                        const sickTotal = emp.leaveBalance?.sickTotal ?? 10;
                        const casualTotal = emp.leaveBalance?.casualTotal ?? 6;
                        const initials = (emp.name || "??").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
                        const color = emp.color || EMP_COLORS[idx % EMP_COLORS.length] || "#5C5CFF";
                        return (
                          <div key={emp.id} className="bg-white rounded-lg border border-gray-200 p-4">
                            <div className="flex items-center gap-3 mb-3">
                              <Avt initials={initials} color={color} size="sm" />
                              <div>
                                <p className="text-sm font-medium text-gray-800">{emp.name}</p>
                                <p className="text-xs text-gray-500">{emp.dept || emp.department}</p>
                              </div>
                            </div>
                            <div className="space-y-2">
                              {([["Annual", annual, annualTotalVal], ["Sick", sick, sickTotal], ["Casual", casual, casualTotal]] as [string, number, number][]).map(([t, used, tot]) => (
                                <div key={t}>
                                  <div className="flex justify-between text-xs text-gray-500 mb-0.5">
                                    <span>{t}</span>
                                    <span>{tot - used} left / {tot}</span>
                                  </div>
                                  <div className="w-full bg-gray-100 rounded-full h-1">
                                    <div className="h-1 bg-[#5C5CFF] rounded-full" style={{ width: `${tot > 0 ? (used / tot) * 100 : 0}%` }} />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {tab === "Requests" && (
                <div className="p-6">
                  <div className="bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                      <h3 className="text-sm font-semibold text-gray-800">Leave Requests</h3>
                      <div className="flex gap-2">
                        <div className="relative">
                          <select className="pl-3 pr-7 py-1.5 text-xs border border-gray-300 rounded-md bg-white appearance-none focus:outline-none">
                            <option>All Status</option>
                            <option>Pending</option>
                            <option>Approved</option>
                            <option>Rejected</option>
                          </select>
                          <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          {["Employee","Type","From","To","Days","Reason","Status","Actions"].map((h) => (
                            <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {visibleReqs.length === 0 ? (
                          <tr><td colSpan={8} className="px-4 py-8 text-center text-xs text-gray-400">No leave requests found.</td></tr>
                        ) : visibleReqs.map((r) => (
                          <tr key={r.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Avt
                                  initials={(r.employee || "?").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                                  color={EMP_COLORS[parseInt(String(r.id).slice(-1) || "0") % EMP_COLORS.length] || "#5C5CFF"}
                                  size="sm"
                                />
                                <span className="font-medium text-gray-800">{r.employee}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-600">{r.type}</td>
                            <td className="px-4 py-3 text-gray-600 text-xs">{fmtDate ? fmtDate(r.from) : r.from}</td>
                            <td className="px-4 py-3 text-gray-600 text-xs">{fmtDate ? fmtDate(r.to) : r.to}</td>
                            <td className="px-4 py-3 font-medium text-gray-800">{r.days}</td>
                            <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">{r.reason}</td>
                            <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                            <td className="px-4 py-3">
                              {r.status === "Pending" && (
                                <div className="flex gap-1">
                                  <button onClick={() => approve(r.id)} className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs hover:bg-green-100 flex items-center gap-1 cursor-pointer"><Check size={10} />Approve</button>
                                  <button onClick={() => reject(r.id)} className="px-2 py-1 bg-red-50 text-red-600 rounded text-xs hover:bg-red-100 flex items-center gap-1 cursor-pointer"><X size={10} />Reject</button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {tab === "Analytics" && (() => {
                // Compute monthly leave data from reqs
                const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
                const monthlyData = monthNames.map((month, idx) => {
                  const monthReqs = reqs.filter(r => {
                    if (!r.from) return false;
                    const m = new Date(r.from).getMonth();
                    return m === idx && r.status === "Approved";
                  });
                  return {
                    month,
                    annual: monthReqs.filter(r => (r.type || "").toLowerCase().includes("annual")).length,
                    sick: monthReqs.filter(r => (r.type || "").toLowerCase().includes("sick")).length,
                    casual: monthReqs.filter(r => (r.type || "").toLowerCase().includes("casual")).length,
                  };
                }).filter(m => m.annual + m.sick + m.casual > 0);

                // Dept leave days
                const deptMap: Record<string, number> = {};
                reqs.forEach(r => {
                  if (r.status !== "Approved" || !r.dept) return;
                  deptMap[r.dept] = (deptMap[r.dept] || 0) + (r.days || 1);
                });
                const deptData = Object.entries(deptMap).sort((a, b) => b[1] - a[1]);
                const maxDays = deptData[0]?.[1] || 1;

                return (
                  <div className="p-6 space-y-5">
                    <div className="grid grid-cols-2 gap-5">
                      <div className="bg-white rounded-lg border border-gray-200 p-5">
                        <h4 className="text-sm font-semibold text-gray-800 mb-4">Leave Utilization by Month</h4>
                        {monthlyData.length === 0 ? (
                          <div className="flex items-center justify-center h-48 text-xs text-gray-400">No approved leave data yet</div>
                        ) : (
                          <ResponsiveContainer width="100%" height={200}>
                            <RBarChart id="leave-util" data={monthlyData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                              <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                              <Bar key="annual" dataKey="annual" name="Annual" fill="#5C5CFF" radius={[3, 3, 0, 0]} />
                              <Bar key="sick" dataKey="sick" name="Sick" fill="#F59E0B" radius={[3, 3, 0, 0]} />
                              <Bar key="casual" dataKey="casual" name="Casual" fill="#22C55E" radius={[3, 3, 0, 0]} />
                              <Legend />
                            </RBarChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                      <div className="bg-white rounded-lg border border-gray-200 p-5">
                        <h4 className="text-sm font-semibold text-gray-800 mb-4">Leave by Department</h4>
                        {deptData.length === 0 ? (
                          <div className="flex items-center justify-center h-48 text-xs text-gray-400">No department leave data yet</div>
                        ) : (
                          <div className="space-y-3 mt-2">
                            {deptData.map(([dept, days]) => (
                              <div key={dept} className="flex items-center gap-3">
                                <div className="w-20 text-xs text-gray-600 text-right truncate">{dept}</div>
                                <div className="flex-1 bg-gray-100 rounded-full h-2">
                                  <div className="h-2 bg-[#5C5CFF] rounded-full" style={{ width: `${(days / maxDays) * 100}%` }} />
                                </div>
                                <div className="w-12 text-xs font-medium text-gray-700">{days} days</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>
      {showApply && (
        <Modal title="Apply Leave" onClose={() => setShowApply(false)}>
          <div className="space-y-4">
            <SelectField
              label="Leave Type"
              value={applyType}
              onChange={(v: string) => setApplyType(v)}
              options={[
                "Annual Leave",
                "Sick Leave",
                "Casual Leave",
                "Maternity Leave",
                "Paternity Leave",
                "Unpaid Leave",
              ]}
            />
            <div className="grid grid-cols-2 gap-4">
              <InputField label="From Date" type="date" value={applyFrom} onChange={(e: any) => setApplyFrom(e.target.value)} required />
              <InputField label="To Date" type="date" value={applyTo} onChange={(e: any) => setApplyTo(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Reason <span className="text-red-500">*</span></label>
              <textarea
                value={applyReason}
                onChange={(e) => setApplyReason(e.target.value)}
                placeholder="Brief reason for leave…"
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-[#5C5CFF] resize-none"
              />
            </div>
            <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
              <span className="font-semibold">Annual Leave Balance:</span>{" "}
              {annualBalance} days remaining out of {annualTotal}
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Btn variant="outline" onClick={() => setShowApply(false)}>Cancel</Btn>
              <Btn onClick={submitLeave} disabled={applySubmitting}>
                <Check size={13} />
                {applySubmitting ? "Submitting..." : "Submit Request"}
              </Btn>
            </div>
          </div>
        </Modal>
      )}
      {attToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg">
          <CheckCircle size={15} className="text-green-400 flex-shrink-0" />
          {attToast}
        </div>
      )}
    </div>
  );
}
