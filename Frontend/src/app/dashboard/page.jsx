"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { format, isSameDay, startOfDay } from "date-fns";
import { useRouter } from "next/navigation";

export default function OverviewPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter();

  const [token, setToken] = useState(null);
  const [userName, setUserName] = useState("there");

  const [todayTasks, setTodayTasks] = useState([]);
  const [habits, setHabits] = useState([]);
  const [summary, setSummary] = useState(null);
  const [last7Days, setLast7Days] = useState([]);
  const [banner, setBanner] = useState("");

  const today = startOfDay(new Date());
  const todayStr = format(today, "yyyy-MM-dd");

  // -------------------- AUTH + USER NAME --------------------
  useEffect(() => {
    const t = localStorage.getItem("lifeboard_token");
    if (!t) {
      router.push("/login");
      return;
    }
    setToken(t);

    // If you store user name at login like:
    // localStorage.setItem("lifeboard_user_name", user.name);
    const storedName = localStorage.getItem("lifeboard_user_name");
    if (storedName && storedName.trim()) {
      setUserName(storedName);
    } else {
      setUserName("there");
    }
  }, [router]);

  const flash = (msg) => {
    setBanner(msg);
    setTimeout(() => setBanner(""), 2000);
  };

  // -------------------- LOAD TODAY + LAST 7 DAYS --------------------
  useEffect(() => {
    if (!token) return;
    loadTasks();
    loadHabits();
    loadTodaySummary();
    loadLast7();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const loadTasks = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const tasks = res.data || [];

      const filtered = tasks.filter((t) => {
        if (!t.dueDate) return false;
        return isSameDay(new Date(t.dueDate), today);
      });

      setTodayTasks(filtered);
    } catch (err) {
      console.error(err);
      flash("Could not load tasks");
    }
  };

  const toggleTask = async (id, current) => {
    try {
      await axios.put(
        `${API_URL}/api/tasks/${id}`,
        { completed: !current },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      loadTasks();
    } catch (err) {
      console.error(err);
      flash("Error updating task");
    }
  };

  const loadHabits = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/habits`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHabits(res.data.habits || []);
    } catch (err) {
      console.error(err);
      flash("Could not load habits");
    }
  };

  const toggleHabitToday = async (id) => {
    try {
      await axios.post(
        `${API_URL}/api/habits/${id}/toggle-today`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      loadHabits();
    } catch (err) {
      console.error(err);
      flash("Could not toggle habit");
    }
  };

  const loadTodaySummary = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/day-summary/${todayStr}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSummary(res.data.summary || null);
    } catch (err) {
      console.error(err);
      setSummary(null);
    }
  };

  const loadLast7 = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/day-summary/last7`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLast7Days(res.data.days || []);
    } catch (err) {
      console.error(err);
      // don't spam banner here
    }
  };

  // -------------------- GREETING + MOOD EMOJIS --------------------
  const hour = new Date().getHours();

  const getGreeting = () => {
    if (hour >= 5 && hour < 12) return "Good Morning";
    if (hour >= 12 && hour < 17) return "Good Afternoon";
    if (hour >= 17 && hour < 21) return "Good Evening";
    return "Good Night";
  };

  const greetingText = getGreeting();

  const moodEmoji = (mood) => {
    if (mood === "good") return "😊";
    if (mood === "moderate") return "😐";
    if (mood === "bad") return "😢";
    return "—";
  };

  const moodLabel = (mood) => {
    if (mood === "good") return "Good";
    if (mood === "moderate") return "Moderate";
    if (mood === "bad") return "Bad";
    return "Not logged";
  };

  const renderStars = (value) => {
    const v = value || 0;
    return (
      <span className="inline-flex gap-[2px] text-[13px]">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i}>{i < v ? "★" : "☆"}</span>
        ))}
      </span>
    );
  };

  // -------------------- WEEKLY DATA SHAPES --------------------

  const weeklyMood = last7Days.map((d) => ({
    date: d.date,
    label: format(new Date(d.date), "EEE"),
    mood: d.mood,
  }));

  const weeklyProductivity = last7Days.map((d) => ({
    date: d.date,
    label: format(new Date(d.date), "EEE"),
    value: d.productivity ?? 0,
  }));

  return (
    <div className="space-y-8 text-white relative z-10">
      {/* HEADER */}
      <header>
        <p className="text-xs uppercase tracking-[0.18em] text-indigo-300/80">
          Overview
        </p>
        <h1 className="text-3xl font-semibold">
          {greetingText}, {userName}
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          {format(today, "EEEE, d MMM yyyy")}
        </p>
      </header>

      {banner && (
        <div className="px-3 py-2 rounded-lg bg-slate-900/70 border border-slate-600 text-sm inline-flex">
          {banner}
        </div>
      )}

      {/* TODAY SUMMARY CARD */}
      <section className="bg-[#0c1220] border border-white/10 rounded-2xl p-5 shadow-xl shadow-black/40">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-100">
            Today’s Summary
          </h2>
          <button
            onClick={() => router.push("/dashboard/calendar")}
            className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs"
          >
            Edit in calendar
          </button>
        </div>

        {!summary && (
          <p className="text-xs text-slate-400">
            No summary yet — log your mood & productivity from the calendar.
          </p>
        )}

        {summary && (
          <div className="text-sm space-y-2">
            {summary.mood && (
              <p className="flex items-center gap-2">
                <span className="text-base">{moodEmoji(summary.mood)}</span>
                <span className="text-slate-200">
                  Mood: <span className="capitalize">{moodLabel(summary.mood)}</span>
                </span>
              </p>
            )}

            {summary.productivity && (
              <p className="flex items-center gap-2">
                <span>Productivity:</span>
                {renderStars(summary.productivity)}
                <span className="text-[11px] text-slate-500">
                  ({summary.productivity}/5)
                </span>
              </p>
            )}

            {summary.journal && (
              <div className="text-xs text-slate-300 bg-white/5 p-3 rounded-lg border border-white/10">
                {summary.journal}
              </div>
            )}
          </div>
        )}
      </section>

      {/* WEEKLY MOOD + PRODUCTIVITY SECTION */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mood timeline */}
        <div className="bg-[#0c1220] border border-white/10 rounded-2xl p-4 shadow-xl shadow-black/40">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-slate-100">
              This week’s mood
            </h2>
            <span className="text-[11px] text-slate-500">
              Based on last 7 days
            </span>
          </div>

          {weeklyMood.length === 0 && (
            <p className="text-xs text-slate-500">
              No mood data yet — start logging from calendar.
            </p>
          )}

          {weeklyMood.length > 0 && (
            <div className="mt-2 flex flex-col gap-2 text-xs">
              <div className="flex gap-2 justify-between">
                {weeklyMood.map((d) => (
                  <div
                    key={d.date}
                    className="flex-1 flex flex-col items-center gap-1"
                  >
                    <span className="text-[11px] text-slate-400">
                      {d.label}
                    </span>
                    <span className="text-lg">
                      {moodEmoji(d.mood)}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {d.mood ? moodLabel(d.mood) : "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Productivity mini bar chart */}
        <div className="bg-[#0c1220] border border-white/10 rounded-2xl p-4 shadow-xl shadow-black/40">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-slate-100">
              Productivity (last 7 days)
            </h2>
            <span className="text-[11px] text-slate-500">
              0–5 scale per day
            </span>
          </div>

          {weeklyProductivity.length === 0 && (
            <p className="text-xs text-slate-500">
              No productivity logs yet.
            </p>
          )}

          {weeklyProductivity.length > 0 && (
            <div className="mt-3 flex items-end gap-2 h-28">
              {weeklyProductivity.map((d) => {
                const val = d.value || 0;
                const height = val === 0 ? 6 : (val / 5) * 100;

                return (
                  <div
                    key={d.date}
                    className="flex-1 flex flex-col items-center gap-1"
                  >
                    <div
                      className="w-5 rounded-full bg-indigo-500/30 border border-indigo-400/60 flex items-end justify-center overflow-hidden"
                      style={{ height: "72px" }}
                    >
                      <div
                        className="w-full bg-indigo-400"
                        style={{ height: `${height}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {d.label}
                    </span>
                    <span className="text-[10px] text-slate-300">
                      {val ? `${val}/5` : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* TODAY TASKS */}
      <section>
        <h2 className="text-sm font-semibold mb-2 text-slate-200">
          Today’s Tasks
        </h2>

        {todayTasks.length === 0 && (
          <p className="text-xs text-slate-500">
            No tasks with deadline today 🎉
          </p>
        )}

        <div className="space-y-2">
          {todayTasks.map((task) => (
            <label
              key={task.id}
              className="flex items-center gap-3 bg-[#0c1220] border border-white/10 p-3 rounded-xl cursor-pointer"
            >
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => toggleTask(task.id, task.completed)}
                className="accent-indigo-500"
              />
              <div className="flex flex-col">
                <span
                  className={
                    task.completed
                      ? "line-through text-slate-500 text-sm"
                      : "text-sm"
                  }
                >
                  {task.title}
                </span>
                {task.description && (
                  <span className="text-[11px] text-slate-500">
                    {task.description}
                  </span>
                )}
              </div>
            </label>
          ))}
        </div>
      </section>

      {/* HABIT STREAK OVERVIEW */}
      <section>
        <h2 className="text-sm font-semibold mb-2 text-slate-200">
          Today’s Habits
        </h2>

        {habits.length === 0 && (
          <p className="text-xs text-slate-500">
            No habits added yet. Go to Habits tab and create your first streak.
          </p>
        )}

        {habits.map((h) => (
          <div
            key={h.id}
            className="flex items-center justify-between bg-[#0c1220] border border-white/10 rounded-xl px-4 py-3 mb-2"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-lg">
                {h.icon || "🔥"}
              </div>
              <div>
                <p className="text-sm">{h.name}</p>
                <p className="text-[10px] text-slate-400">
                  Streak: {h.currentStreak || 0} day
                  {h.currentStreak === 1 ? "" : "s"} · Longest:{" "}
                  {h.longestStreak || 0}
                </p>
              </div>
            </div>

            <button
              onClick={() => toggleHabitToday(h.id)}
              className={`px-3 py-1.5 text-xs rounded-lg font-semibold border ${
                h.todayDone
                  ? "bg-emerald-400 text-slate-900 border-emerald-300"
                  : "bg-emerald-500/20 border-emerald-400/40 text-emerald-200 hover:bg-emerald-500/30"
              }`}
            >
              {h.todayDone ? "Done" : "Mark today"}
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}
