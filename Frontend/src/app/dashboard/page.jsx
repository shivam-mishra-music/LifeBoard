"use client";

import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { format, isSameDay, startOfDay, subDays, differenceInDays } from "date-fns";
import { useRouter } from "next/navigation";
import AICoach from "@/components/AICoach";
import NotificationsBell from "@/components/NotificationsBell";

// ─── Micro sparkline chart (pure SVG, no deps) ───────────────────────────────
function SparkBar({ data, color = "#6366f1", height = 48 }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data, 1);
  const w = 100 / data.length;
  return (
    <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
      {data.map((v, i) => {
        const barH = (v / max) * (height - 4);
        return (
          <rect
            key={i}
            x={i * w + 1}
            y={height - barH}
            width={w - 2}
            height={barH}
            rx="2"
            fill={color}
            opacity={v === 0 ? 0.15 : 0.85}
          />
        );
      })}
    </svg>
  );
}

// ─── Radial progress ring ─────────────────────────────────────────────────────
function Ring({ value, max, size = 80, stroke = 7, color = "#6366f1", label, sub }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = max > 0 ? value / max : 0;
  const dash = circ * pct;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: "stroke-dasharray 0.8s cubic-bezier(.4,0,.2,1)" }}
        />
      </svg>
      <span className="text-[11px] font-semibold text-white/70 -mt-1">{label}</span>
      {sub && <span className="text-[10px] text-white/40">{sub}</span>}
    </div>
  );
}

// ─── Mood dot ────────────────────────────────────────────────────────────────
const MOOD_MAP = {
  good:     { emoji: "😊", label: "Good",     color: "#34d399", bg: "rgba(52,211,153,0.12)" },
  moderate: { emoji: "😐", label: "Moderate", color: "#fbbf24", bg: "rgba(251,191,36,0.12)" },
  bad:      { emoji: "😢", label: "Low",      color: "#f87171", bg: "rgba(248,113,113,0.12)" },
};
const mood = (m) => MOOD_MAP[m] || { emoji: "—", label: "—", color: "#475569", bg: "transparent" };

// ─── Priority badge ──────────────────────────────────────────────────────────
const PRIORITY = {
  HIGH:   { label: "High",   cls: "bg-red-500/20 text-red-300 border-red-400/30" },
  MEDIUM: { label: "Med",    cls: "bg-amber-500/20 text-amber-300 border-amber-400/30" },
  LOW:    { label: "Low",    cls: "bg-slate-500/20 text-slate-300 border-slate-500/30" },
};

// ─── Animated counter ────────────────────────────────────────────────────────
function Counter({ value }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const steps = 24;
    const inc = value / steps;
    const t = setInterval(() => {
      start += inc;
      if (start >= value) { setDisplay(value); clearInterval(t); }
      else setDisplay(Math.floor(start));
    }, 30);
    return () => clearInterval(t);
  }, [value]);
  return <>{display}</>;
}

