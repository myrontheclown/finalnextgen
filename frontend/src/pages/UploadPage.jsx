import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

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

  // 1. Ingest Spec
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
      setError(err.response?.data?.error || "Failed to analyze spec. Check the URL or file.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Discover & Map
  const handleNextToIntelligence = () => {
    setStep(3);
  };

  // 3. Trigger Intelligence & Execute
  const handleGenerateAndRun = async () => {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('specUrl', parsedSpec.url);
      formData.append('mode', mode);
      if (testFile) formData.append('tests', testFile); // CSV or JSON

      const response = await axios.post('http://localhost:5001/api/auto-generate', formData);

      // Save full report to localStorage for results page
      localStorage.setItem('lastTestReport', JSON.stringify(response.data));

      // Move to step 4 briefly then navigate
      setGenCounts({ auto: response.data.autoCount, csv: response.data.csvCount });
      setStep(4);

      setTimeout(() => {
        navigate('/results');
      }, 1500);

    } catch (err) {
      setError("Execution failed. Ensure backend is running and spec is reachable.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white p-8 font-['Inter']">
      <div className="max-w-5xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            TestGen AI Bridge
          </h1>
          <p className="text-gray-400 text-xl tracking-tight">Step-by-Step Autonomous API Testing</p>
        </header>

        {/* Wizard Progress Bar */}
        <div className="flex items-center justify-between mb-12 max-w-3xl mx-auto">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 transition-all duration-500 ${step >= s ? 'bg-blue-600 border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'bg-black/40 border-white/10 text-gray-500'
                }`}>
                {step > s ? '✓' : s}
              </div>
              {s < 4 && <div className={`flex-1 h-1 mx-4 rounded-full transition-all duration-500 ${step > s ? 'bg-blue-600' : 'bg-white/5'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-[#16161a] rounded-3xl p-8 border border-white/5 shadow-2xl relative overflow-hidden">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl animate-in fade-in zoom-in duration-300">
              {error}
            </div>
          )}

          {/* STEP 1: INGEST */}
          {step === 1 && (
            <div className="animate-in slide-in-from-right-8 fade-in duration-500">
              <h2 className="text-3xl font-bold mb-2">Step 1: Ingest Specification</h2>
              <p className="text-gray-400 mb-8">Provide your OpenAPI/Swagger definition to begin discovery.</p>

              <div className="flex gap-4 p-2 bg-black/40 rounded-2xl border border-white/10 mb-8">
                <input
                  type="text"
                  className="flex-1 bg-transparent px-4 py-3 focus:outline-none"
                  placeholder="Paste Swagger JSON URL"
                  value={specUrl}
                  onChange={(e) => setSpecUrl(e.target.value)}
                />
                <button
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition-all disabled:opacity-50"
                >
                  {loading ? 'Analyzing...' : 'Analyze Spec'}
                </button>
              </div>

              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
                <div className="relative bg-[#1a1a1e] p-10 rounded-2xl border border-white/10 text-center border-dashed cursor-pointer">
                  <p className="text-gray-400">Or drag and drop your Spec (JSON/YAML) here</p>
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setSpecFile(e.target.files[0])} />
                  {specFile && <p className="text-blue-400 mt-2 font-mono text-sm">Selected: {specFile.name}</p>}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: DISCOVERY */}
          {step === 2 && parsedSpec && (
            <div className="animate-in slide-in-from-right-8 fade-in duration-500">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-3xl font-bold mb-2">Step 2: Endpoint Discovery</h2>
                  <p className="text-gray-400">Map and index the API structure for semantic testing.</p>
                </div>
                <div className="bg-blue-500/10 text-blue-400 px-4 py-2 rounded-lg border border-blue-500/20 text-sm font-mono">
                  {parsedSpec.baseUrl}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="bg-black/40 p-6 rounded-2xl border border-white/5">
                  <p className="text-gray-500 text-sm mb-1 uppercase tracking-widest">Endpoints Found</p>
                  <p className="text-4xl font-black">{parsedSpec.endpoints.length}</p>
                </div>
                <div className="bg-black/40 p-6 rounded-2xl border border-white/5">
                  <p className="text-gray-500 text-sm mb-1 uppercase tracking-widest">Schemas Mapped</p>
                  <p className="text-4xl font-black">{Object.keys(parsedSpec.schemas || {}).length}</p>
                </div>
                <div className="bg-black/40 p-6 rounded-2xl border border-white/5">
                  <p className="text-gray-500 text-sm mb-1 uppercase tracking-widest">Auth Type</p>
                  <p className="text-xl font-bold text-blue-400">{parsedSpec.authType || "API_KEY / HEADER"}</p>
                </div>
              </div>

              <div className="bg-black/40 rounded-2xl border border-white/5 p-6 mb-8 max-h-60 overflow-y-auto">
                <table className="w-full text-left">
                  <thead className="text-xs text-gray-500 uppercase border-b border-white/10">
                    <tr>
                      <th className="pb-3">Method</th>
                      <th className="pb-3">Path</th>
                      <th className="pb-3 text-right">Semantic Index</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm">
                    {parsedSpec.endpoints.slice(0, 10).map((ep, i) => (
                      <tr key={i}>
                        <td className="py-3"><span className={`px-2 py-1 rounded text-xs font-bold ${ep.method === 'GET' ? 'bg-green-500/20 text-green-400' :
                            ep.method === 'POST' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'
                          }`}>{ep.method}</span></td>
                        <td className="py-3 font-mono text-gray-300">{ep.path}</td>
                        <td className="py-3 text-right text-gray-500 italic">{ep.summary || "No summary"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                onClick={handleNextToIntelligence}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black text-lg transition-all"
              >
                PROCEED TO INTELLIGENCE
              </button>
            </div>
          )}

          {/* STEP 3: INTELLIGENCE */}
          {step === 3 && (
            <div className="animate-in slide-in-from-right-8 fade-in duration-500 text-center py-12">
              <h2 className="text-4xl font-black mb-4">Step 3: Intelligence Generation</h2>
              <p className="text-gray-400 mb-12 max-w-2xl mx-auto">
                Trigger the AI to generate schema-driven test vectors and map your natural language test cases.
              </p>

              <div className="grid grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
                <div onClick={() => setMode('auto')} className={`cursor-pointer p-6 rounded-3xl border-2 transition-all ${mode === 'auto' ? 'bg-blue-600/10 border-blue-500' : 'bg-black/40 border-white/5'}`}>
                  <p className="text-xl font-bold mb-2">Fully Autonomous</p>
                  <p className="text-xs text-gray-500">Pure schema discovery and fuzzing.</p>
                </div>
                <div onClick={() => setMode('hybrid')} className={`cursor-pointer p-6 rounded-3xl border-2 transition-all ${mode === 'hybrid' ? 'bg-blue-600/10 border-blue-500' : 'bg-black/40 border-white/5'}`}>
                  <p className="text-xl font-bold mb-2">Hybrid Intelligence</p>
                  <p className="text-xs text-gray-500">Auto + Natural Language Mapping.</p>
                </div>
                <div onClick={() => setMode('nlp')} className={`cursor-pointer p-6 rounded-3xl border-2 transition-all ${mode === 'nlp' ? 'bg-purple-600/10 border-purple-500' : 'bg-black/40 border-white/5'}`}>
                  <p className="text-xl font-bold mb-2">NLP Only</p>
                  <p className="text-xs text-gray-500">Only User-Entered Prompts.</p>
                </div>
              </div>

              {(mode === 'hybrid' || mode === 'nlp') && (
                <div className="max-w-2xl mx-auto mb-12">
                  <div className="relative group">
                    <div className={`absolute -inset-0.5 bg-gradient-to-r ${mode === 'nlp' ? 'from-purple-600 to-pink-600' : 'from-blue-600 to-purple-600'} rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500`}></div>
                    <div className="relative bg-black/40 p-6 rounded-2xl border border-white/10 text-center border-dashed cursor-pointer">
                      <p className="text-gray-400 mb-2">Upload Test Prompts (.csv, .xlsx, .json)</p>
                      <input 
                        type="file" 
                        accept=".csv,.xlsx,.json"
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                        onChange={(e) => setTestFile(e.target.files[0])} 
                      />
                      {testFile ? (
                        <p className="text-green-400 font-mono text-sm">Selected: {testFile.name}</p>
                      ) : (
                        <p className="text-gray-600 text-xs">Required: Upload prompts to map to endpoints</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleGenerateAndRun}
                disabled={loading}
                className="px-12 py-5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl font-black text-xl shadow-2xl hover:scale-105 transition-all disabled:opacity-50"
              >
                {loading ? 'GENERATING VECTORS...' : 'LAUNCH NEURAL SUITE'}
              </button>
            </div>
          )}

          {/* STEP 4: LAUNCH */}
          {step === 4 && (
            <div className="animate-in zoom-in fade-in duration-500 text-center py-20">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(34,197,94,0.4)]">
                <span className="text-4xl">✓</span>
              </div>
              <h2 className="text-4xl font-black mb-4">Neural Suite Dispatched</h2>
              <p className="text-gray-400 text-xl">
                Generated <span className="text-white font-bold">{genCounts.auto}</span> auto-tests and mapped <span className="text-white font-bold">{genCounts.csv}</span> NLP prompts.
              </p>
              <p className="mt-8 text-blue-400 animate-pulse">Navigating to Dashboard...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
