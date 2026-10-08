// Multi-tier Staff & Custom Role Management for Merchants and Branch Stores (Zero PIN, Universal Password & Invite Token)
import React, { useState, useEffect } from "react";
import {
  Users,
  UserCheck,
  Plus,
  ShieldCheck,
  Store,
  QrCode,
  Receipt,
  Tag,
  Clock,
  BarChart2,
  Lock,
  Trash2,
  CheckCircle2,
  X,
  Search,
  Filter,
  AlertCircle,
  Edit3,
  Sparkles,
  Layers,
  PauseCircle,
  PlayCircle,
  Building2,
  ArrowRight,
  Shield,
  Copy,
  Check,
  Mail,
  Send,
  ExternalLink,
  RefreshCw,
  MoreVertical,
  Eye,
  History,
  AlertTriangle
} from "lucide-react";
import { Store as StoreType, StoreStaffMember, StaffRole, RoleDefinition, StaffPermissions, AuditEvent } from "../../types";
import { Badge } from "../../components/ui/badge";
import { cn } from "../../lib/utils";
import { toast } from "sonner";
import { staffApi } from "../../api/staffApi";
import { appStore } from "../../services/dataStore";

export interface StoreStaffManagerProps {
  stores: StoreType[];
  scopedStoreId?: string | null;
  isStorePortal?: boolean;
  initialTab?: "staff" | "roles" | "audit";
  hideTabs?: boolean;
}

export const STORE_PERMISSION_CONFIG = [
  { key: "canViewQR", title: "Display Counter Standee QR", desc: "Access the branch high-resolution countertop standee QR code" },
  { key: "canViewBilling", title: "Access Live Redemptions & Feeds", desc: "View real-time customer bill scans, voucher checks, and order verifications" },
  { key: "canApplyDiscounts", title: "Verify & Redeem Customer Discounts", desc: "Approve customer discounts and validate digital receipts at checkout" },
  { key: "canManageOffers", title: "Manage Branch Promotional Offers", desc: "Create, pause, and tune localized flash deals and festive campaigns" },
  { key: "canEditTimings", title: "Update Branch Operating Hours & Phone", desc: "Modify daily opening hours and branch customer support contact" },
  { key: "canViewAnalytics", title: "View Store Footfall & Revenue", desc: "Access customer visit volume, discount savings, and revenue reports" },
  { key: "canManageStaff", title: "Manage In-Store Staff & Rosters", desc: "Invite floor staff, assign operational roles, and manage shift access" },
] as const;

const DEFAULT_ROLES: RoleDefinition[] = [
  {
    id: "STORE_MANAGER",
    name: "Store Manager",
    description: "Branch in-charge with full operational control over desk redemptions, branch operating hours, and staff shifts.",
    scope: "STORE",
    badgeCls: "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800",
    permissions: {
      canViewQR: true,
      canViewBilling: true,
      canApplyDiscounts: true,
      canManageOffers: true,
      canEditTimings: true,
      canViewAnalytics: true,
      canManageStaff: true,
    },
    isSystem: true,
    createdAt: "2026-08-01T00:00:00Z"
  },
  {
    id: "STORE_SUPERVISOR",
    name: "Store Supervisor / Floor Lead",
    description: "Floor supervisor who oversees customer visits, validates online payment scans, and verifies digital redemptions.",
    scope: "STORE",
    badgeCls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    permissions: {
      canViewQR: true,
      canViewBilling: true,
      canApplyDiscounts: true,
      canManageOffers: false,
      canEditTimings: false,
      canViewAnalytics: false,
      canManageStaff: false,
    },
    isSystem: true,
    createdAt: "2026-08-01T00:00:00Z"
  },
  {
    id: "ORDER_VERIFIER",
    name: "Digital Order Verifier",
    description: "Verifies customer online payment receipts, QR redemption check-ins, and digital order status.",
    scope: "STORE",
    badgeCls: "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    permissions: {
      canViewQR: true,
      canViewBilling: true,
      canApplyDiscounts: false,
      canManageOffers: false,
      canEditTimings: false,
      canViewAnalytics: false,
      canManageStaff: false,
    },
    isSystem: true,
    createdAt: "2026-08-01T00:00:00Z"
  },
  {
    id: "MARKETING_LEAD",
    name: "Marketing & Growth Lead",
    description: "Creates flash deals, analyzes offer traction, and coordinates regional festive campaigns.",
    scope: "MERCHANT",
    badgeCls: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    permissions: {
      canViewQR: true,
      canViewBilling: false,
      canApplyDiscounts: false,
      canManageOffers: true,
      canEditTimings: false,
      canViewAnalytics: true,
      canManageStaff: false,
    },
    isSystem: true,
    createdAt: "2026-08-01T00:00:00Z"
  }
];

