import React, { useState, useEffect, useMemo } from "react";
import {
  Store as StoreIcon,
  Tag,
  ShoppingBag,
  Plus,
  MapPin,
  CheckCircle2,
  Check,
  Clock,
  Building2,
  Navigation,
  X,
  Compass,
  ExternalLink,
  Layers,
  AlertCircle,
  AlertTriangle,
  Trash2,
  Coins,
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
  Phone,
  ChevronLeft,
  ChevronRight,
  UtensilsCrossed,
  Camera,
  Smartphone,
  Lock,
  Activity,
  Users,
  Shield
} from "lucide-react";
import { Store as StoreType, Merchant, Offer } from "../../types";
import { AdvancedTable, Column } from "../../components/ui/AdvancedTable";
import { Badge } from "../../components/ui/badge";
import { toast } from "sonner";
import { StoreLocationPicker } from "../../components/StoreLocationPicker";
import { IndiaAddressFields } from "../../components/IndiaAddressFields";
import { StoreScheduleSelector } from "../../components/StoreScheduleSelector";
import { StoreMediaAndAmenitiesSection, PRESET_AMENITIES } from "../../components/StoreMediaAndAmenitiesSection";
import { FormStepper } from "../../components/FormStepper";
import { OfferCampaignFormDrawer } from "../../components/OfferCampaignFormDrawer";
import { useAppStore } from "../../hooks/useAppStore";
import { storeApi } from "../../api/storeApi";
import { merchantApi } from "../../api/merchantApi";
import { staffApi, BackendStaffResponse } from "../../api/staffApi";
import { cn } from "../../lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "../../components/ui/dropdown-menu";

interface BranchStoresProps {
  stores: StoreType[];
  merchants?: Merchant[];
  offers?: Offer[];
  onAddStore: (draft: Partial<StoreType>) => void;
  onUpdateStore?: (id: string, updates: Partial<StoreType>) => void;
  onDeleteStore?: (id: string) => void;
  onAddOffer?: (draft: any) => void;
}

