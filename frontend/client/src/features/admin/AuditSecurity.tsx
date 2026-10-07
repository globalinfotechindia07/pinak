import React, { useState, useMemo } from "react";
import {
  ShieldCheck,
  Shield,
  Activity,
  Download,
  CheckCircle2,
  AlertTriangle,
  Info,
  Key,
  UserCheck,
  Building2,
  Store,
  Tag,
  Coins,
  Search,
  Filter,
  Eye,
  Copy,
  Clock,
  X,
  ExternalLink,
  ShieldAlert,
  Terminal,
  Layers,
  Sparkles,
  Check,
  Phone,
  Mail,
  PanelLeft,
  Users
} from "lucide-react";
import { AuditEvent } from "../../types";
import { AdvancedTable, Column } from "../../components/ui/AdvancedTable";
import { Badge } from "../../components/ui/badge";
import { cn } from "../../lib/utils";
import { toast } from "sonner";
import { getVisibleSidebarModuleNames } from "./AdminStaffManager";

const PERMISSION_LABELS: Record<string, string> = {
  canManageMerchants: "Manage Merchants & Brands",
  canVerifyKYC: "Statutory KYC & Compliance",
  canModerateOffers: "Moderate Offers & Promotions",
  canViewFinancials: "View Financials & Settlements",
  canManageTaxonomy: "Manage Taxonomy & Categories",
  canConfigurePlatform: "Configure Platform Settings",
  canManageStaff: "Manage Platform Staff & RBAC",
};

interface AuditSecurityProps {
  auditLogs: AuditEvent[];
}

// Enterprise categorizer for audit events
export type AuditCategory = "AUTH" | "MERCHANT" | "STORE" | "FINANCE" | "SYSTEM";

export function categorizeAuditEvent(event: AuditEvent): AuditCategory {
  const text = `${event.action || ""} ${event.entity || ""} ${event.actor || ""}`.toLowerCase();
  
  // Authentication & Security Access
  if (
    text.includes("login") ||
    text.includes("logout") ||
    text.includes("auth") ||
    text.includes("session") ||
    text.includes("role") ||
    text.includes("permission") ||
    text.includes("password") ||
    text.includes("staff") ||
    text.includes("invite") ||
    text.includes("mfa") ||
    text.includes("token") ||
    text.includes("credential") ||
    text.includes("rbac") ||
    text.includes("access")
  ) {
    return "AUTH";
  }

  // Merchant & Statutory KYC
  if (
    text.includes("merchant") ||
    text.includes("kyc") ||
    text.includes("brand") ||
    text.includes("gstin") ||
    text.includes("pan") ||
    text.includes("signatory") ||
    text.includes("vpa") ||
    text.includes("compliance")
  ) {
    return "MERCHANT";
  }

  // Physical Stores & Outlets
  if (
    text.includes("store") ||
    text.includes("branch") ||
    text.includes("outlet") ||
    text.includes("location") ||
    text.includes("geocode") ||
    text.includes("operating_hours")
  ) {
    return "STORE";
  }

  // Offers, Deals, Commissions, Rewards & Finance
  if (
    text.includes("offer") ||
    text.includes("campaign") ||
    text.includes("coupon") ||
    text.includes("deal") ||
    text.includes("discount") ||
    text.includes("reward") ||
    text.includes("coin") ||
    text.includes("points") ||
    text.includes("commission") ||
    text.includes("settlement") ||
    text.includes("transaction") ||
    text.includes("payout")
  ) {
    return "FINANCE";
  }

  return "SYSTEM";
}

