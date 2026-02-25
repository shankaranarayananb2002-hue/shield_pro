import React, { useState } from 'react';
import { AddTarget } from './components/Monitor/AddTarget';
import { Shield, Activity } from 'lucide-react';

function App() {
  const [watchlist, setWatchlist] = useState([]);

  return (
    <div className="min-h-screen p-10">
      <header className="flex justify-between items-center border-b border-blue-900/30 pb-8 mb-10">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Shield className="text-blue-500 animate-pulse" /> SHIELD_CORE
        </h1>
        <div className="text-green-500 flex items-center gap-2 text-xs">
          <Activity size={14} /> AI ENGINE: ONLINE
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4">
          <AddTarget onAdded={(newEmail) => setWatchlist([...watchlist, newEmail])} />
        </div>
        
        <div className="lg:col-span-8 bg-slate-900/20 border border-blue-900/20 rounded-lg p-6">
          <h2 className="text-blue-500 text-sm mb-4">ACTIVE SURVEILLANCE LIST</h2>
          {watchlist.map((email, i) => (
            <div key={i} className="p-3 mb-2 bg-black/40 border-l-4 border-blue-600 rounded">
              {email}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default App;