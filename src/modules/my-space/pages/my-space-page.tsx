import React, { useState, useEffect, useMemo } from "react";
import { db, auth } from "@/shared/utils/firebase";
import { doc, getDoc, setDoc, collection, getDocs, onSnapshot } from "firebase/firestore";
import {
  Plus, Check, X, ChevronLeft, ChevronRight, Download, Upload,
  UserCheck, UserX, CalendarDays, CheckCircle, AlertCircle,
  GitBranch, Shield, Megaphone, Clock, FileText,
  Edit, Eye, Users, UserPlus, Bell, Pin,
  Bookmark, Share2, ThumbsUp, Send,
  MoreHorizontal, Printer, Search, Filter,
  ChevronDown, RefreshCw, Trash2, CheckSquare,
  CornerDownRight, SortAsc, MessageSquare,
  TrendingUp, TrendingDown, AlertTriangle, Activity,
  ArrowUpRight, ArrowDownRight, XCircle, Sliders, MapPin
} from "lucide-react";
import {
  BarChart as RBarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area, LineChart as RLineChart, Line,
  PieChart, Pie, Legend
} from "recharts";
import { AppPage } from "@/shared/types";
import { cn, fmtDate, getDistance } from "@/shared/utils";
import { GoogleMap, useJsApiLoader, Marker, Circle } from "@react-google-maps/api";
import { EMP_COLORS } from "@/shared/constants/colors";
import { LEAVE_REQUESTS } from "@/modules/leave/data/leave-requests";
import { Avt, StatusBadge, Btn, Modal, SelectField, InputField, Drawer } from "@/shared/components";
import { useAuth } from "@/shared/context/AuthContext";
import { TasksPage } from "@/modules/tasks";

// ── Interfaces ────────────────────────────────────────────────────────────────
interface AppComment {
  id: string;
  parentId: string | null;
  author: string;
  isOwn: boolean;
  text: string;
  timestamp: number;
  edited: boolean;
}

// ── Static Data ───────────────────────────────────────────────────────────────
const GLOBAL_CAL_FILTERS_DEF = [
  { label: "Attendance", color: "#22C55E" },
  { label: "WFH", color: "#3B82F6" },
  { label: "Approved Leave", color: "#5C5CFF" },
  { label: "Holiday", color: "#EF4444" },
  { label: "Birthday", color: "#EC4899" },
  { label: "Work Anniversary", color: "#8B5CF6" },
  { label: "Company Event", color: "#F59E0B" },
  { label: "Meeting", color: "#06B6D4" },
  { label: "Training", color: "#F97316" },
  { label: "Personal", color: "#6B7280" },
  { label: "Shift", color: "#14B8A6" },
];

const GLOBAL_EVENTS = [
  { id: "GE1",  day: 1,  label: "Checked in · 09:02 AM",           type: "Attendance",     color: "#22C55E" },
  { id: "GE2",  day: 4,  label: "Independence Day",                 type: "Holiday",        color: "#EF4444" },
  { id: "GE3",  day: 5,  label: "My Annual Leave",                  type: "Approved Leave", color: "#5C5CFF" },
  { id: "GE4",  day: 6,  label: "My Annual Leave",                  type: "Approved Leave", color: "#5C5CFF" },
  { id: "GE5",  day: 7,  label: "My Annual Leave",                  type: "Approved Leave", color: "#5C5CFF" },
  { id: "GE6",  day: 8,  label: "My Annual Leave",                  type: "Approved Leave", color: "#5C5CFF" },
  { id: "GE7",  day: 9,  label: "My Annual Leave",                  type: "Approved Leave", color: "#5C5CFF" },
  { id: "GE8",  day: 24, label: "Work From Home",                   type: "WFH",            color: "#3B82F6" },
  { id: "GE9",  day: 12, label: "Priya Sharma's Birthday 🎂",       type: "Birthday",       color: "#EC4899" },
  { id: "GE10", day: 22, label: "Robert Kim · 3yr Anniversary",     type: "Work Anniversary", color: "#8B5CF6" },
  { id: "GE11", day: 15, label: "Q2 All-Hands · 3:00 PM",          type: "Company Event",  color: "#F59E0B" },
  { id: "GE12", day: 10, label: "1:1 with David Chen · 2PM",       type: "Meeting",        color: "#06B6D4" },
  { id: "GE13", day: 17, label: "Sprint Review · 10AM",            type: "Meeting",        color: "#06B6D4" },
  { id: "GE14", day: 25, label: "Leadership Training · 9AM",       type: "Training",       color: "#F97316" },
  { id: "GE15", day: 20, label: "Doctor Appointment",              type: "Personal",       color: "#6B7280" },
  { id: "GE16", day: 1,  label: "General Shift · 09:00–18:00",     type: "Shift",          color: "#14B8A6" },
  { id: "GE17", day: 2,  label: "General Shift · 09:00–18:00",     type: "Shift",          color: "#14B8A6" },
  { id: "GE18", day: 3,  label: "General Shift · 09:00–18:00",     type: "Shift",          color: "#14B8A6" },
  { id: "GE19", day: 29, label: "James O'Brien Leave starts",      type: "Approved Leave", color: "#5C5CFF" },
];

const MONTHLY_ATT_DATA = [
  { day:"1",  h:9.2, s:"Present" }, { day:"2",  h:8.7, s:"Late"    },
  { day:"3",  h:9.1, s:"Present" }, { day:"4",  h:0,   s:"Holiday" },
  { day:"5",  h:9.0, s:"WFH"    }, { day:"6",  h:0,   s:"Weekend" },
  { day:"7",  h:0,   s:"Weekend" }, { day:"8",  h:9.2, s:"Present" },
  { day:"9",  h:8.9, s:"Present" }, { day:"10", h:9.1, s:"Present" },
  { day:"11", h:8.6, s:"Late"   }, { day:"12", h:9.0, s:"Present" },
  { day:"13", h:0,   s:"Weekend" }, { day:"14", h:0,   s:"Weekend" },
  { day:"15", h:8.5, s:"Present" }, { day:"16", h:9.0, s:"Present" },
  { day:"17", h:9.3, s:"Present" }, { day:"18", h:0,   s:"Leave"   },
  { day:"19", h:0,   s:"Leave"   }, { day:"20", h:0,   s:"Weekend" },
  { day:"21", h:0,   s:"Weekend" }, { day:"22", h:9.1, s:"Present" },
  { day:"23", h:8.8, s:"Present" }, { day:"24", h:9.0, s:"WFH"    },
  { day:"25", h:9.0, s:"Present" }, { day:"26", h:8.9, s:"Present" },
  { day:"27", h:0,   s:"Weekend" }, { day:"28", h:0,   s:"Weekend" },
  { day:"29", h:8.2, s:"Present" }, { day:"30", h:9.1, s:"Present" },
  { day:"31", h:8.8, s:"Present" },
];

const WEEKLY_ATT_DATA = [
  { day:"Mon", h:9.0, s:"WFH"     },
  { day:"Tue", h:9.1, s:"Present" },
  { day:"Wed", h:8.9, s:"Present" },
  { day:"Thu", h:9.0, s:"Present" },
  { day:"Fri", h:9.2, s:"Present" },
  { day:"Sat", h:0,   s:"Weekend" },
  { day:"Sun", h:0,   s:"Weekend" },
];

function barFill(s: string, h: number): string {
  if (s === "Holiday" || s === "Weekend" || s === "Off") return "#E5E7EB";
  if (s === "Leave")  return "#C4B5FD";
  if (s === "WFH")    return "#93C5FD";
  if (s === "Late")   return "#FCD34D";
  if (h >= 9)         return "#5C5CFF";
  return "#A5B4FC";
}

