import React from "react";
import { Check, X, ArrowDownRight } from "lucide-react";
import { cn, fmtDate } from "@/shared/utils";
import { Avt, StatusBadge, Drawer, Btn } from "@/shared/components";
import { EMP_COLORS } from "@/shared/constants/colors";

interface ApprovalsTabProps {
  teamReqs: any[];
  tApprovalDetailId: string | null;
  setTApprovalDetailId: (id: string | null) => void;
  approveT: (id: string) => void;
  rejectT: (id: string) => void;
}

export function ApprovalsTab({
  teamReqs,
  tApprovalDetailId,
  setTApprovalDetailId,
  approveT,
  rejectT,
}: ApprovalsTabProps) {
  return (
    <div className="flex h-full overflow-hidden w-full text-left">
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-auto p-5">
          <div className="bg-white rounded-xl border border-gray-200">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {["Employee", "Type", "Details", "Applied", "Status", "Actions"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {teamReqs.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => setTApprovalDetailId(r.id)}
                    className={cn(
                      "cursor-pointer hover:bg-gray-50 transition-colors",
                      tApprovalDetailId === r.id && "bg-[#EEF2FF]"
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avt
                          initials={r.employee
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")}
                          color={
                            EMP_COLORS[
                              parseInt(r.id.slice(-1)) % EMP_COLORS.length
                            ]
                          }
                          size="sm"
                        />
                        <span className="font-medium text-gray-808 text-xs">
                          {r.employee}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{r.type}</td>
                    <td className="px-4 py-3 text-gray-505 text-xs max-w-[180px] truncate">
                      {fmtDate(r.from)} – {fmtDate(r.to)} · {r.days}d
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {fmtDate(r.applied)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      {r.status === "Pending" && (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => approveT(r.id)}
                            className="px-2.5 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-semibold hover:bg-green-100 flex items-center gap-1 cursor-pointer border-0"
                          >
                            <Check size={10} />
                            Approve
                          </button>
                          <button
                            onClick={() => rejectT(r.id)}
                            className="px-2.5 py-1 bg-red-50 text-red-650 rounded-lg text-xs font-semibold hover:bg-red-100 flex items-center gap-1 cursor-pointer border-0"
                          >
                            <X size={10} />
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* Drawer Detail Panel */}
      <Drawer
        isOpen={!!tApprovalDetailId}
        onClose={() => setTApprovalDetailId(null)}
        title={
          (() => {
            const req = teamReqs.find((r) => r.id === tApprovalDetailId);
            return req ? req.employee : "Approval Details";
          })()
        }
        headerAddon={
          (() => {
            const req = teamReqs.find((r) => r.id === tApprovalDetailId);
            return req ? <StatusBadge status={req.status} /> : null;
          })()
        }
        avatar={
          (() => {
            const req = teamReqs.find((r) => r.id === tApprovalDetailId);
            if (!req) return null;
            return (
              <Avt
                initials={req.employee
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")}
                color={EMP_COLORS[parseInt(req.id.slice(-1)) % EMP_COLORS.length]}
                size="md"
              />
            );
          })()
        }
        footer={
          (() => {
            const req = teamReqs.find((r) => r.id === tApprovalDetailId);
            if (!req || req.status !== "Pending") return null;
            return (
              <>
                <Btn
                  variant="outline"
                  className="border-red-200 text-red-650 hover:bg-red-50"
                  onClick={() => {
                    rejectT(req.id);
                    setTApprovalDetailId(null);
                  }}
                >
                  <X size={14} />
                  Reject Request
                </Btn>
                <Btn
                  variant="primary"
                  className="bg-green-600 hover:bg-green-700 focus:ring-green-500 text-white"
                  onClick={() => {
                    approveT(req.id);
                    setTApprovalDetailId(null);
                  }}
                >
                  <Check size={14} />
                  Approve Request
                </Btn>
              </>
            );
          })()
        }
      >
        {(() => {
          const req = teamReqs.find((r) => r.id === tApprovalDetailId);
          if (!req) return null;

          const reason =
            req.reason ||
            "Scheduled family vacation. Handover completed to the team lead.";
          const leaveBalance = [
            { type: "Annual Leave", total: 18, used: 12, color: "bg-indigo-500" },
            { type: "Sick Leave", total: 10, used: 2, color: "bg-red-500" },
            { type: "Casual Leave", total: 6, used: 3, color: "bg-amber-500" },
          ];

          return (
            <div className="space-y-6 text-left">
              {/* Key Info Cards */}
              <div className="bg-white rounded-xl border border-gray-150 p-4 shadow-sm space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Request Details
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                      Leave Type
                    </p>
                    <p className="text-xs font-semibold text-gray-808 mt-1">
                      {req.type}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                      Department
                    </p>
                    <p className="text-xs font-semibold text-gray-808 mt-1">
                      Engineering
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                      Duration
                    </p>
                    <p className="text-xs font-semibold text-gray-855 mt-1">
                      {req.days} days ({fmtDate(req.from)} – {fmtDate(req.to)})
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                      Applied On
                    </p>
                    <p className="text-xs font-semibold text-gray-855 mt-1">
                      {fmtDate(req.applied)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div className="bg-white rounded-xl border border-gray-155 p-4 shadow-sm space-y-2">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Reason
                </h4>
                <p className="text-xs text-gray-750 leading-relaxed font-semibold">
                  {reason}
                </p>
              </div>

              {/* Leave Balance */}
              <div className="bg-white rounded-xl border border-gray-155 p-4 shadow-sm space-y-3.5">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Leave Balance
                </h4>
                <div className="space-y-2.5">
                  {leaveBalance.map((b) => (
                    <div key={b.type} className="text-xs">
                      <div className="flex justify-between font-semibold text-gray-700 mb-1">
                        <span>{b.type}</span>
                        <span>
                          {b.total - b.used} / {b.total} Days Left
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={cn("h-full rounded-full", b.color)}
                          style={{
                            width: `${((b.total - b.used) / b.total) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Attachments */}
              <div className="bg-white rounded-xl border border-gray-155 p-4 shadow-sm space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Attachments
                </h4>
                <div className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100/70 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-red-50 text-red-500 rounded flex items-center justify-center font-bold text-xs">
                      PDF
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-gray-808">
                        flight_tickets.pdf
                      </p>
                      <p className="text-[10px] text-gray-400">1.2 MB · Document</p>
                    </div>
                  </div>
                  <ArrowDownRight
                    className="text-gray-405 hover:text-gray-600"
                    size={14}
                  />
                </div>
              </div>

              {/* Approver Timeline / History */}
              <div className="bg-white rounded-xl border border-gray-155 p-4 shadow-sm space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Approval History
                </h4>
                <div className="relative border-l-2 border-gray-100 pl-4 ml-1 space-y-4 text-xs">
                  <div className="relative">
                    <span className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full bg-green-500 ring-4 ring-white" />
                    <p className="font-bold text-gray-800">Request Submitted</p>
                    <p className="text-[10px] text-gray-405 mt-0.5">
                      {fmtDate(req.applied)} · System
                    </p>
                  </div>
                  <div className="relative">
                    <span
                      className={cn(
                        "absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full ring-4 ring-white",
                        req.status === "Pending"
                          ? "bg-amber-400"
                          : req.status === "Approved"
                          ? "bg-green-500"
                          : "bg-red-500"
                      )}
                    />
                    <p className="font-bold text-gray-800">Manager Review</p>
                    <p className="text-[10px] text-gray-455 mt-0.5">
                      {req.status === "Pending"
                        ? "Awaiting review from Alex Admin (Manager)"
                        : req.status === "Approved"
                        ? "Approved by Alex Admin (Manager)"
                        : "Rejected by Alex Admin (Manager)"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </Drawer>
    </div>
  );
}
