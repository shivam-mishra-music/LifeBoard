"use client";

import { useState } from "react";
import Link from "next/link";
import axios from "axios";

export default function Login() {
  const LOGO_SRC = "/lifeboard-logo1.svg";

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`,
        form
      );

      localStorage.setItem("lifeboard_token", res.data.token);
      localStorage.setItem("lifeboard_user_name", res.data.user?.name || "User");
      setMsg("Login successful! Redirecting…");

      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1200);

    } catch (err) {
      setMsg(err.response?.data?.message || "Login failed. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative bg-gradient-to-br from-[#060b18] via-[#0b1126] to-[#111c3d] px-4">

      {/* Background blobs */}
      <div className="absolute top-12 left-12 h-40 w-40 bg-indigo-600/20 blur-3xl rounded-full animate-pulse"></div>
      <div className="absolute bottom-12 right-12 h-56 w-56 bg-blue-500/20 blur-[80px] rounded-full animate-pulse"></div>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6 animate-slideDown">
        <img src={LOGO_SRC} alt="LifeBoard logo" className="w-13 h-13 drop-shadow-xl" />
        <div className="flex flex-col">
          <h1 className="text-4xl font-extrabold tracking-wide text-white drop-shadow-xl">
            Life<span className="text-indigo-400">Board</span>
          </h1>
          <p className="text-sm text-slate-400 -mt-1">
            Personal Life Organizer — futuristic mode
          </p>
        </div>
      </div>

      {/* Card */}
      <div className="bg-white/5 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-white/10 w-full max-w-md relative overflow-hidden animate-slideUp">

        {/* Shimmer */}
        <div className="absolute inset-0 rounded-2xl pointer-events-none shimmer"></div>

        <p className="text-center text-gray-300 text-sm mb-4">
          Login to continue
        </p>

        {msg && (
          <p className={`text-center mb-3 text-sm font-medium animate-fadeIn ${
            msg.includes("successful") ? "text-green-400" : "text-red-400"
          }`}>
            {msg}
          </p>
        )}

        <form onSubmit={handleLogin} className="space-y-5">

          <div>
            <label className="text-gray-200 text-sm">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full mt-1 px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="text-gray-200 text-sm">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="w-full mt-1 px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              placeholder="Enter your password"
            />
          </div>

          <button
            disabled={loading}
            className="w-full mt-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition flex justify-center"
          >
            {loading ? (
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              "Login"
            )}
          </button>

          <p className="text-center text-gray-300 text-sm mt-4">
            Don’t have an account?{" "}
            <Link href="/signup" className="text-indigo-400 hover:underline">
              Create one
            </Link>
          </p>

        </form>
      </div>

      {/* Animations & Shimmer */}
      <style>{`
        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out forwards;
        }
        .animate-slideUp {
          animation: slideUp 0.8s ease-out forwards;
        }
        .animate-slideDown {
          animation: slideDown 0.8s ease-out forwards;
        }

        .shimmer::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 18px;
          padding: 1px;
          background: linear-gradient(
            120deg,
            transparent,
            rgba(115,150,150,0.25),
            transparent
          );
          background-size: 200% 100%;
          animation: shimmerAnim 2.2s ease-out 1;
        }

        @keyframes shimmerAnim {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        @keyframes slideDown {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
