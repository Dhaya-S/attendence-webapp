import React, { useState, useEffect, useMemo } from "react";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "@/shared/utils/firebase";
import { CalendarGrid } from "./calendar-grid";
import { CalendarSidebar } from "./calendar-sidebar";
import { TeamTask } from "@/modules/tasks/types";

export interface CalendarEvent {
  id: string;
  type: "anniversary" | "birthday" | "wfh" | "absent" | "present" | "leave" | "task" | "holiday";
  title: string;
  date: string; // YYYY-MM-DD
  userEmail?: string;
  userName?: string;
  color?: string;
}

export function CalendarTab({
  targetCompanyId,
  users = [],
  tasks = [],
}: {
  targetCompanyId: string;
  users: any[];
  tasks: TeamTask[];
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Real-time data
  const [attendance, setAttendance] = useState<any[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);

  useEffect(() => {
    if (targetCompanyId === "default") return;

    // 1. Fetch ALL global attendance (for simple demo, we fetch all. In prod, we'd limit by month)
    const attUnsub = onSnapshot(collection(db, "organizations", targetCompanyId, "attendance"), (snap) => {
      setAttendance(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    // 2. Fetch Leaves
    const leaveUnsub = onSnapshot(collection(db, "organizations", targetCompanyId, "leave_requests"), (snap) => {
      setLeaveRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    // 3. Fetch Holidays
    const holUnsub = onSnapshot(collection(db, "organizations", targetCompanyId, "holidays"), (snap) => {
      setHolidays(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => {
      attUnsub();
      leaveUnsub();
      holUnsub();
    };
  }, [targetCompanyId]);

  // Aggregate all events
  const events = useMemo(() => {
    const list: CalendarEvent[] = [];

    // --- 1. Tasks ---
    tasks.forEach((t) => {
      if (t.dueDate && t.status !== "Done") {
        list.push({
          id: `task-${t.id}`,
          type: "task",
          title: `${t.assignee || t.assignees?.[0] || "Unassigned"} · Task Due: ${t.title}`,
          date: t.dueDate, // YYYY-MM-DD format
          color: "bg-orange-50 text-orange-600 border border-orange-100",
        });
      }
    });

    // --- 2. Attendance (WFH, Absent, Present) ---
    attendance.forEach((a) => {
      if (!a.date) return;
      const t = a.status === "WFH" ? "wfh" : a.status === "Absent" ? "absent" : "present";
      let title = `${a.name || a.email} · ${a.status}`;
      if (a.status === "Present" && a.checkInTime) {
         title = `${a.name || a.email} · Present (${a.checkInTime})`;
      }
      list.push({
        id: `att-${a.id}`,
        type: t,
        title,
        date: a.date, // Assuming YYYY-MM-DD
        color: t === "wfh" ? "bg-blue-50 text-blue-600 border border-blue-100" :
               t === "present" ? "bg-green-50 text-green-600 border border-green-100" :
               "bg-red-50 text-red-600 border border-red-100",
      });
    });

    // --- 3. Leave Requests ---
    leaveRequests.forEach((lv) => {
      if (lv.status === "Approved") {
        // Leaves might span multiple days. For simplicity, just use start date or date
        const d = lv.startDate || lv.date;
        if (d) {
          list.push({
            id: `leave-${lv.id}`,
            type: "leave",
            title: `${lv.applicantName || lv.applicantEmail} · On Leave`,
            date: d,
            color: "bg-purple-50 text-purple-600 border border-purple-100",
          });
        }
      }
    });

    // --- 4. Holidays ---
    holidays.forEach((h) => {
      if (h.date) {
        list.push({
          id: `hol-${h.id}`,
          type: "holiday",
          title: `${h.name} 🌴`,
          date: h.date,
          color: "bg-purple-50 text-purple-600 border border-purple-100",
        });
      }
    });

    // --- 5. Users (Birthdays & Anniversaries) ---
    const currYear = currentDate.getFullYear();
    const currMonth = currentDate.getMonth();

    users.forEach((u) => {
      if (u.dob) {
        const d = new Date(u.dob);
        // Map birthday to current year for calendar placement
        if (!isNaN(d.getTime())) {
            const bdayDate = new Date(currYear, d.getMonth(), d.getDate());
            // YYYY-MM-DD format
            const bdayStr = bdayDate.toLocaleDateString('en-CA');
            list.push({
              id: `bday-${u.id}`,
              type: "birthday",
              title: `${u.name}'s Birthday 🎂`,
              date: bdayStr,
              color: "bg-pink-50 text-pink-600 border border-pink-100",
            });
        }
      }
      
      if (u.doj) {
        const d = new Date(u.doj);
        if (!isNaN(d.getTime())) {
          const years = currYear - d.getFullYear();
          if (years > 0) {
            const annDate = new Date(currYear, d.getMonth(), d.getDate());
            const annStr = annDate.toLocaleDateString('en-CA');
            list.push({
              id: `ann-${u.id}`,
              type: "anniversary",
              title: `${u.name} · ${years} Years Anniversary 🎊`,
              date: annStr,
              color: "bg-teal-50 text-teal-600 border border-teal-100",
            });
          }
        }
      }
    });

    return list;
  }, [tasks, attendance, leaveRequests, holidays, users, currentDate]);

  return (
    <div className="flex flex-col md:flex-row h-full">
      <div className="flex-1 p-6 overflow-y-auto">
        <CalendarGrid
          currentDate={currentDate}
          setCurrentDate={setCurrentDate}
          events={events}
        />
      </div>
      <div className="w-full md:w-80 border-l border-gray-200 bg-white p-6 overflow-y-auto hidden md:block">
        <CalendarSidebar
          events={events}
          users={users}
          currentDate={currentDate}
          leaveRequests={leaveRequests}
          holidays={holidays}
          attendance={attendance}
        />
      </div>
    </div>
  );
}
