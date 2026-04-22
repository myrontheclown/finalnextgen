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
    { name: "Connect", path: "/", icon: Upload },
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Test Results", path: "/results", icon: FileText },
  ];

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Dynamic Background Elements */}
      <div className="pixel-overlay" />
      <div className="page-edge-glow" />
      
      {/* Corner Glass Orbs */}
      <div className="corner-glass top-left-orb" />
      <div className="corner-glass top-right-orb" />
      <div className="corner-glass bottom-left-orb" />
      <div className="corner-glass bottom-right-orb" />

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
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="p-2.5 bg-primary/20 rounded-2xl border border-primary/40 group-hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-all duration-500">
              <Activity className="h-6 w-6 text-primary filter drop-shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
            </div>
            <div>
              <h1 className="text-2xl font-black glow-text-primary uppercase tracking-tighter leading-none">
                TestGen AI
              </h1>
              <p className="text-[9px] text-gray-400 font-black tracking-[0.3em] uppercase mt-1 opacity-80">API Testing made simple</p>
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
             <div className="h-2 w-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(139,92,246,0.8)]" />
             <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">System Ready</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-10 relative z-10">
        <Outlet />
      </main>

      <footer className="py-8 text-center border-t border-white/5 relative z-10">
        <p className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.4em]">
          Powered by TestGen AI • v3.0.4
        </p>
      </footer>
    </div>
  );
}
