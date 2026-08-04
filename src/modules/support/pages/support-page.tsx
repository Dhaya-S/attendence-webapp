import React, { useState } from "react";
import {
  Search,
  MessageCircle,
  Send,
  BookOpen,
  AlertCircle,
  Star,
  FileText,
  Info,
  Shield,
  Lock,
  ArrowRight,
  Users,
  Clock,
  CalendarDays,
  ClipboardList,
  Building2,
  Settings,
  X,
  CheckCircle,
} from "lucide-react";
import { AppPage } from "@/shared/types";
import { cn } from "@/shared/utils";
import {
  Btn,
  InputField,
  SelectField,
  Modal,
  PageHeader,
} from "@/shared/components";

export function SupportPage({ navigate }: { navigate: (p: AppPage) => void }) {
  const [modal, setModal] = useState<string | null>(null);
  const [tab, setTab] = useState("Home");
  const [chatMsg, setChatMsg] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: string; text: string }[]>([
    {
      role: "agent",
      text: "Hi! I'm the support assistant. How can I help you today?",
    },
  ]);
  const [ticketForm, setTicketForm] = useState({
    subject: "",
    priority: "Medium",
    category: "Technical",
    desc: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const sendChat = () => {
    if (!chatMsg.trim()) return;
    const msg = chatMsg;
    setChatMsg("");
    setChatHistory((h) => [...h, { role: "user", text: msg }]);
    setTimeout(
      () =>
        setChatHistory((h) => [
          ...h,
          {
            role: "agent",
            text:
              "Thanks for reaching out! Our team will look into this. In the meantime, you can check our documentation for quick answers.",
          },
        ]),
      800
    );
  };

  const ARTICLES = [
    {
      title: "Getting started with Attendance HRMS",
      category: "Onboarding",
      views: 1243,
    },
    { title: "How to configure shift policies", category: "Operations", views: 892 },
    { title: "Setting up approval workflows", category: "Approvals", views: 754 },
    { title: "Managing leave balances and types", category: "Leave", views: 631 },
    { title: "Bulk importing employees via CSV", category: "Employees", views: 589 },
    {
      title: "Geo-fencing setup for remote workers",
      category: "Attendance",
      views: 412,
    },
  ];

  return (
    <div className="flex flex-col h-full text-left">
      <PageHeader
        title="Help &amp; Support"
        breadcrumbs={[
          { label: "Home", onClick: () => navigate("my-space") },
          { label: "Help & Support" },
        ]}
      />
      <div className="flex-1 overflow-auto">
        {/* Tab bar */}
        <div className="bg-white border-b border-gray-200 px-6">
          <div className="flex gap-0">
            {["Home", "Documentation", "Knowledge Base", "Release Notes"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "px-4 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer",
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

        <div className="p-6 max-w-5xl mx-auto space-y-6">
          {tab === "Home" && (
            <>
              {/* Hero */}
              <div className="bg-gradient-to-br from-[#5C5CFF] to-[#4A4AE0] rounded-2xl p-8 text-white text-center">
                <h2 className="text-2xl font-semibold mb-2">How can we help you?</h2>
                <p className="text-white/70 text-sm mb-5">
                  Search our knowledge base or reach out directly
                </p>
                <div className="relative max-w-md mx-auto">
                  <Search
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50"
                  />
                  <input
                    type="text"
                    placeholder="Search for answers…"
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm"
                  />
                </div>
              </div>

              {/* Primary CTAs */}
              <div className="grid grid-cols-3 gap-4">
                {(
                  [
                    {
                      icon: MessageCircle,
                      label: "Live Chat",
                      desc: "Chat with support in real time",
                      color: "#5C5CFF",
                      action: "chat",
                    },
                    {
                      icon: Send,
                      label: "Raise a Ticket",
                      desc: "Submit a support request",
                      color: "#22C55E",
                      action: "ticket",
                    },
                    {
                      icon: BookOpen,
                      label: "Knowledge Base",
                      desc: "Browse articles and guides",
                      color: "#F59E0B",
                      action: () => setTab("Knowledge Base"),
                    },
                  ] as any[]
                ).map((s) => (
                  <button
                    key={s.label}
                    onClick={() =>
                      typeof s.action === "string" ? setModal(s.action) : s.action()
                    }
                    className="bg-white rounded-xl border border-gray-200 p-5 text-left hover:border-[#5C5CFF]/40 hover:shadow-sm transition-all group cursor-pointer"
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                      style={{ backgroundColor: s.color + "18" }}
                    >
                      <s.icon size={18} style={{ color: s.color }} />
                    </div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-1">
                      {s.label}
                    </h4>
                    <p className="text-xs text-gray-505">{s.desc}</p>
                  </button>
                ))}
              </div>

              {/* Secondary CTAs */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3">
                    More Options
                  </h4>
                  <div className="space-y-1">
                    {(
                      [
                        { icon: AlertCircle, label: "Report a Bug", action: "bug" },
                        {
                          icon: Star,
                          label: "Feature Request",
                          action: "feature",
                        },
                        {
                          icon: FileText,
                          label: "Release Notes",
                          action: () => setTab("Release Notes"),
                        },
                        { icon: Info, label: "About Product", action: "about" },
                      ] as any[]
                    ).map((item) => (
                      <button
                        key={item.label}
                        onClick={() =>
                          typeof item.action === "string"
                            ? setModal(item.action)
                            : item.action()
                        }
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 text-left transition-colors cursor-pointer"
                      >
                        <item.icon
                          size={14}
                          className="text-gray-400 flex-shrink-0"
                        />
                        <span className="text-sm text-gray-700">{item.label}</span>
                        <ArrowRight size={13} className="ml-auto text-gray-300" />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3">Legal</h4>
                  <div className="space-y-1">
                    {(
                      [
                        { icon: Shield, label: "Privacy Policy", action: "privacy" },
                        {
                          icon: FileText,
                          label: "Terms of Service",
                          action: "terms",
                        },
                        {
                          icon: Lock,
                          label: "Security Policy",
                          action: "security",
                        },
                      ] as any[]
                    ).map((item) => (
                      <button
                        key={item.label}
                        onClick={() => setModal(item.action)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 text-left transition-colors cursor-pointer"
                      >
                        <item.icon
                          size={14}
                          className="text-gray-400 flex-shrink-0"
                        />
                        <span className="text-sm text-gray-700">{item.label}</span>
                        <ArrowRight size={13} className="ml-auto text-gray-300" />
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-405">
                      Attendance HRMS v2.4.1 · © 2024 Acme Corp
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {tab === "Documentation" && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {(
                  [
                    { icon: Users, label: "Employee Management", count: 24 },
                    { icon: Clock, label: "Attendance & Shifts", count: 18 },
                    { icon: CalendarDays, label: "Leave Management", count: 15 },
                    { icon: ClipboardList, label: "Tasks & Approvals", count: 12 },
                    { icon: Building2, label: "Organization Setup", count: 20 },
                    { icon: Settings, label: "System Configuration", count: 31 },
                  ] as any[]
                ).map((cat) => (
                  <button
                    key={cat.label}
                    className="bg-white rounded-xl border border-gray-200 p-4 text-left hover:border-[#5C5CFF]/40 hover:shadow-sm transition-all cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-lg bg-[#EEF2FF] flex items-center justify-center mb-3">
                      <cat.icon size={16} className="text-[#5C5CFF]" />
                    </div>
                    <p className="text-sm font-semibold text-gray-800">
                      {cat.label}
                    </p>
                    <p className="text-xs text-gray-505 mt-0.5">
                      {cat.count} articles
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {tab === "Knowledge Base" && (
            <div className="space-y-3">
              {ARTICLES.map((a, i) => (
                <button
                  key={i}
                  className="w-full bg-white rounded-xl border border-gray-200 p-4 text-left flex items-center gap-4 hover:border-[#5C5CFF]/40 hover:shadow-sm transition-all cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                    <BookOpen size={15} className="text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{a.title}</p>
                    <p className="text-xs text-gray-505 mt-0.5">
                      {a.category} · {a.views.toLocaleString()} views
                    </p>
                  </div>
                  <ArrowRight size={14} className="text-gray-300 flex-shrink-0" />
                </button>
              ))}
            </div>
          )}

          {tab === "Release Notes" && (
            <div className="space-y-4">
              {(
                [
                  {
                    version: "2.4.1",
                    date: "Jun 28, 2024",
                    notes: [
                      "Fixed attendance sync for biometric devices",
                      "Improved leave balance calculation",
                      "Bug fix: shift overlap detection",
                    ],
                  },
                  {
                    version: "2.4.0",
                    date: "Jun 10, 2024",
                    notes: [
                      "New: Geo-fence attendance tracking",
                      "New: Bulk employee import via CSV",
                      "Improved: Dashboard analytics performance",
                      "New: Notification preferences",
                    ],
                  },
                  {
                    version: "2.3.5",
                    date: "May 22, 2024",
                    notes: [
                      "Fixed approval email notifications",
                      "New: Department hierarchy view",
                      "Improved: Mobile responsiveness",
                    ],
                  },
                ] as any[]
              ).map((r) => (
                <div key={r.version} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-sm font-bold text-[#5C5CFF]">
                      v{r.version}
                    </span>
                    <span className="text-xs text-gray-400">{r.date}</span>
                    {r.version === "2.4.1" && (
                      <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">
                        Latest
                      </span>
                    )}
                  </div>
                  <ul className="space-y-1.5">
                    {r.notes.map((n: string, i: number) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-gray-655"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-[#5C5CFF] mt-1.5 flex-shrink-0" />
                        {n}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Live Chat Modal ── */}
      {modal === "chat" && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-end p-6"
          onClick={() => setModal(null)}
        >
          <div className="absolute inset-0 bg-black/20" />
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-80 flex flex-col"
            style={{ height: "480px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-4 py-3.5 bg-[#5C5CFF] rounded-t-2xl">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <MessageCircle size={14} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">Live Support</p>
                <p className="text-[10px] text-white/70 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-300 rounded-full inline-block" />
                  Online · avg reply &lt;2 min
                </p>
              </div>
              <button
                onClick={() => setModal(null)}
                className="text-white/60 hover:text-white cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 space-y-3">
              {chatHistory.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex",
                    m.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm",
                      m.role === "user"
                        ? "bg-[#5C5CFF] text-white"
                        : "bg-gray-100 text-gray-800"
                    )}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="px-3 py-3 border-t border-gray-100 flex gap-2">
              <input
                value={chatMsg}
                onChange={(e) => setChatMsg(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendChat()}
                placeholder="Type a message…"
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5C5CFF] text-gray-900"
              />
              <button
                onClick={sendChat}
                className="w-9 h-9 bg-[#5C5CFF] rounded-lg flex items-center justify-center text-white cursor-pointer"
              >
                <Send size={13} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Raise Ticket Modal ── */}
      {modal === "ticket" && (
        <Modal
          title="Raise a Support Ticket"
          onClose={() => {
            setModal(null);
            setSubmitted(false);
          }}
          width="max-w-lg"
        >
          {submitted ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={28} className="text-green-500" />
              </div>
              <p className="text-base font-semibold text-gray-900 mb-1">
                Ticket Submitted!
              </p>
              <p className="text-sm text-gray-505 mb-1">
                Your ticket ID is <strong>#TKT-2024-0847</strong>
              </p>
              <p className="text-xs text-gray-400">
                We'll respond within 4 business hours.
              </p>
              <Btn
                className="mt-5 cursor-pointer"
                onClick={() => {
                  setModal(null);
                  setSubmitted(false);
                }}
              >
                Done
              </Btn>
            </div>
          ) : (
            <div className="space-y-3">
              <InputField
                label="Subject"
                value={ticketForm.subject}
                onChange={(e: any) =>
                  setTicketForm((p) => ({ ...p, subject: e.target.value }))
                }
                placeholder="Brief description of the issue"
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <SelectField
                  label="Priority"
                  value={ticketForm.priority}
                  onChange={(e: any) =>
                    setTicketForm((p) => ({ ...p, priority: e.target.value }))
                  }
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                  <option>Critical</option>
                </SelectField>
                <SelectField
                  label="Category"
                  value={ticketForm.category}
                  onChange={(e: any) =>
                    setTicketForm((p) => ({ ...p, category: e.target.value }))
                  }
                >
                  <option>Technical</option>
                  <option>Billing</option>
                  <option>Feature</option>
                  <option>Other</option>
                </SelectField>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">
                  Description <span className="text-red-555">*</span>
                </label>
                <textarea
                  rows={4}
                  value={ticketForm.desc}
                  onChange={(e) =>
                    setTicketForm((p) => ({ ...p, desc: e.target.value }))
                  }
                  placeholder="Describe the issue in detail…"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#5C5CFF] text-gray-900"
                />
              </div>
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-3 text-center cursor-pointer hover:border-[#5C5CFF]/40 transition-colors">
                <p className="text-xs text-gray-400">
                  Attach screenshots (optional) · Click to upload
                </p>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                <Btn variant="outline" onClick={() => setModal(null)}>
                  Cancel
                </Btn>
                <Btn onClick={() => setSubmitted(true)}>Submit Ticket</Btn>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* ── Report Bug Modal ── */}
      {modal === "bug" && (
        <Modal title="Report a Bug" onClose={() => setModal(null)} width="max-w-md">
          <div className="space-y-3">
            <InputField label="Bug Title" placeholder="What went wrong?" required />
            <SelectField label="Severity">
              <option>Minor</option>
              <option>Major</option>
              <option>Critical</option>
            </SelectField>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">
                Steps to Reproduce
              </label>
              <textarea
                rows={3}
                placeholder="1. Go to…&#10;2. Click on…&#10;3. See error"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#5C5CFF] text-gray-900"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
              <Btn variant="outline" onClick={() => setModal(null)}>
                Cancel
              </Btn>
              <Btn onClick={() => setModal("bug-sent")}>Submit Bug Report</Btn>
            </div>
          </div>
        </Modal>
      )}
      {modal === "bug-sent" && (
        <Modal title="Bug Reported" onClose={() => setModal(null)}>
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
              <CheckCircle size={24} className="text-green-500" />
            </div>
            <p className="text-sm font-semibold text-gray-900 mb-1">
              Bug report submitted
            </p>
            <p className="text-xs text-gray-400">
              Our engineering team will investigate. Ref: #BUG-2024-0441
            </p>
            <Btn className="mt-4 cursor-pointer" onClick={() => setModal(null)}>
              Close
            </Btn>
          </div>
        </Modal>
      )}

      {/* ── Feature Request Modal ── */}
      {modal === "feature" && (
        <Modal title="Feature Request" onClose={() => setModal(null)} width="max-w-md">
          <div className="space-y-3">
            <InputField
              label="Feature Title"
              placeholder="What would you like to see?"
              required
            />
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">
                Description
              </label>
              <textarea
                rows={4}
                placeholder="Describe the feature and its use case…"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#5C5CFF] text-gray-900"
              />
            </div>
            <SelectField label="Priority">
              <option>Nice to have</option>
              <option>Important</option>
              <option>Critical</option>
            </SelectField>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
              <Btn variant="outline" onClick={() => setModal(null)}>
                Cancel
              </Btn>
              <Btn onClick={() => setModal(null)}>Submit Request</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* ── About Modal ── */}
      {modal === "about" && (
        <Modal title="About Attendance HRMS" onClose={() => setModal(null)} width="max-w-sm">
          <div className="text-center py-4 space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-[#5C5CFF] flex items-center justify-center mx-auto">
              <Users size={28} className="text-white" />
            </div>
            <div>
              <p className="text-base font-bold text-gray-900">Attendance HRMS</p>
              <p className="text-xs text-gray-400">Enterprise Edition · v2.4.1</p>
            </div>
            <div className="text-xs text-gray-505 space-y-0.5">
              <p>Build: 2024.06.28</p>
              <p>License: Enterprise · Acme Corporation</p>
              <p>Support: support@attendancehrms.com</p>
            </div>
            <Btn className="w-full justify-center cursor-pointer" onClick={() => setModal(null)}>
              Close
            </Btn>
          </div>
        </Modal>
      )}

      {/* ── Privacy / Terms / Security Modals ── */}
      {(modal === "privacy" || modal === "terms" || modal === "security") && (
        <Modal
          title={
            modal === "privacy"
              ? "Privacy Policy"
              : modal === "terms"
              ? "Terms of Service"
              : "Security Policy"
          }
          onClose={() => setModal(null)}
          width="max-w-lg"
        >
          <div className="prose prose-sm max-w-none text-gray-655 space-y-3 max-h-80 overflow-auto text-left">
            <p className="font-semibold text-gray-805">
              {modal === "privacy"
                ? "Last updated: June 1, 2024"
                : modal === "terms"
                ? "Effective: January 1, 2024"
                : "Version: 3.0 · June 2024"}
            </p>
            {modal === "privacy" && (
              <>
                <p>
                  Attendance HRMS collects and processes personal data in accordance
                  with applicable data protection laws including GDPR and CCPA. Data
                  is used solely for HR management purposes and is never sold to
                  third parties.
                </p>
                <p>
                  Employee data including attendance records, personal information,
                  and employment history is stored securely using AES-256 encryption
                  at rest and TLS 1.3 in transit.
                </p>
                <p>
                  You have the right to access, correct, and delete your personal
                  data at any time by contacting your HR administrator.
                </p>
              </>
            )}
            {modal === "terms" && (
              <>
                <p>
                  By accessing or using Attendance HRMS, you agree to be bound by
                  these Terms of Service. The software is licensed, not sold. Your
                  organization's administrator is responsible for proper use and
                  configuration.
                </p>
                <p>
                  Attendance HRMS is provided "as is" for enterprise HR management.
                  Usage is subject to your organization's license agreement with Acme
                  Corporation.
                </p>
              </>
            )}
            {modal === "security" && (
              <>
                <p>
                  Attendance HRMS implements enterprise-grade security including
                  multi-factor authentication, role-based access control, and
                  comprehensive audit logging.
                </p>
                <p>
                  All data transmissions are encrypted using TLS 1.3. Data at rest
                  uses AES-256 encryption. Regular security audits are conducted by
                  third-party firms.
                </p>
              </>
            )}
          </div>
          <div className="flex justify-end mt-4 pt-3 border-t border-gray-200">
            <Btn onClick={() => setModal(null)}>Close</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
