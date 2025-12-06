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

  // --- Helper: get base URL from env
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // --- Check auth + load tasks on mount
  useEffect(() => {
    const token = localStorage.getItem("lifeboard_token");
    if (!token) {
      router.push("/login");
      return;
    }

    const fetchTasks = async () => {
      try {
        setLoadingList(true);
        setError("");
        const res = await axios.get(`${API_URL}/api/tasks`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setTasks(res.data || []);
      } catch (err) {
        console.error("Error fetching tasks:", err);
        setError(
          err.response?.data?.message ||
            "Could not load tasks. Please try again."
        );
      } finally {
        setLoadingList(false);
      }
    };

    fetchTasks();
  }, [API_URL, router]);

  // --- Add new task
  const handleAddTask = async (e) => {
    e.preventDefault();
    setMsg("");
    setError("");

    const trimmedTitle = title.trim();
    const trimmedDesc = description.trim();

    if (!trimmedTitle) {
      setError("Task title is required.");
      return;
    }

    const token = localStorage.getItem("lifeboard_token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setCreating(true);
      const res = await axios.post(
        `${API_URL}/api/tasks`,
        {
          title: trimmedTitle,
          description: trimmedDesc || undefined,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const newTask = res.data.task;
      setTasks((prev) => [newTask, ...prev]);
      setTitle("");
      setDescription("");
      setMsg("Task added!");
      setTimeout(() => setMsg(""), 1800);
    } catch (err) {
      console.error("Error creating task:", err);
      setError(
        err.response?.data?.message || "Could not create task. Please retry."
      );
    } finally {
      setCreating(false);
    }
  };

  // --- Toggle completed
  const handleToggleCompleted = async (task) => {
    const token = localStorage.getItem("lifeboard_token");
    if (!token) {
      router.push("/login");
      return;
    }

    const optimistic = !task.completed;
    // optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, completed: optimistic } : t))
    );

    try {
      await axios.put(
        `${API_URL}/api/tasks/${task.id}`,
        { completed: optimistic },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error("Error updating task:", err);
      // revert
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, completed: task.completed } : t
        )
      );
      setError("Could not update task. Please try again.");
    }
  };

  // --- Delete task
  const handleDeleteTask = async (taskId) => {
    const token = localStorage.getItem("lifeboard_token");
    if (!token) {
      router.push("/login");
      return;
    }

    const previous = tasks;
    // optimistic remove
    setTasks((prev) => prev.filter((t) => t.id !== taskId));

    try {
      await axios.delete(`${API_URL}/api/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error("Error deleting task:", err);
      setTasks(previous); // revert
      setError("Could not delete task. Please try again.");
    }
  };

  const pendingTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  return (
    <div className="relative z-10 animate-fadeIn space-y-5 sm:space-y-6">
      {/* Header */}
      <header>
        <p className="text-xs uppercase tracking-[0.18em] text-indigo-300/80 mb-1">
          Tasks
        </p>
        <h1 className="text-2xl sm:text-3xl font-semibold text-white">
          Your tasks, in one place
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Capture ideas, todos and reminders that keep LifeBoard moving.
        </p>
      </header>

      {/* Messages */}
      {(msg || error) && (
        <div className="text-sm">
          {msg && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-400/40 text-emerald-200 mr-2">
              <span className="text-xs">✅</span>
              <span>{msg}</span>
            </div>
          )}
          {error && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-400/40 text-rose-200">
              <span className="text-xs">⚠️</span>
              <span>{error}</span>
            </div>
          )}
        </div>
      )}

      {/* Add Task Card */}
      <section className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-6 backdrop-blur-xl shadow-xl shadow-black/40">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-100">
            Add a new task
          </h2>
          <span className="text-[11px] px-2 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/40 text-indigo-200">
            Quick capture
          </span>
        </div>

        <form
          onSubmit={handleAddTask}
          className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-3"
        >
          <div className="flex-1 space-y-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/15 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 transition text-sm"
              placeholder="Task title — e.g. 'Draft verse for Hum Tumhare'"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition text-xs sm:text-sm resize-none"
              placeholder="Optional notes — links, ideas, time, etc."
            />
          </div>

          <button
            type="submit"
            disabled={creating}
            className="mt-3 sm:mt-0 shrink-0 inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-semibold shadow-lg shadow-indigo-500/40 transition-all"
          >
            {creating ? (
              <>
                <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <span className="mr-1.5 text-base">＋</span>
                Add task
              </>
            )}
          </button>
        </form>
      </section>

      {/* Tasks List */}
      <section className="grid gap-4 sm:gap-6 md:grid-cols-2">
        {/* Pending */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-100">
              Pending tasks
            </h2>
            <span className="text-[11px] text-slate-400">
              {pendingTasks.length} active
            </span>
          </div>

          {loadingList ? (
            <p className="text-xs text-slate-400">Loading your tasks...</p>
          ) : pendingTasks.length === 0 ? (
            <p className="text-xs text-slate-500 italic">
              No pending tasks. Nice. ✨
            </p>
          ) : (
            <ul className="space-y-2.5 text-sm">
              {pendingTasks.map((task) => (
                <li
                  key={task.id}
                  className="group flex items-start gap-3 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/8 transition"
                >
                  {/* Checkbox */}
                  <button
                    type="button"
                    onClick={() => handleToggleCompleted(task)}
                    className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-md border border-indigo-400/70 bg-black/20 hover:bg-indigo-500/40 transition"
                  >
                    <span className="text-[10px] text-indigo-100">✓</span>
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className="text-slate-100 font-medium truncate">
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-xs text-slate-400 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    <p className="mt-1 text-[10px] text-slate-500">
                      Created at{" "}
                      {task.createdAt
                        ? new Date(task.createdAt).toLocaleString()
                        : "—"}
                    </p>
                  </div>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => handleDeleteTask(task.id)}
                    className="opacity-0 group-hover:opacity-100 text-[11px] text-slate-500 hover:text-rose-300 transition ml-1"
                    title="Delete task"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Completed */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-100">
              Completed
            </h2>
            <span className="text-[11px] text-slate-400">
              {completedTasks.length} done
            </span>
          </div>

          {loadingList ? (
            <p className="text-xs text-slate-400">Loading your tasks...</p>
          ) : completedTasks.length === 0 ? (
            <p className="text-xs text-slate-500 italic">
              Tasks you finish will move here.
            </p>
          ) : (
            <ul className="space-y-2.5 text-sm">
              {completedTasks.map((task) => (
                <li
                  key={task.id}
                  className="group flex items-start gap-3 px-3 py-2.5 rounded-xl bg-emerald-500/8 border border-emerald-400/25 hover:bg-emerald-500/12 transition"
                >
                  {/* Checkbox */}
                  <button
                    type="button"
                    onClick={() => handleToggleCompleted(task)}
                    className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-md border border-emerald-400 bg-emerald-500/50"
                  >
                    <span className="text-[10px] text-emerald-50">✓</span>
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className="text-slate-100 font-medium line-through decoration-emerald-400/70 truncate">
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-xs text-emerald-100/80 line-clamp-2 line-through decoration-emerald-300/60">
                        {task.description}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteTask(task.id)}
                    className="opacity-0 group-hover:opacity-100 text-[11px] text-emerald-100/80 hover:text-rose-200 transition ml-1"
                    title="Delete task"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Tiny animations helper (reuse) */}
      <style jsx>{`
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out forwards;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