// ─────────────────────────────────────────────────────────────────────────────
export default function OverviewPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const router  = useRouter();

  const [token,    setToken]    = useState(null);
  const [userName, setUserName] = useState("there");
  const [allTasks, setAllTasks] = useState([]);
  const [todayTasks,setTodayTasks]=useState([]);
  const [habits,   setHabits]   = useState([]);
  const [summary,  setSummary]  = useState(null);
  const [last7,    setLast7]    = useState([]);
  const [banner,   setBanner]   = useState("");
  const [mounted,  setMounted]  = useState(false);
  const [aiToken, setAiToken] = useState(null);

  const today    = startOfDay(new Date());
  const todayStr = format(today, "yyyy-MM-dd");

  // ── auth ──────────────────────────────────────────────────────────────────
  useEffect(() => {
  const t = localStorage.getItem("lifeboard_token");
  if (!t) { router.push("/login"); return; }
  setToken(t);
  
  const n = localStorage.getItem("lifeboard_user_name");
  if (n) setUserName(n);
  
  // Get token for AI coach
  setAiToken(t);  // ← Use the same 't' from above, no need to fetch again
  
  setTimeout(() => setMounted(true), 80);
}, [router]);

  const flash = (msg) => { setBanner(msg); setTimeout(() => setBanner(""), 2500); };

  // ── load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    loadTasks(); loadHabits(); loadTodaySummary(); loadLast7(); 
  }, [token]);

  const loadTasks = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/tasks?limit=200`, { headers: { Authorization: `Bearer ${token}` } });
      const tasks = res.data.tasks || res.data || [];
      setAllTasks(tasks);
      setTodayTasks(tasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), today)));
    } catch { flash("Could not load tasks"); }
  };

  const toggleTask = async (id, current) => {
    try {
      await axios.put(`${API_URL}/api/tasks/${id}`, { completed: !current }, { headers: { Authorization: `Bearer ${token}` } });
      loadTasks();
    } catch { flash("Error updating task"); }
  };

  const loadHabits = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/habits`, { headers: { Authorization: `Bearer ${token}` } });
      setHabits(res.data.habits || []);
    } catch { flash("Could not load habits"); }
  };

  const toggleHabitToday = async (id) => {
    try {
      await axios.post(`${API_URL}/api/habits/${id}/toggle-today`, {}, { headers: { Authorization: `Bearer ${token}` } });
      loadHabits();
    } catch { flash("Could not toggle habit"); }
  };

  const loadTodaySummary = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/day-summary/${todayStr}`, { headers: { Authorization: `Bearer ${token}` } });
      setSummary(res.data.summary || null);
    } catch { setSummary(null); }
  };

  const loadLast7 = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/day-summary/last7`, { headers: { Authorization: `Bearer ${token}` } });
      setLast7(res.data.days || []);
    } catch {}
  };
  
  // ── derived stats ─────────────────────────────────────────────────────────
  const todayDone    = todayTasks.filter(t => t.completed).length;
  const todayTotal   = todayTasks.length;
  const totalPending = allTasks.filter(t => !t.completed).length;
  const habitsDone   = habits.filter(h => h.todayDone).length;
  const habitsTotal  = habits.length;

  // longest active streak across all habits
  const topStreak = habits.reduce((best, h) => Math.max(best, h.currentStreak || 0), 0);

  // 7-day productivity data
  const prodData = Array.from({ length: 7 }, (_, i) => {
    const d = format(subDays(today, 6 - i), "yyyy-MM-dd");
    const found = last7.find(x => x.date?.startsWith(d));
    return found?.productivity ?? 0;
  });

  // task completion ratio for week (derived from allTasks with dueDate in last 7 days)
  const weekTasks  = allTasks.filter(t => {
    if (!t.dueDate) return false;
    const diff = differenceInDays(today, startOfDay(new Date(t.dueDate)));
    return diff >= 0 && diff < 7;
  });
  const weekDone   = weekTasks.filter(t => t.completed).length;

  // avg productivity this week
  const prodValues = prodData.filter(v => v > 0);
  const avgProd    = prodValues.length ? (prodValues.reduce((a, b) => a + b, 0) / prodValues.length).toFixed(1) : "—";

  // greeting
  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 5)  return { text: "Still up?",         icon: "🌙" };
    if (h < 12) return { text: "Good morning",       icon: "☀️" };
    if (h < 17) return { text: "Good afternoon",     icon: "🌤️" };
    if (h < 21) return { text: "Good evening",       icon: "🌆" };
    return       { text: "Good night",               icon: "🌙" };
  };
  const { text: greetText, icon: greetIcon } = getGreeting();

  // score card (0–100 productivity score for today)
  const productivityScore = summary?.productivity ? Math.round((summary.productivity / 5) * 100) : null;

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="text-white pb-12"
      style={{
        opacity: mounted ? 1 : 0,
        transform: mounted ? "none" : "translateY(10px)",
        transition: "opacity 0.4s ease, transform 0.4s ease",
      }}
    >

      {/* ── BANNER ── */}
      {banner && (
        <div className="mb-4 px-4 py-2.5 rounded-xl bg-indigo-600/20 border border-indigo-400/30 text-sm text-indigo-200">
          {banner}
        </div>
      )}

      {/* ── HEADER ── */}
      <header className="mb-8">
        <p className="text-[11px] uppercase tracking-[0.2em] text-indigo-400/70 font-medium mb-1">Overview</p>
        <div className="flex items-end justify-between gap-4">
  <div>
    <h1 className="text-[2rem] font-bold leading-tight tracking-tight">
      {greetText}, <span className="text-indigo-300">{userName}</span> {greetIcon}
    </h1>
    <p className="text-sm text-slate-400 mt-0.5">{format(today, "EEEE, d MMMM yyyy")}</p>
  </div>
  <div className="flex items-center gap-3">
    {token && <NotificationsBell token={token} />}
    <button
      onClick={() => router.push("/dashboard/calendar")}
      className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-slate-300 hover:text-white transition-all"
    >
      <span>📅</span> Log Today
    </button>
  </div>
