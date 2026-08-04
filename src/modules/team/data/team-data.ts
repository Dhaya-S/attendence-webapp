import { FeedPost } from "../types";
import { EMP_COLORS } from "@/shared/constants/colors";

export const INITIAL_POSTS: FeedPost[] = [
  {
    id: "F1",
    author: "Alex Admin",
    initials: "AA",
    color: "#5C5CFF",
    time: "2 hours ago",
    text: "Reminder: Q2 All-Hands Meeting is on July 15th at 3pm EST. Please confirm your attendance by end of week.",
    dept: "All",
    designation: "VP of HR",
    pinned: true,
    saved: false,
    priority: "High",
    resolved: false,
    reactions: [
      { emoji: "👍", users: ["Aisha Thompson", "David Chen"] },
      { emoji: "🎉", users: ["Sarah Mitchell"] },
    ],
    followers: ["Alex Admin", "Aisha Thompson"],
    attachments: [
      { name: "All-Hands_Agenda.pdf", type: "file", size: "1.2 MB" },
    ],
    comments: [
      {
        id: "FC1",
        author: "Aisha Thompson",
        initials: "AT",
        color: EMP_COLORS[4],
        text: "I will be there! I've also uploaded the preliminary HR slides for review.",
        time: "1 hour ago",
        reactions: [{ emoji: "❤️", users: ["Alex Admin"] }],
        replies: [
          {
            id: "FC1_1",
            author: "Alex Admin",
            initials: "AA",
            color: "#5C5CFF",
            text: "Thanks Aisha, the slides look great. Let's make sure James reviews them too.",
            time: "45 mins ago",
          },
        ],
      },
    ],
  },
  {
    id: "F2",
    author: "Aisha Thompson",
    initials: "AT",
    color: EMP_COLORS[4],
    time: "5 hours ago",
    text: "Updated leave policy for FY2025 has been published. Key change: employees with 3+ years tenure get 20 days annual leave. Review the document in Documents.",
    dept: "HR",
    designation: "HR Manager",
    pinned: false,
    saved: true,
    priority: "Medium",
    resolved: true,
    reactions: [
      { emoji: "👍", users: ["David Chen", "Ahmad Patel"] },
    ],
    comments: [],
  },
  {
    id: "F3",
    author: "David Chen",
    initials: "DC",
    color: EMP_COLORS[3],
    time: "Yesterday",
    text: "Welcome Yuki Tanaka to the Engineering team! Yuki joins as a Frontend Developer and will be working on the Design System initiative. Please give them a warm welcome.",
    dept: "Engineering",
    designation: "VP Engineering",
    pinned: false,
    saved: false,
    reactions: [
      { emoji: "🎉", users: ["Alex Admin", "Aisha Thompson", "Sarah Mitchell", "James O'Brien"] },
    ],
    attachments: [
      { name: "Yuki_Photo.jpg", type: "image", size: "2.4 MB" },
    ],
    comments: [
      {
        id: "FC2",
        author: "Sarah Mitchell",
        initials: "SM",
        color: EMP_COLORS[1],
        text: "Welcome Yuki! Let's schedule some onboarding time soon.",
        time: "Yesterday",
      },
    ],
  },
];

export const TEAM_TASKS = [
  { id: "TT1", title: "Review Sarah's leave documentation", assignee: "Alex Admin", dept: "HR", priority: "High", due: "Jul 3", status: "In Progress" },
  { id: "TT2", title: "Update onboarding checklist for Q3", assignee: "Aisha Thompson", dept: "HR", priority: "Medium", due: "Jul 8", status: "Todo" },
  { id: "TT3", title: "Schedule Q3 performance reviews", assignee: "David Chen", dept: "Engineering", priority: "Medium", due: "Jul 15", status: "Todo" },
  { id: "TT4", title: "Send reminder – policy acknowledgement", assignee: "Alex Admin", dept: "HR", priority: "Low", due: "Jun 30", status: "Overdue" },
  { id: "TT5", title: "Configure biometric for Chicago office", assignee: "Ahmad Patel", dept: "Operations", priority: "High", due: "Jul 5", status: "In Progress" },
  { id: "TT6", title: "Complete exit interview – Ahmad Patel", assignee: "Aisha Thompson", dept: "HR", priority: "High", due: "Jun 28", status: "Done" },
];

export const TEAM_CELEBRATIONS = [
  { type: "Birthday", employee: "Sarah Mitchell", detail: "Turning 32 today 🎂", date: "Today", color: "#EC4899" },
  { type: "Anniversary", employee: "Marcus Johnson", detail: "4 years at Acme 🎉", date: "Jul 3", color: "#8B5CF6" },
  { type: "New Joiner", employee: "Yuki Tanaka", detail: "Starting Jul 8 · Engineering", date: "Jul 8", color: "#22C55E" },
];

