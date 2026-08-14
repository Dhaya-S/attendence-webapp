import React from "react";
import { format, isAfter, isToday, addDays, startOfDay } from "date-fns";
import { Users, CalendarDays, Gift, Award, CalendarIcon, Info } from "lucide-react";
import { CalendarEvent } from "./calendar-tab";

interface CalendarSidebarProps {
  events: CalendarEvent[];
  users: any[];
  currentDate: Date;
  leaveRequests: any[];
  holidays: any[];
  attendance: any[];
}

export function CalendarSidebar({
  events,
  users,
  currentDate,
  leaveRequests,
  holidays,
  attendance,
}: CalendarSidebarProps) {
  
  // Aggregate today's availability
  const todayStr = new Date().toLocaleDateString('en-CA');
  const todaysAttendance = attendance.filter(a => a.date === todayStr);
  
  let present = 0;
  let wfh = 0;
  let absent = 0;
  let onLeave = 0;
  
  todaysAttendance.forEach(a => {
    if (a.status === "Present") present++;
    else if (a.status === "WFH") wfh++;
    else if (a.status === "Absent") absent++;
    else if (a.status === "On Leave") onLeave++;
  });
  
  // Actually, leaves are also in leaveRequests, but attendance overrides or supplements.
  // We'll trust attendance counts for today if they exist.

  // 2. Upcoming Leave
  // Leaves that start today or in the future
  const now = startOfDay(new Date());
  const upcomingLeaves = leaveRequests
    .filter(lv => lv.status === "Approved")
    .filter(lv => {
      const d = lv.startDate ? new Date(lv.startDate) : lv.date ? new Date(lv.date) : null;
      return d && d >= now;
    })
    .sort((a, b) => {
      const da = a.startDate ? new Date(a.startDate) : new Date(a.date);
      const db = b.startDate ? new Date(b.startDate) : new Date(b.date);
      return da.getTime() - db.getTime();
    })
    .slice(0, 5); // top 5

  // 3. Birthdays
  // Filter events for birthdays from today onwards
  const bdays = events
    .filter(e => e.type === "birthday")
    .filter(e => new Date(e.date) >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  // 4. Work Anniversaries
  const anniversaries = events
    .filter(e => e.type === "anniversary")
    .filter(e => new Date(e.date) >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);
    
  // 5. Upcoming Holidays
  const upcomingHolidays = holidays
    .filter(h => h.date && new Date(h.date) >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);
    
  const pendingLeaves = leaveRequests.filter(lv => lv.status === "Pending").length;

  const renderDateBadge = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isToday(d)) {
      return <span className="text-orange-500 font-bold text-[10px] uppercase">Today</span>;
    }
    const tmrw = addDays(new Date(), 1);
    if (d.getDate() === tmrw.getDate() && d.getMonth() === tmrw.getMonth() && d.getFullYear() === tmrw.getFullYear()) {
      return <span className="text-orange-500 font-bold text-[10px] uppercase">Tomorrow</span>;
    }
    return <span className="text-purple-600 font-bold text-[10px]">{format(d, "MMM d")}</span>;
  };

  return (
    <div className="space-y-8 pb-10">
      
      {/* AVAILABILITY */}
      <div>
        <h3 className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 tracking-wider uppercase mb-3">
          <Users size={14} /> Team Availability
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#EAFDF3] rounded-xl p-3 flex flex-col items-center justify-center border border-[#CCFBE1]">
            <div className="text-2xl font-bold text-[#16A34A]">{present}</div>
            <div className="text-[9px] font-bold text-[#16A34A] tracking-widest uppercase">Present</div>
          </div>
          <div className="bg-[#EFF6FF] rounded-xl p-3 flex flex-col items-center justify-center border border-[#DBEAFE]">
            <div className="text-2xl font-bold text-[#3B82F6]">{wfh}</div>
            <div className="text-[9px] font-bold text-[#3B82F6] tracking-widest uppercase">WFH</div>
          </div>
          <div className="bg-[#EEF2FF] rounded-xl p-3 flex flex-col items-center justify-center border border-[#E0E7FF]">
            <div className="text-2xl font-bold text-[#5C5CFF]">{onLeave}</div>
            <div className="text-[9px] font-bold text-[#5C5CFF] tracking-widest uppercase">Leave</div>
          </div>
          <div className="bg-[#FEF2F2] rounded-xl p-3 flex flex-col items-center justify-center border border-[#FEE2E2]">
            <div className="text-2xl font-bold text-[#EF4444]">{absent}</div>
            <div className="text-[9px] font-bold text-[#EF4444] tracking-widest uppercase">Absent</div>
          </div>
        </div>
      </div>

      {/* UPCOMING LEAVE */}
      <div>
        <h3 className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 tracking-wider uppercase mb-3">
          <CalendarDays size={14} className="text-red-400" /> Upcoming Leave
        </h3>
        {upcomingLeaves.length > 0 ? (
          <div className="space-y-2">
            {upcomingLeaves.map(lv => (
              <div key={lv.id} className="flex items-center justify-between bg-gray-50/80 border border-gray-100 rounded-xl p-3">
                <span className="text-xs font-semibold text-gray-800">{lv.applicantName || lv.applicantEmail}</span>
                <span className="text-red-500 font-bold text-[10px]">
                  {lv.startDate ? `${format(new Date(lv.startDate), "MMM d")} - ${format(new Date(lv.endDate || lv.startDate), "MMM d")}` : format(new Date(lv.date), "MMM d")}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400 italic">No upcoming leaves</p>
        )}
      </div>

      {/* BIRTHDAYS */}
      <div>
        <h3 className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 tracking-wider uppercase mb-3">
          <Gift size={14} className="text-orange-400" /> Birthdays
        </h3>
        {bdays.length > 0 ? (
          <div className="space-y-2">
            {bdays.map(b => (
              <div key={b.id} className="flex items-center justify-between bg-gray-50/80 border border-gray-100 rounded-xl p-3">
                <span className="text-xs font-semibold text-gray-800">{b.title.replace("'s Birthday 🎂", "")}</span>
                <div className="flex items-center gap-1">
                  {renderDateBadge(b.date)}
                  {isToday(new Date(b.date)) && <span>🎂</span>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400 italic">No upcoming birthdays</p>
        )}
      </div>

      {/* WORK ANNIVERSARIES */}
      <div>
        <h3 className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 tracking-wider uppercase mb-3">
          <Award size={14} className="text-teal-400" /> Work Anniversaries
        </h3>
        {anniversaries.length > 0 ? (
          <div className="space-y-2">
            {anniversaries.map(a => (
              <div key={a.id} className="flex items-center justify-between bg-gray-50/80 border border-gray-100 rounded-xl p-3">
                <span className="text-xs font-semibold text-gray-800">{a.title.split(" · ")[0]}</span>
                <span className="text-teal-600 font-bold text-[10px]">
                  {a.title.match(/(\d+ Years)/)?.[0] || "Anniversary"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400 italic">No upcoming anniversaries</p>
        )}
      </div>

      {/* UPCOMING HOLIDAYS */}
      <div>
        <h3 className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 tracking-wider uppercase mb-3">
          <CalendarIcon size={14} className="text-purple-400" /> Upcoming Holidays
        </h3>
        {upcomingHolidays.length > 0 ? (
          <div className="space-y-2">
            {upcomingHolidays.map(h => (
              <div key={h.id} className="flex items-center justify-between bg-gray-50/80 border border-gray-100 rounded-xl p-3">
                <span className="text-xs font-semibold text-gray-800">{h.name}</span>
                <span className="text-purple-600 font-bold text-[10px]">
                  {format(new Date(h.date), "MMM d")}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400 italic">No upcoming holidays</p>
        )}
      </div>

      {/* QUICK INSIGHTS */}
      <div>
        <h3 className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 tracking-wider uppercase mb-3">
          <Info size={14} className="text-gray-400" /> Quick Insights
        </h3>
        <div className="space-y-3 mt-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <span className="text-xs text-gray-600 font-medium">People Available</span>
            <span className="text-xs font-bold text-gray-900">{present + wfh}</span>
          </div>
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <span className="text-xs text-gray-600 font-medium">Pending Leave</span>
            <span className="text-xs font-bold text-gray-900">{pendingLeaves}</span>
          </div>
        </div>
      </div>

    </div>
  );
}
