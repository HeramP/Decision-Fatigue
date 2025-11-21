import React, { useMemo, useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { Users, ArrowRight } from 'lucide-react';

interface DuoLinkProps {
  onComplete: () => void;
  onCancel: () => void;
}

export const DuoLink: React.FC<DuoLinkProps> = ({ onComplete, onCancel }) => {
  // Generate a stable session ID for this mount so the QR code doesn't change on re-renders
  const sessionId = useMemo(() => Math.random().toString(36).substring(7), []);
  const [pairingUrl, setPairingUrl] = useState('');

  useEffect(() => {
    // Dynamically generate URL based on current location to avoid 404s
    // We strip query params to ensure a clean base URL, then append the session
    const baseUrl = window.location.origin + window.location.pathname;
    setPairingUrl(`${baseUrl}?session=${sessionId}`);
  }, [sessionId]);

  return (
    <div className="flex flex-col items-center justify-center space-y-6 p-6 bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl animate-fade-in max-w-sm w-full mx-4">
      <div className="text-center space-y-2">
        <div className="flex justify-center mb-2">
          <Users size={40} className="text-pink-500" />
        </div>
        <h2 className="text-2xl font-bold text-white">The 50/50 Link</h2>
        <p className="text-slate-400 text-sm">
          End the "I don't care, you pick" loop. <br/> Scan to pair devices.
        </p>
      </div>

      <div className="p-4 bg-white rounded-xl shadow-lg min-h-[212px] flex items-center justify-center">
        {pairingUrl ? (
          <QRCode 
            value={pairingUrl} 
            size={180}
            level="L"
          />
        ) : (
          <div className="w-[180px] h-[180px] bg-slate-200 animate-pulse rounded-lg" />
        )}
      </div>

      <div className="text-xs text-slate-500 text-center">
        Session ID: {sessionId} • Waiting for User B...
      </div>

      {/* Simulation Button for the Demo */}
      <button 
        onClick={onComplete}
        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center justify-center space-x-2 transition-all active:scale-95 shadow-lg shadow-indigo-500/20"
      >
        <span>Simulate Connection</span>
        <ArrowRight size={18} />
      </button>

      <button 
        onClick={onCancel}
        className="text-slate-400 hover:text-white text-sm underline p-2"
      >
        Cancel
      </button>
    </div>
  );
};