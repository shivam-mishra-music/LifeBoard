export default function DashboardPage() {
  return (
    <div className="relative z-10 animate-fadeIn">
      <p className="text-xs uppercase tracking-[0.18em] text-indigo-300/80 mb-1">
        Dashboard
      </p>

      <h1 className="text-3xl font-semibold text-white">
        Welcome back, <span className="text-indigo-300">Shivam</span>
      </h1>

      <p className="text-sm text-slate-400 mt-1">
        Here’s your daily overview.
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        
        {/* Card 1 */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-xl shadow-black/40">
          <h2 className="text-sm font-semibold mb-2">Today`s Overview</h2>
          <p className="text-slate-400 text-sm">Coming soon...</p>
        </div>

        {/* Card 2 */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
          <h2 className="text-sm font-semibold mb-2">Quick Actions</h2>
          <p className="text-slate-400 text-sm">Coming soon...</p>
        </div>

      </div>
    </div>
  );
}