</div>
      </header>
      {/* AI Coach */}
{aiToken && (
  <AICoach token={aiToken} userName={userName} />
)}
      {/* ── TODAY'S MOOD HERO CARD ── */}
      {summary ? (
        <div
          className="mb-6 rounded-2xl p-5 border relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${mood(summary.mood).bg} 0%, rgba(15,20,40,0.8) 100%)`,
            borderColor: mood(summary.mood).color + "33",
          }}
        >
          {/* glow blob */}
          <div
            className="absolute -top-8 -right-8 w-40 h-40 rounded-full blur-3xl opacity-30"
            style={{ background: mood(summary.mood).color }}
          />
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Today's Vibe</p>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl">{mood(summary.mood).emoji}</span>
                <div>
                  <p className="text-xl font-bold" style={{ color: mood(summary.mood).color }}>
                    {mood(summary.mood).label}
                  </p>
                  {summary.productivity && (
                    <p className="text-xs text-slate-400">
                      Productivity: <span className="text-white font-semibold">{summary.productivity}/5</span>
                    </p>
                  )}
                </div>
              </div>
              {summary.journal && (
                <p className="text-sm text-slate-300 italic leading-relaxed line-clamp-2">
                  "{summary.journal}"
                </p>
              )}
            </div>
            {productivityScore !== null && (
              <div className="flex flex-col items-center">
                <Ring
                  value={productivityScore}
                  max={100}
                  size={72}
                  stroke={6}
                  color={mood(summary.mood).color}
                  label={`${productivityScore}%`}
                  sub="Score"
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="mb-6 rounded-2xl p-5 border border-white/8 bg-white/3 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">No daily summary yet</p>
            <p className="text-xs text-slate-500 mt-0.5">Log your mood, productivity, and journal for today</p>
          </div>
          <button
            onClick={() => router.push("/dashboard/calendar")}
            className="px-4 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/30 text-sm text-indigo-200 transition-all whitespace-nowrap"
          >
            + Log Day
          </button>
        </div>
      )}

      {/* ── STAT CARDS ROW ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          {
            label: "Today's Tasks",
            value: todayDone,
            total: todayTotal,
            icon: "✅",
            color: "#818cf8",
            sub: todayTotal === 0 ? "None scheduled" : `${todayTotal - todayDone} remaining`,
            sparkData: prodData, // reuse shape
          },
          {
            label: "Pending",
            value: totalPending,
            icon: "⏳",
            color: "#fb923c",
            sub: totalPending === 0 ? "All clear!" : "tasks to do",
          },
          {
            label: "Habits Today",
            value: habitsDone,
            total: habitsTotal,
            icon: "🔥",
            color: "#34d399",
            sub: habitsTotal === 0 ? "No habits yet" : `${habitsTotal - habitsDone} remaining`,
          },
          {
            label: "Top Streak",
            value: topStreak,
            icon: "⚡",
            color: "#f59e0b",
            sub: topStreak > 0 ? "days in a row" : "Start a streak!",
          },
        ].map((card, i) => (
          <div
            key={i}
            className="rounded-2xl p-4 border border-white/8 bg-[#0c1220] relative overflow-hidden"
            style={{
              animationDelay: `${i * 60}ms`,
            }}
          >
            <div
              className="absolute inset-0 opacity-10"
              style={{ background: `radial-gradient(circle at 0% 0%, ${card.color}, transparent 70%)` }}
            />
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">{card.label}</span>
                <span className="text-base">{card.icon}</span>
              </div>
              <p className="text-2xl font-bold" style={{ color: card.color }}>
                <Counter value={card.value} />
                {card.total !== undefined && (
                  <span className="text-base text-white/30 font-normal"> /{card.total}</span>
                )}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">{card.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── ANALYTICS SECTION ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

        {/* Productivity Chart */}
        <div className="rounded-2xl p-5 border border-white/8 bg-[#0c1220]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Productivity</h2>
              <p className="text-[10px] text-slate-500 mt-0.5">Last 7 days · 1–5 scale</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-indigo-300">{avgProd}</p>
              <p className="text-[10px] text-slate-500">avg</p>
            </div>
          </div>

          {/* Custom bar chart */}
          <div className="flex items-end gap-1.5 h-24">
            {Array.from({ length: 7 }, (_, i) => {
              const d    = subDays(today, 6 - i);
              const key  = format(d, "yyyy-MM-dd");
              const found= last7.find(x => x.date?.startsWith(key));
              const val  = found?.productivity ?? 0;
              const pct  = (val / 5) * 100;
              const isToday = i === 6;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="w-full flex items-end justify-center" style={{ height: "72px" }}>
                    <div
                      className="w-full rounded-t-md transition-all duration-700 relative group"
                      style={{
                        height: val === 0 ? "4px" : `${pct}%`,
                        background: isToday
                          ? "linear-gradient(to top, #6366f1, #818cf8)"
                          : val === 0
                          ? "rgba(255,255,255,0.06)"
                          : "linear-gradient(to top, #334155, #64748b)",
                        minHeight: "4px",
                      }}
                    >
                      {val > 0 && (
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 border border-white/10 rounded px-1.5 py-0.5 text-[9px] text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                          {val}/5
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500">{format(d, "EEE")[0]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mood Timeline */}
        <div className="rounded-2xl p-5 border border-white/8 bg-[#0c1220]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Mood Trend</h2>
              <p className="text-[10px] text-slate-500 mt-0.5">Last 7 days</p>
            </div>
            <span className="text-xs text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">
              {last7.filter(d => d.mood).length}/7 logged
            </span>
          </div>
          <div className="flex items-center justify-between gap-1">
            {Array.from({ length: 7 }, (_, i) => {
              const d    = subDays(today, 6 - i);
              const key  = format(d, "yyyy-MM-dd");
              const found= last7.find(x => x.date?.startsWith(key));
              const m    = found?.mood;
              const info = mood(m);
              const isToday = i === 6;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  <div
                    className="w-full aspect-square rounded-xl flex items-center justify-center text-base border transition-all"
                    style={{
                      background: m ? info.bg : "rgba(255,255,255,0.03)",
                      borderColor: m ? info.color + "44" : "rgba(255,255,255,0.06)",
                      boxShadow: isToday && m ? `0 0 12px ${info.color}33` : "none",
                    }}
                  >
                    {m ? info.emoji : <span className="text-[10px] text-white/20">—</span>}
                  </div>
                  <span className="text-[10px] text-slate-500">{format(d, "EEE")[0]}</span>
                </div>
              );
            })}
          </div>
          {/* Mood legend */}
          <div className="flex items-center gap-3 mt-4 pt-3 border-t border-white/5">
            {Object.entries(MOOD_MAP).map(([k, v]) => (
              <div key={k} className="flex items-center gap-1">
                <span className="text-xs">{v.emoji}</span>
                <span className="text-[10px] text-slate-500">{v.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── WEEKLY PROGRESS RINGS ── */}
      <div className="rounded-2xl p-5 border border-white/8 bg-[#0c1220] mb-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-sm font-semibold text-white">This Week's Progress</h2>
            <p className="text-[10px] text-slate-500 mt-0.5">Tasks, habits & productivity at a glance</p>
          </div>
        </div>
        <div className="flex items-center justify-around">
          <Ring
            value={weekDone}
            max={Math.max(weekTasks.length, 1)}
            size={84}
            stroke={7}
            color="#818cf8"
            label={`${weekDone}/${weekTasks.length}`}
            sub="Tasks done"
          />
          <div className="h-12 w-px bg-white/10" />
          <Ring
            value={habitsDone}
            max={Math.max(habitsTotal, 1)}
            size={84}
            stroke={7}
            color="#34d399"
            label={`${habitsDone}/${habitsTotal}`}
            sub="Habits today"
          />
          <div className="h-12 w-px bg-white/10" />
          <Ring
            value={prodValues.reduce((a, b) => a + b, 0)}
            max={prodValues.length * 5 || 5}
            size={84}
            stroke={7}
            color="#f59e0b"
            label={avgProd}
            sub="Avg. prod."
          />
          <div className="h-12 w-px bg-white/10" />
          <Ring
            value={topStreak}
            max={Math.max(topStreak, 7)}
            size={84}
            stroke={7}
            color="#fb7185"
            label={`${topStreak}d`}
            sub="Top streak"
          />
        </div>
      </div>

      {/* ── TODAY'S TASKS ── */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white">Today's Tasks</h2>
          <button
            onClick={() => router.push("/dashboard/tasks")}
            className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            View all →
          </button>
        </div>

        {todayTasks.length === 0 ? (
          <div className="rounded-2xl p-5 border border-white/6 bg-[#0c1220] text-center">
            <p className="text-2xl mb-1">🎉</p>
            <p className="text-sm text-slate-400">No tasks for today</p>
            <p className="text-[11px] text-slate-600 mt-0.5">Enjoy your free day or add something new</p>
          </div>
        ) : (
          <div className="space-y-2">
            {todayTasks.map((task, i) => {
              const p = PRIORITY[task.priority] || PRIORITY.MEDIUM;
              return (
                <label
                  key={task.id}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 border cursor-pointer group transition-all"
                  style={{
                    background: task.completed ? "rgba(255,255,255,0.02)" : "rgba(12,18,32,1)",
                    borderColor: task.completed ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.08)",
                  }}
                >
                  {/* custom checkbox */}
                  <div
                    className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                    style={{
                      borderColor: task.completed ? "#6366f1" : "rgba(255,255,255,0.2)",
                      background: task.completed ? "#6366f1" : "transparent",
                    }}
                    onClick={() => toggleTask(task.id, task.completed)}
                  >
                    {task.completed && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task.id, task.completed)}
                    className="sr-only"
                  />
                  <span
                    className={`text-sm flex-1 transition-all ${task.completed ? "line-through text-slate-600" : "text-slate-200"}`}
                  >
                    {task.title}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${p.cls}`}>
                    {p.label}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* ── TODAY'S HABITS ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white">Today's Habits</h2>
          <button
            onClick={() => router.push("/dashboard/habits")}
            className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            View all →
          </button>
        </div>

        {habits.length === 0 ? (
          <div className="rounded-2xl p-5 border border-white/6 bg-[#0c1220] text-center">
            <p className="text-sm text-slate-400">No habits yet</p>
            <button
              onClick={() => router.push("/dashboard/habits")}
              className="mt-2 text-xs text-indigo-400 hover:text-indigo-300"
            >
              + Create your first habit
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {habits.map((h) => (
              <div
                key={h.id}
                className="flex items-center gap-3 rounded-xl px-4 py-3 border border-white/8 bg-[#0c1220] group"
              >
                <div className="w-9 h-9 rounded-xl bg-black/40 border border-white/8 flex items-center justify-center text-lg flex-shrink-0">
                  {h.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{h.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-slate-500">🔥 {h.currentStreak} streak</span>
                    {h.longestStreak > 0 && (
                      <span className="text-[10px] text-slate-600">· best {h.longestStreak}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => toggleHabitToday(h.id)}
                  className={`px-3 py-1.5 text-xs rounded-lg font-semibold border transition-all flex-shrink-0 ${
                    h.todayDone
                      ? "bg-emerald-400/20 text-emerald-300 border-emerald-400/30"
                      : "bg-white/5 text-slate-400 border-white/10 hover:bg-emerald-500/20 hover:text-emerald-300 hover:border-emerald-400/30"
                  }`}
                >
                  {h.todayDone ? "✓ Done" : "Mark"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}