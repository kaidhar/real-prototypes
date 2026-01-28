"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import ChatAgent from "@/components/ChatAgent";
import {
  ArrowLeft,
  PenLine,
  Users,
  UserPlus,
  Building2,
  Sparkles,
  Activity,
  Globe,
  Linkedin,
  BarChart3,
  Search,
} from "lucide-react";
import Link from "next/link";

const tabs = ["Overview", "Contacts", "Signals", "Activity", "Notes"];

const accountData = {
  name: "Coatcom Limited",
  domain: "coatcom.com",
  icpFitment: "N/A",
  intentScore: "HIGH-0",
  accountOwner: "Goutham Joshi",
  list: "N/A",
  overview: {
    govtVsNonGovt: "N/A",
    annualRevenue: "N/A",
    companySize: "N/A",
    b2bVsB2c: "N/A",
    profitVsNonProfit: "N/A",
    productVsService: "N/A",
    funding: "N/A",
    location: "N/A",
  },
  contacts: [
    {
      name: "Francois Deventer",
      initials: "FD",
      jobTitle: "N/A",
      icpFitment: "Others",
      icpPersona: "N/A",
      department: "N/A",
      subDepartment: "N/A",
    },
  ],
};

export default function AccountDetailsPage() {
  const [activeTab, setActiveTab] = useState("Overview");

  return (
    <div style={{ backgroundColor: "#f6f6f5" }} className="min-h-screen">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="ml-[60px]">
        {/* Header */}
        <header
          style={{ backgroundColor: "#ffffff", borderColor: "#e7e7e6" }}
          className="border-b px-6 py-4"
        >
          {/* Top row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                style={{ color: "#6b7280" }}
                className="hover:opacity-80"
              >
                <ArrowLeft size={20} />
              </Link>

              <div
                style={{ backgroundColor: "#f3f4f6", borderColor: "#e7e7e6" }}
                className="w-10 h-10 rounded border flex items-center justify-center"
              >
                <Building2 size={20} style={{ color: "#6b7280" }} />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1
                    style={{ color: "#111928" }}
                    className="text-xl font-semibold"
                  >
                    {accountData.name}
                  </h1>
                  <button style={{ color: "#6b7280" }} className="hover:opacity-80">
                    <Globe size={16} />
                  </button>
                  <button style={{ color: "#6b7280" }} className="hover:opacity-80">
                    <Linkedin size={16} />
                  </button>
                </div>
                <p style={{ color: "#6b7280" }} className="text-sm">
                  {accountData.domain || "N/A"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                style={{ borderColor: "#e7e7e6", color: "#111928" }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-lg hover:opacity-80"
              >
                <PenLine size={16} />
                Add Notes
              </button>
              <button
                style={{ borderColor: "#e7e7e6", color: "#111928" }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-lg hover:opacity-80"
              >
                <Users size={16} />
                Source contacts
              </button>
              <button
                style={{ backgroundColor: "#1c64f2" }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90"
              >
                <UserPlus size={16} />
                Assign to
              </button>
            </div>
          </div>

          {/* Meta row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div>
                <div className="flex items-center gap-1 text-xs" style={{ color: "#6b7280" }}>
                  <Sparkles size={12} style={{ color: "#1c64f2" }} />
                  ICP Fitment
                </div>
                <p style={{ color: "#111928" }} className="text-sm font-medium">
                  {accountData.icpFitment}
                </p>
              </div>
              <div>
                <p className="text-xs" style={{ color: "#6b7280" }}>
                  Intent score
                </p>
                <span
                  style={{ backgroundColor: "#ebf5ff", color: "#1c64f2" }}
                  className="text-xs font-medium px-2 py-0.5 rounded"
                >
                  {accountData.intentScore}
                </span>
              </div>
              <div>
                <p className="text-xs" style={{ color: "#6b7280" }}>
                  Account owner
                </p>
                <p style={{ color: "#111928" }} className="text-sm font-medium">
                  {accountData.accountOwner}
                </p>
              </div>
              <div>
                <p className="text-xs" style={{ color: "#6b7280" }}>
                  List
                </p>
                <p style={{ color: "#111928" }} className="text-sm font-medium">
                  {accountData.list}
                </p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    backgroundColor: activeTab === tab ? "#ffffff" : "transparent",
                    color: activeTab === tab ? "#111928" : "#6b7280",
                    borderColor: activeTab === tab ? "#e7e7e6" : "transparent",
                  }}
                  className={`px-4 py-2 text-sm font-medium rounded-lg border ${
                    activeTab === tab ? "shadow-sm" : ""
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-3 gap-6">
            {/* Account Overview */}
            <div
              style={{ backgroundColor: "#ffffff", borderColor: "#e7e7e6" }}
              className="rounded-lg border p-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <Building2 size={18} style={{ color: "#6b7280" }} />
                <h2 style={{ color: "#111928" }} className="font-semibold">
                  Account Overview
                </h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div
                      style={{ backgroundColor: "#f3f4f6" }}
                      className="w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-3"
                    >
                      <Building2 size={32} style={{ color: "#d1d5db" }} />
                    </div>
                    <p style={{ color: "#111928" }} className="font-medium">
                      Account Overview not available
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t" style={{ borderColor: "#e7e7e6" }}>
                  {Object.entries(accountData.overview).map(([key, value]) => (
                    <div key={key}>
                      <p className="text-xs capitalize" style={{ color: "#6b7280" }}>
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </p>
                      <p style={{ color: "#111928" }} className="text-sm">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Signals */}
            <div
              style={{ backgroundColor: "#ffffff", borderColor: "#e7e7e6" }}
              className="rounded-lg border p-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 size={18} style={{ color: "#6b7280" }} />
                <h2 style={{ color: "#111928" }} className="font-semibold">
                  Signals
                </h2>
              </div>

              <div className="flex flex-col items-center justify-center py-12">
                <div
                  style={{ backgroundColor: "#ebf5ff" }}
                  className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
                >
                  <Search size={32} style={{ color: "#1c64f2" }} />
                </div>
                <p style={{ color: "#111928" }} className="font-medium mb-2">
                  No data to show
                </p>
                <p style={{ color: "#6b7280" }} className="text-sm text-center mb-4">
                  You don't have any Signals enriched. Please configure to see data here.
                </p>
                <button
                  style={{ backgroundColor: "#1c64f2" }}
                  className="px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90"
                >
                  Enrich Signals
                </button>
              </div>
            </div>

            {/* Activity */}
            <div
              style={{ backgroundColor: "#ffffff", borderColor: "#e7e7e6" }}
              className="rounded-lg border p-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <Activity size={18} style={{ color: "#6b7280" }} />
                <h2 style={{ color: "#111928" }} className="font-semibold">
                  Activity
                </h2>
              </div>

              <div className="flex flex-col items-center justify-center py-12">
                <div
                  style={{ backgroundColor: "#ebf5ff" }}
                  className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
                >
                  <Search size={32} style={{ color: "#1c64f2" }} />
                </div>
                <p style={{ color: "#111928" }} className="font-medium mb-2">
                  No data to show
                </p>
                <p style={{ color: "#6b7280" }} className="text-sm text-center">
                  No activity yet. Once you start, your updates will appear here.
                </p>
              </div>
            </div>
          </div>

          {/* Contacts Table */}
          <div
            style={{ backgroundColor: "#ffffff", borderColor: "#e7e7e6" }}
            className="rounded-lg border mt-6"
          >
            <div
              style={{ borderColor: "#e7e7e6" }}
              className="flex items-center gap-2 px-5 py-4 border-b"
            >
              <Users size={18} style={{ color: "#6b7280" }} />
              <h2 style={{ color: "#111928" }} className="font-semibold">
                Contacts
              </h2>
              <span
                style={{ backgroundColor: "#f3f4f6", color: "#6b7280" }}
                className="px-2 py-0.5 text-xs rounded-full"
              >
                {accountData.contacts.length}
              </span>
            </div>

            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: "#f9fafb" }}>
                  <th
                    style={{ color: "#6b7280" }}
                    className="px-5 py-3 text-left text-xs font-semibold uppercase"
                  >
                    Contact Name
                  </th>
                  <th
                    style={{ color: "#6b7280" }}
                    className="px-5 py-3 text-left text-xs font-semibold uppercase"
                  >
                    Job Title
                  </th>
                  <th
                    style={{ color: "#6b7280" }}
                    className="px-5 py-3 text-left text-xs font-semibold uppercase"
                  >
                    ICP Fitment
                  </th>
                  <th
                    style={{ color: "#6b7280" }}
                    className="px-5 py-3 text-left text-xs font-semibold uppercase"
                  >
                    ICP Persona
                  </th>
                  <th
                    style={{ color: "#6b7280" }}
                    className="px-5 py-3 text-left text-xs font-semibold uppercase"
                  >
                    Department
                  </th>
                  <th
                    style={{ color: "#6b7280" }}
                    className="px-5 py-3 text-left text-xs font-semibold uppercase"
                  >
                    Sub Department
                  </th>
                </tr>
              </thead>
              <tbody>
                {accountData.contacts.map((contact, index) => (
                  <tr
                    key={index}
                    style={{ borderColor: "#e7e7e6" }}
                    className="border-t hover:bg-gray-50"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          style={{ backgroundColor: "#d1d5db", color: "#ffffff" }}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium"
                        >
                          {contact.initials}
                        </div>
                        <span style={{ color: "#111928" }} className="text-sm font-medium">
                          {contact.name}
                        </span>
                      </div>
                    </td>
                    <td style={{ color: "#6b7280" }} className="px-5 py-3 text-sm">
                      {contact.jobTitle}
                    </td>
                    <td style={{ color: "#6b7280" }} className="px-5 py-3 text-sm">
                      {contact.icpFitment}
                    </td>
                    <td style={{ color: "#6b7280" }} className="px-5 py-3 text-sm">
                      {contact.icpPersona}
                    </td>
                    <td style={{ color: "#6b7280" }} className="px-5 py-3 text-sm">
                      {contact.department}
                    </td>
                    <td style={{ color: "#6b7280" }} className="px-5 py-3 text-sm">
                      {contact.subDepartment}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Chat Agent */}
      <ChatAgent />
    </div>
  );
}
