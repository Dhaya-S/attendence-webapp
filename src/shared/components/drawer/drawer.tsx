import React from "react";
import { X } from "lucide-react";

export function Drawer({
  isOpen,
  onClose,
  title,
  headerAddon,
  avatar,
  footer,
  children
}: {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  headerAddon?: React.ReactNode;
  avatar?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [render, setRender] = React.useState(isOpen);
  const [isClosing, setIsClosing] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setRender(true);
      setIsClosing(false);
      document.body.style.overflow = "hidden";
    } else {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setRender(false);
        setIsClosing(false);
        document.body.style.overflow = "";
      }, 220);
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = "";
      };
    }
  }, [isOpen]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!render) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex justify-end bg-[#0F172A]/35 backdrop-blur-[4px] drawer-overlay"
      style={{
        animation: isClosing ? "backdropOut 220ms ease-in forwards" : "backdropIn 220ms ease-out forwards"
      }}
      onClick={onClose}
    >
      <div
        className="drawer-content flex flex-col h-full bg-white border-l border-gray-200 shadow-2xl relative w-full sm:w-[80%] md:w-[560px]"
        style={{
          animation: isClosing ? "drawerOut 220ms ease-in forwards" : "drawerIn 220ms cubic-bezier(0.16, 1, 0.3, 1) forwards"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            {avatar}
            <div className="text-left">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
                {headerAddon}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F8FAFC]">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-gray-200 bg-white sticky bottom-0 z-10 flex gap-3 justify-end shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