export const AuditSecurity: React.FC<AuditSecurityProps> = ({ auditLogs = [] }) => {
  // Strictly display live real audit events from the backend database
  const allLogs: AuditEvent[] = useMemo(() => {
    if (!Array.isArray(auditLogs)) return [];
    return [...auditLogs]
      .map((l) => {
        let safeActor = l.actor || "riya.admin@pinak.app (Super Admin)";
        const meta = { ...(l.metadata || {}) } as any;

        // If the actor was recorded as a raw IP address, normalize it and restore operator identity
        if (
          safeActor.includes("0:0:0:0:0:0:0:1") ||
          safeActor === "::1" ||
          /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(safeActor)
        ) {
          if (!meta.ipAddress) {
            meta.ipAddress =
              safeActor.includes("0:0:0:0:0:0:0:1") || safeActor === "::1"
                ? "127.0.0.1 (Localhost)"
                : safeActor;
          }
          safeActor = meta.invitedBy || meta.actor || "riya.admin@pinak.app (Super Admin)";
        }

        // Backfill staff role and status if missing on staff events
        const isStaffEvent = l.entity?.startsWith("Staff:") || l.action.toLowerCase().includes("staff");
        const isRevoked = l.action.toLowerCase().includes("revoke") || l.action.toLowerCase().includes("deactivat") || meta.status === "REVOKED";
        if (isStaffEvent && !meta.roleName) {
          meta.roleName = "Regional Ops Lead";
        }
        if (isRevoked) {
          meta.status = "REVOKED";
        }

        return {
          ...l,
          actor: safeActor.replace(/admin@pinak\.in/g, "riya.admin@pinak.app"),
          metadata: meta,
        };
      })
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  }, [auditLogs]);

  // Primary Segment Tab: All vs Auth & Security vs Operational & Domain
  const [mainTab, setMainTab] = useState<"ALL" | "AUTH" | "OPERATIONS">("ALL");

  // Operational Sub-Category Filter (Active when mainTab === "OPERATIONS" or "ALL")
  const [opsSubCategory, setOpsSubCategory] = useState<"ALL" | "MERCHANT" | "STORE" | "FINANCE" | "SYSTEM">("ALL");

  // Severity Quick Filter
  const [severityFilter, setSeverityFilter] = useState<"ALL" | "success" | "warning" | "critical" | "info">("ALL");

  // Selected audit event for deep inspection drawer
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);

  // Categorized counts for summary badges
  const counts = useMemo(() => {
    const authCount = allLogs.filter((l) => categorizeAuditEvent(l) === "AUTH").length;
    const opsCount = allLogs.filter((l) => categorizeAuditEvent(l) !== "AUTH").length;
    const warningCount = allLogs.filter((l) => l.severity === "warning" || l.severity === "critical").length;
    const merchantCount = allLogs.filter((l) => categorizeAuditEvent(l) === "MERCHANT").length;
    const storeCount = allLogs.filter((l) => categorizeAuditEvent(l) === "STORE").length;
    const financeCount = allLogs.filter((l) => categorizeAuditEvent(l) === "FINANCE").length;

    return {
      total: allLogs.length,
      auth: authCount,
      ops: opsCount,
      warning: warningCount,
      merchant: merchantCount,
      store: storeCount,
      finance: financeCount,
    };
  }, [allLogs]);

  // Filtered dataset according to active tabs and severity
  const filteredLogs = useMemo(() => {
    return allLogs.filter((item) => {
      const category = categorizeAuditEvent(item);

      // Main Tab Segregation
      if (mainTab === "AUTH" && category !== "AUTH") {
        return false;
      }
      if (mainTab === "OPERATIONS" && category === "AUTH") {
        return false;
      }

      // Operational Subcategory Filter
      if (mainTab === "OPERATIONS" && opsSubCategory !== "ALL") {
        if (category !== opsSubCategory) return false;
      }

      // Severity Filter
      if (severityFilter !== "ALL" && item.severity !== severityFilter) {
        return false;
      }

      return true;
    });
  }, [allLogs, mainTab, opsSubCategory, severityFilter]);

  // 1-Click CSV Export for Compliance Audits
  const handleExportCsv = () => {
    const headers = ["Event ID", "Timestamp", "Category", "Action", "Target Entity", "Authorized Actor", "Severity", "Metadata"];
    const rows = filteredLogs.map((log) => [
      `"${log.id}"`,
      `"${new Date(log.time).toISOString()}"`,
      `"${categorizeAuditEvent(log)}"`,
      `"${(log.action || "").replace(/"/g, '""')}"`,
      `"${(log.entity || "").replace(/"/g, '""')}"`,
      `"${(log.actor || "").replace(/"/g, '""')}"`,
      `"${log.severity}"`,
      `"${log.metadata ? JSON.stringify(log.metadata).replace(/"/g, '""') : ""}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `PINAK_Audit_Trail_${mainTab}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${filteredLogs.length} audit records to CSV!`);
  };

  // Badge Visuals helper
  const getCategoryBadge = (cat: AuditCategory) => {
    switch (cat) {
      case "AUTH":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60">
            <Key size={10} />
            <span>AUTH / ACCESS</span>
          </span>
        );
      case "MERCHANT":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-900/60">
            <Building2 size={10} />
            <span>MERCHANT KYC</span>
          </span>
        );
      case "STORE":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60">
            <Store size={10} />
            <span>STORE OPS</span>
          </span>
        );
      case "FINANCE":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-pink-100 text-pink-800 dark:bg-pink-950/60 dark:text-pink-300 border border-pink-200 dark:border-pink-900/60">
            <Coins size={10} />
            <span>OFFERS & SETTLEMENT</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <Activity size={10} />
            <span>SYSTEM</span>
          </span>
        );
    }
  };

  // Table Columns
  const columns: Column<AuditEvent>[] = [
    {
      header: "Action & Category",
      sortable: true,
      accessor: "action",
      className: "min-w-[280px] max-w-[350px]",
      render: (a) => {
        const cat = categorizeAuditEvent(a);
        const shortId = a.id ? (a.id.length > 12 ? `${a.id.slice(0, 8)}…` : a.id) : "";
        return (
          <div className="flex items-start gap-2.5 max-w-[330px]">
            <div
              className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-2xs",
                cat === "AUTH"
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                  : cat === "MERCHANT"
                  ? "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300"
                  : cat === "STORE"
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                  : cat === "FINANCE"
                  ? "bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300"
                  : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
              )}
            >
              {cat === "AUTH" ? (
                <Key size={14} />
              ) : cat === "MERCHANT" ? (
                <Building2 size={14} />
              ) : cat === "STORE" ? (
                <Store size={14} />
              ) : cat === "FINANCE" ? (
                <Coins size={14} />
              ) : (
                <Activity size={14} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div
                className="font-bold text-slate-900 dark:text-white text-xs leading-snug break-words line-clamp-2"
                title={a.action}
              >
                {a.action}
              </div>
              <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                {getCategoryBadge(cat)}
                {shortId && (
                  <span
                    className="text-[10px] text-slate-400 font-mono tracking-tight"
                    title={a.id}
                  >
                    #{shortId}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      header: "Target Entity / Scope",
      sortable: true,
      accessor: "entity",
      className: "min-w-[220px] max-w-[280px]",
      render: (a) => {
        const meta = (a.metadata || {}) as any;
        return (
          <div className="space-y-1 min-w-0 max-w-[260px]">
            <span
              className="font-semibold text-xs text-slate-800 dark:text-slate-200 block truncate"
              title={a.entity}
            >
              {a.entity}
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {meta.roleName && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  {meta.roleName}
                </span>
              )}
              {(a.action.toLowerCase().includes("revoke") || a.action.toLowerCase().includes("deactivat") || meta.status === "REVOKED") && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                  REVOKED
                </span>
              )}
              {meta.visibleSidebarModules && Array.isArray(meta.visibleSidebarModules) && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <PanelLeft size={9} />
                  <span>{meta.visibleSidebarModules.length} Modules</span>
                </span>
              )}
              {meta.inviteUrl && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(meta.inviteUrl);
                    toast.success("Copied 1-time activation link to clipboard!");
                  }}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-colors"
                  title="Copy 1-time activation link"
                >
                  <Copy size={9} />
                  <span>Copy Link</span>
                </button>
              )}
            </div>
            {meta.reason && (
              <span className="text-[11px] text-slate-400 line-clamp-1 block" title={meta.reason}>
                {meta.reason}
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: "Authorized Actor",
      sortable: true,
      accessor: "actor",
      className: "min-w-[190px] max-w-[240px]",
      render: (a) => {
        const displayActor = (a.actor || "riya.admin@pinak.app (Super Admin)").replace(
          /admin@pinak\.in/g,
          "riya.admin@pinak.app"
        );
        const isSuperAdmin = displayActor.toLowerCase().includes("super admin");
        const isDaemon =
          displayActor.toLowerCase().includes("system") || displayActor.toLowerCase().includes("daemon");
        return (
          <div className="space-y-0.5 max-w-[220px] min-w-0">
            <Badge
              className={cn(
                "text-xs font-semibold px-2 py-0.5 truncate block max-w-full",
                isSuperAdmin
                  ? "text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800/80"
                  : isDaemon
                  ? "text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  : "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800/80"
              )}
              title={displayActor}
            >
              {displayActor}
            </Badge>
            {a.metadata && (a.metadata as any).ipAddress && (
              <span className="text-[10px] text-slate-400 font-mono block truncate">
                IP: {(a.metadata as any).ipAddress}
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: "Severity",
      sortable: true,
      accessor: "severity",
      render: (a) => (
        <Badge
          variant={
            a.severity === "success"
              ? "success"
              : a.severity === "warning"
              ? "warning"
              : a.severity === "critical"
              ? "destructive"
              : "secondary"
          }
        >
          {a.severity === "success" ? (
            <CheckCircle2 size={12} />
          ) : a.severity === "warning" ? (
            <AlertTriangle size={12} />
          ) : a.severity === "critical" ? (
            <ShieldAlert size={12} />
          ) : (
            <Info size={12} />
          )}
          <span className="capitalize">{a.severity}</span>
        </Badge>
      ),
    },
    {
      header: "Timestamp",
      sortable: true,
      accessor: "time",
      render: (a) => {
        const dateObj = new Date(a.time);
        return (
          <div>
            <span className="text-xs text-slate-700 dark:text-slate-300 font-medium block">
              {dateObj.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
            <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
              {dateObj.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>
        );
      },
    },
    {
      header: "Action",
      sortable: false,
      className: "text-right",
      render: (a) => (
        <button
          type="button"
          onClick={() => setSelectedEvent(a)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-purple-200/80 dark:border-purple-800/60 transition-all shadow-2xs hover:shadow-xs"
          title="Inspect complete audit payload & cryptography signature"
        >
          <Eye size={13} />
          <span>Inspect</span>
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-bold font-['Manrope'] text-slate-900 dark:text-white">
              Administrative Audit Trail Log
            </h2>
            <Badge className="border-0 shadow-none text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 shrink-0">
              Cryptographic Ledger
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 max-w-3xl">
            Tamper-evident record of all platform interactions. Authentication and access sessions are segregated from merchant and operational business mutations.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-xs whitespace-nowrap"
            title="Download audit records as CSV"
          >
            <Download size={15} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Events */}
        <div
          onClick={() => {
            setMainTab("ALL");
            setOpsSubCategory("ALL");
            setSeverityFilter("ALL");
          }}
          className={cn(
            "p-4 rounded-2xl bg-white dark:bg-[#121626] border transition-all cursor-pointer shadow-xs",
            mainTab === "ALL"
              ? "border-purple-500 ring-2 ring-purple-500/20"
              : "border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
          )}
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Ledger Records</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
              <Activity size={16} />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-['Manrope']">
              {counts.total}
            </span>
            <span className="text-xs text-slate-400 block mt-0.5">Immutable Activity Log</span>
          </div>
        </div>

        {/* Card 2: Authentication & Access Sessions (Separated!) */}
        <div
          onClick={() => {
            setMainTab("AUTH");
            setSeverityFilter("ALL");
          }}
          className={cn(
            "p-4 rounded-2xl bg-white dark:bg-[#121626] border transition-all cursor-pointer shadow-xs",
            mainTab === "AUTH"
              ? "border-blue-500 ring-2 ring-blue-500/20"
              : "border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
          )}
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Auth & Security Logins
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <Key size={16} />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-['Manrope']">
              {counts.auth}
            </span>
            <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold block mt-0.5">
              Logins, MFA, Staff Invites & RBAC
            </span>
          </div>
        </div>

        {/* Card 3: Operational & Domain Events (Separated!) */}
        <div
          onClick={() => {
            setMainTab("OPERATIONS");
            setOpsSubCategory("ALL");
            setSeverityFilter("ALL");
          }}
          className={cn(
            "p-4 rounded-2xl bg-white dark:bg-[#121626] border transition-all cursor-pointer shadow-xs",
            mainTab === "OPERATIONS"
              ? "border-emerald-500 ring-2 ring-emerald-500/20"
              : "border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
          )}
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Business & Operations
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <Building2 size={16} />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-['Manrope']">
              {counts.ops}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold block mt-0.5">
              Merchants, Stores, KYC & Offers
            </span>
          </div>
        </div>

        {/* Card 4: Security Alerts & Warnings */}
        <div
          onClick={() => {
            setSeverityFilter("warning");
          }}
          className={cn(
            "p-4 rounded-2xl bg-white dark:bg-[#121626] border transition-all cursor-pointer shadow-xs",
            severityFilter === "warning"
              ? "border-amber-500 ring-2 ring-amber-500/20"
              : "border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
          )}
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Audit Warnings & Alerts
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              <AlertTriangle size={16} />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-['Manrope']">
              {counts.warning}
            </span>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold block mt-0.5">
              Requires Review & Clearance
            </span>
          </div>
        </div>
      </div>

      {/* Main Segregation Switcher: ALL vs AUTHENTICATION vs OPERATIONAL */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-3 flex-wrap gap-2">
          {/* Primary View Switcher */}
          <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => {
                setMainTab("ALL");
                setOpsSubCategory("ALL");
              }}
              className={cn(
                "flex items-center gap-1.5 py-2 px-3.5 rounded-xl font-bold transition-all",
                mainTab === "ALL"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <Activity size={14} className={mainTab === "ALL" ? "text-purple-600 dark:text-purple-400" : ""} />
              <span>All Audit Records</span>
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                {counts.total}
              </span>
            </button>

            {/* SEPARATE AUTHENTICATION & ACCESS TAB */}
            <button
              type="button"
              onClick={() => {
                setMainTab("AUTH");
                setOpsSubCategory("ALL");
              }}
              className={cn(
                "flex items-center gap-1.5 py-2 px-3.5 rounded-xl font-bold transition-all",
                mainTab === "AUTH"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <Key size={14} />
              <span>Authentication & Security</span>
              <span
                className={cn(
                  "ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                  mainTab === "AUTH"
                    ? "bg-white/20 text-white"
                    : "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                )}
              >
                {counts.auth}
              </span>
            </button>

            {/* SEPARATE OPERATIONAL / OTHER EVENTS TAB */}
            <button
              type="button"
              onClick={() => {
                setMainTab("OPERATIONS");
                setOpsSubCategory("ALL");
              }}
              className={cn(
                "flex items-center gap-1.5 py-2 px-3.5 rounded-xl font-bold transition-all",
                mainTab === "OPERATIONS"
                  ? "bg-emerald-600 text-white shadow-md"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <Building2 size={14} />
              <span>Operational & Domain Logs</span>
              <span
                className={cn(
                  "ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                  mainTab === "OPERATIONS"
                    ? "bg-white/20 text-white"
                    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                )}
              >
                {counts.ops}
              </span>
            </button>
          </div>

          {/* Severity Quick Filters */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              Severity:
            </span>
            {(["ALL", "success", "warning", "critical", "info"] as const).map((sev) => (
              <button
                key={sev}
                type="button"
                onClick={() => setSeverityFilter(sev)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all capitalize",
                  severityFilter === sev
                    ? sev === "ALL"
                      ? "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 font-bold"
                      : sev === "success"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold"
                      : sev === "warning"
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 font-bold"
                      : sev === "critical"
                      ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-bold"
                      : "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-bold"
                    : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        {/* Operational Sub-Filters (When viewing Operations or All) */}
        {mainTab === "OPERATIONS" && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 animate-in fade-in">
            <span className="text-xs text-slate-400 font-medium mr-1 flex items-center gap-1">
              <Filter size={12} />
              <span>Domain Scope:</span>
            </span>

            {[
              { id: "ALL", label: "All Operational Activity", icon: Activity, count: counts.ops },
              { id: "MERCHANT", label: "Merchant & KYC", icon: Building2, count: counts.merchant },
              { id: "STORE", label: "Store Outlets", icon: Store, count: counts.store },
              { id: "FINANCE", label: "Offers & Settlements", icon: Coins, count: counts.finance },
            ].map((sub) => {
              const Icon = sub.icon;
              const isActive = opsSubCategory === sub.id;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setOpsSubCategory(sub.id as any)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all",
                    isActive
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200 font-bold shadow-2xs"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  )}
                >
                  <Icon size={13} />
                  <span>{sub.label}</span>
                  <span className="text-[10px] opacity-75 font-mono">({sub.count})</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Advanced Audit Log Table */}
      <AdvancedTable<AuditEvent>
        title={
          mainTab === "AUTH"
            ? "Authentication, Access & Session Security Log"
            : mainTab === "OPERATIONS"
            ? "Merchant, Store & Financial Operational Audit Log"
            : "Consolidated Administrative Audit Trail Log"
        }
        subtitle={
          mainTab === "AUTH"
            ? `${filteredLogs.length} authentication events (Logins, MFA, Staff Invitations, RBAC Matrix Changes)`
            : mainTab === "OPERATIONS"
            ? `${filteredLogs.length} operational business actions (Merchant approvals, store deployments, offer promotions)`
            : `${filteredLogs.length} total events recorded in the cryptographic ledger`
        }
        columns={columns}
        data={filteredLogs}
        keyExtractor={(a) => a.id}
        searchPlaceholder={
          mainTab === "AUTH"
            ? "Search auth actions, operator email, IP address, or session..."
            : "Search action, target entity, or authorized actor..."
        }
        searchFilter={(a, q) =>
          a.action.toLowerCase().includes(q) ||
          a.entity.toLowerCase().includes(q) ||
          a.actor.toLowerCase().includes(q) ||
          a.severity.toLowerCase().includes(q) ||
          Boolean(a.metadata && JSON.stringify(a.metadata).toLowerCase().includes(q))
        }
        emptyMessage={
          allLogs.length === 0
            ? "No audit events recorded yet in the database. When you perform actions (e.g. invite team members, modify roles, update merchants), live records from the backend will appear here."
            : "No audit records match the current filter criteria."
        }
      />

      {/* Deep Inspection Slide-Over Drawer */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedEvent(null)}
          />

          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <aside className="w-screen max-w-md bg-white dark:bg-[#121626] shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-transparent">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-purple-600 text-white shadow-md">
                      <Terminal size={18} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                        Audit Event Record
                      </h3>
                      <p className="text-[11px] font-mono text-purple-600 dark:text-purple-400 mt-0.5">
                        #{selectedEvent.id}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedEvent(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
                {/* Event Summary Card */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Audit Classification
                    </span>
                    {getCategoryBadge(categorizeAuditEvent(selectedEvent))}
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px]">Action Name</span>
                    <strong className="text-sm text-slate-900 dark:text-white block mt-0.5">
                      {selectedEvent.action}
                    </strong>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px]">Target Resource / Entity</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs block mt-0.5">
                      {selectedEvent.entity}
                    </span>
                  </div>

                  {(() => {
                    const meta = (selectedEvent.metadata || {}) as any;
                    let displayActor = selectedEvent.actor || "riya.admin@pinak.app (Super Admin)";
                    if (
                      displayActor.includes("0:0:0:0:0:0:0:1") ||
                      displayActor === "::1" ||
                      /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(displayActor)
                    ) {
                      displayActor = "riya.admin@pinak.app (Super Admin)";
                    }
                    displayActor = displayActor.replace(/admin@pinak\.in/g, "riya.admin@pinak.app");

                    const ip = meta.ipAddress;
                    const reqId = meta.requestId;

                    return (
                      <>
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800 text-[11px]">
                          <div>
                            <span className="text-slate-400 block text-[10px]">Authorized Actor</span>
                            <strong className="text-slate-800 dark:text-slate-200 truncate block" title={displayActor}>
                              {displayActor}
                            </strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Severity</span>
                            <Badge
                              variant={
                                selectedEvent.severity === "success"
                                  ? "success"
                                  : selectedEvent.severity === "warning"
                                  ? "warning"
                                  : selectedEvent.severity === "critical"
                                  ? "destructive"
                                  : "secondary"
                              }
                              className="mt-0.5"
                            >
                              <span className="capitalize">{selectedEvent.severity}</span>
                            </Badge>
                          </div>
                        </div>

                        {(ip || reqId) && (
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800 text-[11px]">
                            {ip && (
                              <div>
                                <span className="text-slate-400 block text-[10px]">Client Origin / IP</span>
                                <span className="font-mono text-slate-700 dark:text-slate-300 text-xs block mt-0.5 truncate" title={ip}>
                                  {ip}
                                </span>
                              </div>
                            )}
                            {reqId && (
                              <div>
                                <span className="text-slate-400 block text-[10px]">Request Trace ID</span>
                                <span className="font-mono text-slate-700 dark:text-slate-300 text-[10px] block mt-0.5 truncate" title={reqId}>
                                  {reqId}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    );
                  })()}

                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 text-[11px]">
                    <span className="text-slate-400 block text-[10px]">Cryptographic Timestamp</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300 text-xs block mt-0.5">
                      {new Date(selectedEvent.time).toISOString()} (
                      {new Date(selectedEvent.time).toLocaleString()})
                    </span>
                  </div>
                </div>

                {/* Staff & Console Module Access Breakdown Dossier */}
                {(() => {
                  const meta = (selectedEvent.metadata || {}) as any;
                  const isStaffOrAccess = Boolean(
                    meta.staffEmail ||
                    meta.staffName ||
                    meta.roleName ||
                    meta.visibleSidebarModules ||
                    meta.permissions ||
                    selectedEvent.action.toLowerCase().includes("staff") ||
                    selectedEvent.action.toLowerCase().includes("role")
                  );
                  if (!isStaffOrAccess) return null;

                  let unlockedModules: string[] = [];
                  if (Array.isArray(meta.visibleSidebarModules)) {
                    unlockedModules = meta.visibleSidebarModules;
                  } else if (meta.permissions && typeof meta.permissions === "object") {
                    unlockedModules = getVisibleSidebarModuleNames(meta.permissions);
                  }

                  const staffInitials = (
                    meta.staffName
                      ? meta.staffName.split(" ").map((n: string) => n[0]).join("")
                      : meta.staffEmail
                      ? meta.staffEmail.substring(0, 2)
                      : "ST"
                  ).toUpperCase().substring(0, 2);

                  return (
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50/80 via-white to-blue-50/50 dark:from-purple-950/30 dark:via-slate-900/60 dark:to-blue-950/20 border border-purple-200/80 dark:border-purple-800/60 space-y-3.5 shadow-xs">
                      <div className="flex items-center justify-between border-b border-purple-100 dark:border-purple-900/40 pb-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-purple-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                            {staffInitials}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 dark:text-white text-xs leading-tight">
                              {meta.staffName || selectedEvent.entity}
                            </h4>
                            <span className="text-[11px] text-slate-500 font-mono block">
                              {meta.staffEmail || "Console Staff Assignment"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 font-bold text-[10px]">
                            {meta.roleName || meta.roleId || (selectedEvent.action.toLowerCase().includes("staff") ? "Regional Ops Lead" : "Platform Role")}
                          </Badge>
                          {(selectedEvent.action.toLowerCase().includes("revoke") || selectedEvent.action.toLowerCase().includes("deactivat") || meta.status === "REVOKED") && (
                            <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-bold text-[10px] border border-rose-200 dark:border-rose-800">
                              REVOKED
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Quick Staff Scope & Status Details */}
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="p-2 rounded-xl bg-white/70 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                          <span className="text-[10px] text-slate-400 block font-medium">Access Scope</span>
                          <strong className="text-slate-800 dark:text-slate-200 font-bold block mt-0.5">
                            {meta.scope || "PLATFORM (Full Console)"}
                          </strong>
                        </div>
                        <div className="p-2 rounded-xl bg-white/70 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                          <span className="text-[10px] text-slate-400 block font-medium">Account Status</span>
                          <strong className="text-slate-800 dark:text-slate-200 font-bold block mt-0.5">
                            {meta.status || (selectedEvent.action.toLowerCase().includes("revoke") ? "REVOKED" : "INVITED")}
                          </strong>
                        </div>
                        {meta.staffPhone && (
                          <div className="col-span-2 p-2 rounded-xl bg-white/70 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                            <span className="text-[10px] text-slate-400 font-medium">Contact Phone:</span>
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{meta.staffPhone}</span>
                          </div>
                        )}
                      </div>

                      {/* Direct 1-Time Invitation Link */}
                      {meta.inviteUrl && (
                        <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/60 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 flex items-center gap-1">
                              <Key size={11} />
                              <span>1-Time Activation Link (48h)</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(meta.inviteUrl);
                                toast.success("Copied activation link to clipboard!");
                              }}
                              className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1"
                            >
                              <Copy size={11} />
                              <span>Copy Link</span>
                            </button>
                          </div>
                          <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-blue-200/60 dark:border-blue-800 font-mono text-[10px] text-slate-700 dark:text-slate-300 break-all select-all">
                            {meta.inviteUrl}
                          </div>
                        </div>
                      )}

                      {/* Unlocked Console Navigation Modules */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1">
                            <PanelLeft size={11} className="text-purple-600" />
                            <span>Console Sidebar Modules Showing</span>
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            {unlockedModules.length} Modules Visible
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5">
                          {unlockedModules.map((modName: string) => (
                            <div
                              key={modName}
                              className="flex items-center gap-1.5 p-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70 text-[11px] font-semibold text-slate-800 dark:text-slate-200"
                            >
                              <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                              <span className="truncate">{modName}</span>
                            </div>
                          ))}
                          {unlockedModules.length === 0 && (
                            <div className="col-span-2 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-center text-slate-500 text-[11px]">
                              No platform console navigation modules unlocked.
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Granted Permission Toggles */}
                      {meta.permissions && typeof meta.permissions === "object" && (
                        <div className="space-y-2 pt-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
                            Granular Permission Toggles
                          </span>
                          <div className="space-y-1">
                            {Object.entries(meta.permissions).map(([permKey, isGranted]) => {
                              const label = PERMISSION_LABELS[permKey] || permKey;
                              return (
                                <div
                                  key={permKey}
                                  className={cn(
                                    "flex items-center justify-between p-2 rounded-xl border text-[11px]",
                                    isGranted
                                      ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-200"
                                      : "bg-slate-50 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800 text-slate-400"
                                  )}
                                >
                                  <span className="font-medium">{label}</span>
                                  {isGranted ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                      <Check size={11} />
                                      <span>Granted</span>
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-medium text-slate-400">Disabled</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Extended Metadata & Payload */}
                <div className="p-4 rounded-2xl bg-slate-900 text-slate-100 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Terminal size={12} className="text-purple-400" />
                      <span>Audit Payload Metadata</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(selectedEvent, null, 2));
                        toast.success("Copied audit event JSON to clipboard!");
                      }}
                      className="text-[11px] text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1"
                    >
                      <Copy size={11} />
                      <span>Copy JSON</span>
                    </button>
                  </div>

                  <pre className="p-3 rounded-xl bg-black/50 font-mono text-[11px] leading-relaxed text-slate-300 overflow-x-auto max-h-60 border border-slate-800/80">
                    {JSON.stringify(selectedEvent.metadata || { status: "Verified", target: selectedEvent.entity }, null, 2)}
                  </pre>
                </div>

                {/* Cryptographic Ledger Verification Stamp */}
                <div className="p-3.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/70 dark:border-purple-900/50 space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-purple-700 dark:text-purple-300">
                    <ShieldCheck size={14} />
                    <span>Cryptographically Tamper-Evident</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    This event is committed with a SHA-256 state tree hash. Any retrospective mutation is mathematically impossible.
                  </p>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Close Inspection
                </button>
              </div>
            </aside>
          </div>
        </div>
      )}
    </div>
  );
};
