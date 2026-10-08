import React, { useState, useEffect } from "react";
import {
  TicketPercent,
  X,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  Store as StoreIcon,
  ShieldCheck,
  Calendar,
  AlertCircle,
  Tag,
  Sparkles,
  Users,
  Coins,
  History,
  QrCode,
  ExternalLink,
  Ban,
  Play,
  Pause
} from "lucide-react";
import { Offer, Store, AuditEvent } from "../types";
import { Badge } from "./ui/badge";
import { cn } from "../lib/utils";
import { toast } from "sonner";

import { offerApi } from "../api/offerApi";

interface OfferDetailsDrawerProps {
  offer: Offer;
  stores?: Store[];
  auditLogs?: AuditEvent[];
  isAdmin?: boolean;
  onClose: () => void;
  onUpdateStatus?: (id: string, status: any, reason?: string) => void;
}

export const OfferDetailsDrawer: React.FC<OfferDetailsDrawerProps> = ({
  offer,
  stores = [],
  auditLogs = [],
  isAdmin = false,
  onClose,
  onUpdateStatus
}) => {
  const [activeTab, setActiveTab] = useState<"overview" | "history">("overview");
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [dbAudits, setDbAudits] = useState<AuditEvent[]>([]);

  useEffect(() => {
    if (offer && offer.id) {
      offerApi.getOfferAuditLogs(offer.id)
        .then((logs) => {
          if (Array.isArray(logs) && logs.length > 0) {
            const mapped: AuditEvent[] = logs.map((l: any) => ({
              id: l.id || String(Math.random()),
              action: l.action || "OFFER_UPDATED",
              entity: l.resourceType || "OFFER",
              actor: l.adminUserId ? `User #${l.adminUserId.substring(0, 8)}` : "Merchant Partner",
              time: l.createdAt || new Date().toISOString(),
              severity: l.action?.includes("REJECT") || l.action?.includes("DELETE") ? "critical" : l.action?.includes("APPROV") ? "success" : "info",
              metadata: {
                reason: l.reason,
                requestId: l.requestId,
                ipAddress: l.ipAddress
              }
            }));
            setDbAudits(mapped);
          }
        })
        .catch(() => {});
    }
  }, [offer]);

  // Filter audit events related to this specific offer
  const storeAudits = auditLogs.filter(
    (a) =>
      (a.metadata as any)?.offerId === offer.id ||
      a.entity?.toLowerCase().includes(offer.title.toLowerCase()) ||
      a.entity?.toLowerCase().includes(offer.id.toLowerCase())
  );

  const offerAudits = dbAudits.length > 0 ? dbAudits : storeAudits;

  // Map applicable store names
  const applicableStores = stores.filter(
    (s) =>
      offer.applicableStoreIds?.includes(s.id) ||
      offer.storeId === s.id
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <aside className="w-screen max-w-lg bg-white dark:bg-[#121626] shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-pink-100 dark:bg-pink-950/60 text-pink-600 flex items-center justify-center">
                <TicketPercent size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                  Campaign Offer Inspector
                </h3>
                <p className="text-[11px] text-slate-400">Fraud Caps, Outlets, Schedule & Lifecycle Audit</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 px-6 py-2 gap-2">
            <button
              onClick={() => setActiveTab("overview")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
                activeTab === "overview"
                  ? "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 font-bold"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              )}
            >
              <Tag size={13} />
              <span>Offer Details & Rules</span>
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
                activeTab === "history"
                  ? "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 font-bold"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              )}
            >
              <History size={13} />
              <span>Audit History ({offerAudits.length})</span>
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
            {activeTab === "overview" ? (
              <>
                {/* Banner Header Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-indigo-500/10 border border-pink-200/80 dark:border-pink-900/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-pink-700 dark:text-pink-300 uppercase tracking-wider">
                      {offer.merchantName}
                    </span>
                    <Badge
                      variant={
                        offer.status === "ACTIVE"
                          ? "success"
                          : offer.status === "REJECTED" || offer.status === "EXPIRED"
                          ? "destructive"
                          : "warning"
                      }
                    >
                      {offer.status === "ACTIVE" ? (
                        <CheckCircle2 size={12} />
                      ) : offer.status === "PENDING_APPROVAL" ? (
                        <Clock size={12} />
                      ) : (
                        <XCircle size={12} />
                      )}
                      {offer.status.replace("_", " ")}
                    </Badge>
                  </div>

                  <h4 className="text-base font-extrabold text-slate-900 dark:text-white font-['Manrope']">
                    {offer.title}
                  </h4>
                  {offer.tagline && (
                    <p className="text-xs text-pink-600 dark:text-pink-400 font-semibold italic">
                      "{offer.tagline}"
                    </p>
                  )}

                  <div className="pt-2 border-t border-pink-200/50 dark:border-pink-900/50 flex items-center justify-between">
                    <span className="text-xl font-extrabold text-pink-600 dark:text-pink-400 font-['Manrope']">
                      {offer.type === "FLAT_AMT"
                        ? `Flat ₹${offer.value} Off`
                        : offer.type === "FLAT_PCT"
                        ? `${offer.value}% Off`
                        : "Buy 1 Get 1 (BOGO)"}
                    </span>
                    {offer.maxDiscount && (
                      <span className="px-2.5 py-1 rounded-lg bg-pink-100 text-pink-800 dark:bg-pink-950/80 dark:text-pink-300 text-[11px] font-bold">
                        Max Cap: ₹{offer.maxDiscount}
                      </span>
                    )}
                  </div>
                </div>

                {/* Financial & Fraud Protection Caps */}
                <div className="space-y-2">
                  <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 text-xs">
                    <ShieldCheck size={14} className="text-purple-600" />
                    <span>Financial & Fraud Protection Controls</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">Min Spend Required</span>
                      <p className="font-mono text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                        ₹{offer.minBillAmount}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">Max Discount Cap</span>
                      <p className="font-mono text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                        {offer.maxDiscount ? `₹${offer.maxDiscount}` : "No Cap (Flat ₹)"}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">Per-User Limit</span>
                      <p className="font-mono text-sm font-bold text-purple-600 dark:text-purple-400 mt-0.5">
                        {offer.perUserLimit ? `${offer.perUserLimit} per customer` : "Unlimited"}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">Campaign Budget Limit</span>
                      <p className="font-mono text-sm font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                        {offer.maxTotalRedemptions ? `${offer.maxTotalRedemptions} max uses` : "Unlimited"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Multi-Store Outlet Scope */}
                <div className="space-y-2">
                  <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 text-xs">
                    <StoreIcon size={14} className="text-amber-500" />
                    <span>Store / Branch Applicability Scope</span>
                  </label>
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-semibold">Target Outlets:</span>
                      <span className="font-bold text-purple-700 dark:text-purple-300">
                        {!offer.storeId || offer.storeId === "all"
                          ? "All Outlets (Brand-Wide)"
                          : `${applicableStores.length || 1} Specific Outlets`}
                      </span>
                    </div>
                    {applicableStores.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {applicableStores.map((st) => (
                          <span
                            key={st.id}
                            className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-[11px] font-medium border border-purple-200/50 dark:border-purple-800/40"
                          >
                            📍 {st.branchName} ({st.city})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Campaign Scheduling & Happy Hours */}
                <div className="space-y-2">
                  <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 text-xs">
                    <Calendar size={14} className="text-indigo-500" />
                    <span>Campaign Schedule & Happy Hours</span>
                  </label>
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Validity Window:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {offer.validFrom ? offer.validFrom.split("T")[0] : "Launch"} → {offer.validTo ? offer.validTo.split("T")[0] : "Ongoing"}
                      </span>
                    </div>

                    {offer.activeDays && offer.activeDays.length > 0 && (
                      <div className="flex justify-between items-center pt-1 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500">Active Days:</span>
                        <div className="flex gap-1">
                          {offer.activeDays.map((d) => (
                            <span key={d} className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px] font-bold">
                              {d}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {offer.startTime && offer.endTime && (
                      <div className="flex justify-between items-center pt-1 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500">Happy Hours Slot:</span>
                        <span className="font-mono text-purple-600 dark:text-purple-400 font-bold">
                          ⏰ {offer.startTime} – {offer.endTime}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Customer Experience & Redemption Method */}
                <div className="space-y-2">
                  <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 text-xs">
                    <Sparkles size={14} className="text-pink-500" />
                    <span>Customer Experience & Discovery Banner</span>
                  </label>
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Redemption Method:</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {offer.redemptionMethod === "PROMO_CODE"
                          ? `Promo Code: ${offer.promoCode || "Required"}`
                          : "Auto-Applied on Bill Scan"}
                      </span>
                    </div>

                    <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500 block mb-1">Terms & Conditions:</span>
                      <p className="text-slate-700 dark:text-slate-300 italic text-[11px] leading-relaxed">
                        {offer.terms || "Standard offer rules apply."}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* Audit History Timeline */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-xs">
                    <History size={14} className="text-purple-600" />
                    <span>Lifecycle Event Audit Trail</span>
                  </h4>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {offerAudits.length} recorded operations
                  </span>
                </div>

                {offerAudits.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
                    <Clock size={24} className="mx-auto text-slate-400" />
                    <p className="font-bold text-slate-700 dark:text-slate-300">Initial Campaign Audit</p>
                    <p className="text-xs text-slate-400">
                      Offer created on {offer.createdAt ? offer.createdAt.split("T")[0] : "today"}. Full event trace recorded in system governance log.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 relative before:absolute before:inset-y-0 before:left-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                    {offerAudits.map((aud, idx) => (
                      <div key={aud.id || idx} className="relative pl-7 text-xs space-y-1">
                        <div
                          className={cn(
                            "absolute left-1 top-1 w-4 h-4 rounded-full border-2 bg-white dark:bg-slate-900",
                            aud.severity === "success"
                              ? "border-emerald-500"
                              : aud.severity === "critical"
                              ? "border-rose-500"
                              : "border-purple-500"
                          )}
                        />
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 dark:text-white">
                              {aud.action}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400">
                              {aud.time ? aud.time.split("T")[0] : "Recent"}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            Actor: <span className="font-semibold text-slate-700 dark:text-slate-300">{aud.actor}</span>
                          </p>
                          {aud.metadata && (
                            <pre className="text-[10px] font-mono p-2 rounded bg-slate-100 dark:bg-slate-950/80 text-slate-600 dark:text-slate-400 overflow-x-auto">
                              {JSON.stringify(aud.metadata, null, 2)}
                            </pre>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Drawer Footer Actions */}
          <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
            {isAdmin && offer.status === "PENDING_APPROVAL" && (
              <>
                {!showRejectInput ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        onUpdateStatus?.(offer.id, "ACTIVE");
                        toast.success(`Offer "${offer.title}" approved and published live!`);
                        onClose();
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 size={15} />
                      <span>Approve & Publish Campaign</span>
                    </button>
                    <button
                      onClick={() => setShowRejectInput(true)}
                      className="px-4 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-100 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Enter rejection reason for merchant..."
                      className="w-full p-2.5 rounded-xl border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-800 text-xs"
                      rows={2}
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setShowRejectInput(false)}
                        className="px-3 py-1.5 text-xs text-slate-500"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          onUpdateStatus?.(offer.id, "REJECTED", rejectReason || "Terms non-compliant");
                          toast.error(`Offer "${offer.title}" rejected`);
                          onClose();
                        }}
                        className="px-4 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-xs"
                      >
                        Confirm Rejection
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
