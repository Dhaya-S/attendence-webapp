import { Employee } from "@/shared/types";
import { ATTENDANCE_RECORDS } from "../data/attendance-records";

function parseTimeString(timeStr: string): Date | null {
  if (!timeStr || timeStr === "—" || timeStr === "–") return null;
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
  if (!match) return null;
  
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const ampm = match[3] ? match[3].toUpperCase() : null;
  
  if (ampm === "PM" && hours < 12) hours += 12;
  if (ampm === "AM" && hours === 12) hours = 0;
  
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function calculateWorkingHours(lastCheckIn: string, lastCheckOut?: string): string {
  const inDate = parseTimeString(lastCheckIn);
  if (!inDate) return "—";
  
  const outDate = lastCheckOut ? parseTimeString(lastCheckOut) : new Date();
  if (!outDate) return "—";
  
  const diffMs = outDate.getTime() - inDate.getTime();
  if (diffMs < 0) return "—";
  
  const diffMin = Math.floor(diffMs / 60000);
  const h = Math.floor(diffMin / 60);
  const m = diffMin % 60;
  return `${h}h ${m}m`;
}

export const getAttendanceDetails = (emp: any) => {
  // First, check if the employee has real-time attributes from Firestore
  const rawStatus = emp.attendanceStatus || emp.status || "Absent";
  const statusLower = String(rawStatus).toLowerCase();
  
  if (emp.attendanceStatus !== undefined || emp.lastCheckIn !== undefined || emp.lastCheckOut !== undefined) {
    let displayStatus = "Checked Out";
    let dotColor = "bg-gray-300";
    let checkIn = "—";
    let workingHours = "—";

    if (statusLower === "present" || statusLower === "checked in" || statusLower === "working" || statusLower === "late") {
      displayStatus = statusLower === "late" ? "Late" : "Checked In";
      dotColor = statusLower === "late" ? "bg-amber-500" : "bg-green-500 animate-pulse";
      checkIn = emp.lastCheckIn || "—";
      workingHours = emp.lastCheckIn ? calculateWorkingHours(emp.lastCheckIn) : "—";
    } else if (statusLower === "wfh" || statusLower === "remote") {
      displayStatus = "WFH";
      dotColor = "bg-blue-500";
      checkIn = emp.lastCheckIn || "—";
      workingHours = emp.lastCheckIn ? calculateWorkingHours(emp.lastCheckIn) : "—";
    } else if (statusLower === "on leave" || statusLower === "leave") {
      displayStatus = "On Leave";
      dotColor = "bg-purple-500";
      checkIn = "—";
      workingHours = "—";
    } else if (statusLower === "checked out" || statusLower === "offline") {
      displayStatus = "Checked Out";
      dotColor = "bg-gray-300";
      checkIn = emp.lastCheckIn || "—";
      workingHours = emp.lastCheckIn && emp.lastCheckOut ? calculateWorkingHours(emp.lastCheckIn, emp.lastCheckOut) : "—";
    }

    if (checkIn !== "—" && !checkIn.includes("AM") && !checkIn.includes("PM")) {
      checkIn = checkIn + " AM";
    }

    return {
      status: displayStatus,
      dotColor,
      checkIn,
      workingHours,
    };
  }

  // Fallback to static records
  const record = ATTENDANCE_RECORDS.find(
    (r) => r.id === emp.id || r.name === emp.name
  );
  if (record) {
    const status = record.status;
    let displayStatus = "Checked Out";
    let dotColor = "bg-gray-300";

    if (status === "Present") {
      displayStatus = "Checked In";
      dotColor = "bg-green-500 animate-pulse";
    } else if (status === "Late") {
      displayStatus = "Late";
      dotColor = "bg-amber-500";
    } else if (status === "WFH") {
      displayStatus = "WFH";
      dotColor = "bg-blue-500";
    } else if (status === "On Leave") {
      displayStatus = "On Leave";
      dotColor = "bg-purple-500";
    } else if (status === "Absent") {
      displayStatus = "Checked Out";
      dotColor = "bg-gray-300";
    }

    return {
      status: displayStatus,
      dotColor,
      checkIn: record.checkIn !== "–" ? record.checkIn + " AM" : "–",
      workingHours:
        record.hours > 0
          ? `${Math.floor(record.hours)}h ${Math.round((record.hours % 1) * 60)}m`
          : "–",
    };
  }

  let displayStatus = "Checked Out";
  let dotColor = "bg-gray-300";
  if (emp.status === "On Leave") {
    displayStatus = "On Leave";
    dotColor = "bg-purple-500";
  }

  return {
    status: displayStatus,
    dotColor,
    checkIn: "—",
    workingHours: "—",
  };
};
