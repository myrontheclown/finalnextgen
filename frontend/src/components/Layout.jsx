import { Link, Outlet, useLocation } from "react-router-dom";
import { Activity, Upload, LayoutDashboard, FileText } from "lucide-react";
import { cn } from "../lib/utils";
import { useEffect, useState } from "react";

export default function Layout() {
  const location = useLocation();
  const [particles, setParticles] = useState([]);

  // Generate random particles for the background
  useEffect(() => {
    const p = Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100 + 100}%`,
      duration: `${15 + Math.random() * 20}s`,
      drift: `${(Math.random() - 0.5) * 200}px`,
      delay: `${Math.random() * 10}s`
    }));
    setParticles(p);
  }, []);

  const navItems = [
    { name: "Bridge", path: "/", icon: Upload },
    { name: "Analytics", path: "/dashboard", icon: LayoutDashboard },
    { name: "Neural Results", path: "/results", icon: FileText },
  ];

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Dynamic Background Elements */}
      <div className="pixel-overlay" />
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {particles.map(p => (
          <div 
            key={p.id}
            className="particle"
            style={{ 
              left: p.left, 
              top: p.top, 
              '--duration': p.duration, 
              '--drift': p.drift,
              animationDelay: p.delay 
            }}
          />
        ))}
        {/* Soft Radial Orbs */}
        <div className="absolute top-[10%] left-[10%] w-[40rem] h-[40rem] bg-primary/10 rounded-full blur-[120px] animate-glow" />
        <div className="absolute bottom-[10%] right-[10%] w-[30rem] h-[30rem] bg-accent/10 rounded-full blur-[100px] animate-glow" style={{ animationDelay: '-1.5s' }} />
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="p-2 bg-primary/20 rounded-xl border border-primary/30 group-hover:shadow-[0_0_20px_rgba(124,58,237,0.5)] transition-all">
              <Activity className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-black glow-text-primary uppercase tracking-tighter">
                TestGen AI
              </h1>
              <p className="text-[10px] text-gray-500 font-bold tracking-[0.2em] uppercase -mt-1">Neural Bridge</p>
            </div>
          </div>
          
          <nav className="flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all relative overflow-hidden",
                    isActive 
                      ? "text-white bg-white/5 border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]" 
                      : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                  )}
                >
                  <Icon className={cn("h-4 w-4", isActive ? "text-primary" : "")} />
                  {item.name}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-4">
             <div className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
             <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Network Stable</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-10 relative z-10">
        <Outlet />
      </main>

      <footer className="py-8 text-center border-t border-white/5 relative z-10">
        <p className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.4em]">
          Powered by NextGen Neural Suite • v3.0.4
        </p>
      </footer>
    </div>
  );
}
