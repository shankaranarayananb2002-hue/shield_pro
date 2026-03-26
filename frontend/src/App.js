import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  Activity,
  Terminal,
  RefreshCcw,
  AlertTriangle,
  Trash2,
  ExternalLink,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  Loader,
  Bell
} from 'lucide-react';

const API_BASE = "http://127.0.0.1:8000";

// ─── Status badge config ───────────────────────────────
const STATUS_CONFIG = {
  LEAKED:     { color: 'text-red-400',    border: 'border-red-800',    bg: 'bg-red-950/30',     icon: XCircle },
  SECURE:     { color: 'text-emerald-400',border: 'border-emerald-800',bg: 'bg-emerald-950/30', icon: CheckCircle },
  PENDING:    { color: 'text-yellow-400', border: 'border-yellow-800', bg: 'bg-yellow-950/30',  icon: Loader },
  SCAN_ERROR: { color: 'text-orange-400', border: 'border-orange-800', bg: 'bg-orange-950/30',  icon: AlertTriangle },
  MONITORING: { color: 'text-blue-400',   border: 'border-blue-800',   bg: 'bg-blue-950/30',    icon: Activity },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.MONITORING;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold border ${cfg.color} ${cfg.border} ${cfg.bg}`}>
      <Icon className={`w-2.5 h-2.5 ${status === 'PENDING' ? 'animate-spin' : ''}`} />
      {status}
    </span>
  );
};

// ─── Risk bar ──────────────────────────────────────────
const RiskBar = ({ score }) => (
  <div className="flex items-center gap-2">
    <div className="w-20 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${score > 70 ? 'bg-red-500' : score > 30 ? 'bg-yellow-500' : 'bg-emerald-500'}`}
        style={{ width: `${score || 0}%` }}
      />
    </div>
    <span className={`text-[9px] font-mono font-bold ${score > 70 ? 'text-red-400' : score > 30 ? 'text-yellow-400' : 'text-emerald-400'}`}>
      {score || 0}%
    </span>
  </div>
);

