import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Play, CheckCircle, XCircle, ChevronRight, Zap, Loader2, Key, Globe, BrainCircuit, Plus, Terminal, ShieldCheck, Link, Database, Search } from "lucide-react";
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
  const [baseUrl, setBaseUrl] = useState("http://localhost:3000");
  const [activeEnv, setActiveEnv] = useState("custom");
  const [nlpInput, setNlpInput] = useState("");
  const [isNlpGenerating, setIsNlpGenerating] = useState(false);

  const [staticUrl, setStaticUrl] = useState("");
  const [staticData, setStaticData] = useState(null);
  const [staticLoading, setStaticLoading] = useState(false);
  const [staticError, setStaticError] = useState(null);

  useEffect(() => {
    const sData = sessionStorage.getItem("specData");
    const tData = sessionStorage.getItem("testData");
    if (sData) {
      const parsedSpec = JSON.parse(sData);
      setSpecData(parsedSpec);
      if (parsedSpec.suggestedBaseUrl) {
        setBaseUrl(parsedSpec.suggestedBaseUrl);
        setActiveEnv("custom");
      }
    }
    if (tData) {
      const parsed = JSON.parse(tData);
      setTestData(parsed);
      if (parsed.length > 0) setActiveEndpoint(parsed[0].endpoint || parsed[0].path);
    }
  }, []);

  const handleEnvChange = (e) => {
    const val = e.target.value;
    setActiveEnv(val);
    if (val !== "custom") {
      setBaseUrl(val);
    }
  };

  const runTests = async () => {
    setIsRunning(true);
    try {
      const payload = { 
         tests: testData,
         baseUrl: baseUrl,
         bearerToken: bearerToken,
         apiKey: apiKey
      };
      const res = await axios.post(`${API_BASE}/run-tests`, payload);
      sessionStorage.setItem("testResults", JSON.stringify(res.data));
      setLiveResults(res.data);
      
      setTimeout(() => {
        navigate("/results");
      }, Math.max(res.data.length * 800, 2500));
    } catch (err) {
      console.error(err);
      alert("Execution Engine: Failed to initialize routing vectors.");
      setIsRunning(false);
    }
  };

  const fetchStaticData = async () => {
    if (!staticUrl) return;
    setStaticLoading(true);
    setStaticError(null);
    setStaticData(null);
    try {
      const res = await axios.post(`${API_BASE}/fetch-data`, { url: staticUrl });
      setStaticData(res.data);
    } catch (err) {
      setStaticError(err.response?.data?.error || "Failed to fetch static data.");
    } finally {
      setStaticLoading(false);
    }
  };

  const generateNlpTest = async () => {
    if(!nlpInput) return;
    setIsNlpGenerating(true);
    try {
      const res = await axios.post(`${API_BASE}/nlp-suggest`, { promptStr: nlpInput });
      const newTest = res.data.testCase;
      const updatedTests = [...testData, newTest];
      setTestData(updatedTests);
      setNlpInput("");
      setActiveEndpoint(newTest.endpoint);
    } catch (err) {
      alert("AI Generation failed. Ensure OpenAI API key is configured.");
    } finally {
      setIsNlpGenerating(false);
    }
  };

  if (!specData || !testData) {
    return (
      <div className="flex flex-col items-center justify-center p-12 h-[60vh]">
        <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} className="glass-panel p-12 flex flex-col items-center">
          <Terminal className="w-12 h-12 text-cyan-400 mb-4 animate-pulse" />
          <h3 className="text-2xl font-bold text-white mb-2">Workspace Uninitialized</h3>
          <p className="text-gray-400 mb-6 text-center">API payload map is empty. Please bridge JSON schemas first.</p>
          <button onClick={() => navigate("/")} className="text-primary font-bold hover:underline glow-text">Return to Bridge Setup</button>
        </motion.div>
      </div>
    );
  }

  const endpoints = [...new Set(testData.map(t => t.endpoint || t.path))].filter(Boolean);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 10 },
    show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", bounce: 0.5 } }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} className="space-y-6 relative pb-20 max-w-7xl mx-auto pt-6 px-4">
      
      {/* HEADER SECTION */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", bounce: 0.4 }}
        className="flex flex-col lg:flex-row lg:items-end justify-between gap-6"
      >
        <div>
           <h2 className="text-4xl lg:text-5xl font-black text-white drop-shadow-2xl tracking-tighter">Dynamic API <span className="text-cyan-400 font-light">Targeting</span></h2>
           <p className="text-slate-400 mt-2 font-medium text-lg flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> SYSTEM READY: Targeting {baseUrl}
           </p>
        </div>
        <motion.button
          whileHover={{ scale: isRunning ? 1 : 1.05, boxShadow: "0 0 35px rgba(34,211,238,0.6)" }}
          whileTap={{ scale: isRunning ? 1 : 0.95 }}
          onClick={runTests}
          disabled={isRunning}
          className="flex items-center justify-center gap-3 px-10 py-5 font-black text-xl transition-all disabled:opacity-50 glow-btn"
          style={{ borderRadius: '1.25rem' }}
        >
          {isRunning ? <Loader2 className="animate-spin w-6 h-6 text-white" /> : <Zap className="w-6 h-6 fill-white drop-shadow-md" />}
          {isRunning ? "PROCESSING VECTORS..." : "INITIALIZE TEST SUITE"}
        </motion.button>
      </motion.div>

      {/* TARGETING & SECURITY CONSOLE */}
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid lg:grid-cols-12 gap-6 relative z-30">
         {/* Base URL & Env Block */}
         <motion.div variants={itemVariants} className="lg:col-span-7 glass-panel p-6 flex flex-col gap-5 border-cyan-500/20 shadow-[0_0_50px_rgba(34,211,238,0.08)] bg-gradient-to-br from-cyan-500/5 to-transparent group">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <h3 className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Globe className="w-3 h-3 animate-spin duration-[10s]" /> Target Vector Resolution
                </h3>
                <span className="text-[9px] text-slate-500 font-bold uppercase mt-1">Cross-Origin Engine: Active</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Preset:</span>
                <select 
                   className="bg-[#0f172a] text-cyan-400 border border-cyan-500/30 rounded-lg px-3 py-1 text-[11px] font-black outline-none cursor-pointer hover:border-cyan-400 transition-colors"
                   value={activeEnv}
                   onChange={handleEnvChange}
                >
                   <option value="custom">MANUAL OVERRIDE</option>
                   <option value="http://localhost:3000">LOCALHOST GATEWAY</option>
                   <option value="https://dev.api.testgen.ai">DEV CLUSTER</option>
                   <option value="https://staging.api.testgen.ai">STAGING LAYER</option>
                   <option value="https://api.testgen.ai">PRODUCTION CORE</option>
                </select>
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <div className="relative">
                 <div className="absolute left-4 top-1/2 -translate-y-1/2"><Link className="w-4 h-4 text-cyan-500/80" /></div>
                 <input 
                   type="text" 
                   value={baseUrl}
                   onChange={(e) => { setBaseUrl(e.target.value); setActiveEnv("custom"); }}
                   placeholder="Enter Dynamic Base URL (e.g. https://api.stripe.com)" 
                   className="w-full bg-[#020617]/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white font-mono text-sm focus:border-cyan-500/50 focus:shadow-[0_0_20px_rgba(34,211,238,0.1)] transition-all outline-none"
                 />
                 <div className={`absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 px-2 py-1 rounded border ${baseUrl ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' : 'bg-slate-500/10 border-slate-500/20 text-slate-500'} text-[9px] font-black tracking-widest`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${baseUrl ? 'bg-cyan-400 animate-pulse' : 'bg-slate-500'}`}></div>
                    {baseUrl ? 'RESOLVED' : 'AWAITING URL'}
                 </div>
              </div>
            </div>
         </motion.div>

         {/* Security & Auth Block */}
         <motion.div variants={itemVariants} className="lg:col-span-5 glass-panel p-6 flex flex-col gap-6 border-purple-500/20 shadow-[0_0_50px_rgba(147,51,234,0.08)] bg-gradient-to-br from-purple-500/5 to-transparent">
            <h3 className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <ShieldCheck className="w-3 h-3" /> Identity & Access Vault
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Bearer Auth</label>
                <div className="relative">
                   <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-purple-500/50" />
                   <input 
                     type="password" 
                     value={bearerToken}
                     onChange={(e) => setBearerToken(e.target.value)}
                     placeholder="JWT Token..." 
                     className="w-full bg-[#020617]/50 border border-white/10 rounded-xl py-3 pl-10 pr-3 text-white font-mono text-[11px] focus:border-purple-500/50 outline-none transition-all"
                   />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">X-API-Key</label>
                <div className="relative">
                   <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-purple-500/50" />
                   <input 
                     type="password" 
                     value={apiKey}
                     onChange={(e) => setApiKey(e.target.value)}
                     placeholder="Secret Key..." 
                     className="w-full bg-[#020617]/50 border border-white/10 rounded-xl py-3 pl-10 pr-3 text-white font-mono text-[11px] focus:border-purple-500/50 outline-none transition-all"
                   />
                </div>
              </div>
            </div>
         </motion.div>
      </motion.div>

      {/* AI SUGGESTION BAR */}
      <motion.div variants={itemVariants} className="glass-panel p-2 flex items-center gap-3 border-blue-500/20 focus-within:shadow-[0_0_30px_rgba(59,130,246,0.3)] transition-all overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 pointer-events-none"></div>
          <div className="bg-blue-500/10 p-2 rounded-lg z-10"><BrainCircuit className="w-5 h-5 text-blue-400" /></div>
          <input 
             type="text" 
             placeholder='AI: "Test login failure expect 401"'
             value={nlpInput}
             onChange={(e) => setNlpInput(e.target.value)}
             onKeyDown={(e) => e.key === 'Enter' && generateNlpTest()}
             className="bg-transparent text-white placeholder-slate-500 w-full outline-none text-sm z-10"
          />
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={generateNlpTest}
            disabled={isNlpGenerating || !nlpInput}
            className="px-6 py-2 bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 font-bold rounded-xl disabled:opacity-50 transition-colors flex items-center gap-2 z-10 whitespace-nowrap border border-blue-500/30 text-xs uppercase tracking-tighter"
          >
            {isNlpGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} AI Generate
          </motion.button>
      </motion.div>

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid lg:grid-cols-12 gap-8 pb-10">
        {/* Left: Endpoints */}
        <motion.div variants={itemVariants} className="lg:col-span-4 glass-panel p-5 overflow-y-auto space-y-3 shadow-2xl min-h-[400px] max-h-[600px]">
          <h3 className="text-sm uppercase tracking-widest font-black text-slate-500 mb-4 pb-3 flex items-center justify-between">
            <span>Discovered Endpoints</span>
            <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-xs">{endpoints.length}</span>
          </h3>
            {endpoints.map((ep, i) => {
              const isSyn = testData.find(t => (t.endpoint || t.path) === ep)?.isSynthesized || specData?.isSynthesized;
              return (
                <motion.div
                  layout
                  key={i}
                  onClick={() => setActiveEndpoint(ep)}
                  className={`p-4 rounded-xl cursor-pointer flex flex-col gap-2 transition-all border ${
                    activeEndpoint === ep ? "bg-cyan-500/10 border-cyan-500/40 text-white shadow-[0_0_15px_rgba(34,211,238,0.2)]" : "border-transparent hover:bg-white/5 text-slate-400"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate pr-2 font-mono text-sm tracking-tight">{ep}</span>
                    <ChevronRight className={`w-4 h-4 transition-transform ${activeEndpoint === ep ? 'translate-x-1 text-cyan-400' : ''}`} />
                  </div>
                  {isSyn && (
                    <span className="text-[8px] font-black tracking-widest text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 w-fit uppercase">Neural Inference Mode</span>
                  )}
                </motion.div>
              );
            })}
        </motion.div>

        {/* Right: Test Cases */}
        <motion.div variants={itemVariants} className="lg:col-span-8 glass-panel p-0 overflow-hidden relative flex flex-col shadow-2xl border-purple-500/10 min-h-[400px] max-h-[600px]">
          <div className="flex items-center justify-between px-6 py-4 bg-black/40 border-b border-white/5 z-10 w-full shrink-0">
             <h3 className="text-sm uppercase tracking-widest font-black text-slate-300">Execution Vectors</h3>
             <span className="text-xs text-blue-400 font-mono tracking-tight bg-blue-500/10 px-3 py-1 rounded">Chaining Enabled {'{{token}}'}</span>
          </div>
          <div className="overflow-x-auto flex-1 p-2">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-slate-500 uppercase font-black text-[10px] tracking-widest">
                <tr>
                  <th className="px-6 py-3">Method</th>
                  <th className="px-6 py-3">Route Vector</th>
                  <th className="px-6 py-3">Payload Matrix</th>
                  <th className="px-6 py-3">Expect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {testData.filter(t => t.endpoint === activeEndpoint || t.path === activeEndpoint).map((test, index) => (
                  <motion.tr 
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.01, backgroundColor: "rgba(255,255,255,0.03)" }}
                    key={index} className="transition-colors group cursor-default"
                  >
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-black tracking-widest border ${
                        test.method?.toUpperCase() === 'GET' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                        test.method?.toUpperCase() === 'POST' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        'bg-purple-500/10 text-purple-400 border-purple-500/20'
                      }`}>
                        {test.method?.toUpperCase() || 'GET'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-300 tracking-tight">{test.endpoint || test.path}</td>
                    <td className="px-6 py-4 font-mono text-xs max-w-[200px] truncate text-slate-500 group-hover:text-slate-300 transition-colors">
                      {JSON.stringify(test.payload || test.body || {})}
                    </td>
                    <td className="px-6 py-4 font-mono font-black text-cyan-400">
                       {test.expectedStatus || 200}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </motion.div>

      {/* STATIC DATA TESTER */}
      <motion.div variants={itemVariants} className="glass-panel p-6 flex flex-col gap-6 border-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.08)] bg-gradient-to-br from-emerald-500/5 to-transparent relative z-20">
         <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <Database className="w-3 h-3" /> Static Data Tester (JSON + CSV)
            </h3>
            {staticData && (
               <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                 Format Detected: {staticData.type.toUpperCase()}
               </span>
            )}
         </div>

         <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/50" />
               <input 
                 type="text" 
                 value={staticUrl}
                 onChange={(e) => setStaticUrl(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && fetchStaticData()}
                 placeholder="Enter direct URL (e.g., https://example.com/data.json)" 
                 className="w-full bg-[#020617]/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white font-mono text-[12px] focus:border-emerald-500/50 focus:shadow-[0_0_20px_rgba(16,185,129,0.1)] outline-none transition-all"
               />
            </div>
            <motion.button 
               whileHover={{ scale: 1.02 }}
               whileTap={{ scale: 0.98 }}
               onClick={fetchStaticData}
               disabled={staticLoading || !staticUrl}
               className="w-full sm:w-auto px-8 py-3 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-black rounded-xl disabled:opacity-50 transition-colors flex items-center justify-center gap-2 border border-emerald-500/30 text-xs uppercase tracking-widest whitespace-nowrap"
            >
               {staticLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />} 
               Fetch Data
            </motion.button>
         </div>

         {staticError && (
            <div className="text-red-400 text-xs bg-red-500/10 p-3 rounded-lg border border-red-500/20 font-mono flex items-center gap-2">
               <XCircle className="w-4 h-4" /> {staticError}
            </div>
         )}

         {staticData && staticData.type === 'json' && (
            <div className="bg-[#020617]/80 rounded-xl p-4 border border-emerald-500/10 overflow-hidden">
               <div className="flex items-center justify-between mb-3 border-b border-emerald-500/10 pb-2">
                  <span className="text-xs text-slate-400 uppercase font-black tracking-widest">Preview (First 5)</span>
                  <span className="text-xs text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded">Total Items: {staticData.length}</span>
               </div>
               <pre className="text-[11px] text-emerald-300 font-mono overflow-x-auto max-h-[300px] overflow-y-auto custom-scrollbar">
                 {JSON.stringify(staticData.preview || staticData.data, null, 2)}
               </pre>
            </div>
         )}

         {staticData && staticData.type === 'csv' && (
            <div className="bg-[#020617]/80 rounded-xl p-4 border border-emerald-500/10 overflow-hidden flex flex-col gap-3">
               <div className="flex items-center justify-between border-b border-emerald-500/10 pb-2">
                  <span className="text-xs text-slate-400 uppercase font-black tracking-widest">Table Preview</span>
                  <span className="text-xs text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded">Total Rows: {staticData.rows}</span>
               </div>
               <div className="flex flex-wrap gap-2 mb-2">
                  {staticData.columns.map((col, idx) => (
                    <span key={idx} className="text-[10px] bg-slate-800 text-slate-300 px-2 py-1 rounded border border-white/5 font-mono">{col}</span>
                  ))}
               </div>
               <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left text-xs text-slate-300 min-w-max">
                    <thead className="text-slate-500 uppercase font-black text-[9px] tracking-widest bg-emerald-500/5">
                      <tr>
                        {staticData.columns.map((col, idx) => (
                           <th key={idx} className="px-4 py-2 border-b border-emerald-500/10">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {(staticData.preview || staticData.data || []).map((row, rIdx) => (
                         <tr key={rIdx} className="hover:bg-white/5 transition-colors">
                           {staticData.columns.map((col, cIdx) => (
                              <td key={cIdx} className="px-4 py-3 font-mono text-slate-400 max-w-[200px] truncate">{row[col] !== undefined && row[col] !== null ? String(row[col]) : ''}</td>
                           ))}
                         </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
            </div>
         )}
      </motion.div>

      {/* LIVE EXECUTION OVERLAY - TERMINAL STYLE */}
      <AnimatePresence>
        {liveResults && (
           <motion.div 
             initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}
             className="fixed inset-0 z-50 bg-[#020617]/95 backdrop-blur-[50px] flex flex-col items-center justify-center p-8"
           >
              <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} transition={{ type: "spring", bounce: 0 }} className="w-full max-w-4xl terminal-glass rounded-2xl p-0 overflow-hidden flex flex-col border border-cyan-500/30">
                  <div className="bg-[#0f172a] px-6 py-3 border-b border-cyan-500/20 flex items-center gap-4">
                     <span className="w-3 h-3 rounded-full bg-red-500/50"></span>
                     <span className="w-3 h-3 rounded-full bg-yellow-500/50"></span>
                     <span className="w-3 h-3 rounded-full bg-green-500/50"></span>
                     <span className="ml-4 font-mono text-xs text-cyan-500 font-bold tracking-widest flex items-center gap-2">
                        root@ai-core:~# execute_test_suite <span className="animate-[pulse_1s_infinite] w-2 h-4 bg-cyan-400 inline-block"></span>
                     </span>
                  </div>
                  <div className="p-8 space-y-3 font-mono text-sm max-h-[60vh] overflow-y-auto w-full bg-[#020617]/80">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-cyan-400 font-bold mb-4">
                       &gt; Initializing neural execution framework...<br/>
                       &gt; Securing sandbox perimeter... OK<br/>
                       &gt; Injecting environment blocks... OK<br/><br/>
                    </motion.div>
                    {liveResults.map((r, i) => (
                      <motion.div
                        key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: (i * 0.4) + 0.5 }} 
                        className="flex items-center gap-4 text-slate-300"
                      >
                         <span className="text-slate-600">[{(Date.now() + i*400).toString().slice(-6)}]</span>
                         <span className={`font-black tracking-widest ${r.method === 'GET' ? 'text-green-500' : 'text-blue-500'} w-12`}>{r.method}</span>
                         <span className="flex-1 truncate text-slate-400 font-mono text-[10px]">{r.targetUrl || r.endpoint}</span>
                         <span className="text-slate-700">........................</span>
                         <motion.div 
                           initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: (i * 0.4) + 0.9 }}
                           className={`font-black flex items-center gap-2 px-3 py-0.5 rounded text-xs ${r.status === 'PASS' ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10 shadow-[0_0_10px_rgba(239,68,68,0.3)]'}`}
                         >
                           {r.status}
                         </motion.div>
                      </motion.div>
                    ))}
                    
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: (liveResults.length * 0.4) + 1.2 }} className="text-cyan-400 font-bold mt-8 pt-4 border-t border-white/5">
                       &gt; Execution complete.<br/>
                       &gt; Rerouting to visual analytics layer...
                    </motion.div>
                  </div>
              </motion.div>
           </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
