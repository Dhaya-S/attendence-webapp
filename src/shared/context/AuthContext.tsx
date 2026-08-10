import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, onSnapshot, setDoc, collection } from "firebase/firestore";
import { auth, db } from "@/shared/utils";

export type UserRole = "admin" | "super_admin" | "hr_admin" | "manager" | "employee";

export interface FeaturePermissions {
  admin: string[];
  hr_admin: string[];
  manager: string[];
  employee: string[];
}

export const DEFAULT_FEATURE_PERMISSIONS: FeaturePermissions = {
  admin: [
    "my-space", "dashboard-approval", "dashboard-leave", "team", "team-approval", "create-announcement", "organization", "attendance", "approve-attendance", "leave", "approve-leave",
    "tasks", "create-task", "documents", "settings", "support", "approvals", "reports"
  ],
  hr_admin: [
    "my-space", "dashboard-approval", "dashboard-leave", "team", "team-approval", "create-announcement", "organization", "attendance", "approve-attendance", "leave", "approve-leave",
    "tasks", "create-task", "documents", "support", "approvals", "reports"
  ],
  manager: [
    "my-space", "dashboard-approval", "dashboard-leave", "team", "team-approval", "create-announcement", "attendance", "approve-attendance", "leave", "approve-leave",
    "tasks", "create-task", "documents", "support", "approvals", "reports"
  ],
  employee: [
    "my-space", "dashboard-leave", "attendance", "leave", "tasks", "documents", "support"
  ],
};

/** Live organization profile — mirrors the Firestore organizations/{companyId} document */
export interface OrgProfile {
  companyName?: string;
  orgName?: string;
  name?: string;
  portalName?: string;
  businessType?: string;
  industry?: string;
  employeeCount?: string;
  website?: string;
  timezone?: string;
  dateFormat?: string;
  weekStartDay?: string;
  language?: string;
  address?: string;
  headquarters?: string;
  locations?: any[];
  departments?: any[];
  designations?: any[];
  shifts?: any[];
  leavePolicy?: Record<string, any>;
  attendancePolicy?: Record<string, any>;
  wfhPolicy?: Record<string, any>;
  leaveTypes?: any[];
  founded?: string;
  logo?: string;
  [key: string]: any;
}

export interface AppSession {
  user: User | null;
  role: UserRole | null;
  companyId: string | null;
  email: string | null;
  displayName: string | null;
  isLoading: boolean;
  isSetupComplete: boolean;
  featurePermissions: FeaturePermissions;
  hasPermission: (featureKey: string) => boolean;
  savePermissions: (newPermissions: FeaturePermissions) => Promise<void>;
  /** Live org profile — real-time listener on organizations/{companyId} */
  orgProfile: OrgProfile | null;
  /** Live org departments subcollection */
  orgDepartments: any[];
  /** Live org designations subcollection */
  orgDesignations: any[];
  /** Live org shifts subcollection */
  orgShifts: any[];
}

