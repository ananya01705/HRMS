import React, { useState, useEffect } from "react";
import apiClient from "../../shared/api/client";
import { CreditCard, Activity, ShieldCheck, Download, AlertTriangle, CheckCircle, RefreshCw, FileText } from "lucide-react";
import { useAuth } from "../../shared/context/AuthContext";

export const PayrollAnalyticsModule = () => {
  const { user } = useAuth();
  const [payrollData, setPayrollData] = useState(null);
  const [burnoutRisks, setBurnoutRisks] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("payslip");

  const isAdminOrHR = user?.role === "admin" || user?.role === "hr_officer";

  const fetchData = async () => {
    setLoading(true);
    try {
      const payRes = await apiClient.get("/api/payroll/my-payslip");
      setPayrollData(payRes.data);

      if (isAdminOrHR) {
        const [riskRes, auditRes, sumRes] = await Promise.all([
          apiClient.get("/api/analytics/burnout-risk"),
          apiClient.get("/api/analytics/audit-logs"),
          apiClient.get("/api/analytics/dashboard-summary"),
        ]);
        setBurnoutRisks(riskRes.data);
        setAuditLogs(auditRes.data);
        setSummary(sumRes.data);
      }
    } catch (err) {
      console.error("Failed to load payroll / analytics data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" /> Loading payroll & analytics module...
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Payroll, Compliance & HR Intelligence</h1>
        <p className="text-sm text-slate-400">
          Salary structures, automated burnout risk indicators, and PostgreSQL JSONB audit logs.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-800">
        <button
          onClick={() => setActiveTab("payslip")}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "payslip"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <CreditCard className="w-4 h-4" /> My Payslip & Salary
        </button>

        {isAdminOrHR && (
          <>
            <button
              onClick={() => setActiveTab("burnout_index")}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === "burnout_index"
                  ? "border-indigo-500 text-indigo-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Activity className="w-4 h-4 text-rose-400" /> Burnout Risk Index (AI/SQL)
            </button>
            <button
              onClick={() => setActiveTab("audit_trail")}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === "audit_trail"
                  ? "border-indigo-500 text-indigo-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> PostgreSQL Audit Trail
            </button>
          </>
        )}
      </div>

      {/* Tab 1: Payslip View */}
      {activeTab === "payslip" && payrollData && (
        <div className="max-w-2xl bg-slate-900/90 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-bold text-white">Monthly Payslip Statement</h2>
              <p className="text-xs text-slate-400">Employee: {payrollData.employee_name} ({payrollData.employee_code})</p>
            </div>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium no-print"
            >
              <Download className="w-3.5 h-3.5" /> Download PDF
            </button>
          </div>

          {/* Breakdown Grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Base Salary</span>
              <span className="text-lg font-bold text-white font-mono">${payrollData.basic_salary?.toLocaleString()}</span>
            </div>
            <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Housing & Transport Allowances</span>
              <span className="text-lg font-bold text-emerald-400 font-mono">+${payrollData.allowances?.toLocaleString()}</span>
            </div>
            <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Tax & Benefits Deductions</span>
              <span className="text-lg font-bold text-rose-400 font-mono">-${payrollData.deductions?.toLocaleString()}</span>
            </div>
            <div className="bg-indigo-600/20 p-4 rounded-xl border border-indigo-500/30">
              <span className="text-xs text-indigo-300 block mb-1">Net Payable Salary</span>
              <span className="text-xl font-extrabold text-indigo-300 font-mono">${payrollData.net_salary?.toLocaleString()}</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 text-center border-t border-slate-800 pt-4">
            Generated securely by Dayflow HRMS Engine • Verified by Payroll System
          </div>
        </div>
      )}

      {/* Tab 2: Burnout Risk Index */}
      {activeTab === "burnout_index" && isAdminOrHR && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-rose-900/30 via-slate-900 to-indigo-900/30 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-rose-400" /> Automated Workforce Burnout Risk Index
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Calculates overtime hours (past 30d), consecutive workdays, and leave intake patterns natively in SQL to predict employee fatigue before it causes turnover.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {burnoutRisks.map((risk) => (
              <div
                key={risk.user_id}
                className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-white text-base">{risk.employee_name}</h3>
                      <span className="text-xs text-slate-400 font-mono">{risk.employee_code} • {risk.department}</span>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase ${
                        risk.risk_level === "Critical"
                          ? "bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse"
                          : risk.risk_level === "High"
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      }`}
                    >
                      {risk.risk_level} Risk
                    </span>
                  </div>

                  {/* Meter Bar */}
                  <div className="mt-4 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Risk Score</span>
                      <span className="font-mono font-bold text-white">{risk.risk_score} / 100</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full ${
                          risk.risk_score >= 75
                            ? "bg-rose-500"
                            : risk.risk_score >= 50
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                        style={{ width: `${risk.risk_score}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs bg-slate-800/40 p-3 rounded-xl">
                    <div>
                      <span className="text-slate-500 text-[10px] block">Overtime (30d)</span>
                      <span className="font-mono text-slate-200 font-bold">{risk.overtime_hours_30d} hrs</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Leave (90d)</span>
                      <span className="font-mono text-slate-200 font-bold">{risk.leave_days_taken_90d} days</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/60 p-3 rounded-xl text-xs text-slate-300 border border-slate-700/50">
                  <span className="font-semibold text-indigo-400 block text-[10px] uppercase mb-0.5">Recommendation</span>
                  {risk.recommendation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: System Audit Log */}
      {activeTab === "audit_trail" && isAdminOrHR && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" /> PostgreSQL JSONB System Audit Log
              </h2>
              <p className="text-xs text-slate-400">
                Immutable audit trail triggered automatically on table mutation events (`INSERT`, `UPDATE`, `DELETE`).
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 border-b border-slate-800 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="pb-3">Timestamp</th>
                  <th className="pb-3">Table</th>
                  <th className="pb-3">Action</th>
                  <th className="pb-3">Actor</th>
                  <th className="pb-3">Mutated JSON Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-6 text-center text-slate-500">
                      No audit records captured yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="py-3 font-mono text-slate-400 text-[11px]">
                        {new Date(log.changed_at).toLocaleString()}
                      </td>
                      <td className="py-3 font-mono font-bold text-indigo-300">{log.table_name}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            log.action === "INSERT"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : log.action === "UPDATE"
                              ? "bg-amber-500/20 text-amber-400"
                              : "bg-rose-500/20 text-rose-400"
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 font-medium text-slate-200">{log.actor_name}</td>
                      <td className="py-3 max-w-xs font-mono text-[10px] text-slate-400 truncate">
                        {JSON.stringify(log.new_data || log.old_data)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
