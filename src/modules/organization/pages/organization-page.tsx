import React, { useState, useEffect, useMemo } from "react";
import {
  Users, Clock, FileText, Megaphone, BarChart2, Search, Plus, Download, Upload,
  MoreHorizontal, Check, X, ChevronDown, ArrowUpRight, UserPlus, Building2,
  MapPin, Bot, TrendingUp, CheckCircle, Edit, Trash2, Eye, Shield, Activity,
  List, ChevronLeft, ChevronRight, ArrowRight, RefreshCw, Send, UserX,
  CalendarDays, FileBarChart, GitBranch, AlertCircle, AlertTriangle, Info,
  Lock, User, Phone, Copy, XCircle
} from "lucide-react";
import {
  AreaChart, Area, BarChart as RBarChart, Bar, LineChart as RLineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { cn, fmtDate } from "@/shared/utils";
import { AppPage, Employee } from "@/shared/types";
import { EMPLOYEES } from "@/modules/organization/data/employees";
import { DEPT_DIST, HEADCOUNT_TREND } from "@/modules/organization/data/analytics";
import { ATT_TREND, ATTENDANCE_RECORDS } from "@/modules/attendance/data/attendance-records";
import { LEAVE_MONTHLY } from "@/modules/leave/data/leave-requests";
import { DOCUMENTS_LIST } from "@/modules/documents/data/documents-list";
import { EMP_COLORS } from "@/shared/constants/colors";
import { Avt, StatusBadge, Btn, KPICard, Modal, TabBar, InputField, SelectField } from "@/shared/components";
import { db, auth } from "@/shared/utils/firebase";
import { doc, getDoc, setDoc, collection, onSnapshot, addDoc } from "firebase/firestore";
import { useAuth } from "@/shared/context/AuthContext";
import { AddEmployeePage } from "./add-employee-page";

export function OrgEmpWorkspace({ emp, onClose, onAction }: { emp: Employee; onClose: ()=>void; onAction: (a:string)=>void }) {
  const [wsTab, setWsTab] = useState("Overview");
  const wsTabs = ["Overview","Profile","Attendance","Leave","Shift","Documents","History","Related Data"];
  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200">
      {/* Header */}
      <div className="px-5 pt-4 pb-0 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avt initials={emp.initials} color={emp.color} size="lg"/>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">{emp.name}</h3>
              <p className="text-xs text-gray-500">{emp.designation} · {emp.dept}</p>
              <StatusBadge status={emp.status}/>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"><X size={15}/></button>
        </div>
        <div className="flex overflow-x-auto gap-0.5 -mx-1 px-1">
          {wsTabs.map(t=>(
            <button key={t} onClick={()=>setWsTab(t)} className={cn("px-3 py-2.5 text-xs font-medium border-b-2 -mb-px whitespace-nowrap transition-colors flex-shrink-0",wsTab===t?"border-[#5C5CFF] text-[#5C5CFF]":"border-transparent text-gray-500 hover:text-gray-700")}>{t}</button>
          ))}
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-1.5 flex-wrap flex-shrink-0">
        <Btn size="sm" onClick={()=>onAction("edit")}><Edit size={11}/>Edit</Btn>
        <Btn size="sm" variant="outline" onClick={()=>onAction("assign-dept")}><GitBranch size={11}/>Department</Btn>
        <Btn size="sm" variant="outline" onClick={()=>onAction("assign-shift")}><Clock size={11}/>Shift</Btn>
        <Btn size="sm" variant="outline" onClick={()=>onAction("assign-manager")}><Users size={11}/>Manager</Btn>
        <div className="ml-auto flex gap-1">
          <button onClick={()=>onAction("reset-pw")} className="px-2 py-1 text-xs text-gray-500 hover:bg-gray-200 rounded transition-colors flex items-center gap-1"><Lock size={10}/>Reset PW</button>
          <button onClick={()=>onAction("deactivate")} className={cn("px-2 py-1 text-xs rounded transition-colors flex items-center gap-1",emp.status==="Inactive"?"text-green-600 hover:bg-green-50":"text-red-500 hover:bg-red-50")}><UserX size={10}/>{emp.status==="Inactive"?"Restore":"Deactivate"}</button>
          <button onClick={()=>onAction("transfer")} className="px-2 py-1 text-xs text-gray-500 hover:bg-gray-200 rounded transition-colors flex items-center gap-1"><ArrowRight size={10}/>Transfer</button>
          <button onClick={()=>onAction("more")} className="p-1.5 text-gray-400 hover:bg-gray-200 rounded"><MoreHorizontal size={13}/></button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto p-4">
        {wsTab==="Overview"&&(
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[["Employee ID",emp.id],["Join Date",fmtDate(emp.joinDate)],["Employment Type",emp.empType],["Branch",emp.branch],["Shift",emp.shift],["Manager",emp.manager]].map(([k,v])=>(
                <div key={k as string} className="bg-gray-50 rounded-lg p-3"><p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">{k}</p><p className="text-sm font-medium text-gray-800">{v}</p></div>
              ))}
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2"><p className="text-xs font-medium text-gray-700">Attendance Rate</p><span className="text-xs font-semibold text-gray-800">{emp.attendance}%</span></div>
              <div className="w-full bg-gray-200 rounded-full h-1.5"><div className="h-1.5 rounded-full" style={{width:`${emp.attendance}%`,backgroundColor:emp.attendance>95?"#22C55E":emp.attendance>85?"#F59E0B":"#EF4444"}}/></div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 flex items-start gap-2">
              <Bot size={14} className="text-[#5C5CFF] flex-shrink-0 mt-0.5"/>
              <div><p className="text-xs font-medium text-gray-800 mb-0.5">AI Insight</p><p className="text-xs text-gray-600">{emp.name} has maintained {emp.attendance}% attendance this quarter. {emp.attendance<90?"Consider a check-in conversation.":"Performance is excellent."}</p></div>
            </div>
          </div>
        )}
        {wsTab==="Profile"&&(
          <div className="space-y-4">
            <div className="space-y-3">
              {[["Full Name",emp.name],["Email",emp.email],["Phone",emp.phone],["Department",emp.dept],["Designation",emp.designation]].map(([k,v])=>(
                <div key={k as string} className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-xs text-gray-500">{k}</span>
                  <span className="text-sm font-medium text-gray-800">{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {wsTab==="Attendance"&&(
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {[["Present","21","#22C55E"],["Late","2","#F59E0B"],["Absent","1","#EF4444"]].map(([l,v,c])=>(
                <div key={l as string} className="rounded-lg p-3 text-center" style={{backgroundColor:(c as string)+"18"}}><p className="text-lg font-bold" style={{color:c as string}}>{v}</p><p className="text-xs text-gray-500 mt-0.5">{l}</p></div>
              ))}
            </div>
            <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
              <div className="px-3 py-2 border-b border-gray-100 bg-gray-50 flex justify-between text-xs font-medium text-gray-500">
                <span>Date</span><span>In</span><span>Out</span><span>Status</span>
              </div>
              {[["Jul 1","09:02","18:15","Present"],["Jun 30","09:15","18:00","Late"],["Jun 29","09:00","18:05","Present"],["Jun 28","–","–","WFH"],["Jun 27","09:00","18:00","Present"]].map(([d,i,o,s])=>(
                <div key={d as string} className="px-3 py-2 flex justify-between text-xs border-b border-gray-50 hover:bg-gray-50">
                  <span className="text-gray-600">{d}</span><span className="font-mono">{i}</span><span className="font-mono">{o}</span><StatusBadge status={s as string}/>
                </div>
              ))}
            </div>
          </div>
        )}
        {wsTab==="Leave"&&(
          <div className="space-y-3">
            <div className="space-y-2">
              {[["Annual Leave",12,18],["Sick Leave",3,10],["Casual Leave",4,6]].map(([t,used,total])=>(
                <div key={t as string} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between text-xs mb-1.5"><span className="font-medium text-gray-700">{t}</span><span className="text-gray-500">{(total as number)-(used as number)} of {total} remaining</span></div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5"><div className="h-1.5 bg-[#5C5CFF] rounded-full" style={{width:`${((used as number)/(total as number))*100}%`}}/></div>
                </div>
              ))}
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle size={13} className="text-amber-500 flex-shrink-0"/>
              <p className="text-xs text-amber-700">1 pending leave request awaiting approval</p>
              <button className="ml-auto text-xs text-[#5C5CFF] font-medium">Review</button>
            </div>
          </div>
        )}
        {wsTab==="Shift"&&(
          <div className="space-y-3">
            <div className="bg-[#EEF2FF] rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm"><Clock size={18} className="text-[#5C5CFF]"/></div>
                <div><p className="text-sm font-semibold text-gray-800">{emp.shift} Shift</p><p className="text-xs text-gray-500">09:00 – 18:00 · Mon–Fri</p></div>
              </div>
              <Btn size="sm" variant="outline" onClick={()=>onAction("assign-shift")}>Change Shift</Btn>
            </div>
            <div className="rounded-lg border border-gray-100 overflow-hidden">
              <div className="px-3 py-2 bg-gray-50 text-xs font-medium text-gray-500 border-b border-gray-100">Weekly Schedule</div>
              {["Mon","Tue","Wed","Thu","Fri"].map(d=>(
                <div key={d} className="flex items-center justify-between px-3 py-2.5 border-b border-gray-50 text-xs">
                  <span className="text-gray-600 w-8">{d}</span>
                  <span className="font-mono text-gray-700">09:00 – 18:00</span>
                  <span className="text-gray-400">9 hrs</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {wsTab==="Documents"&&(
          <div className="space-y-2">
            {[["Offer Letter","PDF","Jan 15, 2021"],["Employment Contract","PDF","Jan 15, 2021"],["NDA Agreement","PDF","Jan 16, 2021"],["ID Proof","PDF","Jan 15, 2021"]].map(([n,t,d])=>(
              <div key={n as string} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-[#5C5CFF]/30 hover:bg-gray-50 cursor-pointer">
                <div className="w-8 h-8 rounded bg-red-50 flex items-center justify-center flex-shrink-0"><FileText size={14} className="text-red-500"/></div>
                <div className="flex-1"><p className="text-xs font-medium text-gray-800">{n}</p><p className="text-[10px] text-gray-400">{t} · {d}</p></div>
                <button className="text-gray-400 hover:text-[#5C5CFF]"><Download size={13}/></button>
              </div>
            ))}
            <button className="w-full py-3 border-2 border-dashed border-gray-200 rounded-lg text-xs text-[#5C5CFF] hover:border-[#5C5CFF]/50 flex items-center justify-center gap-1.5"><Plus size={12}/>Upload Document</button>
          </div>
        )}
        {wsTab==="History"&&(
          <div className="space-y-3">
            {[
              {date:"Jun 28, 2024",action:"Shift Changed",detail:"General → Morning Shift",user:"Aisha Thompson",color:"#5C5CFF"},
              {date:"May 15, 2024",action:"Promotion",detail:"Engineer → Senior Engineer",user:"David Chen",color:"#22C55E"},
              {date:"Mar 1, 2024",action:"Department Transfer",detail:"Product → Engineering",user:"Aisha Thompson",color:"#F59E0B"},
              {date:"Jan 1, 2024",action:"Policy Updated",detail:"Leave policy reassigned",user:"System",color:"#8B5CF6"},
            ].map((h,i)=>(
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{backgroundColor:h.color}}/>
                  {i<3&&<div className="w-0.5 bg-gray-200 flex-1 mt-1"/>}
                </div>
                <div className="pb-3">
                  <p className="text-xs font-medium text-gray-800">{h.action}</p>
                  <p className="text-xs text-gray-500">{h.detail}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{h.date} · by {h.user}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        {wsTab==="Related Data"&&(
          <div className="space-y-3">
            <div className="rounded-lg border border-gray-100 overflow-hidden">
              <div className="px-3 py-2 bg-gray-50 text-xs font-medium text-gray-600 border-b border-gray-100">Direct Reports</div>
              {EMPLOYEES.filter(e=>e.manager===emp.name).length===0?(
                <p className="px-3 py-3 text-xs text-gray-400">No direct reports</p>
              ):(
                EMPLOYEES.filter(e=>e.manager===emp.name).map(r=>(
                  <div key={r.id} className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-50">
                    <Avt initials={r.initials} color={r.color} size="sm"/>
                    <div className="flex-1"><p className="text-xs font-medium text-gray-800">{r.name}</p><p className="text-[10px] text-gray-400">{r.designation}</p></div>
                    <StatusBadge status={r.status}/>
                  </div>
                ))
              )}
            </div>
            <div className="rounded-lg border border-gray-100 overflow-hidden">
              <div className="px-3 py-2 bg-gray-50 text-xs font-medium text-gray-600 border-b border-gray-100">Department Colleagues</div>
              {EMPLOYEES.filter(e=>e.dept===emp.dept && e.id!==emp.id).slice(0,4).map(r=>(
                <div key={r.id} className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-50">
                  <Avt initials={r.initials} color={r.color} size="sm"/>
                  <div className="flex-1"><p className="text-xs font-medium text-gray-800">{r.name}</p><p className="text-[10px] text-gray-400">{r.designation}</p></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Lifecycle status pill for employee onboarding
function LifecyclePill({ status }: { status: string }) {
  const LIFECYCLE = ["Draft","Ready to Invite","Invitation Sent","Invitation Viewed","Accepted","Active"];
  const COLORS: Record<string,string> = {
    "Draft":"bg-gray-100 text-gray-500",
    "Ready to Invite":"bg-indigo-50 text-indigo-700",
    "Invitation Sent":"bg-amber-50 text-amber-700",
    "Invitation Viewed":"bg-purple-50 text-purple-700",
    "Accepted":"bg-teal-50 text-teal-700",
    "Active":"bg-green-50 text-green-700",
  };
  const idx = LIFECYCLE.indexOf(status);
  return (
    <div className="flex items-center gap-1">
      {LIFECYCLE.map((s,i)=>(
        <div key={s} className="flex items-center gap-1">
          <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors",i===idx?COLORS[s]:"bg-gray-100 text-gray-300")}>
            {i<idx&&<Check size={9}/>}{s}
          </div>
          {i<LIFECYCLE.length-1&&<div className={cn("w-3 h-px",i<idx?"bg-[#5C5CFF]":"bg-gray-200")}/>}
        </div>
      ))}
    </div>
  );
}

export function AddEmployeeWizard({ onClose, onDone }: { onClose:()=>void; onDone:()=>void }) {
  const [phase, setPhase] = useState<"form"|"invite-review"|"invite-sent">("form");
  const [step, setStep] = useState(1);
  const totalSteps = 9;
  const steps = ["Personal Info","Employment","Department","Manager","Role","Shift","Attendance Policy","Leave Policy","Review"];
  const [formData, setFormData] = useState({ firstName:"John", lastName:"Smith", email:"john.smith@acmecorp.com", phone:"+1 (555) 000-0000", empType:"Full-Time", dept:"Engineering", role:"Employee", shift:"General", manager:"David Chen", joinDate:"2024-07-15" });
  const update = (k: string, v: string) => setFormData(p=>({...p,[k]:v}));

  // Invitation state
  const [sending, setSending] = useState(false);
  const [inviteToken] = useState(() => Math.random().toString(36).slice(2,10).toUpperCase());
  const [inviteTimestamp, setInviteTimestamp] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [inviteActivity, setInviteActivity] = useState<{action:string;time:string}[]>([]);
  const [showActivity, setShowActivity] = useState(false);

  const displayName = [formData.firstName, formData.lastName].filter(Boolean).join(" ") || "New Employee";
  const displayEmail = formData.email || "email@company.com";
  const expiryDate = "Jul 22, 2024"; // 7 days from Jul 15

  const handleSendInvitation = () => {
    setSending(true);
    setTimeout(() => {
      const now = "Jul 15, 2024 · 10:32 AM";
      setInviteTimestamp(now);
      setInviteActivity([{action:"Invitation email sent",time:now}]);
      setSending(false);
      setPhase("invite-sent");
    }, 1200);
  };

  const handleResend = () => {
    const now = "Jul 15, 2024 · 10:45 AM";
    setInviteActivity(a=>[...a,{action:"Invitation resent",time:now}]);
  };

  const handleCopy = () => {
    setCopied(true);
    setTimeout(()=>setCopied(false), 2000);
  };

  // ── Phase: form ────────────────────────────────────────────────────────────
  if (phase==="form") return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose}/>
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col" style={{maxHeight:"90vh"}}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div><h2 className="text-base font-semibold text-gray-900">Add Employee</h2><p className="text-xs text-gray-500">Step {step} of {totalSteps} · {steps[step-1]}</p></div>
          <div className="flex items-center gap-3">
            <button className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 border border-gray-200 rounded-lg">Save Draft</button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"><X size={18}/></button>
          </div>
        </div>
        {/* Progress */}
        <div className="px-6 py-3 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-1">
            {steps.map((_,i)=>(
              <div key={i} className={cn("h-1.5 flex-1 rounded-full transition-colors",i<step?"bg-[#5C5CFF]":i===step-1?"bg-[#5C5CFF]":"bg-gray-200")}/>
            ))}
          </div>
          <div className="flex justify-between mt-1.5">
            {steps.map((s,i)=><span key={i} className={cn("text-[9px] font-medium",i===step-1?"text-[#5C5CFF]":"text-gray-300")}>{i===0||i===step-1||i===steps.length-1?s:""}</span>)}
          </div>
        </div>
        {/* Body */}
        <div className="flex-1 overflow-auto p-6">
          {step===1&&(
            <div className="grid grid-cols-2 gap-4">
              <InputField label="First Name" placeholder="John" value={formData.firstName} onChange={v=>update("firstName",v)} required/>
              <InputField label="Last Name" placeholder="Smith" value={formData.lastName} onChange={v=>update("lastName",v)} required/>
              <InputField label="Work Email" type="email" placeholder="john.smith@company.com" value={formData.email} onChange={v=>update("email",v)} required/>
              <InputField label="Phone Number" type="tel" placeholder="+1 (555) 000-0000" value={formData.phone} onChange={v=>update("phone",v)}/>
              <InputField label="Date of Birth" type="date"/>
              <SelectField label="Gender" options={["Select","Male","Female","Non-binary","Prefer not to say"]}/>
              <div className="col-span-2"><InputField label="Address" placeholder="123 Main Street, City, State, ZIP"/></div>
            </div>
          )}
          {step===2&&(
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Employee ID" placeholder="Auto-generated: E016"/>
              <InputField label="Join Date" type="date" value={formData.joinDate} onChange={v=>update("joinDate",v)} required/>
              <SelectField label="Employment Type" options={["Full-Time","Part-Time","Contract","Intern"]} value={formData.empType} onChange={v=>update("empType",v)} required/>
              <SelectField label="Branch" options={["New York HQ","San Francisco","Chicago","Austin"]}/>
              <InputField label="Job Title / Designation" placeholder="e.g. Software Engineer" required/>
              <SelectField label="Work Location" options={["On-site","Remote","Hybrid"]}/>
            </div>
          )}
          {step===3&&(
            <div className="space-y-4">
              <SelectField label="Department" options={["Engineering","Product","Design","Marketing","Sales","HR","Finance","Legal","Operations"]} value={formData.dept} onChange={v=>update("dept",v)} required/>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs font-medium text-gray-700 mb-2">Current Department Members</p>
                <div className="flex -space-x-2">
                  {EMPLOYEES.filter(e=>e.dept===formData.dept).slice(0,6).map(e=>(
                    <div key={e.id} title={e.name} className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-xs font-medium text-white flex-shrink-0" style={{backgroundColor:e.color}}>{e.initials}</div>
                  ))}
                  <div className="w-7 h-7 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-500">+{EMPLOYEES.filter(e=>e.dept===formData.dept).length-6}</div>
                </div>
              </div>
            </div>
          )}
          {step===4&&(
            <div className="space-y-4">
              <SelectField label="Reporting Manager" options={["Select Manager","David Chen","Jennifer Walsh","Carlos Rivera","Aisha Thompson","Emily Rodriguez"]} value={formData.manager} onChange={v=>update("manager",v)} required/>
              {formData.manager&&formData.manager!=="Select Manager"&&(
                <div className="bg-[#EEF2FF] rounded-lg p-4 flex items-center gap-3">
                  <Avt initials={formData.manager.split(" ").map(n=>n[0]).join("")} color="#5C5CFF" size="md"/>
                  <div><p className="text-sm font-semibold text-gray-800">{formData.manager}</p><p className="text-xs text-gray-500">VP Engineering · New York HQ</p></div>
                </div>
              )}
            </div>
          )}
          {(step===5||step===6)&&(
            <div className="space-y-4">
              {step===5&&<SelectField label="Role" options={["Employee","Manager","HR Admin","Super Admin"]} value={formData.role} onChange={v=>update("role",v)} required/>}
              {step===6&&(
                <div className="space-y-3">
                  <SelectField label="Shift Template" options={["General (09:00–18:00)","Morning (06:00–15:00)","Evening (14:00–23:00)","Night (22:00–07:00)","Flexible"]} required/>
                  <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-5 gap-2">
                    {["Mon","Tue","Wed","Thu","Fri"].map(d=>(
                      <div key={d} className="text-center"><p className="text-xs text-gray-500 mb-1">{d}</p><div className="w-8 h-8 rounded-full bg-[#EEF2FF] flex items-center justify-center mx-auto"><Check size={14} className="text-[#5C5CFF]"/></div></div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {(step===7||step===8)&&(
            <div className="space-y-4">
              <SelectField label={step===7?"Attendance Policy":"Leave Policy"} options={step===7?["Standard Attendance Policy","Remote Worker Policy","Shift Worker Policy"]:["Standard Policy","Executive Policy","Contractor Policy"]} required/>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs font-semibold text-gray-700 mb-3">{step===7?"Policy Details":"Leave Allocations"}</p>
                {step===7?(
                  <div className="space-y-2">
                    {[["Grace Period","15 minutes"],["Work Hours","9 hours/day"],["Biometric","Required"]].map(([k,v])=>(
                      <div key={k as string} className="flex justify-between"><span className="text-gray-500 text-xs">{k}</span><span className="font-medium text-gray-800 text-xs">{v}</span></div>
                    ))}
                  </div>
                ):(
                  <div className="space-y-2">
                    {[["Annual Leave","18 days"],["Sick Leave","10 days"],["Casual Leave","6 days"]].map(([k,v])=>(
                      <div key={k as string} className="flex justify-between"><span className="text-gray-500 text-xs">{k}</span><span className="font-medium text-gray-800 text-xs">{v}</span></div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          {step===9&&(
            <div className="space-y-4">
              {/* Lifecycle indicator */}
              <div className="overflow-x-auto pb-1"><LifecyclePill status="Ready to Invite"/></div>
              <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Send size={13} className="text-indigo-600"/>
                </div>
                <div>
                  <p className="text-sm font-semibold text-indigo-900">Profile saved — ready to invite</p>
                  <p className="text-xs text-indigo-700 mt-0.5">The employee profile has been created. Saving will not activate the account. You will send an invitation in the next step.</p>
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                {[["Full Name",displayName],["Work Email",displayEmail],["Employee ID","E016 (auto)"],["Employment Type",formData.empType],["Department",formData.dept],["Manager",formData.manager||"Not assigned"],["Shift",`${formData.shift} (09:00–18:00)`],["Join Date",formData.joinDate||"Not set"]].map(([k,v])=>(
                  <div key={k as string} className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <span className="text-xs text-gray-500">{k}</span>
                    <span className="text-sm font-medium text-gray-800">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
          <Btn variant="outline" size="sm" onClick={step===1?onClose:()=>setStep(s=>s-1)}>{step===1?"Cancel":"Back"}</Btn>
          <div className="flex items-center gap-2">
            {step<9
              ? <Btn size="sm" onClick={()=>setStep(s=>s+1)}>Next <ArrowRight size={13}/></Btn>
              : <Btn size="sm" onClick={()=>setPhase("invite-review")}><ArrowRight size={13}/>Save & Continue to Invite</Btn>
            }
          </div>
        </div>
      </div>
    </div>
  );

  // ── Phase: invite-review ───────────────────────────────────────────────────
  if (phase==="invite-review") return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40"/>
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col" style={{maxHeight:"90vh"}}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <button onClick={()=>setPhase("form")} className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"><ChevronLeft size={16}/></button>
            <div><h2 className="text-base font-semibold text-gray-900">Review & Send Invitation</h2><p className="text-xs text-gray-500">Employee profile saved · Status: Ready to Invite</p></div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"><X size={18}/></button>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-5">
          {/* Lifecycle */}
          <div className="overflow-x-auto"><LifecyclePill status="Ready to Invite"/></div>

          {/* Employee summary */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="w-12 h-12 rounded-full bg-[#5C5CFF] flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
              {(formData.firstName[0]||"J")+(formData.lastName[0]||"S")}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">{displayName}</p>
              <p className="text-xs text-gray-500">{formData.dept} · {formData.empType}</p>
              <p className="text-xs text-gray-400 mt-0.5">Joins: {formData.joinDate||"TBD"} · Reports to {formData.manager||"TBD"}</p>
            </div>
            <StatusBadge status="Ready to Invite"/>
          </div>

          {/* Invitation email info */}
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Invitation Details</p>
            </div>
            {[
              ["Recipient Email",displayEmail],
              ["Invitation Expires","Jul 22, 2024 (7 days)"],
              ["Activation Link","acmecorp.hrms.app/activate/***"],
              ["Email From","noreply@acmecorp.hrms.app"],
            ].map(([k,v])=>(
              <div key={k} className="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-0">
                <span className="text-xs text-gray-500">{k}</span>
                <span className="text-xs font-medium text-gray-800">{v}</span>
              </div>
            ))}
          </div>

          {/* What happens next */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-blue-900 mb-2">What happens next</p>
            <div className="space-y-1.5">
              {[
                "An invitation email is sent to the employee's work address",
                "The employee clicks the link to set up their password",
                "Their status changes to Active once they accept",
                "The link expires in 7 days — you can resend at any time",
              ].map((s,i)=>(
                <div key={i} className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5 text-[9px] font-bold text-blue-600">{i+1}</div>
                  <p className="text-xs text-blue-700">{s}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <Btn variant="outline" size="sm" onClick={()=>setPhase("form")}>Edit Profile</Btn>
          <Btn size="sm" onClick={handleSendInvitation} disabled={sending}>
            {sending?(
              <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Sending…</>
            ):(
              <><Send size={13}/>Send Invitation</>
            )}
          </Btn>
        </div>
      </div>
    </div>
  );

  // ── Phase: invite-sent ─────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40"/>
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col" style={{maxHeight:"90vh"}}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div><h2 className="text-base font-semibold text-gray-900">Invitation Sent</h2><p className="text-xs text-gray-500">Status updated · Awaiting employee response</p></div>
          <button onClick={onDone} className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"><X size={18}/></button>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-5">
          {/* Lifecycle */}
          <div className="overflow-x-auto"><LifecyclePill status="Invitation Sent"/></div>

          {/* Success banner */}
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-3">
              <Send size={24} className="text-green-500"/>
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">Invitation sent successfully</h3>
            <p className="text-sm text-gray-500 max-w-xs">An email was sent to <strong className="text-gray-700">{displayEmail}</strong> with a link to activate their account.</p>
          </div>

          {/* Invitation details */}
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Invitation Details</p>
              <StatusBadge status="Invitation Sent"/>
            </div>
            {[
              ["Employee",displayName],
              ["Email",displayEmail],
              ["Sent At",inviteTimestamp||"Jul 15, 2024 · 10:32 AM"],
              ["Expires","Jul 22, 2024 (7 days)"],
              ["Token",`ACT-${inviteToken}`],
            ].map(([k,v])=>(
              <div key={k} className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 last:border-0">
                <span className="text-xs text-gray-500">{k}</span>
                <span className="text-xs font-medium text-gray-800 font-mono">{v}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <button onClick={handleResend} className="w-full flex items-center gap-2.5 px-4 py-3 border border-gray-200 rounded-xl hover:border-[#5C5CFF]/40 hover:bg-[#EEF2FF] transition-colors group text-left">
              <div className="w-7 h-7 rounded-lg bg-gray-100 group-hover:bg-[#5C5CFF] flex items-center justify-center flex-shrink-0 transition-colors"><RefreshCw size={13} className="text-gray-500 group-hover:text-white transition-colors"/></div>
              <div><p className="text-sm font-medium text-gray-800">Resend Invitation</p><p className="text-[10px] text-gray-400">Send another invitation email to {displayEmail}</p></div>
            </button>
            <button onClick={handleCopy} className="w-full flex items-center gap-2.5 px-4 py-3 border border-gray-200 rounded-xl hover:border-[#5C5CFF]/40 hover:bg-[#EEF2FF] transition-colors group text-left">
              <div className="w-7 h-7 rounded-lg bg-gray-100 group-hover:bg-[#5C5CFF] flex items-center justify-center flex-shrink-0 transition-colors"><Copy size={13} className="text-gray-500 group-hover:text-white transition-colors"/></div>
              <div><p className="text-sm font-medium text-gray-800">{copied?"Copied!":"Copy Invitation Link"}</p><p className="text-[10px] text-gray-400">acmecorp.hrms.app/activate/{inviteToken}</p></div>
            </button>
            <button onClick={()=>setPhase("form")} className="w-full flex items-center gap-2.5 px-4 py-3 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors group text-left">
              <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0"><Edit size={13} className="text-gray-500"/></div>
              <div><p className="text-sm font-medium text-gray-800">Edit Employee</p><p className="text-[10px] text-gray-400">Update profile details before they activate</p></div>
            </button>
            <button onClick={()=>setShowActivity(!showActivity)} className="w-full flex items-center gap-2.5 px-4 py-3 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors group text-left">
              <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0"><Activity size={13} className="text-gray-500"/></div>
              <div className="flex-1"><p className="text-sm font-medium text-gray-800">View Invitation Activity</p><p className="text-[10px] text-gray-400">{inviteActivity.length} event{inviteActivity.length!==1?"s":""} recorded</p></div>
              <ChevronDown size={13} className={cn("text-gray-400 transition-transform",showActivity&&"rotate-180")}/>
            </button>
            {showActivity&&(
              <div className="border border-gray-200 rounded-xl overflow-hidden -mt-1">
                {inviteActivity.map((a,i)=>(
                  <div key={i} className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-100 last:border-0 bg-gray-50">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0"/>
                    <div><p className="text-xs font-medium text-gray-700">{a.action}</p><p className="text-[10px] text-gray-400">{a.time}</p></div>
                  </div>
                ))}
              </div>
            )}
            <button className="w-full flex items-center gap-2.5 px-4 py-3 border border-red-100 rounded-xl hover:bg-red-50 transition-colors group text-left">
              <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0"><XCircle size={13} className="text-red-400"/></div>
              <div><p className="text-sm font-medium text-red-600">Cancel Invitation</p><p className="text-[10px] text-gray-400">Revoke the activation link and return to Draft</p></div>
            </button>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200">
          <Btn className="w-full justify-center" onClick={onDone}>Done — View Employee List</Btn>
        </div>
      </div>
    </div>
  );
}

const getAttendanceDetails = (emp: Employee) => {
  const record = ATTENDANCE_RECORDS.find(r => r.id === emp.id || r.name === emp.name);
  if (record) {
    let status = record.status;
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
      workingHours: record.hours > 0 ? `${Math.floor(record.hours)}h ${Math.round((record.hours % 1) * 60)}m` : "–"
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
    workingHours: "8h 00m"
  };
};

const getVisibleEmployeesForOrg = (filteredEmployees: Employee[], allEmployees: Employee[]) => {
  const visible = new Set<string>();
  
  filteredEmployees.forEach(emp => {
    visible.add(emp.id);
    
    let current = emp;
    while (current) {
      const manager = allEmployees.find(e => e.name === current.manager || (current.manager === "CEO" && e.id === "CEO-ROOT"));
      if (manager && !visible.has(manager.id)) {
        visible.add(manager.id);
        current = manager;
      } else {
        break;
      }
    }
  });
  
  return allEmployees.filter(e => visible.has(e.id));
};

// ── Employee Tree Page Component ──
function EmployeeTreeTab({
  showTeamFilter,
  setShowTeamFilter,
  searchTerm,
  navigate,
  setTab,
  setActiveEmp,
  employees = []
}: {
  showTeamFilter: boolean;
  setShowTeamFilter: (b: boolean) => void;
  searchTerm: string;
  navigate: (p: AppPage) => void;
  setTab: (t: string) => void;
  setActiveEmp: (emp: Employee) => void;
  employees?: Employee[];
}) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 45, y: 200 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<Employee | null>(null);

  const [treeDept, setTreeDept] = useState("All");
  const [treeBranch, setTreeBranch] = useState("All");
  const [treeDesig, setTreeDesig] = useState("All");
  const [treeStatus, setTreeStatus] = useState("All");

  const getFullOrgData = () => {
    const all = [...employees];
    if (!all.some(e => e.id === "CEO-ROOT")) {
      all.push({
        id: "CEO-ROOT",
        name: "CEO / Organization Head",
        email: "ceo@acmecorp.com",
        phone: "+1 (555) 100-0000",
        dept: "Executive",
        designation: "Chief Executive Officer",
        status: "Active",
        shift: "General",
        joinDate: "2015-01-01",
        manager: "",
        branch: "New York HQ",
        empType: "Full-Time",
        initials: "CEO",
        attendance: 100,
        color: "#1F2937"
      });
    }
    return all;
  };

  const allNodes = getFullOrgData();

  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    allNodes.forEach(e => {
      const hasReports = allNodes.some(x => x.manager === e.name || (e.id === "CEO-ROOT" && x.manager === "CEO"));
      if (hasReports) {
        initial[e.id] = true;
      }
    });
    return initial;
  });

  const [activeSearchId, setActiveSearchId] = useState<string | null>(null);

  const allDepts = ["All", ...Array.from(new Set(employees.map(e => e.dept))).filter(Boolean).sort()];
  const allBranches = ["All", ...Array.from(new Set(employees.map(e => e.branch))).filter(Boolean).sort()];
  const allDesigs = ["All", ...Array.from(new Set(employees.map(e => e.designation))).filter(Boolean).sort()];

  // Filter tree nodes dynamically
  const filteredTreeNodes = allNodes.filter(e => {
    if (e.id === "CEO-ROOT") return true;
    const md = treeDept === "All" || e.dept === treeDept;
    const mb = treeBranch === "All" || e.branch === treeBranch;
    const mdg = treeDesig === "All" || e.designation === treeDesig;
    const ms = treeStatus === "All" || e.status === treeStatus;
    return md && mb && mdg && ms;
  });

  const visibleList = getVisibleEmployeesForOrg(filteredTreeNodes, allNodes);
  const roots = visibleList.filter(e => e.id === "CEO-ROOT");

  const expandAll = (employees: Employee[]) => {
    const updated: Record<string, boolean> = {};
    employees.forEach(e => {
      updated[e.id] = true;
    });
    setExpandedNodes(updated);
  };

  const collapseAll = () => {
    setExpandedNodes({});
  };

  const toggleExpandNode = (id: string) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleNodeClick = (node: Employee) => {
    setSelectedNode(node);
  };

  const focusNode = (id: string) => {
    const el = document.getElementById(`node-${id}`);
    const container = document.getElementById("canvas-viewport");
    if (el && container) {
      const containerRect = container.getBoundingClientRect();
      const nodeRect = el.getBoundingClientRect();
      const dx = (containerRect.left + containerRect.width / 2) - (nodeRect.left + nodeRect.width / 2);
      const dy = (containerRect.top + containerRect.height / 2) - (nodeRect.top + nodeRect.height / 2);
      setPan(prev => ({
        x: prev.x + dx,
        y: prev.y + dy
      }));
    }
  };

  useEffect(() => {
    if (searchTerm.trim().length > 1) {
      const match = allNodes.find(e => e.name.toLowerCase().includes(searchTerm.toLowerCase()));
      if (match) {
        setActiveSearchId(match.id);
      } else {
        setActiveSearchId(null);
      }
    } else {
      setActiveSearchId(null);
    }
  }, [searchTerm]);

  useEffect(() => {
    if (activeSearchId) {
      setExpandedNodes(prev => {
        const next = { ...prev };
        let curr = allNodes.find(e => e.id === activeSearchId);
        while (curr) {
          const manager = allNodes.find(e => e.name === curr.manager || (curr.manager === "CEO" && e.id === "CEO-ROOT"));
          if (manager) {
            next[manager.id] = true;
            curr = manager;
          } else {
            break;
          }
        }
        return next;
      });
      setTimeout(() => {
        focusNode(activeSearchId);
      }, 100);
    }
  }, [activeSearchId]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("input") || target.closest("select")) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="flex flex-1 overflow-hidden relative bg-[#F7F8FA] p-6 text-left">
      <div 
        id="canvas-viewport"
        className={cn(
          "relative w-full h-full border border-gray-200 rounded-xl bg-slate-50 overflow-hidden select-none shadow-inner",
          isDragging ? "cursor-grabbing" : "cursor-grab"
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Floating Canvas Controls */}
        <div className="absolute left-4 bottom-4 bg-white/95 backdrop-blur border border-gray-205 rounded-lg p-1.5 shadow-md z-10 flex items-center gap-1.5">
          <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} title="Zoom In" className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded font-bold text-sm transition-colors">+</button>
          <button onClick={() => setZoom(z => Math.max(0.4, z - 0.1))} title="Zoom Out" className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded font-bold text-sm transition-colors">−</button>
          <div className="w-px h-4 bg-gray-205" />
          <button onClick={() => { setZoom(1); setPan({ x: 45, y: 200 }); }} title="Reset View" className="px-2 h-7 flex items-center justify-center text-xs text-gray-600 hover:bg-gray-100 rounded font-medium transition-colors">Reset</button>
          <button onClick={() => { setZoom(0.75); setPan({ x: 20, y: 120 }); }} title="Fit to Screen" className="px-2 h-7 flex items-center justify-center text-xs text-gray-600 hover:bg-gray-100 rounded font-medium transition-colors">Fit</button>
          <div className="w-px h-4 bg-gray-205" />
          <button onClick={() => expandAll(allNodes)} className="px-2 h-7 flex items-center justify-center text-xs text-gray-600 hover:bg-gray-100 rounded font-medium transition-colors">Expand All</button>
          <button onClick={collapseAll} className="px-2 h-7 flex items-center justify-center text-xs text-gray-600 hover:bg-gray-100 rounded font-medium transition-colors">Collapse All</button>
        </div>

        {/* Transform Container */}
        <div 
          className="absolute origin-top-left"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          }}
        >
          <div className="p-16 flex items-center">
            {roots.map(root => (
              <HorizontalTreeNode
                key={root.id}
                node={root}
                allNodes={visibleList}
                expandedNodes={expandedNodes}
                toggleExpand={toggleExpandNode}
                onSelect={handleNodeClick}
                activeSearchId={activeSearchId}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Floating Side Panel Details */}
      {selectedNode && (
        <div className="absolute right-6 top-6 bottom-6 w-80 bg-white border border-gray-250 rounded-xl shadow-xl z-20 flex flex-col text-left">
          {/* Header */}
          <div className="px-5 py-4 border-b border-gray-150 flex items-center justify-between flex-shrink-0">
            <h3 className="text-sm font-bold text-gray-900">Employee Details</h3>
            <button 
              onClick={() => setSelectedNode(null)} 
              className="text-gray-400 hover:text-gray-650 p-1.5 rounded hover:bg-gray-100 transition-all"
            >
              <X size={15} />
            </button>
          </div>
          
          {/* Body */}
          <div className="flex-1 overflow-auto p-5 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              <Avt initials={selectedNode.initials} color={selectedNode.color} size="lg" />
              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-gray-900 truncate">{selectedNode.name}</h4>
                <p className="text-xs text-gray-500 truncate">{selectedNode.designation}</p>
              </div>
            </div>
            
            <div className="space-y-3">
              {[
                ["Department", selectedNode.dept],
                ["Location / Branch", selectedNode.branch],
                ["Manager", selectedNode.manager || "CEO"],
                ["Attendance Status", getAttendanceDetails(selectedNode).status],
                ["Direct Reportees", allNodes.filter(e => e.manager === selectedNode.name || (selectedNode.id === "CEO-ROOT" && e.manager === "CEO")).length.toString()]
              ].map(([k, v]) => (
                <div key={k} className="flex flex-col gap-0.5 bg-gray-50 rounded-lg p-2.5">
                  <span className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider">{k}</span>
                  <span className="text-xs font-semibold text-gray-800 mt-0.5">{v}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Actions footer */}
          <div className="p-4 border-t border-gray-150 bg-gray-50 flex flex-col gap-2 flex-shrink-0 rounded-b-xl">
            <Btn 
              onClick={() => {
                if (selectedNode.id === "CEO-ROOT" || selectedNode.id === "V001") {
                  alert("This is a system/virtual employee node.");
                  return;
                }
                setTab("Employees");
                setActiveEmp(selectedNode);
              }} 
              className="w-full justify-center text-xs"
            >
              View Profile
            </Btn>
            <Btn 
              variant="outline" 
              onClick={() => {
                if (selectedNode.id === "CEO-ROOT" || selectedNode.id === "V001") {
                  alert("This is a system/virtual employee node.");
                  return;
                }
                setTab("Employees");
                setActiveEmp(selectedNode);
              }} 
              className="w-full justify-center text-xs"
            >
              View Attendance
            </Btn>
          </div>
        </div>
      )}

      {/* ── Filters Modal ── */}
      {showTeamFilter && (
        <Modal title="Filter Employee Tree" onClose={() => setShowTeamFilter(false)} width="max-w-md">
          <div className="space-y-4 text-left">
            <SelectField
              label="Department"
              options={allDepts}
              value={treeDept}
              onChange={setTreeDept}
            />
            <SelectField
              label="Location"
              options={allBranches}
              value={treeBranch}
              onChange={setTreeBranch}
            />
            <SelectField
              label="Designation"
              options={allDesigs}
              value={treeDesig}
              onChange={setTreeDesig}
            />
            <SelectField
              label="Employment Status"
              options={["All", "Active", "On Leave", "Inactive"]}
              value={treeStatus}
              onChange={setTreeStatus}
            />
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-150">
              <Btn variant="outline" size="sm" onClick={() => {
                setTreeDept("All");
                setTreeBranch("All");
                setTreeDesig("All");
                setTreeStatus("All");
                setShowTeamFilter(false);
              }}>Reset</Btn>
              <Btn size="sm" onClick={() => setShowTeamFilter(false)}>Apply Filters</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Horizontal Tree Node Component ──
const HorizontalTreeNode = ({
  node,
  allNodes,
  expandedNodes,
  toggleExpand,
  onSelect,
  activeSearchId
}: {
  node: Employee;
  allNodes: Employee[];
  expandedNodes: Record<string, boolean>;
  toggleExpand: (id: string) => void;
  onSelect: (e: Employee) => void;
  activeSearchId: string | null;
}) => {
  const children = allNodes.filter(e => e.manager === node.name || (node.id === "CEO-ROOT" && e.manager === "CEO"));
  const hasChildren = children.length > 0;
  const isExpanded = !!expandedNodes[node.id];
  const att = getAttendanceDetails(node);
  const isHighlighted = activeSearchId === node.id;

  return (
    <div className="flex items-center relative">
      {/* Node Box */}
      <div 
        id={`node-${node.id}`}
        className={cn(
          "flex items-center gap-2.5 py-1.5 px-3 rounded-lg cursor-pointer group transition-all relative w-[190px] h-[48px] border bg-white shadow-sm flex-shrink-0 z-10",
          isHighlighted ? "border-[#5C5CFF] ring-2 ring-[#5C5CFF]/20 border-2" : "border-gray-200 hover:border-gray-350"
        )}
        onClick={() => onSelect(node)}
      >
        <Avt initials={node.initials} color={node.color} size="sm" />
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-bold text-gray-800 group-hover:text-[#5C5CFF] transition-colors truncate">{node.name}</span>
            <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", att.dotColor)} />
          </div>
          <p className="text-[9px] text-gray-500 truncate mt-0.5">{node.designation}</p>
        </div>
        
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand(node.id);
            }}
            className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border border-gray-200 flex items-center justify-center text-[10px] text-gray-505 hover:text-gray-800 hover:border-gray-300 shadow-sm z-20 font-bold transition-all"
          >
            {isExpanded ? "−" : `+${children.length}`}
          </button>
        )}
      </div>

      {/* Children list */}
      {hasChildren && isExpanded && (
        <div className="flex items-center relative pl-12">
          {/* Horizontal line from parent node right center to vertical line at left-6 */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-px bg-gray-300" />
          
          <div className="flex flex-col gap-4 relative">
            {children.map((child, index) => {
              const isFirst = index === 0;
              const isLast = index === children.length - 1;
              const isSingle = children.length === 1;

              return (
                <div key={child.id} className="relative flex items-center">
                  {/* Vertical Connector Line segment with rounded joints */}
                  {!isSingle && isFirst && (
                    <div 
                      className="absolute left-6 top-1/2 bottom-0 w-6 border-l border-t border-gray-300 rounded-tl-[6px]"
                      style={{ transform: "translateY(-0.5px)" }}
                    />
                  )}
                  {!isSingle && isLast && (
                    <div 
                      className="absolute left-6 top-0 bottom-1/2 w-6 border-l border-b border-gray-300 rounded-bl-[6px]"
                      style={{ transform: "translateY(0.5px)" }}
                    />
                  )}
                  {!isSingle && !isFirst && !isLast && (
                    <>
                      <div className="absolute left-6 top-0 bottom-0 w-px bg-gray-300" />
                      <div className="absolute left-6 w-6 h-px bg-gray-300" />
                    </>
                  )}
                  {isSingle && (
                    <div className="absolute left-6 w-6 h-px bg-gray-300" />
                  )}
                  
                  <HorizontalTreeNode
                    node={child}
                    allNodes={allNodes}
                    expandedNodes={expandedNodes}
                    toggleExpand={toggleExpand}
                    onSelect={onSelect}
                    activeSearchId={activeSearchId}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export function OrganizationPage({
  navigate,
  onSelectEmployee,
  activeTab,
  onTabChange,
  showTeamFilter,
  setShowTeamFilter,
  search
}: {
  navigate: (p: AppPage) => void;
  onSelectEmployee: (e: Employee) => void;
  activeTab: string;
  onTabChange?: (t: string) => void;
  showTeamFilter: boolean;
  setShowTeamFilter: (b: boolean) => void;
  search?: string;
}) {
  const [tab, setTabState] = useState("Overview");

  React.useEffect(() => {
    setTabState(activeTab || "Overview");
  }, [activeTab]);

  const setTab = (newTab: string) => {
    setTabState(newTab);
    onTabChange?.(newTab);
  };

  // ── Employees state ──
  const [empSearch, setEmpSearch] = useState("");
  const [empDept, setEmpDept] = useState("All");
  const [empStatus, setEmpStatus] = useState("All");
  const [empBranch, setEmpBranch] = useState("All");
  const [selected, setSelected] = useState<string[]>([]);
  const [activeEmp, setActiveEmp] = useState<Employee|null>(null);
  const [showAddEmp, setShowAddEmp] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [empActionModal, setEmpActionModal] = useState<string|null>(null);

  const { companyId } = useAuth();
  // ── Departments state ──
  const [realtimeDepts, setRealtimeDepts] = useState<any[]>([]);
  const [activeDept, setActiveDept] = useState("");
  const [deptWsTab, setDeptWsTab] = useState("Overview");
  const [showCreateDept, setShowCreateDept] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptCode, setNewDeptCode] = useState("");
  const [newDeptDesc, setNewDeptDesc] = useState("");
  const [newDeptHead, setNewDeptHead] = useState("");
  const [newDeptParent, setNewDeptParent] = useState("");

  useEffect(() => {
    let unsub: any = null;
    async function listenDepts() {
      const userEmail = (auth.currentUser?.email || "").toLowerCase();
      let targetCompanyId = companyId && companyId !== "default" ? companyId : "";

      if (!targetCompanyId && userEmail) {
        try {
          const appSnap = await getDoc(doc(db, "approved_users", userEmail));
          if (appSnap.exists()) {
            targetCompanyId = appSnap.data().companyId || appSnap.data().orgId || "";
          }
        } catch (_) {}
      }

      if (targetCompanyId) {
        try {
          unsub = onSnapshot(collection(db, "organizations", targetCompanyId, "departments"), (snap) => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            if (list.length > 0) {
              setRealtimeDepts(list);
              if (!activeDept) setActiveDept(list[0].name || list[0].id);
            }
          });
        } catch (_) {}

        try {
          const orgSnap = await getDoc(doc(db, "organizations", targetCompanyId));
          if (orgSnap.exists() && orgSnap.data().departments?.length) {
            const docList = orgSnap.data().departments.map((d: any, i: number) =>
              typeof d === "string" ? { id: `D_${i}`, name: d, code: d.substring(0, 3).toUpperCase(), color: "#5C5CFF" } : { color: "#5C5CFF", ...d }
            );
            setRealtimeDepts(prev => prev.length > 0 ? prev : docList);
            if (!activeDept && docList.length > 0) setActiveDept(docList[0].name || docList[0].id);
          }
        } catch (_) {}
      }
    }
    listenDepts();
    return () => { if (unsub) unsub(); };
  }, [companyId]);

  // ── deptEditDraft state ──
  const [deptEditDraft, setDeptEditDraft] = useState<{name:string;code:string;desc:string;parent:string;head:string}>({name:"",code:"",desc:"",parent:"",head:""});
  const [showEditDept, setShowEditDept] = useState(false);
  const [showChangeHead, setShowChangeHead] = useState(false);
  const [showAssignEmp, setShowAssignEmp] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showBulkExport, setShowBulkExport] = useState(false);
  const [showGenReport, setShowGenReport] = useState(false);
  const [showEditShift, setShowEditShift] = useState(false);
  const [showEditHoliday, setShowEditHoliday] = useState<string|null>(null);
  const [showEditBranch, setShowEditBranch] = useState<string|null>(null);
  const [headSearch, setHeadSearch] = useState("");
  const [opsSuccess, setOpsSuccess] = useState<string|null>(null);
  const opsToast = (msg: string) => { setOpsSuccess(msg); setTimeout(() => setOpsSuccess(null), 3000); };

  // ── Realtime Operations state ──
  const [realtimeShifts, setRealtimeShifts] = useState<any[]>([]);
  const [realtimeHolidays, setRealtimeHolidays] = useState<any[]>([]);
  const [realtimeBranches, setRealtimeBranches] = useState<any[]>([]);
  const [realtimeAnnouncements, setRealtimeAnnouncements] = useState<any[]>([]);
  const [realtimePolicies, setRealtimePolicies] = useState<any[]>([]);
  const [realtimeDocuments, setRealtimeDocuments] = useState<any[]>([]);
  const [realtimeOrgProfile, setRealtimeOrgProfile] = useState<any>(null);

  // Firestore listeners for operations collections
  useEffect(() => {
    const unsubs: any[] = [];
    async function listenOps() {
      const userEmail = (auth.currentUser?.email || "").toLowerCase();
      let targetCompanyId = companyId && companyId !== "default" ? companyId : "";
      if (!targetCompanyId && userEmail) {
        try {
          const appSnap = await getDoc(doc(db, "approved_users", userEmail));
          if (appSnap.exists()) targetCompanyId = appSnap.data().companyId || appSnap.data().orgId || "";
        } catch (_) {}
      }
      if (!targetCompanyId) return;

      // Org profile
      try {
        unsubs.push(onSnapshot(doc(db, "organizations", targetCompanyId), (snap) => {
          if (snap.exists()) setRealtimeOrgProfile({ id: snap.id, ...snap.data() });
        }));
      } catch (_) {}

      // Shifts
      try {
        unsubs.push(onSnapshot(collection(db, "organizations", targetCompanyId, "shifts"), (snap) => {
          setRealtimeShifts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }));
      } catch (_) {}

      // Holidays
      try {
        unsubs.push(onSnapshot(collection(db, "organizations", targetCompanyId, "holidays"), (snap) => {
          setRealtimeHolidays(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }));
      } catch (_) {}

      // Branches
      try {
        unsubs.push(onSnapshot(collection(db, "organizations", targetCompanyId, "branches"), (snap) => {
          setRealtimeBranches(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }));
      } catch (_) {}

      // Announcements
      try {
        unsubs.push(onSnapshot(collection(db, "organizations", targetCompanyId, "announcements"), (snap) => {
          setRealtimeAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }));
      } catch (_) {}

      // Policies
      try {
        unsubs.push(onSnapshot(collection(db, "organizations", targetCompanyId, "policies"), (snap) => {
          setRealtimePolicies(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }));
      } catch (_) {}

      // Documents
      try {
        unsubs.push(onSnapshot(collection(db, "organizations", targetCompanyId, "documents"), (snap) => {
          setRealtimeDocuments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }));
      } catch (_) {}
    }
    listenOps();
    return () => { unsubs.forEach(u => { if (u) u(); }); };
  }, [companyId]);

  const [opsTab, setOpsTab] = useState("Shifts");
  const [opsView, setOpsView] = useState<"list"|"calendar">("list");
  const [showCreateShift, setShowCreateShift] = useState(false);
  const [showCreateHoliday, setShowCreateHoliday] = useState(false);
  const [showCreateBranch, setShowCreateBranch] = useState(false);
  const [activeShift, setActiveShift] = useState<string|null>(null);

  // ── Policies state ──
  const [polTab, setPolTab] = useState("Attendance Policy");
  const [showCreatePolicy, setShowCreatePolicy] = useState(false);

  // ── Access Control state ──
  const [acTab, setAcTab] = useState("Roles");
  const [showAddRole, setShowAddRole] = useState(false);
  const [activeRole, setActiveRole] = useState<string|null>(null);

  // ── Announcements state ──
  const [annTab, setAnnTab] = useState("Published");
  const [showCreateAnn, setShowCreateAnn] = useState(false);
  const [annStep, setAnnStep] = useState(1);
  const [annTitle, setAnnTitle] = useState("");
  const [annBody, setAnnBody] = useState("");
  const [annAudience, setAnnAudience] = useState<string[]>(["All Employees"]);

  // ── Reports state ──
  const [activeReport, setActiveReport] = useState<string|null>(null);

  // ── Org Profile state ──
  const ORG_DEFAULTS = {name:"Acme Corp",portalName:"acmecorp",bizType:"Private Limited",industry:"Technology",employeeCount:"842",website:"https://acmecorp.com",address:"123 Main St, San Francisco, CA 94105",contactEmail:"hr@acmecorp.com",contactPhone:"+1 415 555 0100",timezone:"(UTC-8) Pacific Time",language:"English (US)",weekStart:"Monday",dateFormat:"MM/DD/YYYY"};
  const [orgData, setOrgData] = useState(ORG_DEFAULTS);
  const [orgDraft, setOrgDraft] = useState(ORG_DEFAULTS);
  const [showEditOrg, setShowEditOrg] = useState(false);
  const [orgSaved, setOrgSaved] = useState(false);

  // ── Realtime Employees State ──
  const [realtimeEmps, setRealtimeEmps] = useState<any[]>([]);

  useEffect(() => {
    let unsub: any = null;
    async function listenEmps() {
      const userEmail = (auth.currentUser?.email || "").toLowerCase();
      let targetCompanyId = companyId && companyId !== "default" ? companyId : "";

      if (!targetCompanyId && userEmail) {
        try {
          const appSnap = await getDoc(doc(db, "approved_users", userEmail));
          if (appSnap.exists()) {
            targetCompanyId = appSnap.data().companyId || appSnap.data().orgId || "";
          }
        } catch (_) {}
      }

      if (targetCompanyId) {
        try {
          unsub = onSnapshot(collection(db, "organizations", targetCompanyId, "users"), (snap) => {
            const list = snap.docs.map(d => {
              const u = d.data();
              const name = u.name || `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email || "Employee";
              const initials = u.initials || name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "EM";
              return {
                id: d.id || u.id || u.email,
                name,
                initials,
                color: u.color || "#5C5CFF",
                email: u.email || u.workEmail,
                dept: u.dept || u.department || "General",
                designation: u.designation || u.roleLabel || u.role || "Staff",
                status: u.status || "Active",
                branch: u.branch || "Headquarters",
                empType: u.empType || "Full-Time",
                joinDate: u.joinDate || "Recent",
                attendance: u.attendance || 100,
                manager: u.manager || "",
                ...u
              };
            });
            setRealtimeEmps(list);
          });
        } catch (_) {}
      }
    }
    listenEmps();
    return () => { if (unsub) unsub(); };
  }, [companyId]);

  const activeEmpList = realtimeEmps;

  // ── Derived ──
  const allDepts = ["All",...Array.from(new Set(activeEmpList.map(e=>e.dept))).sort()];
  const allBranches = ["All",...Array.from(new Set(activeEmpList.map(e=>e.branch))).sort()];
  const filteredEmps = activeEmpList.filter(e=>{
    const ms = (e.name||"").toLowerCase().includes(empSearch.toLowerCase())||(e.id||"").toLowerCase().includes(empSearch.toLowerCase());
    const md = empDept==="All"||e.dept===empDept;
    const mst = empStatus==="All"||e.status===empStatus;
    const mb = empBranch==="All"||e.branch===empBranch;
    return ms&&md&&mst&&mb;
  });
  const deptData = activeDept
    ? (realtimeDepts.find(d => (typeof d === "string" ? d : d.name || d.id) === activeDept) || { name: activeDept, value: activeEmpList.filter(e=>e.dept?.toLowerCase()===activeDept.toLowerCase()).length, color: "#5C5CFF" })
    : { name: "Department", value: 0, color: "#5C5CFF" };
  const deptMembers = activeEmpList.filter(e=>(e.dept||"").toLowerCase()===(activeDept||"").toLowerCase());
  const deptHead = deptMembers.find(e=>["VP","Director","Manager","Lead","CFO","Counsel"].some(t=>(e.designation||"").includes(t)));

  // ── Derived real-time operations data ──
  const SHIFTS_COLORS = ["#5C5CFF","#22C55E","#F59E0B","#EF4444","#8B5CF6","#06B6D4","#EC4899","#14B8A6"];
  const activeShifts = realtimeShifts.map((s,i) => ({
    name: s.name || "Shift",
    time: s.time || `${s.startTime || "09:00"} – ${s.endTime || "18:00"}`,
    days: s.days || "Mon–Fri",
    count: activeEmpList.filter(e => (e.shift||"").toLowerCase() === (s.name||"").toLowerCase()).length,
    grace: s.grace || "15 min",
    color: s.color || SHIFTS_COLORS[i % SHIFTS_COLORS.length],
    ...s,
  }));

  const activeBranches = realtimeBranches.map(b => ({
    name: b.name || "Branch",
    addr: b.addr || b.address || "—",
    emp: activeEmpList.filter(e => (e.branch||"").toLowerCase() === (b.name||"").toLowerCase()).length,
    phone: b.phone || "—",
    type: b.type || "Office",
    ...b,
  }));

  const activeHolidays = realtimeHolidays.map(h => ({
    date: h.date || "—",
    name: h.name || "Holiday",
    type: h.type || "National",
    branches: h.branches || "All",
    ...h,
  }));

  const activeAnnouncements = realtimeAnnouncements;

  const filteredAnn = activeAnnouncements.filter(a=>
    annTab==="Published" ? a.status==="Published" :
    annTab==="Scheduled" ? a.status==="Scheduled" :
    annTab==="Drafts" ? a.status==="Draft" :
    a.status==="Archived"
  );

  // ── Derived dept distribution from real employees ──
  const realDeptDist = useMemo(() => {
    const map: Record<string, number> = {};
    activeEmpList.forEach(e => { const d = e.dept || "Other"; map[d] = (map[d] || 0) + 1; });
    const colors = ["#5C5CFF","#22C55E","#F59E0B","#EF4444","#8B5CF6","#06B6D4","#EC4899","#14B8A6","#6366F1","#10B981"];
    return Object.entries(map).sort((a,b) => b[1] - a[1]).map(([name, value], i) => ({ name, value, color: colors[i % colors.length] }));
  }, [activeEmpList]);

  const REPORTS = useMemo(() => [
    {icon:Users,label:"Employee Report",desc:"Headcount, turnover, demographics, trends",color:"#5C5CFF",data: activeEmpList.length > 0 ? [{month:"Total",count:activeEmpList.length}] : []},
    {icon:GitBranch,label:"Department Report",desc:"Performance and headcount by department",color:"#22C55E",data:realDeptDist.map(d=>({name:d.name,value:d.value}))},
    {icon:Clock,label:"Attendance Report",desc:"Daily, weekly, monthly attendance summaries",color:"#F59E0B",data:[]},
    {icon:CalendarDays,label:"Leave Report",desc:"Leave utilization by employee and type",color:"#EF4444",data:[]},
    {icon:Megaphone,label:"Announcement Report",desc:"Reach, engagement, and read rates",color:"#8B5CF6",data:[]},
    {icon:FileBarChart,label:"Custom Report",desc:"Build reports with custom fields and filters",color:"#06B6D4",data:[]},
    {icon:RefreshCw,label:"Scheduled Reports",desc:"Automate report delivery via email",color:"#EC4899",data:[]},
    {icon:Download,label:"Export Center",desc:"Bulk export data in CSV or PDF format",color:"#14B8A6",data:[]},
  ], [activeEmpList, realDeptDist]);

  return (
    <div className="flex flex-col h-full bg-[#F7F8FA] overflow-hidden">
      <div className="flex-1 overflow-hidden flex flex-col">

        {/* ════════════════ OVERVIEW ════════════════ */}
        {tab==="Overview"&&(
          <div className="flex-1 overflow-auto p-6">
            <div className="grid grid-cols-12 gap-5">

              {/* Left column */}
              <div className="col-span-8 space-y-5">
                {/* KPIs */}
                <div className="grid grid-cols-4 gap-4">
                  <KPICard title="Total Employees" value={String(activeEmpList.length)} sub={activeEmpList.length > 0 ? `across ${realtimeDepts.length} depts` : "No employees yet"} trend={activeEmpList.length > 0 ? "up" : "neutral"} icon={Users} iconColor="#5C5CFF" onClick={()=>setTab("Employees")}/>
                  <KPICard title="Departments" value={String(realtimeDepts.length)} sub={`across ${activeBranches.length || 1} branches`} trend="neutral" icon={GitBranch} iconColor="#22C55E" onClick={()=>setTab("Departments")}/>
                  <KPICard title="Active Shifts" value={String(activeShifts.length)} sub={`${activeEmpList.length} employees assigned`} trend="neutral" icon={Clock} iconColor="#F59E0B" onClick={()=>setTab("Operations")}/>
                  <KPICard title="Announcements" value={String(activeAnnouncements.length)} sub={activeAnnouncements.filter(a=>a.status==="Published").length + " published"} trend="neutral" icon={Megaphone} iconColor="#EF4444"/>
                </div>

                {/* Organization Profile */}
                <div className="bg-white rounded-lg border border-gray-200 p-5">
                  <div className="flex items-start justify-between mb-4">
                    <h4 className="text-sm font-semibold text-gray-800">Organization Profile</h4>
                    <Btn variant="outline" size="sm"><Edit size={12}/>Edit</Btn>
                  </div>
                  <div className="flex items-start gap-5">
                    <div className="w-16 h-16 rounded-xl bg-[#EEF2FF] flex items-center justify-center flex-shrink-0 border-2 border-[#5C5CFF]/20">
                      <Building2 size={28} className="text-[#5C5CFF]"/>
                    </div>
                    <div className="flex-1 grid grid-cols-3 gap-x-8 gap-y-3">
                      {([["Company", realtimeOrgProfile?.name || realtimeOrgProfile?.organizationName || "—"],["Industry", realtimeOrgProfile?.industry || "—"],["Founded", realtimeOrgProfile?.founded || "—"],["Employee Count", String(activeEmpList.length)],["Headquarters", realtimeOrgProfile?.headquarters || realtimeOrgProfile?.address || "—"],["Working Days", realtimeOrgProfile?.workingDays || "Mon – Fri"]] as [string,string][]).map(([k,v])=>(
                        <div key={k}><p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">{k}</p><p className="text-sm font-medium text-gray-800">{v}</p></div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Headcount + Dept Distribution */}
                <div className="grid grid-cols-2 gap-5">
                  <div className="bg-white rounded-lg border border-gray-200 p-5">
                    <h4 className="text-sm font-semibold text-gray-800 mb-4">Employee Overview</h4>
                    {activeEmpList.length > 0 ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between"><span className="text-xs text-gray-500">Total Employees</span><span className="text-sm font-semibold text-gray-800">{activeEmpList.length}</span></div>
                        <div className="flex items-center justify-between"><span className="text-xs text-gray-500">Active</span><span className="text-sm font-semibold text-green-600">{activeEmpList.filter(e=>e.status==="Active").length}</span></div>
                        <div className="flex items-center justify-between"><span className="text-xs text-gray-500">On Leave</span><span className="text-sm font-semibold text-amber-600">{activeEmpList.filter(e=>e.status==="On Leave").length}</span></div>
                        <div className="flex items-center justify-between"><span className="text-xs text-gray-500">Inactive</span><span className="text-sm font-semibold text-gray-400">{activeEmpList.filter(e=>e.status==="Inactive").length}</span></div>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 text-center py-6">No employees registered yet</p>
                    )}
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-5">
                    <h4 className="text-sm font-semibold text-gray-800 mb-3">Department Distribution</h4>
                    {realDeptDist.length > 0 ? (
                      <div className="space-y-1.5">
                        {realDeptDist.slice(0,6).map(d=>(
                          <div key={d.name} className="flex items-center gap-2.5">
                            <div className="w-18 text-xs text-gray-500 text-right w-20 flex-shrink-0">{d.name}</div>
                            <div className="flex-1 bg-gray-100 rounded-full h-1.5"><div className="h-1.5 rounded-full" style={{width:`${(d.value/Math.max(activeEmpList.length,1))*100*3}%`,backgroundColor:d.color,maxWidth:"100%"}}/></div>
                            <div className="w-7 text-xs font-medium text-gray-700 flex-shrink-0">{d.value}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 text-center py-6">No departments found</p>
                    )}
                  </div>
                </div>

                {/* Recent Activities */}
                <div className="bg-white rounded-lg border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-4"><h4 className="text-sm font-semibold text-gray-800">Summary</h4></div>
                  <div className="space-y-3">
                    {activeEmpList.length > 0 ? (
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{backgroundColor:"#22C55E18"}}><Users size={13} style={{color:"#22C55E"}}/></div>
                        <div className="flex-1"><p className="text-sm text-gray-800">{activeEmpList.length} employees registered</p><p className="text-xs text-gray-400">across {realtimeDepts.length} departments</p></div>
                      </div>
                    ) : null}
                    {realtimeDepts.length > 0 ? (
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{backgroundColor:"#5C5CFF18"}}><GitBranch size={13} style={{color:"#5C5CFF"}}/></div>
                        <div className="flex-1"><p className="text-sm text-gray-800">{realtimeDepts.length} departments configured</p><p className="text-xs text-gray-400">Organization structure</p></div>
                      </div>
                    ) : null}
                    {activeShifts.length > 0 ? (
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{backgroundColor:"#8B5CF618"}}><Clock size={13} style={{color:"#8B5CF6"}}/></div>
                        <div className="flex-1"><p className="text-sm text-gray-800">{activeShifts.length} shifts active</p><p className="text-xs text-gray-400">Workforce scheduling</p></div>
                      </div>
                    ) : null}
                    {activeEmpList.length === 0 && realtimeDepts.length === 0 && (
                      <p className="text-xs text-gray-400 text-center py-4">No activity yet — start by adding employees and departments</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right column */}
              <div className="col-span-4 space-y-4">
                {/* Organization Health */}
                <div className="bg-white rounded-lg border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-800">Organization Health</h4>
                    {(() => {
                      const score = Math.min(100, Math.round(
                        (activeEmpList.length > 0 ? 25 : 0) +
                        (realtimeDepts.length > 0 ? 25 : 0) +
                        (activeShifts.length > 0 ? 25 : 0) +
                        (activeAnnouncements.length > 0 ? 25 : 0)
                      ));
                      return <span className={`text-xs font-semibold px-2 py-0.5 rounded ${score > 50 ? 'text-green-600 bg-green-50' : 'text-amber-600 bg-amber-50'}`}>{score}%</span>;
                    })()}
                  </div>
                  {(() => {
                    const score = Math.min(100, Math.round(
                      (activeEmpList.length > 0 ? 25 : 0) +
                      (realtimeDepts.length > 0 ? 25 : 0) +
                      (activeShifts.length > 0 ? 25 : 0) +
                      (activeAnnouncements.length > 0 ? 25 : 0)
                    ));
                    return <div className="w-full bg-gray-100 rounded-full h-2 mb-4"><div className="h-2 bg-[#5C5CFF] rounded-full" style={{width:`${score}%`}}/></div>;
                  })()}
                  <div className="space-y-2.5">
                    {[
                      {label:"Employees",count:activeEmpList.length,color:activeEmpList.length>0?"text-green-600":"text-amber-600",bg:activeEmpList.length>0?"bg-green-50":"bg-amber-50",action:()=>setTab("Employees")},
                      {label:"Departments",count:realtimeDepts.length,color:realtimeDepts.length>0?"text-green-600":"text-red-600",bg:realtimeDepts.length>0?"bg-green-50":"bg-red-50",action:()=>setTab("Departments")},
                      {label:"Shifts Configured",count:activeShifts.length,color:activeShifts.length>0?"text-green-600":"text-orange-600",bg:activeShifts.length>0?"bg-green-50":"bg-orange-50",action:()=>setTab("Operations")},
                      {label:"Announcements",count:activeAnnouncements.length,color:activeAnnouncements.length>0?"text-green-600":"text-blue-600",bg:activeAnnouncements.length>0?"bg-green-50":"bg-blue-50",action:()=>setTab("Announcements")},
                    ].map((h,i)=>(
                      <button key={i} onClick={h.action} className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 transition-colors text-left">
                        <span className="text-xs text-gray-600">{h.label}</span>
                        <span className={cn("text-xs font-semibold px-2 py-0.5 rounded",h.bg,h.color)}>{h.count}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-lg border border-gray-200 p-5">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3">Quick Actions</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {label:"Add Employee",icon:UserPlus,color:"#5C5CFF",action:()=>setShowAddEmp(true)},
                      {label:"Create Department",icon:GitBranch,color:"#22C55E",action:()=>{setTab("Departments");setShowCreateDept(true)}},
                      {label:"Add Branch",icon:Building2,color:"#F59E0B",action:()=>{setTab("Operations");setOpsTab("Branches");setShowCreateBranch(true)}},
                      {label:"Create Holiday",icon:CalendarDays,color:"#EF4444",action:()=>{setTab("Operations");setOpsTab("Holidays");setShowCreateHoliday(true)}},
                      {label:"Create Shift",icon:Clock,color:"#8B5CF6",action:()=>{setTab("Operations");setOpsTab("Shifts");setShowCreateShift(true)}},
                      {label:"New Announcement",icon:Megaphone,color:"#06B6D4",action:()=>{setTab("Announcements");setShowCreateAnn(true)}},
                    ].map((qa,i)=>(
                      <button key={i} onClick={qa.action} className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-100 hover:border-[#5C5CFF]/30 hover:bg-gray-50 transition-all text-left">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{backgroundColor:qa.color+"18"}}><qa.icon size={13} style={{color:qa.color}}/></div>
                        <span className="text-xs font-medium text-gray-700">{qa.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* AI Assistant */}
                <div className="bg-gradient-to-br from-[#EEF2FF] to-[#F0F9FF] rounded-lg border border-[#5C5CFF]/20 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-[#5C5CFF] flex items-center justify-center"><Bot size={14} className="text-white"/></div>
                    <h4 className="text-sm font-semibold text-gray-800">AI Assistant</h4>
                    <span className="text-[10px] bg-[#5C5CFF] text-white px-1.5 py-0.5 rounded-full font-medium ml-auto">3 insights</span>
                  </div>
                  <div className="space-y-2.5">
                    {[
                      {text:"3 employees in Marketing have attendance below 90% this month",action:"Review",color:"text-amber-600"},
                      {text:"Engineering is understaffed vs. headcount target. Consider 2 new hires",action:"Post Job",color:"text-[#5C5CFF]"},
                      {text:"Leave policy for contractors hasn't been updated in 18 months",action:"Update",color:"text-green-600"},
                    ].map((s,i)=>(
                      <div key={i} className="bg-white/70 rounded-lg p-3">
                        <p className="text-xs text-gray-700 mb-1.5">{s.text}</p>
                        <button className={cn("text-xs font-medium",s.color)}>{s.action} →</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ════════════════ EMPLOYEES ════════════════ */}
        {tab==="Employees"&&(
          <div className="flex flex-1 overflow-hidden">
            {/* LEFT: Employee Directory */}
            <div className="flex flex-col border-r border-gray-200" style={{width:activeEmp?"420px":"100%",minWidth:"360px",flexShrink:0}}>
              {/* Toolbar */}
              <div className="bg-white border-b border-gray-100 px-4 py-3 space-y-2 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1"><Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"/>
                    <input type="text" placeholder="Search name, ID, role…" value={empSearch} onChange={e=>setEmpSearch(e.target.value)} className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5C5CFF]"/>
                  </div>
                  <Btn size="sm" onClick={()=>setShowAddEmp(true)}><Plus size={13}/></Btn>
                  <Btn size="sm" variant="outline" onClick={()=>setShowImport(true)}><Upload size={13}/></Btn>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1"><select value={empDept} onChange={e=>setEmpDept(e.target.value)} className="w-full pl-2 pr-6 py-1 text-xs border border-gray-300 rounded-lg bg-white appearance-none focus:outline-none focus:ring-1 focus:ring-[#5C5CFF]">{allDepts.map(d=><option key={d}>{d}</option>)}</select><ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/></div>
                  <div className="relative flex-1"><select value={empStatus} onChange={e=>setEmpStatus(e.target.value)} className="w-full pl-2 pr-6 py-1 text-xs border border-gray-300 rounded-lg bg-white appearance-none focus:outline-none focus:ring-1 focus:ring-[#5C5CFF]"><option>All</option><option>Active</option><option>On Leave</option><option>Inactive</option></select><ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/></div>
                  <div className="relative flex-1"><select value={empBranch} onChange={e=>setEmpBranch(e.target.value)} className="w-full pl-2 pr-6 py-1 text-xs border border-gray-300 rounded-lg bg-white appearance-none focus:outline-none focus:ring-1 focus:ring-[#5C5CFF]">{allBranches.map(b=><option key={b}>{b}</option>)}</select><ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/></div>
                </div>
              </div>
              {/* Bulk bar */}
              {selected.length>0&&(
                <div className="bg-[#EEF2FF] border-b border-[#5C5CFF]/20 px-4 py-2 flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs font-medium text-[#5C5CFF]">{selected.length} selected</span>
                  <Btn size="sm" variant="outline">Assign Shift</Btn>
                  <Btn size="sm" variant="outline">Transfer</Btn>
                  <Btn size="sm" variant="danger"><UserX size={11}/>Deactivate</Btn>
                  <button className="ml-auto text-gray-400 hover:text-gray-600" onClick={()=>setSelected([])}><X size={14}/></button>
                </div>
              )}
              {/* Count */}
              <div className="px-4 py-1.5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                <span className="text-xs text-gray-400">{filteredEmps.length} employees</span>
                <Btn size="sm" variant="ghost"><Download size={11}/>Export</Btn>
              </div>
              {/* Employee List */}
              <div className="flex-1 overflow-auto divide-y divide-gray-100">
                {filteredEmps.map(emp=>(
                  <div key={emp.id} onClick={()=>setActiveEmp(emp)} className={cn("flex items-center gap-3 px-3 py-1.5 cursor-pointer transition-colors",activeEmp?.id===emp.id?"bg-[#EEF2FF] border-l-2 border-[#5C5CFF]":"hover:bg-gray-50 border-l-2 border-transparent")}>
                    <input type="checkbox" checked={selected.includes(emp.id)} onChange={e=>{e.stopPropagation();setSelected(prev=>e.target.checked?[...prev,emp.id]:prev.filter(x=>x!==emp.id))}} className="rounded border-gray-300 accent-[#5C5CFF] flex-shrink-0" onClick={e=>e.stopPropagation()}/>
                    <Avt initials={emp.initials} color={emp.color} size="sm"/>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{emp.name}</p>
                      <p className="text-[11px] text-gray-400 truncate">{emp.designation} · {emp.dept}</p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <StatusBadge status={emp.status}/>
                      <div className="flex items-center gap-1 mt-0.5 justify-end">
                        <div className="w-8 bg-gray-200 rounded-full h-1"><div className="h-1 rounded-full" style={{width:`${emp.attendance}%`,backgroundColor:emp.attendance>95?"#22C55E":emp.attendance>85?"#F59E0B":"#EF4444"}}/></div>
                        <span className="text-[9px] text-gray-400">{emp.attendance}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* RIGHT: Employee Workspace */}
            {activeEmp&&(
              <div className="flex-1 overflow-hidden">
                <OrgEmpWorkspace
                  emp={activeEmp}
                  onClose={()=>setActiveEmp(null)}
                  onAction={(a)=>setEmpActionModal(a)}
                />
              </div>
            )}
          </div>
        )}

        {/* ════════════════ EMPLOYEE TREE ════════════════ */}
        {tab==="Employee Tree"&&(
          <EmployeeTreeTab
            showTeamFilter={showTeamFilter}
            setShowTeamFilter={setShowTeamFilter}
            searchTerm={search || ""}
            navigate={navigate}
            setTab={setTab}
            setActiveEmp={setActiveEmp}
            employees={activeEmpList}
          />
        )}

        {/* ════════════════ DEPARTMENTS ════════════════ */}
        {tab==="Departments"&&(
          <div className="flex flex-1 overflow-hidden">
            {/* LEFT: Department List */}
            <div className="flex flex-col border-r border-gray-200 flex-shrink-0" style={{width:"300px"}}>
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between flex-shrink-0 bg-white">
                <span className="text-xs font-medium text-gray-600">{realtimeDepts.length} Departments</span>
                <Btn size="sm" onClick={()=>setShowCreateDept(true)}><Plus size={13}/>New</Btn>
              </div>
              <div className="flex-1 overflow-auto divide-y divide-gray-100">
                {realtimeDepts.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    <GitBranch size={24} className="mx-auto mb-2 text-gray-300"/>
                    <p className="text-xs text-gray-500 mb-3">No departments created yet</p>
                    <Btn size="sm" onClick={()=>setShowCreateDept(true)}><Plus size={12}/>Create Department</Btn>
                  </div>
                ) : (
                  realtimeDepts.map(d=>{
                    const dName = typeof d === "string" ? d : d.name || d.code || d.id;
                    const dColor = (typeof d === "object" && d.color) ? d.color : "#5C5CFF";
                    const members = activeEmpList.filter(e => (e.dept||"").toLowerCase() === dName.toLowerCase());
                    const headName = (typeof d === "object" && d.head) ? d.head : (members.find(e=>["VP","Director","Manager","Lead","CFO","Counsel"].some(t=>(e.designation||"").includes(t)))?.name || "");

                    return (
                      <div key={d.id || dName} onClick={()=>{setActiveDept(dName);setDeptWsTab("Overview");}} className={cn("flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors",activeDept===dName || (!activeDept && d === realtimeDepts[0])?"bg-[#EEF2FF] border-l-2 border-[#5C5CFF]":"hover:bg-gray-50 border-l-2 border-transparent")}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{backgroundColor:dColor+"18"}}><GitBranch size={14} style={{color:dColor}}/></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800">{dName}</p>
                          <p className="text-xs text-gray-400">{members.length} members{headName?` · ${headName.split(" ")[0]}`:""}</p>
                        </div>
                        <ChevronRight size={13} className="text-gray-300 flex-shrink-0"/>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            {/* RIGHT: Department Workspace */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {realtimeDepts.length > 0 ? (
                <>
                  {/* Header */}
                  <div className="bg-white border-b border-gray-200 px-5 pt-4 pb-0 flex-shrink-0">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#EEF2FF]"><GitBranch size={18} className="text-[#5C5CFF]"/></div>
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900">{activeDept || (realtimeDepts[0]?.name || realtimeDepts[0]?.id || "Department")}</h3>
                          <p className="text-xs text-gray-500">Active Organization Department</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Btn size="sm" variant="outline" onClick={()=>setShowEditDept(true)}><Edit size={12}/>Edit</Btn>
                      </div>
                    </div>
                    <div className="flex gap-0.5 overflow-x-auto">
                      {["Overview","Members"].map(t=>(
                        <button key={t} onClick={()=>setDeptWsTab(t)} className={cn("px-3.5 py-2.5 text-xs font-medium border-b-2 -mb-px whitespace-nowrap transition-colors flex-shrink-0",deptWsTab===t?"border-[#5C5CFF] text-[#5C5CFF]":"border-transparent text-gray-500 hover:text-gray-700")}>{t}</button>
                      ))}
                    </div>
                  </div>
                  {/* Body */}
                  <div className="flex-1 overflow-auto p-5">
                    {deptWsTab==="Overview"&&(
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-3">
                          {[["Members",deptData.value,"#5C5CFF"],["Avg Attendance","96.2%","#22C55E"],["Open Positions","3","#F59E0B"]].map(([k,v,c])=>(
                            <div key={k as string} className="rounded-lg p-3.5" style={{backgroundColor:(c as string)+"10"}}>
                              <p className="text-xl font-bold" style={{color:c as string}}>{v}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{k}</p>
                            </div>
                          ))}
                        </div>
                        {deptHead&&(
                          <div className="bg-white rounded-lg border border-gray-100 p-4 flex items-center gap-3">
                            <Avt initials={deptHead.initials} color={deptHead.color} size="md"/>
                            <div className="flex-1"><p className="text-sm font-semibold text-gray-800">{deptHead.name}</p><p className="text-xs text-gray-500">Department Head · {deptHead.designation}</p></div>
                            <Btn size="sm" variant="outline">Change Head</Btn>
                          </div>
                        )}
                        <div className="bg-white rounded-lg border border-gray-100 p-4">
                          <p className="text-xs font-semibold text-gray-700 mb-3">Quick Actions</p>
                          <div className="flex flex-wrap gap-2">
                            {["Assign Head","Move Employees","Add Member","Merge Department","Archive Department"].map(a=>(
                              <button key={a} className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:border-[#5C5CFF]/40 hover:text-[#5C5CFF] transition-colors">{a}</button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    {deptWsTab==="Members"&&(
                      <div className="space-y-2">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-medium text-gray-800">{deptMembers.length} members</p>
                          <div className="flex gap-2">
                            <Btn size="sm" variant="outline"><Upload size={12}/>Import</Btn>
                            <Btn size="sm"><UserPlus size={12}/>Add</Btn>
                          </div>
                        </div>
                        {deptMembers.map(emp=>(
                          <div key={emp.id} onClick={()=>{setTab("Employees");setActiveEmp(emp);}} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100 hover:border-[#5C5CFF]/30 cursor-pointer">
                            <Avt initials={emp.initials} color={emp.color} size="sm"/>
                            <div className="flex-1"><p className="text-sm font-medium text-gray-800">{emp.name}</p><p className="text-xs text-gray-400">{emp.designation}</p></div>
                            <StatusBadge status={emp.status}/>
                            <button className="p-1.5 hover:bg-gray-100 rounded text-gray-400"><MoreHorizontal size={13}/></button>
                          </div>
                        ))}
                      </div>
                    )}
                    {deptWsTab==="Statistics"&&(
                      <div className="space-y-4">
                        <div className="bg-white rounded-lg border border-gray-100 p-4">
                          <h4 className="text-xs font-semibold text-gray-700 mb-3">Attendance by Month</h4>
                          <ResponsiveContainer width="100%" height={160}>
                            <RBarChart id="dept-att" data={[{month:"Jan",rate:95},{month:"Feb",rate:97},{month:"Mar",rate:94},{month:"Apr",rate:96},{month:"May",rate:98},{month:"Jun",rate:93}]}>
                              <CartesianGrid key="cg-da" strokeDasharray="3 3" stroke="#F3F4F6"/>
                              <XAxis key="x-da" dataKey="month" tick={{fontSize:10,fill:"#9CA3AF"}} axisLine={false} tickLine={false}/>
                              <YAxis key="y-da" domain={[85,100]} tick={{fontSize:10,fill:"#9CA3AF"}} axisLine={false} tickLine={false}/>
                              <Tooltip key="tip-da" contentStyle={{fontSize:11,borderRadius:8}} formatter={(v:any)=>`${v}%`}/>
                              <Bar key="rate" dataKey="rate" fill={deptData.color} radius={[3,3,0,0]}/>
                            </RBarChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {[["Annual Leaves Taken","74 days","this year"],["Sick Leaves","23 days","this year"],["Avg Tenure","2.8 years","per employee"],["Turnover Rate","4.2%","last 12 months"]].map(([k,v,sub])=>(
                            <div key={k as string} className="bg-white rounded-lg border border-gray-100 p-3.5">
                              <p className="text-xs text-gray-400">{k}</p>
                              <p className="text-lg font-bold text-gray-900 mt-0.5">{v}</p>
                              <p className="text-[10px] text-gray-400">{sub}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {deptWsTab==="Timeline"&&(
                      <div className="space-y-3">
                        {[
                          {date:"Jun 28",event:"New member added",detail:"Yuki Tanaka joined Engineering",color:"#22C55E"},
                          {date:"May 15",event:"Promotion",detail:"Sarah Mitchell promoted to Senior Engineer",color:"#5C5CFF"},
                          {date:"Mar 1",event:"Reorganization",detail:"DevOps sub-team merged into Engineering",color:"#F59E0B"},
                          {date:"Jan 10",event:"Department Head Changed",detail:"David Chen became VP Engineering",color:"#8B5CF6"},
                          {date:"Dec 5",event:"Budget Updated",detail:"Annual headcount budget increased to 30",color:"#06B6D4"},
                        ].map((t,i)=>(
                          <div key={i} className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1" style={{backgroundColor:t.color}}/>
                              {i<4&&<div className="w-0.5 bg-gray-200 flex-1 mt-1.5 min-h-[24px]"/>}
                            </div>
                            <div className="pb-3">
                              <p className="text-xs font-medium text-gray-800">{t.event}</p>
                              <p className="text-xs text-gray-500">{t.detail}</p>
                              <p className="text-[10px] text-gray-400 mt-0.5">{t.date}, 2024</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {deptWsTab==="Configuration"&&(
                      <div className="space-y-4">
                        <div className="bg-white rounded-lg border border-gray-100 p-4 space-y-3">
                          <InputField label="Department Name" value={activeDept}/>
                          <SelectField label="Parent Department" options={["None (Root)","Operations","Engineering","Corporate"]}/>
                          <SelectField label="Cost Center" options={["ENG-001","PROD-002","MKT-003","FIN-004"]}/>
                          <div className="flex justify-end pt-2"><Btn size="sm">Save Changes</Btn></div>
                        </div>
                        <div className="bg-red-50 rounded-lg border border-red-100 p-4">
                          <p className="text-xs font-semibold text-red-800 mb-1">Danger Zone</p>
                          <p className="text-xs text-red-600 mb-3">Archiving this department will move all members to Unassigned.</p>
                          <Btn variant="danger" size="sm">Archive Department</Btn>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400 bg-white">
                  <GitBranch size={32} className="mb-2 text-gray-300"/>
                  <p className="text-sm font-medium text-gray-600 mb-1">No Departments Available</p>
                  <p className="text-xs text-gray-400 mb-4">Create your first department to manage teams and structure.</p>
                  <Btn size="sm" onClick={()=>setShowCreateDept(true)}><Plus size={13}/>Create Department</Btn>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════════════ OPERATIONS ════════════════ */}
        {tab==="Operations"&&(
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Sub-tab bar */}
            <div className="bg-white border-b border-gray-200 px-6 py-2 flex items-center gap-1 flex-shrink-0">
              {["Shifts","Holidays","Branches","Locations","Geo Fence","Approval Flow"].map(t=>(
                <button key={t} onClick={()=>setOpsTab(t)} className={cn("px-3 py-2 text-xs font-medium rounded-lg transition-colors",opsTab===t?"bg-[#EEF2FF] text-[#5C5CFF]":"text-gray-600 hover:bg-gray-100")}>{t}</button>
              ))}
              <div className="ml-auto flex items-center gap-2">
                {["Shifts","Holidays","Branches","Locations"].includes(opsTab)&&(
                  <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                    <button onClick={()=>setOpsView("list")} className={cn("px-2.5 py-1.5 text-xs",opsView==="list"?"bg-[#EEF2FF] text-[#5C5CFF]":"text-gray-500 hover:bg-gray-50")}><List size={13}/></button>
                    <button onClick={()=>setOpsView("calendar")} className={cn("px-2.5 py-1.5 text-xs",opsView==="calendar"?"bg-[#EEF2FF] text-[#5C5CFF]":"text-gray-500 hover:bg-gray-50")}><CalendarDays size={13}/></button>
                  </div>
                )}
                {opsTab==="Shifts"&&<Btn size="sm" onClick={()=>setShowCreateShift(true)}><Plus size={13}/>Create Shift</Btn>}
                {opsTab==="Holidays"&&<Btn size="sm" onClick={()=>setShowCreateHoliday(true)}><Plus size={13}/>Add Holiday</Btn>}
                {opsTab==="Branches"&&<Btn size="sm" onClick={()=>setShowCreateBranch(true)}><Plus size={13}/>Add Branch</Btn>}
                {opsTab==="Locations"&&<Btn size="sm"><Plus size={13}/>Add Location</Btn>}
              </div>
            </div>
            <div className="flex-1 overflow-auto p-6">

              {/* Shifts */}
              {opsTab==="Shifts"&&(
                activeShift?(
                  <div className="max-w-2xl">
                    <button onClick={()=>setActiveShift(null)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#5C5CFF] mb-4"><ChevronLeft size={14}/>Back to Shifts</button>
                    {activeShifts.filter(s=>s.name===activeShift).map(s=>(
                      <div key={s.name} className="space-y-4">
                        <div className="bg-white rounded-lg border border-gray-200 p-5">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{backgroundColor:s.color+"18"}}><Clock size={22} style={{color:s.color}}/></div>
                              <div><h3 className="text-base font-semibold text-gray-900">{s.name} Shift</h3><p className="text-sm text-gray-500">{s.time} · {s.days}</p></div>
                            </div>
                            <div className="flex gap-2"><Btn size="sm" variant="outline"><Edit size={12}/>Edit</Btn><Btn size="sm" variant="danger">Delete</Btn></div>
                          </div>
                          <div className="grid grid-cols-3 gap-4">
                            {[["Employees",s.count],["Grace Period",s.grace],["Working Days",s.days]].map(([k,v])=>(
                              <div key={k as string} className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-400">{k}</p><p className="text-sm font-semibold text-gray-800 mt-0.5">{v}</p></div>
                            ))}
                          </div>
                        </div>
                        <div className="bg-white rounded-lg border border-gray-200 p-5">
                          <div className="flex items-center justify-between mb-3"><h4 className="text-sm font-semibold text-gray-800">Employees on this Shift</h4><Btn size="sm" variant="outline"><UserPlus size={12}/>Assign</Btn></div>
                          <div className="space-y-2">
                            {activeEmpList.filter(e=>(e.shift||"").toLowerCase()===s.name.toLowerCase()).slice(0,5).map(emp=>(
                              <div key={emp.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50">
                                <Avt initials={emp.initials} color={emp.color} size="sm"/>
                                <div className="flex-1"><p className="text-sm font-medium text-gray-800">{emp.name}</p><p className="text-xs text-gray-400">{emp.dept}</p></div>
                                <button className="text-xs text-red-400 hover:text-red-600">Remove</button>
                              </div>
                            ))}
                            {activeEmpList.filter(e=>(e.shift||"").toLowerCase()===s.name.toLowerCase()).length===0&&<p className="text-xs text-gray-400 text-center py-4">No employees on this shift yet</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                    {activeShifts.filter(s=>s.name===activeShift).length===0&&<p className="text-xs text-gray-400 text-center py-8">Shift not found</p>}
                  </div>
                ):(
                  <div className="space-y-4">
                    {activeShifts.length > 0 ? (
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        {activeShifts.map(s=>(
                          <div key={s.name} onClick={()=>setActiveShift(s.name)} className="bg-white rounded-lg border border-gray-200 p-5 hover:border-[#5C5CFF]/40 hover:shadow-sm transition-all cursor-pointer group">
                            <div className="flex items-start justify-between mb-3">
                              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{backgroundColor:s.color+"18"}}><Clock size={18} style={{color:s.color}}/></div>
                              <button className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 p-1"><MoreHorizontal size={14}/></button>
                            </div>
                            <h4 className="text-sm font-semibold text-gray-800 mb-1">{s.name} Shift</h4>
                            <p className="text-xs text-gray-500 mb-0.5">{s.time}</p>
                            <p className="text-xs text-gray-400 mb-3">{s.days} · Grace: {s.grace}</p>
                            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                              <span className="text-xs text-gray-500">{s.count} employees</span>
                              <span className="text-xs text-[#5C5CFF] font-medium group-hover:underline">View details →</span>
                            </div>
                          </div>
                        ))}
                        <button onClick={()=>setShowCreateShift(true)} className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-5 flex flex-col items-center justify-center gap-2 hover:border-[#5C5CFF]/40 transition-colors">
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center"><Plus size={18} className="text-gray-400"/></div>
                          <span className="text-sm text-gray-500 font-medium">Create Shift</span>
                        </button>
                      </div>
                    ) : (
                      <div className="bg-white rounded-lg border border-gray-200 p-10 text-center">
                        <Clock size={28} className="text-gray-300 mx-auto mb-3"/>
                        <p className="text-sm font-medium text-gray-700 mb-1">No shifts configured</p>
                        <p className="text-xs text-gray-400 mb-4">Create your first shift to manage work schedules</p>
                        <Btn size="sm" onClick={()=>setShowCreateShift(true)}><Plus size={13}/>Create Shift</Btn>
                      </div>
                    )}
                    {/* Weekly schedule preview */}
                    {activeShifts.length > 0 && (
                      <div className="bg-white rounded-lg border border-gray-200 p-5">
                        <h4 className="text-sm font-semibold text-gray-800 mb-3">Weekly Coverage</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead><tr className="border-b border-gray-100">{["Shift","Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(h=><th key={h} className="px-3 py-2 text-left font-medium text-gray-500">{h}</th>)}</tr></thead>
                            <tbody className="divide-y divide-gray-50">
                              {activeShifts.map(s=>(
                                <tr key={s.name}>
                                  <td className="px-3 py-2.5 font-medium text-gray-700">{s.name}</td>
                                  {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d=>{
                                    const active = (s.days||"").includes(d.slice(0,3))||(s.days||"").includes("Any")||((s.days||"").includes("Mon–Fri")&&!["Sat","Sun"].includes(d));
                                    return <td key={d} className="px-3 py-2.5">{active?<div className="h-5 rounded text-[10px] flex items-center justify-center font-medium text-white" style={{backgroundColor:s.color,maxWidth:"60px"}}>{(s.time||"").split("–")[0]}</div>:<div className="h-5 rounded bg-gray-100"/>}</td>;
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )
              )}

              {/* Holidays */}
              {opsTab==="Holidays"&&(
                <div className="grid grid-cols-2 gap-5">
                  <div className="bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                      <h4 className="text-sm font-semibold text-gray-800">Holiday Calendar 2024</h4>
                      <div className="flex gap-2">
                        <Btn size="sm" variant="outline"><Download size={12}/>Export</Btn>
                        <Btn size="sm" onClick={()=>setShowCreateHoliday(true)}><Plus size={13}/>Add</Btn>
                      </div>
                    </div>
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50"><tr>{["Date","Holiday","Type","Branches","Actions"].map(h=><th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">{h}</th>)}</tr></thead>
                      <tbody className="divide-y divide-gray-100">
                        {activeHolidays.length === 0 ? (
                          <tr><td colSpan={5} className="px-4 py-8 text-center text-xs text-gray-400">No holidays configured yet</td></tr>
                        ) : activeHolidays.map((h,i)=>(
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-4 py-2.5 text-xs font-mono text-gray-600">{h.date}</td>
                            <td className="px-4 py-2.5 text-sm font-medium text-gray-800">{h.name}</td>
                            <td className="px-4 py-2.5"><span className={cn("text-xs px-2 py-0.5 rounded",h.type==="National"?"bg-blue-50 text-blue-700":"bg-gray-100 text-gray-600")}>{h.type}</span></td>
                            <td className="px-4 py-2.5 text-xs text-gray-500">{h.branches}</td>
                            <td className="px-4 py-2.5"><div className="flex gap-1"><button className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"><Edit size={12}/></button><button className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"><Trash2 size={12}/></button></div></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-semibold text-gray-800">July 2024</h4>
                      <div className="flex gap-1"><button className="p-1.5 hover:bg-gray-100 rounded"><ChevronLeft size={14}/></button><button className="p-1.5 hover:bg-gray-100 rounded"><ChevronRight size={14}/></button></div>
                    </div>
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d=><div key={d} className="text-center text-[10px] font-medium text-gray-400 py-1">{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {[""," "," "," "," "," ","1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","16","17","18","19","20","21","22","23","24","25","26","27","28","29","30","31"].map((d,i)=>(
                        <div key={i} className={cn("h-8 flex items-center justify-center text-xs rounded-lg cursor-pointer",d==="4"?"bg-[#5C5CFF] text-white font-semibold":d&&d.trim()?"hover:bg-gray-100 text-gray-700":"","")}>
                          {d&&d.trim()?d:""}
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 space-y-1.5">
                      <p className="text-xs font-medium text-gray-700 mb-2">This Month</p>
                      <div className="flex items-center gap-2 px-3 py-2 bg-[#EEF2FF] rounded-lg">
                        <div className="w-2 h-2 rounded-full bg-[#5C5CFF]"/>
                        <span className="text-xs text-gray-700">Jul 4 – Independence Day</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Branches */}
              {opsTab==="Branches"&&(
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    {activeBranches.map(b=>(
                      <div key={b.name} className="bg-white rounded-lg border border-gray-200 p-5 hover:border-[#5C5CFF]/40 hover:shadow-sm transition-all cursor-pointer group">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center"><Building2 size={18} className="text-blue-500"/></div>
                            <div>
                              <p className="text-sm font-semibold text-gray-800">{b.name}</p>
                              <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{b.type}</span>
                            </div>
                          </div>
                          <button className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600"><MoreHorizontal size={14}/></button>
                        </div>
                        <div className="space-y-1.5 text-xs text-gray-500">
                          <div className="flex items-center gap-2"><MapPin size={12} className="text-gray-400"/>{b.addr}</div>
                          <div className="flex items-center gap-2"><Phone size={12} className="text-gray-400"/>{b.phone}</div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                          <span className="text-xs text-gray-500">{b.emp} employees</span>
                          <div className="flex items-center gap-2">
                            <button className="text-xs text-[#5C5CFF] font-medium hover:underline">View →</button>
                            <button className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"><Edit size={12}/></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Locations */}
              {opsTab==="Locations"&&(
                <div className="space-y-3 max-w-2xl">
                  {activeBranches.map(l=>(
                    <div key={l.name} className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0"><MapPin size={18} className="text-blue-500"/></div>
                      <div className="flex-1"><p className="text-sm font-semibold text-gray-800">{l.name}</p><p className="text-xs text-gray-500">{l.addr}</p></div>
                      <div className="text-right flex-shrink-0"><div className="text-sm font-semibold text-gray-800">{l.emp}</div><div className="text-xs text-gray-400">employees</div></div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"><Edit size={13}/></button>
                        <button className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"><Trash2 size={13}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Geo Fence */}
              {opsTab==="Geo Fence"&&(
                <div className="max-w-2xl space-y-4">
                  <div className="bg-white rounded-lg border border-gray-200 p-5">
                    <div className="flex items-center justify-between mb-4"><h4 className="text-sm font-semibold text-gray-800">Geo Fence Rules</h4><Btn size="sm"><Plus size={13}/>Add Rule</Btn></div>
                    {activeBranches.map(b=>(
                      <div key={b.name} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center"><MapPin size={14} className="text-green-500"/></div>
                          <div><p className="text-sm font-medium text-gray-800">{b.name}</p><p className="text-xs text-gray-400">Radius: 200m · Enabled</p></div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-4 rounded-full bg-green-400 flex items-center px-0.5 cursor-pointer"><div className="w-3 h-3 rounded-full bg-white ml-auto"/></div>
                          <button className="text-gray-400 hover:text-gray-600"><Edit size={13}/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 flex items-start gap-3">
                    <AlertTriangle size={15} className="text-amber-500 flex-shrink-0 mt-0.5"/>
                    <div><p className="text-xs font-medium text-amber-800">3 Geo Fence violations this week</p><p className="text-xs text-amber-600 mt-0.5">Mei Lin Chen, James O'Brien, and 1 other were outside office radius during check-in</p><button className="text-xs text-amber-700 font-medium mt-1 hover:underline">Review violations →</button></div>
                  </div>
                </div>
              )}

              {/* Approval Flow */}
              {opsTab==="Approval Flow"&&(
                <div className="max-w-2xl space-y-4">
                  {[
                    {type:"Leave Request",desc:"Multi-level leave approval",levels:["Direct Manager","HR Manager"],auto:"3 days",color:"#5C5CFF"},
                    {type:"Attendance Correction",desc:"Regularize attendance records",levels:["Direct Manager"],auto:"2 days",color:"#22C55E"},
                    {type:"Work From Home",desc:"WFH request approval",levels:["Direct Manager"],auto:"1 day",color:"#F59E0B"},
                    {type:"Department Change",desc:"Employee transfer approval",levels:["Current Manager","HR Admin","Target Manager"],auto:"5 days",color:"#8B5CF6"},
                    {type:"Shift Change",desc:"Shift modification requests",levels:["HR Admin"],auto:"2 days",color:"#EF4444"},
                  ].map(w=>(
                    <div key={w.type} className="bg-white rounded-lg border border-gray-200 p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div><h4 className="text-sm font-semibold text-gray-800">{w.type}</h4><p className="text-xs text-gray-500 mt-0.5">{w.desc}</p></div>
                        <Btn variant="outline" size="sm"><Edit size={12}/>Edit</Btn>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap mb-3">
                        {w.levels.map((l,i)=>(
                          <div key={i} className="flex items-center gap-2">
                            {i>0&&<ArrowRight size={13} className="text-gray-300"/>}
                            <span className="px-2.5 py-1 rounded-lg text-xs font-medium text-white" style={{backgroundColor:w.color}}>L{i+1}: {l}</span>
                          </div>
                        ))}
                        <button className="flex items-center gap-1 px-2.5 py-1 border border-dashed border-gray-300 rounded-lg text-xs text-gray-400 hover:border-[#5C5CFF]/40 hover:text-[#5C5CFF]"><Plus size={11}/>Add Level</button>
                      </div>
                      <p className="text-xs text-gray-400">Auto-escalate after {w.auto} of inactivity</p>
                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>
        )}

        {/* ════════════════ POLICIES ════════════════ */}
        {tab==="Policies"&&(
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="bg-white border-b border-gray-200 px-6 py-2 flex items-center gap-1 flex-shrink-0">
              {["Attendance Policy","Leave Policy","Documents","Policy Assignments"].map(t=>(
                <button key={t} onClick={()=>setPolTab(t)} className={cn("px-3 py-2 text-xs font-medium rounded-lg transition-colors",polTab===t?"bg-[#EEF2FF] text-[#5C5CFF]":"text-gray-600 hover:bg-gray-100")}>{t}</button>
              ))}
              <div className="ml-auto">
                <Btn size="sm" onClick={()=>setShowCreatePolicy(true)}><Plus size={13}/>New Policy</Btn>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-6">

              {polTab==="Attendance Policy"&&(
                <div className="max-w-3xl space-y-5">
                  <div className="bg-white rounded-lg border border-gray-200 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div><h4 className="text-sm font-semibold text-gray-800">Standard Attendance Policy</h4><p className="text-xs text-gray-500 mt-0.5">Applies to all full-time employees · Last updated Jun 1, 2024</p></div>
                      <div className="flex gap-2"><Btn variant="outline" size="sm"><Edit size={12}/>Edit</Btn><span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded font-medium">Active</span></div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {[["Grace Period","15 minutes"],["Half-Day Threshold","4 hours"],["Minimum Work Hours","9 hours/day"],["Late Mark After","09:15 AM"],["Biometric Required","Yes"],["WFH Allowed","Yes, with approval"],["Overtime Tracking","Yes"],["Weekend Work","With approval"],["Remote Check-in","Yes"]].map(([k,v])=>(
                        <div key={k as string} className="bg-gray-50 rounded-lg p-3"><p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">{k}</p><p className="text-sm font-medium text-gray-800">{v}</p></div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-5">
                    <h4 className="text-xs font-semibold text-gray-700 mb-3">Version History</h4>
                    <div className="space-y-2">
                      {[["v3.0","Jun 1, 2024","Added WFH approval workflow","Current"],["v2.1","Jan 1, 2024","Grace period increased from 10 to 15 min","Archive"],["v2.0","Jul 1, 2023","Added biometric requirement","Archive"]].map(([v,d,c,s])=>(
                        <div key={v as string} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50">
                          <span className="text-xs font-mono font-semibold text-gray-600 w-8">{v}</span>
                          <div className="flex-1"><span className="text-xs text-gray-700">{c}</span></div>
                          <span className="text-xs text-gray-400">{d}</span>
                          <span className={cn("text-[10px] px-2 py-0.5 rounded",s==="Current"?"bg-green-50 text-green-600":"bg-gray-100 text-gray-400")}>{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {polTab==="Leave Policy"&&(
                <div className="max-w-3xl space-y-4">
                  {[
                    {name:"Standard Policy",applicable:"Full-Time",annual:18,sick:10,casual:6,unpaid:true,maternity:"26 weeks",paternity:"2 weeks"},
                    {name:"Executive Policy",applicable:"Senior Management",annual:24,sick:12,casual:8,unpaid:true,maternity:"26 weeks",paternity:"4 weeks"},
                    {name:"Contractor Policy",applicable:"Contractors",annual:12,sick:8,casual:4,unpaid:false,maternity:"12 weeks",paternity:"1 week"},
                  ].map(p=>(
                    <div key={p.name} className="bg-white rounded-lg border border-gray-200 p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div><h4 className="text-sm font-semibold text-gray-800">{p.name}</h4><p className="text-xs text-gray-500 mt-0.5">Applies to: {p.applicable}</p></div>
                        <div className="flex gap-2"><Btn variant="ghost" size="sm"><Edit size={12}/></Btn><Btn variant="ghost" size="sm"><MoreHorizontal size={12}/></Btn></div>
                      </div>
                      <div className="grid grid-cols-4 gap-3">
                        {[["Annual",`${p.annual} days`],["Sick",`${p.sick} days`],["Casual",`${p.casual} days`],["Unpaid",p.unpaid?"Allowed":"Not allowed"]].map(([k,v])=>(
                          <div key={k as string} className="bg-gray-50 rounded-lg p-3 text-center"><p className="text-xs text-gray-500 mb-1">{k}</p><p className="text-sm font-semibold text-gray-800">{v}</p></div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {polTab==="Documents"&&(
                <div className="max-w-2xl space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-600">{DOCUMENTS_LIST.length} policy documents</p>
                    <Btn size="sm"><Upload size={13}/>Upload</Btn>
                  </div>
                  {DOCUMENTS_LIST.map(d=>(
                    <div key={d.id} className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-3 hover:border-[#5C5CFF]/30 cursor-pointer">
                      <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0"><FileText size={16} className="text-red-500"/></div>
                      <div className="flex-1"><p className="text-sm font-medium text-gray-800">{d.name}</p><p className="text-xs text-gray-400">{d.category} · {d.size} · Updated {d.updated} by {d.updatedBy}</p></div>
                      <StatusBadge status={d.status}/>
                      <div className="flex gap-1"><button className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"><Eye size={13}/></button><button className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"><Download size={13}/></button><button className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"><MoreHorizontal size={13}/></button></div>
                    </div>
                  ))}
                </div>
              )}

              {polTab==="Policy Assignments"&&(
                <div className="max-w-3xl">
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-gray-800">Policy Assignments</h4>
                      <Btn size="sm" variant="outline"><Edit size={12}/>Bulk Assign</Btn>
                    </div>
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50"><tr>{["Employee","Department","Attendance Policy","Leave Policy","Effective Date"].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr></thead>
                      <tbody className="divide-y divide-gray-100">
                        {activeEmpList.slice(0,8).map(emp=>(
                          <tr key={emp.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3"><div className="flex items-center gap-2.5"><Avt initials={emp.initials} color={emp.color} size="sm"/><span className="text-sm font-medium text-gray-800">{emp.name}</span></div></td>
                            <td className="px-4 py-3 text-gray-600 text-xs">{emp.dept}</td>
                            <td className="px-4 py-3"><span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">Standard</span></td>
                            <td className="px-4 py-3"><span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded">{emp.empType==="Full-Time"?"Standard":"Contractor"}</span></td>
                            <td className="px-4 py-3 text-xs text-gray-500">{fmtDate(emp.joinDate)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* ════════════════ ACCESS CONTROL ════════════════ */}
        {tab==="Access Control"&&(
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="bg-white border-b border-gray-200 px-6 py-2 flex gap-1 flex-shrink-0">
              {["Roles","Permissions","Approval Workflow","Authentication","Audit Logs"].map(t=>(
                <button key={t} onClick={()=>setAcTab(t)} className={cn("px-3 py-2 text-xs font-medium rounded-lg transition-colors",acTab===t?"bg-[#EEF2FF] text-[#5C5CFF]":"text-gray-600 hover:bg-gray-100")}>{t}</button>
              ))}
            </div>
            <div className="flex-1 overflow-auto p-6">

              {acTab==="Roles"&&(
                <div className="max-w-2xl space-y-3">
                  {[
                    {role:"Super Admin",desc:"Full platform access – all modules, all data",users:1,color:"#EF4444",perms:["All modules","All data","System config"]},
                    {role:"HR Admin",desc:"Full HR operations – employees, attendance, leave",users:3,color:"#5C5CFF",perms:["Employees","Attendance","Leave","Organization","Reports"]},
                    {role:"Manager",desc:"Team management, approve leave and attendance",users:24,color:"#F59E0B",perms:["Team view","Approve leave","Approve attendance","View reports"]},
                    {role:"Employee",desc:"Self-service – own attendance, leave, documents",users:819,color:"#22C55E",perms:["My Space","Own leave","Own attendance","Own documents"]},
                  ].map(r=>(
                    <div key={r.role} className={cn("bg-white rounded-lg border p-4",activeRole===r.role?"border-[#5C5CFF] ring-1 ring-[#5C5CFF]/20":"border-gray-200")}>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{backgroundColor:r.color+"18"}}><Shield size={18} style={{color:r.color}}/></div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-gray-800">{r.role}</h4>
                          <p className="text-xs text-gray-500 mt-0.5">{r.desc}</p>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {r.perms.map(p=><span key={p} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{p}</span>)}
                          </div>
                        </div>
                        <div className="flex-shrink-0 text-right mr-2"><div className="text-sm font-semibold text-gray-800">{r.users}</div><div className="text-[10px] text-gray-400">users</div></div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Btn variant="outline" size="sm" onClick={()=>setActiveRole(r.role===activeRole?null:r.role)}><Eye size={12}/>{activeRole===r.role?"Hide":"Permissions"}</Btn>
                          <Btn variant="ghost" size="sm"><MoreHorizontal size={14}/></Btn>
                        </div>
                      </div>
                      {activeRole===r.role&&(
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <p className="text-xs font-semibold text-gray-600 mb-3">Permission Details</p>
                          <div className="grid grid-cols-4 gap-2">
                            {["My Space","Team","Organization","Attendance","Leave","Documents","Reports","Settings"].map(mod=>{
                              const hasAccess = r.role==="Super Admin"||r.role==="HR Admin"||(r.role==="Manager"&&["My Space","Team","Attendance","Leave","Reports"].includes(mod))||(r.role==="Employee"&&["My Space","Attendance","Leave","Documents"].includes(mod));
                              return (
                                <div key={mod} className={cn("flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs",hasAccess?"bg-green-50":"bg-gray-50")}>
                                  {hasAccess?<Check size={11} className="text-green-500 flex-shrink-0"/>:<X size={11} className="text-gray-300 flex-shrink-0"/>}
                                  <span className={hasAccess?"text-gray-700":"text-gray-400"}>{mod}</span>
                                </div>
                              );
                            })}
                          </div>
                          <div className="flex gap-2 mt-3">
                            <Btn size="sm" variant="outline"><UserPlus size={12}/>Assign Users</Btn>
                            <Btn size="sm" variant="outline"><Edit size={12}/>Edit Role</Btn>
                            <Btn size="sm" variant="ghost">Duplicate</Btn>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  <button onClick={()=>setShowAddRole(true)} className="w-full py-3 border-2 border-dashed border-gray-200 rounded-lg text-sm text-[#5C5CFF] hover:border-[#5C5CFF]/40 transition-colors flex items-center justify-center gap-2 font-medium"><Plus size={14}/>Create Custom Role</button>
                </div>
              )}

              {acTab==="Permissions"&&(
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden max-w-4xl">
                  <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-700">Permission Matrix</p>
                    <div className="flex gap-2"><Btn size="sm" variant="outline"><Download size={11}/>Export</Btn><Btn size="sm">Save Changes</Btn></div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 w-32">Module</th>
                          <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 w-16">Action</th>
                          <th className="px-3 py-3 text-center text-xs font-semibold text-red-600">Super Admin</th>
                          <th className="px-3 py-3 text-center text-xs font-semibold text-[#5C5CFF]">HR Admin</th>
                          <th className="px-3 py-3 text-center text-xs font-semibold text-amber-600">Manager</th>
                          <th className="px-3 py-3 text-center text-xs font-semibold text-green-600">Employee</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {[
                          ["Organization","View",true,true,false,false],
                          ["Organization","Edit",true,true,false,false],
                          ["Employees","View",true,true,true,false],
                          ["Employees","Create",true,true,false,false],
                          ["Employees","Edit",true,true,false,false],
                          ["Attendance","View",true,true,true,true],
                          ["Attendance","Approve",true,true,true,false],
                          ["Leave","View",true,true,true,true],
                          ["Leave","Approve",true,true,true,false],
                          ["Leave","Configure",true,true,false,false],
                          ["Reports","View",true,true,true,false],
                          ["Reports","Export",true,true,false,false],
                          ["Access Control","View",true,false,false,false],
                          ["Access Control","Configure",true,false,false,false],
                        ].map(([mod,action,sa,hr,mgr,emp],i)=>(
                          <tr key={i} className={cn("hover:bg-gray-50",i%2===0?"":"bg-gray-50/30")}>
                            <td className="px-4 py-2.5 text-xs font-medium text-gray-700">{i===0||[2,5,8,11,13].includes(i)?mod:""}</td>
                            <td className="px-3 py-2.5 text-xs text-gray-500">{action as string}</td>
                            {[sa,hr,mgr,emp].map((v,ci)=>(
                              <td key={ci} className="px-3 py-2.5 text-center">
                                <div className={cn("w-4 h-4 rounded border mx-auto flex items-center justify-center cursor-pointer transition-colors",v?"bg-[#5C5CFF] border-[#5C5CFF]":"border-gray-300 hover:border-[#5C5CFF]/50")}>
                                  {v&&<Check size={10} className="text-white"/>}
                                </div>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {acTab==="Approval Workflow"&&(
                <div className="max-w-2xl space-y-4">
                  {[
                    {type:"Leave Approval",desc:"Multi-level leave approval chain",levels:["Direct Manager","HR Manager"],auto:"3 days"},
                    {type:"Attendance Correction",desc:"Regularize attendance records",levels:["Direct Manager"],auto:"2 days"},
                    {type:"Work From Home",desc:"WFH request approval",levels:["Direct Manager"],auto:"1 day"},
                    {type:"Department Change",desc:"Employee transfer requests",levels:["Current Manager","HR Admin","Target Manager"],auto:"5 days"},
                    {type:"Task Approval",desc:"High priority task escalation",levels:["Manager"],auto:"3 days"},
                  ].map(w=>(
                    <div key={w.type} className="bg-white rounded-lg border border-gray-200 p-5">
                      <div className="flex items-center justify-between mb-3"><div><h4 className="text-sm font-semibold text-gray-800">{w.type}</h4><p className="text-xs text-gray-500 mt-0.5">{w.desc}</p></div><Btn variant="outline" size="sm"><Edit size={12}/>Edit</Btn></div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {w.levels.map((l,i)=>(<div key={i} className="flex items-center gap-2">{i>0&&<ArrowRight size={13} className="text-gray-300"/>}<span className="px-3 py-1.5 bg-[#EEF2FF] text-[#5C5CFF] rounded-lg text-xs font-medium">Level {i+1}: {l}</span></div>))}
                      </div>
                      <p className="text-xs text-gray-400 mt-3">Auto-escalate after {w.auto} · Notify via: Email, In-App</p>
                    </div>
                  ))}
                </div>
              )}

              {acTab==="Authentication"&&(
                <div className="max-w-lg space-y-4">
                  {[
                    {label:"Password Policy",icon:Lock,items:[["Minimum Length","8 characters"],["Complexity","Uppercase, number, symbol required"],["Expiry","90 days"],["History","Cannot reuse last 5 passwords"]]},
                    {label:"Two-Factor Authentication",icon:Shield,items:[["Status","Enabled for HR Admins"],["Method","Authenticator App / SMS"],["Enforcement","Required for Admin roles"],["Backup Codes","Enabled"]]},
                    {label:"Session Management",icon:Activity,items:[["Session Timeout","4 hours of inactivity"],["Max Concurrent Devices","2 devices"],["Remember Me","30 days"],["Force Logout On Pwd Change","Yes"]]},
                    {label:"Login History",icon:Clock,items:[["Last Login","Today, 09:15 AM – 192.168.1.12"],["Failed Attempts","0 in last 24hrs"],["Device","Chrome on macOS"],["Location","New York, USA"]]},
                  ].map(s=>(
                    <div key={s.label} className="bg-white rounded-lg border border-gray-200 p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center"><s.icon size={14} className="text-gray-500"/></div>
                          <h4 className="text-sm font-semibold text-gray-800">{s.label}</h4>
                        </div>
                        <Btn variant="outline" size="sm"><Edit size={12}/>Edit</Btn>
                      </div>
                      <div className="space-y-2">
                        {s.items.map(([k,v])=><div key={k as string} className="flex justify-between text-sm"><span className="text-gray-500 text-xs">{k}</span><span className="font-medium text-gray-800 text-xs">{v}</span></div>)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {acTab==="Audit Logs"&&(
                <div className="bg-white rounded-lg border border-gray-200 max-w-4xl">
                  <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                    <div className="relative flex-1 max-w-xs"><Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"/><input className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5C5CFF]" placeholder="Search audit logs…"/></div>
                    <div className="relative"><select className="pl-3 pr-7 py-1.5 text-xs border border-gray-300 rounded-md bg-white appearance-none focus:outline-none"><option>All Modules</option><option>Leave</option><option>Organization</option><option>Employees</option><option>Access Control</option></select><ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/></div>
                    <Btn variant="outline" size="sm"><Download size={12}/>Export</Btn>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50"><tr>{["User","Action","Module","Time","IP","Status"].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr></thead>
                    <tbody className="divide-y divide-gray-100">
                      {[
                        ["Alex Admin","Approved leave – Sarah Mitchell","Leave","Jul 1, 11:32 AM","192.168.1.12","Success"],
                        ["Aisha Thompson","Updated leave policy FY2025","Organization","Jun 30, 3:15 PM","192.168.1.8","Success"],
                        ["Alex Admin","Added employee: Yuki Tanaka","Employees","Jun 28, 9:45 AM","192.168.1.12","Success"],
                        ["David Chen","Modified shift: Night Shift","Operations","Jun 27, 4:30 PM","192.168.1.20","Success"],
                        ["Unknown","Failed login attempt","Auth","Jun 27, 2:14 AM","203.0.113.45","Failed"],
                        ["Alex Admin","Role assigned: Manager → Marcus Johnson","Access Control","Jun 26, 2:00 PM","192.168.1.12","Success"],
                        ["Aisha Thompson","Exported employee data (CSV)","Reports","Jun 25, 11:22 AM","192.168.1.8","Success"],
                      ].map(([user,action,mod,time,ip,status],i)=>(
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-4 py-3"><div className="flex items-center gap-2"><Avt initials={user.split(" ").map(n=>n[0]).join("")} color={EMP_COLORS[i%EMP_COLORS.length]} size="sm"/><span className="font-medium text-gray-800 text-sm">{user}</span></div></td>
                          <td className="px-4 py-3 text-gray-600 text-xs max-w-xs">{action}</td>
                          <td className="px-4 py-3"><span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{mod}</span></td>
                          <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{time}</td>
                          <td className="px-4 py-3 font-mono text-xs text-gray-400">{ip}</td>
                          <td className="px-4 py-3"><span className={cn("text-xs px-2 py-0.5 rounded font-medium",status==="Success"?"bg-green-50 text-green-700":"bg-red-50 text-red-600")}>{status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            </div>
          </div>
        )}

        {/* ════════════════ ANNOUNCEMENTS ════════════════ */}
        {tab==="Announcements"&&(
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
              <div className="flex gap-1">
                {["Published","Scheduled","Drafts","Archived"].map(t=>(
                  <button key={t} onClick={()=>setAnnTab(t)} className={cn("px-3 py-2 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5",annTab===t?"bg-[#EEF2FF] text-[#5C5CFF]":"text-gray-600 hover:bg-gray-100")}>
                    {t}
                    <span className={cn("px-1.5 py-0.5 rounded-full text-[10px] font-semibold",annTab===t?"bg-[#5C5CFF] text-white":"bg-gray-200 text-gray-600")}>
                      {activeAnnouncements.filter(a=>t==="Published"?a.status==="Published":t==="Scheduled"?a.status==="Scheduled":t==="Drafts"?a.status==="Draft":a.status==="Archived").length}
                    </span>
                  </button>
                ))}
              </div>
              <Btn size="sm" onClick={()=>setShowCreateAnn(true)}><Plus size={13}/>New Announcement</Btn>
            </div>
            <div className="flex-1 overflow-auto p-6">
              {filteredAnn.length===0?(
                <div className="bg-white rounded-lg border border-gray-200 p-10 text-center">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3"><Megaphone size={20} className="text-gray-400"/></div>
                  <p className="text-sm font-medium text-gray-700 mb-1">No {annTab.toLowerCase()} announcements</p>
                  <p className="text-xs text-gray-400 mb-4">Create your first announcement to notify your organization</p>
                  <Btn size="sm" onClick={()=>setShowCreateAnn(true)}><Plus size={13}/>Create Announcement</Btn>
                </div>
              ):(
                <div className="space-y-3">
                  {filteredAnn.map(ann=>(
                    <div key={ann.id} className="bg-white rounded-lg border border-gray-200 p-5 hover:border-[#5C5CFF]/30 hover:shadow-sm transition-all cursor-pointer group">
                      <div className="flex items-start gap-4">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",ann.urgent?"bg-red-50":"bg-[#EEF2FF]")}>
                          <Megaphone size={16} className={ann.urgent?"text-red-500":"text-[#5C5CFF]"}/>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                {ann.urgent&&<span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-semibold">URGENT</span>}
                                <h4 className="text-sm font-semibold text-gray-800 group-hover:text-[#5C5CFF] transition-colors">{ann.title}</h4>
                              </div>
                              <p className="text-xs text-gray-500 mb-2">{ann.body}</p>
                              <div className="flex items-center gap-3 text-[10px] text-gray-400">
                                <span className="flex items-center gap-1"><Users size={10}/>{ann.audience}</span>
                                <span>·</span>
                                <span className="flex items-center gap-1"><User size={10}/>{ann.author}</span>
                                <span>·</span>
                                <span>{ann.date}</span>
                                {ann.views>0&&<><span>·</span><span className="flex items-center gap-1"><Eye size={10}/>{ann.views} views</span></>}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <StatusBadge status={ann.status}/>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"><Edit size={12}/></button>
                                <button className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"><MoreHorizontal size={12}/></button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════════════ REPORTS ════════════════ */}
        {tab==="Reports"&&(
          <div className="flex-1 overflow-auto p-6">
            {activeReport?(
              <div>
                <button onClick={()=>setActiveReport(null)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#5C5CFF] mb-4"><ChevronLeft size={14}/>Back to Reports</button>
                {REPORTS.filter(r=>r.label===activeReport).map(r=>(
                  <div key={r.label} className="space-y-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{backgroundColor:r.color+"18"}}><r.icon size={20} style={{color:r.color}}/></div>
                      <div><h3 className="text-base font-semibold text-gray-900">{r.label}</h3><p className="text-sm text-gray-500">{r.desc}</p></div>
                      <div className="ml-auto flex gap-2"><Btn size="sm" variant="outline"><Download size={12}/>Export CSV</Btn><Btn size="sm" variant="outline">Print</Btn></div>
                    </div>
                    {r.data.length>0?(
                      <div className="bg-white rounded-lg border border-gray-200 p-5">
                        <ResponsiveContainer key={r.label} width="100%" height={250}>
                          {r.label==="Employee Report"?(
                            <RLineChart data={r.data}>
                              <CartesianGrid key="cg-rl" strokeDasharray="3 3" stroke="#F3F4F6"/>
                              <XAxis key="x-rl" dataKey="month" tick={{fontSize:11,fill:"#9CA3AF"}} axisLine={false} tickLine={false}/>
                              <YAxis key="y-rl" tick={{fontSize:11,fill:"#9CA3AF"}} axisLine={false} tickLine={false}/>
                              <Tooltip key="tip-rl" contentStyle={{fontSize:12,borderRadius:8}}/>
                              <Line key="headcount-r" type="monotone" dataKey="count" name="Headcount" stroke={r.color} strokeWidth={2} dot={{r:3}}/>
                            </RLineChart>
                          ):r.label==="Department Report"?(
                            <RBarChart data={r.data} layout="vertical">
                              <CartesianGrid key="cg-rb" strokeDasharray="3 3" stroke="#F3F4F6"/>
                              <XAxis key="x-rb" type="number" tick={{fontSize:11,fill:"#9CA3AF"}} axisLine={false} tickLine={false}/>
                              <YAxis key="y-rb" type="category" dataKey="name" tick={{fontSize:11,fill:"#6B7280"}} axisLine={false} tickLine={false} width={80}/>
                              <Tooltip key="tip-rb" contentStyle={{fontSize:12,borderRadius:8}}/>
                              <Bar key="value" dataKey="value" fill={r.color} radius={[0,4,4,0]}/>
                            </RBarChart>
                          ):(
                            <AreaChart data={r.data}>
                              <CartesianGrid key="cg-ac" strokeDasharray="3 3" stroke="#F3F4F6"/>
                              <XAxis key="x-ac" dataKey={r.label==="Leave Report"?"month":"day"} tick={{fontSize:11,fill:"#9CA3AF"}} axisLine={false} tickLine={false}/>
                              <YAxis key="y-ac" tick={{fontSize:11,fill:"#9CA3AF"}} axisLine={false} tickLine={false}/>
                              <Tooltip key="tip-ac" contentStyle={{fontSize:12,borderRadius:8}}/>
                              <Area key="area" type="monotone" dataKey={r.label==="Leave Report"?"annual":"present"} stroke={r.color} fill={r.color} fillOpacity={0.1} strokeWidth={2}/>
                            </AreaChart>
                          )}
                        </ResponsiveContainer>
                      </div>
                    ):(
                      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                        <r.icon size={28} className="text-gray-300 mx-auto mb-3"/>
                        <p className="text-sm text-gray-600 mb-1">{r.label}</p>
                        <p className="text-xs text-gray-400 mb-4">{r.desc}</p>
                        <Btn size="sm">Configure Report</Btn>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ):(
              <div className="space-y-5">
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#EEF2FF] flex items-center justify-center"><BarChart2 size={16} className="text-[#5C5CFF]"/></div>
                    <div><p className="text-xs text-gray-500">AI Summary</p><p className="text-sm font-semibold text-gray-800">Organization healthy</p></div>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center"><TrendingUp size={16} className="text-green-500"/></div>
                    <div><p className="text-xs text-gray-500">Attendance avg</p><p className="text-sm font-semibold text-gray-800">95.8%</p></div>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center"><ArrowUpRight size={16} className="text-amber-500"/></div>
                    <div><p className="text-xs text-gray-500">Growth YTD</p><p className="text-sm font-semibold text-gray-800">+6.1%</p></div>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center"><RefreshCw size={16} className="text-purple-500"/></div>
                    <div><p className="text-xs text-gray-500">Scheduled Reports</p><p className="text-sm font-semibold text-gray-800">4 active</p></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {REPORTS.map(r=>(
                    <button key={r.label} onClick={()=>setActiveReport(r.label)} className="bg-white rounded-lg border border-gray-200 p-5 text-left hover:border-[#5C5CFF]/40 hover:shadow-sm transition-all group">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{backgroundColor:r.color+"18"}}><r.icon size={18} style={{color:r.color}}/></div>
                      <h4 className="text-sm font-semibold text-gray-800 group-hover:text-[#5C5CFF] transition-colors mb-1">{r.label}</h4>
                      <p className="text-xs text-gray-500">{r.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ── Modals ── */}

      {showAddEmp&&(
        <AddEmployeeWizard onClose={()=>setShowAddEmp(false)} onDone={()=>setShowAddEmp(false)}/>
      )}

      {showImport&&(
        <Modal title="Import Employees" onClose={()=>setShowImport(false)}>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-[#5C5CFF]/40 transition-colors cursor-pointer">
              <Upload size={24} className="text-gray-300 mx-auto mb-2"/>
              <p className="text-sm font-medium text-gray-700 mb-1">Drop CSV file here or click to upload</p>
              <p className="text-xs text-gray-400">Supports CSV, XLSX · Max 5MB</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 flex items-start gap-2">
              <Info size={14} className="text-blue-500 flex-shrink-0 mt-0.5"/>
              <div><p className="text-xs font-medium text-blue-800">Template available</p><button className="text-xs text-blue-600 hover:underline mt-0.5">Download employee import template →</button></div>
            </div>
            <div className="flex justify-end gap-3"><Btn variant="outline" onClick={()=>setShowImport(false)}>Cancel</Btn><Btn>Import Employees</Btn></div>
          </div>
        </Modal>
      )}

      {showCreateDept&&(
        <Modal title="Create Department" onClose={()=>setShowCreateDept(false)}>
          <div className="space-y-4">
            <InputField label="Department Name" placeholder="e.g. Customer Success" required/>
            <SelectField label="Parent Department" options={["None (Top-level)","Engineering","Operations","Corporate"]}/>
            <SelectField label="Department Head" options={["Assign later",...activeEmpList.map(e=>e.name)]}/>
            <InputField label="Cost Center Code" placeholder="e.g. ENG-005"/>
            <div className="flex justify-end gap-3"><Btn variant="outline" onClick={()=>setShowCreateDept(false)}>Cancel</Btn><Btn onClick={()=>setShowCreateDept(false)}>Create Department</Btn></div>
          </div>
        </Modal>
      )}

      {showCreateShift&&(
        <Modal title="Create Shift" onClose={()=>setShowCreateShift(false)}>
          <div className="space-y-4">
            <InputField label="Shift Name" placeholder="e.g. Afternoon Shift" required/>
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Start Time" type="time" required/>
              <InputField label="End Time" type="time" required/>
            </div>
            <SelectField label="Repeat" options={["Mon–Fri","Mon–Sat","Mon–Sun","Custom"]}/>
            <SelectField label="Grace Period" options={["5 minutes","10 minutes","15 minutes","30 minutes"]}/>
            <div className="flex justify-end gap-3"><Btn variant="outline" onClick={()=>setShowCreateShift(false)}>Cancel</Btn><Btn onClick={()=>setShowCreateShift(false)}>Create Shift</Btn></div>
          </div>
        </Modal>
      )}

      {showCreateHoliday&&(
        <Modal title="Add Holiday" onClose={()=>setShowCreateHoliday(false)}>
          <div className="space-y-4">
            <InputField label="Holiday Name" placeholder="e.g. Company Foundation Day" required/>
            <InputField label="Date" type="date" required/>
            <SelectField label="Type" options={["National","Regional","Optional","Company"]}/>
            <SelectField label="Applies To" options={["All Branches","New York HQ","San Francisco","Chicago","Austin"]}/>
            <div className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" className="rounded accent-[#5C5CFF]"/><span>Recurring annually</span></div>
            <div className="flex justify-end gap-3"><Btn variant="outline" onClick={()=>setShowCreateHoliday(false)}>Cancel</Btn><Btn onClick={()=>setShowCreateHoliday(false)}>Add Holiday</Btn></div>
          </div>
        </Modal>
      )}

      {showCreateBranch&&(
        <Modal title="Add Branch" onClose={()=>setShowCreateBranch(false)}>
          <div className="space-y-4">
            <InputField label="Branch Name" placeholder="e.g. Seattle Office" required/>
            <InputField label="Street Address" placeholder="123 Main St" required/>
            <div className="grid grid-cols-2 gap-4">
              <InputField label="City" placeholder="Seattle"/>
              <InputField label="State / Province" placeholder="WA"/>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Country" placeholder="United States"/>
              <InputField label="Phone" type="tel" placeholder="+1 206 555 0100"/>
            </div>
            <SelectField label="Branch Type" options={["Headquarters","Regional Office","Satellite Office","Remote Hub"]}/>
            <div className="flex justify-end gap-3"><Btn variant="outline" onClick={()=>setShowCreateBranch(false)}>Cancel</Btn><Btn onClick={()=>setShowCreateBranch(false)}>Add Branch</Btn></div>
          </div>
        </Modal>
      )}

      {showCreatePolicy&&(
        <Modal title="Create Policy" onClose={()=>setShowCreatePolicy(false)}>
          <div className="space-y-4">
            <SelectField label="Policy Type" options={["Attendance Policy","Leave Policy","Work From Home Policy"]} required/>
            <InputField label="Policy Name" placeholder="e.g. Remote Worker Policy" required/>
            <InputField label="Description" placeholder="Describe who this policy applies to"/>
            <SelectField label="Applies To" options={["All Employees","Full-Time","Part-Time","Contract","Custom Group"]}/>
            <InputField label="Effective Date" type="date" required/>
            <div className="flex justify-end gap-3"><Btn variant="outline" onClick={()=>setShowCreatePolicy(false)}>Cancel</Btn><Btn onClick={()=>setShowCreatePolicy(false)}>Create Policy</Btn></div>
          </div>
        </Modal>
      )}

      {showAddRole&&(
        <Modal title="Create Role" onClose={()=>setShowAddRole(false)}>
          <div className="space-y-4">
            <InputField label="Role Name" placeholder="e.g. Finance Manager" required/>
            <InputField label="Description" placeholder="Describe what this role can do"/>
            <SelectField label="Base Permissions From" options={["Employee","Manager","HR Admin","Super Admin","Start from scratch"]}/>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <p className="text-xs font-medium text-gray-700 mb-2">Module Access</p>
              {["My Space","Team","Organization","Attendance","Leave","Documents","Reports"].map(mod=>(
                <div key={mod} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{mod}</span>
                  <div className="flex gap-2">
                    {["View","Edit","Delete"].map(p=>(
                      <label key={p} className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
                        <input type="checkbox" className="rounded accent-[#5C5CFF]"/>{p}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
              <Btn variant="outline" onClick={()=>setShowAddRole(false)}>Cancel</Btn>
              <Btn onClick={()=>setShowAddRole(false)}>Create Role</Btn>
            </div>
          </div>
        </Modal>
      )}

      {showCreateAnn&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={()=>setShowCreateAnn(false)}/>
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col" style={{maxHeight:"90vh"}}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
              <div><h2 className="text-base font-semibold text-gray-900">Create Announcement</h2><p className="text-xs text-gray-500">Step {annStep} of 3</p></div>
              <div className="flex gap-2">
                <button className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50">Save Draft</button>
                <button onClick={()=>setShowCreateAnn(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"><X size={18}/></button>
              </div>
            </div>
            <div className="px-6 py-3 border-b border-gray-100 bg-gray-50 flex-shrink-0">
              <div className="flex items-center gap-2">
                {["Details","Audience","Preview"].map((s,i)=>(
                  <div key={s} className="flex items-center gap-2">
                    {i>0&&<div className="w-8 h-0.5 bg-gray-200 rounded"/>}
                    <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",annStep===i+1?"bg-[#5C5CFF] text-white":annStep>i+1?"bg-green-100 text-green-700":"bg-gray-100 text-gray-500")}>
                      {annStep>i+1?<Check size={11}/>:<span>{i+1}</span>}{s}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-auto p-6">
              {annStep===1&&(
                <div className="space-y-4">
                  <InputField label="Announcement Title" placeholder="e.g. Q3 All-Hands Meeting" value={annTitle} onChange={setAnnTitle} required/>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">Message <span className="text-red-500">*</span></label>
                    <textarea value={annBody} onChange={e=>setAnnBody(e.target.value)} rows={5} placeholder="Write your announcement message…" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5C5CFF] focus:border-transparent resize-none"/>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <SelectField label="Priority" options={["Normal","Urgent","Critical"]}/>
                    <SelectField label="Publish" options={["Immediately","Schedule for later"]}/>
                  </div>
                  <div><label className="text-sm font-medium text-gray-700 block mb-1.5">Attachments</label><button className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg text-xs text-gray-500 hover:border-[#5C5CFF]/40 hover:text-[#5C5CFF]"><Upload size={13}/>Attach files</button></div>
                </div>
              )}
              {annStep===2&&(
                <div className="space-y-4">
                  <p className="text-sm font-medium text-gray-700">Select Audience</p>
                  <div className="space-y-2">
                    {["All Employees","Full-Time Employees","Contract Employees","Engineering","Product","Design","Marketing","Sales","HR","Finance","New York HQ","San Francisco","Chicago","Austin"].map(a=>(
                      <label key={a} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer">
                        <input type="checkbox" checked={annAudience.includes(a)} onChange={e=>setAnnAudience(prev=>e.target.checked?[...prev,a]:prev.filter(x=>x!==a))} className="rounded accent-[#5C5CFF]"/>
                        <span className="text-sm text-gray-700">{a}</span>
                        <span className="ml-auto text-xs text-gray-400">{a==="All Employees"?String(activeEmpList.length):a.includes("Full")?String(activeEmpList.filter(e=>e.empType==="Full-Time").length):a.includes("Contract")?String(activeEmpList.filter(e=>e.empType!=="Full-Time").length):String(activeEmpList.filter(e=>e.dept===a||(e.branch||"").includes(a)).length)||"–"} people</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {annStep===3&&(
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] flex items-center justify-center"><Megaphone size={18} className="text-[#5C5CFF]"/></div>
                      <div><p className="text-sm font-semibold text-gray-800">{annTitle||"Untitled Announcement"}</p><p className="text-xs text-gray-400">{annAudience.join(", ")||"No audience"} · by Alex Admin</p></div>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{annBody||"No message yet"}</p>
                  </div>
                  <div className="bg-green-50 border border-green-100 rounded-lg p-3 flex items-center gap-2">
                    <CheckCircle size={14} className="text-green-500"/>
                    <p className="text-xs text-green-700">Ready to publish to <strong>{annAudience.length}</strong> audience group(s)</p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 flex-shrink-0">
              <Btn variant="outline" size="sm" onClick={annStep===1?()=>setShowCreateAnn(false):()=>setAnnStep(s=>s-1)}>{annStep===1?"Cancel":"Back"}</Btn>
              {annStep<3?<Btn size="sm" onClick={()=>setAnnStep(s=>s+1)}>Next <ArrowRight size={13}/></Btn>:<Btn size="sm" onClick={()=>{setShowCreateAnn(false);setAnnTab("Published");}}><Send size={13}/>Publish</Btn>}
            </div>
          </div>
        </div>
      )}

      {/* ── Add Employee Modal ── */}
      {showAddEmp && (
        <Modal title="Add Employee" onClose={() => setShowAddEmp(false)} width="max-w-4xl">
          <div className="p-2">
            <AddEmployeePage navigate={(p) => {
              setShowAddEmp(false);
              if (p !== "organization") navigate(p);
            }} />
          </div>
        </Modal>
      )}

      {/* ── Create Department Modal ── */}
      {showCreateDept && (
        <Modal title="Create New Department" onClose={() => setShowCreateDept(false)} width="max-w-lg">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <InputField 
                label="Department Name" 
                placeholder="e.g. Engineering" 
                value={newDeptName} 
                onChange={setNewDeptName} 
                required
              />
              <InputField 
                label="Department Code" 
                placeholder="e.g. ENG" 
                value={newDeptCode} 
                onChange={setNewDeptCode}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">Description</label>
              <textarea 
                rows={2} 
                value={newDeptDesc} 
                onChange={e => setNewDeptDesc(e.target.value)} 
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#5C5CFF]" 
                placeholder="Brief description of department responsibility…"
              />
            </div>
            <InputField 
              label="Department Head (optional)" 
              placeholder="Head name or email" 
              value={newDeptHead} 
              onChange={setNewDeptHead}
            />
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
              <Btn variant="outline" onClick={() => setShowCreateDept(false)}>Cancel</Btn>
              <Btn onClick={async () => {
                if (!newDeptName.trim()) {
                  alert("Please enter department name.");
                  return;
                }
                const userEmail = (auth.currentUser?.email || "").toLowerCase();
                let targetCompanyId = companyId && companyId !== "default" ? companyId : "";

                if (!targetCompanyId && userEmail) {
                  try {
                    const appSnap = await getDoc(doc(db, "approved_users", userEmail));
                    if (appSnap.exists()) {
                      targetCompanyId = appSnap.data().companyId || appSnap.data().orgId || "";
                    }
                  } catch (_) {}
                }

                if (!targetCompanyId) targetCompanyId = "default";
                const dId = `D_${Date.now()}`;
                const newDeptObj = {
                  id: dId,
                  name: newDeptName.trim(),
                  code: newDeptCode.trim() || newDeptName.trim().substring(0, 3).toUpperCase(),
                  desc: newDeptDesc.trim(),
                  head: newDeptHead.trim(),
                  parent: newDeptParent.trim(),
                  color: "#5C5CFF",
                  createdAt: new Date().toISOString()
                };

                try {
                  await setDoc(doc(db, "organizations", targetCompanyId, "departments", dId), newDeptObj, { merge: true });

                  const orgRef = doc(db, "organizations", targetCompanyId);
                  const orgSnap = await getDoc(orgRef);
                  const currentDepts = orgSnap.exists() ? orgSnap.data().departments || [] : [];
                  await setDoc(orgRef, { departments: [...currentDepts, newDeptObj] }, { merge: true });

                  setShowCreateDept(false);
                  setNewDeptName("");
                  setNewDeptCode("");
                  setNewDeptDesc("");
                  setNewDeptHead("");
                  setNewDeptParent("");
                  setActiveDept(newDeptObj.name);
                  opsToast(`Department "${newDeptObj.name}" created successfully.`);
                } catch (err) {
                  console.error("Error creating department:", err);
                  alert("Failed to save department to Firestore.");
                }
              }}>Create Department</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Org Profile Edit Modal ── */}
      {showEditOrg&&(
        <Modal title="Edit Organization Profile" onClose={()=>setShowEditOrg(false)} width="max-w-2xl">
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
              <div className="w-16 h-16 rounded-xl bg-[#EEF2FF] flex items-center justify-center border-2 border-[#5C5CFF]/20 flex-shrink-0"><Building2 size={28} className="text-[#5C5CFF]"/></div>
              <div>
                <p className="text-sm font-semibold text-gray-800 mb-1">Organization Logo</p>
                <div className="flex gap-2">
                  <Btn size="sm" variant="outline"><Upload size={12}/>Upload Logo</Btn>
                  <Btn size="sm" variant="ghost">Remove</Btn>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <InputField label="Organization Name" value={orgDraft.name} onChange={(e:any)=>setOrgDraft(p=>({...p,name:e.target.value}))} required/>
              <InputField label="Portal Name" value={orgDraft.portalName} onChange={(e:any)=>setOrgDraft(p=>({...p,portalName:e.target.value}))}/>
              <SelectField label="Business Type" value={orgDraft.bizType} onChange={(e:any)=>setOrgDraft(p=>({...p,bizType:e.target.value}))}>
                <option>Private Limited</option><option>Public Limited</option><option>Partnership</option><option>Sole Proprietorship</option><option>Non-Profit</option>
              </SelectField>
              <InputField label="Industry" value={orgDraft.industry} onChange={(e:any)=>setOrgDraft(p=>({...p,industry:e.target.value}))}/>
              <InputField label="Employee Count" value={orgDraft.employeeCount} onChange={(e:any)=>setOrgDraft(p=>({...p,employeeCount:e.target.value}))}/>
              <InputField label="Company Website" value={orgDraft.website} onChange={(e:any)=>setOrgDraft(p=>({...p,website:e.target.value}))}/>
              <div className="col-span-2"><InputField label="Primary Address" value={orgDraft.address} onChange={(e:any)=>setOrgDraft(p=>({...p,address:e.target.value}))}/></div>
              <InputField label="Contact Email" type="email" value={orgDraft.contactEmail} onChange={(e:any)=>setOrgDraft(p=>({...p,contactEmail:e.target.value}))}/>
              <InputField label="Contact Number" type="tel" value={orgDraft.contactPhone} onChange={(e:any)=>setOrgDraft(p=>({...p,contactPhone:e.target.value}))}/>
              <SelectField label="Time Zone" value={orgDraft.timezone} onChange={(e:any)=>setOrgDraft(p=>({...p,timezone:e.target.value}))}>
                <option>(UTC-8) Pacific Time</option><option>(UTC-7) Mountain Time</option><option>(UTC-6) Central Time</option><option>(UTC-5) Eastern Time</option><option>(UTC+0) GMT</option><option>(UTC+1) CET</option><option>(UTC+5:30) IST</option>
              </SelectField>
              <SelectField label="Language" value={orgDraft.language} onChange={(e:any)=>setOrgDraft(p=>({...p,language:e.target.value}))}>
                <option>English (US)</option><option>English (UK)</option><option>Spanish</option><option>French</option><option>German</option>
              </SelectField>
              <SelectField label="Week Start Day" value={orgDraft.weekStart} onChange={(e:any)=>setOrgDraft(p=>({...p,weekStart:e.target.value}))}>
                <option>Monday</option><option>Sunday</option><option>Saturday</option>
              </SelectField>
              <SelectField label="Date Format" value={orgDraft.dateFormat} onChange={(e:any)=>setOrgDraft(p=>({...p,dateFormat:e.target.value}))}>
                <option>MM/DD/YYYY</option><option>DD/MM/YYYY</option><option>YYYY-MM-DD</option>
              </SelectField>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
              <Btn variant="ghost" size="sm" onClick={()=>setOrgDraft(orgData)}>Reset</Btn>
              <div className="flex gap-2">
                <Btn variant="outline" onClick={()=>setShowEditOrg(false)}>Cancel</Btn>
                <Btn onClick={()=>{setOrgData(orgDraft);setShowEditOrg(false);setOrgSaved(true);setTimeout(()=>setOrgSaved(false),3000);}}>Save Changes</Btn>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Edit Department Modal ── */}
      {showEditDept&&(
        <Modal title={`Edit Department · ${activeDept}`} onClose={()=>setShowEditDept(false)} width="max-w-lg">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <InputField label="Department Name" value={deptEditDraft.name} onChange={(e:any)=>setDeptEditDraft(p=>({...p,name:e.target.value}))} required/>
              <InputField label="Code" value={deptEditDraft.code} onChange={(e:any)=>setDeptEditDraft(p=>({...p,code:e.target.value}))}/>
            </div>
            <div className="flex flex-col gap-1"><label className="text-xs font-semibold text-gray-600">Description</label><textarea rows={2} value={deptEditDraft.desc} onChange={e=>setDeptEditDraft(p=>({...p,desc:e.target.value}))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#5C5CFF]" placeholder="Describe this department…"/></div>
            <SelectField label="Parent Department" value={deptEditDraft.parent} onChange={(e:any)=>setDeptEditDraft(p=>({...p,parent:e.target.value}))}>
              <option>None (Root)</option><option>Operations</option><option>Corporate</option>
            </SelectField>
            <SelectField label="Department Head" value={deptEditDraft.head} onChange={(e:any)=>setDeptEditDraft(p=>({...p,head:e.target.value}))}>
              <option value="">— Select Head —</option>
              {activeEmpList.filter(e=>(e.dept||"").toLowerCase()===(activeDept||"").toLowerCase()).map(e=><option key={e.id}>{e.name}</option>)}
            </SelectField>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
              <Btn variant="outline" onClick={()=>setShowEditDept(false)}>Cancel</Btn>
              <Btn onClick={()=>{setShowEditDept(false);opsToast(`${activeDept} department updated.`);}}>Save Changes</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Change Department Head Modal ── */}
      {showChangeHead&&(
        <Modal title="Change Department Head" onClose={()=>setShowChangeHead(false)} width="max-w-md">
          <div className="space-y-3">
            <div className="relative"><Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"/><input type="text" placeholder="Search employees…" value={headSearch} onChange={e=>setHeadSearch(e.target.value)} className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5C5CFF]"/></div>
            <div className="space-y-1 max-h-60 overflow-auto">
              {activeEmpList.filter(e=>(e.name||"").toLowerCase().includes(headSearch.toLowerCase())).map(e=>(
                <button key={e.id} onClick={()=>{setShowChangeHead(false);opsToast(`${e.name} assigned as ${activeDept} Head.`);}} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#EEF2FF] transition-colors text-left">
                  <Avt initials={e.initials} color={e.color} size="sm"/>
                  <div className="flex-1"><p className="text-sm font-medium text-gray-800">{e.name}</p><p className="text-xs text-gray-400">{e.designation} · {e.dept}</p></div>
                  {e.dept===activeDept&&<span className="text-[10px] bg-[#EEF2FF] text-[#5C5CFF] px-2 py-0.5 rounded-full font-medium">Same dept</span>}
                </button>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {/* ── Assign Employees Modal ── */}
      {showAssignEmp&&(
        <Modal title="Assign Employees" onClose={()=>setShowAssignEmp(false)} width="max-w-md">
          <div className="space-y-3">
            <SelectField label="Assign To"><option>Current Shift</option>{SHIFTS.map(s=><option key={s.name}>{s.name} Shift</option>)}</SelectField>
            <div className="space-y-1 max-h-48 overflow-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
              {activeEmpList.slice(0,6).map(e=>(
                <label key={e.id} className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50">
                  <input type="checkbox" defaultChecked={e.shift==="General"} className="rounded border-gray-300 accent-[#5C5CFF]"/>
                  <Avt initials={e.initials} color={e.color} size="sm"/>
                  <div><p className="text-sm font-medium text-gray-800">{e.name}</p><p className="text-xs text-gray-400">{e.dept}</p></div>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
              <Btn variant="outline" onClick={()=>setShowAssignEmp(false)}>Cancel</Btn>
              <Btn onClick={()=>{setShowAssignEmp(false);opsToast("Employees assigned successfully.");}}>Assign</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Bulk Import Modal ── */}
      {showBulkImport&&(
        <Modal title="Bulk Import" onClose={()=>setShowBulkImport(false)} width="max-w-md">
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-[#5C5CFF]/40 transition-colors cursor-pointer">
              <Upload size={28} className="text-gray-300 mx-auto mb-3"/>
              <p className="text-sm font-medium text-gray-700">Drop your CSV or Excel file here</p>
              <p className="text-xs text-gray-400 mt-1">Supports .csv, .xlsx — max 10 MB</p>
              <Btn variant="outline" size="sm" className="mt-3">Browse Files</Btn>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex gap-2 text-xs text-blue-700">
              <Info size={13} className="flex-shrink-0 mt-0.5 text-blue-500"/>
              <span>Download the <button className="font-semibold underline">template file</button> to ensure correct column headers.</span>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
              <Btn variant="outline" onClick={()=>setShowBulkImport(false)}>Cancel</Btn>
              <Btn onClick={()=>{setShowBulkImport(false);opsToast("Import started — you will be notified on completion.");}}>Start Import</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Bulk Export Modal ── */}
      {showBulkExport&&(
        <Modal title="Export Data" onClose={()=>setShowBulkExport(false)} width="max-w-sm">
          <div className="space-y-3">
            <SelectField label="Export Format"><option>CSV (.csv)</option><option>Excel (.xlsx)</option><option>PDF (.pdf)</option></SelectField>
            <SelectField label="Data Range"><option>All Records</option><option>Current Month</option><option>Last 3 Months</option><option>Last Year</option></SelectField>
            <div className="flex flex-col gap-1.5">
              {["Include inactive employees","Include archived records","Include metadata columns"].map(opt=>(
                <label key={opt} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"><input type="checkbox" defaultChecked className="rounded border-gray-300 accent-[#5C5CFF]"/>{opt}</label>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
              <Btn variant="outline" onClick={()=>setShowBulkExport(false)}>Cancel</Btn>
              <Btn onClick={()=>{setShowBulkExport(false);opsToast("Export queued — download link will be emailed.");}}>Export</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Generate Report Modal ── */}
      {showGenReport&&(
        <Modal title="Generate Report" onClose={()=>setShowGenReport(false)} width="max-w-md">
          <div className="space-y-3">
            <SelectField label="Report Type"><option>Operations Summary</option><option>Shift Utilization</option><option>Branch Headcount</option><option>Approval Flow Audit</option></SelectField>
            <div className="grid grid-cols-2 gap-3">
              <InputField label="From" type="date"/>
              <InputField label="To" type="date"/>
            </div>
            <SelectField label="Format"><option>PDF</option><option>Excel</option><option>CSV</option></SelectField>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
              <Btn variant="outline" onClick={()=>setShowGenReport(false)}>Cancel</Btn>
              <Btn onClick={()=>{setShowGenReport(false);opsToast("Report generated — download ready.");}}>Generate</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Edit Shift Modal ── */}
      {showEditShift&&(
        <Modal title="Edit Shift" onClose={()=>setShowEditShift(false)} width="max-w-md">
          <div className="space-y-3">
            <InputField label="Shift Name" value={activeShift||""} required/>
            <div className="grid grid-cols-2 gap-3">
              <InputField label="Start Time" type="time" defaultValue="09:00"/>
              <InputField label="End Time" type="time" defaultValue="18:00"/>
            </div>
            <SelectField label="Working Days"><option>Mon–Fri</option><option>Mon–Sat</option><option>Mon–Sun</option><option>Custom</option></SelectField>
            <InputField label="Grace Period (minutes)" defaultValue="15"/>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
              <Btn variant="outline" onClick={()=>setShowEditShift(false)}>Cancel</Btn>
              <Btn onClick={()=>{setShowEditShift(false);opsToast("Shift updated successfully.");}}>Save Changes</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Edit Holiday Modal ── */}
      {showEditHoliday&&(
        <Modal title="Edit Holiday" onClose={()=>setShowEditHoliday(null)} width="max-w-sm">
          <div className="space-y-3">
            <InputField label="Holiday Name" value={showEditHoliday} onChange={(e:any)=>setShowEditHoliday(e.target.value)} required/>
            <InputField label="Date" type="date"/>
            <SelectField label="Type"><option>National</option><option>Optional</option><option>Regional</option></SelectField>
            <SelectField label="Applicable Branches"><option>All</option><option>New York HQ</option><option>San Francisco</option><option>Chicago</option><option>Austin</option></SelectField>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
              <Btn variant="outline" onClick={()=>setShowEditHoliday(null)}>Cancel</Btn>
              <Btn onClick={()=>{setShowEditHoliday(null);opsToast("Holiday updated.");}}>Save</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Edit Branch Modal ── */}
      {showEditBranch&&(
        <Modal title={`Edit Branch · ${showEditBranch}`} onClose={()=>setShowEditBranch(null)} width="max-w-md">
          <div className="space-y-3">
            <InputField label="Branch Name" value={showEditBranch} onChange={(e:any)=>setShowEditBranch(e.target.value)} required/>
            <InputField label="Address" placeholder="Street, City, State, ZIP"/>
            <div className="grid grid-cols-2 gap-3">
              <InputField label="Phone" type="tel"/>
              <SelectField label="Type"><option>Headquarters</option><option>Regional Office</option><option>Satellite Office</option></SelectField>
            </div>
            <InputField label="Manager"/>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
              <Btn variant="outline" onClick={()=>setShowEditBranch(null)}>Cancel</Btn>
              <Btn onClick={()=>{setShowEditBranch(null);opsToast("Branch updated.");}}>Save Changes</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Ops Success Toast ── */}
      {opsSuccess&&(
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-in slide-in-from-bottom-4">
          <CheckCircle size={15} className="text-green-400 flex-shrink-0"/>
          {opsSuccess}
        </div>
      )}

      {empActionModal&&(
        <Modal title={empActionModal==="edit"?"Edit Employee":empActionModal==="assign-dept"?"Assign Department":empActionModal==="assign-shift"?"Assign Shift":empActionModal==="assign-manager"?"Assign Manager":empActionModal==="reset-pw"?"Reset Password":empActionModal==="transfer"?"Transfer Employee":"Action"} onClose={()=>setEmpActionModal(null)}>
          <div className="space-y-4">
            {empActionModal==="assign-dept"&&<SelectField label="New Department" options={DEPT_DIST.map(d=>d.name)} required/>}
            {empActionModal==="assign-shift"&&<SelectField label="New Shift" options={SHIFTS.map(s=>s.name)} required/>}
            {empActionModal==="assign-manager"&&<SelectField label="New Manager" options={activeEmpList.map(e=>e.name)} required/>}
            {empActionModal==="reset-pw"&&<div className="bg-amber-50 border border-amber-100 rounded-lg p-3 flex items-start gap-2"><AlertTriangle size={14} className="text-amber-500 mt-0.5 flex-shrink-0"/><p className="text-sm text-amber-700">A password reset email will be sent to {activeEmp?.email}.</p></div>}
            {empActionModal==="transfer"&&(<><SelectField label="Transfer To Branch" options={activeBranches.map(b=>b.name)} required/><SelectField label="New Department" options={realDeptDist.map(d=>d.name)}/><InputField label="Transfer Date" type="date" required/></>)}
            {empActionModal==="edit"&&activeEmp&&(<><InputField label="Full Name" value={activeEmp.name}/><InputField label="Email" value={activeEmp.email}/><SelectField label="Employment Type" options={["Full-Time","Part-Time","Contract","Intern"]} value={activeEmp.empType}/></>)}
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
              <Btn variant="outline" onClick={()=>setEmpActionModal(null)}>Cancel</Btn>
              <Btn onClick={()=>setEmpActionModal(null)}>Confirm</Btn>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}
