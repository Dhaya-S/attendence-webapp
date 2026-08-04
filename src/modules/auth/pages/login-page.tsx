import React, { useState } from "react";
import { Users, Clock, CheckCircle, RefreshCw, AlertCircle } from "lucide-react";
import { InputField } from "@/shared/components";
import { auth, db } from "@/shared/utils";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"sso" | "email" | "register">("sso");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleEmailLogin = async () => {
    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onLogin();
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      onLogin();
    } catch (err: any) {
      setError(err.message || "Failed to sign in with Google.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setLoading(true);
    setError("");
    setTimeout(() => {
      setLoading(false);
      onLogin();
    }, 1000);
  };

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    setError("");
    localStorage.removeItem("hrms_setup_completed");
    localStorage.setItem("hrms_just_registered", "true");
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const emailLower = email.trim().toLowerCase();

      // Ensure Firebase Auth token is active for Firestore rules
      try {
        await user.getIdToken(true);
      } catch (_) {}

      const approvedData = {
        email: emailLower,
        role: "super_admin",
        status: "approved",
        setupComplete: false,
        uid: user.uid,
        createdAt: new Date().toISOString()
      };

      // 1. Write to /approved_users/{emailLower}
      try {
        await setDoc(doc(db, "approved_users", emailLower), approvedData, { merge: true });
        console.log("Successfully wrote approved_users document for:", emailLower);
      } catch (fErr) {
        console.error("Error writing to approved_users collection:", fErr);
      }

      // 2. Also write to /user/{emailLower} and /users/{user.uid}
      try {
        await setDoc(doc(db, "user", emailLower), approvedData, { merge: true });
        await setDoc(doc(db, "users", user.uid), approvedData, { merge: true });
      } catch (uErr) {
        console.warn("Could not write user doc to /user or /users collection:", uErr);
      }

      localStorage.removeItem("hrms_setup_completed");
      localStorage.setItem("hrms_just_registered", "true");
      if (onRegister) {
        onRegister();
      } else {
        onLogin();
      }
    } catch (err: any) {
      console.error("Account creation failed:", err);
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex text-left">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-[52%] bg-[#5C5CFF] flex-col justify-between p-12 relative overflow-hidden">
        {/* Abstract background shapes */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5" />
          <div className="absolute top-1/3 -left-8 w-48 h-48 rounded-full bg-white/5" />
          <div className="absolute bottom-12 right-12 w-96 h-96 rounded-full bg-white/5" />
        </div>
        <div className="relative flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
            <Users size={20} className="text-white" />
          </div>
          <span className="text-white font-semibold text-lg">Attendance HRMS</span>
        </div>
        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs px-3 py-1.5 rounded-full mb-5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse" />
            <span>Enterprise Edition · Trusted by 200+ organizations</span>
          </div>
          <h2 className="text-4xl font-light text-white leading-tight mb-6">
            Your complete
            <br />
            <span className="font-semibold">HR Workspace.</span>
          </h2>
          <p className="text-white/70 text-sm mb-8 leading-relaxed max-w-sm">
            Attendance, leave, shifts, teams, and approvals — unified in one
            intelligent platform built for growing organizations.
          </p>
          <div className="space-y-3">
            {[
              { icon: Users, text: "Unified employee management" },
              { icon: Clock, text: "Real-time attendance & shift tracking" },
              { icon: CheckCircle, text: "Smart approvals & delegation" },
            ].map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-3 text-white/80 text-sm"
              >
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Icon size={14} className="text-white" />
                </div>
                {text}
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-white/30 text-xs">
          © 2024 Attendance HRMS. All rights reserved.
        </p>
      </div>

      {/* Right sign-in panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-[#5C5CFF] rounded-lg flex items-center justify-center">
              <Users size={16} className="text-white" />
            </div>
            <span className="font-semibold text-gray-800">Attendance HRMS</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">
            {mode === "register" ? "Create Admin Account" : "Sign in"}
          </h1>
          <p className="text-gray-555 text-sm mb-8">
            {mode === "register" ? "Set up your workspace credentials" : "Access your admin workspace"}
          </p>

          {error && (
            <div className="p-3 mb-4 bg-red-50 border border-red-100 rounded-lg text-xs text-red-705 flex items-center gap-2 text-left">
              <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {mode === "sso" ? (
            <div className="space-y-3">
              {/* SSO buttons */}
              <button
                onClick={handleGoogleLogin}
                className="w-full flex items-center gap-3 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 cursor-pointer"
              >
                {/* Google icon */}
                <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Continue with Google
              </button>
              <button
                onClick={handleDemoLogin}
                className="w-full flex items-center gap-3 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 cursor-pointer"
              >
                {/* Microsoft icon */}
                <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0">
                  <rect x="1" y="1" width="10" height="10" fill="#F25022" />
                  <rect x="13" y="1" width="10" height="10" fill="#7FBA00" />
                  <rect x="1" y="13" width="10" height="10" fill="#00A4EF" />
                  <rect x="13" y="13" width="10" height="10" fill="#FFB900" />
                </svg>
                Continue with Microsoft
              </button>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-xs text-gray-400">or</span>
                </div>
              </div>
              <button
                onClick={() => setMode("email")}
                className="w-full py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Sign in with Email
              </button>
              
              <div className="mt-6 text-center text-xs text-gray-500">
                New user?{" "}
                <button
                  onClick={() => {
                    setError("");
                    setMode("register");
                  }}
                  className="text-[#5C5CFF] font-semibold hover:underline cursor-pointer bg-transparent border-0 p-0"
                >
                  Create an Admin account
                </button>
              </div>
            </div>
          ) : mode === "email" ? (
            <div className="space-y-4">
              <button
                onClick={() => setMode("sso")}
                className="flex items-center gap-1.5 text-xs text-[#5C5CFF] hover:underline mb-2 cursor-pointer bg-transparent border-0 p-0"
              >
                Back to sign-in options
              </button>
              <InputField
                label="Work Email"
                type="email"
                placeholder="admin@company.com"
                value={email}
                onChange={setEmail}
              />
              <div className="flex flex-col gap-1.5 text-left">
                <div className="flex justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <button className="text-xs text-[#5C5CFF] hover:underline cursor-pointer">
                    Forgot password?
                  </button>
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5C5CFF]"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-gray-300 accent-[#5C5CFF]"
                />
                <label className="text-sm text-gray-600">Keep me signed in</label>
              </div>
              <button
                onClick={handleEmailLogin}
                disabled={loading}
                className="w-full py-2.5 bg-[#5C5CFF] text-white text-sm font-medium rounded-lg hover:bg-[#4A4AE0] transition-colors disabled:opacity-70 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Signing in…
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
              
              <div className="mt-4 text-center text-xs text-gray-500">
                New user?{" "}
                <button
                  onClick={() => {
                    setError("");
                    setMode("register");
                  }}
                  className="text-[#5C5CFF] font-semibold hover:underline cursor-pointer bg-transparent border-0 p-0"
                >
                  Create an Admin account
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={() => setMode("sso")}
                className="flex items-center gap-1.5 text-xs text-[#5C5CFF] hover:underline mb-2 cursor-pointer bg-transparent border-0 p-0"
              >
                Back to sign-in options
              </button>
              <InputField
                label="Work Email"
                type="email"
                placeholder="admin@company.com"
                value={email}
                onChange={setEmail}
              />
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5C5CFF]"
                />
              </div>
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <input
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5C5CFF]"
                />
              </div>
              <button
                onClick={handleRegister}
                disabled={loading}
                className="w-full py-2.5 bg-[#5C5CFF] text-white text-sm font-medium rounded-lg hover:bg-[#4A4AE0] transition-colors disabled:opacity-70 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Creating account…
                  </>
                ) : (
                  "Create Account & Continue"
                )}
              </button>
              
              <div className="text-center text-xs text-gray-500">
                Already have an account?{" "}
                <button
                  onClick={() => {
                    setError("");
                    setMode("sso");
                  }}
                  className="text-[#5C5CFF] font-semibold hover:underline cursor-pointer bg-transparent border-0 p-0"
                >
                  Sign in
                </button>
              </div>
            </div>
          )}

          <p className="mt-8 text-center text-xs text-gray-400">
            By signing in you agree to our{" "}
            <button className="text-[#5C5CFF] hover:underline cursor-pointer">
              Terms of Service
            </button>{" "}
            and{" "}
            <button className="text-[#5C5CFF] hover:underline cursor-pointer">
              Privacy Policy
            </button>
            .
          </p>
          <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg text-left">
            <p className="text-xs text-blue-700 font-medium mb-0.5">Demo access</p>
            <p className="text-xs text-blue-600">
              Click Microsoft SSO for demo access, or click <button onClick={handleDemoLogin} className="text-[#5C5CFF] font-semibold hover:underline bg-transparent border-0 p-0 cursor-pointer">here</button> to continue with demo credentials.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
