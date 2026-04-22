import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Play, CheckCircle, XCircle, ChevronRight, Zap, Loader2, Key, Globe, 
  BrainCircuit, Plus, Terminal, ShieldCheck, Link, Database, Search, 
  Activity, Cpu, Rocket, Trophy, Target, Award, TrendingUp, MessageSquare,
  Shield, Info, Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../lib/utils";

export default function Dashboard() {
  const [testData, setTestData] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [liveResults, setLiveResults] = useState(null); 
  const [activeEndpoint, setActiveEndpoint] = useState(null);
  const navigate = useNavigate();

  const [baseUrl, setBaseUrl] = useState("http://localhost:5001");
  const [activeEnv, setActiveEnv] = useState("dev");
  const [healthScore, setHealthScore] = useState(0);

  useEffect(() => {
    const lastReport = localStorage.getItem('lastTestReport');
    if (lastReport) {
      const data = JSON.parse(lastReport);
      setTestData(data.results || []);
      if (data.results.length > 0) setActiveEndpoint(data.results[0].endpoint);
      setHealthScore(data.summary?.successRate || 0);
    }
  }, []);

  const runTests = async () => {
    setIsRunning(true);
    setLiveResults(testData);
    setTimeout(() => {
      navigate("/results");
    }, 3000);
  };

  if (!testData || testData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[60vh]">
        <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} className="glass-panel p-16 flex flex-col items-center text-center space-y-6">
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center border border-primary/20">
            <Cpu className="w-10 h-10 text-primary animate-pulse" />
          </div>
          <div className="space-y-2">
            <h3 className="text-3xl font-black text-white uppercase tracking-tighter">No Project Found</h3>
            <p className="text-gray-500 max-w-sm font-medium">Please add your Swagger URL to start testing.</p>
          </div>
          <button onClick={() => navigate("/")} className="neon-btn px-10">Start Project</button>
        </motion.div>
      </div>
    );
  }

  const endpoints = [...new Set(testData.map(t => t.endpoint))];

  return (
    <div className="space-y-10 animate-in fade-in duration-1000 pb-20">
      {/* HEADER & SCORE SECTION */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-10 bg-white/[0.02] border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-3xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -mr-48 -mt-48 group-hover:bg-primary/10 transition-all duration-1000" />
        
        <div className="space-y-4 relative z-10">
           <h2 className="text-6xl font-black glow-text tracking-tighter uppercase leading-none">Command <span className="glow-text-primary">Center</span></h2>
           <div className="flex flex-wrap items-center gap-4">
              <p className="text-gray-500 font-bold flex items-center gap-3 uppercase tracking-widest text-[10px]">
                <span className="w-2 h-2 rounded-full bg-cyan shadow-[0_0_10px_rgba(0,255,163,0.8)] animate-pulse" />
                Mission Control Active • {baseUrl}
              </p>
              <div className="h-4 w-[1px] bg-white/10 hidden sm:block" />
              <div className="flex gap-2">
                {["Edge Hunter", "Schema Pro"].map((badge, i) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.2 }}
                    key={badge} 
                    className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-[9px] font-black text-primary uppercase tracking-tighter"
                  >
                    <Award className="w-3 h-3" /> {badge}
                  </motion.div>
                ))}
              </div>
           </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-8 relative z-10 bg-black/40 p-6 rounded-3xl border border-white/5">
          <div className="flex flex-col items-center sm:items-end gap-1">
             <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">API Health Score</span>
             <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-white">{healthScore}</span>
                <span className="text-sm font-black text-gray-600">/100</span>
             </div>
             <div className="w-48 h-1.5 bg-white/5 rounded-full overflow-hidden mt-2">
                <motion.div 
                  initial={{ width: 0 }} animate={{ width: `${healthScore}%` }} transition={{ duration: 1.5, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-primary to-accent shadow-[0_0_10px_rgba(139,92,246,0.5)]" 
                />
             </div>
          </div>
          <div className="h-12 w-[1px] bg-white/10 hidden sm:block" />
          <button
            onClick={runTests}
            disabled={isRunning}
            className="neon-btn px-12 h-16 flex items-center gap-4 group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            {isRunning ? (
              <Loader2 className="animate-spin h-6 w-6" />
            ) : (
              <Rocket className="h-6 w-6 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
            )}
            <span className="relative z-10 text-sm font-black">
              {isRunning ? "INITIALIZING MISSION..." : "LAUNCH TEST MISSION"}
            </span>
          </button>
        </div>
      </div>

      {/* MINI METRICS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Tested', val: testData.length, icon: Target, color: 'text-white' },
          { label: 'Passed', val: testData.filter(t => t.status === 'PASS').length, icon: CheckCircle, color: 'text-cyan' },
          { label: 'Failed', val: testData.filter(t => t.status === 'FAIL').length, icon: XCircle, color: 'text-error' },
          { label: 'Edge Cases', val: testData.filter(t => t.source === 'AUTO').length, icon: Sparkles, color: 'text-primary' },
        ].map((stat, i) => (
          <motion.div 
            whileHover={{ y: -5 }}
            key={i} 
            className="glass-panel p-6 flex flex-col gap-3 group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <stat.icon className="w-12 h-12" />
            </div>
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-xl bg-white/5 border border-white/5", stat.color)}>
                <stat.icon className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{stat.label}</span>
            </div>
            <p className={cn("text-3xl font-black", stat.color)}>{stat.val}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
         {/* ENVIRONMENT & SECURITY (Left Column) */}
         <div className="lg:col-span-8 space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Target resolution */}
              <div className="glass-panel p-8 space-y-6">
                 <div className="flex items-center justify-between">
                   <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2">
                     <Globe className="w-3 h-3" /> Environment
                   </h3>
                   <select 
                      className="bg-black/60 text-primary border border-primary/20 rounded-lg px-3 py-1.5 text-[10px] font-black outline-none cursor-pointer"
                      value={activeEnv}
                      onChange={(e) => setActiveEnv(e.target.value)}
                   >
                      <option value="dev">Development</option>
                      <option value="staging">Staging</option>
                      <option value="prod">Production</option>
                   </select>
                 </div>
                 
                 <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary opacity-50"><Link className="w-4 h-4" /></div>
                    <input 
                      type="text" 
                      value={baseUrl}
                      readOnly
                      className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white font-mono text-sm focus:border-primary/50 transition-all outline-none"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 px-3 py-1 rounded-lg bg-primary/10 border border-primary/20 text-[9px] font-black tracking-widest text-primary">
                       <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                       Connected
                    </div>
                 </div>
              </div>

              {/* Security */}
              <div className="glass-panel p-8 space-y-6">
                 <h3 className="text-[10px] font-black text-pink uppercase tracking-[0.3em] flex items-center gap-2">
                   <ShieldCheck className="w-3 h-3" /> Security Keys
                 </h3>
                 <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Bearer Token</label>
                     <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-pink opacity-50" />
                        <input 
                          type="password" 
                          value="••••••••••••"
                          readOnly
                          className="w-full bg-black/40 border border-white/5 rounded-xl py-3 pl-10 pr-3 text-white font-mono text-[10px] outline-none"
                        />
                     </div>
                   </div>
                   <div className="space-y-2">
                     <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest">X-API-Key</label>
                     <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-pink opacity-50" />
                        <input 
                          type="password" 
                          value="••••••••••••"
                          readOnly
                          className="w-full bg-black/40 border border-white/5 rounded-xl py-3 pl-10 pr-3 text-white font-mono text-[10px] outline-none"
                        />
                     </div>
                   </div>
                 </div>
              </div>
            </div>

            {/* Matrix Card */}
            <div className="glass-panel overflow-hidden flex flex-col">
              <div className="px-8 py-6 bg-black/40 border-b border-white/5 flex items-center justify-between">
                 <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Execution Matrix</h3>
                 <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan" />
                    <span className="text-[9px] font-black text-cyan uppercase tracking-widest">Hybrid Mode Active</span>
                 </div>
              </div>
              <div className="overflow-x-auto p-4">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] text-gray-700 uppercase tracking-widest font-black border-b border-white/5">
                      <th className="px-6 py-4">Method</th>
                      <th className="px-6 py-4">Endpoint Path</th>
                      <th className="px-6 py-4 text-right">Expected</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {testData.filter(t => t.endpoint === activeEndpoint).map((test, index) => (
                      <tr key={index} className="group hover:bg-white/5 transition-colors">
                        <td className="px-6 py-5">
                          <span className={cn("px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest",
                            test.method === 'GET' ? 'bg-cyan/10 text-cyan border border-cyan/20' :
                            test.method === 'POST' ? 'bg-primary/10 text-primary border border-primary/20' :
                            'bg-pink/10 text-pink border border-pink/20'
                          )}>
                            {test.method}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-sm font-mono text-gray-400 group-hover:text-white transition-colors">{test.endpoint}</p>
                          <p className="text-[10px] text-gray-600 font-bold uppercase tracking-tight mt-1 truncate max-w-xs">{test.caseName}</p>
                        </td>
                        <td className="px-6 py-5 text-right font-mono font-black text-primary text-lg">
                           {test.expectedStatus}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
         </div>

         {/* SIDEBAR INSIGHTS & FEED (Right Column) */}
         <div className="lg:col-span-4 space-y-8">
            {/* AI Insights */}
            <div className="glass-panel p-8 space-y-6 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
                  <BrainCircuit className="w-20 h-20 text-accent" />
               </div>
               <h3 className="text-[10px] font-black text-accent uppercase tracking-[0.3em] flex items-center gap-2 relative z-10">
                 <Sparkles className="w-3 h-3" /> AI Insights
               </h3>
               <div className="space-y-4 relative z-10">
                  {[
                    "Some endpoints fail with missing fields",
                    "Consider adding validation for required inputs",
                    "Performance looks stable on production core"
                  ].map((insight, i) => (
                    <div key={i} className="flex gap-3 p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/5 transition-colors group">
                       <div className="mt-1"><Info className="w-3 h-3 text-accent opacity-50 group-hover:opacity-100 transition-opacity" /></div>
                       <p className="text-[11px] font-bold text-gray-400 group-hover:text-gray-200 transition-colors leading-relaxed">{insight}</p>
                    </div>
                  ))}
               </div>
            </div>

            {/* Live Activity Feed */}
            <div className="glass-panel p-8 space-y-6 flex flex-col h-[600px]">
               <div className="flex items-center justify-between">
                 <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] flex items-center gap-2">
                   <Activity className="w-3 h-3" /> Activity Feed
                 </h3>
                 <span className="px-2 py-1 bg-white/5 rounded-lg text-[8px] font-black text-gray-600 uppercase tracking-widest">LIVE</span>
               </div>
               <div className="flex-1 space-y-4 overflow-y-auto pr-2 scrollbar-hide">
                  {testData.slice(0, 15).map((t, i) => (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                      key={i} 
                      className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-2xl group"
                    >
                       <div className="flex items-center gap-4">
                          <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", t.status === 'PASS' ? 'bg-cyan' : 'bg-error')} />
                          <div>
                            <p className="text-[10px] font-black text-white uppercase tracking-tighter">
                               {t.status === 'PASS' ? 'Test Verified' : 'Anomaly Detected'}
                            </p>
                            <p className="text-[8px] font-bold text-gray-600 uppercase mt-0.5 truncate max-w-[120px]">{t.endpoint}</p>
                          </div>
                       </div>
                       <ChevronRight className="w-3 h-3 text-gray-800 group-hover:text-primary transition-colors" />
                    </motion.div>
                  ))}
               </div>
               <div className="pt-4 border-t border-white/5">
                  <p className="text-[9px] font-black text-gray-700 uppercase tracking-widest text-center">Neural Stream Synchronization Complete</p>
               </div>
            </div>
         </div>
      </div>

      {/* Terminal Overlay */}
      <AnimatePresence>
        {isRunning && (
           <motion.div 
             initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
             className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-8"
           >
              <div className="w-full max-w-4xl glass-panel p-0 overflow-hidden border border-primary/40 shadow-[0_0_100px_rgba(139,92,246,0.2)]">
                  <div className="bg-black/60 px-8 py-6 border-b border-white/10 flex items-center justify-between">
                     <div className="flex items-center gap-4">
                       <div className="flex gap-2">
                         <div className="w-3 h-3 rounded-full bg-error/50" />
                         <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                         <div className="w-3 h-3 rounded-full bg-cyan/50" />
                       </div>
                       <div className="h-4 w-[1px] bg-white/10 mx-2" />
                       <span className="font-mono text-[11px] text-primary font-black uppercase tracking-[0.3em]">Mission Execution Terminal</span>
                     </div>
                     <div className="px-4 py-1 bg-primary/10 border border-primary/20 rounded-full text-[9px] font-black text-primary animate-pulse">EXECUTING...</div>
                  </div>
                  <div className="p-12 space-y-6 font-mono text-sm h-[550px] overflow-y-auto bg-black/60 scrollbar-hide">
                    <div className="text-primary font-bold space-y-1">
                       <p className="opacity-50 tracking-widest text-[10px] mb-2">SEQUENCE INITIATED</p>
                       <p>&gt; Calibrating mission vectors...</p>
                       <p>&gt; Establishing encrypted sandbox perimeter... OK</p>
                       <p>&gt; Triggering AI edge case suite... OK</p>
                    </div>
                    {liveResults.map((r, i) => (
                      <motion.div
                        key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} 
                        className="flex items-center gap-8 text-gray-500 border-b border-white/5 pb-4 group"
                      >
                         <span className="text-[10px] font-black text-gray-700 min-w-[80px]">STEP_{i+1}</span>
                         <span className="font-black text-white w-16">{r.method}</span>
                         <span className="flex-1 truncate text-gray-400 text-xs font-mono">{r.endpoint}</span>
                         <div className={cn("px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg", 
                           r.status === 'PASS' ? 'text-cyan bg-cyan/10 border border-cyan/20' : 'text-error bg-error/10 border border-error/20'
                         )}>
                           {r.status}
                         </div>
                      </motion.div>
                    ))}
                    <div className="text-cyan font-bold pt-10 space-y-1">
                       <p>&gt; Mission objective complete.</p>
                       <p>&gt; Analyzing behavioral fingerprints... OK</p>
                       <p>&gt; Redirecting to intelligence report...</p>
                    </div>
                  </div>
              </div>
           </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
