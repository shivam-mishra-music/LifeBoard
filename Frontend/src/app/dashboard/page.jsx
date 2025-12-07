"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { format, isSameDay, startOfDay } from "date-fns";
import { useRouter } from "next/navigation";

export default function OverviewPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const [token, setToken] = useState(null);
  const [todayTasks, setTodayTasks] = useState([]);
  const [habits, setHabits] = useState([]);
  const [summary, setSummary] = useState(null);
  const [banner, setBanner] = useState("");

  const router = useRouter();
  const today = startOfDay(new Date());
  const todayStr = format(today, "yyyy-MM-dd");

  // ---------------- AUTH CHECK ----------------
  useEffect(() => {
    const t = localStorage.getItem("lifeboard_token");
    if (!t) router.push("/login");
    else setToken(t);
  }, []);

  const flash = (msg) => {
    setBanner(msg);
    setTimeout(() => setBanner(""), 2000);
  };

  // ---------------- LOAD DATA ----------------
  useEffect(() => {
    if (!token) return;
    loadTasks();
    loadHabits();
    loadTodaySummary();
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
    } catch {
      flash("Error updating task");
    }
  };

  const loadHabits = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/habits`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHabits(res.data.habits || []);
    } catch {
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
    } catch {
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

  // ---------------- GREETING ----------------
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good Morning ☀️" :
    hour < 18 ? "Good Afternoon 🌤️" :
    "Good Evening 🌙";

  // ---------------- DERIVED STATS ----------------
  const tasksCompleted = todayTasks.filter(t => t.completed).length;
  const habitsDone = habits.filter(h => h.todayDone).length;
  const totalHabits = habits.length;
  const productivity = summary?.productivity || 0;
  const mood = summary?.mood || "—";

  return (
    <div className="space-y-8 text-white relative z-10">

      {/* HEADER */}
      <header>
        <p className="text-xs uppercase tracking-[0.18em] text-indigo-300/80">
          Overview
        </p>
        <h1 className="text-3xl font-semibold">{greeting}, Shivam</h1>
        <p className="text-sm text-slate-400 mt-1">
          {format(today, "EEEE, d MMM yyyy")}
        </p>
      </header>

      {banner && (
        <div className="px-3 py-2 rounded-lg bg-slate-900/70 border border-slate-600 text-sm inline-flex">
          {banner}
        </div>
      )}

      {/* ---------------- TODAY SUMMARY ---------------- */}
      <section className="bg-[#0c1220] border border-white/10 rounded-2xl p-5 shadow-xl shadow-black/40">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-100">Today’s Summary</h2>
          <button
            onClick={() => router.push("/calendar")}
            className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs"
          >
            Edit
          </button>
        </div>

        {!summary && (
          <p className="text-xs text-slate-400">
            No summary yet — log from your calendar.
          </p>
        )}

        {summary && (
          <div className="text-sm space-y-1">
            {summary.mood && <p>Mood: {summary.mood}</p>}
            {summary.productivity && <p>Productivity: {renderStars(summary.productivity)}</p>}
            {summary.journal && (
              <p className="text-slate-300 text-xs bg-white/5 p-2 rounded-lg">
                {summary.journal}
              </p>
            )}
          </div>
        )}
      </section>

      {/* ---------------- STATS ROW ---------------- */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">

        <StatCard
          title="Tasks Completed"
          value={`${tasksCompleted} / ${todayTasks.length}`}
          color="from-indigo-500/20 to-indigo-500/5"
        />

        <StatCard
          title="Habits Done"
          value={`${habitsDone} / ${totalHabits}`}
          color="from-emerald-500/20 to-emerald-500/5"
        />

        <StatCard
          title="Productivity"
          value={renderStars(productivity)}
          color="from-amber-500/20 to-amber-500/5"
        />

        <StatCard
          title="Mood"
          value={mood}
          color="from-rose-500/20 to-rose-500/5"
        />

      </section>

      {/* ---------------- TODAY TASKS ---------------- */}
      <section>
        <h2 className="text-sm font-semibold mb-2 text-slate-200">
          Today’s Tasks
        </h2>

        {todayTasks.length === 0 && (
          <p className="text-xs text-slate-500">No tasks for today 🎉</p>
        )}

        <div className="space-y-2">
          {todayTasks.map((task) => (
            <label
              key={task.id}
              className="flex items-center gap-3 bg-[#0c1220] border border-white/10 p-3 rounded-xl"
            >
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => toggleTask(task.id, task.completed)}
              />
              <span className={task.completed ? "line-through text-slate-500" : ""}>
                {task.title}
              </span>
            </label>
          ))}
        </div>
      </section>

      {/* ---------------- HABITS OVERVIEW ---------------- */}
      <section>
        <h2 className="text-sm font-semibold mb-2 text-slate-200">
          Today’s Habits
        </h2>

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
                  Streak: {h.currentStreak} days
                </p>
              </div>
            </div>

            <button
              onClick={() => toggleHabitToday(h.id)}
              className={`px-3 py-1.5 text-xs rounded-lg font-semibold ${
                h.todayDone
                  ? "bg-emerald-400 text-slate-900"
                  : "bg-emerald-500/20 border border-emerald-400/40 text-emerald-200"
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

/* ----------------------- COMPONENTS ------------------------ */

function StatCard({ title, value, color }) {
  return (
    <div
      className={`p-4 rounded-2xl bg-gradient-to-br ${color} border border-white/10 shadow-md shadow-black/40`}
    >
      <p className="text-xs text-slate-400">{title}</p>
      <p className="text-xl font-semibold mt-1">{value}</p>
    </div>
  );
}

function renderStars(n) {
  if (!n || n <= 0) return "—";

  const filled = "★".repeat(n);
  const empty = "☆".repeat(5 - n);

  return (
    <span className="text-amber-400 text-lg tracking-wide">
      {filled}
      <span className="text-slate-600">{empty}</span>
    </span>
  );
}
