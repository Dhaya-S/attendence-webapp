import React from "react";
import { cn } from "@/shared/utils";

export function TabBar({ tabs, active, onChange }: { tabs:string[]; active:string; onChange:(t:string)=>void }) {
  return (
    <div className="flex border-b border-gray-200 bg-white px-6 overflow-x-auto overflow-y-hidden no-scrollbar">
      {tabs.map(t=>(
        <button key={t} onClick={()=>onChange(t)} className={cn("px-4 py-3 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors",active===t?"border-[#5C5CFF] text-[#5C5CFF]":"border-transparent text-gray-555 hover:text-gray-700 hover:border-gray-300")}>{t}</button>
      ))}
    </div>
  );
}