export const BranchStores: React.FC<BranchStoresProps> = ({
  stores,
  merchants,
  offers,
  onAddStore,
  onUpdateStore,
  onDeleteStore,
  onAddOffer
}) => {
  const store = useAppStore();
  const currentMerchantId = store.currentUser?.merchantId || store.currentUser?.id;
  const currentMerchantName = store.currentUser?.name || "Merchant Partner";
  const merchantDomain = currentMerchantName.toLowerCase().replace(/[^a-z0-9]/g, "") || "store";

  // Filter & View Mode Controls (Matching Super Admin UI Exactly)
  const [cityFilter, setCityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [cardSearch, setCardSearch] = useState("");

  // Modals & Drawers
  const [selectedStore, setSelectedStore] = useState<StoreType | null>(null);
  const [storeForOffer, setStoreForOffer] = useState<StoreType | null>(null);
  const [storeToEdit, setStoreToEdit] = useState<StoreType | null>(null);
  const [storeToDelete, setStoreToDelete] = useState<StoreType | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addBranchStep, setAddBranchStep] = useState<number>(1);

  // Live Backend State
  const [liveStores, setLiveStores] = useState<StoreType[]>([]);
  const [isLoadingLiveStores, setIsLoadingLiveStores] = useState(false);
  const [copiedStoreId, setCopiedStoreId] = useState<string | null>(null);

  // Form State for Adding a New Branch
  const [branchName, setBranchName] = useState("");
  const [address, setAddress] = useState("");
  const [state, setState] = useState("Maharashtra");
  const [district, setDistrict] = useState("Nagpur");
  const [city, setCity] = useState("Nagpur");
  const [pincode, setPincode] = useState("440010");
  const [phone, setPhone] = useState("+91 712 2550000");
  const [hours, setHours] = useState("10:00 AM – 10:00 PM (Daily)");
  const [latitude, setLatitude] = useState(21.1458);
  const [longitude, setLongitude] = useState(79.0882);
  const [storeEmail, setStoreEmail] = useState("");
  const [managerName, setManagerName] = useState("");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [menuImages, setMenuImages] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [storeType, setStoreType] = useState<"DINING" | "RETAIL" | "SERVICES">(
    /fab|retail|cloth|apparel|living|decor|grocery/i.test(currentMerchantName) ? "RETAIL" : "DINING"
  );

  // Offers & Merchants Resolution
  const effectiveOffers = useMemo(() => offers || store.offers || [], [offers, store.offers]);
  const effectiveMerchants = useMemo(() => merchants || store.merchants || [], [merchants, store.merchants]);

  // Merchant KYC Status Resolution
  const [liveKycStatus, setLiveKycStatus] = useState<string | null>(null);

  useEffect(() => {
    merchantApi
      .getProfile()
      .then((profile) => {
        if (profile?.kycStatus) {
          setLiveKycStatus(profile.kycStatus);
        }
      })
      .catch((err) => {
        console.warn("[BranchStores] Could not fetch merchant profile:", err);
      });
  }, []);

  const matchedMerchant = useMemo(() => {
    return (
      effectiveMerchants.find((m) => m.id === currentMerchantId) ||
      effectiveMerchants.find(
        (m) => m.businessName?.toLowerCase() === currentMerchantName?.toLowerCase()
      )
    );
  }, [effectiveMerchants, currentMerchantId, currentMerchantName]);

  const effectiveKycStatus =
    liveKycStatus ||
    matchedMerchant?.kycStatus ||
    store.currentUser?.kycStatus ||
    "PENDING";

  const isKycVerified =
    effectiveKycStatus === "VERIFIED" || effectiveKycStatus === "APPROVED";

  // Fetch Live Stores from Spring Boot backend on mount
  const fetchLiveStores = () => {
    setIsLoadingLiveStores(true);
    storeApi
      .getMyStores()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped: StoreType[] = data.map((s: any) => ({
            id: s.id,
            merchantId: s.merchantId || currentMerchantId || "",
            merchantName: s.merchantName || currentMerchantName,
            storeName: s.storeName || s.name || "Store Location",
            branchName: s.storeName || s.name || "Store Location",
            address: s.address || s.addressLine1 || "",
            district: s.district || s.addressLine2 || "",
            city: s.cityName || s.cityId || s.city || "Nagpur",
            state: s.state || "Maharashtra",
            pincode: s.pincode || "",
            latitude: s.latitude ? Number(s.latitude) : 21.1458,
            longitude: s.longitude ? Number(s.longitude) : 79.0882,
            status: s.status || "ACTIVE",
            phone: s.phone || s.contactPhone || "",
            operatingHours:
              s.operatingHours ||
              (s.openingTime && s.closingTime
                ? `${s.openingTime} – ${s.closingTime} (${s.operatingDays || "Daily"})`
                : "10:00 AM – 10:00 PM (Daily)"),
            storeEmail: s.storeEmail || s.managerEmail || `${s.id}@${merchantDomain}.in`,
            managerName: s.managerName || "Store Manager",
            managerEmail: s.managerEmail || s.storeEmail || `${s.id}@${merchantDomain}.in`,
            managerPhone: s.managerPhone || s.phone || s.contactPhone || "",
            createdAt: s.createdAt || new Date().toISOString(),
            hasActiveOffer: true,
            imageUrl: s.imageUrl || "",
            menuImages: Array.isArray(s.menuImages) ? s.menuImages : [],
            photos: Array.isArray(s.photos) ? s.photos : [],
            amenities: Array.isArray(s.amenities) ? s.amenities : [],
            cashbackPercentage: s.cashbackPercentage || 5,
            maxCashbackAmount: s.maxCashbackAmount || 150,
            minTransactionForCashback: s.minTransactionForCashback || 100
          }));
          setLiveStores(mapped);
        }
      })
      .catch((err) => {
        console.warn("[BranchStores] Live stores fetch warning:", err?.message);
      })
      .finally(() => {
        setIsLoadingLiveStores(false);
      });
  };

  useEffect(() => {
    fetchLiveStores();
  }, [currentMerchantId]);

  // Combined stores list: prefer live stores if available, fallback to props
  const effectiveStores = liveStores.length > 0 ? liveStores : stores;
  const isMyMerchant = (id?: string) =>
    !currentMerchantId || !id || id === currentMerchantId || id === store.currentUser?.merchantId || id === "m-1";
  const myStores = store.role === "merchant" ? effectiveStores : effectiveStores.filter((s) => isMyMerchant(s.merchantId));

  // Dynamic cities available across merchant stores
  const availableCities = useMemo(() => {
    const uniqueCities = Array.from(new Set(myStores.map((s) => s.city).filter(Boolean))).sort();
    return ["ALL", ...uniqueCities];
  }, [myStores]);

  // Executive KPI Metrics (Matching Super Admin)
  const activeCount = useMemo(
    () => myStores.filter((s) => s.status === "ACTIVE").length,
    [myStores]
  );
  const pendingCount = useMemo(
    () => myStores.filter((s) => s.status === "PENDING_APPROVAL").length,
    [myStores]
  );
  const inactiveCount = useMemo(
    () => myStores.filter((s) => s.status === "INACTIVE" || s.status === "CLOSED").length,
    [myStores]
  );
  const citiesCount = useMemo(
    () => new Set(myStores.map((s) => s.city).filter(Boolean)).size,
    [myStores]
  );

  // Tab counts with dynamic badges
  const tabCounts = useMemo(() => {
    return {
      ALL: myStores.length,
      ACTIVE: activeCount,
      PENDING_APPROVAL: pendingCount,
      INACTIVE: inactiveCount
    };
  }, [myStores, activeCount, pendingCount, inactiveCount]);

  // Filtered store outlets based on Status Tab and City Chip
  const displayedStores = useMemo(() => {
    return myStores.filter((s) => {
      if (statusFilter !== "ALL") {
        if (statusFilter === "ACTIVE" && s.status !== "ACTIVE") return false;
        if (statusFilter === "PENDING_APPROVAL" && s.status !== "PENDING_APPROVAL") return false;
        if (statusFilter === "INACTIVE" && s.status !== "INACTIVE" && s.status !== "CLOSED") return false;
      }
      if (cityFilter !== "ALL" && (s.city || "").toLowerCase() !== cityFilter.toLowerCase()) {
        return false;
      }
      return true;
    });
  }, [myStores, statusFilter, cityFilter]);

  // Store search matching across all fields
  const matchStoreSearch = (s: StoreType, q: string) => {
    if (!q || !q.trim()) return true;
    const query = q.toLowerCase().trim();
    const brand = effectiveMerchants.find((m) => m.id === s.merchantId)?.businessName?.toLowerCase() || "";
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

  // CSV Export
  const handleExportStoresCsv = () => {
    if (myStores.length === 0) {
      toast.info("No stores to export");
      return;
    }
    const headers = ["ID,StoreName,Brand,Address,City,District,State,Pincode,Latitude,Longitude,OperatingHours,Status"];
    const rows = myStores.map(
      (s) =>
        `"${s.id}","${s.branchName}","${s.merchantName || currentMerchantName}","${(s.address || "").replace(/"/g, '""')}","${s.city || ""}","${s.district || ""}","${s.state || ""}","${s.pincode || ""}",${s.latitude || 21.1458},${s.longitude || 79.0882},"${s.operatingHours || ""}","${s.status || "ACTIVE"}"`
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `pinak-merchant-outlets-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${myStores.length} store branch records to CSV!`);
  };

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

  const handleResendInvite = async (s: StoreType) => {
    // 1. Resolve staff assignment if any
    const storeStaff = (store as any).staff?.filter((m: any) => m.storeId === s.id) || [];
    const assignedStaff = storeStaff[0];

    // 2. Resolve manager recipient email
    let emailToSend = (
      assignedStaff?.email ||
      s.managerEmail ||
      s.storeEmail ||
      ""
    ).trim();

    if (!emailToSend || !emailToSend.includes("@") || emailToSend.endsWith("@example.com") || emailToSend === "Not configured") {
      const fallbackPrompt = window.prompt(
        `Enter the store manager's email address to send the activation invite for "${s.branchName || s.storeName}":`,
        emailToSend && emailToSend.includes("@") ? emailToSend : `${merchantDomain}.manager@pinak.app`
      );
      if (!fallbackPrompt || !fallbackPrompt.trim()) {
        return; // User canceled
      }
      emailToSend = fallbackPrompt.trim();
      s.storeEmail = emailToSend;
      s.managerEmail = emailToSend;
    }

    const nameToSend = (assignedStaff?.name || s.managerName || s.branchName || "Store Manager").trim();
    const toastId = toast.loading(`Dispatching manager activation & welcome email to ${emailToSend}...`);

    try {
      // Primary: Dispatch real email through backend store invite API
      await storeApi.resendStoreInvite(s.id, {
        email: emailToSend,
        managerName: nameToSend,
        branchName: s.branchName || s.storeName
      });

      // Also sync staff assignment status if staff member exists
      if (assignedStaff?.id) {
        try {
          await staffApi.resendMerchantStaffInvite(assignedStaff.id);
        } catch {
          // Store invite already sent
        }
      }

      toast.success(`Manager activation & welcome email successfully delivered to ${emailToSend}!`, {
        id: toastId,
        duration: 4000
      });

      store.addAudit({
        action: "STORE_INVITE_RESENT",
        entity: "Store",
        actor: store.currentUser?.name || "Merchant Owner",
        severity: "info",
        metadata: { details: `Dispatched manager activation invite to ${emailToSend} for ${s.branchName} (${s.id})` }
      });
    } catch (err: any) {
      console.warn("Backend resend email dispatch:", err);
      // Generate invite link as fallback and copy to clipboard
      handleCopyManagerInvite(s);
      const errMsg = err?.response?.data?.message || err?.message;
      toast.info(
        `Offline/Mock mode: ${errMsg ? errMsg + ". " : ""}Invite setup link generated & copied to clipboard for ${emailToSend}!`,
        { id: toastId, duration: 5000 }
      );
    }
  };

  const handleDeleteConfirmed = () => {
    if (!storeToDelete) return;
    if (onDeleteStore) {
      onDeleteStore(storeToDelete.id);
    } else {
      store.deleteStore(storeToDelete.id);
    }
    setLiveStores((prev) => prev.filter((st) => st.id !== storeToDelete.id));
    store.addAudit({
      action: "STORE_DELETED",
      entity: "Store",
      actor: store.currentUser?.name || "Merchant Owner",
      severity: "warning",
      metadata: { details: `Permanently removed store outlet "${storeToDelete.branchName}" (${storeToDelete.id})` }
    });
    setStoreToDelete(null);
  };

  // Table Columns Matching Super Admin Exactly
  const columns: Column<StoreType>[] = [
    {
      header: "Store & Brand",
      sortable: true,
      accessor: "branchName",
      render: (s) => {
        const branchTitle = s.branchName || s.storeName || (s as any).name || "Branch Outlet";
        const parentMerchant = effectiveMerchants.find((m) => m.id === s.merchantId);
        const brandName = parentMerchant?.businessName || s.merchantName || currentMerchantName;
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
      header: "Manager & Access",
      sortable: false,
      render: (s) => {
        if (s.managerName) {
          return (
            <div className="min-w-0 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200 truncate">
                <UserCheck size={12} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="truncate">{s.managerName}</span>
              </div>
              <div className="text-[11px] text-slate-400 truncate mt-0.5 flex items-center gap-1">
                <Mail size={11} className="text-slate-400 shrink-0" />
                <span>{s.storeEmail || s.managerEmail || s.phone || "No contact"}</span>
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
      header: "Txn Cashback",
      sortable: false,
      className: "w-28 text-center whitespace-nowrap",
      render: (s) => (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60 shadow-2xs">
          <Coins size={12} className="text-amber-600 dark:text-amber-400" />
          <span>{s.cashbackPercentage || 5}% on Bill</span>
        </span>
      )
    },
    {
      header: "Table Booking",
      sortable: false,
      className: "w-32 text-center whitespace-nowrap",
      render: (s) => {
        if (s.isTableBookingEnabled === false) {
          return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              Disabled
            </span>
          );
        }
        if (s.allowFreeStandardBooking === false && (s.defaultStandardCoverCharge || 0) > 0) {
          return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60">
              <UtensilsCrossed size={10} />
              ₹{s.defaultStandardCoverCharge} Cover
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
            <UtensilsCrossed size={10} />
            Free Booking
          </span>
        );
      }
    },
    {
      header: "Live Deals",
      sortable: false,
      className: "w-32 text-center whitespace-nowrap",
      render: (s) => {
        const storeDeals = effectiveOffers.filter(
          (o) =>
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
        if (s.status === "PENDING_APPROVAL" || s.managerEmail) {
          return (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60 whitespace-nowrap"
              title={s.managerEmail ? "Store status will become Active once store manager completes password setup via invite" : "Under review"}
            >
              <Clock size={11} />
              {s.managerEmail ? "Pending Invite" : "Review"}
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
      className: "w-28 text-right whitespace-nowrap",
      render: (s) => {
        const safeCoords = `${Number(s.latitude || 21.1458).toFixed(4)}, ${Number(s.longitude || 79.0882).toFixed(4)}`;
        return (
          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
            {/* 3-Dots Dropdown Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800 transition-colors"
                  title="Store Outlet Actions"
                >
                  <MoreVertical size={14} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 p-1.5 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#121626]"
              >
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
                  onClick={() => window.open(`/customer-preview?storeId=${s.id}`, "_blank")}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold cursor-pointer text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40"
                >
                  <Smartphone size={14} className="text-purple-600 dark:text-purple-400" />
                  <span>Customer App Preview</span>
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

                <DropdownMenuItem
                  onClick={() => handleResendInvite(s)}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold cursor-pointer text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                >
                  <Send size={14} className="text-indigo-600 dark:text-indigo-400" />
                  <span>Resend Activation Email</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => handleCopyManagerInvite(s)}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Copy size={14} className="text-slate-400" />
                  <span>Copy Password Invite</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-1 bg-slate-100 dark:bg-slate-800" />

                {s.status !== "ACTIVE" ? (
                  <DropdownMenuItem
                    onClick={() => {
                      if (onUpdateStore) {
                        onUpdateStore(s.id, { status: "ACTIVE" });
                      } else {
                        store.updateStore(s.id, { status: "ACTIVE" });
                      }
                      setLiveStores((prev) =>
                        prev.map((item) => (item.id === s.id ? { ...item, status: "ACTIVE" } : item))
                      );
                      toast.success(`Store "${s.branchName}" activated & live on app!`);
                    }}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold cursor-pointer text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                  >
                    <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
                    <span>Approve & Activate</span>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={() => {
                      if (onUpdateStore) {
                        onUpdateStore(s.id, { status: "INACTIVE" });
                      } else {
                        store.updateStore(s.id, { status: "INACTIVE" });
                      }
                      setLiveStores((prev) =>
                        prev.map((item) => (item.id === s.id ? { ...item, status: "INACTIVE" } : item))
                      );
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
      {/* Header (Exact Match to Super Admin StoreManagement) */}
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
            type="button"
            onClick={() => {
              if (!isKycVerified) {
                toast.error("Merchant KYC Verification Required", {
                  description: `Your merchant account KYC status is currently "${effectiveKycStatus}". Store branch creation is locked until your KYC is verified and approved.`
                });
                return;
              }
              setIsAddOpen(true);
            }}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md",
              isKycVerified
                ? "btn-gradient text-white hover:opacity-95 cursor-pointer"
                : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700"
            )}
            title={!isKycVerified ? `Store branch creation locked (KYC: ${effectiveKycStatus})` : "Add a new store branch"}
          >
            <Plus size={16} />
            <span>Add Store Branch</span>
            {!isKycVerified && <Lock size={12} className="ml-0.5 text-amber-500" />}
          </button>
        </div>
      </div>

      {/* Merchant KYC Verification Alert Banner */}
      {!isKycVerified && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start justify-between gap-4 shadow-xs animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 shrink-0 mt-0.5">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
                <span>KYC Verification Incomplete — Store Creation Locked</span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-amber-200 dark:bg-amber-900/80 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                  {effectiveKycStatus}
                </span>
              </h4>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1 max-w-3xl leading-relaxed">
                Branch store creation is locked because your merchant account KYC status is currently <strong>{effectiveKycStatus}</strong>. Merchant KYC documents must be verified and approved by the platform team before branch stores can be created and onboarded.
              </p>
            </div>
          </div>
          <div className="shrink-0 flex items-center">
            <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-900/40 px-3 py-1.5 rounded-xl border border-amber-200/80 dark:border-amber-800/60">
              Awaiting KYC Approval
            </span>
          </div>
        </div>
      )}

      {/* Executive KPI Summary Cards (Exact Match to Super Admin) */}
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
              {myStores.length}
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
              {myStores.length > 0 ? Math.round((activeCount / myStores.length) * 100) : 0}% Active Coverage
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
              {pendingCount > 0 ? "Awaiting Location Clearance" : "All Outlets Verified"}
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

      {/* Status Filter Tabs + Dynamic City Filter + View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Status Filter Tabs with Counts */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { id: "ALL", label: "All Stores", count: tabCounts.ALL },
            { id: "ACTIVE", label: "Active", count: tabCounts.ACTIVE },
            { id: "PENDING_APPROVAL", label: "Pending Review", count: tabCounts.PENDING_APPROVAL },
            { id: "INACTIVE", label: "Inactive", count: tabCounts.INACTIVE }
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
              {availableCities.map((c) => (
                <button
                  key={c}
                  onClick={() => setCityFilter(c)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors border ${
                    cityFilter === c
                      ? "bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 border-pink-200 dark:border-pink-800 font-bold"
                      : "border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {c === "ALL" ? "All Cities" : c}
                </button>
              ))}
            </div>
          )}

          {/* View Mode Switcher */}
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

      {isLoadingLiveStores && (
        <div className="flex items-center justify-center py-12 gap-3 text-slate-500 text-xs">
          <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
          <span>Loading live store branch outlets from database...</span>
        </div>
      )}

      {/* MAIN CONTENT: TABLE OR CARDS VIEW */}
      {!isLoadingLiveStores && viewMode === "table" ? (
        <AdvancedTable
          columns={columns}
          data={displayedStores}
          keyExtractor={(s) => s.id}
          onRowClick={(s) => setSelectedStore(s)}
          searchPlaceholder="Search store branch, brand, street address, or city..."
          searchFilter={(s, q) => matchStoreSearch(s, q)}
        />
      ) : (
        !isLoadingLiveStores && (
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
                  className="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-slate-900 dark:text-white"
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
                <span>
                  Showing{" "}
                  <strong>
                    {displayedStores.filter((s) => matchStoreSearch(s, cardSearch)).length}
                  </strong>{" "}
                  of <strong>{myStores.length}</strong> store branches
                </span>
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
                    const brand =
                      effectiveMerchants.find((m) => m.id === s.merchantId)?.businessName ||
                      s.merchantName ||
                      currentMerchantName;
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

                            {/* 3-Dots Dropdown Menu */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                  title="Store Actions"
                                >
                                  <MoreVertical size={15} />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="w-56 p-1.5 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#121626]"
                              >
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
                                  onClick={() => window.open(`/customer-preview?storeId=${s.id}`, "_blank")}
                                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold cursor-pointer text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40"
                                >
                                  <Smartphone size={14} className="text-purple-600 dark:text-purple-400" />
                                  <span>Customer App Preview</span>
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
                                    const safeCoords = `${Number(s.latitude || 21.1458).toFixed(4)}, ${Number(s.longitude || 79.0882).toFixed(4)}`;
                                    navigator.clipboard.writeText(safeCoords);
                                    toast.success(`Copied Coordinates: ${safeCoords}`);
                                  }}
                                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                  <MapPin size={14} className="text-pink-500" />
                                  <span>Copy Coordinates</span>
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  onClick={() => handleResendInvite(s)}
                                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold cursor-pointer text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                                >
                                  <Send size={14} className="text-indigo-600 dark:text-indigo-400" />
                                  <span>Resend Activation Email</span>
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  onClick={() => handleCopyManagerInvite(s)}
                                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                  <Copy size={14} className="text-slate-400" />
                                  <span>Copy Password Invite</span>
                                </DropdownMenuItem>

                                <DropdownMenuSeparator className="my-1 bg-slate-100 dark:bg-slate-800" />

                                {s.status !== "ACTIVE" ? (
                                  <DropdownMenuItem
                                    onClick={() => {
                                      if (onUpdateStore) {
                                        onUpdateStore(s.id, { status: "ACTIVE" });
                                      } else {
                                        store.updateStore(s.id, { status: "ACTIVE" });
                                      }
                                      setLiveStores((prev) =>
                                        prev.map((item) => (item.id === s.id ? { ...item, status: "ACTIVE" } : item))
                                      );
                                      toast.success(`Store "${s.branchName}" activated & live on app!`);
                                    }}
                                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold cursor-pointer text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                                  >
                                    <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
                                    <span>Approve & Activate</span>
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    onClick={() => {
                                      if (onUpdateStore) {
                                        onUpdateStore(s.id, { status: "INACTIVE" });
                                      } else {
                                        store.updateStore(s.id, { status: "INACTIVE" });
                                      }
                                      setLiveStores((prev) =>
                                        prev.map((item) => (item.id === s.id ? { ...item, status: "INACTIVE" } : item))
                                      );
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
                              const storeDeals = effectiveOffers.filter(
                                (o) =>
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
                                  <span>{count > 0 ? `${count} Live ${count === 1 ? "Deal" : "Deals"}` : "+ Add Deal"}</span>
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

                            {/* Store Manager Display */}
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

                        {/* Card Footer Quick Actions */}
                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                          <span className="text-[11px] text-slate-400 truncate max-w-[140px] flex items-center gap-1">
                            {s.phone ? (
                              <>
                                <Phone size={11} className="text-slate-400 shrink-0" />
                                <span>{s.phone}</span>
                              </>
                            ) : (
                              "No phone listed"
                            )}
                          </span>

                          <div className="flex items-center gap-1.5">
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
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )
      )}

      {/* Map Pin Right-Side Slide-Over Drawer (Matching Super Admin StorePinDrawer Exactly) */}
      {selectedStore && (
        <StorePinDrawer
          store={selectedStore}
          offers={effectiveOffers}
          onCreateOffer={() => {
            const st = selectedStore;
            setSelectedStore(null);
            setStoreForOffer(st);
          }}
          onClose={() => setSelectedStore(null)}
          onEdit={() => {
            const st = selectedStore;
            setSelectedStore(null);
            setStoreToEdit(st);
          }}
          onResendInvite={() => handleResendInvite(selectedStore)}
          onCopyInvite={() => handleCopyManagerInvite(selectedStore)}
        />
      )}

      {/* Create Offer for Specific Store Slide-Over Drawer */}
      {storeForOffer && (
        <OfferCampaignFormDrawer
          merchants={effectiveMerchants}
          stores={myStores}
          merchantId={storeForOffer.merchantId}
          merchantName={storeForOffer.merchantName || currentMerchantName}
          initialData={
            {
              applicableStoreIds: [storeForOffer.id],
              storeId: storeForOffer.id,
              scopeType: "SERVICE",
              ctaText: "Book & Pay"
            } as any
          }
          onClose={() => setStoreForOffer(null)}
          onSave={(draft) => {
            if (onAddOffer) {
              onAddOffer({
                ...draft,
                merchantId: storeForOffer.merchantId,
                applicableStoreIds: [storeForOffer.id],
                storeId: storeForOffer.id
              });
            } else {
              store.addOffer({
                ...draft,
                id: `off-${Date.now()}`,
                merchantId: storeForOffer.merchantId,
                applicableStoreIds: [storeForOffer.id],
                storeId: storeForOffer.id,
                status: "ACTIVE"
              } as any);
              toast.success(`Created campaign deal for ${storeForOffer.branchName}!`);
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
            } else {
              store.updateStore(storeToEdit.id, updates);
            }
            setStoreToEdit(null);
            fetchLiveStores();
            toast.success(`Store outlet "${updates.branchName || storeToEdit.branchName}" updated!`);
          }}
        />
      )}

      {/* Add Store Branch Right-Side Slide-Over Drawer (Matching Super Admin Exactly) */}
      {isAddOpen && (
        <AddStoreDrawer
          merchants={effectiveMerchants}
          currentMerchantId={currentMerchantId}
          currentMerchantName={currentMerchantName}
          isKycVerified={isKycVerified}
          merchantKycStatus={effectiveKycStatus}
          onClose={() => setIsAddOpen(false)}
          onSave={async (draft) => {
            if (!isKycVerified) {
              toast.error("Merchant KYC verification required before creating branch stores.");
              return;
            }
            if (onAddStore) {
              await onAddStore(draft);
            } else {
              store.addStore(draft);
            }
            setIsAddOpen(false);
            fetchLiveStores();
          }}
        />
      )}

      {/* Delete Store Confirmation Modal */}
      {storeToDelete && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-[#121626] rounded-3xl p-6 shadow-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Store Outlet?</h3>
                <p className="text-xs text-slate-500">Physical outlet decommissioning</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800 leading-relaxed">
              Are you sure you want to permanently delete{" "}
              <strong className="text-slate-900 dark:text-white">{storeToDelete.branchName}</strong>? This will deactivate the outlet, disconnect the assigned manager account, and unpublish active geo-fenced offers.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStoreToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirmed}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition-colors"
              >
                Yes, Delete Outlet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==============================================================================
// SLIDE-OVER DRAWER: STORE PIN DRAWER (Overview, Location, Media, Manager, Deals)
// Matches Super Admin's StorePinDrawer exactly
// ==============================================================================
function StorePinDrawer({
  store,
  offers = [],
  onCreateOffer,
  onClose,
  onEdit,
  onResendInvite,
  onCopyInvite
}: {
  store: StoreType;
  offers?: Offer[];
  onCreateOffer?: () => void;
  onClose: () => void;
  onEdit?: () => void;
  onResendInvite?: () => void;
  onCopyInvite?: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"overview" | "location" | "media" | "manager" | "deals">("overview");
  const [storeStaff, setStoreStaff] = useState<BackendStaffResponse[]>([]);
  const [previewZoomImage, setPreviewZoomImage] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  useEffect(() => {
    if (store.id) {
      staffApi
        .getMerchantStaff("STORE", store.id)
        .then((res) => setStoreStaff(res))
        .catch(() => setStoreStaff([]));
    }
  }, [store.id]);

  const assignedStaff = storeStaff[0];

  const storeDeals = offers.filter(
    (o) =>
      (o.applicableStoreIds && o.applicableStoreIds.includes(store.id)) ||
      o.storeId === store.id ||
      (!o.applicableStoreIds?.length && o.merchantId === store.merchantId)
  );

  const menuCount = store.menuImages?.length || 0;
  const photoCount = store.photos?.length || 0;
  const amenityCount = store.amenities?.length || 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <aside className="w-screen max-w-xl bg-white dark:bg-[#121626] shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
          {/* Header */}
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
                    <span className="truncate max-w-[140px] text-purple-700 dark:text-purple-300 font-semibold">
                      {store.merchantName}
                    </span>
                    <span>·</span>
                    <span>
                      {store.city}, {store.state} {store.pincode ? `(${store.pincode})` : ""}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`/customer-preview?storeId=${store.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center gap-1.5 border border-purple-200 dark:border-purple-800 shadow-2xs transition-colors"
                  title="Open live interactive customer mobile app preview for this store"
                >
                  <Smartphone size={13} />
                  <span>Customer Preview</span>
                </a>
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

          {/* Navigation Tabs (5 Tabs) */}
          <div className="px-6 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-1 overflow-x-auto text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className={cn(
                "px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0",
                activeTab === "overview"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
              )}
            >
              📌 Overview
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("location")}
              className={cn(
                "px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0",
                activeTab === "location"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
              )}
            >
              🗺️ Location & Map
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("media")}
              className={cn(
                "px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 flex items-center gap-1",
                activeTab === "media"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
              )}
            >
              🍽️ Menu & Photos
              {(menuCount > 0 || photoCount > 0) && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 text-[10px] font-bold">
                  {menuCount + photoCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("manager")}
              className={cn(
                "px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0",
                activeTab === "manager"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
              )}
            >
              👤 Manager & Staff
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("deals")}
              className={cn(
                "px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 flex items-center gap-1",
                activeTab === "deals"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
              )}
            >
              🏷️ Deals ({storeDeals.length})
            </button>
          </div>

          {/* Drawer Body - Tab Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
            {/* TAB 1: OVERVIEW */}
            {activeTab === "overview" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* Store Transaction Cashback Configuration Card */}
                <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold">
                        <Coins size={16} />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-amber-950 dark:text-amber-200 text-xs">
                          Transaction Cashback on Bill Pay
                        </h4>
                        <p className="text-[10px] text-amber-700/80 dark:text-amber-400">
                          Loyalty coins earned by diners on UPI bill payment at this outlet
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-200/80 dark:bg-amber-900 text-amber-900 dark:text-amber-200">
                      💰 {store.cashbackPercentage || 5}% on Bill
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-amber-200/50 dark:border-amber-900/40 text-[11px]">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Cashback Rate:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{store.cashbackPercentage || 5}%</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Max Cap per Txn:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">₹{store.maxCashbackAmount || 150}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Min Spend Req:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">₹{store.minTransactionForCashback || 100}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-900/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                      Branch Identity & Store Info
                    </span>
                    <Badge variant={store.status === "ACTIVE" ? "success" : "warning"}>
                      {store.status === "ACTIVE" ? "Active on Discovery" : "Needs Review"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Merchant Brand:</span>
                      <span className="font-bold text-purple-700 dark:text-purple-300">
                        {store.merchantName || store.storeName || "Brand Merchant"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Outlet Category:</span>
                      <span className="font-semibold text-purple-700 dark:text-purple-300">
                        Dining & Retail
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Contact Phone:</span>
                      {store.phone ? (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <a
                            href={`tel:${store.phone}`}
                            className="font-bold font-mono text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                          >
                            <Phone size={11} />
                            <span>{store.phone}</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(store.phone);
                              setCopiedPhone(true);
                              toast.success("Phone number copied!");
                              setTimeout(() => setCopiedPhone(false), 2000);
                            }}
                            className="p-0.5 text-slate-400 hover:text-slate-600"
                            title="Copy Phone"
                          >
                            {copiedPhone ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Not specified</span>
                      )}
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Store Email:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                        {store.storeEmail || store.managerEmail || `${store.id}@pinak.app`}
                      </span>
                    </div>
                  </div>

                  {/* Registered Physical Address */}
                  <div className="pt-2 border-t border-purple-200/50 dark:border-purple-900/50 text-xs">
                    <span className="text-slate-400 block text-[11px]">Registered Address:</span>
                    <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5 leading-relaxed">
                      {store.address}
                      {store.district ? `, ${store.district}` : ""}
                      {store.city ? `, ${store.city}` : ""}
                      {store.state ? `, ${store.state}` : ""}
                      {store.pincode ? ` - ${store.pincode}` : ""}
                    </p>
                  </div>
                </div>

                {/* Quick Metrics */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <button
                    type="button"
                    onClick={() => setActiveTab("media")}
                    className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 hover:bg-amber-100/60 transition-colors"
                  >
                    <span className="text-[10px] text-amber-700 dark:text-amber-300 font-semibold uppercase block">Menu Cards</span>
                    <span className="text-lg font-extrabold text-amber-900 dark:text-amber-100">{menuCount}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("media")}
                    className="p-3 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-900/40 hover:bg-purple-100/60 transition-colors"
                  >
                    <span className="text-[10px] text-purple-700 dark:text-purple-300 font-semibold uppercase block">Store Photos</span>
                    <span className="text-lg font-extrabold text-purple-900 dark:text-purple-100">{photoCount}</span>
                  </button>
                  <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40">
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold uppercase block">Amenities</span>
                    <span className="text-lg font-extrabold text-emerald-900 dark:text-emerald-100">{amenityCount}</span>
                  </div>
                </div>

                {/* Operating Schedule */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Operating Schedule:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Clock size={13} className="text-amber-500" />
                      {store.operatingHours || "10:00 AM – 10:00 PM (Daily)"}
                    </span>
                  </div>
                </div>

                {/* Amenities Badges in Overview */}
                {amenityCount > 0 && (
                  <div className="p-4 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 space-y-2">
                    <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                      Amenities & Facilities ({amenityCount})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {store.amenities!.map((am, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs"
                        >
                          {am}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: LOCATION & MAP */}
            {activeTab === "location" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-xs">
                      <MapPin size={15} className="text-pink-600" />
                      <span>Physical Store Address</span>
                    </span>
                    <a
                      href={`https://www.google.com/maps?q=${store.latitude},${store.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-bold text-pink-600 dark:text-pink-400 hover:underline flex items-center gap-1"
                    >
                      <span>Google Maps</span>
                      <ExternalLink size={11} />
                    </a>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Street / Building:</span>
                      <p className="font-bold text-slate-900 dark:text-white mt-0.5">{store.address}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">District / Region:</span>
                      <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                        {store.district || store.city}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">City & State:</span>
                      <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                        {store.city}, {store.state}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Postal Pincode:</span>
                      <p className="font-mono font-bold text-purple-700 dark:text-purple-300 mt-0.5">
                        {store.pincode}
                      </p>
                    </div>
                  </div>
                </div>

                {/* GPS Coordinates */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Latitude</span>
                    <p className="font-mono text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                      {store.latitude?.toFixed(6)}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Longitude</span>
                    <p className="font-mono text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                      {store.longitude?.toFixed(6)}
                    </p>
                  </div>
                </div>

                {/* Real Interactive Leaflet Geocode Map */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Compass size={13} className="text-pink-600" />
                      <span>Interactive Leaflet Map Pinpoint</span>
                    </span>
                  </div>
                  <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-xs">
                    <StoreLocationPicker
                      latitude={store.latitude}
                      longitude={store.longitude}
                      city={store.city}
                      state={store.state}
                      storeName={store.branchName}
                      height="240px"
                      onChange={() => {}}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: MENUS & STORE PHOTOS */}
            {activeTab === "media" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* Menu Cards */}
                <div className="space-y-2.5">
                  <h5 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-xs">
                    <UtensilsCrossed size={14} className="text-amber-500" />
                    <span>Store Menu Cards ({menuCount})</span>
                  </h5>

                  {menuCount > 0 ? (
                    <div className="grid grid-cols-3 gap-3">
                      {store.menuImages!.map((img, i) => (
                        <div
                          key={i}
                          onClick={() => setPreviewZoomImage(img)}
                          className="relative group rounded-xl overflow-hidden aspect-3/4 border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer"
                        >
                          <img
                            src={img}
                            alt={`Menu page ${i + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                          <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/75 text-[9px] font-bold text-white">
                            Page {i + 1}
                          </span>
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Eye size={16} className="text-white drop-shadow" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-400">
                      No menu cards uploaded.
                    </div>
                  )}
                </div>

                {/* Store Photos */}
                <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <h5 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-xs">
                    <Camera size={14} className="text-purple-500" />
                    <span>Store Photos ({photoCount})</span>
                  </h5>

                  {photoCount > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {store.photos!.map((img, i) => (
                        <div
                          key={i}
                          onClick={() => setPreviewZoomImage(img)}
                          className="relative group rounded-xl overflow-hidden aspect-video border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer"
                        >
                          <img
                            src={img}
                            alt={`Photo ${i + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Eye size={16} className="text-white drop-shadow" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-400">
                      No store photos uploaded.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: MANAGER & ACCESS */}
            {activeTab === "manager" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-white dark:from-indigo-950/30 dark:via-purple-950/20 dark:to-[#121626] border border-indigo-200/80 dark:border-indigo-900/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold">
                        <UserCheck size={16} />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white text-xs block">
                          Assigned Store Manager
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Merchant Portal & POS Terminal Access
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

                  <div className="space-y-2 pt-1 text-xs">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500 text-[11px]">Manager Name:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {assignedStaff?.name || store.managerName || "Designated Store Manager"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500 text-[11px] flex items-center gap-1">
                        <Mail size={12} className="text-slate-400" />
                        <span>Work Email:</span>
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                          {assignedStaff?.email || store.managerEmail || store.storeEmail || "Not configured"}
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
                            className="p-1 rounded text-slate-400 hover:text-slate-600"
                          >
                            <Copy size={11} />
                          </button>
                        )}
                      </div>
                    </div>

                    {(assignedStaff?.phone || store.managerPhone || store.phone) && (
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500 text-[11px] flex items-center gap-1">
                          <Phone size={12} className="text-slate-400" />
                          <span>Mobile Number:</span>
                        </span>
                        <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                          {assignedStaff?.phone || store.managerPhone || store.phone}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-2 border-t border-purple-100 dark:border-purple-900/50">
                    <span className="text-slate-500">Password Activation Link:</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (onCopyInvite) {
                          onCopyInvite();
                        } else {
                          const token = `mgr_inv_${store.id}_${Date.now().toString(36)}`;
                          const inviteUrl = `${window.location.origin}/accept-invite?token=${encodeURIComponent(token)}`;
                          navigator.clipboard.writeText(inviteUrl);
                          setCopiedLink(true);
                          toast.success("Manager password setup link copied!");
                          setTimeout(() => setCopiedLink(false), 2500);
                        }
                      }}
                      className="inline-flex items-center gap-1 text-purple-600 dark:text-purple-400 font-bold hover:underline"
                    >
                      {copiedLink ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                      <span>{copiedLink ? "Copied Link!" : "Copy Setup Link"}</span>
                    </button>
                  </div>

                  {onResendInvite && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={onResendInvite}
                        className="w-full py-2 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-indigo-200 dark:border-indigo-800"
                      >
                        <Send size={13} />
                        <span>Resend Manager Welcome & Activation Email</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: DEALS & OFFERS */}
            {activeTab === "deals" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                    Active Deals ({storeDeals.length})
                  </span>
                  {onCreateOffer && (
                    <button
                      type="button"
                      onClick={onCreateOffer}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-950/40 flex items-center gap-1"
                    >
                      <Plus size={12} />
                      <span>Add Deal</span>
                    </button>
                  )}
                </div>

                {storeDeals.length > 0 ? (
                  <div className="space-y-2">
                    {storeDeals.map((deal) => (
                      <div
                        key={deal.id}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white text-xs">{deal.title}</p>
                          <p className="text-[11px] text-slate-400">
                            {deal.type} • {deal.badgeText || "Special Deal"}
                          </p>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                          Active
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 text-slate-400">
                    No active deals linked to this outlet yet.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {onEdit && (
                <button
                  type="button"
                  onClick={onEdit}
                  className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-bold text-xs flex items-center gap-1.5 border border-amber-200 dark:border-amber-800 shadow-2xs transition-colors"
                >
                  <Pencil size={13} />
                  <span>Edit Details</span>
                </button>
              )}
            </div>

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              Close
            </button>
          </div>
        </aside>
      </div>

      {/* Lightbox Modal for Zooming Menu or Photo */}
      {previewZoomImage && (
        <div
          className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewZoomImage(null)}
        >
          <div
            className="relative max-w-3xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={previewZoomImage}
              alt="Full Preview"
              className="max-w-full max-h-[82vh] object-contain mx-auto"
            />
            <div className="p-3 bg-slate-950 flex items-center justify-between border-t border-slate-800 text-xs">
              <span className="text-slate-300 font-medium">Image Preview</span>
              <button
                type="button"
                onClick={() => setPreviewZoomImage(null)}
                className="px-3 py-1 rounded-lg bg-slate-800 text-white font-bold hover:bg-slate-700"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==============================================================================
// SLIDE-OVER DRAWER: EDIT STORE OUTLET (3-Step Wizard with Step Navigation Guard)
// ==============================================================================
function AddStoreDrawer({
  merchants,
  currentMerchantId,
  currentMerchantName,
  isKycVerified,
  merchantKycStatus,
  onClose,
  onSave
}: {
  merchants: Merchant[];
  currentMerchantId?: string;
  currentMerchantName?: string;
  isKycVerified?: boolean;
  merchantKycStatus?: string;
  onClose: () => void;
  onSave: (draft: any) => void;
}) {
  const [currentStep, setCurrentStep] = useState<number>(1);

  // In merchant portal, brand is already known & locked to the logged-in merchant
  const defaultMerchant =
    merchants.find((m) => m.id === currentMerchantId) ||
    merchants.find((m) => m.businessName?.toLowerCase() === currentMerchantName?.toLowerCase()) ||
    merchants[0];

  const resolvedMerchantId = currentMerchantId || defaultMerchant?.id || "m-1";
  const brandNameDisplay = defaultMerchant?.businessName || currentMerchantName || "My Store Brand";
  const [merchantId] = useState(resolvedMerchantId);
  const selectedMerchant = defaultMerchant || merchants.find((m) => m.id === resolvedMerchantId);

  const isKycOk = isKycVerified !== undefined
    ? isKycVerified
    : Boolean(selectedMerchant && (selectedMerchant.kycStatus === "APPROVED" || selectedMerchant.kycStatus === "VERIFIED"));
  const currentKycLabel = merchantKycStatus || selectedMerchant?.kycStatus || "PENDING";
  const [branchName, setBranchName] = useState("");
  const [address, setAddress] = useState("");
  const [state, setState] = useState("Maharashtra");
  const [district, setDistrict] = useState("Nagpur");
  const [city, setCity] = useState("Nagpur");
  const [pincode, setPincode] = useState("440010");
  const [latitude, setLatitude] = useState(21.1458);
  const [longitude, setLongitude] = useState(79.0882);
  const [operatingHours, setOperatingHours] = useState("10:00 AM – 10:00 PM");
  const [phone, setPhone] = useState("+917122550000");
  const [managerName, setManagerName] = useState("");
  const [managerEmail, setManagerEmail] = useState("");
  const [managerPhone, setManagerPhone] = useState("");
  const [managerEmailNotice, setManagerEmailNotice] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [menuImages, setMenuImages] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [storeType, setStoreType] = useState<"DINING" | "RETAIL" | "SERVICES">("DINING");
  const [isTableBookingEnabled, setIsTableBookingEnabled] = useState<boolean>(true);
  const [allowFreeStandardBooking, setAllowFreeStandardBooking] = useState<boolean>(true);
  const [defaultStandardCoverCharge, setDefaultStandardCoverCharge] = useState<number>(0);

  const ADD_STEPS = [
    { id: 1, title: "Basic Info", subtitle: "Brand & Hours" },
    { id: 2, title: "Location", subtitle: "Address & GPS" },
    { id: 3, title: "Media", subtitle: "Menu & Photos" },
    { id: 4, title: "Manager", subtitle: "Access & Review" },
  ];

  const handleAutoFillStore = () => {
    let target = selectedMerchant;
    if (!target && merchants.length > 0) {
      target = merchants.find((m) => m.id === currentMerchantId) || merchants[0];
    }

    const brand = target?.businessName || brandNameDisplay || "Flagship Outlet";
    const mCity = target?.city || "Nagpur";
    const mDistrict = target?.district || mCity;
    const mState = target?.state || "Maharashtra";
    const mPincode = target?.pincode || "440010";
    const mAddress = target?.address || `West High Court Road, ${mCity} Central`;

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
    const cleanFirstName = brand.split(" ")[0].toLowerCase().replace(/[^a-z0-9]/g, "") || "manager";

    setBranchName(`${brand} – ${mCity} Flagship`);
    setAddress(mAddress);
    setState(mState);
    setDistrict(mDistrict);
    setCity(mCity);
    setPincode(mPincode);
    setLatitude(lat);
    setLongitude(lng);
    setOperatingHours("10:00 AM – 10:00 PM");
    setPhone(target?.ownerPhone ? target.ownerPhone.replace(/[\s\-_()]/g, "") : "+917122550000");

    // Detect if Pharmacy / Health vs Retail vs Services vs Dining
    const combinedBrandCategory = ((brand || "") + " " + (target?.categoryName || "")).toLowerCase();
    const isPharmacy = /pharmacy|med|chemist|drug|health|clinic/i.test(combinedBrandCategory);
    const isRetail = /fab|retail|fashion|cloth|apparel|living|decor|jewel|grocery|mart|store/i.test(combinedBrandCategory);
    const isSalon = /salon|spa|beauty|wellness|hair/i.test(combinedBrandCategory);

    if (isPharmacy) {
      setStoreType("RETAIL");
      setImageUrl("https://images.unsplash.com/photo-1586015554060-8db6631248a1?auto=format&fit=crop&w=1200&q=80");
      setMenuImages([]);
      setPhotos([
        "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1586015554060-8db6631248a1?auto=format&fit=crop&w=800&q=80"
      ]);
      setAmenities([
        "Prescription Medicines",
        "24x7 Open",
        "Air Conditioned",
        "Cards & UPI Accepted",
        "Cold Storage for Vaccines",
        "Instant In-Store Pickup"
      ]);
      setIsTableBookingEnabled(false);
    } else if (isRetail) {
      setStoreType("RETAIL");
      setIsTableBookingEnabled(false);
      setImageUrl("https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=1200&q=80");
      setMenuImages([]);
      setPhotos([
        "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80"
      ]);
      setAmenities([
        "Trial Rooms",
        "Alteration Service",
        "Gift Wrapping",
        "Air Conditioned",
        "Cards & UPI Accepted",
        "Instant In-Store Pickup"
      ]);
    } else if (isSalon) {
      setStoreType("SERVICES");
      setIsTableBookingEnabled(false);
      setImageUrl("https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80");
      setMenuImages([]);
      setPhotos([
        "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80"
      ]);
      setAmenities(["Air Conditioned", "Cards & UPI Accepted", "Free High-Speed Wi-Fi"]);
    } else {
      setStoreType("DINING");
      setIsTableBookingEnabled(true);
      setImageUrl("https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80");
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
    }

    setManagerName(`${mgrFirstName} Store Manager`);
    setManagerEmail(`${cleanFirstName}.${safeCity}@${safeBrand}.com`);
    setManagerPhone(target?.ownerPhone ? target.ownerPhone.replace(/[\s\-_()]/g, "") : "9822100000");
    setErrors({});

    toast.success(`Auto-filled store details from "${brand}"!`, {
      description: `Mapped to ${mCity}, ${mState} (${mPincode})`
    });
  };

  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleNextStep = (e?: React.MouseEvent | React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (currentStep === 1) {
      if (!isKycOk) {
        toast.error("Merchant KYC verification required", {
          description: `Cannot create store branch. Your merchant KYC status is "${currentKycLabel}". Please wait for KYC approval before adding store branches.`
        });
        return;
      }
      if (!branchName.trim()) {
        toast.error("Please enter the branch outlet name");
        return;
      }
      setCurrentStep(2);
      return;
    }
    if (currentStep === 2) {
      if (!address.trim()) {
        toast.error("Please enter the street address");
        return;
      }
      if (!city.trim()) {
        toast.error("Please enter city");
        return;
      }
      if (!pincode.trim()) {
        toast.error("Please enter pincode");
        return;
      }
      setCurrentStep(3);
      return;
    }
    if (currentStep === 3) {
      setCurrentStep(4);
      return;
    }
  };

  const handleFinalSave = async () => {
    if (!isKycOk) {
      toast.error("Merchant KYC verification required", {
        description: `Cannot create store branch. Your merchant KYC status is "${currentKycLabel}". Please wait for KYC approval before adding store branches.`
      });
      return;
    }
    if (!branchName.trim()) {
      toast.error("Please enter the branch outlet name");
      setCurrentStep(1);
      return;
    }
    if (!address.trim()) {
      toast.error("Please enter the street address");
      setCurrentStep(2);
      return;
    }

    if (managerEmail.trim()) {
      try {
        const val = await staffApi.validateStaffEmail(managerEmail.trim(), resolvedMerchantId, "STORE");
        if (val && !val.valid && val.message) {
          toast.error(val.message);
          setManagerEmailNotice(val.message);
          setCurrentStep(4);
          return;
        }
      } catch (valErr: any) {
        const msg = valErr?.response?.data?.message || valErr?.message || "Invalid manager email";
        toast.error(msg);
        setManagerEmailNotice(msg);
        setCurrentStep(4);
        return;
      }
    }

    try {
      setIsSubmitting(true);
      await onSave({
        merchantId: resolvedMerchantId,
        merchantName: brandNameDisplay,
        branchName: branchName.trim(),
        storeName: branchName.trim(),
        phone: phone.replace(/[\s\-_()]/g, "").trim(),
        contactPhone: phone.replace(/[\s\-_()]/g, "").trim(),
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
        managerPhone: managerPhone.replace(/[\s\-_()]/g, "").trim(),
        category: storeType === "RETAIL" ? "Retail & Lifestyle" : storeType === "SERVICES" ? "Services & Wellness" : "Dining & Retail",
        imageUrl: imageUrl.trim() || undefined,
        menuImages,
        photos,
        amenities,
        isTableBookingEnabled,
        allowFreeStandardBooking,
        defaultStandardCoverCharge,
        status: managerEmail.trim() ? "INACTIVE" : "ACTIVE"
      });
      toast.success(`Store branch "${branchName}" registered successfully!`);
      onClose();
    } catch (saveErr: any) {
      const errMsg = saveErr?.response?.data?.message || saveErr?.message || "Failed to register store branch";
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentStep < 4) {
      handleNextStep(e);
      return;
    }
    handleFinalSave();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <aside className="w-screen max-w-xl bg-white dark:bg-[#121626] shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2">
              <StoreIcon size={18} className="text-amber-600" />
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Add Store Branch</h3>
                <p className="text-[11px] text-slate-400">Step {currentStep} of 4 • {ADD_STEPS[currentStep - 1]?.title}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAutoFillStore}
                className="px-2.5 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-[11px] font-bold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                title="Auto-fill store details, timings and location"
              >
                <Sparkles size={12} className="text-amber-500" />
                <span>Auto-fill Store</span>
              </button>
              <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Stepper Progress Bar */}
          <FormStepper
            steps={ADD_STEPS}
            currentStep={currentStep}
            onStepClick={(s) => setCurrentStep(s)}
          />

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
            {/* STEP 1: BASIC INFO & HOURS */}
            {currentStep === 1 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* KYC Validation Alert Banner */}
                {!isKycOk ? (
                  <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200 animate-in fade-in">
                    <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Merchant KYC Verification Required (Status: {currentKycLabel})</p>
                      <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5 leading-relaxed">
                        Store branch creation is locked for your account. Merchant KYC documents must be verified and approved by the platform team before branch stores can be created and onboarded.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="font-semibold text-[11px]">Merchant KYC Verified — Eligible to create branch stores</span>
                  </div>
                )}
                {/* 1-Click Business / Store Type Selection */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block text-xs">
                      Business Type / Category *
                    </label>
                    <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold">
                      {storeType === "RETAIL" ? "🛍️ Retail Mode (No Waiter/Dining)" : storeType === "SERVICES" ? "✂️ Services Mode" : "🍽️ Dining Mode"}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setStoreType("DINING");
                        setIsTableBookingEnabled(true);
                      }}
                      className={cn(
                        "p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer",
                        storeType === "DINING"
                          ? "border-purple-600 bg-purple-50/80 dark:bg-purple-950/50 text-purple-900 dark:text-purple-200 ring-2 ring-purple-600/20"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                      )}
                    >
                      <span className="text-lg">🍽️</span>
                      <div className="mt-1">
                        <span className="font-black text-xs block text-slate-900 dark:text-white">Dining & Food</span>
                        <span className="text-[9.5px] text-slate-400 block leading-tight">Cafes, Restaurants</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setStoreType("RETAIL");
                        setIsTableBookingEnabled(false);
                      }}
                      className={cn(
                        "p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer",
                        storeType === "RETAIL"
                          ? "border-purple-600 bg-purple-50/80 dark:bg-purple-950/50 text-purple-900 dark:text-purple-200 ring-2 ring-purple-600/20"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                      )}
                    >
                      <span className="text-lg">🛍️</span>
                      <div className="mt-1">
                        <span className="font-black text-xs block text-slate-900 dark:text-white">Retail & Shopping</span>
                        <span className="text-[9.5px] text-slate-400 block leading-tight">Fabindia, Fashion, Mart</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setStoreType("SERVICES");
                        setIsTableBookingEnabled(false);
                      }}
                      className={cn(
                        "p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer",
                        storeType === "SERVICES"
                          ? "border-purple-600 bg-purple-50/80 dark:bg-purple-950/50 text-purple-900 dark:text-purple-200 ring-2 ring-purple-600/20"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                      )}
                    >
                      <span className="text-lg">✂️</span>
                      <div className="mt-1">
                        <span className="font-black text-xs block text-slate-900 dark:text-white">Services & Care</span>
                        <span className="text-[9.5px] text-slate-400 block leading-tight">Salons, Spas, Clinics</span>
                      </div>
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">
                      Branch Outlet Title *
                    </label>
                    <button
                      type="button"
                      onClick={handleAutoFillStore}
                      className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:underline flex items-center gap-1 cursor-pointer"
                      title="Auto-fill sample store details, timings and location"
                    >
                      <Sparkles size={12} className="text-amber-500" />
                      <span>Auto-fill Store</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    placeholder="e.g. Indiranagar Luxury Dining"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-semibold focus:outline-hidden focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Branch Contact Phone
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 712 2550000"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <StoreScheduleSelector
                  value={operatingHours}
                  onChange={(val) => setOperatingHours(val)}
                />

                {/* TABLE BOOKING & RESERVATION SETTINGS */}
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0">
                        <UtensilsCrossed size={14} />
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                          Table Booking & Reservations
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          Allow customers to reserve dining slots and pre-book tables
                        </span>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isTableBookingEnabled}
                        onChange={(e) => setIsTableBookingEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-purple-600" />
                    </label>
                  </div>

                  {isTableBookingEnabled && (
                    <div className="pt-2.5 border-t border-slate-200/80 dark:border-slate-800 space-y-2.5 pl-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-700 dark:text-slate-300 block text-[11px]">
                            Allow Free Standard Table Booking
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            Guests can reserve a table with zero cover charge (Standard reservation)
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0">
                          <button
                            type="button"
                            onClick={() => setAllowFreeStandardBooking(true)}
                            className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
                              allowFreeStandardBooking
                                ? "bg-emerald-500 text-white shadow-2xs"
                                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                            }`}
                          >
                            Yes (Free)
                          </button>
                          <button
                            type="button"
                            onClick={() => setAllowFreeStandardBooking(false)}
                            className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
                              !allowFreeStandardBooking
                                ? "bg-purple-600 text-white shadow-2xs"
                                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                            }`}
                          >
                            No (Charge)
                          </button>
                        </div>
                      </div>

                      {!allowFreeStandardBooking && (
                        <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-purple-200/60 dark:border-purple-900/40 space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                              Default Standard Cover Charge (₹ per guest)
                            </label>
                            <div className="flex items-center gap-1">
                              <span className="text-slate-400 text-xs">₹</span>
                              <input
                                type="number"
                                min={0}
                                step={5}
                                value={defaultStandardCoverCharge}
                                onChange={(e) => setDefaultStandardCoverCharge(Math.max(0, Number(e.target.value)))}
                                className="w-20 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white text-right focus:outline-hidden focus:border-purple-500"
                              />
                            </div>
                          </div>
                          <p className="text-[10px] text-purple-600 dark:text-purple-400">
                            {defaultStandardCoverCharge > 0
                              ? `Guests pay ₹${defaultStandardCoverCharge}/guest deposit, fully adjusted against their final bill.`
                              : "With ₹0 cover charge and Free disabled, guests must book via an active pre-booking discount offer."}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 2: LOCATION & GPS MAP */}
            {currentStep === 2 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <IndiaAddressFields
                  state={state}
                  district={district}
                  city={city}
                  pincode={pincode}
                  address={address}
                  onStateChange={(v) => setState(v)}
                  onDistrictChange={(v) => setDistrict(v)}
                  onCityChange={(v) => setCity(v)}
                  onPincodeChange={(v) => setPincode(v)}
                  onAddressChange={(v) => setAddress(v)}
                />

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center justify-between text-xs">
                    <span>Pinpoint Location on Map *</span>
                    <span className="text-[11px] font-normal text-purple-600 dark:text-purple-400">Click or drag pin</span>
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
              </div>
            )}

            {/* STEP 3: MENUS, PHOTOS & AMENITIES */}
            {currentStep === 3 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <StoreMediaAndAmenitiesSection
                  imageUrl={imageUrl}
                  menuImages={menuImages}
                  photos={photos}
                  amenities={amenities}
                  onImageUrlChange={setImageUrl}
                  onMenuImagesChange={setMenuImages}
                  onPhotosChange={setPhotos}
                  onAmenitiesChange={setAmenities}
                  categoryHint={selectedMerchant?.businessName || selectedMerchant?.categoryName || "Dining"}
                  storeType={storeType}
                  onStoreTypeChange={setStoreType}
                />
              </div>
            )}

            {/* STEP 4: MANAGER & ACCESS CREDENTIALS */}
            {currentStep === 4 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* Summary Review Card */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-purple-700 dark:text-purple-300 block">
                    Branch Summary Review
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Branch Outlet:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{branchName || "Outlet"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Location:</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{city}, {state}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Store Type & Cover:</span>
                      <span className="font-medium text-purple-700 dark:text-purple-300">
                        {storeType === "RETAIL" ? "🛍️ Retail & Products" : storeType === "SERVICES" ? "💇 Services" : "🍽️ Dining"}
                        {imageUrl ? " • Cover Set" : " • No Cover"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Media Prepared:</span>
                      <span className="font-medium text-amber-700 dark:text-amber-300">
                        {storeType === "RETAIL"
                          ? `🛍️ ${photos.length} photos${menuImages.length > 0 ? ` • ${menuImages.length} lookbook` : " (No food menu)"}`
                          : `🍽️ ${menuImages.length} menu • 📸 ${photos.length} photos`}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 block text-[11px]">Amenities:</span>
                      <span className="font-medium text-emerald-700 dark:text-emerald-300">
                        ✨ {amenities.length} selected ({amenities.slice(0, 3).join(", ")}{amenities.length > 3 ? "..." : ""})
                      </span>
                    </div>
                  </div>
                </div>

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
                        Provisions branch manager with Merchant Portal & POS terminal login
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300">Manager Full Name</label>
                    <input
                      type="text"
                      value={managerName}
                      onChange={(e) => setManagerName(e.target.value)}
                      placeholder="e.g. Rajesh Sharma"
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span>Manager Work Email</span>
                      <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">Login Identifier</span>
                    </label>
                    <input
                      type="email"
                      value={managerEmail}
                      onChange={(e) => {
                        setManagerEmail(e.target.value);
                        setManagerEmailNotice(null);
                      }}
                      onBlur={async () => {
                        if (managerEmail.trim()) {
                          try {
                            const val = await staffApi.validateStaffEmail(managerEmail.trim(), resolvedMerchantId, "STORE");
                            if (val && !val.valid && val.message) {
                              setManagerEmailNotice(val.message);
                            } else {
                              setManagerEmailNotice(null);
                            }
                          } catch (err: any) {
                            const msg = err?.response?.data?.message || err?.message;
                            if (msg) setManagerEmailNotice(msg);
                          }
                        } else {
                          setManagerEmailNotice(null);
                        }
                      }}
                      placeholder="e.g. rajesh.store@brand.com"
                      className={`mt-1 w-full px-3 py-2 rounded-xl border ${managerEmailNotice ? "border-rose-400 bg-rose-50/20 dark:bg-rose-950/20" : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"} text-xs text-slate-900 dark:text-white focus:outline-hidden`}
                    />
                    {managerEmailNotice && (
                      <div className="mt-1.5 p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-[11px] text-rose-700 dark:text-rose-300 flex items-start gap-1.5">
                        <AlertCircle size={14} className="shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                        <span>{managerEmailNotice}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300">Manager Mobile</label>
                    <input
                      type="tel"
                      value={managerPhone}
                      onChange={(e) => setManagerPhone(e.target.value)}
                      placeholder="9822100000"
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-mono focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Stepper Action Buttons */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                {currentStep > 1 && (
                  <button
                    key="add-back-btn"
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setCurrentStep((s) => Math.max(1, s - 1));
                    }}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft size={14} />
                    <span>Back</span>
                  </button>
                )}

                {currentStep < 4 ? (
                  <button
                    key={`add-next-step-${currentStep}`}
                    type="button"
                    onClick={handleNextStep}
                    disabled={currentStep === 1 && !isKycOk}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold shadow-md flex items-center gap-1 transition-all",
                      currentStep === 1 && !isKycOk
                        ? "bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-600"
                        : "btn-gradient text-white cursor-pointer"
                    )}
                  >
                    <span>
                      {currentStep === 1 && !isKycOk
                        ? "KYC Verification Required"
                        : `Next: ${ADD_STEPS[currentStep]?.title || "Manager"}`}
                    </span>
                    <ChevronRight size={14} />
                  </button>
                ) : (
                  <button
                    key="add-final-register-btn"
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleFinalSave();
                    }}
                    disabled={isSubmitting || !branchName.trim() || !address.trim() || !isKycOk}
                    className="btn-gradient px-5 py-2 rounded-xl text-white text-xs font-bold shadow-md flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Registering Outlet...</span>
                      </>
                    ) : (
                      <>
                        <Check size={14} />
                        <span>Register Store Branch</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        </aside>
      </div>
    </div>
  );
}

// Right-side Slide-over Drawer for Editing Existing Store Branch (Step-by-Step Wizard)
function EditStoreDrawer({
  store,
  onClose,
  onSave
}: {
  store: StoreType;
  onClose: () => void;
  onSave: (updates: Partial<StoreType>) => void;
}) {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [branchName, setBranchName] = useState(store.branchName || "");
  const [phone, setPhone] = useState(store.phone || "");
  const [address, setAddress] = useState(store.address || "");
  const [state, setState] = useState(store.state || "Maharashtra");
  const [district, setDistrict] = useState(store.district || "Nagpur");
  const [city, setCity] = useState(store.city || "Nagpur");
  const [pincode, setPincode] = useState(store.pincode || "440010");
  const [latitude, setLatitude] = useState(store.latitude || 21.1458);
  const [longitude, setLongitude] = useState(store.longitude || 79.0882);
  const [operatingHours, setOperatingHours] = useState(store.operatingHours || "10:00 AM – 10:00 PM (Daily)");
  const [status, setStatus] = useState<StoreType["status"]>(store.status || "ACTIVE");
  const [imageUrl, setImageUrl] = useState<string>(store.imageUrl || "");
  const [menuImages, setMenuImages] = useState<string[]>(store.menuImages || []);
  const [photos, setPhotos] = useState<string[]>(store.photos || []);
  const [amenities, setAmenities] = useState<string[]>(store.amenities || []);
  const initialEditStoreType: "DINING" | "RETAIL" | "SERVICES" = 
    store.category && /retail|fashion|cloth|apparel|fab|grocery|mart/i.test(store.category)
      ? "RETAIL"
      : store.category && /salon|spa|beauty|wellness/i.test(store.category)
      ? "SERVICES"
      : store.isTableBookingEnabled === false
      ? "RETAIL"
      : "DINING";
  const [storeType, setStoreType] = useState<"DINING" | "RETAIL" | "SERVICES">(initialEditStoreType);
  const [isTableBookingEnabled, setIsTableBookingEnabled] = useState<boolean>(store.isTableBookingEnabled ?? (initialEditStoreType === "DINING"));
  const [allowFreeStandardBooking, setAllowFreeStandardBooking] = useState<boolean>(store.allowFreeStandardBooking ?? true);
  const [defaultStandardCoverCharge, setDefaultStandardCoverCharge] = useState<number>(store.defaultStandardCoverCharge ?? 0);

  const EDIT_STEPS = [
    { id: 1, title: "Basic Info", subtitle: "Name, Phone & Status" },
    { id: 2, title: "Location", subtitle: "Address & Map" },
    { id: 3, title: "Media", subtitle: "Cover, Menu & Photos" },
  ];

  const handleFinalSave = () => {
    if (!branchName.trim()) {
      toast.error("Branch name is required");
      setCurrentStep(1);
      return;
    }
    if (!address.trim()) {
      toast.error("Store address is required");
      setCurrentStep(2);
      return;
    }
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
      category: storeType === "RETAIL" ? "Retail & Lifestyle" : storeType === "SERVICES" ? "Services & Wellness" : "Dining & Retail",
      imageUrl: imageUrl.trim() || undefined,
      menuImages,
      photos,
      amenities,
      isTableBookingEnabled,
      allowFreeStandardBooking,
      defaultStandardCoverCharge
    });
  };

  const handleNextStep = (e?: React.MouseEvent | React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (currentStep === 1) {
      if (!branchName.trim()) {
        toast.error("Branch name is required");
        return;
      }
      setCurrentStep(2);
      return;
    }
    if (currentStep === 2) {
      if (!address.trim()) {
        toast.error("Store address is required");
        return;
      }
      setCurrentStep(3);
      return;
    }
    if (currentStep === 3) {
      handleFinalSave();
      return;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentStep < 3) {
      handleNextStep(e);
      return;
    }
    handleFinalSave();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <aside className="w-screen max-w-xl bg-white dark:bg-[#121626] shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-amber-500/10 via-pink-500/10 to-transparent gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                <Pencil size={18} />
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight truncate">Edit Store Branch</h3>
                <p className="text-xs text-slate-400 truncate mt-0.5">Step {currentStep} of 3 • {EDIT_STEPS[currentStep - 1]?.title}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors" title="Close drawer">
              <X size={20} />
            </button>
          </div>

          {/* Stepper Header */}
          <FormStepper
            steps={EDIT_STEPS}
            currentStep={currentStep}
            onStepClick={(s) => setCurrentStep(s)}
            allowAllSteps={true}
          />

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
            {/* STEP 1: BASIC INFO & HOURS */}
            {currentStep === 1 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* 1-Click Business / Store Type Selection */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block text-xs">
                      Business Type / Category *
                    </label>
                    <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold">
                      {storeType === "RETAIL" ? "🛍️ Retail Mode" : storeType === "SERVICES" ? "✂️ Services Mode" : "🍽️ Dining Mode"}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setStoreType("DINING");
                        setIsTableBookingEnabled(true);
                      }}
                      className={cn(
                        "p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer",
                        storeType === "DINING"
                          ? "border-purple-600 bg-purple-50/80 dark:bg-purple-950/50 text-purple-900 dark:text-purple-200 ring-2 ring-purple-600/20"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                      )}
                    >
                      <span className="text-lg">🍽️</span>
                      <div className="mt-1">
                        <span className="font-black text-xs block text-slate-900 dark:text-white">Dining & Food</span>
                        <span className="text-[9.5px] text-slate-400 block leading-tight">Cafes, Restaurants</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setStoreType("RETAIL");
                        setIsTableBookingEnabled(false);
                      }}
                      className={cn(
                        "p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer",
                        storeType === "RETAIL"
                          ? "border-purple-600 bg-purple-50/80 dark:bg-purple-950/50 text-purple-900 dark:text-purple-200 ring-2 ring-purple-600/20"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                      )}
                    >
                      <span className="text-lg">🛍️</span>
                      <div className="mt-1">
                        <span className="font-black text-xs block text-slate-900 dark:text-white">Retail & Shopping</span>
                        <span className="text-[9.5px] text-slate-400 block leading-tight">Fabindia, Fashion, Mart</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setStoreType("SERVICES");
                        setIsTableBookingEnabled(false);
                      }}
                      className={cn(
                        "p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer",
                        storeType === "SERVICES"
                          ? "border-purple-600 bg-purple-50/80 dark:bg-purple-950/50 text-purple-900 dark:text-purple-200 ring-2 ring-purple-600/20"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                      )}
                    >
                      <span className="text-lg">✂️</span>
                      <div className="mt-1">
                        <span className="font-black text-xs block text-slate-900 dark:text-white">Services & Care</span>
                        <span className="text-[9.5px] text-slate-400 block leading-tight">Salons, Spas, Clinics</span>
                      </div>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Branch Name *</label>
                  <input
                    type="text"
                    required
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-semibold focus:outline-hidden focus:border-purple-500"
                  />
                </div>

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
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Operational Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as StoreType["status"])}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:border-purple-500"
                  >
                    <option value="ACTIVE">ACTIVE (Published on Customer Map)</option>
                    <option value="INACTIVE">INACTIVE (Temporarily Hidden)</option>
                    <option value="PENDING_APPROVAL">PENDING_APPROVAL (Under Verification)</option>
                  </select>
                </div>

                <StoreScheduleSelector
                  value={operatingHours}
                  onChange={(val) => setOperatingHours(val)}
                />

                {/* TABLE BOOKING & RESERVATION SETTINGS */}
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0">
                        <UtensilsCrossed size={14} />
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                          Table Booking & Reservations
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          Allow customers to reserve dining slots and pre-book tables
                        </span>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isTableBookingEnabled}
                        onChange={(e) => setIsTableBookingEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-purple-600" />
                    </label>
                  </div>

                  {isTableBookingEnabled && (
                    <div className="pt-2.5 border-t border-slate-200/80 dark:border-slate-800 space-y-2.5 pl-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-700 dark:text-slate-300 block text-[11px]">
                            Allow Free Standard Table Booking
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            Guests can reserve a table with zero cover charge (Standard reservation)
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0">
                          <button
                            type="button"
                            onClick={() => setAllowFreeStandardBooking(true)}
                            className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
                              allowFreeStandardBooking
                                ? "bg-emerald-500 text-white shadow-2xs"
                                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                            }`}
                          >
                            Yes (Free)
                          </button>
                          <button
                            type="button"
                            onClick={() => setAllowFreeStandardBooking(false)}
                            className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
                              !allowFreeStandardBooking
                                ? "bg-purple-600 text-white shadow-2xs"
                                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                            }`}
                          >
                            No (Charge)
                          </button>
                        </div>
                      </div>

                      {!allowFreeStandardBooking && (
                        <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-purple-200/60 dark:border-purple-900/40 space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                              Default Standard Cover Charge (₹ per guest)
                            </label>
                            <div className="flex items-center gap-1">
                              <span className="text-slate-400 text-xs">₹</span>
                              <input
                                type="number"
                                min={0}
                                step={5}
                                value={defaultStandardCoverCharge}
                                onChange={(e) => setDefaultStandardCoverCharge(Math.max(0, Number(e.target.value)))}
                                className="w-20 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white text-right focus:outline-hidden focus:border-purple-500"
                              />
                            </div>
                          </div>
                          <p className="text-[10px] text-purple-600 dark:text-purple-400">
                            {defaultStandardCoverCharge > 0
                              ? `Guests pay ₹${defaultStandardCoverCharge}/guest deposit, fully adjusted against their final bill.`
                              : "With ₹0 cover charge and Free disabled, guests must book via an active pre-booking discount offer."}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 2: LOCATION & GPS MAP */}
            {currentStep === 2 && (
              <div className="space-y-4 animate-in fade-in duration-200">
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

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1 text-xs">Pinpoint Location on Map *</label>
                  <StoreLocationPicker
                    latitude={latitude}
                    longitude={longitude}
                    city={city}
                    state={state}
                    storeName={branchName}
                    height="200px"
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
              </div>
            )}

            {/* STEP 3: MENUS, PHOTOS & AMENITIES */}
            {currentStep === 3 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <StoreMediaAndAmenitiesSection
                  imageUrl={imageUrl}
                  menuImages={menuImages}
                  photos={photos}
                  amenities={amenities}
                  onImageUrlChange={setImageUrl}
                  onMenuImagesChange={setMenuImages}
                  onPhotosChange={setPhotos}
                  onAmenitiesChange={setAmenities}
                  categoryHint={store.category || store.branchName || "Dining"}
                />
              </div>
            )}

            {/* Bottom Navigation Buttons */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                {currentStep > 1 && (
                  <button
                    key="edit-back-btn"
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setCurrentStep((s) => Math.max(1, s - 1));
                    }}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft size={14} />
                    <span>Back</span>
                  </button>
                )}

                {currentStep < 3 ? (
                  <button
                    key={`next-step-${currentStep}`}
                    type="button"
                    onClick={handleNextStep}
                    className="btn-gradient px-4 py-2 rounded-xl text-white text-xs font-bold shadow-md flex items-center gap-1 cursor-pointer"
                  >
                    <span>Next: {EDIT_STEPS[currentStep]?.title || "Media"}</span>
                    <ChevronRight size={14} />
                  </button>
                ) : (
                  <button
                    key="save-changes-btn"
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleFinalSave();
                    }}
                    className="btn-gradient px-5 py-2 rounded-xl text-white text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check size={14} />
                    <span>Save Store Changes</span>
                  </button>
                )}
              </div>
            </div>
          </form>
        </aside>
      </div>
    </div>
  );
}