import React from "react";
import { MoreHorizontal } from "lucide-react";
import { Employee } from "@/shared/types";
import { cn } from "@/shared/utils";
import { Avt } from "@/shared/components";
import { getAttendanceDetails } from "@/modules/attendance";

interface ReporteesTabProps {
  filtered: Employee[];
  reporteesViewMode: "list" | "grid";
  navigate: (page: string, emp?: any, tabOrSection?: string) => void;
}

export function ReporteesTab({
  filtered,
  reporteesViewMode,
  navigate,
}: ReporteesTabProps) {
  const totalReportees = filtered.length;
  let presentCount = 0;
  let leaveCount = 0;
  let absentCount = 0;

  filtered.forEach((e) => {
    const details = getAttendanceDetails(e);
    if (details.status === "Checked In" || details.status === "Late" || details.status === "WFH") {
      presentCount++;
    } else if (details.status === "On Leave" || details.status === "Leave") {
      leaveCount++;
    } else {
      absentCount++;
    }
  });

  return (
    <div className="flex-1 h-full overflow-auto p-6 bg-[#F7F8FA] text-left">
      {/* Reporting Summary Strip */}
      <div className="bg-white border border-gray-200 rounded-xl px-6 py-3.5 flex items-center justify-between text-xs text-gray-500 max-w-7xl mx-auto mb-5 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900 text-sm">
              {totalReportees}
            </span>
            <span>Direct Reportees</span>
          </div>
          <div className="h-4 w-px bg-gray-200" />
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="font-semibold text-gray-900 text-sm">
              {presentCount}
            </span>
            <span>Present</span>
          </div>
          <div className="h-4 w-px bg-gray-200" />
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span className="font-semibold text-gray-900 text-sm">{leaveCount}</span>
            <span>Leave</span>
          </div>
          <div className="h-4 w-px bg-gray-200" />
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gray-300" />
            <span className="font-semibold text-gray-900 text-sm">
              {absentCount}
            </span>
            <span>Absent</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {reporteesViewMode === "list" ? (
          /* LIST VIEW */
          filtered.length > 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {[
                      "Employee",
                      "Role",
                      "Department",
                      "Location",
                      "Attendance",
                      "Check-in",
                      "Check-out",
                      "Working Hours",
                      "",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {filtered.map((e) => {
                    const att = getAttendanceDetails(e);
                    
                    let mappedStatus = "Absent";
                    let mappedColor = "bg-gray-300";
                    if (att.status === "Checked In" || att.status === "Late" || att.status === "WFH") {
                      mappedStatus = "Present";
                      mappedColor = "bg-green-500";
                    } else if (att.status === "On Leave" || att.status === "Leave") {
                      mappedStatus = "Leave";
                      mappedColor = "bg-purple-500";
                    }

                    return (
                      <tr
                        key={e.id}
                        onClick={() => navigate("employee-profile", e)}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <Avt initials={e.initials} color={e.color} size="sm" />
                            <div className="flex flex-col text-left">
                              <span className="font-semibold text-gray-808 text-xs">
                                {e.name}
                              </span>
                              <span className="text-[10px] text-gray-400">
                                {e.id}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-gray-600 font-medium">
                          {e.designation}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-gray-505">
                          {e.dept}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-gray-505">
                          {e.branch}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-gray-655">
                          <div className="flex items-center gap-1.5">
                            <div
                              className={cn(
                                "w-1.5 h-1.5 rounded-full flex-shrink-0",
                                  mappedColor
                              )}
                            />
                            <span className="text-[11px] font-medium text-gray-600">
                              {mappedStatus}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-xs text-gray-505">
                          {att.checkIn}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-xs text-gray-505">
                          {att.checkOut}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-xs text-gray-505">
                          {att.workingHours}
                        </td>
                        <td
                          className="px-5 py-3.5 text-right"
                          onClick={(ev) => ev.stopPropagation()}
                        >
                          <button className="text-gray-400 hover:text-gray-650 p-1 rounded hover:bg-gray-100 transition-colors cursor-pointer bg-transparent border-0">
                            <MoreHorizontal size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 text-sm shadow-sm">
              No matching reportees found
            </div>
          )
        ) : /* GRID VIEW */
          filtered.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((e) => {
                const att = getAttendanceDetails(e);
                
                let mappedStatus = "Absent";
                let mappedColor = "bg-gray-300";
                if (att.status === "Checked In" || att.status === "Late" || att.status === "WFH") {
                  mappedStatus = "Present";
                  mappedColor = "bg-green-500";
                } else if (att.status === "On Leave" || att.status === "Leave") {
                  mappedStatus = "Leave";
                  mappedColor = "bg-purple-500";
                }

                return (
                  <div
                    key={e.id}
                    onClick={() => navigate("employee-profile", e)}
                    className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:border-[#5C5CFF]/30 hover:shadow-md transition-all cursor-pointer flex items-start gap-4 text-left group"
                  >
                    <Avt
                      initials={e.initials}
                      color={e.color}
                      size="lg"
                      className="flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-gray-808 group-hover:text-[#5C5CFF] transition-colors truncate">
                        {e.name}
                      </h4>
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {e.designation}
                      </p>
                      <p className="text-[11px] text-gray-400 truncate mt-0.5">
                        {e.dept} · {e.branch}
                      </p>
                      <div className="flex items-center gap-1.5 mt-3">
                        <div className={cn("w-2 h-2 rounded-full", mappedColor)} />
                        <span className="text-xs font-semibold text-gray-600">
                          {mappedStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 text-sm shadow-sm">
              No matching reportees found
            </div>
          )}
      </div>
    </div>
  );
}
