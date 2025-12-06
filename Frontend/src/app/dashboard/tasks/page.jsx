"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [dueDate, setDueDate] = useState("");

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  /* ---------------- LOAD TASKS ---------------- */
  useEffect(() => {
    const token = localStorage.getItem("lifeboard_token");
    if (!token) return router.push("/login");

    const fetchTasks = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/tasks`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTasks(res.data || []);
      } catch {
        setError("Could not load tasks.");
      } finally {
        setLoadingList(false);
      }
    };

    fetchTasks();
  }, [API_URL, router]);

  /* ---------------- CREATE TASK ---------------- */
  const handleAddTask = async (e) => {
    e.preventDefault();
    setMsg("");
    setError("");

    if (!title.trim()) return setError("Task title is required.");
    const token = localStorage.getItem("lifeboard_token");

    try {
      setCreating(true);

      const res = await axios.post(
        `${API_URL}/api/tasks`,
        { title, description, priority, dueDate },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setTasks((prev) => [res.data.task, ...prev]);
      setTitle("");
      setDescription("");
      setDueDate("");
      setPriority("MEDIUM");

      setMsg("Task added!");
      setTimeout(() => setMsg(""), 1500);
    } catch {
      setError("Could not create task.");
    } finally {
      setCreating(false);
    }
  };

  /* ---------------- UPDATE COMPLETED ---------------- */
  const handleToggleCompleted = async (task) => {
    const token = localStorage.getItem("lifeboard_token");
    const optimistic = !task.completed;

    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, completed: optimistic } : t))
    );

    try {
      await axios.put(
        `${API_URL}/api/tasks/${task.id}`,
        { completed: optimistic },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch {
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, completed: task.completed } : t))
      );
    }
  };

  /* ---------------- DELETE TASK ---------------- */
  const handleDeleteTask = async (id) => {
    const token = localStorage.getItem("lifeboard_token");
    const snapshot = tasks;

    setTasks(tasks.filter((t) => t.id !== id));

    try {
      await axios.delete(`${API_URL}/api/tasks/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      setTasks(snapshot);
    }
  };

  /* ---------------- UTILITIES ---------------- */
  const priorityBadge = (p) => {
    const map = {
      HIGH: "🔥 High",
      MEDIUM: "⚡ Medium",
      LOW: "🌿 Low",
    };

    const styles = {
      HIGH: "bg-red-500/20 border-red-400/40 text-red-300",
      MEDIUM: "bg-yellow-500/20 border-yellow-400/40 text-yellow-300",
      LOW: "bg-green-500/20 border-green-400/40 text-green-300",
    };

    return (
      <span className={`px-2 py-0.5 text-[10px] rounded-md border ${styles[p]}`}>
        {map[p]}
      </span>
    );
  };

  const priorityDot = (p) => {
    const dot = {
      HIGH: "bg-red-400",
      MEDIUM: "bg-yellow-300",
      LOW: "bg-green-400",
    };
    return <span className={`h-2 w-2 rounded-full ${dot[p]}`}></span>;
  };

  const isOverdue = (date) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  const pendingTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  return (
    <div className="relative z-10 animate-fadeIn space-y-6">
      {/* --------- HEADER --------- */}
      <header>
        <p className="text-xs uppercase tracking-[0.18em] text-indigo-300/80 mb-1">
          Tasks
        </p>
        <h1 className="text-3xl font-semibold text-white">Your tasks, in one place</h1>
        <p className="text-sm text-slate-400 mt-1">
          Capture todos, reminders, and ideas.
        </p>
      </header>

      {/* --------- ALERTS --------- */}
      {(msg || error) && (
        <div className="space-y-2 text-sm">
          {msg && (
            <div className="px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-400/40 text-emerald-200 flex gap-2">
              <span>✅</span> {msg}
            </div>
          )}
          {error && (
            <div className="px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-400/40 text-rose-200 flex gap-2">
              <span>⚠️</span> {error}
            </div>
          )}
        </div>
      )}

      {/* --------- ADD TASK CARD --------- */}
      <section className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-xl shadow-xl shadow-black/40">

        <form onSubmit={handleAddTask} className="space-y-3">

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
            className="w-full px-4 py-2.5 bg-white/5 border border-white/15 rounded-lg 
                       text-slate-100 text-sm placeholder:text-slate-500 
                       focus:ring-2 focus:ring-indigo-500/40 transition"
          />

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional notes…"
            rows={2}
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg 
                       text-slate-100 text-sm placeholder:text-slate-500 
                       focus:ring-2 focus:ring-indigo-500/40 transition resize-none"
          />

          {/* PRIORITY + DATE + BUTTON ROW */}
          <div className="flex flex-col sm:flex-row items-center gap-3">

            {/* PRIORITY DROPDOWN */}
            <div className="flex-1 relative">
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-4 py-2.5 text-sm bg-white/5 border border-white/10 
                           rounded-lg text-slate-100 focus:ring-2 focus:ring-indigo-500/40 transition appearance-none"
              >
                <option value="LOW">🌿 Low Priority</option>
                <option value="MEDIUM">⚡ Medium Priority</option>
                <option value="HIGH">🔥 High Priority</option>
              </select>

              <span className="absolute right-3 top-2.5 text-slate-300 text-xs pointer-events-none">
                ▼
              </span>
            </div>

            {/* DATE INPUT */}
            <div className="flex-1 relative">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={`w-full px-4 py-2.5 pr-10 text-sm bg-white/5 border rounded-lg text-slate-100 
                            focus:ring-2 transition 
                            ${
                              isOverdue(dueDate)
                                ? "border-red-400 ring-red-500/40 animate-pulse"
                                : "border-white/10 focus:ring-indigo-500/40"
                            }`}
              />
              <span className="absolute right-3 top-2.5 text-slate-400 text-sm pointer-events-none">
                📅
              </span>
            </div>

            {/* ADD BUTTON */}
            <button
              disabled={creating}
              className="px-5 py-2.5 whitespace-nowrap rounded-xl bg-indigo-600 hover:bg-indigo-500 
                         disabled:opacity-60 text-white text-sm font-semibold shadow-lg 
                         shadow-indigo-500/30 transition flex items-center gap-2"
            >
              {creating ? (
                <>
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>＋ Add</>
              )}
            </button>

          </div>
        </form>
      </section>

      {/* --------- TASK LISTS --------- */}
      <section className="grid md:grid-cols-2 gap-6">

        {/* PENDING */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-slate-100 mb-2">
            Pending tasks ({pendingTasks.length})
          </h2>

          {pendingTasks.map((t) => (
            <TaskItem
              key={t.id}
              task={t}
              onToggle={handleToggleCompleted}
              onDelete={handleDeleteTask}
              priorityBadge={priorityBadge}
              priorityDot={priorityDot}
              isOverdue={isOverdue}
            />
          ))}
        </div>

        {/* COMPLETED */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-slate-100 mb-2">
            Completed ({completedTasks.length})
          </h2>

          {completedTasks.map((t) => (
            <TaskItem
              key={t.id}
              task={t}
              completed
              onToggle={handleToggleCompleted}
              onDelete={handleDeleteTask}
              priorityBadge={priorityBadge}
              priorityDot={priorityDot}
              isOverdue={isOverdue}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

/* ---------------- TASK ITEM COMPONENT ---------------- */
function TaskItem({ task, completed, onToggle, onDelete, priorityBadge, priorityDot, isOverdue }) {
  return (
    <div
      className={`group flex items-start gap-3 px-3 py-3 rounded-xl mb-2 border transition ${
        completed
          ? "bg-emerald-500/10 border-emerald-400/20"
          : "bg-white/5 border-white/10 hover:bg-white/10"
      }`}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle(task)}
        className="h-5 w-5 flex items-center justify-center rounded-md border border-indigo-400 bg-black/30 hover:bg-indigo-500/40 transition"
      >
        <span className="text-[10px] text-indigo-100">✓</span>
      </button>

      {/* Content */}
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <p className={`font-medium truncate ${completed ? "line-through text-slate-400" : "text-white"}`}>
            {task.title}
          </p>

          {/* Priority badge */}
          {priorityBadge(task.priority)}
        </div>

        {task.description && (
          <p className="text-xs text-slate-400 line-clamp-2">{task.description}</p>
        )}

        {/* Due Date */}
        {task.dueDate && (
          <p
            className={`mt-1 text-[11px] ${
              isOverdue(task.dueDate)
                ? "text-red-400 font-medium animate-pulse"
                : "text-blue-300"
            }`}
          >
            Due: {new Date(task.dueDate).toLocaleDateString()}
          </p>
        )}
      </div>

      {/* Delete */}
      <button
        onClick={() => onDelete(task.id)}
        className="opacity-0 group-hover:opacity-100 text-[12px] text-slate-400 hover:text-rose-300 transition ml-2"
      >
        ✕
      </button>
    </div>
  );
}
