import React, { useState, useMemo, useEffect } from "react";
import {
  Store as StoreIcon,
  Tag,
  ShoppingBag,
  Plus,
  MapPin,
  CheckCircle2,
  Clock,
  Building2,
  Navigation,
  X,
  Compass,
  ExternalLink,
  Layers,
  AlertCircle,
  Trash2,
  Download,
  Power,
  PowerOff,
  Pencil,
  MoreVertical,
  Eye,
  Copy,
  Sparkles,
  LayoutGrid,
  List,
  Search,
  UserCheck,
  Mail,
  KeyRound,
  Send,
  ShieldCheck,
  User,
  Phone
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "../../components/ui/dropdown-menu";
import { Store as StoreType, Merchant, Offer } from "../../types";
import { OfferCampaignFormDrawer } from "../../components/OfferCampaignFormDrawer";
import { AdvancedTable, Column } from "../../components/ui/AdvancedTable";
import { Badge } from "../../components/ui/badge";
import { cn } from "../../lib/utils";
import { toast } from "sonner";
import { storeBranchSchema } from "../../lib/validationSchemas";
import { StoreLocationPicker } from "../../components/StoreLocationPicker";
import { IndiaAddressFields } from "../../components/IndiaAddressFields";
import { StoreScheduleSelector } from "../../components/StoreScheduleSelector";
import { StoreMediaAndAmenitiesSection } from "../../components/StoreMediaAndAmenitiesSection";
import { staffApi, BackendStaffResponse } from "../../api/staffApi";
import { storeApi } from "../../api/storeApi";

interface StoreManagementProps {
  stores: StoreType[];
  merchants: Merchant[];
  offers?: Offer[];
  onAddStore: (draft: Partial<StoreType>) => void;
  onApproveStore: (id: string) => void;
  onDeleteStore?: (id: string) => void;
  onUpdateStore?: (id: string, updates: Partial<StoreType>) => void;
  onAddOffer?: (draft: any) => void;
  onNavigateTab?: (tab: string) => void;
}

export const StoreManagement: React.FC<StoreManagementProps> = ({
  stores,
  merchants,
  offers = [],
  onAddStore,
  onApproveStore,
  onDeleteStore,
  onUpdateStore,
  onAddOffer,
  onNavigateTab
}) => {
  const [storeForOffer, setStoreForOffer] = useState<StoreType | null>(null);
  const [cityFilter, setCityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [cardSearch, setCardSearch] = useState("");
  const [selectedStore, setSelectedStore] = useState<StoreType | null>(null);
  const [storeToEdit, setStoreToEdit] = useState<StoreType | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState<StoreType | null>(null);

  // Dynamic cities that have at least one store listed
  const availableCities = useMemo(() => {
    const uniqueCities = Array.from(new Set(stores.map((s) => s.city).filter(Boolean))).sort();
    return ["ALL", ...uniqueCities];
  }, [stores]);

  // Executive KPI Metrics
  const activeCount = useMemo(
    () => stores.filter((s) => s.status === "ACTIVE").length,
    [stores]
  );
  const pendingCount = useMemo(
    () => stores.filter((s) => s.status === "PENDING_APPROVAL").length,
    [stores]
  );
  const inactiveCount = useMemo(
    () => stores.filter((s) => s.status === "INACTIVE" || s.status === "CLOSED").length,
    [stores]
  );
  const citiesCount = useMemo(
    () => new Set(stores.map((s) => s.city).filter(Boolean)).size,
    [stores]
  );

  // Tab counts
  const tabCounts = useMemo(() => {
    return {
      ALL: stores.length,
      ACTIVE: activeCount,
      PENDING_APPROVAL: pendingCount,
      INACTIVE: inactiveCount,
    };
  }, [stores, activeCount, pendingCount, inactiveCount]);

  // Filtered by status tab and city chip
  const displayedStores = useMemo(() => {
    return stores.filter((s) => {
      if (statusFilter !== "ALL") {
        if (statusFilter === "ACTIVE" && s.status !== "ACTIVE") return false;
        if (statusFilter === "PENDING_APPROVAL" && s.status !== "PENDING_APPROVAL") return false;
        if (statusFilter === "INACTIVE" && s.status !== "INACTIVE" && s.status !== "CLOSED") return false;
      }
      if (cityFilter !== "ALL" && s.city.toLowerCase() !== cityFilter.toLowerCase()) {
        return false;
      }
      return true;
    });
  }, [stores, statusFilter, cityFilter]);

  // Comprehensive store search matching across all fields
  const matchStoreSearch = (s: StoreType, q: string) => {
    if (!q || !q.trim()) return true;
    const query = q.toLowerCase().trim();
    const brand = merchants.find((m) => m.id === s.merchantId)?.businessName?.toLowerCase() || "";
    return (
      (s.branchName || "").toLowerCase().includes(query) ||
      (s.storeName || "").toLowerCase().includes(query) ||
      ((s as any).name || "").toLowerCase().includes(query) ||
      (s.merchantName || "").toLowerCase().includes(query) ||
      brand.includes(query) ||
      (s.address || "").toLowerCase().includes(query) ||
      (s.city || "").toLowerCase().includes(query) ||
      (s.district || "").toLowerCase().includes(query) ||
      (s.state || "").toLowerCase().includes(query) ||
      (s.pincode || "").toLowerCase().includes(query) ||
      (s.managerName || "").toLowerCase().includes(query) ||
      (s.managerEmail || "").toLowerCase().includes(query) ||
      (s.phone || "").toLowerCase().includes(query) ||
      (s.id || "").toLowerCase().includes(query)
    );
  };

  const handleExportStoresCsv = () => {
    if (stores.length === 0) {
      toast.info("No stores to export");
      return;
    }
    const headers = ["ID,StoreName,Brand,Address,City,District,State,Pincode,Latitude,Longitude,OperatingHours,Status"];
    const rows = stores.map(
      (s) =>
        `"${s.id}","${s.branchName}","${s.merchantName}","${s.address.replace(/"/g, '""')}","${s.city}","${s.district || ""}","${s.state || ""}","${s.pincode}",${s.latitude},${s.longitude},"${s.operatingHours}","${s.status}"`
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `pinak-stores-network-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${stores.length} store branch records to CSV!`);
  };

  const columns: Column<StoreType>[] = [
    {
      header: "Store & Brand",
      sortable: true,
      accessor: "branchName",
      render: (s) => {
        const branchTitle = s.branchName || s.storeName || (s as any).name || "Branch Outlet";
        const parentMerchant = merchants.find((m) => m.id === s.merchantId);
        const brandName = parentMerchant?.businessName || s.merchantName || "Partner Brand";
        const shortBid = (s.id || "").substring(0, 8).toUpperCase();

        return (
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 shadow-2xs">
              <StoreIcon size={15} />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-slate-900 dark:text-white leading-tight truncate">
                {branchTitle}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-purple-700 dark:text-purple-300 font-medium truncate mt-0.5">
                <Building2 size={11} className="shrink-0 text-purple-500" />
                <span className="truncate">{brandName}</span>
                <span className="text-slate-300 dark:text-slate-600">·</span>
                <span className="font-mono text-[10px] text-amber-700 dark:text-amber-400 font-semibold">
                  #{shortBid}
                </span>
              </div>
              {((s.menuImages && s.menuImages.length > 0) || (s.photos && s.photos.length > 0) || (s.amenities && s.amenities.length > 0)) && (
                <div className="flex items-center gap-1.5 mt-1 text-[10px]">
                  {s.menuImages && s.menuImages.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40 font-medium">
                      🍽️ {s.menuImages.length} {s.menuImages.length === 1 ? "page" : "pages"}
                    </span>
                  )}
                  {s.photos && s.photos.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40 font-medium">
                      📸 {s.photos.length}
                    </span>
                  )}
                  {s.amenities && s.amenities.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40 font-medium">
                      ✨ {s.amenities.length}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      }
    },
    {
      header: "Location",
      sortable: true,
      accessor: "city",
      render: (s) => (
        <div className="min-w-0 text-xs">
          <p className="font-semibold text-slate-800 dark:text-slate-200 truncate flex items-center gap-1">
            <MapPin size={11} className="text-pink-500 shrink-0" />
            <span className="truncate">{s.city}{s.state ? `, ${s.state}` : ""}</span>
            {s.pincode && <span className="text-slate-400 font-normal">· {s.pincode}</span>}
          </p>
          <p className="text-slate-400 text-[11px] truncate mt-0.5" title={s.address}>
            {s.address || "Main Street"}
          </p>
        </div>
      )
    },
    {
      header: "Manager",
      sortable: false,
      render: (s) => {
        if (s.managerName) {
          return (
            <div className="min-w-0 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200 truncate">
                <UserCheck size={12} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="truncate">{s.managerName}</span>
              </div>
              <div className="text-[11px] text-slate-400 truncate mt-0.5">
                {s.managerEmail || s.phone || "No contact"}
              </div>
            </div>
          );
        }

        if (s.phone) {
          return (
            <div className="min-w-0 text-xs">
              <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium truncate">
                <Phone size={11} className="text-slate-400 shrink-0" />
                <span className="truncate">{s.phone}</span>
              </div>
              <span className="text-[10px] text-slate-400 italic block mt-0.5">Unassigned</span>
            </div>
          );
        }

        return <span className="text-slate-400 italic text-xs">Unassigned</span>;
      }
    },
    {
      header: "Live Deals",
      sortable: false,
      className: "w-32 text-center whitespace-nowrap",
      render: (s) => {
        const storeDeals = offers.filter(o =>
          (o.applicableStoreIds && o.applicableStoreIds.includes(s.id)) ||
          o.storeId === s.id ||
          (!o.applicableStoreIds?.length && o.merchantId === s.merchantId)
        );
        const count = storeDeals.length;
        if (count > 0) {
          return (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedStore(s);
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200/80 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800 hover:bg-purple-100 transition-colors shadow-2xs"
              title="Click to view outlet deals"
            >
              <Tag size={11} className="text-purple-600 dark:text-purple-400" />
              <span>{count} Live {count === 1 ? "Deal" : "Deals"}</span>
            </button>
          );
        }
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setStoreForOffer(s);
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-dashed border-slate-300 dark:border-slate-700 transition-colors"
            title="Create promotion or product deal for this branch"
          >
            <Tag size={11} className="text-emerald-600" />
            <span>+ Add Deal</span>
          </button>
        );
      }
    },
    {
      header: "Status",
      sortable: true,
      accessor: "status",
      className: "w-28 text-center whitespace-nowrap",
      render: (s) => {
        if (s.status === "ACTIVE") {
          return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active
            </span>
          );
        }
        if (s.status === "PENDING_APPROVAL") {
          return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60 whitespace-nowrap">
              <Clock size={11} />
              Review
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 whitespace-nowrap">
            Inactive
          </span>
        );
      }
    },
    {
      header: "",
      sortable: false,
      className: "w-12 text-right whitespace-nowrap",
      render: (s) => {
        const lat = typeof s.latitude === "number" ? s.latitude : parseFloat(String(s.latitude || 21.1458));
        const lng = typeof s.longitude === "number" ? s.longitude : parseFloat(String(s.longitude || 79.0882));
        const safeCoords = `${!isNaN(lat) ? lat.toFixed(6) : "21.1458"}, ${!isNaN(lng) ? lng.toFixed(6) : "79.0882"}`;

        return (
          <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800 transition-colors"
                  title="Store Actions"
                >
                  <MoreVertical size={14} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-1.5 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#121626]">
                <DropdownMenuLabel className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-2 py-1">
                  Store Operations
                </DropdownMenuLabel>

                <DropdownMenuItem
                  onClick={() => setSelectedStore(s)}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-700 dark:hover:text-purple-300"
                >
                  <Eye size={14} className="text-purple-600 dark:text-purple-400" />
                  <span>View Outlet & Map</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => setStoreToEdit(s)}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-700 dark:hover:text-purple-300"
                >
                  <Pencil size={14} className="text-amber-600 dark:text-amber-400" />
                  <span>Edit Store Outlet</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => setStoreForOffer(s)}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold cursor-pointer text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                >
                  <Tag size={14} className="text-emerald-600 dark:text-emerald-400" />
                  <span>Create Store Offer</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => {
                    navigator.clipboard.writeText(s.id);
                    toast.success(`Copied Store ID: ${s.id}`);
                  }}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Copy size={14} className="text-slate-400" />
                  <span>Copy Store ID</span>
                </DropdownMenuItem>

                {s.merchantId && (
                  <DropdownMenuItem
                    onClick={() => {
                      navigator.clipboard.writeText(s.merchantId);
                      toast.success(`Copied Merchant ID: ${s.merchantId}`);
                    }}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Building2 size={14} className="text-slate-400" />
                    <span>Copy Merchant ID</span>
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem
                  onClick={() => {
                    navigator.clipboard.writeText(safeCoords);
                    toast.success(`Copied Coordinates: ${safeCoords}`);
                  }}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <MapPin size={14} className="text-pink-500" />
                  <span>Copy Coordinates</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-1 bg-slate-100 dark:bg-slate-800" />

                {s.status !== "ACTIVE" ? (
                  <DropdownMenuItem
                    onClick={() => onApproveStore(s.id)}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold cursor-pointer text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                  >
                    <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
                    <span>Approve & Activate</span>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={() => {
                      onUpdateStore?.(s.id, { status: "INACTIVE" });
                      toast.info(`Store "${s.branchName}" marked as Inactive`);
                    }}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <PowerOff size={14} className="text-amber-500" />
                    <span>Deactivate / Close</span>
                  </DropdownMenuItem>
                )}

                {onDeleteStore && (
                  <>
                    <DropdownMenuSeparator className="my-1 bg-slate-100 dark:bg-slate-800" />
                    <DropdownMenuItem
                      onClick={() => setStoreToDelete(s)}
                      className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold cursor-pointer text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      <Trash2 size={14} />
                      <span>Delete Store Branch</span>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-['Manrope'] text-slate-900 dark:text-white">
            Physical Stores & Outlets Network
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Monitor geocoded retail branches, manager assignments, and proximity customer discovery.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportStoresCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-xs"
            title="Export store branches as CSV"
          >
            <Download size={16} />
            <span>Export (.CSV)</span>
          </button>
          <button
            onClick={() => setIsAddOpen(true)}
            className="btn-gradient flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md"
          >
            <Plus size={16} />
            <span>Add Store Branch</span>
          </button>
        </div>
      </div>

      {/* Executive KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Outlets */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Outlets</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              <StoreIcon size={16} />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-['Manrope']">
              {stores.length}
            </span>
            <span className="text-xs text-slate-400 block mt-0.5">Registered Store Branches</span>
          </div>
        </div>

        {/* Card 2: Live on App */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Live on App</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-['Manrope']">
              {activeCount}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold block mt-0.5">
              {stores.length > 0 ? Math.round((activeCount / stores.length) * 100) : 0}% Active Coverage
            </span>
          </div>
        </div>

        {/* Card 3: Action Required */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Action Required</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              <Clock size={16} />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-['Manrope']">
              {pendingCount}
            </span>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold block mt-0.5">
              Awaiting Location Clearance
            </span>
          </div>
        </div>

        {/* Card 4: Cities Covered */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Cities Covered</span>
            <div className="p-2 rounded-xl bg-pink-50 text-pink-600 dark:bg-pink-950/40 dark:text-pink-400">
              <MapPin size={16} />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-['Manrope']">
              {citiesCount}
            </span>
            <span className="text-xs text-slate-400 block mt-0.5">Active Urban Presence</span>
          </div>
        </div>
      </div>

      {/* Status Filter Chips + City Chips + View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Status Filter Tabs with Counts */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { id: "ALL", label: "All Stores", count: tabCounts.ALL },
            { id: "ACTIVE", label: "Active", count: tabCounts.ACTIVE },
            { id: "PENDING_APPROVAL", label: "Pending Review", count: tabCounts.PENDING_APPROVAL },
            { id: "INACTIVE", label: "Inactive", count: tabCounts.INACTIVE },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={cn(
                "flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all",
                statusFilter === tab.id
                  ? "bg-purple-600 text-white font-bold shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                  statusFilter === tab.id
                    ? "bg-white/20 text-white"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                )}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Dynamic City Filter & View Mode Switcher */}
        <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
          {availableCities.length > 2 && (
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-0.5">City:</span>
              {availableCities.map((city) => (
                <button
                  key={city}
                  onClick={() => setCityFilter(city)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors border ${
                    cityFilter === city
                      ? "bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 border-pink-200 dark:border-pink-800 font-bold"
                      : "border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {city === "ALL" ? "All Cities" : city}
                </button>
              ))}
            </div>
          )}

          {/* View Mode Toggle Switch */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                viewMode === "table"
                  ? "bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              )}
              title="Table View"
            >
              <List size={14} />
              <span>Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                viewMode === "cards"
                  ? "bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              )}
              title="Card Grid View"
            >
              <LayoutGrid size={14} />
              <span>Cards</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content: Table or Cards View */}
      {viewMode === "table" ? (
        <AdvancedTable
          columns={columns}
          data={displayedStores}
          keyExtractor={(s) => s.id}
          onRowClick={(s) => setSelectedStore(s)}
          searchPlaceholder="Search store branch, brand, street address, or city..."
          searchFilter={(s, q) => matchStoreSearch(s, q)}
          bulkActions={[
            {
              label: "Approve Selected Locations",
              variant: "success",
              action: (selected) => {
                selected.forEach((s) => onApproveStore(s.id));
                toast.success(`Approved ${selected.length} store branch locations!`);
              }
            }
          ]}
        />
      ) : (
        <div className="space-y-4">
          {/* Card Search & Summary Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="relative flex-1 max-w-md">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={cardSearch}
                onChange={(e) => setCardSearch(e.target.value)}
                placeholder="Search branches, brand, manager, address, or city..."
                className="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-slate-900 dark:text-white"
              />
              {cardSearch && (
                <button
                  type="button"
                  onClick={() => setCardSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X size={13} />
                </button>
              )}
            </div>
            <div className="text-xs text-slate-500 flex items-center justify-between sm:justify-end gap-2">
              <span>Showing <strong>{
                displayedStores.filter((s) => matchStoreSearch(s, cardSearch)).length
              }</strong> of <strong>{stores.length}</strong> store branches</span>
            </div>
          </div>

          {/* Cards Grid */}
          {(() => {
            const cardData = displayedStores.filter((s) => matchStoreSearch(s, cardSearch));

            if (cardData.length === 0) {
              return (
                <div className="text-center py-12 px-4 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-3">
                    <StoreIcon size={24} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">No store branches found</h4>
                  <p className="text-xs text-slate-400 mt-1">Try adjusting your search terms or city filters.</p>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cardData.map((s) => {
                  const brand = merchants.find((m) => m.id === s.merchantId)?.businessName || s.merchantName || "Partner Brand";
                  const lat = typeof s.latitude === "number" ? s.latitude : parseFloat(String(s.latitude || 21.1458));
                  const lng = typeof s.longitude === "number" ? s.longitude : parseFloat(String(s.longitude || 79.0882));
                  const safeLat = !isNaN(lat) ? lat.toFixed(4) : "21.1458";
                  const safeLng = !isNaN(lng) ? lng.toFixed(4) : "79.0882";
                  const safeCoords = `${!isNaN(lat) ? lat.toFixed(6) : "21.1458"}, ${!isNaN(lng) ? lng.toFixed(6) : "79.0882"}`;
                  const shortBid = (s.id || "").substring(0, 8).toUpperCase();

                  return (
                    <div
                      key={s.id}
                      className="group relative rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800/80 hover:border-amber-300 dark:hover:border-amber-800 transition-all p-5 shadow-xs hover:shadow-md flex flex-col justify-between"
                    >
                      {/* Top Row: Store Icon + Title + Action Menu */}
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
                              <StoreIcon size={18} />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                                {s.branchName || s.storeName || "Branch Outlet"}
                              </h4>
                              <p className="text-xs text-purple-700 dark:text-purple-300 font-semibold truncate mt-0.5 flex items-center gap-1">
                                <Building2 size={12} className="shrink-0 text-purple-500" />
                                <span className="truncate">{brand}</span>
                              </p>
                              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                                <span className="font-mono text-amber-700 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200/50 dark:border-amber-900/40">
                                  BID: #{shortBid}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* 3-dots actions menu */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title="Store Actions"
                              >
                                <MoreVertical size={15} />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 p-1.5 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#121626]">
                              <DropdownMenuLabel className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-2 py-1">
                                Store Operations
                              </DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => setSelectedStore(s)}
                                className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-700 dark:hover:text-purple-300"
                              >
                                <Eye size={14} className="text-purple-600 dark:text-purple-400" />
                                <span>View Outlet & Map</span>
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => setStoreToEdit(s)}
                                className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-700 dark:hover:text-purple-300"
                              >
                                <Pencil size={14} className="text-amber-600 dark:text-amber-400" />
                                <span>Edit Store Outlet</span>
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => {
                                  navigator.clipboard.writeText(s.id);
                                  toast.success(`Copied Store ID: ${s.id}`);
                                }}
                                className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                              >
                                <Copy size={14} className="text-slate-400" />
                                <span>Copy Store ID</span>
                              </DropdownMenuItem>

                              {s.merchantId && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    navigator.clipboard.writeText(s.merchantId);
                                    toast.success(`Copied Merchant ID: ${s.merchantId}`);
                                  }}
                                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                  <Building2 size={14} className="text-slate-400" />
                                  <span>Copy Merchant ID</span>
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuItem
                                onClick={() => {
                                  navigator.clipboard.writeText(safeCoords);
                                  toast.success(`Copied GPS: ${safeCoords}`);
                                }}
                                className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                              >
                                <MapPin size={14} className="text-pink-500" />
                                <span>Copy Coordinates</span>
                              </DropdownMenuItem>

                              <DropdownMenuSeparator className="my-1 bg-slate-100 dark:bg-slate-800" />

                              <DropdownMenuItem
                                onClick={() => setStoreForOffer(s)}
                                className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold cursor-pointer text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                              >
                                <Tag size={14} className="text-emerald-600 dark:text-emerald-400" />
                                <span>Create Store Offer</span>
                              </DropdownMenuItem>

                              {s.status !== "ACTIVE" ? (
                                <DropdownMenuItem
                                  onClick={() => onApproveStore(s.id)}
                                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold cursor-pointer text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                                >
                                  <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
                                  <span>Approve & Activate</span>
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => {
                                    onUpdateStore?.(s.id, { status: "INACTIVE" });
                                    toast.info(`Store "${s.branchName}" marked as Inactive`);
                                  }}
                                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                  <PowerOff size={14} className="text-amber-500" />
                                  <span>Deactivate / Close</span>
                                </DropdownMenuItem>
                              )}

                              {onDeleteStore && (
                                <>
                                  <DropdownMenuSeparator className="my-1 bg-slate-100 dark:bg-slate-800" />
                                  <DropdownMenuItem
                                    onClick={() => setStoreToDelete(s)}
                                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold cursor-pointer text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                  >
                                    <Trash2 size={14} />
                                    <span>Delete Store</span>
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Status Badges Row */}
                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                          <Badge variant={s.status === "ACTIVE" ? "success" : "destructive"}>
                            {s.status === "ACTIVE" ? (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block mr-1" />
                            ) : (
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block mr-1" />
                            )}
                            {s.status === "ACTIVE" ? "Active on Map" : "Inactive / Closed"}
                          </Badge>

                          <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center gap-1">
                            <MapPin size={11} className="text-pink-500" />
                            <span>{s.city}</span>
                          </span>

                          <span className="text-[11px] font-mono text-slate-400 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
                            {s.pincode}
                          </span>

                          {(() => {
                            const storeDeals = offers.filter(o =>
                              (o.applicableStoreIds && o.applicableStoreIds.includes(s.id)) ||
                              o.storeId === s.id ||
                              (!o.applicableStoreIds?.length && o.merchantId === s.merchantId)
                            );
                            const count = storeDeals.length;
                            return (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setStoreForOffer(s);
                                }}
                                className="text-[11px] font-bold text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 border border-purple-200/60 dark:border-purple-800 flex items-center gap-1 hover:bg-purple-100 transition-colors"
                                title="Manage live deals for this store"
                              >
                                <Tag size={11} className="text-purple-600" />
                                <span>{count > 0 ? `${count} Live ${count === 1 ? 'Deal' : 'Deals'}` : '+ Add Deal'}</span>
                              </button>
                            );
                          })()}
                        </div>

                        {/* Location Details & Address */}
                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2 text-xs">
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">Address</span>
                            <span className="text-slate-700 dark:text-slate-300 font-medium block mt-0.5">
                              {s.address}, {s.city}{s.state ? `, ${s.state}` : ""}
                            </span>
                          </div>

                          {/* Store Manager display */}
                          {(s.managerName || s.managerEmail || s.phone) && (
                            <div>
                              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">Store Manager</span>
                              <div className="mt-0.5 text-slate-700 dark:text-slate-300 font-medium space-y-0.5">
                                {s.managerName && (
                                  <div className="flex items-center gap-1.5">
                                    <UserCheck size={12} className="text-purple-500 shrink-0" />
                                    <span className="font-semibold truncate">{s.managerName}</span>
                                  </div>
                                )}
                                {s.managerEmail && (
                                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                                    <Mail size={11} className="text-slate-400 shrink-0" />
                                    <span className="truncate">{s.managerEmail}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                            <div>
                              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">Schedule</span>
                              <span className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1 mt-0.5">
                                <Clock size={11} className="text-slate-400 shrink-0" />
                                <span className="truncate">{s.operatingHours || "10:00 AM – 10:00 PM"}</span>
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">Geocode (GPS)</span>
                              <span className="font-mono text-purple-700 dark:text-purple-300 font-bold block mt-0.5">
                                {safeLat}, {safeLng}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Quick Action */}
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-400 truncate max-w-[150px] flex items-center gap-1">
                          {s.phone ? (
                            <>
                              <Phone size={11} className="text-slate-400 shrink-0" />
                              <span>{s.phone}</span>
                            </>
                          ) : (
                            "No phone listed"
                          )}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedStore(s)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-xs font-bold hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-colors"
                        >
                          <Compass size={13} className="text-purple-600 dark:text-purple-400" />
                          <span>View Outlet</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* Map Pin Right-Side Slide-Over Drawer */}
      {selectedStore && (
        <StorePinDrawer
          store={selectedStore}
          offers={offers}
          onCreateOffer={() => {
            const st = selectedStore;
            setSelectedStore(null);
            setStoreForOffer(st);
          }}
          onClose={() => setSelectedStore(null)}
          onApprove={() => {
            onApproveStore(selectedStore.id);
            setSelectedStore({ ...selectedStore, status: "ACTIVE" });
          }}
        />
      )}

      {/* Create Offer for Specific Store Slide-over Drawer */}
      {storeForOffer && (
        <OfferCampaignFormDrawer
          merchants={merchants}
          stores={stores}
          merchantId={storeForOffer.merchantId}
          merchantName={storeForOffer.merchantName || merchants.find(m => m.id === storeForOffer.merchantId)?.businessName || "Partner Brand"}
          initialData={{
            applicableStoreIds: [storeForOffer.id],
            storeId: storeForOffer.id,
            scopeType: "SERVICE",
            ctaText: "Book & Pay",
          } as any}
          onClose={() => setStoreForOffer(null)}
          onSave={(draft) => {
            if (onAddOffer) {
              onAddOffer({
                ...draft,
                merchantId: storeForOffer.merchantId,
                applicableStoreIds: [storeForOffer.id],
                storeId: storeForOffer.id,
              });
            }
            setStoreForOffer(null);
          }}
        />
      )}

      {/* Edit Store Branch Right-Side Slide-Over Drawer */}
      {storeToEdit && (
        <EditStoreDrawer
          store={storeToEdit}
          onClose={() => setStoreToEdit(null)}
          onSave={(updates) => {
            if (onUpdateStore) {
              onUpdateStore(storeToEdit.id, updates);
            }
            setStoreToEdit(null);
            toast.success(`Store branch "${updates.branchName || storeToEdit.branchName}" updated successfully!`);
          }}
        />
      )}

      {/* Add Store Branch Right-Side Slide-Over Drawer */}
      {isAddOpen && (
        <AddStoreDrawer
          merchants={merchants}
          onClose={() => setIsAddOpen(false)}
          onSave={(draft) => {
            onAddStore(draft);
            setIsAddOpen(false);
          }}
        />
      )}

      {/* Delete Store Confirmation Modal */}
      {storeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#121626] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Store Branch</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
              <p className="font-semibold text-slate-800 dark:text-slate-200">{storeToDelete.branchName}</p>
              <p className="text-slate-500">{storeToDelete.address}, {storeToDelete.city}</p>
              <p className="text-slate-400 text-[11px]">Brand: {storeToDelete.merchantName}</p>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              Removing this branch will delist it from the customer discovery map and invalidate associated local geofences.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStoreToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteStore) {
                    onDeleteStore(storeToDelete.id);
                  }
                  toast.success(`Store branch "${storeToDelete.branchName}" deleted`);
                  setStoreToDelete(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors shadow-sm"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Right-side Slide-over Drawer for Map Pin Details
function StorePinDrawer({
  store,
  offers = [],
  onCreateOffer,
  onClose,
  onApprove
}: {
  store: StoreType;
  offers?: Offer[];
  onCreateOffer?: () => void;
  onClose: () => void;
  onApprove: () => void;
}) {
  const [storeStaff, setStoreStaff] = useState<BackendStaffResponse[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [drawerDealsView, setDrawerDealsView] = useState<"list" | "cards">("cards");

  useEffect(() => {
    if (store.id) {
      setIsLoadingStaff(true);
      staffApi
        .getMerchantStaff("STORE", store.id)
        .then((res) => setStoreStaff(res))
        .catch(() => setStoreStaff([]))
        .finally(() => setIsLoadingStaff(false));
    }
  }, [store.id]);

  const assignedStaff = storeStaff[0];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <aside className="w-screen max-w-xl bg-white dark:bg-[#121626] shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
          {/* Header with vibrant gradient matching merchant drawer */}
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-amber-500/10 via-pink-500/10 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                  <StoreIcon size={20} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight truncate">
                    {store.branchName}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
                    <span className="font-mono font-semibold text-amber-700 dark:text-amber-300">
                      BID: #{store.id.substring(0, 8).toUpperCase()}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(store.id);
                        toast.success(`Store ID (${store.id}) copied!`);
                      }}
                      className="hover:text-amber-600 dark:hover:text-amber-400 text-slate-400 p-0.5 rounded transition-colors inline-flex items-center"
                      title="Copy Full Store UUID"
                    >
                      <Copy size={11} />
                    </button>
                    <span>·</span>
                    <span className="truncate max-w-[140px] text-purple-700 dark:text-purple-300 font-semibold">{store.merchantName}</span>
                    <span>·</span>
                    <span>{store.city}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={store.status === "ACTIVE" ? "success" : "warning"}>
                  {store.status === "ACTIVE" ? "Live on App" : "Inactive"}
                </Badge>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
            {/* Store Card Info */}
            <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-900/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                  Store Branch
                </span>
                <Badge variant={store.status === "ACTIVE" ? "success" : "warning"}>
                  {store.status === "ACTIVE" ? "Active on App" : "Needs Geocode Review"}
                </Badge>
              </div>
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white font-['Manrope']">
                {store.branchName}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {store.address}, {store.city} - {store.pincode}
              </p>
              <div className="pt-2 border-t border-purple-200/50 dark:border-purple-900/50 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Merchant Brand:</span>
                <span className="font-bold text-purple-700 dark:text-purple-300">{store.merchantName}</span>
              </div>
            </div>

            {/* Coordinate Inspector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 text-xs">
                  <Layers size={13} className="text-purple-600" />
                  <span>Verified GPS Geocoordinates</span>
                </label>
                <a
                  href={`https://www.google.com/maps?q=${store.latitude},${store.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-bold text-pink-600 dark:text-pink-400 hover:underline flex items-center gap-1"
                >
                  <span>Open in Google Maps</span>
                  <ExternalLink size={11} />
                </a>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Latitude</span>
                  <p className="font-mono text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                    {store.latitude.toFixed(6)}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Longitude</span>
                  <p className="font-mono text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                    {store.longitude.toFixed(6)}
                  </p>
                </div>
              </div>
            </div>

            {/* Real Interactive Leaflet Geocode Map */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Compass size={13} className="text-pink-600" />
                  <span>Interactive Map Preview</span>
                </span>
                <span className="text-[11px] font-mono text-purple-600 dark:text-purple-400">
                  {store.city}, {store.state || "Maharashtra"}
                </span>
              </div>
              <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-xs">
                <StoreLocationPicker
                  latitude={store.latitude}
                  longitude={store.longitude}
                  city={store.city}
                  state={store.state}
                  storeName={store.branchName}
                  height="220px"
                  onChange={() => {}}
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
                Pinpoint location for proximity discovery and geofenced customer deal delivery
              </p>
            </div>

            {/* Timings & Specs */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Operating Schedule:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{store.operatingHours}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Internal Branch ID:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-semibold text-amber-700 dark:text-amber-400">
                    BID: #{store.id.substring(0, 8).toUpperCase()}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(store.id);
                      toast.success(`Copied Store ID: ${store.id}`);
                    }}
                    className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                    title={`Copy full UUID: ${store.id}`}
                  >
                    <Copy size={12} />
                  </button>
                </div>
              </div>
            </div>

            {/* Store Branch Manager & Access Credentials Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-white dark:from-indigo-950/30 dark:via-purple-950/20 dark:to-[#121626] border border-indigo-200/80 dark:border-indigo-900/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center">
                    <UserCheck size={15} />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white text-xs block">
                      Branch Manager & Credentials
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Merchant & Branch Terminal Portal Access
                    </span>
                  </div>
                </div>
                {assignedStaff ? (
                  <Badge variant={assignedStaff.status === "ACTIVE" ? "success" : "warning"}>
                    {assignedStaff.status === "ACTIVE" ? "Active Manager" : "Invite Pending"}
                  </Badge>
                ) : store.managerEmail ? (
                  <Badge variant="warning">Invite Dispatched</Badge>
                ) : (
                  <Badge variant="secondary">Unassigned</Badge>
                )}
              </div>

              {assignedStaff || store.managerName || store.managerEmail ? (
                <div className="space-y-2 pt-1 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 text-[11px]">Manager Name:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {assignedStaff?.name || store.managerName || "Designated Store Manager"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 text-[11px] flex items-center gap-1">
                      <Mail size={12} className="text-slate-400" />
                      <span>Work Email:</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                        {assignedStaff?.email || store.managerEmail || store.storeEmail}
                      </span>
                      {(assignedStaff?.email || store.managerEmail || store.storeEmail) && (
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              assignedStaff?.email || store.managerEmail || store.storeEmail || ""
                            );
                            toast.success("Manager email copied!");
                          }}
                          className="p-1 rounded text-slate-400 hover:text-indigo-600 transition-colors"
                          title="Copy Email"
                        >
                          <Copy size={11} />
                        </button>
                      )}
                    </div>
                  </div>

                  {(assignedStaff?.phone || store.managerPhone || store.phone) && (
                    <div className="flex items-center justify-between p-2 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500 text-[11px]">Contact Phone:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {assignedStaff?.phone || store.managerPhone || store.phone}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-2 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 text-[11px]">Assigned Scope & Role:</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {assignedStaff?.roleName || "Store Manager (STORE_MANAGER)"}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/60 dark:border-indigo-900/40 text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-2">
                    <ShieldCheck size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                    <span>
                      Store Managers can sign in directly via the Merchant Portal. Their authenticated session is scoped exclusively to this branch outlet and POS desk.
                    </span>
                  </div>

                  {assignedStaff && assignedStaff.status === "INVITED" && (
                    <div className="pt-1">
                      <button
                        type="button"
                        disabled={isResending}
                        onClick={async () => {
                          setIsResending(true);
                          try {
                            await staffApi.resendMerchantStaffInvite(assignedStaff.id);
                            toast.success(`Invitation email resent to ${assignedStaff.email}!`);
                          } catch (err: any) {
                            toast.error(err?.response?.data?.message || "Failed to resend invitation email");
                          } finally {
                            setIsResending(false);
                          }
                        }}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold text-xs hover:bg-indigo-100 transition-colors"
                      >
                        <Send size={12} />
                        <span>{isResending ? "Dispatching..." : "Resend Password Setup Email"}</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic">
                  No manager has been designated yet for this branch. You can invite one from the Staff Management section.
                </p>
              )}
            </div>

            {/* Store Amenities, Menu & Photos in Admin Pin Drawer */}
            {((store.amenities && store.amenities.length > 0) || (store.menuImages && store.menuImages.length > 0) || (store.photos && store.photos.length > 0)) && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 space-y-3 text-xs">
                {store.amenities && store.amenities.length > 0 && (
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs mb-1.5 flex items-center justify-between">
                      <span>Store Amenities</span>
                      <span className="text-[10px] text-emerald-600 font-semibold">{store.amenities.length} active</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {store.amenities.map((am, i) => (
                        <span key={i} className="text-[11px] px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium">
                          {am}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {store.menuImages && store.menuImages.length > 0 && (
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs mb-1.5 flex items-center justify-between">
                      <span>Menu Card Pages</span>
                      <span className="text-[10px] text-amber-600 font-semibold">{store.menuImages.length} pages</span>
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {store.menuImages.map((img, i) => (
                        <a key={i} href={img} target="_blank" rel="noopener noreferrer" className="relative rounded-xl overflow-hidden aspect-3/4 border border-slate-200 dark:border-slate-700 shadow-xs group">
                          <img src={img} alt={`Menu ${i+1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-bold text-white">
                            Page {i+1}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {store.photos && store.photos.length > 0 && (
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs mb-1.5 flex items-center justify-between">
                      <span>Ambience & Facility Photos</span>
                      <span className="text-[10px] text-purple-600 font-semibold">{store.photos.length} photos</span>
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {store.photos.map((img, i) => (
                        <a key={i} href={img} target="_blank" rel="noopener noreferrer" className="relative rounded-xl overflow-hidden aspect-video border border-slate-200 dark:border-slate-700 shadow-xs group">
                          <img src={img} alt={`Photo ${i+1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Active Promotional Offers & Mobile App Deals Section */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50/70 via-pink-50/40 to-white dark:from-purple-950/30 dark:via-pink-950/20 dark:to-[#121626] border border-purple-200/80 dark:border-purple-900/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                    <Tag size={15} />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white text-xs block">
                      Promotional Offers & Mobile Deals
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Discounts, Cashback & Product Bargains Live in App
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-white/70 dark:bg-slate-900/60 p-0.5 rounded-lg border border-purple-200/60 dark:border-purple-800/60">
                    <button
                      type="button"
                      onClick={() => setDrawerDealsView("cards")}
                      className={cn(
                        "p-1 rounded text-xs transition-colors cursor-pointer",
                        drawerDealsView === "cards"
                          ? "bg-purple-600 text-white font-bold shadow-2xs"
                          : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
                      )}
                      title="Cards View"
                    >
                      <LayoutGrid size={11} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDrawerDealsView("list")}
                      className={cn(
                        "p-1 rounded text-xs transition-colors cursor-pointer",
                        drawerDealsView === "list"
                          ? "bg-purple-600 text-white font-bold shadow-2xs"
                          : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
                      )}
                      title="List View"
                    >
                      <List size={11} />
                    </button>
                  </div>
                  {onCreateOffer && (
                    <button
                      type="button"
                      onClick={onCreateOffer}
                      className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={12} />
                      <span>Create Deal</span>
                    </button>
                  )}
                </div>
              </div>

              {(() => {
                const storeDeals = offers.filter(o =>
                  (o.applicableStoreIds && o.applicableStoreIds.includes(store.id)) ||
                  o.storeId === store.id ||
                  (!o.applicableStoreIds?.length && o.merchantId === store.merchantId)
                );

                if (storeDeals.length === 0) {
                  return (
                    <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-900/40 border border-dashed border-purple-200 dark:border-purple-900/60 text-center space-y-2">
                      <p className="text-xs text-slate-500">No active offers or product deals for this outlet.</p>
                      {onCreateOffer && (
                        <button
                          type="button"
                          onClick={onCreateOffer}
                          className="text-xs font-bold text-purple-600 hover:text-purple-700 underline"
                        >
                          + Launch First Deal (Service or Product)
                        </button>
                      )}
                    </div>
                  );
                }

                return drawerDealsView === "cards" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 max-h-56 overflow-y-auto">
                    {storeDeals.map((deal) => (
                      <div
                        key={deal.id}
                        className="p-3 rounded-xl bg-white dark:bg-slate-900/90 border border-purple-100 dark:border-purple-900/40 shadow-2xs flex flex-col justify-between space-y-2 hover:border-purple-300 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                              {deal.scopeType === "PRODUCT" ? "Retail Deal" : "Service Offer"}
                            </span>
                            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                              Live
                            </span>
                          </div>
                          <h5 className="font-bold text-slate-900 dark:text-white text-xs line-clamp-1">
                            {deal.title}
                          </h5>
                          <p className="text-[10px] text-slate-500 line-clamp-1">
                            {deal.tagline || (deal.scopeType === "PRODUCT" ? "Direct outlet deal" : "App bill discount")}
                          </p>
                        </div>
                        <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-baseline justify-between text-[11px]">
                          <span className="font-extrabold text-pink-600 dark:text-pink-400 font-mono">
                            {deal.scopeType === "PRODUCT" && deal.dealPrice
                              ? `₹${deal.dealPrice}`
                              : deal.type === "FLAT_PCT"
                              ? `${deal.value}% OFF`
                              : `₹${deal.value} FLAT`}
                          </span>
                          {deal.bonusCoins && (
                            <span className="text-[10px] text-amber-600 font-bold">
                              +{deal.bonusCoins} Coins
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2 pt-1 max-h-48 overflow-y-auto">
                    {storeDeals.map((deal) => (
                      <div
                        key={deal.id}
                        className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-900/80 border border-purple-100 dark:border-purple-900/40 flex items-center justify-between gap-2 shadow-2xs"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                              {deal.scopeType === "PRODUCT" ? "Retail Deal" : "Service Offer"}
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white text-xs truncate">
                              {deal.title}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 truncate mt-0.5">
                            {deal.type === "FLAT_PCT" ? `${deal.value}% OFF` : `₹${deal.value} FLAT`} • {deal.badgeText || "Mobile Special"}
                            {deal.dealPrice ? ` • Deal Price ₹${deal.dealPrice}` : ""}
                          </p>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md shrink-0">
                          Live
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Drawer Footer */}
          <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-3">
            {store.status !== "ACTIVE" ? (
              <button
                onClick={onApprove}
                className="btn-gradient flex-1 py-2.5 rounded-xl text-white font-bold text-xs shadow-md"
              >
                Approve & Publish to Map
              </button>
            ) : (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 size={14} /> Published Live on Discovery
              </span>
            )}
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

// Right-side Slide-over Drawer for Adding a Store Branch
function AddStoreDrawer({
  merchants,
  onClose,
  onSave
}: {
  merchants: Merchant[];
  onClose: () => void;
  onSave: (draft: any) => void;
}) {
  const [merchantId, setMerchantId] = useState(merchants[0]?.id || "");
  const [branchName, setBranchName] = useState("");
  const [address, setAddress] = useState("");
  const [state, setState] = useState("Maharashtra");
  const [district, setDistrict] = useState("Nagpur");
  const [city, setCity] = useState("Nagpur");
  const [pincode, setPincode] = useState("440010");
  const [latitude, setLatitude] = useState(21.1458);
  const [longitude, setLongitude] = useState(79.0882);
  const [operatingHours, setOperatingHours] = useState("11:00 AM – 11:00 PM");
  const [managerName, setManagerName] = useState("");
  const [managerEmail, setManagerEmail] = useState("");
  const [managerPhone, setManagerPhone] = useState("");
  const [managerEmailNotice, setManagerEmailNotice] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [menuImages, setMenuImages] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [amenities, setAmenities] = useState<string[]>([]);

  const selectedMerchant = merchants.find(m => m.id === merchantId);

  const handleAutoFillFromMerchant = () => {
    let target = selectedMerchant;
    if (!target && merchants.length > 0) {
      target = merchants[0];
      setMerchantId(target.id);
    }
    if (!target) {
      toast.error("Please add or select a parent merchant brand first.");
      return;
    }

    // Auto-generate realistic branch title based on merchant brand & city
    const brand = target.businessName || "Flagship Outlet";
    const mCity = target.city || "Nagpur";
    const mDistrict = target.district || mCity;
    const mState = target.state || "Maharashtra";
    const mPincode = target.pincode || "440010";
    const mAddress = target.address || `West High Court Road, ${mCity} Central`;

    // Coordinates lookup for major cities
    let lat = 21.1458;
    let lng = 79.0882;
    const cityLower = mCity.toLowerCase();
    if (cityLower.includes("mumbai")) {
      lat = 19.0760;
      lng = 72.8777;
    } else if (cityLower.includes("pune")) {
      lat = 18.5204;
      lng = 73.8567;
    } else if (cityLower.includes("delhi")) {
      lat = 28.6139;
      lng = 77.2090;
    } else if (cityLower.includes("bengaluru") || cityLower.includes("bangalore")) {
      lat = 12.9716;
      lng = 77.5946;
    } else if (cityLower.includes("hyderabad")) {
      lat = 17.3850;
      lng = 78.4867;
    }

    const mgrFirstName = brand.split(" ")[0] || "Branch";
    const safeBrand = brand.toLowerCase().replace(/[^a-z0-9]/g, "") || "retail";
    const safeCity = mCity.toLowerCase().replace(/[^a-z0-9]/g, "") || "central";

    setBranchName(`${brand} – ${mCity} Flagship`);
    setAddress(mAddress);
    setState(mState);
    setDistrict(mDistrict);
    setCity(mCity);
    setPincode(mPincode);
    setLatitude(lat);
    setLongitude(lng);
    setOperatingHours("10:00 AM – 10:00 PM");
    if (menuImages.length === 0) {
      setMenuImages([
        "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80"
      ]);
    }
    if (photos.length === 0) {
      setPhotos([
        "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80"
      ]);
    }
    if (amenities.length === 0) {
      setAmenities(["Air Conditioned", "Free High-Speed Wi-Fi", "Cards & UPI Accepted", "Valet Parking"]);
    }
    setManagerName(`${mgrFirstName} Store Manager`);
    setManagerEmail(`${mgrFirstName.toLowerCase()}.${safeCity}@${safeBrand}.com`);
    setManagerPhone(target.ownerPhone || "9822100000");
    setErrors({});

    toast.success(`Auto-filled branch details & manager credentials from "${brand}"!`, {
      description: `Mapped to ${mCity}, ${mState} (${mPincode})`
    });
  };

  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleManagerEmailBlur = async () => {
    const email = managerEmail.trim().toLowerCase();
    if (!email) {
      setManagerEmailNotice(null);
      return;
    }
    try {
      const res = await staffApi.validateStaffEmail(email, merchantId, "STORE");
      if (!res.valid && res.message) {
        setErrors(prev => ({ ...prev, managerEmail: res.message! }));
        setManagerEmailNotice(null);
      } else {
        clearError("managerEmail");
        if ((res as any).notice) {
          setManagerEmailNotice((res as any).notice);
        } else {
          setManagerEmailNotice(null);
        }
      }
    } catch {
      // ignore on blur
    }
  };

  const handleManagerPhoneBlur = async () => {
    const phone = managerPhone.trim();
    if (!phone) return;
    try {
      const res = await storeApi.validateStorePhone(phone, merchantId, undefined, managerEmail.trim());
      if (!res.valid && res.message) {
        setErrors(prev => ({ ...prev, managerPhone: res.message! }));
      } else {
        clearError("managerPhone");
      }
    } catch {
      // ignore on blur
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = storeBranchSchema.safeParse({
      merchantId,
      branchName: branchName.trim(),
      address: address.trim(),
      state: state.trim(),
      district: district.trim(),
      city: city.trim(),
      pincode: pincode.trim(),
      latitude: Number(latitude),
      longitude: Number(longitude),
      operatingHours: operatingHours.trim(),
      managerName: managerName.trim(),
      managerEmail: managerEmail.trim(),
      managerPhone: managerPhone.trim(),
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach(issue => {
        const key = issue.path[0] as string;
        if (!fieldErrors[key]) {
          fieldErrors[key] = issue.message;
        }
      });
      setErrors(fieldErrors);
      toast.error(result.error.issues[0]?.message || "Please fix validation errors");
      return;
    }

    try {
      setIsSubmitting(true);

      // Backend enterprise verification
      if (managerEmail.trim()) {
        try {
          const valRes = await staffApi.validateStaffEmail(managerEmail.trim(), merchantId, "STORE");
          if (!valRes.valid && valRes.message) {
            setErrors(prev => ({ ...prev, managerEmail: valRes.message! }));
            toast.error(valRes.message);
            setIsSubmitting(false);
            return;
          }
        } catch (valErr: any) {
          const valMsg = valErr?.response?.data?.message || valErr?.message;
          if (valMsg && valMsg.includes("another merchant")) {
            setErrors(prev => ({ ...prev, managerEmail: valMsg }));
            toast.error(valMsg);
            setIsSubmitting(false);
            return;
          }
        }
      }

      // Backend enterprise verification for manager mobile
      if (managerPhone.trim()) {
        try {
          const phoneRes = await storeApi.validateStorePhone(managerPhone.trim(), merchantId, undefined, managerEmail.trim());
          if (!phoneRes.valid && phoneRes.message) {
            setErrors(prev => ({ ...prev, managerPhone: phoneRes.message! }));
            toast.error(phoneRes.message);
            setIsSubmitting(false);
            return;
          }
        } catch (valErr: any) {
          const valMsg = valErr?.response?.data?.message || valErr?.message;
          if (valMsg) {
            setErrors(prev => ({ ...prev, managerPhone: valMsg }));
            toast.error(valMsg);
            setIsSubmitting(false);
            return;
          }
        }
      }

      setErrors({});
      await onSave({
        merchantId,
        merchantName: selectedMerchant?.businessName || "Unknown Brand",
        branchName: branchName.trim(),
        address: address.trim(),
        state: state.trim(),
        district: district.trim(),
        city: city.trim(),
        pincode: pincode.trim(),
        latitude: Number(latitude),
        longitude: Number(longitude),
        operatingHours: operatingHours.trim(),
        managerName: managerName.trim(),
        managerEmail: managerEmail.trim(),
        managerPhone: managerPhone.trim(),
        menuImages,
        photos,
        amenities,
        status: "ACTIVE"
      });
      toast.success(`Store branch "${branchName}" registered successfully!`);
      onClose();
    } catch (saveErr: any) {
      const errMsg = saveErr?.response?.data?.message || saveErr?.message || "Failed to register store branch";
      if (errMsg.toLowerCase().includes("email") || errMsg.toLowerCase().includes("merchant owner")) {
        setErrors(prev => ({ ...prev, managerEmail: errMsg }));
      }
      if (errMsg.toLowerCase().includes("phone") || errMsg.toLowerCase().includes("mobile") || errMsg.toLowerCase().includes("number")) {
        setErrors(prev => ({ ...prev, managerPhone: errMsg }));
      }
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <aside className="w-screen max-w-xl bg-white dark:bg-[#121626] shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-amber-500/10 via-pink-500/10 to-transparent gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                <StoreIcon size={20} />
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight truncate">
                  Add Store Branch
                </h3>
                <p className="text-xs text-slate-400 truncate mt-0.5">Deploy physical outlet to merchant network</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handleAutoFillFromMerchant}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-xs font-bold hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-colors shadow-2xs whitespace-nowrap"
                title="Auto Fill from Selected Merchant Details"
              >
                <Sparkles size={14} className="text-purple-600 dark:text-purple-400" />
                <span>Auto Fill Details</span>
              </button>
              <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors" title="Close drawer">
                <X size={20} />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">Parent Merchant Brand *</label>
              <select
                value={merchantId}
                onChange={e => {
                  setMerchantId(e.target.value);
                  clearError("merchantId");
                }}
                className={cn(
                  "mt-1 w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white",
                  errors.merchantId ? "border-rose-500 ring-1 ring-rose-500/20" : "border-slate-200 dark:border-slate-700"
                )}
              >
                {merchants.map(m => (
                  <option key={m.id} value={m.id}>{m.businessName} ({m.city})</option>
                ))}
              </select>
              {errors.merchantId && (
                <p className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} className="shrink-0" />
                  <span>{errors.merchantId}</span>
                </p>
              )}
              {selectedMerchant && (
                <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
                  <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-semibold border border-purple-200/50 dark:border-purple-800/40">
                    Category: {selectedMerchant.categoryName}
                  </span>
                  {selectedMerchant.commissionRate !== undefined && (
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                      Take-Rate: {selectedMerchant.commissionRate}%
                    </span>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">Branch Name *</label>
              <input
                type="text"
                value={branchName}
                onChange={e => {
                  setBranchName(e.target.value);
                  clearError("branchName");
                }}
                placeholder="e.g. Sadar Flagship Outlet"
                className={cn(
                  "mt-1 w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-hidden",
                  errors.branchName ? "border-rose-500 ring-1 ring-rose-500/20" : "border-slate-200 dark:border-slate-700 focus:border-purple-500"
                )}
              />
              {errors.branchName && (
                <p className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} className="shrink-0" />
                  <span>{errors.branchName}</span>
                </p>
              )}
            </div>

            {/* Pre-populated Indian Address Fields (State, District, City, Address, Pincode) */}
            <IndiaAddressFields
              state={state}
              district={district}
              city={city}
              pincode={pincode}
              address={address}
              errors={errors}
              onStateChange={(val) => {
                setState(val);
                clearError("state");
              }}
              onDistrictChange={(val) => {
                setDistrict(val);
                clearError("district");
              }}
              onCityChange={(val) => {
                setCity(val);
                clearError("city");
              }}
              onPincodeChange={(val) => {
                setPincode(val);
                clearError("pincode");
              }}
              onAddressChange={(val) => {
                setAddress(val);
                clearError("address");
              }}
            />

            {/* Interactive Location Map Picker */}
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center justify-between text-xs">
                <span>Pinpoint Store Location on Map *</span>
                <span className="text-[11px] font-normal text-purple-600 dark:text-purple-400">Click map or drag pin</span>
              </label>
              <StoreLocationPicker
                latitude={latitude}
                longitude={longitude}
                city={city}
                state={state}
                storeName={branchName || "Store Location"}
                onChange={(newLat, newLng, locationHint) => {
                  setLatitude(newLat);
                  setLongitude(newLng);
                  clearError("latitude");
                  clearError("longitude");
                  if (locationHint) {
                    if (locationHint.state) {
                      setState(locationHint.state);
                      clearError("state");
                    }
                    if (locationHint.district) {
                      setDistrict(locationHint.district);
                      clearError("district");
                    }
                    if (locationHint.city) {
                      setCity(locationHint.city);
                      clearError("city");
                    }
                    if (locationHint.pincode) {
                      setPincode(locationHint.pincode);
                      clearError("pincode");
                    }
                    if (locationHint.formattedAddress && !address) {
                      setAddress(locationHint.formattedAddress.split(",").slice(0, 3).join(","));
                      clearError("address");
                    }
                  }
                }}
                height="220px"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Latitude (-90 to 90) *</label>
                <input
                  type="number"
                  step="0.0001"
                  value={latitude}
                  onChange={e => {
                    setLatitude(parseFloat(e.target.value) || 0);
                    clearError("latitude");
                  }}
                  className={cn(
                    "mt-1 w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-mono focus:outline-hidden",
                    errors.latitude ? "border-rose-500 ring-1 ring-rose-500/20" : "border-slate-200 dark:border-slate-700 focus:border-purple-500"
                  )}
                />
                {errors.latitude && (
                  <p className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} className="shrink-0" />
                    <span>{errors.latitude}</span>
                  </p>
                )}
              </div>
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Longitude (-180 to 180) *</label>
                <input
                  type="number"
                  step="0.0001"
                  value={longitude}
                  onChange={e => {
                    setLongitude(parseFloat(e.target.value) || 0);
                    clearError("longitude");
                  }}
                  className={cn(
                    "mt-1 w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-mono focus:outline-hidden",
                    errors.longitude ? "border-rose-500 ring-1 ring-rose-500/20" : "border-slate-200 dark:border-slate-700 focus:border-purple-500"
                  )}
                />
                {errors.longitude && (
                  <p className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} className="shrink-0" />
                    <span>{errors.longitude}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Standardized Operating Hours & Schedule Selector */}
            <StoreScheduleSelector
              value={operatingHours}
              onChange={(val) => setOperatingHours(val)}
            />

            {/* Store Menu Cards, Ambience Photos & Amenities */}
            <StoreMediaAndAmenitiesSection
              menuImages={menuImages}
              photos={photos}
              amenities={amenities}
              onMenuImagesChange={setMenuImages}
              onPhotosChange={setPhotos}
              onAmenitiesChange={setAmenities}
              categoryHint={selectedMerchant?.categoryName || "Dining"}
            />

            {/* Store Branch Manager & Login Access Credentials */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-white dark:from-indigo-950/30 dark:via-purple-950/20 dark:to-[#121626] border border-indigo-200/80 dark:border-indigo-900/60 space-y-3.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0">
                  <UserCheck size={16} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                    Store Manager & Access Credentials
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Provisions branch manager with Merchant Portal & POS terminal login access
                  </p>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-100/80 dark:border-indigo-900/40 flex items-start gap-2 text-[11px] text-indigo-900 dark:text-indigo-200">
                <Mail size={13} className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <span>
                  A secure 1-time password setup link (<span className="font-mono text-[10px] bg-white/70 dark:bg-slate-900/60 px-1 py-0.5 rounded">/accept-invite?token=...</span>) will be automatically emailed to this manager.
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Manager Full Name</label>
                <input
                  type="text"
                  value={managerName}
                  onChange={e => {
                    setManagerName(e.target.value);
                    clearError("managerName");
                  }}
                  placeholder="e.g. Rajesh Sharma"
                  className={cn(
                    "mt-1 w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-hidden",
                    errors.managerName ? "border-rose-500 ring-1 ring-rose-500/20" : "border-slate-200 dark:border-slate-700 focus:border-indigo-500"
                  )}
                />
                {errors.managerName && (
                  <p className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} className="shrink-0" />
                    <span>{errors.managerName}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Manager Work Email</span>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">Login Identifier</span>
                </label>
                <input
                  type="email"
                  value={managerEmail}
                  onChange={e => {
                    setManagerEmail(e.target.value);
                    clearError("managerEmail");
                  }}
                  onBlur={handleManagerEmailBlur}
                  placeholder="e.g. rajesh.store@brand.com"
                  className={cn(
                    "mt-1 w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-hidden",
                    errors.managerEmail ? "border-amber-500 ring-1 ring-amber-500/20" : "border-slate-200 dark:border-slate-700 focus:border-indigo-500"
                  )}
                />
                {errors.managerEmail && (
                  <div className="p-3 rounded-xl bg-rose-50/90 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-[12px] text-rose-900 dark:text-rose-200 flex items-start gap-2.5 mt-2 shadow-xs animate-in fade-in">
                    <AlertCircle size={15} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    <div className="leading-relaxed font-medium">
                      {errors.managerEmail}
                    </div>
                  </div>
                )}
                {!errors.managerEmail && managerEmailNotice && (
                  <div className="p-2.5 rounded-xl bg-indigo-50/90 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-[12px] text-indigo-900 dark:text-indigo-200 flex items-start gap-2 mt-2 shadow-xs animate-in fade-in">
                    <CheckCircle2 size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                    <div className="leading-relaxed font-medium">
                      {managerEmailNotice}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Manager Mobile</label>
                <input
                  type="tel"
                  value={managerPhone}
                  onChange={e => {
                    setManagerPhone(e.target.value);
                    clearError("managerPhone");
                  }}
                  onBlur={handleManagerPhoneBlur}
                  placeholder="9822100000"
                  className={cn(
                    "mt-1 w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-mono focus:outline-hidden",
                    errors.managerPhone ? "border-rose-500 ring-1 ring-rose-500/20" : "border-slate-200 dark:border-slate-700 focus:border-indigo-500"
                  )}
                />
                {errors.managerPhone && (
                  <p className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} className="shrink-0" />
                    <span>{errors.managerPhone}</span>
                  </p>
                )}
              </div>

              <div className="pt-1 text-[10px] text-slate-400 flex items-center gap-1">
                <KeyRound size={11} className="text-indigo-500" />
                <span>Store Manager can sign in using Merchant Login directly upon setting password.</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-gradient px-4 py-2 rounded-xl text-white text-xs font-bold shadow-md disabled:opacity-60 flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verifying & Saving...</span>
                  </>
                ) : (
                  <span>Save Branch</span>
                )}
              </button>
            </div>
          </form>
        </aside>
      </div>
    </div>
  );
}

// Right-side Slide-over Drawer for Editing Existing Store Branch
function EditStoreDrawer({
  store,
  onClose,
  onSave
}: {
  store: StoreType;
  onClose: () => void;
  onSave: (updates: Partial<StoreType>) => void;
}) {
  const [branchName, setBranchName] = useState(store.branchName || "");
  const [phone, setPhone] = useState(store.phone || "");
  const [address, setAddress] = useState(store.address || "");
  const [state, setState] = useState(store.state || "Maharashtra");
  const [district, setDistrict] = useState(store.district || "Nagpur");
  const [city, setCity] = useState(store.city || "Nagpur");
  const [pincode, setPincode] = useState(store.pincode || "440010");
  const [latitude, setLatitude] = useState(store.latitude || 21.1458);
  const [longitude, setLongitude] = useState(store.longitude || 79.0882);
  const [operatingHours, setOperatingHours] = useState(store.operatingHours || "09:00 AM – 10:00 PM (Daily)");
  const [status, setStatus] = useState<StoreType["status"]>(store.status || "ACTIVE");
  const [menuImages, setMenuImages] = useState<string[]>(store.menuImages || []);
  const [photos, setPhotos] = useState<string[]>(store.photos || []);
  const [amenities, setAmenities] = useState<string[]>(store.amenities || []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      branchName: branchName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      state: state.trim(),
      district: district.trim(),
      city: city.trim(),
      pincode: pincode.trim(),
      latitude: Number(latitude),
      longitude: Number(longitude),
      operatingHours: operatingHours.trim(),
      status,
      menuImages,
      photos,
      amenities
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <aside className="w-screen max-w-xl bg-white dark:bg-[#121626] shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-amber-500/10 via-pink-500/10 to-transparent gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                <Pencil size={18} />
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight truncate">Edit Store Branch</h3>
                <p className="text-xs text-slate-400 truncate mt-0.5">Update branch details, phone & schedule</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors" title="Close drawer">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Branch Name *</label>
              <input
                type="text"
                required
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Store Map Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as StoreType["status"])}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
                >
                  <option value="ACTIVE">Active on Map</option>
                  <option value="INACTIVE">Inactive / Closed</option>
                  <option value="PENDING_APPROVAL">Pending Approval</option>
                </select>
              </div>
            </div>

            {/* Standardized Operating Hours & Schedule Selector */}
            <StoreScheduleSelector
              value={operatingHours}
              onChange={(newSchedule) => setOperatingHours(newSchedule)}
            />

            {/* Pre-populated Indian Address Fields */}
            <IndiaAddressFields
              state={state}
              district={district}
              city={city}
              pincode={pincode}
              address={address}
              onStateChange={setState}
              onDistrictChange={setDistrict}
              onCityChange={setCity}
              onPincodeChange={setPincode}
              onAddressChange={setAddress}
            />

            {/* Location Map Picker */}
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1 text-xs">Pinpoint Location on Map *</label>
              <StoreLocationPicker
                latitude={latitude}
                longitude={longitude}
                city={city}
                state={state}
                storeName={branchName}
                height="180px"
                onChange={(lat, lng) => {
                  setLatitude(lat);
                  setLongitude(lng);
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Latitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={latitude}
                  onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Longitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={longitude}
                  onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Store Menu Cards, Ambience Photos & Amenities */}
            <StoreMediaAndAmenitiesSection
              menuImages={menuImages}
              photos={photos}
              amenities={amenities}
              onMenuImagesChange={setMenuImages}
              onPhotosChange={setPhotos}
              onAmenitiesChange={setAmenities}
              categoryHint="Dining"
            />

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
                Cancel
              </button>
              <button type="submit" className="btn-gradient px-4 py-2 rounded-xl text-white text-xs font-bold shadow-md">
                Save Store Changes
              </button>
            </div>
          </form>
        </aside>
      </div>
    </div>
  );
}
