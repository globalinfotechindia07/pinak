import React, { useState, useMemo } from "react";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  Filter,
  Check,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Search,
  Trash2,
  ShieldCheck
} from "lucide-react";
import { toast } from "sonner";

export interface Column<T> {
  header: string;
  accessor?: keyof T | ((row: T) => any);
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

interface AdvancedTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  searchPlaceholder?: string;
  searchFilter?: (row: T, query: string) => boolean;
  bulkActions?: {
    label: string;
    action: (selectedRows: T[]) => void;
    variant?: "default" | "destructive" | "success";
  }[];
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  onRowClick?: (row: T) => void;
  defaultPageSize?: number;
  emptyMessage?: string;
}

export function AdvancedTable<T>({
  columns,
  data,
  keyExtractor,
  searchPlaceholder = "Filter records...",
  searchFilter,
  bulkActions = [],
  title,
  subtitle,
  actions,
  onRowClick,
  defaultPageSize = 10,
  emptyMessage = "No matching records found."
}: AdvancedTableProps<T>) {
  const [search, setSearch] = useState("");
  const [sortIndex, setSortIndex] = useState<number | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [currentPage, setCurrentPage] = useState(1);
  const [isCompact, setIsCompact] = useState(false);

  // Filter
  const filteredData = useMemo(() => {
    if (!search.trim()) return data;
    if (searchFilter) {
      return data.filter((row) => searchFilter(row, search.trim().toLowerCase()));
    }
    return data.filter((row) =>
      JSON.stringify(row).toLowerCase().includes(search.trim().toLowerCase())
    );
  }, [data, search, searchFilter]);

  // Sort
  const sortedData = useMemo(() => {
    if (sortIndex === null) return filteredData;
    const col = columns[sortIndex];
    if (!col || !col.accessor) return filteredData;

    return [...filteredData].sort((a, b) => {
      let aVal = typeof col.accessor === "function" ? col.accessor(a) : a[col.accessor as keyof T];
      let bVal = typeof col.accessor === "function" ? col.accessor(b) : b[col.accessor as keyof T];

      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortIndex, sortDirection, columns]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  // Bulk Selection
  const allCurrentSelected =
    paginatedData.length > 0 &&
    paginatedData.every((row) => selectedKeys.has(keyExtractor(row)));

  const toggleSelectAll = () => {
    const next = new Set(selectedKeys);
    if (allCurrentSelected) {
      paginatedData.forEach((row) => next.delete(keyExtractor(row)));
    } else {
      paginatedData.forEach((row) => next.add(keyExtractor(row)));
    }
    setSelectedKeys(next);
  };

  const toggleSelectRow = (key: string) => {
    const next = new Set(selectedKeys);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelectedKeys(next);
  };

  const handleSort = (index: number) => {
    if (sortIndex === index) {
      if (sortDirection === "asc") setSortDirection("desc");
      else {
        setSortIndex(null);
        setSortDirection("asc");
      }
    } else {
      setSortIndex(index);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const exportCurrentCSV = () => {
    if (!sortedData.length) {
      toast.error("No data to export");
      return;
    }
    const headers = columns.map((c) => `"${c.header}"`).join(",");
    const rows = sortedData.map((row) =>
      columns
        .map((c) => {
          let val = typeof c.accessor === "function" ? c.accessor(row) : c.accessor ? row[c.accessor as keyof T] : "";
          return `"${String(val ?? "").replace(/"/g, '""')}"`;
        })
        .join(",")
    );
    const blob = new Blob([headers + "\n" + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pinak-export-${Date.now()}.csv`;
    a.click();
    toast.success("CSV table export ready!");
  };

  const selectedRowsList = data.filter((row) => selectedKeys.has(keyExtractor(row)));

  return (
    <div className="rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden transition-all space-y-3 p-4 sm:p-5">
      {/* Top Header / Meta */}
      {(title || actions) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <div>
            {title && (
              <h3 className="text-base sm:text-lg font-bold font-['Manrope'] text-slate-900 dark:text-white">
                {title}
              </h3>
            )}
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}

      {/* Toolbar: Search, Density, Export, Page Size */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/60 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-pink-500/20 placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
          {/* Density toggle */}
          <button
            onClick={() => setIsCompact(!isCompact)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            title={isCompact ? "Comfortable view" : "Compact view"}
          >
            {isCompact ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
          </button>

          {/* Export button */}
          <button
            onClick={exportCurrentCSV}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
          >
            <Download size={13} />
            <span>Export</span>
          </button>

          {/* Rows per page */}
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold focus:outline-hidden"
          >
            <option value={5}>5 / page</option>
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
            <option value={50}>50 / page</option>
          </select>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedKeys.size > 0 && (
        <div className="flex items-center justify-between p-2.5 px-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs animate-in fade-in duration-200">
          <span className="font-bold text-purple-900 dark:text-purple-200">
            {selectedKeys.size} record{selectedKeys.size > 1 ? "s" : ""} selected
          </span>

          <div className="flex items-center gap-2">
            {bulkActions.map((ba, idx) => (
              <button
                key={idx}
                onClick={() => {
                  ba.action(selectedRowsList);
                  setSelectedKeys(new Set());
                }}
                className="px-3 py-1 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 border border-purple-200 shadow-xs hover:bg-purple-100 dark:hover:bg-slate-700 transition-colors"
              >
                {ba.label}
              </button>
            ))}
            <button
              onClick={() => setSelectedKeys(new Set())}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 px-2 py-1"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Table Element */}
      <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800/80">
        <table className="w-full min-w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 font-semibold uppercase text-xs tracking-wider">
              {bulkActions.length > 0 && (
                <th className="py-3 px-3 w-8 text-center">
                  <input
                    type="checkbox"
                    checked={allCurrentSelected}
                    onChange={toggleSelectAll}
                    className="rounded-md accent-pink-600 cursor-pointer"
                  />
                </th>
              )}
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`py-3 px-4 ${col.className || ""} ${
                    col.sortable !== false ? "cursor-pointer select-none hover:text-slate-900 dark:hover:text-white transition-colors" : ""
                  }`}
                  onClick={() => col.sortable !== false && handleSort(idx)}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col.header}</span>
                    {col.sortable !== false && (
                      <span className="text-slate-400">
                        {sortIndex === idx ? (
                          sortDirection === "asc" ? (
                            <ArrowUp size={13} className="text-pink-600 font-bold" />
                          ) : (
                            <ArrowDown size={13} className="text-pink-600 font-bold" />
                          )
                        ) : (
                          <ArrowUpDown size={12} className="opacity-40" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-800 dark:text-slate-200">
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (bulkActions.length > 0 ? 1 : 0)}
                  className="py-12 text-center text-slate-400 text-xs sm:text-sm"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row) => {
                const key = keyExtractor(row);
                const isSelected = selectedKeys.has(key);
                return (
                  <tr
                    key={key}
                    onClick={() => onRowClick?.(row)}
                    className={`transition-colors ${onRowClick ? "cursor-pointer" : ""} ${
                      isSelected
                        ? "bg-purple-50/50 dark:bg-purple-950/20"
                        : "hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                    }`}
                  >
                    {bulkActions.length > 0 && (
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(key)}
                          className="rounded-md accent-pink-600 cursor-pointer"
                        />
                      </td>
                    )}
                    {columns.map((col, cIdx) => (
                      <td
                        key={cIdx}
                        className={`${isCompact ? "py-2 px-4" : "py-3.5 px-4"} ${col.className || ""}`}
                      >
                        {col.render
                          ? col.render(row)
                          : typeof col.accessor === "function"
                          ? col.accessor(row)
                          : col.accessor
                          ? (row[col.accessor as keyof T] as any)
                          : null}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-slate-500">
        <div>
          Showing{" "}
          <strong className="text-slate-800 dark:text-slate-200">
            {sortedData.length ? (currentPage - 1) * pageSize + 1 : 0}
          </strong>{" "}
          to{" "}
          <strong className="text-slate-800 dark:text-slate-200">
            {Math.min(currentPage * pageSize, sortedData.length)}
          </strong>{" "}
          of <strong className="text-slate-800 dark:text-slate-200">{sortedData.length}</strong> records
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ChevronLeft size={15} />
          </button>

          <span className="px-2 font-semibold">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
