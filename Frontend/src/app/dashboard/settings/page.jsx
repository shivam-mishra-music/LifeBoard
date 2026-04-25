"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function SettingsPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter();
  const [user, setUser] = useState({ name: "", email: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("lifeboard_token");
    if (!token) {
      router.push("/login");
      return;
    }
    loadUserInfo(token);
  }, []);

  const loadUserInfo = async (token) => {
    try {
      // Get user info from localStorage or backend
      const name = localStorage.getItem("lifeboard_user_name") || "";
      const email = localStorage.getItem("lifeboard_user_email") || "";
      setUser({ name, email });
    } catch (error) {
      console.error("Failed to load user info:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const token = localStorage.getItem("lifeboard_token");
    setSaving(true);
    setMessage("");

    try {
      // Save to localStorage (backend integration optional)
      localStorage.setItem("lifeboard_user_name", user.name);
      localStorage.setItem("lifeboard_user_email", user.email);

      setMessage("✅ Profile updated successfully!");
      setTimeout(() => setMessage(""), 2000);
    } catch (error) {
      console.error("Failed to save:", error);
      setMessage("❌ Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-12 max-w-2xl">
      {/* Header */}
      <header className="mb-6">
        <p className="text-[11px] uppercase tracking-[0.2em] text-indigo-400/70 font-medium mb-1">
          Settings
        </p>
        <h1 className="text-[2rem] font-bold leading-tight tracking-tight text-white">
          Account Settings
        </h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Manage your profile and preferences
        </p>
      </header>

      {/* Message */}
      {message && (
        <div className={`mb-4 px-4 py-2.5 rounded-xl text-sm ${
          message.includes("✅")
            ? "bg-emerald-500/10 border border-emerald-400/25 text-emerald-200"
            : "bg-rose-500/10 border border-rose-400/25 text-rose-200"
        }`}>
          {message}
        </div>
      )}

      {/* Profile Card */}
      <div className="rounded-2xl border border-white/8 bg-[#0c1220] p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-6">Profile Information</h2>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Your Name
            </label>
            <input
              type="text"
              value={user.name}
              onChange={(e) => setUser({ ...user, name: e.target.value })}
              placeholder="Enter your name"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
            />
            <p className="text-xs text-slate-500 mt-1">
              This is how you'll be greeted in the app
            </p>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={user.email}
              onChange={(e) => setUser({ ...user, email: e.target.value })}
              placeholder="your@email.com"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
            />
            <p className="text-xs text-slate-500 mt-1">
              Used for notifications and account recovery
            </p>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
          >
            {saving ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving…
              </>
            ) : (
              <>💾 Save Changes</>
            )}
          </button>
        </div>
      </div>

      {/* App Info */}
      <div className="rounded-2xl border border-white/8 bg-[#0c1220] p-6">
        <h2 className="text-lg font-semibold text-white mb-4">About LifeBoard</h2>
        <div className="space-y-3 text-sm text-slate-400">
          <p>✨ Version 2.0 with AI Coach</p>
          <p>🚀 Features: Tasks, Notes, Habits, Calendar, Chat, Notifications</p>
          <p>💾 Data is securely stored in our cloud</p>
        </div>
      </div>
    </div>
  );
}