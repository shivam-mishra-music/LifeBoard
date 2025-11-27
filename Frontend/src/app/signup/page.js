
"use client";
import axios from "axios";

import { useState } from "react";
import Link from "next/link";

export default function Signup() {
  const LOGO_SRC = "/lifeboard-logo1.svg";

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
  e.preventDefault();

  if (!form.name || !form.email || !form.password) {
    alert("All fields are required!");
    return;
  }

  setLoading(true);
  setMsg("");

  try {
    const res = await axios.post("http://localhost:8000/api/auth/signup", form);

    setMsg("Account created successfully! Redirecting…");

    // redirect to login after 1 sec
    setTimeout(() => {
      window.location.href = "/login";
    }, 1200);

  } catch (error) {
    setMsg(error.response?.data?.message || "Signup failed");
  }

  setLoading(false);
};


  return (
    <div
      className="
        min-h-screen flex flex-col items-center justify-center relative 
        bg-gradient-to-br from-[#060b18] via-[#0b1126] to-[#111c3d]
        animate-fadeIn px-4
      "
    >
      {/* Background blobs */}
      <div className="absolute top-12 left-12 h-40 w-40 bg-indigo-600/20 blur-3xl rounded-full animate-pulse"></div>
      <div className="absolute bottom-12 right-12 h-56 w-56 bg-blue-500/20 blur-[80px] rounded-full animate-pulse"></div>

      {/* Header (Logo + Title) */}
      <div className="flex items-center gap-3 mb-6 animate-slideDown ">
        <img
          src={LOGO_SRC}
          alt="LifeBoard icon"
          className="w-13 h-13 drop-shadow-xl "
        />
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
      <div
        className="
          bg-white/5 backdrop-blur-xl p-8 rounded-2xl shadow-2xl 
          border border-white/10 w-full max-w-md relative overflow-hidden
          animate-slideUp
        "
      >
        {/* One-time shimmer */}
        <div className="absolute inset-0 rounded-2xl pointer-events-none shimmer"></div>

        <p className="text-center text-gray-300 text-sm mb-4">
          Create your LifeBoard account
        </p>

        {msg && (
          <p className="text-indigo-300 text-center mb-3 text-sm font-medium animate-fadeIn">
            {msg}
          </p>
        )}

        <div className="space-y-5">
          {/* Name */}
          <div>
            <label className="text-gray-200 text-sm">Full name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="
                w-full mt-1 px-4 py-2 rounded-lg bg-white/5 border border-white/20
                text-gray-100 placeholder-gray-500
                focus:outline-none focus:ring-2 focus:ring-indigo-500
                transition
              "
              placeholder="Your full name"
            />
          </div>

          {/* Email */}
          <div>
            <label className="text-gray-200 text-sm">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="
                w-full mt-1 px-4 py-2 rounded-lg bg-white/5 border border-white/20
                text-gray-100 placeholder-gray-500
                focus:outline-none focus:ring-2 focus:ring-indigo-500
                transition
              "
              placeholder="you@example.com"
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-gray-200 text-sm">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="
                w-full mt-1 px-4 py-2 rounded-lg bg-white/5 border border-white/20
                text-gray-100 placeholder-gray-500
                focus:outline-none focus:ring-2 focus:ring-indigo-500
                transition
              "
              placeholder="Enter a secure password"
            />
          </div>

          {/* Button */}
          <button
            onClick={handleSignup}
            disabled={loading}
            className="
              w-full mt-4 py-3 bg-indigo-600 hover:bg-indigo-700 
              disabled:opacity-50 text-white font-semibold rounded-lg 
              transition-all flex items-center justify-center
            "
          >
            {loading ? (
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              "Create Account"
            )}
          </button>

          {/* Login link */}
          <p className="text-center text-gray-300 mt-5 text-sm">
            Already have an account?{" "}
            <Link href="/login" className="text-indigo-400 hover:underline">
              Login
            </Link>
            
          </p>
          <p className="text-center text-xs text-slate-600 mt-2">By creating an account you agree to our Terms.</p>
        </div>
      </div>

      {/* Animations */}
      <style>
        {`
          .animate-fadeIn {
            animation: fadeIn 0.8s ease-out forwards;
          }
          .animate-slideUp {
            animation: slideUp 0.8s ease-out forwards;
          }
          .animate-slideDown {
            animation: slideDown 0.8s ease-out forwards;
          }

          /* One-time shimmer */
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
        `}
      </style>
    </div>
  );
}





// "use client";

// import { useEffect, useRef, useState } from "react";
// import Link from "next/link";


// const LOGO_SRC = "/lifeboard-icon.svg";

// export default function Signup() {
//   const [form, setForm] = useState({ name: "", email: "", password: "" });
//   const [loading, setLoading] = useState(false);
//   const [msg, setMsg] = useState("");
//   const canvasRef = useRef(null);

