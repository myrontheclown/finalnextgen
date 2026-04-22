import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-pulse text-slate-500 font-mono">LOADING_NEURAL_REPORT...</div>
      </div>
    );
  }

  const { summary, results } = report;
  const filteredResults = results.filter(r => {
    if (filter === 'ALL') return true;
    if (filter === 'AUTO') return r.source === 'auto';
    if (filter === 'CSV') return r.source === 'csv';
    return true;
  });

  const downloadReport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "api_test_report.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-cyan-500/30 p-4 lg:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-12">
        <div>
          <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tighter">Diagnostic <span className="text-purple-400 font-light">Analytics</span></h2>
          <p className="text-slate-400 mt-2 text-lg">Detailed breakdown of AI and User-defined test vectors.</p>
          <div className="mt-4 px-4 py-2 bg-slate-900/50 border-l-4 border-cyan-500 rounded-r-lg inline-block">
            <p className="text-xs text-cyan-400 font-medium italic">
              "Failures represent either invalid inputs or real API limitations. Our system distinguishes between expected failures and actual errors."
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <button onClick={downloadReport} className="px-6 py-3 bg-slate-900 border border-slate-800 rounded-xl font-bold text-white text-sm flex items-center gap-2 hover:bg-slate-800 transition-colors">
            Download JSON
          </button>
          <button onClick={() => navigate('/')} className="px-6 py-3 bg-cyan-600 rounded-xl font-bold text-white text-sm hover:bg-cyan-500 transition-all shadow-lg shadow-cyan-500/20">
            New Session
          </button>
        </div>
      </div>

      {/* SUCCESS RATE BANNER */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="relative w-24 h-24">
              <svg className="w-full h-full" viewBox="0 0 36 36">
                <path className="text-slate-800" strokeDasharray="100, 100" strokeWidth="3" fill="none" stroke="currentColor" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className="text-cyan-500" strokeDasharray={`${summary.successRate}, 100`} strokeWidth="3" strokeLinecap="round" fill="none" stroke="currentColor" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-2xl font-black text-white">{summary.successRate}%</span>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Global Success Rate ✅</h3>
              <p className="text-slate-500 text-sm">(PASS + EXPECTED FAIL) / REACHABLE ENDPOINTS</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 justify-center">
            <div className="bg-slate-950 px-4 py-2 rounded-lg border border-slate-800 text-center">
              <div className="text-xs text-slate-500 uppercase font-bold">Passed</div>
              <div className="text-xl font-black text-green-400">{summary.passed}</div>
            </div>
            <div className="bg-slate-950 px-4 py-2 rounded-lg border border-slate-800 text-center">
              <div className="text-xs text-slate-500 uppercase font-bold">Exp Fail</div>
              <div className="text-xl font-black text-orange-400">{summary.expectedFail}</div>
            </div>
            <div className="bg-slate-950 px-4 py-2 rounded-lg border border-slate-800 text-center">
              <div className="text-xs text-slate-500 uppercase font-bold">Failed</div>
              <div className="text-xl font-black text-red-400">{summary.failed}</div>
            </div>
            <div className="bg-slate-950 px-4 py-2 rounded-lg border border-slate-800 text-center">
              <div className="text-xs text-slate-500 uppercase font-bold">Unmapped</div>
              <div className="text-xl font-black text-slate-400">{summary.unmapped}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
        {/* Main Results Table */}
        <div className="flex-1 space-y-6">
          {/* Filter Bar */}
          <div className="flex gap-2 p-1 bg-slate-900 border border-slate-800 rounded-lg w-fit">
            {['ALL', 'AUTO', 'CSV'].map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${filter === f ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
                {f}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {filteredResults.map((r, i) => (
              <div key={i} className={`group bg-slate-900/40 border ${r.status === 'PASS' ? 'border-green-500/20' : r.status === 'EXPECTED_FAIL' ? 'border-orange-500/20' : r.status === 'FAIL' ? 'border-red-500/20' : 'border-slate-800'} rounded-2xl overflow-hidden transition-all hover:bg-slate-900/60`}>
                <div className="p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-2 h-12 rounded-full ${r.status === 'PASS' ? 'bg-green-500' : r.status === 'EXPECTED_FAIL' ? 'bg-orange-500' : r.status === 'FAIL' ? 'bg-red-500' : 'bg-slate-700'}`} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${r.status === 'PASS' ? 'bg-green-500/10 text-green-400' : r.status === 'EXPECTED_FAIL' ? 'bg-orange-500/10 text-orange-400' : r.status === 'FAIL' ? 'bg-red-500/10 text-red-400' : 'bg-slate-800 text-slate-500'}`}>
                          {r.status}
                        </span>
                        <span className="text-slate-500 text-[10px] font-bold uppercase tracking-tighter">{r.method}</span>
                      </div>
                      <h4 className="text-white font-bold truncate max-w-md">{r.caseName}</h4>
                      <p className="text-slate-500 text-xs font-mono truncate">{r.endpoint}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="flex gap-1">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${r.debug?.source === 'AI-POWERED' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-slate-800 text-slate-500'}`}>
                        {r.debug?.source || 'FALLBACK'}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${r.debug?.confidenceLabel === 'HIGH' ? 'bg-purple-500/10 text-purple-400' : 'bg-slate-800 text-slate-500'}`}>
                        {r.debug?.confidenceLabel || 'MEDIUM'}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${r.debug?.dataSource === 'CHAINED' ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20' : 'bg-slate-800 text-slate-500'}`}>
                        {r.debug?.dataSource || 'SAFE'}
                      </span>
                    </div>
                    <button onClick={() => setExpandedId(expandedId === i ? null : i)} className="text-slate-500 hover:text-white transition-colors">
                      <svg className={`w-5 h-5 transition-transform ${expandedId === i ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </button>
                  </div>
                </div>

                {expandedId === i && (
                  <div className="px-5 pb-5 pt-0 border-t border-slate-800/50 bg-slate-950/30">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                      <div className="space-y-3">
                        <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800/50">
                          <h5 className="text-[10px] font-bold text-slate-500 uppercase mb-2">Why this mapping?</h5>
                          <p className="text-xs text-slate-300 italic">"{r.debug?.mappingReason || 'No mapping data available.'}"</p>
                        </div>
                        <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800/50">
                          <h5 className="text-[10px] font-bold text-slate-500 uppercase mb-2">Endpoint Context</h5>
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px]"><span className="text-slate-500">Method</span><span className="text-white font-mono">{r.method}</span></div>
                            <div className="flex justify-between text-[10px]"><span className="text-slate-500">Status Code</span><span className={`${r.actualStatus === r.expectedStatus ? 'text-green-400' : 'text-red-400'}`}>{r.actualStatus} / {r.expectedStatus}</span></div>
                            <div className="flex justify-between text-[10px]"><span className="text-slate-500">Latency</span><span className="text-cyan-400">{r.responseTime}ms</span></div>
                          </div>
                        </div>
                      </div>
                      <div className="bg-slate-950 rounded-xl border border-slate-800 p-4">
                        <h5 className="text-[10px] font-bold text-slate-500 uppercase mb-2">Terminal Output</h5>
                        <pre className="text-[10px] text-cyan-500 font-mono overflow-x-auto max-h-40">
                          {JSON.stringify(r.response, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;
