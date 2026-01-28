"use client";

import { ChevronDown, Users, Building2, HelpCircle } from "lucide-react";
import NotificationCenter from "./NotificationCenter";

export default function Header() {
  return (
    <header
      style={{ backgroundColor: "#ffffff", borderColor: "#e7e7e6" }}
      className="h-16 border-b flex items-center justify-between px-6"
    >
      {/* Left side */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <h1 style={{ color: "#111928" }} className="text-xl font-semibold">
            Target Profiles
          </h1>
          <HelpCircle size={16} style={{ color: "#9ca3af" }} />
        </div>

        {/* Tabs */}
        <div
          style={{ backgroundColor: "#f9fafb" }}
          className="flex items-center gap-1 rounded-lg p-1"
        >
          <button
            style={{ backgroundColor: "#ffffff", color: "#111928" }}
            className="flex items-center gap-2 px-4 py-2 rounded-md shadow-sm text-sm font-medium"
          >
            <Building2 size={16} />
            Accounts
          </button>
          <button
            style={{ color: "#6b7280" }}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium hover:opacity-80"
          >
            <Users size={16} />
            Contacts
          </button>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        <div className="text-sm" style={{ color: "#6b7280" }}>
          <span style={{ color: "#111928" }} className="font-medium">
            4.5K
          </span>{" "}
          Credits
        </div>

        <NotificationCenter />

        <button
          style={{ borderColor: "#e7e7e6", color: "#111928" }}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-lg hover:opacity-80 transition-colors"
        >
          Pied Piper
          <ChevronDown size={16} />
        </button>

        <button
          style={{ borderColor: "#e7e7e6", color: "#111928" }}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-lg hover:opacity-80 transition-colors"
        >
          Actions
          <ChevronDown size={16} />
        </button>
      </div>
    </header>
  );
}
