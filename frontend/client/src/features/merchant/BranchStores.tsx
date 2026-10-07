import React, { useState } from "react";
import {
  Store,
  Plus,
  MapPin,
  Clock,
  CheckCircle2,
  Phone,
  X,
  LayoutGrid,
  List,
  LogIn,
  Lock,
  Mail,
  UserCheck,
  ShieldCheck,
  Users,
  Shield,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  Pencil
} from "lucide-react";
import { Store as StoreType } from "../../types";
import { AdvancedTable, Column } from "../../components/ui/AdvancedTable";
import { Badge } from "../../components/ui/badge";
import { toast } from "sonner";
import { StoreLocationPicker } from "../../components/StoreLocationPicker";
import { IndiaAddressFields } from "../../components/IndiaAddressFields";
import { StoreScheduleSelector } from "../../components/StoreScheduleSelector";
import { useAppStore } from "../../hooks/useAppStore";
import { StoreStaffManager } from "./StoreStaffManager";
import { cn } from "../../lib/utils";

interface BranchStoresProps {
  stores: StoreType[];
  onAddStore: (draft: Partial<StoreType>) => void;
  onLoginAsStore?: (store: StoreType) => void;
  onUpdateStore?: (id: string, updates: Partial<StoreType>) => void;
}

export const BranchStores: React.FC<BranchStoresProps> = ({
  stores,
  onAddStore,
  onLoginAsStore,
  onUpdateStore
}) => {
  const store = useAppStore();
  const currentMerchantId = store.currentUser?.merchantId || store.currentUser?.id;
  const currentMerchantName = store.currentUser?.name || "Merchant Partner";
  const merchantDomain = currentMerchantName.toLowerCase().replace(/[^a-z0-9]/g, "") || "store";

  // Top-Level Section Tabs
  const [activeSection, setActiveSection] = useState<"outlets" | "staff" | "roles">("outlets");

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [storeToEdit, setStoreToEdit] = useState<StoreType | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const isMyMerchant = (id?: string) => !currentMerchantId || !id || id === currentMerchantId || id === store.currentUser?.merchantId || id === "m-1";
  const myStores = store.role === "merchant" ? stores : stores.filter((s) => isMyMerchant(s.merchantId));

  const [copiedStoreId, setCopiedStoreId] = useState<string | null>(null);

  // Add Branch Form State
  const [branchName, setBranchName] = useState("");
  const [address, setAddress] = useState("");
  const [state, setState] = useState("Maharashtra");
  const [district, setDistrict] = useState("Nagpur");
  const [city, setCity] = useState("Nagpur");
  const [pincode, setPincode] = useState("440010");
  const [phone, setPhone] = useState("+91 712 2550000");
  const [hours, setHours] = useState("11:00 AM – 11:30 PM");
  const [latitude, setLatitude] = useState(21.1458);
  const [longitude, setLongitude] = useState(79.0882);
  const [storeEmail, setStoreEmail] = useState("");
  const [managerName, setManagerName] = useState("");

  const handleBranchNameChange = (name: string) => {
    setBranchName(name);
    if (!storeEmail || storeEmail.endsWith(`@${merchantDomain}.in`) || storeEmail.endsWith("@curryleaf.in")) {
      const slug = name.toLowerCase().replace(/[^a-z0-9]/g, "");
      setStoreEmail(slug ? `${slug}@${merchantDomain}.in` : "");
    }
  };

  const handleCopyManagerInvite = (s: StoreType) => {
    const token = `mgr_inv_${s.id}_${Date.now().toString(36)}`;
    const inviteUrl = `${window.location.origin}/accept-invite?token=${encodeURIComponent(token)}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedStoreId(s.id);
    toast.success(`Manager password setup link copied for ${s.branchName}!`);
    setTimeout(() => setCopiedStoreId(null), 2500);
  };

  const columns: Column<StoreType>[] = [
    {
      header: "Branch Outlet",
      sortable: true,
      accessor: "branchName",
      render: (s) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Store size={15} />
          </div>
          <div>
            <p className="font-bold text-slate-900 dark:text-white leading-tight">{s.branchName}</p>
            <p className="text-[11px] text-slate-400">{s.city}</p>
          </div>
        </div>
      )
    },
    {
      header: "Store Manager & Access",
      render: (s) => (
        <div className="text-xs space-y-1">
          <div className="flex items-center gap-1 font-mono text-purple-600 dark:text-purple-400 font-semibold">
            <Mail size={11} />
            <span>{s.storeEmail || `${s.id}@curryleaf.in`}</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {s.managerName || "Store Manager"}
            </span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-0.5">
              <Lock size={10} />
              Password Access
            </span>
          </div>
        </div>
      )
    },
    {
      header: "Full Address",
      accessor: "address",
      render: (s) => (
        <span className="text-xs text-slate-600 dark:text-slate-400 max-w-xs truncate block">
          {s.address}
        </span>
      )
    },
    {
      header: "GPS Pin",
      render: (s) => (
        <div className="font-mono text-xs text-purple-600 dark:text-purple-400 flex items-center gap-1">
          <MapPin size={12} className="text-pink-500" />
          <span>{s.latitude.toFixed(4)}, {s.longitude.toFixed(4)}</span>
        </div>
      )
    },
    {
      header: "Status",
      sortable: true,
      accessor: "status",
      render: (s) => (
        <Badge variant="success">
          <CheckCircle2 size={12} />
          {s.status}
        </Badge>
      )
    },
    {
      header: "Action",
      render: (s) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setStoreToEdit(s)}
            className="p-1.5 rounded-xl border border-amber-200/80 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 text-xs font-semibold flex items-center gap-1"
            title="Edit Store Branch Details"
          >
            <Pencil size={12} className="text-amber-600" />
            <span className="text-[11px]">Edit</span>
          </button>
          <button
            onClick={() => handleCopyManagerInvite(s)}
            className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1"
            title="Copy Password Setup Invite Link for Manager"
          >
            {copiedStoreId === s.id ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
            <span className="text-[11px]">{copiedStoreId === s.id ? "Copied" : "Invite"}</span>
          </button>
          <button
            onClick={() => onLoginAsStore?.(s)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold text-xs hover:bg-purple-100 transition-colors shadow-xs"
          >
            <LogIn size={13} />
            <span>Login</span>
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Segmented Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold font-['Manrope'] text-slate-900 dark:text-white">
              Stores & Outlets Management
            </h1>
            <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800">
              Merchant Hub
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage physical outlets, store manager credentials, floor supervisors, and custom store RBAC roles.
          </p>
        </div>

        {/* 3 Main Tabs */}
        <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 self-start sm:self-auto">
          <button
            onClick={() => setActiveSection("outlets")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
              activeSection === "outlets"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            )}
          >
            <Store size={14} className="text-amber-500" />
            <span>Branch Outlets ({myStores.length})</span>
          </button>

          <button
            onClick={() => setActiveSection("staff")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
              activeSection === "staff"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            )}
          >
            <Users size={14} className="text-purple-500" />
            <span>Store Staff Directory</span>
          </button>

          <button
            onClick={() => setActiveSection("roles")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
              activeSection === "roles"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            )}
          >
            <ShieldCheck size={14} className="text-indigo-500" />
            <span>Store Custom Roles</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: BRANCH OUTLETS & LOCATIONS */}
      {activeSection === "outlets" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold font-['Manrope'] text-slate-900 dark:text-white">
                Physical Branch Outlets
              </h2>
              <p className="text-xs text-slate-500">
                Registered physical locations discoverable by nearby customers. Each outlet features dedicated manager password login.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
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
                onClick={() => setIsAddOpen(true)}
                className="btn-gradient flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-md hover:opacity-95"
              >
                <Plus size={16} />
                <span>Add Store Branch</span>
              </button>
            </div>
          </div>

          {viewMode === "grid" ? (
            myStores.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#121626] border border-dashed border-slate-200 dark:border-slate-800 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
                  <Store size={32} />
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">No Store Outlets Found</h3>
                  <p className="text-xs text-slate-500">
                    You haven't registered any physical store branches yet. Add your flagship outlet to start accepting customer reward visits and redemptions.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddOpen(true)}
                  className="btn-gradient inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md hover:opacity-95"
                >
                  <Plus size={16} />
                  <span>Add Store Branch</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myStores.map((s) => (
                  <div
                    key={s.id}
                    className="p-6 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-purple-300 dark:hover:border-purple-900 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 flex items-center justify-center">
                          <Store size={20} />
                        </div>
                        <Badge variant="success">
                          <CheckCircle2 size={12} />
                          {s.status}
                        </Badge>
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Manrope']">
                          {s.branchName}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          {s.address}, {s.city} - {s.pincode}
                        </p>
                      </div>

                      {/* Store Manager Password Login Credentials (Zero PIN) */}
                      <div className="p-3.5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-800/80 space-y-2 text-xs">
                        <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                          <span>Store Manager Account</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                            <Lock size={10} />
                            Password Login
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 font-mono text-purple-700 dark:text-purple-300 font-bold text-xs">
                          <Mail size={12} />
                          <span>{s.storeEmail || `${s.id}@curryleaf.in`}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-purple-100 dark:border-purple-900/50">
                          <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                            <UserCheck size={12} className="text-purple-500" />
                            <span className="font-semibold">{s.managerName || "Store Manager"}</span>
                          </span>

                          <button
                            onClick={() => handleCopyManagerInvite(s)}
                            className="inline-flex items-center gap-1 text-purple-600 dark:text-purple-400 font-bold hover:underline"
                            title="Copy Manager Password Setup Link"
                          >
                            {copiedStoreId === s.id ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                            <span>{copiedStoreId === s.id ? "Copied Link!" : "Copy Setup Link"}</span>
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-slate-400 shrink-0" />
                          <span>{s.operatingHours}</span>
                        </div>
                        {s.phone && (
                          <div className="flex items-center gap-2">
                            <Phone size={14} className="text-slate-400 shrink-0" />
                            <span>{s.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <MapPin size={14} className="text-pink-600 shrink-0" />
                          <span className="font-mono text-[11px] text-purple-600 dark:text-purple-400 font-semibold">
                            {s.latitude.toFixed(4)}, {s.longitude.toFixed(4)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons: Edit & Login */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setStoreToEdit(s)}
                        className="py-2.5 px-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-amber-200/80 dark:border-amber-800/80 shadow-2xs"
                      >
                        <Pencil size={13} className="text-amber-600" />
                        <span>Edit Outlet</span>
                      </button>
                      <button
                        onClick={() => onLoginAsStore?.(s)}
                        className="py-2.5 px-3 rounded-xl bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-purple-200/80 dark:border-purple-800/80 shadow-2xs"
                      >
                        <LogIn size={13} />
                        <span>Login Portal</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <AdvancedTable
              title="Branch Store Outlets"
              subtitle={`${myStores.length} registered outlets discoverable on PINAK customer app`}
              columns={columns}
              data={myStores}
              keyExtractor={(s) => s.id}
              searchPlaceholder="Search branch name, address, or city..."
            />
          )}
        </div>
      )}

      {/* SECTION 2: STORE STAFF TEAM */}
      {activeSection === "staff" && (
        <StoreStaffManager
          stores={myStores}
          hideTabs={true}
          initialTab="staff"
        />
      )}

      {/* SECTION 3: STORE CUSTOM ROLES STUDIO */}
      {activeSection === "roles" && (
        <StoreStaffManager
          stores={myStores}
          hideTabs={true}
          initialTab="roles"
        />
      )}

      {/* Add Branch Right Slide-Over Drawer (Zero PIN) */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsAddOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <aside className="w-screen max-w-md bg-white dark:bg-[#121626] shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2">
                  <Store size={18} className="text-amber-600" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Add Store Branch Outlet
                  </h3>
                </div>
                <button
                  onClick={() => setIsAddOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Branch Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={branchName}
                    onChange={(e) => handleBranchNameChange(e.target.value)}
                    placeholder="e.g. Sadar Luxury Dining"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-semibold focus:outline-hidden focus:border-purple-500"
                  />
                </div>

                {/* Pre-populated Indian Address Fields */}
                <IndiaAddressFields
                  state={state}
                  district={district}
                  city={city}
                  pincode={pincode}
                  address={address}
                  onStateChange={(val) => setState(val)}
                  onDistrictChange={(val) => setDistrict(val)}
                  onCityChange={(val) => setCity(val)}
                  onPincodeChange={(val) => setPincode(val)}
                  onAddressChange={(val) => setAddress(val)}
                />

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                {/* Standardized Operating Hours & Schedule Selector */}
                <StoreScheduleSelector
                  value={hours}
                  onChange={(newSchedule) => setHours(newSchedule)}
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
                      if (locationHint) {
                        if (locationHint.state) setState(locationHint.state);
                        if (locationHint.district) setDistrict(locationHint.district);
                        if (locationHint.city) setCity(locationHint.city);
                        if (locationHint.pincode) setPincode(locationHint.pincode);
                        if (locationHint.formattedAddress && !address) {
                          setAddress(locationHint.formattedAddress.split(",").slice(0, 3).join(","));
                        }
                      }
                    }}
                    height="200px"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={latitude}
                      onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={longitude}
                      onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Dedicated Store Manager Account Section (Zero PIN) */}
                <div className="pt-2">
                  <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-800/80 space-y-3">
                    <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-bold text-xs">
                      <Lock size={15} />
                      <span>Store Manager Account & Password Credentials</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      The Store Manager will log in using their email and password. A single-use password activation link (<code className="text-purple-700 dark:text-purple-300 font-mono">/accept-invite?token=...</code>) will be dispatched to their email upon creation. Zero PIN numbers required.
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          Manager Full Name
                        </label>
                        <input
                          type="text"
                          value={managerName}
                          onChange={(e) => setManagerName(e.target.value)}
                          placeholder="e.g. Ramesh Joshi"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          Manager Work Email
                        </label>
                        <input
                          type="email"
                          value={storeEmail}
                          onChange={(e) => setStoreEmail(e.target.value)}
                          placeholder="manager@brand.in"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-purple-600 dark:text-purple-400 font-semibold"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end gap-2">
                <button
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onAddStore({
                      merchantId: currentMerchantId || "m-1",
                      merchantName: currentMerchantName,
                      storeName: currentMerchantName,
                      branchName,
                      address,
                      state,
                      district,
                      city,
                      pincode,
                      phone,
                      latitude,
                      longitude,
                      operatingHours: hours,
                      storeEmail: storeEmail || `${branchName.toLowerCase().replace(/\s+/g, "")}@${merchantDomain}.in`,
                      managerName: managerName || "Store Manager"
                    });
                    setIsAddOpen(false);
                    toast.success(`Store branch "${branchName}" created! Password activation link dispatched to ${storeEmail || "Store Manager"}.`);
                  }}
                  disabled={!branchName || !address}
                  className="btn-gradient px-4 py-2 rounded-xl text-white text-xs font-bold disabled:opacity-50 shadow-md"
                >
                  Create Store Branch
                </button>
              </div>
            </aside>
          </div>
        </div>
      )}

      {/* Edit Branch Right Slide-Over Drawer */}
      {storeToEdit && (
        <EditBranchStoreDrawer
          store={storeToEdit}
          onClose={() => setStoreToEdit(null)}
          onSave={(updates) => {
            if (onUpdateStore) {
              onUpdateStore(storeToEdit.id, updates);
            } else {
              store.updateStore(storeToEdit.id, updates);
            }
            setStoreToEdit(null);
            toast.success(`Store outlet "${updates.branchName || storeToEdit.branchName}" updated!`);
          }}
        />
      )}
    </div>
  );
};

// Right-side Slide-over Drawer for Merchant to Edit Store Outlet Details
function EditBranchStoreDrawer({
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
      status
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <aside className="w-screen max-w-md bg-white dark:bg-[#121626] shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2">
              <Pencil size={18} className="text-amber-500" />
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Edit Branch Outlet</h3>
                <p className="text-[11px] text-slate-400">Update outlet contact info, hours & location</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
              <X size={18} />
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
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Outlet Status</label>
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

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
                Cancel
              </button>
              <button type="submit" className="btn-gradient px-4 py-2 rounded-xl text-white text-xs font-bold shadow-md">
                Save Outlet Changes
              </button>
            </div>
          </form>
        </aside>
      </div>
    </div>
  );
}
