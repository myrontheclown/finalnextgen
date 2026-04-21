import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileJson, FileSpreadsheet, ArrowRight, Loader2, Sparkles, Activity, ShieldCheck, Database, Link, CheckCircle, Globe, Zap, Settings, Command } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

const API_BASE = "http://localhost:5000/api";

export default function UploadPage() {
  const [swaggerFile, setSwaggerFile] = useState(null);
  const [swaggerUrl, setSwaggerUrl] = useState("");
  const [excelFile, setExcelFile] = useState(null);
  const [excelUrl, setExcelUrl] = useState("");
  const [uploadMode, setUploadMode] = useState("file"); // Spec mode
  const [excelUploadMode, setExcelUploadMode] = useState("file"); // Excel mode
  const [isUploading, setIsUploading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  
  // Advanced Settings
  const [settings, setSettings] = useState({
    deepAi: true,
    strictSla: false,
    bypassSsl: true
  });

  const navigate = useNavigate();

  const handleSwaggerUpload = (e) => {
    if (e.target.files && e.target.files[0]) setSwaggerFile(e.target.files[0]);
  };

  const handleExcelUpload = (e) => {
    if (e.target.files && e.target.files[0]) setExcelFile(e.target.files[0]);
  };

  const toggleSetting = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const loadDemo = async () => {
    setIsDemoLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/load-demo`);
      sessionStorage.setItem("specData", JSON.stringify(res.data.spec));
      sessionStorage.setItem("testData", JSON.stringify(res.data.tests));
      sessionStorage.setItem("sandboxConfig", JSON.stringify(settings));
      navigate("/dashboard");
    } catch (err) {
      alert("Demo load failed. Check server connection.");
    } finally {
      setIsDemoLoading(false);
    }
  };

  const submitFiles = async () => {
    const isSpecReady = (uploadMode === "file" && swaggerFile) || (uploadMode === "url" && swaggerUrl);
    const isExcelReady = (excelUploadMode === "file" && excelFile) || (excelUploadMode === "url" && excelUrl);

    if (!isSpecReady || !isExcelReady) {
      return alert("Complete all requirements to proceed.");
    }
    
    setIsUploading(true);
    try {
      // 1. Process Spec
      let specRes;
      if (uploadMode === "file") {
        const swaggerData = new FormData();
        swaggerData.append("spec", swaggerFile);
        specRes = await axios.post(`${API_BASE}/upload-spec`, swaggerData);
      } else {
        specRes = await axios.post(`${API_BASE}/upload-spec`, { specUrl: swaggerUrl });
      }

      // 2. Process Excel
      let excelRes;
      if (excelUploadMode === "file") {
        const excelData = new FormData();
        excelData.append("tests", excelFile);
        excelRes = await axios.post(`${API_BASE}/upload-excel`, excelData);
      } else {
        excelRes = await axios.post(`${API_BASE}/upload-excel`, { excelUrl: excelUrl });
      }

      sessionStorage.setItem("specData", JSON.stringify(specRes.data));
      sessionStorage.setItem("testData", JSON.stringify(excelRes.data));
      sessionStorage.setItem("sandboxConfig", JSON.stringify(settings));
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.error || "Linkage failure. Ensure the remote source is public and valid.";
      alert(`NEURAL BRIDGE ERROR: ${errMsg}`);
    } finally {
      setIsUploading(false);
    }
  };

  const floatingVariants = {
    animate: {
      y: [0, -15, 0],
      transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
  };
  
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} className="min-h-[85vh] flex flex-col lg:flex-row gap-12 items-center justify-between max-w-7xl mx-auto w-full pt-10 px-4">
      
      {/* 1. HERO SECTION */}
      <div className="w-full lg:w-[50%] relative flex flex-col justify-center space-y-8 pr-4">
         <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
           <div className="flex items-center gap-3 mb-4">
              <span className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-xs font-black tracking-widest border border-blue-500/20 uppercase">v2.4 Neural Core</span>
              <span className="bg-purple-500/10 text-purple-400 px-3 py-1 rounded-full text-xs font-black tracking-widest border border-purple-500/20 uppercase">Stable Build</span>
           </div>
           <h1 className="text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.05] mb-6">
              Automate Your<br/>
              <span className="glow-text">API Intelligence.</span>
           </h1>
           <p className="text-xl text-slate-400 font-medium leading-relaxed max-w-md mb-8">
             Zero-config API testing with AI-powered failure mapping and heuristic risk scoring. 
           </p>

           <motion.button
             whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(59, 130, 246, 0.4)" }}
             whileTap={{ scale: 0.95 }}
             onClick={loadDemo}
             className="flex items-center gap-3 px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold hover:bg-white/10 transition-all group"
           >
              {isDemoLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" />}
              {isDemoLoading ? "LOAD SEQUENCE STARTING..." : "QUICKSTART DEMO MODE"}
              <Command className="w-4 h-4 opacity-50 group-hover:translate-x-1 transition-transform" />
           </motion.button>
         </motion.div>

         {/* Floating elements confined to left */}
         <div className="absolute inset-0 z-[-1] pointer-events-none overflow-hidden">
            <motion.div variants={floatingVariants} animate="animate" className="absolute top-[10%] left-[20%] glass-panel p-4 rounded-2xl border-cyan-500/30 opacity-40">
              <Database className="w-8 h-8 text-cyan-400" />
            </motion.div>
            <motion.div variants={floatingVariants} animate="animate" transition={{ delay: 1 }} className="absolute bottom-[20%] left-[40%] glass-panel p-4 rounded-2xl border-purple-500/30 opacity-40">
              <Activity className="w-8 h-8 text-purple-400" />
            </motion.div>
         </div>
      </div>

      {/* 2. UPLOAD/URL CARDS */}
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="w-full lg:w-[50%] flex flex-col space-y-6">
        
        {/* Spec Card: URL or File */}
        <div className="glass-panel p-1 border-white/5 flex flex-col">
          <div className="flex bg-black/20 p-1 rounded-t-xl overflow-hidden">
            <button onClick={() => setUploadMode("file")} className={`flex-1 py-3 text-xs font-black uppercase tracking-widest transition-all rounded-lg ${uploadMode === 'file' ? 'bg-blue-500/20 text-blue-400 shadow-[inset_0_0_15px_rgba(59,130,246,0.1)]' : 'text-slate-500 hover:text-slate-300'}`}>Local File</button>
            <button onClick={() => setUploadMode("url")} className={`flex-1 py-3 text-xs font-black uppercase tracking-widest transition-all rounded-lg ${uploadMode === 'url' ? 'bg-blue-500/20 text-blue-400 shadow-[inset_0_0_15px_rgba(59,130,246,0.1)]' : 'text-slate-500 hover:text-slate-300'}`}>Live URL</button>
          </div>
          
          <div className="p-6">
            {uploadMode === "file" ? (
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-5">
                  <div className="bg-blue-500/10 p-3 rounded-xl border border-blue-500/20 group-hover:bg-blue-500/20 transition-colors">
                    <FileJson className="h-6 w-6 text-blue-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-white uppercase text-xs tracking-widest mb-1">OpenAPI Schema</span>
                    <span className="text-xs text-slate-500">{swaggerFile ? swaggerFile.name : "Select .json spec file"}</span>
                  </div>
                </div>
                {swaggerFile && <CheckCircle className="w-5 h-5 text-green-400 drop-shadow-[0_0_8px_#22c55e]" />}
                <input type="file" accept=".json" className="hidden" onChange={handleSwaggerUpload} />
              </label>
            ) : (
              <div className="flex items-center gap-4 group">
                 <div className="bg-blue-500/10 p-3 rounded-xl border border-blue-500/20">
                    <Globe className="h-6 w-6 text-blue-400" />
                 </div>
                 <input 
                   type="text" 
                   placeholder="https://petstore.swagger.io/v2/swagger.json"
                   value={swaggerUrl}
                   onChange={(e) => setSwaggerUrl(e.target.value)}
                   className="flex-1 bg-transparent border-b border-white/10 outline-none text-sm text-white placeholder-slate-600 py-2 focus:border-blue-500 transition-colors"
                 />
              </div>
            )}
          </div>
        </div>

        {/* Excel Card: URL or File */}
        <div className="glass-panel p-1 border-white/5 flex flex-col">
          <div className="flex bg-black/20 p-1 rounded-t-xl overflow-hidden">
            <button onClick={() => setExcelUploadMode("file")} className={`flex-1 py-3 text-xs font-black uppercase tracking-widest transition-all rounded-lg ${excelUploadMode === 'file' ? 'bg-purple-500/20 text-purple-400 shadow-[inset_0_0_15px_rgba(147,51,234,0.1)]' : 'text-slate-500 hover:text-slate-300'}`}>Local File</button>
            <button onClick={() => setExcelUploadMode("url")} className={`flex-1 py-3 text-xs font-black uppercase tracking-widest transition-all rounded-lg ${excelUploadMode === 'url' ? 'bg-purple-500/20 text-purple-400 shadow-[inset_0_0_15px_rgba(147,51,234,0.1)]' : 'text-slate-500 hover:text-slate-300'}`}>Live URL</button>
          </div>
          
          <div className="p-6">
            {excelUploadMode === "file" ? (
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-5">
                  <div className="bg-purple-500/10 p-3 rounded-xl border border-purple-500/20 group-hover:bg-purple-500/20 transition-colors">
                    <FileSpreadsheet className="h-6 w-6 text-purple-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-white uppercase text-xs tracking-widest mb-1">Test Array Repository</span>
                    <span className="text-xs text-slate-500">{excelFile ? excelFile.name : "Select .xlsx or .csv data"}</span>
                  </div>
                </div>
                {excelFile && <CheckCircle className="w-5 h-5 text-green-400 drop-shadow-[0_0_8px_#22c55e]" />}
                <input type="file" accept=".xlsx, .xls, .csv" className="hidden" onChange={handleExcelUpload} />
              </label>
            ) : (
              <div className="flex items-center gap-4 group">
                 <div className="bg-purple-500/10 p-3 rounded-xl border border-purple-500/20">
                    <Globe className="h-6 w-6 text-purple-400" />
                 </div>
                 <input 
                   type="text" 
                   placeholder="https://example.com/tests.csv"
                   value={excelUrl}
                   onChange={(e) => setExcelUrl(e.target.value)}
                   className="flex-1 bg-transparent border-b border-white/10 outline-none text-sm text-white placeholder-slate-600 py-2 focus:border-purple-500 transition-colors"
                 />
              </div>
            )}
          </div>
        </div>

        {/* ADVANCED SETTINGS PANEL */}
        <div className="glass-panel p-5 space-y-4 border-white/5 bg-black/10">
           <h4 className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-500 flex items-center gap-2 mb-2">
             <Settings className="w-3 h-3" /> Sandbox Environment Config
           </h4>
           <div className="flex items-center justify-between group cursor-pointer" onClick={() => toggleSetting('deepAi')}>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-300">Deep AI Tracing</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-tighter">Heuristic risk scoring enabled</span>
              </div>
              <div className={`w-8 h-4 rounded-full relative transition-colors ${settings.deepAi ? 'bg-blue-500' : 'bg-slate-800'}`}>
                 <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${settings.deepAi ? 'left-4.5' : 'left-0.5'}`}></div>
              </div>
           </div>
           <div className="flex items-center justify-between group cursor-pointer" onClick={() => toggleSetting('strictSla')}>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-300">Strict SLA Enforcement</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-tighter">Flag vectors exceeding 300ms</span>
              </div>
              <div className={`w-8 h-4 rounded-full relative transition-colors ${settings.strictSla ? 'bg-blue-500' : 'bg-slate-800'}`}>
                 <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${settings.strictSla ? 'left-4.5' : 'left-0.5'}`}></div>
              </div>
           </div>
        </div>

        {/* PROCEED BUTTON */}
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={submitFiles}
          disabled={((uploadMode === "file" && !swaggerFile) || (uploadMode === "url" && !swaggerUrl)) || ((excelUploadMode === "file" && !excelFile) || (excelUploadMode === "url" && !excelUrl)) || isUploading}
          className="w-full px-8 py-5 rounded-2xl text-lg flex items-center justify-center gap-3 transition-all disabled:opacity-30 disabled:grayscale glow-btn group"
        >
          {isUploading ? (
             <><Loader2 className="w-5 h-5 animate-spin" /> ESTABLISHING BRIDGES...</>
          ) : (
             <><Sparkles className="w-5 h-5" /> INITIALIZE DASHBOARD <ArrowRight className="w-5 h-5 group-hover:translate-x-3 transition-transform" /></>
          )}
        </motion.button>
        
      </motion.div>
    </motion.div>
  );
}
