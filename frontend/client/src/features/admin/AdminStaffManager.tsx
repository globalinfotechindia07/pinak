import React, { useState, useEffect } from "react";
import { staffApi } from "../../api/staffApi";
import { z } from "zod";
import {
  Users,
  Plus,
  Shield,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Edit3,
  X,
  Mail,
  Building,
  FileCheck2,
  Tag,
  DollarSign,
  Settings,
  Sparkles,
  Layers,
  Send,
  Lock,
  PauseCircle,
  PlayCircle,
  Copy,
  Check,
  AlertTriangle,
  Search,
  Filter,
  LayoutDashboard,
  MapPin,
  Store,
  Building2,
  TicketPercent,
  WalletCards,
  PanelLeft,
  UserCheck
} from "lucide-react";
import { AdminTeamMember, AdminRole, AdminPermissions, AdminRoleDefinition } from "../../types";
import { AdvancedTable, Column } from "../../components/ui/AdvancedTable";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { cn } from "../../lib/utils";
import { toast } from "sonner";
import { appStore } from "../../services/dataStore";

// Default System Roles
const DEFAULT_SYSTEM_ROLES: AdminRoleDefinition[] = [
  {
    id: "SUPERADMIN",
    name: "Super Admin",
    description: "Unrestricted platform & cluster administration with full authority over merchants, settlements & system settings.",
    badgeCls: "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300",
    isSystem: true,
    createdAt: "2026-06-01T00:00:00Z",
    permissions: {
      canManageMerchants: true,
      canVerifyKYC: true,
      canModerateOffers: true,
      canViewFinancials: true,
      canManageTaxonomy: true,
      canConfigurePlatform: true,
      canManageStaff: true,
    },
  },
  {
    id: "REGIONAL_OPS",
    name: "Regional Ops Lead",
    description: "Manages regional merchant onboarding, store locations, and discount campaign moderation.",
    badgeCls: "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
    isSystem: true,
    createdAt: "2026-06-01T00:00:00Z",
    permissions: {
      canManageMerchants: true,
      canVerifyKYC: true,
      canModerateOffers: true,
      canViewFinancials: false,
      canManageTaxonomy: false,
      canConfigurePlatform: false,
      canManageStaff: false,
    },
  },
  {
    id: "COMPLIANCE_KYC",
    name: "Compliance & KYC",
    description: "Verifies government identity, GSTIN, PAN, bank account validation, and business licences.",
    badgeCls: "bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300",
    isSystem: true,
    createdAt: "2026-06-01T00:00:00Z",
    permissions: {
      canManageMerchants: true,
      canVerifyKYC: true,
      canModerateOffers: false,
      canViewFinancials: false,
      canManageTaxonomy: false,
      canConfigurePlatform: false,
      canManageStaff: false,
    },
  },
  {
    id: "FINANCE_AUDITOR",
    name: "Finance Auditor",
    description: "Monitors platform GMV, UPI transaction reconciliation, and merchant payout batches.",
    badgeCls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
    isSystem: true,
    createdAt: "2026-06-01T00:00:00Z",
    permissions: {
      canManageMerchants: false,
      canVerifyKYC: false,
      canModerateOffers: false,
      canViewFinancials: true,
      canManageTaxonomy: false,
      canConfigurePlatform: false,
      canManageStaff: false,
    },
  },
  {
    id: "CATALOG_LEAD",
    name: "Catalog Lead",
    description: "Curates categories, subcategories, tags, attributes, and discovery classifications.",
    badgeCls: "bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300",
    isSystem: true,
    createdAt: "2026-06-01T00:00:00Z",
    permissions: {
      canManageMerchants: false,
      canVerifyKYC: false,
      canModerateOffers: false,
      canViewFinancials: false,
      canManageTaxonomy: true,
      canConfigurePlatform: false,
      canManageStaff: false,
    },
  },
  {
    id: "SUPPORT_LEAD",
    name: "Support Lead",
    description: "Assists merchants and consumers, reviews customer tickets, and resolves transaction disputes.",
    badgeCls: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
    isSystem: true,
    createdAt: "2026-06-01T00:00:00Z",
    permissions: {
      canManageMerchants: false,
      canVerifyKYC: false,
      canModerateOffers: false,
      canViewFinancials: false,
      canManageTaxonomy: false,
      canConfigurePlatform: false,
      canManageStaff: false,
    },
  },
];


const PERMISSION_CONFIG: {
  key: keyof AdminPermissions;
  title: string;
  description: string;
  icon: React.ElementType;
}[] = [
  {
    key: "canManageMerchants",
    title: "Merchant Network Governance",
    description: "Approve onboarding applications, modify legal entities, or suspend non-compliant merchants.",
    icon: Building,
  },
  {
    key: "canVerifyKYC",
    title: "KYC & Identity Verification",
    description: "Verify GSTIN certificates, PAN records, bank verification proofs, and sign off on approvals.",
    icon: FileCheck2,
  },
  {
    key: "canModerateOffers",
    title: "Offer & Campaign Moderation",
    description: "Review promotional discount rules, feature deals on user home screens, and suspend abusive offers.",
    icon: Tag,
  },
  {
    key: "canViewFinancials",
    title: "Financials & Settlements",
    description: "Access ledger balances, platform transaction volumes, UPI settlements, and commission logs.",
    icon: DollarSign,
  },
  {
    key: "canManageTaxonomy",
    title: "Taxonomy & Categories",
    description: "Create and update store categories, subcategories, tags, attributes, and search keywords.",
    icon: Layers,
  },
  {
    key: "canConfigurePlatform",
    title: "Platform & Security Settings",
    description: "Configure system rate limits, API webhook integrations, auth session duration, and discovery radius.",
    icon: Settings,
  },
  {
    key: "canManageStaff",
    title: "Staff & RBAC Governance",
    description: "Create custom platform roles, invite admin personnel, adjust permissions, and revoke access.",
    icon: ShieldCheck,
  },
];

