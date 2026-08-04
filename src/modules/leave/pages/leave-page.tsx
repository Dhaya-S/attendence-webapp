import React, { useState, useEffect } from "react";
import { ChevronDown, Check, X, CalendarDays } from "lucide-react";
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
import { cn, fmtDate } from "@/shared/utils";
import {
  Avt,
  StatusBadge,
  Btn,
  SelectField,
  InputField,
  Modal,
} from "@/shared/components";
import { EMPLOYEES } from "@/modules/organization/data/employees";
import { EMP_COLORS } from "@/shared/constants/colors";
import { MySpacePage } from "@/modules/my-space";
import {
  LEAVE_REQUESTS,
  LEAVE_MONTHLY,
} from "@/modules/leave/data/leave-requests";

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
  const [tab, setTab] = useState("Overview"); // For team view
  const [leaveView, setLeaveView] = useState<"Balance" | "Requests" | "Calendar" | "Analytics" | "Status">(
    "Balance"
  ); // For personal view
  const [reqs, setReqs] = useState(LEAVE_REQUESTS);
  const [showApply, setShowApply] = useState(false);
  const approve = (id: string) =>
    setReqs((r) => r.map((x) => (x.id === id ? { ...x, status: "Approved" } : x)));
  const reject = (id: string) =>
    setReqs((r) => r.map((x) => (x.id === id ? { ...x, status: "Rejected" } : x)));

  // Sync activeTab with local tab states
  useEffect(() => {
    if (section === "My Space") {
      if (activeTab === "Overview") setLeaveView("Balance");
      else if (activeTab === "Requests") setLeaveView("Requests");
      else if (activeTab === "Analytics") setLeaveView("Analytics");
    } else {
      setTab(activeTab);
    }
  }, [activeTab, section]);

  const [attToast, setAttToast] = useState<string | null>(null);
  const attMsg = (m: string) => {
    setAttToast(m);
    setTimeout(() => setAttToast(null), 2500);
  };

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
                  <div className="grid grid-cols-3 gap-4">
                    {EMPLOYEES.slice(0, 9).map((emp) => (
                      <div
                        key={emp.id}
                        className="bg-white rounded-lg border border-gray-200 p-4"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <Avt initials={emp.initials} color={emp.color} size="sm" />
                          <div>
                            <p className="text-sm font-medium text-gray-805">
                              {emp.name}
                            </p>
                            <p className="text-xs text-gray-500">{emp.dept}</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {[
                            ["Annual", 12, 18],
                            ["Sick", 8, 10],
                            ["Casual", 5, 6],
                          ].map(([t, u, total]) => (
                            <div key={t as string}>
                              <div className="flex justify-between text-xs text-gray-500 mb-0.5">
                                <span>{t}</span>
                                <span>
                                  {(total as number) - (u as number)} left / {total}
                                </span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-1">
                                <div
                                  className="h-1 bg-[#5C5CFF] rounded-full"
                                  style={{
                                    width: `${((u as number) / (total as number)) * 100}%`,
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tab === "Requests" && (
                <div className="p-6">
                  <div className="bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                      <h3 className="text-sm font-semibold text-gray-800">
                        Leave Requests
                      </h3>
                      <div className="flex gap-2">
                        <div className="relative">
                          <select className="pl-3 pr-7 py-1.5 text-xs border border-gray-300 rounded-md bg-white appearance-none focus:outline-none">
                            <option>All Status</option>
                            <option>Pending</option>
                            <option>Approved</option>
                            <option>Rejected</option>
                          </select>
                          <ChevronDown
                            size={11}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                          />
                        </div>
                      </div>
                    </div>
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          {[
                            "Employee",
                            "Type",
                            "From",
                            "To",
                            "Days",
                            "Reason",
                            "Status",
                            "Actions",
                          ].map((h) => (
                            <th
                              key={h}
                              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {reqs.map((r) => (
                          <tr key={r.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Avt
                                  initials={r.employee
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                  color={
                                    EMP_COLORS[
                                      parseInt(r.id.slice(-1)) % EMP_COLORS.length
                                    ]
                                  }
                                  size="sm"
                                />
                                <span className="font-medium text-gray-808">
                                  {r.employee}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-606">{r.type}</td>
                            <td className="px-4 py-3 text-gray-606 text-xs">
                              {fmtDate(r.from)}
                            </td>
                            <td className="px-4 py-3 text-gray-606 text-xs">
                              {fmtDate(r.to)}
                            </td>
                            <td className="px-4 py-3 font-medium text-gray-808">
                              {r.days}
                            </td>
                            <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">
                              {r.reason}
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge status={r.status} />
                            </td>
                            <td className="px-4 py-3">
                              {r.status === "Pending" && (
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => approve(r.id)}
                                    className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs hover:bg-green-100 flex items-center gap-1 cursor-pointer"
                                  >
                                    <Check size={10} />
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => reject(r.id)}
                                    className="px-2 py-1 bg-red-50 text-red-600 rounded text-xs hover:bg-red-100 flex items-center gap-1 cursor-pointer"
                                  >
                                    <X size={10} />
                                    Reject
                                  </button>
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

              {tab === "Analytics" && (
                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-2 gap-5">
                    <div className="bg-white rounded-lg border border-gray-200 p-5">
                      <h4 className="text-sm font-semibold text-gray-800 mb-4">
                        Leave Utilization by Month
                      </h4>
                      <ResponsiveContainer width="100%" height={200}>
                        <RBarChart id="leave-util" data={LEAVE_MONTHLY}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                          <XAxis
                            dataKey="month"
                            tick={{ fontSize: 11, fill: "#9CA3AF" }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{ fontSize: 11, fill: "#9CA3AF" }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                          <Bar
                            key="annual"
                            dataKey="annual"
                            name="Annual"
                            fill="#5C5CFF"
                            radius={[3, 3, 0, 0]}
                          />
                          <Bar
                            key="sick"
                            dataKey="sick"
                            name="Sick"
                            fill="#F59E0B"
                            radius={[3, 3, 0, 0]}
                          />
                          <Bar
                            key="casual"
                            dataKey="casual"
                            name="Casual"
                            fill="#22C55E"
                            radius={[3, 3, 0, 0]}
                          />
                          <Legend />
                        </RBarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="bg-white rounded-lg border border-gray-200 p-5">
                      <h4 className="text-sm font-semibold text-gray-800 mb-4">
                        Leave by Department
                      </h4>
                      <div className="space-y-3 mt-2">
                        {[
                          ["Engineering", 42],
                          ["Sales", 38],
                          ["Marketing", 31],
                          ["HR", 28],
                          ["Finance", 22],
                          ["Design", 19],
                          ["Legal", 12],
                        ].map(([dept, days]) => (
                          <div key={dept as string} className="flex items-center gap-3">
                            <div className="w-20 text-xs text-gray-600 text-right">
                              {dept}
                            </div>
                            <div className="flex-1 bg-gray-100 rounded-full h-2">
                              <div
                                className="h-2 bg-[#5C5CFF] rounded-full"
                                style={{ width: `${((days as number) / 50) * 100}%` }}
                              />
                            </div>
                            <div className="w-12 text-xs font-medium text-gray-708">
                              {days} days
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {showApply && (
        <Modal title="Apply Leave" onClose={() => setShowApply(false)}>
          <div className="space-y-4">
            <SelectField
              label="Leave Type"
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
              <InputField label="From Date" type="date" required />
              <InputField label="To Date" type="date" required />
            </div>
            <InputField label="Reason" placeholder="Brief reason for leave…" required />
            <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
              <span className="font-semibold">Annual Leave Balance:</span> 6 days
              remaining out of 18
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Btn variant="outline" onClick={() => setShowApply(false)}>
                Cancel
              </Btn>
              <Btn onClick={() => setShowApply(false)}>
                <Check size={13} />
                Submit Request
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
