"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";

export default function CalendarPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const token = typeof window !== "undefined" ? localStorage.getItem("lifeboard_token") : null;

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthData, setMonthData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [openModal, setOpenModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [summary, setSummary] = useState(null);

  const [mood, setMood] = useState("");
  const [productivity, setProductivity] = useState(3);
  const [journal, setJournal] = useState("");

  // -------- Fetch Month Data --------
  const loadMonth = async () => {
    setLoading(true);
    const monthStr = format(currentMonth, "yyyy-MM");

    try {
      const res = await axios.get(`${API_URL}/api/day-summary?month=${monthStr}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMonthData(res.data.summaries || []);
    } catch (err) {
      console.error("Month fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMonth();
  }, [currentMonth]);

  // -------- Open modal + fetch day summary --------
  const openDayModal = async (date) => {
    setSelectedDate(date);
    setOpenModal(true);
    setSummary(null);
    setMood("");
    setJournal("");

    try {
      const dateStr = format(date, "yyyy-MM-dd");

      const res = await axios.get(`${API_URL}/api/day-summary/${dateStr}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.summary) {
        const s = res.data.summary;
        setSummary(s);
        setMood(s.mood || "");
        setProductivity(s.productivity || 3);
        setJournal(s.journal || "");
      }
    } catch (err) {
      console.log("No summary for date (ok).");
    }
  };

  // -------- Save summary --------
  const saveSummary = async () => {
    const payload = {
      date: selectedDate,
      mood,
      productivity,
      journal,
    };

    try {
      await axios.post(`${API_URL}/api/day-summary`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setOpenModal(false);
      loadMonth();
    } catch (err) {
      console.error("Save error:", err);
      alert("Could not save.");
    }
  };

  // Colors for moods
  const moodColors = {
    good: "bg-emerald-500/20 border-emerald-400 text-emerald-300",
    moderate: "bg-amber-500/20 border-amber-400 text-amber-300",
    bad: "bg-rose-500/20 border-rose-400 text-rose-300",
  };

  // Build the calendar grid for current month
  const monthDays = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const getSummaryForDay = (date) => {
    return monthData.find(
      (d) => format(new Date(d.date), "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
    );
  };

  return (
    <div className="text-white space-y-8 relative">

      {/* HEADER */}
      <header>
        <p className="text-xs uppercase tracking-widest text-indigo-300/80">Calendar</p>
        <h1 className="text-3xl font-semibold">Track your day, mood & productivity</h1>
        <p className="text-sm text-slate-400">Tap on any day to add reflections.</p>
      </header>

      {/* Month Selector */}
      <div className="flex items-center justify-between max-w-md">
        <button
          onClick={() =>
            setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
          }
          className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20"
        >
          ← Prev
        </button>

        <h2 className="text-lg font-semibold tracking-wide">
          {format(currentMonth, "LLLL yyyy")}
        </h2>

        <button
          onClick={() =>
            setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
          }
          className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20"
        >
          Next →
        </button>
      </div>

      {/* CALENDAR GRID */}
      <div className="grid grid-cols-7 gap-2 mt-6">
        {monthDays.map((day) => {
          const summary = getSummaryForDay(day);
          const moodClass = summary?.mood ? moodColors[summary.mood] : "bg-white/5";
          return (
            <div
              key={day}
              onClick={() => openDayModal(day)}
              className={`h-24 rounded-xl p-2 cursor-pointer border border-white/10 hover:border-indigo-400/40 transition ${moodClass}`}
            >
              <p className="text-xs">{format(day, "d")}</p>

              {summary && (
                <div className="mt-2 text-xs">
                  <p>{summary.mood === "good" ? "😊 Good" : summary.mood === "moderate" ? "😐 Moderate" : "😢 Bad"}</p>
                  <p className="text-[10px] text-slate-300">
                    Productivity {summary.productivity}/5
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* MODAL */}
      {openModal && (
        <Modal
          date={selectedDate}
          mood={mood}
          setMood={setMood}
          productivity={productivity}
          setProductivity={setProductivity}
          journal={journal}
          setJournal={setJournal}
          onClose={() => setOpenModal(false)}
          onSave={saveSummary}
        />
      )}
    </div>
  );
}

/* ------------------------- MODAL COMPONENT --------------------------- */

function Modal({ date, mood, setMood, productivity, setProductivity, journal, setJournal, onClose, onSave }) {
  const formatted = format(date, "d MMMM yyyy");

  const moodOptions = [
    { key: "good", label: "good", icon: "😊", color: "bg-emerald-500/20 border-emerald-400 text-emerald-300" },
    { key: "moderate", label: "moderate", icon: "😐", color: "bg-amber-500/20 border-amber-400 text-amber-300" },
    { key: "bad", label: "bad", icon: "😢", color: "bg-rose-500/20 border-rose-400 text-rose-300" },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#0e1525] border border-white/10 rounded-2xl p-6 w-[90%] max-w-md shadow-xl shadow-black/40">

        <h2 className="text-xl font-semibold mb-3">{formatted}</h2>

        {/* Mood Selection */}
        <p className="text-sm text-slate-300 mb-1">Mood</p>
        <div className="flex gap-2 mb-4">
          {moodOptions.map((m) => (
            <button
              key={m.key}
              onClick={() => setMood(m.key)}
              className={`px-3 py-1 rounded-lg border text-sm flex items-center gap-1 transition 
                ${mood === m.key ? m.color : "bg-white/5 border-white/20 hover:bg-white/10"}`}
            >
              <span>{m.icon}</span>
              <span>{m.label}</span>
            </button>
          ))}
        </div>

        {/* Productivity */}
        <p className="text-sm text-slate-300 mb-1">Productivity: {productivity}/5</p>
        <input
          type="range"
          min="1"
          max="5"
          value={productivity}
          onChange={(e) => setProductivity(Number(e.target.value))}
          className="w-full mb-4"
        />

        {/* Journal */}
        <textarea
          value={journal}
          onChange={(e) => setJournal(e.target.value)}
          placeholder="Write journal / notes about your day..."
          className="w-full h-28 bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        />

        {/* Buttons */}
        <div className="flex justify-end gap-3 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm"
          >
            Close
          </button>

          <button
            onClick={onSave}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow shadow-indigo-500/30"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
