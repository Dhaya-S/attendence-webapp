import React from "react";
import { format, addMonths, subMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from "date-fns";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { CalendarEvent } from "./calendar-tab";
import { Btn } from "@/shared/components";
import { cn } from "@/shared/utils";

interface CalendarGridProps {
  currentDate: Date;
  setCurrentDate: React.Dispatch<React.SetStateAction<Date>>;
  events: CalendarEvent[];
}

export function CalendarGrid({ currentDate, setCurrentDate, events }: CalendarGridProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  // Week starts on Monday (1)
  const startDate = startOfWeek(monthStart, { weekStarts: 1 });
  const endDate = endOfWeek(monthEnd, { weekStarts: 1 });

  const dateFormat = "d";
  const days = eachDayOfInterval({
    start: startDate,
    end: endDate
  });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-gray-200">
        <div className="flex items-center gap-2">
          <button 
            onClick={goToToday}
            className="px-4 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded hover:bg-gray-50"
          >
            Today
          </button>
          <div className="flex border border-gray-200 rounded overflow-hidden bg-white">
            <button onClick={prevMonth} className="px-2 py-1.5 hover:bg-gray-50 text-gray-500 border-r border-gray-200">
              <ChevronLeft size={16} />
            </button>
            <button onClick={nextMonth} className="px-2 py-1.5 hover:bg-gray-50 text-gray-500">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <h2 className="text-sm font-bold text-gray-900 tracking-widest uppercase">
          {format(currentDate, "MMM yyyy")}
        </h2>

        <div>
          <button className="flex items-center gap-2 px-4 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded hover:bg-gray-50">
            Month
            <ChevronDown size={14} />
          </button>
        </div>
      </div>

      {/* Weekdays */}
      <div className="grid grid-cols-7 border-b border-gray-200 bg-white">
        {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((day) => (
          <div key={day} className="py-3 text-center text-[10px] font-bold text-gray-400 tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className={cn(
        "flex-1 grid grid-cols-7 bg-gray-100 gap-[1px]",
        days.length / 7 === 6 ? "grid-rows-6" : "grid-rows-5"
      )}>
        {days.map((day, i) => {
          const dayStr = format(day, "yyyy-MM-dd");
          const dayEvents = events.filter((e) => e.date === dayStr);
          const isCurrMonth = isSameMonth(day, monthStart);
          const isDayToday = isToday(day);

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "bg-white p-2 flex flex-col gap-1 overflow-y-auto",
                !isCurrMonth && "bg-gray-50/50 opacity-60"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={cn(
                  "text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full",
                  isDayToday ? "bg-[#5C5CFF] text-white" : "text-gray-700"
                )}>
                  {format(day, dateFormat)}
                </span>
                {isDayToday && (
                  <span className="text-[9px] font-bold text-[#5C5CFF] tracking-wider uppercase bg-[#EEF2FF] px-1.5 py-0.5 rounded">
                    Today
                  </span>
                )}
              </div>
              
              <div className="flex flex-col gap-1 mt-1 space-y-1">
                {dayEvents.map((evt, idx) => (
                  <div
                    key={`${evt.id}-${idx}`}
                    className={cn(
                      "px-2 py-1 text-[10px] font-semibold rounded flex items-start gap-1.5",
                      evt.color
                    )}
                    title={evt.title}
                  >
                    <span className={cn(
                      "w-1.5 h-1.5 rounded-full shrink-0 mt-[3px]",
                      evt.type === "anniversary" ? "bg-teal-500" :
                      evt.type === "birthday" ? "bg-pink-500" :
                      evt.type === "wfh" ? "bg-blue-500" :
                      evt.type === "leave" ? "bg-purple-500" :
                      evt.type === "holiday" ? "bg-purple-500" :
                      evt.type === "present" ? "bg-green-500" :
                      evt.type === "task" ? "bg-orange-500" :
                      "bg-gray-400"
                    )} />
                    <span className="whitespace-normal leading-tight">{evt.title}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
