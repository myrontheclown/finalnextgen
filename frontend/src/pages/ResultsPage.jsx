import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Download, RefreshCw, FileText, Activity, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

const ResultsPage = () => {
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('lastTestReport');
    if (saved) setReport(JSON.parse(saved));
  }, []);

  if (!report) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-xs font-black text-gray-500 uppercase tracking-[0.3em]">Decoding Neural Report...</p>
      </div>
    );
  }

  const { summary, results } = report;
  const filteredResults = results.filter(r => {
    if (filter === 'ALL') return true;
    if (filter === 'PASS') return r.status === 'PASS';
    if (filter === 'FAIL') return r.status === 'FAIL';
    return true;
  });

  const downloadReport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "neural_diagnostic_report.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-1000">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
        <div className="space-y-2">
          <h2 className="text-6xl font-black glow-text tracking-tighter uppercase">Neural <span className="glow-text-primary">Diagnostic</span></h2>
          <p className="text-gray-500 font-medium text-lg">In-depth behavioral analysis of dispatched test vectors.</p>
        </div>
        <div className="flex gap-4">
          <button onClick={downloadReport} className="neon-btn-secondary px-6 flex items-center gap-2">
            <Download className="h-4 w-4" />
            EXPORT DATA
          </button>
          <button onClick={() => navigate('/')} className="neon-btn px-10 flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            NEW SESSION
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid lg:grid-cols-4 gap-8">
        <div className="lg:col-span-2 glass-panel p-8 flex items-center gap-10">
          <div className="relative w-32 h-32 flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="16" fill="none" className="stroke-white/5" strokeWidth="3" />
              <circle 
                cx="18" cy="18" r="16" fill="none" 
                className="stroke-primary shadow-[0_0_20px_rgba(124,58,237,0.5)]" 
                strokeWidth="3" 
                strokeDasharray={`${summary.successRate}, 100`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 2s cubic-bezier(0.23, 1, 0.32, 1)' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-white leading-none">{summary.successRate}%</span>
              <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest mt-1">Reliability</span>
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Global Integrity Index</h3>
            <p className="text-xs text-gray-500 font-medium leading-relaxed">
              Consolidated health metric based on PASS + EXPECTED_FAIL ratios across all reachable neural endpoints.
            </p>
          </div>
        </div>

        {[
          { label: 'Passed', val: summary.passed, color: 'text-cyan', bg: 'bg-cyan/10' },
          { label: 'Expected Fail', val: summary.expectedFail, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Failed', val: summary.failed, color: 'text-error', bg: 'bg-error/10' },
          { label: 'Unmapped', val: summary.unmapped, color: 'text-gray-500', bg: 'bg-white/5' },
        ].map((s, i) => (
          <div key={i} className="glass-panel p-6 flex flex-col items-center justify-center text-center gap-1 group">
            <span className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em]">{s.label}</span>
            <span className={`text-4xl font-black ${s.color} transition-transform group-hover:scale-110`}>{s.val}</span>
            <div className={`h-1 w-8 rounded-full mt-2 ${s.bg}`} />
          </div>
        ))}
      </div>

      <div className="space-y-6">
        {/* Filter Bar */}
        <div className="flex items-center justify-between">
           <div className="flex gap-2 p-1.5 bg-black/40 border border-white/5 rounded-2xl">
            {['ALL', 'PASS', 'FAIL'].map(f => (
              <button 
                key={f} 
                onClick={() => setFilter(f)} 
                className={`px-6 py-2 rounded-xl text-[10px] font-black transition-all ${filter === f ? 'bg-primary text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="text-[10px] font-black text-gray-700 uppercase tracking-widest">
             Records Displayed: {filteredResults.length} / {results.length}
          </div>
        </div>

        {/* Results List */}
        <div className="space-y-4">
          {filteredResults.map((r, i) => (
            <div key={i} className="glass-panel group overflow-visible transition-all">
              <div 
                className="p-6 flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedId(expandedId === i ? null : i)}
              >
                <div className="flex items-center gap-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 border transition-all ${
                    r.status === 'PASS' ? 'bg-cyan/10 border-cyan/20 text-cyan shadow-[0_0_15px_rgba(0,255,163,0.2)]' :
                    r.status === 'EXPECTED_FAIL' ? 'bg-primary/10 border-primary/20 text-primary' :
                    'bg-error/10 border-error/20 text-error shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                  }`}>
                    {r.status === 'PASS' ? <CheckCircle2 className="h-6 w-6" /> : r.status === 'EXPECTED_FAIL' ? <AlertCircle className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${
                        r.status === 'PASS' ? 'text-cyan' : r.status === 'EXPECTED_FAIL' ? 'text-primary' : 'text-error'
                      }`}>{r.status}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-800" />
                      <span className="text-[10px] font-mono text-gray-500 font-bold uppercase">{r.method}</span>
                    </div>
                    <h4 className="text-xl font-black text-white tracking-tight">{r.caseName}</h4>
                    <p className="text-xs font-mono text-gray-600 mt-0.5">{r.endpoint}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Latency</p>
                    <p className="text-sm font-black text-white">{r.responseTime}ms</p>
                  </div>
                  <div className={`p-2 rounded-xl bg-white/5 border border-white/5 transition-transform ${expandedId === i ? 'rotate-180 text-primary' : 'text-gray-700'}`}>
                    <ChevronDown className="h-5 w-5" />
                  </div>
                </div>
              </div>

              {expandedId === i && (
                <div className="px-6 pb-8 pt-2 animate-in slide-in-from-top-4 duration-500">
                  <div className="grid lg:grid-cols-2 gap-8 mt-4">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">Payload Analysis</p>
                        <div className="bg-black/40 rounded-2xl p-5 border border-white/5 font-mono text-xs text-gray-400 overflow-x-auto">
                          {JSON.stringify(r.payload || {}, null, 2)}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                            <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">Response Code</p>
                            <p className={`text-xl font-black ${r.actualStatus === r.expectedStatus ? 'text-cyan' : 'text-error'}`}>{r.actualStatus}</p>
                         </div>
                         <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                            <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">Source</p>
                            <p className="text-sm font-black text-white uppercase tracking-tighter">{r.source || 'NEURAL'}</p>
                         </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-accent uppercase tracking-widest ml-1">Terminal Response Matrix</p>
                      <div className="bg-black/60 rounded-2xl p-6 border border-white/10 h-full max-h-[300px] overflow-y-auto scrollbar-hide">
                        <pre className="text-[11px] text-cyan/80 font-mono leading-relaxed">
                          {JSON.stringify(r.responseData || {}, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;
