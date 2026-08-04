export type AppPage =
  | "login" | "admin-account" | "getting-started" | "setup"
  | "my-space" | "team" | "organization"
  | "attendance" | "leave" | "tasks"
  | "documents" | "settings" | "support"
  | "employee-add" | "employee-profile"
  | "profile" | "notifications" | "manage-account";

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  dept: string;
  designation: string;
  status: string;
  shift: string;
  joinDate: string;
  manager: string;
  branch: string;
  empType: string;
  initials: string;
  attendance: number;
  color: string;
}
