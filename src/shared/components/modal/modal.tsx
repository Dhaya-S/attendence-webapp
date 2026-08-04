import React from "react";
import { X } from "lucide-react";
import { cn } from "@/shared/utils";

export function Modal({ title, onClose, children, width="max-w-lg" }: {
  title:string; onClose:()=>void; children:React.ReactNode; width?:string;
}) {
  // Lock body scroll and restore on unmount
  React.useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Escape key handler
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  // Restore focus to opening element on unmount
  React.useEffect(() => {
    const activeEl = document.activeElement as HTMLElement | null;
    return () => {
      if (activeEl && typeof activeEl.focus === "function") {
        activeEl.focus();
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop: background: rgba(15, 23, 42, 0.35) */}
      <div 
        className="absolute inset-0 bg-[#0F172A]/35" 
        onClick={onClose}
      />
      {/* Modal content */}
      <div 
        className={cn(
          "relative bg-white rounded-xl shadow-xl w-full flex flex-col max-h-[90vh] z-[110] border border-gray-150", 
          width
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-sm font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"><X size={18}/></button>
        </div>
        <div className="overflow-auto flex-1 p-6">{children}</div>
      </div>
    </div>
  );
}
