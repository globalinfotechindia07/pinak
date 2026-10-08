import React, { useState, useEffect } from "react";
import {
  Wallet,
  Building2,
  ArrowUpRight,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  ShieldCheck,
  CreditCard,
  QrCode,
  FileText,
  Lock,
  Sparkles,
  RefreshCw,
  Search,
  Store as StoreIcon,
  ChevronRight,
  TrendingUp,
  X
} from "lucide-react";
import {
  MerchantWallet,
  WalletLedgerEntry,
  MerchantBankAccount,
  MerchantPayoutRequest,
  StoreRevenueSummary,
  Store
} from "../../types";
import { dataStore } from "../../services/dataStore";
import { Badge } from "../../components/ui/badge";
import { cn } from "../../lib/utils";
import { toast } from "sonner";

interface MerchantWalletDashboardProps {
  merchantId?: string;
  stores?: Store[];
}

export const MerchantWalletDashboard: React.FC<MerchantWalletDashboardProps> = ({
  merchantId = "m-1",
  stores = []
}) => {
  const [wallet, setWallet] = useState<MerchantWallet>(() => dataStore.getMerchantWallet(merchantId));
  const [ledger, setLedger] = useState<WalletLedgerEntry[]>(() => dataStore.getMerchantLedger(merchantId));
  const [bankAccounts, setBankAccounts] = useState<MerchantBankAccount[]>(() => dataStore.getMerchantBankAccounts(merchantId));
  const [payouts, setPayouts] = useState<MerchantPayoutRequest[]>(() => dataStore.getMerchantPayouts(merchantId));
  const [revenueBreakdown, setRevenueBreakdown] = useState<StoreRevenueSummary[]>(() => dataStore.getStoreRevenueBreakdown(merchantId));

  const [activeTab, setActiveTab] = useState<"payouts" | "ledger" | "bank_accounts">("payouts");
  const [selectedStoreFilter, setSelectedStoreFilter] = useState<string>("ALL");
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [isAddBankModalOpen, setIsAddBankModalOpen] = useState(false);

  // Payout Form State
  const [payoutAmount, setPayoutAmount] = useState<number>(50000);
  const [selectedBankId, setSelectedBankId] = useState<string>(bankAccounts[0]?.id || "");
  const [payoutMode, setPayoutMode] = useState<"IMPS" | "NEFT" | "UPI">("IMPS");
  const [otpCode, setOtpCode] = useState<string>("");
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);

  // Bank Form State
  const [newBankName, setNewBankName] = useState("");
  const [newHolderName, setNewHolderName] = useState("");
  const [newAccountNum, setNewAccountNum] = useState("");
  const [newIfsc, setNewIfsc] = useState("");
  const [newUpi, setNewUpi] = useState("");

  const refreshData = () => {
    setWallet(dataStore.getMerchantWallet(merchantId));
    setLedger(dataStore.getMerchantLedger(merchantId, selectedStoreFilter));
    setBankAccounts(dataStore.getMerchantBankAccounts(merchantId));
    setPayouts(dataStore.getMerchantPayouts(merchantId));
    setRevenueBreakdown(dataStore.getStoreRevenueBreakdown(merchantId));
  };

  useEffect(() => {
    refreshData();
  }, [merchantId, selectedStoreFilter]);

  const handleRequestPayout = (e: React.FormEvent) => {
    e.preventDefault();
    if (payoutAmount < 10) {
      toast.error("Minimum payout amount is ₹10");
      return;
    }
    if (payoutAmount > wallet.availableBalance) {
      toast.error("Requested amount exceeds available balance");
      return;
    }
    if (!otpCode || otpCode.length < 4) {
      toast.error("Please enter the 4-digit Step-Up 2FA Security OTP (e.g. 1234)");
      return;
    }

    setIsSubmittingPayout(true);
    setTimeout(() => {
      try {
        dataStore.requestMerchantPayout(merchantId, payoutAmount, selectedBankId || bankAccounts[0]?.id || "bank-101", payoutMode);
        toast.success(`Bank payout of ₹${payoutAmount.toLocaleString()} initiated via ${payoutMode}!`);
        setIsPayoutModalOpen(false);
        setOtpCode("");
        refreshData();
      } catch (err: any) {
        toast.error(err.message || "Payout request failed");
      } finally {
        setIsSubmittingPayout(false);
      }
    }, 600);
  };

  const handleAddBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBankName || !newHolderName || !newAccountNum || !newIfsc) {
      toast.error("Please fill in all mandatory bank account fields");
      return;
    }

    dataStore.addMerchantBankAccount({
      merchantId,
      accountHolderName: newHolderName,
      bankName: newBankName,
      accountNumberLast4: newAccountNum.slice(-4),
      ifscCode: newIfsc.toUpperCase(),
      upiVpa: newUpi || undefined,
      isPrimary: bankAccounts.length === 0,
      verificationStatus: "VERIFIED",
      pennyDropReference: `PENNY_REF_${Date.now().toString().slice(-6)}`
    });

    toast.success(`Bank account ${newBankName} (**${newAccountNum.slice(-4)}) verified via Penny Drop!`);
    setIsAddBankModalOpen(false);
    setNewBankName("");
    setNewHolderName("");
    setNewAccountNum("");
    setNewIfsc("");
    setNewUpi("");
    refreshData();
  };

  const downloadSettlementSlip = (payout: MerchantPayoutRequest) => {
    const content = `PINAK SUPER-APP - OFFICIAL SETTLEMENT SLIP
==================================================
Payout ID: ${payout.id}
Date: ${new Date(payout.createdAt).toLocaleString()}
Merchant Brand: ${payout.merchantName || "Silver Spoon Hospitality"}
Settlement Bank: ${payout.bankName} (A/C **${payout.accountNumberLast4})
Gross Requested: ₹${payout.amount.toLocaleString()}
Processing Fee: ₹${payout.payoutFee}
Net Dispatched: ₹${payout.netPayout.toLocaleString()}
Payment Mode: ${payout.mode}
Bank UTR Number: ${payout.bankUtr || "Pending RBI Clearing"}
Status: ${payout.status}
Provider: ${payout.provider}
Idempotency Key: ${payout.idempotencyKey}
==================================================
This is a computer-generated financial settlement document.`;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `PINAK_Settlement_Slip_${payout.id.slice(-8)}.txt`;
    link.click();
    toast.success("Settlement slip downloaded");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold font-['Manrope'] text-slate-900 dark:text-white">
              Merchant Wallet & Settlement Banking
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1">
              <ShieldCheck size={13} />
              Double-Entry RBI Escrow
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time customer sales settlement, store-wise revenue attribution, and instant bank payout dispatches.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refreshData}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Refresh Ledger"
          >
            <RefreshCw size={15} />
          </button>
          <button
            onClick={() => setIsPayoutModalOpen(true)}
            className="btn-gradient flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-md hover:opacity-95 transition-opacity"
          >
            <ArrowUpRight size={16} />
            <span>Request Instant Payout</span>
          </button>
        </div>
      </div>

      {/* Main KPI Wallet Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Available Balance Card */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl relative overflow-hidden border border-indigo-900/50">
          <div className="absolute right-[-20px] top-[-20px] w-36 h-36 bg-pink-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Wallet size={15} className="text-pink-400" />
              Available for Withdrawal
            </span>
            <Badge variant="success" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
              Live Escrow
            </Badge>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight text-white">
              ₹{wallet.availableBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </h3>
            <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
              <span>Primary Payout Bank:</span>
              <span className="font-bold text-pink-300 flex items-center gap-1">
                <Building2 size={13} />
                {bankAccounts[0]?.bankName || "HDFC Bank"} (**{bankAccounts[0]?.accountNumberLast4 || "8891"})
              </span>
            </div>
          </div>
        </div>

        {/* Pending Settlement Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Clock size={15} className="text-amber-500" />
              Pending Clearing (T+1)
            </span>
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Clearing EOD</span>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
              ₹{wallet.pendingBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Customer payments undergoing standard fraud settlement verification.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between text-xs text-slate-500">
            <span>Settlement Cycle:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">Daily 11:59 PM Auto-Clear</span>
          </div>
        </div>

        {/* Lifetime Dispatched Volume Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp size={15} className="text-emerald-500" />
              Total Payouts Settled
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">100% Verified UTR</span>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
              ₹{wallet.totalWithdrawn.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Lifetime gross volume processed: <strong className="text-slate-700 dark:text-slate-200">₹{wallet.lifetimeVolume.toLocaleString("en-IN")}</strong>
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between text-xs text-slate-500">
            <span>Gateway Adapter:</span>
            <span className="font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1">
              <Sparkles size={12} /> Connected Banking (RazorpayX)
            </span>
          </div>
        </div>
      </div>

      {/* Store-wise Revenue Attribution Breakdown */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <StoreIcon size={18} className="text-pink-600" />
              Store-Wise Revenue Attribution Breakdown
            </h3>
            <p className="text-xs text-slate-400">Track which physical store branch contributed what volume to your central wallet.</p>
          </div>
          <span className="text-xs font-semibold text-slate-500">{revenueBreakdown.length} Active Outlets</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {revenueBreakdown.map((st) => (
            <div
              key={st.storeId}
              className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2 hover:border-pink-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Building2 size={14} className="text-purple-500" />
                  {st.storeName}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                  {st.totalSalesCount} Redemptions
                </span>
              </div>
              <div className="flex justify-between items-baseline pt-1">
                <span className="text-xs text-slate-500">Gross Sales:</span>
                <span className="font-mono font-extrabold text-sm text-slate-900 dark:text-white">
                  ₹{st.grossVolume.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between items-baseline text-[11px] pt-1 border-t border-slate-200/50 dark:border-slate-800">
                <span className="text-slate-400">Net Credit to Wallet:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  ₹{st.netEarnings.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab("payouts")}
            className={cn(
              "pb-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5",
              activeTab === "payouts"
                ? "border-pink-600 text-pink-600 dark:text-pink-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            )}
          >
            <ArrowUpRight size={15} />
            <span>Payout & Settlement History ({payouts.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("ledger")}
            className={cn(
              "pb-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5",
              activeTab === "ledger"
                ? "border-pink-600 text-pink-600 dark:text-pink-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            )}
          >
            <FileText size={15} />
            <span>Double-Entry Ledger Audit ({ledger.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("bank_accounts")}
            className={cn(
              "pb-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5",
              activeTab === "bank_accounts"
                ? "border-pink-600 text-pink-600 dark:text-pink-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            )}
          >
            <CreditCard size={15} />
            <span>Settlement Bank Accounts ({bankAccounts.length})</span>
          </button>
        </div>

        {activeTab === "ledger" && (
          <div className="flex items-center gap-2 pb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Filter Store:</span>
            <select
              value={selectedStoreFilter}
              onChange={(e) => setSelectedStoreFilter(e.target.value)}
              className="px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200"
            >
              <option value="ALL">All Stores</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.storeName || s.branchName}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Tab Content 1: Payout & Settlement History */}
      {activeTab === "payouts" && (
        <div className="bg-white dark:bg-[#121626] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-bold text-[10px]">
                <tr>
                  <th className="px-5 py-3">Payout ID & Date</th>
                  <th className="px-5 py-3">Destination Bank</th>
                  <th className="px-5 py-3">Transfer Mode</th>
                  <th className="px-5 py-3">Amount & Fees</th>
                  <th className="px-5 py-3">Bank UTR Number</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Settlement Slip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {payouts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      No payout dispatches recorded yet. Click "Request Instant Payout" to initiate your first transfer.
                    </td>
                  </tr>
                ) : (
                  payouts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-mono font-bold text-slate-900 dark:text-white">{p.id}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{new Date(p.createdAt).toLocaleString()}</p>
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-1.5">
                          <Building2 size={13} className="text-purple-500" />
                          <span>{p.bankName}</span>
                          <span className="font-mono text-slate-400 text-[11px]">(**{p.accountNumberLast4})</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {p.mode}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono">
                        <p className="font-extrabold text-slate-900 dark:text-white">₹{p.amount.toLocaleString()}</p>
                        <p className="text-[10px] text-slate-400">Fee: ₹{p.payoutFee} • Net: ₹{p.netPayout.toLocaleString()}</p>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-600 dark:text-slate-400">
                        {p.bankUtr || "Pending RBI Clearing"}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge
                          variant={
                            p.status === "SUCCESS"
                              ? "success"
                              : p.status === "FAILED" || p.status === "HELD"
                              ? "destructive"
                              : "warning"
                          }
                        >
                          {p.status === "SUCCESS" ? (
                            <CheckCircle2 size={12} />
                          ) : p.status === "PROCESSING" ? (
                            <Clock size={12} />
                          ) : (
                            <AlertCircle size={12} />
                          )}
                          {p.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => downloadSettlementSlip(p)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
                        >
                          <Download size={13} />
                          <span>Slip</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content 2: Double-Entry Ledger Audit Stream */}
      {activeTab === "ledger" && (
        <div className="bg-white dark:bg-[#121626] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-bold text-[10px]">
                <tr>
                  <th className="px-5 py-3">Timestamp & Ref</th>
                  <th className="px-5 py-3">Store Branch</th>
                  <th className="px-5 py-3">Entry Type</th>
                  <th className="px-5 py-3">Gross & Net Amount</th>
                  <th className="px-5 py-3">Running Wallet Balance</th>
                  <th className="px-5 py-3">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {ledger.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-mono text-[11px] text-slate-400">{new Date(l.createdAt).toLocaleString()}</p>
                      <p className="font-mono text-[10px] font-bold text-slate-500">{l.sourceReference}</p>
                    </td>
                    <td className="px-5 py-3.5 font-semibold">
                      {l.storeName ? (
                        <span className="flex items-center gap-1 text-slate-800 dark:text-slate-200">
                          <StoreIcon size={12} className="text-purple-500" />
                          {l.storeName}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono text-[11px]">Brand-wide / HQ</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full font-mono text-[10px] font-bold border",
                          l.entryType === "CREDIT"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                            : l.entryType === "DEBIT"
                            ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800"
                            : l.entryType === "HOLD"
                            ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
                            : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800"
                        )}
                      >
                        {l.entryType}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono">
                      <p
                        className={cn(
                          "font-extrabold text-sm",
                          l.entryType === "CREDIT" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-white"
                        )}
                      >
                        {l.entryType === "CREDIT" ? "+" : "-"}₹{l.netAmount.toLocaleString()}
                      </p>
                      {l.feeDeducted > 0 && (
                        <p className="text-[10px] text-slate-400">Gross: ₹{l.amount.toLocaleString()} (Fee ₹{l.feeDeducted})</p>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-800 dark:text-slate-200">
                      ₹{l.runningBalance.toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                      {l.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content 3: Settlement Bank Accounts */}
      {activeTab === "bank_accounts" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Verified Settlement Bank Accounts & UPI VPA
            </h3>
            <button
              onClick={() => setIsAddBankModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-pink-600 dark:text-pink-400 border border-pink-200 dark:border-pink-900/60 hover:bg-pink-50 dark:hover:bg-pink-950/40 transition-colors"
            >
              <Plus size={14} />
              <span>Add Settlement Bank Account</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bankAccounts.map((acc) => (
              <div
                key={acc.id}
                className="p-5 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3 relative"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-300 flex items-center justify-center font-bold">
                      <Building2 size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{acc.bankName}</h4>
                      <p className="text-[11px] text-slate-400 font-mono">IFSC: {acc.ifscCode}</p>
                    </div>
                  </div>
                  {acc.isPrimary && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 border border-pink-200 dark:border-pink-800">
                      PRIMARY PAYOUT
                    </span>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Account Holder:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{acc.accountHolderName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Account Number:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      •••• •••• {acc.accountNumberLast4}
                    </span>
                  </div>
                  {acc.upiVpa && (
                    <div className="flex justify-between pt-1 border-t border-slate-200/50 dark:border-slate-800">
                      <span className="text-slate-400">Settlement UPI VPA:</span>
                      <span className="font-mono font-semibold text-purple-600 dark:text-purple-400">{acc.upiVpa}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 size={13} />
                    Penny Drop Verified
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">Ref: {acc.pennyDropReference || "PENNY_9812"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instant Payout Modal Drawer */}
      {isPayoutModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setIsPayoutModalOpen(false)} />
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <aside className="w-screen max-w-md bg-white dark:bg-[#121626] shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-pink-100 text-pink-600 dark:bg-pink-950/60 dark:text-pink-300 flex items-center justify-center">
                    <ArrowUpRight size={18} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Request Instant Bank Payout</h3>
                </div>
                <button onClick={() => setIsPayoutModalOpen(false)} className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleRequestPayout} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-900 text-white space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Available Escrow Balance</span>
                  <p className="text-2xl font-extrabold font-mono text-pink-400">
                    ₹{wallet.availableBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Withdrawal Amount (₹) *</label>
                  <input
                    type="number"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(parseFloat(e.target.value) || 0)}
                    min={10}
                    max={wallet.availableBalance}
                    className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-base font-bold text-slate-900 dark:text-white font-mono"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">₹5 flat RBI clearing fee applies.</p>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Destination Bank Account *</label>
                  <select
                    value={selectedBankId}
                    onChange={(e) => setSelectedBankId(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
                  >
                    {bankAccounts.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.bankName} - A/C **{b.accountNumberLast4} ({b.accountHolderName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Transfer Mode *</label>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    {(["IMPS", "NEFT", "UPI"] as const).map((m) => (
                      <button
                        type="button"
                        key={m}
                        onClick={() => setPayoutMode(m)}
                        className={cn(
                          "py-2 rounded-xl text-xs font-bold font-mono border transition-colors",
                          payoutMode === m
                            ? "bg-pink-100 border-pink-300 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300"
                            : "border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                        )}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/30 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                    <Lock size={14} />
                    <span>Step-Up 2FA Security OTP *</span>
                  </div>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400">
                    High-value payout request requires OTP verification sent to merchant owner mobile.
                  </p>
                  <input
                    type="password"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="Enter 2FA Security OTP (e.g. 1234)"
                    className="w-full px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-900 text-sm font-mono font-bold tracking-widest text-slate-900 dark:text-white"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                  <button type="button" onClick={() => setIsPayoutModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-500">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingPayout}
                    className="btn-gradient px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md disabled:opacity-50"
                  >
                    {isSubmittingPayout ? "Processing Payout..." : `Confirm & Dispatch ₹${payoutAmount.toLocaleString()}`}
                  </button>
                </div>
              </form>
            </aside>
          </div>
        </div>
      )}

      {/* Add Bank Account Modal */}
      {isAddBankModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#121626] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Add Settlement Bank Account</h3>
              <button onClick={() => setIsAddBankModalOpen(false)} className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddBank} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Bank Name *</label>
                <input
                  type="text"
                  value={newBankName}
                  onChange={(e) => setNewBankName(e.target.value)}
                  placeholder="e.g. HDFC Bank, ICICI Bank, SBI"
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Account Holder Name *</label>
                <input
                  type="text"
                  value={newHolderName}
                  onChange={(e) => setNewHolderName(e.target.value)}
                  placeholder="Legal Business Name on Bank Account"
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Account Number *</label>
                <input
                  type="text"
                  value={newAccountNum}
                  onChange={(e) => setNewAccountNum(e.target.value)}
                  placeholder="Enter 9 to 18 digit account number"
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">IFSC Code *</label>
                <input
                  type="text"
                  value={newIfsc}
                  onChange={(e) => setNewIfsc(e.target.value)}
                  placeholder="e.g. HDFC0001234"
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono uppercase text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Settlement UPI VPA (Optional)</label>
                <input
                  type="text"
                  value={newUpi}
                  onChange={(e) => setNewUpi(e.target.value)}
                  placeholder="e.g. brandname@hdfcbank"
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsAddBankModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-500">
                  Cancel
                </button>
                <button type="submit" className="btn-gradient px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md">
                  Verify & Add Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