//   useEffect(() => {
//     // Particle system (soft floating tech particles)
//     const canvas = canvasRef.current;
//     if (!canvas) return;
//     const ctx = canvas.getContext("2d");
//     let w = (canvas.width = innerWidth);
//     let h = (canvas.height = innerHeight);
//     const particles = [];
//     const PARTICLE_COUNT = Math.round((w * h) / 90000); // density

//     function rand(min, max) {
//       return Math.random() * (max - min) + min;
//     }

//     function createParticles() {
//       particles.length = 0;
//       for (let i = 0; i < Math.max(6, PARTICLE_COUNT); i++) {
//         particles.push({
//           x: rand(0, w),
//           y: rand(0, h),
//           r: rand(0.8, 2.6),
//           vx: rand(-0.2, 0.2),
//           vy: rand(-0.15, 0.15),
//           opacity: rand(0.05, 0.25),
//           hue: rand(200, 230),
//         });
//       }
//     }

//     function resize() {
//       w = canvas.width = innerWidth;
//       h = canvas.height = innerHeight;
//       createParticles();
//     }

//     function draw() {
//       ctx.clearRect(0, 0, w, h);
//       // faint radial gradient vignette
//       const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) / 6, w / 2, h / 2, Math.max(w, h));
//       g.addColorStop(0, "rgba(8,10,20,0.0)");
//       g.addColorStop(1, "rgba(2,4,10,0.45)");
//       ctx.fillStyle = g;
//       ctx.fillRect(0, 0, w, h);

//       // particles
//       for (let p of particles) {
//         p.x += p.vx;
//         p.y += p.vy;

//         // wrap
//         if (p.x < -10) p.x = w + 10;
//         if (p.x > w + 10) p.x = -10;
//         if (p.y < -10) p.y = h + 10;
//         if (p.y > h + 10) p.y = -10;

//         ctx.beginPath();
//         // soft glow
//         const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 6);
//         grad.addColorStop(0, `hsla(${p.hue},80%,60%,${p.opacity})`);
//         grad.addColorStop(0.6, `hsla(${p.hue},80%,55%,${p.opacity * 0.18})`);
//         grad.addColorStop(1, `rgba(0,0,0,0)`);
//         ctx.fillStyle = grad;
//         ctx.arc(p.x, p.y, p.r * 6, 0, Math.PI * 2);
//         ctx.fill();
//       }

//       // soft connecting lines when close to center (very subtle)
//       ctx.beginPath();
//       for (let i = 0; i < particles.length; i++) {
//         for (let j = i + 1; j < particles.length; j++) {
//           const a = particles[i];
//           const b = particles[j];
//           const dx = a.x - b.x;
//           const dy = a.y - b.y;
//           const d = Math.sqrt(dx * dx + dy * dy);
//           if (d < 120) {
//             ctx.strokeStyle = `rgba(100,150,255,${(0.12 * (120 - d)) / 120})`;
//             ctx.lineWidth = 0.4;
//             ctx.beginPath();
//             ctx.moveTo(a.x, a.y);
//             ctx.lineTo(b.x, b.y);
//             ctx.stroke();
//           }
//         }
//       }

//       animationId = requestAnimationFrame(draw);
//     }

//     let animationId = null;
//     createParticles();
//     draw();

//     window.addEventListener("resize", resize);
//     return () => {
//       window.removeEventListener("resize", resize);
//       if (animationId) cancelAnimationFrame(animationId);
//     };
//   }, []);

//   // ripple effect on button
//   const createRipple = (e) => {
//     const btn = e.currentTarget;
//     const rect = btn.getBoundingClientRect();
//     const circle = document.createElement("span");
//     const diameter = Math.max(rect.width, rect.height);
//     circle.style.width = circle.style.height = `${diameter}px`;
//     circle.style.left = `${e.clientX - rect.left - diameter / 2}px`;
//     circle.style.top = `${e.clientY - rect.top - diameter / 2}px`;
//     circle.className = "ripple";
//     const ripples = btn.getElementsByClassName("ripple");
//     while (ripples[0]) ripples[0].remove();
//     btn.appendChild(circle);
//   };

//   const handleChange = (e) => {
//     setForm((s) => ({ ...s, [e.target.name]: e.target.value }));
//   };

//   const handleSignup = async (e) => {
//     e.preventDefault();
//     // inline validation
//     if (!form.name || !form.email || !form.password) {
//       alert("All fields are required!");
//       return;
//     }

//     setLoading(true);
//     setMsg("");
//     // replace below with your real API call:
//     try {
//       // example: await axios.post("http://localhost:8000/api/auth/signup", form);
//       await new Promise((r) => setTimeout(r, 900));
//       setMsg("Account created successfully! Redirecting…");
//       setForm({ name: "", email: "", password: "" });
//     } catch (err) {
//       // error: show alert for serious errors
//       alert(err?.response?.data?.message || "Signup failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="relative min-h-screen overflow-hidden bg-[#030611]">
//       {/* Canvas for particles */}
//       <canvas ref={canvasRef} className="fixed inset-0 -z-10" />

