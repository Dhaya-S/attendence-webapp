import React from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/shared/utils";

export function PageHeader({ title, subtitle, breadcrumbs, children }: {
  title:string; subtitle?:string; breadcrumbs?:{label:string;onClick?:()=>void}[]; children?:React.ReactNode;
}) {
  return (
    <div className="px-6 py-3 border-b border-gray-200 bg-white flex items-center justify-between gap-4">
      <div>
        {breadcrumbs&&<div className="flex items-center gap-1 text-xs text-gray-400 mb-0.5">{breadcrumbs.map((b,i)=>(
          <span key={i} className="flex items-center gap-1">{i>0&&<ChevronRight size={10}/>}<span className={cn(b.onClick?"cursor-pointer hover:text-[#5C5CFF] text-gray-500":"text-gray-400")} onClick={b.onClick}>{b.label}</span></span>
        ))}</div>}
        <h1 className="text-base font-semibold text-gray-900">{title}</h1>
        {subtitle&&<p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {children&&<div className="flex items-center gap-1.5 flex-shrink-0">{children}</div>}
    </div>
  );
}
