"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export default function NotesPage() {
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const [notes, setNotes] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  // form state (top card)
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [color, setColor] = useState("indigo");
  const [pinned, setPinned] = useState(false);
  const [category, setCategory] = useState("");

  // search + filters
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL"); // "ALL" | "PINNED" | categoryName

  // modal state
  const [activeNote, setActiveNote] = useState(null);
  const [allCategories, setAllCategories] = useState([]);

  // ----------------- LOAD NOTES -----------------
  useEffect(() => {
    const token = localStorage.getItem("lifeboard_token");
    if (!token) {
      router.push("/login");
      return;
    }

    const fetchNotes = async () => {
      try {
        const params = new URLSearchParams({ limit: "100", sortBy: "pinned" });
        if (search) params.append("search", search);
        if (selectedCategory === "PINNED") params.append("pinned", "true");
        else if (selectedCategory !== "ALL") params.append("category", selectedCategory);

        const res = await fetch(`${API_URL}/api/notes?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setNotes(data.notes || data || []);
      } catch (err) {
        console.error("Error fetching notes:", err);
        setError("Could not load notes.");
      } finally {
        setLoadingList(false);
      }
    };

    fetchNotes();
  }, [API_URL, router, search, selectedCategory]);

  useEffect(() => {
    const token = localStorage.getItem("lifeboard_token");
    if (!token) return;

    const fetchAllNotes = async () => {
      try {
        const res = await fetch(`${API_URL}/api/notes?limit=1000`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        const allNotes = data.notes || [];
        const cats = new Set();
        allNotes.forEach((n) => {
          if (n.category && n.category.trim()) cats.add(n.category.trim());
        });
        setAllCategories(Array.from(cats));
      } catch (err) {
        console.error(err);
      }
    };

    fetchAllNotes();
  }, [API_URL]);

  // ----------------- RESET FORM -----------------
  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setContent("");
    setColor("indigo");
    setPinned(false);
    setCategory("");
  };

  // ----------------- SAVE NOTE (CREATE / UPDATE) -----------------
  const handleSaveNote = async (e) => {
    e.preventDefault();
    setMsg("");
    setError("");

    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    const trimmedCategory = category.trim();

    if (!trimmedTitle || !trimmedContent) {
      return setError("Both title and content are required.");
    }

    const token = localStorage.getItem("lifeboard_token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setSaving(true);

      if (editingId) {
        // update
        const res = await fetch(`${API_URL}/api/notes/${editingId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: trimmedTitle,
            content: trimmedContent,
            color,
            pinned,
            category: trimmedCategory,
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setNotes((prev) =>
          prev.map((n) => (n.id === data.note.id ? data.note : n))
        );
        setMsg("Note updated");
      } else {
        // create
        const res = await fetch(`${API_URL}/api/notes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: trimmedTitle,
            content: trimmedContent,
            color,
            pinned,
            category: trimmedCategory || null,
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setNotes((prev) => [data.note, ...prev]);
        setMsg("Note added");
      }

      resetForm();
      setTimeout(() => setMsg(""), 1500);
    } catch (err) {
      console.error("Error saving note:", err);
      setError("Could not save note.");
    } finally {
      setSaving(false);
    }
  };

  // ----------------- EDIT (via top form) -----------------
  const handleEditNote = (note) => {
    setEditingId(note.id);
    setTitle(note.title || "");
    setContent(note.content || "");
    setColor(note.color || "indigo");
    setPinned(note.pinned);
    setCategory(note.category || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ----------------- DELETE -----------------
  const handleDeleteNote = async (id) => {
    const token = localStorage.getItem("lifeboard_token");
    if (!token) {
      router.push("/login");
      return;
    }

    const snapshot = notes;
    setNotes((prev) => prev.filter((n) => n.id !== id));

    try {
      const res = await fetch(`${API_URL}/api/notes/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      console.error("Error deleting note:", err);
      setNotes(snapshot);
      setError("Could not delete note.");
    }
  };

  // ----------------- PIN / UNPIN -----------------
  const handleTogglePinned = async (note) => {
    const token = localStorage.getItem("lifeboard_token");
    if (!token) {
      router.push("/login");
      return;
    }

    const optimistic = !note.pinned;
    setNotes((prev) =>
      prev.map((n) => (n.id === note.id ? { ...n, pinned: optimistic } : n))
    );

    try {
      const res = await fetch(`${API_URL}/api/notes/${note.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ pinned: optimistic }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      console.error("Error pinning note:", err);
      setNotes((prev) =>
        prev.map((n) => (n.id === note.id ? { ...n, pinned: note.pinned } : n))
      );
    }
  };

  // ----------------- COLOR UI HELPERS -----------------
  const colorMap = {
    indigo: "bg-indigo-500/20 border-indigo-400/40",
    yellow: "bg-yellow-400/25 border-yellow-300/50",
    emerald: "bg-emerald-500/20 border-emerald-400/40",
    rose: "bg-rose-500/20 border-rose-400/40",
  };

  const colorDot = {
    indigo: "bg-indigo-400",
    yellow: "bg-yellow-300",
    emerald: "bg-emerald-400",
    rose: "bg-rose-400",
  };

  const priorityIconForColor = (c) => {
    if (c === "rose") return "🔥";
    if (c === "yellow") return "⚡";
    if (c === "emerald") return "🌿";
    return "📝";
  };

  const pinnedNotes = notes.filter((n) => n.pinned);
  const otherNotes = notes.filter((n) => !n.pinned);

  return (
    <div className="relative z-10 animate-fadeIn space-y-6">
      {/* Header */}
      <header>
        <p className="text-xs uppercase tracking-[0.18em] text-indigo-300/80 mb-1">
          Notes
        </p>
        <h1 className="text-3xl font-semibold text-white">
          Keep your thoughts in one place
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Jot ideas, lyrics, todos or journal-style notes.
        </p>
      </header>

      {/* Search + Filters */}
      <section className="space-y-3">
        {/* Search bar */}
        <div className="relative">
          <span className="absolute left-3 top-2.5 text-slate-500 text-sm">
            🔍
          </span>
          <input
            className="w-full pl-9 pr-3 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/70"
            placeholder="Search notes by title or content"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filter pills: All, Pinned, Categories */}
        <div className="flex flex-wrap gap-2 text-xs">
          <FilterPill
            label="All"
            active={selectedCategory === "ALL"}
            onClick={() => setSelectedCategory("ALL")}
          />
          <FilterPill
            label="Pinned"
            active={selectedCategory === "PINNED"}
            onClick={() => setSelectedCategory("PINNED")}
          />
          {allCategories.map((cat) => (
            <FilterPill
              key={cat}
              label={cat}
              active={selectedCategory === cat}
              onClick={() => setSelectedCategory(cat)}
            />
          ))}
        </div>
      </section>

      {/* Messages */}
      {(msg || error) && (
        <div className="space-y-2 text-sm">
          {msg && (
            <div className="px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-400/40 text-emerald-200 flex gap-2">
              <span>✅</span>
              <span>{msg}</span>
            </div>
          )}
          {error && (
            <div className="px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-400/40 text-rose-200 flex gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Note card */}
      <section className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-6 backdrop-blur-xl shadow-xl shadow-black/40">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-100">
            {editingId ? "Edit note" : "Add a new note"}
          </h2>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              Cancel edit
            </button>
          )}
        </div>

        <form onSubmit={handleSaveNote} className="space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title — e.g. 'Verse idea for Hum Tumhare'"
            className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/15 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/70 transition text-sm"
          />

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your note…"
            rows={4}
            className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 transition text-sm resize-y"
          />

          {/* Category input */}
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Category (e.g. Music, College, DSA, Ideas)"
            className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
          />

          {/* color + pin + button row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* color palette */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">Color</span>
              <div className="flex gap-2">
                {Object.keys(colorMap).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`h-5 w-5 rounded-full border transition transform ${
                      color === c
                        ? `${colorDot[c]} scale-110 shadow-[0_0_0_2px_rgba(255,255,255,0.4)]`
                        : `${colorDot[c]} opacity-60 hover:opacity-100 hover:scale-105`
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* pinned toggle */}
            <button
              type="button"
              onClick={() => setPinned((p) => !p)}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] border transition ${
                pinned
                  ? "border-yellow-300/70 bg-yellow-500/20 text-yellow-200"
                  : "border-white/15 bg-white/5 text-slate-300 hover:border-yellow-200/50 hover:bg-yellow-500/10"
              }`}
            >
              📌 <span>{pinned ? "Pinned" : "Pin note"}</span>
            </button>

            {/* save button (right) */}
            <div className="sm:ml-auto">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-semibold shadow-lg shadow-indigo-500/40 transition-all"
              >
                {saving ? (
                  <>
                    <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <span>{editingId ? "Update note" : "Add note"}</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </section>

      {/* Notes grid */}
      <section className="space-y-5">
        {loadingList ? (
          <p className="text-xs text-slate-400">Loading your notes…</p>
        ) : notes.length === 0 ? (
          <p className="text-xs text-slate-500 italic">
            No notes match this filter. Try changing search or category.
          </p>
        ) : (
          <>
            {pinnedNotes.length > 0 && (
              <NotesSection
                title="Pinned"
                notes={pinnedNotes}
                colorMap={colorMap}
                colorDot={colorDot}
                priorityIconForColor={priorityIconForColor}
                onOpenModal={setActiveNote}
                onTogglePinned={handleTogglePinned}
                onDelete={handleDeleteNote}
              />
            )}

            <NotesSection
              title={pinnedNotes.length > 0 ? "Others" : "All notes"}
              notes={otherNotes}
              colorMap={colorMap}
              colorDot={colorDot}
              priorityIconForColor={priorityIconForColor}
              onOpenModal={setActiveNote}
              onTogglePinned={handleTogglePinned}
              onDelete={handleDeleteNote}
            />
          </>
        )}
      </section>

      {/* Center modal for viewing note */}
      {activeNote && (
        <NoteModal
          note={activeNote}
          colorMap={colorMap}
          colorDot={colorDot}
          priorityIconForColor={priorityIconForColor}
          onClose={() => setActiveNote(null)}
          onEditInForm={(note) => {
            handleEditNote(note);
            setActiveNote(null);
          }}
        />
      )}

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

/* --------- Filter pill ---------- */
function FilterPill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[11px] transition ${
        active
          ? "bg-indigo-500 text-white border-indigo-400 shadow-sm shadow-indigo-500/40"
          : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
      }`}
    >
      <span>{label}</span>
    </button>
  );
}

/* --------- NotesSection + NoteCard ---------- */

function NotesSection({
  title,
  notes,
  colorMap,
  colorDot,
  priorityIconForColor,
  onOpenModal,
  onTogglePinned,
  onDelete,
}) {
  if (!notes.length) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
          {title} ({notes.length})
        </h2>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {notes.map((note) => (
          <NoteCard
            key={note.id}
            note={note}
            colorMap={colorMap}
            colorDot={colorDot}
            priorityIconForColor={priorityIconForColor}
            onOpenModal={onOpenModal}
            onTogglePinned={onTogglePinned}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}

function NoteCard({
  note,
  colorMap,
  colorDot,
  priorityIconForColor,
  onOpenModal,
  onTogglePinned,
  onDelete,
}) {
  const c = note.color || "indigo";

  return (
    <div
      className={`group relative rounded-xl border px-3 py-3 text-sm cursor-pointer overflow-hidden transition transform hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/40 ${
        colorMap[c] || colorMap.indigo
      }`}
      onClick={() => onOpenModal(note)}
    >
      {/* color dot */}
      <div
        className={`absolute -left-1 top-3 h-2 w-2 rounded-full ${
          colorDot[c] || colorDot.indigo
        }`}
      />

      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex-1">
          <h3 className="font-semibold text-slate-50 truncate flex items-center gap-1.5">
            <span>{priorityIconForColor(c)}</span>
            <span className="truncate">{note.title}</span>
          </h3>
          {note.category && (
            <p className="text-[11px] text-slate-200/80 mt-0.5">
              {note.category}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-200/80">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePinned(note);
            }}
            
          >
            {note.pinned ? (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full 
    bg-yellow-500/20 border border-yellow-300/60 text-yellow-200 text-[10px]">
    📌 Pinned
  </span>
) : (
  <span className="px-2 py-0.5 rounded-full border border-white/20 text-[10px] text-slate-100/90 hover:bg-white/10 transition">📌</span>
)}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(note.id);
            }}
            className="opacity-0 group-hover:opacity-100 text-[11px] text-slate-100/70 hover:text-rose-300 transition"
          >
            ✕
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-200/90 whitespace-pre-line line-clamp-5">
        {note.content}
      </p>

      <div className="mt-2 text-[10px] text-slate-400 flex justify-between">
        <span>
          {note.updatedAt
            ? new Date(note.updatedAt).toLocaleString()
            : new Date(note.createdAt).toLocaleString()}
        </span>
      </div>
    </div>
  );
}

/* --------- Center Modal for viewing note ---------- */

function NoteModal({
  note,
  colorMap,
  colorDot,
  priorityIconForColor,
  onClose,
  onEditInForm,
}) {
  const c = note.color || "indigo";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className={`relative w-full max-w-2xl mx-4 rounded-2xl border p-5 sm:p-6 shadow-2xl shadow-black/60 ${colorMap[c] || colorMap.indigo}`}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-200/80 hover:text-white text-sm"
        >
          ✕
        </button>

        {/* Header: dot + category + icon */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full mt-1 ${
                colorDot[c] || colorDot.indigo
              }`}
            />
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-slate-50 flex items-center gap-2">
                <span>{priorityIconForColor(c)}</span>
                <span>{note.title}</span>
              </h2>
              {note.category && (
                <p className="text-[11px] mt-0.5 text-slate-200/80">
                  {note.category}
                </p>
              )}
            </div>
          </div>

          {note.pinned && (
            <span className="text-[11px] px-2 py-1 rounded-full bg-yellow-500/20 border border-yellow-300/60 text-yellow-100 flex items-center gap-1">
              📌 Pinned
            </span>
          )}
        </div>

        {/* Content */}
        <div className="max-h-[50vh] overflow-y-auto pr-1">
          <p className="text-sm text-slate-100 whitespace-pre-line leading-relaxed">
            {note.content}
          </p>
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between text-[11px] text-slate-300">
          <span>
            Last updated{" "}
            {note.updatedAt
              ? new Date(note.updatedAt).toLocaleString()
              : new Date(note.createdAt).toLocaleString()}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => onEditInForm(note)}
              className="px-3 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-medium transition"
            >
              Edit in form
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-100 text-[11px] transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
