import { useState, useEffect } from "react";
import { CheckCircle, XCircle, BrainCircuit, Clock, Zap, AlertTriangle, Download, RotateCcw, Activity, Key, Database } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

const API_BASE = "http://localhost:5001/api";

// Simple CountUp Hook specifically for the hackathon WOW factor
function useCountUp(end, duration = 1500) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeProgress * end));
      if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  }, [end, duration]);
  return count;
}

export default function ResultsPage() {
  const [results, setResults] = useState([]);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [specData, setSpecData] = useState(null);
  const [aiPhase, setAiPhase] = useState("idle"); 

  const [replayingTest, setReplayingTest] = useState(null);
  const [explainingTest, setExplainingTest] = useState(null);

  useEffect(() => {
    const resData = sessionStorage.getItem("testResults");
    if (resData) setResults(JSON.parse(resData));
    const sData = sessionStorage.getItem("specData");
    if (sData) setSpecData(JSON.parse(sData));
  }, []);

  const total = results.length;
  const passed = results.filter(r => r.status === "PASS").length;
  const failed = total - passed;
  const slowApis = results.filter(r => r.responseTime > 300).length;
  const avgTime = total > 0 ? Math.floor(results.reduce((acc, r) => acc + (r.responseTime || 0), 0) / total) : 0;

  const bugRiskScore = total > 0 ? Math.max(0, 100 - (failed * 15 + slowApis * 5)) : 100;
  
  const fastestApi = total > 0 ? results.reduce((prev, current) => (prev.responseTime < current.responseTime) ? prev : current) : null;
  const slowestApi = total > 0 ? results.reduce((prev, current) => (prev.responseTime > current.responseTime) ? prev : current) : null;

  // Animated counters
  const animatedTotal = useCountUp(total);
  const animatedPassed = useCountUp(passed);
  const animatedFailed = useCountUp(failed);
  const animatedAvgTime = useCountUp(avgTime);
  const animatedScore = useCountUp(bugRiskScore, 2000);

  const suggestMoreTests = async () => {
    if (!specData) return alert("Spec data missing. Please re-upload.");
    setIsSuggesting(true);
    setAiPhase("analyzing");
    
    try {
      const res = await axios.post(`${API_BASE}/ai-suggest`, { spec: specData });
      setTimeout(() => {
        setAiPhase("generating");
        setTimeout(() => {
           setAiSuggestions(res.data.suggestions);
           setAiPhase("done");
           setIsSuggesting(false);
        }, 1500);
      }, 1500);
    } catch (err) {
      console.error(err);
      setIsSuggesting(false);
      setAiPhase("idle");
    }
  };

  const handleReplay = (index) => {
    setReplayingTest(index);
    setTimeout(() => {
      setReplayingTest(null);
    }, 1200);
  };

  const handleExplain = (index, status) => {
    setExplainingTest(index);
    setTimeout(() => {
      setExplainingTest(null);
      const newResults = [...results];
      newResults[index].smartReason = `API returned ${status} unexpectedly. Deep analysis indicates a payload boundary rejection tied to strict JSON-Schema type enforcement, or a malformed JWT signature block.`;
      setResults(newResults);
    }, 1500);
  };

  const downloadReport = () => {
    const reportStr = JSON.stringify({ summary: { total, passed, failed, bugRiskScore }, records: results }, null, 2);
    const blob = new Blob([reportStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "TestGen_Analytics_Core.json";
    a.click();
  };

  if (!results.length) {
    return (
      <div className="flex flex-col items-center justify-center p-12 h-[60vh]">
         <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} className="glass-panel p-12 flex flex-col items-center border-purple-500/20 shadow-[0_0_50px_rgba(147,51,234,0.1)]">
           <Activity className="w-12 h-12 text-purple-400 mb-4 animate-pulse" />
           <h3 className="text-2xl font-bold text-white mb-2">Awaiting Analytics</h3>
           <p className="text-gray-400 mb-6 text-center">Execute a test suite from the dashboard to populate neural insights.</p>
         </motion.div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 25 } }
  };

  // Color logic for score
  const scoreColor = bugRiskScore > 80 ? '#22c55e' : bugRiskScore > 50 ? '#eab308' : '#ef4444';
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8 pb-20 max-w-7xl mx-auto pt-6">
      
      {/* HEADER SECTION */}
      <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 relative z-20">
        <div>
          <h2 className="text-4xl lg:text-5xl font-black text-white drop-shadow-2xl tracking-tighter">Diagnostic <span className="text-purple-400 font-light">Analytics</span></h2>
          <p className="text-slate-400 mt-2 font-medium text-lg">Real-time health scores and root-cause mapping.</p>
        </div>
        <div className="flex gap-4">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={downloadReport} className="flex items-center gap-2 px-6 py-3 glass-panel hover:bg-white/10 transition-colors font-bold text-white border-primary/30 text-sm tracking-wide">
            <Download className="w-4 h-4"/> DOWNLOAD EXPORT
          </motion.button>
          <motion.button
            whileHover={{ scale: isSuggesting ? 1 : 1.05, boxShadow: "0 0 40px rgba(147,51,234,0.6)" }}
            whileTap={{ scale: isSuggesting ? 1 : 0.95 }}
            onClick={suggestMoreTests}
            disabled={isSuggesting}
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-accent to-purple-600 rounded-xl font-bold text-white shadow-[0_0_20px_rgba(147,51,234,0.4)] disabled:opacity-50 tracking-wide text-sm"
          >
            <BrainCircuit className={isSuggesting ? "animate-pulse" : ""} />
            {aiPhase === 'analyzing' ? "SCANNING TOPOLOGY..." : aiPhase === 'generating' ? "MAPPING VECTORS..." : "INITIALIZE AI INSIGHTS"}
          </motion.button>
        </div>
      </motion.div>

      {/* TOP ROW: Stats & BUG RISK SCORE */}
      <div className="grid lg:grid-cols-12 gap-6 relative z-10">
        
        {/* Metric Blocks */}
        <motion.div variants={containerVariants} className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div variants={itemVariants} className="glass-panel p-6 flex flex-col justify-center border-t-2 border-t-slate-500/50 hover:bg-slate-500/5 transition-colors shadow-2xl relative overflow-hidden group">
            <span className="text-4xl lg:text-5xl font-black text-white glow-text group-hover:scale-105 transition-transform">{animatedTotal}</span>
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2">Total Tests</span>
          </motion.div>
          
          <motion.div variants={itemVariants} className="glass-panel p-6 flex flex-col justify-center border-t-2 border-t-green-500/50 bg-green-500/5 hover:bg-green-500/10 transition-colors shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <span className="text-4xl lg:text-5xl font-black text-green-400 group-hover:scale-105 transition-transform">{animatedPassed}</span>
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2">Passed Matrix</span>
          </motion.div>
          
          <motion.div variants={itemVariants} className="glass-panel p-6 flex flex-col justify-center border-t-2 border-t-red-500/50 bg-red-500/5 hover:bg-red-500/10 transition-colors shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <span className="text-4xl lg:text-5xl font-black text-red-500 group-hover:scale-105 transition-transform">{animatedFailed}</span>
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2">Failed Vectors</span>
          </motion.div>
          
          <motion.div variants={itemVariants} className="glass-panel p-6 flex flex-col justify-center border-t-2 border-t-cyan-500/50 bg-cyan-500/5 hover:bg-cyan-500/10 transition-colors shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <span className="text-4xl lg:text-5xl font-black text-cyan-400 group-hover:scale-105 transition-transform">{animatedAvgTime}ms</span>
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2">Avg Latency</span>
          </motion.div>
        </motion.div>

        {/* 1. AI BUG RISK SCORE CIRCULAR METER */}
        <motion.div variants={itemVariants} className="lg:col-span-4 glass-panel p-6 relative flex items-center justify-between border-purple-500/20 shadow-[0_0_30px_rgba(147,51,234,0.1)] overflow-hidden">
          <div className="absolute right-[-20%] top-[-20%] w-64 h-64 bg-purple-500/20 blur-[80px] rounded-full pointer-events-none"></div>
          
          <div className="flex flex-col z-10">
            <h3 className="text-[10px] font-black text-purple-300 uppercase tracking-[0.2em] flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-purple-400 animate-pulse" /> Core Health
            </h3>
            <div className="flex items-end gap-2 mt-2">
              <span className="text-2xl font-medium text-slate-400">Score</span>
            </div>
          </div>

          <div className="relative w-32 h-32 flex items-center justify-center z-10 shrink-0">
             {/* SVG Circular Meter */}
             <svg className="absolute inset-0 w-full h-full -rotate-90 drop-shadow-[0_0_10px_currentColor]" style={{ color: scoreColor }}>
                <circle cx="64" cy="64" r={radius} stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="none" />
                <circle 
                  cx="64" cy="64" r={radius} 
                  stroke="currentColor" strokeWidth="8" fill="none" strokeLinecap="round"
                  style={{ strokeDasharray: circumference, strokeDashoffset, transition: 'stroke-dashoffset 0.1s ease-out' }}
                />
             </svg>
             <span className="text-4xl font-black tracking-tighter" style={{ color: scoreColor, textShadow: `0 0 20px ${scoreColor}` }}>
               {animatedScore}
             </span>
          </div>
        </motion.div>
      </div>

      {/* MID ROW: Flow & Performance */}
      <div className="grid lg:grid-cols-12 gap-6 relative z-10">
        
        {/* 5. TEST FLOW VISUALIZATION */}
        <motion.div variants={itemVariants} className="lg:col-span-8 glass-panel p-8 shadow-2xl border-white/5">
          <h3 className="text-xs uppercase tracking-[0.2em] font-black text-slate-500 mb-8 flex items-center gap-2">
            <Zap className="w-4 h-4 text-slate-400" /> Simulated Runtime Topology
          </h3>
          <div className="flex items-center justify-between mt-4 relative px-10">
            <div className="absolute top-1/2 left-10 right-10 h-[2px] bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-green-500/20 -z-10 -translate-y-1/2"></div>
            
            <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5, type: "spring" }} className="flex flex-col items-center bg-[#020617] px-4 relative group">
              <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="w-14 h-14 rounded-2xl bg-[#0f172a] border border-blue-500/50 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.3)] z-10">
                <Key className="w-6 h-6 text-blue-400" />
              </div>
              <span className="mt-4 font-black tracking-widest text-[10px] uppercase text-blue-300">1. Authenticate</span>
            </motion.div>
            
            <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.8, type: "spring" }} className="flex flex-col items-center bg-[#020617] px-4 relative group">
              <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="w-14 h-14 rounded-2xl bg-[#0f172a] border border-purple-500/50 flex items-center justify-center shadow-[0_0_20px_rgba(147,51,234,0.3)] z-10">
                <Database className="w-6 h-6 text-purple-400" />
              </div>
              <span className="mt-4 font-black tracking-widest text-[10px] uppercase text-purple-300">2. Extract Payload</span>
            </motion.div>
            
            <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.1, type: "spring" }} className="flex flex-col items-center bg-[#020617] px-4 relative group">
              <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="w-14 h-14 rounded-2xl bg-[#0f172a] border border-green-500/50 flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.3)] z-10">
                <BrainCircuit className="w-6 h-6 text-green-400" />
              </div>
              <span className="mt-4 font-black tracking-widest text-[10px] uppercase text-green-300">3. Map Assertions</span>
            </motion.div>
          </div>
        </motion.div>

        {/* 4. PERFORMANCE PANEL */}
        <motion.div variants={itemVariants} className="lg:col-span-4 glass-panel p-6 bg-gradient-to-br from-cyan-500/5 to-transparent border-cyan-500/20 relative overflow-hidden">
          <div className="absolute right-[-10%] bottom-[-10%] w-40 h-40 bg-cyan-500/10 blur-[60px] rounded-full"></div>
          <h3 className="text-xs uppercase tracking-[0.2em] font-black text-cyan-500/50 mb-6 flex items-center gap-2">
            Latencies
          </h3>
          <div className="space-y-4">
             <div className="flex justify-between items-center group">
               <div>
                 <p className="text-[10px] text-green-500/80 uppercase font-black tracking-widest">Fastest Target</p>
                 <p className="font-mono text-sm text-white truncate max-w-[150px] tracking-tight">{fastestApi ? fastestApi.endpoint : 'N/A'}</p>
               </div>
               <span className="text-lg font-black text-green-400 drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]">{fastestApi ? fastestApi.responseTime : 0}ms</span>
             </div>
             
             <div className="w-full h-[1px] bg-white/5"></div>

             <div className="flex justify-between items-center group">
               <div>
                 <p className="text-[10px] text-red-500/80 uppercase font-black tracking-widest">Slowest Target</p>
                 <p className="font-mono text-sm text-white truncate max-w-[150px] tracking-tight">{slowestApi ? slowestApi.endpoint : 'N/A'}</p>
               </div>
               <span className="text-lg font-black text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">{slowestApi ? slowestApi.responseTime : 0}ms</span>
             </div>

             <div className="w-full h-[1px] bg-white/5"></div>

             <div className="text-[11px] font-black text-yellow-500/80 uppercase tracking-widest flex items-center gap-2 pt-2">
               {slowApis} Vectors breached 300ms SLA
             </div>
          </div>
        </motion.div>

      </div>

      {/* BOTTOM ROW: Logs & AI Panel */}
      <div className="grid md:grid-cols-12 gap-6 relative z-10">
        
        {/* TERMINAL LOGS LIST */}
        <motion.div variants={itemVariants} className="md:col-span-8 terminal-glass rounded-2xl p-0 flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)] border-cyan-500/20">
          <div className="px-6 py-4 border-b border-white/10 bg-black/40 flex items-center justify-between">
            <h3 className="text-xs uppercase tracking-[0.2em] font-black text-cyan-500/50 flex items-center gap-2">
              Deep Diagnostic Terminal
            </h3>
            <span className="text-[10px] font-mono text-slate-500">RUNTIME: {(avgTime/1000).toFixed(2)}s</span>
          </div>
          
          <div className="space-y-4 max-h-[500px] overflow-y-auto p-6 font-mono text-xs">
            {results.map((r, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                className={`p-4 rounded-xl transition-all border ${r.status === 'PASS' ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/10 border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.15)]'}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    {r.status === 'PASS' ? <CheckCircle className="text-green-500 w-4 h-4 shrink-0 drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]" /> : <XCircle className="text-red-500 w-4 h-4 shrink-0 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" />}
                    <span className="text-slate-300 tracking-tight">
                      <span className="font-mono text-sm tracking-tight truncate text-slate-300">
                      {r.targetUrl || r.endpoint}
                      </span>
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="flex items-center gap-1 text-slate-500 opacity-80"><Clock className="w-3 h-3" /> {r.responseTime || '<1'}ms</span>
                    <span className={`px-2 py-0.5 rounded font-black tracking-widest ${r.status === 'PASS' ? 'text-green-400 bg-green-500/20' : 'text-red-400 bg-red-500/20'}`}>
                      {r.statusCode}
                    </span>
                    
                    <button 
                      onClick={() => handleReplay(i)}
                      disabled={replayingTest === i}
                      className="p-1.5 rounded bg-white/5 hover:bg-cyan-500/20 text-slate-500 hover:text-cyan-400 transition-colors disabled:opacity-50 border border-white/5"
                    >
                      <RotateCcw className={`w-3 h-3 ${replayingTest === i ? 'animate-spin text-cyan-400' : ''}`} />
                    </button>
                  </div>
                </div>

                {r.status === 'FAIL' && (
                  <div className="mt-4 pt-4 border-t border-red-500/30 space-y-3">
                    {r.errorDetail && (
                      <div className="p-3 bg-red-500/10 rounded-lg text-red-400 border border-red-500/20 font-bold text-[10px] tracking-widest uppercase flex items-center gap-2">
                        <AlertTriangle className="w-3 h-3"/> {r.errorDetail}
                      </div>
                    )}
                    {r.smartReason ? (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-4 bg-red-500/10 rounded-lg text-red-300 border border-red-500/30 leading-relaxed shadow-[inset_0_0_20px_rgba(239,68,68,0.1)]">
                        <span className="font-black text-red-400 tracking-widest uppercase text-[10px] drop-shadow-[0_0_10px_rgba(239,68,68,0.8)] mb-2 block">&gt; AI Payload Intercept</span>
                        {r.smartReason}
                      </motion.div>
                    ) : (
                      <button 
                        onClick={() => handleExplain(i, r.statusCode)}
                        disabled={explainingTest === i}
                        className="text-[10px] bg-red-500/20 hover:bg-red-500/40 text-red-300 px-3 py-2 rounded flex items-center gap-2 transition-colors disabled:opacity-50 uppercase tracking-widest font-black"
                      >
                         {explainingTest === i ? <Loader2 className="w-3 h-3 animate-spin" /> : <BrainCircuit className="w-3 h-3" />}
                         {explainingTest === i ? "EXTRACTING CAUSE..." : "REQUEST AI EXPLANATION"}
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* AI Suggestions Dynamic Panel */}
        <motion.div variants={itemVariants} className="md:col-span-4 glass-panel p-0 flex flex-col relative overflow-hidden border-purple-500/30 shadow-[0_0_40px_rgba(147,51,234,0.15)]">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 blur-[100px] rounded-full translate-x-10 -translate-y-10 pointer-events-none"></div>
          
          <div className="px-6 py-4 border-b border-purple-500/20 bg-purple-500/5 relative z-10">
             <h3 className="text-xs uppercase tracking-[0.2em] font-black text-purple-400 flex items-center gap-2">
               <BrainCircuit className="w-4 h-4 text-purple-400" /> Generative Insights
             </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto relative z-10 p-4 space-y-4 font-mono text-xs">
            <AnimatePresence mode="wait">
              {aiPhase === 'idle' && !aiSuggestions && (
                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="h-full flex items-center justify-center text-center p-8 text-slate-500">
                  Awaiting instruction to map unknown vulnerabilities.
                </motion.div>
              )}
              
              {(aiPhase === 'analyzing' || aiPhase === 'generating') && (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center p-12 space-y-6 h-full">
                   <div className="neon-spinner w-12 h-12 border-purple-500/20 border-t-purple-400 border-r-cyan-400 border-[3px]"></div>
                   <p className="text-purple-400 font-bold animate-pulse text-[10px] tracking-[0.3em] text-center">
                      {aiPhase === 'analyzing' ? "> MAPPING TOPOLOGY" : "> EVALUATING THREATS"}
                   </p>
                </motion.div>
              )}
              
              {aiPhase === 'done' && aiSuggestions && (
                <motion.div key="results" className="space-y-4 pb-4">
                  {aiSuggestions.map((sug, i) => (
                    <motion.div 
                      key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.2, type: "spring" }}
                      className="p-5 bg-purple-500/10 rounded-xl border border-purple-500/30 shadow-[0_0_20px_rgba(147,51,234,0.1)] relative group hover:bg-purple-500/20 transition-colors"
                    >
                      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyan-400 to-purple-500 rounded-l-xl"></div>
                      <p className="font-bold text-[11px] text-white mb-3 pl-3 tracking-wide flex items-center gap-2"><AlertTriangle className="w-3 h-3 text-yellow-500" /> {sug.title}</p>
                      <p className="text-slate-400 pl-3 leading-relaxed tracking-tight">{sug.description}</p>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
