export type TaskStatus = "Todo" | "In Progress" | "Overdue" | "Done" | "Archived";

export interface TaskAttachment {
  id: string;
  name: string;
  size: string;
  type: "image" | "file";
  url?: string;
}

export interface TaskComment {
  id: string;
  authorId: string;
  authorName: string;
  authorInitials: string;
  authorColor?: string;
  text: string;
  createdAt: string;
}

export type TaskActivityType =
  | "create"
  | "created"
  | "status_change"
  | "assignee_change"
  | "due_date_change"
  | "label_add"
  | "label_remove"
  | "attachment_add"
  | "attachment_remove"
  | "time_log"
  | "comment_add";

export interface TaskActivity {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  userInitials: string;
  type: TaskActivityType;
  details: string;
  createdAt: string;
}

export interface WorkLog {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  userInitials: string;
  timeSpentMinutes: number;
  remainingMinutes: number;
  startedAt: string; // ISO string
  description?: string;
  createdAt: string;
}

export interface TeamTask {
  id: string;
  key?: string;
  title: string;
  description?: string;
  assignee: string; // compatibility (display name)
  assigneeId?: string;
  assigneeName?: string;
  assigneeEmail?: string;
  reporterId: string;
  reporterName: string;
  dept: string; // compatibility
  priority: "High" | "Medium" | "Low";
  due: string; // compatibility
  dueDate: string;
  startDate?: string;
  status: TaskStatus;
  isBlocked?: boolean;
  blockedReason?: string;
  isFlagged?: boolean;
  daysInStatus?: number;
  statusHistory?: {
    Todo?: number;
    "In Progress"?: number;
    Review?: number;
    Done?: number;
  };
  labels?: string[];
  attachments?: TaskAttachment[];
  comments?: TaskComment[];
  workLogs?: WorkLog[];
  activity?: TaskActivity[];
  originalEstimateMinutes?: number;
  totalLoggedMinutes?: number;
  remainingEstimateMinutes?: number;
  createdAt?: string;
  updatedAt?: string;
}
