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
    let checkOut = "—";
    let workingHours = "—";

    if (statusLower === "present" || statusLower === "checked in" || statusLower === "working" || statusLower === "late") {
      displayStatus = statusLower === "late" ? "Late" : "Checked In";
      dotColor = statusLower === "late" ? "bg-amber-500" : "bg-green-500 animate-pulse";
      checkIn = emp.lastCheckIn || "—";
      checkOut = emp.lastCheckOut || "—";
      workingHours = emp.lastCheckIn ? calculateWorkingHours(emp.lastCheckIn) : "—";
    } else if (statusLower === "wfh" || statusLower === "remote") {
      displayStatus = "WFH";
      dotColor = "bg-blue-500";
      checkIn = emp.lastCheckIn || "—";
      checkOut = emp.lastCheckOut || "—";
      workingHours = emp.lastCheckIn ? calculateWorkingHours(emp.lastCheckIn) : "—";
    } else if (statusLower === "on leave" || statusLower === "leave") {
      displayStatus = "On Leave";
      dotColor = "bg-purple-500";
      checkIn = "—";
      checkOut = "—";
      workingHours = "—";
    } else if (statusLower === "checked out" || statusLower === "offline") {
      displayStatus = "Checked Out";
      dotColor = "bg-gray-300";
      checkIn = emp.lastCheckIn || "—";
      checkOut = emp.lastCheckOut || "—";
      workingHours = emp.lastCheckIn && emp.lastCheckOut ? calculateWorkingHours(emp.lastCheckIn, emp.lastCheckOut) : "—";
    } else if (statusLower === "absent") {
      displayStatus = "Absent";
      dotColor = "bg-gray-300";
      checkIn = "—";
      checkOut = "—";
      workingHours = "—";
    }

    if (checkIn !== "—" && !checkIn.includes("AM") && !checkIn.includes("PM")) {
      checkIn = checkIn + " AM";
    }
    if (checkOut !== "—" && !checkOut.includes("AM") && !checkOut.includes("PM")) {
      checkOut = checkOut + " PM";
    }

    return {
      status: displayStatus,
      dotColor,
      checkIn,
      checkOut,
      workingHours,
    };
  }



  let displayStatus = "Absent";
  let dotColor = "bg-gray-300";
  if (emp.status === "On Leave") {
    displayStatus = "On Leave";
    dotColor = "bg-purple-500";
  }

  return {
    status: displayStatus,
    dotColor,
    checkIn: "—",
    checkOut: "—",
    workingHours: "—",
  };
};
