"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfDay,
  isAfter,
  isSameDay,
} from "date-fns";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function CalendarPage() {
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const [authToken, setAuthToken] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthSummaries, setMonthSummaries] = useState([]);
  const [tasksByDate, setTasksByDate] = useState({});
  const [loading, setLoading] = useState(true);

  const [openModal, setOpenModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentSummary, setCurrentSummary] = useState(null);

  const [mood, setMood] = useState("");
  const [productivity, setProductivity] = useState(3);
  const [journal, setJournal] = useState("");
  const [banner, setBanner] = useState("");

  // ---------------- AUTH CHECK ----------------
  useEffect(() => {
    const token = localStorage.getItem("lifeboard_token");
    if (!token) router.push("/login");
    else setAuthToken(token);
  }, [router]);

  const today = startOfDay(new Date());
  const isFutureDate = (date) => isAfter(startOfDay(date), today);

  // ---------------- LOAD MONTH DATA ----------------
  const loadMonth = async (tokenOverride) => {
    const token = tokenOverride || authToken;
    if (!token) return;

    setLoading(true);
    const monthStr = format(currentMonth, "yyyy-MM");

    try {
      const [summaryRes, tasksRes] = await Promise.all([
        axios.get(`${API_URL}/api/day-summary?month=${monthStr}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),

        // Load ALL tasks (limit high)
        axios.get(`${API_URL}/api/tasks?limit=500`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      // Monthly summaries
      setMonthSummaries(summaryRes.data.summaries || []);

      // FIXED: Correctly read tasks array
      const tasks = tasksRes.data.tasks || [];

      // Build task mapping for calendar
      const map = {};

      tasks.forEach((t) => {
        if (!t.dueDate) return;

        const d = new Date(t.dueDate);

        if (
          d.getMonth() !== currentMonth.getMonth() ||
          d.getFullYear() !== currentMonth.getFullYear()
        ) {
          return;
        }

        const key = format(d, "yyyy-MM-dd");
        if (!map[key]) map[key] = [];
        map[key].push(t);
      });

      setTasksByDate(map);
    } catch (err) {
      console.error("LOAD MONTH ERROR:", err);
      setBanner("Could not load calendar.");
      setTimeout(() => setBanner(""), 2000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authToken) loadMonth(authToken);
  }, [authToken, currentMonth]);

  // ---------------- HELPERS ----------------
  const getSummaryForDay = (date) => {
    const key = format(date, "yyyy-MM-dd");
    return monthSummaries.find(
      (s) => format(new Date(s.date), "yyyy-MM-dd") === key
    );
  };

  const getTasksForDay = (date) => {
    const key = format(date, "yyyy-MM-dd");
    return tasksByDate[key] || [];
  };

  // ---------------- OPEN MODAL ----------------
  const openDayModal = async (date) => {
    if (!authToken) return;

    setSelectedDate(date);
    setOpenModal(true);
    setCurrentSummary(null);

    try {
      const res = await axios.get(
        `${API_URL}/api/day-summary/${format(date, "yyyy-MM-dd")}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      if (res.data.summary) {
        const s = res.data.summary;
        setCurrentSummary(s);
        setMood(s.mood || "");
        setProductivity(s.productivity || 3);
        setJournal(s.journal || "");
      } else {
        setMood("");
        setProductivity(3);
        setJournal("");
      }
    } catch {
      setMood("");
      setProductivity(3);
      setJournal("");
    }
  };

  // ---------------- SAVE SUMMARY ----------------
  const saveSummary = async () => {
    if (!authToken || !selectedDate) return;

    const future = isFutureDate(selectedDate);
    const dateKey = format(selectedDate, "yyyy-MM-dd");

    const payload = {
      date: dateKey,
      journal: journal.trim() || null,
    };

    if (!future && !currentSummary)
      payload.mood = mood || null, payload.productivity = productivity;

    try {
      if (currentSummary) {
        await axios.put(
          `${API_URL}/api/day-summary/${currentSummary.id}`,
          { journal: journal.trim() || null },
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
      } else {
        await axios.post(`${API_URL}/api/day-summary`, payload, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
      }

      // refresh month
      loadMonth(authToken);

      setOpenModal(false);
      setBanner("Saved!");
      setTimeout(() => setBanner(""), 1500);
    } catch (err) {
      console.error("SAVE ERROR:", err);
      setBanner("Could not save.");
      setTimeout(() => setBanner(""), 2000);
    }
  };

  // ---------------- CALENDAR RENDER ----------------
  const monthDays = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const firstDay = monthDays[0];
  const weekdayIndex = (firstDay.getDay() + 6) % 7;
  const leadingBlanks = Array.from({ length: weekdayIndex });

  const moodColors = {
    good: "bg-emerald-500/10 border-emerald-400/60",
    moderate: "bg-amber-500/10 border-amber-400/60",
    bad: "bg-rose-500/10 border-rose-400/60",
  };

  return (
    <div className="relative z-10 space-y-6 text-white">
      {/* HEADER */}
      <header>
        <p className="text-xs uppercase tracking-[0.18em] text-indigo-300/80">
          Calendar
        </p>
        <h1 className="text-3xl font-semibold">Track your days smartly</h1>
      </header>

      {/* BANNER */}
      {banner && (
        <div className="px-3 py-2 text-sm rounded-lg bg-slate-800/80 border border-slate-600/60 inline-flex">
          {banner}
        </div>
      )}

      {/* MONTH NAVIGATION */}
      <div className="flex items-center justify-between max-w-md mt-2">
        <button
          onClick={() =>
            setCurrentMonth(
              new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
            )
          }
          className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10"
        >
          ← Prev
        </button>

        <h2 className="text-lg font-semibold">
          {format(currentMonth, "LLLL yyyy")}
        </h2>

        <button
          onClick={() =>
            setCurrentMonth(
              new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
            )
          }
          className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10"
        >
          Next →
        </button>
      </div>

      {/* WEEKDAY COLUMN HEADERS */}
      <div className="grid grid-cols-7 gap-2 mt-4 text-[11px] text-slate-400">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center uppercase">
            {d}
          </div>
        ))}
      </div>

      {/* CALENDAR GRID */}
      <div className="grid grid-cols-7 gap-2 mt-1">
        {leadingBlanks.map((_, i) => (
          <div key={i} />
        ))}

        {monthDays.map((day) => {
          const summary = getSummaryForDay(day);
          const tasks = getTasksForDay(day);
          const future = isFutureDate(day);
          const todayFlag = isSameDay(day, today);

          return (
            <button
              key={day}
              onClick={() => openDayModal(day)}
              className={`h-28 rounded-2xl p-2 text-left border ${
                summary?.mood
                  ? moodColors[summary.mood]
                  : "bg-white/5 border-white/10"
              } hover:bg-indigo-500/10 hover:border-indigo-300 transition ${
                todayFlag ? "ring-2 ring-indigo-500/80" : ""
              }`}
            >
              <p className="text-xs font-semibold flex justify-between">
                <span>{format(day, "d")}</span>

                {future && tasks.length > 0 && (
                  <span className="text-[10px] px-1.5 rounded-full bg-amber-500/20 text-amber-200 border border-amber-400/60">
                    Upcoming
                  </span>
                )}
              </p>

              {/* MOOD / PRODUCTIVITY */}
              {summary && (
                <div className="mt-1 text-[10px] space-y-[1px]">
                  {summary.mood && <p>{summary.mood}</p>}
                  {summary.productivity && (
                    <p>Productivity {summary.productivity}/5</p>
                  )}
                </div>
              )}

              {/* TASKS LIST */}
              {tasks.length > 0 && (
                <div className="mt-1.5 text-[10px] space-y-[2px]">
                  {tasks.slice(0, 2).map((t) => (
                    <p key={t.id} className="truncate flex items-center gap-1">
                      <span>🎯</span> {t.title}
                    </p>
                  ))}
                  {tasks.length > 2 && (
                    <p className="text-slate-400">+{tasks.length - 2} more…</p>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* MODAL */}
      {openModal && selectedDate && (
        <DayModal
          date={selectedDate}
          mood={mood}
          setMood={setMood}
          productivity={productivity}
          setProductivity={setProductivity}
          journal={journal}
          setJournal={setJournal}
          isFuture={isFutureDate(selectedDate)}
          hasSummary={!!currentSummary}
          tasks={getTasksForDay(selectedDate)}
          onClose={() => setOpenModal(false)}
          onSave={saveSummary}
        />
      )}
    </div>
  );
}

/* ------------------------------------------
   MODAL COMPONENT
------------------------------------------ */
function DayModal({
  date,
  mood,
  setMood,
  productivity,
  setProductivity,
  journal,
  setJournal,
  isFuture,
  hasSummary,
  tasks,
  onClose,
  onSave,
}) {
  const formatted = format(date, "d MMMM yyyy");

  const canEditMood = !isFuture && !hasSummary;
  const canEditProductivity = !isFuture && !hasSummary;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#0e1525] border border-white/10 rounded-2xl p-6 w-[90%] max-w-md">
        <h2 className="text-xl font-semibold">{formatted}</h2>

        {/* TASKS */}
        {tasks.length > 0 && (
          <div className="mt-3 text-xs">
            <p className="text-slate-300 mb-1">🎯 Tasks due</p>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {tasks.map((t) => (
                <div key={t.id} className="flex gap-2">
                  <span className="mt-[1px]">•</span>
                  <div>
                    <p className="font-medium text-[12px]">{t.title}</p>
                    {t.description && (
                      <p className="text-[11px] text-slate-400">
                        {t.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="h-px bg-white/10 my-3" />
          </div>
        )}

        {/* MOOD */}
        <p className="text-sm mb-1">Mood</p>
        <div className="flex gap-2 mb-3">
          {["good", "moderate", "bad"].map((m) => (
            <button
              key={m}
              disabled={!canEditMood}
              onClick={() => canEditMood && setMood(m)}
              className={`px-3 py-1.5 rounded-lg border text-sm ${
                mood === m
                  ? "bg-indigo-500/30 border-indigo-400"
                  : "bg-white/5 border-white/10"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* PRODUCTIVITY */}
        <p className="text-sm mb-1">Productivity: {productivity}/5</p>
        <input
          type="range"
          min="1"
          max="5"
          disabled={!canEditProductivity}
          value={productivity}
          onChange={(e) => setProductivity(Number(e.target.value))}
          className="w-full mb-4"
        />

        {/* JOURNAL */}
        <p className="text-sm mb-1">Journal</p>
        <textarea
          className="w-full h-28 p-3 bg-white/5 border border-white/10 rounded-lg"
          value={journal}
          onChange={(e) => setJournal(e.target.value)}
        />

        {/* BUTTONS */}
        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/10 rounded-lg"
          >
            Close
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 bg-indigo-600 rounded-lg font-semibold"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
