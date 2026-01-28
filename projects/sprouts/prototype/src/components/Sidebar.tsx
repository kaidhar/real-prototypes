"use client";

import {
  Target,
  Search,
  List,
  GitBranch,
  BookOpen,
  Settings,
  Globe,
  LayoutGrid,
} from "lucide-react";

export default function Sidebar() {
  const navItems = [
    { Icon: LayoutGrid, active: false },
    { Icon: Target, active: true },
    { Icon: List, active: false },
    { Icon: Globe, active: false },
  ];

  const bottomItems = [
    { Icon: Search },
    { Icon: GitBranch },
    { Icon: BookOpen },
  ];

  return (
    <aside
      style={{ backgroundColor: "#0e2933" }}
      className="w-[60px] h-screen flex flex-col items-center py-4 fixed left-0 top-0 z-50"
    >
      {/* Logo */}
      <div className="mb-6">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <path
            d="M14 2C7.373 2 2 7.373 2 14s5.373 12 12 12 12-5.373 12-12S20.627 2 14 2z"
            fill="#1c64f2"
          />
          <path
            d="M10 14c0-2.21 1.79-4 4-4s4 1.79 4 4-1.79 4-4 4-4-1.79-4-4z"
            fill="#ffffff"
          />
        </svg>
      </div>

      {/* Main navigation */}
      <nav className="flex flex-col items-center gap-1 flex-1">
        {navItems.map((item, index) => (
          <button
            key={index}
            style={{
              backgroundColor: item.active ? "#3e545c" : "transparent",
              color: item.active ? "#ffffff" : "#6e7f85",
            }}
            className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors hover:opacity-80"
          >
            <item.Icon size={20} />
          </button>
        ))}

        <div style={{ backgroundColor: "#263e47" }} className="my-4 w-8 h-px" />

        {bottomItems.map((item, index) => (
          <button
            key={index}
            style={{ color: "#6e7f85" }}
            className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors hover:opacity-80"
          >
            <item.Icon size={20} />
          </button>
        ))}
      </nav>

      {/* Bottom items */}
      <div className="flex flex-col items-center gap-1 mt-auto">
        {/* Settings */}
        <button
          style={{ color: "#6e7f85" }}
          className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors hover:opacity-80"
        >
          <Settings size={20} />
        </button>

        {/* User Avatar */}
        <div
          style={{ backgroundColor: "#1c64f2" }}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium mt-2"
        >
          PP
        </div>
      </div>
    </aside>
  );
}
