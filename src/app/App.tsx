import React from "react";
import { AppShell } from "./layouts/app-shell";
import { AuthProvider } from "@/shared/context/AuthContext";

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
