import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Send,
  User,
  Shield,
  Building,
  Mail,
  Phone,
} from "lucide-react";
import { AppPage } from "@/shared/types";
import { cn } from "@/shared/utils";
import {
  Btn,
  PageHeader,
  InputField,
  SelectField,
} from "@/shared/components";
import { db, auth } from "@/shared/utils/firebase";
import { doc, setDoc, getDoc, collection, getDocs, collectionGroup } from "firebase/firestore";
import { useAuth } from "@/shared/context/AuthContext";
import { EMPLOYEES } from "@/modules/organization/data/employees";

export function AddEmployeePage({ navigate }: { navigate: (p: AppPage) => void }) {
  const { companyId } = useAuth();
  const [step, setStep] = useState(0);

  // Form states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [workEmail, setWorkEmail] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("Select…");
  const [nationalId, setNationalId] = useState("");
  const [nationality, setNationality] = useState("United States");
  const [phone, setPhone] = useState("");
  const [personalEmail, setPersonalEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");

  const [employeeId, setEmployeeId] = useState("");
  const [joinDate, setJoinDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [role, setRole] = useState("Employee");
  const [empType, setEmpType] = useState("Full-Time");
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");
  const [branch, setBranch] = useState("");
  const [workMode, setWorkMode] = useState("Office");

  const [manager, setManager] = useState("");
  const [businessUnit, setBusinessUnit] = useState("");

  const [shiftTemplate, setShiftTemplate] = useState("");
  const [leavePolicy, setLeavePolicy] = useState("Standard Leave Policy");

  // Options loaded from Firestore & drafts
  const [deptOptions, setDeptOptions] = useState<string[]>([]);
  const [locOptions, setLocOptions] = useState<string[]>([]);
  const [desigOptions, setDesigOptions] = useState<string[]>([]);
  const [shiftOptions, setShiftOptions] = useState<string[]>([]);
  const [managerOptions, setManagerOptions] = useState<string[]>([]);

  const [phase, setPhase] = useState<"form" | "invite-review" | "invite-sent">("form");
  const [sending, setSending] = useState(false);
  const [weeklyOff, setWeeklyOff] = useState("Saturday & Sunday");
  const [holidayCalendar, setHolidayCalendar] = useState("");
  const [team, setTeam] = useState("");

  const getName = (item: any): string => {
    if (!item) return "";
    if (typeof item === "string") return item;
    return item.name || item.code || item.title || item.label || item.id || String(item);
  };

  useEffect(() => {
    async function loadOrgData() {
      const currentUser = auth.currentUser;
      const userEmail = (currentUser?.email || "").toLowerCase();

      const rawDepts: any[] = [];
      const rawLocs: any[] = [];
      const rawDesigs: any[] = [];
      const rawShifts: any[] = [];
      let fsManagers: string[] = [];

      // 1. Resolve logged-in user's exact targetCompanyId
      let targetCompanyId = companyId && companyId !== "default" ? companyId : "";

      if (!targetCompanyId && userEmail) {
        try {
          const appSnap = await getDoc(doc(db, "approved_users", userEmail));
          if (appSnap.exists()) {
            targetCompanyId = appSnap.data().companyId || appSnap.data().orgId || "";
          }
        } catch (_) {}
      }

      if (!targetCompanyId && userEmail) {
        try {
          const uSnap = await getDoc(doc(db, "users", userEmail));
          if (uSnap.exists()) {
            targetCompanyId = uSnap.data().companyId || uSnap.data().orgId || "";
          }
        } catch (_) {}
      }

      if (!targetCompanyId && userEmail) {
        try {
          const raw = sessionStorage.getItem(`setup_wizard_draft_${userEmail}`) || localStorage.getItem(`setup_wizard_draft_${userEmail}`);
          if (raw) {
            const p = JSON.parse(raw);
            if (p.companyId || p.orgId) targetCompanyId = p.companyId || p.orgId;
          }
        } catch (_) {}
      }

      // 2. Query data STRICTLY for targetCompanyId (No cross-company data leakage)
      if (targetCompanyId) {
        const collectionsToTry = ["organizations", "companies", "approved_companies"];
        for (const colName of collectionsToTry) {
          try {
            const snap = await getDoc(doc(db, colName, targetCompanyId));
            if (snap.exists()) {
              const data = snap.data();
              if (data.departments) rawDepts.push(...data.departments);
              if (data.locations) rawLocs.push(...data.locations);
              if (data.designations) rawDesigs.push(...data.designations);
              if (data.shifts) rawShifts.push(...data.shifts);
            }
          } catch (_) {}

          try {
            const dSub = await getDocs(collection(db, colName, targetCompanyId, "departments"));
            dSub.docs.forEach(d => rawDepts.push(d.data()));
          } catch (_) {}
          try {
            const lSub = await getDocs(collection(db, colName, targetCompanyId, "locations"));
            lSub.docs.forEach(l => rawLocs.push(l.data()));
          } catch (_) {}
          try {
            const desSub = await getDocs(collection(db, colName, targetCompanyId, "designations"));
            desSub.docs.forEach(d => rawDesigs.push(d.data()));
          } catch (_) {}
          try {
            const sSub = await getDocs(collection(db, colName, targetCompanyId, "shifts"));
            sSub.docs.forEach(s => rawShifts.push(s.data()));
          } catch (_) {}
        }

        // Filter Reporting Managers: Strictly check database System Role (Manager, Admin, Super Admin, HR Admin)
        const isManagerOrAdmin = (u: any): boolean => {
          if (!u) return false;
          const r = String(u.role || "").toLowerCase().trim();
          const rl = String(u.roleLabel || "").toLowerCase().trim();

          // Reject if explicitly assigned system role "employee"
          if (r === "employee" || rl === "employee") return false;

          // Must be saved in database as manager, admin, super_admin, or hr_admin
          return (
            r === "manager" ||
            r === "admin" ||
            r === "super_admin" ||
            r === "hr_admin" ||
            rl.includes("manager") ||
            rl.includes("admin")
          );
        };

        const formatRoleLabel = (r?: string, rl?: string): string => {
          const raw = String(rl || r || "Manager").trim();
          if (raw === "super_admin" || raw.toLowerCase() === "super admin") return "Super Admin";
          if (raw === "hr_admin" || raw.toLowerCase() === "hr admin") return "HR Admin";
          if (raw === "manager" || raw.toLowerCase() === "manager") return "Manager";
          if (raw === "admin" || raw.toLowerCase() === "admin") return "Admin";
          return raw;
        };

        const fetchedManagersMap = new Map<string, string>();

        try {
          const uSnap = await getDocs(collection(db, "organizations", targetCompanyId, "users"));
          uSnap.docs.forEach(d => {
            const u = d.data();
            if (isManagerOrAdmin(u)) {
              const roleDisplay = formatRoleLabel(u.role, u.roleLabel);
              const displayName = u.name ? `${u.name} (${roleDisplay})` : u.email;
              if (displayName) fetchedManagersMap.set(u.email || u.name, displayName);
            }
          });
        } catch (_) {}

        try {
          const appUsersSnap = await getDocs(collection(db, "approved_users"));
          appUsersSnap.docs.forEach(d => {
            const u = d.data();
            const cid = u.companyId || u.orgId;
            // STRICT check: Must match targetCompanyId to prevent cross-company data leakage
            if (targetCompanyId && cid && cid === targetCompanyId) {
              if (isManagerOrAdmin(u)) {
                const roleDisplay = formatRoleLabel(u.role, u.roleLabel);
                const displayName = u.name ? `${u.name} (${roleDisplay})` : u.email;
                if (displayName && u.email) fetchedManagersMap.set(u.email, displayName);
              }
            }
          });
        } catch (_) {}

        // ONLY fallback to mock EMPLOYEES array if there is NO targetCompanyId (demo mode)
        if (!targetCompanyId && fetchedManagersMap.size === 0) {
          EMPLOYEES.forEach(emp => {
            const r = String((emp as any).role || "").toLowerCase();
            const desig = (emp.designation || "").toLowerCase();
            if (r === "manager" || r === "admin" || r === "super_admin" || r === "hr_admin" || desig.includes("manager")) {
              fetchedManagersMap.set(emp.id, `${emp.name} (${emp.designation})`);
            }
          });
        }

        fsManagers = Array.from(fetchedManagersMap.values());
      }

      // 3. Fallback to active user session draft if empty (strictly namespaced to current user email)
      if (!rawDepts.length && !rawLocs.length && !rawDesigs.length) {
        try {
          const draftKeys = [
            userEmail ? `setup_wizard_draft_${userEmail}` : "setup_wizard_draft",
          ].filter(Boolean);

          for (const key of draftKeys) {
            const raw = sessionStorage.getItem(key) || localStorage.getItem(key);
            if (raw) {
              const p = JSON.parse(raw);
              if (p.departments && !rawDepts.length) rawDepts.push(...p.departments);
              if (p.locations && !rawLocs.length) rawLocs.push(...p.locations);
              if (p.designations && !rawDesigs.length) rawDesigs.push(...p.designations);
              if (p.shifts && !rawShifts.length) rawShifts.push(...p.shifts);
            }
          }
        } catch (_) {}
      }

      // Normalize unique option strings
      const cleanDepts = Array.from(new Set(rawDepts.map(getName).filter(Boolean)));
      const cleanLocs = Array.from(new Set(rawLocs.map(getName).filter(Boolean)));
      const cleanDesigs = Array.from(new Set(rawDesigs.map(getName).filter(Boolean)));
      const cleanShifts = Array.from(new Set(rawShifts.map(getName).filter(Boolean)));

      setDeptOptions(cleanDepts as string[]);
      if (cleanDepts.length && !department) setDepartment(cleanDepts[0] as string);

      setLocOptions(cleanLocs as string[]);
      if (cleanLocs.length && !branch) setBranch(cleanLocs[0] as string);

      setDesigOptions(cleanDesigs as string[]);
      if (cleanDesigs.length && !designation) setDesignation(cleanDesigs[0] as string);

      setShiftOptions(cleanShifts as string[]);
      if (cleanShifts.length && !shiftTemplate) setShiftTemplate(cleanShifts[0] as string);

      setManagerOptions(fsManagers);
    }
    loadOrgData();
  }, [companyId]);

  const STEPS = [
    "Personal Info",
    "Contact Details",
    "Employment",
    "Assign Team",
    "Shift & Leave",
    "Review",
  ];

  const handleSaveEmployee = async () => {
    if (!workEmail.trim() || !firstName.trim() || !lastName.trim()) {
      alert("Please fill in First Name, Last Name, and Work Email.");
      return;
    }

    setSending(true);
    const targetEmail = workEmail.trim().toLowerCase();
    const dbRole = role === "Super Admin" ? "super_admin" : role === "HR Admin" ? "hr_admin" : role === "Manager" ? "manager" : "employee";
    const generatedId = employeeId.trim() || `EMP${Math.floor(100 + Math.random() * 900)}`;

    const empData = {
      id: generatedId,
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
      email: targetEmail,
      workEmail: targetEmail,
      phone,
      personalEmail,
      address,
      city,
      zipCode,
      emergencyContact,
      emergencyPhone,
      empType,
      dept: department || "General",
      department: department || "General",
      designation: designation || "Staff",
      branch: branch || "Headquarters",
      workMode,
      role: dbRole,
      roleLabel: role,
      manager,
      businessUnit,
      team,
      shift: shiftTemplate || "Standard Shift",
      leavePolicy,
      weeklyOff,
      holidayCalendar,
      status: "Active",
      joinDate,
      attendance: 100,
      createdAt: new Date().toISOString()
    };

    try {
      const currentUser = auth.currentUser;
      const currentUserEmail = (currentUser?.email || "").toLowerCase();
      let targetCompanyId = companyId && companyId !== "default" ? companyId : "";

      if (!targetCompanyId && currentUserEmail) {
        try {
          const appSnap = await getDoc(doc(db, "approved_users", currentUserEmail));
          if (appSnap.exists()) {
            targetCompanyId = appSnap.data().companyId || appSnap.data().orgId || "";
          }
        } catch (_) {}
      }

      if (!targetCompanyId) targetCompanyId = "default";

      const finalEmpData = {
        ...empData,
        companyId: targetCompanyId,
        orgId: targetCompanyId,
      };

      // 1. Write user doc to /organizations/{companyId}/users/{email}
      await setDoc(doc(db, "organizations", targetCompanyId, "users", targetEmail), finalEmpData, { merge: true });

      // 2. Write global user profile doc to /users/{email}
      await setDoc(doc(db, "users", targetEmail), finalEmpData, { merge: true });

      // 3. Write auth mapping doc to /approved_users/{email}
      await setDoc(doc(db, "approved_users", targetEmail), {
        email: targetEmail,
        companyId: targetCompanyId,
        orgId: targetCompanyId,
        role: dbRole,
        roleLabel: role,
        status: "approved",
        setupComplete: true,
        name: `${firstName} ${lastName}`,
        dept: department || "General",
        designation: designation || "Staff",
        createdAt: new Date().toISOString()
      }, { merge: true });

      setPhase("invite-sent");
    } catch (err) {
      console.error("Error saving employee:", err);
      alert(`Failed to save employee to Firestore: ${err}`);
    } finally {
      setSending(false);
    }
  };

  const resetForm = () => {
    setStep(0);
    setPhase("form");
    setFirstName("");
    setLastName("");
    setWorkEmail("");
    setDob("");
    setGender("Select…");
    setNationalId("");
    setNationality("United States");
    setPhone("");
    setPersonalEmail("");
    setAddress("");
    setCity("");
    setZipCode("");
    setEmergencyContact("");
    setEmergencyPhone("");
    setEmployeeId("");
    setJoinDate(new Date().toISOString().split("T")[0]);
    setRole("Employee");
    setEmpType("Full-Time");
    setDepartment(deptOptions[0] || "");
    setDesignation(desigOptions[0] || "");
    setBranch(locOptions[0] || "");
    setWorkMode("Office");
    setManager("");
    setBusinessUnit("");
    setTeam("");
    setShiftTemplate(shiftOptions[0] || "");
    setLeavePolicy("Standard Leave Policy");
    setWeeklyOff("Saturday & Sunday");
    setHolidayCalendar("");
  };

  const fullName = `${firstName || "New"} ${lastName || "Employee"}`;

  // ── Phase: invite-sent ───────────────────────────────────────────────────
  if (phase === "invite-sent")
    return (
      <div className="flex flex-col h-full text-left">
        <PageHeader
          title="Employee Added & Invited"
          breadcrumbs={[
            { label: "Home", onClick: () => navigate("my-space") },
            { label: "Organization", onClick: () => navigate("organization") },
            { label: "Add Employee" },
          ]}
        />
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-lg mx-auto bg-white rounded-xl border border-gray-200 p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto text-2xl font-bold">
              ✓
            </div>
            <h2 className="text-xl font-bold text-gray-900">Employee Created Successfully</h2>
            <p className="text-sm text-gray-500">
              <strong>{fullName}</strong> has been saved to Firestore under <strong>{role}</strong> role.
            </p>
            <div className="p-4 bg-gray-50 rounded-lg text-xs text-left space-y-2 font-mono">
              <p><strong>Email:</strong> {workEmail}</p>
              <p><strong>Role:</strong> {role} ({role.toLowerCase().replace(" ", "_")})</p>
              <p><strong>Department:</strong> {department || "General"}</p>
              <p><strong>Designation:</strong> {designation || "Staff"}</p>
            </div>
            <div className="flex gap-3 pt-4">
              <Btn variant="outline" className="flex-1" onClick={resetForm}>
                Add Another Employee
              </Btn>
              <Btn className="flex-1" onClick={() => navigate("organization")}>
                Go to Organization
              </Btn>
            </div>
          </div>
        </div>
      </div>
    );

  // ── Phase: form ───────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full text-left">
      <PageHeader
        title="Add Employee"
        breadcrumbs={[
          { label: "Home", onClick: () => navigate("my-space") },
          { label: "Organization", onClick: () => navigate("organization") },
          { label: "Add Employee" },
        ]}
      >
        <Btn variant="outline" onClick={() => navigate("organization")}>
          Cancel
        </Btn>
      </PageHeader>

      {/* Progress Steps Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0 overflow-x-auto">
        <div className="flex items-center min-w-[600px]">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <button
                onClick={() => i < step && setStep(i)}
                className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer"
              >
                <div
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors",
                    i < step
                      ? "bg-green-500 text-white"
                      : i === step
                      ? "bg-[#5C5CFF] text-white"
                      : "bg-gray-100 text-gray-400"
                  )}
                >
                  {i < step ? <Check size={13} /> : i + 1}
                </div>
                <span
                  className={cn(
                    "text-[10px] whitespace-nowrap",
                    i === step
                      ? "text-[#5C5CFF] font-medium"
                      : i < step
                      ? "text-green-600"
                      : "text-gray-400"
                  )}
                >
                  {s}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 flex-1 mx-2 mb-4",
                    i < step ? "bg-green-300" : "bg-gray-200"
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Form Body */}
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-2xl mx-auto">
          {step === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">
                Personal Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <InputField 
                  label="First Name" 
                  placeholder="First name" 
                  required 
                  value={firstName} 
                  onChange={setFirstName}
                />
                <InputField 
                  label="Last Name" 
                  placeholder="Last name" 
                  required 
                  value={lastName} 
                  onChange={setLastName}
                />
                <div className="col-span-2">
                  <InputField
                    label="Work Email"
                    type="email"
                    placeholder="email@company.com"
                    required
                    value={workEmail}
                    onChange={setWorkEmail}
                  />
                </div>
                <InputField 
                  label="Date of Birth" 
                  type="date" 
                  value={dob} 
                  onChange={setDob}
                />
                <SelectField label="Gender" value={gender} onChange={setGender}>
                  <option value="Select…">Select…</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-binary">Non-binary</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </SelectField>
                <InputField 
                  label="National ID" 
                  placeholder="ID / SSN number" 
                  value={nationalId} 
                  onChange={setNationalId}
                />
                <SelectField label="Nationality" value={nationality} onChange={setNationality}>
                  <option>United States</option>
                  <option>United Kingdom</option>
                  <option>Canada</option>
                  <option>India</option>
                  <option>Australia</option>
                  <option>Other</option>
                </SelectField>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">
                Contact Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <InputField
                  label="Phone Number"
                  type="tel"
                  placeholder="Phone number"
                  required
                  value={phone}
                  onChange={setPhone}
                />
                <InputField
                  label="Personal Email"
                  type="email"
                  placeholder="Personal email (optional)"
                  value={personalEmail}
                  onChange={setPersonalEmail}
                />
                <div className="col-span-2">
                  <InputField 
                    label="Address" 
                    placeholder="Street address" 
                    value={address} 
                    onChange={setAddress}
                  />
                </div>
                <InputField label="City" placeholder="City" value={city} onChange={setCity}/>
                <InputField label="Zip Code" placeholder="Postal / Zip code" value={zipCode} onChange={setZipCode}/>
                <InputField 
                  label="Emergency Contact" 
                  placeholder="Emergency contact name" 
                  required 
                  value={emergencyContact} 
                  onChange={setEmergencyContact}
                />
                <InputField
                  label="Emergency Phone"
                  type="tel"
                  placeholder="Emergency contact phone"
                  required
                  value={emergencyPhone}
                  onChange={setEmergencyPhone}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">
                Employment Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <InputField 
                  label="Employee ID" 
                  placeholder="e.g. EMP001 (auto-generated if empty)" 
                  value={employeeId} 
                  onChange={setEmployeeId}
                />
                <InputField 
                  label="Join Date" 
                  type="date" 
                  required 
                  value={joinDate} 
                  onChange={setJoinDate}
                />
                <SelectField label="System Role (Permission Level)" value={role} onChange={setRole} required>
                  <option value="Employee">Employee (Basic Access)</option>
                  <option value="Manager">Manager (Team Approval)</option>
                  <option value="HR Admin">HR Admin (HR Management)</option>
                  <option value="Super Admin">Super Admin (Full Access)</option>
                </SelectField>
                <SelectField label="Employment Type" value={empType} onChange={setEmpType}>
                  <option>Full-Time</option>
                  <option>Part-Time</option>
                  <option>Contract</option>
                  <option>Intern</option>
                </SelectField>
                <SelectField label="Department" value={department} onChange={setDepartment}>
                  {deptOptions.length > 0 ? (
                    deptOptions.map(d => <option key={d} value={d}>{d}</option>)
                  ) : (
                    <option value="">No departments added yet</option>
                  )}
                </SelectField>

                <SelectField label="Designation / Job Title" value={designation} onChange={setDesignation}>
                  {desigOptions.length > 0 ? (
                    desigOptions.map(d => <option key={d} value={d}>{d}</option>)
                  ) : (
                    <option value="">No designations added yet</option>
                  )}
                </SelectField>

                <SelectField label="Branch / Location" value={branch} onChange={setBranch}>
                  {locOptions.length > 0 ? (
                    locOptions.map(l => <option key={l} value={l}>{l}</option>)
                  ) : (
                    <option value="">No locations added yet</option>
                  )}
                </SelectField>
                <SelectField label="Work Mode" value={workMode} onChange={setWorkMode}>
                  <option>Office</option>
                  <option>WFH</option>
                  <option>Hybrid</option>
                </SelectField>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">
                Assign Team
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <SelectField label="Reporting Manager" value={manager} onChange={setManager}>
                    <option value="">Select Manager (optional)</option>
                    {managerOptions.map(m => <option key={m} value={m}>{m}</option>)}
                  </SelectField>
                </div>
                <InputField 
                  label="Business Unit" 
                  placeholder="Business unit" 
                  value={businessUnit} 
                  onChange={setBusinessUnit}
                />
                <InputField 
                  label="Team" 
                  placeholder="Team name" 
                  value={team} 
                  onChange={setTeam}
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">
                Shift &amp; Leave
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <SelectField label="Shift Template" value={shiftTemplate} onChange={setShiftTemplate}>
                  {shiftOptions.length > 0 ? (
                    shiftOptions.map(s => <option key={s} value={s}>{s}</option>)
                  ) : (
                    <option value="">No shifts created yet</option>
                  )}
                </SelectField>
                <SelectField label="Leave Policy" value={leavePolicy} onChange={setLeavePolicy}>
                  <option>Standard Policy</option>
                  <option>Executive Policy</option>
                  <option>Contractor Policy</option>
                </SelectField>
                <SelectField label="Weekly Off" value={weeklyOff} onChange={setWeeklyOff}>
                  <option>Saturday &amp; Sunday</option>
                  <option>Sunday only</option>
                  <option>Custom</option>
                </SelectField>
                <InputField 
                  label="Holiday Calendar" 
                  placeholder="Holiday calendar" 
                  value={holidayCalendar} 
                  onChange={setHolidayCalendar}
                />
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-5">
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-start gap-3">
                <Send size={15} className="text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-indigo-900">
                    Ready to Save &amp; Invite
                  </p>
                  <p className="text-xs text-indigo-700 mt-0.5">
                    Clicking "Save &amp; Send Invitation" will store this employee in Firestore under <strong>{role}</strong> role ({role.toLowerCase().replace(" ", "_")}).
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-sm font-semibold text-gray-800 mb-4">
                  Review Employee Profile
                </h3>
                <div className="space-y-4">
                  {[
                    {
                      label: "Personal & Contact",
                      items: [
                        ["Full Name", fullName],
                        ["Work Email", workEmail || "Not specified"],
                        ["Phone", phone || "Not specified"],
                        ["Join Date", joinDate],
                      ],
                    },
                    {
                      label: "Employment & Role",
                      items: [
                        ["System Role", `${role} (${role.toLowerCase().replace(" ", "_")})`],
                        ["Department", department || "None selected"],
                        ["Designation", designation || "None selected"],
                        ["Branch", branch || "None selected"],
                        ["Work Mode", workMode],
                      ],
                    },
                    {
                      label: "Team & Schedule",
                      items: [
                        ["Manager", manager || "None assigned"],
                        ["Shift Template", shiftTemplate || "None selected"],
                        ["Leave Policy", leavePolicy],
                      ],
                    },
                  ].map((s) => (
                    <div key={s.label} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          {s.label}
                        </h4>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {s.items.map(([k, v]) => (
                          <div key={k}>
                            <div className="text-xs text-gray-400">{k}</div>
                            <div className="text-sm font-medium text-gray-800">
                              {v}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="border-t border-gray-200 bg-white px-8 py-4 flex justify-between">
        <Btn variant="outline" onClick={() => (step > 0 ? setStep(step - 1) : navigate("organization"))}>
          <ChevronLeft size={16} />
          Back
        </Btn>
        {step < STEPS.length - 1 ? (
          <Btn onClick={() => {
            if (step === 0 && (!firstName.trim() || !lastName.trim() || !workEmail.trim())) {
              alert("Please fill in First Name, Last Name, and Work Email before continuing.");
              return;
            }
            setStep(step + 1);
          }}>
            Continue
            <ChevronRight size={16} />
          </Btn>
        ) : (
          <Btn onClick={handleSaveEmployee} disabled={sending}>
            <Send size={15} />
            {sending ? "Saving to Firestore..." : "Save & Send Invitation"}
          </Btn>
        )}
      </div>
    </div>
  );
}
