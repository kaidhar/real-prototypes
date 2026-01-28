"use client";

import { X, Bell, CheckCircle, AlertCircle, Info, Clock } from "lucide-react";

interface Notification {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message: string;
  time: string;
  read: boolean;
}

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const notifications: Notification[] = [
  {
    id: "1",
    type: "success",
    title: "Enrichment Complete",
    message: "Successfully enriched 24 accounts with ICP data",
    time: "2 min ago",
    read: false,
  },
  {
    id: "2",
    type: "info",
    title: "New Accounts Added",
    message: "15 new accounts have been added to your target list",
    time: "15 min ago",
    read: false,
  },
  {
    id: "3",
    type: "warning",
    title: "Credits Running Low",
    message: "You have 4.5K credits remaining. Consider upgrading your plan.",
    time: "1 hour ago",
    read: false,
  },
  {
    id: "4",
    type: "success",
    title: "Sequence Completed",
    message: "Outreach sequence 'Q1 Campaign' has finished successfully",
    time: "3 hours ago",
    read: true,
  },
  {
    id: "5",
    type: "error",
    title: "Email Delivery Failed",
    message: "3 emails failed to deliver in your last campaign",
    time: "5 hours ago",
    read: true,
  },
];

const getIcon = (type: string) => {
  switch (type) {
    case "success":
      return <CheckCircle size={18} style={{ color: "#00913D" }} />;
    case "error":
      return <AlertCircle size={18} style={{ color: "#e02424" }} />;
    case "warning":
      return <Clock size={18} style={{ color: "#f59e0b" }} />;
    default:
      return <Info size={18} style={{ color: "#1c64f2" }} />;
  }
};

export default function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Don't render anything when closed
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{ backgroundColor: "rgba(0,0,0,0.2)" }}
        className="fixed inset-0 z-[60]"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        style={{ backgroundColor: "#ffffff", left: "60px" }}
        className="fixed top-0 h-screen w-[380px] shadow-xl z-[70]"
      >
        {/* Header */}
        <div
          style={{ borderColor: "#e7e7e6" }}
          className="flex items-center justify-between px-5 py-4 border-b"
        >
          <div className="flex items-center gap-3">
            <Bell size={20} style={{ color: "#111928" }} />
            <h2 style={{ color: "#111928" }} className="text-lg font-semibold">
              Notifications
            </h2>
            {unreadCount > 0 && (
              <span
                style={{ backgroundColor: "#ebf5ff", color: "#1c64f2" }}
                className="px-2 py-0.5 text-xs font-medium rounded-full"
              >
                {unreadCount} new
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            style={{ color: "#6b7280" }}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-80 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Actions */}
        <div
          style={{ borderColor: "#e5e7eb" }}
          className="flex items-center justify-between px-5 py-3 border-b"
        >
          <button
            style={{ color: "#1c64f2" }}
            className="text-sm font-medium hover:opacity-80"
          >
            Mark all as read
          </button>
          <button
            style={{ color: "#6b7280" }}
            className="text-sm hover:opacity-80"
          >
            Settings
          </button>
        </div>

        {/* Notifications List */}
        <div className="overflow-y-auto h-[calc(100vh-180px)]">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              style={{
                borderColor: "#e5e7eb",
                backgroundColor: !notification.read ? "rgba(235,245,255,0.3)" : "transparent",
              }}
              className="px-5 py-4 border-b cursor-pointer hover:opacity-90 transition-colors"
            >
              <div className="flex gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      style={{ color: !notification.read ? "#111928" : "#6b7280" }}
                      className="text-sm font-medium"
                    >
                      {notification.title}
                    </p>
                    {!notification.read && (
                      <span
                        style={{ backgroundColor: "#1c64f2" }}
                        className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                      />
                    )}
                  </div>
                  <p style={{ color: "#6b7280" }} className="text-sm mt-0.5 line-clamp-2">
                    {notification.message}
                  </p>
                  <p style={{ color: "#9ca3af" }} className="text-xs mt-1.5">
                    {notification.time}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{ borderColor: "#e7e7e6", backgroundColor: "#ffffff" }}
          className="absolute bottom-0 left-0 right-0 px-5 py-3 border-t"
        >
          <button
            style={{ color: "#1c64f2" }}
            className="w-full py-2 text-sm font-medium hover:opacity-80"
          >
            View all notifications
          </button>
        </div>
      </div>
    </>
  );
}
