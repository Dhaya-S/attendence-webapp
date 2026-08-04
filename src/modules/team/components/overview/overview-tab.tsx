import React from "react";
import { EMPLOYEES } from "@/modules/organization/data/employees";
import { DEPT_INFO } from "@/shared/constants/departments";
import { getAttendanceDetails } from "@/modules/attendance";
import { Avt } from "@/shared/components";
import { cn } from "@/shared/utils";
import { TEAM_CELEBRATIONS, TEAM_TASKS } from "../../data/team-data";

interface OverviewTabProps {
  deptFilter: string;
  teamReqs: any[];
  setTeamTab: (tab: string) => void;
  setAttendanceSection: (sec: "My Space" | "My Team") => void;
  setLeaveSection: (sec: "My Space" | "My Team") => void;
  navigate: (page: string, emp?: any, tabOrSection?: string) => void;
}

export function OverviewTab({
  deptFilter,
  teamReqs,
  setTeamTab,
  setAttendanceSection,
  setLeaveSection,
  navigate,
}: OverviewTabProps) {
  const teamMembers =
    deptFilter === "All"
      ? EMPLOYEES
      : EMPLOYEES.filter((e) => e.dept === deptFilter);

  const managerCount = teamMembers.filter((e) =>
    ["Manager", "VP", "Head", "Lead", "Director", "CEO", "CFO", "Admin"].some(
      (word) => e.designation.includes(word)
    )
  ).length;
  const employeeCount = teamMembers.length - managerCount;

  // Stats
  let presentCount = 0;
  let leaveCount = 0;
  let wfhCount = 0;
  let absentCount = 0;

  teamMembers.forEach((e) => {
    const att = getAttendanceDetails(e);
    if (att.status === "Checked In" || att.status === "Late") {
      presentCount++;
    } else if (att.status === "On Leave") {
      leaveCount++;
    } else if (att.status === "WFH") {
      wfhCount++;
    } else {
      absentCount++;
    }
  });

  // Dept details lookup
  const deptName = deptFilter === "All" ? "Acme Corp" : deptFilter;
  const deptHead = DEPT_INFO[deptFilter]?.head || "Alex Admin";
  const deptLoc = DEPT_INFO[deptFilter]?.location || "New York HQ";
  const deptDesc = DEPT_INFO[deptFilter]?.details || "Global corporate office";

  // Manager attention stats
  const pendingLeaves = teamReqs.filter((r) => {
    const emp = EMPLOYEES.find((e) => e.name === r.employee);
    const deptMatch =
      deptFilter === "All" || (emp && emp.dept === deptFilter);
    return deptMatch && r.status === "Pending";
  }).length;

  const attendanceExceptions = teamMembers.filter((e) => {
    const att = getAttendanceDetails(e);
    return att.status === "Late";
  }).length;

  const overdueTasksCount = TEAM_TASKS.filter((t) => {
    const isDeptMatch =
      deptFilter === "All" ||
      t.dept === deptFilter ||
      EMPLOYEES.find((e) => e.name === t.assignee)?.dept === deptFilter;
    return isDeptMatch && (t.status === "Overdue" || t.status === "Todo");
  }).length;

  // Events
  const birthdays = TEAM_CELEBRATIONS.filter(
    (e) =>
      e.type === "Birthday" &&
      (deptFilter === "All" ||
        EMPLOYEES.find((x) => x.name === e.employee)?.dept === deptFilter)
  );
  const newHires = TEAM_CELEBRATIONS.filter(
    (e) =>
      e.type === "New Joiner" &&
      (deptFilter === "All" ||
        EMPLOYEES.find((x) => x.name === e.employee)?.dept === deptFilter)
  );
  const anniversaries = TEAM_CELEBRATIONS.filter(
    (e) =>
      e.type === "Anniversary" &&
      (deptFilter === "All" ||
        EMPLOYEES.find((x) => x.name === e.employee)?.dept === deptFilter)
  );

  // Availability
  const upcomingAvailability = teamMembers
    .map((emp) => {
      const leaves = teamReqs.filter(
        (r) => r.employee === emp.name && r.status === "Approved"
      );
      return leaves.map((l) => ({
        date: new Date(l.from).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        name: emp.name,
        type:
          l.type === "Sick"
            ? "Sick Leave"
            : l.type === "Casual"
            ? "Casual Leave"
            : "Annual Leave",
        color: emp.color,
        initials: emp.initials,
      }));
    })
    .flat()
    .slice(0, 3);

  if (upcomingAvailability.length === 0) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);

    if (teamMembers.length > 0) {
      upcomingAvailability.push({
        date: tomorrow.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        name: teamMembers[0].name,
        type: "Work From Home",
        color: teamMembers[0].color,
        initials: teamMembers[0].initials,
      });
    }
    if (teamMembers.length > 1) {
      upcomingAvailability.push({
        date: dayAfter.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        name: teamMembers[1].name,
        type: "Annual Leave",
        color: teamMembers[1].color,
        initials: teamMembers[1].initials,
      });
    }
  }

  return (
    <div className="flex-1 overflow-auto p-6 bg-[#F7F8FA] text-left">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* LEFT COLUMN: Identity & Composition (1 col) */}
        <div className="lg:col-span-1 space-y-6">
          {/* Department Profile */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-[#5C5CFF] flex items-center justify-center text-2xl font-bold mb-4 border border-indigo-100 shadow-inner">
              {deptName[0]}
            </div>
            <h3 className="text-base font-bold text-gray-900">{deptName}</h3>
            <p className="text-xs text-gray-505 mt-1">{deptDesc}</p>

            <div className="w-full border-t border-gray-100 my-4" />

            <div className="w-full space-y-3 text-left">
              <div>
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                  Department Head
                </p>
                <p className="text-xs font-semibold text-gray-808 mt-0.5">
                  {deptHead}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                  Team Strength
                </p>
                <p className="text-xs font-semibold text-gray-808 mt-0.5">
                  {teamMembers.length} employees
                </p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                  Location
                </p>
                <p className="text-xs font-semibold text-gray-808 mt-0.5">
                  {deptLoc}
                </p>
              </div>
            </div>
          </div>

          {/* Team Composition */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              Team Composition
            </h4>
            <div className="space-y-2.5">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-gray-505">Managers</span>
                <span className="text-gray-808">{managerCount}</span>
              </div>
              <div className="flex justify-between text-xs font-medium">
                <span className="text-gray-505">Employees</span>
                <span className="text-gray-808">{employeeCount}</span>
              </div>
              <div className="border-t border-gray-100 pt-2 flex justify-between text-xs font-bold">
                <span className="text-gray-900">Total</span>
                <span className="text-[#5C5CFF]">{teamMembers.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: Team Today & Attendance Preview & Needs Attention (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Team Today stats */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Team Today
              </h4>
              <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                {teamMembers.length} Team Members
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                {
                  label: "Present",
                  count: presentCount,
                  color: "text-green-600",
                  bg: "bg-green-50/50",
                },
                {
                  label: "On Leave",
                  count: leaveCount,
                  color: "text-purple-600",
                  bg: "bg-purple-50/50",
                },
                {
                  label: "WFH",
                  count: wfhCount,
                  color: "text-blue-600",
                  bg: "bg-blue-50/50",
                },
                {
                  label: "Not Checked In",
                  count: absentCount,
                  color: "text-gray-550",
                  bg: "bg-gray-50/50",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className={cn(
                    "p-4 rounded-xl text-center border border-transparent",
                    stat.bg
                  )}
                >
                  <div className={cn("text-2xl font-bold", stat.color)}>
                    {stat.count}
                  </div>
                  <div className="text-[10px] font-semibold text-gray-500 mt-1">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Team Attendance Preview */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Team Attendance
              </h4>
              <button
                onClick={() => {
                  navigate("attendance");
                  setAttendanceSection("My Team");
                }}
                className="text-xs font-semibold text-[#5C5CFF] hover:text-[#4B4BE3] transition-colors cursor-pointer bg-transparent border-0"
              >
                View all →
              </button>
            </div>
            <div className="divide-y divide-gray-150">
              {teamMembers.slice(0, 3).map((emp) => {
                const att = getAttendanceDetails(emp);
                return (
                  <div
                    key={emp.id}
                    className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <Avt initials={emp.initials} color={emp.color} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-808 truncate">
                        {emp.name}
                      </p>
                      <p className="text-[10px] text-gray-400 truncate mt-0.5">
                        {emp.designation}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <div className={cn("w-1.5 h-1.5 rounded-full", att.dotColor)} />
                      <span className="text-[11px] font-medium text-gray-555">
                        {att.status === "Checked In"
                          ? `Checked In · ${att.checkIn}`
                          : att.status === "WFH"
                          ? "Working remotely"
                          : att.status}
                      </span>
                    </div>
                  </div>
                );
              })}
              {teamMembers.length === 0 && (
                <div className="text-center py-6 text-xs text-gray-400">
                  No team members in this department
                </div>
              )}
            </div>
          </div>

          {/* Needs Attention */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">
              Needs Attention
            </h4>
            {pendingLeaves === 0 &&
            attendanceExceptions === 0 &&
            overdueTasksCount === 0 ? (
              <div className="text-center py-6 text-xs text-gray-400">
                All caught up! No items require attention today.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {pendingLeaves > 0 && (
                  <div
                    onClick={() => {
                      setTeamTab("Approvals");
                    }}
                    className="flex justify-between items-center py-3.5 cursor-pointer hover:bg-gray-50 px-2 rounded-lg transition-colors"
                  >
                    <span className="text-xs text-gray-655 font-semibold hover:text-[#5C5CFF]">
                      Leave requests
                    </span>
                    <span className="bg-red-50 text-red-500 font-semibold px-2 py-0.5 rounded text-[10px]">
                      {pendingLeaves}
                    </span>
                  </div>
                )}
                {attendanceExceptions > 0 && (
                  <div
                    onClick={() => {
                      navigate("attendance");
                      setAttendanceSection("My Team");
                    }}
                    className="flex justify-between items-center py-3.5 cursor-pointer hover:bg-gray-50 px-2 rounded-lg transition-colors"
                  >
                    <span className="text-xs text-gray-655 font-semibold hover:text-[#5C5CFF]">
                      Attendance exceptions
                    </span>
                    <span className="bg-amber-50 text-amber-600 font-semibold px-2 py-0.5 rounded text-[10px]">
                      {attendanceExceptions}
                    </span>
                  </div>
                )}
                {overdueTasksCount > 0 && (
                  <div
                    onClick={() => {
                      navigate("tasks");
                    }}
                    className="flex justify-between items-center py-3.5 cursor-pointer hover:bg-gray-50 px-2 rounded-lg transition-colors"
                  >
                    <span className="text-xs text-gray-655 font-semibold hover:text-[#5C5CFF]">
                      Overdue tasks
                    </span>
                    <span className="bg-blue-50 text-blue-600 font-semibold px-2 py-0.5 rounded text-[10px]">
                      {overdueTasksCount}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Events & Calendar (1 col) */}
        <div className="lg:col-span-1 space-y-6">
          {/* Upcoming Events */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">
              Upcoming
            </h4>

            <div className="space-y-4">
              {/* Birthdays */}
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Birthdays
                </p>
                {birthdays.length > 0 ? (
                  birthdays.map((e, idx) => {
                    const emp = EMPLOYEES.find((x) => x.name === e.employee);
                    return (
                      <div key={idx} className="flex items-center gap-2.5 py-1.5">
                        <Avt
                          initials={emp?.initials || "E"}
                          color={emp?.color || "#5C5CFF"}
                          size="xs"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-gray-808 truncate">
                            {e.employee}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {e.detail}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-gray-400 italic">No upcoming birthdays</p>
                )}
              </div>

              {/* New Hires */}
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  New Hires
                </p>
                {newHires.length > 0 ? (
                  newHires.map((e, idx) => {
                    const emp = EMPLOYEES.find((x) => x.name === e.employee);
                    return (
                      <div key={idx} className="flex items-center gap-2.5 py-1.5">
                        <Avt
                          initials={emp?.initials || "E"}
                          color={emp?.color || "#5C5CFF"}
                          size="xs"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-gray-808 truncate">
                            {e.employee}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {e.detail}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-gray-400 italic">No new hires</p>
                )}
              </div>

              {/* Anniversaries */}
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Work Anniversaries
                </p>
                {anniversaries.length > 0 ? (
                  anniversaries.map((e, idx) => {
                    const emp = EMPLOYEES.find((x) => x.name === e.employee);
                    return (
                      <div key={idx} className="flex items-center gap-2.5 py-1.5">
                        <Avt
                          initials={emp?.initials || "E"}
                          color={emp?.color || "#5C5CFF"}
                          size="xs"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-gray-808 truncate">
                            {e.employee}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {e.detail}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-gray-400 italic">
                    No upcoming anniversaries
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Team Availability */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              Team Availability
            </h4>
            <div className="space-y-3">
              {upcomingAvailability.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2.5 py-1">
                  <span className="text-[10px] font-bold text-gray-400 bg-gray-50 border border-gray-150 rounded px-1.5 py-0.5 flex-shrink-0 w-12 text-center">
                    {item.date}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-gray-808 truncate">
                      {item.name}
                    </p>
                    <p className="text-[10px] text-gray-505 mt-0.5">{item.type}</p>
                  </div>
                </div>
              ))}
              {upcomingAvailability.length === 0 && (
                <p className="text-xs text-gray-400 italic py-2">No leaves scheduled</p>
              )}
            </div>
            <div className="border-t border-gray-100 mt-4 pt-3 text-center">
              <button
                onClick={() => {
                  navigate("leave");
                  setLeaveSection("My Team");
                }}
                className="text-xs font-semibold text-[#5C5CFF] hover:underline cursor-pointer bg-transparent border-0"
              >
                View team calendar →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
