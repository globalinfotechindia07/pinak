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
  Pause,
  Armchair,
  Utensils,
  MapPin
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
  const isChainWide = !offer.storeId || offer.storeId === "all";
  const matchedSingleStore = stores.find((s) => s.id === offer.storeId);
  const applicableStores = stores.filter(
    (s) =>
      offer.applicableStoreIds?.includes(s.id) ||
      offer.storeId === s.id
  );
  const merchantStores = stores.filter((s) => s.merchantId === offer.merchantId);

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
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold text-pink-700 dark:text-pink-300 uppercase tracking-wider">
                        {offer.merchantName}
                      </span>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300">
                        {isChainWide
                          ? "All Brand Outlets"
                          : (matchedSingleStore?.city ? `${matchedSingleStore.city} Branch` : (offer.storeName || "Branch"))}
                      </span>
                    </div>
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
                        : offer.type === "CASHBACK"
                        ? `${offer.value}% Wallet Cashback`
                        : (offer.buyQuantity && offer.getQuantity
                            ? `Buy ${offer.buyQuantity} Get ${offer.getQuantity} Free`
                            : "Buy 1 Get 1 Free")}
                    </span>
                    {offer.maxDiscount && (
                      <span className="px-2.5 py-1 rounded-lg bg-pink-100 text-pink-800 dark:bg-pink-950/80 dark:text-pink-300 text-[11px] font-bold">
                        Max Cap: ₹{offer.maxDiscount}
                      </span>
                    )}
                  </div>
                </div>

                {/* Fulfillment & Redemption Mode */}
                <div className="p-3 rounded-xl border space-y-1.5 bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Users size={12} className="text-pink-600" />
                      <span>Fulfillment Mode</span>
                    </span>
                    {offer.redemptionType === "WALK_IN" ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                        <StoreIcon size={11} /> Walk-In Only
                      </span>
                    ) : offer.redemptionType === "PRE_BOOK" ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-300 dark:border-purple-800 flex items-center gap-1">
                        <Calendar size={11} /> Pre-Booking Only ({offer.minAdvanceHours || 2}h Prior)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-800 flex items-center gap-1">
                        <Sparkles size={11} /> Walk-In & Pre-Book
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    {offer.redemptionType === "WALK_IN"
                      ? "Guests can redeem this offer instantly upon arrival or bill payment without reserving in advance."
                      : offer.redemptionType === "PRE_BOOK"
                      ? `Guests must reserve a slot or table at least ${offer.minAdvanceHours || 2} hours in advance through the app.`
                      : "Flexible redemption: Available for both instant walk-in guests and scheduled slot reservations."}
                  </p>
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

                {/* Store / Branch Applicability Scope */}
                <div className="space-y-2">
                  <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 text-xs">
                    <StoreIcon size={14} className="text-amber-500" />
                    <span>Store / Branch Applicability Scope</span>
                  </label>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-semibold">Deployment Scope:</span>
                      <span className="font-bold text-purple-700 dark:text-purple-300">
                        {isChainWide ? "Chain-Wide (All Brand Outlets)" : "Specific Physical Branch"}
                      </span>
                    </div>

                    {isChainWide ? (
                      <div className="p-3 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/40 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-600 text-white uppercase tracking-wider">
                            Brand-Wide Deal
                          </span>
                          <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300">
                            {merchantStores.length > 0 ? `${merchantStores.length} Branches Covered` : "All Outlets"}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                          This offer applies automatically across all branch outlets of <strong>{offer.merchantName}</strong>. Nearby customers anywhere within range discover this deal.
                        </p>
                        {merchantStores.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Active Outlets in Network:
                            </span>
                            <div className="space-y-1.5">
                              {merchantStores.map((st) => (
                                <div key={st.id} className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                                  <div className="min-w-0 pr-2">
                                    <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">{st.storeName || st.branchName}</span>
                                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5 truncate">
                                      <MapPin size={10} className="text-pink-600 shrink-0" />
                                      <span className="truncate">{st.address}</span>
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 block">
                                      {st.city || st.state}
                                    </span>
                                    {st.latitude && st.longitude && (
                                      <span className="text-[9px] font-mono text-slate-400 block mt-0.5">
                                        {Number(st.latitude).toFixed(3)}, {Number(st.longitude).toFixed(3)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      // Single Specific Store Card
                      <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-pink-200 dark:border-pink-900/50 space-y-2.5 shadow-2xs">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-extrabold text-slate-900 dark:text-white text-xs block">
                              {matchedSingleStore?.storeName || matchedSingleStore?.branchName || offer.storeName || "Branch Outlet"}
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                              Branch ID: {offer.storeId}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300 shrink-0">
                            {matchedSingleStore?.city || matchedSingleStore?.state || "Specific Branch"}
                          </span>
                        </div>

                        {matchedSingleStore?.address && (
                          <div className="flex items-start gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 p-2 rounded-lg bg-slate-50 dark:bg-slate-900/40">
                            <MapPin size={13} className="text-pink-600 shrink-0 mt-0.5" />
                            <span>
                              {matchedSingleStore.address}
                              {matchedSingleStore.city ? `, ${matchedSingleStore.city}` : ""}
                              {matchedSingleStore.state ? `, ${matchedSingleStore.state}` : ""}
                              {matchedSingleStore.pincode ? ` - ${matchedSingleStore.pincode}` : ""}
                            </span>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-700/60 text-[10px]">
                          <div>
                            <span className="text-slate-400 font-semibold block">GPS Coordinates:</span>
                            <span className="font-mono text-pink-600 dark:text-pink-400 font-bold text-xs">
                              {matchedSingleStore?.latitude && matchedSingleStore?.longitude
                                ? `${Number(matchedSingleStore.latitude).toFixed(4)}, ${Number(matchedSingleStore.longitude).toFixed(4)}`
                                : "Coordinates Registered"}
                            </span>
                          </div>
                          {matchedSingleStore?.phone && (
                            <div>
                              <span className="text-slate-400 font-semibold block">Store Phone:</span>
                              <span className="text-slate-700 dark:text-slate-300 font-mono">
                                {matchedSingleStore.phone}
                              </span>
                            </div>
                          )}
                        </div>
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

                {/* District Table Reservation & Slot Booking Engine */}
                {offer.isTableBookingEnabled && (
                  <div className="space-y-2">
                    <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 text-xs">
                      <Armchair size={14} className="text-indigo-600" />
                      <span>District-Style Table Reservation & Slot Engine</span>
                    </label>
                    <div className="p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-900/60 space-y-2.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Booking Vertical:</span>
                        <span className="font-bold text-indigo-700 dark:text-indigo-300">
                          {offer.bookingType === "TABLE_RESERVATION" ? "🍽️ Dining Table Reservation" : "💆 Service Appointment Slot"}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Party Size Range:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {offer.minPartySize || 1} to {offer.maxPartySize || 8} Guests
                        </span>
                      </div>

                      {offer.availableTablesPerSlot && (
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">Capacity Per Slot:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {offer.availableTablesPerSlot} Tables / Slots
                          </span>
                        </div>
                      )}

                      {offer.slotTimes && offer.slotTimes.length > 0 && (
                        <div>
                          <span className="text-slate-500 block mb-1">Configured Time Slots:</span>
                          <div className="flex flex-wrap gap-1">
                            {offer.slotTimes.map((slot) => (
                              <span
                                key={slot}
                                className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                              >
                                {slot}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {offer.seatingAreas && offer.seatingAreas.length > 0 && (
                        <div className="flex justify-between items-center pt-1 border-t border-indigo-100 dark:border-indigo-900/40">
                          <span className="text-slate-500">Seating Areas:</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {offer.seatingAreas.join(", ")}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-1 border-t border-indigo-100 dark:border-indigo-900/40">
                        <span className="text-slate-500">Policy:</span>
                        <span className="text-slate-700 dark:text-slate-300 font-medium">
                          {offer.coverChargeAmount ? `₹${offer.coverChargeAmount} Cover Deposit` : "Free Reservation"} • {offer.gracePeriodMinutes || 15}m Grace
                        </span>
                      </div>
                    </div>
                  </div>
                )}

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
                      <span className="text-slate-500 block mb-1 font-semibold">Terms & Fine Print:</span>
                      {offer.terms && (offer.terms.includes("\n") || offer.terms.includes("•")) ? (
                        <ul className="space-y-1 text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                          {offer.terms
                            .split(/\n|•/)
                            .map((t) => t.trim())
                            .filter((t) => t.length > 2)
                            .map((term, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="text-purple-600 font-bold shrink-0">•</span>
                                <span>{term}</span>
                              </li>
                            ))}
                        </ul>
                      ) : (
                        <p className="text-slate-700 dark:text-slate-300 italic text-[11px] leading-relaxed">
                          {offer.terms || "Standard offer rules apply."}
                        </p>
                      )}
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
