import React from "react";
import { ShieldCheck, Activity, Download, CheckCircle2, AlertTriangle, Info, Lock } from "lucide-react";
import { AuditEvent } from "../../types";
import { AdvancedTable, Column } from "../../components/ui/AdvancedTable";
import { toast } from "sonner";

interface AuditSecurityProps {
  auditLogs: AuditEvent[];
}

export const AuditSecurity: React.FC<AuditSecurityProps> = ({ auditLogs }) => {
  const columns: Column<AuditEvent>[] = [
    {
      header: "Action Logged",
      sortable: true,
      accessor: "action",
      render: (a) => (
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-300 flex items-center justify-center shrink-0">
            <Activity size={14} />
          </div>
          <span className="font-bold text-slate-900 dark:text-white text-xs">{a.action}</span>
        </div>
      )
    },
    {
      header: "Target Entity",
      sortable: true,
      accessor: "entity",
      render: (a) => <span className="font-mono text-xs text-slate-700 dark:text-slate-300">{a.entity}</span>
    },
    {
      header: "Authorized Actor",
      sortable: true,
      accessor: "actor",
      render: (a) => (
        <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-md">
          {a.actor}
        </span>
      )
    },
    {
      header: "Severity Level",
      sortable: true,
      accessor: "severity",
      render: (a) => (
        <span
          className={`badge-status ${
            a.severity === "success"
              ? "badge-approved"
              : a.severity === "warning"
              ? "badge-pending"
              : "badge-draft"
          }`}
        >
          {a.severity === "success" ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
          {a.severity}
        </span>
      )
    },
    {
      header: "Event Timestamp",
      sortable: true,
      accessor: "time",
      render: (a) => (
        <span className="text-xs text-slate-400 font-mono">
          {new Date(a.time).toLocaleString()}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-['Manrope'] text-slate-900 dark:text-white">
            Audit Trail & Role-Based Access
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Immutable log of all administrative actions, KYC updates, and RBAC matrix enforcement.
          </p>
        </div>
      </div>

      {/* RBAC Matrix Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Lock size={17} className="text-purple-600" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Manrope']">
            RBAC Role Access Control Matrix
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-semibold">
                <th className="py-2.5 px-3">Role / Scope</th>
                <th className="py-2.5 px-3">Merchant KYC</th>
                <th className="py-2.5 px-3">Store Locations</th>
                <th className="py-2.5 px-3">Offers Approval</th>
                <th className="py-2.5 px-3">UPI Settlements</th>
                <th className="py-2.5 px-3">Audit Logs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {[
                { role: "Super Admin", kyc: "Full Access", store: "Full Access", offer: "Full Access", upi: "Full Access", audit: "Read/Export" },
                { role: "Operations Lead", kyc: "Review/Approve", store: "Geocode Verify", offer: "Review/Approve", upi: "View Only", audit: "View Only" },
                { role: "Financial Analyst", kyc: "View Only", store: "View Only", offer: "View Only", upi: "Full Ledger", audit: "View Only" },
                { role: "Merchant Partner", kyc: "Submit Own", store: "Add Own Branch", offer: "Submit Own", upi: "Own Store Feed", audit: "None" }
              ].map((r) => (
                <tr key={r.role}>
                  <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">{r.role}</td>
                  <td className="py-3 px-3 text-emerald-600 font-semibold">{r.kyc}</td>
                  <td className="py-3 px-3 text-purple-600 font-semibold">{r.store}</td>
                  <td className="py-3 px-3 text-pink-600 font-semibold">{r.offer}</td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-400">{r.upi}</td>
                  <td className="py-3 px-3 text-slate-500">{r.audit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Advanced Audit Log Table */}
      <AdvancedTable
        title="Administrative Audit Trail Log"
        subtitle={`${auditLogs.length} immutable events recorded in cryptographic ledger`}
        columns={columns}
        data={auditLogs}
        keyExtractor={(a) => a.id}
        searchPlaceholder="Search action, target entity, or authorized actor..."
        searchFilter={(a, q) =>
          a.action.toLowerCase().includes(q) ||
          a.entity.toLowerCase().includes(q) ||
          a.actor.toLowerCase().includes(q) ||
          a.severity.toLowerCase().includes(q)
        }
      />
    </div>
  );
};
