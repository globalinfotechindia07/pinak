import React, { useState } from "react";
import {
  Building2,
  ShieldCheck,
  CheckCircle2,
  Save,
  Globe,
  CreditCard,
  Download,
  Clock,
  MapPin,
  Utensils,
  Receipt,
  FileText,
  DollarSign,
  AlertCircle,
  X,
  Plus,
  Edit2
} from "lucide-react";
import { toast } from "sonner";
import { AdvancedTable, Column } from "../../components/ui/AdvancedTable";

interface SettlementRecord {
  id: string;
  utr: string;
  date: string;
  grossAmount: number;
  txCount: number;
  fee: number;
  netDisbursed: number;
  destination: string;
  status: "SETTLED" | "IN_TRANSIT";
}

export const MerchantProfile: React.FC = () => {
  // Brand details
  const [businessName, setBusinessName] = useState("The Curry Leaf");
  const [legalName, setLegalName] = useState("Curry Leaf Hospitality Pvt Ltd");
  const [fssaiLicense, setFssaiLicense] = useState("11522039000182");
  const [gstin, setGstin] = useState("27AABCC8921N1Z5");
  const [pan, setPan] = useState("AABCC8921N");
  const [ownerEmail, setOwnerEmail] = useState("sunil@curryleaf.in");
  const [ownerPhone, setOwnerPhone] = useState("+91 98221 44550");
  const [avgCostTwo, setAvgCostTwo] = useState("₹750 for two");
  const [cuisineType, setCuisineType] = useState("North Indian, Awadhi, Biryani");
  const [openHours, setOpenHours] = useState("11:30 AM – 11:00 PM");

  // Bank & Settlement details
  const [bankUpiId, setBankUpiId] = useState("thecurryleaf@icici");
  const [bankAccountNum, setBankAccountNum] = useState("50200038918291");
  const [bankIfsc, setBankIfsc] = useState("ICIC0000102");
  const [bankName, setBankName] = useState("ICICI Bank (Ramdaspeth Branch)");
  const [settlementMode, setSettlementMode] = useState<"instant" | "batch">("instant");

  // Drawer state for updating bank details
  const [isBankDrawerOpen, setIsBankDrawerOpen] = useState(false);
  const [tempUpi, setTempUpi] = useState(bankUpiId);
  const [tempAcc, setTempAcc] = useState(bankAccountNum);
  const [tempIfsc, setTempIfsc] = useState(bankIfsc);
  const [tempBank, setTempBank] = useState(bankName);
  const [isVerifyingPenny, setIsVerifyingPenny] = useState(false);
  const [pennyVerified, setPennyVerified] = useState(true);

  // Settlement history
  const [settlements, setSettlements] = useState<SettlementRecord[]>([
    {
      id: "set-1",
      utr: "UTR260924918210",
      date: "2026-09-24 23:30",
      grossAmount: 48920,
      txCount: 42,
      fee: 0,
      netDisbursed: 48920,
      destination: "thecurryleaf@icici",
      status: "SETTLED"
    },
    {
      id: "set-2",
      utr: "UTR260923881290",
      date: "2026-09-23 23:30",
      grossAmount: 54100,
      txCount: 48,
      fee: 0,
      netDisbursed: 54100,
      destination: "thecurryleaf@icici",
      status: "SETTLED"
    },
    {
      id: "set-3",
      utr: "UTR260922441920",
      date: "2026-09-22 23:30",
      grossAmount: 39800,
      txCount: 36,
      fee: 0,
      netDisbursed: 39800,
      destination: "thecurryleaf@icici",
      status: "SETTLED"
    },
    {
      id: "set-4",
      utr: "UTR260921119280",
      date: "2026-09-21 23:30",
      grossAmount: 62450,
      txCount: 54,
      fee: 0,
      netDisbursed: 62450,
      destination: "thecurryleaf@icici",
      status: "SETTLED"
    },
    {
      id: "set-5",
      utr: "UTR260920771922",
      date: "2026-09-20 23:30",
      grossAmount: 71200,
      txCount: 63,
      fee: 0,
      netDisbursed: 71200,
      destination: "thecurryleaf@icici",
      status: "SETTLED"
    }
  ]);

  const handleSaveProfile = () => {
    toast.success("Merchant profile and brand details updated successfully!");
  };

  const handleVerifyPennyDrop = () => {
    setIsVerifyingPenny(true);
    setTimeout(() => {
      setIsVerifyingPenny(false);
      setPennyVerified(true);
      toast.success("₹1.00 Penny-Drop verification successful! Account Holder: Curry Leaf Hospitality Pvt Ltd");
    }, 1200);
  };

  const handleSaveBankDetails = (e: React.FormEvent) => {
    e.preventDefault();
    setBankUpiId(tempUpi);
    setBankAccountNum(tempAcc);
    setBankIfsc(tempIfsc);
    setBankName(tempBank);
    setIsBankDrawerOpen(false);
    toast.success("Settlement bank account updated & validated for direct UPI disbursements!");
  };

  const downloadReceipt = (record: SettlementRecord) => {
    toast.success(`Downloading official settlement voucher for UTR ${record.utr}`);
  };

  const columns: Column<SettlementRecord>[] = [
    {
      header: "UTR & Batch Reference",
      accessor: "utr",
      sortable: true,
      render: (s: SettlementRecord) => (
        <div>
          <span className="font-mono font-bold text-slate-900 dark:text-white block">
            {s.utr}
          </span>
          <span className="text-[11px] text-slate-400 font-mono block">
            {s.date}
          </span>
        </div>
      )
    },
    {
      header: "Gross Volume",
      accessor: "grossAmount",
      sortable: true,
      render: (s: SettlementRecord) => (
        <div>
          <span className="font-mono font-bold text-slate-900 dark:text-white">
            ₹{s.grossAmount.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-400 block">
            {s.txCount} UPI counter txs
          </span>
        </div>
      )
    },
    {
      header: "Platform Fee",
      render: () => (
        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
          ₹0.00 (0% direct)
        </span>
      )
    },
    {
      header: "Net Disbursed",
      accessor: "netDisbursed",
      sortable: true,
      render: (s: SettlementRecord) => (
        <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
          ₹{s.netDisbursed.toLocaleString()}
        </span>
      )
    },
    {
      header: "Target VPA / Bank",
      accessor: "destination",
      render: (s: SettlementRecord) => (
        <span className="text-xs font-mono font-semibold text-purple-600 dark:text-purple-400">
          {s.destination}
        </span>
      )
    },
    {
      header: "Status",
      accessor: "status",
      render: (s: SettlementRecord) => (
        <span className="badge-status badge-approved text-[11px]">
          <CheckCircle2 size={11} />
          {s.status}
        </span>
      )
    },
    {
      header: "Voucher",
      render: (s: SettlementRecord) => (
        <button
          onClick={() => downloadReceipt(s)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors"
        >
          <Download size={13} />
          <span>Receipt</span>
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold font-['Manrope'] text-slate-900 dark:text-white">
              Merchant Brand & Bank Settlements
            </h2>
            <span className="badge-status badge-approved text-xs">
              <ShieldCheck size={12} />
              KYC Approved
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Registered business identity, FSSAI credentials, and direct zero-escrow UPI settlement routing.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setTempUpi(bankUpiId);
              setTempAcc(bankAccountNum);
              setTempIfsc(bankIfsc);
              setTempBank(bankName);
              setIsBankDrawerOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
          >
            <Edit2 size={14} />
            <span>Update Bank / VPA</span>
          </button>

          <button
            onClick={handleSaveProfile}
            className="btn-gradient flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md"
          >
            <Save size={15} />
            <span>Save Profile</span>
          </button>
        </div>
      </div>

      {/* Grid: Brand Info & Direct Settlement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Brand Profile Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
                <Building2 size={18} />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Manrope']">
                Brand & Legal Entity
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">ID: m-1 (Flagship)</span>
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">FSSAI License</label>
                <input
                  type="text"
                  value={fssaiLicense}
                  onChange={(e) => setFssaiLicense(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Average Cost</label>
                <input
                  type="text"
                  value={avgCostTwo}
                  onChange={(e) => setAvgCostTwo(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
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
                <label className="font-bold text-slate-700 dark:text-slate-300">Owner Contact</label>
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

        {/* Bank & UPI Settlement Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                <CreditCard size={18} />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Manrope']">
                Direct Bank Settlement VPA
              </h3>
            </div>
            <span className="badge-status badge-approved text-xs">
              <CheckCircle2 size={12} />
              Penny Verified
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-amber-500/10 border border-purple-200/80 dark:border-purple-800/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Destination UPI VPA</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                Direct Bank Settlement
              </span>
            </div>
            <p className="text-lg font-mono font-extrabold text-purple-700 dark:text-purple-300">
              {bankUpiId}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Bank: <strong>{bankName}</strong> · A/C: <strong>••••{bankAccountNum.slice(-4)}</strong> · IFSC: <strong>{bankIfsc}</strong>
            </p>
          </div>

          <div className="space-y-3 text-xs pt-1">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                  Settlement Frequency
                </span>
                <span className="text-[11px] text-slate-500">
                  {settlementMode === "instant"
                    ? "Real-time instant direct UPI credit per scan"
                    : "End-of-day T+0 consolidated batch (11:30 PM)"}
                </span>
              </div>
              <div className="flex items-center gap-1 p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setSettlementMode("instant");
                    toast.success("Settlement mode switched to Real-Time Instant UPI!");
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    settlementMode === "instant"
                      ? "bg-purple-600 text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Instant UPI
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSettlementMode("batch");
                    toast.success("Settlement mode switched to Daily T+0 Batch!");
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    settlementMode === "batch"
                      ? "bg-purple-600 text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Daily T+0
                </button>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/60 flex items-start gap-2.5">
              <ShieldCheck size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
                <strong>Non-Custodial Architecture:</strong> PINAK does not hold your diner funds in an escrow pool. 100% of customer payments route straight to your ICICI Bank account via UPI standard rails with 0% gateway commission.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settlement History Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Manrope']">
              Bank Disbursal & Settlement Ledger
            </h3>
            <p className="text-xs text-slate-500">
              Audit log of all counter payment settlements with bank UTR reference numbers
            </p>
          </div>
        </div>

        <AdvancedTable
          data={settlements}
          columns={columns}
          keyExtractor={(s) => s.id}
          searchPlaceholder="Search by UTR reference or date..."
          searchFilter={(s: SettlementRecord, q: string) =>
            s.utr.toLowerCase().includes(q) ||
            s.destination.toLowerCase().includes(q) ||
            s.date.toLowerCase().includes(q) ||
            s.status.toLowerCase().includes(q)
          }
          defaultPageSize={5}
        />
      </div>

      {/* UPDATE BANK ACCOUNT RIGHT SLIDE-OVER DRAWER */}
      {isBankDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsBankDrawerOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <aside className="w-screen max-w-md bg-white dark:bg-[#121626] shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-transparent">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-600 text-white shadow-md">
                    <CreditCard size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Update Bank Settlement Account
                    </h3>
                    <p className="text-xs text-slate-500">
                      Configure your official bank VPA for instant counter payouts
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsBankDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSaveBankDetails} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Primary UPI VPA (Direct Settlement)
                  </label>
                  <input
                    type="text"
                    required
                    value={tempUpi}
                    onChange={(e) => setTempUpi(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-purple-300 dark:border-purple-800 bg-purple-50/30 dark:bg-purple-950/20 font-mono font-bold text-purple-700 dark:text-purple-300 text-xs"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Customer payments via dynamic UPI QR will settle instantly to this address.
                  </span>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Bank Name & Branch
                  </label>
                  <input
                    type="text"
                    required
                    value={tempBank}
                    onChange={(e) => setTempBank(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Account Number
                  </label>
                  <input
                    type="text"
                    required
                    value={tempAcc}
                    onChange={(e) => setTempAcc(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    required
                    value={tempIfsc}
                    onChange={(e) => setTempIfsc(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs font-semibold uppercase"
                  />
                </div>

                {/* Penny Drop Verification */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Penny-Drop Verification
                    </span>
                    {pennyVerified && (
                      <span className="badge-status badge-approved text-[10px]">
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    A ₹1.00 micro-deposit validates your beneficiary name against NPCI bank records.
                  </p>
                  <button
                    type="button"
                    onClick={handleVerifyPennyDrop}
                    disabled={isVerifyingPenny}
                    className="px-3 py-1.5 rounded-xl border border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 font-bold text-xs hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors flex items-center gap-1.5"
                  >
                    {isVerifyingPenny ? (
                      <div className="w-3.5 h-3.5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <CheckCircle2 size={13} />
                    )}
                    <span>Test Penny Drop</span>
                  </button>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="btn-gradient w-full py-3 rounded-xl text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2"
                  >
                    <Save size={15} />
                    <span>Save & Update Settlement VPA</span>
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
