import React, { useState, useEffect } from "react";
import { useAuth } from "@/shared/context/AuthContext";
import { db } from "@/shared/utils/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import {
  ChevronLeft,
  ChevronRight,
  Edit,
  MoreHorizontal,
  ClipboardList,
  Clock,
  FileText,
  Download,
  Upload,
  Key,
  UserX,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  MessageCircle,
  BarChart2,
  CalendarDays,
  AlertCircle,
} from "lucide-react";
import { Employee, AppPage } from "@/shared/types";
import { cn, fmtDate } from "@/shared/utils";
import {
  Btn,
  StatusBadge,
  Avt,
  TabBar,
  Modal,
  InputField,
  SelectField,
} from "@/shared/components";

function fmtTime(val: any): string {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (val.toDate) return val.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (val.seconds) return new Date(val.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return String(val);
}

export function EmployeeProfilePage({
  employee,
  navigate,
  origin,
}: {
  employee: Employee;
  navigate: (p: AppPage) => void;
  origin?: string;
}) {
  const [tab, setTab] = useState("Activities");
  const [showEdit, setShowEdit] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  
  const { companyId } = useAuth();
  const targetCompanyId = companyId && companyId !== "default" ? companyId : "default";
  const [activities, setActivities] = useState<any[]>([]);
  const [rawAttendance, setRawAttendance] = useState<any[]>([]);
  const [rawLeaves, setRawLeaves] = useState<any[]>([]);

  useEffect(() => {
    if (!employee.email && !employee.id) return;
    
    const email = String(employee.email || employee.workEmail || "").toLowerCase();
    
    // We will merge records from Attendance, Leave, and Tasks
    let attRecords: any[] = [];
    let leaveRecords: any[] = [];
    let taskRecords: any[] = [];
    
    const updateActivities = () => {
      const merged = [...attRecords, ...leaveRecords, ...taskRecords];
      // Sort by date/time descending
      merged.sort((a, b) => {
        const timeA = new Date(a.sortDate || 0).getTime();
        const timeB = new Date(b.sortDate || 0).getTime();
        return timeB - timeA;
      });
      setActivities(merged);
    };

    // 1. Attendance Check-ins
    const unsubAtt = onSnapshot(collection(db, "organizations", targetCompanyId, "users", employee.email || employee.id, "attendance"), (snap) => {
      setRawAttendance(snap.docs.map(d => d.data()));
      
      attRecords = snap.docs.map(d => {
        const data = d.data();
        const dateStr = data.date;
        const timeStr = fmtTime(data.checkInTime || data.checkIn);
        let sortDate = new Date();
        if (dateStr) {
          sortDate = new Date(dateStr);
          if (timeStr && timeStr !== "—") {
            const timeMatch = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
            if (timeMatch) {
              let h = parseInt(timeMatch[1], 10);
              if (timeMatch[3]?.toUpperCase() === "PM" && h < 12) h += 12;
              if (timeMatch[3]?.toUpperCase() === "AM" && h === 12) h = 0;
              sortDate.setHours(h, parseInt(timeMatch[2], 10), 0);
            }
          }
        }
        return {
          id: d.id,
          action: data.status === "On Leave" ? "Leave taken" : data.status === "WFH" ? "Checked in remotely" : "Checked in",
          time: `${dateStr || "Unknown Date"} ${timeStr ? ", " + timeStr : ""}`,
          sortDate: sortDate.toISOString(),
          icon: Clock,
          color: "text-green-600 bg-green-50"
        };
      });
      updateActivities();
    });

    // 2. Leave Requests
    const leaveQ = query(collection(db, "organizations", targetCompanyId, "leave_requests"), where("applicantEmail", "==", email));
    const unsubLeave = onSnapshot(leaveQ, (snap) => {
      setRawLeaves(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      
      leaveRecords = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          action: `Leave ${data.status?.toLowerCase() || "requested"} – ${data.type || "Leave"} ${data.duration || ""}`,
          time: fmtDate(data.createdAt || data.date),
          sortDate: data.createdAt || data.date || new Date().toISOString(),
          icon: CalendarDays,
          color: data.status === "Approved" ? "text-purple-600 bg-purple-50" : data.status === "Rejected" ? "text-red-600 bg-red-50" : "text-amber-600 bg-amber-50"
        };
      });
      updateActivities();
    });

    // 3. Tasks
    const tasksQ = query(collection(db, "organizations", targetCompanyId, "tasks"));
    const unsubTasks = onSnapshot(tasksQ, (snap) => {
      // Filter manually since assignees format might vary
      taskRecords = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as any))
        .filter(t => 
          t.assigneeEmail?.toLowerCase() === email ||
          t.assigneeId === employee.id || 
          t.assignee?.toLowerCase().includes(employee.name?.toLowerCase()) ||
          (t.assignees && Array.isArray(t.assignees) && t.assignees.some((a: any) => 
            (typeof a === 'string' && a.toLowerCase() === email) || 
            (a.email && a.email.toLowerCase() === email)
          ))
        )
        .map(t => ({
          id: t.id,
          action: `Task ${t.status === "Completed" ? "completed" : "assigned"}: ${t.title || "Unnamed task"}`,
          time: fmtDate(t.createdAt || t.dueDate),
          sortDate: t.createdAt || t.dueDate || new Date().toISOString(),
          icon: ClipboardList,
          color: t.status === "Completed" ? "text-blue-600 bg-blue-50" : "text-gray-600 bg-gray-100"
        }));
      updateActivities();
    });

    return () => {
      unsubAtt();
      unsubLeave();
      unsubTasks();
    };
  }, [employee, targetCompanyId]);

  const presentCount = rawAttendance.filter(a => ["Checked In", "Present", "Checked Out", "WFH"].includes(a.status)).length;
  const lateCount = rawAttendance.filter(a => a.status === "Late").length;
  let totalMins = 0;
  let daysWithHours = 0;
  rawAttendance.forEach(a => {
    const hw = a.hoursWorked || a.workingHours;
    if (hw && hw !== "—" && hw !== "0h 00m") {
      const match = hw.match(/(\d+)h\s*(\d+)m/);
      if (match) {
         totalMins += parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
         daysWithHours++;
      }
    }
  });
  const avgHrs = daysWithHours > 0 ? (totalMins / daysWithHours / 60).toFixed(1) + " hrs" : "0 hrs";
  const attRate = rawAttendance.length > 0 ? ((presentCount + lateCount) / rawAttendance.length * 100).toFixed(1) + "%" : "0%";
  
  const sortedAttendance = [...rawAttendance].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
  const sortedLeaves = [...rawLeaves].sort((a, b) => new Date(b.createdAt || b.date || 0).getTime() - new Date(a.createdAt || a.date || 0).getTime());

  return (
    <div className="flex flex-col h-full text-left">
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="flex items-start justify-between mb-4">
          {origin === "team" ? (
            <button
              onClick={() => navigate("team")}
              className="flex items-center gap-1.5 text-gray-555 hover:text-[#5C5CFF] font-medium text-xs mb-3 transition-colors cursor-pointer"
            >
              <ChevronLeft size={14} /> Back to Reportees
            </button>
          ) : (
            <div className="text-xs text-gray-400 flex items-center gap-1 mb-3">
              <button
                onClick={() => navigate("my-space")}
                className="hover:text-[#5C5CFF] cursor-pointer bg-transparent border-0 p-0"
              >
                Home
              </button>
              <ChevronRight size={12} />
              <button
                onClick={() => navigate("organization")}
                className="hover:text-[#5C5CFF] cursor-pointer bg-transparent border-0 p-0"
              >
                Organization
              </button>
              <ChevronRight size={12} />
              <span className="text-gray-600 font-medium">{employee.name}</span>
            </div>
          )}
          <div className="flex gap-2 relative">
            <Btn variant="outline" size="sm" onClick={() => setShowEdit(true)}>
              <Edit size={13} />
              Edit
            </Btn>
            <div className="relative">
              <Btn
                variant="outline"
                size="sm"
                onClick={() => setShowMenu(!showMenu)}
              >
                <MoreHorizontal size={13} />
              </Btn>
              {showMenu && (
                <div
                  className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl border border-gray-200 shadow-lg z-30 py-1"
                  onClick={() => setShowMenu(false)}
                >
                  {(
                    [
                      { icon: Edit, label: "Edit Employee" },
                      { icon: ClipboardList, label: "Assign Task" },
                      { icon: Clock, label: "Assign Shift" },
                      { icon: FileText, label: "View Documents" },
                      { icon: Download, label: "Download Profile" },
                      { icon: Upload, label: "Export Details" },
                    ] as { icon: React.ElementType; label: string }[]
                  ).map(({ icon: Icon, label }) => (
                    <button
                      key={label}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 cursor-pointer bg-transparent border-0"
                    >
                      <Icon size={13} className="text-gray-400" />
                      {label}
                    </button>
                  ))}
                  <div className="border-t border-gray-100 my-1" />
                  <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 cursor-pointer bg-transparent border-0">
                    <Key size={13} className="text-gray-400" />
                    Reset Password
                  </button>
                  <button className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2.5 cursor-pointer bg-transparent border-0">
                    <UserX size={13} />
                    Deactivate Employee
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <Avt initials={employee.initials} color={employee.color} size="xl" />
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-semibold text-gray-900">
                {employee.name}
              </h2>
              <StatusBadge status={employee.status} />
              <span className="text-xs text-gray-400 font-mono">{employee.id}</span>
            </div>
            <p className="text-sm text-gray-600">
              {employee.designation} · {employee.dept}
            </p>
            <div className="flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1.5 text-xs text-gray-505">
                <Mail size={12} />
                {employee.email}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-gray-505">
                <Phone size={12} />
                {employee.phone}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-gray-505">
                <MapPin size={12} />
                {employee.branch}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-gray-505">
                <Briefcase size={12} />
                {employee.empType}
              </span>
            </div>
          </div>
          <div className="flex gap-6 text-center">
            <div>
              <div className="text-xl font-semibold text-gray-900">
                {employee.attendance}%
              </div>
              <div className="text-xs text-gray-500">Attendance</div>
            </div>
            <div>
              <div className="text-xl font-semibold text-gray-900">
                {employee.shift}
              </div>
              <div className="text-xs text-gray-500">Shift</div>
            </div>
          </div>
        </div>
      </div>
      <TabBar
        tabs={["Activities", "Profile", "Attendance", "Leave", "Shift"]}
        active={tab}
        onChange={setTab}
      />
      <div className="flex-1 overflow-auto p-6">
        {tab === "Profile" && (
          <div className="grid grid-cols-3 gap-5">
            <div className="col-span-2 space-y-5">
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <h4 className="text-sm font-semibold text-gray-800 mb-4">
                  Employment Details
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {[
                    ["Employee ID", employee.id],
                    ["Join Date", fmtDate(employee.joinDate)],
                    ["Department", employee.dept],
                    ["Designation", employee.designation],
                    ["Branch", employee.branch],
                    ["Shift", employee.shift],
                    ["Employment Type", employee.empType],
                    ["Reporting Manager", employee.manager],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <div className="text-xs text-gray-500 mb-0.5">{k}</div>
                      <div className="font-medium text-gray-800">{v}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <h4 className="text-sm font-semibold text-gray-800 mb-4">
                  Contact Information
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {[
                    ["Work Email", employee.email],
                    ["Phone", employee.phone],
                    ["Emergency Contact", "+1 (555) 999-0001"],
                    ["Personal Email", employee.email.replace("acmecorp", "gmail")],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <div className="text-xs text-gray-500 mb-0.5">{k}</div>
                      <div className="font-medium text-gray-800">{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-4">

              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">
                  Quick Actions
                </h4>
                <div className="space-y-2">
                  {(
                    [
                      { icon: Edit, label: "Edit Employee" },
                      { icon: ClipboardList, label: "Assign Task" },
                      { icon: Clock, label: "Assign Shift" },
                      { icon: MessageCircle, label: "Send Message" },
                      { icon: BarChart2, label: "View Attendance" },
                      { icon: CalendarDays, label: "View Leave History" },
                      { icon: Download, label: "Download Profile" },
                      { icon: UserX, label: "Deactivate Employee", danger: true },
                    ] as {
                      icon: React.ElementType;
                      label: string;
                      danger?: boolean;
                    }[]
                  ).map(({ icon: Icon, label, danger }) => (
                    <button
                      key={label}
                      onClick={() => {
                        if (label === "Assign Task") {
                          alert(
                            `Assign Task for ${employee.name} is handled in the Tasks module.`
                          );
                        } else if (label === "Assign Shift") {
                          alert(
                            `Assign Shift for ${employee.name} is handled in the Shift Planner.`
                          );
                        } else if (label === "Send Message") {
                          alert(
                            `Sending messages to ${employee.name} is handled in Team Feed.`
                          );
                        } else if (label === "View Attendance") {
                          setTab("Attendance");
                        } else if (label === "View Leave History") {
                          setTab("Leave");
                        } else if (label === "Download Profile") {
                          alert(`Downloading profile for ${employee.name}...`);
                        } else if (label === "Edit Employee") {
                          setShowEdit(true);
                        } else if (label === "Deactivate Employee") {
                          alert(`Deactivating employee ${employee.name}...`);
                        }
                      }}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg border border-gray-200 text-left transition-colors cursor-pointer bg-white",
                        danger
                          ? "text-red-600 hover:bg-red-50 border-red-100"
                          : "text-gray-606 hover:bg-gray-50"
                      )}
                    >
                      <Icon
                        size={14}
                        className={danger ? "text-red-500" : "text-[#5C5CFF]"}
                      />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        {tab === "Activities" && (
          <div className="space-y-3 max-w-2xl">
            {activities.length > 0 ? (
              activities.map(({ action, time, icon: Icon, color }, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 bg-white border border-gray-200 rounded-xl p-4"
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                      color.split(" ")[1]
                    )}
                  >
                    <Icon size={14} className={color.split(" ")[0]} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-808">{action}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{time}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10">
                <p className="text-sm text-gray-500">No activities found.</p>
              </div>
            )}
          </div>
        )}
        {tab === "Attendance" && (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              {[
                ["Present Days", presentCount.toString(), `of ${rawAttendance.length} recorded days`],
                ["Late Arrivals", lateCount.toString(), "total recorded"],
                ["Avg Hours", avgHrs, "per day"],
                ["Attendance Rate", attRate, "overall"],
              ].map(([t, v, s]) => (
                <div
                  key={t as string}
                  className="bg-white rounded-lg border border-gray-200 p-4"
                >
                  <div className="text-xs text-gray-500 mb-1">{t}</div>
                  <div className="text-xl font-semibold text-gray-900">{v}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{s}</div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-800 font-semibold">
                  Log
                </h4>
                <Btn variant="outline" size="sm">
                  <Download size={12} />
                  Export
                </Btn>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {["Date", "Check In", "Check Out", "Hours", "Status"].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sortedAttendance.length > 0 ? (
                    sortedAttendance.map((a, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-5 py-3 text-gray-707">{fmtDate(a.date)}</td>
                        <td className="px-5 py-3 font-mono text-xs text-gray-707">
                          {fmtTime(a.checkInTime || a.checkIn) || "—"}
                        </td>
                        <td className="px-5 py-3 font-mono text-xs text-gray-707">
                          {fmtTime(a.checkOutTime || a.checkOut) || "—"}
                        </td>
                        <td className="px-5 py-3 font-mono text-xs text-gray-600">
                          {a.hoursWorked || a.workingHours || "—"}
                        </td>
                        <td className="px-5 py-3">
                          <StatusBadge status={a.status || "Absent"} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-gray-500 text-sm">
                        No attendance records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {tab === "Leave" && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-800">Leave History</h4>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {["Date Applied", "Type", "Duration", "Status"].map((h) => (
                    <th key={h} className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedLeaves.length > 0 ? (
                  sortedLeaves.map((lv, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-5 py-3 text-gray-707">{fmtDate(lv.createdAt || lv.date)}</td>
                      <td className="px-5 py-3 text-gray-707">{lv.type || "Leave"}</td>
                      <td className="px-5 py-3 text-gray-707">{lv.duration || "—"}</td>
                      <td className="px-5 py-3">
                        <StatusBadge status={lv.status || "Pending"} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-gray-500 text-sm">
                      No leave records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {tab === "Shift" && (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <Clock size={20} className="text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-708 mb-1">
              Current Shift Assignment
            </p>
            <p className="text-base text-gray-800 font-medium mt-2">
              {employee.shift || "General Shift"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {employee.branch || "Headquarters"}
            </p>
          </div>
        )}
      </div>
      {showEdit && (
        <Modal
          title={`Edit – ${employee.name}`}
          onClose={() => setShowEdit(false)}
          width="max-w-2xl"
        >
          <div className="grid grid-cols-2 gap-4">
            <InputField
              label="First Name"
              defaultValue={employee.name.split(" ")[0]}
              required
            />
            <InputField
              label="Last Name"
              defaultValue={employee.name.split(" ").slice(1).join(" ")}
              required
            />
            <InputField
              label="Work Email"
              defaultValue={employee.email}
              type="email"
              required
            />
            <InputField label="Phone" defaultValue={employee.phone} type="tel" />
            <SelectField
              label="Department"
              options={[
                "Engineering",
                "Product",
                "Design",
                "Marketing",
                "Sales",
                "Finance",
                "HR",
                "Legal",
                "Operations",
              ]}
              value={employee.dept}
            />
            <InputField label="Designation" defaultValue={employee.designation} required />
            <SelectField
              label="Branch"
              options={["New York HQ", "San Francisco", "Chicago", "Austin"]}
              value={employee.branch}
            />
            <SelectField
              label="Shift"
              options={["General", "Morning", "Evening", "Night"]}
              value={employee.shift}
            />
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
            <Btn variant="outline" onClick={() => setShowEdit(false)}>
              Cancel
            </Btn>
            <Btn onClick={() => setShowEdit(false)}>Save Changes</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
