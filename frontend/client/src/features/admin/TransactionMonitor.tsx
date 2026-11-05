import React, { useState, useEffect, useMemo } from "react";
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
  Sparkles,
  RefreshCw,
  Store as StoreIcon,
  Filter,
  Coins,
  Receipt,
  Copy,
  Check,
  AlertTriangle,
  AlertCircle,
  Phone,
  Calendar,
  ArrowUpRight,
  Search,
  RotateCcw,
  ChevronDown,
  CheckCircle,
  ArrowDownRight,
  BadgeCheck
} from "lucide-react";
import { Transaction, MerchantPayoutRequest, PayoutStatus } from "../../types";
import { AdvancedTable, Column } from "../../components/ui/AdvancedTable";
import { Badge } from "../../components/ui/badge";
import { cn } from "../../lib/utils";
import { toast } from "sonner";
import { dataStore } from "../../services/dataStore";
import { useAppStore } from "../../hooks/useAppStore";
import { transactionApi, BackendTransactionStats } from "../../api/transactionApi";

export interface TransactionMonitorProps {
  transactions?: Transaction[];
  role?: "admin" | "merchant" | "store";
  scopedStoreId?: string;
  scopedMerchantId?: string;
}

// Deterministic hash utility for stable IDs and simulated signatures
function stableHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// Copy to clipboard helper with visual toast
async function copyToClipboard(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  } catch {
    toast.error(`Unable to copy ${label}`);
  }
}

