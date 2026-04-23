"use client";

import { useState, useEffect } from "react";
import axios from "axios";

// Animated dots loader
function LoadingDots() {
  return (
    <div className="flex items-center gap-1">
      <div
        className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"
        style={{ animationDelay: "0ms" }}
      />
      <div
        className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"
        style={{ animationDelay: "150ms" }}
      />
      <div
        className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"
        style={{ animationDelay: "300ms" }}
      />
    </div>
  );
}

// Markdown-ish text parser (simple)
function ParsedText({ text }) {
  // Handle **bold** and 🎯 etc
  const parts = text.split(/(\*\*[^*]+\*\*)/);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="font-semibold text-white">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      })}
    </>
  );
}

/**
 * AI Coach Component
 * Shows personalized briefing on the dashboard
 */
export default function AICoach({ token, userName }) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [briefing, setBriefing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [lastFetch, setLastFetch] = useState(null);

  useEffect(() => {
    if (!token) return;
    fetchBriefing();
  }, [token]);

  const fetchBriefing = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(
        `${API_URL}/api/ai/daily-briefing`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBriefing(res.data);
      setLastFetch(new Date());
    } catch (err) {
      setError(err.response?.data?.error || "Could not generate briefing");
      console.error("AI briefing error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchBriefing();
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/8 bg-gradient-to-br from-indigo-600/10 via-[#0c1220] to-[#0c1220] p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-indigo-300">✨ AI Life Coach</h2>
          <span className="text-[10px] text-slate-500">Thinking…</span>
        </div>
        <div className="flex items-center justify-center py-8">
          <LoadingDots />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-white/8 bg-[#0c1220] p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-indigo-300">✨ AI Life Coach</h2>
          <button
            onClick={handleRefresh}
            className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Try again →
          </button>
        </div>
        <p className="text-xs text-slate-500">{error}</p>
      </div>
    );
  }

  if (!briefing || !briefing.briefing) {
    return null;
  }

  const { briefing: text, stats } = briefing;
  const isLong = text.length > 200;

  return (
    <div
      className="rounded-2xl border overflow-hidden mb-6 transition-all duration-300"
      style={{
        background: "linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(15,23,42,0.5) 100%)",
        borderColor: "rgba(99,102,241,0.25)",
      }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600/20 to-indigo-500/10 px-5 py-3 border-b border-indigo-500/10">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <div>
              <h2 className="text-sm font-semibold text-indigo-200">Daily Briefing</h2>
              <p className="text-[10px] text-indigo-300/60">Your AI Life Coach</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-indigo-500/20 border border-white/8 flex items-center justify-center text-xs text-slate-400 hover:text-indigo-300 transition-all"
            title="Refresh briefing"
          >
            ↻
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-3">
        {/* Main briefing text */}
        <div className="relative">
          <p
            className={`text-sm leading-relaxed text-slate-200 ${!expanded && isLong ? "line-clamp-3" : ""}`}
          >
            <ParsedText text={text} />
          </p>
          {isLong && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-2 text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              {expanded ? "Show less ↑" : "Read more ↓"}
            </button>
          )}
        </div>

        {/* Quick stats */}
        {stats && (
          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-white/5">
            <div className="text-center">
              <p className="text-xs font-semibold text-indigo-300">{stats.todayCompleted}</p>
              <p className="text-[9px] text-slate-500">Done today</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold text-amber-300">{stats.pendingTasks}</p>
              <p className="text-[9px] text-slate-500">Pending</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold text-emerald-300">🔥 {stats.topStreak}</p>
              <p className="text-[9px] text-slate-500">Streak</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold text-blue-300">{stats.completionRate}%</p>
              <p className="text-[9px] text-slate-500">This week</p>
            </div>
          </div>
        )}

        {/* Mood trend */}
        {stats?.moodTrend && stats.moodTrend.some(m => m) && (
          <div className="flex items-center gap-2 pt-2 border-t border-white/5">
            <span className="text-[10px] text-slate-500">Mood: </span>
            <div className="flex gap-1">
              {stats.moodTrend.map((mood, i) => {
                const emoji =
                  mood === "good"
                    ? "😊"
                    : mood === "moderate"
                    ? "😐"
                    : mood === "bad"
                    ? "😢"
                    : "—";
                return (
                  <span key={i} className="text-sm">
                    {emoji}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-2 bg-white/3 border-t border-white/5 flex items-center justify-between">
        <p className="text-[10px] text-slate-600">
          {lastFetch ? `Updated ${lastFetch.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}
        </p>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            handleRefresh();
          }}
          className="text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Refresh
        </a>
      </div>
    </div>
  );
}