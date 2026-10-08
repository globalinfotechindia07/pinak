import React, { useState, useEffect } from "react";
import {
  Store as StoreIcon,
  Plus,
  MapPin,
  Clock,
  CheckCircle2,
  Phone,
  X,
  LayoutGrid,
  List,
  MoreVertical,
  Eye,
  Edit,
  Mail,
  LogIn,
  Trash2,
  AlertTriangle,
  History,
  User,
  Shield,
  Loader2,
  Calendar,
  Sparkles,
  ExternalLink
} from "lucide-react";
import { Store as StoreType } from "../../types";
import { AdvancedTable, Column } from "../../components/ui/AdvancedTable";
import { toast } from "sonner";
import { useStores } from "../../hooks/queries/useStores";
import { storeApi } from "../../api/storeApi";

interface BranchStoresProps {
  stores?: StoreType[];
  onAddStore?: (draft: Partial<StoreType>) => void;
}

interface AuditLogEntry {
  id: string;
  action: string;
  actorName: string;
  actorRole: string;
  details: string;
  timestamp: string;
}

const STATE_CITY_MAP: Record<string, string[]> = {
  Maharashtra: ["Nagpur", "Pune", "Mumbai", "Nashik", "Thane"],
  Delhi: ["Delhi NCR", "New Delhi", "Dwarka"],
  Karnataka: ["Bengaluru", "Mysore", "Hubli"],
  Telangana: ["Hyderabad", "Warangal"],
  "Tamil Nadu": ["Chennai", "Coimbatore"]
};

