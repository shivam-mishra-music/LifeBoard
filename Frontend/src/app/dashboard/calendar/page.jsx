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

  // Modal state
  const [openModal, setOpenModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentSummary, setCurrentSummary] = useState(null);

  const [mood, setMood] = useState("");
  const [productivity, setProductivity] = useState(3);
  const [journal, setJournal] = useState("");
  const [banner, setBanner] = useState("");

  // -------- Auth check --------
  useEffect(() => {
    const token = localStorage.getItem("lifeboard_token");
    if (!token) {
      router.push("/login");
    } else {
      setAuthToken(token);
    }
  }, [router]);

  // -------- Helpers for dates --------
  const today = startOfDay(new Date());

  const isFutureDate = (date) => isAfter(startOfDay(date), today);

  // -------- Load month summaries + tasks --------
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
        axios.get(`${API_URL}/api/tasks`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setMonthSummaries(summaryRes.data.summaries || []);

      // Build map of tasks by date (only tasks with dueDate in this month)
      const map = {};
      const tasks = tasksRes.data || [];

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
      console.error("Month load error:", err);
      setBanner("Could not load calendar data.");
      setTimeout(() => setBanner(""), 2000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authToken) loadMonth(authToken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken, currentMonth]);

  // -------- Get summary / tasks for a given day --------
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

  // -------- Open modal for a date --------
  const openDayModal = async (date) => {
    if (!authToken) return;

    setSelectedDate(date);
    setOpenModal(true);
    setCurrentSummary(null);

    // default values
    setMood("");
    setProductivity(3);
    setJournal("");

    try {
      const dateStr = format(date, "yyyy-MM-dd");
      const res = await axios.get(`${API_URL}/api/day-summary/${dateStr}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (res.data.summary) {
        const s = res.data.summary;
        setCurrentSummary(s);
        setMood(s.mood || "");
        setProductivity(s.productivity || 3);
        setJournal(s.journal || "");
      }
    } catch (err) {
      console.log("No summary yet for this date.");
    }
  };

  // -------- Save / update summary --------
  const saveSummary = async () => {
    if (!authToken || !selectedDate) return;

    const future = isFutureDate(selectedDate);
    const dateKey = format(selectedDate, "yyyy-MM-dd");

    // For CREATE we send mood/productivity (only past/today)
    const basePayload = {
      date: dateKey,
      journal: journal.trim() || null,
    };
    const createPayload = future
      ? basePayload
      : { ...basePayload, mood: mood || null, productivity };

    try {
      if (currentSummary && currentSummary.id) {
        // Existing summary → only update journal
        await axios.put(
          `${API_URL}/api/day-summary/${currentSummary.id}`,
          { journal: journal.trim() || null },
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
      } else {
        // First time → create
        await axios.post(`${API_URL}/api/day-summary`, createPayload, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
      }

      setOpenModal(false);
      setBanner("Saved!");
      setTimeout(() => setBanner(""), 1500);
      await loadMonth(); // refresh month with new data
    } catch (err) {
      console.error("Save error:", err);
      setBanner("Could not save.");
      setTimeout(() => setBanner(""), 2000);
    }
  };

  // -------- Prepare calendar days --------
  const monthDays = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const firstDay = monthDays[0];
  // JS: 0=Sun..6=Sat → convert to Mon-first index
  const weekdayIndex = (firstDay.getDay() + 6) % 7;
  const leadingBlanks = Array.from({ length: weekdayIndex });

  const moodColors = {
    good: "bg-emerald-500/10 border-emerald-400/60",
    moderate: "bg-amber-500/10 border-amber-400/60",
    bad: "bg-rose-500/10 border-rose-400/60",
  };

  const moodLabel = (m) => {
    if (m === "good") return "😊 Good";
    if (m === "moderate") return "😐 Moderate";
    if (m === "bad") return "😢 Bad";
    return "";
  };

  return (
    <div className="relative z-10 space-y-6 text-white">
      {/* HEADER */}
      <header>
        <p className="text-xs uppercase tracking-[0.18em] text-indigo-300/80">
          Calendar
        </p>
        <h1 className="text-3xl font-semibold">
          Track your day, tasks & productivity
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Tap on any day to log mood, productivity & journal. Future days show
          upcoming task deadlines.
        </p>
      </header>

      {/* BANNER */}
      {banner && (
        <div className="text-sm px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-600/60 text-slate-100 inline-flex">
          {banner}
        </div>
      )}

      {/* MONTH SELECTOR */}
      <div className="flex items-center justify-between max-w-md mt-2">
        <button
          onClick={() =>
            setCurrentMonth(
              new Date(
                currentMonth.getFullYear(),
                currentMonth.getMonth() - 1,
                1
              )
            )
          }
          className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-sm border border-white/10"
        >
          ← Prev
        </button>

        <h2 className="text-lg font-semibold tracking-wide">
          {format(currentMonth, "LLLL yyyy")}
        </h2>

        <button
          onClick={() =>
            setCurrentMonth(
              new Date(
                currentMonth.getFullYear(),
                currentMonth.getMonth() + 1,
                1
              )
            )
          }
          className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-sm border border-white/10"
        >
          Next →
        </button>
      </div>

      {/* WEEKDAY HEADERS */}
      <div className="grid grid-cols-7 gap-2 mt-4 text-[11px] text-slate-400">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center uppercase tracking-wide">
            {d}
          </div>
        ))}
      </div>

      {/* CALENDAR GRID */}
      <div className="grid grid-cols-7 gap-2 mt-1">
        {/* leading blanks */}
        {leadingBlanks.map((_, idx) => (
          <div key={`blank-${idx}`} />
        ))}

        {monthDays.map((day) => {
          const summary = getSummaryForDay(day);
          const tasksForDay = getTasksForDay(day);

          const future = isFutureDate(day);
          const todayFlag = isSameDay(day, today);

          const moodClass = summary?.mood
            ? moodColors[summary.mood] || "bg-white/5 border-white/15"
            : "bg-white/5 border-white/10";

          return (
            <button
              key={day.toISOString()}
              onClick={() => openDayModal(day)}
              className={`h-28 rounded-2xl p-2 text-left border relative overflow-hidden transition 
                ${moodClass}
                ${future ? "opacity-90" : ""}
                ${todayFlag ? "ring-2 ring-indigo-500/80" : ""}
                hover:border-indigo-400/70 hover:bg-indigo-500/10`}
            >
              {/* Date number */}
              <p className="text-xs font-semibold text-slate-100 flex items-center justify-between">
                <span>{format(day, "d")}</span>
                {future && tasksForDay.length > 0 && (
                  <span className="text-[10px] px-1.5 py-[1px] rounded-full bg-amber-500/20 text-amber-200 border border-amber-400/60">
                    Upcoming
                  </span>
                )}
              </p>

              {/* Summary mood / productivity */}
              {summary && (
                <div className="mt-1.5 text-[11px] space-y-[2px]">
                  {summary.mood && <p>{moodLabel(summary.mood)}</p>}
                  {summary.productivity && (
                    <p className="text-[10px] text-slate-300">
                      Productivity {summary.productivity}/5
                    </p>
                  )}
                  {/* A + B: journal icon + tiny preview */}
                  {summary.journal && (
                    <p className="text-[10px] text-slate-200/90 flex items-center gap-1 truncate">
                      <span>📝</span>
                      <span className="truncate">{summary.journal}</span>
                    </p>
                  )}
                </div>
              )}

              {/* Tasks preview */}
              {tasksForDay.length > 0 && (
                <div className="mt-1.5 space-y-[2px]">
                  {tasksForDay.slice(0, 2).map((task) => (
                    <p
                      key={task.id}
                      className="text-[10px] text-slate-200 truncate flex items-center gap-1"
                    >
                      <span>🎯</span>
                      <span className="truncate">{task.title}</span>
                    </p>
                  ))}
                  {tasksForDay.length > 2 && (
                    <p className="text-[10px] text-slate-400">
                      +{tasksForDay.length - 2} more…
                    </p>
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
          onClose={() => setOpenModal(false)}
          onSave={saveSummary}
        />
      )}
    </div>
  );
}

/* ---------------- MODAL COMPONENT ---------------- */

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
  onClose,
  onSave,
}) {
  const formatted = format(date, "d MMMM yyyy");

  const canEditMood = !isFuture && !hasSummary;
  const canEditProductivity = !isFuture && !hasSummary;

  const moodOptions = [
    {
      key: "good",
      label: "Good",
      icon: "😊",
      color:
        "bg-emerald-500/20 border-emerald-400 text-emerald-200 hover:bg-emerald-500/25",
    },
    {
      key: "moderate",
      label: "Moderate",
      icon: "😐",
      color:
        "bg-amber-500/20 border-amber-400 text-amber-200 hover:bg-amber-500/25",
    },
    {
      key: "bad",
      label: "Bad",
      icon: "😢",
      color:
        "bg-rose-500/20 border-rose-400 text-rose-200 hover:bg-rose-500/25",
    },
  ];

  const disabledClasses =
    "opacity-40 cursor-not-allowed bg-white/5 border-white/10";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#0e1525] border border-white/10 rounded-2xl p-6 w-[90%] max-w-md shadow-2xl shadow-black/60">
        <h2 className="text-xl font-semibold mb-4">{formatted}</h2>

        {/* Mood */}
        <p className="text-sm text-slate-300 mb-1 flex items-center justify-between">
          <span>Mood</span>
          {isFuture && (
            <span className="text-[11px] text-slate-500">
              Mood only for today / past
            </span>
          )}
          {hasSummary && !isFuture && (
            <span className="text-[11px] text-slate-500">
              Mood locked (already logged)
            </span>
          )}
        </p>
        <div className="flex gap-2 mb-4">
          {moodOptions.map((m) => (
            <button
              key={m.key}
              type="button"
              disabled={!canEditMood}
              onClick={() => canEditMood && setMood(m.key)}
              className={`px-3 py-1 rounded-lg border text-sm flex items-center gap-1 transition 
                ${
                  !canEditMood
                    ? disabledClasses
                    : mood === m.key
                    ? m.color
                    : "bg-white/5 border-white/20 hover:bg-white/10"
                }`}
            >
              <span>{m.icon}</span>
              <span className="capitalize">{m.label}</span>
            </button>
          ))}
        </div>

        {/* Productivity slider */}
        <p className="text-sm text-slate-300 mb-1 flex items-center justify-between">
          <span>Productivity: {productivity}/5</span>
          {isFuture && (
            <span className="text-[11px] text-slate-500">
              Can’t rate future days
            </span>
          )}
          {hasSummary && !isFuture && (
            <span className="text-[11px] text-slate-500">
              Already logged, journal is still editable
            </span>
          )}
        </p>
        <input
          type="range"
          min="1"
          max="5"
          value={productivity}
          disabled={!canEditProductivity}
          onChange={(e) => setProductivity(Number(e.target.value))}
          className={`w-full mb-4 ${
            !canEditProductivity ? "opacity-40 cursor-not-allowed" : ""
          }`}
        />

        {/* Journal */}
        <p className="text-sm text-slate-300 mb-1">Journal / day notes</p>
        <textarea
          value={journal}
          onChange={(e) => setJournal(e.target.value)}
          placeholder={
            isFuture
              ? "Write plans or notes for this day…"
              : "Write journal / notes about your day…"
          }
          className="w-full h-28 bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
        />

        {/* Buttons */}
        <div className="flex justify-end gap-3 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm"
          >
            Close
          </button>

          <button
            type="button"
            onClick={onSave}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow shadow-indigo-500/40"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
