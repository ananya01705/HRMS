import React, { useState } from "react";
import { AuthProvider, useAuth } from "./shared/context/AuthContext";
import { AuthView } from "./modules/auth/AuthView";
import { Navbar } from "./components/Navbar";
import { Sidebar } from "./components/Sidebar";
import { AttendanceLeaveModule } from "./modules/attendance-leave/AttendanceLeaveModule";
import { AdminApprovalsModule } from "./modules/attendance-leave/AdminApprovalsModule";
import { PayrollAnalyticsModule } from "./modules/payroll-analytics/PayrollAnalyticsModule";

function DashboardContent() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("attendance");

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent mr-3"></div>
        <span>Initializing Dayflow HRMS...</span>
      </div>
    );
  }

  if (!user) {
    return <AuthView />;
  }

  const isAdminOrHR = user.role === "admin" || user.role === "hr_officer";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 overflow-y-auto">
          {activeTab === "attendance" && <AttendanceLeaveModule />}
          {activeTab === "approvals" && isAdminOrHR && <AdminApprovalsModule />}
          {activeTab === "payroll" && <PayrollAnalyticsModule />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  );
}
