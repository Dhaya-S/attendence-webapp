import React, { useState, useEffect } from "react";
import {
  Users, Settings, Shield, Zap, CheckCircle, FileText, Activity,
  ChevronLeft, ChevronRight, Search, Plus, Download, Upload, MoreHorizontal,
  Check, X, Edit, Trash2, Eye, Lock, UserPlus, UserX, RefreshCw,
  Mail, Bell, Globe, Building2, MapPin, GitBranch, Key, Database,
  Clock, CalendarDays, ArrowRight, AlertTriangle, Info, Send, Megaphone,
  Bot, ClipboardList, ToggleLeft, ToggleRight, Filter, ExternalLink,
  ChevronDown, Star, Award, User, Phone, Briefcase
} from "lucide-react";
import { cn, fmtDate, db, auth } from "@/shared/utils";
import { doc, setDoc, onSnapshot, getDoc, collection, deleteDoc } from "firebase/firestore";
import { useAuth, FeaturePermissions, DEFAULT_FEATURE_PERMISSIONS } from "@/shared/context/AuthContext";
import { Employee } from "@/shared/types";
import { EMPLOYEES } from "@/modules/organization/data/employees";
import { DEPT_DIST } from "@/modules/organization/data/analytics";
import { EMP_COLORS } from "@/shared/constants/colors";
import { Avt, StatusBadge, Btn, Modal, InputField, SelectField, TabBar } from "@/shared/components";

// ── Types ──────────────────────────────────────────────────────────────────────
type MASection = "Users"|"Organization Setup"|"User Access Control"|"Manage Services"|"Automation"|"Approvals"|"Audit Logs";
type OrgSetupNav = "Organization Details"|"Organization Policy"|"Organization Structure"|"Locations"|"Departments"|"Designations"|"Shifts"|"Domains & Branding"|"Email Authentication";
type ACNav = "General Roles"|"Custom Roles"|"Role Assignment"|"Permission Matrix"|"Administrators";
type AutomNav = "Approval Workflows"|"Attendance Automation"|"Leave Automation"|"Shift Automation"|"Notification Automation"|"Business Rules"|"Scheduled Jobs";
type ApprovalNav = "Attendance"|"Leave"|"Shift"|"Department"|"Employee"|"Delegation"|"Approval Matrix"|"History";

