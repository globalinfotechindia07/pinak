import React, { useState } from "react";
import { Receipt, Plus, Sparkles, CheckCircle2, Clock, WalletCards, ArrowUpRight, Zap, X, ArrowRight, User } from "lucide-react";
import { Transaction, Offer } from "../../types";
import { AdvancedTable, Column } from "../../components/ui/AdvancedTable";
import { toast } from "sonner";

interface LiveBillingFeedProps {
  transactions: Transaction[];
  offers: Offer[];
  onRecordTransaction: (data: Partial<Transaction>) => void;
}

export const LiveBillingFeed: React.FC<LiveBillingFeedProps> = ({
  transactions,
  offers,
  onRecordTransaction
}) => {
  const [isSimulateOpen, setIsSimulateOpen] = useState(false);
  const myTransactions = transactions.filter((t) => t.merchantId === "m-1");

  const [customerName, setCustomerName] = useState("Vikram Malhotra");
  const [billAmount, setBillAmount] = useState(1500);
  const [selectedOfferId, setSelectedOfferId] = useState(offers[0]?.id || "off-1");

  const selectedOffer = offers.find((o) => o.id === selectedOfferId);
  const discountAmount =
    selectedOffer?.type === "FLAT_AMT"
      ? selectedOffer.value
      : selectedOffer?.type === "FLAT_PCT"
      ? Math.round((billAmount * selectedOffer.value) / 100)
      : 200;
  const payableAmount = Math.max(0, billAmount - discountAmount);

  const handleSimulatePayment = () => {
    onRecordTransaction({
      customerName,
      customerPhone: "+91 98220 " + Math.floor(10000 + Math.random() * 90000),
      merchantId: "m-1",
      merchantName: "The Curry Leaf",
      storeName: "Dharampeth Flagship",
      billAmount,
      discountAmount,
      payableAmount,
      payeeVpa: "thecurryleaf@icici",
      referenceId: selectedOfferId,
      status: "SUCCESS",
      settlementStatus: "SETTLED"
    });
    toast.success(`₹${payableAmount} UPI payment confirmed from ${customerName}! Deal redeemed.`);
    setIsSimulateOpen(false);
  };

  const columns: Column<Transaction>[] = [
    {
      header: "Customer & Phone",
      sortable: true,
      accessor: "customerName",
      render: (t) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 font-bold text-xs flex items-center justify-center">
            {t.customerName.charAt(0)}
          </div>
          <div>
            <p className="font-bold text-slate-900 dark:text-white leading-tight">{t.customerName}</p>
            <p className="text-[11px] text-slate-400 font-mono">{t.customerPhone || "+91 98220 54120"}</p>
          </div>
        </div>
      )
    },
    {
      header: "Branch Outlet",
      sortable: true,
      accessor: "storeName",
      render: (t) => <span className="font-medium text-slate-700 dark:text-slate-300 text-xs">{t.storeName}</span>
    },
    {
      header: "Gross Bill",
      sortable: true,
      accessor: "billAmount",
      render: (t) => <span className="font-mono text-xs text-slate-500">₹{t.billAmount}</span>
    },
    {
      header: "Deal Discount",
      sortable: true,
      accessor: "discountAmount",
      render: (t) => (
        <span className="text-xs font-bold text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/40 px-2 py-0.5 rounded-md font-mono">
          -₹{t.discountAmount} Off
        </span>
      )
    },
    {
      header: "Net Settled Amount",
      sortable: true,
      accessor: "payableAmount",
      render: (t) => (
        <span className="font-extrabold text-sm text-slate-900 dark:text-white font-['Manrope']">
          ₹{t.payableAmount}
        </span>
      )
    },
    {
      header: "Bank Settlement",
      render: (t) => (
        <div className="font-mono text-[11px]">
          <p className="text-slate-700 dark:text-slate-300">{t.utr || "Direct UPI"}</p>
          <span className="text-emerald-600 dark:text-emerald-400 font-sans font-bold text-[10px]">
            {t.settlementStatus || "SETTLED"} to {t.payeeVpa}
          </span>
        </div>
      )
    },
    {
      header: "Timestamp",
      sortable: true,
      accessor: "timestamp",
      render: (t) => (
        <span className="text-xs text-slate-400 font-mono">
          {new Date(t.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold font-['Manrope'] text-slate-900 dark:text-white">
              Live In-Store Redemptions Feed
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
              Direct UPI Switch Webhook
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time feed of customer counter scans, discounts auto-applied, and instant UPI bank settlements.
          </p>
        </div>

        <button
          onClick={() => setIsSimulateOpen(true)}
          className="btn-gradient flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md self-start sm:self-auto"
        >
          <Zap size={16} />
          <span>Simulate Customer Scan & Pay</span>
        </button>
      </div>

      {/* Advanced Table */}
      <AdvancedTable
        title="Live Counter Redemptions Stream"
        subtitle={`${myTransactions.length} successful in-store transactions verified`}
        columns={columns}
        data={myTransactions}
        keyExtractor={(t) => t.id}
        searchPlaceholder="Search customer, phone, store, or UTR..."
        searchFilter={(t, q) =>
          Boolean(
            t.customerName.toLowerCase().includes(q) ||
            t.storeName.toLowerCase().includes(q) ||
            (t.customerPhone && t.customerPhone.includes(q)) ||
            (t.utr && t.utr.toLowerCase().includes(q))
          )
        }
      />

      {/* In-Store Payment Simulator Right Slide-Over Drawer */}
      {isSimulateOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity" onClick={() => setIsSimulateOpen(false)} />
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <aside className="w-screen max-w-md bg-white dark:bg-[#121626] shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2">
                  <Zap size={18} className="text-pink-600" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Simulate In-Store UPI Scan & Pay
                  </h3>
                </div>
                <button onClick={() => setIsSimulateOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Customer Name</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Gross Bill Amount (₹)</label>
                  <input
                    type="number"
                    value={billAmount}
                    onChange={(e) => setBillAmount(parseFloat(e.target.value) || 0)}
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Select Active Deal</label>
                  <select
                    value={selectedOfferId}
                    onChange={(e) => setSelectedOfferId(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white"
                  >
                    {offers.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.title} ({o.type === "FLAT_AMT" ? `Flat ₹${o.value} off` : `${o.value}% off`})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Calculation Summary */}
                <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-900/60 space-y-2">
                  <div className="flex justify-between items-center text-slate-500">
                    <span>Original Gross Bill:</span>
                    <span className="font-mono font-semibold">₹{billAmount}</span>
                  </div>
                  <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-bold">
                    <span>Deal Discount Saved:</span>
                    <span className="font-mono">-₹{discountAmount}</span>
                  </div>
                  <div className="pt-2 border-t border-purple-200/60 dark:border-purple-900/60 flex justify-between items-center font-bold text-slate-900 dark:text-white">
                    <span>Direct Net UPI Payment:</span>
                    <span className="text-pink-600 font-extrabold text-base font-mono">₹{payableAmount}</span>
                  </div>
                </div>

                {/* NPCI UPI Route Notice */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 space-y-1">
                  <p className="font-bold text-slate-700 dark:text-slate-300">UPI Intent Routing</p>
                  <p>Customer pays directly to <span className="font-mono text-purple-600">thecurryleaf@icici</span> via BHIM/PhonePe/GPay. Zero platform pooling.</p>
                </div>
              </div>

              <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end gap-2">
                <button onClick={() => setIsSimulateOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400">Cancel</button>
                <button
                  onClick={handleSimulatePayment}
                  className="btn-gradient px-4 py-2 rounded-xl text-white text-xs font-bold shadow-md"
                >
                  Confirm & Settle Payment
                </button>
              </div>
            </aside>
          </div>
        </div>
      )}
    </div>
  );
};
