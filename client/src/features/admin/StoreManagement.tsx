import React, { useState } from "react";
import {
  Store as StoreIcon,
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
  Sparkles
} from "lucide-react";
import { Store as StoreType, Merchant } from "../../types";
import { AdvancedTable, Column } from "../../components/ui/AdvancedTable";
import { toast } from "sonner";

interface StoreManagementProps {
  stores: StoreType[];
  merchants: Merchant[];
  onAddStore: (draft: Partial<StoreType>) => void;
  onApproveStore: (id: string) => void;
}

export const StoreManagement: React.FC<StoreManagementProps> = ({
  stores,
  merchants,
  onAddStore,
  onApproveStore
}) => {
  const [cityFilter, setCityFilter] = useState("ALL");
  const [selectedStore, setSelectedStore] = useState<StoreType | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Filtered by city chip if selected
  const displayedStores = cityFilter === "ALL" 
    ? stores 
    : stores.filter((s) => s.city.toLowerCase() === cityFilter.toLowerCase());

  const columns: Column<StoreType>[] = [
    {
      header: "Store / Branch",
      sortable: true,
      accessor: "branchName",
      render: (s) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 shadow-xs">
            <StoreIcon size={16} />
          </div>
          <div>
            <p className="font-bold text-slate-900 dark:text-white leading-tight">
              {s.branchName}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
              <Clock size={11} /> {s.operatingHours}
            </p>
          </div>
        </div>
      )
    },
    {
      header: "Brand Parent",
      sortable: true,
      accessor: "merchantName",
      render: (s) => (
        <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
          <Building2 size={13} className="text-purple-500" />
          <span>{s.merchantName}</span>
        </div>
      )
    },
    {
      header: "Address & City",
      sortable: true,
      accessor: "city",
      render: (s) => (
        <div className="text-xs max-w-xs">
          <p className="truncate font-medium text-slate-700 dark:text-slate-300">{s.address}</p>
          <p className="text-slate-400 text-[11px] font-mono mt-0.5">{s.city} • {s.pincode}</p>
        </div>
      )
    },
    {
      header: "GPS Coordinates",
      render: (s) => (
        <div className="font-mono text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2.5 py-1 rounded-lg inline-flex items-center gap-1 border border-purple-200/50 dark:border-purple-900/50">
          <MapPin size={11} className="text-pink-500" />
          <span>{s.latitude.toFixed(4)}, {s.longitude.toFixed(4)}</span>
        </div>
      )
    },
    {
      header: "Map Status",
      sortable: true,
      accessor: "status",
      render: (s) => (
        <span
          className={`badge-status ${
            s.status === "ACTIVE" ? "badge-approved" : "badge-pending"
          }`}
        >
          {s.status === "ACTIVE" ? (
            <CheckCircle2 size={12} />
          ) : (
            <Clock size={12} />
          )}
          {s.status === "ACTIVE" ? "Active on Map" : "Pending Geocode"}
        </span>
      )
    },
    {
      header: "Actions",
      className: "text-right",
      render: (s) => (
        <div className="flex items-center justify-end gap-2">
          {s.status !== "ACTIVE" && (
            <button
              onClick={() => onApproveStore(s.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 transition-colors shadow-2xs"
            >
              Approve
            </button>
          )}
          <button
            onClick={() => setSelectedStore(s)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
          >
            <Compass size={13} className="text-pink-500" />
            <span>GPS Pin</span>
          </button>
        </div>
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
              Physical Stores & Branches
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
              Merchant ≠ Store
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Discovery engine queries physical store branches via PostGIS spatial index. Each location has unique GPS pins and operating schedules.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="btn-gradient flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Add Store Branch</span>
        </button>
      </div>

      {/* City Chips Toolbar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">City Filter:</span>
        {["ALL", "Nagpur", "Pune", "Mumbai"].map((city) => (
          <button
            key={city}
            onClick={() => setCityFilter(city)}
            className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors border ${
              cityFilter === city
                ? "bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 border-pink-200 dark:border-pink-800 font-bold"
                : "border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            {city === "ALL" ? "All Cities" : city}
          </button>
        ))}
      </div>

      {/* Advanced Stores Table */}
      <AdvancedTable
        title="Physical Store Branches Registry"
        subtitle={`${displayedStores.length} geocoded locations mapped to verified merchant brands`}
        columns={columns}
        data={displayedStores}
        keyExtractor={(s) => s.id}
        searchPlaceholder="Search store branch, brand, street address, or city..."
        searchFilter={(s, q) =>
          s.branchName.toLowerCase().includes(q) ||
          s.merchantName.toLowerCase().includes(q) ||
          s.address.toLowerCase().includes(q) ||
          s.city.toLowerCase().includes(q)
        }
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

      {/* Map Pin Right-Side Slide-Over Drawer */}
      {selectedStore && (
        <StorePinDrawer
          store={selectedStore}
          onClose={() => setSelectedStore(null)}
          onApprove={() => {
            onApproveStore(selectedStore.id);
            setSelectedStore({ ...selectedStore, status: "ACTIVE" });
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
    </div>
  );
};

// Right-side Slide-over Drawer for Map Pin Details
function StorePinDrawer({
  store,
  onClose,
  onApprove
}: {
  store: StoreType;
  onClose: () => void;
  onApprove: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <aside className="w-screen max-w-lg bg-white dark:bg-[#121626] shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-pink-100 dark:bg-pink-950/60 text-pink-600 flex items-center justify-center">
                <MapPin size={17} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                  GPS Branch Inspector
                </h3>
                <p className="text-[11px] text-slate-400">PostGIS Spatial Coordinates & Verification</p>
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
            {/* Store Card Info */}
            <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-900/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                  Store Branch
                </span>
                <span className={`badge-status ${store.status === "ACTIVE" ? "badge-approved" : "badge-pending"}`}>
                  {store.status === "ACTIVE" ? "Active on App" : "Needs Geocode Review"}
                </span>
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

            {/* PostGIS Coordinate Inspector */}
            <div className="space-y-2">
              <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Layers size={13} className="text-purple-600" />
                <span>Geographic Coordinate System (SRID 4326)</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Latitude</span>
                  <p className="font-mono text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                    {store.latitude}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Longitude</span>
                  <p className="font-mono text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                    {store.longitude}
                  </p>
                </div>
              </div>
            </div>

            {/* Map Simulator Canvas */}
            <div className="h-52 rounded-2xl bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-center p-4 relative overflow-hidden shadow-inner">
              <div className="w-14 h-14 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-600 animate-pulse relative">
                <div className="absolute inset-0 rounded-full border-2 border-pink-500/40 animate-ping" />
                <MapPin size={30} />
              </div>
              <p className="text-xs font-bold text-slate-900 dark:text-white mt-3">
                PostGIS ST_DWithin Ready
              </p>
              <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 max-w-xs mt-1 break-all">
                ST_SetSRID(ST_MakePoint({store.longitude}, {store.latitude}), 4326)::geography
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
                <span className="font-mono text-slate-400">{store.id}</span>
              </div>
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
  const [merchantId, setMerchantId] = useState(merchants[0]?.id || "m-1");
  const [branchName, setBranchName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Nagpur");
  const [pincode, setPincode] = useState("440010");
  const [latitude, setLatitude] = useState(21.1458);
  const [longitude, setLongitude] = useState(79.0882);
  const [operatingHours, setOperatingHours] = useState("11:00 AM – 11:00 PM");

  const selectedMerchant = merchants.find(m => m.id === merchantId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchName.trim() || !address.trim()) {
      toast.error("Please enter branch name and address");
      return;
    }
    onSave({
      merchantId,
      merchantName: selectedMerchant?.businessName || "Unknown Brand",
      branchName,
      address,
      city,
      pincode,
      latitude,
      longitude,
      operatingHours,
      status: "ACTIVE"
    });
    toast.success(`Store branch "${branchName}" registered successfully!`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <aside className="w-screen max-w-md bg-white dark:bg-[#121626] shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Add Store Branch
            </h3>
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">Parent Merchant Brand</label>
              <select
                value={merchantId}
                onChange={e => setMerchantId(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white"
              >
                {merchants.map(m => (
                  <option key={m.id} value={m.id}>{m.businessName} ({m.city})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">Branch Name</label>
              <input
                type="text"
                required
                value={branchName}
                onChange={e => setBranchName(e.target.value)}
                placeholder="e.g. Sadar Flagship Outlet"
                className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">Street Address</label>
              <textarea
                required
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Shop 4, Residency Road..."
                rows={2}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Pincode</label>
                <input
                  type="text"
                  value={pincode}
                  onChange={e => setPincode(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Latitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={latitude}
                  onChange={e => setLatitude(parseFloat(e.target.value) || 0)}
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-mono"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Longitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={longitude}
                  onChange={e => setLongitude(parseFloat(e.target.value) || 0)}
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">Operating Hours</label>
              <input
                type="text"
                value={operatingHours}
                onChange={e => setOperatingHours(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
              />
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
                className="btn-gradient px-4 py-2 rounded-xl text-white text-xs font-bold shadow-md"
              >
                Save Branch
              </button>
            </div>
          </form>
        </aside>
      </div>
    </div>
  );
}
