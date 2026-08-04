import React from "react";
import { cn } from "@/shared/utils";

export function StatusBadge({ status }: { status:string }) {
  const map: Record<string,string> = {
    "Active":"bg-green-50 text-green-700 ring-1 ring-green-200",
    "On Leave":"bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    "Inactive":"bg-gray-100 text-gray-500 ring-1 ring-gray-200",
    "Contract":"bg-blue-50 text-blue-700 ring-1 ring-blue-200",
    "Present":"bg-green-50 text-green-700 ring-1 ring-green-200",
    "Absent":"bg-red-50 text-red-700 ring-1 ring-red-200",
    "Late":"bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    "WFH":"bg-blue-50 text-blue-700 ring-1 ring-blue-200",
    "Pending":"bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    "Approved":"bg-green-50 text-green-700 ring-1 ring-green-200",
    "Rejected":"bg-red-50 text-red-700 ring-1 ring-red-200",
    "Published":"bg-green-50 text-green-700 ring-1 ring-green-200",
    "Draft":"bg-gray-100 text-gray-500 ring-1 ring-gray-200",
    "Scheduled":"bg-blue-50 text-blue-700 ring-1 ring-blue-200",
    "Archived":"bg-gray-100 text-gray-400 ring-1 ring-gray-200",
    // Employee lifecycle
    "Ready to Invite":"bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
    "Invitation Sent":"bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    "Invitation Viewed":"bg-purple-50 text-purple-700 ring-1 ring-purple-200",
    "Accepted":"bg-teal-50 text-teal-700 ring-1 ring-teal-200",
  };
  return <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",map[status]||"bg-gray-100 text-gray-600")}>{status}</span>;
}
