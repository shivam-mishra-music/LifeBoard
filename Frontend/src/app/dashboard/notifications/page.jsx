"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function NotificationsPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("lifeboard_token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchNotifications(token);
  }, []);

  const fetchNotifications = async (token) => {
    try {
      const res = await axios.get(`${API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(res.data.notifications || []);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteNotification = async (id) => {
    const token = localStorage.getItem("lifeboard_token");
    try {
      await axios.delete(`${API_URL}/api/notifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  return (
    <div className="pb-12">
      <h1 className="text-3xl font-bold text-white mb-6">Notifications</h1>
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-2xl p-12 border border-white/8 bg-[#0c1220] text-center">
          <p className="text-slate-400">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => (
            <div key={notif.id} className="rounded-2xl p-4 border border-white/8 bg-[#0c1220] flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-white">{notif.title}</h3>
                <p className="text-sm text-slate-400">{notif.message}</p>
              </div>
              <button
                onClick={() => deleteNotification(notif.id)}
                className="text-slate-500 hover:text-red-400"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
