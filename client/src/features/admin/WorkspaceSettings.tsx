import React, { useState } from "react";
import { Settings, ShieldCheck, Save, Globe, KeyRound } from "lucide-react";
import { toast } from "sonner";

export const WorkspaceSettings: React.FC = () => {
  const [workspaceName, setWorkspaceName] = useState("PINAK Central");
  const [defaultCity, setDefaultCity] = useState("Nagpur");
  const [supportEmail, setSupportEmail] = useState("support@pinak.app");
  const [webhookUrl, setWebhookUrl] = useState("https://api.pinak.app/api/v1/payments/webhook");

  const handleSave = () => {
    toast.success("Workspace configuration updated in local demo store!");
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-['Manrope'] text-slate-900 dark:text-white">
            Platform Settings & Gateway Config
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Global configuration for the Nginx reverse proxy, UPI webhook validation, and cluster cities.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="btn-gradient flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md self-start sm:self-auto"
        >
          <Save size={15} />
          <span>Save Changes</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Manrope']">
            General Workspace
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">Workspace Title</label>
              <input
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
            </div>

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
                <option>Delhi</option>
                <option>Bengaluru</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">Support Email</label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Manrope']">
            UPI Webhook & Security
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">Public Callback URL</label>
              <input
                type="text"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono text-purple-600 dark:text-purple-400"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">HMAC-SHA256 Secret</label>
              <input
                type="password"
                value="secret_key_vault_encrypted_38291039"
                disabled
                className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-sm font-mono text-slate-400 cursor-not-allowed"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Keys loaded securely via HashiCorp Vault on VPS container startup.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
