import React, { useState, useEffect, useRef } from "react";
import { Search, Check, AlertCircle } from "lucide-react";
import { Employee } from "@/shared/types";
import { cn } from "@/shared/utils";
import { useAuth } from "@/shared/context/AuthContext";
import { db, auth } from "@/shared/utils/firebase";
import { collection, onSnapshot, getDoc, doc, query, where } from "firebase/firestore";

interface AssigneeSelectorProps {
  selectedAssigneeId?: string;
  selectedAssigneeEmail?: string;
  onSelect: (assignee: { id: string; name: string; email: string } | null, error?: string | null) => void;
  currentUserDept?: string;
}

export function AssigneeSelector({
  selectedAssigneeId,
  selectedAssigneeEmail,
  onSelect,
  currentUserDept = "HR",
}: AssigneeSelectorProps) {
  const { companyId } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [employeesList, setEmployeesList] = useState<Employee[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch Real-time Employees from Firestore strictly for the active company
  useEffect(() => {
    let unsubOrg: any = null;
    let unsubApp: any = null;

    async function loadCompanyEmployees() {
      const userEmail = (auth.currentUser?.email || "").toLowerCase();
      let targetCompanyId = companyId && companyId !== "default" ? companyId : "";

      if (!targetCompanyId && userEmail) {
        try {
          const appSnap = await getDoc(doc(db, "approved_users", userEmail));
          if (appSnap.exists()) {
            targetCompanyId = appSnap.data().companyId || appSnap.data().orgId || "";
          }
        } catch (_) {}
      }

      if (!targetCompanyId) {
        targetCompanyId = "default";
      }

      try {
        unsubOrg = onSnapshot(
          collection(db, "organizations", targetCompanyId, "users"),
          (snap) => {
            if (!snap.empty) {
              const list = snap.docs.map((d) => {
                const u = d.data();
                const name = u.name || `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email || "Employee";
                const initials = u.initials || name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "EM";
                return {
                  id: d.id || u.id || u.email,
                  name,
                  initials,
                  color: u.color || "#5C5CFF",
                  email: u.email || u.workEmail || "",
                  dept: u.dept || u.department || "General",
                  designation: u.designation || u.jobTitle || u.roleLabel || "Staff",
                  role: u.role || "Employee",
                  status: u.status || "Active",
                } as Employee;
              });
              setEmployeesList(list);
            }
          },
          (err) => {
            console.warn("Error listening to company users:", err);
          }
        );
      } catch (_) {}

      try {
        const qApp = query(collection(db, "approved_users"), where("companyId", "==", targetCompanyId));
        unsubApp = onSnapshot(
          qApp,
          (snap) => {
            if (!snap.empty) {
              const approvedList = snap.docs.map((d) => {
                const u = d.data();
                const name = u.name || u.displayName || `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email || "Employee";
                const initials = u.initials || name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "EM";
                return {
                  id: d.id || u.email,
                  name,
                  initials,
                  color: u.color || "#5C5CFF",
                  email: u.email || "",
                  dept: u.dept || u.department || "General",
                  designation: u.designation || u.roleLabel || "Staff",
                  role: u.role || "Employee",
                  status: u.status || "Active",
                } as Employee;
              });

              setEmployeesList((prev) => {
                const map = new Map<string, Employee>();
                prev.forEach((e) => { if (e.email) map.set(e.email.toLowerCase(), e); });
                approvedList.forEach((e) => {
                  if (e.email && !map.has(e.email.toLowerCase())) {
                    map.set(e.email.toLowerCase(), e);
                  }
                });
                return Array.from(map.values());
              });
            }
          },
          (err) => {
            console.warn("Error listening to approved_users:", err);
          }
        );
      } catch (_) {}
    }

    loadCompanyEmployees();

    return () => {
      if (unsubOrg) unsubOrg();
      if (unsubApp) unsubApp();
    };
  }, [companyId]);

  const activeEmployees = employeesList;

  // Find the selected employee based on ID or manual email
  const selectedEmp = activeEmployees.find(
    (e) => e.id === selectedAssigneeId || (selectedAssigneeEmail && e.email.toLowerCase() === selectedAssigneeEmail.toLowerCase())
  );

  // Group employees: Team Members first, then others
  const teamMembers = activeEmployees.filter((e) => (e.dept || "").toLowerCase() === currentUserDept.toLowerCase());
  const otherMembers = activeEmployees.filter((e) => (e.dept || "").toLowerCase() !== currentUserDept.toLowerCase());

  // Filter lists based on search string
  const filterList = (list: Employee[]) => {
    return list.filter(
      (e) =>
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.email.toLowerCase().includes(search.toLowerCase())
    );
  };

  const filteredTeam = filterList(teamMembers);
  const filteredOthers = filterList(otherMembers);

  const handleInviteEmail = (emailStr: string) => {
    const trimmed = emailStr.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setEmailError("Enter a valid company email address.");
      onSelect(null, "Enter a valid company email address.");
      return;
    }

    setEmailError(null);
    const namePrefix = trimmed.split("@")[0];
    const formattedName = namePrefix
      .split(/[._-]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");

    onSelect({
      id: `manual-${Date.now()}`,
      name: formattedName,
      email: trimmed,
    });
    setIsOpen(false);
    setSearch("");
  };

  // Validate manual email entry
  const validateAndSelectEmail = (emailStr: string) => {
    const trimmed = emailStr.trim();
    if (!trimmed) {
      setEmailError(null);
      return;
    }

    // Standard email check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setEmailError("Enter a valid company email address.");
      onSelect(null, "Enter a valid company email address.");
      return;
    }

    // Check if it belongs to an existing employee
    const matchedEmp = activeEmployees.find((e) => e.email.toLowerCase() === trimmed.toLowerCase());
    if (matchedEmp) {
      setEmailError(null);
      onSelect({
        id: matchedEmp.id,
        name: matchedEmp.name,
        email: matchedEmp.email,
      });
    } else {
      // Invite by email
      setEmailError(null);
      const namePrefix = trimmed.split("@")[0];
      const formattedName = namePrefix
        .split(/[._-]/)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
      onSelect({
        id: `manual-${Date.now()}`,
        name: formattedName,
        email: trimmed,
      });
    }
    setSearch("");
  };

  const handleSelectEmployee = (emp: Employee) => {
    setEmailError(null);
    onSelect({
      id: emp.id,
      name: emp.name,
      email: emp.email,
    });
    setIsOpen(false);
    setSearch("");
  };

  const handleManualEmailSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const trimmed = search.trim();
      const matchedEmp = activeEmployees.find((emp) => emp.email.toLowerCase() === trimmed.toLowerCase());
      if (matchedEmp) {
        handleSelectEmployee(matchedEmp);
      } else {
        handleInviteEmail(search);
      }
    }
  };

  const handleBlur = () => {
    if (search.includes("@")) {
      validateAndSelectEmail(search);
    }
  };

  return (
    <div className="relative text-left" ref={containerRef}>
      <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
        Assignee
      </label>

      {/* Select trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full h-10 px-3.5 bg-white border border-[#E5E7EB] rounded-xl flex items-center justify-between hover:border-gray-300 transition-all cursor-pointer text-left focus:outline-none focus:ring-1 focus:ring-[#5C5CFF]"
        )}
      >
        {selectedEmp ? (
          <div className="flex items-center gap-2.5">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
              style={{ backgroundColor: selectedEmp.color || "#5C5CFF" }}
            >
              {selectedEmp.initials}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-semibold text-gray-900 block truncate">
                {selectedEmp.name}
              </span>
              <span className="text-[9px] text-gray-500 block truncate mt-[-2px]">
                {selectedEmp.designation}
              </span>
            </div>
          </div>
        ) : selectedAssigneeEmail ? (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-red-50 text-red-500 flex items-center justify-center text-[10px] font-bold">
              ?
            </div>
            <span className="text-xs text-red-500 font-medium truncate">
              {selectedAssigneeEmail} (Unresolved)
            </span>
          </div>
        ) : (
          <span className="text-xs text-gray-400 font-medium">
            Search team member or email...
          </span>
        )}
        <span className="text-gray-400 text-xs font-medium">▼</span>
      </button>

      {/* Email Error Toast-like warning */}
      {emailError && (
        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-red-500 font-medium bg-red-50/50 p-2 rounded-lg border border-red-100">
          <AlertCircle size={12} className="flex-shrink-0" />
          <span>{emailError}</span>
        </div>
      )}

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute top-[44px] left-0 right-0 z-50 bg-white border border-[#E5E7EB] rounded-xl shadow-xl flex flex-col overflow-hidden max-h-[300px]">
          {/* Search box */}
          <div className="p-2 border-b border-gray-100 flex items-center gap-2">
            <Search size={14} className="text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search name or type company email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleManualEmailSubmit}
              onBlur={handleBlur}
              className="w-full text-xs text-gray-900 placeholder-gray-400 bg-transparent border-0 outline-none"
              autoFocus
            />
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto py-1 divide-y divide-gray-50">
            {/* Group 1: Team Members */}
            {filteredTeam.length > 0 && (
              <div>
                <div className="px-3 py-1 bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Recent / Team Members
                </div>
                {filteredTeam.map((emp) => (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => handleSelectEmployee(emp)}
                    className="w-full px-3.5 py-2 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer text-left focus:outline-none"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                        style={{ backgroundColor: emp.color || "#5C5CFF" }}
                      >
                        {emp.initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-900 truncate">
                          {emp.name}
                        </p>
                        <p className="text-[10px] text-gray-400 truncate mt-0.5">
                          {emp.email}
                        </p>
                      </div>
                    </div>
                    {selectedAssigneeId === emp.id && (
                      <Check size={14} className="text-[#5C5CFF]" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Group 2: Other Employees */}
            {filteredOthers.length > 0 && (
              <div>
                <div className="px-3 py-1 bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Other Employees
                </div>
                {filteredOthers.map((emp) => (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => handleSelectEmployee(emp)}
                    className="w-full px-3.5 py-2 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer text-left focus:outline-none"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                        style={{ backgroundColor: emp.color || "#5C5CFF" }}
                      >
                        {emp.initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-900 truncate">
                          {emp.name}
                        </p>
                        <p className="text-[10px] text-gray-400 truncate mt-0.5">
                          {emp.email}
                        </p>
                      </div>
                    </div>
                    {selectedAssigneeId === emp.id && (
                      <Check size={14} className="text-[#5C5CFF]" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {filteredTeam.length === 0 && filteredOthers.length === 0 && (
              <div className="p-4 text-center text-xs text-gray-400">
                {search.includes("@") ? (
                  <div>
                    <p className="font-semibold text-gray-700">Press Enter or blur to validate:</p>
                    <p className="text-[10px] mt-0.5 text-gray-400 break-all">{search}</p>
                  </div>
                ) : (
                  "No matching team member found"
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
