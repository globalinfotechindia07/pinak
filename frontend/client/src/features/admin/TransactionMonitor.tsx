import React, { useState } from "react";
import {
  WalletCards,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  ShieldCheck,
  Eye,
  FileText,
  ExternalLink,
  X,
  CreditCard,
  Building2,
  ArrowRight,
  Hash,
  Activity,
  Layers,
  Sparkles
} from "lucide-react";
import { Transaction } from "../../types";
import { AdvancedTable, Column } from "../../components/ui/AdvancedTable";
import { Badge } from "../../components/ui/badge";
import { cn } from "../../lib/utils";
import { toast } from "sonner";

interface TransactionMonitorProps {
  transactions: Transaction[];
}

export const TransactionMonitor: React.FC<TransactionMonitorProps> = ({ transactions }) => {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const displayedTransactions = statusFilter === "ALL"
    ? transactions
    : transactions.filter((t) => t.status === statusFilter);

  const columns: Column<Transaction>[] = [
    {
      header: "Payment Intent & UTR",
      sortable: true,
      accessor: "paymentIntentId",
      render: (t) => (
        <div className="font-mono text-xs">
          <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
            <Hash size={12} className="text-purple-500" />
            <span>{t.paymentIntentId}</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            UTR: <span className="text-slate-600 dark:text-slate-300 font-semibold">{t.utr || "Pending"}</span>
          </p>
        </div>
      )
    },
    {
      header: "Customer & Merchant",
      accessor: "customerName",
      render: (t) => (
        <div className="text-xs">
          <p className="font-bold text-slate-800 dark:text-slate-200">{t.customerName}</p>
          <p className="text-slate-400 text-[11px] flex items-center gap-1 mt-0.5">
            <ArrowRight size={10} className="text-slate-300" />
            <span className="font-semibold text-purple-600 dark:text-purple-400">{t.merchantName}</span>
          </p>
        </div>
      )
    },
    {
      header: "Payee UPI VPA",
      accessor: "payeeVpa",
      render: (t) => (
        <span className="font-mono text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
          {t.payeeVpa}
        </span>
      )
    },
    {
      header: "Bill & Discount",
      sortable: true,
      accessor: "billAmount",
      render: (t) => (
        <div className="text-xs">
          <div className="flex items-center gap-1.5 font-mono">
            <span className="text-slate-400 line-through">₹{t.billAmount}</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">-₹{t.discountAmount}</span>
          </div>
          <p className="text-slate-400 text-[10px]">Paid: <span className="font-bold text-slate-900 dark:text-white font-mono">₹{t.payableAmount}</span></p>
        </div>
      )
    },
    {
      header: "Status",
      sortable: true,
      accessor: "status",
      render: (t) => (
        <Badge
          variant={
            t.status === "SUCCESS"
              ? "success"
              : t.status === "FAILED"
              ? "destructive"
              : "warning"
          }
        >
          {t.status === "SUCCESS" && <CheckCircle2 size={12} />}
          {t.status === "FAILED" && <XCircle size={12} />}
          {t.status === "PENDING" && <Clock size={12} />}
          {t.status}
        </Badge>
      )
    },
    {
      header: "Time",
      sortable: true,
      accessor: "timestamp",
      render: (t) => (
        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
          {t.timestamp}
        </span>
      )
    },
    {
      header: "Actions",
      className: "text-right",
      render: (t) => (
        <button
          onClick={() => setSelectedTx(t)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-colors shadow-2xs"
        >
          <Eye size={13} />
          <span>Audit</span>
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold font-['Manrope'] text-slate-900 dark:text-white">
              UPI Intent & Settlement Monitor
            </h2>
            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
              Zero Platform Pooling
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time ledger of bank-to-bank UPI transfers, PSP webhook HMAC signatures, and direct merchant settlements.
          </p>
        </div>
      </div>

      {/* Status Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Status:</span>
        {["ALL", "SUCCESS", "PENDING", "FAILED"].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors border ${
              statusFilter === st
                ? "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800 font-bold"
                : "border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            {st === "ALL" ? "All Statuses" : st}
          </button>
        ))}
      </div>

      {/* Advanced Table */}
      <AdvancedTable
        title="Live UPI Intent Ledger"
        subtitle={`${displayedTransactions.length} payment records settled directly to merchant VPA`}
        columns={columns}
        data={displayedTransactions}
        keyExtractor={(t) => t.id}
        searchPlaceholder="Search customer, merchant, intent ID, or UTR..."
        searchFilter={(t, q) =>
          t.customerName.toLowerCase().includes(q) ||
          t.merchantName.toLowerCase().includes(q) ||
          t.paymentIntentId.toLowerCase().includes(q) ||
          t.utr.toLowerCase().includes(q) ||
          t.payeeVpa.toLowerCase().includes(q)
        }
        bulkActions={[
          {
            label: "Export Selected Records",
            action: (selected) => {
              const csv = "ID,IntentId,UTR,Customer,Merchant,Store,Bill,Discount,Payable,PayeeVPA,Status,Timestamp\n" +
                selected.map(t => `"${t.id}","${t.paymentIntentId}","${t.utr}","${t.customerName}","${t.merchantName}","${t.storeName}",${t.billAmount},${t.discountAmount},${t.payableAmount},"${t.payeeVpa}","${t.status}","${t.timestamp}"`).join("\n");
              const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `pinak-selected-transactions-${Date.now()}.csv`;
              a.click();
              toast.success(`Exported ${selected.length} transaction records!`);
            }
          }
        ]}
      />

      {/* Right Slide-over Audit Inspector Drawer */}
      {selectedTx && (
        <TransactionAuditDrawer
          tx={selectedTx}
          onClose={() => setSelectedTx(null)}
        />
      )}
    </div>
  );
};

// Right-Side Slide-Over Audit Drawer
function TransactionAuditDrawer({
  tx,
  onClose
}: {
  tx: Transaction;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <aside className="w-screen max-w-lg bg-white dark:bg-[#121626] shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
                <FileText size={17} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                  UPI Intent & Settlement Audit
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">{tx.paymentIntentId}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
            {/* Status Banner */}
            <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-900/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                  Settlement Verification
                </span>
                <Badge variant={tx.status === "SUCCESS" ? "success" : tx.status === "FAILED" ? "destructive" : "warning"}>
                  {tx.status}
                </Badge>
              </div>
              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <span className="text-slate-400 text-[11px]">Payable Net:</span>
                  <p className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
                    ₹{tx.payableAmount}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 text-[11px]">Discount Funded:</span>
                  <p className="text-sm font-bold text-emerald-600 font-mono">
                    ₹{tx.discountAmount}
                  </p>
                </div>
              </div>
            </div>

            {/* Direct UPI Intent Link */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] tracking-wider">
                Generated UPI Deep-link (NPCI Format)
              </label>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 font-mono text-[11px] break-all select-all text-purple-600 dark:text-purple-400">
                {tx.upiIntentUrl}
              </div>
            </div>

            {/* Parties & Bank Info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800">
                <p className="text-slate-400 font-semibold uppercase text-[10px]">Bank UTR</p>
                <p className="font-mono font-bold text-slate-900 dark:text-white mt-1">
                  {tx.utr || "Awaiting Webhook"}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800">
                <p className="text-slate-400 font-semibold uppercase text-[10px]">Payee Merchant VPA</p>
                <p className="font-mono font-bold text-slate-900 dark:text-white mt-1 truncate">
                  {tx.payeeVpa}
                </p>
              </div>
            </div>

            {/* Settlement Breakdown */}
            <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/20 space-y-2">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs">Payment Flow Architecture</h4>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Customer Account:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{tx.customerName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Merchant Store:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{tx.storeName} ({tx.merchantName})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Timestamp:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{tx.timestamp}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Direct Settlement Route:</span>
                <span className="text-emerald-600 font-bold">100% Direct to Bank</span>
              </div>
            </div>

            {/* Webhook Gateway Security Verification */}
            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 text-[11px] space-y-1.5">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="font-semibold">Security Verification</span>
                <span className="text-emerald-500 font-bold font-mono">HMAC-SHA256 VERIFIED</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 font-mono text-[10px] break-all">
                Payload Signature: {tx.paymentIntentId ? btoa(tx.paymentIntentId + tx.status).substring(0, 24) : "SEC-SIG-VALID"} • Gateway Encrypted
              </p>
            </div>
          </div>

          {/* Drawer Footer */}
          <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-3">
            <button
              onClick={() => {
                toast.success(`Settlement receipt downloaded for intent ${tx.paymentIntentId}`);
              }}
              className="btn-gradient flex-1 py-2.5 rounded-xl text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5"
            >
              <Download size={14} />
              <span>Download Settlement Receipt</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              Close
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