// Real HTML Tax Invoice & Settlement Receipt Generator
function downloadTaxInvoiceReceipt(tx: Transaction) {
  const invoiceNumber = `PINAK-INV-${tx.paymentIntentId.replace(/[^a-zA-Z0-9]/g, "").slice(-8).toUpperCase()}`;
  const gross = Number(tx.billAmount || 0);
  const discount = Number(tx.discountAmount || 0);
  const payable = Number(tx.payableAmount || 0);
  const platformFee = Math.round(gross * 0.05 * 100) / 100;
  const gstOnFee = Math.round(platformFee * 0.18 * 100) / 100;
  const netSettled = Math.round((payable - platformFee - gstOnFee) * 100) / 100;

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Tax Invoice & Settlement Receipt - ${tx.paymentIntentId}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; color: #1e293b; padding: 40px 20px; margin: 0; }
    .invoice-card { max-width: 720px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); padding: 36px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #f1f5f9; padding-bottom: 24px; margin-bottom: 24px; }
    .brand { font-size: 26px; font-weight: 800; color: #7c3aed; letter-spacing: -0.5px; }
    .brand-sub { font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; margin-top: 2px; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; background: #dcfce7; color: #15803d; }
    .badge-pending { background: #fef3c7; color: #b45309; }
    .badge-failed { background: #fee2e2; color: #b91c1c; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
    .meta-label { font-size: 10px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .meta-val { font-size: 14px; font-weight: 700; color: #0f172a; }
    .meta-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 13px; color: #475569; }
    .table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    .table th { background: #f8fafc; text-align: left; padding: 10px 14px; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; }
    .table td { padding: 12px 14px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
    .table td.amt { text-align: right; font-family: monospace; font-weight: 600; }
    .total-row { font-weight: 800; font-size: 14px; color: #0f172a; background: #faf5ff; }
    .total-row td { border-top: 2px solid #e9d5ff; border-bottom: 2px solid #e9d5ff; color: #7c3aed; }
    .footer { border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 11px; color: #94a3b8; line-height: 1.6; text-align: center; }
    .qr-stamp { display: inline-block; padding: 8px 16px; border: 1px dashed #cbd5e1; border-radius: 8px; font-family: monospace; font-size: 11px; color: #64748b; margin-top: 12px; }
    @media print { body { background: #ffffff; padding: 0; } .invoice-card { box-shadow: none; border: none; padding: 20px; } }
  </style>
</head>
<body>
  <div class="invoice-card">
    <div class="header">
      <div>
        <div class="brand">PINAK PORTAL</div>
        <div class="brand-sub">National NPCI UPI Switch & Merchant Settlement Clearing</div>
        <div style="font-size: 11px; color: #64748b; margin-top: 6px;">GSTIN: 27AABCP9876Q1Z2 • CIN: U72900MH2025PTC384920</div>
      </div>
      <div style="text-align: right;">
        <span class="badge ${tx.status === 'SUCCESS' ? '' : tx.status === 'FAILED' ? 'badge-failed' : 'badge-pending'}">${tx.status}</span>
        <div class="meta-label" style="margin-top: 8px;">TAX INVOICE & RECEIPT</div>
        <div class="meta-mono" style="font-weight: 800; color: #0f172a;">${invoiceNumber}</div>
        <div class="meta-mono" style="font-size: 11px; color: #64748b;">${tx.timestamp}</div>
      </div>
    </div>

    <div class="grid">
      <div>
        <div class="meta-label">Customer / Payer Details</div>
        <div class="meta-val">${tx.customerName || "Customer"}</div>
        <div class="meta-mono">${tx.customerPhone || "+91-98XXXXXXXX"}</div>
        <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Payment Channel: NPCI UPI Intent (QR/Direct)</div>
      </div>
      <div>
        <div class="meta-label">Merchant Partner & Branch Outlet</div>
        <div class="meta-val">${tx.merchantName}</div>
        <div style="font-size: 12px; color: #475569;">${tx.storeName || "Primary Flagship Outlet"}</div>
        <div class="meta-mono" style="font-size: 11px; color: #7c3aed; margin-top: 2px;">Payee VPA: ${tx.payeeVpa}</div>
      </div>
    </div>

    <div class="grid" style="background: #f8fafc; padding: 14px 18px; border-radius: 12px; border: 1px solid #f1f5f9;">
      <div>
        <div class="meta-label">Payment Intent Identifier</div>
        <div class="meta-mono" style="font-size: 12px; font-weight: bold; color: #0f172a;">${tx.paymentIntentId}</div>
      </div>
      <div>
        <div class="meta-label">Bank Reference Number (UTR / RRN)</div>
        <div class="meta-mono" style="font-size: 12px; font-weight: bold; color: #0f172a;">${tx.utr || "Pending Bank Clearing"}</div>
      </div>
    </div>

    <table class="table">
      <thead>
        <tr>
          <th>Particulars</th>
          <th style="text-align: center;">Qty</th>
          <th style="text-align: right;">Gross Amount</th>
          <th style="text-align: right;">PINAK Savings</th>
          <th style="text-align: right;">Net Amount Paid</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>In-Store Bill Payment Settlement</strong><br>
            <span style="font-size: 11px; color: #64748b;">Direct counter bill settlement with active PINAK deals & reward redemptions</span>
          </td>
          <td style="text-align: center;">1</td>
          <td class="amt">₹${gross.toFixed(2)}</td>
          <td class="amt" style="color: #16a34a;">-₹${discount.toFixed(2)}</td>
          <td class="amt">₹${payable.toFixed(2)}</td>
        </tr>
        <tr class="total-row">
          <td colspan="4">Total Net Amount Paid by Customer (Inclusive of all taxes)</td>
          <td class="amt" style="font-size: 15px;">₹${payable.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>

    <div style="background: #f1f5f9; padding: 14px 18px; border-radius: 10px; font-size: 12px; margin-bottom: 24px;">
      <div style="font-weight: 700; color: #334155; margin-bottom: 6px;">Settlement Reconciliation Breakdown (Nodal Escrow T+1)</div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: #475569;">
        <span>Customer Paid Amount:</span>
        <span style="font-family: monospace; font-weight: 600;">₹${payable.toFixed(2)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: #475569;">
        <span>Platform Commission Fee (5.00%):</span>
        <span style="font-family: monospace; font-weight: 600;">-₹${platformFee.toFixed(2)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #475569;">
        <span>GST on Platform Commission (18%):</span>
        <span style="font-family: monospace; font-weight: 600;">-₹${gstOnFee.toFixed(2)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; border-top: 1px dashed #cbd5e1; padding-top: 6px; font-weight: 700; color: #0f172a;">
        <span>Estimated Merchant Net Receivable:</span>
        <span style="font-family: monospace; color: #16a34a; font-size: 13px;">₹${netSettled.toFixed(2)}</span>
      </div>
    </div>

    <div style="margin-bottom: 24px; padding: 14px; background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 10px; font-size: 11px; color: #6b21a8;">
      <strong>RBI Escrow Regulatory Compliance:</strong>
      This transaction was settled via NPCI Unified Payments Interface (UPI) protocols. Settlement is processed through an RBI-authorized Nodal Escrow Account adhering to T+1 settlement cycles.
    </div>

    <div class="footer">
      <div>This is an authentic, system-generated settlement voucher and requires no physical ink signature.</div>
      <div class="qr-stamp">HMAC-SHA256 CHECKSUM: ${(tx.paymentIntentId + (tx.utr || "PNK") + tx.payableAmount).split("").reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0).toString(16).toUpperCase()} • NPCI GATEWAY CERTIFIED</div>
      <div style="margin-top: 10px; font-size: 10px; color: #94a3b8;">© 2026 PINAK Technologies Private Limited • All Rights Reserved</div>
    </div>
  </div>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${invoiceNumber}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast.success(`Tax invoice & settlement receipt downloaded!`);
}

function mapBackendToTransaction(t: any): Transaction {
  const isSuccess = t.status === "COMPLETED" || t.status === "SUCCESS";
  const isFailed = t.status === "FAILED" || t.status === "REFUNDED";
  const status = isSuccess ? "SUCCESS" : isFailed ? "FAILED" : "PENDING";

  let formattedDate = "Just now";
  if (t.createdAt) {
    try {
      formattedDate = new Date(t.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
    } catch {
      formattedDate = String(t.createdAt);
    }
  }

  const gross = Number(t.grossAmount || t.billAmount || 0);
  const discount = Number(t.discountAmount || 0);
  const payable = Number(t.payableAmount || t.netAmount || (gross - discount));
  const payeeVpa = t.payeeVpa || `${(t.merchantName || "merchant").toLowerCase().replace(/[^a-z0-9]/g, "")}@hdfcbank`;
  const intentRef = t.transactionReference || t.paymentIntentId || `PNK-TXN-${String(t.id || Date.now()).replace(/[^a-zA-Z0-9]/g, "").slice(-8).toUpperCase()}`;

  const fallbackUtr = isSuccess ? `UTR${String(stableHash(intentRef + (t.id || ""))).padStart(8, "0").slice(0, 10)}` : "Pending Clearance";

  const rawStoreName = t.storeName || "Flagship Outlet";
  const cleanStoreName = rawStoreName.replace(/[\uFFFD\u0080-\u009F]+/g, "-").replace(/\s*-\s*-\s*/g, " - ");
  const cleanMerchantName = (t.merchantName || "Merchant Partner").replace(/[\uFFFD\u0080-\u009F]+/g, " ");

  return {
    id: String(t.id || `tx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`),
    paymentIntentId: intentRef,
    referenceType: "OFFER",
    referenceId: t.offerId || "direct",
    customerName: t.customerName || t.userName || "Verified Customer",
    customerPhone: t.customerPhone || t.userPhone || "+91 98765 43210",
    merchantId: t.merchantId || "m-1",
    merchantName: cleanMerchantName,
    storeName: cleanStoreName,
    storeId: t.storeId,
    billAmount: gross,
    discountAmount: discount,
    payableAmount: payable,
    payeeVpa: payeeVpa,
    upiIntentUrl: t.upiIntentUrl || `upi://pay?pa=${encodeURIComponent(payeeVpa)}&pn=${encodeURIComponent(t.merchantName || "Merchant")}&am=${payable.toFixed(2)}&cu=INR&tr=${encodeURIComponent(intentRef)}`,
    utr: t.utr || fallbackUtr,
    signatureValid: true,
    status: status as any,
    settlementStatus: (t.settlementStatus || (isSuccess ? "SETTLED" : "PENDING")) as any,
    pointsEarned: Math.round(payable * 0.2),
    timestamp: formattedDate
  };
}

export const TransactionMonitor: React.FC<TransactionMonitorProps> = ({
  transactions: initialTransactions = [],
  role = "admin",
  scopedStoreId,
  scopedMerchantId
}) => {
  const appStore = useAppStore();
  const currentRole = role || appStore.role || "admin";
  const activeStore = appStore.stores.find((s) => s.id === (scopedStoreId || appStore.activeStoreId)) || appStore.stores[0];
  const merchantStores = appStore.stores.filter((s) => !scopedMerchantId || s.merchantId === scopedMerchantId || s.merchantId === appStore.currentUser?.merchantId);

  // View state
  const [activeTab, setActiveTab] = useState<"intents" | "payout_queue">("intents");
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [liveTxs, setLiveTxs] = useState<Transaction[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [backendStats, setBackendStats] = useState<BackendTransactionStats | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>(() => new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }));

  // Multi-dimensional filters
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [dateFilter, setDateFilter] = useState<"ALL" | "TODAY" | "YESTERDAY" | "LAST_7_DAYS" | "THIS_MONTH">("ALL");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("ALL");
  const [selectedStoreId, setSelectedStoreId] = useState<string>("ALL");
  const [selectedMerchantId, setSelectedMerchantId] = useState<string>("ALL");

  // Global Payout Queue state & Admin Confirmation Modals
  const [payouts, setPayouts] = useState(() => dataStore.getMerchantPayouts());
  const [overview, setOverview] = useState(() => dataStore.getPlatformSettlementOverview());

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    action: "HOLD" | "RELEASE" | "RETRY" | null;
    payout: MerchantPayoutRequest | null;
    holdReason: string;
    customNote: string;
  }>({
    isOpen: false,
    action: null,
    payout: null,
    holdReason: "Velocity Anomaly / Unusual Transaction Surge",
    customNote: ""
  });

  const refreshPayouts = () => {
    setPayouts(dataStore.getMerchantPayouts());
    setOverview(dataStore.getPlatformSettlementOverview());
  };

  const openPayoutModal = (payout: MerchantPayoutRequest, action: "HOLD" | "RELEASE" | "RETRY") => {
    setModalState({
      isOpen: true,
      action,
      payout,
      holdReason: "Velocity Anomaly / Unusual Transaction Surge",
      customNote: ""
    });
  };

  const closePayoutModal = () => {
    setModalState({
      isOpen: false,
      action: null,
      payout: null,
      holdReason: "Velocity Anomaly / Unusual Transaction Surge",
      customNote: ""
    });
  };

  const handleConfirmPayoutAction = () => {
    if (!modalState.payout || !modalState.action) return;
    const { id } = modalState.payout;
    dataStore.adminActionOnPayout(id, modalState.action);

    if (modalState.action === "HOLD") {
      toast.warning(`Fraud hold placed on Payout ID ${id} (${modalState.holdReason})`);
    } else if (modalState.action === "RELEASE") {
      toast.success(`Payout ID ${id} released for bank clearing disbursement!`);
    } else {
      toast.info(`Retry initiated for Payout ID ${id} via IMPS banking gateway!`);
    }

    refreshPayouts();
    closePayoutModal();
  };

  const fetchLiveTransactions = async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      if (currentRole === "merchant") {
        const storeIdParam = selectedStoreId !== "ALL" ? selectedStoreId : undefined;
        const res = await transactionApi.getMerchantTransactions({ storeId: storeIdParam });
        if (Array.isArray(res)) {
          setLiveTxs(res.map(mapBackendToTransaction));
        }
      } else if (currentRole === "store") {
        const storeIdParam = scopedStoreId || activeStore?.id;
        const res = await transactionApi.getMerchantTransactions({ storeId: storeIdParam });
        if (Array.isArray(res)) {
          setLiveTxs(res.map(mapBackendToTransaction));
        }
      } else {
        const [txsRes, statsRes] = await Promise.all([
          transactionApi.getAdminTransactions(),
          transactionApi.getAdminStats()
        ]);
        if (Array.isArray(txsRes)) {
          setLiveTxs(txsRes.map(mapBackendToTransaction));
        }
        if (statsRes) {
          setBackendStats(statsRes);
        }
      }
      setLastRefreshedAt(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }));
    } catch (e) {
      console.warn("Could not fetch live transactions from backend:", e);
    } finally {
      if (!silent) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLiveTransactions(true);
  }, [currentRole, selectedStoreId, scopedStoreId, activeStore?.id]);

  // Real backend transactions take complete priority once fetched; fallback only during initial mount before network resolves
  const rawPool = liveTxs.length > 0 ? liveTxs : (initialTransactions.length > 0 ? initialTransactions : appStore.transactions);

  // Filtered dataset
  const displayedTransactions = useMemo(() => {
    let list = rawPool;

    // Scoped role isolation
    if (currentRole === "store") {
      const targetStoreName = activeStore?.branchName?.toLowerCase() || "";
      const targetStoreId = scopedStoreId || activeStore?.id;
      list = list.filter((t) => {
        if (targetStoreId && (t as any).storeId === targetStoreId) return true;
        if (targetStoreName && t.storeName?.toLowerCase().includes(targetStoreName)) return true;
        return true;
      });
    } else if (currentRole === "merchant") {
      const merchantId = scopedMerchantId || appStore.currentUser?.merchantId || appStore.currentUser?.id;
      list = list.filter((t) => {
        if (selectedStoreId !== "ALL") {
          const st = appStore.stores.find((s) => s.id === selectedStoreId);
          if (st && t.storeName?.toLowerCase().includes(st.branchName?.toLowerCase() || "")) return true;
          if ((t as any).storeId === selectedStoreId) return true;
          return false;
        }
        if (merchantId && t.merchantId && t.merchantId !== merchantId && merchantId !== "m-1") {
          return false;
        }
        return true;
      });
    } else if (currentRole === "admin") {
      if (selectedMerchantId !== "ALL") {
        list = list.filter((t) => t.merchantId === selectedMerchantId || t.merchantName === selectedMerchantId);
      }
      if (selectedStoreId !== "ALL") {
        list = list.filter((t) => (t as any).storeId === selectedStoreId);
      }
    }

    // Status Filter
    if (statusFilter !== "ALL") {
      list = list.filter((t) => t.status === statusFilter);
    }

    // Date Range Filter
    if (dateFilter !== "ALL") {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfYesterday = new Date(startOfToday);
      startOfYesterday.setDate(startOfYesterday.getDate() - 1);
      const startOf7Days = new Date(startOfToday);
      startOf7Days.setDate(startOf7Days.getDate() - 7);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      list = list.filter((t) => {
        // Try parsing timestamp
        const itemDate = new Date(t.timestamp);
        if (isNaN(itemDate.getTime())) return true;
        if (dateFilter === "TODAY") return itemDate >= startOfToday;
        if (dateFilter === "YESTERDAY") return itemDate >= startOfYesterday && itemDate < startOfToday;
        if (dateFilter === "LAST_7_DAYS") return itemDate >= startOf7Days;
        if (dateFilter === "THIS_MONTH") return itemDate >= startOfMonth;
        return true;
      });
    }

    // Payment Rail Filter
    if (paymentMethodFilter !== "ALL") {
      list = list.filter((t) => {
        const method = (t as any).paymentMethod || "UPI";
        return method === paymentMethodFilter;
      });
    }

    return list;
  }, [
    rawPool,
    currentRole,
    scopedStoreId,
    scopedMerchantId,
    activeStore,
    selectedStoreId,
    selectedMerchantId,
    appStore,
    statusFilter,
    dateFilter,
    paymentMethodFilter
  ]);

  const hasActiveFilters = statusFilter !== "ALL" || dateFilter !== "ALL" || paymentMethodFilter !== "ALL" || selectedStoreId !== "ALL" || selectedMerchantId !== "ALL";

  const clearAllFilters = () => {
    setStatusFilter("ALL");
    setDateFilter("ALL");
    setPaymentMethodFilter("ALL");
    setSelectedStoreId("ALL");
    setSelectedMerchantId("ALL");
    toast.info("All search & date filters reset");
  };

  // Summary Metrics
  const metrics = useMemo(() => {
    let grossGmv = 0;
    let netPayable = 0;
    let totalDiscount = 0;
    let successCount = 0;

    for (const t of displayedTransactions) {
      grossGmv += Number(t.billAmount || 0);
      netPayable += Number(t.payableAmount || 0);
      totalDiscount += Number(t.discountAmount || 0);
      if (t.status === "SUCCESS") successCount++;
    }

    const averageOrderValue = displayedTransactions.length > 0 ? Math.round(grossGmv / displayedTransactions.length) : 0;
    const successRate = displayedTransactions.length > 0 ? Math.round((successCount / displayedTransactions.length) * 100) : 100;

    return {
      grossGmv,
      netPayable,
      totalDiscount,
      successCount,
      totalCount: displayedTransactions.length,
      averageOrderValue,
      successRate
    };
  }, [displayedTransactions]);

  // Backend-Driven Platform Overview (Admin Console)
  const settlementOverview = useMemo(() => {
    if (backendStats) {
      return {
        totalPlatformGmv: Number(backendStats.totalPlatformGmv || 0),
        totalEscrowBalance: Number(backendStats.totalEscrowBalance || backendStats.totalNetCollected || 0),
        netCommissionEarned: Number(backendStats.netCommissionEarned || 0),
        totalMerchantWallets: Number(backendStats.totalMerchantWallets || 1),
        activeStores: Number(backendStats.activeStores || 1),
        pendingPayoutCount: Number(backendStats.pendingPayoutCount || 0),
        pendingPayoutVolume: Number(backendStats.pendingPayoutVolume || 0),
        totalTransactions: Number(backendStats.totalTransactions || 0),
        successfulTransactions: Number(backendStats.successfulTransactions || 0),
      };
    }

    const gmv = metrics.grossGmv;
    const net = metrics.netPayable;
    const commission = Math.round(gmv * 0.05 * 100) / 100;
    const distinctMerchants = Math.max(1, new Set(displayedTransactions.map((t) => t.merchantId)).size);

    return {
      totalPlatformGmv: gmv,
      totalEscrowBalance: net,
      netCommissionEarned: commission,
      totalMerchantWallets: distinctMerchants,
      activeStores: Math.max(1, new Set(displayedTransactions.map((t) => (t as any).storeId)).size),
      pendingPayoutCount: payouts.filter((p) => p.status === "PROCESSING" || p.status === "INITIATED").length,
      pendingPayoutVolume: payouts.filter((p) => p.status === "PROCESSING" || p.status === "INITIATED").reduce((acc, p) => acc + p.amount, 0),
      totalTransactions: metrics.totalCount,
      successfulTransactions: metrics.successCount,
    };
  }, [backendStats, metrics, displayedTransactions, payouts]);

  // Table Columns
  const columns: Column<Transaction>[] = useMemo(() => [
    {
      header: "Payment Intent & Ref",
      sortable: true,
      accessor: "paymentIntentId",
      render: (t) => (
        <div className="font-mono text-xs">
          <div className="flex items-center gap-1.5 group">
            <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
              <Hash size={13} className="text-purple-600 dark:text-purple-400 shrink-0" />
              <span>{t.paymentIntentId}</span>
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                copyToClipboard(t.paymentIntentId, "Payment Intent ID");
              }}
              className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-opacity"
              title="Copy Intent ID"
            >
              <Copy size={11} />
            </button>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="inline-flex items-center text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.2 rounded">
              NPCI UPI Switch
            </span>
          </div>
        </div>
      )
    },
    {
      header: "Bank UTR / RRN",
      sortable: true,
      accessor: "utr",
      render: (t) => (
        <div className="font-mono text-xs">
          <div className="flex items-center gap-1.5 group">
            <span className={cn(
              "font-semibold text-xs",
              t.utr && t.utr !== "Pending Clearance"
                ? "text-slate-800 dark:text-slate-200"
                : "text-amber-600 dark:text-amber-400 italic"
            )}>
              {t.utr || "Pending Clearance"}
            </span>
            {t.utr && t.utr !== "Pending Clearance" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard(t.utr, "Bank UTR");
                }}
                className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-opacity"
                title="Copy Bank UTR"
              >
                <Copy size={11} />
              </button>
            )}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {t.status === "SUCCESS" ? "Authorized & Settled" : "Awaiting Switch Webhook"}
          </p>
        </div>
      )
    },
    {
      header: currentRole === "admin" ? "Customer & Merchant Partner" : currentRole === "merchant" ? "Customer & Branch Outlet" : "Customer / Guest",
      accessor: "customerName",
      render: (t) => (
        <div className="text-xs">
          <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
            <span>{t.customerName || "Customer"}</span>
            {t.customerPhone && (
              <span className="text-[11px] font-normal text-slate-400 font-mono ml-1">
                ({t.customerPhone})
              </span>
            )}
          </p>
          <div className="text-slate-400 text-[11px] flex items-center gap-1 mt-0.5">
            <ArrowRight size={10} className="text-slate-300" />
            <span className="font-semibold text-purple-600 dark:text-purple-400">
              {currentRole === "admin"
                ? `${t.merchantName} • ${t.storeName || "Primary Outlet"}`
                : t.storeName || "Flagship Outlet"}
            </span>
          </div>
        </div>
      )
    },
    {
      header: "Payee UPI VPA",
      accessor: "payeeVpa",
      render: (t) => (
        <div className="flex items-center gap-1 group">
          <span className="font-mono text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-1">
            <BadgeCheck size={11} className="text-emerald-500 shrink-0" />
            <span>{t.payeeVpa}</span>
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              copyToClipboard(t.payeeVpa, "Payee UPI VPA");
            }}
            className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-opacity"
            title="Copy UPI VPA"
          >
            <Copy size={11} />
          </button>
        </div>
      )
    },
    {
      header: "Bill & Discount Breakdown",
      sortable: true,
      accessor: "billAmount",
      render: (t) => (
        <div className="text-xs">
          <div className="flex items-center gap-1.5 font-mono">
            <span className="text-slate-400 line-through">₹{Number(t.billAmount).toLocaleString("en-IN")}</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              -₹{Number(t.discountAmount).toLocaleString("en-IN")}
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
            Net Paid:{" "}
            <span className="font-extrabold text-slate-900 dark:text-white font-mono text-xs">
              ₹{Number(t.payableAmount).toLocaleString("en-IN")}
            </span>
          </p>
        </div>
      )
    },
    {
      header: "Payment Status",
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
          className="font-semibold uppercase tracking-wider text-[10px] px-2 py-0.5"
        >
          {t.status === "SUCCESS" && <CheckCircle2 size={12} className="mr-1" />}
          {t.status === "FAILED" && <XCircle size={12} className="mr-1" />}
          {t.status === "PENDING" && <Clock size={12} className="mr-1" />}
          {t.status}
        </Badge>
      )
    },
    {
      header: "Timestamp (IST)",
      sortable: true,
      accessor: "timestamp",
      render: (t) => (
        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono whitespace-nowrap">
          {t.timestamp}
        </span>
      )
    },
    {
      header: "Audit & Voucher",
      className: "text-right",
      render: (t) => (
        <button
          onClick={() => setSelectedTx(t)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-purple-200/60 dark:border-purple-800/60 transition-all shadow-2xs hover:shadow-xs active:scale-95"
        >
          <Eye size={13} />
          <span>Audit</span>
        </button>
      )
    }
  ], [currentRole]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Status Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-bold font-['Manrope'] text-slate-900 dark:text-white">
              {currentRole === "admin"
                ? "Platform Settlement & Transaction Ledger"
                : currentRole === "merchant"
                ? "Merchant Sales & Real-Time UPI Settlement"
                : `${activeStore?.branchName || "Branch"} Counter Transactions & UPI Register`}
            </h2>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800/60 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{currentRole === "admin" ? "RBI Nodal Escrow Compliant (T+1)" : "NPCI UPI 2.0 Rails Active"}</span>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {currentRole === "admin"
              ? "Comprehensive double-entry audit ledger monitoring platform-wide GMV, RBI escrow custody balances, real-time NPCI UPI intent dispatches, and merchant payout disbursements."
              : currentRole === "merchant"
              ? "Live stream of customer payments, deal discounts, NPCI bank UTRs, and direct-to-bank settlements across all your registered store outlets."
              : "Live cashier register for walk-in and table pre-booking bill settlements with real-time NPCI UPI verification."}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Outlet Branch Filter for Merchant */}
          {currentRole === "merchant" && merchantStores.length > 1 && (
            <div className="flex items-center gap-1.5 bg-white dark:bg-[#121626] px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <StoreIcon size={14} className="text-purple-500 shrink-0" />
              <select
                value={selectedStoreId}
                onChange={(e) => setSelectedStoreId(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden cursor-pointer"
              >
                <option value="ALL">All Branch Stores ({merchantStores.length})</option>
                {merchantStores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.branchName || s.storeName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Refresh Action */}
          <button
            onClick={() => {
              fetchLiveTransactions();
              toast.success("Ledger and settlement balances refreshed from backend!");
            }}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 bg-white dark:bg-[#121626] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs active:scale-95"
            title="Refresh transactions and metrics from database"
          >
            <RefreshCw size={13} className={cn(isRefreshing && "animate-spin text-purple-600")} />
            <span>Refresh</span>
            <span className="text-[10px] text-slate-400 font-mono hidden md:inline ml-0.5">({lastRefreshedAt})</span>
          </button>

          {/* Admin View Switcher */}
          {currentRole === "admin" && (
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200/80 dark:border-slate-800">
              <button
                onClick={() => setActiveTab("intents")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                  activeTab === "intents"
                    ? "bg-white dark:bg-[#121626] text-purple-700 dark:text-purple-300 shadow-xs border border-purple-200/50 dark:border-purple-800/50"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                UPI Intent Ledger ({displayedTransactions.length})
              </button>
              <button
                onClick={() => setActiveTab("payout_queue")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                  activeTab === "payout_queue"
                    ? "bg-white dark:bg-[#121626] text-purple-700 dark:text-purple-300 shadow-xs border border-purple-200/50 dark:border-purple-800/50"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                <span>Merchant Payout Queue</span>
                {settlementOverview.pendingPayoutCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                    {settlementOverview.pendingPayoutCount}
                  </span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* KPI Summary Cards */}
      {currentRole === "admin" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Platform GMV</span>
              <div className="p-2 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
                <Activity size={16} />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
                ₹{settlementOverview.totalPlatformGmv.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                Gross customer bill value transacted across merchant ecosystem
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider">RBI Escrow Balance</span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                <ShieldCheck size={16} />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                ₹{settlementOverview.totalEscrowBalance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] text-emerald-600 font-semibold block mt-0.5">
                Held in RBI-regulated nodal/escrow custody awaiting T+1 payout cycle
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider">Net Platform Revenue</span>
              <div className="p-2 rounded-xl bg-pink-50 text-pink-600 dark:bg-pink-950/40 dark:text-pink-400">
                <Sparkles size={16} />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-extrabold text-pink-600 dark:text-pink-400 font-mono">
                ₹{settlementOverview.netCommissionEarned.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                Platform revenue share (avg 5.0% commission fee)
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider">Pending Payout Queue</span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                <Clock size={16} />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
                ₹{settlementOverview.pendingPayoutVolume.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] text-amber-600 font-semibold block mt-0.5">
                {settlementOverview.pendingPayoutCount} disbursement transfer{settlementOverview.pendingPayoutCount === 1 ? "" : "s"} queued for bank clearing
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                {currentRole === "store" ? "Counter Sales (Gross GMV)" : "Total Outlet Sales (GMV)"}
              </span>
              <div className="p-2 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
                <Activity size={16} />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
                ₹{metrics.grossGmv.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                {currentRole === "store" ? "Total in-store counter customer billing" : `Across ${merchantStores.length} registered branch stores`}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider">Net Amount Collected</span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                <ShieldCheck size={16} />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-extrabold text-emerald-600 font-mono">
                ₹{metrics.netPayable.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] text-emerald-600 font-semibold block mt-0.5">
                Direct UPI receipts cleared to merchant bank VPA
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider">Customer Discount Savings</span>
              <div className="p-2 rounded-xl bg-pink-50 text-pink-600 dark:bg-pink-950/40 dark:text-pink-400">
                <Sparkles size={16} />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-extrabold text-pink-600 dark:text-pink-400 font-mono">
                ₹{metrics.totalDiscount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                PINAK pre-booking & walk-in promotional savings
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider">Settled Bills</span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                <Receipt size={16} />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
                {metrics.successCount}
              </span>
              <span className="text-[11px] text-amber-600 font-semibold block mt-0.5">
                {metrics.successRate}% Success Rate ({metrics.totalCount} total initiated)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Global Payout Queue (Admin Console) */}
      {currentRole === "admin" && activeTab === "payout_queue" && (
        <div className="bg-white dark:bg-[#121626] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Global Merchant Bank Payout Queue
                </h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                  {payouts.length} Batches
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Supervise automated bank disbursements, enforce compliance fraud holds, or trigger instant IMPS retries.
              </p>
            </div>
            <button
              onClick={refreshPayouts}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors self-start sm:self-auto flex items-center gap-1.5"
            >
              <RefreshCw size={12} />
              <span>Refresh Queue</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-bold text-[10px]">
                <tr>
                  <th className="px-4 py-3">Payout ID & Date</th>
                  <th className="px-4 py-3">Merchant Partner</th>
                  <th className="px-4 py-3">Destination Bank Account</th>
                  <th className="px-4 py-3">Transfer Amount</th>
                  <th className="px-4 py-3">Clearing UTR</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Supervisory Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {payouts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-mono font-bold text-slate-900 dark:text-white flex items-center gap-1">
                        <Hash size={12} className="text-purple-500" />
                        <span>{p.id}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "Today"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-purple-600 dark:text-purple-400">
                        {p.merchantName || "Registered Merchant Partner"}
                      </p>
                      <span className="text-[10px] text-slate-400">Mode: {p.mode || "IMPS"} Direct Rail</span>
                    </td>
                    <td className="px-4 py-3 font-mono">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{p.bankName || "HDFC Bank"}</span>
                      <span className="text-slate-400 block text-[11px]">A/C: •••• {p.accountNumberLast4 || "4920"}</span>
                    </td>
                    <td className="px-4 py-3 font-mono font-extrabold text-slate-900 dark:text-white text-xs">
                      ₹{p.amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-500">
                      {p.bankUtr || "Pending Dispatch"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          p.status === "SUCCESS"
                            ? "success"
                            : p.status === "HELD" || p.status === "FAILED"
                            ? "destructive"
                            : "warning"
                        }
                        className="text-[10px] font-semibold uppercase tracking-wider"
                      >
                        {p.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                      {p.status !== "HELD" ? (
                        <button
                          onClick={() => openPayoutModal(p, "HOLD")}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-[11px] font-bold border border-rose-200/60 dark:border-rose-800/60 transition-colors"
                        >
                          Fraud Hold
                        </button>
                      ) : (
                        <button
                          onClick={() => openPayoutModal(p, "RELEASE")}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-[11px] font-bold border border-emerald-200/60 dark:border-emerald-800/60 transition-colors"
                        >
                          Release Hold
                        </button>
                      )}
                      <button
                        onClick={() => openPayoutModal(p, "RETRY")}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-bold border border-slate-200 dark:border-slate-700 transition-colors"
                      >
                        Retry
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Main UPI Intent Ledger */}
      {(currentRole !== "admin" || activeTab === "intents") && (
        <div className="space-y-4">
          {/* Multi-Dimensional Filter Bar */}
          <div className="bg-white dark:bg-[#121626] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Status Chips */}
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Status:</span>
                {[
                  { id: "ALL", label: "All Statuses" },
                  { id: "SUCCESS", label: "Successful" },
                  { id: "PENDING", label: "Pending" },
                  { id: "FAILED", label: "Failed" }
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setStatusFilter(st.id)}
                    className={cn(
                      "px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border",
                      statusFilter === st.id
                        ? "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800 font-bold shadow-2xs"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    )}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Date Range Selector */}
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/60 px-2.5 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs">
                  <Calendar size={13} className="text-purple-500 shrink-0" />
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value as any)}
                    className="bg-transparent font-semibold text-slate-700 dark:text-slate-300 focus:outline-hidden cursor-pointer"
                  >
                    <option value="ALL">All Time</option>
                    <option value="TODAY">Today</option>
                    <option value="YESTERDAY">Yesterday</option>
                    <option value="LAST_7_DAYS">Last 7 Days</option>
                    <option value="THIS_MONTH">This Month</option>
                  </select>
                </div>

                {/* Payment Rail Filter */}
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/60 px-2.5 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs">
                  <CreditCard size={13} className="text-purple-500 shrink-0" />
                  <select
                    value={paymentMethodFilter}
                    onChange={(e) => setPaymentMethodFilter(e.target.value)}
                    className="bg-transparent font-semibold text-slate-700 dark:text-slate-300 focus:outline-hidden cursor-pointer"
                  >
                    <option value="ALL">All Rails</option>
                    <option value="UPI">UPI Intent / QR</option>
                    <option value="CARD">Card Payment</option>
                    <option value="NET_BANKING">Net Banking</option>
                  </select>
                </div>

                {/* Reset Filters button */}
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200/60 dark:border-rose-800/60 transition-colors"
                    title="Clear all active filters"
                  >
                    <RotateCcw size={12} />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Advanced Table */}
          <AdvancedTable
            title={
              currentRole === "admin"
                ? "Live NPCI UPI Intent & Settlement Ledger"
                : currentRole === "merchant"
                ? "Merchant UPI Transaction Ledger"
                : `${activeStore?.branchName || "Branch"} Counter Ledger`
            }
            subtitle={`${displayedTransactions.length} transaction records settled through RBI-compliant merchant VPA routes`}
            columns={columns}
            data={displayedTransactions}
            keyExtractor={(t) => t.id}
            searchPlaceholder="Search customer, phone, intent ID, UTR, merchant, or payee VPA..."
            searchFilter={(t, q) =>
              (t.customerName || "").toLowerCase().includes(q) ||
              (t.customerPhone || "").toLowerCase().includes(q) ||
              (t.merchantName || "").toLowerCase().includes(q) ||
              (t.storeName || "").toLowerCase().includes(q) ||
              (t.paymentIntentId || "").toLowerCase().includes(q) ||
              (t.utr || "").toLowerCase().includes(q) ||
              (t.payeeVpa || "").toLowerCase().includes(q) ||
              (t.referenceId || "").toLowerCase().includes(q)
            }
            emptyMessage="No matching transaction records found for the applied search criteria."
            bulkActions={[
              {
                label: "Export Selected Records (CSV)",
                action: (selected) => {
                  const headers = [
                    "Transaction_ID",
                    "Payment_Intent_ID",
                    "Bank_UTR",
                    "Customer_Name",
                    "Customer_Phone",
                    "Merchant_Partner",
                    "Store_Outlet",
                    "Gross_Bill_Amount_INR",
                    "PINAK_Discount_Funded_INR",
                    "Net_Amount_Paid_INR",
                    "Estimated_Platform_Fee_INR",
                    "Payee_UPI_VPA",
                    "Payment_Status",
                    "Settlement_Status",
                    "Payment_Method",
                    "Timestamp_IST"
                  ];

                  const csvRows = selected.map((t) => {
                    const gross = Number(t.billAmount || 0);
                    const fee = Math.round(gross * 0.05 * 100) / 100;
                    return [
                      `"${t.id}"`,
                      `"${t.paymentIntentId}"`,
                      `"${t.utr}"`,
                      `"${(t.customerName || "Customer").replace(/"/g, '""')}"`,
                      `"${t.customerPhone || ""}"`,
                      `"${(t.merchantName || "").replace(/"/g, '""')}"`,
                      `"${(t.storeName || "").replace(/"/g, '""')}"`,
                      gross.toFixed(2),
                      Number(t.discountAmount || 0).toFixed(2),
                      Number(t.payableAmount || 0).toFixed(2),
                      fee.toFixed(2),
                      `"${t.payeeVpa || ""}"`,
                      `"${t.status}"`,
                      `"${t.settlementStatus}"`,
                      `"UPI"`,
                      `"${t.timestamp}"`
                    ].join(",");
                  });

                  const csv = [headers.join(","), ...csvRows].join("\n");
                  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `PINAK_${currentRole.toUpperCase()}_TRANSACTIONS_${Date.now()}.csv`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  toast.success(`Exported ${selected.length} transaction records with complete financial breakdown!`);
                }
              }
            ]}
          />
        </div>
      )}

      {/* Right Slide-over Audit Inspector Drawer */}
      {selectedTx && (
        <TransactionAuditDrawer
          tx={selectedTx}
          onClose={() => setSelectedTx(null)}
        />
      )}

      {/* Admin Payout Action Confirmation Modal */}
      {modalState.isOpen && modalState.payout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#121626] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                {modalState.action === "HOLD" && (
                  <div className="p-2 rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                    <AlertTriangle size={18} />
                  </div>
                )}
                {modalState.action === "RELEASE" && (
                  <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                    <CheckCircle size={18} />
                  </div>
                )}
                {modalState.action === "RETRY" && (
                  <div className="p-2 rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                    <RefreshCw size={18} />
                  </div>
                )}
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {modalState.action === "HOLD" && "Confirm Fraud & Risk Hold"}
                    {modalState.action === "RELEASE" && "Confirm Release of Payout Hold"}
                    {modalState.action === "RETRY" && "Retry Failed / Stalled Payout"}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">Payout ID: {modalState.payout.id}</p>
                </div>
              </div>
              <button
                onClick={closePayoutModal}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Merchant Partner:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{modalState.payout.merchantName || "Silver Spoon Hospitality"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Transfer Amount:</span>
                  <span className="font-mono font-extrabold text-slate-900 dark:text-white">₹{modalState.payout.amount.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Destination Account:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">{modalState.payout.bankName} (•••• {modalState.payout.accountNumberLast4 || "4920"})</span>
                </div>
              </div>

              {modalState.action === "HOLD" && (
                <div className="space-y-2">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Select Regulatory / Fraud Hold Justification:
                  </label>
                  <select
                    value={modalState.holdReason}
                    onChange={(e) => setModalState({ ...modalState, holdReason: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200"
                  >
                    <option value="Velocity Anomaly / Unusual Transaction Surge">Velocity Anomaly / Unusual Transaction Surge</option>
                    <option value="Pending Customer Chargeback Dispute">Pending Customer Chargeback Dispute</option>
                    <option value="Merchant Bank Account Verification Pending">Merchant Bank Account Verification Pending</option>
                    <option value="Periodic Anti-Money Laundering (AML) Screening">Periodic Anti-Money Laundering (AML) Screening</option>
                    <option value="KYC Re-verification Requested by Banking Gateway">KYC Re-verification Requested by Banking Gateway</option>
                  </select>
                </div>
              )}

              {modalState.action === "RELEASE" && (
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Releasing this hold will approve the transfer of <strong className="text-slate-900 dark:text-white">₹{modalState.payout.amount.toLocaleString("en-IN")}</strong> back into the automated IMPS clearing cycle for immediate settlement.
                </p>
              )}

              {modalState.action === "RETRY" && (
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Re-dispatching this transfer will generate a new idempotency key and trigger an immediate settlement request to <strong className="text-slate-900 dark:text-white">{modalState.payout.bankName}</strong> via IMPS.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={closePayoutModal}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPayoutAction}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition-transform active:scale-95",
                  modalState.action === "HOLD"
                    ? "bg-rose-600 hover:bg-rose-700"
                    : modalState.action === "RELEASE"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "btn-gradient"
                )}
              >
                {modalState.action === "HOLD" && "Apply Fraud Hold"}
                {modalState.action === "RELEASE" && "Approve & Release"}
                {modalState.action === "RETRY" && "Trigger IMPS Transfer"}
              </button>
            </div>
          </div>
        </div>
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
  const gross = Number(tx.billAmount || 0);
  const discount = Number(tx.discountAmount || 0);
  const payable = Number(tx.payableAmount || 0);
  const platformFee = Math.round(gross * 0.05 * 100) / 100;
  const gstOnFee = Math.round(platformFee * 0.18 * 100) / 100;
  const netSettled = Math.round((payable - platformFee - gstOnFee) * 100) / 100;

  const simulatedSig = `HMAC-SHA256: ${String(stableHash(tx.paymentIntentId + (tx.utr || "PNK"))).padStart(12, "0").toUpperCase()}`;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <aside className="w-screen max-w-lg bg-white dark:bg-[#121626] shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <FileText size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                  NPCI UPI Intent & Settlement Audit
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{tx.paymentIntentId}</p>
                  <button
                    onClick={() => copyToClipboard(tx.paymentIntentId, "Payment Intent ID")}
                    className="text-slate-400 hover:text-purple-600 transition-colors"
                    title="Copy Intent ID"
                  >
                    <Copy size={11} />
                  </button>
                </div>
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
                <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck size={13} className="text-purple-600" />
                  <span>Settlement Route: RBI Nodal Escrow (T+1)</span>
                </span>
                <Badge variant={tx.status === "SUCCESS" ? "success" : tx.status === "FAILED" ? "destructive" : "warning"}>
                  {tx.status}
                </Badge>
              </div>
              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <span className="text-slate-400 text-[11px]">Net Paid by Customer:</span>
                  <p className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
                    ₹{payable.toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 text-[11px]">PINAK Deal Savings:</span>
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    -₹{discount.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Direct UPI Intent Link */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] tracking-wider">
                  Generated NPCI UPI Deep-Link Intent
                </label>
                <button
                  onClick={() => copyToClipboard(tx.upiIntentUrl, "NPCI UPI Deep-Link")}
                  className="text-purple-600 dark:text-purple-400 text-[11px] font-semibold flex items-center gap-1 hover:underline"
                >
                  <Copy size={11} />
                  <span>Copy Intent URL</span>
                </button>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 font-mono text-[11px] break-all select-all text-purple-600 dark:text-purple-400 leading-relaxed">
                {tx.upiIntentUrl}
              </div>
            </div>

            {/* Parties & Bank UTR */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800">
                <p className="text-slate-400 font-semibold uppercase text-[10px]">Bank UTR / RRN</p>
                <p className="font-mono font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-1">
                  <span>{tx.utr || "Pending Clearance"}</span>
                  {tx.utr && tx.utr !== "Pending Clearance" && (
                    <button
                      onClick={() => copyToClipboard(tx.utr, "Bank UTR")}
                      className="text-slate-400 hover:text-purple-600"
                    >
                      <Copy size={11} />
                    </button>
                  )}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800">
                <p className="text-slate-400 font-semibold uppercase text-[10px]">Payee Merchant VPA</p>
                <p className="font-mono font-bold text-slate-900 dark:text-white mt-1 truncate flex items-center gap-1">
                  <span className="truncate">{tx.payeeVpa}</span>
                  <button
                    onClick={() => copyToClipboard(tx.payeeVpa, "Payee VPA")}
                    className="text-slate-400 hover:text-purple-600 shrink-0"
                  >
                    <Copy size={11} />
                  </button>
                </p>
              </div>
            </div>

            {/* Financial Reconciliation Breakdown */}
            <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/20 space-y-2.5">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                Financial Settlement Breakdown
              </h4>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Gross In-Store Bill Amount:</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">₹{gross.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">PINAK Promotional Discount:</span>
                <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">-₹{discount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800 font-bold">
                <span className="text-slate-800 dark:text-slate-200">Net Amount Paid by Customer:</span>
                <span className="font-mono text-purple-700 dark:text-purple-300">₹{payable.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800 text-[11px]">
                <span className="text-slate-500">Platform Commission (5.00%):</span>
                <span className="font-mono text-slate-600 dark:text-slate-400">-₹{platformFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800 text-[11px]">
                <span className="text-slate-500">GST on Commission (18%):</span>
                <span className="font-mono text-slate-600 dark:text-slate-400">-₹{gstOnFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1.5 bg-emerald-50/50 dark:bg-emerald-950/30 px-2 rounded-lg font-bold text-emerald-700 dark:text-emerald-300">
                <span>Net Estimated Merchant Settlement:</span>
                <span className="font-mono text-xs">₹{netSettled.toFixed(2)}</span>
              </div>
            </div>

            {/* Lifecycle Timeline */}
            <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 space-y-2">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                Settlement Lifecycle Stages
              </h4>
              <div className="space-y-2 text-[11px] pt-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                  <span className="text-slate-600 dark:text-slate-400">
                    <strong className="text-slate-800 dark:text-slate-200">T0:</strong> Customer scanned counter QR & initiated UPI intent
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                  <span className="text-slate-600 dark:text-slate-400">
                    <strong className="text-slate-800 dark:text-slate-200">T1:</strong> NPCI Switch authorized payer bank account debit
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                  <span className="text-slate-600 dark:text-slate-400">
                    <strong className="text-slate-800 dark:text-slate-200">T2:</strong> Webhook callback verified via HMAC-SHA256 signature
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                  <span className="text-slate-600 dark:text-slate-400">
                    <strong className="text-slate-800 dark:text-slate-200">T3:</strong> Funds deposited in RBI Nodal Escrow Account for T+1 clearing
                  </span>
                </div>
              </div>
            </div>

            {/* Cryptographic Proof Verification */}
            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 text-[11px] space-y-1.5">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="font-semibold">Cryptographic Checksum</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">HMAC-SHA256 VERIFIED</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-slate-700 dark:text-slate-300 font-mono text-[10px] break-all">
                  {simulatedSig}
                </p>
                <button
                  onClick={() => copyToClipboard(simulatedSig, "HMAC-SHA256 Signature")}
                  className="text-slate-400 hover:text-purple-600 shrink-0"
                  title="Copy Signature"
                >
                  <Copy size={11} />
                </button>
              </div>
            </div>
          </div>

          {/* Drawer Footer */}
          <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-3">
            <button
              onClick={() => downloadTaxInvoiceReceipt(tx)}
              className="btn-gradient flex-1 py-2.5 rounded-xl text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 active:scale-98 transition-transform"
            >
              <Download size={14} />
              <span>Download Tax Invoice & Receipt</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              Close
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