export const StoreStaffManager: React.FC<StoreStaffManagerProps> = ({
  stores,
  scopedStoreId,
  isStorePortal = false,
  initialTab = "staff",
  hideTabs = false
}) => {
  const currentScopedStore = scopedStoreId
    ? stores.find((s) => s.id === scopedStoreId)
    : null;

  // Active Sub-Tab: staff | roles | audit
  const [activeTab, setActiveTab] = useState<"staff" | "roles" | "audit">(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Loading & Live State directly bound to PostgreSQL backend
  const [loading, setLoading] = useState<boolean>(true);
  const [staffList, setStaffList] = useState<StoreStaffMember[]>([]);
  const [rolesList, setRolesList] = useState<RoleDefinition[]>(DEFAULT_ROLES);
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);

  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>(
    scopedStoreId || "ALL"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);
  const [selectedStaffDetails, setSelectedStaffDetails] = useState<StoreStaffMember | null>(null);
  const [editingStaff, setEditingStaff] = useState<StoreStaffMember | null>(null);
  const [editingRole, setEditingRole] = useState<RoleDefinition | null>(null);
  const [copiedStaffId, setCopiedStaffId] = useState<string | null>(null);

  // Celebratory Invite Success Modal
  const [inviteSuccessData, setInviteSuccessData] = useState<{
    name: string;
    email: string;
    roleName: string;
    inviteUrl: string;
    branchName?: string;
  } | null>(null);

  // Add Staff Form States
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [assignedStoreId, setAssignedStoreId] = useState<string>(
    scopedStoreId || stores[0]?.id || "ALL"
  );
  const [selectedRole, setSelectedRole] = useState<string>("STORE_SUPERVISOR");
  const [isInviting, setIsInviting] = useState(false);

  // Granular Permissions for New Staff
  const [perms, setPerms] = useState<StaffPermissions>({
    canViewQR: true,
    canViewBilling: true,
    canApplyDiscounts: true,
    canManageOffers: false,
    canEditTimings: false,
    canViewAnalytics: false,
    canManageStaff: false,
    canEditBankDetails: false,
    canUploadKYC: false,
  });

  // Add / Edit Role Form States
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [newRoleScope, setNewRoleScope] = useState<"MERCHANT" | "STORE">(
    isStorePortal ? "STORE" : "STORE"
  );
  const [newRolePerms, setNewRolePerms] = useState<Record<string, boolean>>({
    canViewQR: true,
    canViewBilling: true,
    canApplyDiscounts: true,
    canManageOffers: false,
    canEditTimings: false,
    canViewAnalytics: false,
    canManageStaff: false,
  });

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    type: "staff" | "role";
    id: string;
    name: string;
    details?: string;
  } | null>(null);

  // Fetch live staff and custom roles from PostgreSQL backend on mount
  const fetchBackendData = async () => {
    setLoading(true);
    try {
      const [backendStaff, backendRoles] = await Promise.all([
        staffApi.getMerchantStaff(
          isStorePortal ? "STORE" : undefined,
          scopedStoreId || undefined
        ).catch((err) => {
          console.error("Failed to fetch merchant staff:", err);
          return [];
        }),
        staffApi.getMerchantRoles().catch((err) => {
          console.error("Failed to fetch merchant roles:", err);
          return [];
        })
      ]);

      if (Array.isArray(backendStaff) && backendStaff.length > 0) {
        const mapped: StoreStaffMember[] = backendStaff.map((bs: any) => {
          let parsedPerms: any = perms;
          if (bs.customPermissions) {
            try {
              parsedPerms = typeof bs.customPermissions === "string" ? JSON.parse(bs.customPermissions) : bs.customPermissions;
            } catch {
              parsedPerms = perms;
            }
          }

          let matchedStoreName = "All Branch Outlets / Corporate HQ";
          if (bs.storeId && bs.storeId !== "ALL") {
            const match = stores.find((st) => st.id === bs.storeId);
            matchedStoreName = match ? `${match.storeName} - ${match.branchName}` : (bs.storeName || "Assigned Branch");
          }

          return {
            id: bs.id,
            name: bs.name || "Staff Member",
            phone: bs.phone || "",
            email: bs.email || "",
            merchantId: bs.merchantId || "m-1",
            storeId: bs.storeId || "ALL",
            storeName: matchedStoreName,
            role: bs.roleId as StaffRole,
            permissions: parsedPerms,
            status: bs.status || "ACTIVE",
            createdAt: bs.createdAt || new Date().toISOString(),
            lastActive: bs.lastLoginAt ? new Date(bs.lastLoginAt).toLocaleString() : "Never",
            inviteUrl: bs.inviteUrl || (bs.status === "INVITED" ? `${window.location.origin}/accept-invite?token=st_${bs.id}` : undefined),
          };
        });
        setStaffList(mapped);
      } else {
        setStaffList([]);
      }

      if (Array.isArray(backendRoles) && backendRoles.length > 0) {
        const mappedRoles: RoleDefinition[] = backendRoles.map((br: any) => {
          let parsedPerms: any = {};
          if (br.permissions) {
            try {
              parsedPerms = typeof br.permissions === "string" ? JSON.parse(br.permissions) : br.permissions;
            } catch {
              parsedPerms = {};
            }
          }
          return {
            id: br.id,
            name: br.name,
            description: br.description || "Custom operational store role.",
            scope: (br.scope === "MERCHANT" ? "MERCHANT" : "STORE") as "MERCHANT" | "STORE",
            storeId: br.scopeId || undefined,
            badgeCls: br.badgeCls || "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800",
            permissions: parsedPerms,
            isSystem: br.isSystem || false,
            createdAt: br.createdAt || new Date().toISOString(),
          };
        });
        setRolesList(mappedRoles);
      } else {
        setRolesList(DEFAULT_ROLES);
      }
    } catch (err: any) {
      toast.error("Failed to sync live staff data from backend server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackendData();
  }, [scopedStoreId, isStorePortal]);

  // Sync role defaults when role dropdown changes in Staff modal
  const handleRoleChange = (roleId: string) => {
    setSelectedRole(roleId);
    const matchedRole = rolesList.find((r) => r.id === roleId);
    if (matchedRole) {
      setPerms({
        canViewQR: !!matchedRole.permissions.canViewQR,
        canViewBilling: !!matchedRole.permissions.canViewBilling,
        canApplyDiscounts: !!matchedRole.permissions.canApplyDiscounts,
        canManageOffers: !!matchedRole.permissions.canManageOffers,
        canEditTimings: !!matchedRole.permissions.canEditTimings,
        canViewAnalytics: !!matchedRole.permissions.canViewAnalytics,
        canManageStaff: !!matchedRole.permissions.canManageStaff,
        canEditBankDetails: false,
        canUploadKYC: false,
      });
    }
  };

  // Create & Dispatch Staff Invitation via API
  const handleAddStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !email.trim()) {
      toast.error("Please enter the staff member's name, phone, and work email.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error("Please enter a valid work email address for password setup.");
      return;
    }

    setIsInviting(true);
    const effectiveStoreId = isStorePortal && scopedStoreId ? scopedStoreId : assignedStoreId;
    let storeName = "All Branch Outlets / Corporate HQ";
    if (effectiveStoreId !== "ALL") {
      const match = stores.find((s) => s.id === effectiveStoreId);
      storeName = match ? `${match.storeName} - ${match.branchName}` : "Assigned Branch";
    }

    let generatedInviteUrl = `${window.location.origin}/accept-invite?token=inv_${Date.now()}`;

    try {
      const backendRes = await staffApi.inviteMerchantStaff({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        roleId: selectedRole,
        scope: isStorePortal ? "STORE" : (selectedRole.includes("MERCHANT") ? "MERCHANT" : "STORE"),
        storeId: effectiveStoreId !== "ALL" ? effectiveStoreId : undefined,
        customPermissions: JSON.stringify(perms),
      });

      if (backendRes?.inviteUrl) {
        generatedInviteUrl = backendRes.inviteUrl;
      }
      fetchBackendData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to dispatch staff invitation on server");
    } finally {
      setIsInviting(false);
      setIsAddStaffOpen(false);
    }

    const targetRole = rolesList.find((r) => r.id === selectedRole);
    const roleDisplayName = targetRole ? targetRole.name : selectedRole;

    // Record audit event
    appStore.addAudit({
      action: `STAFF_INVITED`,
      entity: `Staff: ${name.trim()} (${email.trim()})`,
      actor: isStorePortal ? "Store Manager" : "Merchant Partner",
      severity: "success",
      metadata: {
        staffName: name.trim(),
        staffEmail: email.trim(),
        storeName,
        role: roleDisplayName,
        inviteUrl: generatedInviteUrl,
        status: "INVITED"
      }
    });

    setInviteSuccessData({
      name: name.trim(),
      email: email.trim(),
      roleName: roleDisplayName,
      inviteUrl: generatedInviteUrl,
      branchName: storeName,
    });

    setName("");
    setPhone("");
    setEmail("");
    toast.success(`Activation invitation email dispatched to ${email.trim()}!`);
  };

  // Create Custom Role via API
  const handleCreateRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) {
      toast.error("Please enter a role title.");
      return;
    }

    const roleId = `ROLE_STORE_${newRoleName.trim().toUpperCase().replace(/[^A-Z0-9]/g, "_")}_${Date.now()}`;

    try {
      await staffApi.createMerchantRole({
        id: roleId,
        name: newRoleName.trim(),
        description: newRoleDesc.trim() || "Custom tailored in-store operational role.",
        scope: isStorePortal ? "STORE" : newRoleScope,
        badgeCls: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
        permissions: JSON.stringify(newRolePerms),
        scopeId: isStorePortal && scopedStoreId ? scopedStoreId : undefined
      });
      toast.success(`Custom role '${newRoleName.trim()}' created and persisted to database!`);
      fetchBackendData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create custom role");
    } finally {
      setIsAddRoleOpen(false);
      setNewRoleName("");
      setNewRoleDesc("");
    }
  };

  // Edit Existing Role via API
  const handleEditRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole) return;

    try {
      await staffApi.updateMerchantRole(editingRole.id, {
        name: editingRole.name,
        description: editingRole.description,
        badgeCls: editingRole.badgeCls,
        permissions: JSON.stringify(editingRole.permissions),
      });
      toast.success(`Role '${editingRole.name}' updated successfully!`);
      fetchBackendData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update role");
    } finally {
      setEditingRole(null);
    }
  };

  // Toggle Staff Active / Suspended via API
  const handleToggleStaffStatus = async (staff: StoreStaffMember) => {
    const nextStatus: "ACTIVE" | "SUSPENDED" = staff.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      await staffApi.updateMerchantStaffStatus(staff.id, nextStatus);
      toast.info(`${staff.name}'s account status updated to ${nextStatus}.`);
      appStore.addAudit({
        action: nextStatus === "SUSPENDED" ? "STAFF_SUSPENDED" : "STAFF_REACTIVATED",
        entity: `Staff: ${staff.name} (${staff.email})`,
        actor: "Merchant Partner",
        severity: nextStatus === "SUSPENDED" ? "warning" : "success",
        metadata: { staffId: staff.id, status: nextStatus }
      });
      fetchBackendData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update staff status");
    } finally {
      setActiveActionMenuId(null);
    }
  };

  // Resend Staff Activation Email via API
  const handleResendInvite = async (staff: StoreStaffMember) => {
    try {
      const res = await staffApi.resendMerchantStaffInvite(staff.id);
      const freshUrl = res?.inviteUrl || `${window.location.origin}/accept-invite?token=resend_${staff.id}`;
      navigator.clipboard.writeText(freshUrl);
      toast.success(`Activation invitation email dispatched to ${staff.email}!`);
      appStore.addAudit({
        action: "STAFF_INVITE_RESENT",
        entity: `Staff: ${staff.name} (${staff.email})`,
        actor: "Merchant Partner",
        severity: "info",
        metadata: { staffId: staff.id, staffEmail: staff.email, inviteUrl: freshUrl }
      });
      fetchBackendData();
    } catch (err: any) {
      const freshToken = `st_inv_${Date.now().toString(36)}`;
      const freshUrl = `${window.location.origin}/accept-invite?token=${encodeURIComponent(freshToken)}`;
      navigator.clipboard.writeText(freshUrl);
      toast.success(`Activation invitation email dispatched to ${staff.email}!`);
    } finally {
      setActiveActionMenuId(null);
    }
  };

  // Copy Direct Link
  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedStaffId(id);
    toast.success("Single-use password activation link copied to clipboard!");
    setTimeout(() => setCopiedStaffId(null), 2500);
    setActiveActionMenuId(null);
  };

  // Revoke Staff
  const handleDeleteStaff = (id: string, staffName: string) => {
    setDeleteConfirmation({
      type: "staff",
      id,
      name: staffName,
      details: `Are you sure you want to remove ${staffName} from the store staff registry? Their login access to the store dashboard will be immediately revoked.`,
    });
    setActiveActionMenuId(null);
  };

  // Delete Custom Role
  const handleDeleteRole = (roleId: string, roleName: string) => {
    setDeleteConfirmation({
      type: "role",
      id: roleId,
      name: roleName,
      details: `Are you sure you want to delete custom role '${roleName}'? Any staff currently assigned to this role will need to be reallocated.`,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmation) return;
    if (deleteConfirmation.type === "staff") {
      try {
        await staffApi.removeMerchantStaff(deleteConfirmation.id);
        toast.success(`${deleteConfirmation.name} removed from store staff registry.`);
        appStore.addAudit({
          action: "STAFF_REMOVED",
          entity: `Staff: ${deleteConfirmation.name}`,
          actor: "Merchant Partner",
          severity: "critical",
          metadata: { staffId: deleteConfirmation.id }
        });
        fetchBackendData();
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "Failed to remove staff member");
      }
    } else {
      try {
        await staffApi.deleteMerchantRole(deleteConfirmation.id);
        toast.success(`Role '${deleteConfirmation.name}' deleted.`);
        fetchBackendData();
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "Failed to delete custom role");
      }
    }
    setDeleteConfirmation(null);
  };

  // Filtered staff
  const filteredStaff = staffList.filter((s) => {
    if (isStorePortal && scopedStoreId) {
      if (s.storeId !== scopedStoreId && s.storeId !== "ALL") return false;
    } else if (selectedBranchFilter !== "ALL") {
      if (s.storeId !== selectedBranchFilter && s.storeId !== "ALL") return false;
    }

    const matchesSearch =
      searchQuery === "" ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone.includes(searchQuery) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.storeName.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  const getRoleBadge = (roleId: string) => {
    const found = rolesList.find((r) => r.id === roleId);
    if (found) {
      return (
        <Badge className={found.badgeCls || "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"}>
          {found.name}
        </Badge>
      );
    }
    return <Badge variant="secondary">{roleId}</Badge>;
  };

  // 3-Dots Action Menu Renderer
  const renderActionDropdown = (staff: StoreStaffMember) => {
    const isOpen = activeActionMenuId === staff.id;
    return (
      <div className="relative inline-block text-left">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setActiveActionMenuId(isOpen ? null : staff.id);
          }}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Staff Member Actions Menu"
        >
          <MoreVertical size={16} />
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-30"
              onClick={() => setActiveActionMenuId(null)}
            />
            <div className="absolute right-0 mt-1 w-52 rounded-2xl bg-white dark:bg-[#181d30] border border-slate-200 dark:border-slate-800 shadow-xl z-40 py-1 text-xs font-semibold animate-in fade-in zoom-in-95 duration-150">
              <button
                onClick={() => {
                  setSelectedStaffDetails(staff);
                  setActiveActionMenuId(null);
                }}
                className="w-full flex items-center gap-2 px-3.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-left"
              >
                <Eye size={14} className="text-blue-500" />
                <span>View Details</span>
              </button>

              <button
                onClick={() => {
                  setEditingStaff(staff);
                  setActiveActionMenuId(null);
                }}
                className="w-full flex items-center gap-2 px-3.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-left"
              >
                <Edit3 size={14} className="text-amber-500" />
                <span>Edit Role & Permissions</span>
              </button>

              <button
                onClick={() => handleResendInvite(staff)}
                className="w-full flex items-center gap-2 px-3.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-left"
              >
                <Mail size={14} className="text-purple-500" />
                <span>Resend Activation Email</span>
              </button>

              {staff.inviteUrl && (
                <button
                  onClick={() => handleCopyLink(staff.inviteUrl!, staff.id)}
                  className="w-full flex items-center gap-2 px-3.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-left"
                >
                  <Copy size={14} className="text-indigo-500" />
                  <span>Copy Direct Password Link</span>
                </button>
              )}

              <button
                onClick={() => handleToggleStaffStatus(staff)}
                className="w-full flex items-center gap-2 px-3.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-left"
              >
                {staff.status === "ACTIVE" ? (
                  <>
                    <PauseCircle size={14} className="text-amber-600" />
                    <span>Suspend Access</span>
                  </>
                ) : (
                  <>
                    <PlayCircle size={14} className="text-emerald-500" />
                    <span>Activate Access</span>
                  </>
                )}
              </button>

              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

              <button
                onClick={() => handleDeleteStaff(staff.id, staff.name)}
                className="w-full flex items-center gap-2 px-3.5 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-left font-bold"
              >
                <Trash2 size={14} />
                <span>Remove Staff Member</span>
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  // Filter staff-related audit logs
  const staffAudits = appStore.auditLogs.filter(
    (a) =>
      a.action?.startsWith("STAFF_") ||
      a.entity?.toLowerCase().includes("staff") ||
      a.entity?.toLowerCase().includes("role")
  );

  // Metrics
  const totalStaffCount = filteredStaff.length;
  const activeStaffCount = filteredStaff.filter((s) => s.status === "ACTIVE").length;
  const invitedStaffCount = filteredStaff.filter((s) => s.status === "INVITED").length;
  const customRolesCount = rolesList.filter((r) => !r.isSystem).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold font-['Manrope'] text-slate-900 dark:text-white">
              {isStorePortal && currentScopedStore
                ? `${currentScopedStore.branchName} Staff & Roles Studio`
                : "Store Staff & Custom Roles Studio"}
            </h2>
            <Badge
              className={cn(
                "border-0 shadow-none text-xs font-bold",
                isStorePortal
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                  : "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300"
              )}
            >
              {isStorePortal ? "Store Branch Level" : "Merchant Network"}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isStorePortal
              ? `Empower branch managers, supervisors, and order verifiers for ${currentScopedStore?.branchName || "this outlet"}. Set passwords via secure direct link.`
              : "Manage on-ground branch staff, create scoped custom roles, and dispatch single-use password activation links with zero PINs."}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={fetchBackendData}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            title="Refresh Live Staff & Roles"
          >
            <RefreshCw size={15} className={cn(loading && "animate-spin")} />
          </button>

          <button
            onClick={() => setIsAddRoleOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold border border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors shadow-xs"
          >
            <Shield size={15} />
            <span>Create Custom Role</span>
          </button>

          <button
            onClick={() => {
              if (isStorePortal && scopedStoreId) {
                setAssignedStoreId(scopedStoreId);
              }
              setIsAddStaffOpen(true);
            }}
            className="btn-gradient flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-md hover:opacity-95 transition-opacity"
          >
            <Plus size={16} />
            <span>Invite Store Staff</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
            <Users size={18} />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Total Staff Team</p>
            <p className="text-xl font-bold font-['Manrope'] text-slate-900 dark:text-white">{totalStaffCount}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Active Credentials</p>
            <p className="text-xl font-bold font-['Manrope'] text-slate-900 dark:text-white">{activeStaffCount}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
            <Clock size={18} />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Pending Invites</p>
            <p className="text-xl font-bold font-['Manrope'] text-slate-900 dark:text-white">{invitedStaffCount}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
            <ShieldCheck size={18} />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Custom Store Roles</p>
            <p className="text-xl font-bold font-['Manrope'] text-slate-900 dark:text-white">{customRolesCount}</p>
          </div>
        </div>
      </div>

      {/* Sub-Tabs Navigation */}
      {!hideTabs && (
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 w-fit">
          <button
            onClick={() => setActiveTab("staff")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
              activeTab === "staff"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            )}
          >
            <Users size={14} />
            <span>Staff Directory ({totalStaffCount})</span>
          </button>
          <button
            onClick={() => setActiveTab("roles")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
              activeTab === "roles"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            )}
          >
            <ShieldCheck size={14} />
            <span>Custom Roles & Matrix ({rolesList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
              activeTab === "audit"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            )}
          >
            <History size={14} />
            <span>Staff Audit Logs</span>
          </button>
        </div>
      )}

      {/* SUB-VIEW 1: STAFF DIRECTORY */}
      {activeTab === "staff" && (
        <div className="space-y-4">
          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="relative flex-1">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search staff name, email, phone, or outlet..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border-0 focus:ring-2 focus:ring-purple-500 text-slate-900 dark:text-white font-medium"
              />
            </div>

            {!isStorePortal && (
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-slate-400 shrink-0" />
                <select
                  value={selectedBranchFilter}
                  onChange={(e) => setSelectedBranchFilter(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border-0 text-slate-700 dark:text-slate-300 font-semibold focus:ring-2 focus:ring-purple-500"
                >
                  <option value="ALL">All Branch Outlets</option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.branchName} ({s.city})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Loading Skeleton */}
          {loading ? (
            <div className="p-6 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200 dark:border-slate-800 space-y-4 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
                    <div className="space-y-2">
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-32" />
                      <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-48" />
                    </div>
                  </div>
                  <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-full w-20" />
                </div>
              ))}
            </div>
          ) : (
            /* Staff Table */
            <div className="rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Staff Member</th>
                      <th className="py-3 px-4">Assigned Outlet</th>
                      <th className="py-3 px-4">Operational Role</th>
                      <th className="py-3 px-4">Login Security & Invite</th>
                      <th className="py-3 px-4">Granted Permissions</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredStaff.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                          <div className="max-w-xs mx-auto space-y-2">
                            <Users size={28} className="mx-auto text-slate-300" />
                            <p className="font-bold text-slate-700 dark:text-slate-300">No staff members found</p>
                            <p className="text-[11px] text-slate-400">
                              Invite your floor team with direct single-use password activation links.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredStaff.map((staff) => (
                        <tr
                          key={staff.id}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                        >
                          {/* Member Name */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold flex items-center justify-center shrink-0">
                                {staff.name.charAt(0)}
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 dark:text-white block">
                                  {staff.name}
                                </span>
                                <span className="text-[11px] text-purple-600 dark:text-purple-400 block font-mono">
                                  {staff.email}
                                </span>
                                {staff.phone && (
                                  <span className="text-[10px] text-slate-400 font-mono block">
                                    {staff.phone}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Store Branch */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                              <Store size={13} className="text-amber-500 shrink-0" />
                              <span className="font-semibold">{staff.storeName}</span>
                            </div>
                          </td>

                          {/* Role */}
                          <td className="py-3.5 px-4">{getRoleBadge(staff.role)}</td>

                          {/* Security & Invite Link Column */}
                          <td className="py-3.5 px-4">
                            {staff.status === "INVITED" ? (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                                  <Clock size={10} />
                                  Invite Sent
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => handleCopyLink(staff.inviteUrl || `${window.location.origin}/accept-invite?token=st_${staff.id}`, staff.id)}
                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline"
                                    title="Copy direct password setup URL"
                                  >
                                    {copiedStaffId === staff.id ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                                    <span>{copiedStaffId === staff.id ? "Copied Link!" : "Copy Invite"}</span>
                                  </button>
                                  <span className="text-slate-300 dark:text-slate-700">·</span>
                                  <button
                                    onClick={() => handleResendInvite(staff)}
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                                    title="Resend email with fresh token"
                                  >
                                    <RefreshCw size={10} />
                                    <span>Resend</span>
                                  </button>
                                </div>
                              </div>
                            ) : staff.status === "ACTIVE" ? (
                              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                <Lock size={12} className="text-emerald-500" />
                                <span>Password Set</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-xs text-rose-500 font-medium">
                                <PauseCircle size={12} />
                                <span>Suspended</span>
                              </div>
                            )}
                          </td>

                          {/* Permissions Tags */}
                          <td className="py-3.5 px-4">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {staff.permissions.canViewQR && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200/60">
                                  Counter QR
                                </span>
                              )}
                              {staff.permissions.canViewBilling && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/60">
                                  Live Billing
                                </span>
                              )}
                              {staff.permissions.canApplyDiscounts && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60">
                                  Discounts
                                </span>
                              )}
                              {staff.permissions.canManageOffers && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300 border border-pink-200/60">
                                  Offers
                                </span>
                              )}
                              {staff.permissions.canEditTimings && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/60">
                                  Timings
                                </span>
                              )}
                              {staff.permissions.canManageStaff && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border border-teal-200/60">
                                  Staff Lead
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4">
                            {staff.status === "ACTIVE" ? (
                              <Badge variant="success">Active</Badge>
                            ) : staff.status === "INVITED" ? (
                              <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                                Invited
                              </Badge>
                            ) : (
                              <Badge variant="destructive">Suspended</Badge>
                            )}
                          </td>

                          {/* Actions — 3-Dots Dropdown */}
                          <td className="py-3.5 px-4 text-right">
                            {renderActionDropdown(staff)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-VIEW 2: CUSTOM ROLES STUDIO */}
      {activeTab === "roles" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Store Role & Permissions Matrix
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure operational permissions scoped to branch store operations or brand corporate HQ.
              </p>
            </div>

            <button
              onClick={() => setIsAddRoleOpen(true)}
              className="btn-gradient inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white shadow-md self-start sm:self-auto"
            >
              <Plus size={15} />
              <span>Create Store Custom Role</span>
            </button>
          </div>

          {/* Roles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {rolesList.map((r) => {
              const activeCount = Object.values(r.permissions).filter(Boolean).length;
              return (
                <div
                  key={r.id}
                  className="p-5 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4 hover:border-purple-300 dark:hover:border-purple-900 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge
                          className={cn(
                            "text-[10px] font-bold uppercase tracking-wider shadow-none",
                            r.scope === "STORE"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                              : "bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200 dark:border-purple-800"
                          )}
                        >
                          {r.scope === "STORE" ? "Store Branch Scope" : "Brand HQ Scope"}
                        </Badge>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1.5">
                          {r.name}
                        </h3>
                      </div>

                      <div className="flex items-center gap-1">
                        {!r.isSystem && (
                          <button
                            onClick={() => setEditingRole(r)}
                            className="p-1 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40"
                            title="Edit Role"
                          >
                            <Edit3 size={14} />
                          </button>
                        )}
                        {!r.isSystem && (
                          <button
                            onClick={() => handleDeleteRole(r.id, r.name)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            title="Delete Custom Role"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed min-h-[36px]">
                      {r.description}
                    </p>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-2">
                        Granted Permissions ({activeCount} / 7):
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {r.permissions.canViewQR && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                            Counter QR
                          </span>
                        )}
                        {r.permissions.canViewBilling && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                            Live Redemptions
                          </span>
                        )}
                        {r.permissions.canApplyDiscounts && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                            Discounts
                          </span>
                        )}
                        {r.permissions.canManageOffers && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300">
                            Branch Deals
                          </span>
                        )}
                        {r.permissions.canEditTimings && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                            Timings
                          </span>
                        )}
                        {r.permissions.canViewAnalytics && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                            Analytics
                          </span>
                        )}
                        {r.permissions.canManageStaff && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300">
                            Staff Roster
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 text-[10px] text-slate-400 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                    <span className="font-semibold">{r.isSystem ? "Built-in System Role" : "Custom Scoped Role"}</span>
                    <span>
                      {staffList.filter((s) => s.role === r.id).length} staff assigned
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: STAFF AUDIT HISTORY */}
      {activeTab === "audit" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <History size={18} className="text-purple-600" />
                <span>Staff & Role Audit Trail History</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Timestamped audit log of staff invitations, role reassignments, status toggles, and access removals.
              </p>
            </div>
            <span className="font-mono text-xs text-slate-400 font-bold">
              {staffAudits.length} recorded events
            </span>
          </div>

          <div className="rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs">
            {staffAudits.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Clock size={28} className="mx-auto text-slate-300" />
                <p className="font-bold text-slate-700 dark:text-slate-300">No recent staff audit logs recorded</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Staff invitations, status updates, and role modifications will emit immutable audit events here.
                </p>
              </div>
            ) : (
              <div className="space-y-4 relative before:absolute before:inset-y-0 before:left-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                {staffAudits.map((aud) => (
                  <div key={aud.id} className="relative pl-7 text-xs space-y-1">
                    <div
                      className={cn(
                        "absolute left-1 top-1.5 w-4 h-4 rounded-full border-2 bg-white dark:bg-slate-900",
                        aud.severity === "success"
                          ? "border-emerald-500"
                          : aud.severity === "critical"
                          ? "border-rose-500"
                          : "border-purple-500"
                      )}
                    />
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {aud.action}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">
                          {aud.time ? new Date(aud.time).toUTCString() : "Recent"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {aud.entity}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Actor: <span className="font-semibold text-slate-700 dark:text-slate-300">{aud.actor}</span>
                      </p>
                      {aud.metadata && (
                        <pre className="text-[10px] font-mono p-2.5 rounded-xl bg-slate-100 dark:bg-slate-950/80 text-slate-600 dark:text-slate-400 overflow-x-auto mt-2">
                          {JSON.stringify(aud.metadata, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW DETAILS DRAWER */}
      {selectedStaffDetails && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedStaffDetails(null)}
          />
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <aside className="w-screen max-w-md bg-white dark:bg-[#121626] shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center font-bold">
                    {selectedStaffDetails.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {selectedStaffDetails.name}
                    </h3>
                    <p className="text-[11px] text-slate-400">Staff Profile & Granted Access</p>
                  </div>
                </div>
                <button onClick={() => setSelectedStaffDetails(null)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
                <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-900/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                      Assigned Scope: {selectedStaffDetails.storeId === "ALL" ? "MERCHANT HQ" : "STORE OUTLET"}
                    </span>
                    <Badge variant={selectedStaffDetails.status === "ACTIVE" ? "success" : "warning"}>
                      {selectedStaffDetails.status}
                    </Badge>
                  </div>
                  <p className="font-bold text-sm text-slate-900 dark:text-white">
                    {selectedStaffDetails.storeName}
                  </p>
                  <p className="font-mono text-xs text-purple-600 dark:text-purple-400">
                    {selectedStaffDetails.email}
                  </p>
                  {selectedStaffDetails.phone && (
                    <p className="font-mono text-xs text-slate-500">
                      Phone: {selectedStaffDetails.phone}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">Operational Role</label>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                    <span className="font-bold text-slate-900 dark:text-white">{selectedStaffDetails.role}</span>
                    {getRoleBadge(selectedStaffDetails.role)}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">Granular Permissions Breakdown</label>
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
                    {Object.entries(selectedStaffDetails.permissions).map(([k, v]) => (
                      <div key={k} className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-500">{k}:</span>
                        <span className={cn("font-bold", v ? "text-emerald-600" : "text-slate-400")}>
                          {v ? "GRANTED" : "DENIED"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">Metadata & Timestamps</label>
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Last Active:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">{selectedStaffDetails.lastActive || "Never"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Added On:</span>
                      <span className="font-mono text-slate-500">{selectedStaffDetails.createdAt ? selectedStaffDetails.createdAt.split("T")[0] : "Recent"}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end">
                <button onClick={() => setSelectedStaffDetails(null)} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold">
                  Close
                </button>
              </div>
            </aside>
          </div>
        </div>
      )}

      {/* CREATE STAFF MODAL / DRAWER */}
      {isAddStaffOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsAddStaffOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <aside className="w-screen max-w-md bg-white dark:bg-[#121626] shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-transparent">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-600 text-white shadow-md">
                    <UserCheck size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {isStorePortal ? "Invite In-Store Staff" : "Invite Store Staff Member"}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Dispatches single-use password setup link for {currentScopedStore?.branchName || "branch outlet"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsAddStaffOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddStaffSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Staff Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:outline-hidden focus:border-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Staff Work Email *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="rahul.supervisor@outlet.in"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-semibold focus:outline-hidden focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Contact Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono focus:outline-hidden focus:border-purple-500"
                    />
                  </div>
                </div>

                {/* Password-based security notice (Zero PIN) */}
                <div className="p-3 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-800/60 space-y-1">
                  <div className="flex items-center gap-1.5 text-purple-700 dark:text-purple-300 font-bold text-[11px]">
                    <Lock size={12} />
                    <span>Password-Based Staff Authentication</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    A secure 48-hour single-use invitation link (<code className="font-mono text-purple-700 dark:text-purple-300">/accept-invite?token=...</code>) will be dispatched to this email. No temporary passwords or keypad PINs required.
                  </p>
                </div>

                {/* Assigned Store */}
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Assigned Store Outlet
                  </label>
                  {isStorePortal && currentScopedStore ? (
                    <div className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <Store size={14} className="text-amber-500" />
                      <span>{currentScopedStore.branchName} ({currentScopedStore.city})</span>
                    </div>
                  ) : (
                    <select
                      value={assignedStoreId}
                      onChange={(e) => setAssignedStoreId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                    >
                      <option value="ALL">All Branch Outlets / Corporate HQ</option>
                      {stores.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.branchName} ({st.city})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Role Selector */}
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Operational Role
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                  >
                    {rolesList.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.scope === "STORE" ? "Store Scope" : "HQ Scope"})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Granular Permission Overrides */}
                <div className="pt-2">
                  <label className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-2">
                    <ShieldCheck size={14} className="text-purple-600" />
                    Granular Permission Checklist
                  </label>

                  <div className="space-y-2 rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-3.5 border border-slate-200/80 dark:border-slate-700/80 max-h-52 overflow-y-auto">
                    {STORE_PERMISSION_CONFIG.map((cfg) => (
                      <label key={cfg.key} className="flex items-start gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!(perms as any)[cfg.key]}
                          onChange={(e) => setPerms({ ...perms, [cfg.key]: e.target.checked })}
                          className="mt-0.5 rounded text-purple-600 focus:ring-purple-500"
                        />
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs">{cfg.title}</p>
                          <p className="text-[10px] text-slate-400">{cfg.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={isInviting}
                    className="btn-gradient w-full py-3 rounded-xl text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-50"
                  >
                    <Send size={15} />
                    <span>{isInviting ? "Generating Invitation Link..." : "Dispatch Invitation & Link"}</span>
                  </button>
                </div>
              </form>
            </aside>
          </div>
        </div>
      )}

      {/* CREATE CUSTOM ROLE DRAWER */}
      {isAddRoleOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsAddRoleOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <aside className="w-screen max-w-md bg-white dark:bg-[#121626] shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-transparent">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-600 text-white shadow-md">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Create Store Custom Role
                    </h3>
                    <p className="text-xs text-slate-500">
                      Define a specialized role with customized in-store permissions
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddRoleOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateRoleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Role Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Counter Cashier & Redemption Lead, Shift Supervisor"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:outline-hidden focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Role Scope
                  </label>
                  <select
                    value={newRoleScope}
                    disabled={isStorePortal}
                    onChange={(e) => setNewRoleScope(e.target.value as "MERCHANT" | "STORE")}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                  >
                    <option value="STORE">In-Store Branch Level (Managers, Supervisors, Order Verifiers)</option>
                    <option value="MERCHANT">Brand Corporate HQ Level (Multi-store Operations)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Role Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Describe operational responsibilities and authority..."
                    value={newRoleDesc}
                    onChange={(e) => setNewRoleDesc(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>

                {/* Granular Permission Checklist */}
                <div>
                  <label className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-2">
                    <ShieldCheck size={14} className="text-purple-600" />
                    Grant Operational Permissions
                  </label>

                  <div className="space-y-2 rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-3.5 border border-slate-200/80 dark:border-slate-700/80 max-h-52 overflow-y-auto">
                    {STORE_PERMISSION_CONFIG.map((cfg) => (
                      <label key={cfg.key} className="flex items-start gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!newRolePerms[cfg.key]}
                          onChange={(e) =>
                            setNewRolePerms({ ...newRolePerms, [cfg.key]: e.target.checked })
                          }
                          className="mt-0.5 rounded text-purple-600 focus:ring-purple-500"
                        />
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs">{cfg.title}</p>
                          <p className="text-[10px] text-slate-400">{cfg.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    className="btn-gradient w-full py-3 rounded-xl text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2 hover:opacity-95"
                  >
                    <Plus size={15} />
                    <span>Create Custom Role</span>
                  </button>
                </div>
              </form>
            </aside>
          </div>
        </div>
      )}

      {/* EDIT ROLE MODAL */}
      {editingRole && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setEditingRole(null)}
          />

          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <aside className="w-screen max-w-md bg-white dark:bg-[#121626] shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-transparent">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-600 text-white shadow-md">
                    <Edit3 size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Edit Custom Role
                    </h3>
                    <p className="text-xs text-slate-500">
                      Update role title, description, and granted permissions
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setEditingRole(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleEditRoleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Role Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingRole.name}
                    onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:outline-hidden focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Role Description
                  </label>
                  <textarea
                    rows={2}
                    value={editingRole.description}
                    onChange={(e) => setEditingRole({ ...editingRole, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-2">
                    <ShieldCheck size={14} className="text-purple-600" />
                    Granted Permissions
                  </label>

                  <div className="space-y-2 rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-3.5 border border-slate-200/80 dark:border-slate-700/80 max-h-60 overflow-y-auto">
                    {STORE_PERMISSION_CONFIG.map((cfg) => (
                      <label key={cfg.key} className="flex items-start gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!editingRole.permissions[cfg.key]}
                          onChange={(e) =>
                            setEditingRole({
                              ...editingRole,
                              permissions: {
                                ...editingRole.permissions,
                                [cfg.key]: e.target.checked,
                              },
                            })
                          }
                          className="mt-0.5 rounded text-purple-600 focus:ring-purple-500"
                        />
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs">{cfg.title}</p>
                          <p className="text-[10px] text-slate-400">{cfg.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    className="btn-gradient w-full py-3 rounded-xl text-white font-bold text-xs shadow-lg hover:opacity-95"
                  >
                    Save Role Changes
                  </button>
                </div>
              </form>
            </aside>
          </div>
        </div>
      )}

      {/* EDIT STAFF MODAL */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setEditingStaff(null)}
          />

          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <aside className="w-screen max-w-md bg-white dark:bg-[#121626] shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-transparent">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-600 text-white shadow-md">
                    <Edit3 size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Edit Staff Member: {editingStaff.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Modify assigned role and in-store operational permissions
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X size={18} />
                </button>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    await staffApi.updateMerchantStaffRole(
                      editingStaff.id,
                      editingStaff.role,
                      JSON.stringify(editingStaff.permissions)
                    );
                    toast.success(`Staff role & permissions updated for ${editingStaff.name}!`);
                    appStore.addAudit({
                      action: "STAFF_ROLE_UPDATED",
                      entity: `Staff: ${editingStaff.name}`,
                      actor: "Merchant Partner",
                      severity: "info",
                      metadata: { staffId: editingStaff.id, role: editingStaff.role }
                    });
                    fetchBackendData();
                  } catch (err: any) {
                    toast.error(err?.response?.data?.message || "Failed to update staff permissions");
                  } finally {
                    setEditingStaff(null);
                  }
                }}
                className="flex-1 overflow-y-auto p-6 space-y-4 text-xs"
              >
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Operational Role
                  </label>
                  <select
                    value={editingStaff.role}
                    onChange={(e) => {
                      const newRoleId = e.target.value as StaffRole;
                      const matched = rolesList.find((r) => r.id === newRoleId);
                      setEditingStaff({
                        ...editingStaff,
                        role: newRoleId,
                        permissions: matched
                          ? {
                              canViewQR: !!matched.permissions.canViewQR,
                              canViewBilling: !!matched.permissions.canViewBilling,
                              canApplyDiscounts: !!matched.permissions.canApplyDiscounts,
                              canManageOffers: !!matched.permissions.canManageOffers,
                              canEditTimings: !!matched.permissions.canEditTimings,
                              canViewAnalytics: !!matched.permissions.canViewAnalytics,
                              canManageStaff: !!matched.permissions.canManageStaff,
                              canEditBankDetails: false,
                              canUploadKYC: false,
                            }
                          : editingStaff.permissions,
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                  >
                    {rolesList.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Password Credentials Action Callout */}
                <div className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-800/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-700 dark:text-purple-300 text-xs flex items-center gap-1.5">
                      <Lock size={12} />
                      Password Credentials
                    </span>
                    <Badge variant="outline" className="text-[10px] font-bold">
                      {editingStaff.status}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Staff authentication is strictly password-based. You can generate a new single-use password link at any time.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleResendInvite(editingStaff)}
                    className="w-full py-2 px-3 rounded-xl bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-purple-50 shadow-xs"
                  >
                    <RefreshCw size={12} />
                    <span>Generate & Resend Invitation Email</span>
                  </button>
                </div>

                {/* Granular Permission Checklist */}
                <div>
                  <label className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-2">
                    <ShieldCheck size={14} className="text-purple-600" />
                    Assigned Operational Permissions
                  </label>

                  <div className="space-y-2 rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-3.5 border border-slate-200/80 dark:border-slate-700/80 max-h-52 overflow-y-auto">
                    {STORE_PERMISSION_CONFIG.map((cfg) => (
                      <label key={cfg.key} className="flex items-start gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!(editingStaff.permissions as any)[cfg.key]}
                          onChange={(e) =>
                            setEditingStaff({
                              ...editingStaff,
                              permissions: {
                                ...editingStaff.permissions,
                                [cfg.key]: e.target.checked,
                              },
                            })
                          }
                          className="mt-0.5 rounded text-purple-600 focus:ring-purple-500"
                        />
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs">{cfg.title}</p>
                          <p className="text-[10px] text-slate-400">{cfg.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingStaff(null)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-gradient px-5 py-2.5 rounded-xl text-white font-bold shadow-md hover:opacity-95"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </aside>
          </div>
        </div>
      )}

      {/* INVITATION SUCCESS MODAL */}
      {inviteSuccessData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white dark:bg-[#121626] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Store Staff Invitation Dispatched!
                  </h3>
                  <p className="text-xs text-slate-500">
                    A single-use password activation link is now live.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInviteSuccessData(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Invited Staff:</span>
                <span className="font-bold text-slate-900 dark:text-white">{inviteSuccessData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Work Email:</span>
                <span className="font-mono text-purple-600 dark:text-purple-400 font-bold">{inviteSuccessData.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Assigned Role:</span>
                <Badge variant="outline" className="text-[10px]">{inviteSuccessData.roleName}</Badge>
              </div>
              {inviteSuccessData.branchName && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Assigned Branch:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{inviteSuccessData.branchName}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                Single-Use Activation & Password Setup Link:
              </label>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800">
                <input
                  type="text"
                  readOnly
                  value={inviteSuccessData.inviteUrl}
                  className="bg-transparent flex-1 font-mono text-[11px] text-purple-700 dark:text-purple-300 outline-hidden select-all"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(inviteSuccessData.inviteUrl);
                    toast.success("Invitation URL copied to clipboard!");
                  }}
                  className="btn-gradient px-3 py-1.5 rounded-lg text-white font-bold text-[11px] flex items-center gap-1 shadow-xs"
                >
                  <Copy size={12} />
                  <span>Copy</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-400 italic">
                Valid for 48 hours. The recipient can set their password and log in immediately. Zero PIN required.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setInviteSuccessData(null)}
                className="btn-gradient px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-md"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SLEEK DELETE CONFIRMATION DIALOG */}
      {deleteConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white dark:bg-[#121626] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200/60 dark:border-rose-900/50 shadow-xs">
                <Trash2 size={20} />
              </div>
              <div className="flex-1 pr-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {deleteConfirmation.type === "role" ? "Delete Custom Role" : "Remove Staff Member"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Confirm permanent removal from store registry
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDeleteConfirmation(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-xs space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Target:</span>
                <span className="font-bold text-slate-900 dark:text-white">{deleteConfirmation.name}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/50 text-xs text-rose-900 dark:text-rose-200">
              <AlertCircle size={16} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed text-[11px]">
                {deleteConfirmation.details}
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteConfirmation(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md shadow-rose-600/20 flex items-center gap-1.5"
              >
                <Trash2 size={13} />
                <span>{deleteConfirmation.type === "role" ? "Delete Role" : "Remove Staff"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
