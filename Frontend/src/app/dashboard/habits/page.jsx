"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  format,
  startOfDay,
  subDays,
  eachDayOfInterval,
  getDay,
} from "date-fns";

// Icons & colors
const ICONS = ["🔥", "🎸", "🏃‍♂️", "📚", "🧘‍♂️", "🧠", "🎯"];
const COLORS = [
  { key: "emerald", class: "bg-emerald-500" },
  { key: "rose", class: "bg-rose-500" },
  { key: "sky", class: "bg-sky-500" },
  { key: "violet", class: "bg-violet-500" },
  { key: "amber", class: "bg-amber-400" },
  { key: "cyan", class: "bg-cyan-400" },
];

export default function HabitsPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter();

  const [token, setToken] = useState(null);
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);

  // new habit form
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("🔥");
  const [newColor, setNewColor] = useState("emerald");

  // UI
  const [banner, setBanner] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [habitDetail, setHabitDetail] = useState({}); // { [id]: { completions, stats } }
  const [loadingDetailId, setLoadingDetailId] = useState(null);

  // ---------- auth ----------
  useEffect(() => {
    const t = localStorage.getItem("lifeboard_token");
    if (!t) {
      router.push("/login");
    } else {
      setToken(t);
    }
  }, [router]);

  const flashBanner = (msg) => {
    setBanner(msg);
    setTimeout(() => setBanner(""), 2000);
  };

  // ---------- load habits ----------
  const fetchHabits = async (overrideToken) => {
    const t = overrideToken || token;
    if (!t) return;

    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/habits?limit=100`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      setHabits(res.data.habits || []);
    } catch (err) {
      console.error("fetchHabits error:", err);
      flashBanner("Could not load habits");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchHabits(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ---------- add habit ----------
  const handleAddHabit = async () => {
    if (!token || !newName.trim()) return;
    try {
      await axios.post(
        `${API_URL}/api/habits`,
        {
          name: newName.trim(),
          icon: newIcon,
          color: newColor,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewName("");
      flashBanner("Habit added");
      await fetchHabits();
    } catch (err) {
      console.error("addHabit error:", err);
      flashBanner("Could not add habit");
    }
  };

  // ---------- delete habit ----------
  const handleDeleteHabit = async (id) => {
    if (!token) return;
    try {
      await axios.delete(`${API_URL}/api/habits/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHabits((prev) => prev.filter((h) => h.id !== id));
      const copy = { ...habitDetail };
      delete copy[id];
      setHabitDetail(copy);
      if (expandedId === id) setExpandedId(null);
    } catch (err) {
      console.error("deleteHabit error:", err);
      flashBanner("Could not delete habit");
    }
  };

  // ---------- toggle today (one-way) ----------
  const handleToggleToday = async (id) => {
    if (!token) return;
    try {
      await axios.post(
        `${API_URL}/api/habits/${id}/toggle-today`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchHabits();
      if (expandedId === id) await loadHabitDetail(id);
    } catch (err) {
      console.error("toggleToday error:", err);
      flashBanner("Could not mark today");
    }
  };

  // ---------- habit detail (for heatmap) ----------
  const loadHabitDetail = async (id) => {
    if (!token) return;
    setLoadingDetailId(id);
    try {
      const res = await axios.get(`${API_URL}/api/habits/${id}/detail`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setHabitDetail((prev) => ({
        ...prev,
        [id]: {
          completions: res.data.completions || [],
          stats: res.data.stats || {
            currentStreak: 0,
            longestStreak: 0,
          },
        },
      }));
    } catch (err) {
      console.error("getHabitDetail error:", err);
      flashBanner("Could not load habit detail");
    } finally {
      setLoadingDetailId(null);
    }
  };

  const handleToggleExpand = async (id) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    if (!habitDetail[id]) {
      await loadHabitDetail(id);
    }
  };

  return (
    <div className="space-y-8 text-white relative z-10">
      {/* HEADER */}
      <header>
        <p className="text-xs uppercase tracking-[0.18em] text-indigo-300/80">
          Habits
        </p>
        <h1 className="text-3xl font-semibold">Build consistent streaks</h1>
        <p className="text-sm text-slate-400 mt-1">
          Only today is markable. Heatmap lets you visualize your past
          completions.
        </p>
      </header>

      {/* BANNER */}
      {banner && (
        <div className="inline-flex px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-600/60 text-sm">
          {banner}
        </div>
      )}

      {/* ADD HABIT CARD */}
      <section className="bg-[#0c1220] border border-white/10 rounded-2xl p-5 shadow-xl shadow-black/40 space-y-4">
        <h2 className="text-sm font-semibold tracking-wide text-slate-100 mb-1">
          Add a new habit
        </h2>

        {/* name */}
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder='Habit name — e.g. "DSA Practice"'
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        {/* icon + color */}
        <div className="flex flex-wrap items-center gap-4 mt-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Icon</span>
            <div className="flex gap-1.5">
              {ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setNewIcon(icon)}
                  className={`w-8 h-8 rounded-full border flex items-center justify-center text-base transition ${
                    newIcon === icon
                      ? "bg-white/90 text-slate-900 border-transparent"
                      : "bg-white/5 border-white/15 hover:bg-white/10"
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Color</span>
            <div className="flex gap-1.5">
              {COLORS.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setNewColor(c.key)}
                  className={`w-6 h-6 rounded-full border-2 transition ${
                    newColor === c.key
                      ? `${c.class} border-white`
                      : `${c.class} border-transparent opacity-60 hover:opacity-100`
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-3">
          <button
            type="button"
            onClick={handleAddHabit}
            disabled={!newName.trim()}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold shadow shadow-indigo-500/40 disabled:opacity-40"
          >
            Add habit
          </button>
        </div>
      </section>

      {/* HABITS LIST */}
      <section className="space-y-3 mt-4">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>YOUR HABITS ({habits.length})</span>
          <span>Tap “Done today” to mark only for today (one-way).</span>
        </div>

        {loading && (
          <p className="text-sm text-slate-500 mt-2">Loading habits…</p>
        )}

        {!loading && habits.length === 0 && (
          <p className="text-sm text-slate-500 mt-2">
            No habits yet. Add your first habit above.
          </p>
        )}

        <div className="space-y-3">
          {habits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              expanded={expandedId === habit.id}
              onToggleExpand={() => handleToggleExpand(habit.id)}
              onToggleToday={() => handleToggleToday(habit.id)}
              onDelete={() => handleDeleteHabit(habit.id)}
              detail={habitDetail[habit.id]}
              loadingDetail={loadingDetailId === habit.id}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

// ---------- HABIT CARD + HEATMAP ----------

function HabitCard({
  habit,
  expanded,
  onToggleExpand,
  onToggleToday,
  onDelete,
  detail,
  loadingDetail,
}) {
  const colorBg =
    habit.color === "rose"
      ? "from-rose-500/25 via-rose-500/10"
      : habit.color === "sky"
      ? "from-sky-500/25 via-sky-500/10"
      : habit.color === "violet"
      ? "from-violet-500/25 via-violet-500/10"
      : habit.color === "amber"
      ? "from-amber-400/30 via-amber-400/10"
      : habit.color === "cyan"
      ? "from-cyan-400/30 via-cyan-400/10"
      : "from-emerald-500/25 via-emerald-500/10";

  const colorBase =
    habit.color === "rose"
      ? "bg-rose-500"
      : habit.color === "sky"
      ? "bg-sky-500"
      : habit.color === "violet"
      ? "bg-violet-500"
      : habit.color === "amber"
      ? "bg-amber-400"
      : habit.color === "cyan"
      ? "bg-cyan-400"
      : "bg-emerald-500";

  const current = habit.currentStreak || 0;
  const longest = habit.longestStreak || 0;
  const total = habit.totalDays || 0;

  return (
    <div
      className={`rounded-2xl border border-white/10 bg-gradient-to-r ${colorBg} to-[#0c1220] shadow-xl shadow-black/40 overflow-hidden`}
    >
      {/* TOP ROW */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-lg">
            {habit.icon || "🔥"}
          </div>
          <div>
            <p className="text-sm font-semibold">{habit.name}</p>
            <div className="flex items-center gap-2 text-[11px] text-slate-300 mt-[2px]">
              <span className="px-2 py-[2px] rounded-full bg-black/30">
                Current: {current} day{current === 1 ? "" : "s"} 🔥
              </span>
              <span className="px-2 py-[2px] rounded-full bg-black/30">
                Longest: {longest} day{longest === 1 ? "" : "s"}
              </span>
              <span className="px-2 py-[2px] rounded-full bg-black/30">
                Logged: {total} day{total === 1 ? "" : "s"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Today button – disabled if already done */}
          <button
            type="button"
            onClick={onToggleToday}
            disabled={habit.todayDone}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold shadow shadow-black/40 border ${
              habit.todayDone
                ? "bg-emerald-500/80 border-emerald-300 text-slate-900 cursor-default"
                : "bg-emerald-500/15 border-emerald-400/60 text-emerald-100 hover:bg-emerald-500/25"
            } disabled:opacity-80`}
          >
            {habit.todayDone ? "Done today" : "Mark today"}
          </button>

          {/* expand/collapse */}
          <button
            type="button"
            onClick={onToggleExpand}
            className="px-2 h-8 rounded-full bg-black/30 hover:bg-black/40 flex items-center justify-center text-xs text-slate-200"
          >
            {expanded ? "Hide" : "Details"}
            <span className="ml-1 text-[10px]">
              {expanded ? "▴" : "▾"}
            </span>
          </button>

          {/* delete */}
          <button
            type="button"
            onClick={onDelete}
            className="w-8 h-8 rounded-full bg-black/30 hover:bg-black/40 flex items-center justify-center text-slate-400 text-sm"
          >
            ✕
          </button>
        </div>
      </div>

      {/* DETAILS */}
      {expanded && (
        <div className="border-t border-white/10 bg-black/30 px-4 py-4">
          {loadingDetail && (
            <p className="text-xs text-slate-400">Loading detail…</p>
          )}

          {!loadingDetail && detail && (
            <>
              <div className="flex flex-wrap items-center gap-3 mb-3 text-[11px] text-slate-300">
                <span className="px-2 py-[2px] rounded-full bg-white/5 border border-white/10">
                  Current streak:{" "}
                  <strong className="font-semibold">
                    {detail.stats.currentStreak || 0}
                  </strong>{" "}
                  days
                </span>
                <span className="px-2 py-[2px] rounded-full bg.white/5 border border-white/10">
                  Longest streak:{" "}
                  <strong className="font-semibold">
                    {detail.stats.longestStreak || 0}
                  </strong>{" "}
                  days
                </span>
                <span className="px-2 py-[2px] rounded-full bg-white/5 border border-white/10">
                  Total logged:{" "}
                  <strong className="font-semibold">
                    {detail.completions.length}
                  </strong>{" "}
                  days
                </span>
              </div>

              <HabitHeatmap
                completions={detail.completions}
                colorBase={colorBase}
              />

              <p className="mt-3 text-[11px] text-slate-500">
                Heatmap is read-only. Today can be marked using the
                “Done today” button above.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ---------- HEATMAP (read-only) ----------

function HabitHeatmap({ completions, colorBase }) {
  const { weeks, completionSet } = useMemo(() => {
    const today = startOfDay(new Date());
    const start = subDays(today, 364);
    const allDays = eachDayOfInterval({ start, end: today });

    const weeksArr = [];
    let week = new Array(7).fill(null);

    allDays.forEach((date) => {
      const weekday = getDay(date); // 0=Sun..6=Sat
      week[weekday] = date;
      if (weekday === 6) {
        weeksArr.push(week);
        week = new Array(7).fill(null);
      }
    });

    if (week.some((d) => d !== null)) {
      weeksArr.push(week);
    }

    const set = new Set(
      completions.map((c) => format(new Date(c.date), "yyyy-MM-dd"))
    );

    return { weeks: weeksArr, completionSet: set };
  }, [completions]);

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-slate-400">Last 12 months</span>
        <span className="text-[10px] text-slate-500">
          Colored blocks = days you completed this habit.
        </span>
      </div>

      <div className="flex gap-[3px] overflow-x-auto pb-1">
        {weeks.map((week, wIdx) => (
          <div key={wIdx} className="flex flex-col gap-[3px]">
            {week.map((date, dIdx) => {
              const key = date ? format(date, "yyyy-MM-dd") : null;
              const done = key ? completionSet.has(key) : false;

              const baseClass =
                "w-3 h-3 rounded-[3px] border border-transparent";
              const doneClass = done
                ? `${colorBase}`
                : "bg-slate-800/70";

              return (
                <div
                  key={dIdx}
                  className={`${baseClass} ${doneClass}`}
                  title={date ? `${key} – ${done ? "Done" : "Not done"}` : ""}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
