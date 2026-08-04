import React, { useState } from "react";
import {
  Check,
  User,
  Shield,
  Building,
  ChevronLeft,
  Upload,
  ChevronDown,
  ArrowRight,
  Briefcase,
  Lock,
  Eye,
  Phone,
  Key,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { cn, auth, db } from "@/shared/utils";
import { doc, setDoc } from "firebase/firestore";

export function CreateAdminAccountPage({
  onContinue,
  onBack,
}: {
  onContinue: () => void;
  onBack: () => void;
}) {
  const currentUser = auth.currentUser;
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [workEmail, setWorkEmail] = useState(currentUser?.email || "");
  const [mobile, setMobile] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [timezone, setTimezone] = useState("(UTC-5) Eastern Time");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaMethod, setMfaMethod] = useState<"app" | "sms">("app");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<
    "personal" | "role" | "security" | "legal"
  >("personal");
  const [submitted, setSubmitted] = useState(false);

  const authMethod: "sso" | "email" = currentUser?.providerData?.[0]?.providerId === "google.com" ? "sso" : "email";

  const pwdStrength = (() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  })();
  const pwdLabel = ["", "Weak", "Fair", "Strong", "Very Strong"][pwdStrength];
  const pwdColor = [
    "",
    "bg-red-400",
    "bg-amber-400",
    "bg-blue-400",
    "bg-green-500",
  ][pwdStrength];

  const SECTIONS = [
    { id: "personal" as const, label: "Personal Information", icon: User },
    { id: "role" as const, label: "Organization Role", icon: Briefcase },
    { id: "security" as const, label: "Security", icon: Shield },
    { id: "legal" as const, label: "Legal & Consent", icon: CheckCircle },
  ];

  const isPersonalComplete = firstName.trim() && lastName.trim() && mobile.trim() && workEmail.trim();
  const isRoleComplete = jobTitle.trim();
  const isSecurityComplete =
    authMethod === "sso" ||
    (password.length >= 8 && password === confirmPassword);
  const isLegalComplete = acceptTerms && acceptPrivacy;
  const canSubmit =
    isPersonalComplete && isRoleComplete && isSecurityComplete && isLegalComplete;

  const handleContinue = async () => {
    setSubmitted(true);
    if (!canSubmit) return;

    try {
      const emailLower = (workEmail || currentUser?.email || "").trim().toLowerCase();
      if (!emailLower) return;
      const userDocId = currentUser?.uid || emailLower;

      if (currentUser) {
        try {
          await currentUser.getIdToken(true);
        } catch (_) {}
      }

      const adminProfile = {
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`.trim(),
        email: emailLower,
        mobile,
        jobTitle,
        department,
        timezone,
        mfaEnabled,
        mfaMethod,
        acceptTerms,
        acceptPrivacy,
        role: "super_admin",
        status: "approved",
        createdAt: new Date().toISOString(),
      };

      // 1. Write user profile document to /users/{userDocId} and /user/{emailLower}
      try {
        await setDoc(doc(db, "users", userDocId), adminProfile, { merge: true });
        await setDoc(doc(db, "user", emailLower), adminProfile, { merge: true });
      } catch (uErr) {
        console.warn("Could not save to users/user collection:", uErr);
      }

      // 2. Write approved user mapping to /approved_users/{emailLower}
      try {
        await setDoc(doc(db, "approved_users", emailLower), {
          email: emailLower,
          name: adminProfile.fullName,
          role: "super_admin",
          status: "approved",
          uid: currentUser?.uid || null,
          createdAt: new Date().toISOString(),
        }, { merge: true });
      } catch (aErr) {
        console.warn("Could not save to approved_users collection:", aErr);
      }

      // 3. Save to localStorage so setup wizard attaches full admin details to organization
      localStorage.setItem("pending_admin_profile", JSON.stringify(adminProfile));
    } catch (err) {
      console.warn("Could not save admin profile to Firestore:", err);
    }

    onContinue();
  };

  const SectionNav = () => (
    <nav className="space-y-1">
      {SECTIONS.map((s) => {
        const isComplete =
          s.id === "personal"
            ? !!isPersonalComplete
            : s.id === "role"
            ? !!isRoleComplete
            : s.id === "security"
            ? !!isSecurityComplete
            : isLegalComplete;
        return (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors text-sm cursor-pointer",
              activeSection === s.id
                ? "bg-[#EEF2FF] text-[#5C5CFF] font-medium"
                : "text-gray-600 hover:bg-gray-100"
            )}
          >
            <div
              className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0",
                isComplete ? "bg-green-500" : "bg-gray-200"
              )}
            >
              {isComplete ? (
                <Check size={11} className="text-white" />
              ) : (
                <s.icon size={11} className="text-gray-505" />
              )}
            </div>
            {s.label}
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex text-left">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-[38%] bg-[#5C5CFF] flex-col justify-between p-10 relative overflow-hidden flex-shrink-0">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/5" />
          <div className="absolute top-1/2 -left-10 w-52 h-52 rounded-full bg-white/5" />
          <div className="absolute -bottom-10 right-10 w-80 h-80 rounded-full bg-white/5" />
        </div>
        <div className="relative flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <User size={16} className="text-white" />
          </div>
          <span className="text-white font-semibold text-sm">Attendance HRMS</span>
        </div>
        <div className="relative space-y-8">
          {/* Step indicator */}
          <div>
            <div className="flex items-center gap-2 mb-5">
              {[1, 2, 3].map((n) => (
                <React.Fragment key={n}>
                  <div
                    className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
                      n === 1
                        ? "bg-white text-[#5C5CFF]"
                        : n === 2
                        ? "bg-white/20 text-white border border-white/30"
                        : "bg-white/10 text-white/40 border border-white/10"
                    )}
                  >
                    {n === 1 ? <Check size={13} /> : n}
                  </div>
                  {n < 3 && (
                    <div
                      className={cn(
                        "flex-1 h-px",
                        n === 1 ? "bg-white/40" : "bg-white/15"
                      )}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-white/50 px-0.5">
              <span className="text-white/80 font-medium">Sign in</span>
              <span className="text-white font-semibold">Your Account</span>
              <span>Workspace Setup</span>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white leading-snug mb-3">
              Tell us about
              <br />
              yourself
            </h2>
            <p className="text-white/65 text-sm leading-relaxed">
              This creates your administrator identity for the workspace. Your
              profile will be visible to employees you invite.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                icon: User,
                text: "Your admin profile stays separate from the organization setup.",
              },
              {
                icon: Shield,
                text: "You can enable two-factor authentication to protect this account.",
              },
              {
                icon: Building,
                text: "Organization details come next in the setup wizard.",
              },
            ].map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="flex items-start gap-3 text-white/70 text-xs leading-relaxed"
              >
                <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon size={12} className="text-white" />
                </div>
                {text}
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-white/25 text-xs">
          © 2024 Attendance HRMS. All rights reserved.
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col overflow-auto">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-8 py-3 flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
          >
            <ChevronLeft size={14} />
            Back to Sign In
          </button>
          <div className="ml-auto flex items-center gap-3">
            <div className="flex gap-1">
              {SECTIONS.map((s, i) => (
                <div
                  key={s.id}
                  className={cn(
                    "h-1 rounded-full transition-all",
                    activeSection === s.id ? "w-8 bg-[#5C5CFF]" : "w-4",
                    (i === 0 && isPersonalComplete) ||
                      (i === 1 && isRoleComplete) ||
                      (i === 2 && isSecurityComplete) ||
                      (i === 3 && isLegalComplete)
                      ? "bg-green-400"
                      : "bg-gray-200"
                  )}
                />
              ))}
            </div>
            <span className="text-xs text-gray-400">
              {SECTIONS.findIndex((s) => s.id === activeSection) + 1} of 4
            </span>
          </div>
        </div>

        <div className="flex-1 flex gap-0">
          {/* Section sidebar */}
          <div className="hidden xl:block w-56 border-r border-gray-100 p-5 flex-shrink-0 sticky top-[53px] self-start h-[calc(100vh-53px)]">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">
              Sections
            </p>
            <SectionNav />
          </div>

          {/* Main form */}
          <div className="flex-1 px-8 py-8 max-w-2xl">
            <div className="mb-6">
              <h1 className="text-xl font-semibold text-gray-900">
                Create Administrator Account
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Set up your identity before configuring the workspace.
              </p>
            </div>

            {/* Mobile section nav */}
            <div className="xl:hidden mb-6">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {SECTIONS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveSection(s.id)}
                    className={cn(
                      "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer",
                      activeSection === s.id
                        ? "bg-[#5C5CFF] text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── PERSONAL INFORMATION ── */}
            {activeSection === "personal" && (
              <div className="space-y-5">
                <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
                  <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <User size={15} className="text-[#5C5CFF]" />
                    Personal Information
                  </h2>

                  {/* Photo upload */}
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-full bg-[#EEF2FF] flex items-center justify-center text-[#5C5CFF] font-bold text-xl flex-shrink-0 overflow-hidden border-2 border-[#5C5CFF]/20">
                      {photoPreview ? (
                        <img
                          src={photoPreview}
                          className="w-full h-full object-cover"
                          alt=""
                        />
                      ) : (
                        <span>
                          {(firstName?.[0] || "A").toUpperCase()}
                          {(lastName?.[0] || "").toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        Profile Photo
                      </p>
                      <p className="text-xs text-gray-400 mb-2">
                        Optional · JPG or PNG, max 2MB
                      </p>
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                        <Upload size={12} />
                        Upload Photo
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) {
                              const r = new FileReader();
                              r.onload = (ev) =>
                                setPhotoPreview(ev.target?.result as string);
                              r.readAsDataURL(f);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-700">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Alex"
                        className={cn(
                          "px-3 py-2 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#5C5CFF] text-gray-900",
                          submitted && !firstName.trim()
                            ? "border-red-300 focus:ring-red-300"
                            : "border-gray-300"
                        )}
                      />
                      {submitted && !firstName.trim() && (
                        <p className="text-[11px] text-red-500">
                          First name is required
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-700">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Johnson"
                        className={cn(
                          "px-3 py-2 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#5C5CFF] text-gray-900",
                          submitted && !lastName.trim()
                            ? "border-red-300"
                            : "border-gray-300"
                        )}
                      />
                      {submitted && !lastName.trim() && (
                        <p className="text-[11px] text-red-500">
                          Last name is required
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700">
                      Work Email
                    </label>
                    <div className="relative">
                      <input
                        value={workEmail}
                        onChange={(e) => setWorkEmail(e.target.value)}
                        placeholder="admin@company.com"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 pr-24 focus:outline-none focus:ring-2 focus:ring-[#5C5CFF]"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check size={9} />
                        Verified
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400">
                      Work email used for administrator account & authentication.
                    </p>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-shrink-0">
                        <select className="pl-3 pr-7 py-2 text-sm border border-gray-300 rounded-lg bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#5C5CFF] text-gray-900 cursor-pointer">
                          <option>+1 (US)</option>
                          <option>+44 (UK)</option>
                          <option>+91 (IN)</option>
                          <option>+61 (AU)</option>
                          <option>+1 (CA)</option>
                        </select>
                        <ChevronDown
                          size={12}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                        />
                      </div>
                      <input
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        type="tel"
                        placeholder="(555) 000-0000"
                        className={cn(
                          "flex-1 px-3 py-2 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#5C5CFF] text-gray-900",
                          submitted && !mobile.trim()
                            ? "border-red-300"
                            : "border-gray-300"
                        )}
                      />
                    </div>
                    {submitted && !mobile.trim() && (
                      <p className="text-[11px] text-red-500">
                        Mobile number is required
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => setActiveSection("role")}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#5C5CFF] text-white text-sm font-medium rounded-lg hover:bg-[#4A4AE0] transition-colors cursor-pointer"
                  >
                    Next: Organization Role
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* ── ORGANIZATION ROLE ── */}
            {activeSection === "role" && (
              <div className="space-y-5">
                <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
                  <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <Briefcase size={15} className="text-[#5C5CFF]" />
                    Organization Role
                  </h2>
                  <p className="text-xs text-gray-555 -mt-2">
                    This will appear on your admin profile and in the organization
                    directory.
                  </p>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700">
                      Job Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="e.g. HR Manager, IT Director, CEO"
                      className={cn(
                        "px-3 py-2 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#5C5CFF] text-gray-900",
                        submitted && !jobTitle.trim()
                          ? "border-red-300"
                          : "border-gray-300"
                      )}
                    />
                    {submitted && !jobTitle.trim() && (
                      <p className="text-[11px] text-red-500">
                        Job title is required
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700">
                      Department{" "}
                      <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <div className="relative">
                      <select
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full pl-3 pr-8 py-2 text-sm border border-gray-300 rounded-lg bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#5C5CFF] text-gray-900 cursor-pointer"
                      >
                        <option value="">Select department</option>
                        {[
                          "Engineering",
                          "Product",
                          "Design",
                          "Marketing",
                          "Sales",
                          "HR",
                          "Finance",
                          "Operations",
                          "Legal",
                          "IT",
                        ].map((d) => (
                          <option key={d}>{d}</option>
                        ))}
                      </select>
                      <ChevronDown
                        size={12}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      Time Zone
                      <span className="text-[10px] font-normal text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                        Auto-detected from browser
                      </span>
                    </label>
                    <div className="relative">
                      <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="w-full pl-3 pr-8 py-2 text-sm border border-gray-300 rounded-lg bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#5C5CFF] text-gray-900 cursor-pointer"
                      >
                        {[
                          "(UTC-12) International Date Line West",
                          "(UTC-8) Pacific Time",
                          "(UTC-7) Mountain Time",
                          "(UTC-6) Central Time",
                          "(UTC-5) Eastern Time",
                          "(UTC+0) UTC / Greenwich",
                          "(UTC+1) Central European Time",
                          "(UTC+3) Moscow / Riyadh",
                          "(UTC+5:30) India Standard Time",
                          "(UTC+8) China / Singapore",
                          "(UTC+9) Japan Standard Time",
                          "(UTC+10) Australian Eastern",
                          "(UTC+12) New Zealand",
                        ].map((tz) => (
                          <option key={tz}>{tz}</option>
                        ))}
                      </select>
                      <ChevronDown
                        size={12}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setActiveSection("personal")}
                    className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                  >
                    <ChevronLeft size={14} />
                    Back
                  </button>
                  <button
                    onClick={() => setActiveSection("security")}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#5C5CFF] text-white text-sm font-medium rounded-lg hover:bg-[#4A4AE0] transition-colors cursor-pointer"
                  >
                    Next: Security
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* ── SECURITY ── */}
            {activeSection === "security" && (
              <div className="space-y-5">
                {/* Password (email sign-up only) */}
                {authMethod === "email" ? (
                  <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
                    <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                      <Lock size={15} className="text-[#5C5CFF]" />
                      Set Password
                    </h2>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-700">
                        Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPwd ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Min 8 characters"
                          className="w-full px-3 py-2 pr-10 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5C5CFF]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPwd(!showPwd)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                        >
                          <Eye size={14} />
                        </button>
                      </div>
                      {password && (
                        <div className="space-y-1.5">
                          <div className="flex gap-1">
                            {[1, 2, 3, 4].map((i) => (
                              <div
                                key={i}
                                className={cn(
                                  "h-1 flex-1 rounded-full transition-colors",
                                  i <= pwdStrength ? pwdColor : "bg-gray-200"
                                )}
                              />
                            ))}
                          </div>
                          <p
                            className={cn(
                              "text-[11px] font-medium",
                              pwdStrength <= 1
                                ? "text-red-500"
                                : pwdStrength === 2
                                ? "text-amber-500"
                                : pwdStrength === 3
                                ? "text-blue-500"
                                : "text-green-500"
                            )}
                          >
                            {pwdLabel}
                          </p>
                          <ul className="text-[11px] text-gray-400 space-y-0.5">
                            {[
                              ["8+ characters", password.length >= 8],
                              [/[A-Z]/.test(password), "Uppercase letter"],
                              [/[0-9]/.test(password), "Number"],
                              [/[^A-Za-z0-9]/.test(password), "Special character"],
                            ].map(([val, label]) => (
                              <li
                                key={label as string}
                                className={cn(
                                  "flex items-center gap-1.5",
                                  val ? "text-green-600" : "text-gray-400"
                                )}
                              >
                                <Check
                                  size={9}
                                  className={cn(val ? "opacity-100" : "opacity-0")}
                                />
                                {label}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-700">
                        Confirm Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirm ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter password"
                          className={cn(
                            "w-full px-3 py-2 pr-10 text-sm border rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5C5CFF]",
                            confirmPassword && confirmPassword !== password
                              ? "border-red-300"
                              : "border-gray-300"
                          )}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm(!showConfirm)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                        >
                          <Eye size={14} />
                        </button>
                      </div>
                      {confirmPassword && confirmPassword !== password && (
                        <p className="text-[11px] text-red-500">
                          Passwords do not match
                        </p>
                      )}
                      {confirmPassword &&
                        confirmPassword === password &&
                        password.length >= 8 && (
                          <p className="text-[11px] text-green-600 flex items-center gap-1">
                            <Check size={10} />
                            Passwords match
                          </p>
                        )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2 mb-3">
                      <Lock size={15} className="text-[#5C5CFF]" />
                      Password
                    </h2>
                    <div className="flex items-start gap-3 p-3.5 bg-green-50 rounded-lg border border-green-100">
                      <CheckCircle
                        size={16}
                        className="text-green-500 flex-shrink-0 mt-0.5"
                      />
                      <div>
                        <p className="text-sm font-medium text-green-800">
                          Authenticated via SSO
                        </p>
                        <p className="text-xs text-green-700 mt-0.5">
                          Your account is secured through Google / Microsoft Single
                          Sign-On. No password is required.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2FA */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                        <Shield size={15} className="text-[#5C5CFF]" />
                        Two-Factor Authentication
                        <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded ml-1">
                          Optional
                        </span>
                      </h2>
                      <p className="text-xs text-gray-555 mt-0.5">
                        Add a second layer of security to your administrator account.
                      </p>
                    </div>
                    <button
                      onClick={() => setMfaEnabled(!mfaEnabled)}
                      className={cn(
                        "w-11 h-6 rounded-full relative transition-colors flex-shrink-0 mt-0.5 cursor-pointer",
                        mfaEnabled ? "bg-[#5C5CFF]" : "bg-gray-300"
                      )}
                    >
                      <div
                        className={cn(
                          "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform",
                          mfaEnabled ? "left-5" : "left-0.5"
                        )}
                      />
                    </button>
                  </div>

                  {mfaEnabled && (
                    <div className="space-y-3 pt-2 border-t border-gray-100">
                      <p className="text-xs font-medium text-gray-600">
                        Choose authentication method
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {(
                          [
                            {
                              id: "app",
                              icon: Key,
                              title: "Authenticator App",
                              sub: "Google Authenticator, Authy, etc.",
                            },
                            {
                              id: "sms",
                              icon: Phone,
                              title: "SMS / Text Message",
                              sub: "Receive codes via your mobile number",
                            },
                          ] as const
                        ).map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() => setMfaMethod(opt.id)}
                            className={cn(
                              "p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer",
                              mfaMethod === opt.id
                                ? "border-[#5C5CFF] bg-[#EEF2FF]"
                                : "border-gray-200 hover:border-gray-300"
                            )}
                          >
                            <opt.icon
                              size={18}
                              className={cn(
                                "mb-2",
                                mfaMethod === opt.id
                                  ? "text-[#5C5CFF]"
                                  : "text-gray-400"
                              )}
                            />
                            <p
                              className={cn(
                                "text-xs font-semibold",
                                mfaMethod === opt.id
                                  ? "text-[#5C5CFF]"
                                  : "text-gray-700"
                              )}
                            >
                              {opt.title}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              {opt.sub}
                            </p>
                          </button>
                        ))}
                      </div>
                      {mfaMethod === "app" && (
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-start gap-4">
                          {/* Mock QR code */}
                          <div className="w-20 h-20 bg-white rounded-lg border border-gray-200 flex-shrink-0 grid grid-cols-5 gap-0.5 p-2">
                            {Array.from({ length: 25 }, (_, i) => (
                              <div
                                key={i}
                                className={cn(
                                  "rounded-[1px]",
                                  [
                                    0, 1, 2, 3, 4, 5, 9, 10, 14, 15, 19, 20, 21,
                                    22, 23, 24, 7, 12, 17,
                                  ].includes(i)
                                    ? "bg-gray-900"
                                    : "bg-white"
                                )}
                              />
                            ))}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-800 mb-1">
                              Scan with your authenticator app
                            </p>
                            <p className="text-[11px] text-gray-500 mb-2 leading-relaxed">
                              Open your app and scan the QR code, or enter the key
                              manually:
                            </p>
                            <code className="text-[11px] font-mono bg-gray-100 px-2 py-1 rounded text-gray-700 break-all">
                              JBSW Y3DP EHPK 3PXP
                            </code>
                          </div>
                        </div>
                      )}
                      {mfaMethod === "sms" && (
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                          <p className="text-xs text-gray-600 mb-2">
                            A verification code will be sent to your registered
                            mobile number ending in{" "}
                            <strong>•••• {mobile.slice(-4) || "0000"}</strong>.
                          </p>
                          <button className="text-xs text-[#5C5CFF] hover:underline cursor-pointer">
                            Change mobile number
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setActiveSection("role")}
                    className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                  >
                    <ChevronLeft size={14} />
                    Back
                  </button>
                  <button
                    onClick={() => setActiveSection("legal")}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#5C5CFF] text-white text-sm font-medium rounded-lg hover:bg-[#4A4AE0] transition-colors cursor-pointer"
                  >
                    Next: Legal &amp; Consent
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* ── LEGAL & CONSENT ── */}
            {activeSection === "legal" && (
              <div className="space-y-5">
                <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
                  <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <CheckCircle size={15} className="text-[#5C5CFF]" />
                    Legal &amp; Consent
                  </h2>

                  <div className="space-y-4">
                    {/* Terms */}
                    <label
                      className={cn(
                        "flex items-start gap-3.5 p-4 rounded-xl border-2 cursor-pointer transition-all",
                        acceptTerms
                          ? "border-[#5C5CFF] bg-[#EEF2FF]"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={acceptTerms}
                        onChange={(e) => setAcceptTerms(e.target.checked)}
                        className="mt-0.5 rounded accent-[#5C5CFF] flex-shrink-0"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          I accept the{" "}
                          <button
                            type="button"
                            className="text-[#5C5CFF] hover:underline font-semibold cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Terms &amp; Conditions
                          </button>
                          <span className="text-red-500 ml-1">*</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                          By accepting, you agree to be bound by the Attendance
                          HRMS Terms of Service, including the acceptable use
                          policy and administrator responsibilities.
                        </p>
                      </div>
                    </label>

                    {/* Privacy */}
                    <label
                      className={cn(
                        "flex items-start gap-3.5 p-4 rounded-xl border-2 cursor-pointer transition-all",
                        acceptPrivacy
                          ? "border-[#5C5CFF] bg-[#EEF2FF]"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={acceptPrivacy}
                        onChange={(e) => setAcceptPrivacy(e.target.checked)}
                        className="mt-0.5 rounded accent-[#5C5CFF] flex-shrink-0"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          I accept the{" "}
                          <button
                            type="button"
                            className="text-[#5C5CFF] hover:underline font-semibold cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Privacy Policy
                          </button>
                          <span className="text-red-500 ml-1">*</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                          You confirm that you have read and understood how we
                          collect, use, and protect personal data under GDPR,
                          CCPA, and applicable data protection laws.
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Completion summary */}
                  <div className="pt-2 border-t border-gray-100 text-left">
                    <p className="text-xs font-semibold text-gray-500 mb-3">
                      Account Summary
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        {
                          label: "Name",
                          value:
                            firstName && lastName
                              ? `${firstName} ${lastName}`
                              : "—",
                        },
                        { label: "Email", value: workEmail || "—" },
                        { label: "Mobile", value: mobile || "—" },
                        { label: "Job Title", value: jobTitle || "—" },
                        { label: "Department", value: department || "—" },
                        {
                          label: "Time Zone",
                          value: timezone.split(")")[1]?.trim() || timezone,
                        },
                        {
                          label: "2FA",
                          value: mfaEnabled
                            ? `Enabled (${
                                mfaMethod === "app" ? "Authenticator" : "SMS"
                              })`
                            : "Not enabled",
                        },
                        {
                          label: "Auth",
                          value:
                            authMethod === "sso"
                              ? "SSO (Google/Microsoft)"
                              : "Email & Password",
                        },
                      ].map((r) => (
                        <div key={r.label} className="flex items-start gap-2 text-xs">
                          <span className="text-gray-405 flex-shrink-0 w-20">
                            {r.label}
                          </span>
                          <span className="font-medium text-gray-800 truncate">
                            {r.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {submitted && !isLegalComplete && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg">
                      <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
                      <p className="text-xs text-red-600">
                        Please accept both Terms &amp; Conditions and Privacy Policy
                        to continue.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setActiveSection("security")}
                    className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                  >
                    <ChevronLeft size={14} />
                    Back
                  </button>
                  <button
                    onClick={handleContinue}
                    className={cn(
                      "inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer",
                      canSubmit
                        ? "bg-[#5C5CFF] text-white hover:bg-[#4A4AE0] shadow-md shadow-[#5C5CFF]/20"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    )}
                  >
                    Continue to Workspace Setup
                    <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
