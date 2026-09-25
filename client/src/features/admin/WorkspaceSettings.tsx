import React, { useState } from "react";
import {
  Settings,
  ShieldCheck,
  Save,
  Globe,
  KeyRound,
  Users,
  Webhook,
  Send,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus,
  Trash2,
  X,
  Server,
  Lock,
  Code2
} from "lucide-react";
import { toast } from "sonner";
import { AdvancedTable, Column } from "../../components/ui/AdvancedTable";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "SUPERADMIN" | "REGIONAL_OPS" | "FINANCE_AUDITOR" | "SUPPORT_LEAD";
  status: "ACTIVE" | "INVITED";
  lastLogin: string;
}

export const WorkspaceSettings: React.FC = () => {
  // General platform settings
  const [workspaceName, setWorkspaceName] = useState("PINAK Central");
  const [defaultCity, setDefaultCity] = useState("Nagpur");
  const [supportEmail, setSupportEmail] = useState("support@pinak.app");
  const [currencySymbol, setCurrencySymbol] = useState("₹ (INR)");
  const [timezone, setTimezone] = useState("Asia/Kolkata (IST +5:30)");

  // Webhook settings
  const [webhookUrl, setWebhookUrl] = useState("https://api.pinak.app/api/v1/payments/webhook");
  const [hmacSecret, setHmacSecret] = useState("whsec_live_98a72b0c19283f982a17bc84");
  const [isPingingWebhook, setIsPingingWebhook] = useState(false);
  const [lastWebhookResponse, setLastWebhookResponse] = useState<string | null>(null);

  // Security & Maintenance
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [rateLimitEnabled, setRateLimitEnabled] = useState(true);
  const [postgisRadiusCap, setPostgisRadiusCap] = useState("15");

  // Team management
  const [isMemberDrawerOpen, setIsMemberDrawerOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<TeamMember["role"]>("REGIONAL_OPS");

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {
      id: "tm-1",
      name: "Siddharth Verma",
      email: "siddharth@pinak.app",
      role: "SUPERADMIN",
      status: "ACTIVE",
      lastLogin: "Just now"
    },
    {
      id: "tm-2",
      name: "Ananya Deshpande",
      email: "ananya.ops@pinak.app",
      role: "REGIONAL_OPS",
      status: "ACTIVE",
      lastLogin: "2 hours ago"
    },
    {
      id: "tm-3",
      name: "Rohan Kulkarni",
      email: "rohan.audit@pinak.app",
      role: "FINANCE_AUDITOR",
      status: "ACTIVE",
      lastLogin: "Yesterday"
    },
    {
      id: "tm-4",
      name: "Neha Joshi",
      email: "neha.support@pinak.app",
      role: "SUPPORT_LEAD",
      status: "INVITED",
      lastLogin: "Pending Invite"
    }
  ]);

  const handleSaveGeneral = () => {
    toast.success("Workspace parameters and regional settings saved successfully!");
  };

  const handleTestWebhookPing = () => {
    setIsPingingWebhook(true);
    setLastWebhookResponse(null);
    setTimeout(() => {
      setIsPingingWebhook(false);
      setLastWebhookResponse(
        JSON.stringify(
          {
            status: "SUCCESS",
            http_code: 200,
            event: "payment.intent.settled",
            tx_id: "tx-test-9921",
            latency: "42ms",
            signature_verified: true,
            timestamp: new Date().toISOString()
          },
          null,
          2
        )
      );
      toast.success("Test webhook ping delivered! HTTP 200 OK received.");
    }, 1000);
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim() || !newMemberEmail.trim()) {
      toast.error("Please enter team member name and email.");
      return;
    }

    const newMember: TeamMember = {
      id: `tm-${Date.now()}`,
      name: newMemberName.trim(),
      email: newMemberEmail.trim(),
      role: newMemberRole,
      status: "INVITED",
      lastLogin: "Invitation Sent"
    };

    setTeamMembers([...teamMembers, newMember]);
    setIsMemberDrawerOpen(false);
    setNewMemberName("");
    setNewMemberEmail("");
    toast.success(`Invitation dispatched to ${newMember.email}!`);
  };

  const removeMember = (id: string) => {
    setTeamMembers(teamMembers.filter((m) => m.id !== id));
    toast.success("Team member access revoked.");
  };

  const memberColumns: Column<TeamMember>[] = [
    {
      header: "Member Name & Email",
      accessor: "name",
      sortable: true,
      render: (m: TeamMember) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-white block">
            {m.name}
          </span>
          <span className="text-[11px] text-slate-400 font-mono block">
            {m.email}
          </span>
        </div>
      )
    },
    {
      header: "Platform Role",
      accessor: "role",
      render: (m: TeamMember) => {
        const roleLabels: Record<string, { label: string; cls: string }> = {
          SUPERADMIN: { label: "Super Admin", cls: "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300" },
          REGIONAL_OPS: { label: "Regional Ops", cls: "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300" },
          FINANCE_AUDITOR: { label: "Finance Auditor", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300" },
          SUPPORT_LEAD: { label: "Support Lead", cls: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300" }
        };
        const r = roleLabels[m.role] || roleLabels.SUPERADMIN;
        return (
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.cls}`}>
            {r.label}
          </span>
        );
      }
    },
    {
      header: "Account Status",
      accessor: "status",
      render: (m: TeamMember) => (
        <span
          className={`badge-status text-[11px] ${
            m.status === "ACTIVE"
              ? "badge-approved"
              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
          }`}
        >
          {m.status}
        </span>
      )
    },
    {
      header: "Last Activity",
      accessor: "lastLogin",
      render: (m: TeamMember) => (
        <span className="text-xs text-slate-500">
          {m.lastLogin}
        </span>
      )
    },
    {
      header: "Action",
      render: (m: TeamMember) =>
        m.role !== "SUPERADMIN" ? (
          <button
            onClick={() => removeMember(m.id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
            title="Revoke Access"
          >
            <Trash2 size={14} />
          </button>
        ) : null
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold font-['Manrope'] text-slate-900 dark:text-white">
              Platform Settings & Gateway Config
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
              Cluster Ops
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Global configuration for the Nginx proxy, UPI webhook validation, PostGIS geo-index, and access controls.
          </p>
        </div>

        <button
          onClick={handleSaveGeneral}
          className="btn-gradient flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md self-start sm:self-auto"
        >
          <Save size={15} />
          <span>Save All Settings</span>
        </button>
      </div>

      {/* Grid: General Workspace & Webhook Gateway */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Workspace Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
              <Settings size={18} />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Manrope']">
              Regional & Brand Configuration
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">Portal Platform Title</label>
              <input
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Default Discovery City</label>
                <select
                  value={defaultCity}
                  onChange={(e) => setDefaultCity(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
                >
                  <option>Nagpur</option>
                  <option>Pune</option>
                  <option>Mumbai</option>
                  <option>Delhi NCR</option>
                  <option>Bengaluru</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Default Currency</label>
                <input
                  type="text"
                  value={currencySymbol}
                  disabled
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-semibold text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">Platform Support Email</label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">Cluster Timezone</label>
              <input
                type="text"
                value={timezone}
                disabled
                className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm text-slate-500 cursor-not-allowed font-mono"
              />
            </div>
          </div>
        </div>

        {/* UPI Gateway & Webhook Simulator Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400">
                <Webhook size={18} />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Manrope']">
                UPI Webhook & Security
              </h3>
            </div>
            <span className="badge-status badge-approved text-xs">
              <CheckCircle2 size={12} />
              PSP Endpoint Live
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">Public Callback URL</label>
              <input
                type="text"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-purple-600 dark:text-purple-400"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700 dark:text-slate-300">HMAC-SHA256 Signing Secret</label>
                <button
                  type="button"
                  onClick={() => {
                    setHmacSecret("whsec_live_" + Math.random().toString(36).substring(2, 12));
                    toast.success("New HMAC secret generated! Make sure to update your PSP webhook headers.");
                  }}
                  className="text-[11px] font-bold text-pink-600 hover:underline flex items-center gap-1"
                >
                  <RefreshCw size={11} />
                  Regenerate
                </button>
              </div>
              <input
                type="text"
                value={hmacSecret}
                onChange={(e) => setHmacSecret(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-mono text-slate-700 dark:text-slate-300"
              />
            </div>

            {/* Test Ping Webhook Button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleTestWebhookPing}
                disabled={isPingingWebhook}
                className="w-full py-2.5 rounded-xl border border-pink-300 dark:border-pink-800 text-pink-600 dark:text-pink-400 font-bold text-xs hover:bg-pink-50 dark:hover:bg-pink-950/40 transition-colors flex items-center justify-center gap-2"
              >
                {isPingingWebhook ? (
                  <div className="w-4 h-4 border-2 border-pink-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send size={14} />
                    <span>Send Test Webhook Ping (Simulate UPI Confirmation)</span>
                  </>
                )}
              </button>
            </div>

            {/* Response Preview */}
            {lastWebhookResponse && (
              <div className="p-3 rounded-2xl bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto border border-slate-800 animate-in fade-in">
                <pre>{lastWebhookResponse}</pre>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Team & RBAC Management Section */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Manrope']">
              Team Members & Role-Based Access Controls (RBAC)
            </h3>
            <p className="text-xs text-slate-500">
              Manage platform administrators, regional operations managers, and financial audit personnel.
            </p>
          </div>

          <button
            onClick={() => setIsMemberDrawerOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-colors self-start sm:self-auto"
          >
            <Plus size={14} />
            <span>Invite Team Member</span>
          </button>
        </div>

        <AdvancedTable
          data={teamMembers}
          columns={memberColumns}
          keyExtractor={(m) => m.id}
          searchPlaceholder="Search team members by name, email, or role..."
          searchFilter={(m: TeamMember, q: string) =>
            m.name.toLowerCase().includes(q) ||
            m.email.toLowerCase().includes(q) ||
            m.role.toLowerCase().includes(q)
          }
          defaultPageSize={5}
        />
      </div>

      {/* INVITE TEAM MEMBER RIGHT SLIDE-OVER DRAWER */}
      {isMemberDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMemberDrawerOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <aside className="w-screen max-w-md bg-white dark:bg-[#121626] shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-transparent">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-600 text-white shadow-md">
                    <Users size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Invite Team Member
                    </h3>
                    <p className="text-xs text-slate-500">
                      Grant role-based access permissions to the PINAK console
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsMemberDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleAddMember} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vikram Singhania"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Work Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. vikram@pinak.app"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Role & Permissions
                  </label>
                  <select
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                  >
                    <option value="REGIONAL_OPS">Regional Ops (Manage merchants & branches in city)</option>
                    <option value="FINANCE_AUDITOR">Finance Auditor (Read-only UPI transactions & settlements)</option>
                    <option value="SUPPORT_LEAD">Support Lead (Customer tickets & loyalty balance)</option>
                    <option value="SUPERADMIN">Super Admin (Unrestricted platform access)</option>
                  </select>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="btn-gradient w-full py-3 rounded-xl text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2"
                  >
                    <Send size={15} />
                    <span>Send Invite & Grant Access</span>
                  </button>
                </div>
              </form>
            </aside>
          </div>
        </div>
      )}
    </div>
  );
};
