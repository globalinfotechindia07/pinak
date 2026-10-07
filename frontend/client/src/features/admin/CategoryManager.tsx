import React, { useState } from "react";
import { Tag, Plus, Utensils, Sparkles, Dumbbell, ShoppingBag, Hotel, Coffee, X, LayoutGrid, List, CheckCircle2 } from "lucide-react";
import { Category } from "../../types";
import { AdvancedTable, Column } from "../../components/ui/AdvancedTable";
import { Badge } from "../../components/ui/badge";
import { toast } from "sonner";

interface CategoryManagerProps {
  categories: Category[];
  onAddCategory: (draft: Partial<Category>) => void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({ categories, onAddCategory }) => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [parentName, setParentName] = useState("None (Top Level)");
  const [selectedIcon, setSelectedIcon] = useState("Tag");

  const iconMap: Record<string, any> = {
    Utensils,
    Sparkles,
    Dumbbell,
    ShoppingBag,
    Hotel,
    Coffee,
    Tag
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
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 flex items-center justify-center shrink-0">
              <Icon size={16} />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white leading-tight">{c.name}</p>
              {c.parentName && (
                <p className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">
                  Sub-category of {c.parentName}
                </p>
              )}
            </div>
          </div>
        );
      }
    },
    {
      header: "Description",
      accessor: "description",
      render: (c) => <span className="text-xs text-slate-500 max-w-xs truncate block">{c.description}</span>
    },
    {
      header: "Active Stores",
      sortable: true,
      accessor: "storeCount",
      render: (c) => (
        <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
          {c.storeCount} stores
        </span>
      )
    },
    {
      header: "30d Growth",
      sortable: true,
      accessor: "growth",
      render: (c) => (
        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
          +{c.growth}
        </span>
      )
    },
    {
      header: "Status",
      sortable: true,
      accessor: "status",
      render: (c) => (
        <Badge variant="success">
          <CheckCircle2 size={12} />
          {c.status}
        </Badge>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-['Manrope'] text-slate-900 dark:text-white">
            Discovery Categories & Ecosystem
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Organize local merchants and stores into browsable collections for mobile discovery.
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
                className="p-5 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-pink-300 dark:hover:border-pink-900 transition-all space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 flex items-center justify-center">
                    <Icon size={20} />
                  </div>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    +{c.growth}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Manrope']">
                    {c.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {c.description}
                  </p>
                  {c.parentName && (
                    <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 mt-2 block">
                      Sub-category of {c.parentName}
                    </span>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {c.storeCount} stores active
                  </span>
                  <span className="text-slate-400">Status: {c.status}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Categories Advanced Table */
        <AdvancedTable
          title="Discovery Categories Master List"
          subtitle="Taxonomy classification for app store feeds"
          columns={columns}
          data={categories}
          keyExtractor={(c) => c.id}
          searchPlaceholder="Search category name, parent, or description..."
        />
      )}

      {/* Add Category Right Slide-Over Drawer */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity" onClick={() => setIsAddOpen(false)} />
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <aside className="w-screen max-w-md bg-white dark:bg-[#121626] shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2">
                  <Tag size={18} className="text-purple-600" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Add Discovery Category</h3>
                </div>
                <button onClick={() => setIsAddOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Category Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Healthcare & Pharmacy"
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
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
                              ? "border-pink-500 bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 font-bold"
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
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                  >
                    <option>None (Top Level)</option>
                    {categories.map((c) => (
                      <option key={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Description displayed on customer app category carousels..."
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                    rows={3}
                  />
                </div>
              </div>

              <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end gap-2">
                <button onClick={() => setIsAddOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400">Cancel</button>
                <button
                  onClick={() => {
                    onAddCategory({
                      name,
                      description,
                      parentName: parentName === "None (Top Level)" ? undefined : parentName,
                      icon: selectedIcon
                    });
                    setIsAddOpen(false);
                    toast.success(`Category "${name}" saved successfully!`);
                  }}
                  disabled={!name}
                  className="btn-gradient px-4 py-2 rounded-xl text-white text-xs font-bold disabled:opacity-50 shadow-md"
                >
                  Save Category
                </button>
              </div>
            </aside>
          </div>
        </div>
      )}
    </div>
  );
};
