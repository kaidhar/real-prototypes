"use client";

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import FilterPanel from "@/components/FilterPanel";
import AccountsTable from "@/components/AccountsTable";

export default function Home() {
  return (
    <div style={{ backgroundColor: "#f6f6f5" }} className="min-h-screen">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="ml-[60px]">
        <Header />

        <div className="flex h-[calc(100vh-64px)]">
          {/* Filter Panel */}
          <FilterPanel />

          {/* Accounts Table */}
          <AccountsTable />
        </div>
      </div>
    </div>
  );
}
