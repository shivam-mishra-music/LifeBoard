"use client";

import Link from "next/link";
import { Outfit } from "next/font/google";
import Reveal from "./Reveal";
import ScrollFramePlayer from "./ScrollFramePlayer";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-outfit",
});

/* ----------------------------- tiny glyphs ----------------------------- */

function CheckGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M5 13l4 4L19 7" stroke="#818cf8" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function FlameGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="flicker">
      <path
        d="M12 2c1 4-3 5-3 9a3 3 0 006 0c0-1.5-1-2-1-3.5 1.5 1 3 3 3 5.5a5 5 0 11-10 0c0-4 3-6 5-11z"
        fill="#fbbf24"
      />
    </svg>
  );
}
function MoodGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="#fb7185" strokeWidth="2" />
      <path d="M8 14c1.2 1.3 2.6 2 4 2s2.8-.7 4-2" stroke="#fb7185" strokeWidth="2" strokeLinecap="round" />
      <circle cx="9" cy="10" r="1" fill="#fb7185" />
      <circle cx="15" cy="10" r="1" fill="#fb7185" />
    </svg>
  );
}
function NoteGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M4 6h16M4 12h10M4 18h13" stroke="#34d399" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* --------------------------- orbit hero pieces --------------------------- */

function OrbitChip({ color, children }) {
  return (
    <div
      className="w-10 h-10 rounded-full border flex items-center justify-center"
      style={{
        background: "rgba(12,18,32,0.9)",
        borderColor: `${color}55`,
        boxShadow: `0 6px 24px -8px ${color}77`,
      }}
    >
      {children}
    </div>
  );
}

function OrbitItem({ angle, radius, duration, reverse = false, children }) {
  const dir = reverse ? "spin-ccw" : "spin-cw";
  const counterDir = reverse ? "spin-cw" : "spin-ccw";
  return (
    <div className="absolute left-1/2 top-1/2" style={{ width: 0, height: 0, transform: `rotate(${angle}deg)` }}>
      <div style={{ animation: `${dir} ${duration}s linear infinite` }}>
        <div className="absolute" style={{ transform: `translate(-50%, -50%) translateY(-${radius}px)` }}>
          <div style={{ animation: `${counterDir} ${duration}s linear infinite` }}>{children}</div>
        </div>
      </div>
    </div>
  );
}

function OrbitHero() {
  return (
    <div className="relative w-[280px] h-[280px] sm:w-[360px] sm:h-[360px]">
      {/* core */}
      <div className="orbit-core absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center z-10">
        <svg width="100" height="100" viewBox="0 0 100 100" className="absolute -rotate-90">
          <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="4" />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="white"
            strokeWidth="4"
            strokeLinecap="round"
            pathLength="100"
            className="draw"
            style={{ "--draw-to": 28, "--draw-delay": "0.3s" }}
          />
        </svg>
        <span className="font-display relative text-white text-sm font-semibold">Today</span>
      </div>

      <OrbitItem angle={0} radius={138} duration={16}>
        <OrbitChip color="#6366f1">
          <CheckGlyph />
        </OrbitChip>
      </OrbitItem>
      <OrbitItem angle={90} radius={112} duration={22} reverse>
        <OrbitChip color="#fbbf24">
          <FlameGlyph />
        </OrbitChip>
      </OrbitItem>
      <OrbitItem angle={185} radius={148} duration={28}>
        <OrbitChip color="#fb7185">
          <MoodGlyph />
        </OrbitChip>
      </OrbitItem>
      <OrbitItem angle={270} radius={124} duration={20} reverse>
        <OrbitChip color="#34d399">
          <NoteGlyph />
        </OrbitChip>
      </OrbitItem>
    </div>
  );
}

/* ----------------------------- feature icons ----------------------------- */

function IconShell({ stroke, fill, children }) {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" fill="none" className="mb-4">
      <rect x="3" y="3" width="28" height="28" rx="8" stroke={stroke} strokeWidth="2" fill={fill} />
      {children}
    </svg>
  );
}

function TasksIcon() {
  return (
    <IconShell stroke="#6366f1" fill="rgba(99,102,241,0.08)">
      <path
        d="M10 17.5l4.5 4.5L24 12"
        stroke="#818cf8"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength="100"
        className="draw"
      />
    </IconShell>
  );
}

function HabitsIcon() {
  return (
    <div className="relative mb-4 w-[34px] h-[34px]">
      <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
        <rect x="3" y="3" width="28" height="28" rx="8" stroke="#f59e0b" strokeWidth="2" fill="rgba(245,158,11,0.08)" />
      </svg>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="flicker absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <path
          d="M12 2c1 4-3 5-3 9a3 3 0 006 0c0-1.5-1-2-1-3.5 1.5 1 3 3 3 5.5a5 5 0 11-10 0c0-4 3-6 5-11z"
          fill="#fbbf24"
        />
      </svg>
    </div>
  );
}

