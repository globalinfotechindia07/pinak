import React, { useState } from "react";
import { Store, Plus, MapPin, Clock, CheckCircle2, Phone, X, LayoutGrid, List } from "lucide-react";
import { Store as StoreType } from "../../types";
import { AdvancedTable, Column } from "../../components/ui/AdvancedTable";
import { toast } from "sonner";

interface BranchStoresProps {
  stores: StoreType[];
  onAddStore: (draft: Partial<StoreType>) => void;
}

export const BranchStores: React.FC<BranchStoresProps> = ({ stores, onAddStore }) => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const myStores = stores.filter((s) => s.merchantId === "m-1");

  const [branchName, setBranchName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Nagpur");
  const [pincode, setPincode] = useState("440010");
  const [hours, setHours] = useState("11:00 AM – 11:30 PM");

  const columns: Column<StoreType>[] = [
    {
      header: "Branch Name",
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
      header: "Full Address",
      accessor: "address",
      render: (s) => <span className="text-xs text-slate-600 dark:text-slate-400 max-w-xs truncate block">{s.address}</span>
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
      header: "Operating Hours",
      accessor: "operatingHours",
      render: (s) => <span className="text-xs text-slate-500 flex items-center gap-1"><Clock size={11} /> {s.operatingHours}</span>
    },
    {
      header: "Status",
      sortable: true,
      accessor: "status",
      render: (s) => (
        <span className="badge-status badge-approved">
          <CheckCircle2 size={12} />
          {s.status}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-['Manrope'] text-slate-900 dark:text-white">
            Branch Store Locations
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your physical outlets. Mobile customers discover deals specific to each branch address and GPS coordinate.
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
            className="btn-gradient flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md"
          >
            <Plus size={16} />
            <span>Add New Branch</span>
          </button>
        </div>
      </div>

      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myStores.map((s) => (
            <div
              key={s.id}
              className="p-6 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-pink-300 dark:hover:border-pink-900 transition-all space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 flex items-center justify-center">
                  <Store size={20} />
                </div>
                <span className="badge-status badge-approved text-xs">
                  <CheckCircle2 size={12} />
                  {s.status}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Manrope']">
                  {s.branchName}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {s.address}, {s.city} - {s.pincode}
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
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
          ))}
        </div>
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

      {/* Add Branch Right Slide-Over Drawer */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity" onClick={() => setIsAddOpen(false)} />
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <aside className="w-screen max-w-md bg-white dark:bg-[#121626] shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2">
                  <Store size={18} className="text-amber-600" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Add Store Branch</h3>
                </div>
                <button onClick={() => setIsAddOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Branch Name</label>
                  <input
                    type="text"
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    placeholder="e.g. Sadar Luxury Dining"
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Street Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Plot 12, Main Residency Road..."
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300">Pincode</label>
                    <input
                      type="text"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Operating Hours</label>
                  <input
                    type="text"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end gap-2">
                <button onClick={() => setIsAddOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400">Cancel</button>
                <button
                  onClick={() => {
                    onAddStore({
                      merchantId: "m-1",
                      merchantName: "The Curry Leaf",
                      storeName: "The Curry Leaf",
                      branchName,
                      address,
                      city,
                      pincode,
                      latitude: 21.1498,
                      longitude: 79.0812,
                      operatingHours: hours
                    });
                    setIsAddOpen(false);
                    toast.success(`Store branch "${branchName}" created successfully!`);
                  }}
                  disabled={!branchName}
                  className="btn-gradient px-4 py-2 rounded-xl text-white text-xs font-bold disabled:opacity-50 shadow-md"
                >
                  Add Branch
                </button>
              </div>
            </aside>
          </div>
        </div>
      )}
    </div>
  );
};
