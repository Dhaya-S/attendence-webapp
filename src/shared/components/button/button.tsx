import React from "react";
import { cn } from "@/shared/utils";

export function Btn({ children, variant="primary", size="md", onClick, className, disabled }: {
  children:React.ReactNode; variant?:"primary"|"secondary"|"ghost"|"danger"|"outline";
  size?:"sm"|"md"|"lg"; onClick?:()=>void; className?:string; disabled?:boolean;
}) {
  const base = "inline-flex items-center gap-1.5 font-medium rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";
  const vs = { primary:"bg-[#5C5CFF] text-white hover:bg-[#4A4AE0] focus:ring-[#5C5CFF]", secondary:"bg-gray-100 text-gray-700 hover:bg-gray-200", ghost:"text-gray-600 hover:bg-gray-100", danger:"bg-red-500 text-white hover:bg-red-600", outline:"border border-gray-300 text-gray-700 hover:bg-gray-50" };
  const ss = { sm:"px-2.5 py-1.5 text-xs", md:"px-3.5 py-2 text-sm", lg:"px-5 py-2.5 text-sm" };
  return <button className={cn(base,vs[variant],ss[size],className)} onClick={onClick} disabled={disabled}>{children}</button>;
}