//       <div className="flex flex-col items-center justify-center min-h-screen px-4">
//         {/* Logo floating above */}
//         <div className="mb-6 z-10 flex flex-col items-center">
//           <img
//             src={LOGO_SRC}
//             alt="LifeBoard logo"
//             className="w-28 h-28 object-contain filter drop-shadow-[0_8px_24px_rgba(43,86,255,0.14)] rounded-full bg-gradient-to-tr from-[#0f1724]/20 to-[#16203a]/10 p-2"
//           />
//           <h1 className="mt-3 text-4xl font-bold text-white tracking-tight">
//             Life<span className="text-[#60A5FA]">Board</span>
//           </h1>
//           <p className="text-sm text-slate-400 mt-1">Personal Life Organizer — futuristic mode</p>
//         </div>

//         {/* Card */}
//         <div className="relative w-full max-w-md p-8 rounded-2xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] backdrop-blur-md shadow-[0_20px_60px_rgba(2,6,23,0.6)] z-10">
//           {/* shimmer one-time */}
//           <div className="absolute inset-0 rounded-2xl pointer-events-none shimmer" />

//           <form onSubmit={handleSignup} className="space-y-5">
//             <div className="text-center">
//               <h2 className="text-lg font-semibold text-white">Create your LifeBoard account</h2>
//               <p className="text-sm text-slate-400 mt-1">Organize tasks, goals, journals and more.</p>
//             </div>

//             {msg && (
//               <div className="text-center">
//                 <span className="inline-block px-3 py-1 text-sm text-cyan-100 bg-[rgba(96,165,250,0.08)] rounded-md">
//                   {msg}
//                 </span>
//               </div>
//             )}

//             <div>
//               <label className="text-xs text-slate-300">Full name</label>
//               <input
//                 name="name"
//                 value={form.name}
//                 onChange={handleChange}
//                 className="mt-2 w-full px-4 py-3 rounded-lg bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#60A5FA]/30 transition"
//                 placeholder="Your full name"
//               />
//             </div>

//             <div>
//               <label className="text-xs text-slate-300">Email</label>
//               <input
//                 name="email"
//                 value={form.email}
//                 onChange={handleChange}
//                 type="email"
//                 className="mt-2 w-full px-4 py-3 rounded-lg bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#60A5FA]/30 transition"
//                 placeholder="you@example.com"
//               />
//             </div>

//             <div>
//               <label className="text-xs text-slate-300">Password</label>
//               <input
//                 name="password"
//                 value={form.password}
//                 onChange={handleChange}
//                 type="password"
//                 className="mt-2 w-full px-4 py-3 rounded-lg bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#60A5FA]/30 transition"
//                 placeholder="Enter a secure password"
//               />
//             </div>

//             <button
//               onMouseDown={createRipple}
//               disabled={loading}
//               type="submit"
//               className="relative overflow-hidden w-full mt-2 py-3 rounded-lg bg-gradient-to-r from-[#2563EB] to-[#60A5FA] text-white font-semibold shadow-[0_10px_30px_rgba(37,99,235,0.18)] disabled:opacity-50"
//             >
//               {loading ? (
//                 <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
//               ) : (
//                 "Create Account"
//               )}
//             </button>

//             <p className="text-center text-slate-400 text-sm mt-3">
//               Already have an account?{" "}
//               <Link href="/login" className="text-[#60A5FA] hover:underline">
//                 Login
//               </Link>
//             </p>
//             <p className="text-center text-xs text-slate-600 mt-2">By creating an account you agree to our Terms.</p>
//           </form>
//         </div>
//       </div>

//       {/* inline styles for shimmer & ripple */}
//       <style jsx>{`
//         .shimmer::before {
//           content: "";
//           position: absolute;
//           inset: 0;
//           border-radius: 14px;
//           padding: 2px;
//           background: linear-gradient(90deg, transparent, rgba(255,255,255,0.14), transparent);
//           background-size: 200% 100%;
//           animation: shimmerOnce 2.2s ease-out 1;
//         }
//         @keyframes shimmerOnce {
//           0% { background-position: 200% 0; }
//           100% { background-position: -200% 0; }
//         }

//         /* ripple */
//         .ripple {
//           position: absolute;
//           border-radius: 50%;
//           transform: scale(0);
//           background: rgba(255,255,255,0.18);
//           animation: ripple 600ms linear;
//           pointer-events: none;
//           mix-blend-mode: overlay;
//         }
//         @keyframes ripple {
//           to {
//             transform: scale(4);
//             opacity: 0;
//           }
//         }

//         /* minor responsive scaling */
//         @media (max-width: 640px) {
//           img { width: 68px; height: 68px; }
//         }
//       `}</style>
//     </div>
//   );
// }