function CalendarIcon() {
  return (
    <IconShell stroke="#fb7185" fill="rgba(251,113,133,0.08)">
      <rect x="9" y="10" width="4" height="4" rx="1" fill="#fb7185" opacity="0.35" />
      <rect x="15" y="10" width="4" height="4" rx="1" fill="#fbbf24" />
      <rect x="21" y="10" width="4" height="4" rx="1" fill="#fb7185" opacity="0.35" />
      <rect x="9" y="16" width="4" height="4" rx="1" fill="#fb7185" opacity="0.35" />
      <rect x="15" y="16" width="4" height="4" rx="1" fill="#34d399" opacity="0.6" />
      <rect x="21" y="16" width="4" height="4" rx="1" fill="#fb7185" opacity="0.35" />
    </IconShell>
  );
}

function JournalIcon() {
  return (
    <IconShell stroke="#34d399" fill="rgba(52,211,153,0.08)">
      <path d="M9 12h16" stroke="#34d399" strokeWidth="2" strokeLinecap="round" pathLength="100" className="draw" style={{ "--draw-delay": "0.1s" }} />
      <path d="M9 17h16" stroke="#34d399" strokeWidth="2" strokeLinecap="round" pathLength="100" className="draw" style={{ "--draw-delay": "0.3s" }} />
      <path d="M9 22h10" stroke="#34d399" strokeWidth="2" strokeLinecap="round" pathLength="100" className="draw" style={{ "--draw-delay": "0.5s" }} />
    </IconShell>
  );
}

function NotesIcon() {
  return (
    <IconShell stroke="#818cf8" fill="rgba(129,140,248,0.08)">
      <path d="M10 9h14v10l-5 5H10V9z" stroke="#a5b4fc" strokeWidth="1.6" fill="none" />
      <path d="M19 19v5l5-5h-5z" fill="#a5b4fc" opacity="0.5" />
    </IconShell>
  );
}

function OverviewIcon() {
  return (
    <IconShell stroke="#6366f1" fill="rgba(99,102,241,0.08)">
      <circle cx="17" cy="17" r="8" stroke="rgba(255,255,255,0.15)" strokeWidth="2.4" fill="none" />
      <circle
        cx="17"
        cy="17"
        r="8"
        stroke="#818cf8"
        strokeWidth="2.4"
        fill="none"
        strokeLinecap="round"
        pathLength="100"
        className="draw"
        style={{ "--draw-to": 22, "--draw-delay": "0.2s", transformOrigin: "17px 17px", transform: "rotate(-90deg)" }}
      />
    </IconShell>
  );
}

const FEATURES = [
  { Icon: TasksIcon, title: "Tasks", desc: "Add, prioritize, and check things off. A list that actually keeps up with you." },
  { Icon: HabitsIcon, title: "Habits & streaks", desc: "Build a habit and watch the streak grow. Miss a day, pick it right back up tomorrow." },
  { Icon: CalendarIcon, title: "Calendar & mood", desc: "Mark how you felt and rate your day's productivity, then look back on any date." },
  { Icon: JournalIcon, title: "Journal", desc: "Write a few lines about your day, right where you logged it." },
  { Icon: NotesIcon, title: "Notes", desc: "Jot things down and find them later. No folders to manage." },
  { Icon: OverviewIcon, title: "Overview", desc: "Every task, habit, and mood you've logged, turned into one clear picture." },
];

const STEPS = [
  { n: "01", title: "Log your day", desc: "Add tasks, mark your mood, tick off habits. Takes under a minute." },
  { n: "02", title: "See the patterns", desc: "Your Overview page turns weeks of logs into mood trends, streaks, and scores." },
  { n: "03", title: "Keep the streak alive", desc: "Come back tomorrow. The board remembers everything so you don't have to." },
];

/* ------------------ fallback hero (used if AI frames fail to load) ------------------ */

