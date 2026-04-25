"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function NotificationsBell({ token }) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [token]);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.patch(
        `${API_URL}/api/notifications/${id}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchNotifications();
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await axios.delete(`${API_URL}/api/notifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchNotifications();
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "task_overdue":
        return "⏰";
      case "streak_warning":
        return "🔥";
      case "daily_briefing":
        return "✨";
      case "weekly_report":
        return "📊";
      default:
        return "🔔";
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 rounded-lg hover:bg-white/5 transition-all"
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-white/10 bg-[#0c1220] shadow-2xl z-50">
          <div className="bg-gradient-to-r from-indigo-600/20 to-indigo-500/10 px-4 py-3 border-b border-white/10">
            <h3 className="text-sm font-semibold text-white">Notifications</h3>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-slate-500">
                No notifications yet
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {notifications.map((notif) => (
                  <div key={notif.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span>{getNotificationIcon(notif.type)}</span>
                          <p className="text-sm font-semibold text-white">{notif.title}</p>
                        </div>
                        <p className="text-xs text-slate-400">{notif.message}</p>
                      </div>
                      {!notif.read && (
                        <button
                          onClick={() => markAsRead(notif.id)}
                          className="text-xs text-indigo-400"
                        >
                          ✓
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="px-4 py-3 border-t border-white/5">
            <button
              onClick={() => {
                router.push("/dashboard/notifications");
                setShowDropdown(false);
              }}
              className="text-xs text-indigo-400 hover:text-indigo-300"
            >
              View all →
            </button>
          </div>
        </div>
      )}

      {showDropdown && (
        <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
      )}
    </div>
  );
}
