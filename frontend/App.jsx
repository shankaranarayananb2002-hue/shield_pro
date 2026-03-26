import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  AlertTriangle, 
  Search, 
  Activity, 
  Database, 
  Terminal, 
  UserPlus, 
  RefreshCcw,
  ExternalLink,
  Lock,
  Globe
} from 'lucide-react';

const App = () => {
  const [targets, setTargets] = useState([
    { id: '1', value: 'admin@internal.gov', status: 'CRITICAL', lastScan: '2 mins ago', risk: 98 },
    { id: '2', value: 'test-user-01@gmail.com', status: 'SECURE', lastScan: '5 mins ago', risk: 0 },
    { id: '3', value: 'system.root@hq.net', status: 'MONITORING', lastScan: 'Just now', risk: 12 },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  const addTarget = () => {
    if (!inputValue) return;
    const newTarget = {
      id: Math.random().toString(36).substr(2, 9),
      value: inputValue,
      status: 'PENDING',
      lastScan: 'Awaiting...',
      risk: 0
    };
    setTargets([newTarget, ...targets]);
    setInputValue('');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'CRITICAL': return 'text-red-500 border-red-900 bg-red-950/30';
      case 'SECURE': return 'text-green-500 border-green-900 bg-green-950/30';
      case 'MONITORING': return 'text-blue-500 border-blue-900 bg-blue-950/30';
      default: return 'text-yellow-500 border-yellow-900 bg-yellow-950/30';
    }
  };

  return (
    <div className="min-h-screen bg-black text-gray-300 font-sans selection:bg-emerald-500/30">
      {/* Top Navigation Bar */}
      <nav className="border-b border-emerald-900/30 bg-black/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
              <Shield className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tighter text-white">PROJECT <span className="text-emerald-500">SHIELD</span></h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-500/60 font-mono">Forensic Recon Engine v2.0</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6 text-sm font-mono">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
              <span>SYSTEM: <span className="text-emerald-400">ACTIVE</span></span>
            </div>
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-500" />
              <span>NODES: <span className="text-emerald-400">08/12</span></span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Intelligence Input Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-8 bg-zinc-900/50 border border-zinc-800 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Globe className="w-32 h-32 text-emerald-500" />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
              <UserPlus className="w-6 h-6 text-emerald-500" />
              Ingest New Target
            </h2>
            <p className="text-gray-400 mb-6 max-w-md">Register a digital asset for 24/7 global surveillance and forensic leak detection.</p>
            
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input 
                  type="text" 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Enter email, ID, or domain..."
                  className="w-full bg-black border border-zinc-700 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <button 
                onClick={addTarget}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-xl font-bold transition-all transform active:scale-95 shadow-lg shadow-emerald-900/20"
              >
                DEPLOY
              </button>
            </div>
          </div>

          <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-mono text-emerald-500 uppercase tracking-widest mb-4">Node Health</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-xs text-gray-500">Scraping Capacity</span>
                  <span className="text-sm font-mono text-emerald-400">84%</span>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[84%]" />
                </div>
              </div>
            </div>
            <div className="mt-6 p-4 bg-black rounded-lg border border-zinc-800 font-mono text-[11px] text-zinc-500">
              <div className="flex gap-2">
                <span className="text-emerald-500">&gt;</span>
                <span>Initializing Stealth Chrome Engine...</span>
              </div>
              <div className="flex gap-2">
                <span className="text-emerald-500">&gt;</span>
                <span>Bypassing Cloudflare protection...</span>
              </div>
            </div>
          </div>
        </div>

        {/* Targets Table */}
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Terminal className="w-5 h-5 text-emerald-500" />
              Active Surveillance Queue
            </h3>
            <button className="text-xs flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
              <RefreshCcw className="w-3 h-3" />
              Sync Database
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs uppercase tracking-widest text-zinc-500 border-b border-zinc-800 font-mono">
                  <th className="px-6 py-4">Target Identity</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Risk Score</th>
                  <th className="px-6 py-4">Last Forensic Cycle</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {targets.map((target) => (
                  <tr key={target.id} className="hover:bg-emerald-500/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                        <span className="font-medium text-zinc-200">{target.value}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${getStatusColor(target.status)}`}>
                        {target.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1 bg-zinc-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-1000 ${target.risk > 50 ? 'bg-red-500' : 'bg-emerald-500'}`}
                            style={{ width: `${target.risk}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono text-zinc-400">{target.risk}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-500 font-mono">
                      {target.lastScan}
                    </td>
                    <td className="px-6 py-4">
                      <button className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-emerald-500 transition-colors">
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-emerald-950/10 border border-emerald-900/20 rounded-xl flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-lg">
              <Lock className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-emerald-500/70 font-mono uppercase">Encryption</p>
              <p className="text-sm font-bold text-emerald-100">AES-256 ACTIVE</p>
            </div>
          </div>
          <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl flex items-center gap-4">
            <div className="p-3 bg-zinc-800 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 font-mono uppercase">System Load</p>
              <p className="text-sm font-bold text-zinc-200">OPTIMAL</p>
            </div>
          </div>
          <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl flex items-center gap-4 text-center justify-center cursor-help group">
            <p className="text-xs text-zinc-500 group-hover:text-emerald-400 transition-colors font-mono">
              SECURE OPERATING ENVIRONMENT: <span className="text-zinc-300">SHIELD-IB-OS</span>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;