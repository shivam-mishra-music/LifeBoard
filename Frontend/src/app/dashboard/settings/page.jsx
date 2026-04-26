"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function SettingsPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [user, setUser] = useState({ name: "", email: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [message, setMessage] = useState("");
  const [emailPrefs, setEmailPrefs] = useState({
    dailyBriefing: true,
    weeklyReport: false,
    taskReminders: true,
    streakAlerts: true,
  });

  useEffect(() => {
    const t = localStorage.getItem("lifeboard_token");
    if (!t) {
      router.push("/login");
      return;
    }
    setToken(t);
    loadUserInfo(t);
    loadEmailPreferences(t);
  }, []);

  const loadUserInfo = async (token) => {
    try {
      const name = localStorage.getItem("lifeboard_user_name") || "";
      const email = localStorage.getItem("lifeboard_user_email") || "";
      setUser({ name, email });
    } catch (error) {
      console.error("Failed to load user info:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadEmailPreferences = async (token) => {
    try {
      const res = await axios.get(
        `${API_URL}/api/notifications/preferences`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.preferences) {
        setEmailPrefs({
          dailyBriefing: res.data.preferences.dailyBriefing,
          weeklyReport: res.data.preferences.weeklyReport,
          taskReminders: res.data.preferences.taskReminders,
          streakAlerts: res.data.preferences.streakAlerts,
        });
      }
    } catch (error) {
      console.error("Failed to load email preferences:", error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");

    try {
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

  const toggleEmailPref = (key) => {
    setEmailPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const saveEmailPrefs = async () => {
    setSavingPrefs(true);
    setMessage("");

    try {
      await axios.put(
        `${API_URL}/api/notifications/preferences`,
        emailPrefs,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage("✅ Email preferences updated!");
      setTimeout(() => setMessage(""), 2000);
    } catch (error) {
      console.error("Failed to save preferences:", error);
      setMessage("❌ Failed to save preferences");
    } finally {
      setSavingPrefs(false);
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

      {/* Email Preferences Card */}
      <div className="rounded-2xl border border-white/8 bg-[#0c1220] p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-6">Email Preferences</h2>

        <div className="space-y-4">
          {/* Daily Briefing Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/8 hover:bg-white/7 transition-all">
            <div>
              <p className="font-medium text-white">Regular Briefing Emails</p>
              <p className="text-xs text-slate-400 mt-1">Get motivational briefings every 4-5 days</p>
            </div>
            <button
              onClick={() => toggleEmailPref('dailyBriefing')}
              className={`relative w-12 h-7 rounded-full transition-all flex-shrink-0 ${
                emailPrefs.dailyBriefing ? 'bg-indigo-600' : 'bg-white/10'
              }`}
            >
              <div
                className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${
                  emailPrefs.dailyBriefing ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Weekly Report Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/8 hover:bg-white/7 transition-all">
            <div>
              <p className="font-medium text-white">Weekly Reports</p>
              <p className="text-xs text-slate-400 mt-1">Get a summary every Sunday</p>
            </div>
            <button
              onClick={() => toggleEmailPref('weeklyReport')}
              className={`relative w-12 h-7 rounded-full transition-all flex-shrink-0 ${
                emailPrefs.weeklyReport ? 'bg-indigo-600' : 'bg-white/10'
              }`}
            >
              <div
                className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${
                  emailPrefs.weeklyReport ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Task Reminders Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/8 hover:bg-white/7 transition-all">
            <div>
              <p className="font-medium text-white">Task Reminders</p>
              <p className="text-xs text-slate-400 mt-1">Get reminded about overdue tasks</p>
            </div>
            <button
              onClick={() => toggleEmailPref('taskReminders')}
              className={`relative w-12 h-7 rounded-full transition-all flex-shrink-0 ${
                emailPrefs.taskReminders ? 'bg-indigo-600' : 'bg-white/10'
              }`}
            >
              <div
                className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${
                  emailPrefs.taskReminders ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Streak Alerts Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/8 hover:bg-white/7 transition-all">
            <div>
              <p className="font-medium text-white">Streak Alerts</p>
              <p className="text-xs text-slate-400 mt-1">Get notified when your streak is at risk</p>
            </div>
            <button
              onClick={() => toggleEmailPref('streakAlerts')}
              className={`relative w-12 h-7 rounded-full transition-all flex-shrink-0 ${
                emailPrefs.streakAlerts ? 'bg-indigo-600' : 'bg-white/10'
              }`}
            >
              <div
                className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${
                  emailPrefs.streakAlerts ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Save Button */}
          <button
            onClick={saveEmailPrefs}
            disabled={savingPrefs}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold transition-all mt-6 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
          >
            {savingPrefs ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving…
              </>
            ) : (
              <>💾 Save Email Preferences</>
            )}
          </button>
        </div>
      </div>

      {/* App Info */}
      <div className="rounded-2xl border border-white/8 bg-[#0c1220] p-6">
        <h2 className="text-lg font-semibold text-white mb-4">About LifeBoard</h2>
        <div className="space-y-3 text-sm text-slate-400">
          <p>✨ Version 2.0 with AI Coach</p>
          <p>🚀 Features: Tasks, Notes, Habits, Calendar, Chat, Notifications, Email Briefings</p>
          <p>💾 Data is securely stored in our cloud</p>
          <p>🔥 Motivational emails every 4-5 days to keep you on track</p>
        </div>
      </div>
    </div>
  );
}