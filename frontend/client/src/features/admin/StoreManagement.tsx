import React, { useState, useMemo } from "react";
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
  AlertCircle,
  Trash2,
  Download,
  Power,
  PowerOff,
  Pencil
} from "lucide-react";
import { Store as StoreType, Merchant } from "../../types";
import { AdvancedTable, Column } from "../../components/ui/AdvancedTable";
import { Badge } from "../../components/ui/badge";
import { cn } from "../../lib/utils";
import { toast } from "sonner";
import { storeBranchSchema } from "../../lib/validationSchemas";
import { StoreLocationPicker } from "../../components/StoreLocationPicker";
import { IndiaAddressFields } from "../../components/IndiaAddressFields";
import { StoreScheduleSelector } from "../../components/StoreScheduleSelector";

interface StoreManagementProps {
  stores: StoreType[];
  merchants: Merchant[];
  onAddStore: (draft: Partial<StoreType>) => void;
  onApproveStore: (id: string) => void;
  onDeleteStore?: (id: string) => void;
  onUpdateStore?: (id: string, updates: Partial<StoreType>) => void;
}

export const StoreManagement: React.FC<StoreManagementProps> = ({
  stores,
  merchants,
  onAddStore,
  onApproveStore,
  onDeleteStore,
  onUpdateStore
}) => {
  const [cityFilter, setCityFilter] = useState("ALL");
  const [selectedStore, setSelectedStore] = useState<StoreType | null>(null);
  const [storeToEdit, setStoreToEdit] = useState<StoreType | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState<StoreType | null>(null);

  // Dynamic cities that have at least one store listed
  const availableCities = useMemo(() => {
    const uniqueCities = Array.from(new Set(stores.map((s) => s.city).filter(Boolean))).sort();
    return ["ALL", ...uniqueCities];
  }, [stores]);

  // Filtered by city chip if selected
  const displayedStores = cityFilter === "ALL" 
    ? stores 
    : stores.filter((s) => s.city.toLowerCase() === cityFilter.toLowerCase());

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
          <p className="text-slate-400 text-[11px] mt-0.5">
            {s.city}{s.district && s.district !== s.city ? `, ${s.district}` : ""}{s.state ? `, ${s.state}` : ""} • <span className="font-mono">{s.pincode}</span>
          </p>
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
        <Badge variant={s.status === "ACTIVE" ? "success" : "warning"}>
          {s.status === "ACTIVE" ? (
            <CheckCircle2 size={12} />
          ) : (
            <Clock size={12} />
          )}
          {s.status === "ACTIVE" ? "Active on Map" : "Inactive / Closed"}
        </Badge>
      )
    },
    {
      header: "Actions",
      className: "text-right",
      render: (s) => (
        <div className="flex items-center justify-end gap-1.5">
          {s.status !== "ACTIVE" ? (
            <button
              onClick={() => onApproveStore(s.id)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 transition-colors shadow-2xs"
            >
              Approve
            </button>
          ) : (
            <button
              title="Temporarily close store"
              onClick={() => {
                onUpdateStore?.(s.id, { status: "INACTIVE" });
                toast.info(`Store "${s.branchName}" marked as Inactive`);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
            >
              <PowerOff size={13} />
            </button>
          )}

          <button
            onClick={() => setStoreToEdit(s)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 transition-colors border border-amber-200/50 dark:border-amber-800/40"
            title="Edit store outlet details"
          >
            <Pencil size={12} className="text-amber-600" />
            <span>Edit</span>
          </button>

          <button
            onClick={() => setSelectedStore(s)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/60 transition-colors border border-purple-200/50 dark:border-purple-800/40"
          >
            <MapPin size={12} className="text-pink-500" />
            <span>View</span>
          </button>

          {onDeleteStore && (
            <button
              title="Delete store branch"
              onClick={() => setStoreToDelete(s)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            >
              <Trash2 size={13} />
            </button>
          )}
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
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1">
              <MapPin size={12} />
              Multi-Outlet Network
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage physical retail outlets and store branches mapped to partner brands. Each location has verified GPS geocoordinates for proximity customer discovery.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleExportStoresCsv}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-2xs"
            title="Export store branches as CSV"
          >
            <Download size={14} />
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

      {/* Dynamic City Chips Toolbar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">City Filter:</span>
        {availableCities.map((city) => (
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
                  Store Location & Geofence
                </h3>
                <p className="text-[11px] text-slate-400">Verified Spatial Geocode & Map Discovery Status</p>
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
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedMerchant = merchants.find(m => m.id === merchantId);

  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
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

    setErrors({});
    onSave({
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
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Add Store Branch
              </h3>
              <p className="text-[11px] text-slate-400">Deploy physical outlet to merchant network</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <X size={18} />
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
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Edit Store Branch</h3>
                <p className="text-[11px] text-slate-400">Update branch details, phone & schedule</p>
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
