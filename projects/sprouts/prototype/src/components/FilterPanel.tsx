"use client";

import { Search, ChevronDown, X } from "lucide-react";

const filterCategories = [
  { name: "List" },
  { name: "Companies" },
  { name: "Location" },
  { name: "Company Region" },
  { name: "Industry" },
  { name: "Employee Count" },
  { name: "Technology" },
  { name: "Revenue" },
];

export default function FilterPanel() {
  return (
    <div
      style={{ backgroundColor: "#ffffff", borderColor: "#e7e7e6" }}
      className="w-[280px] border-r h-full flex flex-col"
    >
      {/* Header */}
      <div
        style={{ borderColor: "#e7e7e6" }}
        className="flex items-center justify-between px-4 py-3 border-b"
      >
        <div className="flex items-center gap-4">
          <button style={{ color: "#1c64f2" }} className="text-sm font-medium">
            Filters
          </button>
          <button
            style={{ color: "#6b7280" }}
            className="text-sm font-medium hover:opacity-80"
          >
            Saved
          </button>
        </div>
        <button style={{ color: "#9ca3af" }} className="hover:opacity-80">
          <X size={18} />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Search */}
        <div className="px-4 py-3">
          <div className="relative">
            <Search
              size={16}
              style={{ color: "#9ca3af" }}
              className="absolute left-3 top-1/2 -translate-y-1/2"
            />
            <input
              type="text"
              placeholder="Search filters"
              style={{ borderColor: "#e7e7e6", color: "#191918" }}
              className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Account section */}
        <div className="px-4">
          <div
            style={{ color: "#9ca3af" }}
            className="text-xs font-semibold uppercase tracking-wider mb-2"
          >
            ACCOUNT
          </div>

          {filterCategories.map((category, index) => (
            <button
              key={index}
              style={{ color: "#191918" }}
              className="w-full flex items-center justify-between py-2.5 text-sm hover:opacity-80"
            >
              <span>{category.name}</span>
              <ChevronDown size={16} style={{ color: "#9ca3af" }} />
            </button>
          ))}
        </div>
      </div>

      {/* Footer - fixed at bottom */}
      <div
        style={{ borderColor: "#e7e7e6", backgroundColor: "#ffffff" }}
        className="px-4 py-3 border-t flex items-center gap-3 flex-shrink-0"
      >
        <button style={{ color: "#6b7280" }} className="text-sm hover:opacity-80">
          Clear
        </button>
        <button
          style={{ color: "#1c64f2" }}
          className="text-sm font-medium hover:opacity-80"
        >
          Save Search
        </button>
        <button
          style={{ backgroundColor: "#1c64f2" }}
          className="ml-auto px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-colors"
        >
          Apply
        </button>
      </div>
    </div>
  );
}
