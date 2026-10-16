import React, { useState } from "react";
import {
  Tag,
  Plus,
  Utensils,
  Sparkles,
  Dumbbell,
  ShoppingBag,
  Hotel,
  Coffee,
  X,
  LayoutGrid,
  List,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Pencil,
  Trash2,
  Copy,
  Power,
  PowerOff,
  AlertTriangle,
  FolderTree
} from "lucide-react";
import { Category } from "../../types";
import { AdvancedTable, Column } from "../../components/ui/AdvancedTable";
import { Badge } from "../../components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "../../components/ui/dropdown-menu";
import { toast } from "sonner";

interface CategoryManagerProps {
  categories: Category[];
  onAddCategory: (draft: Partial<Category>) => Promise<void> | void;
  onUpdateCategory?: (id: string, updates: Partial<Category>) => Promise<void> | void;
  onDeleteCategory?: (id: string) => Promise<void> | void;
  onToggleCategoryStatus?: (id: string, status: "ACTIVE" | "INACTIVE") => Promise<void> | void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({
  categories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onToggleCategoryStatus,
}) => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Form State for Add
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [parentId, setParentId] = useState<string>("");
  const [selectedIcon, setSelectedIcon] = useState("Tag");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State for Edit
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editParentId, setEditParentId] = useState<string>("");
  const [editSelectedIcon, setEditSelectedIcon] = useState("Tag");
  const [editStatus, setEditStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");

  const iconMap: Record<string, any> = {
    Utensils,
    Sparkles,
    Dumbbell,
    ShoppingBag,
    Hotel,
    Coffee,
    Tag,
  };

  const openEditDrawer = (c: Category) => {
    setCategoryToEdit(c);
    setEditName(c.name || "");
    setEditDescription(c.description || "");
    setEditParentId(c.parentId || "");
    setEditSelectedIcon(c.icon || "Tag");
    setEditStatus(c.status || "ACTIVE");
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      setIsSubmitting(true);
      const selectedParent = categories.find((c) => c.id === parentId);
      await onAddCategory({
        name: name.trim(),
        description: description.trim(),
        parentId: parentId || undefined,
        parentName: selectedParent?.name,
        icon: selectedIcon,
        status: "ACTIVE",
      });
      setIsAddOpen(false);
      setName("");
      setDescription("");
      setParentId("");
      setSelectedIcon("Tag");
    } catch {
      // Error handled by parent handler
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryToEdit || !editName.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      setIsSubmitting(true);
      const selectedParent = categories.find((c) => c.id === editParentId);
      if (onUpdateCategory) {
        await onUpdateCategory(categoryToEdit.id, {
          name: editName.trim(),
          description: editDescription.trim(),
          parentId: editParentId || undefined,
          parentName: selectedParent?.name,
          icon: editSelectedIcon,
          status: editStatus,
        });
      }
      setCategoryToEdit(null);
    } catch {
      // Error handled by parent handler
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;
    try {
      setIsSubmitting(true);
      if (onDeleteCategory) {
        await onDeleteCategory(categoryToDelete.id);
      }
      setCategoryToDelete(null);
    } catch {
      // Error handled by parent handler
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: Column<Category>[] = [
    {
      header: "Category & Icon",
      sortable: true,
      accessor: "name",
      render: (c) => {
        const Icon = iconMap[c.icon] || Tag;
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 flex items-center justify-center shrink-0 border border-purple-200/50 dark:border-purple-800/40">
              <Icon size={17} />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white leading-tight">{c.name}</p>
              {c.parentName ? (
                <p className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-1 mt-0.5">
                  <FolderTree size={10} />
                  <span>Sub-category of {c.parentName}</span>
                </p>
              ) : (
                <span className="text-[10px] text-slate-400">Root Category</span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      header: "Description",
      accessor: "description",
      render: (c) => (
        <span className="text-xs text-slate-500 max-w-xs truncate block">
          {c.description || "—"}
        </span>
      ),
    },
    {
      header: "Active Stores",
      sortable: true,
      accessor: "storeCount",
      render: (c) => (
        <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
          {c.storeCount || 0} stores
        </span>
      ),
    },
    {
      header: "Status",
      sortable: true,
      accessor: "status",
      render: (c) => (
        <Badge variant={c.status === "ACTIVE" ? "success" : "destructive"}>
          {c.status === "ACTIVE" ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
          {c.status || "ACTIVE"}
        </Badge>
      ),
    },
    {
      header: "Actions",
      className: "text-right whitespace-nowrap",
      render: (c) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => openEditDrawer(c)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-purple-200/80 dark:border-purple-800/60 transition-all shadow-2xs hover:shadow-xs"
            title="Edit Category Details"
          >
            <Pencil size={12} />
            <span>Edit</span>
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800 transition-colors"
                title="More Actions"
              >
                <MoreVertical size={14} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 p-1.5 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#121626]"
            >
              <DropdownMenuLabel className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-2 py-1">
                Category Operations
              </DropdownMenuLabel>

              <DropdownMenuItem
                onClick={() => openEditDrawer(c)}
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-700 dark:hover:text-purple-300"
              >
                <Pencil size={14} className="text-purple-600 dark:text-purple-400" />
                <span>Edit Category</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => {
                  navigator.clipboard.writeText(c.id);
                  toast.success(`Copied Category ID: ${c.id}`);
                }}
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Copy size={14} className="text-slate-400" />
                <span>Copy Category ID</span>
              </DropdownMenuItem>

              {onToggleCategoryStatus && (
                <DropdownMenuItem
                  onClick={() => {
                    const next = c.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
                    onToggleCategoryStatus(c.id, next);
                  }}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {c.status === "ACTIVE" ? (
                    <>
                      <PowerOff size={14} className="text-amber-500" />
                      <span>Deactivate Category</span>
                    </>
                  ) : (
                    <>
                      <Power size={14} className="text-emerald-500" />
                      <span>Activate Category</span>
                    </>
                  )}
                </DropdownMenuItem>
              )}

              {onDeleteCategory && (
                <>
                  <DropdownMenuSeparator className="my-1 bg-slate-100 dark:bg-slate-800" />
                  <DropdownMenuItem
                    onClick={() => setCategoryToDelete(c)}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold cursor-pointer text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  >
                    <Trash2 size={14} />
                    <span>Delete Category</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-['Manrope'] text-slate-900 dark:text-white">
            Discovery Categories & Ecosystem
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Organize local merchants and stores into browsable collections for mobile discovery. Connected to database.
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
            className="btn-gradient flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md hover:opacity-95 transition-opacity"
          >
            <Plus size={16} />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {viewMode === "grid" ? (
        /* Categories Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((c) => {
            const Icon = iconMap[c.icon] || Tag;
            return (
              <div
                key={c.id}
                className="p-5 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-pink-300 dark:hover:border-pink-900 transition-all space-y-4 relative group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 flex items-center justify-center border border-purple-200/50 dark:border-purple-800/40">
                    <Icon size={20} />
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={c.status === "ACTIVE" ? "success" : "destructive"}>
                      {c.status === "ACTIVE" ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                      {c.status || "ACTIVE"}
                    </Badge>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Options"
                        >
                          <MoreVertical size={14} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-52 p-1.5 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#121626]"
                      >
                        <DropdownMenuItem
                          onClick={() => openEditDrawer(c)}
                          className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-700 dark:hover:text-purple-300"
                        >
                          <Pencil size={14} className="text-purple-600 dark:text-purple-400" />
                          <span>Edit Details</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => {
                            navigator.clipboard.writeText(c.id);
                            toast.success(`Copied ID: ${c.id}`);
                          }}
                          className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Copy size={14} className="text-slate-400" />
                          <span>Copy UUID</span>
                        </DropdownMenuItem>

                        {onToggleCategoryStatus && (
                          <DropdownMenuItem
                            onClick={() => {
                              const next = c.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
                              onToggleCategoryStatus(c.id, next);
                            }}
                            className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            {c.status === "ACTIVE" ? (
                              <>
                                <PowerOff size={14} className="text-amber-500" />
                                <span>Deactivate</span>
                              </>
                            ) : (
                              <>
                                <Power size={14} className="text-emerald-500" />
                                <span>Activate</span>
                              </>
                            )}
                          </DropdownMenuItem>
                        )}

                        {onDeleteCategory && (
                          <>
                            <DropdownMenuSeparator className="my-1 bg-slate-100 dark:bg-slate-800" />
                            <DropdownMenuItem
                              onClick={() => setCategoryToDelete(c)}
                              className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold cursor-pointer text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            >
                              <Trash2 size={14} />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Manrope']">
                    {c.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {c.description || "No description provided."}
                  </p>
                  {c.parentName ? (
                    <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 mt-2 block flex items-center gap-1">
                      <FolderTree size={12} />
                      Sub-category of {c.parentName}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 mt-2 block">Top-level collection</span>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {c.storeCount || 0} active stores
                  </span>
                  <button
                    onClick={() => openEditDrawer(c)}
                    className="text-[11px] font-bold text-pink-600 dark:text-pink-400 hover:underline flex items-center gap-1"
                  >
                    <span>Manage</span>
                    <Pencil size={11} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Categories Advanced Table */
        <AdvancedTable
          title="Discovery Categories Master List"
          subtitle="Taxonomy classification for app store feeds (connected to database)"
          columns={columns}
          data={categories}
          keyExtractor={(c) => c.id}
          searchPlaceholder="Search category name, parent, or description..."
        />
      )}

      {/* Add Category Right Slide-Over Drawer */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => !isSubmitting && setIsAddOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <aside className="w-screen max-w-md bg-white dark:bg-[#121626] shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2">
                  <Tag size={18} className="text-purple-600" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Add Discovery Category</h3>
                </div>
                <button
                  onClick={() => setIsAddOpen(false)}
                  disabled={isSubmitting}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Category Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Healthcare & Pharmacy"
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Choose Icon</label>
                  <div className="grid grid-cols-4 gap-2 mt-1.5">
                    {Object.keys(iconMap).map((iconKey) => {
                      const IconComp = iconMap[iconKey];
                      return (
                        <button
                          key={iconKey}
                          type="button"
                          onClick={() => setSelectedIcon(iconKey)}
                          className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                            selectedIcon === iconKey
                              ? "border-pink-500 bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 font-bold shadow-2xs"
                              : "border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                          }`}
                        >
                          <IconComp size={18} />
                          <span className="text-[10px]">{iconKey}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Parent Category</label>
                  <select
                    value={parentId}
                    onChange={(e) => setParentId(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                  >
                    <option value="">None (Top Level Category)</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Select a parent to nest this as a sub-category in discovery screens.
                  </p>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Description displayed on customer app category carousels..."
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    rows={3}
                  />
                </div>

                <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end gap-2 -mx-6 -mb-6 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!name.trim() || isSubmitting}
                    className="btn-gradient px-4 py-2 rounded-xl text-white text-xs font-bold disabled:opacity-50 shadow-md"
                  >
                    {isSubmitting ? "Saving..." : "Save Category"}
                  </button>
                </div>
              </form>
            </aside>
          </div>
        </div>
      )}

      {/* Edit Category Right Slide-Over Drawer */}
      {categoryToEdit && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => !isSubmitting && setCategoryToEdit(null)}
          />
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <aside className="w-screen max-w-md bg-white dark:bg-[#121626] shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2">
                  <Pencil size={18} className="text-amber-500" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Edit Category Details</h3>
                </div>
                <button
                  onClick={() => setCategoryToEdit(null)}
                  disabled={isSubmitting}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Category Name *</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Category Name"
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Choose Icon</label>
                  <div className="grid grid-cols-4 gap-2 mt-1.5">
                    {Object.keys(iconMap).map((iconKey) => {
                      const IconComp = iconMap[iconKey];
                      return (
                        <button
                          key={iconKey}
                          type="button"
                          onClick={() => setEditSelectedIcon(iconKey)}
                          className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                            editSelectedIcon === iconKey
                              ? "border-pink-500 bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 font-bold shadow-2xs"
                              : "border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                          }`}
                        >
                          <IconComp size={18} />
                          <span className="text-[10px]">{iconKey}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Parent Category</label>
                  <select
                    value={editParentId}
                    onChange={(e) => setEditParentId(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                  >
                    <option value="">None (Top Level Category)</option>
                    {categories
                      .filter((c) => c.id !== categoryToEdit.id)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as "ACTIVE" | "INACTIVE")}
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                  >
                    <option value="ACTIVE">ACTIVE (Visible in App)</option>
                    <option value="INACTIVE">INACTIVE (Hidden)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Description</label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Description displayed on customer app category carousels..."
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    rows={3}
                  />
                </div>

                <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end gap-2 -mx-6 -mb-6 mt-6">
                  <button
                    type="button"
                    onClick={() => setCategoryToEdit(null)}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!editName.trim() || isSubmitting}
                    className="btn-gradient px-4 py-2 rounded-xl text-white text-xs font-bold disabled:opacity-50 shadow-md"
                  >
                    {isSubmitting ? "Updating..." : "Update Category"}
                  </button>
                </div>
              </form>
            </aside>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-[#121626] rounded-3xl p-6 shadow-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Category?</h3>
                <p className="text-xs text-slate-500">This action will remove the category from discovery.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-800">
              Are you sure you want to delete <strong className="text-slate-900 dark:text-white">{categoryToDelete.name}</strong>? Any linked sub-categories and merchant tags may be affected.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCategoryToDelete(null)}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition-colors"
              >
                {isSubmitting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
