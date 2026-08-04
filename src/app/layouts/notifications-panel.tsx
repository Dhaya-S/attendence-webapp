import React from "react";
import { CalendarDays, Clock, UserPlus, CheckCircle, X } from "lucide-react";
import { AppPage } from "@/shared/types";
import { cn } from "@/shared/utils";
import { NOTIFICATIONS } from "@/shared/constants/notifications";

export function NotificationsPanel({
  onClose,
  navigate,
  onViewAll,
}: {
  onClose: () => void;
  navigate: (p: AppPage) => void;
  onViewAll: () => void;
}) {
  const iconMap: Record<string, { icon: any; color: string }> = {
    leave: { icon: CalendarDays, color: "#F59E0B" },
    attendance: { icon: Clock, color: "#5C5CFF" },
    employee: { icon: UserPlus, color: "#3B82F6" },
    system: { icon: CheckCircle, color: "#6B7280" },
  };

  return (
    <div
      className="absolute right-4 top-14 w-80 bg-white rounded-xl border border-gray-200 shadow-xl z-50"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-800">Notifications</h3>
        <div className="flex gap-2">
          <button className="text-xs text-[#5C5CFF] hover:underline">
            Mark all read
          </button>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        </div>
      </div>
      <div className="max-h-80 overflow-auto divide-y divide-gray-100">
        {NOTIFICATIONS.map((n) => {
          const { icon: Icon, color } = iconMap[n.type] || iconMap.system;
          return (
            <button
              key={n.id}
              onClick={() => {
                navigate(n.action);
                onClose();
              }}
              className={cn(
                "w-full flex gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors",
                !n.read && "bg-[#EEF2FF]/40"
              )}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: color + "18" }}
              >
                <Icon size={14} style={{ color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-gray-800">{n.title}</p>
                  {!n.read && (
                    <div className="w-1.5 h-1.5 bg-[#5C5CFF] rounded-full flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5 truncate">
                  {n.message}
                </p>
                <p className="text-[10px] text-gray-400 mt-1">{n.time}</p>
              </div>
            </button>
          );
        })}
      </div>
      <div className="px-4 py-3 border-t border-gray-200 text-center">
        <button
          onClick={onViewAll}
          className="text-xs text-[#5C5CFF] hover:underline font-medium"
        >
          View all notifications
        </button>
      </div>
    </div>
  );
}
