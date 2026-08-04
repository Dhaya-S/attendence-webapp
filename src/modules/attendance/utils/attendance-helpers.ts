import { Employee } from "@/shared/types";
import { ATTENDANCE_RECORDS } from "../data/attendance-records";

export const getAttendanceDetails = (emp: Employee) => {
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
  } else if (emp.status === "Active") {
    displayStatus = "Checked In";
    dotColor = "bg-green-500 animate-pulse";
  }

  return {
    status: displayStatus,
    dotColor,
    checkIn: "09:00 AM",
    workingHours: "8h 00m",
  };
};
