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
  const [allTasks, setAllTasks] = useState([]);
  const [habits, setHabits] = useState([]);
  const [summary, setSummary] = useState(null);
  const [last7Days, setLast7Days] = useState([]);
  const [banner, setBanner] = useState("");

  const today = startOfDay(new Date());
  const todayStr = format(today, "yyyy-MM-dd");

  // -------------------- AUTH --------------------
  useEffect(() => {
    const t = localStorage.getItem("lifeboard_token");
    if (!t) {
      router.push("/login");
      return;
    }
    setToken(t);

    const storedName = localStorage.getItem("lifeboard_user_name");
    if (storedName) setUserName(storedName);
  }, [router]);

  const flash = (msg) => {
    setBanner(msg);
    setTimeout(() => setBanner(""), 2000);
  };

  // -------------------- LOAD DATA --------------------
  useEffect(() => {
    if (!token) return;
    loadTasks();
    loadHabits();
    loadTodaySummary();
    loadLast7();
  }, [token]);

  const loadTasks = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/tasks?limit=200`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const tasks = res.data.tasks || res.data || [];
      setAllTasks(tasks);

      const filtered = tasks.filter(
        (t) => t.dueDate && isSameDay(new Date(t.dueDate), today)
      );

      setTodayTasks(filtered);
    } catch (err) {
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
      flash("Could not toggle habit");
    }
  };

  const loadTodaySummary = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/day-summary/${todayStr}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSummary(res.data.summary || null);
    } catch {
      setSummary(null);
    }
  };

  const loadLast7 = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/day-summary/last7`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLast7Days(res.data.days || []);
    } catch {}
  };

  // -------------------- STATS --------------------
  const completedTasks = allTasks.filter((t) => t.completed).length;
  const totalPendingTasks = allTasks.filter((t) => !t.completed).length;
  const habitsDone = habits.filter((h) => h.todayDone).length;

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

  // -------------------- HELPERS --------------------
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning ☀️";
    if (hour < 17) return "Good Afternoon 🌤️";
    if (hour < 21) return "Good Evening 🌙";
    return "Good Night 🌙";
  };

  const moodEmoji = (m) =>
    m === "good" ? "😊" : m === "moderate" ? "😐" : m === "bad" ? "😢" : "—";

  const moodLabel = (m) =>
    m === "good" ? "Good" : m === "moderate" ? "Moderate" : m === "bad" ? "Bad" : "—";

  const renderStars = (value) => (
    <span className="inline-flex gap-[2px] text-[14px] text-yellow-300">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i}>{i < value ? "★" : "☆"}</span>
      ))}
    </span>
  );

  return (
    <div className="space-y-8 text-white relative z-10">

      {/* HEADER */}
      <header>
        <p className="text-xs uppercase tracking-[0.18em] text-indigo-300/80">Overview</p>
        <h1 className="text-3xl font-semibold">{getGreeting()}, {userName}</h1>
        <p className="text-sm text-slate-400 mt-1">{format(today, "EEEE, d MMM yyyy")}</p>
      </header>

      {banner && (
        <div className="px-3 py-2 rounded-lg bg-slate-900/70 border border-slate-600 text-sm">
          {banner}
        </div>
      )}

      {/* SUMMARY CARD */}
      <section className="bg-[#0c1220] border border-white/10 rounded-2xl p-5 shadow-xl">

        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">Today’s Summary</h2>
          <button
            onClick={() => router.push("/dashboard/calendar")}
            className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs"
          >
            Edit
          </button>
        </div>

        {!summary && (
          <p className="text-xs text-slate-400">No summary yet — log your mood & productivity.</p>
        )}

        {summary && (
          <div className="text-sm space-y-2">

            {summary.mood && (
              <p className="flex items-center gap-2">
                <span className="text-lg">{moodEmoji(summary.mood)}</span>
                <span className="capitalize">{moodLabel(summary.mood)}</span>
              </p>
            )}

            {summary.productivity && (
              <p className="flex items-center gap-2">
                Productivity: {renderStars(summary.productivity)}
              </p>
            )}

            {summary.journal && (
              <p className="text-xs text-slate-300 bg-white/5 p-3 rounded-lg border border-white/10">
                {summary.journal}
              </p>
            )}
          </div>
        )}
      </section>

      {/* STATS CARDS */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">

        {/* Mood */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-600/30 via-emerald-600/10 border border-white/10 shadow-xl">
          <p className="text-xs text-slate-300">Today’s Mood</p>
          <h2 className="text-2xl font-bold mt-2 flex items-center gap-2">
            {moodEmoji(summary?.mood)} {moodLabel(summary?.mood)}
          </h2>
        </div>

        {/* Completed Tasks */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600/30 via-blue-600/10 border border-white/10 shadow-xl">
          <p className="text-xs text-slate-300">Completed Tasks</p>
          <h2 className="text-2xl font-bold mt-2">{completedTasks}</h2>
        </div>

        {/* Pending Tasks */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-pink-600/30 via-pink-600/10 border border-white/10 shadow-xl">
          <p className="text-xs text-slate-300">Pending Tasks</p>
          <h2 className="text-2xl font-bold mt-2">{totalPendingTasks}</h2>
        </div>

        {/* Habits */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-600/30 via-emerald-600/10 border border-white/10 shadow-xl">
          <p className="text-xs text-slate-300">Habits Done</p>
          <h2 className="text-2xl font-bold mt-2">{habitsDone} / {habits.length}</h2>
        </div>
      </section>

      {/* WEEKLY VIEW */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* MOOD TIMELINE */}
        <div className="bg-[#0c1220] border border-white/10 rounded-2xl p-4 shadow-xl shadow-black/40">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-slate-100">This week’s mood</h2>
            <span className="text-[11px] text-slate-500">Last 7 days</span>
          </div>

          {weeklyMood.length === 0 ? (
            <p className="text-xs text-slate-500">No mood data yet.</p>
          ) : (
            <div className="mt-3 flex justify-between">
              {weeklyMood.map((d) => (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[11px] text-slate-400">{d.label}</span>
                  <span className="text-lg">{moodEmoji(d.mood)}</span>
                  <span className="text-[10px] text-slate-400">{moodLabel(d.mood)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PRODUCTIVITY BARS */}
        <div className="bg-[#0c1220] border border-white/10 rounded-2xl p-4 shadow-xl shadow-black/40">

          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-slate-100">Productivity</h2>
            <span className="text-[11px] text-slate-500">0–5 scale</span>
          </div>

          {weeklyProductivity.length === 0 ? (
            <p className="text-xs text-slate-500">No productivity logs yet.</p>
          ) : (
            <div className="mt-4 flex items-end gap-3 h-28">
              {weeklyProductivity.map((d) => {
                const val = d.value ?? 0;
                const height = val === 0 ? 5 : (val / 5) * 100;

                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-6 rounded-full bg-indigo-500/20 border border-indigo-400/40 flex items-end overflow-hidden"
                      style={{ height: "80px" }}
                    >
                      <div
                        className="w-full bg-indigo-400"
                        style={{ height: `${height}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-slate-400">{d.label}</span>
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

      {/* TASKS */}
      <section>
        <h2 className="text-sm font-semibold mb-2">Today’s Tasks</h2>

        {todayTasks.length === 0 && <p className="text-xs text-slate-500">No tasks for today 🎉</p>}

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
            <span className={`text-sm ${task.completed ? "line-through text-slate-500" : ""}`}>
              {task.title}
            </span>
          </label>
        ))}
      </section>

      {/* HABITS */}
      <section>
        <h2 className="text-sm font-semibold mb-2">Today’s Habits</h2>

        {habits.map((h) => (
          <div
            key={h.id}
            className="flex items-center justify-between bg-[#0c1220] border border-white/10 rounded-xl px-4 py-3 mb-2"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-lg">
                {h.icon}
              </div>

              <div>
                <p className="text-sm">{h.name}</p>
                <p className="text-[10px] text-slate-400">
                  Streak: {h.currentStreak} · Longest: {h.longestStreak}
                </p>
              </div>
            </div>

            <button
              onClick={() => toggleHabitToday(h.id)}
              className={`px-3 py-1.5 text-xs rounded-lg font-semibold border ${
                h.todayDone
                  ? "bg-emerald-400 text-slate-900 border-emerald-300"
                  : "bg-emerald-500/20 text-emerald-200 border-emerald-400/40"
              }`}
            >
              {h.todayDone ? "Done" : "Mark"}
            </button>
          </div>
        ))}
      </section>

    </div>
  );
}
