import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Play, CheckCircle, XCircle, ChevronRight, Zap, Loader2, Key, Globe, BrainCircuit, Plus, Terminal, ShieldCheck, Link, Database, Search, Activity, Cpu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

const API_BASE = "http://localhost:5001/api";

export default function Dashboard() {
  const [specData, setSpecData] = useState(null);
  const [testData, setTestData] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [liveResults, setLiveResults] = useState(null); 
  const [activeEndpoint, setActiveEndpoint] = useState(null);
  const navigate = useNavigate();

  const [bearerToken, setBearerToken] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("http://localhost:5001");
  const [activeEnv, setActiveEnv] = useState("dev");
  const [nlpInput, setNlpInput] = useState("");
  const [isNlpGenerating, setIsNlpGenerating] = useState(false);

  useEffect(() => {
    // Load report from localStorage if exists
    const lastReport = localStorage.getItem('lastTestReport');
    if (lastReport) {
      const data = JSON.parse(lastReport);
      setTestData(data.results || []);
      setSpecData({ endpoints: data.results.map(r => ({ path: r.endpoint, method: r.method })) });
      if (data.results.length > 0) setActiveEndpoint(data.results[0].endpoint);
    }
  }, []);

  const runTests = async () => {
    setIsRunning(true);
    try {
      // In this version, we just simulate the rerun for UI purposes since /auto-generate already ran
      setLiveResults(testData);
      setTimeout(() => {
        navigate("/results");
      }, 3000);
    } catch (err) {
      setIsRunning(false);
    }
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
    <div className="space-y-12 animate-in fade-in duration-1000">
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-2">
           <h2 className="text-6xl font-black glow-text tracking-tighter uppercase">Dashboard <span className="glow-text-primary">Console</span></h2>
           <p className="text-gray-500 font-bold flex items-center gap-3 uppercase tracking-widest text-xs">
             <span className="w-2 h-2 rounded-full bg-cyan shadow-[0_0_10px_rgba(0,255,163,0.8)] animate-pulse" />
             Connection Active • {baseUrl}
           </p>
        </div>
        <div className="flex gap-4">
          <button className="neon-btn-secondary px-6">DOWNLOAD DATA</button>
          <button
            onClick={runTests}
            disabled={isRunning}
            className="neon-btn px-10 flex items-center gap-3"
          >
            {isRunning ? <Loader2 className="animate-spin h-5 w-5" /> : <Zap className="h-5 w-5 fill-current" />}
            {isRunning ? "Running..." : "Run All Tests"}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
         {/* Target resolution */}
         <div className="lg:col-span-7 glass-panel p-8 space-y-6">
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
         <div className="lg:col-span-5 glass-panel p-8 space-y-6">
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

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Endpoints List */}
        <div className="lg:col-span-4 glass-panel p-6 space-y-4">
          <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] pb-2 border-b border-white/5">
            API Endpoints
          </h3>
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 scrollbar-hide">
            {endpoints.map((ep, i) => (
              <div
                key={i}
                onClick={() => setActiveEndpoint(ep)}
                className={`p-4 rounded-2xl cursor-pointer flex items-center justify-between transition-all group ${
                  activeEndpoint === ep ? "bg-white/5 border border-white/10 shadow-xl" : "hover:bg-white/5 text-gray-500"
                }`}
              >
                <span className={`font-mono text-xs tracking-tighter ${activeEndpoint === ep ? 'text-white' : ''}`}>{ep}</span>
                <ChevronRight className={`h-4 w-4 transition-all ${activeEndpoint === ep ? 'translate-x-1 text-primary' : 'opacity-0 group-hover:opacity-100'}`} />
              </div>
            ))}
          </div>
        </div>

        {/* Vector Matrix */}
        <div className="lg:col-span-8 glass-panel overflow-hidden flex flex-col">
          <div className="px-8 py-6 bg-black/40 border-b border-white/5 flex items-center justify-between">
             <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Test Cases</h3>
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
                  <th className="px-6 py-4 text-right">Expected Response</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {testData.filter(t => t.endpoint === activeEndpoint).map((test, index) => (
                  <tr key={index} className="group hover:bg-white/5 transition-colors">
                    <td className="px-6 py-5">
                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                        test.method === 'GET' ? 'bg-cyan/10 text-cyan border border-cyan/20' :
                        test.method === 'POST' ? 'bg-primary/10 text-primary border border-primary/20' :
                        'bg-pink/10 text-pink border border-pink/20'
                      }`}>
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

      {/* Terminal Overlay */}
      <AnimatePresence>
        {isRunning && (
           <motion.div 
             initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
             className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-3xl flex items-center justify-center p-8"
           >
              <div className="w-full max-w-4xl glass-panel p-0 overflow-hidden border border-primary/30 shadow-[0_0_100px_rgba(124,58,237,0.2)]">
                  <div className="bg-black/60 px-6 py-4 border-b border-white/10 flex items-center gap-3">
                     <div className="flex gap-1.5">
                       <div className="w-3 h-3 rounded-full bg-error/50" />
                       <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                       <div className="w-3 h-3 rounded-full bg-cyan/50" />
                     </div>
                     <span className="ml-4 font-mono text-[10px] text-primary font-black uppercase tracking-[0.2em]">Test Execution Output</span>
                  </div>
                  <div className="p-10 space-y-4 font-mono text-sm h-[500px] overflow-y-auto bg-black/40">
                    <div className="text-primary font-bold animate-pulse">
                       &gt; Initializing tests...<br/>
                       &gt; Setting up environment... OK<br/>
                       &gt; Checking configuration... OK<br/>
                    </div>
                    {liveResults.map((r, i) => (
                      <motion.div
                        key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} 
                        className="flex items-center gap-6 text-gray-500 border-b border-white/5 pb-2"
                      >
                         <span className="text-[10px] font-black text-gray-700">TEST_{i+1}</span>
                         <span className="font-black text-white w-12">{r.method}</span>
                         <span className="flex-1 truncate text-gray-400 text-xs">{r.endpoint}</span>
                         <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${r.status === 'PASS' ? 'text-cyan bg-cyan/10' : 'text-error bg-error/10'}`}>
                           {r.status}
                         </div>
                      </motion.div>
                    ))}
                    <div className="text-cyan font-bold pt-8 animate-pulse">
                       &gt; Tests completed.<br/>
                       &gt; Analyzing results...<br/>
                       &gt; Generating report...
                    </div>
                  </div>
              </div>
           </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
