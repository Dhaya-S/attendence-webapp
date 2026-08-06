import React from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/app/components/ui/dialog";
import { AlertTriangle, Info } from "lucide-react";
import { Btn } from "@/shared/components";

interface DiscardChangesDialogProps {
  isOpen: boolean;
  onClose: () => void; // Continue Editing
  onDiscard: () => void; // Discard Changes
}

export function DiscardChangesDialog({ isOpen, onClose, onDiscard }: DiscardChangesDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md p-6 bg-white rounded-xl border border-gray-150 shadow-xl z-[200]">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-50 text-amber-500 rounded-full flex-shrink-0">
            <AlertTriangle size={24} className="text-[#F59E0B]" />
          </div>
          <div className="space-y-1.5 text-left flex-1">
            <DialogTitle className="text-base font-bold text-gray-900">
              Discard changes?
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500 font-medium">
              You have unsaved changes. If you leave now, your changes will be lost.
            </DialogDescription>
          </div>
        </div>
        <DialogFooter className="mt-5 flex gap-3 justify-end">
          <Btn variant="outline" onClick={onClose} autoFocus className="font-semibold">
            Continue Editing
          </Btn>
          <Btn
            onClick={onDiscard}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold"
          >
            Discard Changes
          </Btn>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "destructive" | "warning" | "info";
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "destructive",
}: ConfirmDialogProps) {
  const isDestructive = variant === "destructive";
  const isWarning = variant === "warning";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md p-6 bg-white rounded-xl border border-gray-150 shadow-xl z-[200]">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-full flex-shrink-0 ${
            isDestructive ? "bg-red-50 text-red-500" : isWarning ? "bg-amber-50 text-amber-500" : "bg-blue-50 text-blue-500"
          }`}>
            {isWarning || isDestructive ? (
              <AlertTriangle size={24} className={isWarning ? "text-[#F59E0B]" : "text-red-500"} />
            ) : (
              <Info size={24} />
            )}
          </div>
          <div className="space-y-1.5 text-left flex-1">
            <DialogTitle className="text-base font-bold text-gray-900">
              {title}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500 font-medium">
              {description}
            </DialogDescription>
          </div>
        </div>
        <DialogFooter className="mt-5 flex gap-3 justify-end">
          <Btn variant="outline" onClick={onClose} autoFocus className="font-semibold">
            {cancelText}
          </Btn>
          <Btn
            onClick={onConfirm}
            className={`${
              isDestructive
                ? "bg-red-600 hover:bg-red-700 text-white"
                : isWarning
                ? "bg-amber-500 hover:bg-amber-600 text-white"
                : "bg-[#5C5CFF] hover:bg-[#5B57E8] text-white"
            } font-semibold`}
          >
            {confirmText}
          </Btn>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  okText?: string;
}

export function CustomAlertDialog({
  isOpen,
  onClose,
  title,
  description,
  okText = "OK",
}: AlertDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md p-6 bg-white rounded-xl border border-gray-150 shadow-xl z-[200]">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-50 text-blue-500 rounded-full flex-shrink-0">
            <Info size={24} />
          </div>
          <div className="space-y-1.5 text-left flex-1">
            <DialogTitle className="text-base font-bold text-gray-900">
              {title}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500 font-medium">
              {description}
            </DialogDescription>
          </div>
        </div>
        <DialogFooter className="mt-5 flex justify-end">
          <Btn onClick={onClose} autoFocus className="bg-[#5C5CFF] hover:bg-[#5B57E8] text-white font-semibold">
            {okText}
          </Btn>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
