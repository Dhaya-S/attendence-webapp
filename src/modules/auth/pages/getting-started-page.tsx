import React, { useState } from "react";
import {
  Users,
  CheckCircle,
  Zap,
  Clock,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Check,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/shared/utils";

const GS_STEPS = [
  "Organization Information",
  "Branch & Locations",
  "Departments",
  "Designations",
  "Holiday Calendar",
  "Shift Management",
  "Attendance Policy",
  "Leave Policy",
  "Approval Workflow",
  "Roles & Permissions",
  "Employees",
  "Launch Workspace",
];

export function GettingStartedPage({
  onStart,
  onSkip,
}: {
  onStart: () => void;
  onSkip: () => void;
}) {
  const [slide, setSlide] = useState(0);
  const SLIDES = [
    {
      title: "Welcome to Attendance HRMS",
      body:
        "Your complete HR workspace — attendance, leave, shifts, teams and approvals all in one place.",
      icon: Users,
    },
    {
      title: "Set up in minutes",
      body:
        "Our guided setup wizard walks you through every configuration step. You can always come back and change anything.",
      icon: CheckCircle,
    },
    {
      title: "Everything connected",
      body:
        "Every module talks to every other. Shifts connect to attendance, leave connects to approvals, and teams connect to everything.",
      icon: Zap,
    },
  ];
  const S = SLIDES[slide];

  return (
    <div className="min-h-screen bg-gray-50 flex text-left">
      {/* Left — illustration + intro */}
      <div className="hidden lg:flex lg:w-3/5 bg-[#5C5CFF] flex-col relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-white/5 pointer-events-none" />

        {/* Top bar */}
        <div className="relative flex items-center gap-3 p-8">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <Users size={16} className="text-white" />
          </div>
          <span className="text-white font-semibold text-sm">Attendance HRMS</span>
          <button
            onClick={onSkip}
            className="ml-auto text-white/50 text-xs hover:text-white/80 transition-colors cursor-pointer"
          >
            Skip tour
          </button>
        </div>

        {/* Illustration area */}
        <div className="flex-1 flex flex-col items-center justify-center px-16">
          {/* Abstract illustration */}
          <div className="w-56 h-56 relative mb-10">
            <div className="absolute inset-0 rounded-3xl bg-white/10 flex items-center justify-center">
              <S.icon size={72} className="text-white/60" />
            </div>
            <div className="absolute -top-4 -right-4 w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center">
              <Users size={20} className="text-white/70" />
            </div>
            <div className="absolute -bottom-4 -left-4 w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center">
              <Clock size={16} className="text-white/70" />
            </div>
            <div className="absolute top-1/2 -right-8 w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <CalendarDays size={14} className="text-white/60" />
            </div>
          </div>

          {/* Slide content */}
          <div className="text-center max-w-md">
            <h2 className="text-3xl font-semibold text-white mb-3 leading-tight">
              {S.title}
            </h2>
            <p className="text-white/70 text-sm leading-relaxed">{S.body}</p>
          </div>

          {/* Carousel nav */}
          <div className="flex items-center gap-4 mt-10">
            <button
              onClick={() => setSlide((s) => Math.max(0, s - 1))}
              disabled={slide === 0}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white disabled:opacity-30 hover:bg-white/20 transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex gap-2">
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSlide(i)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all cursor-pointer",
                    i === slide ? "bg-white w-6" : "bg-white/30"
                  )}
                />
              ))}
            </div>
            <button
              onClick={() => setSlide((s) => Math.min(SLIDES.length - 1, s + 1))}
              disabled={slide === SLIDES.length - 1}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white disabled:opacity-30 hover:bg-white/20 transition-colors cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Right — checklist */}
      <div className="flex-1 flex flex-col bg-white overflow-auto">
        <div className="flex-1 flex flex-col justify-center px-10 py-12 max-w-md mx-auto w-full">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-[#EEF2FF] text-[#5C5CFF] text-xs font-medium px-3 py-1.5 rounded-full mb-4">
              <Zap size={12} />
              Setup takes about 5 minutes
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">
              Set up your workspace
            </h2>
            <p className="text-sm text-gray-505">
              Complete these steps to activate all modules. You can skip steps and
              return later.
            </p>
          </div>

          {/* Checklist */}
          <div className="space-y-1 mb-8">
            {GS_STEPS.map((label, i) => (
              <button
                key={i}
                onClick={() => onStart()}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 text-left group transition-colors cursor-pointer"
              >
                <div
                  className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                    i === 0
                      ? "border-green-500 bg-green-500"
                      : "border-gray-300 group-hover:border-[#5C5CFF]"
                  )}
                >
                  {i === 0 && <Check size={11} className="text-white" />}
                </div>
                <span
                  className={cn(
                    "text-sm flex-1",
                    i === 0 ? "text-gray-400 line-through" : "text-gray-700 group-hover:text-gray-900"
                  )}
                >
                  {label}
                </span>
                {i > 0 && (
                  <ChevronRight
                    size={14}
                    className="text-gray-300 group-hover:text-[#5C5CFF] flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all"
                  />
                )}
                {i === 0 && (
                  <span className="text-xs text-green-600 font-medium flex-shrink-0">
                    Done
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <button
              onClick={() => onStart()}
              className="w-full py-3 bg-[#5C5CFF] text-white text-sm font-medium rounded-xl hover:bg-[#4A4AE0] transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              Start Setup <ArrowRight size={16} />
            </button>
            <button
              onClick={onSkip}
              className="w-full py-2.5 text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
            >
              Skip for now — go to Dashboard
            </button>
          </div>
        </div>

        <div className="px-10 py-4 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            Organization Information has been pre-configured. Continue from Branch
            &amp; Locations.
          </p>
        </div>
      </div>
    </div>
  );
}
