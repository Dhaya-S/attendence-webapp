import React from "react";
import { cn } from "@/shared/utils";

export function Avt({ initials, color, size="md" }: { initials:string; color:string; size?:"sm"|"md"|"lg"|"xl" }) {
  const sz = { sm:"w-7 h-7 text-xs", md:"w-8 h-8 text-sm", lg:"w-10 h-10 text-sm", xl:"w-14 h-14 text-base" }[size];
  return <div className={cn("rounded-full flex items-center justify-center font-medium text-white flex-shrink-0",sz)} style={{backgroundColor:color}}>{initials}</div>;
}
