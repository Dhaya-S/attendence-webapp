import React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/shared/utils";

export function InputField({ label, type="text", placeholder, value, onChange, required, className }: {
  label?: string; type?: string; placeholder?: string; value?: string; onChange?: any; required?: boolean; className?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 text-left">
      {label && <label className="text-sm font-medium text-gray-700">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>}
      <input
        type={type}
        placeholder={placeholder}
        value={typeof value === "string" || typeof value === "number" ? value : (value as any)?.target?.value ?? ""}
        onChange={(e) => {
          if (typeof onChange === "function") {
            const rawVal = e.target.value;
            const strObj = new String(rawVal) as any;
            strObj.target = { value: rawVal };
            strObj.currentTarget = { value: rawVal };
            onChange(strObj, e);
          }
        }}
        className={cn(
          "px-3 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5C5CFF] focus:border-transparent",
          className
        )}
      />
    </div>
  );
}

export function SelectField({ label, options, value, onChange, required, children, className }: {
  label?: string; options?: string[]; value?: string; onChange?: any; required?: boolean; children?: React.ReactNode; className?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 text-left">
      {label && <label className="text-sm font-medium text-gray-700">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>}
      <div className="relative">
        <select
          value={typeof value === "string" || typeof value === "number" ? value : (value as any)?.target?.value ?? ""}
          onChange={(e) => {
            if (typeof onChange === "function") {
              const rawVal = e.target.value;
              const strObj = new String(rawVal) as any;
              strObj.target = { value: rawVal };
              strObj.currentTarget = { value: rawVal };
              onChange(strObj, e);
            }
          }}
          className={cn(
            "w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-900 appearance-none focus:outline-none focus:ring-2 focus:ring-[#5C5CFF] focus:border-transparent",
            className
          )}
        >
          {options ? options.map((o) => <option key={o} value={o}>{o}</option>) : children}
        </select>
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}