// ─── Main App ──────────────────────────────────────────
const App = () => {
  const [targets, setTargets]       = useState([]);
  const [alerts, setAlerts]         = useState([]);
  const [inputEmail, setInputEmail] = useState('');
  const [isSyncing, setIsSyncing]   = useState(false);
  const [backendOnline, setBackendOnline] = useState(null); // null = unknown
  const [error, setError]           = useState(null);
  const [ingestMsg, setIngestMsg]   = useState(null);
  const [activeTab, setActiveTab]   = useState('targets'); // 'targets' | 'alerts'

  // ── Health check ─────────────────────────────────────
  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/health`);
      setBackendOnline(res.ok);
      if (!res.ok) setError('Backend returned error status');
      else setError(null);
    } catch {
      setBackendOnline(false);
      setError('Backend Node Offline — Check Port 8000');
    }
  }, []);

  // ── Fetch targets ─────────────────────────────────────
  const fetchTargets = useCallback(async () => {
    setIsSyncing(true);
    try {
      const res = await fetch(`${API_BASE}/targets`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setTargets(await res.json());
      setBackendOnline(true);
      setError(null);
    } catch (err) {
      setBackendOnline(false);
      setError('Backend Node Offline — Check Port 8000');
    } finally {
      setTimeout(() => setIsSyncing(false), 400);
    }
  }, []);

  // ── Fetch alerts ──────────────────────────────────────
  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/alerts`);
      if (res.ok) setAlerts(await res.json());
    } catch { /* silent */ }
  }, []);

  // ── Polling heartbeat ─────────────────────────────────
  useEffect(() => {
    checkHealth();
    fetchTargets();
    fetchAlerts();
    const id = setInterval(() => {
      fetchTargets();
      fetchAlerts();
    }, 5000);
    return () => clearInterval(id);
  }, [checkHealth, fetchTargets, fetchAlerts]);

  // ── Ingest new target ─────────────────────────────────
  const handleIngest = async () => {
    const email = inputEmail.trim();
    if (!email) return;
    try {
      const res = await fetch(`${API_BASE}/add-to-watchlist/${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.status === 'ALREADY_EXISTS') {
        setIngestMsg({ type: 'warn', text: 'Target already in surveillance queue.' });
      } else {
        setIngestMsg({ type: 'ok', text: `✅ ${email} ingested — awaiting scan.` });
        setInputEmail('');
        fetchTargets();
      }
    } catch {
      setIngestMsg({ type: 'err', text: 'Ingestion failed — server unreachable.' });
    }
    setTimeout(() => setIngestMsg(null), 4000);
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleIngest(); };

  // ── Delete target ─────────────────────────────────────
  const handleDelete = async (id) => {
    try {
      await fetch(`${API_BASE}/targets/${id}`, { method: 'DELETE' });
      setTargets(prev => prev.filter(t => t._id !== id));
    } catch {
      setError('Delete failed — server unreachable.');
    }
  };

  // ── Stats ───────────────────────────────────────────
  const leaked  = targets.filter(t => t.status === 'LEAKED').length;
  const secure  = targets.filter(t => t.status === 'SECURE').length;
  const pending = targets.filter(t => ['PENDING', 'SCAN_ERROR'].includes(t.status)).length;

  return (
    <div className="min-h-screen bg-[#060608] text-slate-300 font-mono">

      {/* ── NAV ───────────────────────────────────────── */}
      <nav className="border-b border-zinc-800/60 bg-black/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-emerald-500" />
            <div>
              <span className="text-sm font-bold text-white tracking-widest">PROJECT SHIELD</span>
              <span className="ml-3 text-[9px] text-emerald-500/50 uppercase tracking-widest hidden sm:inline">
                Forensic Reconnaissance Engine v2.0
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[10px]">
            {/* Backend status */}
            {backendOnline === false ? (
              <div className="flex items-center gap-1.5 text-red-500 animate-pulse">
                <XCircle className="w-3 h-3" /> BACKEND OFFLINE
              </div>
            ) : backendOnline === true ? (
              <div className="flex items-center gap-1.5 text-emerald-500">
                <Activity className={`w-3 h-3 ${isSyncing ? 'animate-ping' : ''}`} />
                LINK ACTIVE
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-zinc-500">
                <Loader className="w-3 h-3 animate-spin" /> CONNECTING...
              </div>
            )}

            {/* Alert bell */}
            {alerts.length > 0 && (
              <button onClick={() => setActiveTab('alerts')}
                className="relative text-red-500 hover:scale-110 transition-transform">
                <Bell className="w-4 h-4 animate-pulse" />
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[7px] rounded-full w-3 h-3 flex items-center justify-center">
                  {alerts.length > 9 ? '9+' : alerts.length}
                </span>
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">

        {/* ── STATS ROW ─────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Leaked', val: leaked,  color: 'text-red-400',     border: 'border-red-900/40' },
            { label: 'Secure', val: secure,  color: 'text-emerald-400', border: 'border-emerald-900/40' },
            { label: 'Pending',val: pending, color: 'text-yellow-400',  border: 'border-yellow-900/40' },
          ].map(s => (
            <div key={s.label} className={`bg-zinc-900/30 border ${s.border} rounded-lg p-4 text-center`}>
              <div className={`text-2xl font-bold ${s.color}`}>{s.val}</div>
              <div className="text-[9px] text-zinc-600 uppercase tracking-widest mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* ── LEFT PANEL: Ingestion ──────────────────── */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-xl">
              <h2 className="text-[10px] font-bold text-zinc-500 mb-4 tracking-widest uppercase flex items-center gap-2">
                <Search className="w-3 h-3" /> Target Ingestion
              </h2>
              <div className="space-y-3">
                <input
                  id="target-input"
                  value={inputEmail}
                  onChange={e => setInputEmail(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Email or Entity ID..."
                  className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-xs text-emerald-400 placeholder-zinc-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-all"
                />
                <button
                  id="ingest-btn"
                  onClick={handleIngest}
                  className="w-full bg-emerald-600/10 border border-emerald-600/40 hover:bg-emerald-600/20 hover:border-emerald-500 text-emerald-500 text-[10px] font-bold py-3 rounded-lg uppercase tracking-widest transition-all"
                >
                  ⚡ Deploy Surveillance
                </button>
              </div>

              {/* Ingest feedback */}
              {ingestMsg && (
                <div className={`mt-3 p-2 rounded text-[10px] border ${
                  ingestMsg.type === 'ok'  ? 'bg-emerald-950/20 border-emerald-900/50 text-emerald-400' :
                  ingestMsg.type === 'warn'? 'bg-yellow-950/20 border-yellow-900/50 text-yellow-400' :
                                             'bg-red-950/20 border-red-900/50 text-red-400'
                }`}>
                  {ingestMsg.text}
                </div>
              )}
            </div>

            {/* Error panel */}
            {error && (
              <div className="bg-red-950/20 border border-red-900/50 p-4 rounded-xl text-[10px] text-red-400">
                <div className="flex items-center gap-2 font-bold mb-1"><AlertTriangle className="w-3 h-3" /> ERROR</div>
                {error}
              </div>
            )}
          </div>

          {/* ── RIGHT PANEL: Table ─────────────────────── */}
          <div className="lg:col-span-3">
            {/* Tab bar */}
            <div className="flex gap-1 mb-3">
              {[
                { id: 'targets', label: '🎯 Surveillance Queue', count: targets.length },
                { id: 'alerts',  label: '🚨 Alert Feed',         count: alerts.length },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-[10px] font-bold rounded-t-lg border-b-2 tracking-widest transition-all ${
                    activeTab === tab.id
                      ? 'border-emerald-500 text-emerald-400 bg-zinc-900/40'
                      : 'border-transparent text-zinc-600 hover:text-zinc-400'
                  }`}
                >
                  {tab.label}
                  <span className="ml-2 bg-zinc-800 px-1.5 py-0.5 rounded text-[8px]">{tab.count}</span>
                </button>
              ))}
              <div className="ml-auto self-center">
                <RefreshCcw
                  onClick={fetchTargets}
                  className={`w-3 h-3 text-zinc-600 hover:text-zinc-400 cursor-pointer ${isSyncing ? 'animate-spin' : ''}`}
                />
              </div>
            </div>

            <div className="bg-zinc-900/20 border border-zinc-800 rounded-xl overflow-hidden backdrop-blur-sm">
              <div className="p-3 border-b border-zinc-800 bg-zinc-900/40 flex items-center gap-2">
                <Terminal className="w-3 h-3 text-emerald-500" />
                <span className="text-[10px] font-bold text-zinc-300 tracking-widest uppercase">
                  {activeTab === 'targets' ? 'Live Recon Feed' : 'Critical Threat Intelligence'}
                </span>
              </div>

              {/* ─ TARGETS TAB ─ */}
              {activeTab === 'targets' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px]">
                    <thead className="text-zinc-600 uppercase border-b border-zinc-800 bg-black/20 text-[9px]">
                      <tr>
                        <th className="p-4 tracking-wider">Target Identity</th>
                        <th className="p-4 tracking-wider">Status</th>
                        <th className="p-4 tracking-wider">Risk Score</th>
                        <th className="p-4 tracking-wider">Last Scan</th>
                        <th className="p-4 tracking-wider">Evidence</th>
                        <th className="p-4 tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/40">
                      {targets.map(t => (
                        <tr key={t._id} className="hover:bg-white/[0.01] transition-colors group">
                          <td className="p-4 font-bold text-zinc-200">{t.email}</td>
                          <td className="p-4"><StatusBadge status={t.status} /></td>
                          <td className="p-4"><RiskBar score={t.risk_score} /></td>
                          <td className="p-4 text-zinc-600 text-[10px]">
                            <div className="flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              {t.last_scan || '—'}
                            </div>
                          </td>
                          <td className="p-4">
                            {t.status === 'LEAKED' && t.source_url ? (
                              <a
                                href={t.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-[10px] text-red-400 hover:text-red-300 transition-colors max-w-[180px] truncate"
                                title={t.evidence_title || t.source_url}
                              >
                                <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
                                <span className="truncate">{t.evidence_title || t.source_url}</span>
                              </a>
                            ) : (
                              <span className="text-zinc-700 text-[10px]">—</span>
                            )}
                          </td>
                          <td className="p-4">
                            <button
                              id={`delete-${t._id}`}
                              onClick={() => handleDelete(t._id)}
                              className="p-1.5 rounded hover:bg-red-950/30 text-zinc-700 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                              title="Remove from surveillance"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {targets.length === 0 && (
                    <div className="py-20 text-center text-zinc-700 text-[10px] tracking-widest italic uppercase">
                      No targets in surveillance queue — inject a target to begin
                    </div>
                  )}
                </div>
              )}

              {/* ─ ALERTS TAB ─ */}
              {activeTab === 'alerts' && (
                <div className="divide-y divide-zinc-800/40">
                  {alerts.length === 0 && (
                    <div className="py-20 text-center text-zinc-700 text-[10px] tracking-widest italic uppercase">
                      No alerts — all targets clean
                    </div>
                  )}
                  {alerts.map(a => (
                    <div key={a._id} className="p-4 hover:bg-red-950/5 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] bg-red-950/40 border border-red-900/50 text-red-400 px-2 py-0.5 rounded font-bold">
                              🚨 CRITICAL
                            </span>
                            <span className="text-xs font-bold text-zinc-200">{a.target}</span>
                          </div>
                          {a.evidence_title && (
                            <div className="text-[10px] text-zinc-500">Evidence: {a.evidence_title}</div>
                          )}
                          {a.detection_method && (
                            <div className="text-[9px] text-zinc-700">Method: {a.detection_method}</div>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          {a.evidence_url && (
                            <a href={a.evidence_url} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 text-[10px] text-yellow-500 hover:text-yellow-400">
                              <ExternalLink className="w-3 h-3" /> View Source
                            </a>
                          )}
                          <div className="text-[9px] text-zinc-700 mt-1">{a.timestamp}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;