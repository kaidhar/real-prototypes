"use client";

import Link from "next/link";
import { Search, Filter, Sparkles, ChevronDown, ChevronLeft, ChevronRight, MessageSquare, Link2, Users } from "lucide-react";

const accounts = [
  { id: "inari", name: "Inari", score: 69, change: 3, hasCompetitors: false, logo: "I", color: "#ef4444" },
  { id: "netlify", name: "Netlify", score: 75, change: 24, hasCompetitors: true, competitorInfo: "Netlify's key com...", logo: "N", color: "#00c7b7" },
  { id: "datavant", name: "Datavant", score: 73, change: 3, hasCompetitors: true, competitorInfo: "Datavant competes primari...", logo: "d", color: "#6366f1" },
  { id: "split", name: "Split (Acquired B...", score: 69, change: 1, hasCompetitors: true, competitorInfo: "Split was acquired by Har...", logo: "S", color: "#22c55e" },
  { id: "welbehealth", name: "Welbehealth", score: 52, change: 19, hasCompetitors: true, competitorInfo: "WelbeHealth primary compe...", logo: "W", color: "#0ea5e9" },
  { id: "twitch", name: "Twitch", score: 72, change: 38, hasCompetitors: true, competitorInfo: "Twitch primary competitor...", logo: "T", color: "#9333ea" },
  { id: "gartner", name: "Gartner, Inc.", score: 70, change: 35, hasCompetitors: true, competitorInfo: "Gartner primary competito...", logo: "G", color: "#171717" },
  { id: "illumio", name: "Illumio", score: 72, change: 28, hasCompetitors: true, competitorInfo: "Illumio primary competito...", logo: "I", color: "#f97316" },
  { id: "symplicity", name: "Symplicity", score: 73, change: 0, hasCompetitors: false, logo: "S", color: "#0ea5e9" },
  { id: "target-eagle", name: "Target Eagle", score: 51, change: 0, hasCompetitors: false, logo: "T", color: "#22c55e" },
];

export default function AccountsTable() {
  return (
    <div style={{ backgroundColor: "#ffffff" }} className="flex-1">
      {/* Toolbar */}
      <div
        style={{ borderColor: "#e7e7e6" }}
        className="flex items-center justify-between px-4 py-3 border-b"
      >
        <div className="flex items-center gap-3">
          <button
            style={{ borderColor: "#e7e7e6", color: "#111928" }}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium border rounded-lg hover:opacity-80"
          >
            <Filter size={16} />
            Hide Filters
            <span
              style={{ backgroundColor: "#1c64f2" }}
              className="ml-1 px-1.5 py-0.5 text-xs text-white rounded"
            >
              1
            </span>
          </button>

          <div className="relative">
            <Search
              size={16}
              style={{ color: "#9ca3af" }}
              className="absolute left-3 top-1/2 -translate-y-1/2"
            />
            <input
              type="text"
              placeholder="Search company name"
              style={{ borderColor: "#e7e7e6", color: "#191918" }}
              className="pl-9 pr-3 py-1.5 text-sm border rounded-lg w-[240px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        <button
          style={{ backgroundColor: "#1c64f2" }}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-colors"
        >
          <Sparkles size={16} />
          Enrichment
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: "#f3f4f6", borderColor: "#e7e7e6" }} className="border-b">
              <th className="w-10 px-4 py-3">
                <input type="checkbox" className="rounded" />
              </th>
              <th
                style={{ color: "#6b7280" }}
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
              >
                <div className="flex items-center gap-1">
                  <ChevronDown size={14} />
                  Account Name
                </div>
              </th>
              <th
                style={{ color: "#6b7280" }}
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
              >
                Assign to
              </th>
              <th
                style={{ color: "#6b7280" }}
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
              >
                <div className="flex items-center gap-1">
                  <Sparkles size={14} style={{ color: "#1c64f2" }} />
                  ICP Fitment
                </div>
              </th>
              <th
                style={{ color: "#6b7280" }}
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
              >
                <div className="flex items-center gap-1">
                  <Sparkles size={14} style={{ color: "#1c64f2" }} />
                  Key Competitors
                </div>
              </th>
              <th
                style={{ color: "#6b7280" }}
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
              >
                Company HQ
              </th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((account, index) => (
              <tr
                key={index}
                style={{ borderColor: "#e5e7eb" }}
                className="border-b hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-3">
                  <input type="checkbox" className="rounded" />
                </td>
                <td className="px-4 py-3">
                  <Link href={`/account/${account.id}`} className="flex items-center gap-3 group">
                    <div
                      className="w-8 h-8 rounded flex items-center justify-center text-white text-sm font-medium"
                      style={{ backgroundColor: account.color }}
                    >
                      {account.logo}
                    </div>
                    <span
                      style={{ color: "#111928" }}
                      className="text-sm font-medium group-hover:text-blue-600 transition-colors"
                    >
                      {account.name}
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button style={{ color: "#9ca3af" }} className="p-1 hover:opacity-80">
                      <MessageSquare size={16} />
                    </button>
                    <button style={{ color: "#9ca3af" }} className="p-1 hover:opacity-80">
                      <Link2 size={16} />
                    </button>
                    <button style={{ color: "#9ca3af" }} className="p-1 hover:opacity-80">
                      <Users size={16} />
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div
                      style={{ backgroundColor: "#e7e7e6" }}
                      className="w-8 h-4 rounded-full overflow-hidden"
                    >
                      <div
                        style={{ backgroundColor: "#00913D", width: `${account.score}%` }}
                        className="h-full"
                      />
                    </div>
                    <span style={{ color: "#191918" }} className="text-sm">
                      {account.score}
                    </span>
                    {account.change > 0 && (
                      <span style={{ color: "#00913D" }} className="text-xs">
                        +{account.change}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {account.hasCompetitors ? (
                    <div className="flex items-center gap-1">
                      <span
                        style={{ backgroundColor: "#00913D" }}
                        className="w-2 h-2 rounded-full"
                      />
                      <span style={{ color: "#191918" }} className="text-sm">
                        {account.competitorInfo}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <span
                        style={{ backgroundColor: "#e02424" }}
                        className="w-2 h-2 rounded-full"
                      />
                      <span style={{ color: "#6b7280" }} className="text-sm">
                        No relevant public inform...
                      </span>
                    </div>
                  )}
                </td>
                <td style={{ color: "#6b7280" }} className="px-4 py-3 text-sm">
                  N/A
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div
        style={{ borderColor: "#e7e7e6" }}
        className="flex items-center justify-between px-4 py-3 border-t"
      >
        <div style={{ color: "#6b7280" }} className="flex items-center gap-2 text-sm">
          Showing rows per page:
          <select
            style={{ borderColor: "#e7e7e6", color: "#191918" }}
            className="px-2 py-1 border rounded"
          >
            <option>20</option>
            <option>50</option>
            <option>100</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span style={{ color: "#6b7280" }} className="text-sm">
            1 - 20 of 2,755 items
          </span>
          <div className="flex items-center gap-1">
            <button style={{ color: "#9ca3af" }} className="p-1 hover:opacity-80 disabled:opacity-50">
              <ChevronLeft size={18} />
            </button>
            <span
              style={{ borderColor: "#e7e7e6" }}
              className="px-3 py-1 text-sm border rounded"
            >
              1
            </span>
            <button style={{ color: "#9ca3af" }} className="p-1 hover:opacity-80">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
