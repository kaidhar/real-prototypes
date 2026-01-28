"use client";

import { useState, useEffect } from "react";
import { Bell, X, Circle, CheckCircle } from "lucide-react";
import Link from "next/link";

export interface Notification {
  id: string;
  type: "account" | "action";
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  linkUrl?: string;
}

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Fetch notifications on mount and poll every 30 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    // Mock API call - replace with your actual API
    const mockNotifications: Notification[] = [
      {
        id: "1",
        type: "account",
        title: "Account Status Changed",
        message: "Acme Corp status updated to 'Qualified'",
        timestamp: "2 minutes ago",
        isRead: false,
        linkUrl: "/account/1",
      },
      {
        id: "2",
        type: "action",
        title: "Email Sent Successfully",
        message: "Your outreach email to John Smith has been sent",
        timestamp: "15 minutes ago",
        isRead: false,
      },
      {
        id: "3",
        type: "account",
        title: "New Signal Detected",
        message: "TechCorp showed buying intent on your website",
        timestamp: "1 hour ago",
        isRead: true,
        linkUrl: "/account/2",
      },
      {
        id: "4",
        type: "action",
        title: "Task Completed",
        message: "Account research for 5 companies completed",
        timestamp: "2 hours ago",
        isRead: true,
      },
    ];
    setNotifications(mockNotifications);
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAsUnread = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: false } : n))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          borderColor: "#e7e7e6",
          color: "#111928",
        }}
        className="relative flex items-center justify-center w-10 h-10 border rounded-lg hover:opacity-80 transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span
            style={{
              backgroundColor: "#e02424",
              color: "#ffffff",
            }}
            className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-semibold rounded-full"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div
            style={{
              backgroundColor: "#ffffff",
              borderColor: "#e7e7e6",
            }}
            className="absolute right-0 top-12 w-96 border rounded-lg shadow-lg z-50"
          >
            {/* Header */}
            <div
              style={{
                borderColor: "#e7e7e6",
              }}
              className="flex items-center justify-between px-4 py-3 border-b"
            >
              <h3
                style={{ color: "#111928" }}
                className="text-sm font-semibold"
              >
                Notifications
                {unreadCount > 0 && (
                  <span
                    style={{ color: "#6b7280" }}
                    className="ml-2 text-xs font-normal"
                  >
                    {unreadCount} unread
                  </span>
                )}
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  style={{ color: "#1c64f2" }}
                  className="text-xs font-medium hover:opacity-80"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Notification List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Bell
                    size={40}
                    style={{ color: "#9ca3af" }}
                    className="mx-auto mb-2"
                  />
                  <p style={{ color: "#6b7280" }} className="text-sm">
                    No notifications yet
                  </p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={markAsRead}
                    onMarkAsUnread={markAsUnread}
                    onDelete={deleteNotification}
                    onClose={() => setIsOpen(false)}
                  />
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div
                style={{
                  backgroundColor: "#f9fafb",
                  borderColor: "#e7e7e6",
                }}
                className="px-4 py-3 border-t text-center"
              >
                <button
                  style={{ color: "#1c64f2" }}
                  className="text-sm font-medium hover:opacity-80"
                >
                  View all notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onMarkAsUnread: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

function NotificationItem({
  notification,
  onMarkAsRead,
  onMarkAsUnread,
  onDelete,
  onClose,
}: NotificationItemProps) {
  const [showActions, setShowActions] = useState(false);

  const handleClick = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
    if (notification.linkUrl) {
      onClose();
    }
  };

  const content = (
    <div
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      style={{
        backgroundColor: notification.isRead ? "#ffffff" : "#ebf5ff",
        borderColor: "#e7e7e6",
      }}
      className="relative px-4 py-3 border-b hover:bg-opacity-80 transition-colors cursor-pointer"
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        {/* Unread indicator dot */}
        <div className="flex-shrink-0 mt-1">
          {notification.isRead ? (
            <CheckCircle size={16} style={{ color: "#9ca3af" }} />
          ) : (
            <Circle
              size={16}
              style={{ color: "#1c64f2" }}
              className="fill-current"
            />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p
            style={{ color: "#111928" }}
            className="text-sm font-medium mb-1"
          >
            {notification.title}
          </p>
          <p style={{ color: "#6b7280" }} className="text-xs mb-1">
            {notification.message}
          </p>
          <p style={{ color: "#9ca3af" }} className="text-xs">
            {notification.timestamp}
          </p>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                notification.isRead
                  ? onMarkAsUnread(notification.id)
                  : onMarkAsRead(notification.id);
              }}
              style={{
                color: "#6b7280",
                borderColor: "#e7e7e6",
              }}
              className="p-1 border rounded hover:opacity-80"
              title={notification.isRead ? "Mark as unread" : "Mark as read"}
            >
              {notification.isRead ? (
                <Circle size={14} />
              ) : (
                <CheckCircle size={14} />
              )}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(notification.id);
              }}
              style={{
                color: "#e02424",
                borderColor: "#e7e7e6",
              }}
              className="p-1 border rounded hover:opacity-80"
              title="Delete"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  if (notification.linkUrl) {
    return <Link href={notification.linkUrl}>{content}</Link>;
  }

  return content;
}
