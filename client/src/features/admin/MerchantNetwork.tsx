import React, { useState } from "react";
import {
  Building2,
  Plus,
  UploadCloud,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  X,
  ShieldCheck,
  Eye,
  Clock
} from "lucide-react";
import { Merchant } from "../../types";
import { AdvancedTable, Column } from "../../components/ui/AdvancedTable";
import { toast } from "sonner";

interface MerchantNetworkProps {
  merchants: Merchant[];
  onAddMerchant: (draft: Partial<Merchant>) => void;
  onUpdateKyc: (merchantId: string, status: "APPROVED" | "REJECTED" | "PENDING_REVIEW") => void;
}

export const MerchantNetwork: React.FC<MerchantNetworkProps> = ({
  merchants,
  onAddMerchant,
  onUpdateKyc
}) => {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);

  // Filtered by status
  const filtered = merchants.filter((m) => statusFilter === "ALL" || m.kycStatus === statusFilter);

  // Advanced Table Columns
  const columns: Column<Merchant>[] = [
    {
      header: "Business / Brand",
      accessor: "businessName",
      render: (m) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-xs shrink-0">
            {m.initials}
          </div>
          <div>
            <p className="font-bold text-slate-900 dark:text-white">{m.businessName}</p>
            <p className="text-xs text-slate-400">{m.legalEntityName}</p>
          </div>
        </div>
      )
    },
    {
      header: "Category & City",
      accessor: "categoryName",
      render: (m) => (
        <div>
          <p className="font-medium text-slate-800 dark:text-slate-200">{m.categoryName}</p>
          <p className="text-xs text-slate-400">{m.city}</p>
        </div>
      )
    },
    {
      header: "Store Branches",
      accessor: "storeCount",
      render: (m) => <span className="font-semibold">{m.storeCount} branches</span>
    },
    {
      header: "Bank UPI VPA",
      accessor: "bankUpiId",
      render: (m) => (
        <span className="font-mono text-xs text-purple-600 dark:text-purple-400">{m.bankUpiId}</span>
      )
    },
    {
      header: "KYC Status",
      accessor: "kycStatus",
      render: (m) => (
        <span
          className={`badge-status ${
            m.kycStatus === "APPROVED"
              ? "badge-approved"
              : m.kycStatus === "REJECTED"
              ? "badge-rejected"
              : "badge-pending"
          }`}
        >
          {m.kycStatus === "APPROVED" ? (
            <CheckCircle2 size={12} />
          ) : m.kycStatus === "REJECTED" ? (
            <XCircle size={12} />
          ) : (
            <Clock size={12} />
          )}
          {m.kycStatus.replace("_", " ")}
        </span>
      )
    },
    {
      header: "Action",
      sortable: false,
      className: "text-right",
      render: (m) => (
        <button
          onClick={() => setSelectedMerchant(m)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 transition-colors"
        >
          <Eye size={14} />
          <span>Review KYC</span>
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-['Manrope'] text-slate-900 dark:text-white">
            Merchant Network & KYC Verification
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review partner brands, verify legal PAN/GSTIN entities, and manage bank settlement VPAs.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsBulkOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-xs"
          >
            <UploadCloud size={16} />
            <span>Bulk CSV Import</span>
          </button>
          <button
            onClick={() => setIsAddOpen(true)}
            className="btn-gradient flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md"
          >
            <Plus size={16} />
            <span>Onboard Merchant</span>
          </button>
        </div>
      </div>

      {/* Status Filter Chips */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {["ALL", "APPROVED", "PENDING_REVIEW", "SUBMITTED"].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              statusFilter === status
                ? "bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 font-bold"
                : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            {status === "ALL" ? "All Statuses" : status.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Advanced Table */}
      <AdvancedTable<Merchant>
        columns={columns}
        data={filtered}
        keyExtractor={(m) => m.id}
        searchPlaceholder="Search merchants by brand name, city, or owner..."
        searchFilter={(m, query) =>
          m.businessName.toLowerCase().includes(query) ||
          m.city.toLowerCase().includes(query) ||
          m.categoryName.toLowerCase().includes(query) ||
          m.ownerName.toLowerCase().includes(query)
        }
        bulkActions={[
          {
            label: "Approve Selected KYC",
            action: (selected) => {
              selected.forEach((m) => onUpdateKyc(m.id, "APPROVED"));
              toast.success(`Approved ${selected.length} merchants!`);
            }
          },
          {
            label: "Reject Selected",
            action: (selected) => {
              selected.forEach((m) => onUpdateKyc(m.id, "REJECTED"));
              toast.info(`Rejected ${selected.length} merchants.`);
            }
          }
        ]}
      />

      {/* KYC Review Slide-Over Drawer */}
      {selectedMerchant && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedMerchant(null)}
          />

          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <aside className="w-screen max-w-md bg-white dark:bg-[#121626] shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck size={20} className="text-purple-600 dark:text-purple-400" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Merchant KYC Review
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedMerchant(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-5 text-sm">
                <div>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                    {selectedMerchant.businessName}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {selectedMerchant.legalEntityName}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                    <p className="text-[11px] font-bold text-slate-400 uppercase">
                      Category & City
                    </p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                      {selectedMerchant.categoryName} · {selectedMerchant.city}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                    <p className="text-[11px] font-bold text-slate-400 uppercase">
                      Owner & Contact
                    </p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                      {selectedMerchant.ownerName} ({selectedMerchant.ownerPhone})
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {selectedMerchant.ownerEmail}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                    <p className="text-[11px] font-bold text-slate-400 uppercase">
                      Settlement UPI VPA
                    </p>
                    <p className="text-sm font-mono font-bold text-purple-600 dark:text-purple-400 mt-0.5">
                      {selectedMerchant.bankUpiId}
                    </p>
                    <span className="text-[11px] text-slate-500 block mt-1">
                      Direct UPI intent payments settle to this VPA.
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                      <p className="text-[11px] font-bold text-slate-400 uppercase">GSTIN</p>
                      <p className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                        {selectedMerchant.gstin}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                      <p className="text-[11px] font-bold text-slate-400 uppercase">PAN</p>
                      <p className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                        {selectedMerchant.pan}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-3">
                <button
                  onClick={() => {
                    onUpdateKyc(selectedMerchant.id, "REJECTED");
                    setSelectedMerchant(null);
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold"
                >
                  Reject KYC
                </button>
                <button
                  onClick={() => {
                    onUpdateKyc(selectedMerchant.id, "APPROVED");
                    setSelectedMerchant(null);
                  }}
                  className="flex-1 btn-gradient py-2.5 px-3 rounded-xl text-white text-xs font-bold shadow-md"
                >
                  Approve Merchant
                </button>
              </div>
            </aside>
          </div>
        </div>
      )}

      {/* Add Merchant Drawer (Right Side) */}
      {isAddOpen && (
        <AddMerchantDrawer
          onClose={() => setIsAddOpen(false)}
          onSave={(draft) => {
            onAddMerchant(draft);
            setIsAddOpen(false);
          }}
        />
      )}

      {/* Bulk CSV Import Slide-Over Drawer (Right Side) */}
      {isBulkOpen && (
        <BulkImportDrawer onClose={() => setIsBulkOpen(false)} />
      )}
    </div>
  );
};

// Add Merchant Right Slide-over Drawer
function AddMerchantDrawer({ onClose, onSave }: { onClose: () => void; onSave: (d: any) => void }) {
  const [formData, setFormData] = useState({
    businessName: "",
    legalEntityName: "",
    categoryName: "Food & Dining",
    city: "Nagpur",
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "",
    bankUpiId: "",
    gstin: "",
    pan: ""
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <aside className="w-screen max-w-md bg-white dark:bg-[#121626] shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Onboard Partner Merchant
            </h3>
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">Brand / Business Name</label>
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                placeholder="e.g. Urban Cafe"
                className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">Category</label>
              <select
                value={formData.categoryName}
                onChange={(e) => setFormData({ ...formData, categoryName: e.target.value })}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              >
                <option>Food & Dining</option>
                <option>Beauty & Wellness</option>
                <option>Gym & Fitness</option>
                <option>Retail & Shopping</option>
                <option>Stay & Travel</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">Primary City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Owner Name</label>
                <input
                  type="text"
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  placeholder="Full name"
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Phone</label>
                <input
                  type="text"
                  value={formData.ownerPhone}
                  onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })}
                  placeholder="+91..."
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">Bank UPI VPA (Direct Settlement)</label>
              <input
                type="text"
                value={formData.bankUpiId}
                onChange={(e) => setFormData({ ...formData, bankUpiId: e.target.value })}
                placeholder="e.g. brand@upi"
                className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono"
              />
            </div>
          </div>

          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-600">Cancel</button>
            <button
              onClick={() => onSave(formData)}
              disabled={!formData.businessName}
              className="btn-gradient px-4 py-2 rounded-xl text-white text-xs font-bold disabled:opacity-50"
            >
              Submit Onboarding
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

// Bulk CSV Import Right Slide-over Drawer
function BulkImportDrawer({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<"upload" | "validating" | "ready">("upload");

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <aside className="w-screen max-w-md bg-white dark:bg-[#121626] shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <FileSpreadsheet size={20} className="text-purple-600" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Bulk CSV Merchant Import
              </h3>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {step === "upload" && (
              <div
                onClick={() => {
                  setStep("validating");
                  setTimeout(() => setStep("ready"), 1100);
                }}
                className="p-8 rounded-2xl border-2 border-dashed border-purple-300 dark:border-purple-800/80 bg-purple-50/40 dark:bg-purple-950/20 text-center cursor-pointer hover:bg-purple-50 transition-colors space-y-2"
              >
                <UploadCloud size={36} className="mx-auto text-purple-600 dark:text-purple-400" />
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  Click to upload or drag & drop merchant CSV
                </p>
                <p className="text-xs text-slate-500">
                  Required columns: BusinessName, Category, City, OwnerEmail, BankUPI
                </p>
              </div>
            )}

            {step === "validating" && (
              <div className="py-12 text-center space-y-3">
                <div className="w-8 h-8 rounded-full border-2 border-pink-500 border-t-transparent animate-spin mx-auto" />
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Validating columns & checking GSTIN/PAN formatting...
                </p>
              </div>
            )}

            {step === "ready" && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5">
                  <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Validation Successful</p>
                    <p className="mt-0.5">24 merchants parsed with 0 blocking errors. Ready to queue for admin review.</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 text-xs space-y-1">
                  <p className="font-bold text-slate-700 dark:text-slate-300">Parsed Summary:</p>
                  <p className="text-slate-500">• 14 Food & Dining in Nagpur</p>
                  <p className="text-slate-500">• 6 Beauty & Salons in Pune</p>
                  <p className="text-slate-500">• 4 Gyms in Mumbai</p>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-600">Cancel</button>
            <button
              onClick={() => {
                toast.success("24 merchants imported to demo directory!");
                onClose();
              }}
              disabled={step !== "ready"}
              className="btn-gradient px-4 py-2 rounded-xl text-white text-xs font-bold disabled:opacity-50"
            >
              Import 24 Records
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