function fmtTs(ts: number): string {
  const d = Date.now() - ts;
  if (d < 60000)    return "Just now";
  if (d < 3600000)  return `${Math.floor(d / 60000)}m ago`;
  if (d < 86400000) return `${Math.floor(d / 3600000)}h ago`;
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const parseTimeToMinutes = (timeStr: string): number => {
  if (!timeStr || timeStr === "—") return 0;
  const match = timeStr.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const ampm = match[3].toUpperCase();
  if (ampm === "PM" && hours !== 12) hours += 12;
  if (ampm === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

const getDaysInMonth = (year: number, month: number) => {
  const date = new Date(year, month, 1);
  const days = [];
  const startDay = date.getDay();
  for (let i = 0; i < startDay; i++) {
    days.push("");
  }
  const numDays = new Date(year, month + 1, 0).getDate();
  for (let i = 1; i <= numDays; i++) {
    days.push(String(i));
  }
  return days;
};

const getEventTiming = (ev: any) => {
  let start = 540;
  let end = 1080;

  if (ev.label.includes("Checked In:")) {
    const timeStr = ev.label.replace("Checked In: ", "");
    const min = parseTimeToMinutes(timeStr) || 540;
    start = min;
    end = min + 35;
  } else if (ev.label.includes("Checked Out:")) {
    const timeStr = ev.label.replace("Checked Out: ", "");
    const min = parseTimeToMinutes(timeStr) || 1080;
    start = min - 35;
    end = min;
  } else if (ev.label.includes("Shift") || ev.label.includes("WFH") || ev.type === "Approved Leave" || ev.type === "Holiday") {
    const match = ev.label.match(/(\d{2}:\d{2})-(\d{2}:\d{2})/);
    if (match) {
      const sParts = match[1].split(":");
      const eParts = match[2].split(":");
      start = parseInt(sParts[0], 10) * 60 + parseInt(sParts[1], 10);
      end = parseInt(eParts[0], 10) * 60 + parseInt(eParts[1], 10);
    } else {
      start = 540;
      end = 1080;
    }
  }
  return { start, end };
};

const ATT_TIMELINE = [
  { date:"Jul 1, 2024",  day:"Tue", in:"09:02 AM", out:"06:15 PM", hours:"9h 13m", status:"Present", shift:"General Shift", late:false, wfh:false, ot:"1h 13m" },
  { date:"Jun 30, 2024", day:"Mon", in:"09:18 AM", out:"06:00 PM", hours:"8h 42m", status:"Late",    shift:"General Shift", late:true,  wfh:false, ot:"0h" },
  { date:"Jun 29, 2024", day:"Sun", in:"—",        out:"—",        hours:"—",      status:"Weekend", shift:"",              late:false, wfh:false, ot:"0h" },
  { date:"Jun 28, 2024", day:"Sat", in:"—",        out:"—",        hours:"—",      status:"Weekend", shift:"",              late:false, wfh:false, ot:"0h" },
  { date:"Jun 27, 2024", day:"Fri", in:"09:00 AM", out:"06:05 PM", hours:"9h 05m", status:"Present", shift:"General Shift", late:false, wfh:false, ot:"1h 05m" },
  { date:"Jun 26, 2024", day:"Thu", in:"08:55 AM", out:"05:50 PM", hours:"8h 55m", status:"Present", shift:"General Shift", late:false, wfh:false, ot:"0h 55m" },
  { date:"Jun 25, 2024", day:"Wed", in:"09:00 AM", out:"06:00 PM", hours:"9h 00m", status:"Present", shift:"General Shift", late:false, wfh:false, ot:"1h 00m" },
  { date:"Jun 24, 2024", day:"Tue", in:"09:00 AM", out:"06:00 PM", hours:"9h 00m", status:"WFH",     shift:"General Shift", late:false, wfh:true,  ot:"1h 00m" },
  { date:"Jun 23, 2024", day:"Mon", in:"09:05 AM", out:"06:10 PM", hours:"9h 05m", status:"Present", shift:"General Shift", late:false, wfh:false, ot:"1h 05m" },
  { date:"Jun 22, 2024", day:"Sun", in:"—",        out:"—",        hours:"—",      status:"Weekend", shift:"",              late:false, wfh:false, ot:"0h" },
  { date:"Jun 21, 2024", day:"Sat", in:"—",        out:"—",        hours:"—",      status:"Weekend", shift:"",              late:false, wfh:false, ot:"0h" },
  { date:"Jun 20, 2024", day:"Fri", in:"09:00 AM", out:"06:00 PM", hours:"9h 00m", status:"Present", shift:"General Shift", late:false, wfh:false, ot:"1h 00m" },
  { date:"Jun 19, 2024", day:"Thu", in:"09:22 AM", out:"06:00 PM", hours:"8h 38m", status:"Late",    shift:"General Shift", late:true,  wfh:false, ot:"0h" },
  { date:"Jun 18, 2024", day:"Wed", in:"—",        out:"—",        hours:"—",      status:"Leave",   shift:"General Shift", late:false, wfh:false, ot:"0h" },
  { date:"Jun 17, 2024", day:"Tue", in:"09:00 AM", out:"06:00 PM", hours:"9h 00m", status:"Present", shift:"General Shift", late:false, wfh:false, ot:"1h 00m" },
];

const MY_LEAVE_HIST = [
  { id:"L1", type:"Annual Leave", from:"Mar 15", to:"Mar 22", days:6, status:"Approved", applied:"Mar 10" },
  { id:"L2", type:"Sick Leave",   from:"Feb 5",  to:"Feb 6",  days:2, status:"Approved", applied:"Feb 5" },
  { id:"L3", type:"Casual Leave", from:"Jan 2",  to:"Jan 2",  days:1, status:"Approved", applied:"Dec 29" },
];

const APPROVAL_ITEMS_DEFAULT = [
  { id:"A1", type:"Leave",      employee:"Sarah Mitchell", dept:"Engineering", detail:"Annual Leave · 5 days · Jul 5–9",          applied:"Jun 28", status:"Pending",  leaveType:"Annual Leave",          dateRange:"Jul 5 – Jul 9, 2024",    days:"5 days", reason:"Family vacation planned well in advance." },
  { id:"A2", type:"Leave",      employee:"Yuki Tanaka",    dept:"Engineering", detail:"Casual Leave · 1 day · Jul 4",             applied:"Jul 2",  status:"Pending",  leaveType:"Casual Leave",          dateRange:"Jul 4, 2024",             days:"1 day",  reason:"Personal work appointment." },
  { id:"A3", type:"Leave",      employee:"Lisa Nakamura",  dept:"Design",      detail:"Annual Leave · 6 days · Jul 15–22",        applied:"Jul 1",  status:"Pending",  leaveType:"Annual Leave",          dateRange:"Jul 15 – Jul 22, 2024",   days:"6 days", reason:"Summer holiday trip." },
  { id:"A4", type:"Attendance", employee:"Marcus Johnson", dept:"Product",     detail:"Missing check-out · Jul 1",                applied:"Jul 1",  status:"Pending",  leaveType:"Attendance Correction", dateRange:"Jul 1, 2024",             days:"—",      reason:"Was working from client site and forgot to check out." },
  { id:"A5", type:"Attendance", employee:"James O'Brien",  dept:"Sales",       detail:"Late arrival correction · Jun 30",         applied:"Jun 30", status:"Pending",  leaveType:"Attendance Correction", dateRange:"Jun 30, 2024",            days:"—",      reason:"Train delay due to signal failure." },
  { id:"A6", type:"Shift",      employee:"Priya Sharma",   dept:"Design",      detail:"Shift change · General → Morning",         applied:"Jun 29", status:"Pending",  leaveType:"Shift Change",          dateRange:"Jul 1, 2024 onwards",     days:"Permanent", reason:"Need to pick up kids from school in the evenings." },
  { id:"A7", type:"Department", employee:"Robert Kim",     dept:"Finance",     detail:"Transfer request · Finance → Operations",  applied:"Jun 28", status:"Pending",  leaveType:"Department Transfer",   dateRange:"Aug 1, 2024",             days:"—",      reason:"Interested in operations management career path." },
  { id:"A8", type:"Leave",      employee:"Marcus Johnson", dept:"Product",     detail:"Sick Leave · 2 days · Jun 30",             applied:"Jun 28", status:"Approved", leaveType:"Sick Leave",            dateRange:"Jun 30 – Jul 1, 2024",    days:"2 days", reason:"Medical appointment." },
  { id:"A9", type:"Leave",      employee:"Robert Kim",     dept:"Finance",     detail:"Sick Leave · 2 days · Jul 1",              applied:"Jun 28", status:"Rejected", leaveType:"Sick Leave",            dateRange:"Jul 1 – Jul 2, 2024",     days:"2 days", reason:"Fever and fatigue." },
];

const ANNOUNCEMENTS_DATA: any[] = [];

const UPCOMING_EVENTS = [
  { date:"Jul 15", label:"Q2 All-Hands Meeting",              time:"3:00 PM EST", type:"Event",   color:"#5C5CFF" },
  { date:"Jul 20", label:"Performance Review Cycle Opens",     time:"All Day",     type:"HR",      color:"#F59E0B" },
  { date:"Jul 31", label:"Leave Policy Acknowledgment Deadline", time:"EOD",       type:"Policy",  color:"#EF4444" },
  { date:"Aug 1",  label:"Wellness Program Launches",          time:"All Day",     type:"Benefits",color:"#22C55E" },
];

const ATT_CAL_FILTERS_DEFAULT = ["Attendance","WFH","Leave","Holiday","Weekend","Shift"];

const TEAM_ATTENDANCE = [
  {id:"TE1",name:"Sarah Mitchell", dept:"Engineering",initials:"SM",color:"#22C55E",  checkIn:"09:00 AM",checkOut:"06:02 PM",hours:"9h 02m",status:"Present",shift:"General",location:"New York HQ"},
  {id:"TE2",name:"Marcus Johnson",  dept:"Product",    initials:"MJ",color:"#F59E0B",  checkIn:"09:32 AM",checkOut:"—",       hours:"—",     status:"Late",   shift:"General",location:"New York HQ"},
  {id:"TE3",name:"Yuki Tanaka",     dept:"Engineering",initials:"YT",color:"#5C5CFF",  checkIn:"—",       checkOut:"—",       hours:"—",     status:"WFH",    shift:"General",location:"Remote"},
  {id:"TE4",name:"James O'Brien",   dept:"Sales",      initials:"JO",color:"#EF4444",  checkIn:"—",       checkOut:"—",       hours:"—",     status:"Leave",  shift:"General",location:"—"},
  {id:"TE5",name:"Priya Sharma",    dept:"Design",     initials:"PS",color:"#EC4899",  checkIn:"08:58 AM",checkOut:"06:00 PM",hours:"9h 02m",status:"Present",shift:"General",location:"New York HQ"},
  {id:"TE6",name:"Robert Kim",      dept:"Finance",    initials:"RK",color:"#8B5CF6",  checkIn:"09:01 AM",checkOut:"—",       hours:"5h 32m",status:"Present",shift:"General",location:"New York HQ"},
  {id:"TE7",name:"Lisa Nakamura",   dept:"Design",     initials:"LN",color:"#5C5CFF",  checkIn:"—",       checkOut:"—",       hours:"—",     status:"Absent", shift:"General",location:"—"},
  {id:"TE8",name:"David Park",      dept:"Engineering",initials:"DP",color:"#06B6D4",  checkIn:"09:03 AM",checkOut:"06:05 PM",hours:"9h 02m",status:"Present",shift:"General",location:"New York HQ"},
  {id:"TE9",name:"Aisha Thompson",  dept:"HR",         initials:"AT",color:"#22C55E",  checkIn:"08:45 AM",checkOut:"06:00 PM",hours:"9h 15m",status:"Present",shift:"General",location:"New York HQ"},
  {id:"TE10",name:"Carlos Rivera",  dept:"Operations", initials:"CR",color:"#F97316", checkIn:"09:00 AM",checkOut:"—",       hours:"5h 30m",status:"Present",shift:"General",location:"New York HQ"},
];

const ATT_EXCEPTIONS_DATA = [
  {id:"EX1",employee:"Marcus Johnson", dept:"Product",    initials:"MJ",color:"#F59E0B",date:"Jul 1",  issue:"Missing Check-out",                 shift:"General (09:00–18:00)",status:"Pending",  hr:"Aisha Thompson",resolution:"—"},
  {id:"EX2",employee:"James O'Brien",  dept:"Sales",      initials:"JO",color:"#EF4444",date:"Jun 30", issue:"Late Arrival",                      shift:"General (09:00–18:00)",status:"Resolved", hr:"Aisha Thompson",resolution:"Accepted – Train delay"},
  {id:"EX3",employee:"Yuki Tanaka",    dept:"Engineering",initials:"YT",color:"#5C5CFF",date:"Jun 28", issue:"Missed Check-in",                   shift:"General (09:00–18:00)",status:"Pending",  hr:"Aisha Thompson",resolution:"—"},
  {id:"EX4",employee:"Priya Sharma",   dept:"Design",     initials:"PS",color:"#EC4899",date:"Jun 27", issue:"Early Exit",                        shift:"General (09:00–18:00)",status:"Pending",  hr:"Aisha Thompson",resolution:"—"},
  {id:"EX5",employee:"Sarah Mitchell", dept:"Engineering",initials:"SM",color:"#22C55E",date:"Jun 25", issue:"Shift Violation",                   shift:"General (09:00–18:00)",status:"Resolved", hr:"Aisha Thompson",resolution:"Shift change approved"},
  {id:"EX6",employee:"Robert Kim",     dept:"Finance",    initials:"RK",color:"#8B5CF6",date:"Jun 24", issue:"Attendance Regularization Pending", shift:"General (09:00–18:00)",status:"Pending",  hr:"Jennifer Walsh", resolution:"—"},
];

const ATT_DAILY_DATA = [
  {day:"Mon 6/24",present:87,late:8,absent:5},
  {day:"Tue 6/25",present:91,late:5,absent:4},
  {day:"Wed 6/26",present:85,late:9,absent:6},
  {day:"Thu 6/27",present:88,late:7,absent:5},
  {day:"Fri 6/28",present:90,late:6,absent:4},
  {day:"Mon 7/1", present:86,late:8,absent:6},
  {day:"Tue 7/2", present:89,late:7,absent:4},
];

const ATT_YEAR_DATA = [
  {month:"Jan",rate:91,wfh:12,late:6,ot:18,absent:9},
  {month:"Feb",rate:89,wfh:15,late:8,ot:22,absent:11},
  {month:"Mar",rate:93,wfh:18,late:5,ot:16,absent:7},
  {month:"Apr",rate:87,wfh:20,late:9,ot:14,absent:13},
  {month:"May",rate:92,wfh:22,late:6,ot:20,absent:8},
  {month:"Jun",rate:90,wfh:19,late:7,ot:24,absent:10},
  {month:"Jul",rate:94,wfh:25,late:4,ot:19,absent:6},
];

const ATT_ISSUES_DEFAULT = [
  {id:"ISS1",type:"Missing Check-out",    date:"Jul 1",  reason:"Was working from client site", status:"Pending",  submittedOn:"Jul 1",  comment:"Forgot to check out before leaving",rejectNote:""},
  {id:"ISS2",type:"Late Arrival",         date:"Jun 30", reason:"Train delay – signal failure",  status:"Approved", submittedOn:"Jun 30", comment:"20 min delay on Metro line B",       rejectNote:""},
  {id:"ISS3",type:"Incorrect Attendance", date:"Jun 19", reason:"System marked me absent",       status:"Rejected", submittedOn:"Jun 20", comment:"I was present all day",              rejectNote:"Biometric logs show no entry for this date."},
];

const LEAVE_TYPE_DIST = [
  {name:"Annual Leave", value:42,color:"#5C5CFF"},
  {name:"Sick Leave",   value:28,color:"#EF4444"},
  {name:"Casual Leave", value:18,color:"#22C55E"},
  {name:"Unpaid Leave", value:7, color:"#F59E0B"},
  {name:"Compensatory", value:5, color:"#8B5CF6"},
];

const LEAVE_MONTHLY_DATA = [
  {month:"Jan",leaves:24,sick:8, casual:6},
  {month:"Feb",leaves:18,sick:6, casual:3},
  {month:"Mar",leaves:32,sick:10,casual:8},
  {month:"Apr",leaves:21,sick:7, casual:5},
  {month:"May",leaves:19,sick:5, casual:4},
  {month:"Jun",leaves:28,sick:9, casual:7},
  {month:"Jul",leaves:22,sick:6, casual:5},
];

const LEAVE_DEPT_DATA = [
  {dept:"Engineering",count:12,pct:18,upcoming:3},
  {dept:"Sales",      count:8, pct:12,upcoming:2},
  {dept:"HR",         count:5, pct:8, upcoming:1},
  {dept:"Design",     count:6, pct:9, upcoming:2},
  {dept:"Finance",    count:4, pct:7, upcoming:0},
  {dept:"Operations", count:3, pct:5, upcoming:1},
];

const LEAVE_ON_TODAY = [
  {name:"Sarah Mitchell",dept:"Engineering",initials:"SM",color:"#22C55E",type:"Annual Leave",range:"Jul 5–9", days:5},
  {name:"James O'Brien", dept:"Sales",      initials:"JO",color:"#EF4444",type:"Casual Leave",range:"Jul 1",   days:1},
  {name:"Lisa Nakamura", dept:"Design",     initials:"LN",color:"#5C5CFF",type:"Annual Leave",range:"Jul 1–3", days:3},
];

const MY_LEAVE_RICH = [
  {id:"L1",type:"Annual Leave",from:"Jul 5",  to:"Jul 9",  days:5,status:"Pending",  applied:"Jun 28",approver:"David Chen",   reason:"Family vacation planned well in advance.", attachment:false,comment:"",               rejectReason:""},
  {id:"L2",type:"Annual Leave",from:"Mar 15", to:"Mar 22", days:6,status:"Approved", applied:"Mar 10",approver:"David Chen",   reason:"Family trip.",                             attachment:false,comment:"Approved, enjoy!", rejectReason:""},
  {id:"L3",type:"Sick Leave",  from:"Feb 5",  to:"Feb 6",  days:2,status:"Approved", applied:"Feb 5", approver:"David Chen",   reason:"Medical appointment – doctor's note.",     attachment:true, comment:"Get well soon.",  rejectReason:""},
  {id:"L4",type:"Casual Leave",from:"Jan 2",  to:"Jan 2",  days:1,status:"Rejected", applied:"Dec 29",approver:"David Chen",   reason:"Personal work appointment.",               attachment:false,comment:"",               rejectReason:"Insufficient leave balance for this period. Please reapply after Jan 15."},
];

const GeoMap = ({ userLat, userLng, orgLat, orgLng, radius, isInside, orgName }: { userLat: any, userLng: any, orgLat: any, orgLng: any, radius: number, isInside: boolean, orgName?: string }) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""
  });

  const parsedOrgLat = typeof orgLat === "string" ? parseFloat(orgLat) : orgLat;
  const parsedOrgLng = typeof orgLng === "string" ? parseFloat(orgLng) : orgLng;
  const parsedUserLat = typeof userLat === "string" ? parseFloat(userLat) : userLat;
  const parsedUserLng = typeof userLng === "string" ? parseFloat(userLng) : userLng;

  const center = { lat: parsedOrgLat || 0, lng: parsedOrgLng || 0 };
  const userPos = { lat: parsedUserLat || 0, lng: parsedUserLng || 0 };

  // If user and office overlap exactly (e.g., testing mocked GPS), offset the office marker slightly so both are visible
  const isOverlapping = Math.abs(center.lat - userPos.lat) < 0.00005 && Math.abs(center.lng - userPos.lng) < 0.00005;
  const officeMarkerPos = isOverlapping ? { lat: center.lat, lng: center.lng - 0.0003 } : center;

  const hasUserPos = Boolean(parsedUserLat && parsedUserLng);
  const hasOrgPos = Boolean(parsedOrgLat && parsedOrgLng);

  const onLoad = React.useCallback(function callback(map: any) {
    if (hasOrgPos) {
      if (hasUserPos) {
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend(center);
        bounds.extend(userPos);
        map.fitBounds(bounds, { padding: 40 });
      } else {
        map.setCenter(center);
        map.setZoom(16);
      }
    } else if (hasUserPos) {
      map.setCenter(userPos);
      map.setZoom(16);
    }
  }, [center, userPos, hasUserPos, hasOrgPos]);

  if (!isLoaded) return <div className="w-full h-full bg-slate-50 flex items-center justify-center text-xs text-gray-500 rounded-xl border border-gray-200 shadow-inner">Loading Map...</div>;

  return (
    <GoogleMap
      mapContainerStyle={{ width: '100%', height: '100%', borderRadius: '0.75rem' }}
      center={center}
      zoom={16}
      onLoad={onLoad}
      options={{ disableDefaultUI: true, gestureHandling: 'cooperative' }}
    >
      {hasOrgPos && (
        <>
          <Circle
            center={center}
            radius={radius || 200}
            options={{
              fillColor: '#5C5CFF',
              fillOpacity: 0.1,
              strokeColor: '#5C5CFF',
              strokeOpacity: 0.8,
              strokeWeight: 2,
            }}
          />
          <Marker position={officeMarkerPos} title={orgName || "Office HQ"} icon={{ url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png" }} />
        </>
      )}
      {hasUserPos && (
        <Marker position={userPos} title="Your Location" icon={{ url: isInside ? "http://maps.google.com/mapfiles/ms/icons/green-dot.png" : "http://maps.google.com/mapfiles/ms/icons/red-dot.png" }} />
      )}
    </GoogleMap>
  );
};

// ── Component ─────────────────────────────────────────────────────────────────
export function MySpacePage({
  navigate,
  activeTab,
  hideTabs = false,
  hideAttendanceHeader = false,
  attViewProp,
  setAttViewProp,
  attPeriodProp,
  setAttPeriodProp,
  hideLeaveHeader = false,
  leaveViewProp,
  setLeaveViewProp,
  role,
}: {
  navigate: (p: AppPage) => void;
  activeTab?: string;
  hideTabs?: boolean;
  hideAttendanceHeader?: boolean;
  attViewProp?: "summary" | "timeline" | "calendar" | "issues";
  setAttViewProp?: (v: "summary" | "timeline" | "calendar" | "issues") => void;
  attPeriodProp?: "Weekly" | "Monthly" | "Yearly";
  setAttPeriodProp?: (p: "Weekly" | "Monthly" | "Yearly") => void;
  hideLeaveHeader?: boolean;
  leaveViewProp?: "Balance" | "Requests" | "Calendar" | "Analytics" | "Status";
  setLeaveViewProp?: (v: "Balance" | "Requests" | "Calendar" | "Analytics" | "Status") => void;
  role?: "admin" | "manager" | "employee" | null;
}) {
  const { user, role: authRole, companyId: authCompanyId, email: authEmail, displayName: authDisplayName, hasPermission } = useAuth();

  const userEmail = String(user?.email || authEmail || "").toLowerCase();
  const userName = authDisplayName || user?.displayName || (userEmail ? userEmail.split("@")[0] : "User");
  const userRole = String(role || authRole || "employee").toLowerCase();
  const targetCompanyId = authCompanyId || "default";

  // Calendar switcher states
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const [calYear,  setCalYear]  = useState(() => new Date().getFullYear());
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  });

  // Attendance Filter States (Defined early to avoid TDZ errors)
  const [attFMonth,      setAttFMonth]      = useState("All");
  const [attFQuarter,    setAttFQuarter]    = useState("All");
  const [attFDept,       setAttFDept]       = useState("All");
  const [attFShift,      setAttFShift]      = useState("All");
  const [attFStartDate,  setAttFStartDate]  = useState("");
  const [attFEndDate,    setAttFEndDate]    = useState("");

  // Today's Date String e.g. "2026-08-04"
  const [todayStr, setTodayStr] = useState(() => new Date().toISOString().split("T")[0]);

  // Real-time Attendance Firestore State
  const [todayAtt, setTodayAtt] = useState<any>(null);
  const [checkedIn, setCheckedIn] = useState<boolean>(false);
  const [checkInTime, setCheckInTime] = useState<string>("—");
  const [checkOutTime, setCheckOutTime] = useState<string>("—");
  const [workingTimeStr, setWorkingTimeStr] = useState<string>("0h 00m");
  const [attRecords, setAttRecords] = useState<any[]>([]);
  const [orgUsers, setOrgUsers] = useState<any[]>([]);
  const [statCounts, setStatCounts] = useState({
    present: 1,
    wfh: 0,
    leave: 0,
    late: 0,
    offline: 0,
  });

  // Attendance Issue States
  const [attIssues, setAttIssues] = useState(ATT_ISSUES_DEFAULT);
  const [showNewIssue, setShowNewIssue] = useState(false);
  const [newIssueType, setNewIssueType] = useState("Missing Check-in");
  const [newIssueDate, setNewIssueDate] = useState("");
  const [newReqCheckIn, setNewReqCheckIn] = useState("09:00 AM");
  const [newReqCheckOut, setNewReqCheckOut] = useState("06:00 PM");
  const [newIssueReason, setNewIssueReason] = useState("");
  const [newIssueCmt, setNewIssueCmt] = useState("");
  const [issueRejectId, setIssueRejectId] = useState<string|null>(null);
  const [issueRejectNote, setIssueRejectNote] = useState("");

  const [orgLeavePolicy, setOrgLeavePolicy] = useState<{ annualLeave?: string; sickLeave?: string; casualLeave?: string } | null>(null);
  const [orgData, setOrgData] = useState<any>(null);

  // Real-Time Leave Request States & Form Inputs
  const [dbLeaveRequests, setDbLeaveRequests] = useState<any[]>([]);
  const [applyLeaveType, setApplyLeaveType] = useState("Annual Leave");
  const [applyLeaveFrom, setApplyLeaveFrom] = useState(new Date().toISOString().split("T")[0]);
  const [applyLeaveTo, setApplyLeaveTo] = useState(new Date().toISOString().split("T")[0]);
  const [applyLeaveReason, setApplyLeaveReason] = useState("");
  const [isApplyingLeave, setIsApplyingLeave] = useState(false);
  const [leaveRejectModalId, setLeaveRejectModalId] = useState<string|null>(null);
  const [leaveRejectReason, setLeaveRejectReason] = useState("");

  useEffect(() => {
    if (!targetCompanyId) return;
    const orgRef = doc(db, "organizations", targetCompanyId);
    const unsub = onSnapshot(orgRef, (snap) => {
      if (snap.exists()) {
        const d = { ...snap.data() };
        if (d["----------"] && !d.locations) {
          d.locations = d["----------"];
        }
        setOrgData((prev: any) => {
          const next = { ...prev, ...d, userOverride: prev?.userOverride };
          if (prev?.userBranch && d.locations && Array.isArray(d.locations)) {
            const matched = d.locations.find((l: any) =>
              String(l.name || "").toLowerCase().trim() === String(prev.userBranch).toLowerCase().trim()
            );
            if (matched) {
              next.latitude = parseFloat(matched.latitude || matched.lat || "0");
              next.longitude = parseFloat(matched.longitude || matched.lng || "0");
              next.name = matched.name;
              if (matched.geofenceRadius || matched.radius) {
                next.geofenceRadius = parseFloat(matched.geofenceRadius || matched.radius);
              }
            }
          }
          return next;
        });
        if (d.leavePolicy) {
          setOrgLeavePolicy(d.leavePolicy);
        }
      }
    }, (err) => {
      console.warn("Error listening to organization leave policy:", err);
    });

    let userUnsub = () => {};
    if (userEmail) {
      const userRef = doc(db, "organizations", targetCompanyId, "users", userEmail);
      userUnsub = onSnapshot(userRef, (snap) => {
         if (snap.exists()) {
             const ud = snap.data();
             const branch = ud.branch || ud.location || "";
             setOrgData((prev: any) => {
               const next = { ...prev, userBranch: branch };
               if (ud.latitude || ud.lat || ud.longitude || ud.lng) {
                  next.latitude = parseFloat(ud.latitude || ud.lat);
                  next.longitude = parseFloat(ud.longitude || ud.lng);
                  next.name = ud.officeName || ud.branch || ud.name || prev?.name;
                  next.userOverride = true;
               } else if (branch && prev?.locations && Array.isArray(prev.locations)) {
                  const matched = prev.locations.find((l: any) =>
                    String(l.name || "").toLowerCase().trim() === String(branch).toLowerCase().trim()
                  );
                  if (matched) {
                    next.latitude = parseFloat(matched.latitude || matched.lat || "0");
                    next.longitude = parseFloat(matched.longitude || matched.lng || "0");
                    next.name = matched.name;
                    if (matched.geofenceRadius || matched.radius) {
                      next.geofenceRadius = parseFloat(matched.geofenceRadius || matched.radius);
                    }
                  }
               }
               return next;
             });
         }
      });
    }

    return () => {
      unsub();
      userUnsub();
    };
  }, [targetCompanyId, userEmail]);

  // Real-Time Firestore Listener on /organizations/{companyId}/leave_requests
  useEffect(() => {
    const compId = targetCompanyId && targetCompanyId !== "default" ? targetCompanyId : "default";
    const colRef = collection(db, "organizations", compId, "leave_requests");
    const unsub = onSnapshot(colRef, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setDbLeaveRequests(list);
    }, (err) => {
      console.warn("Error listening to leave requests:", err);
    });
    return () => unsub();
  }, [targetCompanyId]);

  // Strict Role-Based Visibility Filtering for Leave Requests
  // Super Admin -> targetRoles ["super_admin"]
  // HR Admin -> targetRoles ["super_admin", "hr_admin"]
  // Manager -> targetRoles ["hr_admin"]
  // Employee -> targetRoles ["manager", "hr_admin"]
  const visibleLeaveRequests = useMemo(() => {
    const list = Array.isArray(dbLeaveRequests) ? dbLeaveRequests : [];
    const normalizedRole = String(userRole || "employee").toLowerCase();
    const normalizedUserEmail = String(userEmail || "").toLowerCase();

    return list.filter((req) => {
      if (!req) return false;
      const reqEmail = String(req.applicantEmail || req.employeeEmail || "").toLowerCase();
      if (reqEmail && reqEmail === normalizedUserEmail) return true;

      const rolesArr = Array.isArray(req.targetRoles) ? req.targetRoles : [];

      if (normalizedRole === "super_admin" || normalizedRole === "admin") {
        return true;
      }
      if (normalizedRole === "hr_admin") {
        return rolesArr.includes("hr_admin") || rolesArr.includes("super_admin");
      }
      if (normalizedRole === "manager") {
        return rolesArr.includes("manager");
      }
      return false;
    });
  }, [dbLeaveRequests, userEmail, userRole]);

  // Compute Used & Remaining Leave Days from Approved Requests
  const userApprovedLeaves = useMemo(() => {
    const curEmail = String(userEmail || auth.currentUser?.email || "").toLowerCase();
    return visibleLeaveRequests.filter((r) => {
      const rEmail = String(r.applicantEmail || r.employeeEmail || "").toLowerCase();
      return rEmail === curEmail && r.status === "Approved";
    });
  }, [visibleLeaveRequests, userEmail]);

  const usedAnnual = useMemo(() => {
    return userApprovedLeaves
      .filter((r) => r.type === "Annual Leave")
      .reduce((acc, curr) => acc + (Number(curr.days) || 1), 0);
  }, [userApprovedLeaves]);

  const usedSick = useMemo(() => {
    return userApprovedLeaves
      .filter((r) => r.type === "Sick Leave")
      .reduce((acc, curr) => acc + (Number(curr.days) || 1), 0);
  }, [userApprovedLeaves]);

  const usedCasual = useMemo(() => {
    return userApprovedLeaves
      .filter((r) => r.type === "Casual Leave")
      .reduce((acc, curr) => acc + (Number(curr.days) || 1), 0);
  }, [userApprovedLeaves]);

  const totalAnnual = useMemo(() => parseInt(orgLeavePolicy?.annualLeave || "18") || 18, [orgLeavePolicy]);
  const totalSick = useMemo(() => parseInt(orgLeavePolicy?.sickLeave || "10") || 10, [orgLeavePolicy]);
  const totalCasual = useMemo(() => parseInt(orgLeavePolicy?.casualLeave || "6") || 6, [orgLeavePolicy]);

  // Real Analytics computed from Firestore visibleLeaveRequests
  const realLeaveTypeDist = useMemo(() => [
    { name: "Annual Leave", value: usedAnnual, color: "#5C5CFF" },
    { name: "Sick Leave", value: usedSick, color: "#EF4444" },
    { name: "Casual Leave", value: usedCasual, color: "#22C55E" },
  ], [usedAnnual, usedSick, usedCasual]);

  const realLeaveMonthlyData = useMemo(() => {
    const monthMap: Record<string, { month: string; leaves: number; sick: number; casual: number }> = {
      "Jan": { month: "Jan", leaves: 0, sick: 0, casual: 0 },
      "Feb": { month: "Feb", leaves: 0, sick: 0, casual: 0 },
      "Mar": { month: "Mar", leaves: 0, sick: 0, casual: 0 },
      "Apr": { month: "Apr", leaves: 0, sick: 0, casual: 0 },
      "May": { month: "May", leaves: 0, sick: 0, casual: 0 },
      "Jun": { month: "Jun", leaves: 0, sick: 0, casual: 0 },
      "Jul": { month: "Jul", leaves: 0, sick: 0, casual: 0 },
      "Aug": { month: "Aug", leaves: 0, sick: 0, casual: 0 },
      "Sep": { month: "Sep", leaves: 0, sick: 0, casual: 0 },
      "Oct": { month: "Oct", leaves: 0, sick: 0, casual: 0 },
      "Nov": { month: "Nov", leaves: 0, sick: 0, casual: 0 },
      "Dec": { month: "Dec", leaves: 0, sick: 0, casual: 0 },
    };

    visibleLeaveRequests.forEach((r) => {
      if (r && r.status === "Approved" && r.from) {
        try {
          const d = new Date(r.from);
          if (!isNaN(d.getTime())) {
            const mStr = d.toLocaleDateString("en-US", { month: "short" });
            if (monthMap[mStr]) {
              const dNum = Number(r.days) || 1;
              if (r.type === "Annual Leave") monthMap[mStr].leaves += dNum;
              else if (r.type === "Sick Leave") monthMap[mStr].sick += dNum;
              else if (r.type === "Casual Leave") monthMap[mStr].casual += dNum;
              else monthMap[mStr].leaves += dNum;
            }
          }
        } catch (_) {}
      }
    });

    return Object.values(monthMap);
  }, [visibleLeaveRequests]);

  const realLeaveDaySet = useMemo(() => {
    const set = new Set<number>();
    visibleLeaveRequests.forEach((r) => {
      if (r && r.status !== "Rejected" && r.from) {
        try {
          const d = new Date(r.from);
          if (!isNaN(d.getTime())) set.add(d.getDate());
        } catch (_) {}
      }
    });
    return set;
  }, [visibleLeaveRequests]);

  // Dynamic Month Navigation for Leave Calendar
  const [leaveCalDate, setLeaveCalDate] = useState(new Date());

  const handlePrevCalMonth = () => {
    setLeaveCalDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextCalMonth = () => {
    setLeaveCalDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Build grid days array for leaveCalDate
  const leaveCalGrid = useMemo(() => {
    const year = leaveCalDate.getFullYear();
    const month = leaveCalDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const daysArr: string[] = [];
    for (let i = 0; i < firstDayIndex; i++) {
      daysArr.push("");
    }
    for (let d = 1; d <= totalDays; d++) {
      daysArr.push(String(d));
    }
    return daysArr;
  }, [leaveCalDate]);

  // Set of leave day numbers for the currently viewed month & year
  const leaveDaysForCalMonth = useMemo(() => {
    const monthSet = new Set<number>();
    const targetYear = leaveCalDate.getFullYear();
    const targetMonth = leaveCalDate.getMonth();

    visibleLeaveRequests.forEach((req) => {
      if (!req || req.status === "Rejected" || !req.from) return;
      try {
        const fromD = new Date(req.from);
        const toD = new Date(req.to || req.from);

        if (isNaN(fromD.getTime())) return;

        let curr = new Date(fromD);
        while (curr <= toD) {
          if (curr.getFullYear() === targetYear && curr.getMonth() === targetMonth) {
            monthSet.add(curr.getDate());
          }
          curr.setDate(curr.getDate() + 1);
        }
      } catch (_) {}
    });

    return monthSet;
  }, [leaveCalDate, visibleLeaveRequests]);

  // Dynamic Month Navigation & Real-time Events for Global Calendar
  const [globalCalDate, setGlobalCalDate] = useState(new Date());

  const handlePrevGlobalCalMonth = () => {
    setGlobalCalDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextGlobalCalMonth = () => {
    setGlobalCalDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleTodayGlobalCal = () => {
    setGlobalCalDate(new Date());
  };

  const globalCalGrid = useMemo(() => {
    const year = globalCalDate.getFullYear();
    const month = globalCalDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const daysArr: string[] = [];
    for (let i = 0; i < firstDayIndex; i++) {
      daysArr.push("");
    }
    for (let d = 1; d <= totalDays; d++) {
      daysArr.push(String(d));
    }
    while (daysArr.length % 7 !== 0 || daysArr.length < 35) {
      daysArr.push("");
    }
    return daysArr;
  }, [globalCalDate]);

  // Apply Leave Submit Handler
  const handleApplyLeaveSubmit = async () => {
    const compId = targetCompanyId && targetCompanyId !== "default" ? targetCompanyId : "default";
    const appEmail = userEmail || "employee@company.com";
    const empName = userName || user?.displayName || appEmail.split("@")[0];
    const normalizedRole = String(userRole || "employee").toLowerCase();

    setIsApplyingLeave(true);
    try {
      let targetRoles: string[] = ["manager", "hr_admin", "super_admin"];
      if (normalizedRole === "super_admin" || normalizedRole === "admin") {
        targetRoles = ["super_admin"];
      } else if (normalizedRole === "hr_admin") {
        targetRoles = ["super_admin", "hr_admin"];
      } else if (normalizedRole === "manager") {
        targetRoles = ["hr_admin", "super_admin"];
      }

      let numDays = 1;
      try {
        if (applyLeaveFrom && applyLeaveTo) {
          const dFrom = new Date(applyLeaveFrom);
          const dTo = new Date(applyLeaveTo);
          const diffTime = Math.abs(dTo.getTime() - dFrom.getTime());
          numDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
          if (isNaN(numDays) || numDays < 1) numDays = 1;
        }
      } catch (_) {}

      const reqId = `LV_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const newLeaveDoc = {
        id: reqId,
        employee: empName,
        employeeEmail: appEmail,
        applicantName: empName,
        applicantEmail: appEmail,
        applicantRole: normalizedRole,
        targetRoles: targetRoles,
        approver: normalizedRole === "super_admin" ? "Super Admin" : "Reporting Manager",
        type: applyLeaveType || "Annual Leave",
        from: applyLeaveFrom || new Date().toISOString().slice(0, 10),
        to: applyLeaveTo || new Date().toISOString().slice(0, 10),
        days: numDays,
        reason: applyLeaveReason.trim() || "Leave request",
        status: "Pending",
        applied: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        createdAt: new Date().toISOString(),
      };

      // Immediate UI update
      setDbLeaveRequests((prev: any[]) => [newLeaveDoc, ...(Array.isArray(prev) ? prev : [])]);
      setShowApplyLeave(false);
      setApplyLeaveReason("");

      // Firestore Write
      await setDoc(doc(db, "organizations", compId, "leave_requests", reqId), newLeaveDoc);
      if (compId !== "default") {
        try {
          await setDoc(doc(db, "organizations", "default", "leave_requests", reqId), newLeaveDoc);
        } catch (_) {}
      }
    } catch (err) {
      console.error("Error submitting leave application:", err);
    } finally {
      setIsApplyingLeave(false);
    }
  };

  // Leave Approval and Rejection Action Handlers
  const confirmLeaveApprove = async (id: string) => {
    if (!targetCompanyId) return;
    try {
      await setDoc(doc(db, "organizations", targetCompanyId, "leave_requests", id), {
        status: "Approved",
        approvedAt: new Date().toISOString(),
        approvedBy: userEmail,
      }, { merge: true });
    } catch (err) {
      console.error("Error approving leave request:", err);
    }
  };

  const confirmLeaveReject = async (id: string, note = "") => {
    if (!targetCompanyId) return;
    try {
      await setDoc(doc(db, "organizations", targetCompanyId, "leave_requests", id), {
        status: "Rejected",
        rejectReason: note || "Not approved",
        rejectedAt: new Date().toISOString(),
        rejectedBy: userEmail,
      }, { merge: true });
      setLeaveRejectModalId(null);
      setLeaveRejectReason("");
    } catch (err) {
      console.error("Error rejecting leave request:", err);
    }
  };

  // 1. Listen to Today's Attendance for Current User in Firestore
  useEffect(() => {
    if (!userEmail) return;
    const dateKey = new Date().toISOString().split("T")[0];
    setTodayStr(dateKey);

    const attRef = doc(db, "organizations", targetCompanyId, "users", userEmail, "attendance", dateKey);
    const unsub = onSnapshot(attRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        
        // Normalize checkIn time from Firestore Timestamp (mobile compatibility)
        if (!data.checkInTime && data.checkIn) {
          let dateObj;
          if (data.checkIn.toDate) dateObj = data.checkIn.toDate();
          else if (data.checkIn.seconds) dateObj = new Date(data.checkIn.seconds * 1000);
          if (dateObj) {
            data.checkInTime = dateObj.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
            data.checkInTimestamp = dateObj.toISOString();
          }
        }

        // Normalize checkOut time from Firestore Timestamp (mobile compatibility)
        if (!data.checkOutTime && data.checkOut) {
          let dateObj;
          if (data.checkOut.toDate) dateObj = data.checkOut.toDate();
          else if (data.checkOut.seconds) dateObj = new Date(data.checkOut.seconds * 1000);
          if (dateObj) {
            data.checkOutTime = dateObj.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
            data.checkOutTimestamp = dateObj.toISOString();
          }
        }

        // Map root lat/lng to coordinates object for map plotting
        if (!data.coordinates && (data.lat !== undefined || data.latitude !== undefined)) {
            data.coordinates = {
                lat: parseFloat(data.lat || data.latitude || 0),
                lng: parseFloat(data.lng || data.longitude || 0)
            };
        }

        setTodayAtt(data);
        const isCurrentlyCheckedIn = Boolean(data.checkInTime && (!data.checkOutTime || data.checkOutTime === "—"));
        setCheckedIn(isCurrentlyCheckedIn);
        setCheckInTime(data.checkInTime || "—");
        setCheckOutTime(data.checkOutTime || "—");
        if (data.hoursWorked) setWorkingTimeStr(data.hoursWorked);
      } else {
        setTodayAtt(null);
        setCheckedIn(false);
        setCheckInTime("—");
        setCheckOutTime("—");
        setWorkingTimeStr("0h 00m");
      }
    }, (err) => {
      console.warn("Error listening to today attendance:", err);
    });

    return () => unsub();
  }, [userEmail, targetCompanyId]);

  // Live working time counter if checked in
  useEffect(() => {
    if (!checkedIn || !todayAtt?.checkInTimestamp) return;

    const calcTime = () => {
      const startMs = new Date(todayAtt.checkInTimestamp).getTime();
      const nowMs = Date.now();
      const diffMin = Math.max(0, Math.floor((nowMs - startMs) / 60000));
      const h = Math.floor(diffMin / 60);
      const m = diffMin % 60;
      setWorkingTimeStr(`${h}h ${m}m`);
    };

    calcTime();
    const interval = setInterval(calcTime, 10000);
    return () => clearInterval(interval);
  }, [checkedIn, todayAtt]);

  // 2. Listen to User's Monthly Attendance Subcollection from Firestore
  useEffect(() => {
    if (!userEmail) return;
    const colRef = collection(db, "organizations", targetCompanyId, "users", userEmail, "attendance");
    const unsub = onSnapshot(colRef, (snap) => {
      const docs = snap.docs.map((d) => {
        const data = d.data();
        
        // Normalize date to string (mobile app uses recordDate or document ID)
        if (!data.date || typeof data.date !== 'string') {
          data.date = data.recordDate || d.id;
        }

        // Normalize checkIn time from Firestore Timestamp
        if (!data.checkInTime && data.checkIn) {
          let dateObj;
          if (data.checkIn.toDate) dateObj = data.checkIn.toDate();
          else if (data.checkIn.seconds) dateObj = new Date(data.checkIn.seconds * 1000);
          
          if (dateObj) {
            data.checkInTime = dateObj.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
            data.checkInTimestamp = dateObj.toISOString();
          }
        }

        // Normalize checkOut time from Firestore Timestamp
        if (!data.checkOutTime && data.checkOut) {
          let dateObj;
          if (data.checkOut.toDate) dateObj = data.checkOut.toDate();
          else if (data.checkOut.seconds) dateObj = new Date(data.checkOut.seconds * 1000);
          
          if (dateObj) {
            data.checkOutTime = dateObj.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
            data.checkOutTimestamp = dateObj.toISOString();
          }
        }

        // Normalize status capitalization (mobile stores "present")
        if (data.status && typeof data.status === 'string' && data.status.length > 0) {
           if (data.status.toLowerCase() === "wfh") {
               data.status = "WFH";
           } else {
               data.status = data.status.charAt(0).toUpperCase() + data.status.slice(1).toLowerCase();
           }
        }

        // Normalize location 
        if (!data.location && data.workMode) {
            data.location = data.workMode === "office" ? "Work in Office" : "Work from Home";
        }

        // Map root lat/lng to coordinates object for map plotting
        if (!data.coordinates && (data.lat !== undefined || data.latitude !== undefined)) {
            data.coordinates = {
                lat: parseFloat(data.lat || data.latitude || 0),
                lng: parseFloat(data.lng || data.longitude || 0)
            };
        }

        return data;
      });
      setAttRecords(docs);
    }, (err) => {
      console.warn("Error listening to user attendance subcollection:", err);
    });

    return () => unsub();
  }, [userEmail, targetCompanyId]);

  // 2.4 Listen to Company Shifts
  const [companyShifts, setCompanyShifts] = useState<any[]>([]);
  useEffect(() => {
    if (!targetCompanyId || targetCompanyId === "default") return;
    const shiftsCol = collection(db, "organizations", targetCompanyId, "shifts");
    const unsub = onSnapshot(shiftsCol, (snap) => {
      setCompanyShifts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.warn("Error listening to shifts:", err);
    });
    return () => unsub();
  }, [targetCompanyId]);

  // 2.5 Auto-checkout logic for past days
  useEffect(() => {
    if (!attRecords || !userEmail || !targetCompanyId) return;

    const checkAutoCheckout = async () => {
      const now = new Date();
      for (const record of attRecords) {
        if (record.checkInTime && (!record.checkOutTime || record.checkOutTime === "—")) {
          if (!record.date || typeof record.date !== "string") continue;
          
          let shiftEndHour = 18;
          let shiftEndMinute = 0;
          let shiftName = record.shift || "General Shift";
          
          // Match the exact name, or name without " Shift" suffix
          const shiftData = companyShifts.find(s => s.name === shiftName || `${s.name} Shift` === shiftName) || companyShifts[0];
          
          if (shiftData && shiftData.checkout) {
             const [hh, mm] = shiftData.checkout.split(":");
             if (hh && mm) {
                shiftEndHour = parseInt(hh, 10);
                shiftEndMinute = parseInt(mm, 10);
             }
          }
          if (!record.date || typeof record.date !== 'string') return;
          
          const parts = record.date.split("-");
          if (parts.length !== 3) return;
          
          const recordDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          recordDate.setHours(shiftEndHour + 6, shiftEndMinute, 0, 0); // 6 hours after shift end time
          
          if (now.getTime() > recordDate.getTime()) {
            const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), shiftEndHour, shiftEndMinute, 0);
            const checkOutStr = dateObj.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
            
            const startMs = new Date(record.checkInTimestamp || dateObj.getTime() - 9 * 3600000).getTime();
            const endMs = dateObj.getTime();
            const diffMin = Math.max(0, Math.floor((endMs - startMs) / 60000));
            const h = Math.floor(diffMin / 60);
            const m = diffMin % 60;
            
            const updatedRecord = {
              checkOutTime: checkOutStr,
              checkOutTimestamp: dateObj.toISOString(),
              hoursWorked: `${h}h ${m}m`,
              hoursNum: parseFloat((diffMin / 60).toFixed(1)),
              status: "Completed",
              autoCheckedOut: true,
              updatedAt: now.toISOString(),
            };
            
            try {
              const orgAttRef = doc(db, "organizations", targetCompanyId, "users", userEmail, "attendance", record.date);
              await setDoc(orgAttRef, updatedRecord, { merge: true });
              
              const globalOrgAttRef = doc(db, "organizations", targetCompanyId, "attendance", `${userEmail}_${record.date}`);
              await setDoc(globalOrgAttRef, updatedRecord, { merge: true });
              
              const globalAttRef = doc(db, "users", userEmail, "attendance", record.date);
              await setDoc(globalAttRef, updatedRecord, { merge: true });
              
              await setDoc(doc(db, "organizations", targetCompanyId, "users", userEmail), {
                attendanceStatus: "Checked Out",
                lastCheckOut: checkOutStr,
              }, { merge: true });
              

            } catch (err) {
              console.error("Auto check-out error:", err);
            }
          }
        }
      }
    };
    
    checkAutoCheckout();
  }, [attRecords, userEmail, targetCompanyId]);

  // 3. Listen to Real-time Company Users for Status Widgets
  useEffect(() => {
    if (!targetCompanyId || targetCompanyId === "default") return;
    const usersCol = collection(db, "organizations", targetCompanyId, "users");
    const unsub = onSnapshot(usersCol, (snap) => {
      const list = snap.docs.map((d) => d.data());
      setOrgUsers(list);
    }, (err) => {
      console.warn("Error listening to organization users:", err);
    });

    return () => unsub();
  }, [targetCompanyId]);

  // 4. Calculate Real-Time Status Card Counts (Check in -> Present, Late -> Late, Not Check in -> Leave)
  useEffect(() => {
    if (!orgUsers || orgUsers.length === 0) {
      const isUserPresent = checkedIn || Boolean(todayAtt?.checkInTime);
      const isUserLate = isUserPresent && todayAtt?.status === "Late";
      const isUserWfh = todayAtt?.status === "WFH";
      const isUserLeave = todayAtt?.status === "Leave" || todayAtt?.status === "On Leave";

      setStatCounts({
        present: isUserPresent ? 1 : 0,
        wfh: isUserWfh ? 1 : 0,
        leave: isUserLeave ? 1 : 0,
        late: isUserLate ? 1 : 0,
        offline: (!isUserPresent && !isUserLeave && !isUserWfh) ? 1 : 0,
      });
      return;
    }

    let p = 0, w = 0, l = 0, lt = 0, off = 0;
    orgUsers.forEach((u) => {
      const uMail = String(u.email || u.workEmail || "").toLowerCase();

      if (uMail && uMail === userEmail) {
        if (checkedIn || todayAtt?.checkInTime) {
          p++; // ALWAYS show in Present card when checked in!
          if (todayAtt?.status === "Late") lt++; // ALSO show in Late card if late!
          if (todayAtt?.status === "WFH") w++;
        } else {
          if (todayAtt?.status === "Leave" || todayAtt?.status === "On Leave") {
            l++;
          } else {
            off++;
          }
        }
      } else {
        const att = String(u.attendanceStatus || "").toLowerCase();
        if (att === "present" || att === "checked in" || att === "working" || att === "late") {
          p++; // Present card
          if (att === "late") lt++;
        } else if (att === "wfh") {
          w++;
          p++;
        } else if (att === "leave" || att === "on leave") {
          l++;
        } else {
          off++; // Not checked in and not on leave -> Offline
        }
      }
    });

    setStatCounts({ present: p, wfh: w, leave: l, late: lt, offline: off });
  }, [orgUsers, checkedIn, todayAtt, userEmail]);

  // Real Attendance Timeline computed from user's subcollection
  const realAttTimeline = useMemo(() => {
    if (!attRecords || attRecords.length === 0) return ATT_TIMELINE;
    return attRecords.map((r) => {
      let dateStr = r.date || "Today";
      let dayStr = "Mon";
      if (r.date && typeof r.date === "string") {
        const parts = r.date.split("-");
        if (parts.length === 3) {
          const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
          dayStr = d.toLocaleDateString("en-US", { weekday: "short" });
        }
      }

      const checkInMin = parseTimeToMinutes(r.checkInTime || "—");
      let shiftCheckIn = 9 * 60; // Default 09:00 AM
      const shiftData = companyShifts.find((s: any) => s.name === r.shift || `${s.name} Shift` === r.shift) || companyShifts[0];
      if (shiftData && shiftData.checkin) {
        const [hh, mm] = shiftData.checkin.split(":");
        if (hh && mm) {
          shiftCheckIn = parseInt(hh, 10) * 60 + parseInt(mm, 10);
        }
      }

      const isLate = r.status === "Late" || (checkInMin > 0 && checkInMin > (shiftCheckIn + 15));
      const isWfh = r.location === "Work from Home" || r.status === "WFH" || String(r.location || "").toLowerCase().includes("home");

      let finalStatus = "Present";
      if (r.status === "Leave" || r.status === "On Leave") finalStatus = "Leave";
      else if (r.status === "Weekend") finalStatus = "Weekend";
      else if (isWfh) finalStatus = "WFH";
      else if (isLate) finalStatus = "Late";

      return {
        date: dateStr,
        day: dayStr,
        in: r.checkInTime || "—",
        out: r.checkOutTime || "—",
        hours: r.hoursWorked || "—",
        status: finalStatus,
        shift: r.shift || "General Shift",
        late: isLate,
        wfh: isWfh,
        ot: "0h",
        rawDate: r.date,
      };
    });
  }, [attRecords, companyShifts]);

  // Filtered Attendance Timeline
  const filteredAttTimeline = useMemo(() => {
    let list = realAttTimeline;

    // Filter by Month
    if (attFMonth && attFMonth !== "All") {
      const monthMap: Record<string, string> = {
        "January": "Jan", "February": "Feb", "March": "Mar", "April": "Apr", "May": "May", "June": "Jun",
        "July": "Jul", "August": "Aug", "September": "Sep", "October": "Oct", "November": "Nov", "December": "Dec"
      };
      const targetMonth = monthMap[attFMonth];
      if (targetMonth) {
        list = list.filter(r => r.date.includes(targetMonth));
      }
    }

    // Filter by Quarter
    if (attFQuarter && attFQuarter !== "All") {
      const quarterMonths: Record<string, string[]> = {
        "Q1": ["Jan", "Feb", "Mar"],
        "Q2": ["Apr", "May", "Jun"],
        "Q3": ["Jul", "Aug", "Sep"],
        "Q4": ["Oct", "Nov", "Dec"]
      };
      const targetMonths = quarterMonths[attFQuarter] || [];
      list = list.filter(r => targetMonths.some(m => r.date.includes(m)));
    }

    // Filter by Shift
    if (attFShift && attFShift !== "All") {
      const prefix = attFShift.split(" ")[0];
      list = list.filter(r => r.shift.toLowerCase().includes(prefix.toLowerCase()));
    }

    // Filter by Date Range
    if (attFStartDate) {
      list = list.filter(r => r.rawDate >= attFStartDate);
    }
    if (attFEndDate) {
      list = list.filter(r => r.rawDate <= attFEndDate);
    }

    return list;
  }, [realAttTimeline, attFMonth, attFQuarter, attFShift, attFStartDate, attFEndDate]);

  // Export to CSV helper
  const exportToCSV = (data: any[], filename = "attendance_report.csv") => {
    const headers = ["Date", "Day", "Shift", "Check-in", "Check-out", "Hours Worked", "Status"];
    const rows = data.map(r => [
      r.rawDate || r.date,
      r.day,
      r.shift,
      r.in,
      r.out,
      r.hours,
      r.status
    ]);
    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 5. Listen to Real-time Attendance Issues from Firestore
  const [dbIssues, setDbIssues] = useState<any[]>([]);

  useEffect(() => {
    if (!targetCompanyId || targetCompanyId === "default") return;
    const colRef = collection(db, "organizations", targetCompanyId, "attendance_issues");
    const unsub = onSnapshot(colRef, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setDbIssues(list);
    }, (err) => {
      console.warn("Error listening to attendance issues:", err);
    });

    return () => unsub();
  }, [targetCompanyId]);

  // Role-based visibility for Attendance Issues from Firestore
  // Super Admin -> Super Admin only
  // HR Admin -> Super Admin & HR Admin
  // Manager -> HR Admin
  // Employee -> Manager & HR Admin
  const visibleIssues = useMemo(() => {
    const list = Array.isArray(dbIssues) ? dbIssues : [];
    const normalizedRole = String(userRole || "employee").toLowerCase();
    const normalizedUserEmail = String(userEmail || "").toLowerCase();

    return list.filter((iss) => {
      if (!iss) return false;
      if (iss.createdBy && String(iss.createdBy).toLowerCase() === normalizedUserEmail) return true;

      const rolesArr = Array.isArray(iss.targetRoles) ? iss.targetRoles : ["manager", "hr_admin"];

      // If issue is targeted to super_admin/admin or created by a super_admin/admin:
      const isSuperAdminIssue = rolesArr.includes("super_admin") || rolesArr.includes("admin") || 
        ["super_admin", "admin"].includes(String(iss.createdByRole).toLowerCase());

      if (isSuperAdminIssue) {
        return normalizedRole === "super_admin" || normalizedRole === "admin";
      }

      if (normalizedRole === "super_admin" || normalizedRole === "admin") {
        return true;
      }
      if (normalizedRole === "hr_admin") {
        return rolesArr.includes("hr_admin");
      }
      if (normalizedRole === "manager") {
        return rolesArr.includes("manager");
      }
      return false;
    });
  }, [dbIssues, userEmail, userRole]);

  // Filtered Visible Issues for Issues tab
  const filteredVisibleIssues = useMemo(() => {
    let list = visibleIssues;

    // Filter by Month
    if (attFMonth && attFMonth !== "All") {
      const monthMap: Record<string, number> = {
        "January": 0, "February": 1, "March": 2, "April": 3, "May": 4, "June": 5,
        "July": 6, "August": 7, "September": 8, "October": 9, "November": 10, "December": 11
      };
      const targetMonthIdx = monthMap[attFMonth];
      if (targetMonthIdx !== undefined) {
        list = list.filter(iss => {
          if (!iss.date) return false;
          const m = new Date(iss.date).getMonth();
          return m === targetMonthIdx;
        });
      }
    }

    // Filter by Quarter
    if (attFQuarter && attFQuarter !== "All") {
      const quarterMap: Record<string, number[]> = {
        "Q1": [0, 1, 2], "Q2": [3, 4, 5], "Q3": [6, 7, 8], "Q4": [9, 10, 11]
      };
      const targetMonths = quarterMap[attFQuarter] || [];
      list = list.filter(iss => {
        if (!iss.date) return false;
        const m = new Date(iss.date).getMonth();
        return targetMonths.includes(m);
      });
    }

    // Filter by Shift
    if (attFShift && attFShift !== "All") {
      const prefix = attFShift.split(" ")[0];
      list = list.filter(iss => iss.shift && String(iss.shift).toLowerCase().includes(prefix.toLowerCase()));
    }

    // Filter by Date Range
    if (attFStartDate) {
      list = list.filter(iss => iss.date >= attFStartDate);
    }
    if (attFEndDate) {
      list = list.filter(iss => iss.date <= attFEndDate);
    }

    return list;
  }, [visibleIssues, attFMonth, attFQuarter, attFShift, attFStartDate, attFEndDate]);

  // Export Issues to CSV helper
  const exportIssuesToCSV = (data: any[], filename = "attendance_issues_report.csv") => {
    const headers = ["ID", "Issue Type", "Date", "Requested Timing", "Reason", "Comment", "Status", "Submitted By"];
    const rows = data.map(r => [
      r.id,
      r.type,
      r.date,
      `${r.requestedCheckIn || "—"} – ${r.requestedCheckOut || "—"}`,
      r.reason,
      r.comment || "",
      r.status,
      r.createdByName || r.createdBy
    ]);
    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Aggregated Real-Time Approvals combining Leave Requests and Attendance Issues from Firestore
  const realTimeApprovals = useMemo(() => {
    const list: any[] = [];

    // 1. Leave Requests
    (visibleLeaveRequests || []).forEach((r) => {
      if (!r) return;
      list.push({
        id: r.id,
        rawId: r.id,
        category: "Leave",
        type: "Leave",
        leaveType: r.type || "Annual Leave",
        employee: r.applicantName || r.applicantEmail || "Employee",
        applicantEmail: r.applicantEmail,
        dept: r.applicantRole ? String(r.applicantRole).toUpperCase() : "Engineering",
        detail: `${r.type || "Annual Leave"} · ${r.days || 1} day(s) · ${r.from || ""}–${r.to || ""}`,
        dateRange: `${r.from || ""} – ${r.to || ""}`,
        days: `${r.days || 1} day(s)`,
        applied: r.applied || "Today",
        reason: r.reason || "No reason provided",
        status: r.status || "Pending",
        rejectReason: r.rejectReason || "",
        comments: Array.isArray(r.comments) ? r.comments : [],
        source: "leave_request",
        raw: r,
      });
    });

    // 2. Attendance Issues
    (visibleIssues || []).forEach((iss) => {
      if (!iss) return;
      list.push({
        id: iss.id,
        rawId: iss.id,
        category: "Attendance",
        type: "Attendance",
        leaveType: iss.type || "Attendance Correction",
        employee: iss.createdByName || iss.createdBy || "Employee",
        applicantEmail: iss.createdBy,
        dept: iss.createdByRole ? String(iss.createdByRole).toUpperCase() : "Product",
        detail: `${iss.type || "Attendance Correction"} · Date: ${iss.date || "Today"} (${iss.requestedCheckIn || "09:00 AM"} - ${iss.requestedCheckOut || "06:00 PM"})`,
        dateRange: iss.date || "Today",
        days: "—",
        applied: iss.submittedOn || "Today",
        reason: iss.reason || iss.comment || "No reason provided",
        status: iss.status || "Pending",
        rejectReason: iss.rejectNote || "",
        comments: Array.isArray(iss.comments) ? iss.comments : [],
        source: "attendance_issue",
        raw: iss,
      });
    });

    return list.sort((a, b) => (String(b.id) > String(a.id) ? 1 : -1));
  }, [visibleLeaveRequests, visibleIssues]);

  const handleApproveApprovalItem = async (item: any) => {
    if (!targetCompanyId || targetCompanyId === "default" || !item) return;

    if (item.source === "leave_request") {
      await confirmLeaveApprove(item.rawId);
    } else if (item.source === "attendance_issue") {
      try {
        await setDoc(doc(db, "organizations", targetCompanyId, "attendance_issues", item.rawId), {
          status: "Approved",
          approvedAt: new Date().toISOString(),
          approvedBy: userEmail,
        }, { merge: true });

        const iss = item.raw;
        if (iss && iss.createdBy && iss.date) {
          const attRef = doc(db, "organizations", targetCompanyId, "users", iss.createdBy, "attendance", iss.date);
          await setDoc(attRef, {
            date: iss.date,
            checkInTime: iss.requestedCheckIn || "09:00 AM",
            checkOutTime: iss.requestedCheckOut || "06:00 PM",
            status: "Present",
            hoursWorked: "9h 00m",
            hoursNum: 9,
            updatedAt: new Date().toISOString(),
          }, { merge: true });
        }
      } catch (err) {
        console.error("Error approving attendance issue:", err);
      }
    }
  };

  const handleRejectApprovalItem = async (item: any, note = "") => {
    if (!targetCompanyId || targetCompanyId === "default" || !item) return;

    if (item.source === "leave_request") {
      await confirmLeaveReject(item.rawId, note);
    } else if (item.source === "attendance_issue") {
      try {
        await setDoc(doc(db, "organizations", targetCompanyId, "attendance_issues", item.rawId), {
          status: "Rejected",
          rejectNote: note || "Not approved",
          rejectedAt: new Date().toISOString(),
          rejectedBy: userEmail,
        }, { merge: true });
      } catch (err) {
        console.error("Error rejecting attendance issue:", err);
      }
    }
  };

  // Calendar Day Status Resolver
  const getCalDayState = (dayNumStr: string) => {
    if (!dayNumStr) return null;
    const dayNum = parseInt(dayNumStr, 10);
    if (isNaN(dayNum)) return null;

    if (dayNum === 4) return { isHol: true };

    const records = Array.isArray(attRecords) ? attRecords : [];
    const rec = records.find((r) => {
      if (!r || !r.date || typeof r.date !== "string") return false;
      const parts = r.date.split("-");
      if (parts.length === 3) {
        return parseInt(parts[2], 10) === dayNum;
      }
      return false;
    });

    if (rec) {
      const s = String(rec.status || "").toLowerCase();
      return {
        isPresent: s === "present" || s === "completed",
        isLate: s === "late",
        isWfh: s === "wfh",
        isLeave: s === "leave" || s === "on leave",
      };
    }
    return null;
  };

  // Handle Check In Action -> Writes to /organizations/{companyId}/users/{userEmail}/attendance/{dateStr}
  const handleCheckIn = async () => {
    if (!userEmail) return;
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsCheckingIn(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;

      try {
        let orgLat = 0;
        let orgLng = 0;
        let orgRadius = 500;
        let orgName = "Office HQ";

        if (targetCompanyId) {
          const orgDoc = await getDoc(doc(db, "organizations", targetCompanyId));
          const orgData = orgDoc.exists() ? { ...orgDoc.data() } : {};
          if (orgData["----------"] && !orgData.locations) {
            orgData.locations = orgData["----------"];
          }
          
          let userBranch = "";
          let userAssignedRadius: number | null = null;
          let userAssignedLat: number | null = null;
          let userAssignedLng: number | null = null;

          const userDoc = await getDoc(doc(db, "organizations", targetCompanyId, "users", userEmail));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            userBranch = userData.branch || userData.location || "";
            if (userData.latitude || userData.lat) {
              userAssignedLat = parseFloat(userData.latitude || userData.lat);
              userAssignedLng = parseFloat(userData.longitude || userData.lng);
            }
            if (userData.geofenceRadius || userData.radius) {
              userAssignedRadius = parseFloat(userData.geofenceRadius || userData.radius);
            }
          }

          if (userAssignedLat !== null && userAssignedLng !== null) {
            orgLat = userAssignedLat;
            orgLng = userAssignedLng;
            orgName = userBranch || orgName;
            if (userAssignedRadius !== null) {
              orgRadius = userAssignedRadius;
            }
          } else {
            let matchedBranch: any = null;
            if (userBranch) {
              const branchSnap = await getDoc(doc(db, "organizations", targetCompanyId, "branches", userBranch.replace(/\s+/g, "_")));
              if (branchSnap.exists()) {
                matchedBranch = branchSnap.data();
              } else {
                const branchesCol = await getDocs(collection(db, "organizations", targetCompanyId, "branches"));
                const branchesList = branchesCol.docs.map(d => ({ id: d.id, ...d.data() }));
                matchedBranch = branchesList.find((b: any) => 
                  String(b.name || "").toLowerCase().trim() === String(userBranch).toLowerCase().trim() ||
                  String(b.id || "").toLowerCase().trim() === String(userBranch).toLowerCase().trim()
                );
              }

              if (!matchedBranch && orgData?.locations && Array.isArray(orgData.locations)) {
                matchedBranch = orgData.locations.find((l: any) => 
                  String(l.name || "").toLowerCase().trim() === String(userBranch).toLowerCase().trim()
                );
              }
            }

            if (!matchedBranch && orgData?.locations && Array.isArray(orgData.locations) && orgData.locations.length > 0) {
              matchedBranch = orgData.locations[0];
            }
            if (!matchedBranch) {
              const branchesCol = await getDocs(collection(db, "organizations", targetCompanyId, "branches"));
              if (!branchesCol.empty) {
                matchedBranch = branchesCol.docs[0].data();
              }
            }

            if (matchedBranch) {
              orgLat = parseFloat(matchedBranch.latitude || matchedBranch.lat || orgLat.toString());
              orgLng = parseFloat(matchedBranch.longitude || matchedBranch.lng || orgLng.toString());
              orgName = matchedBranch.name || userBranch || orgName;
              orgRadius = parseFloat(matchedBranch.geofenceRadius || matchedBranch.radius || orgRadius.toString());
            } else if (orgData) {
              orgLat = parseFloat(orgData.latitude || orgData.location?.latitude || orgData.lat || orgLat.toString());
              orgLng = parseFloat(orgData.longitude || orgData.location?.longitude || orgData.lng || orgLng.toString());
              orgRadius = parseFloat(orgData.geofenceRadius || orgData.radius || "200");
              orgName = orgData.name || orgData.companyName || orgName;
            }
          }
        }

        // Ensure the geofence radius uses 500m to accommodate web app location accuracy
        const effectiveRadius = 500;
        const dist = getDistance(latitude, longitude, orgLat, orgLng);
        const isOutside = dist > effectiveRadius;

        const now = new Date();
        const dateKey = now.toISOString().split("T")[0];
        const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
        const isLate = now.getHours() >= 9 && now.getMinutes() > 15;

        const attStatus = isOutside ? "WFH" : (isLate ? "Late" : "Present");
        const locationStr = isOutside ? "Work from Home" : "Work in Office";

        const record = {
          date: dateKey,
          checkInTime: timeStr,
          checkInTimestamp: now.toISOString(),
          checkOutTime: null,
          checkOutTimestamp: null,
          status: attStatus,
          hoursWorked: "0h 00m",
          hoursNum: 0,
          shift: "General Shift",
          location: locationStr,
          coordinates: { lat: latitude, lng: longitude },
          orgCoordinates: { lat: orgLat, lng: orgLng },
          orgRadius: effectiveRadius,
          orgName,
          updatedAt: now.toISOString(),
        };

        const orgAttRef = doc(db, "organizations", targetCompanyId, "users", userEmail, "attendance", dateKey);
        await setDoc(orgAttRef, record, { merge: true });

        const globalOrgAttRef = doc(db, "organizations", targetCompanyId, "attendance", `${userEmail}_${dateKey}`);
        await setDoc(globalOrgAttRef, record, { merge: true });

        const globalAttRef = doc(db, "users", userEmail, "attendance", dateKey);
        await setDoc(globalAttRef, record, { merge: true });

        await setDoc(doc(db, "organizations", targetCompanyId, "users", userEmail), {
          attendanceStatus: attStatus,
          lastCheckIn: timeStr,
        }, { merge: true });

        setCheckedIn(true);
        setCheckInTime(timeStr);
        setCheckOutTime("—");
        setWorkingTimeStr("0h 00m");
      } catch (err) {
        console.error("Check-in error:", err);
      } finally {
        setIsCheckingIn(false);
      }
    }, (error) => {
      console.error("Geolocation error:", error);
      alert("Please allow location access to check in.");
      setIsCheckingIn(false);
    }, {
      enableHighAccuracy: true,
      timeout: 10000,
    });
  };

  // Handle Check Out Action -> Writes to /organizations/{companyId}/users/{userEmail}/attendance/{dateStr}
  const handleCheckOut = async () => {
    if (!userEmail) return;
    const now = new Date();
    const dateKey = now.toISOString().split("T")[0];
    const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

    let hoursWorked = "8h 00m";
    let hoursNum = 8.0;

    if (todayAtt?.checkInTimestamp) {
      const startMs = new Date(todayAtt.checkInTimestamp).getTime();
      const diffMin = Math.max(0, Math.floor((now.getTime() - startMs) / 60000));
      const h = Math.floor(diffMin / 60);
      const m = diffMin % 60;
      hoursWorked = `${h}h ${m}m`;
      hoursNum = parseFloat((diffMin / 60).toFixed(1));
    }

    const record = {
      checkOutTime: timeStr,
      checkOutTimestamp: now.toISOString(),
      hoursWorked,
      hoursNum,
      status: "Completed",
      updatedAt: now.toISOString(),
    };

    try {
      const orgAttRef = doc(db, "organizations", targetCompanyId, "users", userEmail, "attendance", dateKey);
      await setDoc(orgAttRef, record, { merge: true });

      const globalOrgAttRef = doc(db, "organizations", targetCompanyId, "attendance", `${userEmail}_${dateKey}`);
      await setDoc(globalOrgAttRef, record, { merge: true });

      const globalAttRef = doc(db, "users", userEmail, "attendance", dateKey);
      await setDoc(globalAttRef, record, { merge: true });

      await setDoc(doc(db, "organizations", targetCompanyId, "users", userEmail), {
        attendanceStatus: "Checked Out",
        lastCheckOut: timeStr,
      }, { merge: true });

      setCheckedIn(false);
      setCheckOutTime(timeStr);
      setWorkingTimeStr(hoursWorked);
    } catch (err) {
      console.error("Check-out error:", err);
    }
  };

  // Build real monthly chart data from user's subcollection
  const realMonthlyChartData = useMemo(() => {
    const map = new Map<number, { h: number; s: string }>();
    if (attRecords && attRecords.length > 0) {
      attRecords.forEach((r) => {
        if (r.date && typeof r.date === "string") {
          const dayNum = parseInt(r.date.split("-")[2], 10);
          if (!isNaN(dayNum)) {
            map.set(dayNum, { h: r.hoursNum || 8, s: r.status || "Present" });
          }
        }
      });
    }

    const result = [];
    for (let i = 1; i <= 31; i++) {
      const existing = map.get(i);
      result.push({
        day: String(i),
        h: existing ? existing.h : 0,
        s: existing ? existing.s : (i % 7 === 0 || i % 7 === 6 ? "Weekend" : "Off"),
      });
    }
    return result;
  }, [attRecords]);

  // Build real yearly chart data from user's subcollection
  const realYearlyChartData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlySum = new Map<number, { totalHours: number; daysCount: number; statusList: string[] }>();
    
    for (let i = 0; i < 12; i++) {
      monthlySum.set(i, { totalHours: 0, daysCount: 0, statusList: [] });
    }
    
    if (attRecords && attRecords.length > 0) {
      attRecords.forEach((r) => {
        if (r.date && typeof r.date === "string") {
          const parts = r.date.split("-");
          if (parts.length === 3) {
            const mIdx = parseInt(parts[1], 10) - 1;
            if (mIdx >= 0 && mIdx < 12) {
              const data = monthlySum.get(mIdx)!;
              const hours = r.hoursNum || 0;
              const status = r.status || "Present";
              // count checking in days or status that implies working/on leave
              if (hours > 0 || ["present", "completed", "late", "wfh", "leave", "on leave"].includes(status.toLowerCase())) {
                data.totalHours += hours;
                data.daysCount += 1;
                data.statusList.push(status);
              }
            }
          }
        }
      });
    }
    
    return months.map((monthName, idx) => {
      const data = monthlySum.get(idx)!;
      let avgHours = 0;
      if (data.daysCount > 0) {
        avgHours = parseFloat((data.totalHours / data.daysCount).toFixed(1));
      }
      
      let dominantStatus = "Off";
      if (data.statusList.length > 0) {
        const counts = new Map<string, number>();
        data.statusList.forEach(s => counts.set(s, (counts.get(s) || 0) + 1));
        let maxVal = 0;
        counts.forEach((val, key) => {
          if (val > maxVal) {
            maxVal = val;
            dominantStatus = key;
          }
        });
      }
      
      return {
        day: monthName,
        h: avgHours,
        s: dominantStatus
      };
    });
  }, [attRecords]);

  // Real Attendance Summary metrics for user
  const userAttSummary = useMemo(() => {
    let present = 0, wfh = 0, leave = 0, late = 0, totalHours = 0;
    attRecords.forEach((r) => {
      const s = (r.status || "").toLowerCase();
      if (s === "present" || s === "completed") present++;
      else if (s === "wfh") wfh++;
      else if (s === "leave") leave++;
      else if (s === "late") { present++; late++; }
      if (r.hoursNum) totalHours += r.hoursNum;
    });

    // If currently checked in, add today's running hours
    if (checkedIn && todayAtt?.checkInTimestamp) {
      const startMs = new Date(todayAtt.checkInTimestamp).getTime();
      const diffMin = Math.max(0, Math.floor((Date.now() - startMs) / 60000));
      totalHours += diffMin / 60;
    }

    return {
      present: present || (checkedIn ? 1 : 0),
      wfh,
      leave,
      late,
      totalHours: Math.round(totalHours),
    };
  }, [attRecords, checkedIn, todayAtt]);

  const liveDateFormatted = new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });

  const ALL_TABS = ["Dashboard","Attendance","Leave","Approvals","Calendar"];
  const tabPermMap: Record<string, string> = {
    "Dashboard": "my-space",
    "Attendance": "attendance",
    "Leave": "leave",
    "Tasks": "tasks",
    "Approvals": "approvals",
    "Calendar": "my-space",
  };
  const MS_TABS = ALL_TABS.filter((t) => hasPermission(tabPermMap[t] || "my-space"));
  const [tab, setTab] = useState(activeTab || "Dashboard");

  useEffect(() => {
    if (activeTab) {
      setTab(activeTab);
    }
  }, [activeTab]);

  // Shared
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [liveUserLocation, setLiveUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [liveLocationError, setLiveLocationError] = useState<string | null>(null);

  useEffect(() => {
    let watchId: number;
    if (showLocationModal && "geolocation" in navigator) {
      setLiveLocationError(null);
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setLiveUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLiveLocationError(null);
        },
        (err) => {
          console.warn("Failed to get live location:", err);
          if (err.code === 1) setLiveLocationError("Location access denied by browser or OS.");
          else if (err.code === 2) setLiveLocationError("Location unavailable (no GPS/network).");
          else if (err.code === 3) setLiveLocationError("Location request timed out.");
          else setLiveLocationError(err.message);
        },
        { enableHighAccuracy: true, maximumAge: 1000 }
      );
    }
    return () => {
      if (watchId !== undefined) navigator.geolocation.clearWatch(watchId);
    };
  }, [showLocationModal]);
  const [isInsideGeofence, setIsInsideGeofence] = useState(true);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [reqs, setReqs] = useState(LEAVE_REQUESTS);

  // Leave modals
  const [approveModalId, setApproveModalId] = useState<string|null>(null);
  const [rejectModalId,  setRejectModalId]  = useState<string|null>(null);
  const [rejectReason,   setRejectReason]   = useState("");
  const [approveComment, setApproveComment] = useState("");
  const [leaveDetailId,  setLeaveDetailId]  = useState<string|null>(null);

  const confirmApprove = () => {
    if (!approveModalId) return;
    setReqs(r => r.map(x => x.id === approveModalId ? { ...x, status:"Approved" } : x));
    setApproveModalId(null); setApproveComment("");
  };
  const confirmReject = () => {
    if (!rejectModalId || !rejectReason.trim()) return;
    setReqs(r => r.map(x => x.id === rejectModalId ? { ...x, status:"Rejected" } : x));
    setRejectModalId(null); setRejectReason("");
  };

  // Approval items
  const [appApproveId,      setAppApproveId]      = useState<string|null>(null);
  const [appRejectId,       setAppRejectId]        = useState<string|null>(null);
  const [appRejectReason,   setAppRejectReason]   = useState("");
  const [appApproveComment, setAppApproveComment] = useState("");
  const approvals = realTimeApprovals;
  const [approvalDetailId,  setApprovalDetailId]  = useState<string|null>(null);
  const [approvalView,      setApprovalView]      = useState("Pending");
  const [approvalType,      setApprovalType]      = useState("All");

  const confirmApproveItem = () => {
    if (!appApproveId) return;
    const item = realTimeApprovals.find(a => a.id === appApproveId);
    if (item) handleApproveApprovalItem(item);
    setAppApproveId(null); setAppApproveComment("");
  };
  const confirmRejectItem = () => {
    if (!appRejectId || !appRejectReason.trim()) return;
    const item = realTimeApprovals.find(a => a.id === appRejectId);
    if (item) handleRejectApprovalItem(item, appRejectReason);
    setAppRejectId(null); setAppRejectReason("");
  };

  // Real-Time Approval comments on Firestore
  const [approvalDraft, setApprovalDraft] = useState("");

  const addApprovalComment = async (item: any) => {
    if (!approvalDraft.trim() || !item || !targetCompanyId || targetCompanyId === "default") return;

    const newComment = {
      id: `c_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      author: userName || userEmail.split("@")[0] || "User",
      authorEmail: userEmail,
      text: approvalDraft.trim(),
      timestamp: Date.now(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const existingComments = Array.isArray(item.comments) ? item.comments : [];
    const updatedComments = [...existingComments, newComment];

    if (item.source === "leave_request") {
      try {
        await setDoc(doc(db, "organizations", targetCompanyId, "leave_requests", item.rawId), {
          comments: updatedComments
        }, { merge: true });
      } catch (e) {
        console.error("Error adding leave comment:", e);
      }
    } else if (item.source === "attendance_issue") {
      try {
        await setDoc(doc(db, "organizations", targetCompanyId, "attendance_issues", item.rawId), {
          comments: updatedComments
        }, { merge: true });
      } catch (e) {
        console.error("Error adding attendance issue comment:", e);
      }
    }
    setApprovalDraft("");
  };

  // Tasks
  const TASK_VIEWS = ["Assigned","In Progress","Completed","Overdue","Archived"];
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [ANNOUNCEMENTS_DATA, setANNOUNCEMENTS_DATA] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  // 6. Fetch Tasks, Announcements, and Activities
  useEffect(() => {
    if (!targetCompanyId || targetCompanyId === "default") return;

    // Tasks
    const tasksCol = collection(db, "organizations", targetCompanyId, "tasks");
    const unsubTasks = onSnapshot(tasksCol, (snap) => {
      const allTasks = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const userTasks = allTasks.filter(t => t.assignee === userName || t.assigneeEmail === userEmail);
      setMyTasks(userTasks);
    });

    // Announcements
    const annCol = collection(db, "organizations", targetCompanyId, "announcements");
    const unsubAnn = onSnapshot(annCol, (snap) => {
      const data = snap.docs.map(d => {
        const item = d.data();
        let timeAgo = "Just now";
        if (item.createdAt) {
          const t = typeof item.createdAt === 'number' ? item.createdAt : new Date(item.createdAt).getTime();
          const diff = Math.floor((Date.now() - t) / 60000);
          if (diff < 60) timeAgo = `${diff}m ago`;
          else if (diff < 1440) timeAgo = `${Math.floor(diff/60)}h ago`;
          else timeAgo = `${Math.floor(diff/1440)}d ago`;
        }
        return { id: d.id, ...item, timeAgo };
      });
      setANNOUNCEMENTS_DATA(data);
    });

    // Activities (Team Feed)
    const feedCol = collection(db, "organizations", targetCompanyId, "team_feed");
    const unsubFeed = onSnapshot(feedCol, (snap) => {
      const allFeed = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Map team feed to recent activities format
      const mappedActivities = allFeed
        .sort((a: any, b: any) => {
           const tA = typeof a.createdAt === 'number' ? a.createdAt : new Date(a.createdAt || 0).getTime();
           const tB = typeof b.createdAt === 'number' ? b.createdAt : new Date(b.createdAt || 0).getTime();
           return tB - tA;
        })
        .slice(0, 5) // Get latest 5
        .map((a: any) => ({
          id: a.id,
          icon: a.type === "Announcement" ? Megaphone : a.type === "Leave" ? CalendarDays : CheckCircle,
          color: a.type === "Announcement" ? "#3B82F6" : a.type === "Leave" ? "#F59E0B" : "#22C55E",
          text: a.content || `${a.author} posted an update`,
          time: new Date(typeof a.createdAt === 'number' ? a.createdAt : a.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
        }));
      setRecentActivities(mappedActivities);
    });

    return () => {
      unsubTasks();
      unsubAnn();
      unsubFeed();
    };
  }, [targetCompanyId, userName, userEmail]);

  const [taskView,        setTaskView]        = useState("Assigned");
  const [activeTaskId,    setActiveTaskId]    = useState<string|null>(null);
  const [taskSearch,      setTaskSearch]      = useState("");
  const [taskSortField,   setTaskSortField]   = useState("due");
  const [taskSortDir,     setTaskSortDir]     = useState<"asc"|"desc">("asc");
  const [selectedTasks,   setSelectedTasks]   = useState<string[]>([]);
  const [taskPriFilter,   setTaskPriFilter]   = useState("All");
  const [showTaskFilters, setShowTaskFilters] = useState(false);
  const [showNewTask,     setShowNewTask]     = useState(false);
  const [newTaskTitle,    setNewTaskTitle]    = useState("");
  const [taskComment,     setTaskComment]     = useState("");
  const [taskComments,    setTaskComments]    = useState<Record<string, { id:string; author:string; text:string; time:string }[]>>({
    "TASK-001": [{ id:"c1", author:"David Chen",    text:"Please include WFH data breakdown in the report.", time:"Jun 30, 9:15 AM" }],
    "TASK-002": [{ id:"c2", author:"Jennifer Walsh", text:"Make sure the new carry-forward rules are reflected.", time:"Jul 1, 10:02 AM" }],
  });
  const [taskChecklists, setTaskChecklists] = useState<Record<string, { id:string; label:string; done:boolean }[]>>({
    "TASK-001": [
      { id:"cl1", label:"Export raw attendance data",       done:true  },
      { id:"cl2", label:"Analyze late arrivals",            done:true  },
      { id:"cl3", label:"Generate department breakdown",    done:false },
      { id:"cl4", label:"Review with manager",              done:false },
    ],
    "TASK-002": [
      { id:"cl5", label:"Review current policy",           done:true  },
      { id:"cl6", label:"Draft changes",                   done:false },
      { id:"cl7", label:"Legal review",                    done:false },
    ],
  });

  const getFilteredTasks = () => {
    let ts = myTasks.filter(t => {
      if (taskView === "Assigned")    return t.status === "Assigned" && !t.done;
      if (taskView === "In Progress") return t.status === "In Progress";
      if (taskView === "Completed")   return t.done;
      if (taskView === "Overdue")     return t.overdue && !t.done;
      return false;
    });
    if (taskSearch)            ts = ts.filter(t => t.title.toLowerCase().includes(taskSearch.toLowerCase()) || t.id.toLowerCase().includes(taskSearch.toLowerCase()));
    if (taskPriFilter !== "All") ts = ts.filter(t => t.priority === taskPriFilter);
    return [...ts].sort((a, b) => {
      const va = (a as any)[taskSortField] || "";
      const vb = (b as any)[taskSortField] || "";
      return taskSortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });
  };
  const filteredTasks = getFilteredTasks();
  const activeTask    = myTasks.find(t => t.id === activeTaskId) || null;

  const toggleTask = (id: string) => setMyTasks(ts => ts.map(t => t.id === id ? { ...t, done:!t.done, status:t.done?"Assigned":"Completed" } : t));
  const addTaskComment = (tid: string) => {
    if (!taskComment.trim()) return;
    setTaskComments(tc => ({ ...tc, [tid]: [...(tc[tid]||[]), { id:`c${Date.now()}`, author:"Alex Admin", text:taskComment, time:"Just now" }] }));
    setTaskComment("");
  };
  const toggleChecklist = (tid: string, iid: string) => setTaskChecklists(tl => ({ ...tl, [tid]: (tl[tid]||[]).map(i => i.id === iid ? { ...i, done:!i.done } : i) }));
  const createTask = () => {
    if (!newTaskTitle.trim()) return;
    const id = `TASK-${String(myTasks.length + 1).padStart(3,"0")}`;
    setMyTasks(ts => [...ts, { id, title:newTaskTitle, priority:"Medium", status:"Assigned", reporter:"Alex Admin", assignee:"Alex Admin", created:"Jul 1", updated:"Jul 1", due:"Jul 10", done:false, overdue:false }]);
    setNewTaskTitle(""); setShowNewTask(false);
  };
  const toggleSelectTask = (id: string) => setSelectedTasks(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const selectAllTasks   = () => setSelectedTasks(s => s.length === filteredTasks.length ? [] : filteredTasks.map(t => t.id));

  // Attendance — section switcher + sub-views
  const [attSection,     setAttSection]     = useState<"My Space"|"My Team">("My Space");
  const [attViewInternal, setAttViewInternal] = useState<"summary"|"timeline"|"calendar"|"issues">(attViewProp || "summary");
  const [attPeriodInternal, setAttPeriodInternal] = useState<"Weekly"|"Monthly"|"Yearly">(attPeriodProp || "Monthly");

  const attView = attViewProp !== undefined ? attViewProp : attViewInternal;
  const attPeriod = attPeriodProp !== undefined ? attPeriodProp : attPeriodInternal;

  const setAttView = (v: any) => {
    setAttViewInternal(v);
    if (setAttViewProp) setAttViewProp(v);
  };

  const setAttPeriod = (p: any) => {
    setAttPeriodInternal(p);
    if (setAttPeriodProp) setAttPeriodProp(p);
  };

  useEffect(() => {
    if (attViewProp !== undefined) setAttViewInternal(attViewProp);
  }, [attViewProp]);

  useEffect(() => {
    if (attPeriodProp !== undefined) setAttPeriodInternal(attPeriodProp);
  }, [attPeriodProp]);

  const [attTeamView,    setAttTeamView]    = useState<"overview"|"exceptions"|"analytics">("overview");
  const [teamEmpSearch,  setTeamEmpSearch]  = useState("");
  const [teamDeptFilter, setTeamDeptFilter] = useState("All");
  const [teamStatusFilter,setTeamStatusFilter]=useState("All");
  const [teamShiftFilter,setTeamShiftFilter]= useState("All");
  const [teamEmpDrawer,  setTeamEmpDrawer]  = useState<string|null>(null);
  const [attCalView,     setAttCalView]     = useState<"month"|"week">("month");
  const [attCalFilters,  setAttCalFilters]  = useState([...ATT_CAL_FILTERS_DEFAULT]);
  const toggleAttCalFilter = (f: string) => setAttCalFilters(fs => fs.includes(f) ? fs.filter(x => x !== f) : [...fs, f]);
  const [attAnalChart,   setAttAnalChart]   = useState("Daily Attendance");
  const [attExcStatus,   setAttExcStatus]   = useState("All");
  const [attExcType,     setAttExcType]     = useState("All");
  const [attExcDrawer,   setAttExcDrawer]   = useState<string|null>(null);
  const [showAttFilter,  setShowAttFilter]  = useState(false);
  const [showAttExport,  setShowAttExport]  = useState(false);
  const confirmIssueReject = async () => {
    if (!issueRejectId || !issueRejectNote.trim()) return;
    try {
      const issueRef = doc(db, "organizations", targetCompanyId, "attendance_issues", issueRejectId);
      await setDoc(issueRef, { status: "Rejected", rejectedBy: userEmail, rejectNote: issueRejectNote }, { merge: true });
    } catch (err) {
      console.error("Error rejecting issue:", err);
    }
    setAttIssues(is => is.map(x => x.id===issueRejectId ? {...x,status:"Rejected",rejectNote:issueRejectNote} : x));
    setIssueRejectId(null); setIssueRejectNote("");
  };
  const confirmIssueApprove = async (id: string) => {
    try {
      const issueRef = doc(db, "organizations", targetCompanyId, "attendance_issues", id);
      const issueSnap = await getDoc(issueRef);
      const issueData = issueSnap.exists() ? issueSnap.data() : dbIssues.find((i) => i.id === id);

      // 1. Mark issue as Approved in Firestore
      await setDoc(issueRef, { status: "Approved", approvedBy: userEmail }, { merge: true });

      // 2. If approved, update attendance record for that employee on that date in Firestore!
      if (issueData) {
        const empEmail = String(issueData.createdBy || userEmail).toLowerCase();
        const dateStr = issueData.date || new Date().toISOString().split("T")[0];
        const reqIn = issueData.requestedCheckIn || "09:00 AM";
        const reqOut = issueData.requestedCheckOut || "06:00 PM";

        const attDocRef = doc(db, "organizations", targetCompanyId, "users", empEmail, "attendance", dateStr);
        const userGlobalAttDocRef = doc(db, "users", empEmail, "attendance", dateStr);

        const updatedAttPayload = {
          date: dateStr,
          checkInTime: reqIn,
          checkOutTime: reqOut,
          hoursWorked: "9h 00m",
          status: "Present",
          shift: "General Shift",
          late: false,
          wfh: false,
          approvedByIssue: id,
          updatedAt: new Date().toISOString(),
        };

        await setDoc(attDocRef, updatedAttPayload, { merge: true });
        await setDoc(userGlobalAttDocRef, updatedAttPayload, { merge: true });

        // Also update company-level user attendanceStatus if date is today
        const todayStrLocal = new Date().toISOString().split("T")[0];
        if (dateStr === todayStrLocal) {
          const orgUserRef = doc(db, "organizations", targetCompanyId, "users", empEmail);
          await setDoc(orgUserRef, {
            attendanceStatus: "Present",
            lastCheckIn: reqIn,
            lastCheckOut: reqOut,
          }, { merge: true });
        }
      }
    } catch (err) {
      console.error("Error approving issue & updating attendance in Firestore:", err);
    }
    setAttIssues(is => is.map(x => x.id===id ? {...x,status:"Approved"} : x));
  };

  // Leave
  const [leaveViewInternal, setLeaveViewInternal] = useState(leaveViewProp || "Balance");
  const leaveView = leaveViewProp !== undefined ? leaveViewProp : leaveViewInternal;
  const setLeaveView = (v: any) => {
    setLeaveViewInternal(v);
    if (setLeaveViewProp) setLeaveViewProp(v);
  };
  useEffect(() => {
    if (leaveViewProp !== undefined) setLeaveViewInternal(leaveViewProp);
  }, [leaveViewProp]);
  const [showApplyLeave,    setShowApplyLeave]    = useState(false);
  const [myLeaveHist,       setMyLeaveHist]       = useState(MY_LEAVE_RICH);
  const [leaveDetailId2,    setLeaveDetailId2]    = useState<string|null>(null);
  const [showLeaveExport,   setShowLeaveExport]   = useState(false);
  const [leaveDeptFilter,   setLeaveDeptFilter]   = useState("All");
  const [leaveTypeFilter,   setLeaveTypeFilter]   = useState("All");

  // Global Calendar
  const [globalCalFilters, setGlobalCalFilters] = useState(GLOBAL_CAL_FILTERS_DEF.map(f => f.label));
  const [globalCalView,    setGlobalCalView]    = useState<"month"|"week"|"list">("month");
  const toggleGlobalFilter = (f: string) => setGlobalCalFilters(fs => fs.includes(f) ? fs.filter(x => x !== f) : [...fs, f]);

  const realGlobalEvents = useMemo(() => {
    const list: Array<{
      id: string;
      day: number;
      month: number;
      year: number;
      label: string;
      type: string;
      color: string;
      dateStr: string;
    }> = [];

    // 1. Approved & Pending Leave Requests
    (visibleLeaveRequests || []).forEach((r) => {
      if (!r || r.status === "Rejected" || !r.from) return;
      try {
        const fromD = new Date(r.from);
        const toD = new Date(r.to || r.from);
        if (isNaN(fromD.getTime())) return;

        let curr = new Date(fromD);
        while (curr <= toD) {
          list.push({
            id: `lv_${r.id}_${curr.toISOString().split("T")[0]}`,
            day: curr.getDate(),
            month: curr.getMonth(),
            year: curr.getFullYear(),
            dateStr: curr.toISOString().split("T")[0],
            label: `${r.applicantName || "My"} ${r.type}`,
            type: "Approved Leave",
            color: r.type === "Annual Leave" ? "#5C5CFF" : r.type === "Sick Leave" ? "#EF4444" : "#22C55E",
          });
          curr.setDate(curr.getDate() + 1);
        }
      } catch (_) {}
    });

    // 2. Attendance Records from user subcollection
    (attRecords || []).forEach((r) => {
      if (!r || !r.date || typeof r.date !== "string") return;
      try {
        const parts = r.date.split("-");
        if (parts.length === 3) {
          const y = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10) - 1;
          const d = parseInt(parts[2], 10);

          if (r.checkInTime && r.checkInTime !== "—") {
            list.push({
              id: `att_in_${r.date}`,
              day: d,
              month: m,
              year: y,
              dateStr: r.date,
              label: `Checked In: ${r.checkInTime}`,
              type: "Attendance",
              color: "#22C55E",
            });
          }
          if (r.checkOutTime && r.checkOutTime !== "—") {
            list.push({
              id: `att_out_${r.date}`,
              day: d,
              month: m,
              year: y,
              dateStr: r.date,
              label: `Checked Out: ${r.checkOutTime}`,
              type: "Attendance",
              color: "#10B981",
            });
          }
          if (r.status === "WFH") {
            list.push({
              id: `att_wfh_${r.date}`,
              day: d,
              month: m,
              year: y,
              dateStr: r.date,
              label: "Work From Home",
              type: "WFH",
              color: "#3B82F6",
            });
          }
          list.push({
            id: `att_shift_${r.date}`,
            day: d,
            month: m,
            year: y,
            dateStr: r.date,
            label: "General Shift · 09:00-18:00",
            type: "Shift",
            color: "#14B8A6",
          });
        }
      } catch (_) {}
    });

    // 3. Attendance Issues
    (visibleIssues || []).forEach((iss) => {
      if (!iss || !iss.date || typeof iss.date !== "string") return;
      try {
        const parts = iss.date.split("-");
        if (parts.length === 3) {
          const y = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10) - 1;
          const d = parseInt(parts[2], 10);
          list.push({
            id: `issue_${iss.id}`,
            day: d,
            month: m,
            year: y,
            dateStr: iss.date,
            label: `${iss.createdByName || "Emp"} · ${iss.type || "Correction"}`,
            type: "Attendance",
            color: "#F59E0B",
          });
        }
      } catch (_) {}
    });

    return list;
  }, [visibleLeaveRequests, attRecords, visibleIssues]);

  const currentMonthGlobalEvents = useMemo(() => {
    const targetYear = globalCalDate.getFullYear();
    const targetMonth = globalCalDate.getMonth();

    return realGlobalEvents.filter((ev) => {
      const matchMonth = ev.year === targetYear && ev.month === targetMonth;
      const matchFilter = globalCalFilters.includes(ev.type);
      return matchMonth && matchFilter;
    });
  }, [realGlobalEvents, globalCalDate, globalCalFilters]);

  // Announcements
  const [annFilter,    setAnnFilter]    = useState("All");
  const [annDetailId,  setAnnDetailId]  = useState<string|null>(null);
  const [annReadIds,   setAnnReadIds]   = useState<string[]>(["ANN3"]);
  const [annPinnedIds, setAnnPinnedIds] = useState<string[]>(["ANN1"]);
  const [annBookmarks, setAnnBookmarks] = useState<string[]>([]);
  const [annComment,   setAnnComment]   = useState("");
  const [annReactions, setAnnReactions] = useState<Record<string, string[]>>({
    "ANN1": ["👍","👍","❤️","🎉"],
    "ANN2": ["👍","😮"],
    "ANN3": ["👍","👍","👍","❤️","❤️"],
  });

  const [annView,          setAnnView]          = useState<"widget"|"list">("widget");
  const [empStatusFilter,  setEmpStatusFilter]  = useState<string|null>(null);

  // Derived
  const pending          = reqs.filter(r => r.status === "Pending");
  const pendingApprovals = approvals.filter(a => a.status === "Pending");
  const overdueTasks     = myTasks.filter(t => t.overdue && !t.done);
  const completedTasks   = myTasks.filter(t => t.done);
  const unreadCount      = ANNOUNCEMENTS_DATA.filter(a => !annReadIds.includes(a.id)).length;

  const filteredApprovals = approvals.filter(a =>
    (approvalView === "Pending"  ? a.status === "Pending"  :
     approvalView === "Approved" ? a.status === "Approved" : a.status === "Rejected") &&
    (approvalType === "All" || a.type === approvalType)
  );

  const filteredAnn = ANNOUNCEMENTS_DATA.filter(a => {
    if (annFilter === "Pinned") return annPinnedIds.includes(a.id);
    if (annFilter === "Unread") return !annReadIds.includes(a.id);
    return true;
  });

  const annDetail = ANNOUNCEMENTS_DATA.find(a => a.id === annDetailId) || null;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">

      <div className="flex-1 overflow-auto">

        {/* ════════════════════ DASHBOARD ════════════════════ */}
        {tab === "Dashboard" && annView === "widget" && (
          <div className="px-4 py-3.5 space-y-3 max-w-5xl mx-auto">

            {/* Greeting */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Good morning, {userName} 👋</h2>
                <p className="text-xs text-gray-500 mt-0.5">Here's what needs your attention today.</p>
              </div>
              <span className="text-xs text-gray-400 font-mono bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200">{liveDateFormatted}</span>
            </div>

            {/* Employee Status Quick Widgets */}
            <div className="grid grid-cols-5 gap-2">
              {([
                {label:"Present",  count:statCounts.present, color:"#22C55E", bg:"#F0FDF4", border:"border-green-100"},
                {label:"WFH",      count:statCounts.wfh,      color:"#3B82F6", bg:"#EFF6FF", border:"border-blue-100"},
                {label:"Leave",    count:statCounts.leave,    color:"#8B5CF6", bg:"#F5F3FF", border:"border-purple-100"},
                {label:"Late",     count:statCounts.late,     color:"#F59E0B", bg:"#FFFBEB", border:"border-amber-100"},
                {label:"Offline",  count:statCounts.offline,  color:"#9CA3AF", bg:"#F9FAFB", border:"border-gray-100"},
              ] as {label:string;count:number;color:string;bg:string;border:string}[]).map(s=>(
                <button key={s.label} onClick={()=>setEmpStatusFilter(s.label)}
                  className={`bg-white border ${s.border} rounded-xl p-2.5 text-left hover:shadow-sm transition-all group`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{s.label}</span>
                    <div className="w-1.5 h-1.5 rounded-full" style={{backgroundColor:s.color}}/>
                  </div>
                  <div className="text-lg font-bold text-gray-900 group-hover:text-[#5C5CFF] transition-colors">{s.count}</div>
                  <div className="text-[9px] text-gray-400 mt-0.5">Click to view →</div>
                </button>
              ))}
            </div>

            {/* Today's Attendance status */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
                <h3 className="text-xs font-semibold text-gray-800">Today's Attendance</h3>
                <button onClick={() => setTab("Attendance")} className="text-xs text-[#5C5CFF] hover:underline font-medium">View details →</button>
              </div>
              <div className="px-4 py-2.5 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full flex-shrink-0", checkedIn ? "bg-green-400 shadow-[0_0_0_3px_rgba(34,197,94,0.15)] animate-pulse" : checkOutTime !== "—" ? "bg-green-500" : "bg-gray-300")} />
                  <div>
                    <div className="text-xs font-semibold text-gray-900">{checkedIn ? "Working · General Shift" : checkOutTime !== "—" ? "Completed · General Shift" : "Not Checked In"}</div>
                    <div className="text-[10px] text-gray-400">Mon–Fri · 09:00 – 18:00</div>
                  </div>
                </div>
                {(checkedIn || checkOutTime !== "—") && <>
                  <div className="h-8 w-px bg-gray-100" />
                  <div className="text-xs"><span className="text-gray-400">Check-in</span><div className="font-mono font-semibold text-gray-800 mt-0.5">{checkInTime}</div></div>
                  {checkOutTime !== "—" && (
                    <>
                      <div className="h-8 w-px bg-gray-100" />
                      <div className="text-xs"><span className="text-gray-400">Check-out</span><div className="font-mono font-semibold text-gray-800 mt-0.5">{checkOutTime}</div></div>
                    </>
                  )}
                  <div className="h-8 w-px bg-gray-100" />
                  <div className="text-xs"><span className="text-gray-400">Working</span><div className="font-mono font-semibold text-[#5C5CFF] mt-0.5">{workingTimeStr}</div></div>
                  <div className="h-8 w-px bg-gray-100" />
                  <div className="text-xs"><span className="text-gray-400">Expected out</span><div className="font-mono font-semibold text-gray-800 mt-0.5">06:00 PM</div></div>
                  <div className="h-8 w-px bg-gray-100" />
                  <div className="text-xs cursor-pointer hover:opacity-85 transition-opacity select-none text-left" onClick={() => setShowLocationModal(true)}>
                    <span className="text-gray-400">Location</span>
                    <div className="font-semibold text-gray-800 mt-0.5 flex items-center gap-0.5">
                      <MapPin size={12} className="text-red-500 fill-red-100" />
                      {todayAtt?.location || orgData?.name || orgData?.companyName || "Office HQ"}
                    </div>
                  <div className={cn("text-[9px] font-semibold leading-tight", todayAtt?.location === "Work from Home" ? "text-amber-500" : "text-green-600")}>
                      {todayAtt?.location === "Work from Home" ? "Remote (WFH)" : "Inside geo-fence"}
                    </div>
                  </div>
                </>}
                <div className="ml-auto flex items-center gap-2">
                  {checkedIn ? (
                    <button onClick={handleCheckOut} className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-red-50 text-red-600 border border-red-200 text-xs font-semibold rounded-lg hover:bg-red-100 transition-colors"><UserX size={13} />Check Out</button>
                  ) : checkOutTime !== "—" ? (
                    <div className="px-4 py-1.5 bg-green-50 text-green-700 border border-green-200 text-xs font-semibold rounded-lg flex items-center gap-1.5"><CheckCircle size={13} />Day work complete</div>
                  ) : (
                    <button onClick={handleCheckIn} disabled={isCheckingIn} className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#5C5CFF] text-white text-xs font-semibold rounded-lg hover:bg-[#4A4AE0] transition-colors disabled:opacity-50">{isCheckingIn ? <RefreshCw size={13} className="animate-spin" /> : <UserCheck size={13} />}Check In</button>
                  )}
                </div>
              </div>
            </div>

            {/* ── Monthly Attendance Graph — Primary, Full Width ── */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
                <div>
                  <h3 className="text-xs font-semibold text-gray-800">Monthly Attendance</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">Your Real-time Record · Daily hours worked</p>
                </div>
                <div className="flex items-center gap-3 text-[9px] text-gray-400">
                  {([["#5C5CFF","≥9h"],["#A5B4FC","<9h"],["#93C5FD","WFH"],["#FCD34D","Late"],["#C4B5FD","Leave"],["#E5E7EB","Off"]] as [string,string][]).map(([c,l]) => (
                    <div key={l} className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm" style={{ backgroundColor:c }} />{l}</div>
                  ))}
                </div>
              </div>
              <div className="px-4 pt-3 pb-2">
                <ResponsiveContainer width="100%" height={150}>
                  <RBarChart data={realMonthlyChartData} barSize={12} margin={{ top:4, right:4, left:-20, bottom:0 }}>
                    <CartesianGrid key="cg-ov" strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis key="xaxis-ov" dataKey="day" tick={{ fontSize:9, fill:"#9CA3AF" }} axisLine={false} tickLine={false} />
                    <YAxis key="yaxis-ov" domain={[0,12]} tick={{ fontSize:9, fill:"#9CA3AF" }} axisLine={false} tickLine={false} tickFormatter={(v:number) => v===0?"":v+"h"} />
                    <Tooltip key="tip-ov" formatter={(v:number) => [`${v}h`,"Hours"]} labelFormatter={(l) => `Day ${l}`} contentStyle={{ fontSize:11, borderRadius:8, border:"1px solid #e5e7eb" }} />
                    <Bar key="bar-ov" dataKey="h" radius={[2,2,0,0]}>
                      {realMonthlyChartData.map((d,i) => <Cell key={`ov-${i}`} fill={barFill(d.s, d.h)} />)}
                    </Bar>
                  </RBarChart>
                </ResponsiveContainer>
                <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-gray-50 text-xs">
                  <div className="flex items-center gap-4 text-gray-500">
                    <span>Present: <strong className="text-gray-800">{userAttSummary.present}d</strong></span>
                    <span>WFH: <strong className="text-blue-500">{userAttSummary.wfh}d</strong></span>
                    <span>Leave: <strong className="text-purple-500">{userAttSummary.leave}d</strong></span>
                    <span>Late: <strong className="text-amber-500">{userAttSummary.late}d</strong></span>
                    <span>Total: <strong className="text-gray-800">{userAttSummary.totalHours}h</strong></span>
                  </div>
                  <button onClick={() => setTab("Attendance")} className="text-xs text-[#5C5CFF] hover:underline font-medium">Full report →</button>
                </div>
              </div>
            </div>

            {/* Pending Approvals quick-view */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-semibold text-gray-800">Pending Approvals</h3>
                  {pendingApprovals.length > 0 && <span className="min-w-[18px] h-4.5 px-1.5 rounded-full bg-[#5C5CFF] text-white text-[9px] font-bold flex items-center justify-center">{pendingApprovals.length}</span>}
                </div>
                <button onClick={() => setTab("Approvals")} className="text-xs text-[#5C5CFF] hover:underline font-medium">View all →</button>
              </div>
              <div className="grid grid-cols-4 divide-x divide-gray-100 border-b border-gray-100 bg-gray-50/50">
                {[
                  {label:"Leave",count:pendingApprovals.filter(a => a.category === "Leave").length,color:"#F59E0B"},
                  {label:"Attendance",count:pendingApprovals.filter(a => a.category === "Attendance").length,color:"#5C5CFF"},
                  {label:"Shift",count:pendingApprovals.filter(a => a.category === "Shift").length,color:"#22C55E"},
                  {label:"Department",count:pendingApprovals.filter(a => a.category === "Department").length,color:"#8B5CF6"}
                ].map(t => (
                  <button key={t.label} onClick={() => { setTab("Approvals"); setApprovalType(t.label); }}
                    className="py-2 text-center hover:bg-gray-50 transition-colors">
                    <div className="text-base font-bold" style={{ color:t.color }}>{t.count}</div>
                    <div className="text-[10px] text-gray-400 font-medium">{t.label}</div>
                  </button>
                ))}
              </div>
              <div className="divide-y divide-gray-100">
                {pendingApprovals.length === 0 && <div className="py-5 text-center"><CheckCircle size={16} className="text-green-400 mx-auto mb-1" /><p className="text-xs text-gray-400">All caught up</p></div>}
                {pendingApprovals.slice(0,4).map(r => (
                  <div key={r.id} className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50">
                    <Avt initials={r.employee.split(" ").map((n:string) => n[0]).join("")} color={EMP_COLORS[parseInt(r.rawId.slice(-1), 16) % EMP_COLORS.length || 0]} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{r.employee}</p>
                      <p className="text-[10px] text-gray-500">{r.type} · {r.days} · {r.dateRange}</p>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => handleApproveApprovalItem(r)} className="px-2.5 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-semibold hover:bg-green-100 flex items-center gap-1"><CheckCircle size={10} />Approve</button>
                      <button onClick={() => setAppRejectId(r.id)}  className="px-2.5 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 flex items-center gap-1"><X size={10} />Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* My Tasks quick-view */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-semibold text-gray-800">My Tasks</h3>
                  <div className="flex items-center gap-1.5 text-[9px]">
                    {overdueTasks.length > 0   && <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-semibold">{overdueTasks.length} overdue</span>}
                    {completedTasks.length > 0 && <span className="bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-semibold">{completedTasks.length} done</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => navigate("tasks")} className="text-xs text-[#5C5CFF] hover:underline font-medium">View all →</button>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {myTasks.slice(0,6).map(t => (
                  <div key={t.id} onClick={() => { navigate("tasks"); setActiveTaskId(t.id); }} className={cn("flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-pointer", t.done && "opacity-50")}>
                    <input type="checkbox" checked={t.done} onChange={e => { e.stopPropagation(); toggleTask(t.id); }} onClick={e => e.stopPropagation()} className="rounded border-gray-300 accent-[#5C5CFF] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className={cn("text-xs text-gray-800", t.done && "line-through text-gray-400")}>{t.title}</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[9px] font-mono text-gray-300">{t.id}</span>
                        {t.overdue && !t.done && <span className="text-[9px] text-red-500 font-semibold">Overdue</span>}
                      </div>
                    </div>
                    <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", t.priority==="High"?"bg-red-50 text-red-600":t.priority==="Medium"?"bg-amber-50 text-amber-600":"bg-gray-100 text-gray-500")}>{t.priority}</span>
                    <span className="text-[10px] text-gray-400 font-mono">{t.due}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activities */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100"><h3 className="text-sm font-semibold text-gray-800">Recent Activities</h3></div>
              <div className="divide-y divide-gray-100">
                {recentActivities?.map((a: any,i: number) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 cursor-pointer">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor:a.color+"18" }}><a.icon size={13} style={{ color:a.color }} /></div>
                    <p className="text-xs text-gray-700 flex-1 leading-snug">{a.text}</p>
                    <span className="text-[10px] text-gray-400">{a.time}</span>
                  </div>
                ))}
                {recentActivities.length === 0 && <div className="py-5 text-center"><p className="text-xs text-gray-400">No recent activities</p></div>}
              </div>
            </div>

            {/* ── Announcements Widget ── */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-800">Announcements</h3>
                  {unreadCount > 0 && <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#5C5CFF] text-white text-[9px] font-bold flex items-center justify-center">{unreadCount}</span>}
                </div>
                <button onClick={()=>setAnnView("list")} className="text-xs text-[#5C5CFF] hover:underline">View all →</button>
              </div>
              {/* Pinned */}
              {ANNOUNCEMENTS_DATA.filter(a=>annPinnedIds.includes(a.id)).slice(0,1).map(a=>(
                <div key={a.id} onClick={()=>{setAnnDetailId(a.id);setAnnReadIds(r=>[...new Set([...r,a.id])]);}}
                  className="flex items-start gap-3 px-5 py-3 bg-amber-50/60 border-b border-amber-100 cursor-pointer hover:bg-amber-50 transition-colors">
                  <Pin size={12} className="text-amber-500 mt-0.5 flex-shrink-0"/>
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] font-semibold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded uppercase mr-2">Pinned</span>
                    <span className="text-xs font-semibold text-gray-900">{a.title || "Announcement"}</span>
                    <p className="text-[10px] text-gray-500 truncate mt-0.5">{(a.body || "").split("\n")[0]}</p>
                  </div>
                  <span className="text-[10px] text-gray-400 flex-shrink-0">{a.timeAgo}</span>
                </div>
              ))}
              {/* Latest */}
              <div className="divide-y divide-gray-100">
                {ANNOUNCEMENTS_DATA.filter(a=>!annPinnedIds.includes(a.id)).slice(0,3).map(a=>(
                  <div key={a.id} onClick={()=>{setAnnDetailId(a.id);setAnnReadIds(r=>[...new Set([...r,a.id])]);}}
                    className={cn("flex items-start gap-3 px-5 py-3 cursor-pointer hover:bg-gray-50 transition-colors",!annReadIds.includes(a.id)&&"bg-[#EEF2FF]/20")}>
                    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-white mt-0.5",a.priority==="High"?"bg-[#5C5CFF]":"bg-gray-400")}>
                      {a.category==="Event"?<CalendarDays size={12}/>:a.category==="Policy"?<FileText size={12}/>:<Megaphone size={12}/>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        {!annReadIds.includes(a.id)&&<span className="w-1.5 h-1.5 bg-[#5C5CFF] rounded-full flex-shrink-0"/>}
                        <span className="text-xs font-semibold text-gray-900 truncate">{a.title || "Announcement"}</span>
                      </div>
                      <p className="text-[10px] text-gray-500 truncate">{(a.body || "").split("\n")[0]}</p>
                      <p className="text-[9px] text-gray-400 mt-0.5">{a.author || "Admin"} · {a.timeAgo}</p>
                    </div>
                    <span className="text-[10px] text-gray-400 flex-shrink-0">{a.category || "General"}</span>
                  </div>
                ))}
                {ANNOUNCEMENTS_DATA.length === 0 && <div className="py-5 text-center"><p className="text-xs text-gray-400">No recent announcements</p></div>}
              </div>
            </div>

          </div>
        )}

        {/* ════════════════════ ANNOUNCEMENTS LIST (from Dashboard) ════════════════════ */}
        {tab === "Dashboard" && annView === "list" && (
          <div className="flex flex-col h-full">
            <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3 flex-shrink-0">
              <button onClick={()=>setAnnView("widget")} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700"><ChevronLeft size={14}/>Dashboard</button>
              <span className="text-sm font-semibold text-gray-800 ml-1">Announcements</span>
              <div className="flex gap-1 ml-4">
                {["All","Pinned","Unread","Archived"].map(f => (
                  <button key={f} onClick={() => setAnnFilter(f)} className={cn("px-3 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors", annFilter===f?"bg-[#EEF2FF] text-[#5C5CFF]":"text-gray-600 hover:bg-gray-100")}>
                    {f}{f==="Unread"&&unreadCount>0&&<span className="w-4 h-4 bg-[#5C5CFF] text-white text-[9px] font-bold rounded-full flex items-center justify-center">{unreadCount}</span>}
                  </button>
                ))}
              </div>
              <div className="ml-auto"><div className="relative"><Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"/><input placeholder="Search…" className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-[#5C5CFF] w-44"/></div></div>
            </div>
            <div className="flex-1 overflow-auto">
              <div className="max-w-3xl mx-auto px-6 py-5 space-y-5">
                {annFilter === "All" && (
                  <div>
                    <div className="flex items-center gap-2 mb-3"><Pin size={12} className="text-amber-500"/><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pinned</p></div>
                    {ANNOUNCEMENTS_DATA.filter(a=>annPinnedIds.includes(a.id)).map(a=>(
                      <div key={a.id} onClick={()=>{setAnnDetailId(a.id);setAnnReadIds(r=>[...new Set([...r,a.id])]);}}
                        className="bg-white border-2 border-amber-200 rounded-xl p-4 mb-3 cursor-pointer hover:border-amber-300 hover:shadow-sm transition-all">
                        <div className="flex items-start gap-3">
                          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white",a.priority==="High"?"bg-[#5C5CFF]":"bg-amber-400")}>
                            {a.category==="Event"?<CalendarDays size={16}/>:a.category==="Policy"?<FileText size={16}/>:<Megaphone size={16}/>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1"><span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{a.category}</span>{!annReadIds.includes(a.id)&&<span className="w-2 h-2 bg-[#5C5CFF] rounded-full"/>}<Pin size={10} className="text-amber-500 ml-auto"/></div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-1">{a.title}</h3>
                            <p className="text-xs text-gray-500 line-clamp-2">{a.body.split("\n")[0]}</p>
                            <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-400"><Avt initials={a.author.split(" ").map(n=>n[0]).join("")} color="#5C5CFF" size="xs"/><span>{a.author}</span><span>·</span><span>{a.timeAgo}</span><span className="ml-auto">{a.readCount} reads</span></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div>
                  {annFilter==="All"&&<div className="flex items-center gap-2 mb-3"><Bell size={12} className="text-gray-400"/><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Recent Announcements</p></div>}
                  <div className="space-y-2.5">
                    {filteredAnn.filter(a=>annFilter==="All"?!annPinnedIds.includes(a.id):true).map(a=>(
                      <div key={a.id} onClick={()=>{setAnnDetailId(a.id);setAnnReadIds(r=>[...new Set([...r,a.id])]);}}
                        className={cn("bg-white border rounded-xl p-4 cursor-pointer hover:border-[#5C5CFF]/30 hover:shadow-sm transition-all flex items-start gap-3",!annReadIds.includes(a.id)?"border-[#5C5CFF]/20 bg-[#EEF2FF]/20":"border-gray-200")}>
                        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-white",a.priority==="High"?"bg-[#5C5CFF]":"bg-gray-400")}>
                          {a.category==="Event"?<CalendarDays size={14}/>:a.category==="Policy"?<FileText size={14}/>:a.category==="Team"?<Users size={14}/>:<Megaphone size={14}/>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5"><span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{a.category}</span>{!annReadIds.includes(a.id)&&<span className="text-[10px] font-semibold text-[#5C5CFF] flex items-center gap-1"><span className="w-1.5 h-1.5 bg-[#5C5CFF] rounded-full"/>New</span>}</div>
                          <h3 className="text-sm font-semibold text-gray-900 mb-0.5">{a.title}</h3>
                          <p className="text-xs text-gray-500 line-clamp-1">{a.body.split("\n")[0]}</p>
                          <div className="flex items-center gap-2 mt-1.5 text-[10px] text-gray-400"><span>{a.author}</span><span>·</span><span>{a.timeAgo}</span><span className="ml-auto flex items-center gap-3"><span className="flex items-center gap-1"><Eye size={10}/>{a.readCount}</span><span className="flex items-center gap-1"><ThumbsUp size={10}/>{(annReactions[a.id]||[]).length}</span></span></div>
                        </div>
                      </div>
                    ))}
                    {filteredAnn.length===0&&<div className="py-12 text-center"><Bell size={24} className="text-gray-200 mx-auto mb-2"/><p className="text-sm text-gray-400">No {annFilter.toLowerCase()} announcements</p></div>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contextual Overlay Drawer for Dashboard Announcement details */}
        <Drawer
          isOpen={tab === "Dashboard" && !!annDetailId && !!annDetail}
          onClose={() => { setAnnDetailId(null); setAnnView(annView === "list" ? "list" : "widget"); }}
          title={annDetail?.title || "Announcement Details"}
          avatar={
            annDetail ? (
              <Avt initials={annDetail.author.split(" ").map(n => n[0]).join("")} color="#5C5CFF" size="md" />
            ) : null
          }
          headerAddon={
            annDetail ? (
              <div className="flex gap-2">
                <button
                  onClick={() => setAnnPinnedIds(p => p.includes(annDetail.id) ? p.filter(x => x !== annDetail.id) : [...p, annDetail.id])}
                  className={cn("flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-semibold transition-colors", annPinnedIds.includes(annDetail.id) ? "border-amber-300 bg-amber-50 text-amber-700" : "border-gray-200 text-gray-500 hover:bg-gray-50")}
                >
                  <Pin size={10} />
                  {annPinnedIds.includes(annDetail.id) ? "Pinned" : "Pin"}
                </button>
                <button
                  onClick={() => setAnnBookmarks(b => b.includes(annDetail.id) ? b.filter(x => x !== annDetail.id) : [...b, annDetail.id])}
                  className={cn("flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-semibold transition-colors", annBookmarks.includes(annDetail.id) ? "border-[#5C5CFF] bg-[#EEF2FF] text-[#5C5CFF]" : "border-gray-200 text-gray-500 hover:bg-gray-50")}
                >
                  <Bookmark size={10} />
                  {annBookmarks.includes(annDetail.id) ? "Saved" : "Save"}
                </button>
              </div>
            ) : null
          }
          footer={
            <Btn variant="outline" onClick={() => { setAnnDetailId(null); setAnnView(annView === "list" ? "list" : "widget"); }}>Close Details</Btn>
          }
        >
          {annDetail && (
            <div className="space-y-6 text-left">
              {/* Banner/Priority widget */}
              <div className={cn("h-28 rounded-2xl flex items-center justify-center shadow-inner", annDetail.priority === "High" ? "bg-[#5C5CFF]" : "bg-gradient-to-br from-amber-400 to-orange-500")}>
                <div className="text-center">
                  {annDetail.category === "Event" ? <CalendarDays size={32} className="text-white/70 mx-auto mb-1" /> : annDetail.category === "Policy" ? <FileText size={32} className="text-white/70 mx-auto mb-1" /> : <Megaphone size={32} className="text-white/70 mx-auto mb-1" />}
                  <span className="text-white/80 text-xs font-semibold uppercase tracking-wider">{annDetail.category}</span>
                </div>
              </div>

              {/* Publisher info card */}
              <div className="bg-white rounded-xl border border-gray-150 p-4 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <Avt initials={annDetail.author.split(" ").map(n => n[0]).join("")} color="#5C5CFF" size="sm" />
                  <div>
                    <p className="text-xs font-bold text-gray-800">{annDetail.author}</p>
                    <p className="text-[10px] text-gray-400">Published {annDetail.timeAgo} · {annDetail.readCount} reads</p>
                  </div>
                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto", annDetail.priority === "High" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600")}>{annDetail.priority} Priority</span>
                </div>
              </div>

              {/* Body Content */}
              <div className="bg-white border border-gray-150 rounded-xl p-5 shadow-sm">
                <div className="space-y-2">
                  {annDetail.body.split("\n").map((line, i) => (
                    <p key={i} className={cn("text-xs text-gray-700 leading-relaxed", line.startsWith("•") ? "ml-3 mt-1" : line === "" ? "my-1.5" : "mb-2", line.trim().endsWith(":") && "font-bold text-gray-900 mt-3")}>
                      {line}
                    </p>
                  ))}
                </div>
              </div>

              {/* Reactions Widget */}
              <div className="bg-white border border-gray-150 rounded-xl p-4 shadow-sm">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Reactions</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {["👍", "❤️", "🎉", "😮", "👏"].map(emoji => {
                    const count = (annReactions[annDetail.id] || []).filter(r => r === emoji).length;
                    return (
                      <button
                        key={emoji}
                        onClick={() => setAnnReactions(ar => ({ ...ar, [annDetail.id]: [...(ar[annDetail.id] || []), emoji] }))}
                        className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs hover:scale-105 transition-all", count > 0 ? "border-[#5C5CFF]/30 bg-[#EEF2FF] text-[#5C5CFF] font-semibold" : "border-gray-200 hover:border-gray-300")}
                      >
                        {emoji}
                        <span>{count || ""}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Comments Section */}
              <div className="bg-white border border-gray-150 rounded-xl p-4 shadow-sm space-y-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Comments</p>
                <div className="space-y-3">
                  {[{ author: "Sarah Mitchell", text: "Thank you for sharing! Looking forward to the all-hands.", time: "2 hours ago", color: "#22C55E" }, { author: "Marcus Johnson", text: "Can we get a recording link after the meeting?", time: "1 hour ago", color: "#F59E0B" }].map((c, i) => (
                    <div key={i} className="flex gap-2.5">
                      <Avt initials={c.author.split(" ").map(n => n[0]).join("")} color={c.color} size="xs" />
                      <div className="flex-1 bg-gray-50 rounded-lg p-2.5 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-gray-800">{c.author}</span>
                          <span className="text-[9px] text-gray-400">{c.time}</span>
                        </div>
                        <p className="text-gray-700 leading-relaxed">{c.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  <Avt initials="AA" color="#5C5CFF" size="xs" />
                  <div className="flex-1 flex gap-1.5">
                    <input
                      type="text"
                      value={annComment}
                      onChange={e => setAnnComment(e.target.value)}
                      placeholder="Add a comment…"
                      className="flex-1 px-3 py-1.5 text-xs border border-gray-205 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5C5CFF] bg-gray-50"
                    />
                    <button onClick={() => setAnnComment("")} className="px-2.5 py-1.5 bg-[#5C5CFF] text-white rounded-lg hover:bg-[#4A4AE0] transition-colors"><Send size={12} /></button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Drawer>

        {/* ════════════════════ ATTENDANCE ════════════════════ */}
        {tab === "Attendance" && (
          <div className="flex flex-col h-full">

            {/* ── Section switcher bar ── */}
            {!hideAttendanceHeader && (
              <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
                {/* Left Section */}
                <div className="flex items-center gap-4">
                  <div className="flex gap-1.5">
                    {(["summary","timeline","calendar","issues"] as const).map(v=>(
                      <button key={v} onClick={()=>setAttView(v)} className={cn("px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",attView===v?"bg-[#EEF2FF] text-[#5C5CFF]":"text-gray-600 hover:bg-gray-100")}>
                        {v==="summary"?"Summary":v==="timeline"?"History":v==="calendar"?"Calendar":"Issues"}
                      </button>
                    ))}
                  </div>
                  {attView==="summary"&&(
                    <>
                      <div className="w-px h-4 bg-gray-200"/>
                      <div className="flex rounded-lg border border-gray-200 overflow-hidden p-0.5 bg-gray-50 gap-0.5">
                        {(["Weekly","Monthly","Yearly"] as const).map(p=>(
                          <button key={p} onClick={()=>setAttPeriod(p)} className={cn("px-2.5 py-1 text-xs font-medium rounded-md transition-colors",attPeriod===p?"bg-white text-gray-900 shadow-sm":"text-gray-500 hover:text-gray-700")}>{p}</button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              {/* Sub-tabs — My Team */}
              {attSection==="My Team" && (
                <div className="flex gap-1">
                  {(["overview","exceptions","analytics"] as const).map(v=>(
                    <button key={v} onClick={()=>setAttTeamView(v)} className={cn("px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors",attTeamView===v?"bg-[#EEF2FF] text-[#5C5CFF]":"text-gray-600 hover:bg-gray-100")}>
                      {v==="overview"?"Overview":v==="exceptions"?"Exceptions":"Analytics"}
                    </button>
                  ))}
                </div>
              )}
              {/* Right actions */}
              <div className="ml-auto flex items-center gap-2">
                {/* Filter — My Space only on Summary/Timeline; always on My Team */}
                {(attSection==="My Team"||(attSection==="My Space"&&(attView==="summary" || attView==="timeline")))&&(
                  <div className="relative">
                    <button onClick={()=>{ setShowAttFilter(v=>!v); setShowAttExport(false); }} className={cn("flex items-center gap-1.5 px-2.5 py-1.5 text-xs border rounded-lg transition-colors",showAttFilter?"border-[#5C5CFF] bg-[#EEF2FF] text-[#5C5CFF]":"border-gray-200 text-gray-600 hover:bg-gray-50")}>
                      <Sliders size={12}/>Filters
                    </button>
                    {showAttFilter&&(
                      <div className="absolute top-full right-0 mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-xl z-40 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-gray-700">Filters</p>
                          <button onClick={()=>setShowAttFilter(false)}><X size={13} className="text-gray-400"/></button>
                        </div>
                        {attSection==="My Team"&&(
                          <div>
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Department</p>
                            <select value={teamDeptFilter} onChange={e=>setTeamDeptFilter(e.target.value)} className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#5C5CFF]">
                              {["All","Engineering","HR","Sales","Design","Finance","Operations"].map(d=><option key={d}>{d}</option>)}
                            </select>
                          </div>
                        )}
                        {attSection==="My Team"&&(
                          <div>
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Status</p>
                            <div className="flex flex-wrap gap-1">
                              {["All","Present","Late","WFH","Leave","Absent"].map(s=>(
                                <button key={s} onClick={()=>setTeamStatusFilter(s)} className={cn("px-2.5 py-1 text-[10px] font-medium border rounded-lg transition-colors",teamStatusFilter===s?"border-[#5C5CFF] bg-[#EEF2FF] text-[#5C5CFF]":"border-gray-200 text-gray-500 hover:border-gray-300")}>{s}</button>
                              ))}
                            </div>
                          </div>
                        )}
                        <div>
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Quarter</p>
                          <div className="flex gap-1">
                            {["All","Q1","Q2","Q3","Q4"].map(q=>(
                              <button key={q} onClick={()=>setAttFQuarter(q)} className={cn("flex-1 py-1 text-[10px] font-medium border rounded-lg transition-colors",attFQuarter===q?"border-[#5C5CFF] bg-[#EEF2FF] text-[#5C5CFF]":"border-gray-200 text-gray-500 hover:border-gray-300")}>{q}</button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Month</p>
                          <select value={attFMonth} onChange={e=>setAttFMonth(e.target.value)} className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#5C5CFF]">
                            {["All","January","February","March","April","May","June","July","August","September","October","November","December"].map(m=><option key={m}>{m}</option>)}
                          </select>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Shift</p>
                          <select value={attFShift} onChange={e=>setAttFShift(e.target.value)} className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#5C5CFF]">
                            {["All","General (09:00–18:00)","Morning (06:00–15:00)","Evening (14:00–23:00)","Night (22:00–07:00)"].map(s=><option key={s}>{s}</option>)}
                          </select>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Date Range</p>
                          <div className="flex gap-2">
                            <input type="date" value={attFStartDate} onChange={e=>setAttFStartDate(e.target.value)} className="flex-1 px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#5C5CFF]"/>
                            <input type="date" value={attFEndDate} onChange={e=>setAttFEndDate(e.target.value)} className="flex-1 px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#5C5CFF]"/>
                          </div>
                        </div>
                        <div className="pt-2 border-t border-gray-100 flex gap-2">
                          <button onClick={()=>{setAttFMonth("All");setAttFQuarter("All");setAttFDept("All");setAttFShift("All");setTeamDeptFilter("All");setTeamStatusFilter("All");setAttFStartDate("");setAttFEndDate("");setShowAttFilter(false);}} className="flex-1 px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">Reset</button>
                          <button onClick={()=>setShowAttFilter(false)} className="flex-1 px-3 py-1.5 text-xs bg-[#5C5CFF] text-white rounded-lg hover:bg-[#4A4AE0]">Apply</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {/* Export */}
                <div className="relative">
                  <button onClick={()=>{ setShowAttExport(v=>!v); setShowAttFilter(false); }} className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
                    <Download size={12}/>Export
                  </button>
                  {showAttExport&&(
                    <div className="absolute top-full right-0 mt-1 w-40 bg-white border border-gray-200 rounded-xl shadow-lg z-40 py-1 font-sans">
                      {["Excel (.xlsx)","CSV (.csv)","PDF Report"].map(fmt=>(
                        <button key={fmt} 
                          onClick={()=>{
                            setShowAttExport(false);
                            if (fmt.includes("CSV") || fmt.includes("Excel")) {
                              if (attView === "issues") {
                                exportIssuesToCSV(filteredVisibleIssues, "attendance_issues_report.csv");
                              } else {
                                exportToCSV(filteredAttTimeline, "attendance_report.csv");
                              }
                            } else if (fmt.includes("PDF")) {
                              window.print();
                            }
                          }} 
                          className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Download size={10} className="text-gray-400"/>{fmt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {/* Check in/out — only in My Space */}
                {attSection==="My Space"&&(
                  !checkedIn
                    ? <button onClick={()=>setCheckedIn(true)} className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#5C5CFF] text-white text-xs font-semibold rounded-lg hover:bg-[#4A4AE0]"><UserCheck size={13}/>Check In</button>
                    : <button onClick={()=>setCheckedIn(false)} className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-red-50 text-red-600 border border-red-200 text-xs font-semibold rounded-lg hover:bg-red-100"><UserX size={13}/>Check Out</button>
                )}
              </div>
            </div>
          )}

            {/* ══════════════════════════════════════════════════════════
                MY SPACE
            ══════════════════════════════════════════════════════════ */}
            {attSection==="My Space" && (
            <div className="flex-1 overflow-auto p-5 space-y-4 max-w-4xl mx-auto w-full">

              {/* ══════════════════════════ SUMMARY ══════════════════════════ */}
              {attView === "summary" && (<>

                {/* Current Status */}
                <div className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-center gap-5">
                  <div className="flex items-center gap-2.5">
                    <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", checkedIn?"bg-green-400 shadow-[0_0_0_3px_rgba(34,197,94,0.15)]":"bg-gray-300")}/>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{checkedIn?"Working · General Shift":"Not Checked In Today"}</div>
                      <div className="text-[10px] text-gray-400">Mon–Fri · 09:00 – 18:00 · Office / Geo-fence</div>
                    </div>
                  </div>
                  {checkedIn && <>
                    <div className="h-8 w-px bg-gray-100"/>
                    <div className="text-xs"><span className="text-gray-400">Check-in</span><div className="font-mono font-semibold text-gray-800 mt-0.5">{checkInTime}</div></div>
                    <div className="h-8 w-px bg-gray-100"/>
                    <div className="text-xs"><span className="text-gray-400">Duration</span><div className="font-mono font-semibold text-[#5C5CFF] mt-0.5">{workingTimeStr}</div></div>
                    <div className="h-8 w-px bg-gray-100"/>
                    <div className="text-xs"><span className="text-gray-400">Expected out</span><div className="font-mono font-semibold text-gray-800 mt-0.5">06:00 PM</div></div>
                  </>}
                  <div className="ml-auto">
                    <span className={cn(
                      "text-[10px] font-semibold px-2 py-1 rounded-full",
                      !checkedIn
                        ? "bg-gray-100 text-gray-500"
                        : todayAtt?.status === "Late"
                        ? "bg-amber-50 text-amber-700"
                        : todayAtt?.status === "WFH"
                        ? "bg-blue-50 text-blue-700"
                        : "bg-green-50 text-green-700"
                    )}>
                      {!checkedIn
                        ? "Not Checked In"
                        : todayAtt?.status === "Late"
                        ? "Late · Today"
                        : todayAtt?.status === "WFH"
                        ? "WFH · Today"
                        : "On Time · Today"}
                    </span>
                  </div>
                </div>

                {/* KPI Cards — period-aware with real-time data */}
                <div className="grid grid-cols-4 gap-3">
                  {(attPeriod==="Yearly"
                    ? [{label:"Present Days",value:`${userAttSummary.present}`,sub:"this year",color:"#22C55E",comp:"Real-time"},{label:"WFH Days",value:`${userAttSummary.wfh}`,sub:"this year",color:"#3B82F6",comp:"Real-time"},{label:"Leave Days",value:`${userAttSummary.leave}`,sub:"this year",color:"#8B5CF6",comp:"Real-time"},{label:"Absent Days",value:"0",sub:"this year",color:"#EF4444",comp:"—"},{label:"Late Arrivals",value:`${userAttSummary.late}`,sub:"late arrivals",color:"#F59E0B",comp:"Real-time"},{label:"Total Hours",value:`${userAttSummary.totalHours}h`,sub:"this year",color:"#5C5CFF",comp:"Real-time"},{label:"Avg Hours/Day",value:`${userAttSummary.present > 0 ? (userAttSummary.totalHours / userAttSummary.present).toFixed(1) + 'h' : '0h'}`,sub:"vs 8h target",color:"#06B6D4",comp:"Real-time"},{label:"Attendance %",value:`${userAttSummary.present > 0 ? Math.min(100, Math.round((userAttSummary.present / Math.max(1, userAttSummary.present + userAttSummary.leave)) * 100)) + '%' : '100%'}`,sub:"this year",color:"#22C55E",comp:"Real-time"}]
                    :attPeriod==="Monthly"
                    ? [{label:"Present Days",value:`${userAttSummary.present}`,sub:"this month",color:"#22C55E",comp:"Real-time"},{label:"WFH Days",value:`${userAttSummary.wfh}`,sub:"this month",color:"#3B82F6",comp:"Real-time"},{label:"Leave Days",value:`${userAttSummary.leave}`,sub:"this month",color:"#8B5CF6",comp:"Real-time"},{label:"Absent Days",value:"0",sub:"this month",color:"#EF4444",comp:"—"},{label:"Late Arrivals",value:`${userAttSummary.late}`,sub:"late arrivals",color:"#F59E0B",comp:"Real-time"},{label:"Total Hours",value:`${userAttSummary.totalHours}h`,sub:"this month",color:"#5C5CFF",comp:"Real-time"},{label:"Avg Hours/Day",value:`${userAttSummary.present > 0 ? (userAttSummary.totalHours / userAttSummary.present).toFixed(1) + 'h' : '0h'}`,sub:"vs 8h target",color:"#06B6D4",comp:"Real-time"},{label:"Attendance %",value:`${userAttSummary.present > 0 ? Math.min(100, Math.round((userAttSummary.present / Math.max(1, userAttSummary.present + userAttSummary.leave)) * 100)) + '%' : '100%'}`,sub:"this month",color:"#22C55E",comp:"Real-time"}]
                    : [{label:"Present Days",value:`${userAttSummary.present}`,sub:"this week",color:"#22C55E",comp:"Real-time"},{label:"WFH Days",value:`${userAttSummary.wfh}`,sub:"this week",color:"#3B82F6",comp:"Real-time"},{label:"Leave Days",value:`${userAttSummary.leave}`,sub:"this week",color:"#8B5CF6",comp:"Real-time"},{label:"Absent Days",value:"0",sub:"this week",color:"#EF4444",comp:"—"},{label:"Late Arrivals",value:`${userAttSummary.late}`,sub:"late arrivals",color:"#F59E0B",comp:"Real-time"},{label:"Total Hours",value:`${userAttSummary.totalHours}h`,sub:"this week",color:"#5C5CFF",comp:"Real-time"},{label:"Avg Hours/Day",value:`${userAttSummary.present > 0 ? (userAttSummary.totalHours / userAttSummary.present).toFixed(1) + 'h' : '0h'}`,sub:"vs 8h target",color:"#06B6D4",comp:"Real-time"},{label:"Attendance %",value:`${userAttSummary.present > 0 ? Math.min(100, Math.round((userAttSummary.present / Math.max(1, userAttSummary.present + userAttSummary.leave)) * 100)) + '%' : '100%'}`,sub:"this week",color:"#22C55E",comp:"Real-time"}]
                  ).map(s => (
                    <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2"><span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{s.label}</span><div className="w-1.5 h-1.5 rounded-full" style={{backgroundColor:s.color}}/></div>
                      <div className="text-xl font-bold text-gray-900 mb-0.5">{s.value}</div>
                      <div className="text-[10px] text-gray-400">{s.sub}</div>
                      <div className="text-[10px] text-[#5C5CFF] mt-1 font-medium">{s.comp}</div>
                    </div>
                  ))}
                </div>

                {/* Attendance Graph */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-800">{attPeriod} Attendance</h3>
                    <div className="flex items-center gap-4 text-[10px] text-gray-400">
                      {([["#5C5CFF","On target"],["#A5B4FC","Below"],["#93C5FD","WFH"],["#FCD34D","Late"],["#C4B5FD","Leave"],["#E5E7EB","Off"]] as [string,string][]).map(([c,l]) => (
                        <div key={l} className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm" style={{backgroundColor:c}}/>{l}</div>
                      ))}
                    </div>
                  </div>
                  <div className="px-4 py-4">
                    <ResponsiveContainer width="100%" height={170}>
                      <RBarChart data={attPeriod==="Yearly"?realYearlyChartData:realMonthlyChartData} barSize={attPeriod==="Monthly"?14:attPeriod==="Yearly"?24:36} margin={{top:4,right:4,left:-20,bottom:0}}>
                        <CartesianGrid key="cg-att" strokeDasharray="3 3" vertical={false} stroke="#f3f4f6"/>
                        <XAxis key="xaxis-att" dataKey="day" tick={{fontSize:9,fill:"#9CA3AF"}} axisLine={false} tickLine={false}/>
                        <YAxis key="yaxis-att" domain={[0,12]} tick={{fontSize:9,fill:"#9CA3AF"}} axisLine={false} tickLine={false} tickFormatter={(v:number)=>v===0?"":v+"h"}/>
                        <Tooltip key="tip-att" formatter={(v:number)=>[`${v}h`,"Hours"]} contentStyle={{fontSize:11,borderRadius:8,border:"1px solid #e5e7eb"}}/>
                        <Bar key="bar-att" dataKey="h" radius={[3,3,0,0]}>
                          {(attPeriod==="Yearly"?realYearlyChartData:realMonthlyChartData).map((d,i)=><Cell key={`att-${i}`} fill={barFill(d.s,d.h)}/>)}
                        </Bar>
                      </RBarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Current Shift */}
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-semibold text-gray-800">Current Shift</h3><span className="text-[10px] font-medium text-[#5C5CFF] bg-[#EEF2FF] px-2 py-0.5 rounded-full">General Shift</span></div>
                  <div className="grid grid-cols-4 gap-4 text-xs">
                    <div><div className="text-gray-400 mb-1">Check-in</div><div className="font-semibold text-gray-800">09:00 AM</div></div>
                    <div><div className="text-gray-400 mb-1">Check-out</div><div className="font-semibold text-gray-800">06:00 PM</div></div>
                    <div><div className="text-gray-400 mb-1">Grace Period</div><div className="font-semibold text-gray-800">15 min</div></div>
                    <div><div className="text-gray-400 mb-1">Weekly Off</div><div className="font-semibold text-gray-800">Sat & Sun</div></div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-6 text-xs">
                    <div className="text-gray-400">Half Day after: <span className="text-gray-700 font-medium">4h</span></div>
                    <div className="text-gray-400">Late mark after: <span className="text-amber-600 font-medium">15 min</span></div>
                    <div className="text-gray-400">Location: <span className="text-gray-700 font-medium">Office / Geo-fence</span></div>
                  </div>
                </div>

                {/* Recent Attendance */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-800">Recent Attendance</h3>
                    <button onClick={() => setAttView("timeline")} className="text-xs text-[#5C5CFF] hover:underline">Full history →</button>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {filteredAttTimeline.filter(r=>r.status!=="Weekend").slice(0,7).map((r,i)=>(
                      <div key={i} className="px-5 py-3 flex items-center gap-4">
                        <div className={cn("w-2 h-2 rounded-full flex-shrink-0",r.status==="Present"?"bg-green-400":r.status==="Late"?"bg-amber-400":r.status==="WFH"?"bg-blue-400":r.status==="Leave"?"bg-purple-400":"bg-gray-300")}/>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-800">{r.date}</span>
                            <span className="text-gray-300">·</span>
                            <span className="text-[10px] text-gray-400">{r.day}</span>
                            {r.late&&<span className="text-[9px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-full">Late</span>}
                            {r.wfh &&<span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">WFH</span>}
                          </div>
                        </div>
                        {r.status!=="Leave"
                          ? <span className="font-mono text-[10px] text-gray-500">{r.in} → {r.out}</span>
                          : <span className="text-[10px] text-purple-600 font-medium">Annual Leave</span>
                        }
                        <span className="font-mono text-xs font-semibold text-gray-700 w-14 text-right">{r.hours}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>)}

              {/* ══════════════════════════ HISTORY ══════════════════════════ */}
              {attView === "timeline" && (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
                    <div><h3 className="text-sm font-semibold text-gray-800">Attendance History</h3><p className="text-[10px] text-gray-400 mt-0.5">Real-time Subcollection History</p></div>
                    <button onClick={()=>exportToCSV(filteredAttTimeline)} className="text-xs text-gray-500 hover:text-[#5C5CFF] flex items-center gap-1"><Download size={12}/>Export</button>
                  </div>
                  <div className="p-5 space-y-3">
                    {filteredAttTimeline.map((r,i) => (
                      <div key={i}>
                        <div className="flex items-center gap-3 mb-2">
                          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold text-white",
                            r.status==="Present"?"bg-green-500":r.status==="Late"?"bg-amber-500":r.status==="WFH"?"bg-blue-500":r.status==="Leave"?"bg-purple-500":"bg-gray-300")}>
                            {r.day.slice(0,2)}
                          </div>
                          <div className="flex-1">
                            <div className="text-xs font-semibold text-gray-800">{r.date}</div>
                            <div className="text-[10px] text-gray-400">{r.shift||"Day off"}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            {r.status==="Present"&&<span className="text-[9px] font-semibold bg-green-50 text-green-700 px-2 py-0.5 rounded-full">Present</span>}
                            {r.status==="Late"&&<span className="text-[9px] font-semibold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">Late Arrival</span>}
                            {r.status==="WFH"&&<span className="text-[9px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">WFH</span>}
                            {r.status==="Leave"&&<span className="text-[9px] font-semibold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">On Leave</span>}
                            {r.status==="Weekend"&&<span className="text-[9px] font-semibold bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">Weekend</span>}
                          </div>
                        </div>
                        {r.status!=="Weekend"&&r.status!=="Leave"&&r.in!=="—"&&(
                          <div className="ml-11 mb-3">
                            <div className="relative h-8 bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
                              <div className="absolute top-0 bottom-0 bg-[#EEF2FF]" style={r.purpleStyle || {left:"22.2%",right:"22.2%"}}/>
                              <div className={cn("absolute top-1 bottom-1 rounded",r.wfh?"bg-blue-400":r.late?"bg-amber-400":"bg-green-400")} style={r.actStyle || {left:"11%",right:"11%"}}/>
                            </div>
                            <div className="flex items-center gap-5 mt-2 text-xs">
                              <div><span className="text-gray-400">Check-in </span><span className="font-mono font-semibold text-gray-800">{r.in}</span>{r.late&&<span className="text-[9px] text-amber-600 ml-1">(+18 min)</span>}</div>
                              <div className="h-3 w-px bg-gray-200"/>
                              <div><span className="text-gray-400">Check-out </span><span className="font-mono font-semibold text-gray-800">{r.out}</span></div>
                              <div className="h-3 w-px bg-gray-200"/>
                              <div><span className="text-gray-400">Hours </span><span className="font-mono font-semibold text-gray-800">{r.hours}</span></div>
                              {r.ot&&r.ot!=="0h"&&<><div className="h-3 w-px bg-gray-200"/><div><span className="text-gray-400">OT </span><span className="font-mono font-semibold text-[#5C5CFF]">+{r.ot}</span></div></>}
                              {r.wfh&&<span className="text-[9px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full ml-auto">Work from Home</span>}
                            </div>
                          </div>
                        )}
                        {r.status==="Leave"&&<div className="ml-11 mb-3"><div className="h-8 bg-purple-50 border border-purple-100 rounded-lg flex items-center px-3"><span className="text-xs text-purple-600 font-medium">Annual Leave — Full Day</span></div></div>}
                        {r.status==="Weekend"&&<div className="ml-11 mb-3"><div className="h-8 bg-gray-50 border border-gray-100 rounded-lg flex items-center px-3"><span className="text-xs text-gray-400">Weekend — Day off</span></div></div>}
                        {i<ATT_TIMELINE.length-1&&<div className="ml-11 border-b border-gray-100 mb-1"/>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ══════════════════════════ CALENDAR ══════════════════════════ */}
              {attView === "calendar" && (() => {
                const weekDates = [];
                for (let i = 0; i < 7; i++) {
                  const wd = new Date(currentWeekStart);
                  wd.setDate(currentWeekStart.getDate() + i);
                  weekDates.push(wd);
                }
                return (
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden font-sans">
                    <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-3 flex-wrap">
                      <div className="flex gap-1">
                        {(["month","week"] as const).map(v=>(
                          <button key={v} onClick={()=>setAttCalView(v)} className={cn("px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors",attCalView===v?"bg-[#EEF2FF] text-[#5C5CFF]":"text-gray-600 hover:bg-gray-100")}>{v==="month"?"Month":"Week"}</button>
                        ))}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => {
                          if (attCalView === "month") {
                            if (calMonth === 0) {
                              setCalMonth(11);
                              setCalYear(y => y - 1);
                            } else {
                              setCalMonth(m => m - 1);
                            }
                          } else {
                            setCurrentWeekStart(prev => {
                              const newD = new Date(prev);
                              newD.setDate(newD.getDate() - 7);
                              return newD;
                            });
                          }
                        }} className="p-1.5 hover:bg-gray-100 rounded"><ChevronLeft size={14}/></button>
                        <span className="text-xs font-semibold text-gray-700 w-44 text-center select-none">
                          {attCalView === "month" 
                            ? new Date(calYear, calMonth).toLocaleDateString("en-US", { month: "long", year: "numeric" })
                            : `${weekDates[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${weekDates[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                          }
                        </span>
                        <button onClick={() => {
                          if (attCalView === "month") {
                            if (calMonth === 11) {
                              setCalMonth(0);
                              setCalYear(y => y + 1);
                            } else {
                              setCalMonth(m => m + 1);
                            }
                          } else {
                            setCurrentWeekStart(prev => {
                              const newD = new Date(prev);
                              newD.setDate(newD.getDate() + 7);
                              return newD;
                            });
                          }
                        }} className="p-1.5 hover:bg-gray-100 rounded"><ChevronRight size={14}/></button>
                      </div>
                      <button onClick={() => {
                        if (attCalView === "month") {
                          setCalMonth(new Date().getMonth());
                          setCalYear(new Date().getFullYear());
                        } else {
                          const d = new Date();
                          const day = d.getDay();
                          const diff = d.getDate() - day + (day === 0 ? -6 : 1);
                          setCurrentWeekStart(new Date(d.setDate(diff)));
                        }
                      }} className="px-2.5 py-1 text-xs border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50">Today</button>
                      <div className="ml-auto flex items-center gap-1.5 flex-wrap">
                        {ATT_CAL_FILTERS_DEFAULT.map(f=>(
                          <button key={f} onClick={()=>toggleAttCalFilter(f)} className={cn("text-[10px] px-2 py-0.5 rounded-full border transition-colors",attCalFilters.includes(f)?"bg-[#EEF2FF] border-[#5C5CFF]/30 text-[#5C5CFF]":"border-gray-200 text-gray-400 hover:bg-gray-50")}>{f}</button>
                        ))}
                      </div>
                    </div>
                    {attCalView==="month"&&(
                      <div className="p-4">
                        <div className="grid grid-cols-7 gap-1 mb-2">{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=><div key={d} className="text-center text-[10px] font-semibold text-gray-400 py-1">{d}</div>)}</div>
                        <div className="grid grid-cols-7 gap-1">
                          {getDaysInMonth(calYear, calMonth).map((d,i)=>{
                            if (!d) return <div key={i} className="h-14 pointer-events-none" />;
                            const isWeekend=i%7===0||i%7===6;
                            const dateKey = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                            const rec = filteredAttTimeline.find(r => r.rawDate === dateKey);

                            const isToday = parseInt(d, 10) === new Date().getDate() && calMonth === new Date().getMonth() && calYear === new Date().getFullYear();
                            const isLeave = rec?.status === "Leave";
                            const isWfh = rec?.status === "WFH";
                            const isLate = rec?.late;

                            return (
                              <div key={i} className={cn("h-14 flex flex-col items-center justify-start pt-1.5 rounded-lg text-xs cursor-pointer transition-colors",
                                isToday?"bg-[#5C5CFF]":isLeave?"bg-purple-50":isWfh?"bg-blue-50":isWeekend?"bg-gray-50":"hover:bg-gray-50")}>
                                <span className={cn("text-xs font-semibold",isToday?"text-white":isLeave?"text-purple-600":isWfh?"text-blue-600":isWeekend?"text-gray-300":"text-gray-700")}>{d}</span>
                                {isLeave&&<span className="text-[8px] text-purple-500 mt-0.5">Leave</span>}
                                {isWfh&&<span className="text-[8px] text-blue-500 mt-0.5">WFH</span>}
                                {isWeekend&&<span className="text-[8px] text-gray-300 mt-0.5">Off</span>}
                                {rec && !isWeekend && !isLeave && !isWfh && (
                                  <div className={cn("w-1.5 h-1.5 rounded-full mt-1.5", isLate?"bg-amber-400":"bg-green-400")}/>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-4 pt-4 border-t border-gray-100 text-[10px] text-gray-500">
                          {[["bg-green-400","Present"],["bg-amber-400","Late"],["bg-blue-500","WFH"],["bg-purple-500","Leave"],["bg-red-400","Holiday"],["bg-gray-200","Weekend"]].map(([c,l])=>(
                            <div key={l} className="flex items-center gap-1.5"><div className={cn("w-2 h-2 rounded-full",c)}/>{l}</div>
                          ))}
                        </div>
                      </div>
                    )}
                    {attCalView==="week"&&(
                      <div className="p-4">
                        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                          <div className="grid grid-cols-8 border-b border-gray-100 bg-gray-50/50">
                            <div className="py-2.5 px-2 border-r border-gray-100"/>
                            {weekDates.map(d=>(
                              <div key={d.toISOString()} className="text-center text-[10px] font-semibold text-gray-500 py-2.5 border-r border-gray-100 last:border-0">
                                {d.toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric' })}
                              </div>
                            ))}
                          </div>
                          <div className="relative">
                            {["09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00"].map((h)=>(
                              <div key={h} className="grid grid-cols-8 border-b border-gray-50 last:border-0 animate-fade-in">
                                <div className="text-[10px] text-gray-400 px-2 py-3 border-r border-gray-100 text-right h-10 select-none bg-gray-50/20">{h}</div>
                                {[0,1,2,3,4,5,6].map(day=><div key={day} className={cn("border-r border-gray-50 last:border-0 h-10",day>=5&&"bg-gray-50/50")}/>)}
                              </div>
                            ))}
                            
                            {/* Overlay events column by column */}
                            <div className="absolute inset-0 grid grid-cols-8 pointer-events-none">
                              <div />
                              {[0,1,2,3,4,5,6].map(dayIndex => {
                                const wd = weekDates[dayIndex];
                                const dateKey = wd.toISOString().split("T")[0];
                                const rec = filteredAttTimeline.find(r => r.rawDate === dateKey);
                                if (!rec || rec.in === "—") return <div key={dayIndex} className="relative h-full" />;

                                const inMin = parseTimeToMinutes(rec.in);
                                let outMin = parseTimeToMinutes(rec.out);
                                if (!outMin && rec.in !== "—") {
                                  outMin = inMin + 540;
                                }
                                const startMin = Math.max(540, Math.min(1080, inMin));
                                const endMin = Math.max(540, Math.min(1080, outMin));
                                const totalRange = 1080 - 540;

                                const topPercent = ((startMin - 540) / totalRange) * 100;
                                const heightPercent = Math.max(8, ((endMin - startMin) / totalRange) * 100);

                                return (
                                  <div key={dayIndex} className="relative h-full pointer-events-none">
                                    <div
                                      style={{
                                        top: `${topPercent}%`,
                                        height: `${heightPercent}%`,
                                      }}
                                      className={cn(
                                        "absolute left-1 right-1 rounded-lg p-1.5 flex flex-col justify-between text-[9px] font-bold text-white shadow-sm border pointer-events-auto",
                                        rec.wfh 
                                          ? "bg-blue-500 border-blue-600" 
                                          : rec.late 
                                            ? "bg-amber-500 border-amber-600" 
                                            : "bg-green-500 border-green-600"
                                      )}
                                    >
                                      <div className="truncate leading-tight">{rec.status}</div>
                                      <div className="text-[7.5px] opacity-90 truncate font-mono">{rec.in} - {rec.out}</div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* analytics + exceptions moved to My Team — removed from My Space */}
              {false && (<>
                {/* Chart type switcher */}
                <div className="bg-white border border-gray-200 rounded-xl p-1 flex gap-0.5 flex-wrap">
                  {["Daily Attendance","Weekly Trend","Monthly Trend","WFH Trend","Overtime Trend","Late Arrival Trend"].map(c=>(
                    <button key={c} onClick={()=>setAttAnalChart(c)} className={cn("px-3 py-2 text-xs font-medium rounded-lg transition-colors flex-1 min-w-max",attAnalChart===c?"bg-[#5C5CFF] text-white":"text-gray-600 hover:bg-gray-100")}>{c}</button>
                  ))}
                </div>

                {/* Main chart card */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-800">{attAnalChart}</h3>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {["7D","30D","90D","1Y"].map(r=>(
                          <button key={r} className="px-2 py-1 text-[10px] border border-gray-200 rounded text-gray-500 hover:border-[#5C5CFF]/40 hover:text-[#5C5CFF] transition-colors">{r}</button>
                        ))}
                      </div>
                      <button className="flex items-center gap-1 px-2 py-1 text-[10px] text-gray-500 border border-gray-200 rounded hover:bg-gray-50"><Download size={10}/>Export</button>
                    </div>
                  </div>
                  <div className="p-5">
                    {(attAnalChart==="Daily Attendance"||attAnalChart==="Weekly Trend")&&(
                      <ResponsiveContainer width="100%" height={240}>
                        <RBarChart data={ATT_DAILY_DATA} barSize={22} margin={{top:4,right:4,left:-20,bottom:0}}>
                          <CartesianGrid key="cg-an1" strokeDasharray="3 3" vertical={false} stroke="#f3f4f6"/>
                          <XAxis key="x-an1" dataKey="day" tick={{fontSize:9,fill:"#9CA3AF"}} axisLine={false} tickLine={false}/>
                          <YAxis key="y-an1" tick={{fontSize:9,fill:"#9CA3AF"}} axisLine={false} tickLine={false} unit="%"/>
                          <Tooltip key="tip-an1" contentStyle={{fontSize:11,borderRadius:8,border:"1px solid #e5e7eb"}}/>
                          <Legend key="leg-an1" iconSize={8} iconType="circle" wrapperStyle={{fontSize:10}}/>
                          <Bar key="bar-present" dataKey="present" stackId="a" fill="#22C55E" radius={[0,0,0,0]} name="Present %"/>
                          <Bar key="bar-late"    dataKey="late"    stackId="a" fill="#F59E0B" radius={[0,0,0,0]} name="Late %"/>
                          <Bar key="bar-absent"  dataKey="absent"  stackId="a" fill="#EF4444" radius={[4,4,0,0]} name="Absent %"/>
                        </RBarChart>
                      </ResponsiveContainer>
                    )}
                    {attAnalChart==="Monthly Trend"&&(
                      <ResponsiveContainer width="100%" height={240}>
                        <RLineChart data={ATT_YEAR_DATA} margin={{top:4,right:4,left:-20,bottom:0}}>
                          <CartesianGrid key="cg-an2" strokeDasharray="3 3" vertical={false} stroke="#f3f4f6"/>
                          <XAxis key="x-an2" dataKey="month" tick={{fontSize:9,fill:"#9CA3AF"}} axisLine={false} tickLine={false}/>
                          <YAxis key="y-an2" domain={[80,100]} tick={{fontSize:9,fill:"#9CA3AF"}} axisLine={false} tickLine={false} unit="%"/>
                          <Tooltip key="tip-an2" contentStyle={{fontSize:11,borderRadius:8,border:"1px solid #e5e7eb"}}/>
                          <Legend key="leg-an2" iconSize={8} iconType="circle" wrapperStyle={{fontSize:10}}/>
                          <Line key="line-rate" type="monotone" dataKey="rate" stroke="#5C5CFF" strokeWidth={2.5} dot={{r:4,fill:"#5C5CFF"}} name="Attendance Rate %"/>
                        </RLineChart>
                      </ResponsiveContainer>
                    )}
                    {attAnalChart==="WFH Trend"&&(
                      <ResponsiveContainer width="100%" height={240}>
                        <AreaChart data={ATT_YEAR_DATA} margin={{top:4,right:4,left:-20,bottom:0}}>
                          <CartesianGrid key="cg-an3" strokeDasharray="3 3" vertical={false} stroke="#f3f4f6"/>
                          <XAxis key="x-an3" dataKey="month" tick={{fontSize:9,fill:"#9CA3AF"}} axisLine={false} tickLine={false}/>
                          <YAxis key="y-an3" tick={{fontSize:9,fill:"#9CA3AF"}} axisLine={false} tickLine={false}/>
                          <Tooltip key="tip-an3" contentStyle={{fontSize:11,borderRadius:8,border:"1px solid #e5e7eb"}}/>
                          <Legend key="leg-an3" iconSize={8} iconType="circle" wrapperStyle={{fontSize:10}}/>
                          <Area key="area-wfh" type="monotone" dataKey="wfh" stroke="#3B82F6" fill="#DBEAFE" strokeWidth={2} name="WFH Days"/>
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                    {attAnalChart==="Overtime Trend"&&(
                      <ResponsiveContainer width="100%" height={240}>
                        <RBarChart data={ATT_YEAR_DATA} barSize={30} margin={{top:4,right:4,left:-20,bottom:0}}>
                          <CartesianGrid key="cg-an4" strokeDasharray="3 3" vertical={false} stroke="#f3f4f6"/>
                          <XAxis key="x-an4" dataKey="month" tick={{fontSize:9,fill:"#9CA3AF"}} axisLine={false} tickLine={false}/>
                          <YAxis key="y-an4" tick={{fontSize:9,fill:"#9CA3AF"}} axisLine={false} tickLine={false} unit="h"/>
                          <Tooltip key="tip-an4" contentStyle={{fontSize:11,borderRadius:8,border:"1px solid #e5e7eb"}}/>
                          <Bar key="bar-ot" dataKey="ot" radius={[4,4,0,0]} name="Overtime Hours">
                            {ATT_YEAR_DATA.map((_,i)=><Cell key={`ot-${i}`} fill="#EC4899"/>)}
                          </Bar>
                        </RBarChart>
                      </ResponsiveContainer>
                    )}
                    {attAnalChart==="Late Arrival Trend"&&(
                      <ResponsiveContainer width="100%" height={240}>
                        <RLineChart data={ATT_YEAR_DATA} margin={{top:4,right:4,left:-20,bottom:0}}>
                          <CartesianGrid key="cg-an5" strokeDasharray="3 3" vertical={false} stroke="#f3f4f6"/>
                          <XAxis key="x-an5" dataKey="month" tick={{fontSize:9,fill:"#9CA3AF"}} axisLine={false} tickLine={false}/>
                          <YAxis key="y-an5" tick={{fontSize:9,fill:"#9CA3AF"}} axisLine={false} tickLine={false}/>
                          <Tooltip key="tip-an5" contentStyle={{fontSize:11,borderRadius:8,border:"1px solid #e5e7eb"}}/>
                          <Legend key="leg-an5" iconSize={8} iconType="circle" wrapperStyle={{fontSize:10}}/>
                          <Line key="line-late" type="monotone" dataKey="late" stroke="#F59E0B" strokeWidth={2.5} dot={{r:4,fill:"#F59E0B"}} name="Late Arrivals"/>
                          <Line key="line-absent" type="monotone" dataKey="absent" stroke="#EF4444" strokeWidth={2} dot={{r:3,fill:"#EF4444"}} strokeDasharray="4 2" name="Absent Days"/>
                        </RLineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Summary insights row */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3"><TrendingUp size={14} className="text-green-500"/><h4 className="text-xs font-semibold text-gray-700">Best Month</h4></div>
                    <div className="space-y-2">
                      {[["Attendance",  "Mar · 93%"],["Fewest Late",  "Jul · 4"],["Most WFH",     "Jul · 25 days"]].map(([k,v])=>(
                        <div key={k} className="flex items-center justify-between">
                          <span className="text-[10px] text-gray-500">{k}</span>
                          <span className="text-[10px] font-semibold text-gray-800">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3"><TrendingDown size={14} className="text-red-500"/><h4 className="text-xs font-semibold text-gray-700">Needs Attention</h4></div>
                    <div className="space-y-2">
                      {[["Lowest Att.",  "Apr · 87%"],["Most Late",    "Apr · 9"],["Most Absent",  "Apr · 13 days"]].map(([k,v])=>(
                        <div key={k} className="flex items-center justify-between">
                          <span className="text-[10px] text-gray-500">{k}</span>
                          <span className="text-[10px] font-semibold text-red-600">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3"><Activity size={14} className="text-[#5C5CFF]"/><h4 className="text-xs font-semibold text-gray-700">YTD Summary</h4></div>
                    <div className="space-y-2">
                      {[["Avg Rate","91.0%"],["Total Late","34"],["Total OT","133h"]].map(([k,v])=>(
                        <div key={k} className="flex items-center justify-between">
                          <span className="text-[10px] text-gray-500">{k}</span>
                          <span className="text-[10px] font-semibold text-gray-800">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>)}

              {false && (
                <div className="flex gap-4 h-full">
                  {/* Left: table */}
                  <div className="flex-1 space-y-3 min-w-0">
                    {/* Filter bar */}
                    <div className="bg-white border border-gray-200 rounded-xl p-3 flex items-center gap-2 flex-wrap">
                      <div className="relative flex-1 min-w-[160px] max-w-xs">
                        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"/>
                        <input placeholder="Search exceptions…" className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#5C5CFF]"/>
                      </div>
                      <div className="flex gap-1">
                        {["All","Pending","Resolved"].map(s=>(
                          <button key={s} onClick={()=>setAttExcStatus(s)} className={cn("px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors",attExcStatus===s?"bg-[#EEF2FF] text-[#5C5CFF]":"text-gray-600 hover:bg-gray-100")}>{s}</button>
                        ))}
                      </div>
                      <select value={attExcType} onChange={e=>setAttExcType(e.target.value)} className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#5C5CFF]">
                        {["All","Missed Check-in","Missed Check-out","Late Arrival","Early Exit","Shift Violation","Regularization Pending"].map(t=><option key={t}>{t}</option>)}
                      </select>
                      <span className="ml-auto text-[10px] text-gray-400">
                        {ATT_EXCEPTIONS_DATA.filter(e=>(attExcStatus==="All"||e.status===attExcStatus)&&(attExcType==="All"||e.issue===attExcType)).length} exceptions
                      </span>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>{["Employee","Date","Issue","Shift","Status","Assigned HR","Resolution",""].map(h=>(
                            <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                          ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {ATT_EXCEPTIONS_DATA.filter(e=>(attExcStatus==="All"||e.status===attExcStatus)&&(attExcType==="All"||e.issue===attExcType)).map(exc=>(
                            <tr key={exc.id} onClick={()=>setAttExcDrawer(attExcDrawer===exc.id?null:exc.id)} className={cn("cursor-pointer hover:bg-gray-50 transition-colors",attExcDrawer===exc.id&&"bg-[#EEF2FF]")}>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <Avt initials={exc.initials} color={exc.color} size="xs"/>
                                  <div><p className="text-xs font-medium text-gray-800">{exc.employee}</p><p className="text-[10px] text-gray-400">{exc.dept}</p></div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{exc.date}</td>
                              <td className="px-4 py-3">
                                <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap",
                                  exc.issue.includes("Miss")||exc.issue.includes("Missed")?"bg-red-50 text-red-600":exc.issue==="Late Arrival"?"bg-amber-50 text-amber-600":exc.issue==="Early Exit"?"bg-orange-50 text-orange-600":exc.issue==="Shift Violation"?"bg-purple-50 text-purple-600":"bg-blue-50 text-blue-600"
                                )}>{exc.issue}</span>
                              </td>
                              <td className="px-4 py-3 text-[10px] text-gray-500 whitespace-nowrap">{exc.shift}</td>
                              <td className="px-4 py-3">
                                <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full",exc.status==="Resolved"?"bg-green-50 text-green-600":"bg-amber-50 text-amber-600")}>{exc.status}</span>
                              </td>
                              <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{exc.hr}</td>
                              <td className="px-4 py-3 text-xs text-gray-500 max-w-[120px] truncate">{exc.resolution}</td>
                              <td className="px-4 py-3"><ChevronRight size={14} className="text-gray-300"/></td>
                            </tr>
                          ))}
                          {ATT_EXCEPTIONS_DATA.filter(e=>(attExcStatus==="All"||e.status===attExcStatus)&&(attExcType==="All"||e.issue===attExcType)).length===0&&(
                            <tr><td colSpan={8} className="py-12 text-center"><AlertTriangle size={24} className="text-gray-200 mx-auto mb-2"/><p className="text-sm text-gray-400">No exceptions found</p></td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Right: Exception drawer */}
                  {attExcDrawer && (() => {
                    const exc = ATT_EXCEPTIONS_DATA.find(e=>e.id===attExcDrawer);
                    if (!exc) return null;
                    return (
                      <div className="w-72 flex-shrink-0 bg-white border border-gray-200 rounded-xl flex flex-col overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                          <h4 className="text-sm font-semibold text-gray-800">Exception Detail</h4>
                          <button onClick={()=>setAttExcDrawer(null)}><X size={14} className="text-gray-400 hover:text-gray-600"/></button>
                        </div>
                        <div className="flex-1 overflow-auto p-4 space-y-4">
                          <div className="flex items-center gap-3">
                            <Avt initials={exc.initials} color={exc.color} size="md"/>
                            <div><p className="text-sm font-semibold text-gray-800">{exc.employee}</p><p className="text-[10px] text-gray-400">{exc.dept}</p></div>
                          </div>
                          <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                            {([["Issue",exc.issue],["Date",exc.date],["Shift",exc.shift],["Assigned HR",exc.hr]] as [string,string][]).map(([k,v])=>(
                              <div key={k} className="flex items-start justify-between gap-2">
                                <span className="text-[10px] text-gray-400 flex-shrink-0">{k}</span>
                                <span className="text-[10px] font-medium text-gray-800 text-right">{v}</span>
                              </div>
                            ))}
                            <div className="flex items-center justify-between pt-1 border-t border-gray-200">
                              <span className="text-[10px] text-gray-400">Status</span>
                              <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full",exc.status==="Resolved"?"bg-green-50 text-green-600":"bg-amber-50 text-amber-600")}>{exc.status}</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2.5">Timeline</p>
                            <div className="space-y-2.5">
                              {[
                                {t:"Exception flagged by system",d:exc.date+" · Automated",c:"#EF4444"},
                                {t:`Assigned to ${exc.hr}`,d:exc.date+" · Auto-assign",c:"#F59E0B"},
                                ...(exc.status==="Resolved"
                                  ? [{t:`Resolved: ${exc.resolution}`,d:"Manual review",c:"#22C55E"}]
                                  : [{t:"Awaiting HR resolution",d:"Pending",c:"#9CA3AF"}]
                                ),
                              ].map((step,i)=>(
                                <div key={i} className="flex items-start gap-2.5">
                                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{backgroundColor:step.c}}/>
                                  <div><p className="text-[10px] font-medium text-gray-700">{step.t}</p><p className="text-[9px] text-gray-400 mt-0.5">{step.d}</p></div>
                                </div>
                              ))}
                            </div>
                          </div>
                          {exc.status==="Pending"&&(
                            <div className="pt-3 border-t border-gray-100 space-y-2">
                              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Resolve</p>
                              <textarea rows={2} placeholder="Enter resolution note…" className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#5C5CFF] resize-none"/>
                              <div className="flex gap-2">
                                <button className="flex-1 px-3 py-2 bg-[#5C5CFF] text-white text-xs font-medium rounded-lg hover:bg-[#4A4AE0]">Mark Resolved</button>
                                <button className="flex-1 px-3 py-2 border border-gray-200 text-xs text-gray-600 rounded-lg hover:bg-gray-50">Escalate</button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* ══════════════════════════ ISSUES ══════════════════════════ */}
              {attView === "issues" && (
                <div className="space-y-4">
                  {/* Issue submission form */}
                  {showNewIssue ? (
                    <div className="bg-white border border-gray-200 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-gray-800">Report Attendance Issue</h3>
                        <button onClick={()=>setShowNewIssue(false)}><X size={14} className="text-gray-400"/></button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Issue Type *</label>
                          <select value={newIssueType} onChange={e=>setNewIssueType(e.target.value)} className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#5C5CFF] bg-white">
                            {["Missing Check-in","Missing Check-out","Incorrect Attendance","Wrong Shift","Wrong Working Hours"].map(t=><option key={t}>{t}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Date *</label>
                          <input type="date" value={newIssueDate} onChange={e=>setNewIssueDate(e.target.value)} className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#5C5CFF]"/>
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Correct Check-in Time *</label>
                          <input type="text" value={newReqCheckIn} onChange={e=>setNewReqCheckIn(e.target.value)} placeholder="09:00 AM" className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#5C5CFF]"/>
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Correct Check-out Time *</label>
                          <input type="text" value={newReqCheckOut} onChange={e=>setNewReqCheckOut(e.target.value)} placeholder="06:00 PM" className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#5C5CFF]"/>
                        </div>
                        <div className="col-span-2">
                          <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Reason *</label>
                          <input value={newIssueReason} onChange={e=>setNewIssueReason(e.target.value)} placeholder="Briefly describe the issue…" className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#5C5CFF]"/>
                        </div>
                        <div className="col-span-2">
                          <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Additional Comment</label>
                          <textarea value={newIssueCmt} onChange={e=>setNewIssueCmt(e.target.value)} rows={3} placeholder="Any additional details…" className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#5C5CFF] resize-none"/>
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Attachment</label>
                          <button className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg text-xs text-gray-500 hover:border-[#5C5CFF]/40 hover:text-[#5C5CFF] transition-colors w-full">
                            <Upload size={12}/>Attach supporting document
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                        <button onClick={()=>setShowNewIssue(false)} className="px-4 py-2 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">Cancel</button>
                        <button onClick={async ()=>{
                          if (!newIssueReason.trim()||!newIssueDate||!userEmail) return;
                          const normalizedRole = userRole.toLowerCase();
                          let targetRoles: string[] = [];
                          if (normalizedRole === "super_admin" || normalizedRole === "admin") {
                            targetRoles = ["super_admin", "admin"];
                          } else if (normalizedRole === "hr_admin") {
                            targetRoles = ["super_admin", "hr_admin"];
                          } else if (normalizedRole === "manager") {
                            targetRoles = ["hr_admin", "super_admin"];
                          } else {
                            targetRoles = ["manager", "hr_admin"];
                          }

                          const issueId = `ISS${Date.now()}`;
                          const newIssue = {
                            id: issueId,
                            companyId: targetCompanyId,
                            createdBy: userEmail,
                            createdByRole: normalizedRole,
                            createdByName: userName,
                            targetRoles,
                            type: newIssueType,
                            date: newIssueDate,
                            requestedCheckIn: newReqCheckIn || "09:00 AM",
                            requestedCheckOut: newReqCheckOut || "06:00 PM",
                            reason: newIssueReason,
                            comment: newIssueCmt,
                            status: "Pending",
                            createdAt: new Date().toISOString(),
                            submittedOn: "Today",
                            rejectNote: "",
                          };

                          try {
                            const issueRef = doc(db, "organizations", targetCompanyId, "attendance_issues", issueId);
                            await setDoc(issueRef, newIssue);
                          } catch (err) {
                            console.error("Error saving issue to Firestore:", err);
                          }
                          setAttIssues(is=>[newIssue, ...is]);
                          setShowNewIssue(false);setNewIssueReason("");setNewIssueDate("");setNewIssueCmt("");
                        }} disabled={!newIssueReason.trim()||!newIssueDate} className="px-4 py-2 text-xs bg-[#5C5CFF] text-white rounded-lg hover:bg-[#4A4AE0] font-medium disabled:opacity-50 disabled:cursor-not-allowed">Submit Request</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">Attendance Issue Requests</p>
                        <p className="text-xs text-gray-400 mt-0.5">Submit corrections for missed check-ins, late arrivals, or incorrect records</p>
                      </div>
                      <button onClick={()=>setShowNewIssue(true)} className="flex items-center gap-1.5 px-3 py-2 bg-[#5C5CFF] text-white text-xs font-medium rounded-lg hover:bg-[#4A4AE0]"><Plus size={13}/>Report Issue</button>
                    </div>
                  )}

                  {/* Issues list */}
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="text-xs font-semibold text-gray-700">Attendance Issue Requests</h3>
                      <span className="text-[10px] text-gray-400">{filteredVisibleIssues.length} total · {filteredVisibleIssues.filter(i=>i.status==="Pending").length} pending</span>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {filteredVisibleIssues.map(iss=>{
                        const isCreator = iss.createdBy && String(iss.createdBy).toLowerCase() === userEmail;
                        const isSuperAdminOrAdmin = userRole === "super_admin" || userRole === "admin";
                        const rolesArr = Array.isArray(iss.targetRoles) ? iss.targetRoles : [];
                        const canApprove = !isCreator && (
                          isSuperAdminOrAdmin || 
                          (userRole === "hr_admin" && rolesArr.includes("hr_admin")) ||
                          (userRole === "manager" && rolesArr.includes("manager"))
                        );
                        return (
                          <div key={iss.id} className="px-5 py-4 flex items-start gap-4 hover:bg-gray-50 transition-colors">
                            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
                              iss.status==="Approved"?"bg-green-50":iss.status==="Rejected"?"bg-red-50":"bg-amber-50")}>
                              {iss.status==="Approved"?<CheckCircle size={16} className="text-green-500"/>:iss.status==="Rejected"?<XCircle size={16} className="text-red-500"/>:<Clock size={16} className="text-amber-500"/>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <p className="text-xs font-semibold text-gray-800">{iss.type}</p>
                                <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0",
                                  iss.status==="Approved"?"bg-green-50 text-green-600":iss.status==="Rejected"?"bg-red-50 text-red-600":"bg-amber-50 text-amber-600")}>{iss.status}</span>
                              </div>
                              <p className="text-[10px] text-gray-600">{iss.reason}</p>
                              {iss.comment&&<p className="text-[10px] text-gray-400 mt-0.5 italic">"{iss.comment}"</p>}
                              {iss.createdByName&&<p className="text-[9px] text-indigo-500 mt-0.5">Submitted by {iss.createdByName} ({iss.createdByRole || "User"})</p>}
                              {iss.requestedCheckIn&&<p className="text-[10px] text-emerald-600 font-medium mt-0.5">Requested Timing: {iss.requestedCheckIn} – {iss.requestedCheckOut || "06:00 PM"}</p>}
                              {iss.status==="Rejected"&&iss.rejectNote&&(
                                <div className="mt-1.5 bg-red-50 border border-red-100 rounded-lg px-2.5 py-1.5">
                                  <p className="text-[9px] font-semibold text-red-600 uppercase tracking-wide mb-0.5">Rejection Reason</p>
                                  <p className="text-[10px] text-red-700">{iss.rejectNote}</p>
                                </div>
                              )}
                              <p className="text-[9px] text-gray-400 mt-1.5">Submitted {iss.submittedOn} · Issue date: {iss.date}</p>
                            </div>
                            {iss.status==="Pending" && canApprove && (
                              <div className="flex gap-1 flex-shrink-0">
                                <button onClick={()=>confirmIssueApprove(iss.id)} className="px-2.5 py-1.5 bg-green-50 border border-green-200 text-green-700 text-[10px] font-medium rounded-lg hover:bg-green-100">Approve</button>
                                <button onClick={()=>setIssueRejectId(iss.id)} className="px-2.5 py-1.5 bg-red-50 border border-red-200 text-red-700 text-[10px] font-medium rounded-lg hover:bg-red-100">Reject</button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {attIssues.length===0&&(
                        <div className="py-12 text-center"><AlertCircle size={24} className="text-gray-200 mx-auto mb-2"/><p className="text-sm text-gray-400">No issue requests submitted yet</p></div>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>
            )}
            {/* end My Space */}

            {/* ══════════════════════════════════════════════════════════
                MY TEAM
            ══════════════════════════════════════════════════════════ */}
            {attSection==="My Team" && (
            <div className="flex-1 overflow-auto p-5 space-y-4 max-w-5xl mx-auto w-full">

              {/* ── OVERVIEW ── */}
              {attTeamView==="overview" && (<>

                {/* Org-level rate KPI cards */}
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                  {([
                    {label:"Attendance %",value:"91%", delta:"+2.1%",up:true, color:"#5C5CFF"},
                    {label:"Present %",   value:"78%", delta:"+1.4%",up:true, color:"#22C55E"},
                    {label:"Leave %",     value:"9%",  delta:"-0.8%",up:false,color:"#8B5CF6"},
                    {label:"WFH %",       value:"17%", delta:"+3.5%",up:true, color:"#3B82F6"},
                    {label:"Late %",      value:"13%", delta:"-2.1%",up:false,color:"#F59E0B"},
                    {label:"Absent %",    value:"9%",  delta:"+0.9%",up:false,color:"#EF4444"},
                  ] as {label:string;value:string;delta:string;up:boolean;color:string}[]).map(k=>(
                    <div key={k.label} className="bg-white border border-gray-200 rounded-xl p-3.5">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide leading-tight">{k.label}</span>
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{backgroundColor:k.color}}/>
                      </div>
                      <div className="text-xl font-bold text-gray-900 mb-1">{k.value}</div>
                      <div className={cn("text-[10px] font-medium flex items-center gap-0.5",k.up?"text-green-600":"text-red-500")}>
                        {k.up?<ArrowUpRight size={10}/>:<ArrowDownRight size={10}/>}{k.delta} vs last month
                      </div>
                    </div>
                  ))}
                </div>

                {/* Team attendance table */}
                <div className="flex gap-4">
                  <div className="flex-1 min-w-0 space-y-3">
                    {/* Search + filter bar */}
                    <div className="bg-white border border-gray-200 rounded-xl p-3 flex items-center gap-2 flex-wrap">
                      <div className="relative flex-1 min-w-[180px] max-w-xs">
                        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"/>
                        <input value={teamEmpSearch} onChange={e=>setTeamEmpSearch(e.target.value)} placeholder="Search employees…" className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#5C5CFF]"/>
                      </div>
                      <select value={teamDeptFilter} onChange={e=>setTeamDeptFilter(e.target.value)} className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#5C5CFF]">
                        {["All","Engineering","HR","Sales","Design","Finance","Operations"].map(d=><option key={d}>{d}</option>)}
                      </select>
                      <div className="flex gap-1">
                        {["All","Present","Late","WFH","Leave","Absent"].map(s=>(
                          <button key={s} onClick={()=>setTeamStatusFilter(s)} className={cn("px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors",teamStatusFilter===s?"bg-[#EEF2FF] text-[#5C5CFF]":"text-gray-600 hover:bg-gray-100")}>{s}</button>
                        ))}
                      </div>
                      <span className="ml-auto text-[10px] text-gray-400">
                        {TEAM_ATTENDANCE.filter(e=>(teamDeptFilter==="All"||e.dept===teamDeptFilter)&&(teamStatusFilter==="All"||e.status===teamStatusFilter)&&(!teamEmpSearch||e.name.toLowerCase().includes(teamEmpSearch.toLowerCase()))).length} employees
                      </span>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>{["Employee","Department","Check In","Check Out","Hours","Status","Shift",""].map(h=>(
                            <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                          ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {TEAM_ATTENDANCE.filter(e=>(teamDeptFilter==="All"||e.dept===teamDeptFilter)&&(teamStatusFilter==="All"||e.status===teamStatusFilter)&&(!teamEmpSearch||e.name.toLowerCase().includes(teamEmpSearch.toLowerCase()))).map(emp=>(
                            <tr key={emp.id} onClick={()=>setTeamEmpDrawer(teamEmpDrawer===emp.id?null:emp.id)} className={cn("cursor-pointer hover:bg-gray-50 transition-colors",teamEmpDrawer===emp.id&&"bg-[#EEF2FF]")}>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <Avt initials={emp.initials} color={emp.color} size="xs"/>
                                  <span className="text-xs font-medium text-gray-800">{emp.name}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-xs text-gray-500">{emp.dept}</td>
                              <td className="px-4 py-3 font-mono text-xs text-gray-700">{emp.checkIn}</td>
                              <td className="px-4 py-3 font-mono text-xs text-gray-700">{emp.checkOut}</td>
                              <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-800">{emp.hours}</td>
                              <td className="px-4 py-3">
                                <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap",
                                  emp.status==="Present"?"bg-green-50 text-green-700":emp.status==="Late"?"bg-amber-50 text-amber-700":emp.status==="WFH"?"bg-blue-50 text-blue-700":emp.status==="Leave"?"bg-purple-50 text-purple-700":"bg-red-50 text-red-700"
                                )}>{emp.status}</span>
                              </td>
                              <td className="px-4 py-3 text-[10px] text-gray-500 whitespace-nowrap">{emp.shift}</td>
                              <td className="px-4 py-3"><ChevronRight size={14} className="text-gray-300"/></td>
                            </tr>
                          ))}
                          {TEAM_ATTENDANCE.filter(e=>(teamDeptFilter==="All"||e.dept===teamDeptFilter)&&(teamStatusFilter==="All"||e.status===teamStatusFilter)&&(!teamEmpSearch||e.name.toLowerCase().includes(teamEmpSearch.toLowerCase()))).length===0&&(
                            <tr><td colSpan={8} className="py-12 text-center"><Users size={24} className="text-gray-200 mx-auto mb-2"/><p className="text-sm text-gray-400">No employees match the filters</p></td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Employee attendance drawer */}
                  {teamEmpDrawer&&(()=>{
                    const emp=TEAM_ATTENDANCE.find(e=>e.id===teamEmpDrawer);
                    if(!emp) return null;
                    return (
                      <div className="w-72 flex-shrink-0 bg-white border border-gray-200 rounded-xl flex flex-col overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                          <h4 className="text-sm font-semibold text-gray-800">Employee Attendance</h4>
                          <button onClick={()=>setTeamEmpDrawer(null)}><X size={14} className="text-gray-400 hover:text-gray-600"/></button>
                        </div>
                        <div className="flex-1 overflow-auto p-4 space-y-4">
                          <div className="flex items-center gap-3">
                            <Avt initials={emp.initials} color={emp.color} size="md"/>
                            <div>
                              <p className="text-sm font-semibold text-gray-800">{emp.name}</p>
                              <p className="text-[10px] text-gray-400">{emp.dept}</p>
                            </div>
                            <span className={cn("ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full",
                              emp.status==="Present"?"bg-green-50 text-green-700":emp.status==="Late"?"bg-amber-50 text-amber-700":emp.status==="WFH"?"bg-blue-50 text-blue-700":emp.status==="Leave"?"bg-purple-50 text-purple-700":"bg-red-50 text-red-700"
                            )}>{emp.status}</span>
                          </div>
                          <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                            {([["Shift",emp.shift],["Location",emp.location],["Check In",emp.checkIn],["Check Out",emp.checkOut],["Hours Worked",emp.hours]] as [string,string][]).map(([k,v])=>(
                              <div key={k} className="flex items-center justify-between">
                                <span className="text-[10px] text-gray-400">{k}</span>
                                <span className="text-[10px] font-medium text-gray-800 font-mono">{v}</span>
                              </div>
                            ))}
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2.5">This Week</p>
                            <div className="flex gap-1">
                              {["Mon","Tue","Wed","Thu","Fri"].map((d,i)=>(
                                <div key={d} className="flex-1 flex flex-col items-center gap-1">
                                  <div className={cn("w-full h-6 rounded-md",i===0?"bg-amber-100":i===2?"bg-blue-100":"bg-green-100")}/>
                                  <span className="text-[9px] text-gray-400">{d}</span>
                                </div>
                              ))}
                            </div>
                            <div className="flex gap-3 mt-2 text-[9px] text-gray-400">
                              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-green-100"/>Present</div>
                              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-amber-100"/>Late</div>
                              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-blue-100"/>WFH</div>
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Recent Issues</p>
                            {ATT_EXCEPTIONS_DATA.filter(e=>e.employee===emp.name).length>0
                              ? ATT_EXCEPTIONS_DATA.filter(e=>e.employee===emp.name).map(ex=>(
                                <div key={ex.id} className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-1.5">
                                  <p className="text-[10px] font-semibold text-amber-700">{ex.issue}</p>
                                  <p className="text-[9px] text-amber-600">{ex.date} · {ex.status}</p>
                                </div>
                              ))
                              : <p className="text-[10px] text-gray-400 italic">No recent issues</p>
                            }
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </>)}

              {/* ── EXCEPTIONS (team) ── */}
              {attTeamView==="exceptions" && (
                <div className="flex gap-4 h-full">
                  {/* Left: table */}
                  <div className="flex-1 space-y-3 min-w-0">
                    <div className="bg-white border border-gray-200 rounded-xl p-3 flex items-center gap-2 flex-wrap">
                      <div className="relative flex-1 min-w-[160px] max-w-xs">
                        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"/>
                        <input placeholder="Search exceptions…" className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#5C5CFF]"/>
                      </div>
                      <div className="flex gap-1">
                        {["All","Pending","Resolved"].map(s=>(
                          <button key={s} onClick={()=>setAttExcStatus(s)} className={cn("px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors",attExcStatus===s?"bg-[#EEF2FF] text-[#5C5CFF]":"text-gray-600 hover:bg-gray-100")}>{s}</button>
                        ))}
                      </div>
                      <select value={attExcType} onChange={e=>setAttExcType(e.target.value)} className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#5C5CFF]">
                        {["All","Missed Check-in","Missed Check-out","Late Arrival","Early Exit","Shift Violation","Regularization Pending"].map(t=><option key={t}>{t}</option>)}
                      </select>
                      <span className="ml-auto text-[10px] text-gray-400">
                        {ATT_EXCEPTIONS_DATA.filter(e=>(attExcStatus==="All"||e.status===attExcStatus)&&(attExcType==="All"||e.issue===attExcType)).length} exceptions
                      </span>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>{["Employee","Date","Issue","Shift","Status","Assigned HR","Resolution",""].map(h=>(
                            <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                          ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {ATT_EXCEPTIONS_DATA.filter(e=>(attExcStatus==="All"||e.status===attExcStatus)&&(attExcType==="All"||e.issue===attExcType)).map(exc=>(
                            <tr key={exc.id} onClick={()=>setAttExcDrawer(attExcDrawer===exc.id?null:exc.id)} className={cn("cursor-pointer hover:bg-gray-50 transition-colors",attExcDrawer===exc.id&&"bg-[#EEF2FF]")}>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <Avt initials={exc.initials} color={exc.color} size="xs"/>
                                  <div><p className="text-xs font-medium text-gray-800">{exc.employee}</p><p className="text-[10px] text-gray-400">{exc.dept}</p></div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{exc.date}</td>
                              <td className="px-4 py-3">
                                <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap",
                                  exc.issue.includes("Miss")||exc.issue.includes("Missed")?"bg-red-50 text-red-600":exc.issue==="Late Arrival"?"bg-amber-50 text-amber-600":exc.issue==="Early Exit"?"bg-orange-50 text-orange-600":exc.issue==="Shift Violation"?"bg-purple-50 text-purple-600":"bg-blue-50 text-blue-600"
                                )}>{exc.issue}</span>
                              </td>
                              <td className="px-4 py-3 text-[10px] text-gray-500 whitespace-nowrap">{exc.shift}</td>
                              <td className="px-4 py-3">
                                <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full",exc.status==="Resolved"?"bg-green-50 text-green-600":"bg-amber-50 text-amber-600")}>{exc.status}</span>
                              </td>
                              <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{exc.hr}</td>
                              <td className="px-4 py-3 text-xs text-gray-500 max-w-[120px] truncate">{exc.resolution}</td>
                              <td className="px-4 py-3"><ChevronRight size={14} className="text-gray-300"/></td>
                            </tr>
                          ))}
                          {ATT_EXCEPTIONS_DATA.filter(e=>(attExcStatus==="All"||e.status===attExcStatus)&&(attExcType==="All"||e.issue===attExcType)).length===0&&(
                            <tr><td colSpan={8} className="py-12 text-center"><AlertTriangle size={24} className="text-gray-200 mx-auto mb-2"/><p className="text-sm text-gray-400">No exceptions found</p></td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  {/* Exception drawer (reused) */}
                  {attExcDrawer&&(()=>{
                    const exc=ATT_EXCEPTIONS_DATA.find(e=>e.id===attExcDrawer);
                    if(!exc) return null;
                    return (
                      <div className="w-72 flex-shrink-0 bg-white border border-gray-200 rounded-xl flex flex-col overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                          <h4 className="text-sm font-semibold text-gray-800">Exception Detail</h4>
                          <button onClick={()=>setAttExcDrawer(null)}><X size={14} className="text-gray-400 hover:text-gray-600"/></button>
                        </div>
                        <div className="flex-1 overflow-auto p-4 space-y-4">
                          <div className="flex items-center gap-3">
                            <Avt initials={exc.initials} color={exc.color} size="md"/>
                            <div><p className="text-sm font-semibold text-gray-800">{exc.employee}</p><p className="text-[10px] text-gray-400">{exc.dept}</p></div>
                          </div>
                          <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                            {([["Issue",exc.issue],["Date",exc.date],["Shift",exc.shift],["Assigned HR",exc.hr]] as [string,string][]).map(([k,v])=>(
                              <div key={k} className="flex items-start justify-between gap-2">
                                <span className="text-[10px] text-gray-400 flex-shrink-0">{k}</span>
                                <span className="text-[10px] font-medium text-gray-800 text-right">{v}</span>
                              </div>
                            ))}
                            <div className="flex items-center justify-between pt-1 border-t border-gray-200">
                              <span className="text-[10px] text-gray-400">Status</span>
                              <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full",exc.status==="Resolved"?"bg-green-50 text-green-600":"bg-amber-50 text-amber-600")}>{exc.status}</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2.5">Timeline</p>
                            <div className="space-y-2.5">
                              {[
                                {t:"Exception flagged by system",d:exc.date+" · Automated",c:"#EF4444"},
                                {t:`Assigned to ${exc.hr}`,d:exc.date+" · Auto-assign",c:"#F59E0B"},
                                ...(exc.status==="Resolved"
                                  ? [{t:`Resolved: ${exc.resolution}`,d:"Manual review",c:"#22C55E"}]
                                  : [{t:"Awaiting HR resolution",d:"Pending",c:"#9CA3AF"}]
                                ),
                              ].map((step,i)=>(
                                <div key={i} className="flex items-start gap-2.5">
                                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{backgroundColor:step.c}}/>
                                  <div><p className="text-[10px] font-medium text-gray-700">{step.t}</p><p className="text-[9px] text-gray-400 mt-0.5">{step.d}</p></div>
                                </div>
                              ))}
                            </div>
                          </div>
                          {exc.status==="Pending"&&(
                            <div className="pt-3 border-t border-gray-100 space-y-2">
                              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Resolve</p>
                              <textarea rows={2} placeholder="Enter resolution note…" className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#5C5CFF] resize-none"/>
                              <div className="flex gap-2">
                                <button className="flex-1 px-3 py-2 bg-[#5C5CFF] text-white text-xs font-medium rounded-lg hover:bg-[#4A4AE0]">Mark Resolved</button>
                                <button className="flex-1 px-3 py-2 border border-gray-200 text-xs text-gray-600 rounded-lg hover:bg-gray-50">Escalate</button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* ── ANALYTICS (team) ── */}
              {attTeamView==="analytics" && (<>
                {/* Chart type switcher */}
                <div className="bg-white border border-gray-200 rounded-xl p-1 flex gap-0.5 flex-wrap">
                  {["Daily Attendance","Weekly Trend","Monthly Trend","WFH Trend","Overtime Trend","Late Arrival Trend"].map(c=>(
                    <button key={c} onClick={()=>setAttAnalChart(c)} className={cn("px-3 py-2 text-xs font-medium rounded-lg transition-colors flex-1 min-w-max",attAnalChart===c?"bg-[#5C5CFF] text-white":"text-gray-600 hover:bg-gray-100")}>{c}</button>
                  ))}
                </div>
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-800">{attAnalChart}</h3>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {["7D","30D","90D","1Y"].map(r=>(
                          <button key={r} className="px-2 py-1 text-[10px] border border-gray-200 rounded text-gray-500 hover:border-[#5C5CFF]/40 hover:text-[#5C5CFF] transition-colors">{r}</button>
                        ))}
                      </div>
                      <button className="flex items-center gap-1 px-2 py-1 text-[10px] text-gray-500 border border-gray-200 rounded hover:bg-gray-50"><Download size={10}/>Export</button>
                    </div>
                  </div>
                  <div className="p-5">
                    {(attAnalChart==="Daily Attendance"||attAnalChart==="Weekly Trend")&&(
                      <ResponsiveContainer width="100%" height={240}>
                        <RBarChart data={ATT_DAILY_DATA} barSize={22} margin={{top:4,right:4,left:-20,bottom:0}}>
                          <CartesianGrid key="cg-tan1" strokeDasharray="3 3" vertical={false} stroke="#f3f4f6"/>
                          <XAxis key="x-tan1" dataKey="day" tick={{fontSize:9,fill:"#9CA3AF"}} axisLine={false} tickLine={false}/>
                          <YAxis key="y-tan1" tick={{fontSize:9,fill:"#9CA3AF"}} axisLine={false} tickLine={false} unit="%"/>
                          <Tooltip key="tip-tan1" contentStyle={{fontSize:11,borderRadius:8,border:"1px solid #e5e7eb"}}/>
                          <Legend key="leg-tan1" iconSize={8} iconType="circle" wrapperStyle={{fontSize:10}}/>
                          <Bar key="bar-tpresent" dataKey="present" stackId="a" fill="#22C55E" radius={[0,0,0,0]} name="Present %"/>
                          <Bar key="bar-tlate"    dataKey="late"    stackId="a" fill="#F59E0B" radius={[0,0,0,0]} name="Late %"/>
                          <Bar key="bar-tabsent"  dataKey="absent"  stackId="a" fill="#EF4444" radius={[4,4,0,0]} name="Absent %"/>
                        </RBarChart>
                      </ResponsiveContainer>
                    )}
                    {attAnalChart==="Monthly Trend"&&(
                      <ResponsiveContainer width="100%" height={240}>
                        <RLineChart data={ATT_YEAR_DATA} margin={{top:4,right:4,left:-20,bottom:0}}>
                          <CartesianGrid key="cg-tan2" strokeDasharray="3 3" vertical={false} stroke="#f3f4f6"/>
                          <XAxis key="x-tan2" dataKey="month" tick={{fontSize:9,fill:"#9CA3AF"}} axisLine={false} tickLine={false}/>
                          <YAxis key="y-tan2" domain={[80,100]} tick={{fontSize:9,fill:"#9CA3AF"}} axisLine={false} tickLine={false} unit="%"/>
                          <Tooltip key="tip-tan2" contentStyle={{fontSize:11,borderRadius:8,border:"1px solid #e5e7eb"}}/>
                          <Legend key="leg-tan2" iconSize={8} iconType="circle" wrapperStyle={{fontSize:10}}/>
                          <Line key="line-trate" type="monotone" dataKey="rate" stroke="#5C5CFF" strokeWidth={2.5} dot={{r:4,fill:"#5C5CFF"}} name="Attendance Rate %"/>
                        </RLineChart>
                      </ResponsiveContainer>
                    )}
                    {attAnalChart==="WFH Trend"&&(
                      <ResponsiveContainer width="100%" height={240}>
                        <AreaChart data={ATT_YEAR_DATA} margin={{top:4,right:4,left:-20,bottom:0}}>
                          <CartesianGrid key="cg-tan3" strokeDasharray="3 3" vertical={false} stroke="#f3f4f6"/>
                          <XAxis key="x-tan3" dataKey="month" tick={{fontSize:9,fill:"#9CA3AF"}} axisLine={false} tickLine={false}/>
                          <YAxis key="y-tan3" tick={{fontSize:9,fill:"#9CA3AF"}} axisLine={false} tickLine={false}/>
                          <Tooltip key="tip-tan3" contentStyle={{fontSize:11,borderRadius:8,border:"1px solid #e5e7eb"}}/>
                          <Legend key="leg-tan3" iconSize={8} iconType="circle" wrapperStyle={{fontSize:10}}/>
                          <Area key="area-twfh" type="monotone" dataKey="wfh" stroke="#3B82F6" fill="#DBEAFE" strokeWidth={2} name="WFH Days"/>
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                    {attAnalChart==="Overtime Trend"&&(
                      <ResponsiveContainer width="100%" height={240}>
                        <RBarChart data={ATT_YEAR_DATA} barSize={30} margin={{top:4,right:4,left:-20,bottom:0}}>
                          <CartesianGrid key="cg-tan4" strokeDasharray="3 3" vertical={false} stroke="#f3f4f6"/>
                          <XAxis key="x-tan4" dataKey="month" tick={{fontSize:9,fill:"#9CA3AF"}} axisLine={false} tickLine={false}/>
                          <YAxis key="y-tan4" tick={{fontSize:9,fill:"#9CA3AF"}} axisLine={false} tickLine={false} unit="h"/>
                          <Tooltip key="tip-tan4" contentStyle={{fontSize:11,borderRadius:8,border:"1px solid #e5e7eb"}}/>
                          <Bar key="bar-tot" dataKey="ot" radius={[4,4,0,0]} name="Overtime Hours">
                            {ATT_YEAR_DATA.map((_,i)=><Cell key={`tot-${i}`} fill="#EC4899"/>)}
                          </Bar>
                        </RBarChart>
                      </ResponsiveContainer>
                    )}
                    {attAnalChart==="Late Arrival Trend"&&(
                      <ResponsiveContainer width="100%" height={240}>
                        <RLineChart data={ATT_YEAR_DATA} margin={{top:4,right:4,left:-20,bottom:0}}>
                          <CartesianGrid key="cg-tan5" strokeDasharray="3 3" vertical={false} stroke="#f3f4f6"/>
                          <XAxis key="x-tan5" dataKey="month" tick={{fontSize:9,fill:"#9CA3AF"}} axisLine={false} tickLine={false}/>
                          <YAxis key="y-tan5" tick={{fontSize:9,fill:"#9CA3AF"}} axisLine={false} tickLine={false}/>
                          <Tooltip key="tip-tan5" contentStyle={{fontSize:11,borderRadius:8,border:"1px solid #e5e7eb"}}/>
                          <Legend key="leg-tan5" iconSize={8} iconType="circle" wrapperStyle={{fontSize:10}}/>
                          <Line key="line-tlate" type="monotone" dataKey="late" stroke="#F59E0B" strokeWidth={2.5} dot={{r:4,fill:"#F59E0B"}} name="Late Arrivals"/>
                          <Line key="line-tabsent" type="monotone" dataKey="absent" stroke="#EF4444" strokeWidth={2} dot={{r:3,fill:"#EF4444"}} strokeDasharray="4 2" name="Absent Days"/>
                        </RLineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3"><TrendingUp size={14} className="text-green-500"/><h4 className="text-xs font-semibold text-gray-700">Best Month</h4></div>
                    <div className="space-y-2">
                      {[["Attendance","Mar · 93%"],["Fewest Late","Jul · 4"],["Most WFH","Jul · 25 days"]].map(([k,v])=>(
                        <div key={k} className="flex items-center justify-between"><span className="text-[10px] text-gray-500">{k}</span><span className="text-[10px] font-semibold text-gray-800">{v}</span></div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3"><TrendingDown size={14} className="text-red-500"/><h4 className="text-xs font-semibold text-gray-700">Needs Attention</h4></div>
                    <div className="space-y-2">
                      {[["Lowest Att.","Apr · 87%"],["Most Late","Apr · 9"],["Most Absent","Apr · 13 days"]].map(([k,v])=>(
                        <div key={k} className="flex items-center justify-between"><span className="text-[10px] text-gray-500">{k}</span><span className="text-[10px] font-semibold text-red-600">{v}</span></div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3"><Activity size={14} className="text-[#5C5CFF]"/><h4 className="text-xs font-semibold text-gray-700">YTD Summary</h4></div>
                    <div className="space-y-2">
                      {[["Avg Rate","91.0%"],["Total Late","34"],["Total OT","133h"]].map(([k,v])=>(
                        <div key={k} className="flex items-center justify-between"><span className="text-[10px] text-gray-500">{k}</span><span className="text-[10px] font-semibold text-gray-800">{v}</span></div>
                      ))}
                    </div>
                  </div>
                </div>
              </>)}

            </div>
            )}
            {/* end My Team */}

          </div>
        )}

        {/* ════════════════════ LEAVE ════════════════════ */}
        {tab === "Leave" && (
          <div className="flex flex-col h-full">
            {!hideLeaveHeader && (
              <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-2 flex-shrink-0 flex-wrap">
                <div className="flex gap-1">
                  {["Balance","Requests","Calendar","Analytics","Status"].map(v=>(
                    <button key={v} onClick={()=>setLeaveView(v)} className={cn("px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",leaveView===v?"bg-[#EEF2FF] text-[#5C5CFF]":"text-gray-600 hover:bg-gray-100")}>{v}</button>
                  ))}
                </div>
                <div className="ml-auto flex items-center gap-2">
                  {/* Type filter */}
                  <select value={leaveTypeFilter} onChange={e=>setLeaveTypeFilter(e.target.value)} className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#5C5CFF]">
                    {["All","Annual Leave","Sick Leave","Casual Leave","Unpaid Leave","Compensatory"].map(t=><option key={t}>{t}</option>)}
                  </select>
                  {/* Export */}
                  <div className="relative">
                    <button onClick={()=>setShowLeaveExport(v=>!v)} className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
                      <Download size={12}/>Export
                    </button>
                    {showLeaveExport&&(
                      <div className="absolute top-full right-0 mt-1 w-40 bg-white border border-gray-200 rounded-xl shadow-lg z-40 py-1">
                        {["Excel (.xlsx)","CSV (.csv)","PDF Report"].map(fmt=>(
                          <button key={fmt} onClick={()=>setShowLeaveExport(false)} className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"><Download size={10} className="text-gray-400"/>{fmt}</button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button onClick={()=>setShowApplyLeave(true)} className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#5C5CFF] text-white text-xs font-semibold rounded-lg hover:bg-[#4A4AE0]"><Plus size={13}/>Apply Leave</button>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-auto p-5 max-w-4xl mx-auto w-full space-y-4">
              {leaveView === "Balance" && (<>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    {type:"Annual Leave",used:usedAnnual,total:totalAnnual,color:"#5C5CFF",upcoming:`Remaining: ${Math.max(0, totalAnnual - usedAnnual)} days`},
                    {type:"Sick Leave",used:usedSick,total:totalSick,color:"#EF4444",upcoming:`Remaining: ${Math.max(0, totalSick - usedSick)} days`},
                    {type:"Casual Leave",used:usedCasual,total:totalCasual,color:"#22C55E",upcoming:`Remaining: ${Math.max(0, totalCasual - usedCasual)} days`}
                  ].map(l=>(
                    <div key={l.type} className="bg-white border border-gray-200 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-3"><h4 className="text-sm font-semibold text-gray-800">{l.type}</h4><span className="text-lg font-bold text-gray-900">{Math.max(0, l.total-l.used)}<span className="text-sm text-gray-400 font-normal">/{l.total}</span></span></div>
                      <div className="mb-3"><div className="flex justify-between text-[10px] text-gray-400 mb-1"><span>Used: {l.used}d</span><span>Remaining: {Math.max(0, l.total-l.used)}d</span></div><div className="w-full bg-gray-100 rounded-full h-2"><div className="h-2 rounded-full" style={{width:`${Math.min(100, (l.used/l.total)*100)}%`,backgroundColor:l.color}}/></div></div>
                      <p className="text-[10px] text-gray-400">{l.upcoming}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-800">Leave History</h3>
                    <button onClick={()=>setShowLeaveExport(v=>!v)} className="text-xs text-gray-500 flex items-center gap-1"><Download size={12}/>Export</button>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>{["Type","From","To","Days","Applied","Approver","Status",""].map(h=><th key={h} className="px-5 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{h}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {visibleLeaveRequests.filter(r=>leaveTypeFilter==="All"||r.type===leaveTypeFilter).map(r=>(
                        <tr key={r.id} onClick={()=>setLeaveDetailId2(r.id)} className={cn("hover:bg-gray-50 cursor-pointer transition-colors",leaveDetailId2===r.id&&"bg-[#EEF2FF]")}>
                          <td className="px-5 py-3 text-xs font-medium text-gray-800">{r.type}</td>
                          <td className="px-5 py-3 text-xs text-gray-600">{r.from}</td>
                          <td className="px-5 py-3 text-xs text-gray-600">{r.to}</td>
                          <td className="px-5 py-3 text-xs font-semibold text-gray-800">{r.days}</td>
                          <td className="px-5 py-3 text-xs text-gray-400">{r.applied}</td>
                          <td className="px-5 py-3 text-xs text-gray-600">{r.approver || "Manager"}</td>
                          <td className="px-5 py-3"><StatusBadge status={r.status}/></td>
                          <td className="px-5 py-3">
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Leave Detail Drawer */}
                <Drawer
                  isOpen={!!leaveDetailId2}
                  onClose={() => setLeaveDetailId2(null)}
                  title="Leave Details"
                  avatar={
                    <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] flex items-center justify-center flex-shrink-0">
                      <CalendarDays size={18} className="text-[#5C5CFF]" />
                    </div>
                  }
                  headerAddon={
                    (() => {
                      const lr = visibleLeaveRequests.find(r => r.id === leaveDetailId2);
                      return lr ? <StatusBadge status={lr.status} /> : null;
                    })()
                  }
                  footer={
                    <Btn variant="outline" onClick={() => setLeaveDetailId2(null)}>Close Details</Btn>
                  }
                >
                  {(() => {
                    const lr = visibleLeaveRequests.find(r => r.id === leaveDetailId2);
                    if (!lr) return null;
                    return (
                      <div className="space-y-6 text-left">
                        {/* Key Info Cards */}
                        <div className="bg-white rounded-xl border border-gray-150 p-4 shadow-sm space-y-4">
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Leave Information</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Leave Type</p>
                              <p className="text-xs font-semibold text-gray-805 mt-1">{lr.type}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Duration</p>
                              <p className="text-xs font-semibold text-gray-805 mt-1">{lr.days} working days</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Date Range</p>
                              <p className="text-xs font-semibold text-gray-855 mt-1">{lr.from} – {lr.to}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Applied On</p>
                              <p className="text-xs font-semibold text-gray-855 mt-1">{lr.applied}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Approver</p>
                              <p className="text-xs font-semibold text-gray-855 mt-1">{lr.approver}</p>
                            </div>
                          </div>
                        </div>

                        {/* Reason */}
                        <div className="bg-white rounded-xl border border-gray-150 p-4 shadow-sm space-y-2">
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Reason</h4>
                          <p className="text-xs text-gray-750 leading-relaxed font-medium">{lr.reason}</p>
                        </div>

                        {lr.status === "Rejected" && lr.rejectReason && (
                          <div className="bg-red-50 border border-red-150 rounded-xl p-4 space-y-2">
                            <h4 className="text-xs font-bold text-red-655 uppercase tracking-wider">Rejection Reason</h4>
                            <p className="text-xs text-red-750 leading-relaxed font-semibold">{lr.rejectReason}</p>
                          </div>
                        )}

                        {lr.attachment && (
                          <div className="bg-white rounded-xl border border-gray-150 p-4 shadow-sm space-y-3">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Attachments</h4>
                            <div className="flex items-center gap-2 text-xs text-[#5C5CFF] font-semibold">
                              <FileText size={14} />
                              <span>Supporting document attached</span>
                            </div>
                          </div>
                        )}

                        {/* Timeline */}
                        <div className="bg-white rounded-xl border border-gray-150 p-4 shadow-sm space-y-3.5">
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Approval Timeline</h4>
                          <div className="space-y-3">
                            {[
                              { t: "Request submitted", d: lr.applied, c: "#5C5CFF" },
                              { t: `Assigned to ${lr.approver}`, d: lr.applied, c: "#F59E0B" },
                              ...(lr.status === "Approved"
                                ? [{ t: "Approved", d: "Auto-processed", c: "#22C55E" }]
                                : lr.status === "Rejected"
                                ? [{ t: "Rejected", d: "Manual review", c: "#EF4444" }]
                                : [{ t: "Awaiting approval", d: "Pending", c: "#9CA3AF" }]
                              ),
                            ].map((step, i) => (
                              <div key={i} className="flex items-start gap-3">
                                <div className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: step.c }} />
                                <div className="text-left">
                                  <p className="text-xs font-semibold text-gray-700">{step.t}</p>
                                  <p className="text-[10px] text-gray-400">{step.d}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                          {lr.comment && (
                            <div className="mt-3 bg-gray-50 rounded-lg p-3 text-left border border-gray-150">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Approver Comment</p>
                              <p className="text-xs text-gray-600 italic">"{lr.comment}"</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </Drawer>
              </>)}

              {/* ── REQUESTS ── */}
              {leaveView === "Requests" && (
                <div className="space-y-3">
                  {visibleLeaveRequests.filter(r=>leaveTypeFilter==="All"||r.type===leaveTypeFilter).map(r=>(
                    <div key={r.id} onClick={()=>setLeaveDetailId2(leaveDetailId2===r.id?null:r.id)} className={cn("bg-white border rounded-xl p-4 flex items-start gap-4 cursor-pointer hover:shadow-sm transition-all",leaveDetailId2===r.id?"border-[#5C5CFF] bg-[#EEF2FF]/30":"border-gray-200 hover:border-[#5C5CFF]/30")}>
                      <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] flex items-center justify-center flex-shrink-0"><CalendarDays size={18} className="text-[#5C5CFF]"/></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-sm font-semibold text-gray-800">{r.type}</p>
                          <StatusBadge status={r.status}/>
                        </div>
                        <p className="text-xs text-gray-500">{r.from} → {r.to} · {r.days} days · Approver: {r.approver || "Manager"}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Applied {r.applied}</p>
                        {r.status==="Rejected"&&r.rejectReason&&(
                          <div className="mt-2 bg-red-50 border border-red-100 rounded-lg px-2.5 py-1.5">
                            <p className="text-[9px] font-semibold text-red-600 uppercase tracking-wide mb-0.5">Rejected</p>
                            <p className="text-[10px] text-red-700">{r.rejectReason}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <button onClick={()=>setShowApplyLeave(true)} className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-[#5C5CFF] hover:border-[#5C5CFF]/40 flex items-center justify-center gap-2 font-medium"><Plus size={14}/>Apply for Leave</button>
                </div>
              )}

              {/* ── CALENDAR ── */}
              {leaveView === "Calendar" && (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-800">Leave Calendar</h3>
                    <div className="flex items-center gap-1.5">
                      <button onClick={handlePrevCalMonth} className="p-1.5 hover:bg-gray-100 rounded transition-colors cursor-pointer" title="Previous Month">
                        <ChevronLeft size={14}/>
                      </button>
                      <span className="text-xs font-semibold text-gray-700 w-32 text-center select-none">
                        {leaveCalDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                      </span>
                      <button onClick={handleNextCalMonth} className="p-1.5 hover:bg-gray-100 rounded transition-colors cursor-pointer" title="Next Month">
                        <ChevronRight size={14}/>
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-7 gap-1 mb-2">{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=><div key={d} className="text-center text-[10px] font-semibold text-gray-400 py-1">{d}</div>)}</div>
                    <div className="grid grid-cols-7 gap-1">
                      {leaveCalGrid.map((d,i)=>{
                        if (!d) return <div key={i} className="h-12 pointer-events-none" />;
                        const dayNum = parseInt(d, 10);
                        const today = new Date();
                        const isToday = today.getFullYear() === leaveCalDate.getFullYear() && 
                                        today.getMonth() === leaveCalDate.getMonth() && 
                                        today.getDate() === dayNum;
                        const isLeave = leaveDaysForCalMonth.has(dayNum);

                        return (
                          <div key={i} className={cn("h-12 flex flex-col items-center justify-start pt-1.5 rounded-lg text-xs transition-colors cursor-default",isToday?"bg-[#5C5CFF] text-white":isLeave?"bg-[#EEF2FF] text-[#5C5CFF]":"hover:bg-gray-50 text-gray-600")}>
                            <span className="font-semibold">{d}</span>
                            {isLeave && <span className={cn("text-[8px] mt-0.5 font-bold", isToday ? "text-white/90" : "text-[#5C5CFF]")}>Leave</span>}
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-3">Upcoming Leaves</p>
                      <div className="space-y-2">
                        {visibleLeaveRequests.filter(r=>r.status!=="Rejected").length === 0 ? (
                          <p className="text-xs text-gray-400 italic text-center py-2">No upcoming leaves scheduled</p>
                        ) : (
                          visibleLeaveRequests.filter(r=>r.status!=="Rejected").map(r=>(
                            <div key={r.id} className="flex items-center gap-3">
                              <div className="w-1.5 h-6 rounded-full" style={{backgroundColor:r.type==="Annual Leave"?"#5C5CFF":r.type==="Sick Leave"?"#EF4444":"#22C55E"}}/>
                              <div className="flex-1">
                                <p className="text-xs font-medium text-gray-700">{r.type}</p>
                                <p className="text-[10px] text-gray-400">{r.from} – {r.to} · {r.days}d</p>
                              </div>
                              <StatusBadge status={r.status}/>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── ANALYTICS ── */}
              {leaveView === "Analytics" && (<>
                {/* Type Distribution + Monthly Trend */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-gray-100"><h3 className="text-xs font-semibold text-gray-700">Leave Type Distribution</h3></div>
                    <div className="p-4 flex items-center gap-4">
                      <ResponsiveContainer width={140} height={140}>
                        <PieChart>
                          <Pie key="pie-leave" data={realLeaveTypeDist} cx="50%" cy="50%" innerRadius={35} outerRadius={62} dataKey="value" paddingAngle={2}>
                            {realLeaveTypeDist.map((e,i)=><Cell key={`lc-${i}`} fill={e.color}/>)}
                          </Pie>
                          <Tooltip key="tip-pie-leave" formatter={(v:number)=>[`${v} days`,"Days"]} contentStyle={{fontSize:11,borderRadius:8,border:"1px solid #e5e7eb"}}/>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex-1 space-y-1.5">
                        {realLeaveTypeDist.map(d=>(
                          <div key={d.name} className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{backgroundColor:d.color}}/>
                            <span className="text-[10px] text-gray-600 flex-1">{d.name}</span>
                            <span className="text-[10px] font-semibold text-gray-800">{d.value}d</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-gray-100"><h3 className="text-xs font-semibold text-gray-700">Monthly Leave Trend</h3></div>
                    <div className="p-4">
                      <ResponsiveContainer width="100%" height={150}>
                        <RBarChart data={realLeaveMonthlyData} barSize={12} margin={{top:4,right:4,left:-25,bottom:0}}>
                          <CartesianGrid key="cg-lv1" strokeDasharray="3 3" vertical={false} stroke="#f3f4f6"/>
                          <XAxis key="x-lv1" dataKey="month" tick={{fontSize:9,fill:"#9CA3AF"}} axisLine={false} tickLine={false}/>
                          <YAxis key="y-lv1" tick={{fontSize:9,fill:"#9CA3AF"}} axisLine={false} tickLine={false}/>
                          <Tooltip key="tip-lv1" contentStyle={{fontSize:11,borderRadius:8,border:"1px solid #e5e7eb"}}/>
                          <Legend key="leg-lv1" iconSize={7} iconType="circle" wrapperStyle={{fontSize:9}}/>
                          <Bar key="bar-lv-total" dataKey="leaves" stackId="a" fill="#5C5CFF" name="Total"/>
                          <Bar key="bar-lv-sick" dataKey="sick" stackId="a" fill="#EF4444" name="Sick"/>
                          <Bar key="bar-lv-casual" dataKey="casual" stackId="a" fill="#22C55E" radius={[4,4,0,0]} name="Casual"/>
                        </RBarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Balance Utilization */}
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-gray-800 mb-4">Balance Utilization</h3>
                  <div className="space-y-3">
                    {realLeaveTypeDist.map(lt=>{
                      const totalAlloc = lt.name === "Annual Leave" ? totalAnnual : lt.name === "Sick Leave" ? totalSick : totalCasual;
                      const pct = Math.round((lt.value / Math.max(1, totalAlloc)) * 100);
                      return (
                        <div key={lt.name} className="flex items-center gap-3">
                          <span className="text-xs text-gray-600 w-28 flex-shrink-0">{lt.name}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-2">
                            <div className="h-2 rounded-full transition-all" style={{width:`${Math.min(100, pct)}%`,backgroundColor:lt.color}}/>
                          </div>
                          <span className="text-[10px] font-semibold text-gray-700 w-12 text-right">{lt.value} / {totalAlloc} d</span>
                          <span className="text-[10px] text-gray-400 w-8">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>)}

              {/* ── STATUS ── */}
              {leaveView === "Status" && (<>
                {/* Upcoming leaves */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-gray-100"><h3 className="text-sm font-semibold text-gray-800">Upcoming & Active Status</h3></div>
                  <div className="divide-y divide-gray-100">
                    {visibleLeaveRequests.filter(r=>r.status==="Pending"||r.status==="Approved").length === 0 ? (
                      <div className="py-8 text-center text-xs text-gray-400">No active or pending leave requests found</div>
                    ) : (
                      visibleLeaveRequests.filter(r=>r.status==="Pending"||r.status==="Approved").map(r=>(
                        <div key={r.id} onClick={()=>setLeaveDetailId2(r.id)} className="px-5 py-3.5 flex items-center gap-3 hover:bg-gray-50 cursor-pointer transition-colors">
                          <div className="w-2 h-8 rounded-full flex-shrink-0" style={{backgroundColor:r.type==="Annual Leave"?"#5C5CFF":r.type==="Sick Leave"?"#EF4444":"#22C55E"}}/>
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-gray-800">{r.type}</p>
                            <p className="text-[10px] text-gray-400">{r.from} → {r.to} · {r.days} days · Applicant: {r.applicantName || r.applicantEmail}</p>
                          </div>
                          <StatusBadge status={r.status}/>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Summary stats */}
                <div className="max-w-md mx-auto w-full">
                  <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <h3 className="text-xs font-semibold text-gray-700 mb-3 text-center">Leave Distribution</h3>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie key="pie-status" data={realLeaveTypeDist} cx="50%" cy="50%" outerRadius={72} dataKey="value" paddingAngle={2} label={({name,percent})=>percent>0?`${name.split(" ")[0]} ${(percent*100).toFixed(0)}%`:""} labelLine={false}>
                          {realLeaveTypeDist.map((e,i)=><Cell key={`sc-${i}`} fill={e.color}/>)}
                        </Pie>
                        <Tooltip key="tip-pie-status" formatter={(v:number)=>[`${v} days`,"Days"]} contentStyle={{fontSize:11,borderRadius:8,border:"1px solid #e5e7eb"}}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>)}

            </div>
          </div>
        )}

        {/* ════════════════════ APPROVALS ════════════════════ */}
        {tab === "Approvals" && (
          <div className="flex h-full overflow-hidden w-full bg-white text-left relative">
            <div className="flex-1 flex flex-col min-w-0">
              {/* Header Bar */}
              <div className="border-b border-gray-200 px-6 py-3.5 flex items-center justify-between flex-shrink-0 flex-wrap gap-4 bg-white">
                <div className="flex items-center gap-6">
                  {(["Pending", "Approved", "Rejected"] as const).map(v => {
                    const count = realTimeApprovals.filter(a => a.status === v).length;
                    const isActive = approvalView === v;
                    return (
                      <button
                        key={v}
                        onClick={() => setApprovalView(v)}
                        className={cn("text-xs font-semibold flex items-center gap-2 pb-1 relative transition-colors cursor-pointer border-0 bg-transparent", isActive ? "text-[#5C5CFF]" : "text-gray-500 hover:text-gray-800")}
                      >
                        {v}
                        <span className={cn("px-1.5 py-0.5 rounded-full text-[10px] font-bold transition-colors", isActive ? "bg-[#5C5CFF] text-white" : "bg-gray-100 text-gray-500")}>
                          {count}
                        </span>
                        {isActive && <div className="absolute bottom-[-13px] left-0 right-0 h-0.5 bg-[#5C5CFF] rounded-t" />}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-3 ml-auto">
                  <span className="text-xs font-medium text-gray-400">{filteredApprovals.length} items</span>
                  <div className="relative">
                    <button
                      onClick={() => setApprovalType(approvalType === "All" ? "Leave" : approvalType === "Leave" ? "Attendance" : "All")}
                      className={cn("p-1.5 rounded-lg border flex items-center gap-1 text-xs transition-colors cursor-pointer", approvalType !== "All" ? "border-[#5C5CFF] text-[#5C5CFF] bg-[#EEF2FF]/50" : "border-gray-200 text-gray-500 hover:bg-gray-50")}
                      title={`Filter by type: currently ${approvalType}`}
                    >
                      <Filter size={14} />
                      {approvalType !== "All" && <span className="font-semibold">{approvalType}</span>}
                    </button>
                  </div>
                </div>
              </div>

              {/* List View */}
              <div className="flex-1 overflow-auto divide-y divide-gray-100">
                {filteredApprovals.length === 0 && (
                  <div className="py-16 text-center">
                    <CheckCircle size={32} className="text-green-400 mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-medium text-gray-500">No {approvalView.toLowerCase()} requests in Firestore</p>
                    <p className="text-xs text-gray-400 mt-0.5">All caught up! Nothing to review right now.</p>
                  </div>
                )}
                {filteredApprovals.map(a => (
                  <div
                    key={a.id}
                    onClick={() => setApprovalDetailId(a.id)}
                    className={cn("flex items-center justify-between px-6 py-4 hover:bg-gray-50/80 cursor-pointer transition-colors w-full", approvalDetailId === a.id && "bg-[#EEF2FF]/40")}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <Avt
                        initials={a.employee.split(" ").map((n: string) => n[0]).join("")}
                        color={EMP_COLORS[Math.abs(String(a.id).charCodeAt(0)) % EMP_COLORS.length]}
                        size="md"
                      />
                      <div className="min-w-0 flex flex-col text-left">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-semibold text-gray-900 truncate">{a.employee}</span>
                          <span className="text-[10px] bg-gray-100 border border-gray-200/60 text-gray-700 px-1.5 py-0.5 rounded font-medium flex-shrink-0">
                            {a.type}
                          </span>
                        </div>
                        <p className="text-xs font-normal text-gray-600 truncate">{a.detail}</p>
                        <p className="text-[11px] font-normal text-gray-400 mt-1">Applied {a.applied}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                      {a.status === "Pending" ? (
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)] flex-shrink-0" title="Pending approval" />
                      ) : (
                        <StatusBadge status={a.status} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Slide-over Overlay Drawer */}
            <Drawer
              isOpen={!!approvalDetailId}
              onClose={() => setApprovalDetailId(null)}
              title={(() => {
                const item = realTimeApprovals.find(a => a.id === approvalDetailId);
                if (!item) return "Request Details";
                return (
                  <div>
                    <span className="text-sm font-bold text-gray-900">{item.employee}</span>
                    <p className="text-xs font-normal text-gray-400 mt-0.5">{item.dept} · {item.type}</p>
                  </div>
                );
              })()}
              avatar={(() => {
                const item = realTimeApprovals.find(a => a.id === approvalDetailId);
                if (!item) return null;
                return (
                  <Avt
                    initials={item.employee.split(" ").map((n: string) => n[0]).join("")}
                    color={EMP_COLORS[Math.abs(String(item.id).charCodeAt(0)) % EMP_COLORS.length]}
                    size="md"
                  />
                );
              })()}
              headerAddon={(() => {
                const item = realTimeApprovals.find(a => a.id === approvalDetailId);
                if (!item) return null;
                return <StatusBadge status={item.status} />;
              })()}
              footer={(() => {
                const item = realTimeApprovals.find(a => a.id === approvalDetailId);
                if (!item || item.status !== "Pending") {
                  return (
                    <div className="flex justify-end w-full">
                      <button
                        onClick={() => setApprovalDetailId(null)}
                        className="py-2 px-6 bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-200 transition-colors cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                  );
                }
                return (
                  <div className="flex items-center gap-3 w-full">
                    <button
                      onClick={() => {
                        setApprovalDetailId(null);
                        setAppRejectId(item.id);
                      }}
                      className="flex-1 py-2.5 px-4 bg-white border border-red-200 text-red-600 rounded-xl text-xs font-semibold hover:bg-red-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => {
                        handleApproveApprovalItem(item);
                        setApprovalDetailId(null);
                      }}
                      className="flex-1 py-2.5 px-4 bg-green-600 text-white rounded-xl text-xs font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      Approve
                    </button>
                  </div>
                );
              })()}
            >
              {(() => {
                const item = realTimeApprovals.find(a => a.id === approvalDetailId);
                if (!item) return null;
                const allComments = Array.isArray(item.comments) ? item.comments : [];
                return (
                  <div className="space-y-4 text-left">
                    {/* 1. Info Grid */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                      <div className="grid grid-cols-2 gap-3.5">
                        {([
                          ["LEAVE TYPE", item.leaveType || item.type],
                          ["DEPARTMENT", item.dept],
                          ["DATE", item.dateRange],
                          ["DAYS", item.days],
                          ["APPLIED", item.applied],
                          ["STATUS", item.status],
                        ] as [string, string][]).map(([k, v]) => (
                          <div key={k} className="bg-gray-50/70 rounded-lg p-3 border border-gray-100">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{k}</p>
                            <p className="text-xs font-semibold text-gray-800 truncate">{v}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 2. Reason */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-2">
                      <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Reason</p>
                      <p className="text-sm font-normal text-gray-600 leading-relaxed">{item.reason}</p>
                    </div>

                    {/* 3. Rejection Note if rejected */}
                    {item.rejectReason && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-1.5">
                        <p className="text-xs font-bold text-red-700 uppercase tracking-wider">Rejection Reason</p>
                        <p className="text-xs font-medium text-red-600">{item.rejectReason}</p>
                      </div>
                    )}

                    {/* 4. Attachment */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-2">
                      <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Attachment</p>
                      <p className="text-xs text-gray-400 font-normal">No attachment required</p>
                    </div>

                    {/* 5. Approval Timeline */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-3.5">
                      <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Approval Timeline</p>
                      <div className="space-y-3.5">
                        {[
                          { label: "Submitted", time: `${item.applied}`, done: true, color: "#5C5CFF" },
                          { label: item.status === "Pending" ? "Under Review" : item.status === "Approved" ? "Under Review" : "Reviewed", time: item.status === "Pending" ? "In Progress" : item.applied, done: true, color: "#F59E0B" },
                          { label: item.status === "Pending" ? "Awaiting Decision" : item.status, time: item.status === "Pending" ? "Pending..." : "Updated", done: item.status !== "Pending", color: item.status === "Approved" ? "#22C55E" : item.status === "Rejected" ? "#EF4444" : "#9CA3AF" },
                        ].map((step, si) => (
                          <div key={si} className="flex items-center gap-3">
                            {step.done ? (
                              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-white shadow-sm" style={{ backgroundColor: step.color }}>
                                {step.label === "Under Review" ? <div className="w-2 h-2 rounded-full bg-white" /> : <Check size={12} />}
                              </div>
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                                <div className="w-2 h-2 rounded-full bg-gray-300" />
                              </div>
                            )}
                            <div className="flex-1 flex items-center justify-between">
                              <p className={cn("text-xs font-semibold", step.done ? "text-gray-800" : "text-gray-400")}>{step.label}</p>
                              <p className="text-[10px] text-gray-400">{step.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 6. Comments */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-4">
                      <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Comments</p>
                      <div className="space-y-4 divide-y divide-gray-100">
                        {allComments.length === 0 && (
                          <div className="py-6 text-center text-gray-400">
                            <MessageSquare size={20} className="mx-auto mb-1.5 opacity-40 text-gray-400" />
                            <p className="text-xs font-medium text-gray-500">No comments yet</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">Start the conversation below</p>
                          </div>
                        )}
                        {allComments.map((c: any) => {
                          const isMe = c.authorEmail && String(c.authorEmail).toLowerCase() === userEmail;
                          return (
                            <div key={c.id} className="flex items-start gap-3 text-xs pt-3 first:pt-0">
                              <Avt
                                initials={(c.author || "User").split(" ").map((n: string) => n[0]).join("")}
                                color={isMe ? "#5C5CFF" : EMP_COLORS[Math.abs(String(c.author || "A").charCodeAt(0)) % EMP_COLORS.length]}
                                size="sm"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-semibold text-gray-800">{c.author}</span>
                                  <span className="text-[10px] text-gray-400">{c.time || "Just now"}</span>
                                </div>
                                <p className="text-gray-600 font-normal">{c.text}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="pt-2 flex items-center gap-2">
                        <Avt
                          initials={(userName || "User").split(" ").map((n: string) => n[0]).join("")}
                          color="#5C5CFF"
                          size="sm"
                        />
                        <div className="flex-1 relative flex items-center">
                          <input
                            type="text"
                            value={approvalDraft}
                            onChange={(e) => setApprovalDraft(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && addApprovalComment(item)}
                            placeholder="Add comment... @mention (Enter to post)"
                            className="w-full pl-3 pr-10 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#5C5CFF] focus:ring-1 focus:ring-[#5C5CFF]"
                          />
                          <button
                            onClick={() => addApprovalComment(item)}
                            className="absolute right-1.5 p-1.5 rounded-lg bg-[#5C5CFF] hover:bg-[#4B4BFF] text-white transition-colors cursor-pointer border-0"
                          >
                            <Send size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </Drawer>
          </div>
        )}

        {/* ════════════════════ GLOBAL CALENDAR ════════════════════ */}
        {tab === "Calendar" && (
          <div className="flex h-full overflow-hidden">
            {/* Filter sidebar */}
            <div className="w-52 flex-shrink-0 border-r border-gray-200 bg-white overflow-auto p-4">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Show on Calendar</p>
              <div className="space-y-0.5">
                {GLOBAL_CAL_FILTERS_DEF.map(f => (
                  <label key={f.label} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div 
                      onClick={() => toggleGlobalFilter(f.label)} 
                      className={cn("w-4 h-4 rounded flex items-center justify-center border-2 transition-colors flex-shrink-0")}
                      style={{
                        borderColor: f.color,
                        backgroundColor: globalCalFilters.includes(f.label) ? f.color : "transparent"
                      }}
                    >
                      {globalCalFilters.includes(f.label) && <Check size={10} className="text-white" />}
                    </div>
                    <span className="text-xs text-gray-700">{f.label}</span>
                  </label>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Upcoming</p>
                <div className="space-y-2">
                  {realGlobalEvents.filter(e => globalCalFilters.includes(e.type)).length === 0 ? (
                    <p className="text-[10px] text-gray-400 italic py-1">No upcoming events</p>
                  ) : (
                    realGlobalEvents.filter(e => globalCalFilters.includes(e.type)).slice(0,5).map(e => (
                      <div key={e.id} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1" style={{ backgroundColor:e.color }} />
                        <div className="flex-1 min-w-0"><p className="text-[10px] text-gray-700 truncate">{e.label}</p><p className="text-[9px] text-gray-400">{e.dateStr}</p></div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Calendar main */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="bg-white border-b border-gray-200 px-5 py-3 flex items-center gap-3 flex-shrink-0">
                <div className="flex gap-1">
                  {(["month","week","list"] as const).map(v => <button key={v} onClick={() => setGlobalCalView(v)} className={cn("px-3 py-1.5 text-xs font-medium rounded-lg transition-colors", globalCalView===v?"bg-[#EEF2FF] text-[#5C5CFF]":"text-gray-600 hover:bg-gray-100")}>{v==="month"?"Month":v==="week"?"Week":"List"}</button>)}
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={handlePrevGlobalCalMonth} className="p-1.5 hover:bg-gray-100 rounded transition-colors cursor-pointer" title="Previous Month"><ChevronLeft size={14}/></button>
                  <span className="text-sm font-semibold text-gray-800 w-32 text-center select-none">{globalCalDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
                  <button onClick={handleNextGlobalCalMonth} className="p-1.5 hover:bg-gray-100 rounded transition-colors cursor-pointer" title="Next Month"><ChevronRight size={14}/></button>
                </div>
                <button onClick={handleTodayGlobalCal} className="px-3 py-1.5 border border-gray-200 text-xs text-gray-600 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">Today</button>
                <div className="ml-auto text-xs text-gray-400">{globalCalFilters.length} of {GLOBAL_CAL_FILTERS_DEF.length} categories shown</div>
              </div>
              <div className="flex-1 overflow-auto p-4">
                {globalCalView === "month" && (
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden" style={{ minHeight:500 }}>
                    <div className="grid grid-cols-7 border-b border-gray-100">
                      {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => <div key={d} className="text-center text-[10px] font-semibold text-gray-400 py-2.5 border-r border-gray-100 last:border-0">{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7" style={{ gridAutoRows:"minmax(90px,1fr)" }}>
                      {globalCalGrid.map((d,i) => {
                        const dayN = parseInt(d, 10) || 0;
                        const dayEvents = dayN ? currentMonthGlobalEvents.filter(e => e.day === dayN) : [];
                        const today = new Date();
                        const isToday = d && today.getFullYear() === globalCalDate.getFullYear() && today.getMonth() === globalCalDate.getMonth() && today.getDate() === dayN;
                        const isWeekend = i % 7 === 0 || i % 7 === 6;

                        return (
                          <div key={i} className={cn("border-r border-b border-gray-100 last:border-r-0 p-1.5 cursor-pointer hover:bg-gray-50/50 transition-colors", isWeekend&&d?"bg-gray-50/50":"", isToday?"bg-[#EEF2FF]/40":"")}>
                            {d && <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mb-1", isToday?"bg-[#5C5CFF] text-white":"text-gray-600")}>{d}</div>}
                            <div className="space-y-0.5 overflow-hidden">
                              {dayEvents.slice(0,3).map(ev => (
                                <div key={ev.id} className="text-[9px] font-medium px-1.5 py-0.5 rounded text-white truncate cursor-pointer hover:opacity-90" style={{ backgroundColor:ev.color }}>{ev.label}</div>
                              ))}
                              {dayEvents.length > 3 && <div className="text-[9px] text-gray-400 px-1.5">+{dayEvents.length-3} more</div>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {globalCalView === "week" && (() => {
                  const weekDates = [];
                  const day = globalCalDate.getDay();
                  const sunday = new Date(globalCalDate);
                  sunday.setDate(globalCalDate.getDate() - day);
                  for (let i = 0; i < 7; i++) {
                    const wd = new Date(sunday);
                    wd.setDate(sunday.getDate() + i);
                    weekDates.push(wd);
                  }
                  return (
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden font-sans">
                      <div className="grid grid-cols-8 border-b border-gray-100 bg-gray-50/50">
                        <div className="py-2.5 px-2 border-r border-gray-100" />
                        {weekDates.map(d => (
                          <div key={d.toISOString()} className="text-center text-[10px] font-semibold text-gray-500 py-2.5 border-r border-gray-100 last:border-0">
                            {d.toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric' })}
                          </div>
                        ))}
                      </div>
                      <div className="relative">
                        {["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00"].map(hour => (
                          <div key={hour} className="grid grid-cols-8 border-b border-gray-50 last:border-0">
                            <div className="text-[10px] text-gray-400 px-2 py-3 border-r border-gray-100 text-right h-10 select-none bg-gray-50/20">{hour}</div>
                            {[0,1,2,3,4,5,6].map(day => <div key={day} className={cn("border-r border-gray-50 last:border-0 h-10", day===0||day===6?"bg-gray-50/50":"")} />)}
                          </div>
                        ))}

                        {/* Overlay weekly events column by column */}
                        <div className="absolute inset-0 grid grid-cols-8 pointer-events-none">
                          <div />
                          {[0,1,2,3,4,5,6].map(dayIndex => {
                            const wd = weekDates[dayIndex];
                            const dateKey = wd.toISOString().split("T")[0];
                            const dayEvents = realGlobalEvents.filter(e => e.dateStr === dateKey && globalCalFilters.includes(e.type));
                            if (dayEvents.length === 0) return <div key={dayIndex} className="relative h-full" />;

                            return (
                              <div key={dayIndex} className="relative h-full pointer-events-none">
                                {dayEvents.map((ev, index) => {
                                  const { start, end } = getEventTiming(ev);
                                  const startMin = Math.max(480, Math.min(1080, start));
                                  const endMin = Math.max(480, Math.min(1080, end));
                                  const totalRange = 1080 - 480;

                                  const topPercent = ((startMin - 480) / totalRange) * 100;
                                  const heightPercent = Math.max(6, ((endMin - startMin) / totalRange) * 100);

                                  const colWidthPercent = 100 / dayEvents.length;
                                  const leftPercent = index * colWidthPercent;

                                  return (
                                    <div
                                      key={ev.id}
                                      style={{
                                        top: `${topPercent}%`,
                                        height: `${heightPercent}%`,
                                        left: `${leftPercent}%`,
                                        width: `${colWidthPercent}%`,
                                        backgroundColor: ev.color,
                                        borderColor: ev.color,
                                      }}
                                      className="absolute rounded p-1 flex flex-col justify-between text-[8px] font-bold text-white shadow-sm border overflow-hidden pointer-events-auto cursor-pointer hover:opacity-90 transition-opacity"
                                      title={ev.label}
                                    >
                                      <div className="truncate leading-tight">{ev.label}</div>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })()}
                {globalCalView === "list" && (
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
                    {currentMonthGlobalEvents.sort((a,b)=>a.day-b.day).map(ev=>(
                      <div key={ev.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 cursor-pointer transition-colors">
                        <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0" style={{backgroundColor:ev.color+"18"}}>
                          <span className="text-[9px] font-semibold uppercase" style={{color:ev.color}}>{globalCalDate.toLocaleDateString("en-US",{month:"short"})}</span>
                          <span className="text-base font-bold leading-tight" style={{color:ev.color}}>{ev.day}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800">{ev.label}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{backgroundColor:ev.color}}/>
                            {ev.type}
                          </p>
                        </div>
                        <ChevronDown size={14} className="text-gray-300 -rotate-90 flex-shrink-0"/>
                      </div>
                    ))}
                    {currentMonthGlobalEvents.length===0&&(
                      <div className="py-12 text-center"><CalendarDays size={24} className="text-gray-200 mx-auto mb-2"/><p className="text-sm text-gray-400">No events found in Firestore for this month</p></div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ── Apply Leave Modal ── */}
      {showApplyLeave && (
        <Modal title="Apply for Leave" onClose={() => setShowApplyLeave(false)}>
          <div className="space-y-4">
            <SelectField 
              label="Leave Type" 
              options={["Annual Leave","Sick Leave","Casual Leave","Unpaid Leave","Compensatory Leave"]} 
              value={applyLeaveType} 
              onChange={(e: any) => setApplyLeaveType(typeof e === "string" ? e : e?.target?.value || "")} 
              required 
            />
            <div className="grid grid-cols-2 gap-4">
              <InputField label="From Date" type="date" value={applyLeaveFrom} onChange={(e: any) => setApplyLeaveFrom(typeof e === "string" ? e : e?.target?.value || "")} required />
              <InputField label="To Date" type="date" value={applyLeaveTo} onChange={(e: any) => setApplyLeaveTo(typeof e === "string" ? e : e?.target?.value || "")} required />
            </div>
            {applyLeaveFrom && applyLeaveTo && (() => {
              try {
                const f = new Date(applyLeaveFrom);
                const t = new Date(applyLeaveTo);
                const diff = Math.max(1, Math.ceil((t.getTime() - f.getTime()) / 86400000) + 1);
                return !isNaN(diff) ? (
                  <div className="px-3 py-1.5 bg-[#EEF2FF] rounded-md text-xs font-semibold text-[#5C5CFF]">
                    Selected Duration: {diff} day{diff > 1 ? "s" : ""}
                  </div>
                ) : null;
              } catch (_) { return null; }
            })()}
            <InputField label="Reason" value={applyLeaveReason} onChange={(e: any) => setApplyLeaveReason(typeof e === "string" ? e : e?.target?.value || "")} placeholder="Brief reason for leave" required />
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Attachments</label>
              <button type="button" className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg text-xs text-gray-500 hover:border-[#5C5CFF]/40">
                <Upload size={13} />Attach supporting document
              </button>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500">
              {applyLeaveType} balance: <strong className="text-gray-800">
                {applyLeaveType === "Annual Leave" ? Math.max(0, totalAnnual - usedAnnual) : applyLeaveType === "Sick Leave" ? Math.max(0, totalSick - usedSick) : Math.max(0, totalCasual - usedCasual)} days remaining
              </strong>
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
              <Btn variant="outline" onClick={() => setShowApplyLeave(false)}>Cancel</Btn>
              <Btn onClick={handleApplyLeaveSubmit} disabled={isApplyingLeave}>{isApplyingLeave ? "Submitting..." : "Submit Application"}</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Issue Rejection Modal ── */}
      {issueRejectId && (
        <Modal title="Reject Attendance Request" onClose={()=>{setIssueRejectId(null);setIssueRejectNote("");}}>
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex items-start gap-2.5">
              <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5"/>
              <p className="text-xs text-red-700">A rejection reason is required and will be stored permanently with this request.</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Rejection Reason <span className="text-red-500">*</span></label>
              <textarea value={issueRejectNote} onChange={e=>setIssueRejectNote(e.target.value)} rows={3} placeholder="Explain why this request is being rejected…" className={cn("px-3 py-2 text-sm border rounded-lg bg-white resize-none focus:outline-none focus:ring-2 focus:ring-[#5C5CFF]",issueRejectNote.trim()?"border-gray-300":"border-red-200")}/>
              {!issueRejectNote.trim()&&<p className="text-[11px] text-red-500">A reason is required before rejecting.</p>}
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">Quick reasons</p>
              <div className="flex flex-wrap gap-2">
                {["Biometric logs found","Already marked present","Insufficient proof","Policy violation"].map(r=>(
                  <button key={r} onClick={()=>setIssueRejectNote(r)} className={cn("px-2.5 py-1 rounded-full text-xs border transition-colors",issueRejectNote===r?"border-red-400 bg-red-50 text-red-700":"border-gray-200 text-gray-600 hover:bg-gray-50")}>{r}</button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
              <Btn variant="outline" onClick={()=>{setIssueRejectId(null);setIssueRejectNote("");}}>Cancel</Btn>
              <Btn onClick={confirmIssueReject} disabled={!issueRejectNote.trim()} className={cn(!issueRejectNote.trim()?"opacity-50 cursor-not-allowed":"","bg-red-600 hover:bg-red-700")}><X size={13}/>Reject</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Leave Rejection Modal ── */}
      {leaveRejectModalId && (
        <Modal title="Reject Leave Request" onClose={()=>{setLeaveRejectModalId(null);setLeaveRejectReason("");}}>
          <div className="space-y-4">
            {(() => {
              const lr = visibleLeaveRequests.find(r=>r.id===leaveRejectModalId);
              return lr ? (
                <div className="bg-gray-50 rounded-xl p-3 grid grid-cols-2 gap-2 text-xs">
                  {([["Applicant",lr.applicantName||lr.applicantEmail||"Employee"],["Leave Type",lr.type],["Date Range",`${lr.from} – ${lr.to}`],["Days",`${lr.days} days`]] as [string,string][]).map(([k,v])=>(
                    <div key={k}><p className="text-[9px] text-gray-400 uppercase tracking-wide mb-0.5">{k}</p><p className="font-semibold text-gray-800">{v}</p></div>
                  ))}
                </div>
              ) : null;
            })()}
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex items-start gap-2.5">
              <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5"/>
              <p className="text-xs text-red-700">Rejection reason is mandatory and will be recorded permanently.</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Rejection Reason <span className="text-red-500">*</span></label>
              <textarea value={leaveRejectReason} onChange={e=>setLeaveRejectReason(e.target.value)} rows={3} placeholder="Explain why this leave is being rejected…" className={cn("px-3 py-2 text-sm border rounded-lg bg-white resize-none focus:outline-none focus:ring-2 focus:ring-[#5C5CFF]",leaveRejectReason.trim()?"border-gray-300":"border-red-200")}/>
              {!leaveRejectReason.trim()&&<p className="text-[11px] text-red-500">A reason is required before rejecting.</p>}
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">Quick reasons</p>
              <div className="flex flex-wrap gap-2">
                {["Insufficient leave balance","Business requirement","Project deadline","Duplicate request","Policy violation"].map(r=>(
                  <button key={r} onClick={()=>setLeaveRejectReason(r)} className={cn("px-2.5 py-1 rounded-full text-xs border transition-colors",leaveRejectReason===r?"border-red-400 bg-red-50 text-red-700":"border-gray-200 text-gray-600 hover:bg-gray-50")}>{r}</button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
              <Btn variant="outline" onClick={()=>{setLeaveRejectModalId(null);setLeaveRejectReason("");}}>Cancel</Btn>
              <Btn onClick={()=>confirmLeaveReject(leaveRejectModalId, leaveRejectReason)} disabled={!leaveRejectReason.trim()} className={cn(!leaveRejectReason.trim()?"opacity-50 cursor-not-allowed":"","bg-red-600 hover:bg-red-700")}><X size={13}/>Reject Leave</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Approve Item Modal ── */}
      {appApproveId && (() => {
        const item = approvals.find(a => a.id === appApproveId);
        return item ? (
          <Modal title="Approve Request" onClose={() => setAppApproveId(null)}>
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-start gap-3"><CheckCircle size={18} className="text-green-500 flex-shrink-0 mt-0.5"/><div><p className="text-sm font-semibold text-green-800">Confirm Approval</p><p className="text-xs text-green-700 mt-0.5">This will notify {item.employee} and update their records.</p></div></div>
              <div className="grid grid-cols-2 gap-3">{([["Employee",item.employee],["Type",item.leaveType],["Date",item.dateRange],["Days",item.days]] as [string,string][]).map(([k,v]) => <div key={k} className="bg-gray-50 rounded-lg p-3"><p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">{k}</p><p className="text-sm font-semibold text-gray-800">{v}</p></div>)}</div>
              <div className="flex flex-col gap-1.5"><label className="text-sm font-medium text-gray-700">Comments <span className="text-gray-400 font-normal">(optional)</span></label><textarea value={appApproveComment} onChange={e=>setAppApproveComment(e.target.value)} rows={2} placeholder="Add a note…" className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white resize-none focus:outline-none focus:ring-2 focus:ring-[#5C5CFF]"/></div>
              <div className="flex justify-end gap-3 pt-2 border-t border-gray-200"><Btn variant="outline" onClick={() => setAppApproveId(null)}>Cancel</Btn><Btn onClick={confirmApproveItem} className="bg-green-600 hover:bg-green-700"><Check size={13}/>Approve</Btn></div>
            </div>
          </Modal>
        ) : null;
      })()}

      {/* ── Reject Item Modal ── */}
      {appRejectId && (() => {
        const item = approvals.find(a => a.id === appRejectId);
        return item ? (
          <Modal title="Reject Request" onClose={() => setAppRejectId(null)}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">{([["Employee",item.employee],["Type",item.type],["Detail",item.leaveType],["Applied",item.applied]] as [string,string][]).map(([k,v]) => <div key={k} className="bg-gray-50 rounded-lg p-3"><p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">{k}</p><p className="text-sm font-semibold text-gray-800">{v}</p></div>)}</div>
              <div className="flex flex-col gap-1.5"><label className="text-sm font-medium text-gray-700">Reason for Rejection <span className="text-red-500">*</span></label><textarea value={appRejectReason} onChange={e=>setAppRejectReason(e.target.value)} rows={3} placeholder="Explain why…" className={cn("px-3 py-2 text-sm border rounded-lg bg-white resize-none focus:outline-none focus:ring-2 focus:ring-[#5C5CFF]", appRejectReason.trim()?"border-gray-300":"border-red-200")}/>{!appRejectReason.trim()&&<p className="text-[11px] text-red-500">A reason is required.</p>}</div>
              <div><p className="text-xs font-medium text-gray-600 mb-2">Quick reasons</p><div className="flex flex-wrap gap-2">{["Insufficient leave balance","Business requirement","Project deadline","Duplicate request","Policy violation"].map(r => <button key={r} onClick={() => setAppRejectReason(r)} className={cn("px-2.5 py-1 rounded-full text-xs border transition-colors", appRejectReason===r?"border-red-400 bg-red-50 text-red-700":"border-gray-200 text-gray-600 hover:bg-gray-50")}>{r}</button>)}</div></div>
              <div className="flex justify-end gap-3 pt-2 border-t border-gray-200"><Btn variant="outline" onClick={() => setAppRejectId(null)}>Cancel</Btn><Btn onClick={confirmRejectItem} disabled={!appRejectReason.trim()} className={cn(!appRejectReason.trim()?"opacity-50 cursor-not-allowed":"","bg-red-600 hover:bg-red-700")}><X size={13}/>Reject</Btn></div>
            </div>
          </Modal>
        ) : null;
      })()}

      {/* ── Leave Detail Drawer ── */}
      <Drawer
        isOpen={!!leaveDetailId}
        onClose={() => setLeaveDetailId(null)}
        title="Leave Request Details"
        avatar={<Avt initials="AA" color="#5C5CFF" size="md"/>}
        headerAddon={
          (() => {
            const req = MY_LEAVE_HIST.find(r => r.id === leaveDetailId) || reqs.find(r => r.id === leaveDetailId) as any;
            return req ? <StatusBadge status={req.status} /> : null;
          })()
        }
        footer={
          (() => {
            const req = MY_LEAVE_HIST.find(r => r.id === leaveDetailId) || reqs.find(r => r.id === leaveDetailId) as any;
            if (!req) return null;
            return (
              <>
                <Btn variant="outline"><Download size={13}/>Download</Btn>
                <Btn variant="outline"><Printer size={13}/>Print</Btn>
                <div className="flex-1"/>
                {req.status==="Pending"&&(
                  <>
                    <Btn onClick={()=>{setApproveModalId(req.id);setLeaveDetailId(null);}} className="bg-green-600 hover:bg-green-700"><Check size={13}/>Approve</Btn>
                    <Btn onClick={()=>{setRejectModalId(req.id);setLeaveDetailId(null);}} variant="outline" className="border-red-200 text-red-600 hover:bg-red-50"><X size={13}/>Reject</Btn>
                  </>
                )}
              </>
            );
          })()
        }
      >
        {(() => {
          const req = MY_LEAVE_HIST.find(r => r.id === leaveDetailId) || reqs.find(r => r.id === leaveDetailId) as any;
          if (!req) return null;
          return (
            <div className="space-y-6 text-left">
              <div className="bg-white rounded-xl border border-gray-150 p-4 shadow-sm space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Leave Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Leave Type</p>
                    <p className="text-xs font-semibold text-gray-805 mt-1">{req.type}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Total Days</p>
                    <p className="text-xs font-semibold text-gray-805 mt-1">{req.days} days</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Start Date</p>
                    <p className="text-xs font-semibold text-gray-855 mt-1">{req.from}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">End Date</p>
                    <p className="text-xs font-semibold text-gray-855 mt-1">{req.to}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Applied Date</p>
                    <p className="text-xs font-semibold text-gray-855 mt-1">{req.applied}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </Drawer>

      {/* ── Approve Leave Modal ── */}
      {approveModalId && (() => {
        const req = reqs.find(r => r.id === approveModalId);
        return req ? (
          <Modal title="Approve Leave" onClose={() => setApproveModalId(null)}>
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-start gap-3"><CheckCircle size={18} className="text-green-500 flex-shrink-0"/><div><p className="text-sm font-semibold text-green-800">Confirm Approval</p><p className="text-xs text-green-700 mt-0.5">This will update the employee's leave balance and send a notification.</p></div></div>
              <div className="grid grid-cols-2 gap-3">{([["Employee",req.employee],["Leave Type",req.type],["Date Range",`${req.from} – ${req.to}`],["Total Days",req.days+" days"]] as [string,string][]).map(([k,v]) => <div key={k} className="bg-gray-50 rounded-lg p-3"><p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">{k}</p><p className="text-sm font-semibold text-gray-800">{v}</p></div>)}</div>
              <div className="flex flex-col gap-1.5"><label className="text-sm font-medium text-gray-700">Comments <span className="text-gray-400 font-normal">(optional)</span></label><textarea value={approveComment} onChange={e=>setApproveComment(e.target.value)} rows={2} placeholder="Add a note…" className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white resize-none focus:outline-none focus:ring-2 focus:ring-[#5C5CFF]"/></div>
              <div className="flex justify-end gap-3 pt-2 border-t border-gray-200"><Btn variant="outline" onClick={() => setApproveModalId(null)}>Cancel</Btn><Btn onClick={confirmApprove} className="bg-green-600 hover:bg-green-700"><Check size={13}/>Approve</Btn></div>
            </div>
          </Modal>
        ) : null;
      })()}

      {/* ── Reject Leave Modal ── */}
      {rejectModalId && (() => {
        const req = reqs.find(r => r.id === rejectModalId);
        return req ? (
          <Modal title="Reject Leave Request" onClose={() => setRejectModalId(null)}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">{([["Employee",req.employee],["Leave Type",req.type],["Date Range",`${req.from} – ${req.to}`],["Total Days",req.days+" days"]] as [string,string][]).map(([k,v]) => <div key={k} className="bg-gray-50 rounded-lg p-3"><p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">{k}</p><p className="text-sm font-semibold text-gray-800">{v}</p></div>)}</div>
              <div className="flex flex-col gap-1.5"><label className="text-sm font-medium text-gray-700">Reason for Rejection <span className="text-red-500">*</span></label><textarea value={rejectReason} onChange={e=>setRejectReason(e.target.value)} rows={3} placeholder="Explain why…" className={cn("px-3 py-2 text-sm border rounded-lg bg-white resize-none focus:outline-none focus:ring-2 focus:ring-[#5C5CFF]", rejectReason.trim()?"border-gray-300":"border-red-200")}/>{!rejectReason.trim()&&<p className="text-[11px] text-red-500">A reason is required.</p>}</div>
              <div><p className="text-xs font-medium text-gray-600 mb-2">Quick reasons</p><div className="flex flex-wrap gap-2">{["Insufficient leave balance","Business requirement","Project deadline","Duplicate request","Policy violation"].map(r => <button key={r} onClick={() => setRejectReason(r)} className={cn("px-2.5 py-1 rounded-full text-xs border", rejectReason===r?"border-red-400 bg-red-50 text-red-700":"border-gray-200 text-gray-600 hover:bg-gray-50")}>{r}</button>)}</div></div>
              <div className="flex justify-end gap-3 pt-2 border-t border-gray-200"><Btn variant="outline" onClick={() => setRejectModalId(null)}>Cancel</Btn><Btn onClick={confirmReject} disabled={!rejectReason.trim()} className={cn(!rejectReason.trim()?"opacity-50 cursor-not-allowed":"","bg-red-600 hover:bg-red-700")}><X size={13}/>Reject Leave</Btn></div>
            </div>
          </Modal>
        ) : null;
      })()}
      {/* ── Check-in Location Details Modal ── */}
      {showLocationModal && (
        <Modal title="Attendance Location Details" onClose={() => setShowLocationModal(false)} width="max-w-3xl">
          <div className="grid grid-cols-5 gap-6 text-left">
            
            {/* Left side details */}
            <div className="col-span-2 space-y-4">
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide font-bold">Workplace Location</p>
                <p className="text-base font-semibold text-gray-800 flex items-center gap-1.5 mt-0.5">
                  <MapPin size={16} className="text-red-500 fill-red-100" />
                  {todayAtt?.orgName || orgData?.name || orgData?.companyName || "Office HQ"}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Primary Office Coordinates</p>
              </div>

              <div className="h-px bg-gray-100" />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide font-bold">Geo-fence Radius</p>
                  <p className="text-sm font-semibold text-gray-800 mt-0.5">{todayAtt?.orgRadius || 200} meters</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide font-bold">Check-in Time</p>
                  <p className="text-sm font-semibold text-gray-800 mt-0.5">{todayAtt?.checkInTime || "N/A"}</p>
                </div>
              </div>

              <div className="h-px bg-gray-100" />

              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide font-bold">Check-in Location</p>
                <p className="text-xs font-medium text-gray-700 mt-0.5">
                  {todayAtt?.coordinates ? (
                    <span className="font-mono">{`${Math.abs(todayAtt.coordinates.lat).toFixed(4)}° ${todayAtt.coordinates.lat >= 0 ? "N" : "S"}, ${Math.abs(todayAtt.coordinates.lng).toFixed(4)}° ${todayAtt.coordinates.lng >= 0 ? "E" : "W"}`}</span>
                  ) : (todayAtt?.checkInLocation || todayAtt?.location || "Location not available")}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {(() => {
                    const uLat = todayAtt?.coordinates?.lat;
                    const uLng = todayAtt?.coordinates?.lng;
                    let oLat = todayAtt?.orgCoordinates?.lat;
                    let oLng = todayAtt?.orgCoordinates?.lng;
                    if (!oLat || oLat === 0) {
                      if (orgData?.latitude && orgData?.longitude) {
                        oLat = parseFloat(orgData.latitude);
                        oLng = parseFloat(orgData.longitude);
                      } else if (orgData?.locations && orgData.locations.length > 0) {
                        oLat = parseFloat(orgData.locations[0].lat || orgData.locations[0].latitude);
                        oLng = parseFloat(orgData.locations[0].lng || orgData.locations[0].longitude);
                      }
                    }
                    if (uLat && uLng && oLat && oLng) {
                      return `Offset: ${Math.round(getDistance(uLat, uLng, oLat, oLng))} meters from office center`;
                    }
                    return "";
                  })()}
                </p>
              </div>

              <div className="h-px bg-gray-100" />

              {(() => {
                const uLat = todayAtt?.coordinates?.lat;
                const uLng = todayAtt?.coordinates?.lng;
                let oLat = todayAtt?.orgCoordinates?.lat;
                let oLng = todayAtt?.orgCoordinates?.lng;
                if (!oLat || oLat === 0) {
                  if (orgData?.latitude && orgData?.longitude) {
                    oLat = parseFloat(orgData.latitude);
                    oLng = parseFloat(orgData.longitude);
                  } else if (orgData?.locations && orgData.locations.length > 0) {
                    oLat = parseFloat(orgData.locations[0].lat || orgData.locations[0].latitude);
                    oLng = parseFloat(orgData.locations[0].lng || orgData.locations[0].longitude);
                  }
                }
                const radius = 500; // Fixed 500m radius as requested
                const isOutside = uLat && uLng && oLat && oLng ? getDistance(uLat, uLng, oLat, oLng) > radius : false;
                return (
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide font-bold mb-1">Geo-fence Validation Status</p>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold",
                        isOutside ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-green-50 text-green-700 border border-green-200"
                      )}>
                        <div className={cn("w-1.5 h-1.5 rounded-full", isOutside ? "bg-amber-500" : "bg-green-500")} />
                        {isOutside ? "Outside boundary (WFH)" : "Inside boundary (Verified)"}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Right side Map */}
            <div className="col-span-3 flex flex-col justify-between">
              <div className="w-full aspect-[4/3] relative">
                {(() => {
                  const uLat = todayAtt?.coordinates?.lat || liveUserLocation?.lat;
                  const uLng = todayAtt?.coordinates?.lng || liveUserLocation?.lng;
                  let oLat = todayAtt?.orgCoordinates?.lat;
                  let oLng = todayAtt?.orgCoordinates?.lng;
                  if (!oLat || oLat === 0) {
                    if (orgData?.latitude && orgData?.longitude) {
                      oLat = parseFloat(orgData.latitude);
                      oLng = parseFloat(orgData.longitude);
                    } else if (orgData?.locations && orgData.locations.length > 0) {
                      oLat = parseFloat(orgData.locations[0].lat || orgData.locations[0].latitude);
                      oLng = parseFloat(orgData.locations[0].lng || orgData.locations[0].longitude);
                    }
                  }
                  const radius = 500; // Fixed 500m radius as requested
                  const orgName = todayAtt?.orgName || orgData?.name || "Office HQ";

                  if ((oLat && oLng) || (uLat && uLng)) {
                    return (
                      <>
                        <GeoMap 
                          userLat={uLat} 
                          userLng={uLng} 
                          orgLat={oLat} 
                          orgLng={oLng} 
                          radius={radius}
                          orgName={orgName}
                          isInside={uLat && uLng && oLat && oLng ? ! (getDistance(uLat, uLng, oLat, oLng) > radius) : false}
                        />
                        {liveLocationError && !todayAtt?.coordinates?.lat && (
                          <div className="absolute bottom-2 left-2 right-2 bg-red-50/95 border border-red-200 text-red-600 text-[10px] px-2 py-1.5 rounded-lg shadow-sm font-semibold flex items-center gap-1.5 backdrop-blur-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            Live tracking failed: {liveLocationError} (Check browser URL bar permissions)
                          </div>
                        )}
                        {!liveLocationError && !todayAtt?.coordinates?.lat && !uLat && (
                          <div className="absolute bottom-2 left-2 right-2 bg-blue-50/95 border border-blue-200 text-blue-600 text-[10px] px-2 py-1.5 rounded-lg shadow-sm font-semibold flex items-center gap-1.5 backdrop-blur-sm">
                            <RefreshCw size={10} className="animate-spin" />
                            Acquiring live GPS location... (Please click 'Allow' if prompted)
                          </div>
                        )}
                        {!liveLocationError && !todayAtt?.coordinates?.lat && uLat && (
                          <div className="absolute bottom-2 left-2 right-2 bg-green-50/95 border border-green-200 text-green-700 text-[10px] px-2 py-1.5 rounded-lg shadow-sm font-semibold flex items-center gap-1.5 backdrop-blur-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            Live user tracking active
                          </div>
                        )}
                      </>
                    );
                  }
                  return (
                    <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center text-xs text-gray-500 rounded-xl border border-gray-200 shadow-inner p-4 text-center">
                      {todayAtt?.checkInLocation || todayAtt?.location ? (
                        <>
                           <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                           </svg>
                           <p className="font-semibold text-gray-700">Mobile Check-in Location</p>
                           <p className="mt-1 max-w-[250px]">{todayAtt.checkInLocation || todayAtt.location}</p>
                           <p className="text-[10px] text-gray-400 mt-3">(Exact map coordinates not captured)</p>
                        </>
                      ) : (
                        <p>No location data available for this check-in.</p>
                      )}
                    </div>
                  );
                })()}
              </div>
              <div className="text-[10px] text-gray-400 text-center mt-2">
                Real-time GPS geofencing verification via Google Maps.
              </div>
            </div>

          </div>
        </Modal>
      )}

    </div>
  );
}

