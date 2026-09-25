import React, { useState } from "react";
import { Building2, ShieldCheck, CheckCircle2, Save, Globe } from "lucide-react";
import { toast } from "sonner";

export const MerchantProfile: React.FC = () => {
  const [businessName, setBusinessName] = useState("The Curry Leaf");
  const [legalName, setLegalName] = useState("Curry Leaf Hospitality Pvt Ltd");
  const [bankUpiId, setBankUpiId] = useState("thecurryleaf@icici");
  const [gstin, setGstin] = useState("27AABCC8921N1Z5");
  const [pan, setPan] = useState("AABCC8921N");
  const [ownerEmail, setOwnerEmail] = useState("sunil@curryleaf.in");
  const [ownerPhone, setOwnerPhone] = useState("+91 98221 44550");

  const handleSave = () => {
    toast.success("Merchant profile and bank UPI VPA saved successfully!");
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-['Manrope'] text-slate-900 dark:text-white">
            Merchant Brand & Bank Settlements
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Official business profile and bank settlement parameters registered with Pinak Platform.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="btn-gradient flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md self-start sm:self-auto"
        >
          <Save size={15} />
          <span>Save Profile</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Brand Information */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Manrope']">
              Brand Profile
            </h3>
            <span className="badge-status badge-approved text-xs">
              <CheckCircle2 size={12} />
              KYC Verified
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">Public Business Name</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">Legal Entity Name</label>
              <input
                type="text"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">GSTIN</label>
                <input
                  type="text"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">PAN</label>
                <input
                  type="text"
                  value={pan}
                  onChange={(e) => setPan(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Payout & Settlement VPA */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Manrope']">
            Direct Bank Settlement
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">Bank UPI VPA (Direct Settlement)</label>
              <input
                type="text"
                value={bankUpiId}
                onChange={(e) => setBankUpiId(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-purple-300 dark:border-purple-800 bg-purple-50/40 dark:bg-purple-950/20 text-sm font-mono font-bold text-purple-700 dark:text-purple-300"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                All counter scan-and-pay transactions settle directly to this UPI VPA without platform intermediary holding.
              </span>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">Owner Email</label>
              <input
                type="email"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">Owner Contact Phone</label>
              <input
                type="text"
                value={ownerPhone}
                onChange={(e) => setOwnerPhone(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