function HeroFallback() {
  return (
    <section className="relative pt-36 sm:pt-40 pb-20 sm:pb-24 px-5 sm:px-8 overflow-hidden">
      <div className="absolute top-10 -left-24 w-72 h-72 bg-indigo-600/20 blur-[100px] rounded-full float pointer-events-none" />
      <div
        className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full float pointer-events-none"
        style={{ animationDelay: "1.5s" }}
      />

      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-14 lg:gap-16 items-center relative">
        <Reveal>
          <div>
            <span className="font-mono text-xs tracking-[0.2em] text-indigo-400/80 uppercase">
              Personal life organizer
            </span>
            <h1 className="font-display text-5xl sm:text-6xl font-bold text-white mt-4 leading-[1.05] tracking-tight">
              Every day,
              <br />
              mapped.
            </h1>
            <p className="text-slate-400 text-lg mt-6 max-w-md leading-relaxed">
              LifeBoard pulls your tasks, habits, mood, and notes into one board, so you can see what&apos;s
              actually working.
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-9">
              <Link
                href="/signup"
                className="font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors px-6 py-3.5 rounded-xl shadow-lg shadow-indigo-900/50"
              >
                Get started free
              </Link>
              <Link
                href="/login"
                className="font-medium text-slate-300 hover:text-white transition-colors px-6 py-3.5 rounded-xl border border-white/10 hover:border-white/20"
              >
                I already have an account
              </Link>
            </div>
          </div>
        </Reveal>

        <Reveal delay={150}>
          <div className="flex justify-center lg:justify-end">
            <OrbitHero />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* --------------------------------- page --------------------------------- */

export default function LandingPage() {
  return (
    <div className={outfit.variable}>
      {/* nav */}
      <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-[#030611]/70 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/lifeboard-logo1.svg" alt="LifeBoard" className="w-8 h-8" />
            <span className="font-display text-lg font-bold text-white tracking-tight">
              Life<span className="text-indigo-400">Board</span>
            </span>
          </div>
          <nav className="flex items-center gap-2 sm:gap-3">
            <Link href="/login" className="text-sm text-slate-300 hover:text-white transition-colors px-3 py-2">
              Log in
            </Link>
            <Link
              href="/signup"
              className="text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors px-4 py-2 rounded-lg shadow-lg shadow-indigo-900/40"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* hero — scroll-driven frame sequence, falls back to CSS orbit if frames fail to load */}
        <ScrollFramePlayer
          frameCount={117}
          framePrefix="/hero-frames/frame_"
          scrollHeight="220vh"
          fallback={<HeroFallback />}
        >
          <div className="max-w-xl pl-5 sm:pl-8 lg:pl-16">
            <span className="font-mono text-xs tracking-[0.2em] text-indigo-400/80 uppercase">
              Personal life organizer
            </span>
            <h1 className="font-display text-5xl sm:text-6xl font-bold text-white mt-4 leading-[1.05] tracking-tight">
              Every day,
              <br />
              mapped.
            </h1>
            <p className="text-slate-400 text-lg mt-6 max-w-md leading-relaxed">
              LifeBoard pulls your tasks, habits, mood, and notes into one board, so you can see what&apos;s
              actually working.
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-9">
              <Link
                href="/signup"
                className="font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors px-6 py-3.5 rounded-xl shadow-lg shadow-indigo-900/50"
              >
                Get started free
              </Link>
              <Link
                href="/login"
                className="font-medium text-slate-300 hover:text-white transition-colors px-6 py-3.5 rounded-xl border border-white/10 hover:border-white/20"
              >
                I already have an account
              </Link>
            </div>
          </div>
        </ScrollFramePlayer>

        {/* feature grid */}
        <section className="px-5 sm:px-8 py-20 sm:py-24">
          <div className="max-w-6xl mx-auto">
            <Reveal>
              <div className="max-w-xl mb-12">
                <span className="font-mono text-xs tracking-[0.2em] text-indigo-400/80 uppercase">What&apos;s on the board</span>
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mt-3">
                  Everything that makes up your day, in one place.
                </h2>
              </div>
            </Reveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {FEATURES.map((f, i) => (
                <Reveal key={f.title} delay={(i % 3) * 70}>
                  <div className="card-glow h-full rounded-2xl border border-white/10 bg-white/5 p-6">
                    <f.Icon />
                    <h3 className="font-display text-lg font-semibold text-white mb-1.5">{f.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* how it works */}
        <section className="px-5 sm:px-8 py-20 sm:py-24 border-t border-white/5">
          <div className="max-w-6xl mx-auto">
            <Reveal>
              <div className="max-w-xl mb-14">
                <span className="font-mono text-xs tracking-[0.2em] text-indigo-400/80 uppercase">How it works</span>
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mt-3">
                  Three minutes a day adds up fast.
                </h2>
              </div>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
              {STEPS.map((s, i) => (
                <Reveal key={s.n} delay={i * 100}>
                  <div className="relative pl-0">
                    <span className="font-mono text-xs tracking-widest text-indigo-400/70">{s.n}</span>
                    <h3 className="font-display text-xl font-semibold text-white mt-2 mb-2">{s.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{s.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* final CTA */}
        <section className="px-5 sm:px-8 py-20 sm:py-24">
          <Reveal>
            <div className="max-w-4xl mx-auto text-center relative rounded-3xl border border-white/10 bg-gradient-to-br from-[#0b1126] to-[#111c3d] px-8 py-16 sm:py-20 overflow-hidden">
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 bg-indigo-600/20 blur-[100px] rounded-full pointer-events-none" />
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-white relative">Start your board today.</h2>
              <p className="text-slate-400 mt-4 relative">Free to use. Takes less than a minute to set up.</p>
              <Link
                href="/signup"
                className="inline-block mt-8 font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors px-7 py-3.5 rounded-xl shadow-lg shadow-indigo-900/50 relative"
              >
                Create your account
              </Link>
            </div>
          </Reveal>
        </section>
      </main>

      {/* footer */}
      <footer className="border-t border-white/5 px-5 sm:px-8 py-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src="/lifeboard-logo1.svg" alt="LifeBoard" className="w-6 h-6" />
            <span className="font-display text-sm font-semibold text-slate-300">LifeBoard</span>
          </div>
          <p className="text-xs text-slate-500">Your days, organized.</p>
          <div className="flex items-center gap-5 text-sm text-slate-400">
            <Link href="/login" className="hover:text-white transition-colors">
              Log in
            </Link>
            <Link href="/signup" className="hover:text-white transition-colors">
              Sign up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
