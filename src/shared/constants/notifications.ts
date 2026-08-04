import { AppPage } from "@/shared/types";

export const NOTIFICATIONS = [
  { id: 1, type: "leave", title: "Leave Request", message: "Sarah Mitchell applied for 5 days annual leave", time: "10 min ago", read: false, action: "leave" as AppPage },
  { id: 2, type: "attendance", title: "Missing Punch", message: "14 employees have missing check-out today", time: "1 hr ago", read: false, action: "attendance" as AppPage },
  { id: 3, type: "employee", title: "New Joiner", message: "Yuki Tanaka joins Engineering team today", time: "3 hr ago", read: true, action: "organization" as AppPage },
  { id: 4, type: "leave", title: "Leave Approved", message: "Marcus Johnson's sick leave has been approved", time: "5 hr ago", read: true, action: "leave" as AppPage },
  { id: 5, type: "system", title: "System Update", message: "Attendance biometric sync completed successfully", time: "1 day ago", read: true, action: "attendance" as AppPage },
];