// ── Shared mini-components ─────────────────────────────────────────────────────
function SectionHeader({ title, subtitle, children }: { title:string; subtitle?:string; children?:React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div>
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {subtitle&&<p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {children&&<div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

function Toggle({ on, onChange }: { on:boolean; onChange:()=>void }) {
  return (
    <button onClick={onChange} className={cn("w-10 h-5 rounded-full transition-colors flex-shrink-0 relative",on?"bg-[#5C5CFF]":"bg-gray-300")}>
      <div className={cn("absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform",on?"left-5":"left-0.5")}/>
    </button>
  );
}

function TableHead({ cols }: { cols:string[] }) {
  return (
    <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
      <tr>{cols.map(c=><th key={c} className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{c}</th>)}</tr>
    </thead>
  );
}

// ── USERS SECTION ──────────────────────────────────────────────────────────────
function UsersSection() {
  const { companyId } = useAuth();
  const [userTab, setUserTab] = useState("Active");
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [selected, setSelected] = useState<string[]>([]);
  const [showInvite, setShowInvite] = useState(false);
  const [showResetPw, setShowResetPw] = useState<Employee|null>(null);
  const [showAssignRole, setShowAssignRole] = useState<Employee|null>(null);
  const [showEditUser, setShowEditUser] = useState<Employee|null>(null);
  const [activeUser, setActiveUser] = useState<Employee|null>(null);

  // Invitation state
  const [inviteEmails, setInviteEmails] = useState("");
  const [inviteRole, setInviteRole] = useState("Employee");
  const [inviteDept, setInviteDept] = useState("Engineering");
  const [sendingInvite, setSendingInvite] = useState(false);
  const [generatedCreds, setGeneratedCreds] = useState<{email: string; password: string}[]>([]);

  const handleSendInvitations = async () => {
    if (!inviteEmails.trim() || !companyId) return;
    setSendingInvite(true);
    setGeneratedCreds([]);
    try {
      const emailsList = inviteEmails.split(/[\n,]/).map(e => e.trim().toLowerCase()).filter(Boolean);
      const rMap: Record<string, string> = {
        "Super Admin": "admin",
        "HR Admin": "hr_admin",
        "Manager": "manager",
        "Employee": "employee",
      };
      const roleKey = rMap[inviteRole] || "employee";

      const newCreds: {email: string, password: string}[] = [];

      for (const email of emailsList) {
        const tempPassword = Math.random().toString(36).slice(-8);
        newCreds.push({ email, password: tempPassword });

        await setDoc(doc(db, "approved_users", email), {
          email: email,
          role: roleKey,
          companyId: companyId,
          orgId: companyId,
          status: "approved",
          createdAt: new Date().toISOString(),
          tempPassword: tempPassword
        }, { merge: true });

        await setDoc(doc(db, "organizations", companyId, "users", email), {
          email: email,
          name: email.split("@")[0],
          role: roleKey,
          dept: inviteDept,
          status: "approved",
          createdAt: new Date().toISOString()
        }, { merge: true });
      }
      setGeneratedCreds(newCreds);
      setInviteEmails("");
    } catch (err) {
      console.error("Error creating user records in Firestore:", err);
    } finally {
      setSendingInvite(false);
    }
  };

  const [realtimeEmps, setRealtimeEmps] = useState<any[]>([]);

  useEffect(() => {
    if (!companyId || companyId === "default") return;
    const unsub = onSnapshot(collection(db, "organizations", companyId, "users"), (snap) => {
      setRealtimeEmps(snap.docs.map(d => {
        const u = d.data();
        const email = u.email || "";
        const id = d.id;
        const name = u.name || `${u.firstName || ""} ${u.lastName || ""}`.trim() || email.split("@")[0] || id;
        return {
          id: id,
          name: name,
          email: email,
          role: u.role || "Employee",
          dept: u.dept || "Unassigned",
          status: (u.status === "approved" || !u.status) ? "Active" : u.status,
          initials: name.substring(0, 2).toUpperCase(),
          color: EMP_COLORS[id.length % EMP_COLORS.length] || EMP_COLORS[0],
          ...u
        };
      }));
    });
    return () => unsub();
  }, [companyId]);

  const allUsers = realtimeEmps;
  const pendingUsers = allUsers.filter(e => e.status?.toLowerCase() === "pending" || e.status?.toLowerCase() === "invited");
  const nonPendingUsers = allUsers.filter(e => e.status?.toLowerCase() !== "pending" && e.status?.toLowerCase() !== "invited");

  const depts = ["All", ...Array.from(new Set(allUsers.map(e => e.dept))).sort()];
  
  const filtered = nonPendingUsers.filter(e=>{
    const matchStatus = userTab==="Active"? (e.status==="Active" || e.status==="approved") : userTab==="Inactive"?e.status==="Inactive":userTab==="On Leave"?e.status==="On Leave":true;
    const matchSearch = !search||e.name.toLowerCase().includes(search.toLowerCase())||e.email.toLowerCase().includes(search.toLowerCase())||e.id.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter==="All"||e.dept===deptFilter;
    return matchStatus&&matchSearch&&matchDept;
  });

  const PENDING = pendingUsers.map(p => ({
    email: p.email,
    role: p.role,
    dept: p.dept,
    invited: p.createdAt ? fmtDate(p.createdAt) : "Recently",
    by: "Admin"
  }));

  return (
    <div className="flex h-full overflow-hidden">
      {/* User list */}
      <div className={cn("flex flex-col overflow-hidden",activeUser?"w-[560px] flex-shrink-0 border-r border-gray-200":"flex-1")}>
        {/* Toolbar */}
        <div className="bg-white border-b border-gray-200 px-5 py-3 flex-shrink-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="relative flex-1 max-w-xs">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search users…" className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5C5CFF] bg-white"/>
            </div>
            <div className="relative">
              <select value={deptFilter} onChange={e=>setDeptFilter(e.target.value)} className="pl-2 pr-7 py-1.5 text-xs border border-gray-300 rounded-lg bg-white appearance-none focus:outline-none">
                {depts.map(d=><option key={d}>{d}</option>)}
              </select>
              <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
            </div>
            <div className="ml-auto flex gap-2">
              <Btn size="sm" variant="outline"><Upload size={12}/>Import</Btn>
              <Btn size="sm" variant="outline"><Download size={12}/>Export</Btn>
              <Btn size="sm" onClick={()=>setShowInvite(true)}><UserPlus size={12}/>Invite Users</Btn>
            </div>
          </div>
          <div className="flex gap-1">
            {["Active","Inactive","On Leave","Pending Invitations"].map(t=>(
              <button key={t} onClick={()=>setUserTab(t)} className={cn("px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",userTab===t?"bg-[#EEF2FF] text-[#5C5CFF]":"text-gray-500 hover:bg-gray-100")}>
                {t}
                <span className={cn("ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold",userTab===t?"bg-[#5C5CFF] text-white":"bg-gray-200 text-gray-500")}>
                  {t==="Active"?nonPendingUsers.filter(e=>e.status==="Active"||e.status==="approved").length:t==="Inactive"?nonPendingUsers.filter(e=>e.status==="Inactive").length:t==="On Leave"?nonPendingUsers.filter(e=>e.status==="On Leave").length:PENDING.length}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Bulk bar */}
        {selected.length>0&&(
          <div className="bg-[#EEF2FF] border-b border-[#5C5CFF]/20 px-5 py-2 flex items-center gap-2 flex-shrink-0">
            <span className="text-xs font-medium text-[#5C5CFF]">{selected.length} selected</span>
            <Btn size="sm" variant="outline">Assign Role</Btn>
            <Btn size="sm" variant="outline"><RefreshCw size={11}/>Reset Password</Btn>
            <Btn size="sm" variant="danger"><UserX size={11}/>Deactivate</Btn>
            <button className="ml-auto text-gray-400 hover:text-gray-600" onClick={()=>setSelected([])}><X size={14}/></button>
          </div>
        )}

        {/* Table */}
        {userTab!=="Pending Invitations"?(
          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm">
              <TableHead cols={["","Employee","Department","Role","Status","Actions"]}/>
              <tbody className="bg-white divide-y divide-gray-100">
                {filtered.map(emp=>(
                  <tr key={emp.id} className={cn("hover:bg-gray-50 group",activeUser?.id===emp.id&&"bg-[#EEF2FF]")}>
                    <td className="px-4 py-3 w-8">
                      <input type="checkbox" checked={selected.includes(emp.id)} onChange={e=>setSelected(prev=>e.target.checked?[...prev,emp.id]:prev.filter(x=>x!==emp.id))} className="rounded border-gray-300 accent-[#5C5CFF]"/>
                    </td>
                    <td className="px-4 py-3">
                      <button className="flex items-center gap-2.5 text-left" onClick={()=>setActiveUser(activeUser?.id===emp.id?null:emp)}>
                        <Avt initials={emp.initials} color={emp.color} size="sm"/>
                        <div>
                          <p className="text-sm font-medium text-gray-800 group-hover:text-[#5C5CFF] transition-colors">{emp.name}</p>
                          <p className="text-[10px] text-gray-400">{emp.email}</p>
                        </div>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{emp.dept}</td>
                    <td className="px-4 py-3"><span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{emp.role}</span></td>
                    <td className="px-4 py-3"><StatusBadge status={emp.status}/></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={()=>setShowEditUser(emp)} className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600" title="Edit"><Edit size={13}/></button>
                        <button onClick={()=>setShowAssignRole(emp)} className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600" title="Assign Role"><Key size={13}/></button>
                        <button onClick={()=>setShowResetPw(emp)} className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600" title="Reset Password"><Lock size={13}/></button>
                        <button className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-red-500" title="Deactivate"><UserX size={13}/></button>
                        <button className="p-1.5 hover:bg-gray-100 rounded text-gray-400"><MoreHorizontal size={13}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ):(
          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm">
              <TableHead cols={["Email","Role","Department","Invited","Invited By","Actions"]}/>
              <tbody className="bg-white divide-y divide-gray-100">
                {PENDING.map((p,i)=>(
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center"><Mail size={12} className="text-gray-400"/></div><span className="text-sm text-gray-700">{p.email}</span></div></td>
                    <td className="px-4 py-3"><span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{p.role}</span></td>
                    <td className="px-4 py-3 text-xs text-gray-600">{p.dept}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{p.invited}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{p.by}</td>
                    <td className="px-4 py-3 flex items-center gap-2">
                      <button className="text-xs text-[#5C5CFF] hover:underline">Resend</button>
                      <button className="text-xs text-red-500 hover:underline">Revoke</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="border-t border-gray-200 px-5 py-2.5 flex items-center justify-between flex-shrink-0 bg-white">
          <span className="text-xs text-gray-400">{filtered.length} users</span>
          <div className="flex items-center gap-1">
            <button className="px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded">Previous</button>
            {[1,2,3].map(p=><button key={p} className={cn("w-7 h-7 text-xs rounded",p===1?"bg-[#5C5CFF] text-white":"text-gray-500 hover:bg-gray-100")}>{p}</button>)}
            <button className="px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded">Next</button>
          </div>
        </div>
      </div>

      {/* User detail panel */}
      {activeUser&&(
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <Avt initials={activeUser.initials} color={activeUser.color} size="md"/>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">{activeUser.name}</h3>
                <p className="text-xs text-gray-400">{activeUser.email}</p>
              </div>
            </div>
            <button onClick={()=>setActiveUser(null)} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400"><X size={16}/></button>
          </div>
          <div className="flex-1 overflow-auto p-5 space-y-5">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-gray-50 p-2.5 rounded-lg"><span className="text-gray-400 block text-[10px]">DEPARTMENT</span><span className="font-medium text-gray-800">{activeUser.dept}</span></div>
              <div className="bg-gray-50 p-2.5 rounded-lg"><span className="text-gray-400 block text-[10px]">ROLE</span><span className="font-medium text-gray-800">Employee</span></div>
              <div className="bg-gray-50 p-2.5 rounded-lg"><span className="text-gray-400 block text-[10px]">LOCATION</span><span className="font-medium text-gray-800">{activeUser.branch}</span></div>
              <div className="bg-gray-50 p-2.5 rounded-lg"><span className="text-gray-400 block text-[10px]">EMPLOYMENT TYPE</span><span className="font-medium text-gray-800">{activeUser.empType}</span></div>
            </div>
            <div className="flex gap-2">
              <Btn variant="outline" onClick={()=>setShowAssignRole(activeUser)}><Key size={13}/>Assign Role</Btn>
              <Btn variant="outline" onClick={()=>setShowResetPw(activeUser)}><Lock size={13}/>Reset Password</Btn>
              <Btn variant="danger"><UserX size={13}/>Deactivate User</Btn>
            </div>
          </div>
        </div>
      )}

      {/* Invite modal */}
      {showInvite&&(
        <Modal title="Invite Users" onClose={()=>setShowInvite(false)}>
          <div className="space-y-4">
            {generatedCreds.length > 0 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-xs flex flex-col gap-2">
                <div className="flex items-center gap-2 text-green-700 font-medium">
                  <CheckCircle size={14} className="text-green-600 flex-shrink-0" />
                  <span>Users invited! (Simulation: Auto-generated passwords)</span>
                </div>
                <div className="bg-white p-2 rounded border border-green-100 max-h-32 overflow-auto">
                  {generatedCreds.map(c => (
                    <div key={c.email} className="flex justify-between py-1 border-b border-gray-100 last:border-0 text-gray-700">
                      <span className="font-medium">{c.email}</span>
                      <span className="font-mono text-[#5C5CFF] font-bold select-all">{c.password}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Email Addresses</label>
              <textarea
                rows={3}
                value={inviteEmails}
                onChange={(e) => setInviteEmails(e.target.value)}
                placeholder="Enter email addresses (one per line or comma separated)"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5C5CFF] resize-none"
              />
              <p className="text-[10px] text-gray-400 mt-1">Separate multiple emails with commas or newlines</p>
            </div>
            <SelectField
              label="Role"
              options={["Employee","Manager","HR Admin","Super Admin"]}
              value={inviteRole}
              onChange={setInviteRole}
              required
            />
            <SelectField
              label="Department"
              options={DEPT_DIST.map(d=>d.name)}
              value={inviteDept}
              onChange={setInviteDept}
              required
            />
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-start gap-2">
              <Info size={13} className="text-blue-500 flex-shrink-0 mt-0.5"/>
              <p className="text-xs text-blue-700">User records will be created in Firestore. Approved users can log in directly with their role access.</p>
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
              <Btn variant="outline" onClick={()=>setShowInvite(false)}>Cancel</Btn>
              <Btn onClick={handleSendInvitations} disabled={sendingInvite || !inviteEmails.trim()}>
                {sendingInvite ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
                {sendingInvite ? "Saving to Firebase..." : "Send Invitations"}
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      {showResetPw&&(
        <Modal title="Reset Password" onClose={()=>setShowResetPw(null)}>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Avt initials={showResetPw.initials} color={showResetPw.color} size="sm"/>
              <div><p className="text-sm font-medium text-gray-800">{showResetPw.name}</p><p className="text-xs text-gray-400">{showResetPw.email}</p></div>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input type="radio" name="pw-reset" defaultChecked className="accent-[#5C5CFF]"/>
                <div><p className="text-sm text-gray-800">Send password reset email</p><p className="text-xs text-gray-400">User receives a link to create a new password</p></div>
              </label>
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input type="radio" name="pw-reset" className="accent-[#5C5CFF]"/>
                <div><p className="text-sm text-gray-800">Set temporary password</p><p className="text-xs text-gray-400">User must change on first login</p></div>
              </label>
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
              <Btn variant="outline" onClick={()=>setShowResetPw(null)}>Cancel</Btn>
              <Btn onClick={()=>setShowResetPw(null)}><RefreshCw size={13}/>Reset Password</Btn>
            </div>
          </div>
        </Modal>
      )}

      {showAssignRole&&(
        <Modal title="Assign Role" onClose={()=>setShowAssignRole(null)}>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Avt initials={showAssignRole.initials} color={showAssignRole.color} size="sm"/>
              <div><p className="text-sm font-medium text-gray-800">{showAssignRole.name}</p><p className="text-xs text-gray-400">Current role: Employee</p></div>
            </div>
            <SelectField label="New Role" options={["Employee","Manager","HR Admin","Super Admin","Custom Role"]} required/>
            <InputField label="Effective From" type="date"/>
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
              <Btn variant="outline" onClick={()=>setShowAssignRole(null)}>Cancel</Btn>
              <Btn onClick={()=>setShowAssignRole(null)}><Check size={13}/>Assign Role</Btn>
            </div>
          </div>
        </Modal>
      )}

      {showEditUser&&(
        <Modal title="Edit User" onClose={()=>setShowEditUser(null)} width="max-w-xl">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <InputField label="First Name" value={showEditUser.name.split(" ")[0]} required/>
              <InputField label="Last Name" value={showEditUser.name.split(" ")[1]||""} required/>
              <InputField label="Email" value={showEditUser.email} type="email" required/>
              <InputField label="Phone" value={showEditUser.phone}/>
              <SelectField label="Department" options={DEPT_DIST.map(d=>d.name)} value={showEditUser.dept}/>
              <SelectField label="Employment Type" options={["Full-Time","Part-Time","Contract","Intern"]} value={showEditUser.empType}/>
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
              <Btn variant="outline" onClick={()=>setShowEditUser(null)}>Cancel</Btn>
              <Btn onClick={()=>setShowEditUser(null)}><Check size={13}/>Save Changes</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── ORGANIZATION SETUP ─────────────────────────────────────────────────────────
function OrgSetupSection() {
  const { companyId: authCompanyId } = useAuth();
  const targetCompanyId = authCompanyId || "default";

  const NAV: OrgSetupNav[] = ["Organization Details","Organization Policy","Organization Structure","Locations","Departments","Designations","Shifts","Domains & Branding","Email Authentication"];
  const [active, setActive] = useState<OrgSetupNav>("Organization Details");

  // Real-time Firestore State
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [toastState, setToastState] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const triggerToast = (type: "success" | "error", msg: string) => {
    setToastState({ type, msg });
    setTimeout(() => setToastState(null), 4000);
  };

  // Form states for Organization Details
  const [orgName, setOrgName] = useState("");
  const [portalName, setPortalName] = useState("");
  const [businessType, setBusinessType] = useState("Private Ltd");
  const [industry, setIndustry] = useState("Technology");
  const [employeeCount, setEmployeeCount] = useState("1–10");
  const [website, setWebsite] = useState("");
  const [timezone, setTimezone] = useState("(UTC+5:30) IST");
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");
  const [weekStartDay, setWeekStartDay] = useState("Monday");
  const [language, setLanguage] = useState("English (US)");

  // Form states for Organization Policy
  const [gracePeriod, setGracePeriod] = useState("15 minutes");
  const [workHoursPerDay, setWorkHoursPerDay] = useState("9 hours");
  const [lateMarkTime, setLateMarkTime] = useState("09:15 AM");
  const [biometricRequired, setBiometricRequired] = useState("Yes");

  const [annualLeave, setAnnualLeave] = useState("18 days");
  const [sickLeave, setSickLeave] = useState("10 days");
  const [casualLeave, setCasualLeave] = useState("6 days");
  const [carryoverAllowed, setCarryoverAllowed] = useState("Yes");

  const [wfhAllowed, setWfhAllowed] = useState("Yes, with approval");
  const [maxWfhDaysMonth, setMaxWfhDaysMonth] = useState("8 days");
  const [geofenceRequired, setGeofenceRequired] = useState("No");

  // Edit Policy Modal
  const [editPolicyType, setEditPolicyType] = useState<"Attendance" | "Leave" | "WFH" | null>(null);

  // Structure lists from Firestore
  const [levels, setLevels] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);

  const [showAddDept, setShowAddDept] = useState(false);
  const [showAddLoc, setShowAddLoc] = useState(false);
  const [showAddDesig, setShowAddDesig] = useState(false);
  const [showAddLevel, setShowAddLevel] = useState(false);
  const [editingLoc, setEditingLoc] = useState<any | null>(null);

  const [newLocName, setNewLocName] = useState("");
  const [newLocType, setNewLocType] = useState("Regional Office");
  const [newLocAddr, setNewLocAddr] = useState("");
  const [newLocCity, setNewLocCity] = useState("");
  const [newLocState, setNewLocState] = useState("");
  const [newLocTz, setNewLocTz] = useState("(UTC-8) Pacific");
  const [newLocLat, setNewLocLat] = useState("");
  const [newLocLng, setNewLocLng] = useState("");
  const [isFetchingCoords, setIsFetchingCoords] = useState(false);
  const [coordMsg, setCoordMsg] = useState<string | null>(null);

  const [newLevelName, setNewLevelName] = useState("");
  const [newLevelDesc, setNewLevelDesc] = useState("");

  const [smtpHost, setSmtpHost] = useState("smtp.gmail.com");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("noreply@acmecorp.com");
  const [smtpPass, setSmtpPass] = useState("••••••••");
  const [smtpEncryption, setSmtpEncryption] = useState("TLS");
  const [brandColor, setBrandColor] = useState("#5C5CFF");
  const [customHex, setCustomHex] = useState("#5C5CFF");

  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptHead, setNewDeptHead] = useState("Assign later");
  const [newDeptParent, setNewDeptParent] = useState("None (Top-level)");
  const [editingDept, setEditingDept] = useState<any | null>(null);

  const [newDesigName, setNewDesigName] = useState("");
  const [newDesigLevel, setNewDesigLevel] = useState("L1");
  const [newDesigDept, setNewDesigDept] = useState("All");
  const [realtimeCompanyEmps, setRealtimeCompanyEmps] = useState<any[]>([]);

  // Shifts state
  const [shifts, setShifts] = useState<any[]>([]);
  const [showAddShift, setShowAddShift] = useState(false);
  const [newShiftName, setNewShiftName] = useState("");
  const [newShiftStart, setNewShiftStart] = useState("09:00");
  const [newShiftEnd, setNewShiftEnd] = useState("18:00");
  const [newShiftDays, setNewShiftDays] = useState("Mon - Fri");
  const [newShiftGrace, setNewShiftGrace] = useState("15 min");
  const [newShiftType, setNewShiftType] = useState("Fixed");

  useEffect(() => {
    if (!targetCompanyId) return;
    try {
      onSnapshot(collection(db, "organizations", targetCompanyId, "users"), (snap) => {
        setRealtimeCompanyEmps(snap.docs.map(d => {
          const u = d.data();
          return { id: d.id, name: u.name || `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email, ...u };
        }));
      });
    } catch (_) {}
  }, [targetCompanyId]);

  // 1. Real-time Firestore Listener on /organizations/{companyId}
  useEffect(() => {
    if (!targetCompanyId) return;
    const orgRef = doc(db, "organizations", targetCompanyId);
    const unsub = onSnapshot(orgRef, (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        if (d.companyName) setOrgName(d.companyName);
        if (d.portalName) setPortalName(d.portalName);
        if (d.businessType) setBusinessType(d.businessType);
        if (d.industry) setIndustry(d.industry);
        if (d.employeeCount) setEmployeeCount(d.employeeCount);
        if (d.website) setWebsite(d.website);
        if (d.timezone) setTimezone(d.timezone);
        if (d.dateFormat) setDateFormat(d.dateFormat);
        if (d.weekStartDay) setWeekStartDay(d.weekStartDay);
        if (d.language) setLanguage(d.language);

        if (d.attendancePolicy) {
          if (d.attendancePolicy.gracePeriod) setGracePeriod(d.attendancePolicy.gracePeriod);
          if (d.attendancePolicy.workHoursPerDay) setWorkHoursPerDay(String(d.attendancePolicy.workHoursPerDay).includes("hour") ? String(d.attendancePolicy.workHoursPerDay) : `${d.attendancePolicy.workHoursPerDay} hours`);
          if (d.attendancePolicy.lateMarkTime) setLateMarkTime(d.attendancePolicy.lateMarkTime);
          if (d.attendancePolicy.biometricRequired !== undefined) setBiometricRequired(d.attendancePolicy.biometricRequired ? "Yes" : "No");
        }

        if (d.leavePolicy) {
          if (d.leavePolicy.annualLeave) setAnnualLeave(d.leavePolicy.annualLeave);
          if (d.leavePolicy.sickLeave) setSickLeave(d.leavePolicy.sickLeave);
          if (d.leavePolicy.casualLeave) setCasualLeave(d.leavePolicy.casualLeave);
          if (d.leavePolicy.carryoverAllowed) setCarryoverAllowed(d.leavePolicy.carryoverAllowed);
        }

        if (d.wfhPolicy) {
          if (d.wfhPolicy.wfhAllowed) setWfhAllowed(d.wfhPolicy.wfhAllowed);
          if (d.wfhPolicy.maxWfhDaysMonth) setMaxWfhDaysMonth(d.wfhPolicy.maxWfhDaysMonth);
          if (d.wfhPolicy.geofenceRequired) setGeofenceRequired(d.wfhPolicy.geofenceRequired);
        }
        if (d.isGeofencingEnabled !== undefined) setIsGeofencingEnabled(d.isGeofencingEnabled);

        const locs = d.locations || d["----------"];
        if (Array.isArray(locs) && locs.length > 0) setLocations(locs);
        if (Array.isArray(d.levels) && d.levels.length > 0) setLevels(d.levels);
        if (d.brandColor) setBrandColor(d.brandColor);
        if (d.smtpConfig) {
          if (d.smtpConfig.smtpHost) setSmtpHost(d.smtpConfig.smtpHost);
          if (d.smtpConfig.smtpPort) setSmtpPort(d.smtpConfig.smtpPort);
          if (d.smtpConfig.smtpUser) setSmtpUser(d.smtpConfig.smtpUser);
          if (d.smtpConfig.smtpPass) setSmtpPass(d.smtpConfig.smtpPass);
          if (d.smtpConfig.smtpEncryption) setSmtpEncryption(d.smtpConfig.smtpEncryption);
        }
      }
    }, (err) => {
      console.warn("Error listening to organization setup:", err);
    });

    // Listen to branches subcollection as the single source of truth for locations
    const unsubBranches = onSnapshot(collection(db, "organizations", targetCompanyId, "branches"), (snap) => {
      if (!snap.empty) {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setLocations(list);
      }
    });

    // Listen to departments subcollection as the single source of truth
    const unsubDepts = onSnapshot(collection(db, "organizations", targetCompanyId, "departments"), (snap) => {
      if (!snap.empty) {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setDepartments(list);
      }
    });

    // Listen to designations subcollection as the single source of truth
    const unsubDesigs = onSnapshot(collection(db, "organizations", targetCompanyId, "designations"), (snap) => {
      if (!snap.empty) {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setDesignations(list);
      }
    });

    // Listen to shifts subcollection
    const unsubShifts = onSnapshot(collection(db, "organizations", targetCompanyId, "shifts"), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setShifts(list);
    });

    return () => { unsub(); unsubBranches(); unsubDepts(); unsubDesigs(); unsubShifts(); };
  }, [targetCompanyId]);

  // Save changes handler to Firestore
  const handleSaveOrgSetup = async (extraPayload: any = {}) => {
    if (!targetCompanyId) return;
    const cleanPayload = (extraPayload && typeof extraPayload === "object" && !("nativeEvent" in extraPayload) && !("target" in extraPayload) && !("_reactName" in extraPayload)) ? extraPayload : {};
    setIsSaving(true);
    try {
      const payload = {
        companyName: orgName,
        portalName,
        businessType,
        industry,
        employeeCount,
        website,
        timezone,
        dateFormat,
        weekStartDay,
        language,
        attendancePolicy: {
          gracePeriod,
          workHoursPerDay,
          lateMarkTime,
          biometricRequired: biometricRequired === "Yes",
        },
        leavePolicy: {
          annualLeave,
          sickLeave,
          casualLeave,
          carryoverAllowed,
        },
        leaveTypes: [
          { id: "annual", name: "Annual Leave", code: "AL", days: parseInt(annualLeave) || 18, carry: carryoverAllowed, enabled: true, color: "#5C5CFF" },
          { id: "sick", name: "Sick Leave", code: "SL", days: parseInt(sickLeave) || 10, carry: "No", enabled: true, color: "#EF4444" },
          { id: "casual", name: "Casual Leave", code: "CL", days: parseInt(casualLeave) || 6, carry: "No", enabled: true, color: "#22C55E" },
        ],
        wfhPolicy: {
          wfhAllowed,
          maxWfhDaysMonth,
          geofenceRequired,
        },
        locations,
        departments,
        designations,
        shifts,
        levels,
        brandColor: customHex || brandColor,
        smtpConfig: {
          smtpHost,
          smtpPort,
          smtpUser,
          smtpPass,
          smtpEncryption,
          smtpFromName: orgName,
        },
        updatedAt: new Date().toISOString(),
        ...cleanPayload,
      };

      await setDoc(doc(db, "organizations", targetCompanyId), payload, { merge: true });
      try { await setDoc(doc(db, "companies", targetCompanyId), payload, { merge: true }); } catch (_) {}
      try { await setDoc(doc(db, "approved_companies", targetCompanyId), payload, { merge: true }); } catch (_) {}

      // Write subcollection leave_types
      for (const lt of payload.leaveTypes) {
        try {
          await setDoc(doc(db, "organizations", targetCompanyId, "leave_types", lt.id), lt, { merge: true });
        } catch (_) {}
      }

      setSaveSuccess(true);
      triggerToast("success", "Organization Details saved successfully in real-time to Firestore!");
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      console.error("Error saving organization setup to Firestore:", err);
      triggerToast("error", `Error saving to Firestore: ${err?.message || "Unknown error"}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Geocoding API handler using OpenStreetMap Nominatim API
  const handleFetchCoords = async () => {
    const query = [newLocAddr, newLocCity, newLocState].filter(Boolean).join(", ");
    if (!query.trim()) {
      setCoordMsg("⚠️ Please enter Address or City first.");
      return;
    }
    setIsFetchingCoords(true);
    setCoordMsg(null);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0 && data[0].lat && data[0].lon) {
        const latVal = parseFloat(data[0].lat).toFixed(6);
        const lonVal = parseFloat(data[0].lon).toFixed(6);
        setNewLocLat(latVal);
        setNewLocLng(lonVal);
        setCoordMsg(`✅ Coords Fetched via API: Lat ${latVal}, Lng ${lonVal}`);
      } else {
        setCoordMsg("⚠️ Location not found via Geocoding API. Please enter Lat/Lng manually or use GPS.");
      }
    } catch (_) {
      setCoordMsg("⚠️ Geocoding API request failed. Enter Lat/Lng manually or use GPS.");
    } finally {
      setIsFetchingCoords(false);
    }
  };

  const handleUseGps = () => {
    if (!navigator.geolocation) {
      setCoordMsg("⚠️ Geolocation is not supported by your browser.");
      return;
    }
    setCoordMsg("Fetching GPS location...");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const latVal = pos.coords.latitude.toFixed(6);
        const lonVal = pos.coords.longitude.toFixed(6);
        setNewLocLat(latVal);
        setNewLocLng(lonVal);
        setCoordMsg(`✅ GPS Coords: Lat ${latVal}, Lng ${lonVal}`);
        
        // Reverse Geocoding if address is empty
        if (!newLocAddr || !newLocCity) {
          setCoordMsg(`✅ GPS Coords: Lat ${latVal}, Lng ${lonVal}. Fetching address...`);
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latVal}&lon=${lonVal}`);
            const data = await res.json();
            if (data && data.address) {
              const road = data.address.road || data.address.suburb || data.address.neighbourhood || data.name || "";
              const city = data.address.city || data.address.town || data.address.county || "";
              const state = data.address.state || "";
              
              setNewLocAddr(prev => prev || road);
              setNewLocCity(prev => prev || city);
              setNewLocState(prev => prev || state);
              setCoordMsg(`✅ GPS Coords & Address Fetched!`);
            }
          } catch (e) {
            console.warn("Reverse geocode failed", e);
            setCoordMsg(`✅ GPS Coords Fetched (Address lookup failed)`);
          }
        }
      },
      (err) => {
        setCoordMsg(`⚠️ GPS error: ${err.message}`);
      }
    );
  };

  const handleAddLocationSubmit = async () => {
    if (!newLocCity.trim() || !newLocAddr.trim()) return;
    const locId = editingLoc?.id || `LOC_${Date.now()}`;
    const latNum = parseFloat(newLocLat) || 0;
    const lngNum = parseFloat(newLocLng) || 0;

    const newLoc = {
      id: locId,
      name: newLocName.trim() || `${newLocCity} Branch`,
      type: newLocType || "Regional Office",
      addr: `${newLocAddr}, ${newLocCity}${newLocState ? `, ${newLocState}` : ""}`,
      address: newLocAddr,
      city: newLocCity,
      state: newLocState,
      timezone: newLocTz,
      lat: latNum,
      lng: lngNum,
      latitude: latNum,
      longitude: lngNum,
      emp: editingLoc?.emp || 0,
      createdAt: editingLoc?.createdAt || new Date().toISOString(),
    };

    const updatedLocs = editingLoc
      ? locations.map((l) => (l.id === editingLoc.id || l.name === editingLoc.name ? newLoc : l))
      : [newLoc, ...locations];

    setLocations(updatedLocs);
    setShowAddLoc(false);
    setEditingLoc(null);
    setNewLocName(""); setNewLocAddr(""); setNewLocCity(""); setNewLocState(""); setNewLocLat(""); setNewLocLng(""); setCoordMsg(null);

    await handleSaveOrgSetup({ locations: updatedLocs });
    triggerToast("success", "Location saved successfully to Firestore!");
    if (targetCompanyId) {
      try {
        await setDoc(doc(db, "organizations", targetCompanyId, "branches", locId), newLoc, { merge: true });
        await setDoc(doc(db, "organizations", targetCompanyId, "locations", locId), newLoc, { merge: true });
      } catch (err) {
        console.error("Error writing location/branch to Firestore:", err);
      }
    }
  };

  const handleDeleteLocation = async (loc: any) => {
    const locId = loc.id || loc.name;
    const updatedLocs = locations.filter((l) => (l.id || l.name) !== locId);
    setLocations(updatedLocs);
    await handleSaveOrgSetup({ locations: updatedLocs });
    triggerToast("success", "Location deleted successfully from Firestore!");
    if (targetCompanyId && loc.id) {
      try {
        await deleteDoc(doc(db, "organizations", targetCompanyId, "branches", loc.id));
        await deleteDoc(doc(db, "organizations", targetCompanyId, "locations", loc.id));
      } catch (_) {}
    }
  };

  const handleAddLevelSubmit = async () => {
    if (!newLevelName.trim()) return;
    const newLvl = {
      level: newLevelName.trim(),
      desc: newLevelDesc.trim() || "Reporting Tier",
      count: 0,
    };
    const updated = [newLvl, ...levels];
    setLevels(updated);
    setShowAddLevel(false);
    setNewLevelName(""); setNewLevelDesc("");
    await handleSaveOrgSetup({ levels: updated });
    triggerToast("success", "Reporting level added successfully!");
  };

  const handleDeleteLevel = async (lvl: any) => {
    const updated = levels.filter((l) => l.level !== lvl.level);
    setLevels(updated);
    await handleSaveOrgSetup({ levels: updated });
    triggerToast("success", "Reporting level deleted successfully!");
  };

  const handleAddDepartmentSubmit = async () => {
    if (!newDeptName.trim()) return;

    if (editingDept) {
      const dId = editingDept.id || `D_${editingDept.name}`;
      const updatedObj = {
        ...editingDept,
        name: newDeptName.trim(),
        head: newDeptHead.trim(),
        parent: newDeptParent.trim(),
        updatedAt: new Date().toISOString(),
      };

      setShowAddDept(false);
      setEditingDept(null);
      setNewDeptName("");

      if (targetCompanyId) {
        try {
          await setDoc(doc(db, "organizations", targetCompanyId, "departments", dId), updatedObj, { merge: true });
          triggerToast("success", "Department updated successfully in real-time!");
        } catch (err) {
          console.error("Error updating department in Firestore:", err);
          setDepartments(prev => prev.map(x => (x.id === editingDept.id || x.name === editingDept.name) ? updatedObj : x));
        }
      } else {
        setDepartments(prev => prev.map(x => (x.id === editingDept.id || x.name === editingDept.name) ? updatedObj : x));
      }
      return;
    }

    const dId = `D_${Date.now()}`;
    const newDeptObj = {
      id: dId,
      name: newDeptName.trim(),
      code: newDeptName.trim().substring(0, 3).toUpperCase(),
      head: newDeptHead.trim(),
      parent: newDeptParent.trim(),
      count: 0,
      sub: 0,
      active: true,
      color: "#5C5CFF",
      createdAt: new Date().toISOString(),
    };

    setShowAddDept(false);
    setNewDeptName("");

    if (targetCompanyId) {
      try {
        await setDoc(doc(db, "organizations", targetCompanyId, "departments", dId), newDeptObj, { merge: true });
        triggerToast("success", "Department created successfully in real-time!");
      } catch (err) {
        console.error("Error writing department to subcollection:", err);
        setDepartments(prev => [newDeptObj, ...prev]);
      }
    } else {
      setDepartments(prev => [newDeptObj, ...prev]);
    }
  };

  const handleDeleteDepartment = async (dept: any) => {
    const dId = dept.id || dept.name;
    const updated = departments.filter(d => (d.id || d.name) !== dId);
    setDepartments(updated);

    if (targetCompanyId) {
      try {
        if (dept.id) {
          await deleteDoc(doc(db, "organizations", targetCompanyId, "departments", dept.id));
        }
      } catch (err) {
        console.error("Error deleting department from Firestore:", err);
      }
    }
  };

  const handleAddDesignationSubmit = async () => {
    if (!newDesigName.trim()) return;
    const desId = `DES_${Date.now()}`;
    const newDesigObj = {
      id: desId,
      name: newDesigName.trim(),
      level: newDesigLevel,
      parentDept: newDesigDept,
      department: newDesigDept,
      createdAt: new Date().toISOString(),
    };

    setShowAddDesig(false);
    setNewDesigName("");

    const updatedDesigs = [newDesigObj, ...designations];
    setDesignations(updatedDesigs);

    if (targetCompanyId) {
      try {
        await setDoc(doc(db, "organizations", targetCompanyId, "designations", desId), newDesigObj, { merge: true });
        await handleSaveOrgSetup({ designations: updatedDesigs });
        triggerToast("success", "Designation created successfully in real-time!");
      } catch (err) {
        console.error("Error writing designation to Firestore:", err);
      }
    }
  };

  const handleDeleteDesignation = async (desig: any) => {
    const desId = desig.id || desig.name;
    const updated = designations.filter(d => (d.id || d.name) !== desId);
    setDesignations(updated);

    if (targetCompanyId) {
      try {
        if (desig.id) {
          await deleteDoc(doc(db, "organizations", targetCompanyId, "designations", desig.id));
        }
        await handleSaveOrgSetup({ designations: updated });
        triggerToast("success", "Designation deleted successfully!");
      } catch (err) {
        console.error("Error deleting designation from Firestore:", err);
      }
    }
  };

  // Shift CRUD handlers
  const handleAddShiftSubmit = async () => {
    if (!newShiftName.trim()) return;
    const shiftId = `SH_${Date.now()}`;
    const newShiftObj = {
      id: shiftId,
      name: newShiftName.trim(),
      startTime: newShiftStart,
      endTime: newShiftEnd,
      workingDays: newShiftDays,
      gracePeriod: newShiftGrace,
      type: newShiftType,
      active: true,
      createdAt: new Date().toISOString(),
    };
    setShowAddShift(false);
    setNewShiftName("");
    setNewShiftStart("09:00");
    setNewShiftEnd("18:00");
    if (targetCompanyId) {
      try {
        await setDoc(doc(db, "organizations", targetCompanyId, "shifts", shiftId), newShiftObj, { merge: true });
        triggerToast("success", "Shift created successfully in real-time!");
      } catch (err) {
        console.error("Error writing shift to Firestore:", err);
        setShifts(prev => [newShiftObj, ...prev]);
      }
    } else {
      setShifts(prev => [newShiftObj, ...prev]);
    }
  };

  const handleDeleteShift = async (shift: any) => {
    setShifts(prev => prev.filter(s => s.id !== shift.id));
    triggerToast("success", "Shift deleted successfully!");
    if (targetCompanyId && shift.id) {
      try {
        await deleteDoc(doc(db, "organizations", targetCompanyId, "shifts", shift.id));
      } catch (err) {
        console.error("Error deleting shift from Firestore:", err);
      }
    }
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left nav */}
      <div className="w-52 flex-shrink-0 border-r border-gray-200 bg-gray-50 overflow-auto py-3">
        {NAV.map(n=>(
          <button key={n} onClick={()=>setActive(n)} className={cn("w-full text-left px-4 py-2.5 text-xs font-medium transition-colors",active===n?"bg-white text-[#5C5CFF] border-r-2 border-[#5C5CFF]":"text-gray-600 hover:bg-white hover:text-gray-800")}>{n}</button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {saveSuccess && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-xl p-3 flex items-center justify-between text-xs text-green-700">
            <span className="flex items-center gap-2 font-medium"><CheckCircle size={14}/>Organization Setup changes saved in real-time to Firestore!</span>
          </div>
        )}

        {active==="Organization Details"&&(
          <div className="max-w-2xl space-y-5">
            <SectionHeader title="Organization Details" subtitle="Basic information about your organization">
              <Btn size="sm" onClick={() => handleSaveOrgSetup()} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Btn>
            </SectionHeader>
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-start gap-5 mb-5">
                <div className="w-20 h-20 rounded-xl bg-[#EEF2FF] border-2 border-dashed border-[#5C5CFF]/30 flex flex-col items-center justify-center cursor-pointer hover:border-[#5C5CFF] transition-colors">
                  <Building2 size={24} className="text-[#5C5CFF] mb-1"/>
                  <span className="text-[9px] text-gray-400">Upload Logo</span>
                </div>
                <div className="flex-1 space-y-3">
                  <InputField label="Organization Name" value={orgName} onChange={(v: any) => setOrgName(String(v?.target?.value ?? v))} required/>
                  <div className="grid grid-cols-2 gap-3">
                    <InputField label="Portal Subdomain" value={portalName} onChange={(v: any) => setPortalName(String(v?.target?.value ?? v))}/>
                    <SelectField label="Business Type" value={businessType} onChange={(v: any) => setBusinessType(String(v?.target?.value ?? v))} options={["Private Ltd","Public Ltd","Partnership","NGO","Government"]}/>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <SelectField label="Industry" value={industry} onChange={(v: any) => setIndustry(String(v?.target?.value ?? v))} options={["Technology","Finance","Healthcare","Manufacturing","Retail","Education","Consulting"]}/>
                <SelectField label="Employee Count" value={employeeCount} onChange={(v: any) => setEmployeeCount(String(v?.target?.value ?? v))} options={["1–10","11–50","51–200","201–500","501–1000","1000+"]}/>
                <InputField label="Website" value={website} onChange={(v: any) => setWebsite(String(v?.target?.value ?? v))} type="url"/>
                <SelectField label="Timezone" value={timezone} onChange={(v: any) => setTimezone(String(v?.target?.value ?? v))} options={["(UTC-8) Pacific","(UTC-5) Eastern","(UTC+0) UTC","(UTC+5:30) IST"]}/>
                <SelectField label="Date Format" value={dateFormat} onChange={(v: any) => setDateFormat(String(v?.target?.value ?? v))} options={["MM/DD/YYYY","DD/MM/YYYY","YYYY-MM-DD"]}/>
                <SelectField label="Week Start" value={weekStartDay} onChange={(v: any) => setWeekStartDay(String(v?.target?.value ?? v))} options={["Monday","Sunday"]}/>
                <SelectField label="Language" value={language} onChange={(v: any) => setLanguage(String(v?.target?.value ?? v))} options={["English (US)","English (UK)","French","German","Spanish"]}/>
              </div>
            </div>
          </div>
        )}

        {active==="Organization Policy"&&(
          <div className="max-w-2xl space-y-4">
            <SectionHeader title="Organization Policy" subtitle="Default policies applied across the organization">
              <Btn size="sm" onClick={() => handleSaveOrgSetup()} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Btn>
            </SectionHeader>
            <div className="flex items-center justify-between bg-blue-50/50 border border-blue-100 rounded-xl p-4 mb-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-800">Enable Geo-fencing Module</h4>
                <p className="text-xs text-gray-500 mt-1">Allow restricting employee check-ins to specific office locations via GPS.</p>
              </div>
              <div 
                className={cn("w-10 h-5 rounded-full relative cursor-pointer transition-colors", isGeofencingEnabled ? "bg-blue-500" : "bg-gray-300")}
                onClick={() => { setIsGeofencingEnabled(!isGeofencingEnabled); handleSaveOrgSetup(); }}
              >
                <div className={cn("absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform", isGeofencingEnabled ? "translate-x-5" : "translate-x-0")} />
              </div>
            </div>
            {[
              {type:"Attendance" as const, title:"Attendance Policy",items:[["Grace Period",gracePeriod],["Work Hours/Day",workHoursPerDay],["Late Mark After",lateMarkTime],["Biometric Required",biometricRequired]]},
              {type:"Leave" as const, title:"Leave Policy",items:[["Annual Leave",annualLeave],["Sick Leave",sickLeave],["Casual Leave",casualLeave],["Carryover Allowed",carryoverAllowed]]},
              {type:"WFH" as const, title:"Work From Home",items:[["WFH Allowed",wfhAllowed],["Max WFH Days/Month",maxWfhDaysMonth], ...(isGeofencingEnabled ? [["Geo-fence Required",geofenceRequired]] : [])]},
            ].map(s=>(
              <div key={s.title} className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-800">{s.title}</h4>
                  <Btn variant="outline" size="sm" onClick={()=>setEditPolicyType(s.type)}><Edit size={12}/>Edit</Btn>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {s.items.map(([k,v])=><div key={k} className="bg-gray-50 rounded-lg px-3 py-2.5"><p className="text-[10px] text-gray-400 mb-0.5">{k}</p><p className="text-xs font-medium text-gray-800">{v}</p></div>)}
                </div>
              </div>
            ))}
          </div>
        )}

        {active==="Organization Structure"&&(
          <div className="max-w-3xl space-y-4">
            <SectionHeader title="Organization Structure" subtitle="Manage your reporting hierarchy">
              <Btn variant="outline" size="sm"><Download size={12}/>Export</Btn>
              <Btn size="sm" onClick={()=>setShowAddLevel(true)}><Plus size={12}/>Add Level</Btn>
            </SectionHeader>
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="p-5 space-y-3">
                {levels.length === 0 ? (
                  <div className="text-sm text-gray-500 text-center py-4">No organization levels defined yet.</div>
                ) : (
                  levels.map((l: any)=>(
                    <div key={l.level} className="flex items-center gap-4 p-3 border border-gray-100 rounded-lg hover:border-[#5C5CFF]/20 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] flex items-center justify-center flex-shrink-0"><Users size={14} className="text-[#5C5CFF]"/></div>
                      <div className="flex-1"><p className="text-sm font-medium text-gray-800">{l.level}</p><p className="text-xs text-gray-400">{l.desc}</p></div>
                      <span className="text-sm font-bold text-gray-800">{l.count || 0}</span>
                      <span className="text-xs text-gray-400">people</span>
                      <div className="flex gap-1"><button onClick={()=>handleDeleteLevel(l)} className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-red-500" title="Delete Level"><Trash2 size={12}/></button></div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {active==="Locations"&&(
          <div className="max-w-3xl space-y-4">
            <SectionHeader title="Locations" subtitle="Manage office locations and branches with Lat & Long coordinates">
              <Btn variant="outline" size="sm"><Upload size={12}/>Bulk Import</Btn>
              <Btn size="sm" onClick={() => {
                setEditingLoc(null);
                setNewLocName(""); setNewLocAddr(""); setNewLocCity(""); setNewLocState(""); setNewLocLat(""); setNewLocLng(""); setCoordMsg(null);
                setShowAddLoc(true);
              }}><Plus size={12}/>Add Location</Btn>
            </SectionHeader>
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <TableHead cols={["Location","Type","Address","Coordinates (Lat, Lng)","Employees","Actions"]}/>
                <tbody className="divide-y divide-gray-100">
                  {locations.map(l=>(
                    <tr key={l.id || l.name} className="hover:bg-gray-50">
                      <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0"><MapPin size={12} className="text-blue-500"/></div><span className="text-sm font-medium text-gray-800">{l.name}</span></div></td>
                      <td className="px-4 py-3"><span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{l.type || "Branch"}</span></td>
                      <td className="px-4 py-3 text-xs text-gray-500">{l.addr || l.address}</td>
                      <td className="px-4 py-3 text-xs font-mono text-gray-600 font-semibold">
                        {(l.latitude || l.lat) ? `${parseFloat(l.latitude || l.lat).toFixed(4)}, ${parseFloat(l.longitude || l.lng).toFixed(4)}` : "Not set"}
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-gray-800">{realtimeCompanyEmps.filter(e => { const b = (e.branch || e.location || "").toLowerCase(); const n = (l.name || "").toLowerCase(); return b === n || b.includes(n.replace(" branch", "")) }).length}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => {
                            setEditingLoc(l);
                            setNewLocName(l.name || "");
                            setNewLocType(l.type || "Regional Office");
                            setNewLocAddr(l.address || l.addr?.split(",")[0] || "");
                            setNewLocCity(l.city || l.addr?.split(",")[1]?.trim() || "");
                            setNewLocState(l.state || l.addr?.split(",")[2]?.trim() || "");
                            setNewLocTz(l.timezone || "(UTC-8) Pacific");
                            setNewLocLat(l.latitude || l.lat ? String(l.latitude || l.lat) : "");
                            setNewLocLng(l.longitude || l.lng ? String(l.longitude || l.lng) : "");
                            setCoordMsg(null);
                            setShowAddLoc(true);
                          }} className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600" title="Edit Location"><Edit size={12}/></button>
                          <button onClick={()=>handleDeleteLocation(l)} className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500" title="Delete Location"><Trash2 size={12}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {active==="Departments"&&(
          <div className="max-w-3xl space-y-4">
            <SectionHeader title="Departments" subtitle="Configure organizational departments">
              <Btn variant="outline" size="sm"><Download size={12}/>Export</Btn>
              <Btn size="sm" onClick={() => {
                setEditingDept(null);
                setNewDeptName("");
                setNewDeptHead("Assign later");
                setNewDeptParent("None (Top-level)");
                setShowAddDept(true);
              }}><Plus size={12}/>Add Department</Btn>
            </SectionHeader>
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <TableHead cols={["Department","Head","Members","Sub-Departments","Status","Actions"]}/>
                <tbody className="divide-y divide-gray-100">
                  {departments.map(d=>(
                    <tr key={d.id || d.name} className="hover:bg-gray-50">
                      <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{backgroundColor:d.color || "#5C5CFF"}}/><span className="text-sm font-medium text-gray-800">{d.name}</span></div></td>
                      <td className="px-4 py-3 text-xs text-gray-600">{d.head || "Assign later"}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-gray-800">{realtimeCompanyEmps.filter(e => (e.dept || "").toLowerCase() === (d.name || "").toLowerCase()).length}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{d.sub || 0}</td>
                      <td className="px-4 py-3"><StatusBadge status={d.active!==false?"Active":"Inactive"}/></td>
                      <td className="px-4 py-3"><div className="flex gap-1"><button onClick={() => {
                        setEditingDept(d);
                        setNewDeptName(d.name || "");
                        setNewDeptHead(d.head || "Assign later");
                        setNewDeptParent(d.parent || "None (Top-level)");
                        setShowAddDept(true);
                      }} className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600" title="Edit Department"><Edit size={12}/></button><button onClick={() => handleDeleteDepartment(d)} className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500" title="Delete Department"><Trash2 size={12}/></button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {active==="Designations"&&(
          <div className="max-w-2xl space-y-4">
            <SectionHeader title="Designations" subtitle="Job titles and designations in your organization">
              <Btn size="sm" onClick={()=>setShowAddDesig(true)}><Plus size={12}/>Add Designation</Btn>
            </SectionHeader>
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <TableHead cols={["Designation","Level","Department","Employees","Actions"]}/>
                <tbody className="divide-y divide-gray-100">
                  {designations.map((d)=>(
                    <tr key={d.id || d.name} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">{d.name}</td>
                      <td className="px-4 py-3"><span className="text-[10px] bg-[#EEF2FF] text-[#5C5CFF] px-2 py-0.5 rounded font-medium">{d.level || "L1"}</span></td>
                      <td className="px-4 py-3 text-xs text-gray-500">{d.parentDept || d.department || "All"}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-gray-800">
                        {(realtimeCompanyEmps.length > 0 ? realtimeCompanyEmps : EMPLOYEES).filter(e => {
                          const empDesig = String(e.designation || e.jobTitle || e.roleLabel || (e.role !== "admin" && e.role !== "employee" && e.role !== "hr_admin" ? e.role : "") || "").toLowerCase().trim();
                          const targetDesig = String(d.name || "").toLowerCase().trim();
                          if (!targetDesig || !empDesig) return false;
                          return empDesig === targetDesig || empDesig.includes(targetDesig) || targetDesig.includes(empDesig);
                        }).length}
                      </td>
                      <td className="px-4 py-3"><div className="flex gap-1"><button className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"><Edit size={12}/></button><button onClick={()=>handleDeleteDesignation(d)} className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500" title="Delete Designation"><Trash2 size={12}/></button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {active==="Shifts"&&(
          <div className="max-w-3xl space-y-5">
            <SectionHeader title="Shifts" subtitle="Define work shifts for your organization">
              <Btn size="sm" onClick={()=>setShowAddShift(true)}><Plus size={12}/>Add Shift</Btn>
            </SectionHeader>
            {shifts.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-10 flex flex-col items-center justify-center text-center gap-3">
                <Clock size={32} className="text-gray-300"/>
                <div>
                  <p className="text-sm font-semibold text-gray-700">No shifts defined yet</p>
                  <p className="text-xs text-gray-400 mt-1">Add your first work shift to get started</p>
                </div>
                <Btn size="sm" onClick={()=>setShowAddShift(true)}><Plus size={12}/>Add Shift</Btn>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <TableHead cols={["Shift Name","Type","Start","End","Working Days","Grace Period","Status","Actions"]}/>
                  <tbody className="divide-y divide-gray-100">
                    {shifts.map((s)=>(
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-800">{s.name}</td>
                        <td className="px-4 py-3"><span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-medium">{s.type||"Fixed"}</span></td>
                        <td className="px-4 py-3 text-xs text-gray-600 font-mono">{s.startTime||"09:00"}</td>
                        <td className="px-4 py-3 text-xs text-gray-600 font-mono">{s.endTime||"18:00"}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{s.workingDays||"Mon - Fri"}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{s.gracePeriod||"15 min"}</td>
                        <td className="px-4 py-3">
                          <span className={cn("text-[10px] px-2 py-0.5 rounded font-medium", s.active!==false ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500")}>
                            {s.active!==false?"Active":"Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <button className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600" title="Edit"><Edit size={12}/></button>
                            <button onClick={()=>handleDeleteShift(s)} className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500" title="Delete"><Trash2 size={12}/></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {active==="Domains & Branding"&&(
          <div className="max-w-2xl space-y-5">
            <SectionHeader title="Domains & Branding" subtitle="Customize your organization's identity">
              <Btn size="sm" onClick={() => handleSaveOrgSetup({ brandColor, portalName })}>Save Changes</Btn>
            </SectionHeader>
            <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
              <h4 className="text-sm font-semibold text-gray-800">Custom Domain</h4>
              <InputField label="Domain" value={`${portalName}.hrms.app`} onChange={e=>setPortalName(e.target.value.replace('.hrms.app',''))} placeholder="yourdomain.hrms.app"/>
              <div className="bg-green-50 border border-green-100 rounded-lg p-3 flex items-center gap-2"><Check size={13} className="text-green-500"/><p className="text-xs text-green-700">Domain verified and active</p></div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
              <h4 className="text-sm font-semibold text-gray-800">Brand Colors</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Primary Color</label>
                  <div className="flex gap-2">
                    {["#5C5CFF","#3B82F6","#22C55E","#F59E0B","#EF4444","#8B5CF6"].map(c=>(
                      <button key={c} type="button" onClick={() => { setBrandColor(c); setCustomHex(c); }} className={cn("w-8 h-8 rounded-full border-2 transition-all", brandColor === c ? "border-gray-900 scale-110" : "border-transparent hover:scale-105")} style={{backgroundColor:c}}/>
                    ))}
                  </div>
                </div>
                <InputField label="Custom Hex" value={customHex} onChange={(e: any) => { const val = e?.target?.value || e; setCustomHex(val); setBrandColor(val); }} placeholder="#5C5CFF"/>
              </div>
            </div>
          </div>
        )}

        {active==="Email Authentication"&&(
          <div className="max-w-2xl space-y-5">
            <SectionHeader title="Email Authentication" subtitle="Configure email delivery and authentication">
              <Btn size="sm" onClick={() => handleSaveOrgSetup({ smtpConfig: { smtpHost, smtpPort, smtpUser, smtpPass, smtpEncryption, smtpFromName: orgName } })}>Save Changes</Btn>
            </SectionHeader>
            <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
              <h4 className="text-sm font-semibold text-gray-800">SMTP Configuration</h4>
              <div className="grid grid-cols-2 gap-4">
                <InputField label="SMTP Host" value={smtpHost} onChange={(e: any) => setSmtpHost(e?.target?.value || e)} placeholder="smtp.gmail.com"/>
                <InputField label="SMTP Port" value={smtpPort} onChange={(e: any) => setSmtpPort(e?.target?.value || e)} placeholder="587"/>
                <InputField label="Username" value={smtpUser} onChange={(e: any) => setSmtpUser(e?.target?.value || e)} placeholder="noreply@acmecorp.com"/>
                <InputField label="Password" type="password" value={smtpPass} onChange={(e: any) => setSmtpPass(e?.target?.value || e)} placeholder="••••••••"/>
                <SelectField label="Encryption" value={smtpEncryption} onChange={(e: any) => setSmtpEncryption(e?.target?.value || e)} options={["TLS","SSL","None"]}/>
                <InputField label="From Name" value={orgName} onChange={(e: any) => setOrgName(e?.target?.value || e)}/>
              </div>
              <Btn variant="outline" size="sm"><Send size={12}/>Send Test Email</Btn>
            </div>
          </div>
        )}
      </div>

      {/* Edit Policy Modal */}
      {editPolicyType && (
        <Modal title={`Edit ${editPolicyType} Policy`} onClose={()=>setEditPolicyType(null)}>
          <div className="space-y-4">
            {editPolicyType === "Attendance" && (
              <>
                <InputField label="Grace Period" value={gracePeriod} onChange={(v: any) => setGracePeriod(String(v?.target?.value ?? v))}/>
                <InputField label="Work Hours / Day" value={workHoursPerDay} onChange={(v: any) => setWorkHoursPerDay(String(v?.target?.value ?? v))}/>
                <InputField label="Late Mark After" value={lateMarkTime} onChange={(v: any) => setLateMarkTime(String(v?.target?.value ?? v))}/>
                <SelectField label="Biometric Required" value={biometricRequired} onChange={(v: any) => setBiometricRequired(String(v?.target?.value ?? v))} options={["Yes","No"]}/>
              </>
            )}
            {editPolicyType === "Leave" && (
              <>
                <InputField label="Annual Leave Days" value={annualLeave} onChange={(v: any) => setAnnualLeave(String(v?.target?.value ?? v))}/>
                <InputField label="Sick Leave Days" value={sickLeave} onChange={(v: any) => setSickLeave(String(v?.target?.value ?? v))}/>
                <InputField label="Casual Leave Days" value={casualLeave} onChange={(v: any) => setCasualLeave(String(v?.target?.value ?? v))}/>
                <SelectField label="Carryover Allowed" value={carryoverAllowed} onChange={(v: any) => setCarryoverAllowed(String(v?.target?.value ?? v))} options={["Yes","No"]}/>
              </>
            )}
            {editPolicyType === "WFH" && (
              <>
                <SelectField label="WFH Allowed" value={wfhAllowed} onChange={(v: any) => setWfhAllowed(String(v?.target?.value ?? v))} options={["Yes, with approval","Yes, automatic","No"]}/>
                <InputField label="Max WFH Days / Month" value={maxWfhDaysMonth} onChange={(v: any) => setMaxWfhDaysMonth(String(v?.target?.value ?? v))}/>
                <SelectField label="Geo-fence Required" value={geofenceRequired} onChange={(v: any) => setGeofenceRequired(String(v?.target?.value ?? v))} options={["Yes","No"]}/>
              </>
            )}
            <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
              <Btn variant="outline" onClick={()=>setEditPolicyType(null)}>Cancel</Btn>
              <Btn onClick={async ()=>{
                setEditPolicyType(null);
                await handleSaveOrgSetup();
              }}>Save Policy</Btn>
            </div>
          </div>
        </Modal>
      )}

      {showAddDept&&(
        <Modal title={editingDept ? "Edit Department" : "Add Department"} onClose={()=>{ setShowAddDept(false); setEditingDept(null); }}>
          <div className="space-y-4">
            <InputField label="Department Name" value={newDeptName} onChange={(v: any) => setNewDeptName(String(v?.target?.value ?? v))} placeholder="e.g. Customer Success" required/>
            <SelectField label="Parent Department" value={newDeptParent} onChange={(v: any) => setNewDeptParent(String(v?.target?.value ?? v))} options={["None (Top-level)",...DEPT_DIST.map(d=>d.name)]}/>
            <SelectField label="Department Head" value={newDeptHead} onChange={(v: any) => setNewDeptHead(String(v?.target?.value ?? v))} options={["Assign later", ...(realtimeCompanyEmps.length > 0 ? realtimeCompanyEmps.map(e=>e.name) : ["Sarah Mitchell", "Marcus Johnson", "Priya Sharma", "David Chen"])]}/>
            <InputField label="Cost Center" placeholder="e.g. ENG-005"/>
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
              <Btn variant="outline" onClick={()=>{ setShowAddDept(false); setEditingDept(null); }}>Cancel</Btn>
              <Btn onClick={handleAddDepartmentSubmit} disabled={!newDeptName.trim()}>{editingDept ? "Save Changes" : "Create Department"}</Btn>
            </div>
          </div>
        </Modal>
      )}

      {showAddLoc&&(
        <Modal title={editingLoc ? "Edit Location" : "Add Location"} onClose={()=>{ setShowAddLoc(false); setEditingLoc(null); }}>
          <div className="space-y-4">
            <InputField label="Location Name" value={newLocName} onChange={(v: any) => setNewLocName(String(v?.target?.value ?? v))} placeholder="e.g. Seattle HQ or London Office"/>
            <SelectField label="Location Type" value={newLocType} onChange={(v: any) => setNewLocType(String(v?.target?.value ?? v))} options={["Headquarters","Regional Office","Branch Office","Remote Hub"]}/>
            <InputField label="Address" value={newLocAddr} onChange={(v: any) => setNewLocAddr(String(v?.target?.value ?? v))} placeholder="123 Main Street" required/>
            <div className="grid grid-cols-2 gap-4">
              <InputField label="City" value={newLocCity} onChange={(v: any) => setNewLocCity(String(v?.target?.value ?? v))} placeholder="Seattle" required/>
              <InputField label="State / Province" value={newLocState} onChange={(v: any) => setNewLocState(String(v?.target?.value ?? v))} placeholder="WA"/>
            </div>
            <InputField label="Timezone" value={newLocTz} onChange={(v: any) => setNewLocTz(String(v?.target?.value ?? v))} placeholder="(UTC-8) Pacific"/>

              <div className="border border-blue-100 bg-blue-50/50 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <MapPin size={13} className="text-[#5C5CFF]"/>
                    Geofence Coordinates (Lat & Long)
                  </label>
                  <div className="flex gap-2">
                    <Btn type="button" variant="outline" size="sm" onClick={handleFetchCoords} disabled={isFetchingCoords}>
                      {isFetchingCoords ? "Fetching..." : "Fetch via API"}
                    </Btn>
                    <Btn type="button" variant="outline" size="sm" onClick={handleUseGps}>
                      Use GPS
                    </Btn>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <InputField label="Latitude" value={newLocLat} onChange={(v: any) => setNewLocLat(String(v?.target?.value ?? v))} placeholder="e.g. 47.6062"/>
                  <InputField label="Longitude" value={newLocLng} onChange={(v: any) => setNewLocLng(String(v?.target?.value ?? v))} placeholder="e.g. -122.3321"/>
                </div>
                {coordMsg && (
                  <p className={cn("text-[11px] font-medium leading-snug", coordMsg.startsWith("📍") ? "text-green-700" : "text-amber-700")}>
                    {coordMsg}
                  </p>
                )}
              </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
              <Btn variant="outline" onClick={()=>{ setShowAddLoc(false); setEditingLoc(null); }}>Cancel</Btn>
              <Btn onClick={handleAddLocationSubmit} disabled={!newLocCity.trim()||!newLocAddr.trim()}>{editingLoc ? "Save Location" : "Add Location"}</Btn>
            </div>
          </div>
        </Modal>
      )}

      {showAddLevel&&(
        <Modal title="Add Reporting Level" onClose={()=>setShowAddLevel(false)}>
          <div className="space-y-4">
            <InputField label="Level Name" value={newLevelName} onChange={(v: any) => setNewLevelName(String(v?.target?.value ?? v))} placeholder="e.g. Executive Board (C-Suite)" required/>
            <InputField label="Description" value={newLevelDesc} onChange={(v: any) => setNewLevelDesc(String(v?.target?.value ?? v))} placeholder="e.g. Tier 1 leadership and key decision makers"/>
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
              <Btn variant="outline" onClick={()=>setShowAddLevel(false)}>Cancel</Btn>
              <Btn onClick={handleAddLevelSubmit} disabled={!newLevelName.trim()}>Add Level</Btn>
            </div>
          </div>
        </Modal>
      )}

      {showAddDesig&&(
        <Modal title="Add Designation" onClose={()=>setShowAddDesig(false)}>
          <div className="space-y-4">
            <InputField label="Designation Name" value={newDesigName} onChange={(v: any) => setNewDesigName(String(v?.target?.value ?? v))} placeholder="e.g. Senior Software Engineer" required/>
            <SelectField label="Level" value={newDesigLevel} onChange={(v: any) => setNewDesigLevel(String(v?.target?.value ?? v))} options={["L1 - Junior", "L2 - Mid Level", "L3 - Senior", "L4 - Lead", "L5 - Manager", "L6 - Director / Executive"]}/>
            <SelectField label="Department" value={newDesigDept} onChange={(v: any) => setNewDesigDept(String(v?.target?.value ?? v))} options={["All", ...(departments.length > 0 ? departments.map(d=>d.name) : ["Engineering", "HR", "Product", "Sales", "Marketing", "Finance"])]}/>
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
              <Btn variant="outline" onClick={()=>setShowAddDesig(false)}>Cancel</Btn>
              <Btn onClick={handleAddDesignationSubmit} disabled={!newDesigName.trim()}>Create Designation</Btn>
            </div>
          </div>
        </Modal>
      )}

      {showAddShift&&(
        <Modal title="Add Shift" onClose={()=>setShowAddShift(false)}>
          <div className="space-y-4">
            <InputField label="Shift Name" value={newShiftName} onChange={(v: any) => setNewShiftName(String(v?.target?.value ?? v))} placeholder="e.g. Morning Shift, Night Shift" required/>
            <SelectField label="Shift Type" value={newShiftType} onChange={(v: any) => setNewShiftType(String(v?.target?.value ?? v))} options={["Fixed","Flexible","Rotational","Split"]}/>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-600">Start Time</label>
                <input type="time" value={newShiftStart} onChange={e=>setNewShiftStart(e.target.value)} className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#5C5CFF]"/>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-600">End Time</label>
                <input type="time" value={newShiftEnd} onChange={e=>setNewShiftEnd(e.target.value)} className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#5C5CFF]"/>
              </div>
            </div>
            <SelectField label="Working Days" value={newShiftDays} onChange={(v: any) => setNewShiftDays(String(v?.target?.value ?? v))} options={["Mon - Fri","Mon - Sat","Sun - Thu","Mon - Sun","Custom"]}/>
            <SelectField label="Grace Period" value={newShiftGrace} onChange={(v: any) => setNewShiftGrace(String(v?.target?.value ?? v))} options={["No grace","5 min","10 min","15 min","20 min","30 min"]}/>
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
              <Btn variant="outline" onClick={()=>setShowAddShift(false)}>Cancel</Btn>
              <Btn onClick={handleAddShiftSubmit} disabled={!newShiftName.trim()}>Create Shift</Btn>
            </div>
          </div>
        </Modal>
      )}

      {toastState && (
        <div className="fixed bottom-6 right-6 z-[200] flex items-center gap-3 bg-gray-900 text-white text-xs px-4 py-3 rounded-xl shadow-2xl transition-all animate-bounce-short">
          {toastState.type === "success" ? (
            <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
          ) : (
            <AlertTriangle size={16} className="text-red-400 flex-shrink-0" />
          )}
          <span className="font-medium">{toastState.msg}</span>
          <button onClick={() => setToastState(null)} className="ml-2 text-gray-400 hover:text-white p-0.5">
            <X size={13} />
          </button>
        </div>
      )}
    </div>
  );
}

// ── USER ACCESS CONTROL ────────────────────────────────────────────────────────
function AccessControlSection() {
  const { featurePermissions, savePermissions, companyId } = useAuth();
  const [nav, setNav] = useState<ACNav>("Permission Matrix");
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [expandedRole, setExpandedRole] = useState<string|null>("HR Admin");
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string|null>(null);

  const [matrix, setMatrix] = useState<FeaturePermissions>(featurePermissions);

  useEffect(() => {
    setMatrix(featurePermissions);
  }, [featurePermissions]);

  const togglePermission = (roleKey: keyof FeaturePermissions, featureKey: string) => {
    setMatrix((prev) => {
      const currentList = prev[roleKey] || [];
      const updatedList = currentList.includes(featureKey)
        ? currentList.filter((f) => f !== featureKey)
        : [...currentList, featureKey];
      return { ...prev, [roleKey]: updatedList };
    });
  };

  const handleSaveMatrix = async () => {
    setSaving(true);
    try {
      await savePermissions(matrix);
      setToastMsg("Permissions saved to Firebase! Changes updated in real-time for all users.");
      setTimeout(() => setToastMsg(null), 3500);
    } catch (err) {
      console.error("Failed to save permissions:", err);
    } finally {
      setSaving(false);
    }
  };

  const ROLES = [
    {name:"Super Admin",desc:"Full platform access — all modules, all data",users:1,color:"#EF4444",permissions:["All Modules","All Data","System Config","Billing","Audit"]},
    {name:"HR Admin",desc:"Full HR operations — employees, attendance, leave",users:3,color:"#5C5CFF",permissions:["Employees","Attendance","Leave","Organization","Reports","Announcements"]},
    {name:"Manager",desc:"Team management, approve leave and attendance",users:24,color:"#F59E0B",permissions:["Team View","Approve Leave","Approve Attendance","Reports (Team)"]},
    {name:"Employee",desc:"Self-service — own attendance, leave, documents",users:819,color:"#22C55E",permissions:["My Space","Own Leave","Own Attendance","Own Documents"]},
  ];
  const MODULES = ["My Space","Team","Organization","Attendance","Leave","Documents","Tasks","Reports","Settings","Access Control","Announcements"];

  const MATRIX_ROWS = [
    { key: "my-space", label: "Dashboard / My Space", action: "Access & View Dashboard" },
    { key: "dashboard-approval", label: "", action: "View Approvals Tab (Dashboard)" },
    { key: "dashboard-leave", label: "", action: "View Leave Tab (Dashboard)" },
    
    { key: "team", label: "Team Workspace", action: "View Team Directory & Feed" },
    { key: "create-announcement", label: "", action: "Create Announcements" },
    { key: "team-approval", label: "", action: "View Approvals Tab (Team)" },
    
    { key: "organization", label: "Organization Structure", action: "View & Manage Organization" },
    
    { key: "attendance", label: "Attendance Tracking", action: "Check-in & View Attendance" },
    { key: "approve-attendance", label: "", action: "Approve/Reject Attendance Requests" },
    
    { key: "leave", label: "Leave Management", action: "Apply & Manage Leave" },
    { key: "approve-leave", label: "", action: "Approve/Reject Leave Requests" },
    
    { key: "tasks", label: "Task Allocation", action: "Assign & View Tasks" },
    { key: "create-task", label: "", action: "Create Tasks" },
    
    { key: "documents", label: "Document Hub", action: "Access & Upload Documents" },
    { key: "reports", label: "Analytics & Reports", action: "View & Export Reports" },
    { key: "approvals", label: "Approval Workflows", action: "Review & Approve Requests" },
    { key: "support", label: "Help & Support", action: "Access Support Center" },
  ];

  return (
    <div className="flex h-full overflow-hidden">
      <div className="w-48 flex-shrink-0 border-r border-gray-200 bg-gray-50 overflow-auto py-3">
        {(["General Roles","Custom Roles","Role Assignment","Permission Matrix","Administrators"] as ACNav[]).map(n=>(
          <button key={n} onClick={()=>setNav(n)} className={cn("w-full text-left px-4 py-2.5 text-xs font-medium transition-colors",nav===n?"bg-white text-[#5C5CFF] border-r-2 border-[#5C5CFF]":"text-gray-600 hover:bg-white hover:text-gray-800")}>{n}</button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-6">

        {nav==="General Roles"&&(
          <div className="max-w-2xl space-y-4">
            <SectionHeader title="General Roles" subtitle="System-defined roles with fixed permission sets">
              <Btn size="sm" onClick={()=>setShowCreateRole(true)}><Plus size={12}/>Create Role</Btn>
            </SectionHeader>
            {ROLES.map(r=>(
              <div key={r.name} className={cn("bg-white border rounded-xl",expandedRole===r.name?"border-[#5C5CFF] ring-1 ring-[#5C5CFF]/20":"border-gray-200")}>
                <div className="flex items-center gap-4 p-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{backgroundColor:r.color+"18"}}><Shield size={18} style={{color:r.color}}/></div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">{r.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{r.desc}</p>
                    <div className="flex flex-wrap gap-1 mt-1.5">{r.permissions.slice(0,3).map(p=><span key={p} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{p}</span>)}{r.permissions.length>3&&<span className="text-[10px] text-gray-400">+{r.permissions.length-3} more</span>}</div>
                  </div>
                  <div className="text-right mr-3 flex-shrink-0"><div className="text-sm font-bold text-gray-800">{r.users}</div><div className="text-[10px] text-gray-400">users</div></div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Btn variant="outline" size="sm" onClick={()=>setExpandedRole(expandedRole===r.name?null:r.name)}><Eye size={12}/>{expandedRole===r.name?"Hide":"View"}</Btn>
                    <Btn variant="ghost" size="sm"><MoreHorizontal size={13}/></Btn>
                  </div>
                </div>
                {expandedRole===r.name&&(
                  <div className="px-4 pb-4 pt-0 border-t border-gray-100">
                    <div className="grid grid-cols-4 gap-2 mt-3 mb-3">
                      {MODULES.map(m=>{
                        const has = r.name==="Super Admin"||(r.name==="HR Admin"&&!["Settings","Access Control"].includes(m))||(r.name==="Manager"&&["My Space","Team","Attendance","Leave","Tasks","Reports"].includes(m))||(r.name==="Employee"&&["My Space","Attendance","Leave","Documents","Tasks"].includes(m));
                        return (<div key={m} className={cn("flex items-center gap-1.5 px-2 py-1.5 rounded text-[10px]",has?"bg-green-50 text-green-700":"bg-gray-50 text-gray-300")}>{has?<Check size={10}/>:<X size={10}/>}{m}</div>);
                      })}
                    </div>
                    <div className="flex gap-2">
                      <Btn size="sm" variant="outline"><Edit size={11}/>Edit Role</Btn>
                      <Btn size="sm" variant="outline"><UserPlus size={11}/>Assign Users</Btn>
                      <Btn size="sm" variant="ghost">Duplicate</Btn>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {nav==="Custom Roles"&&(
          <div className="max-w-2xl space-y-4">
            <SectionHeader title="Custom Roles" subtitle="Create and manage custom permission sets">
              <Btn size="sm" onClick={()=>setShowCreateRole(true)}><Plus size={12}/>Create Custom Role</Btn>
            </SectionHeader>
            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
              <Shield size={32} className="text-gray-200 mx-auto mb-3"/>
              <p className="text-sm font-medium text-gray-700 mb-1">No custom roles created yet</p>
              <p className="text-xs text-gray-400 mb-4">Custom roles let you define granular permissions tailored to your organization's needs.</p>
              <Btn size="sm" onClick={()=>setShowCreateRole(true)}><Plus size={12}/>Create First Custom Role</Btn>
            </div>
          </div>
        )}

        {nav==="Role Assignment"&&(
          <div className="max-w-3xl space-y-4">
            <SectionHeader title="Role Assignment" subtitle="Assign and manage user roles">
              <Btn size="sm"><Plus size={12}/>Assign Role</Btn>
            </SectionHeader>
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <TableHead cols={["User","Current Role","Department","Assigned By","Assigned On","Actions"]}/>
                <tbody className="divide-y divide-gray-100">
                  {EMPLOYEES.slice(0,8).map((emp,i)=>{
                    const roles = ["Employee","Employee","Manager","HR Admin","Manager","Employee","Employee","Employee"];
                    return (
                      <tr key={emp.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3"><div className="flex items-center gap-2"><Avt initials={emp.initials} color={emp.color} size="sm"/><div><p className="text-xs font-medium text-gray-800">{emp.name}</p><p className="text-[10px] text-gray-400">{emp.email}</p></div></div></td>
                        <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded font-medium" style={{backgroundColor:roles[i]==="HR Admin"?"#EEF2FF":roles[i]==="Manager"?"#FFF7ED":"#F3F4F6",color:roles[i]==="HR Admin"?"#5C5CFF":roles[i]==="Manager"?"#D97706":"#6B7280"}}>{roles[i]}</span></td>
                        <td className="px-4 py-3 text-xs text-gray-500">{emp.dept}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">Super Admin</td>
                        <td className="px-4 py-3 text-xs text-gray-400">{fmtDate(emp.joinDate)}</td>
                        <td className="px-4 py-3"><button className="text-xs text-[#5C5CFF] hover:underline">Change</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {nav==="Permission Matrix"&&(
          <div className="max-w-4xl space-y-4">
            {toastMsg && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-700 flex items-center gap-2">
                <CheckCircle size={14} className="text-green-600 flex-shrink-0" />
                <span>{toastMsg}</span>
              </div>
            )}
            <SectionHeader title="Permission Matrix" subtitle="Control feature & module access per role in real-time">
              <Btn size="sm" variant="outline" onClick={() => setMatrix(DEFAULT_FEATURE_PERMISSIONS)}>Reset Defaults</Btn>
              <Btn size="sm" onClick={handleSaveMatrix} disabled={saving}>
                {saving ? <RefreshCw size={12} className="animate-spin" /> : <Check size={12} />}
                {saving ? "Saving..." : "Save Changes"}
              </Btn>
            </SectionHeader>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase w-48">Module / Feature</th>
                    <th className="px-3 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase w-48">Action</th>
                    <th className="px-3 py-3 text-center text-[10px] font-semibold text-red-600 uppercase w-28">Super Admin</th>
                    <th className="px-3 py-3 text-center text-[10px] font-semibold text-[#5C5CFF] uppercase w-28">HR Admin</th>
                    <th className="px-3 py-3 text-center text-[10px] font-semibold text-amber-600 uppercase w-28">Manager</th>
                    <th className="px-3 py-3 text-center text-[10px] font-semibold text-green-600 uppercase w-28">Employee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {MATRIX_ROWS.map((row) => {
                    const rolesList: (keyof FeaturePermissions)[] = ["admin", "hr_admin", "manager", "employee"];
                    return (
                      <tr key={row.key} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-4 py-3 text-xs">
                          {row.label ? (
                            <span className="font-semibold text-gray-800">{row.label}</span>
                          ) : (
                            <div className="flex items-center gap-2 pl-4 text-gray-400">
                              <div className="w-3 h-px bg-gray-300" />
                            </div>
                          )}
                        </td>
                        <td className={cn("px-3 py-3 text-xs", row.label ? "text-gray-600 font-medium" : "text-gray-500")}>{row.action}</td>
                        {rolesList.map((roleKey) => {
                          const isChecked = (matrix[roleKey] || []).includes(row.key);
                          return (
                            <td key={roleKey} className="px-3 py-3 text-center">
                              <div
                                onClick={() => togglePermission(roleKey, row.key)}
                                className={cn(
                                  "w-5 h-5 rounded-md border mx-auto flex items-center justify-center cursor-pointer transition-all",
                                  isChecked
                                    ? "bg-[#5C5CFF] border-[#5C5CFF] text-white shadow-sm"
                                    : "border-gray-300 hover:border-[#5C5CFF]/60 bg-white"
                                )}
                              >
                                {isChecked && <Check size={12} strokeWidth={2.5} />}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {nav==="Administrators"&&(
          <div className="max-w-2xl space-y-4">
            <SectionHeader title="Administrators" subtitle="Users with elevated system access">
              <Btn size="sm"><UserPlus size={12}/>Add Administrator</Btn>
            </SectionHeader>
            {[{name:"Alex Admin",email:"alex.admin@acmecorp.com",role:"Super Admin",color:"#EF4444",since:"Jan 15, 2021"},{name:"Aisha Thompson",email:"aisha.t@acmecorp.com",role:"HR Admin",color:"#5C5CFF",since:"Apr 18, 2019"},{name:"David Chen",email:"david.chen@acmecorp.com",role:"HR Admin",color:"#F59E0B",since:"Nov 5, 2018"}].map((a,i)=>(
              <div key={a.email} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
                <Avt initials={a.name.split(" ").map(n=>n[0]).join("")} color={a.color} size="lg"/>
                <div className="flex-1"><p className="text-sm font-semibold text-gray-800">{a.name}</p><p className="text-xs text-gray-500">{a.email}</p><p className="text-[10px] text-gray-400 mt-0.5">Since {a.since}</p></div>
                <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{backgroundColor:a.color+"18",color:a.color}}>{a.role}</span>
                <div className="flex gap-2"><Btn variant="outline" size="sm"><Edit size={12}/>Edit</Btn>{i>0&&<Btn variant="ghost" size="sm" className="text-red-500 hover:bg-red-50">Remove</Btn>}</div>
              </div>
            ))}
          </div>
        )}

      </div>

      {showCreateRole&&(
        <Modal title="Create Custom Role" onClose={()=>setShowCreateRole(false)} width="max-w-xl">
          <div className="space-y-4">
            <InputField label="Role Name" placeholder="e.g. Finance Manager" required/>
            <InputField label="Description" placeholder="Describe this role's purpose"/>
            <SelectField label="Base Permissions From" options={["Start from scratch","Employee","Manager","HR Admin","Super Admin"]}/>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-semibold text-gray-700 mb-3">Module Permissions</p>
              <div className="space-y-2">
                {["My Space","Team","Organization","Attendance","Leave","Documents","Reports"].map(mod=>(
                  <div key={mod} className="flex items-center justify-between py-1">
                    <span className="text-sm text-gray-700">{mod}</span>
                    <div className="flex gap-3">{["View","Edit","Delete","Export"].map(p=><label key={p} className="flex items-center gap-1 text-[10px] text-gray-500 cursor-pointer"><input type="checkbox" className="rounded accent-[#5C5CFF]"/>{p}</label>)}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-200"><Btn variant="outline" onClick={()=>setShowCreateRole(false)}>Cancel</Btn><Btn onClick={()=>setShowCreateRole(false)}>Create Role</Btn></div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── MANAGE SERVICES ────────────────────────────────────────────────────────────
function ManageServicesSection() {
  const [services, setServices] = useState([
    {id:"attendance",name:"Attendance",desc:"Track employee check-ins, check-outs and work hours",icon:Clock,enabled:true,license:"847/1000 users"},
    {id:"leave",name:"Leave Management",desc:"Manage leave requests, approvals and balances",icon:CalendarDays,enabled:true,license:"847/1000 users"},
    {id:"tasks",name:"Tasks",desc:"Assign and track employee tasks and projects",icon:ClipboardList,enabled:true,license:"847/1000 users"},
    {id:"documents",name:"Documents",desc:"Centralized document storage and management",icon:FileText,enabled:true,license:"Unlimited"},
    {id:"announcements",name:"Announcements",desc:"Company-wide announcements and notifications",icon:Megaphone,enabled:true,license:"Unlimited"},
    {id:"calendar",name:"Calendar",desc:"Unified calendar for events, leave and schedules",icon:CalendarDays,enabled:true,license:"Unlimited"},
    {id:"ai",name:"AI Assistant",desc:"AI-powered HR copilot and smart suggestions",icon:Bot,enabled:true,license:"Beta"},
    {id:"notifications",name:"Notifications",desc:"Email, push and in-app notification delivery",icon:Bell,enabled:true,license:"Unlimited"},
  ]);
  const toggle = (id:string) => setServices(s=>s.map(svc=>svc.id===id?{...svc,enabled:!svc.enabled}:svc));

  return (
    <div className="flex-1 overflow-auto p-6">
      <SectionHeader title="Manage Services" subtitle="Enable or disable platform modules for your organization"/>
      <div className="grid grid-cols-2 gap-4 max-w-3xl">
        {services.map(svc=>(
          <div key={svc.id} className={cn("bg-white border rounded-xl p-5 transition-all",svc.enabled?"border-gray-200":"border-gray-200 opacity-60")}>
            <div className="flex items-start justify-between mb-3">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center",svc.enabled?"bg-[#EEF2FF]":"bg-gray-100")}>
                <svc.icon size={18} className={svc.enabled?"text-[#5C5CFF]":"text-gray-400"}/>
              </div>
              <Toggle on={svc.enabled} onChange={()=>toggle(svc.id)}/>
            </div>
            <h4 className="text-sm font-semibold text-gray-800 mb-0.5">{svc.name}</h4>
            <p className="text-xs text-gray-500 mb-3">{svc.desc}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5"><Database size={11} className="text-gray-400"/><span className="text-[10px] text-gray-400">{svc.license}</span></div>
              {svc.enabled&&<button className="text-[10px] text-[#5C5CFF] hover:underline">Configure</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── AUTOMATION ─────────────────────────────────────────────────────────────────
function AutomationSection() {
  const [nav, setNav] = useState<AutomNav>("Approval Workflows");
  const [showCreateWf, setShowCreateWf] = useState(false);

  const WORKFLOWS = [
    {name:"Leave Approval",trigger:"Leave Request Submitted",levels:["Direct Manager","HR Manager"],auto:"3 days",active:true,color:"#5C5CFF"},
    {name:"Attendance Correction",trigger:"Correction Request Submitted",levels:["Direct Manager"],auto:"2 days",active:true,color:"#22C55E"},
    {name:"Work From Home",trigger:"WFH Request Submitted",levels:["Direct Manager"],auto:"1 day",active:true,color:"#F59E0B"},
    {name:"Department Transfer",trigger:"Transfer Request Submitted",levels:["Current Manager","HR Admin","Target Manager"],auto:"5 days",active:false,color:"#8B5CF6"},
    {name:"Shift Change",trigger:"Shift Change Request",levels:["HR Admin"],auto:"2 days",active:true,color:"#EF4444"},
  ];

  return (
    <div className="flex h-full overflow-hidden">
      <div className="w-48 flex-shrink-0 border-r border-gray-200 bg-gray-50 overflow-auto py-3">
        {(["Approval Workflows","Attendance Automation","Leave Automation","Shift Automation","Notification Automation","Business Rules","Scheduled Jobs"] as AutomNav[]).map(n=>(
          <button key={n} onClick={()=>setNav(n)} className={cn("w-full text-left px-4 py-2.5 text-xs font-medium transition-colors",nav===n?"bg-white text-[#5C5CFF] border-r-2 border-[#5C5CFF]":"text-gray-600 hover:bg-white hover:text-gray-800")}>{n}</button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-6">

        {nav==="Approval Workflows"&&(
          <div className="max-w-2xl space-y-4">
            <SectionHeader title="Approval Workflows" subtitle="Configure multi-level approval chains">
              <Btn size="sm" onClick={()=>setShowCreateWf(true)}><Plus size={12}/>Create Workflow</Btn>
            </SectionHeader>
            {WORKFLOWS.map(w=>(
              <div key={w.name} className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div><h4 className="text-sm font-semibold text-gray-800">{w.name}</h4><p className="text-xs text-gray-400 mt-0.5">Trigger: {w.trigger}</p></div>
                  <div className="flex items-center gap-2"><Toggle on={w.active} onChange={()=>{}}/><Btn variant="outline" size="sm"><Edit size={11}/>Edit</Btn></div>
                </div>
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  {w.levels.map((l,i)=>(
                    <div key={i} className="flex items-center gap-2">
                      {i>0&&<ArrowRight size={12} className="text-gray-300"/>}
                      <span className="px-2.5 py-1 rounded-lg text-xs font-medium text-white" style={{backgroundColor:w.color}}>L{i+1}: {l}</span>
                    </div>
                  ))}
                  <button className="px-2 py-1 border border-dashed border-gray-300 rounded-lg text-[10px] text-gray-400 hover:border-[#5C5CFF]/40 hover:text-[#5C5CFF] flex items-center gap-1"><Plus size={10}/>Add Level</button>
                </div>
                <p className="text-[10px] text-gray-400">Auto-escalate after {w.auto} · Email + In-App notifications</p>
              </div>
            ))}
          </div>
        )}

        {(nav==="Attendance Automation"||nav==="Leave Automation"||nav==="Shift Automation")&&(
          <div className="max-w-2xl space-y-4">
            <SectionHeader title={nav} subtitle="Configure automated rules and triggers">
              <Btn size="sm"><Plus size={12}/>Add Rule</Btn>
            </SectionHeader>
            {[
              {name:"Auto Mark Late",desc:"Automatically mark employee as late if check-in after grace period",enabled:true},
              {name:"Missing Check-out Alert",desc:"Send notification when employee hasn't checked out by shift end",enabled:true},
              {name:"Consecutive Absence Alert",desc:"Alert HR when employee is absent for 3+ consecutive days",enabled:false},
              {name:"Auto Deduct Leave",desc:"Automatically deduct casual leave for approved late arrivals",enabled:false},
            ].map(rule=>(
              <div key={rule.name} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
                <div className="flex-1"><h4 className="text-sm font-medium text-gray-800">{rule.name}</h4><p className="text-xs text-gray-500 mt-0.5">{rule.desc}</p></div>
                <Toggle on={rule.enabled} onChange={()=>{}}/>
                <Btn variant="ghost" size="sm"><Edit size={12}/></Btn>
              </div>
            ))}
          </div>
        )}

        {nav==="Notification Automation"&&(
          <div className="max-w-2xl space-y-4">
            <SectionHeader title="Notification Automation" subtitle="Configure automated notification triggers">
              <Btn size="sm"><Plus size={12}/>Add Notification</Btn>
            </SectionHeader>
            {[
              {event:"Leave Request Submitted",channels:["Email","In-App"],recipients:["Direct Manager","HR Admin"],enabled:true},
              {event:"Leave Approved/Rejected",channels:["Email","In-App","Push"],recipients:["Requester"],enabled:true},
              {event:"Work Anniversary",channels:["In-App"],recipients:["Employee","Manager"],enabled:true},
              {event:"Birthday Reminder",channels:["In-App"],recipients:["Team Members"],enabled:false},
              {event:"Attendance Exception",channels:["Email"],recipients:["HR Admin","Manager"],enabled:true},
            ].map(n=>(
              <div key={n.event} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-800">{n.event}</h4>
                  <Toggle on={n.enabled} onChange={()=>{}}/>
                </div>
                <div className="flex flex-wrap gap-2 text-[10px]">
                  {n.channels.map(c=><span key={c} className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded">{c}</span>)}
                  {n.recipients.map(r=><span key={r} className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded">→ {r}</span>)}
                </div>
              </div>
            ))}
          </div>
        )}

        {nav==="Business Rules"&&(
          <div className="max-w-2xl space-y-4">
            <SectionHeader title="Business Rules" subtitle="Custom logic and validation rules">
              <Btn size="sm"><Plus size={12}/>Create Rule</Btn>
            </SectionHeader>
            {[
              {name:"Minimum Notice Period",rule:"Leave requests must be submitted at least 3 days in advance",type:"Validation",active:true},
              {name:"Maximum WFH Days",rule:"Employees cannot exceed 8 WFH days per month",type:"Limit",active:true},
              {name:"Consecutive Leave Cap",rule:"Maximum 15 consecutive leave days without manager approval at Director level",type:"Validation",active:false},
            ].map(r=>(
              <div key={r.name} className="bg-white border border-gray-200 rounded-xl p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0 mt-0.5"><Zap size={14} className="text-amber-500"/></div>
                <div className="flex-1"><h4 className="text-sm font-medium text-gray-800">{r.name}</h4><p className="text-xs text-gray-500 mt-0.5">{r.rule}</p><span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded mt-1 inline-block">{r.type}</span></div>
                <Toggle on={r.active} onChange={()=>{}}/>
                <Btn variant="ghost" size="sm"><Edit size={12}/></Btn>
              </div>
            ))}
          </div>
        )}

        {nav==="Scheduled Jobs"&&(
          <div className="max-w-3xl space-y-4">
            <SectionHeader title="Scheduled Jobs" subtitle="Automated background tasks">
              <Btn size="sm"><Plus size={12}/>Schedule Job</Btn>
            </SectionHeader>
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <TableHead cols={["Job","Schedule","Last Run","Next Run","Status","Actions"]}/>
                <tbody className="divide-y divide-gray-100">
                  {[
                    ["Attendance Summary Report","Daily · 11:59 PM","Jul 1, 11:59 PM","Jul 2, 11:59 PM","Active"],
                    ["Leave Balance Update","Monthly · 1st","Jul 1","Aug 1","Active"],
                    ["Biometric Sync","Every 15 min","Jul 1, 2:30 PM","Jul 1, 2:45 PM","Active"],
                    ["Payroll Data Export","Monthly · 25th","Jun 25","Jul 25","Active"],
                    ["Audit Log Archive","Weekly · Sunday","Jun 30","Jul 7","Paused"],
                  ].map(([job,sched,last,next,status])=>(
                    <tr key={job} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">{job}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{sched}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{last}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{next}</td>
                      <td className="px-4 py-3"><StatusBadge status={status==="Active"?"Active":"Pending"}/></td>
                      <td className="px-4 py-3 flex gap-1"><button className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600" title="Run Now"><RefreshCw size={12}/></button><button className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"><Edit size={12}/></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {showCreateWf&&(
        <Modal title="Create Approval Workflow" onClose={()=>setShowCreateWf(false)} width="max-w-xl">
          <div className="space-y-4">
            <InputField label="Workflow Name" placeholder="e.g. Overtime Approval" required/>
            <SelectField label="Trigger Event" options={["Leave Request","Attendance Correction","WFH Request","Shift Change","Department Transfer","Custom"]} required/>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Approval Levels</p>
              {["Level 1: Direct Manager","Level 2: HR Admin"].map((l,i)=>(
                <div key={i} className="flex items-center gap-2 mb-2"><span className="text-xs text-[#5C5CFF] bg-[#EEF2FF] px-2.5 py-1 rounded-lg font-medium">{l}</span><button className="text-xs text-red-400 hover:text-red-600"><X size={12}/></button></div>
              ))}
              <button className="flex items-center gap-1 text-xs text-[#5C5CFF] hover:underline"><Plus size={11}/>Add Level</button>
            </div>
            <SelectField label="Auto-Escalate After" options={["1 day","2 days","3 days","5 days","1 week"]}/>
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-200"><Btn variant="outline" onClick={()=>setShowCreateWf(false)}>Cancel</Btn><Btn onClick={()=>setShowCreateWf(false)}>Create Workflow</Btn></div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── APPROVALS ──────────────────────────────────────────────────────────────────
function ApprovalsSection() {
  const [nav, setNav] = useState<ApprovalNav>("Leave");
  const [approvals, setApprovals] = useState([
    {id:"A1",type:"Leave",employee:"Sarah Mitchell",dept:"Engineering",detail:"Annual Leave · 5 days · Jul 5–9",applied:"Jun 28",status:"Pending"},
    {id:"A2",type:"Leave",employee:"Yuki Tanaka",dept:"Engineering",detail:"Casual Leave · 1 day · Jul 4",applied:"Jul 2",status:"Pending"},
    {id:"A3",type:"Attendance",employee:"Marcus Johnson",dept:"Product",detail:"Missing check-out · Jul 1",applied:"Jul 1",status:"Pending"},
    {id:"A4",type:"Shift",employee:"Priya Sharma",dept:"Design",detail:"Shift change · General → Morning",applied:"Jun 29",status:"Pending"},
    {id:"A5",type:"Department",employee:"Robert Kim",dept:"Finance",detail:"Transfer · Finance → Operations",applied:"Jun 28",status:"Pending"},
    {id:"A6",type:"Leave",employee:"Marcus Johnson",dept:"Product",detail:"Sick Leave · 2 days",applied:"Jun 28",status:"Approved"},
    {id:"A7",type:"Attendance",employee:"James O'Brien",dept:"Sales",detail:"Late arrival correction",applied:"Jun 27",status:"Rejected"},
  ]);
  const approveFn = (id:string) => setApprovals(a=>a.map(x=>x.id===id?{...x,status:"Approved"}:x));
  const rejectFn  = (id:string) => setApprovals(a=>a.map(x=>x.id===id?{...x,status:"Rejected"}:x));

  const navItems: ApprovalNav[] = ["Attendance","Leave","Shift","Department","Employee","Delegation","Approval Matrix","History"];
  const activeApprovals = approvals.filter(a=>
    nav==="History"?a.status!=="Pending":
    nav==="Approval Matrix"?true:
    a.type===nav&&a.status==="Pending"
  );
  const pendingCount = (type:string) => approvals.filter(a=>a.type===type&&a.status==="Pending").length;

  return (
    <div className="flex h-full overflow-hidden">
      <div className="w-48 flex-shrink-0 border-r border-gray-200 bg-gray-50 overflow-auto py-3">
        {navItems.map(n=>(
          <button key={n} onClick={()=>setNav(n)} className={cn("w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium transition-colors",nav===n?"bg-white text-[#5C5CFF] border-r-2 border-[#5C5CFF]":"text-gray-600 hover:bg-white hover:text-gray-800")}>
            {n}
            {["Attendance","Leave","Shift","Department","Employee"].includes(n)&&pendingCount(n)>0&&(
              <span className="w-4 h-4 bg-amber-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{pendingCount(n)}</span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-6">

        {nav==="Approval Matrix"&&(
          <div className="max-w-3xl space-y-4">
            <SectionHeader title="Approval Matrix" subtitle="Configure who approves what across the organization"/>
            {[
              {type:"Leave Request",chain:["Direct Manager","HR Manager"],notify:["Requester","HR"],auto:"3 days"},
              {type:"Attendance Correction",chain:["Direct Manager"],notify:["Requester"],auto:"2 days"},
              {type:"Work From Home",chain:["Direct Manager"],notify:["Requester"],auto:"1 day"},
              {type:"Shift Change",chain:["HR Admin"],notify:["Requester","Manager"],auto:"2 days"},
              {type:"Department Transfer",chain:["Current Manager","HR Admin","Target Manager"],notify:["Requester","Both Managers"],auto:"5 days"},
            ].map(m=>(
              <div key={m.type} className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3"><h4 className="text-sm font-semibold text-gray-800">{m.type}</h4><Btn variant="outline" size="sm"><Edit size={11}/>Edit</Btn></div>
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  {m.chain.map((c,i)=><React.Fragment key={i}>{i>0&&<ArrowRight size={12} className="text-gray-300"/>}<span className="px-2.5 py-1 bg-[#EEF2FF] text-[#5C5CFF] rounded-lg text-xs font-medium">L{i+1}: {c}</span></React.Fragment>)}
                </div>
                <p className="text-[10px] text-gray-400">Auto-escalate after {m.auto} · Notify: {m.notify.join(", ")}</p>
              </div>
            ))}
          </div>
        )}

        {nav==="History"&&(
          <div className="max-w-3xl space-y-4">
            <SectionHeader title="Approval History" subtitle="All past approvals and rejections">
              <Btn variant="outline" size="sm"><Download size={12}/>Export</Btn>
            </SectionHeader>
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <TableHead cols={["Employee","Type","Details","Applied","Status","Reviewed By"]}/>
                <tbody className="divide-y divide-gray-100">
                  {approvals.filter(a=>a.status!=="Pending").map(a=>(
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3"><div className="flex items-center gap-2"><Avt initials={a.employee.split(" ").map(n=>n[0]).join("")} color={EMP_COLORS[parseInt(a.id.slice(-1))%EMP_COLORS.length]} size="sm"/><span className="text-sm font-medium text-gray-800">{a.employee}</span></div></td>
                      <td className="px-4 py-3"><span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{a.type}</span></td>
                      <td className="px-4 py-3 text-xs text-gray-500">{a.detail}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{a.applied}</td>
                      <td className="px-4 py-3"><StatusBadge status={a.status}/></td>
                      <td className="px-4 py-3 text-xs text-gray-500">Alex Admin</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!["Approval Matrix","History"].includes(nav)&&(
          <div className="max-w-3xl space-y-4">
            <SectionHeader title={`${nav} Approvals`} subtitle={`Pending ${nav.toLowerCase()} approval requests`}>
              {activeApprovals.filter(a=>a.status==="Pending").length>0&&<><Btn variant="outline" size="sm"><Check size={12}/>Approve All</Btn></>}
            </SectionHeader>
            {activeApprovals.length===0?(
              <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
                <CheckCircle size={28} className="text-green-300 mx-auto mb-2"/>
                <p className="text-sm text-gray-500">No pending {nav.toLowerCase()} approvals</p>
              </div>
            ):(
              <div className="space-y-3">
                {activeApprovals.map(a=>(
                  <div key={a.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
                    <Avt initials={a.employee.split(" ").map(n=>n[0]).join("")} color={EMP_COLORS[parseInt(a.id.slice(-1))%EMP_COLORS.length]} size="md"/>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-800">{a.employee}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{a.detail}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{a.dept} · Applied {a.applied}</p>
                    </div>
                    {a.status==="Pending"?(
                      <div className="flex gap-2">
                        <button onClick={()=>approveFn(a.id)} className="px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs font-medium hover:bg-green-100 flex items-center gap-1"><Check size={11}/>Approve</button>
                        <button onClick={()=>rejectFn(a.id)} className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-medium hover:bg-red-100 flex items-center gap-1"><X size={11}/>Reject</button>
                        <button className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-500 hover:bg-gray-50">Comment</button>
                      </div>
                    ):<StatusBadge status={a.status}/>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

// ── AUDIT LOGS ─────────────────────────────────────────────────────────────────
function AuditLogsSection() {
  const [logTab, setLogTab] = useState("All");
  const [search, setSearch] = useState("");
  const LOGS = [
    {id:1,user:"Alex Admin",action:"Approved leave — Sarah Mitchell",module:"Approvals",type:"Leave",time:"Jul 1, 11:32 AM",ip:"192.168.1.12",status:"Success"},
    {id:2,user:"Aisha Thompson",action:"Updated leave policy FY2025",module:"Organization Setup",type:"Config",time:"Jun 30, 3:15 PM",ip:"192.168.1.8",status:"Success"},
    {id:3,user:"Alex Admin",action:"Added employee: Yuki Tanaka",module:"Users",type:"User",time:"Jun 28, 9:45 AM",ip:"192.168.1.12",status:"Success"},
    {id:4,user:"David Chen",action:"Modified shift: Night Shift schedule",module:"Automation",type:"Config",time:"Jun 27, 4:30 PM",ip:"192.168.1.20",status:"Success"},
    {id:5,user:"Unknown",action:"Failed login attempt — 3 tries",module:"Authentication",type:"Login",time:"Jun 27, 2:14 AM",ip:"203.0.113.45",status:"Failed"},
    {id:6,user:"Alex Admin",action:"Role assigned: Manager → Marcus Johnson",module:"Access Control",type:"Permission",time:"Jun 26, 2:00 PM",ip:"192.168.1.12",status:"Success"},
    {id:7,user:"Aisha Thompson",action:"Exported employee data (CSV, 847 records)",module:"Users",type:"Export",time:"Jun 25, 11:22 AM",ip:"192.168.1.8",status:"Success"},
    {id:8,user:"Alex Admin",action:"Created custom role: Finance Manager",module:"Access Control",type:"Permission",time:"Jun 24, 3:45 PM",ip:"192.168.1.12",status:"Success"},
    {id:9,user:"Alex Admin",action:"Enabled AI Assistant module",module:"Manage Services",type:"Config",time:"Jun 23, 10:00 AM",ip:"192.168.1.12",status:"Success"},
    {id:10,user:"System",action:"Scheduled job: Attendance summary completed",module:"Automation",type:"System",time:"Jun 23, 12:00 AM",ip:"Internal",status:"Success"},
  ];
  const TYPE_COLORS: Record<string,string> = {Login:"bg-blue-50 text-blue-600",Config:"bg-purple-50 text-purple-600",User:"bg-green-50 text-green-600",Permission:"bg-amber-50 text-amber-600",Export:"bg-gray-100 text-gray-600",System:"bg-gray-100 text-gray-500"};
  const filtered = LOGS.filter(l=>{
    const matchTab = logTab==="All"||l.type===logTab||(logTab==="Failed"&&l.status==="Failed");
    const matchSearch = !search||l.user.toLowerCase().includes(search.toLowerCase())||l.action.toLowerCase().includes(search.toLowerCase());
    return matchTab&&matchSearch;
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3 flex-shrink-0">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search logs…" className="pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5C5CFF] w-64"/>
        </div>
        <div className="flex gap-1">
          {["All","Login","Config","User","Permission","Export","System","Failed"].map(t=>(
            <button key={t} onClick={()=>setLogTab(t)} className={cn("px-2.5 py-1 text-[10px] font-medium rounded-lg transition-colors",logTab===t?"bg-[#EEF2FF] text-[#5C5CFF]":"text-gray-400 hover:text-gray-600 hover:bg-gray-100")}>{t}</button>
          ))}
        </div>
        <div className="ml-auto flex gap-2">
          <Btn size="sm" variant="outline"><Download size={12}/>Export Logs</Btn>
          <Btn size="sm" variant="outline"><Filter size={12}/>Advanced Filters</Btn>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <TableHead cols={["User","Action","Module","Type","Time","IP","Status"]}/>
          <tbody className="bg-white divide-y divide-gray-100">
            {filtered.map(l=>(
              <tr key={l.id} className="hover:bg-gray-50">
                <td className="px-4 py-3"><div className="flex items-center gap-2"><Avt initials={l.user.split(" ").map(n=>n[0]).join("")} color={EMP_COLORS[l.id%EMP_COLORS.length]} size="sm"/><span className="text-sm font-medium text-gray-800">{l.user}</span></div></td>
                <td className="px-4 py-3 text-xs text-gray-600 max-w-xs">{l.action}</td>
                <td className="px-4 py-3"><span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{l.module}</span></td>
                <td className="px-4 py-3"><span className={cn("text-[10px] px-2 py-0.5 rounded font-medium",TYPE_COLORS[l.type]||"bg-gray-100 text-gray-500")}>{l.type}</span></td>
                <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{l.time}</td>
                <td className="px-4 py-3 font-mono text-[10px] text-gray-400">{l.ip}</td>
                <td className="px-4 py-3"><span className={cn("text-xs font-medium px-2 py-0.5 rounded",l.status==="Success"?"bg-green-50 text-green-600":"bg-red-50 text-red-600")}>{l.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-gray-200 px-5 py-2.5 flex items-center justify-between flex-shrink-0 bg-white">
        <span className="text-xs text-gray-400">{filtered.length} events</span>
        <div className="flex items-center gap-1">
          <button className="px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded">Previous</button>
          {[1,2,3].map(p=><button key={p} className={cn("w-7 h-7 text-xs rounded",p===1?"bg-[#5C5CFF] text-white":"text-gray-500 hover:bg-gray-100")}>{p}</button>)}
          <button className="px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded">Next</button>
        </div>
      </div>
    </div>
  );
}

// ── MAIN MANAGE ACCOUNT PAGE ───────────────────────────────────────────────────
export function ManageAccountPage({ onBack, initialSection = "Users" }: { onBack: () => void; initialSection?: MASection }) {
  const [section, setSection] = useState<MASection>(initialSection);
  const NAV: { id: MASection; icon: any; label: string }[] = [
    {id:"Users",icon:Users,label:"Users"},
    {id:"Organization Setup",icon:Building2,label:"Organization Setup"},
    {id:"User Access Control",icon:Shield,label:"User Access Control"},
    {id:"Manage Services",icon:Zap,label:"Manage Services"},
    {id:"Automation",icon:RefreshCw,label:"Automation"},
    {id:"Approvals",icon:CheckCircle,label:"Approvals"},
    {id:"Audit Logs",icon:Activity,label:"Audit Logs"},
  ];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Top bar */}
      <div className="h-12 bg-white border-b border-gray-200 flex items-center flex-shrink-0 px-4 gap-4">
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#5C5CFF] transition-colors flex-shrink-0">
          <ChevronLeft size={15}/><span className="font-medium">Settings</span>
        </button>
        <div className="w-px h-4 bg-gray-200"/>
        <div className="flex gap-1 overflow-x-auto">
          {NAV.map(n=>(
            <button key={n.id} onClick={()=>setSection(n.id)} className={cn("flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors flex-shrink-0",section===n.id?"bg-[#EEF2FF] text-[#5C5CFF]":"text-gray-500 hover:text-gray-700 hover:bg-gray-100")}>
              <n.icon size={13}/>{n.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex-shrink-0">
          <span className="text-[10px] bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full font-medium">Admin Console</span>
        </div>
      </div>

      {/* Section content */}
      <div className="flex-1 overflow-hidden">
        {section==="Users"&&<UsersSection/>}
        {section==="Organization Setup"&&<OrgSetupSection/>}
        {section==="User Access Control"&&<AccessControlSection/>}
        {section==="Manage Services"&&<ManageServicesSection/>}
        {section==="Automation"&&<AutomationSection/>}
        {section==="Approvals"&&<ApprovalsSection/>}
        {section==="Audit Logs"&&<AuditLogsSection/>}
      </div>
    </div>
  );
}