const AuthContext = createContext<AppSession>({
  user: null,
  role: null,
  companyId: null,
  email: null,
  displayName: null,
  isLoading: true,
  isSetupComplete: false,
  featurePermissions: DEFAULT_FEATURE_PERMISSIONS,
  hasPermission: () => true,
  savePermissions: async () => {},
  orgProfile: null,
  orgDepartments: [],
  orgDesignations: [],
  orgShifts: [],
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSetupComplete, setIsSetupComplete] = useState<boolean>(false);
  const [featurePermissions, setFeaturePermissions] = useState<FeaturePermissions>(DEFAULT_FEATURE_PERMISSIONS);

  // ── Global org data (real-time) ───────────────────────────────────────────
  const [orgProfile, setOrgProfile] = useState<OrgProfile | null>(null);
  const [orgDepartments, setOrgDepartments] = useState<any[]>([]);
  const [orgDesignations, setOrgDesignations] = useState<any[]>([]);
  const [orgShifts, setOrgShifts] = useState<any[]>([]);

  // 1. Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        const uEmail = authUser.email?.toLowerCase() || "";
        setUser(authUser);
        setEmail(uEmail);
        try {
          const approvedRef = doc(db, "approved_users", uEmail);
          const approvedSnap = await getDoc(approvedRef);

          if (approvedSnap.exists()) {
            const data = approvedSnap.data();
            const cid: string | null = data?.companyId || data?.orgId || null;
            const r: UserRole = (data?.role as UserRole) || "super_admin";
            const isSetupDone = (data?.setupComplete === true) || (!!cid && data?.setupComplete !== false && localStorage.getItem("hrms_setup_completed") === "true");

            setCompanyId(cid);
            setRole(r);
            setIsSetupComplete(isSetupDone);

            // Fetch display name
            let name = authUser.displayName || uEmail.split("@")[0];
            if (cid) {
              try {
                const orgUserRef = doc(db, "organizations", cid, "users", uEmail);
                const orgUserSnap = await getDoc(orgUserRef);
                if (orgUserSnap.exists()) {
                  const orgData = orgUserSnap.data();
                  name = orgData?.name || orgData?.fullName || name;
                }
              } catch (_) {}
            }
            setDisplayName(name);
          } else {
            // First time registration -> Auto-create approved_users record in Firestore
            try {
              await authUser.getIdToken(true);
            } catch (_) {}

            const initialDoc = {
              email: uEmail,
              role: "super_admin",
              status: "approved",
              setupComplete: false,
              uid: authUser.uid,
              createdAt: new Date().toISOString(),
            };

            try {
              await setDoc(doc(db, "approved_users", uEmail), initialDoc, { merge: true });
              await setDoc(doc(db, "user", uEmail), initialDoc, { merge: true });
              await setDoc(doc(db, "users", authUser.uid), initialDoc, { merge: true });
              console.log("Successfully created approved_users in Firestore for:", uEmail);
            } catch (createErr) {
              console.warn("Could not auto-create approved_users in Firestore:", createErr);
            }

            setRole("super_admin");
            setCompanyId(null);
            setIsSetupComplete(false);
            setDisplayName(authUser.displayName || uEmail.split("@")[0]);
          }
        } catch (err) {
          console.error("AuthContext: Error fetching user data:", err);
          const setupCompleted = localStorage.getItem("hrms_setup_completed") === "true";
          setRole("admin");
          setIsSetupComplete(setupCompleted);
          setDisplayName(authUser.displayName || uEmail.split("@")[0]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setUser(null);
        setRole(null);
        setCompanyId(null);
        setEmail(null);
        setDisplayName(null);
        setIsSetupComplete(false);
        setFeaturePermissions(DEFAULT_FEATURE_PERMISSIONS);
        setOrgProfile(null);
        setOrgDepartments([]);
        setOrgDesignations([]);
        setOrgShifts([]);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. Real-time Firestore Listeners for org data + feature permissions
  useEffect(() => {
    const activeCid = companyId || "default";

    const unsubs: (() => void)[] = [];

    // ── Root org document (companyName, policy, locations, etc.) ──────────
    const orgRef = doc(db, "organizations", activeCid);
    unsubs.push(
      onSnapshot(orgRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const cleanData = { ...data };
          if (data && data["----------"] && !data.locations) {
            cleanData.locations = data["----------"];
          }
          setOrgProfile({ id: snapshot.id, ...cleanData } as OrgProfile);

          if (data?.featurePermissions) {
            setFeaturePermissions({
              admin: data.featurePermissions.admin || DEFAULT_FEATURE_PERMISSIONS.admin,
              hr_admin: data.featurePermissions.hr_admin || DEFAULT_FEATURE_PERMISSIONS.hr_admin,
              manager: data.featurePermissions.manager || DEFAULT_FEATURE_PERMISSIONS.manager,
              employee: data.featurePermissions.employee || DEFAULT_FEATURE_PERMISSIONS.employee,
            });
          }
        }
      }, (error) => {
        console.warn("AuthContext: Error listening to org document:", error);
      })
    );

    // ── Departments subcollection ──────────────────────────────────────────
    unsubs.push(
      onSnapshot(collection(db, "organizations", activeCid, "departments"), (snap) => {
        setOrgDepartments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }, () => {})
    );

    // ── Designations subcollection ─────────────────────────────────────────
    unsubs.push(
      onSnapshot(collection(db, "organizations", activeCid, "designations"), (snap) => {
        setOrgDesignations(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }, () => {})
    );

    // ── Shifts subcollection ───────────────────────────────────────────────
    unsubs.push(
      onSnapshot(collection(db, "organizations", activeCid, "shifts"), (snap) => {
        setOrgShifts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }, () => {})
    );

    return () => unsubs.forEach(u => u());
  }, [companyId]);

  // 3. Permission Check Helper
  const hasPermission = (featureKey: string): boolean => {
    // If not authenticated or in demo mode without firebase user, allow all for demo smoothness
    if (!user) return true;

    // Super Admin (`admin` / `super_admin`) always has access to settings & access control
    if (role === "admin" || role === "super_admin") {
      if (featureKey === "settings" || featureKey === "manage-account" || featureKey === "user_control") return true;
      const adminPerms = featurePermissions.admin || DEFAULT_FEATURE_PERMISSIONS.admin;
      return adminPerms.includes(featureKey);
    }

    const rKey = role === "hr_admin" ? "hr_admin" : role === "manager" ? "manager" : "employee";
    const rolePerms = featurePermissions[rKey] || DEFAULT_FEATURE_PERMISSIONS[rKey];
    return rolePerms.includes(featureKey);
  };

  // 4. Save Permissions Helper (for Super Admin to update Firestore in real time)
  const savePermissions = async (newPermissions: FeaturePermissions) => {
    if (!companyId) return;
    const orgRef = doc(db, "organizations", companyId);
    await setDoc(orgRef, { featurePermissions: newPermissions }, { merge: true });
    setFeaturePermissions(newPermissions);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        companyId,
        email,
        displayName,
        isLoading,
        isSetupComplete,
        featurePermissions,
        hasPermission,
        savePermissions,
        orgProfile,
        orgDepartments,
        orgDesignations,
        orgShifts,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/** Hook to consume auth session anywhere in the app */
export function useAuth() {
  return useContext(AuthContext);
}