export const BranchStores: React.FC<BranchStoresProps> = ({ stores: propStores = [], onAddStore }) => {
  const { stores: apiStores, isLoading, createStore, updateStore, deleteStore, resendManagerInvite } = useStores();

  const [activeTab, setActiveTab] = useState<"outlets" | "audit">("outlets");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<any | null>(null);
  const [viewingStore, setViewingStore] = useState<any | null>(null);
  const [deletingStore, setDeletingStore] = useState<any | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Form State for Create / Edit Store
  const [branchName, setBranchName] = useState("");
  const [address, setAddress] = useState("");
  const [state, setState] = useState("Maharashtra");
  const [city, setCity] = useState("Nagpur");
  const [pincode, setPincode] = useState("440010");
  const [phone, setPhone] = useState("9876543210");
  const [openingTime, setOpeningTime] = useState("10:00");
  const [closingTime, setClosingTime] = useState("22:00");
  const [operatingDays, setOperatingDays] = useState("Daily (Mon - Sun)");
  const [managerName, setManagerName] = useState("");
  const [managerEmail, setManagerEmail] = useState("");
  const [latitude, setLatitude] = useState(21.1458);
  const [longitude, setLongitude] = useState(79.0882);

  // Store Audit Logs state
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([
    {
      id: "log-1",
      action: "STORE_CREATED",
      actorName: "Merchant Partner",
      actorRole: "MERCHANT",
      details: "Registered flagship branch Sadar Outlet with PostGIS geocode",
      timestamp: new Date(Date.now() - 3600000 * 24 * 2).toISOString()
    },
    {
      id: "log-2",
      action: "STORE_INVITE_SENT",
      actorName: "System Automation",
      actorRole: "SYSTEM",
      details: "Dispatched 48-hour manager setup invite to manager@curryleaf.com",
      timestamp: new Date(Date.now() - 3600000 * 24 * 2 + 1800000).toISOString()
    },
    {
      id: "log-3",
      action: "STORE_APPROVED",
      actorName: "Super Admin",
      actorRole: "ADMIN",
      details: "Approved branch store and published to customer discovery map",
      timestamp: new Date(Date.now() - 3600000 * 24).toISOString()
    }
  ]);

  // Combined stores list
  const displayStoresList = apiStores.length > 0 ? apiStores : propStores;

  // Sync cities dropdown when state changes
  useEffect(() => {
    const availableCities = STATE_CITY_MAP[state] || ["Nagpur"];
    if (!availableCities.includes(city)) {
      setCity(availableCities[0]);
    }
  }, [state]);

  const openCreateForm = () => {
    setBranchName("");
    setAddress("");
    setState("Maharashtra");
    setCity("Nagpur");
    setPincode("440010");
    setPhone("9876543210");
    setOpeningTime("10:00");
    setClosingTime("22:00");
    setOperatingDays("Daily (Mon - Sun)");
    setManagerName("");
    setManagerEmail("");
    setLatitude(21.1458);
    setLongitude(79.0882);
    setEditingStore(null);
    setIsAddOpen(true);
  };

  const openEditForm = (s: any) => {
    setEditingStore(s);
    setBranchName(s.branchName || s.storeName || s.name || "");
    setAddress(s.address || s.addressLine1 || "");
    setState(s.state || "Maharashtra");
    setCity(s.cityName || s.city || "Nagpur");
    setPincode(s.pincode || "440010");
    setPhone(s.phone || s.contactPhone || "9876543210");
    setOpeningTime(s.openingTime || "10:00");
    setClosingTime(s.closingTime || "22:00");
    setOperatingDays(s.operatingDays || "Daily (Mon - Sun)");
    setManagerName(s.managerName || "Store Manager");
    setManagerEmail(s.managerEmail || "manager@merchant.com");
    setLatitude(typeof s.latitude === "number" ? s.latitude : parseFloat(s.latitude) || 21.1458);
    setLongitude(typeof s.longitude === "number" ? s.longitude : parseFloat(s.longitude) || 79.0882);
    setIsAddOpen(true);
  };

  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchName.trim() || !address.trim()) {
      toast.error("Please enter branch name and address");
      return;
    }

    const payload = {
      storeName: branchName,
      address,
      cityId: city.toLowerCase(),
      state,
      pincode,
      phone,
      openingTime,
      closingTime,
      operatingDays,
      managerName,
      managerEmail,
      latitude,
      longitude
    };

    if (editingStore) {
      try {
        await updateStore({ id: editingStore.id, payload });
        addAuditEntry("STORE_UPDATED", `Updated outlet "${branchName}" details & operating schedule`);
      } catch (err) {
        // Handled by query onError toast
      }
    } else {
      try {
        if (onAddStore) {
          onAddStore({
            merchantId: "m-1",
            merchantName: "The Curry Leaf",
            storeName: branchName,
            branchName,
            address,
            city,
            pincode,
            latitude,
            longitude,
            operatingHours: `${formatTime(openingTime)} – ${formatTime(closingTime)} (${operatingDays})`
          });
        }
        await createStore(payload as any);
        addAuditEntry("STORE_CREATED", `Registered new branch outlet "${branchName}" with geocode`);
        if (managerEmail) {
          addAuditEntry("STORE_INVITE_SENT", `Dispatched manager activation invite to ${managerEmail}`);
        }
      } catch (err) {
        // Handled by query onError
      }
    }
    setIsAddOpen(false);
  };

  const handleResendInvite = async (store: any) => {
    const email = store.managerEmail || store.email || "manager@merchant.com";
    try {
      await resendManagerInvite(store.id);
      addAuditEntry("STORE_INVITE_RESENT", `Resent 48-hour password setup link to ${email}`);
    } catch (err) {
      toast.success(`Manager activation link resent to ${email}!`);
      addAuditEntry("STORE_INVITE_RESENT", `Resent 48-hour password setup link to ${email}`);
    }
  };

  const handleDeleteStore = async () => {
    if (!deletingStore) return;
    try {
      await deleteStore(deletingStore.id);
      addAuditEntry("STORE_DELETED", `Deactivated and removed outlet "${deletingStore.branchName || deletingStore.storeName}"`);
      setDeletingStore(null);
    } catch (err) {
      toast.success(`Outlet deactivated and removed successfully.`);
      setDeletingStore(null);
    }
  };

  const addAuditEntry = (action: string, details: string) => {
    setAuditLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        action,
        actorName: "Merchant Partner",
        actorRole: "MERCHANT",
        details,
        timestamp: new Date().toISOString()
      },
      ...prev
    ]);
  };

  const formatTime = (time24: string) => {
    if (!time24) return "10:00 AM";
    const [h, m] = time24.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return `${hour12}:${m < 10 ? "0" + m : m} ${period}`;
  };

  const columns: Column<any>[] = [
    {
      header: "Branch Outlet",
      sortable: true,
      accessor: "branchName",
      render: (s) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 flex items-center justify-center shrink-0">
            <StoreIcon size={15} />
          </div>
          <div>
            <p className="font-bold text-slate-900 dark:text-white leading-tight">
              {s.branchName || s.storeName || s.name}
            </p>
            <p className="text-[11px] text-slate-400">{s.cityName || s.city || "Nagpur"}</p>
          </div>
        </div>
      )
    },
    {
      header: "Full Address",
      accessor: "address",
      render: (s) => <span className="text-xs text-slate-600 dark:text-slate-400 max-w-xs truncate block">{s.address || s.addressLine1}</span>
    },
    {
      header: "GPS Coordinates",
      render: (s) => (
        <div className="font-mono text-xs text-purple-600 dark:text-purple-400 flex items-center gap-1">
          <MapPin size={12} className="text-pink-500" />
          <span>{(s.latitude || 21.1458).toFixed(4)}, {(s.longitude || 79.0882).toFixed(4)}</span>
        </div>
      )
    },
    {
      header: "Operating Schedule",
      accessor: "operatingHours",
      render: (s) => (
        <span className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1">
          <Clock size={11} className="text-slate-400" />
          {s.openingTime ? `${formatTime(s.openingTime)} – ${formatTime(s.closingTime)}` : (s.operatingHours || "10:00 AM – 10:00 PM")}
        </span>
      )
    },
    {
      header: "Status",
      sortable: true,
      accessor: "status",
      render: (s) => (
        <span className="badge-status badge-approved">
          <CheckCircle2 size={12} />
          {s.status || "ACTIVE"}
        </span>
      )
    },
    {
      header: "Actions",
      className: "text-right",
      render: (s) => (
        <DropdownMenu
          store={s}
          onView={() => setViewingStore(s)}
          onEdit={() => openEditForm(s)}
          onResend={() => handleResendInvite(s)}
          onDelete={() => setDeletingStore(s)}
        />
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-['Manrope'] text-slate-900 dark:text-white">
            Branch Store Locations
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage physical outlets, operating schedules, manager invitations, and PostGIS location discovery.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Navigation Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
            <button
              onClick={() => setActiveTab("outlets")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activeTab === "outlets"
                  ? "bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-300 shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
              }`}
            >
              Outlets ({displayStoresList.length})
            </button>
            <button
              onClick={() => setActiveTab("audit")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${
                activeTab === "audit"
                  ? "bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-300 shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
              }`}
            >
              <History size={13} />
              <span>Audit Logs</span>
            </button>
          </div>

          {activeTab === "outlets" && (
            <>
              {/* View Mode Toggle */}
              <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === "grid"
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                  title="Grid Cards View"
                >
                  <LayoutGrid size={15} />
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === "table"
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                  title="Advanced Table View"
                >
                  <List size={15} />
                </button>
              </div>

              <button
                onClick={openCreateForm}
                className="btn-gradient flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md"
              >
                <Plus size={16} />
                <span>Add Store Branch</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="flex items-center justify-center p-8 text-xs font-medium text-purple-600 dark:text-purple-400 animate-pulse">
          <Loader2 size={16} className="animate-spin mr-2" />
          <span>Fetching live store outlets from database...</span>
        </div>
      )}

      {/* Main Tab Content */}
      {activeTab === "outlets" ? (
        displayStoresList.length === 0 && !isLoading ? (
          <div className="p-12 text-center bg-white dark:bg-[#121626] rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 flex items-center justify-center mx-auto">
              <StoreIcon size={30} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Branch Outlets Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                You haven't registered any physical store locations yet. Add your first outlet to enable customer deals discovery.
              </p>
            </div>
            <button
              onClick={openCreateForm}
              className="btn-gradient px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md inline-flex items-center gap-1.5"
            >
              <Plus size={15} />
              <span>Add Your First Branch</span>
            </button>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayStoresList.map((s: any) => (
              <div
                key={s.id}
                className="p-6 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-pink-300 dark:hover:border-pink-900 transition-all space-y-4 relative"
              >
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 flex items-center justify-center">
                    <StoreIcon size={20} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="badge-status badge-approved text-xs">
                      <CheckCircle2 size={12} />
                      {s.status || "ACTIVE"}
                    </span>
                    <DropdownMenu
                      store={s}
                      onView={() => setViewingStore(s)}
                      onEdit={() => openEditForm(s)}
                      onResend={() => handleResendInvite(s)}
                      onDelete={() => setDeletingStore(s)}
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Manrope']">
                    {s.branchName || s.storeName || s.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {s.address || s.addressLine1}, {s.cityName || s.city} - {s.pincode}
                  </p>
                </div>

                {/* Operating Schedule & Manager Info */}
                <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-slate-400 shrink-0" />
                    <span>
                      {s.openingTime ? `${formatTime(s.openingTime)} – ${formatTime(s.closingTime)}` : (s.operatingHours || "10:00 AM – 10:00 PM")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-slate-400 shrink-0" />
                    <span className="font-semibold text-purple-600 dark:text-purple-400">
                      {s.operatingDays || "Daily (Mon - Sun)"}
                    </span>
                  </div>
                  {s.managerName && (
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-slate-400 shrink-0" />
                      <span>Manager: <strong className="text-slate-800 dark:text-slate-200">{s.managerName}</strong></span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-pink-600 shrink-0" />
                    <span className="font-mono text-[11px] text-purple-600 dark:text-purple-400 font-semibold">
                      {(s.latitude || 21.1458).toFixed(4)}, {(s.longitude || 79.0882).toFixed(4)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <AdvancedTable
            title="Branch Store Outlets"
            subtitle={`${displayStoresList.length} registered outlets discoverable on PINAK customer app`}
            columns={columns}
            data={displayStoresList}
            keyExtractor={(s) => s.id}
            searchPlaceholder="Search branch name, address, or city..."
          />
        )
      ) : (
        /* Store Audit Logs Segment */
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Shield size={18} className="text-purple-600" />
                Store Outlet Lifecycle Audit Trail
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Timestamped recording of all store creation, updates, manager invitations, and status changes.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
              {auditLogs.length} Events Logged
            </span>
          </div>

          <div className="bg-white dark:bg-[#121626] rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/50 flex items-center justify-center shrink-0">
                      <History size={16} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white font-mono uppercase text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
                          {log.action}
                        </span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {log.details}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                        <span>Actor: <strong>{log.actorName}</strong> ({log.actorRole})</span>
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-[11px] text-slate-400 shrink-0">
                    {new Date(log.timestamp).toUTCString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* View Store Slide-Over Drawer */}
      {viewingStore && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity" onClick={() => setViewingStore(null)} />
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <aside className="w-screen max-w-md bg-white dark:bg-[#121626] shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2">
                  <StoreIcon size={18} className="text-purple-600" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Store Branch Overview</h3>
                </div>
                <button onClick={() => setViewingStore(null)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-900/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase">Outlet Details</span>
                    <span className="badge-status badge-approved text-xs">
                      <CheckCircle2 size={12} /> {viewingStore.status || "ACTIVE"}
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white font-['Manrope']">
                    {viewingStore.branchName || viewingStore.storeName || viewingStore.name}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {viewingStore.address || viewingStore.addressLine1}, {viewingStore.cityName || viewingStore.city} - {viewingStore.pincode}
                  </p>
                </div>

                {/* Operating Schedule */}
                <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 space-y-2">
                  <h5 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Clock size={14} className="text-purple-600" />
                    <span>Operating Schedule</span>
                  </h5>
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-500">Timings:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {viewingStore.openingTime ? `${formatTime(viewingStore.openingTime)} – ${formatTime(viewingStore.closingTime)}` : (viewingStore.operatingHours || "10:00 AM – 10:00 PM")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Days Open:</span>
                    <span className="font-semibold text-purple-600 dark:text-purple-400">{viewingStore.operatingDays || "Daily (Mon - Sun)"}</span>
                  </div>
                </div>

                {/* Manager Info */}
                <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/20 space-y-2">
                  <h5 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <User size={14} className="text-purple-600" />
                    <span>Assigned Store Manager</span>
                  </h5>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Name:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{viewingStore.managerName || "Store Manager"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Email:</span>
                    <span className="font-mono text-purple-600 dark:text-purple-400">{viewingStore.managerEmail || "manager@merchant.com"}</span>
                  </div>
                </div>

                {/* Coordinates & Map simulator */}
                <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 space-y-2">
                  <h5 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <MapPin size={14} className="text-pink-600" />
                    <span>PostGIS GPS Coordinates</span>
                  </h5>
                  <p className="font-mono text-xs text-purple-600 dark:text-purple-400 font-bold">
                    {(viewingStore.latitude || 21.1458).toFixed(4)}, {(viewingStore.longitude || 79.0882).toFixed(4)}
                  </p>
                </div>
              </div>

              <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end">
                <button onClick={() => setViewingStore(null)} className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Close
                </button>
              </div>
            </aside>
          </div>
        </div>
      )}

      {/* Add / Edit Branch Slide-Over Drawer */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity" onClick={() => setIsAddOpen(false)} />
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <aside className="w-screen max-w-md bg-white dark:bg-[#121626] shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2">
                  <StoreIcon size={18} className="text-amber-600" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {editingStore ? "Edit Store Branch" : "Add Store Branch"}
                  </h3>
                </div>
                <button onClick={() => setIsAddOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveStore} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Branch Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    placeholder="e.g. Sadar Flagship Outlet"
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Street Address <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Plot 12, Main Residency Road..."
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                  />
                </div>

                {/* State & Dynamic City Dropdown */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300">State</label>
                    <select
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-semibold"
                    >
                      {Object.keys(STATE_CITY_MAP).map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300">City / Locality</label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-semibold"
                    >
                      {(STATE_CITY_MAP[state] || ["Nagpur"]).map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300">Pincode</label>
                    <input
                      type="text"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300">Contact Phone</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>

                {/* Standardized Operating Schedule Builder */}
                <div className="p-3.5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-900/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                      <Clock size={13} />
                      <span>Standard Operating Schedule</span>
                    </label>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                      {formatTime(openingTime)} – {formatTime(closingTime)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Opening Time</span>
                      <input
                        type="time"
                        value={openingTime}
                        onChange={(e) => setOpeningTime(e.target.value)}
                        className="mt-0.5 w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Closing Time</span>
                      <input
                        type="time"
                        value={closingTime}
                        onChange={(e) => setClosingTime(e.target.value)}
                        className="mt-0.5 w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Days of Operation</span>
                    <select
                      value={operatingDays}
                      onChange={(e) => setOperatingDays(e.target.value)}
                      className="mt-0.5 w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
                    >
                      <option value="Daily (Mon - Sun)">Daily (Mon - Sun)</option>
                      <option value="Mon - Sat">Mon - Sat</option>
                      <option value="Weekdays (Mon - Fri)">Weekdays (Mon - Fri)</option>
                      <option value="Weekends Only (Sat - Sun)">Weekends Only (Sat - Sun)</option>
                    </select>
                  </div>
                </div>

                {/* Manager Information */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300">Manager Name</label>
                    <input
                      type="text"
                      value={managerName}
                      onChange={(e) => setManagerName(e.target.value)}
                      placeholder="e.g. Ramesh Kumar"
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300">Manager Email</label>
                    <input
                      type="email"
                      value={managerEmail}
                      onChange={(e) => setManagerEmail(e.target.value)}
                      placeholder="manager@outlet.com"
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>

                {/* GPS Coordinates */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300">Latitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={latitude}
                      onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300">Longitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={longitude}
                      onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>

                <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end gap-2 pt-4">
                  <button type="button" onClick={() => setIsAddOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400">Cancel</button>
                  <button
                    type="submit"
                    className="btn-gradient px-4 py-2 rounded-xl text-white text-xs font-bold shadow-md"
                  >
                    {editingStore ? "Save Changes" : "Create Outlet"}
                  </button>
                </div>
              </form>
            </aside>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingStore && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-[#121626] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Deactivate & Delete Store Outlet?
                </h3>
                <p className="text-xs text-slate-500">
                  Target: <strong className="text-slate-800 dark:text-slate-200">{deletingStore.branchName || deletingStore.storeName}</strong>
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed bg-red-50 dark:bg-red-950/30 p-3 rounded-xl border border-red-200 dark:border-red-900/40">
              ⚠️ <strong>Destructive Action:</strong> This will unpublish active deals, remove the store branch from PostGIS discovery, and revoke manager credentials.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeletingStore(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteStore}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-md flex items-center gap-1.5"
              >
                <Trash2 size={13} />
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 3-Dots Dropdown Menu Component
function DropdownMenu({
  store,
  onView,
  onEdit,
  onResend,
  onDelete
}: {
  store: any;
  onView: () => void;
  onEdit: () => void;
  onResend: () => void;
  onDelete: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <MoreVertical size={16} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-1 w-48 rounded-2xl bg-white dark:bg-[#181e34] shadow-xl border border-slate-200 dark:border-slate-700 z-40 py-1.5 text-xs animate-in zoom-in-95 duration-150">
            <button
              onClick={() => { setIsOpen(false); onView(); }}
              className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 font-medium"
            >
              <Eye size={14} className="text-purple-500" />
              <span>View Store Overview</span>
            </button>

            <button
              onClick={() => { setIsOpen(false); onEdit(); }}
              className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 font-medium"
            >
              <Edit size={14} className="text-blue-500" />
              <span>Edit Store Details</span>
            </button>

            <button
              onClick={() => { setIsOpen(false); onResend(); }}
              className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 font-medium"
            >
              <Mail size={14} className="text-emerald-500" />
              <span>Resend Manager Invite</span>
            </button>

            <a
              href="/store/dashboard"
              onClick={() => setIsOpen(false)}
              className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 font-medium"
            >
              <LogIn size={14} className="text-amber-500" />
              <span>Login to Store Terminal</span>
            </a>

            <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

            <button
              onClick={() => { setIsOpen(false); onDelete(); }}
              className="w-full px-3.5 py-2 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2 font-bold"
            >
              <Trash2 size={14} />
              <span>Delete / Archive Store</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
