import React, { useState } from 'react';
import './index.css';
import { Shield, ShieldAlert, ShieldCheck, Search, Link as LinkIcon, Activity } from 'lucide-react';

function App() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("idle"); 
  const [forensicData, setForensicData] = useState(null); // Stores Source URL & Score

  const handleScan = async () => {
    if (!query) return;
    setStatus("scanning");
    setForensicData(null);
    
    try {
      // 1. Send to Backend
      const response = await fetch(`http://localhost:8000/add-to-watchlist/${query}`);
      const data = await response.json();
      
      // 2. Security Analysis Delay
      setTimeout(() => {
        if (data.status === "EXPOSED" || data.status === "LEAKED") {
          setStatus("exposed");
          // Store the forensic details found by the AI
          setForensicData({
            source: data.source_url || "Hidden Repository",
            score: data.risk_score || "85%",
            time: new Date().toLocaleTimeString()
          });
        } else {
          setStatus("secure");
        }
      }, 2000);
    } catch (error) {
      console.error("Backend offline!");
      setStatus("idle");
      alert("CRITICAL ERROR: AI_BACKEND_OFFLINE");
    }
  };

  return (
    <div className="min-h-screen p-10 bg-black text-green-500 font-mono">
      {status === "scanning" && <div className="scanning-bar"></div>}
      
      <header className="mb-10 border-b border-green-900 pb-4 flex justify-between items-center">
        <h1 className="tracking-tighter font-bold">SHIELD // FORENSIC_INTEL_v2099</h1>
        <div className="flex gap-4 items-center">
          <Activity size={14} className={status === "scanning" ? "animate-spin" : ""} />
          <div className="text-xs">SYSTEM_STATUS: {status.toUpperCase()}</div>
        </div>
      </header>

      <main className="flex flex-col items-center justify-center mt-10">
        <div className="relative w-full max-w-xl">
          <input 
            type="text" 
            placeholder="ENTER IDENTITY_QUERY (EMAIL/AADHAAR/PAN)..." 
            className="w-full bg-transparent border border-green-900 p-4 text-green-400 outline-none focus:border-green-400 transition-all"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button 
            onClick={handleScan}
            className="mt-6 w-full py-4 bg-green-900/20 border border-green-700 hover:bg-green-700 hover:text-black transition-all flex items-center justify-center gap-2 font-bold"
          >
            <Search size={18} /> EXECUTE_DEEP_CRAWL_SCANN
          </button>
        </div>

        <div className="mt-16 text-center w-full max-w-2xl">
          {status === "idle" && <Shield size={80} className="opacity-10 mx-auto" />}
          
          {status === "scanning" && (
            <div className="space-y-4">
              <div className="animate-pulse text-blue-500">INITIATING GLOBAL DATASET CROSS-REFERENCE...</div>
              <div className="text-[10px] opacity-40">BYPASSING FIREWALLS... SCRAPING CLOUD_DUMPS...</div>
            </div>
          )}
          
          {status === "exposed" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="text-red-600 border border-red-900 bg-red-900/10 p-8 rounded">
                <ShieldAlert size={80} className="mx-auto mb-4 animate-pulse" />
                <h2 className="text-3xl font-black italic">THREAT_DETECTED</h2>
                <p className="mt-2 text-sm opacity-80 uppercase">Identity fragments found in external breach datasets.</p>
                
                {/* FORENSIC EVIDENCE BOX */}
                <div className="mt-6 pt-6 border-t border-red-900 text-left space-y-3">
                  <div className="text-[10px] text-red-400 uppercase font-bold">Evidence_Report:</div>
                  <div className="flex items-center gap-2 text-xs">
                    <LinkIcon size={14} /> 
                    <span className="text-slate-400">SOURCE:</span> 
                    <span className="text-white truncate">{forensicData?.source}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Shield size={14} /> 
                    <span className="text-slate-400">RISK_CONFIDENCE:</span> 
                    <span className="text-white">{forensicData?.score}</span>
                  </div>
                </div>
              </div>
              <button className="mt-6 text-[10px] underline hover:text-white" onClick={() => window.print()}>DOWNLOAD_INCIDENT_REPORT.PDF</button>
            </div>
          )}

          {status === "secure" && (
            <div className="text-blue-500 animate-in zoom-in duration-500">
              <ShieldCheck size={80} className="mx-auto mb-4" />
              <h2 className="text-2xl font-bold uppercase tracking-widest">Clearance_Confirmed</h2>
              <p className="mt-2 opacity-60 text-xs font-mono">NO ACTIVE EXPOSURES FOUND IN LIVE DIRECTORIES.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;