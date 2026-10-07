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
  Server,
  Lock,
  Code2
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "../../components/ui/badge";
import { AdminStaffManager } from "./AdminStaffManager";

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

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold font-['Manrope'] text-slate-900 dark:text-white">
              Platform Settings & Gateway Config
            </h2>
            <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
              Cluster Ops
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Global configuration for payment webhooks, regional defaults, currency settings, and staff access controls.
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
            <Badge variant="success">
              <CheckCircle2 size={12} />
              PSP Endpoint Live
            </Badge>
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

      {/* Embedded Full Platform Staff & Roles RBAC Management */}
      <AdminStaffManager />
    </div>
  );
};
