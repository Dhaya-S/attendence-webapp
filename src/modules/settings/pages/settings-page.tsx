import React, { useState } from "react";
import {
  Settings,
  Eye,
  Bell,
  Shield,
  Globe,
  Users,
  Info,
  CheckCircle,
} from "lucide-react";
import { AppPage } from "@/shared/types";
import { cn } from "@/shared/utils";
import {
  Btn,
  InputField,
  SelectField,
  PageHeader,
} from "@/shared/components";
import { ManageAccountPage } from "./manage-account-page";
import { useAuth } from "@/shared/context/AuthContext";

export function SettingsPage({ navigate }: { navigate: (p: AppPage) => void }) {
  const [section, setSection] = useState("General");
  const [settingsToast, setSettingsToast] = useState(false);
  const showSettingsToast = () => {
    setSettingsToast(true);
    setTimeout(() => setSettingsToast(false), 2000);
  };
  const [privacyToggles, setPrivacyToggles] = useState([true, true, false, true]);
  const togglePrivacy = (i: number) =>
    setPrivacyToggles((p) => p.map((v, j) => (j === i ? !v : v)));
  const [notifChannels, setNotifChannels] = useState([true, true, false, false]);
  const toggleNotifChannel = (i: number) =>
    setNotifChannels((p) => p.map((v, j) => (j === i ? !v : v)));
  const [notifTopics, setNotifTopics] = useState([true, true, true, false, true]);
  const toggleNotifTopic = (i: number) =>
    setNotifTopics((p) => p.map((v, j) => (j === i ? !v : v)));

  // If Manage Account is active, render it full-screen
  if (section === "Manage Account") {
    return <ManageAccountPage onBack={() => setSection("General")} />;
  }

  const { role, hasPermission } = useAuth();
  const isAdmin = ["super_admin", "admin", "hr_admin"].includes(String(role || "").toLowerCase());

  const NAV = [
    { id: "General", icon: Settings, label: "General" },
    { id: "Appearance", icon: Eye, label: "Appearance" },
    { id: "Notifications", icon: Bell, label: "Notifications" },
    { id: "Security", icon: Shield, label: "Security" },
    ...(isAdmin ? [{ id: "Integrations", icon: Globe, label: "Integrations", admin: false }] : []),
    ...(isAdmin ? [{ id: "Manage Account", icon: Users, label: "Manage Account", admin: true }] : []),
    { id: "About", icon: Info, label: "About" },
  ];

  return (
    <div className="flex flex-col h-full text-left">
      <PageHeader
        title="Settings"
        breadcrumbs={[
          { label: "Home", onClick: () => navigate("my-space") },
          { label: "Settings" },
        ]}
      />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-52 flex-shrink-0 border-r border-gray-200 bg-gray-50 overflow-auto py-3">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => setSection(n.id)}
              className={cn(
                "w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium transition-colors cursor-pointer",
                section === n.id
                  ? "bg-white text-[#5C5CFF] border-r-2 border-[#5C5CFF]"
                  : "text-gray-600 hover:bg-white hover:text-gray-800",
                n.admin && "mt-4 first-of-type:mt-0"
              )}
            >
              <n.icon
                size={14}
                className={section === n.id ? "text-[#5C5CFF]" : "text-gray-400"}
              />
              {n.label}
              {n.admin && (
                <span className="ml-auto text-[9px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded font-semibold">
                  Admin
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {section === "General" && (
            <div className="max-w-lg space-y-5">
              <h2 className="text-base font-semibold text-gray-900">
                General Settings
              </h2>
              <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                <h4 className="text-sm font-semibold text-gray-800">
                  Language &amp; Region
                </h4>
                <SelectField
                  label="Language"
                  options={[
                    "English (US)",
                    "English (UK)",
                    "French",
                    "German",
                    "Spanish",
                    "Arabic",
                    "Hindi",
                  ]}
                />
                <div className="grid grid-cols-2 gap-4">
                  <SelectField
                    label="Date Format"
                    options={["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"]}
                  />
                  <SelectField
                    label="Time Format"
                    options={["12-hour (AM/PM)", "24-hour"]}
                  />
                </div>
                <SelectField
                  label="Timezone"
                  options={[
                    "(UTC-8) Pacific Time",
                    "(UTC-5) Eastern Time",
                    "(UTC+0) UTC",
                    "(UTC+5:30) IST",
                  ]}
                />
                <div className="pt-1">
                  <Btn size="sm" onClick={showSettingsToast}>
                    Save Changes
                  </Btn>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
                <h4 className="text-sm font-semibold text-gray-800">Privacy</h4>
                {[
                  "Show my profile to team members",
                  "Show my attendance to my manager",
                  "Allow location tracking for WFH",
                  "Share analytics with organization",
                ].map((label, i) => (
                  <div
                    key={label}
                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                  >
                    <span className="text-sm text-gray-700">{label}</span>
                    <button
                      onClick={() => togglePrivacy(i)}
                      className={cn(
                        "w-10 h-5 rounded-full transition-colors flex-shrink-0 relative cursor-pointer",
                        privacyToggles[i] ? "bg-[#5C5CFF]" : "bg-gray-300"
                      )}
                    >
                      <div
                        className={cn(
                          "absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform",
                          privacyToggles[i] ? "left-5" : "left-0.5"
                        )}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === "Appearance" && (
            <div className="max-w-sm space-y-5">
              <h2 className="text-base font-semibold text-gray-900">Appearance</h2>
              <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                <h4 className="text-sm font-semibold text-gray-800">Theme</h4>
                <div className="grid grid-cols-3 gap-3">
                  {["Light", "Dark", "System"].map((t) => (
                    <button
                      key={t}
                      className={cn(
                        "py-3 rounded-lg border text-xs font-medium transition-colors cursor-pointer",
                        t === "Light"
                          ? "border-[#5C5CFF] bg-[#EEF2FF] text-[#5C5CFF]"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
                <h4 className="text-sm font-semibold text-gray-800">
                  Accent Color
                </h4>
                <div className="flex gap-3">
                  {[
                    "#5C5CFF",
                    "#22C55E",
                    "#F59E0B",
                    "#EF4444",
                    "#8B5CF6",
                    "#06B6D4",
                  ].map((c) => (
                    <button
                      key={c}
                      className={cn(
                        "w-8 h-8 rounded-full border-2 transition-all cursor-pointer",
                        c === "#5C5CFF"
                          ? "border-gray-900 scale-110"
                          : "border-transparent hover:scale-105"
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {section === "Notifications" && (
            <div className="max-w-lg space-y-5">
              <h2 className="text-base font-semibold text-gray-900">
                Notifications
              </h2>
              <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
                <h4 className="text-sm font-semibold text-gray-800 mb-1">
                  Channels
                </h4>
                {["Email Notifications", "In-App Notifications", "Push Notifications", "SMS Alerts"].map(
                  (label, i) => (
                    <div
                      key={label}
                      className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                    >
                      <span className="text-sm text-gray-700">{label}</span>
                      <button
                        onClick={() => toggleNotifChannel(i)}
                        className={cn(
                          "w-10 h-5 rounded-full transition-colors flex-shrink-0 relative cursor-pointer",
                          notifChannels[i] ? "bg-[#5C5CFF]" : "bg-gray-300"
                        )}
                      >
                        <div
                          className={cn(
                            "absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform",
                            notifChannels[i] ? "left-5" : "left-0.5"
                          )}
                        />
                      </button>
                    </div>
                  )
                )}
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
                <h4 className="text-sm font-semibold text-gray-800 mb-1">
                  Notify me about
                </h4>
                {[
                  "Leave requests awaiting my approval",
                  "Attendance exceptions",
                  "New announcements",
                  "System updates",
                  "Team activities",
                ].map((label, i) => (
                  <div
                    key={label}
                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                  >
                    <span className="text-sm text-gray-700">{label}</span>
                    <button
                      onClick={() => toggleNotifTopic(i)}
                      className={cn(
                        "w-10 h-5 rounded-full transition-colors flex-shrink-0 relative cursor-pointer",
                        notifTopics[i] ? "bg-[#5C5CFF]" : "bg-gray-300"
                      )}
                    >
                      <div
                        className={cn(
                          "absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform",
                          notifTopics[i] ? "left-5" : "left-0.5"
                        )}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === "Security" && (
            <div className="max-w-lg space-y-5">
              <h2 className="text-base font-semibold text-gray-900">Security</h2>
              <div className="space-y-3">
                {[
                  {
                    label: "Two-Factor Authentication",
                    desc: "Add an extra layer of security to your account",
                    state: "Enabled",
                    action: "Manage",
                    onClick: () => navigate("profile"),
                  },
                  {
                    label: "Active Sessions",
                    desc: "2 devices currently signed in",
                    state: "Active",
                    action: "View All",
                    onClick: () => navigate("profile"),
                  },
                  {
                    label: "Login History",
                    desc: "See recent sign-in activity and locations",
                    state: "",
                    action: "View",
                    onClick: () => navigate("profile"),
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-sm font-medium text-gray-800">
                        {s.label}
                      </h4>
                      <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {s.state && (
                        <span className="text-xs font-medium text-green-600">
                          {s.state}
                        </span>
                      )}
                      <Btn variant="outline" size="sm" onClick={s.onClick}>
                        {s.action}
                      </Btn>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                <h4 className="text-sm font-semibold text-gray-800">
                  Change Password
                </h4>
                <InputField
                  label="Current Password"
                  type="password"
                  placeholder="••••••••"
                />
                <InputField
                  label="New Password"
                  type="password"
                  placeholder="••••••••"
                  required
                />
                <InputField
                  label="Confirm New Password"
                  type="password"
                  placeholder="••••••••"
                  required
                />
                <Btn size="sm" onClick={showSettingsToast}>
                  Update Password
                </Btn>
              </div>
            </div>
          )}

          {section === "Integrations" && (
            <div className="max-w-2xl space-y-5">
              <h2 className="text-base font-semibold text-gray-900">
                Integrations
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  {
                    name: "Google Workspace",
                    desc: "Sync users and calendar events",
                    connected: true,
                    icon: "G",
                  },
                  {
                    name: "Slack",
                    desc: "Send notifications to Slack channels",
                    connected: false,
                    icon: "S",
                  },
                  {
                    name: "Microsoft 365",
                    desc: "Sync with Office 365 and Teams",
                    connected: false,
                    icon: "M",
                  },
                  {
                    name: "BambooHR",
                    desc: "Import employee data from BambooHR",
                    connected: false,
                    icon: "B",
                  },
                  {
                    name: "Zapier",
                    desc: "Automate workflows with 5000+ apps",
                    connected: false,
                    icon: "Z",
                  },
                  {
                    name: "Payroll System",
                    desc: "Sync attendance data for payroll",
                    connected: true,
                    icon: "P",
                  },
                ].map((i) => (
                  <div
                    key={i.name}
                    className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-655 flex-shrink-0">
                      {i.icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{i.name}</p>
                      <p className="text-xs text-gray-400">{i.desc}</p>
                    </div>
                    <Btn size="sm" variant={i.connected ? "outline" : "primary"}>
                      {i.connected ? "Manage" : "Connect"}
                    </Btn>
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === "About" && (
            <div className="max-w-sm space-y-5">
              <h2 className="text-base font-semibold text-gray-900">About</h2>
              <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
                {[
                  ["Product", "Attendance HRMS"],
                  ["Version", "3.2.1"],
                  ["Edition", "Enterprise"],
                  ["License", "Acme Corporation"],
                  ["Users", "847 / 1000"],
                  ["Support", "Priority Support"],
                  ["Expires", "Dec 31, 2025"],
                ].map(([k, v]) => (
                  <div
                    key={k as string}
                    className="flex justify-between text-sm py-1.5 border-b border-gray-100 last:border-0"
                  >
                    <span className="text-gray-500">{k}</span>
                    <span className="font-medium text-gray-800">{v}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <Btn variant="outline" size="sm">
                  Documentation
                </Btn>
                <Btn variant="outline" size="sm">
                  Release Notes
                </Btn>
              </div>
            </div>
          )}
        </div>
      </div>
      {settingsToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg">
          <CheckCircle size={15} className="text-green-400 flex-shrink-0" />
          Settings saved successfully
        </div>
      )}
    </div>
  );
}
