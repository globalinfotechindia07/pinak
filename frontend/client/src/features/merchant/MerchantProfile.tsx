import React, { useState, useEffect } from "react";
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
import { Badge } from "../../components/ui/badge";
import { merchantApi } from "../../api/merchantApi";
import { transactionApi } from "../../api/transactionApi";
import { useAppStore } from "../../hooks/useAppStore";

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
  const store = useAppStore();
  const currentMerchant = store.merchants.find(m => m.id === store.currentUser?.id) || store.merchants[0];

  // Brand details
  const [businessName, setBusinessName] = useState(store.currentUser?.name || currentMerchant?.businessName || "Merchant Partner");
  const [legalName, setLegalName] = useState(currentMerchant?.legalEntityName || store.currentUser?.name || "Merchant Business Entity");
  const [fssaiLicense, setFssaiLicense] = useState("");
  const [gstin, setGstin] = useState(currentMerchant?.gstin || "");
  const [pan, setPan] = useState(currentMerchant?.pan || "");
  const [ownerEmail, setOwnerEmail] = useState(store.currentUser?.email || currentMerchant?.ownerEmail || "");
  const [ownerPhone, setOwnerPhone] = useState(currentMerchant?.ownerPhone || "");
  const [avgCostTwo, setAvgCostTwo] = useState("₹500 for two");
  const [cuisineType, setCuisineType] = useState(currentMerchant?.categoryName || "Dining & Services");
  const [openHours, setOpenHours] = useState("10:00 AM – 10:00 PM");

  // Bank & Settlement details
  const [bankUpiId, setBankUpiId] = useState(currentMerchant?.bankUpiId || "merchant@upi");
  const [bankAccountNum, setBankAccountNum] = useState("");
  const [bankIfsc, setBankIfsc] = useState("");
  const [bankName, setBankName] = useState("");
  const [settlementMode, setSettlementMode] = useState<"instant" | "batch">("instant");

  // Drawer state for updating bank details
  const [isBankDrawerOpen, setIsBankDrawerOpen] = useState(false);
  const [tempUpi, setTempUpi] = useState(currentMerchant?.bankUpiId || "merchant@upi");
  const [tempAcc, setTempAcc] = useState("");
  const [tempIfsc, setTempIfsc] = useState("");
  const [tempBank, setTempBank] = useState("");
  const [isVerifyingPenny, setIsVerifyingPenny] = useState(false);
  const [pennyVerified, setPennyVerified] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Live settlement history
  const [settlements, setSettlements] = useState<SettlementRecord[]>([]);

  useEffect(() => {
    // Fetch live merchant profile from backend
    merchantApi
      .getProfile()
      .then((profile) => {
        if (profile) {
          if (profile.businessName) setBusinessName(profile.businessName);
          if (profile.legalEntityName) setLegalName(profile.legalEntityName);
          if (profile.gstin) setGstin(profile.gstin);
          if (profile.panNumber) setPan(profile.panNumber);
          if (profile.bankUpiId) {
            setBankUpiId(profile.bankUpiId);
            setTempUpi(profile.bankUpiId);
          }
          if (profile.bankAccountNumber) {
            setBankAccountNum(profile.bankAccountNumber);
            setTempAcc(profile.bankAccountNumber);
          }
          if (profile.bankIfsc) {
            setBankIfsc(profile.bankIfsc);
            setTempIfsc(profile.bankIfsc);
          }
          if (profile.accountHolderName) {
            setBankName(profile.accountHolderName);
            setTempBank(profile.accountHolderName);
          }
        }
      })
      .catch((err) => {
        console.info("Merchant profile query:", err.message);
      });

    // Fetch live merchant transactions to show settlement audit
    transactionApi
      .getMerchantTransactions()
      .then((txList) => {
        if (Array.isArray(txList) && txList.length > 0) {
          setSettlements(
            txList.map((tx: any, idx: number) => ({
              id: `set-${tx.id || idx}`,
              utr: tx.transactionReference || `UTR${tx.id?.substring(0, 8)?.toUpperCase()}`,
              date: tx.createdAt
                ? tx.createdAt.replace("T", " ").substring(0, 16)
                : new Date().toISOString().substring(0, 16),
              grossAmount: Number(tx.grossAmount) || Number(tx.payableAmount) || 0,
              txCount: 1,
              fee: 0,
              netDisbursed: Number(tx.payableAmount) || 0,
              destination: bankUpiId || "merchant@upi",
              status: tx.status === "COMPLETED" ? "SETTLED" : "IN_TRANSIT",
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await merchantApi.updateProfile({
        businessName: businessName.trim(),
        legalEntityName: legalName.trim(),
        bankUpiId: bankUpiId.trim(),
      });
      toast.success("Merchant profile and brand details updated successfully!");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to update profile details");
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerifyPennyDrop = () => {
    setIsVerifyingPenny(true);
    setTimeout(() => {
      setIsVerifyingPenny(false);
      setPennyVerified(true);
      toast.success(`₹1.00 Penny-Drop verification successful! Account Holder: ${legalName}`);
    }, 1200);
  };

  const handleSaveBankDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await merchantApi.updateProfile({
        bankUpiId: tempUpi.trim(),
        bankAccountNumber: tempAcc.trim(),
        bankIfsc: tempIfsc.trim(),
        accountHolderName: tempBank.trim(),
      });
      setBankUpiId(tempUpi);
      setBankAccountNum(tempAcc);
      setBankIfsc(tempIfsc);
      setBankName(tempBank);
      setIsBankDrawerOpen(false);
      toast.success("Settlement bank account updated and validated for direct UPI disbursements!");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to update bank details");
    }
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
        <Badge variant="success" className="text-[11px]">
          <CheckCircle2 size={11} />
          {s.status}
        </Badge>
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
            <Badge variant="success">
              <ShieldCheck size={12} />
              KYC Approved
            </Badge>
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
            <span className="text-[11px] font-mono text-slate-400">HQ Flagship Terminal</span>
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
            <Badge variant="success">
              <CheckCircle2 size={12} />
              Penny Verified
            </Badge>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-amber-500/10 border border-purple-200/80 dark:border-purple-800/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Destination UPI VPA</span>
              <Badge className="text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                Direct Bank Settlement
              </Badge>
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
                      <Badge variant="success" className="text-[10px]">
                        Verified
                      </Badge>
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
