import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../shared/context/AuthContext";
import {
  LayoutDashboard,
  Users,
  Clock,
  CalendarDays,
  CreditCard,
  ShieldCheck,
  LogOut,
  Building2,
} from "lucide-react";

export const Sidebar = () => {
  const { user, logout } = useAuth();

  const navItems = [
    { label: "Dashboard", path: "/", icon: LayoutDashboard, roles: ["admin", "hr_officer", "employee"] },
    { label: "Employee Directory", path: "/employees", icon: Users, roles: ["admin", "hr_officer"] },
    { label: "Attendance Tracker", path: "/attendance", icon: Clock, roles: ["admin", "hr_officer", "employee"] },
    { label: "Leave Management", path: "/leave", icon: CalendarDays, roles: ["admin", "hr_officer", "employee"] },
    { label: "Payroll & Salary", path: "/payroll", icon: CreditCard, roles: ["admin", "hr_officer", "employee"] },
    { label: "Audit & Compliance", path: "/audit", icon: ShieldCheck, roles: ["admin", "hr_officer"] },
  ];

  const allowedItems = navItems.filter((item) => item.roles.includes(user?.role));

  return (
    <aside className="w-64 bg-slate-900/90 border-r border-slate-800 flex flex-col justify-between h-screen sticky top-0 no-print z-30">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white leading-tight tracking-tight">Dayflow</h1>
            <p className="text-[10px] uppercase font-semibold tracking-wider text-indigo-400">Enterprise HRMS</p>
          </div>
        </div>

        {/* User Card */}
        <div className="p-4 mx-3 my-4 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-600/30 text-indigo-300 font-bold flex items-center justify-center border border-indigo-500/30 text-sm shrink-0">
            {user?.full_name?.charAt(0) || "U"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate">{user?.full_name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[11px] font-medium text-slate-400 capitalize">{user?.role?.replace("_", " ")}</span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="px-3 space-y-1 mt-2">
          {allowedItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Logout Button */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
