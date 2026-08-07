import React, { useState, useEffect } from "react";
import {
  Edit,
  Key,
  Upload,
  Mail,
  Phone,
  Monitor,
  CheckCircle,
  CalendarDays,
  Clock,
} from "lucide-react";
import { AppPage } from "@/shared/types";
import { cn } from "@/shared/utils";
import {
  Btn,
  InputField,
  SelectField,
  Avt,
  PageHeader,
  Modal,
} from "@/shared/components";
import { useAuth } from "@/shared/context/AuthContext";
import { db } from "@/shared/utils/firebase";
import { doc, onSnapshot } from "firebase/firestore";

export function ViewProfilePage({ navigate }: { navigate: (p: AppPage) => void }) {
  const { email, companyId } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  
  const [tab, setTab] = useState("Personal");
  const [editMode, setEditMode] = useState(false);
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const toast = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  useEffect(() => {
    if (!email || !companyId) return;
    const userRef = doc(db, "organizations", companyId, "users", email);
    const unsub = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        setProfileData(snap.data());
      }
    });
    return () => unsub();
  }, [email, companyId]);

  const firstName = profileData?.firstName || profileData?.name?.split(" ")[0] || "User";
  const lastName = profileData?.lastName || profileData?.name?.split(" ").slice(1).join(" ") || "";
  const fullName = profileData?.name || `${firstName} ${lastName}`.trim() || "User Name";
  const initials = firstName[0] + (lastName[0] || "");
  const role = profileData?.designation || profileData?.role || "Employee";
  const dept = profileData?.dept || "Company";
  const phone = profileData?.phone || "—";
  const address = profileData?.address || "—";
  const gender = profileData?.gender || "Prefer not to say";
  const dob = profileData?.dob || "—";
  const joinDate = profileData?.joinDate || "—";
  const empId = profileData?.employeeId || profileData?.id || "—";
  const branch = profileData?.branch || "HQ";
  const empType = profileData?.empType || "Full-Time";
  const manager = profileData?.manager || "—";
  const shift = profileData?.shift || "General (9AM–6PM)";

  const SESSIONS = [
    {
      device: "Chrome on macOS",
      location: "New York, USA",
      time: "Now · Current session",
      current: true,
    },
    { device: "Safari on iPhone 15", location: "New York, USA", time: "2 hours ago" },
    { device: "Chrome on Windows", location: "Chicago, USA", time: "Jun 28, 2024" },
  ];
  const CONNECTED = [
    { name: "Google Workspace", icon: "G", connected: true, last: "Jun 25" },
    { name: "Microsoft 365", icon: "M", connected: false, last: "—" },
    { name: "Slack", icon: "S", connected: true, last: "Jun 28" },
  ];

  return (
    <div className="flex flex-col h-full text-left">
      <PageHeader
        title="My Profile"
        breadcrumbs={[
          { label: "Home", onClick: () => navigate("my-space") },
          { label: "Profile" },
        ]}
      />
      <div className="flex-1 overflow-auto p-6 max-w-4xl mx-auto w-full">
        {/* Profile Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 flex items-center gap-6">
          <div className="relative">
            <Avt initials={initials} color="#5C5CFF" size="xl" />
            <button
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#5C5CFF] flex items-center justify-center border-2 border-white hover:bg-[#4A4AE0] transition-colors cursor-pointer"
              onClick={() => toast()}
            >
              <Upload size={11} className="text-white" />
            </button>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900">{fullName}</h2>
            <p className="text-sm text-gray-500">{role} · {dept}</p>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-xs text-gray-555 flex items-center gap-1">
                <Mail size={12} />
                {email || "email@example.com"}
              </span>
              <span className="text-xs text-gray-555 flex items-center gap-1">
                <Phone size={12} />
                {phone}
              </span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-xs text-gray-400 mb-1">Member since</div>
            <div className="text-sm font-medium text-gray-805">{joinDate}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200 px-4">
            <div className="flex gap-0 overflow-x-auto">
              {[
                "Personal",
                "Employment",
                "Security",
                "Devices",
                "Sessions",
                "Preferences",
                "Notifications",
              ].map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    "px-4 py-3 text-xs font-medium border-b-2 whitespace-nowrap transition-colors cursor-pointer",
                    tab === t
                      ? "border-[#5C5CFF] text-[#5C5CFF]"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="p-5">
            {tab === "Personal" && (
              <div className="grid grid-cols-2 gap-4">
                {editMode ? (
                  <>
                    <InputField label="First Name" defaultValue="Alex" />
                    <InputField label="Last Name" defaultValue="Admin" />
                    <InputField label="Work Email" type="email" defaultValue="alex.admin@acmecorp.com" />
                    <InputField label="Phone" type="tel" defaultValue="+1 (555) 000-0001" />
                    <InputField label="Date of Birth" type="date" />
                    <SelectField label="Gender">
                      <option>Prefer not to say</option>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Non-binary</option>
                    </SelectField>
                    <div className="col-span-2">
                      <InputField label="Address" placeholder="Street, City, State, ZIP" defaultValue={address} />
                    </div>
                  </>
                ) : (
                  (
                    [
                      ["First Name", firstName],
                      ["Last Name", lastName],
                      ["Work Email", email || "—"],
                      ["Phone", phone],
                      ["Date of Birth", dob],
                      ["Gender", gender],
                      ["Address", address],
                    ] as [string, string][]
                  ).map(([k, v]) => (
                    <div key={k}>
                      <p className="text-xs text-gray-400 mb-0.5">{k}</p>
                      <p className="text-sm font-medium text-gray-805">{v}</p>
                    </div>
                  ))
                )}
              </div>
            )}
            {tab === "Employment" && (
              <div className="grid grid-cols-2 gap-4">
                {(
                  [
                    ["Employee ID", empId],
                    ["Join Date", joinDate],
                    ["Department", dept],
                    ["Designation", role],
                    ["Branch", branch],
                    ["Employment Type", empType],
                    ["Reporting Manager", manager],
                    ["Shift", shift],
                  ] as [string, string][]
                ).map(([k, v]) => (
                  <div key={k}>
                    <p className="text-xs text-gray-400 mb-0.5">{k}</p>
                    <p className="text-sm font-medium text-gray-805">{v}</p>
                  </div>
                ))}
              </div>
            )}
            {tab === "Security" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-sm font-semibold text-gray-805">Password</p>
                    <p className="text-xs text-gray-400">Last changed 30 days ago</p>
                  </div>
                  <Btn variant="outline" size="sm" onClick={() => setShowChangePwd(true)}>
                    <Key size={12} />
                    Change Password
                  </Btn>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-sm font-semibold text-gray-855">
                      Two-Factor Authentication
                    </p>
                    <p className="text-xs text-gray-400">
                      Enabled via Authenticator App
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-green-600 font-medium">Active</span>
                    <div className="w-9 h-5 rounded-full bg-green-400 flex items-center px-0.5 cursor-pointer">
                      <div className="w-4 h-4 rounded-full bg-white ml-auto shadow-sm" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-sm font-semibold text-gray-805">
                      Login Notifications
                    </p>
                    <p className="text-xs text-gray-400">
                      Email alert on new sign-in
                    </p>
                  </div>
                  <div className="w-9 h-5 rounded-full bg-[#5C5CFF] flex items-center px-0.5 cursor-pointer">
                    <div className="w-4 h-4 rounded-full bg-white ml-auto shadow-sm" />
                  </div>
                </div>
              </div>
            )}
            {tab === "Devices" && (
              <div className="space-y-3">
                {CONNECTED.map((d) => (
                  <div
                    key={d.name}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl"
                  >
                    <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center font-bold text-gray-655 text-sm">
                      {d.icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-805">{d.name}</p>
                      <p className="text-xs text-gray-400">Last sync: {d.last}</p>
                    </div>
                    {d.connected ? (
                      <Btn size="sm" variant="outline" onClick={() => toast()}>
                        Disconnect
                      </Btn>
                    ) : (
                      <Btn size="sm" onClick={() => toast()}>
                        Connect
                      </Btn>
                    )}
                  </div>
                ))}
              </div>
            )}
            {tab === "Sessions" && (
              <div className="space-y-3">
                {SESSIONS.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl"
                  >
                    <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                      <Monitor size={15} className="text-gray-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-805">
                        {s.device}
                      </p>
                      <p className="text-xs text-gray-400">
                        {s.location} · {s.time}
                      </p>
                    </div>
                    {s.current ? (
                      <span className="text-xs text-green-600 font-medium px-2 py-0.5 bg-green-50 rounded-full">
                        Current
                      </span>
                    ) : (
                      <button
                        onClick={() => toast()}
                        className="text-xs text-red-505 hover:text-red-700 font-medium cursor-pointer"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => toast()}
                  className="text-xs text-red-505 hover:text-red-700 font-medium mt-1 cursor-pointer"
                >
                  Revoke all other sessions
                </button>
              </div>
            )}
            {tab === "Preferences" && (
              <div className="space-y-4">
                {(
                  [
                    ["Theme", "System Default", ["Light", "Dark", "System Default"]],
                    [
                      "Language",
                      "English (US)",
                      ["English (US)", "English (UK)", "Spanish", "French"],
                    ],
                    ["Date Format", "MM/DD/YYYY", ["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"]],
                    ["Time Format", "12-hour", ["12-hour", "24-hour"]],
                  ] as [string, string, string[]][]
                ).map(([label, def, opts]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                  >
                    <p className="text-sm font-medium text-gray-805">{label}</p>
                    <select
                      defaultValue={def}
                      className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#5C5CFF]"
                    >
                      {opts.map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}
            {tab === "Notifications" && (
              <div className="space-y-3">
                {(
                  [
                    ["Leave Requests", "Email + In-app", true],
                    ["Attendance Alerts", "In-app only", true],
                    ["Task Assignments", "Email + In-app", true],
                    ["System Updates", "Email", false],
                    ["Announcements", "In-app only", true],
                    ["Approval Decisions", "Email + In-app", true],
                  ] as [string, string, boolean][]
                ).map(([label, method, enabled]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-808">{label}</p>
                      <p className="text-xs text-gray-400">{method}</p>
                    </div>
                    <div
                      className={cn(
                        "w-9 h-5 rounded-full flex items-center px-0.5 cursor-pointer transition-colors",
                        enabled ? "bg-[#5C5CFF]" : "bg-gray-200"
                      )}
                    >
                      <div
                        className={cn(
                          "w-4 h-4 rounded-full bg-white shadow-sm transition-transform",
                          enabled && "translate-x-4"
                        )}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showChangePwd && (
        <Modal
          title="Change Password"
          onClose={() => setShowChangePwd(false)}
          width="max-w-sm"
        >
          <div className="space-y-3">
            <InputField label="Current Password" type="password" />
            <InputField label="New Password" type="password" />
            <InputField label="Confirm New Password" type="password" />
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
              <Btn variant="outline" onClick={() => setShowChangePwd(false)}>
                Cancel
              </Btn>
              <Btn
                onClick={() => {
                  setShowChangePwd(false);
                  toast();
                }}
              >
                Update Password
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium">
          <CheckCircle size={15} className="text-green-400" />
          Changes saved successfully.
        </div>
      )}
    </div>
  );
}
