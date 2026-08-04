import React, { useState } from "react";
import {
  Search,
  UserX,
  Clock,
  CheckCircle,
  CalendarDays,
  BarChart2,
  ClipboardList,
  Building2,
  Bot,
  X,
  ArrowRight,
  Send,
} from "lucide-react";
import { AppPage } from "@/shared/types";
import { cn } from "@/shared/utils";

export function AIPanel({
  onClose,
  navigate,
}: {
  onClose: () => void;
  navigate: (p: AppPage) => void;
}) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const COMMANDS = [
    {
      label: "Search Employees",
      icon: Search,
      action: () => navigate("organization"),
      reply: "Opening Employee Directory…",
    },
    {
      label: "Show Today's Absentees",
      icon: UserX,
      action: () => navigate("attendance"),
      reply:
        "Today: 17 absent, 14 missing check-outs. Opening Attendance Exceptions…",
    },
    {
      label: "Show Missing Check-ins",
      icon: Clock,
      action: () => navigate("attendance"),
      reply: "8 employees haven't checked in yet. Opening Attendance…",
    },
    {
      label: "Review Pending Approvals",
      icon: CheckCircle,
      action: () => navigate("my-space"),
      reply:
        "17 approvals pending: 3 leave, 8 attendance, 6 access control. Opening approvals…",
    },
    {
      label: "Open Leave Requests",
      icon: CalendarDays,
      action: () => navigate("leave"),
      reply: "3 leave requests awaiting approval. Opening Leave…",
    },
    {
      label: "Generate Attendance Summary",
      icon: BarChart2,
      action: () => navigate("attendance"),
      reply:
        "Today: 734 present (86.7%), 32 late, 17 absent, 21 WFH, 43 on leave. Opening Attendance…",
    },
    {
      label: "Create Task",
      icon: ClipboardList,
      action: () => navigate("tasks"),
      reply: "Opening task creation…",
    },
    {
      label: "Open Organization",
      icon: Building2,
      action: () => navigate("organization"),
      reply: "Opening Organization module…",
    },
  ];

  const SUGGESTIONS = [
    "How many employees are on leave today?",
    "Show attendance exceptions",
    "Find employees in Engineering",
    "What needs my attention today?",
  ];

  const send = (text: string) => {
    const q = text || input;
    if (!q.trim()) return;
    setMessages((m) => [...m, { role: "user", content: q }]);
    setInput("");
    setLoading(true);
    setTimeout(() => {
      let reply = "Let me look that up for you.";
      const ql = q.toLowerCase();
      if (ql.includes("leave")) {
        reply =
          "Currently 43 employees on leave. 3 requests pending approval. Opening Leave…";
        setTimeout(() => navigate("leave"), 1500);
      } else if (
        ql.includes("absent") ||
        ql.includes("exception") ||
        ql.includes("check-in") ||
        ql.includes("attendance")
      ) {
        reply =
          "Today: 734 present, 32 late, 17 absent. 14 missing check-outs need review. Opening Attendance…";
        setTimeout(() => navigate("attendance"), 1500);
      } else if (
        ql.includes("engineer") ||
        ql.includes("employee") ||
        ql.includes("find") ||
        ql.includes("search")
      ) {
        reply =
          "Engineering has 234 employees. Opening Organization → Employees…";
        setTimeout(() => navigate("organization"), 1500);
      } else if (ql.includes("task")) {
        reply =
          "You have 5 open tasks: 2 high priority, 2 overdue. Opening Tasks…";
        setTimeout(() => navigate("tasks"), 1500);
      } else if (
        ql.includes("approval") ||
        ql.includes("pending") ||
        ql.includes("attention")
      ) {
        reply =
          "17 pending approvals: 3 leave requests, 8 attendance corrections, 6 access reviews. Opening My Space…";
        setTimeout(() => navigate("my-space"), 1500);
      } else if (ql.includes("summary") || ql.includes("report")) {
        reply =
          "Organization health is at 82%. Attendance avg: 95.8%. Headcount: 847 (+12 this month). See Reports for full details.";
      }
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
      setLoading(false);
    }, 900);
  };

  const runCommand = (cmd: (typeof COMMANDS)[0]) => {
    setMessages((m) => [
      ...m,
      { role: "user", content: cmd.label },
      { role: "assistant", content: cmd.reply },
    ]);
    setTimeout(cmd.action, 1200);
  };

  return (
    <div className="fixed right-0 top-0 bottom-0 w-80 bg-white border-l border-gray-200 flex flex-col z-30 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-200 flex-shrink-0 bg-gradient-to-r from-[#EEF2FF] to-white">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#5C5CFF] flex items-center justify-center shadow-sm">
            <Bot size={15} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">AI Assistant</p>
            <p className="text-[10px] text-green-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block" />
              Online
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <X size={15} />
        </button>
      </div>

      {/* Command shortcuts — shown when no messages */}
      {messages.length === 0 && (
        <div className="flex-1 overflow-auto">
          <div className="p-4">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Quick Commands
            </p>
            <div className="space-y-1">
              {COMMANDS.map((cmd) => (
                <button
                  key={cmd.label}
                  onClick={() => runCommand(cmd)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#EEF2FF] hover:text-[#5C5CFF] text-left transition-colors group border border-transparent hover:border-[#5C5CFF]/20"
                >
                  <cmd.icon
                    size={14}
                    className="text-gray-400 group-hover:text-[#5C5CFF] flex-shrink-0"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-[#5C5CFF]">
                    {cmd.label}
                  </span>
                  <ArrowRight
                    size={12}
                    className="ml-auto text-gray-300 group-hover:text-[#5C5CFF]"
                  />
                </button>
              ))}
            </div>
          </div>
          <div className="px-4 pb-4">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5">
              Smart Suggestions
            </p>
            <div className="space-y-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="w-full text-left text-xs text-gray-600 px-3 py-2 bg-gray-50 hover:bg-[#EEF2FF] hover:text-[#5C5CFF] rounded-lg transition-colors border border-gray-100"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      {messages.length > 0 && (
        <div className="flex-1 overflow-auto p-4 space-y-3">
          {messages.map((m, i) => (
            <div
              key={i}
              className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
            >
              {m.role === "assistant" && (
                <div className="w-6 h-6 rounded-full bg-[#5C5CFF] flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                  <Bot size={11} className="text-white" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed",
                  m.role === "user"
                    ? "bg-[#5C5CFF] text-white rounded-br-sm"
                    : "bg-gray-100 text-gray-800 rounded-bl-sm"
                )}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#5C5CFF] flex items-center justify-center flex-shrink-0">
                <Bot size={11} className="text-white" />
              </div>
              <div className="bg-gray-100 rounded-xl px-3.5 py-2.5">
                <div className="flex gap-1">
                  {[0, 150, 300].map((d) => (
                    <div
                      key={d}
                      className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: `${d}ms` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          <button
            onClick={() => setMessages([])}
            className="w-full text-center text-[10px] text-gray-400 hover:text-[#5C5CFF] py-1"
          >
            ← Back to commands
          </button>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-200 p-3 flex-shrink-0">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send(input)}
            placeholder="Ask me anything…"
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5C5CFF] bg-gray-50 focus:bg-white transition-colors"
          />
          <button
            onClick={() => send(input)}
            className="w-9 h-9 bg-[#5C5CFF] rounded-lg flex items-center justify-center text-white hover:bg-[#4A4AE0] transition-colors flex-shrink-0 disabled:opacity-50"
            disabled={!input.trim()}
          >
            <Send size={13} />
          </button>
        </div>
        <p className="text-[10px] text-gray-400 mt-1.5 text-center">
          Ctrl+K to open · Esc to close
        </p>
      </div>
    </div>
  );
}
