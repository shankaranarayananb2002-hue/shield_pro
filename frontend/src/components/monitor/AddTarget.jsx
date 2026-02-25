import React, { useState } from 'react';
import { shieldAPI } from '../../services/api';
import { Zap } from 'lucide-react';

export const AddTarget = ({ onAdded }) => {
  const [email, setEmail] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await shieldAPI.addTarget(email);
      onAdded(email);
      setEmail("");
    } catch (err) { alert("Backend Offline!"); }
  };

  return (
    <div className="bg-slate-900/50 p-6 rounded-lg border border-blue-900/30">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input 
          className="w-full bg-black border border-blue-900/50 p-3 rounded text-blue-400 outline-none focus:border-blue-400"
          placeholder="ENTER TARGET EMAIL..."
          value={email} onChange={(e) => setEmail(e.target.value)} required
        />
        <button className="w-full bg-blue-600 hover:bg-blue-500 text-white p-3 rounded font-bold transition-all glow-blue">
          INITIALIZE SCAN
        </button>
      </form>
    </div>
  );
};