const ROLE_PRESET_COLORS: Record<string, { label: string; cls: string }> = {
  SUPERADMIN: { label: "Super Admin", cls: "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300" },
  REGIONAL_OPS: { label: "Regional Ops", cls: "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300" },
  COMPLIANCE_KYC: { label: "Compliance & KYC", cls: "bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300" },
  FINANCE_AUDITOR: { label: "Finance Auditor", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300" },
  CATALOG_LEAD: { label: "Catalog Lead", cls: "bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300" },
  SUPPORT_LEAD: { label: "Support Lead", cls: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300" },
};

// Console Sidebar Navigation mapping to Admin Permissions (exact match with Sidebar.tsx)
export interface AdminSidebarNavItemPreview {
  id: string;
  label: string;
  icon: React.ElementType;
  requiredPermissions?: (keyof AdminPermissions)[];
}

export const ADMIN_NAV_PREVIEWS: AdminSidebarNavItemPreview[] = [
  { id: "Overview", label: "Overview", icon: LayoutDashboard },
  { id: "Discovery", label: "Discovery Control", icon: MapPin, requiredPermissions: ["canModerateOffers", "canConfigurePlatform"] },
  { id: "Merchants", label: "Merchants & KYC", icon: Building2, requiredPermissions: ["canManageMerchants", "canVerifyKYC"] },
  { id: "Stores", label: "Stores & Branches", icon: Store, requiredPermissions: ["canManageMerchants"] },
  { id: "Offers", label: "Offers & Approval", icon: TicketPercent, requiredPermissions: ["canModerateOffers"] },
  { id: "Transactions", label: "UPI Transactions", icon: WalletCards, requiredPermissions: ["canViewFinancials"] },
  { id: "Rewards", label: "Rewards Economy", icon: Sparkles, requiredPermissions: ["canViewFinancials", "canConfigurePlatform"] },
  { id: "Customers", label: "Customer Base", icon: Users, requiredPermissions: ["canManageMerchants", "canModerateOffers", "canViewFinancials"] },
  { id: "Categories", label: "Categories", icon: Tag, requiredPermissions: ["canManageTaxonomy"] },
  { id: "AdminStaff", label: "Platform Staff & Roles", icon: UserCheck, requiredPermissions: ["canManageStaff"] },
  { id: "Audit", label: "Audit & RBAC", icon: ShieldCheck, requiredPermissions: ["canConfigurePlatform", "canManageStaff"] },
  { id: "Settings", label: "Settings", icon: Settings, requiredPermissions: ["canConfigurePlatform"] },
];

export function isNavItemVisible(item: AdminSidebarNavItemPreview, perms: AdminPermissions): boolean {
  if (!perms) return false;
  const hasAnyPermission = Object.values(perms).some(Boolean);
  if (!hasAnyPermission) return false;
  if (item.id === "Overview") return hasAnyPermission;
  if (!item.requiredPermissions || item.requiredPermissions.length === 0) return false;
  return item.requiredPermissions.some((key) => perms[key] === true);
}

export function getVisibleSidebarModuleNames(perms: AdminPermissions): string[] {
  if (!perms) return [];
  const hasAnyPermission = Object.values(perms).some(Boolean);
  if (!hasAnyPermission) return [];
  return ADMIN_NAV_PREVIEWS.filter((item) => isNavItemVisible(item, perms)).map((i) => i.label);
}

// Live Sidebar Menu Access Preview Component
const SidebarMenuPreview: React.FC<{
  permissions: AdminPermissions;
  onGrantPermission?: (key: keyof AdminPermissions) => void;
}> = ({ permissions, onGrantPermission }) => {
  const [filter, setFilter] = useState<"all" | "visible" | "hidden">("all");

  const visibleCount = React.useMemo(() => {
    return ADMIN_NAV_PREVIEWS.filter((item) => isNavItemVisible(item, permissions)).length;
  }, [permissions]);

  const hiddenCount = ADMIN_NAV_PREVIEWS.length - visibleCount;

  const displayedItems = React.useMemo(() => {
    return ADMIN_NAV_PREVIEWS.filter((item) => {
      const visible = isNavItemVisible(item, permissions);
      if (filter === "visible") return visible;
      if (filter === "hidden") return !visible;
      return true;
    });
  }, [permissions, filter]);

  return (
    <div className="mt-3 p-3.5 rounded-2xl bg-gradient-to-br from-slate-50 via-purple-50/20 to-slate-50 dark:from-slate-900/60 dark:via-purple-950/20 dark:to-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <PanelLeft size={14} className="text-purple-600 dark:text-purple-400" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            Console Sidebar Navigation Preview
          </span>
        </div>
        <span
          className={cn(
            "text-[10px] font-bold px-2 py-0.5 rounded-full transition-all",
            visibleCount > 0
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80"
              : "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80"
          )}
        >
          {visibleCount} of {ADMIN_NAV_PREVIEWS.length} Menus Visible
        </span>
      </div>

      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
        Real-time preview of which sidebar navigation modules will show in the PINAK console based on these permissions:
      </p>

      {/* Quick filter pills */}
      <div className="flex items-center gap-1 pb-1">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={cn(
            "px-2 py-0.5 rounded-md text-[10px] font-bold transition-all",
            filter === "all"
              ? "bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300"
              : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          )}
        >
          All ({ADMIN_NAV_PREVIEWS.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter("visible")}
          className={cn(
            "px-2 py-0.5 rounded-md text-[10px] font-bold transition-all flex items-center gap-1",
            filter === "visible"
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300"
              : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          )}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Visible ({visibleCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter("hidden")}
          className={cn(
            "px-2 py-0.5 rounded-md text-[10px] font-bold transition-all flex items-center gap-1",
            filter === "hidden"
              ? "bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300"
              : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          )}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
          Hidden ({hiddenCount})
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-52 overflow-y-auto pr-1">
        {displayedItems.map((item) => {
          const isVisible = isNavItemVisible(item, permissions);
          const Icon = item.icon;

          return (
            <div
              key={item.id}
              className={cn(
                "p-2 rounded-xl border text-xs flex items-center justify-between transition-all",
                isVisible
                  ? "bg-white dark:bg-slate-800/90 border-emerald-200/80 dark:border-emerald-900/50 shadow-2xs"
                  : "bg-slate-100/60 dark:bg-slate-900/40 border-slate-200/40 dark:border-slate-800/40 opacity-60"
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={cn(
                    "p-1.5 rounded-lg shrink-0",
                    isVisible
                      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
                      : "bg-slate-200 dark:bg-slate-800 text-slate-400"
                  )}
                >
                  <Icon size={13} />
                </div>
                <div className="min-w-0">
                  <span
                    className={cn(
                      "font-semibold text-xs truncate block",
                      isVisible
                        ? "text-slate-900 dark:text-white"
                        : "text-slate-500 dark:text-slate-400"
                    )}
                  >
                    {item.label}
                  </span>
                  <span className="text-[10px] text-slate-400 block truncate">
                    {isVisible
                      ? "✓ Active in sidebar"
                      : item.requiredPermissions
                      ? `Req: ${item.requiredPermissions[0]}`
                      : "Requires any permission"}
                  </span>
                </div>
              </div>

              <div className="shrink-0 ml-1.5">
                {isVisible ? (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                    <CheckCircle2 size={10} />
                    <span>Shows</span>
                  </span>
                ) : onGrantPermission && item.requiredPermissions && item.requiredPermissions.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => onGrantPermission(item.requiredPermissions![0])}
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800/60 transition-colors"
                    title={`Click to grant ${item.requiredPermissions[0]}`}
                  >
                    <Plus size={10} />
                    <span>Unlock</span>
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                    <Lock size={10} />
                    <span>Hidden</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

function getCurrentActor(): string {
  const u = appStore.getCurrentUser();
  if (u?.email) {
    const roleTag =
      u.email.toLowerCase() === "riya.admin@pinak.app" ||
      u.staffRoleId === "SUPERADMIN" ||
      u.role === "SUPER_ADMIN"
        ? "Super Admin"
        : u.staffRoleName || "Admin";
    return `${u.email} (${roleTag})`;
  }
  return "riya.admin@pinak.app (Super Admin)";
}

export const AdminStaffManager: React.FC = () => {
  // Navigation active tab: 'directory' vs 'roles'
  const [activeTab, setActiveTab] = useState<"directory" | "roles">("directory");

  // Staff members list
  const [staffList, setStaffList] = useState<AdminTeamMember[]>([]);

  // Roles definitions list (System + Custom)
  const [roles, setRoles] = useState<AdminRoleDefinition[]>(DEFAULT_SYSTEM_ROLES);
  const [isLoading, setIsLoading] = useState(false);

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<AdminTeamMember | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editingRole, setEditingRole] = useState<AdminRoleDefinition | null>(null);
  const [isSavingRoleEdit, setIsSavingRoleEdit] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteSuccessData, setInviteSuccessData] = useState<{
    name: string;
    email: string;
    roleName: string;
    inviteUrl?: string;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modern Delete Confirmation Modal State
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    type: "member" | "role";
    id: string;
    name: string;
    email?: string;
    role?: string;
    roleName?: string;
    details?: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Custom Role Form state
  const [customRoleName, setCustomRoleName] = useState("");
  const [customRoleKey, setCustomRoleKey] = useState("");
  const [customRoleDesc, setCustomRoleDesc] = useState("");
  const [customBadgeCls, setCustomBadgeCls] = useState("bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300");
  const [customPermissions, setCustomPermissions] = useState<AdminPermissions>({
    canManageMerchants: true,
    canVerifyKYC: true,
    canModerateOffers: false,
    canViewFinancials: false,
    canManageTaxonomy: false,
    canConfigurePlatform: false,
    canManageStaff: false,
  });

  // Invite Form State & Validation
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("REGIONAL_OPS");
  const [memberPermissions, setMemberPermissions] = useState<AdminPermissions>(
    DEFAULT_SYSTEM_ROLES[1].permissions
  );
  const [inviteErrors, setInviteErrors] = useState<Record<string, string>>({});

  const inviteStaffSchema = z.object({
    name: z
      .string()
      .trim()
      .min(1, "Full name is required")
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name cannot exceed 100 characters"),
    email: z
      .string()
      .trim()
      .min(1, "Work email address is required")
      .email("Please provide a valid email address (e.g. name@pinak.app)"),
    phone: z
      .string()
      .trim()
      .refine(
        (val) => !val || /^\+?[0-9\s\-()]{7,20}$/.test(val),
        "Please enter a valid phone number (e.g. +91 98200 12345)"
      ),
    roleId: z.string().min(1, "Role selection is required"),
  });

  const EMPTY_ADMIN_PERMISSIONS: AdminPermissions = {
    canManageMerchants: false,
    canVerifyKYC: false,
    canModerateOffers: false,
    canViewFinancials: false,
    canManageTaxonomy: false,
    canConfigurePlatform: false,
    canManageStaff: false,
  };

  const parsePermissions = (str?: string | object): AdminPermissions => {
    if (!str) return { ...EMPTY_ADMIN_PERMISSIONS };
    if (typeof str === "object") {
      const obj = str as any;
      return {
        canManageMerchants: !!obj.canManageMerchants,
        canVerifyKYC: !!obj.canVerifyKYC,
        canModerateOffers: !!obj.canModerateOffers,
        canViewFinancials: !!obj.canViewFinancials,
        canManageTaxonomy: !!obj.canManageTaxonomy,
        canConfigurePlatform: !!obj.canConfigurePlatform,
        canManageStaff: !!obj.canManageStaff,
      };
    }
    try {
      const parsed = JSON.parse(str);
      return {
        canManageMerchants: !!parsed.canManageMerchants,
        canVerifyKYC: !!parsed.canVerifyKYC,
        canModerateOffers: !!parsed.canModerateOffers,
        canViewFinancials: !!parsed.canViewFinancials,
        canManageTaxonomy: !!parsed.canManageTaxonomy,
        canConfigurePlatform: !!parsed.canConfigurePlatform,
        canManageStaff: !!parsed.canManageStaff,
      };
    } catch {
      return { ...EMPTY_ADMIN_PERMISSIONS };
    }
  };

  const handleSaveEditRole = async () => {
    if (!editingRole) return;
    setIsSavingRoleEdit(true);
    try {
      await staffApi.updatePlatformRole(editingRole.id, {
        name: editingRole.name,
        description: editingRole.description,
        badgeCls: editingRole.badgeCls,
        permissions: JSON.stringify(editingRole.permissions),
      });

      const targetRoleName = editingRole.name;
      const visibleModules = getVisibleSidebarModuleNames(editingRole.permissions);
      appStore.addAudit({
        action: `Platform Role Permissions Modified (${targetRoleName})`,
        entity: `Role: ${targetRoleName} (${editingRole.id})`,
        actor: getCurrentActor(),
        severity: "info",
        metadata: {
          roleId: editingRole.id,
          roleName: targetRoleName,
          badgeCls: editingRole.badgeCls,
          permissions: editingRole.permissions,
          visibleSidebarModules: visibleModules,
        },
      });

      toast.success(`Role "${editingRole.name}" updated successfully.`);
      appStore.addNotification({
        title: "Platform Role Updated",
        message: `Permissions for role "${editingRole.name}" were updated successfully.`,
        type: "system",
      });
      await loadStaffAndRoles();
      setEditingRole(null);
    } catch (err: any) {
      console.error("Backend update role failed:", err);
      toast.error(err?.response?.data?.message || err?.message || "Failed to update role");
    } finally {
      setIsSavingRoleEdit(false);
    }
  };

  const loadStaffAndRoles = async () => {
    setIsLoading(true);
    try {
      const [backendRoles, backendStaff] = await Promise.all([
        staffApi.getPlatformRoles().catch(() => []),
        staffApi.getPlatformStaff().catch(() => []),
      ]);

      if (Array.isArray(backendRoles) && backendRoles.length > 0) {
        const mappedRoles: AdminRoleDefinition[] = backendRoles.map((r) => ({
          id: r.id,
          name: r.name,
          description: r.description,
          badgeCls: r.badgeCls || "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300",
          isSystem: r.isSystem,
          permissions: parsePermissions(r.permissions),
          createdAt: r.createdAt,
        }));
        setRoles(mappedRoles);
      }

      if (Array.isArray(backendStaff)) {
        const mappedStaff: AdminTeamMember[] = backendStaff.map((s) => ({
          id: s.id,
          name: s.name,
          email: s.email,
          phone: s.phone || "",
          role: s.roleId as AdminRole,
          permissions: parsePermissions(s.customPermissions),
          status: s.status,
          lastLogin: s.lastLoginAt
            ? new Date(s.lastLoginAt).toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : s.status === "INVITED"
            ? "Pending Invite"
            : "Active",
          createdAt: s.createdAt,
          inviteUrl: s.inviteUrl,
        }));
        setStaffList(mappedStaff);
      }
    } catch (err: any) {
      console.warn("Backend staff sync notice:", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStaffAndRoles();
  }, []);

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
    const targetRole = roles.find((r) => r.id === roleId);
    if (targetRole) {
      setMemberPermissions({ ...targetRole.permissions });
    }
  };

  const handleCreateRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customRoleName.trim()) {
      toast.error("Please enter a role name.");
      return;
    }

    const key = (customRoleKey.trim() || "ROLE_" + customRoleName.trim().toUpperCase().replace(/[^A-Z0-9]/g, "_")).replace(/^ROLE_/, "ROLE_");
    if (roles.some((r) => r.id === key)) {
      toast.error(`A role with key "${key}" already exists.`);
      return;
    }

    try {
      await staffApi.createPlatformRole({
        id: key,
        scope: "PLATFORM",
        name: customRoleName.trim(),
        description: customRoleDesc.trim() || "Custom platform governance role.",
        badgeCls: customBadgeCls,
        permissions: JSON.stringify(customPermissions),
      });

      const visibleModules = getVisibleSidebarModuleNames(customPermissions);
      appStore.addAudit({
        action: `Custom Platform Role Created (${customRoleName.trim()})`,
        entity: `Role: ${customRoleName.trim()} (${key})`,
        actor: getCurrentActor(),
        severity: "success",
        metadata: {
          roleId: key,
          roleName: customRoleName.trim(),
          description: customRoleDesc.trim() || "Custom platform governance role.",
          badgeCls: customBadgeCls,
          permissions: customPermissions,
          visibleSidebarModules: visibleModules,
        },
      });

      toast.success(`Custom role "${customRoleName}" saved successfully!`);
      await loadStaffAndRoles();
      setIsRoleModalOpen(false);
      setCustomRoleName("");
      setCustomRoleKey("");
      setCustomRoleDesc("");
    } catch (err: any) {
      console.error("Backend create role failed:", err);
      toast.error(err?.response?.data?.message || err?.message || "Failed to create role");
    }
  };

  const promptDeleteRole = (roleId: string, roleName: string) => {
    const roleDef = roles.find((r) => r.id === roleId);
    if (roleDef?.isSystem) {
      toast.error("System roles cannot be deleted.");
      return;
    }

    const inUseCount = staffList.filter((s) => s.role === roleId).length;
    if (inUseCount > 0) {
      toast.error(`Cannot delete role: ${inUseCount} staff member(s) currently hold this role.`);
      return;
    }

    setDeleteConfirmation({
      type: "role",
      id: roleId,
      name: roleName,
      details: "This action will permanently delete this role configuration. All permissions associated with this role will be removed, and any staff assigned to it must be reassigned.",
    });
  };

  const toggleStaffStatus = async (member: AdminTeamMember) => {
    if (member.role === "SUPERADMIN") {
      toast.error("Super Admin status cannot be altered.");
      return;
    }
    const newStatus = member.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      await staffApi.updateStaffStatus(member.id, newStatus);

      appStore.addAudit({
        action: `Staff Member Status Changed (${newStatus})`,
        entity: `Staff: ${member.name} (${member.email})`,
        actor: getCurrentActor(),
        severity: newStatus === "SUSPENDED" ? "warning" : "success",
        metadata: {
          staffId: member.id,
          staffName: member.name,
          staffEmail: member.email,
          roleId: member.role,
          previousStatus: member.status,
          newStatus: newStatus,
        },
      });

      toast.success(`${member.name}'s status changed to ${newStatus}.`);
      await loadStaffAndRoles();
    } catch (err: any) {
      console.error("Backend update staff status failed:", err);
      toast.error(err?.response?.data?.message || err?.message || "Failed to update staff status");
    }
  };

  const handleSaveEditMember = async () => {
    if (!editingMember) return;
    setIsSavingEdit(true);
    try {
      await staffApi.updateStaffRole(
        editingMember.id,
        editingMember.role,
        JSON.stringify(editingMember.permissions)
      );
      if (editingMember.status && editingMember.status !== "INVITED") {
        await staffApi.updateStaffStatus(
          editingMember.id,
          editingMember.status === "ACTIVE" ? "ACTIVE" : "SUSPENDED"
        );
      }

      const activeRole = roles.find((r) => r.id === editingMember.role);
      const targetRoleName = activeRole ? activeRole.name : editingMember.role;
      const visibleModules = getVisibleSidebarModuleNames(editingMember.permissions);

      appStore.addAudit({
        action: `Staff Role / Permissions Updated (${editingMember.name})`,
        entity: `Staff: ${editingMember.name} (${editingMember.email})`,
        actor: getCurrentActor(),
        severity: "info",
        metadata: {
          staffId: editingMember.id,
          staffName: editingMember.name,
          staffEmail: editingMember.email,
          roleId: editingMember.role,
          roleName: targetRoleName,
          status: editingMember.status,
          permissions: editingMember.permissions,
          visibleSidebarModules: visibleModules,
        },
      });

      toast.success(`Staff member ${editingMember.name}'s permissions have been updated.`);
      appStore.addNotification({
        title: "Staff Member Updated",
        message: `Permissions for ${editingMember.name} have been updated successfully.`,
        type: "system",
      });
      await loadStaffAndRoles();
      setEditingMember(null);
    } catch (err: any) {
      console.error("Backend update staff failed:", err);
      toast.error(err?.response?.data?.message || err?.message || "Failed to update staff member");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteErrors({});

    const validation = inviteStaffSchema.safeParse({
      name,
      email,
      phone,
      roleId: selectedRole,
    });

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const fieldName = issue.path[0]?.toString() || "form";
        if (!fieldErrors[fieldName]) {
          fieldErrors[fieldName] = issue.message;
        }
      });
      setInviteErrors(fieldErrors);
      const firstError = Object.values(fieldErrors)[0];
      toast.error(firstError || "Please correct the highlighted form errors.");
      return;
    }

    if (staffList.some((s) => s.email.toLowerCase() === email.trim().toLowerCase())) {
      setInviteErrors({ email: "A staff member with this work email already exists." });
      toast.error("A staff member with this email already exists.");
      return;
    }

    setIsInviting(true);
    try {
      const res = await staffApi.invitePlatformStaff({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        roleId: selectedRole,
        scope: "PLATFORM",
        customPermissions: JSON.stringify(memberPermissions),
      });

      const targetRole = roles.find((r) => r.id === selectedRole);
      const targetRoleName = targetRole ? targetRole.name : selectedRole;
      const visibleModules = getVisibleSidebarModuleNames(memberPermissions);

      // Instantly record full audit log into reactive app store with all useful module information
      appStore.addAudit({
        action: `Staff Member Invited (${targetRoleName})`,
        entity: `Staff: ${name.trim()} (${email.trim()})`,
        actor: getCurrentActor(),
        severity: "success",
        metadata: {
          staffName: name.trim(),
          staffEmail: email.trim(),
          staffPhone: phone.trim() || undefined,
          roleId: selectedRole,
          roleName: targetRoleName,
          scope: "PLATFORM",
          permissions: memberPermissions,
          permissionsCount: Object.values(memberPermissions).filter(Boolean).length,
          visibleSidebarModules: visibleModules,
          inviteUrl: res?.inviteUrl || undefined,
          inviteTokenExpiry: "48 hours",
          status: "INVITED",
        },
      });

      toast.success(`Staff invitation generated for ${email}!`);
      await loadStaffAndRoles();
      setIsInviteOpen(false);

      if (res?.inviteUrl) {
        setInviteSuccessData({
          name: name.trim(),
          email: email.trim(),
          roleName: targetRoleName,
          inviteUrl: res.inviteUrl,
        });
      }

      setName("");
      setEmail("");
      setPhone("");
      setInviteErrors({});
      setSelectedRole("REGIONAL_OPS");
      const regRole = roles.find((r) => r.id === "REGIONAL_OPS");
      setMemberPermissions(regRole ? { ...regRole.permissions } : { ...EMPTY_ADMIN_PERMISSIONS });
    } catch (err: any) {
      console.error("Backend staff invite failed:", err);
      if (err?.response?.data?.data && typeof err.response.data.data === "object") {
        setInviteErrors(err.response.data.data);
      }
      toast.error(err?.response?.data?.message || err?.message || "Failed to invite staff member");
    } finally {
      setIsInviting(false);
    }
  };

  const promptRemoveMember = (id: string) => {
    const member = staffList.find((s) => s.id === id);
    if (!member) return;
    if (member.role === "SUPERADMIN") {
      toast.error("Cannot revoke Super Admin account.");
      return;
    }
    const roleObj = roles.find((r) => r.id === member.role);
    const roleDisplayName = roleObj?.name || member.roleName || member.role || "Regional Ops Lead";
    setDeleteConfirmation({
      type: "member",
      id: member.id,
      name: member.name,
      email: member.email,
      role: member.role,
      roleName: roleDisplayName,
      details: `${member.email} will immediately be logged out and lose all administrative access permissions across the platform.`,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmation) return;
    setIsDeleting(true);
    try {
      if (deleteConfirmation.type === "role") {
        await staffApi.deletePlatformRole(deleteConfirmation.id);
        appStore.addAudit({
          action: `Platform Role Deleted (${deleteConfirmation.name})`,
          entity: `Role: ${deleteConfirmation.name} (${deleteConfirmation.id})`,
          actor: getCurrentActor(),
          severity: "warning",
          metadata: {
            roleId: deleteConfirmation.id,
            roleName: deleteConfirmation.name,
          },
        });
        toast.success(`Role "${deleteConfirmation.name}" deleted successfully!`);
      } else {
        await staffApi.removeStaffMember(deleteConfirmation.id);
        appStore.addAudit({
          action: "Staff Access Revoked & Account Deactivated",
          entity: `Staff: ${deleteConfirmation.name} (${deleteConfirmation.email || deleteConfirmation.id})`,
          actor: getCurrentActor(),
          severity: "critical",
          metadata: {
            staffId: deleteConfirmation.id,
            staffName: deleteConfirmation.name,
            staffEmail: deleteConfirmation.email,
            roleName: deleteConfirmation.roleName || deleteConfirmation.role || "Regional Ops Lead",
            roleId: deleteConfirmation.role || "REGIONAL_OPS",
            status: "REVOKED",
            scope: "PLATFORM",
          },
        });
        toast.success(`Access revoked for ${deleteConfirmation.name}.`);
      }
      await loadStaffAndRoles();
      setDeleteConfirmation(null);
    } catch (err: any) {
      console.error("Backend delete operation failed:", err);
      toast.error(err?.response?.data?.message || err?.message || "Failed to complete deletion");
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper for role badge display using reusable Badge UI component with optical vertical centering
  const renderRoleBadge = (roleKey: string) => {
    const preset = ROLE_PRESET_COLORS[roleKey];
    if (preset) {
      return (
        <Badge className={preset.cls}>
          {preset.label}
        </Badge>
      );
    }
    const customRole = roles.find((r) => r.id === roleKey);
    return (
      <Badge className={customRole?.badgeCls || "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300"}>
        {customRole?.name || roleKey}
      </Badge>
    );
  };

  // Filtered staff list based on search and filters
  const filteredStaff = staffList.filter((s) => {
    if (roleFilter !== "ALL" && s.role !== roleFilter) return false;
    if (statusFilter !== "ALL" && s.status !== statusFilter) return false;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      (s.phone && s.phone.includes(q)) ||
      s.role.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-bold font-['Manrope'] text-slate-900 dark:text-white">
              Platform Staff, Access & Custom Roles
            </h2>
            <Badge className="border-0 shadow-none text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 shrink-0">
              Platform Super Admin
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
            Manage central platform administrators, regional operations leads, create custom roles, and configure granular permissions across the ecosystem.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={() => setIsRoleModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold border border-purple-200 dark:border-purple-800/80 bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/50 transition-colors shadow-xs whitespace-nowrap shrink-0"
          >
            <Shield size={15} />
            <span>Create Custom Role</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setInviteErrors({});
              setIsInviteOpen(true);
            }}
            className="btn-gradient flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-md hover:opacity-95 transition-opacity whitespace-nowrap shrink-0"
          >
            <Plus size={16} />
            <span>Invite Team Member</span>
          </button>
        </div>
      </div>

      {/* Tabs Switcher: Staff Directory vs Roles Studio */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab("directory")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "directory"
              ? "bg-purple-600 text-white shadow-md"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Users size={15} />
          <span>Staff Directory ({filteredStaff.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("roles")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "roles"
              ? "bg-purple-600 text-white shadow-md"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Layers size={15} />
          <span>Roles & Permissions Studio ({roles.length})</span>
        </button>
      </div>

      {/* TAB 1: STAFF DIRECTORY */}
      {activeTab === "directory" && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
                <Users size={20} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Total Staff</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{staffList.length}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Active Admins</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {staffList.filter((s) => s.status === "ACTIVE").length}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                <Mail size={20} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Pending Invites</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {staffList.filter((s) => s.status === "INVITED").length}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                <ShieldCheck size={20} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Platform Roles</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{roles.length}</p>
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search staff by name, email, phone, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:border-purple-500"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Filter size={14} className="text-slate-400" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-semibold"
                >
                  <option value="ALL">All Roles ({staffList.length})</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-semibold"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INVITED">Invited (Pending)</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>
          </div>

          {/* Staff Directory Table */}
          <div className="rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Administrator</th>
                    <th className="py-3.5 px-4">Platform Role</th>
                    <th className="py-3.5 px-4">Account Status</th>
                    <th className="py-3.5 px-4">Last Activity</th>
                    <th className="py-3.5 px-4">Assigned Permissions</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredStaff.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                        No team members found matching the specified criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredStaff.map((member) => {
                      const grantedPermsCount = Object.values(member.permissions || {}).filter(Boolean).length;
                      return (
                        <tr
                          key={member.id}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center justify-center shrink-0">
                                {member.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm flex items-center gap-1.5">
                                  {member.name}
                                  {member.role === "SUPERADMIN" && (
                                    <Lock size={12} className="text-purple-600 dark:text-purple-400" />
                                  )}
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap">
                                  <span>{member.email}</span>
                                  {member.phone && (
                                    <>
                                      <span className="text-slate-300 dark:text-slate-600">•</span>
                                      <span>{member.phone}</span>
                                    </>
                                  )}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            {renderRoleBadge(member.role)}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  member.status === "ACTIVE"
                                    ? "success"
                                    : member.status === "INVITED"
                                    ? "warning"
                                    : "secondary"
                                }
                              >
                                {member.status}
                              </Badge>
                              {member.role !== "SUPERADMIN" && (
                                <button
                                  type="button"
                                  onClick={() => toggleStaffStatus(member)}
                                  title={
                                    member.status === "ACTIVE"
                                      ? "Suspend member access"
                                      : "Activate member access"
                                  }
                                  className="text-slate-400 hover:text-purple-600 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                  {member.status === "ACTIVE" ? (
                                    <PauseCircle size={15} />
                                  ) : (
                                    <PlayCircle size={15} />
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                              {member.lastLogin}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                                {grantedPermsCount} of 7 Permissions
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {member.status === "INVITED" && member.inviteUrl && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(member.inviteUrl!);
                                    toast.success(`Copied invite link for ${member.name}!`);
                                  }}
                                  className="p-1.5 rounded-lg text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors"
                                  title="Copy Onboarding Link"
                                >
                                  <Copy size={15} />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setEditingMember({ ...member })}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title="Edit Permissions"
                              >
                                <Edit3 size={15} />
                              </button>
                              {member.role !== "SUPERADMIN" && (
                                <button
                                  type="button"
                                  onClick={() => promptRemoveMember(member.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                  title="Revoke Access"
                                >
                                  <Trash2 size={15} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Roles Grid */}
      {activeTab === "roles" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
          {roles.map((r) => {
            const assignedCount = staffList.filter((s) => s.role === r.id).length;
            const permCount = Object.values(r.permissions).filter(Boolean).length;

            return (
              <div
                key={r.id}
                className="p-5 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4 hover:border-purple-300 dark:hover:border-purple-800 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <Badge className={r.badgeCls}>
                      {r.name}
                    </Badge>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {assignedCount} member{assignedCount === 1 ? "" : "s"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2.5 line-clamp-2 leading-relaxed">
                    {r.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">
                    {permCount} of 7 permissions granted
                  </span>
                  <div className="flex items-center gap-2.5">
                    {r.id !== "SUPERADMIN" && (
                      <button
                        type="button"
                        onClick={() => setEditingRole({ ...r, permissions: { ...r.permissions } })}
                        className="text-purple-600 dark:text-purple-400 hover:text-purple-700 font-bold hover:underline"
                      >
                        Edit Permissions
                      </button>
                    )}
                    {!r.isSystem ? (
                      <button
                        type="button"
                        onClick={() => promptDeleteRole(r.id, r.name)}
                        className="text-rose-600 hover:text-rose-700 font-bold hover:underline"
                      >
                        Delete Role
                      </button>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">System Default</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* INVITE TEAM MEMBER SLIDE-OVER DRAWER (Matches exact previous drawer styling) */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsInviteOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <aside className="w-screen max-w-md bg-white dark:bg-[#121626] shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-transparent">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-600 text-white shadow-md">
                    <Users size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Invite Team Member
                    </h3>
                    <p className="text-xs text-slate-500">
                      Grant role-based access permissions to the PINAK console
                    </p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setIsInviteOpen(false)}
                >
                  <X size={18} />
                </Button>
              </div>

              <form onSubmit={handleInviteSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs" noValidate>
                <div>
                  <Label>
                    Full Name *
                  </Label>
                  <Input
                    type="text"
                    placeholder="e.g. Vikram Singhania"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (inviteErrors.name) setInviteErrors((prev) => ({ ...prev, name: "" }));
                    }}
                    className={inviteErrors.name ? "border-rose-500 focus-visible:ring-rose-500" : ""}
                  />
                  {inviteErrors.name && (
                    <p className="text-[11px] text-rose-500 mt-1 font-medium flex items-center gap-1">
                      <span>•</span> {inviteErrors.name}
                    </p>
                  )}
                </div>

                <div>
                  <Label>
                    Work Email Address *
                  </Label>
                  <Input
                    type="email"
                    placeholder="e.g. vikram@pinak.app"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (inviteErrors.email) setInviteErrors((prev) => ({ ...prev, email: "" }));
                    }}
                    className={inviteErrors.email ? "border-rose-500 focus-visible:ring-rose-500" : ""}
                  />
                  {inviteErrors.email && (
                    <p className="text-[11px] text-rose-500 mt-1 font-medium flex items-center gap-1">
                      <span>•</span> {inviteErrors.email}
                    </p>
                  )}
                </div>

                <div>
                  <Label>
                    Phone Number
                  </Label>
                  <Input
                    type="text"
                    placeholder="+91 98200 12345"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (inviteErrors.phone) setInviteErrors((prev) => ({ ...prev, phone: "" }));
                    }}
                    className={inviteErrors.phone ? "border-rose-500 focus-visible:ring-rose-500" : ""}
                  />
                  {inviteErrors.phone && (
                    <p className="text-[11px] text-rose-500 mt-1 font-medium flex items-center gap-1">
                      <span>•</span> {inviteErrors.phone}
                    </p>
                  )}
                </div>

                <div>
                  <Label>
                    Role & Permissions *
                  </Label>
                  <select
                    value={selectedRole}
                    onChange={(e) => {
                      handleRoleSelect(e.target.value);
                      if (inviteErrors.roleId) setInviteErrors((prev) => ({ ...prev, roleId: "" }));
                    }}
                    className={`w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-800 text-xs font-semibold ${
                      inviteErrors.roleId ? "border-rose-500" : "border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <optgroup label="System Roles">
                      {roles.filter((r) => r.isSystem).map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </optgroup>
                    {roles.some((r) => !r.isSystem) && (
                      <optgroup label="Custom Roles">
                        {roles.filter((r) => !r.isSystem).map((r) => (
                          <option key={r.id} value={r.id}>
                            ★ {r.name}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                  {inviteErrors.roleId && (
                    <p className="text-[11px] text-rose-500 mt-1 font-medium flex items-center gap-1">
                      <span>•</span> {inviteErrors.roleId}
                    </p>
                  )}
                </div>

                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="mb-0">
                      Permission Overrides
                    </Label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const allTrue: AdminPermissions = {} as any;
                          PERMISSION_CONFIG.forEach(({ key }) => { (allTrue as any)[key] = true; });
                          setMemberPermissions(allTrue);
                        }}
                        className="text-[11px] text-purple-600 dark:text-purple-400 hover:text-purple-700 font-semibold"
                      >
                        Select All
                      </button>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <button
                        type="button"
                        onClick={() => {
                          const allFalse: AdminPermissions = {} as any;
                          PERMISSION_CONFIG.forEach(({ key }) => { (allFalse as any)[key] = false; });
                          setMemberPermissions(allFalse);
                        }}
                        className="text-[11px] text-rose-500 hover:text-rose-600 font-semibold"
                      >
                        Remove All (0 Perms)
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {PERMISSION_CONFIG.map(({ key, title, icon: Icon }) => (
                      <label
                        key={key}
                        className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={memberPermissions[key]}
                          onChange={(e) =>
                            setMemberPermissions((prev) => ({
                              ...prev,
                              [key]: e.target.checked,
                            }))
                          }
                          className="rounded text-purple-600 focus:ring-purple-500 border-slate-300 h-3.5 w-3.5"
                        />
                        <Icon size={13} className="text-purple-600 dark:text-purple-400" />
                        <span className="text-[11px] font-medium text-slate-800 dark:text-slate-200">
                          {title}
                        </span>
                      </label>
                    ))}
                  </div>

                  {/* Real-time Console Sidebar Navigation Preview */}
                  <SidebarMenuPreview
                    permissions={memberPermissions}
                    onGrantPermission={(permKey) =>
                      setMemberPermissions((prev) => ({
                        ...prev,
                        [permKey]: true,
                      }))
                    }
                  />
                </div>

                <div className="pt-4">
                  <Button
                    type="submit"
                    variant="gradient"
                    size="lg"
                    className="w-full"
                    disabled={isInviting}
                  >
                    <Send size={15} className={isInviting ? "animate-pulse" : ""} />
                    <span>{isInviting ? "Generating Secure Invitation..." : "Send Invite & Grant Access"}</span>
                  </Button>
                </div>
              </form>
            </aside>
          </div>
        </div>
      )}

      {/* INVITATION GENERATED MODAL */}
      {inviteSuccessData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white dark:bg-[#121626] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Team Member Invitation Dispatched!
                  </h3>
                  <p className="text-xs text-slate-500">
                    Dual-channel enterprise onboarding activated
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setInviteSuccessData(null)}
              >
                <X size={18} />
              </Button>
            </div>

            {/* Member Summary Card */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-1 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Member:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{inviteSuccessData.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Email:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{inviteSuccessData.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Assigned Role:</span>
                <Badge variant="outline" className="text-purple-600 border-purple-200 dark:border-purple-800">
                  {inviteSuccessData.roleName}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Validity:</span>
                <span className="text-amber-600 dark:text-amber-400 font-medium">Valid for 48 Hours</span>
              </div>
            </div>

            {/* Channel 1: Email Notification */}
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50 text-xs">
              <Mail size={16} className="text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-purple-900 dark:text-purple-200">Automated Email Dispatched</p>
                <p className="text-purple-700/80 dark:text-purple-300/80 text-[11px] leading-relaxed">
                  An onboarding invitation email has been sent to <strong>{inviteSuccessData.email}</strong> with secure setup instructions.
                </p>
              </div>
            </div>

            {/* Channel 2: Instant One-Time Secure Link */}
            {inviteSuccessData.inviteUrl && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Direct One-Time Onboarding Link (Share via Slack / WhatsApp)
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={inviteSuccessData.inviteUrl}
                    className="font-mono text-[11px] bg-slate-50 dark:bg-slate-900"
                  />
                  <Button
                    variant={copiedLink ? "default" : "gradient"}
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(inviteSuccessData.inviteUrl!);
                      setCopiedLink(true);
                      toast.success("Onboarding link copied to clipboard!");
                      setTimeout(() => setCopiedLink(false), 2500);
                    }}
                    className="shrink-0"
                  >
                    {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedLink ? "Copied" : "Copy Link"}</span>
                  </Button>
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  This single-use cryptographic token allows the recipient to set their own secure password and activate their account.
                </p>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInviteSuccessData(null)}
              >
                Close & Return to Directory
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE CUSTOM ROLE SLIDE-OVER DRAWER */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsRoleModalOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <aside className="w-screen max-w-md bg-white dark:bg-[#121626] shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-transparent">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-600 text-white shadow-md">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Create Custom Role
                    </h3>
                    <p className="text-xs text-slate-500">
                      Configure custom platform authority and granular access rules
                    </p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setIsRoleModalOpen(false)}
                >
                  <X size={18} />
                </Button>
              </div>

              <form onSubmit={handleCreateRoleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
                <div>
                  <Label>
                    Role Title *
                  </Label>
                  <Input
                    type="text"
                    required
                    placeholder="e.g. Fraud & Risk Analyst"
                    value={customRoleName}
                    onChange={(e) => {
                      setCustomRoleName(e.target.value);
                      setCustomRoleKey("ROLE_" + e.target.value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "_"));
                    }}
                  />
                </div>

                <div>
                  <Label>
                    Role Code Key *
                  </Label>
                  <Input
                    type="text"
                    required
                    placeholder="e.g. ROLE_FRAUD_ANALYST"
                    value={customRoleKey}
                    onChange={(e) => setCustomRoleKey(e.target.value.toUpperCase())}
                    className="font-mono"
                  />
                </div>

                <div>
                  <Label>
                    Description & Scope
                  </Label>
                  <Textarea
                    rows={2}
                    placeholder="Brief description of this role's purpose..."
                    value={customRoleDesc}
                    onChange={(e) => setCustomRoleDesc(e.target.value)}
                  />
                </div>

                <div>
                  <Label>
                    Badge Color Accent
                  </Label>
                  <select
                    value={customBadgeCls}
                    onChange={(e) => setCustomBadgeCls(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                  >
                    <option value="bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">Purple / Indigo</option>
                    <option value="bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">Blue / Sky</option>
                    <option value="bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300">Teal / Cyan</option>
                    <option value="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">Emerald / Green</option>
                    <option value="bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">Amber / Orange</option>
                    <option value="bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">Rose / Red</option>
                  </select>
                </div>

                <div className="pt-2">
                  <Label className="mb-2">
                    Granular Access Permissions
                  </Label>
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {PERMISSION_CONFIG.map(({ key, title, icon: Icon }) => (
                      <label
                        key={key}
                        className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={customPermissions[key]}
                          onChange={(e) =>
                            setCustomPermissions((prev) => ({
                              ...prev,
                              [key]: e.target.checked,
                            }))
                          }
                          className="rounded text-purple-600 focus:ring-purple-500 border-slate-300 h-3.5 w-3.5"
                        />
                        <Icon size={13} className="text-purple-600 dark:text-purple-400" />
                        <span className="text-[11px] font-medium text-slate-800 dark:text-slate-200">
                          {title}
                        </span>
                      </label>
                    ))}
                  </div>

                  {/* Real-time Console Sidebar Navigation Preview */}
                  <SidebarMenuPreview
                    permissions={customPermissions}
                    onGrantPermission={(permKey) =>
                      setCustomPermissions((prev) => ({
                        ...prev,
                        [permKey]: true,
                      }))
                    }
                  />
                </div>

                <div className="pt-4">
                  <Button
                    type="submit"
                    variant="gradient"
                    size="lg"
                    className="w-full"
                  >
                    <Sparkles size={15} />
                    <span>Deploy Custom Role</span>
                  </Button>
                </div>
              </form>
            </aside>
          </div>
        </div>
      )}

      {/* EDIT MEMBER DRAWER */}
      {editingMember && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setEditingMember(null)}
          />

          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <aside className="w-screen max-w-md bg-white dark:bg-[#121626] shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-transparent">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Edit {editingMember.name}
                  </h3>
                  <p className="text-xs text-slate-500">{editingMember.email}</p>
                </div>

                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setEditingMember(null)}
                >
                  <X size={18} />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
                <div>
                  <Label>
                    Change Role
                  </Label>
                  <select
                    value={editingMember.role}
                    onChange={(e) => {
                      const newRole = e.target.value as AdminRole;
                      const rDef = roles.find((r) => r.id === newRole);
                      setEditingMember({
                        ...editingMember,
                        role: newRole,
                        permissions: rDef ? { ...rDef.permissions } : editingMember.permissions,
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} {!r.isSystem ? "(Custom)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {editingMember.role !== "SUPERADMIN" && (
                  <div>
                    <Label>
                      Account Status
                    </Label>
                    <select
                      value={editingMember.status}
                      onChange={(e) => {
                        setEditingMember({
                          ...editingMember,
                          status: e.target.value as "ACTIVE" | "INVITED" | "SUSPENDED",
                        });
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INVITED">INVITED</option>
                      <option value="SUSPENDED">SUSPENDED</option>
                    </select>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="mb-0">
                      Permission Overrides
                    </Label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const allTrue: AdminPermissions = {} as any;
                          PERMISSION_CONFIG.forEach(({ key }) => { (allTrue as any)[key] = true; });
                          setEditingMember({ ...editingMember, permissions: allTrue });
                        }}
                        className="text-[11px] text-purple-600 dark:text-purple-400 hover:text-purple-700 font-semibold"
                      >
                        Select All
                      </button>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <button
                        type="button"
                        onClick={() => {
                          const allFalse: AdminPermissions = {} as any;
                          PERMISSION_CONFIG.forEach(({ key }) => { (allFalse as any)[key] = false; });
                          setEditingMember({ ...editingMember, permissions: allFalse });
                        }}
                        className="text-[11px] text-rose-500 hover:text-rose-600 font-semibold"
                      >
                        Remove All (0 Perms)
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {PERMISSION_CONFIG.map(({ key, title, icon: Icon }) => (
                      <label
                        key={key}
                        className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={editingMember.permissions[key]}
                          onChange={(e) =>
                            setEditingMember({
                              ...editingMember,
                              permissions: {
                                ...editingMember.permissions,
                                [key]: e.target.checked,
                              },
                            })
                          }
                          className="rounded text-purple-600 focus:ring-purple-500 border-slate-300 h-3.5 w-3.5"
                        />
                        <Icon size={13} className="text-purple-600 dark:text-purple-400" />
                        <span className="text-[11px] font-medium text-slate-800 dark:text-slate-200">
                          {title}
                        </span>
                      </label>
                    ))}
                  </div>

                  {/* Real-time Console Sidebar Navigation Preview */}
                  <SidebarMenuPreview
                    permissions={editingMember.permissions}
                    onGrantPermission={(permKey) =>
                      setEditingMember((prev) =>
                        prev
                          ? {
                              ...prev,
                              permissions: {
                                ...prev.permissions,
                                [permKey]: true,
                              },
                            }
                          : null
                      )
                    }
                  />
                </div>

                <div className="pt-4">
                  <Button
                    variant="gradient"
                    size="lg"
                    className="w-full"
                    disabled={isSavingEdit}
                    onClick={handleSaveEditMember}
                  >
                    <CheckCircle2 size={15} />
                    <span>{isSavingEdit ? "Saving Changes..." : "Save Changes"}</span>
                  </Button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      )}
      {/* LUXURY DELETION CONFIRMATION DIALOG */}
      {deleteConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white dark:bg-[#121626] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 animate-in zoom-in-95 duration-200">
            {/* Header with red warning badge */}
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200/60 dark:border-rose-900/50 shadow-xs">
                <Trash2 size={20} />
              </div>
              <div className="flex-1 pr-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {deleteConfirmation.type === "role" ? "Delete Custom Role" : "Revoke Platform Access"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Confirm permanent removal
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setDeleteConfirmation(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </Button>
            </div>

            {/* Target Details Card */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-xs space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Target:</span>
                <span className="font-bold text-slate-900 dark:text-white">{deleteConfirmation.name}</span>
              </div>
              {deleteConfirmation.email && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Email:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">{deleteConfirmation.email}</span>
                </div>
              )}
            </div>

            {/* Warning Note */}
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/50 text-xs text-rose-900 dark:text-rose-200">
              <AlertTriangle size={16} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed text-[11px]">
                {deleteConfirmation.details}
              </p>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirmation(null)}
                disabled={isDeleting}
                className="text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md shadow-rose-600/20"
              >
                <Trash2 size={13} className={isDeleting ? "animate-pulse" : ""} />
                <span>{isDeleting ? "Removing..." : deleteConfirmation.type === "role" ? "Delete Role" : "Revoke Access"}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* EDIT ROLE MODAL */}
      {editingRole && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setEditingRole(null)}
          />

          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <aside className="w-screen max-w-md bg-white dark:bg-[#121626] shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-transparent">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Edit Role: {editingRole.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">{editingRole.id}</p>
                </div>

                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setEditingRole(null)}
                >
                  <X size={18} />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
                <div>
                  <Label>Role Display Name</Label>
                  <Input
                    type="text"
                    value={editingRole.name}
                    onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })}
                    disabled={editingRole.isSystem}
                    className="font-medium"
                  />
                </div>

                <div>
                  <Label>Role Description</Label>
                  <Input
                    type="text"
                    value={editingRole.description || ""}
                    onChange={(e) => setEditingRole({ ...editingRole, description: e.target.value })}
                    placeholder="Describe role responsibilities..."
                    className="font-medium"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="mb-0">
                      Module Permissions
                    </Label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const allTrue: AdminPermissions = {} as any;
                          PERMISSION_CONFIG.forEach(({ key }) => { (allTrue as any)[key] = true; });
                          setEditingRole({ ...editingRole, permissions: allTrue });
                        }}
                        className="text-[11px] text-purple-600 dark:text-purple-400 hover:text-purple-700 font-semibold"
                      >
                        Select All
                      </button>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <button
                        type="button"
                        onClick={() => {
                          const allFalse: AdminPermissions = {} as any;
                          PERMISSION_CONFIG.forEach(({ key }) => { (allFalse as any)[key] = false; });
                          setEditingRole({ ...editingRole, permissions: allFalse });
                        }}
                        className="text-[11px] text-rose-500 hover:text-rose-600 font-semibold"
                      >
                        Remove All (0 Perms)
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {PERMISSION_CONFIG.map(({ key, title, icon: Icon }) => (
                      <label
                        key={key}
                        className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={editingRole.permissions[key]}
                          onChange={(e) =>
                            setEditingRole({
                              ...editingRole,
                              permissions: {
                                ...editingRole.permissions,
                                [key]: e.target.checked,
                              },
                            })
                          }
                          className="rounded text-purple-600 focus:ring-purple-500 border-slate-300 h-3.5 w-3.5"
                        />
                        <Icon size={13} className="text-purple-600 dark:text-purple-400" />
                        <span className="text-[11px] font-medium text-slate-800 dark:text-slate-200">
                          {title}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    variant="gradient"
                    onClick={handleSaveEditRole}
                    disabled={isSavingRoleEdit}
                    className="w-full text-xs font-bold py-2.5 shadow-md"
                  >
                    {isSavingRoleEdit ? "Updating Role..." : "Save Role Permissions"}
                  </Button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      )}
    </div>
  );
};
