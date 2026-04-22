import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Globe, Shield, Zap, CheckCircle, ArrowRight, Upload as UploadIcon, FileJson, Sparkles } from 'lucide-react';

const UploadPage = () => {
  const [step, setStep] = useState(1);
  const [specUrl, setSpecUrl] = useState('https://petstore.swagger.io/v2/swagger.json');
  const [specFile, setSpecFile] = useState(null);
  const [testFile, setTestFile] = useState(null);
  const [parsedSpec, setParsedSpec] = useState(null);
  const [genCounts, setGenCounts] = useState({ auto: 0, csv: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('hybrid');
  const navigate = useNavigate();

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      if (specFile) formData.append('spec', specFile);
      else formData.append('specUrl', specUrl);

      const response = await axios.post('http://localhost:5001/api/upload-spec', formData);
      setParsedSpec({ ...response.data, url: specUrl });
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || "Neural link failed. Check spec endpoint.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAndRun = async () => {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('specUrl', parsedSpec.url);
      formData.append('mode', mode);
      if (testFile) formData.append('tests', testFile);

      const response = await axios.post('http://localhost:5001/api/auto-generate', formData);
      localStorage.setItem('lastTestReport', JSON.stringify(response.data));
      setGenCounts({ auto: response.data.summary.total, csv: response.data.summary.unmapped });
      setStep(4);
      setTimeout(() => navigate('/results'), 1500);
    } catch (err) {
      setError("Execution engine failure. System offline.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <header className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest mb-4">
          <Sparkles className="h-3 w-3" />
          Autonomous Engine Active
        </div>
        <h1 className="text-7xl font-black tracking-tighter glow-text">
          TestGen <span className="glow-text-primary">AI Bridge</span>
        </h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto font-medium">
          Step-by-Step Neural API Testing • Spec Driven Intelligence
        </p>
      </header>

      {/* Progress Stepper */}
      <div className="flex items-center justify-between max-w-2xl mx-auto relative px-4">
        <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-white/5 -translate-y-1/2 z-0" />
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="relative z-10">
            <div className={`
              w-14 h-14 rounded-2xl flex items-center justify-center font-black transition-all duration-700
              ${step >= s 
                ? 'bg-primary text-white shadow-[0_0_30px_rgba(124,58,237,0.5)] border-t border-white/30' 
                : 'bg-black/80 border border-white/5 text-gray-700 backdrop-blur-md'}
            `}>
              {step > s ? <CheckCircle className="h-6 w-6" /> : s}
            </div>
            <p className={`absolute -bottom-7 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-colors duration-500 ${step >= s ? 'text-primary' : 'text-gray-700'}`}>
              Phase 0{s}
            </p>
          </div>
        ))}
      </div>

      <div className="glass-panel p-12 mt-16 min-h-[450px] flex flex-col">
        {error && (
          <div className="mb-8 p-4 bg-error/10 border border-error/20 text-error rounded-2xl flex items-center gap-3 animate-in fade-in zoom-in slide-in-from-top-4 duration-500">
            <Shield className="h-5 w-5" />
            <span className="text-sm font-bold">{error}</span>
          </div>
        )}

        {/* STEP 1: INGEST */}
        {step === 1 && (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-12 duration-700">
            <div className="space-y-2">
              <h2 className="text-4xl font-black flex items-center gap-3">
                <Globe className="text-primary h-8 w-8" />
                Step 1: Ingest Specification
              </h2>
              <p className="text-gray-500 font-medium">Establish a neural bridge by providing your OpenAPI/Swagger definition.</p>
            </div>

            <div className="flex gap-4 p-3 bg-black/40 rounded-2xl border border-white/5 focus-within:border-primary/50 transition-all">
              <input
                type="text"
                className="flex-1 bg-transparent px-5 py-4 text-white font-medium focus:outline-none placeholder:text-gray-700"
                placeholder="https://api.domain.com/v2/swagger.json"
                value={specUrl}
                onChange={(e) => setSpecUrl(e.target.value)}
              />
              <button
                onClick={handleAnalyze}
                disabled={loading}
                className="neon-btn flex items-center gap-2 group disabled:opacity-50"
              >
                {loading ? 'CALIBRATING...' : 'ANALYZE SPEC'}
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
              <div className="relative bg-black/40 p-12 rounded-3xl border border-white/5 border-dashed flex flex-col items-center gap-4 cursor-pointer hover:bg-black/60 transition-all">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 mb-2">
                  <UploadIcon className="h-8 w-8 text-gray-500 group-hover:text-primary transition-colors" />
                </div>
                <div className="text-center">
                  <p className="text-gray-400 font-bold">Or drag and drop your Spec (JSON/YAML) here</p>
                  <p className="text-xs text-gray-600 mt-1 uppercase tracking-widest">Local Neural Interface</p>
                </div>
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setSpecFile(e.target.files[0])} />
                {specFile && (
                  <div className="mt-4 px-4 py-2 bg-primary/20 border border-primary/30 rounded-xl text-primary font-mono text-xs flex items-center gap-2">
                    <FileJson className="h-4 w-4" />
                    LINKED: {specFile.name}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: DISCOVERY */}
        {step === 2 && parsedSpec && (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-12 duration-700">
            <div className="flex justify-between items-end">
              <div className="space-y-2">
                <h2 className="text-4xl font-black flex items-center gap-3">
                  <Zap className="text-accent h-8 w-8" />
                  Step 2: Endpoint Discovery
                </h2>
                <p className="text-gray-500 font-medium">Mapped and indexed the API structure for semantic testing.</p>
              </div>
              <div className="px-4 py-2 bg-accent/10 rounded-xl border border-accent/20 text-accent font-mono text-xs font-bold">
                {parsedSpec.baseUrl}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
              {[
                { label: 'Endpoints Found', val: parsedSpec.endpoints.length, color: 'primary' },
                { label: 'Schemas Mapped', val: Object.keys(parsedSpec.schemas || {}).length, color: 'accent' },
                { label: 'Auth Configuration', val: parsedSpec.authType || "MODULAR", color: 'cyan' },
              ].map((stat, i) => (
                <div key={i} className="glass-card flex flex-col gap-2 group">
                  <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest">{stat.label}</p>
                  <p className={`text-5xl font-black group-hover:scale-110 transition-transform origin-left text-${stat.color}`}>
                    {stat.val}
                  </p>
                </div>
              ))}
            </div>

            <div className="bg-black/40 rounded-3xl border border-white/5 overflow-hidden">
               <div className="max-h-[240px] overflow-y-auto px-6 py-4 scrollbar-hide">
                <table className="w-full text-left">
                  <thead className="sticky top-0 bg-black/60 backdrop-blur-md z-10">
                    <tr className="text-[10px] text-gray-600 uppercase tracking-widest font-black">
                      <th className="pb-4">Protocol</th>
                      <th className="pb-4">Interface Path</th>
                      <th className="pb-4 text-right">Semantic Index</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm">
                    {parsedSpec.endpoints.slice(0, 10).map((ep, i) => (
                      <tr key={i} className="group hover:bg-white/5 transition-colors">
                        <td className="py-4">
                          <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm ${
                            ep.method === 'GET' ? 'bg-cyan/10 text-cyan border border-cyan/20' :
                            ep.method === 'POST' ? 'bg-primary/10 text-primary border border-primary/20' : 
                            'bg-gray-500/10 text-gray-400'
                          }`}>
                            {ep.method}
                          </span>
                        </td>
                        <td className="py-4 font-mono text-gray-400 group-hover:text-white transition-colors">{ep.path}</td>
                        <td className="py-4 text-right text-gray-600 text-xs italic group-hover:text-gray-400">{ep.summary || "RAW ENDPOINT"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <button
              onClick={() => setStep(3)}
              className="neon-btn w-full py-5 text-xl flex items-center justify-center gap-3"
            >
              INITIALIZE NEURAL LAYERS
              <ArrowRight className="h-6 w-6" />
            </button>
          </div>
        )}

        {/* STEP 3: INTELLIGENCE */}
        {step === 3 && (
          <div className="space-y-12 animate-in fade-in slide-in-from-right-12 duration-700 text-center">
            <div className="space-y-2">
              <h2 className="text-5xl font-black glow-text">Step 3: Intelligence Generation</h2>
              <p className="text-gray-500 max-w-2xl mx-auto font-medium">
                Trigger the AI to generate schema-driven test vectors and map your natural language test cases.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-8">
              {[
                { id: 'auto', title: 'Fully Autonomous', desc: 'Pure schema discovery & fuzzing.', color: 'from-primary/20 to-primary/5' },
                { id: 'hybrid', title: 'Hybrid Neural', desc: 'Auto + Natural Language Mapping.', color: 'from-accent/20 to-accent/5' },
                { id: 'nlp', title: 'NLP Vectors', desc: 'User-Defined Semantic Prompts.', color: 'from-pink/20 to-pink/5' },
              ].map((m) => (
                <div 
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`
                    cursor-pointer p-8 rounded-[2rem] border-2 transition-all duration-500 flex flex-col items-center gap-4 group
                    ${mode === m.id 
                      ? `bg-gradient-to-br ${m.color} border-white/20 shadow-[0_0_40px_rgba(255,255,255,0.05)]` 
                      : 'bg-black/40 border-white/5 hover:border-white/10'}
                  `}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${mode === m.id ? 'bg-white text-black' : 'bg-white/5 text-gray-500'} transition-colors`}>
                    {m.id === 'auto' ? <Zap className="h-6 w-6" /> : m.id === 'hybrid' ? <Sparkles className="h-6 w-6" /> : <Globe className="h-6 w-6" />}
                  </div>
                  <div>
                    <p className="text-xl font-black mb-1">{m.title}</p>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{m.desc}</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${mode === m.id ? 'border-white bg-white' : 'border-white/10'}`}>
                    {mode === m.id && <div className="w-2 h-2 bg-black rounded-full" />}
                  </div>
                </div>
              ))}
            </div>

            {(mode === 'hybrid' || mode === 'nlp') && (
              <div className="max-w-xl mx-auto">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary to-pink rounded-3xl blur opacity-10 group-hover:opacity-30 transition duration-500"></div>
                  <div className="relative bg-black/40 p-8 rounded-3xl border border-white/5 border-dashed flex flex-col items-center gap-3 cursor-pointer hover:bg-black/60 transition-all">
                    <p className="text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Upload Test Prompts (.csv, .xlsx, .json)</p>
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setTestFile(e.target.files[0])} />
                    {testFile ? (
                      <div className="px-4 py-1.5 bg-cyan/20 border border-cyan/30 rounded-lg text-cyan font-mono text-xs flex items-center gap-2">
                        <CheckCircle className="h-3 w-3" />
                        LINKED: {testFile.name}
                      </div>
                    ) : (
                      <p className="text-[10px] text-gray-700 font-bold uppercase">Required for semantic mapping</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="pt-8">
              <button
                onClick={handleGenerateAndRun}
                disabled={loading}
                className="neon-btn px-16 py-6 text-2xl tracking-tighter disabled:opacity-50 relative overflow-hidden group"
              >
                <span className="relative z-10 flex items-center gap-4">
                  {loading ? 'MODULATING VECTORS...' : 'LAUNCH NEURAL SUITE'}
                  <Zap className="h-6 w-6 fill-current" />
                </span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: LAUNCH */}
        {step === 4 && (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-center space-y-10 animate-in zoom-in fade-in duration-1000">
            <div className="relative">
               <div className="absolute inset-0 bg-cyan blur-[60px] opacity-20 animate-pulse" />
               <div className="w-32 h-32 bg-cyan rounded-[2.5rem] flex items-center justify-center relative border-t-4 border-white/40 shadow-[0_0_50px_rgba(0,255,163,0.4)]">
                <CheckCircle className="h-16 w-16 text-black" />
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-6xl font-black tracking-tighter">Neural Suite Dispatched</h2>
              <p className="text-gray-500 text-xl font-medium">
                Autonomous system has initiated validation sequence.
              </p>
            </div>
            <div className="flex items-center gap-2 px-6 py-3 rounded-full bg-black/60 border border-white/5">
              <div className="w-2 h-2 rounded-full bg-cyan animate-ping" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan">Navigating to Dashboard</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadPage;
