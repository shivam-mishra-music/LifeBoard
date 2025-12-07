"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

const LOGO_SRC = "/lifeboard-logo1.svg";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const path = usePathname();
  const [loading, setLoading] = useState(true);

  // token check ho rha hai
  useEffect(() => {
    const token = localStorage.getItem("lifeboard_token");

    if (!token) {
      router.push("/login");
    } else {
      setLoading(false);
    }
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Checking authentication…
      </div>
    );
  }

  const navItems = [
    { id: "overview", label: "Overview", href: "/dashboard" },
    { id: "tasks", label: "Tasks", href: "/dashboard/tasks" },
    { id: "notes", label: "Notes", href: "/dashboard/notes" },
    { id: "calendar", label: "Calendar", href: "/dashboard/calendar" },
    { id: "habits", label: "Habits", href: "/dashboard/habits" },
  ];

  const isActive = (href) => path === href;

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#060b18] via-[#0b1126] to-[#111c3d] text-slate-100">

      {/* LEFT SIDEBAR */}
      <aside className="hidden sm:flex sm:flex-col w-64 border-r border-white/10 bg-white/5 backdrop-blur-xl px-6 py-5">

        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <img src={LOGO_SRC} alt="LifeBoard Logo" className="w-9 h-9 drop-shadow-xl" />
          <div className="flex flex-col">
            <span className="text-xl font-bold text-white leading-tight">
              Life<span className="text-indigo-400">Board</span>
            </span>
            <span className="text-[11px] text-slate-400">
              Personal Life Organizer
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1 text-sm flex-1">
          {navItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={`block px-3 py-2 rounded-lg transition-all ${
                isActive(item.href)
                  ? "bg-indigo-600/80 text-white shadow-lg shadow-indigo-600/30"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="mt-6 pt-4 border-t border-white/5 text-xs text-slate-500">
          <p className="mb-1">Signed in</p>
          <button
            className="text-[11px] text-slate-400 hover:text-indigo-300"
            onClick={() => {
              localStorage.removeItem("lifeboard_token");
              router.push("/login");
            }}
          >
            Log Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 min-h-screen relative px-4 sm:px-8 py-6">
        <div className="absolute -top-12 -left-10 h-52 w-52 bg-indigo-600/20 blur-3xl rounded-full animate-pulse" />
        <div className="absolute bottom-0 right-0 h-64 w-64 bg-blue-500/20 blur-[90px] rounded-full animate-pulse" />

        {children}
      </main>
    </div>
  );
}
