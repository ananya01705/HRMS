import React, { useState } from "react";
import { useAuth } from "../../shared/context/AuthContext";
import { Building2, Shield, UserCheck, Key, UserPlus, LogIn } from "lucide-react";

export const AuthView = () => {
  const { login, signup } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [employeeCode, setEmployeeCode] = useState("");
  const [department, setDepartment] = useState("Engineering");
  const [designation, setDesignation] = useState("Software Engineer");
  const [role, setRole] = useState("employee");
  const [basicSalary, setBasicSalary] = useState(75000);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignup) {
        await signup({
          email,
          password,
          full_name: fullName,
          employee_code: employeeCode || `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
          department,
          designation,
          role,
          basic_salary: Number(basicSalary),
        });
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Authentication failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  // Quick preset demo logins for hackathon evaluation
  const handleQuickLogin = async (demoEmail, demoPassword) => {
    setError("");
    setLoading(true);
    try {
      await login(demoEmail, demoPassword);
    } catch (err) {
      setError(err.response?.data?.detail || `Failed to log in as ${demoEmail}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl p-8 relative z-10 backdrop-blur-xl">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-indigo-500/30 mb-3">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Dayflow HRMS</h1>
          <p className="text-xs text-slate-400 mt-1">Real-Time Enterprise Workforce Management</p>
        </div>

        {/* 1-Click Demo Login Presets */}
        <div className="mb-6 bg-slate-800/60 border border-slate-700/60 rounded-xl p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400 mb-2 text-center">
            ⚡ Quick Demo Logins for Hackathon Judging
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin("admin@dayflow.com", "admin123")}
              className="py-1.5 px-2 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-medium transition-colors text-center"
            >
              👑 Admin
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin("hr@dayflow.com", "hr123")}
              className="py-1.5 px-2 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-medium transition-colors text-center"
            >
              👔 HR Officer
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin("alex@dayflow.com", "emp123")}
              className="py-1.5 px-2 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-medium transition-colors text-center"
            >
              🧑‍💻 Employee
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Sarah Connor"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Employee Code</label>
                  <input
                    type="text"
                    value={employeeCode}
                    onChange={(e) => setEmployeeCode(e.target.value)}
                    placeholder="EMP-1004"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="employee">Employee</option>
                    <option value="hr_officer">HR Officer</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Basic Salary ($)</label>
                  <input
                    type="number"
                    value={basicSalary}
                    onChange={(e) => setBasicSalary(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@dayflow.com"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-lg shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
            ) : isSignup ? (
              <>
                <UserPlus className="w-4 h-4" /> Create Account
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" /> Sign In
              </>
            )}
          </button>
        </form>

        {/* Toggle Login/Signup */}
        <div className="mt-6 text-center border-t border-slate-800 pt-4">
          <button
            type="button"
            onClick={() => setIsSignup(!isSignup)}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
          >
            {isSignup ? "Already have an account? Sign In" : "Need a new account? Register here"}
          </button>
        </div>
      </div>
    </div>
  );
};
