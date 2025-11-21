import React, { useState } from 'react';
import { User, Clock, Save, Trash2, Play, X, Check, ArrowRight } from 'lucide-react';
import { UserProfile, SavedWheel, HistoryEntry, Option } from '../types';
import { saveProfile } from '../services/storageService';

interface ProfileSectionProps {
  user: UserProfile | null;
  onUpdateUser: (u: UserProfile) => void;
  savedWheels: SavedWheel[];
  onLoadWheel: (options: Option[]) => void;
  onDeleteWheel: (id: string) => void;
  history: HistoryEntry[];
  onClearHistory: () => void;
  onClose: () => void;
}

export const ProfileSection: React.FC<ProfileSectionProps> = ({
  user,
  onUpdateUser,
  savedWheels,
  onLoadWheel,
  onDeleteWheel,
  history,
  onClearHistory,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'saved' | 'history'>('saved');
  const [nameInput, setNameInput] = useState(user?.name || '');
  const [isEditingName, setIsEditingName] = useState(!user);

  const handleSaveName = () => {
    if (!nameInput.trim()) return;
    const newProfile = { name: nameInput.trim() };
    saveProfile(newProfile);
    onUpdateUser(newProfile);
    setIsEditingName(false);
    
    // If this was the onboarding flow (no previous user), close the profile section automatically
    if (!user) {
      onClose();
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isNewUser = !user;

  return (
    <div className="absolute inset-0 z-50 bg-slate-900 flex flex-col animate-fade-in">
      {/* Header */}
      <div className="p-4 flex justify-between items-center bg-slate-800 shadow-md">
        <h2 className="text-xl font-bold flex items-center text-white">
          <User className="mr-2 text-pink-500" size={24} />
          {isNewUser ? "Welcome" : "Profile"}
        </h2>
        {/* Only show close button if user exists (skippable only if profile set) */}
        {!isNewUser && (
          <button onClick={onClose} className="p-2 bg-slate-700 rounded-full hover:bg-slate-600 transition-colors">
            <X size={20} className="text-white" />
          </button>
        )}
      </div>

      {/* User Info / Onboarding Input */}
      <div className={`p-6 bg-slate-800/50 border-b border-slate-700 text-center ${isNewUser ? 'flex-1 flex flex-col justify-center' : ''}`}>
        {isEditingName ? (
          <div className="flex flex-col items-center space-y-6 w-full">
            <div className="space-y-2">
                <div className="w-20 h-20 bg-slate-700 rounded-full mx-auto flex items-center justify-center mb-4">
                    <User size={40} className="text-slate-500" />
                </div>
                <p className="text-white text-lg font-medium">
                    {isNewUser ? "Let's get started! What's your name?" : "Update your name"}
                </p>
            </div>
            
            {isNewUser ? (
                 <div className="w-full max-w-xs space-y-4 animate-slide-up">
                    <input
                        type="text"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                        placeholder="Your Name"
                        className="w-full bg-slate-900 border-2 border-slate-600 focus:border-pink-500 text-white px-6 py-4 rounded-2xl text-center text-lg focus:outline-none transition-colors placeholder:text-slate-600"
                        autoFocus
                    />
                    <button 
                        onClick={handleSaveName} 
                        disabled={!nameInput.trim()}
                        className="w-full py-4 bg-gradient-to-r from-pink-500 to-violet-600 hover:from-pink-400 hover:to-violet-500 text-white font-bold rounded-2xl shadow-lg shadow-pink-500/20 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                    >
                        <span>Start Deciding</span>
                        <ArrowRight size={20} />
                    </button>
                 </div>
            ) : (
                <div className="flex items-center space-x-2 max-w-[250px] w-full">
                    <input
                        type="text"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                         onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                        placeholder="Enter your name"
                        className="flex-1 bg-slate-900 border border-slate-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-pink-500"
                        autoFocus
                    />
                    <button onClick={handleSaveName} className="p-2 bg-green-600 rounded-lg hover:bg-green-500 text-white">
                        <Check size={20} />
                    </button>
                </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center animate-fade-in">
            <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-violet-600 rounded-full flex items-center justify-center mb-3 shadow-lg">
              <span className="text-3xl font-bold text-white">{user?.name.charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex items-center space-x-2">
              <h3 className="text-2xl font-bold text-white">{user?.name}</h3>
              <button onClick={() => setIsEditingName(true)} className="text-slate-500 hover:text-pink-400 p-1">
                 <User size={16} />
              </button>
            </div>
            <p className="text-slate-400 text-sm mt-1">Master of Decisions</p>
          </div>
        )}
      </div>

      {/* Tabs & Content - Only show if NOT in onboarding mode */}
      {!isNewUser && (
        <>
            <div className="flex border-b border-slate-700">
                <button
                onClick={() => setActiveTab('saved')}
                className={`flex-1 py-4 text-sm font-semibold flex justify-center items-center space-x-2 transition-colors ${activeTab === 'saved' ? 'text-pink-500 border-b-2 border-pink-500 bg-slate-800/30' : 'text-slate-400 hover:text-white'}`}
                >
                <Save size={18} />
                <span>Saved Wheels</span>
                </button>
                <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 py-4 text-sm font-semibold flex justify-center items-center space-x-2 transition-colors ${activeTab === 'history' ? 'text-pink-500 border-b-2 border-pink-500 bg-slate-800/30' : 'text-slate-400 hover:text-white'}`}
                >
                <Clock size={18} />
                <span>History</span>
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4">
                {activeTab === 'saved' && (
                <div className="space-y-3">
                    {savedWheels.length === 0 ? (
                    <div className="text-center py-10 text-slate-500">
                        <Save size={48} className="mx-auto mb-4 opacity-20" />
                        <p>No saved wheels yet.</p>
                        <p className="text-xs mt-2">Create a list and tap the save icon.</p>
                    </div>
                    ) : (
                    savedWheels.map((wheel) => (
                        <div key={wheel.id} className="bg-slate-800 rounded-xl p-4 border border-slate-700 flex justify-between items-center hover:border-slate-600 transition-colors">
                        <div className="overflow-hidden">
                            <h4 className="font-bold text-white truncate">{wheel.name}</h4>
                            <p className="text-xs text-slate-400 mt-1">{wheel.options.length} options • {formatDate(wheel.createdAt)}</p>
                        </div>
                        <div className="flex space-x-2">
                            <button 
                            onClick={() => onLoadWheel(wheel.options)}
                            className="p-2 bg-indigo-600/20 text-indigo-400 rounded-lg hover:bg-indigo-600 hover:text-white transition-all"
                            >
                            <Play size={18} />
                            </button>
                            <button 
                            onClick={() => onDeleteWheel(wheel.id)}
                            className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                            >
                            <Trash2 size={18} />
                            </button>
                        </div>
                        </div>
                    ))
                    )}
                </div>
                )}

                {activeTab === 'history' && (
                <div className="space-y-3">
                    {history.length > 0 && (
                        <div className="flex justify-end mb-2">
                            <button onClick={onClearHistory} className="text-xs text-red-400 hover:text-red-300">Clear History</button>
                        </div>
                    )}
                    {history.length === 0 ? (
                    <div className="text-center py-10 text-slate-500">
                        <Clock size={48} className="mx-auto mb-4 opacity-20" />
                        <p>No decisions made yet.</p>
                        <p className="text-xs mt-2">Spin the wheel to make history.</p>
                    </div>
                    ) : (
                    history.map((entry) => (
                        <div key={entry.id} className="bg-slate-800 rounded-xl p-4 border border-slate-700 flex items-center justify-between">
                        <div>
                            <div className="text-xs text-slate-500 mb-1">{formatDate(entry.timestamp)}</div>
                            <div className="font-bold text-lg text-white" style={{ color: entry.winner.color }}>{entry.winner.text}</div>
                        </div>
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.winner.color }}></div>
                        </div>
                    ))
                    )}
                </div>
                )}
            </div>
        </>
      )}
    </div>
  );
};