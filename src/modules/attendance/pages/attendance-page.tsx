import React, { useState, useEffect } from "react";
import { X, CheckCircle } from "lucide-react";
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
import { cn } from "@/shared/utils";
import { Avt, StatusBadge, Btn } from "@/shared/components";
import { MySpacePage } from "@/modules/my-space";
import { EMPLOYEES } from "@/modules/organization/data/employees";
import { EMP_COLORS } from "@/shared/constants/colors";
import {
  ATTENDANCE_RECORDS,
  ATT_TREND,
} from "@/modules/attendance/data/attendance-records";

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
  const [tab, setTab] = useState("Overview"); // For team view
  const [attView, setAttView] = useState<"summary" | "timeline" | "calendar" | "issues">(
    "summary"
  ); // For personal view
  const [attPeriod, setAttPeriod] = useState<"Weekly" | "Monthly" | "Yearly">("Monthly"); // For personal view
  const [checkedIn, setCheckedIn] = useState(true);

  // Sync activeTab with local tab states
  useEffect(() => {
    if (section === "My Space") {
      if (activeTab === "Overview") setAttView("summary");
      else if (activeTab === "Exceptions") setAttView("issues");
      else if (activeTab === "Analytics") setAttView("timeline");
    } else {
      setTab(activeTab);
    }
  }, [activeTab, section]);

  // Filters for personal summary
  const [showAttFilter, setShowAttFilter] = useState(false);

  // Filters for team view
  const [teamDeptFilter, setTeamDeptFilter] = useState("All");
  const [teamStatusFilter, setTeamStatusFilter] = useState("All");
  const [teamEmpSearch, setTeamEmpSearch] = useState("");
  const [attFMonth, setAttFMonth] = useState("All");
  const [attFQuarter, setAttFQuarter] = useState("All");
  const [attFShift, setAttFShift] = useState("All");

  const [exTab, setExTab] = useState("Missing Check-In");
  const [attToast, setAttToast] = useState<string | null>(null);
  const attMsg = (m: string) => {
    setAttToast(m);
    setTimeout(() => setAttToast(null), 2500);
  };

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

      {/* Exception sub-bar inside content area when view is exceptions */}
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
                <span
                  className={cn(
                    "px-1.5 py-0.5 rounded-full text-[9px] font-bold",
                    exTab === t
                      ? "bg-[#5C5CFF] text-white"
                      : "bg-gray-200 text-gray-600"
                  )}
                >
                  {
                    (
                      {
                        "Missing Check-In": "8",
                        "Missing Check-Out": "14",
                        "Geo Fence Violations": "3",
                        "Attendance Corrections": "6",
                      } as Record<string, string>
                    )[t]
                  }
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
                <div className="bg-white border-b border-gray-200 px-6 py-3 grid grid-cols-5 gap-3">
                  {[
                    ["Present", "734", "bg-green-50 text-green-600"],
                    ["Late", "32", "bg-amber-50 text-amber-600"],
                    ["On Leave", "43", "bg-purple-50 text-purple-600"],
                    ["WFH", "21", "bg-blue-50 text-blue-600"],
                    ["Absent", "17", "bg-red-50 text-red-600"],
                  ].map(([l, v, cls]) => (
                    <div
                      key={l as string}
                      className={cn(
                        "rounded-lg px-4 py-2.5 flex items-center justify-between",
                        cls
                      )}
                    >
                      <span className="text-sm text-gray-700">{l}</span>
                      <span className="text-lg font-semibold">{v}</span>
                    </div>
                  ))}
                </div>
                <div className="p-4">
                  <table className="w-full text-sm bg-white rounded-lg border border-gray-200">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        {[
                          "Employee",
                          "Department",
                          "Check In",
                          "Check Out",
                          "Hours",
                          "Status",
                        ].map((h) => (
                          <th
                            key={h}
                            className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {ATTENDANCE_RECORDS.filter(
                        (r) =>
                          (teamDeptFilter === "All Departments" ||
                            teamDeptFilter === "All" ||
                            r.dept === teamDeptFilter) &&
                          (teamStatusFilter === "All" || r.status === teamStatusFilter) &&
                          (!teamEmpSearch ||
                            r.name.toLowerCase().includes(teamEmpSearch.toLowerCase()))
                      ).map((r) => (
                        <tr key={r.id} className="hover:bg-gray-50">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2.5">
                              <Avt
                                initials={r.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                                color={
                                  EMP_COLORS[
                                    EMPLOYEES.findIndex((e) => e.id === r.id) %
                                      EMP_COLORS.length
                                  ] || "#5C5CFF"
                                }
                                size="sm"
                              />
                              <div>
                                <div className="font-medium text-gray-800">
                                  {r.name}
                                </div>
                                <div className="text-xs text-gray-400">{r.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-gray-600">{r.dept}</td>
                          <td className="px-5 py-3 font-mono text-xs text-gray-700">
                            {r.checkIn}
                          </td>
                          <td className="px-5 py-3 font-mono text-xs text-gray-700">
                            {r.checkOut}
                          </td>
                          <td className="px-5 py-3 font-mono text-xs text-gray-600">
                            {r.hours > 0 ? `${r.hours}h` : "–"}
                          </td>
                          <td className="px-5 py-3">
                            <StatusBadge status={r.status} />
                          </td>
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
                      <h3 className="text-sm font-semibold text-gray-800">
                        {exTab}
                      </h3>
                      <button
                        onClick={() => attMsg("Bulk correction applied")}
                        className="text-xs text-[#5C5CFF] hover:underline cursor-pointer"
                      >
                        Batch Action (
                        {
                          (
                            {
                              "Missing Check-In": "8",
                              "Missing Check-Out": "14",
                              "Geo Fence Violations": "3",
                              "Attendance Corrections": "6",
                            } as Record<string, string>
                          )[exTab]
                        }{" "}
                        pending)
                      </button>
                    </div>
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          {["Employee", "Details", "Date", "Actions"].map((h) => (
                            <th
                              key={h}
                              className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {EMPLOYEES.slice(0, 5).map((emp) => (
                          <tr key={emp.id} className="hover:bg-gray-50">
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2.5">
                                <Avt
                                  initials={emp.initials}
                                  color={emp.color}
                                  size="sm"
                                />
                                <div>
                                  <div className="font-medium text-gray-800">
                                    {emp.name}
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    {emp.dept}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3 text-xs text-red-600 font-medium">
                              {exTab === "Geo Fence Violations"
                                ? "Checked in 1.2km outside geofence"
                                : exTab}
                            </td>
                            <td className="px-5 py-3 text-xs text-gray-500">
                              Jul 1, 2024
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => attMsg("Request approved")}
                                  className="px-2.5 py-1.5 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold rounded-lg hover:bg-green-100 cursor-pointer"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => attMsg("Request rejected")}
                                  className="px-2.5 py-1.5 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-100 cursor-pointer"
                                >
                                  Reject
                                </button>
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
                    <h4 className="text-sm font-semibold text-gray-800 mb-3">
                      Attendance Rate Trend
                    </h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart id="att-rate" data={ATT_TREND}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                        <XAxis
                          dataKey="date"
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
                        <Area
                          type="monotone"
                          dataKey="rate"
                          stroke="#5C5CFF"
                          fill="#5C5CFF"
                          fillOpacity={0.1}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-5">
                    <h4 className="text-sm font-semibold text-gray-800 mb-3">
                      WFH Trends
                    </h4>
                    <div className="space-y-3">
                      {[
                        ["Engineering", 42, 234],
                        ["Product", 18, 56],
                        ["Design", 28, 64],
                        ["Marketing", 15, 98],
                        ["HR", 12, 48],
                      ].map(([dept, wfh, total]) => (
                        <div key={dept as string} className="flex items-center gap-3">
                          <div className="w-20 text-xs text-gray-600 text-right">
                            {dept}
                          </div>
                          <div className="flex-1 bg-gray-100 rounded-full h-2">
                            <div
                              className="h-2 bg-blue-400 rounded-full"
                              style={{
                                width: `${
                                  ((wfh as number) / (total as number)) * 100
                                }%`,
                              }}
                            />
                          </div>
                          <div className="w-16 text-xs text-gray-500 text-left">
                            {wfh}/{total} (
                            {Math.round(((wfh as number) / (total as number)) * 100)}
                            %)
                          </div>
                        </div>
                      ))}
                    </div>
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
