import React from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/shared/utils";

export function KPICard({ title, value, sub, trend, icon:Icon, iconColor, onClick }: {
  title:string; value:string; sub:string; trend?:"up"|"down"|"neutral";
  icon:any; iconColor:string; onClick?:()=>void;
}) {
  return (
    <div className={cn("bg-white rounded-lg border border-gray-200 p-4 flex flex-col gap-2",onClick&&"cursor-pointer hover:border-[#5C5CFF]/40 hover:shadow-sm transition-all")} onClick={onClick}>
      <div className="flex items-start justify-between">
        <span className="text-xs text-gray-500 font-medium">{title}</span>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{backgroundColor:iconColor+"18"}}><Icon size={16} style={{color:iconColor}} /></div>
      </div>
      <div>
        <div className="text-xl font-bold text-gray-900">{value}</div>
        <div className={cn("text-[11px] mt-0.5 flex items-center gap-1",trend==="up"?"text-green-600":trend==="down"?"text-red-500":"text-gray-500")}>
          {trend==="up"&&<ArrowUpRight size={10}/>}{trend==="down"&&<ArrowDownRight size={10}/>}{sub}
        </div>
      </div>
    </div>
  );
}
