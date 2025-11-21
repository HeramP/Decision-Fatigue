import React, { useState, useEffect, useCallback } from 'react';
import { Trash2, Sparkles, Lock, Zap, Share2, Plus, User, Save, X, Link as LinkIcon, RefreshCw } from 'lucide-react';
import { Wheel } from './components/Wheel';
import { DuoLink } from './components/DuoLink';
import { ProfileSection } from './components/ProfileSection';
import { generateOptionsWithGemini } from './services/geminiService';
import * as Storage from './services/storageService';
import { AppMode, Option, LockedState, UserProfile, SavedWheel, HistoryEntry } from './types';
import { WHEEL_COLORS, LOCK_DURATION_MS, LOCAL_STORAGE_LOCK_KEY } from './constants';

// Helper to create an option
const createOption = (text: string, index: number): Option => ({
  id: Math.random().toString(36).substring(7),
  text,
  color: WHEEL_COLORS[index % WHEEL_COLORS.length],
});

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.SOLO);
  const [options, setOptions] = useState<Option[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [winningOption, setWinningOption] = useState<Option | null>(null);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);

  // Duo Mode State
  const [isDuoSession, setIsDuoSession] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [userAOptionsCount, setUserAOptionsCount] = useState(0);

  // Profile & Storage State
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [savedWheels, setSavedWheels] = useState<SavedWheel[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  
  // Save UI State
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [saveName, setSaveName] = useState('');

  // Load all initial data
  useEffect(() => {
    // Load Lock
    const storedLock = localStorage.getItem(LOCAL_STORAGE_LOCK_KEY);
    let isLockedState = false;

    if (storedLock) {
      const parsed: LockedState = JSON.parse(storedLock);
      if (Date.now() < parsed.unlockTime) {
        setWinningOption(parsed.winner);
        setLockedUntil(parsed.unlockTime);
        setMode(AppMode.LOCKED);
        isLockedState = true;
      } else {
        localStorage.removeItem(LOCAL_STORAGE_LOCK_KEY);
      }
    }
    
    // Load Storage
    const loadedProfile = Storage.getProfile();
    setUserProfile(loadedProfile);
    setSavedWheels(Storage.getSavedWheels());
    setHistory(Storage.getHistory());

    // Set initial options if empty and not locked
    if (options.length === 0 && !storedLock) {
        setOptions([createOption('Pizza', 0), createOption('Sushi', 1), createOption('Tacos', 2)]);
    }

    // Automatic Onboarding: If no profile exists and app is not locked, go to profile creation
    if (!loadedProfile && !isLockedState) {
      setMode(AppMode.PROFILE);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Timer for Lock Mode
  useEffect(() => {
    if (mode !== AppMode.LOCKED || !lockedUntil) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = lockedUntil - now;
      
      if (diff <= 0) {
        setMode(AppMode.SOLO);
        setLockedUntil(null);
        setWinningOption(null);
        localStorage.removeItem(LOCAL_STORAGE_LOCK_KEY);
        clearInterval(interval);
      } else {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [mode, lockedUntil]);

  const handleAddOption = () => {
    if (!inputValue.trim()) return;
    if (options.length >= 12) return; // Max limit
    const newOption = createOption(inputValue.trim(), options.length);
    setOptions([...options, newOption]);
    setInputValue('');
  };

  const handleDeleteOption = (id: string) => {
    setOptions(options.filter(o => o.id !== id));
  };

  const handleAiGenerate = async () => {
    if (!inputValue.trim()) return;
    setAiLoading(true);
    const suggestions = await generateOptionsWithGemini(inputValue);
    setAiLoading(false);
    
    if (suggestions.length > 0) {
      const newOptions = suggestions.map((text, i) => createOption(text, i));
      setOptions(newOptions);
      setInputValue(''); // Clear prompt
    }
  };

  const handleSaveWheel = () => {
    if (!saveName.trim() || options.length === 0) return;
    
    const newWheel: SavedWheel = {
      id: Math.random().toString(36).substring(7),
      name: saveName.trim(),
      options: [...options],
      createdAt: Date.now()
    };
    
    const updated = Storage.saveWheel(newWheel);
    setSavedWheels(updated);
    setSaveName('');
    setShowSaveInput(false);
  };

  const handleLoadWheel = (loadedOptions: Option[]) => {
    setOptions(loadedOptions);
    setMode(AppMode.SOLO);
    setIsDuoSession(false); // Reset duo if loading a personal wheel
  };

  const handleDeleteWheel = (id: string) => {
    const updated = Storage.deleteSavedWheel(id);
    setSavedWheels(updated);
  };

  const handleClearHistory = () => {
    Storage.clearHistory();
    setHistory([]);
  };

  const startSpin = () => {
    if (options.length < 2) {
      alert("Add at least 2 options!");
      return;
    }
    
    // Trigger Haptics for "satisfying" feel
    if (navigator.vibrate) {
      navigator.vibrate(200); 
    }
    
    // Trigger Wheel Animation
    setMode(AppMode.SPINNING);
  };

  const onSpinEnd = useCallback((winner: Option) => {
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]); // Haptic success pattern
    
    const unlockTime = Date.now() + LOCK_DURATION_MS;
    const lockState: LockedState = { winner, unlockTime };
    
    localStorage.setItem(LOCAL_STORAGE_LOCK_KEY, JSON.stringify(lockState));
    
    // Save to history
    const historyEntry: HistoryEntry = {
      id: Math.random().toString(36).substring(7),
      winner,
      timestamp: Date.now()
    };
    const updatedHistory = Storage.addToHistory(historyEntry);
    setHistory(updatedHistory);

    setWinningOption(winner);
    setLockedUntil(unlockTime);
    setMode(AppMode.LOCKED);
  }, []);

  // Duo Mode Flow Handlers
  const startDuoMode = () => {
    setMode(AppMode.DUO_SETUP);
  };

  const onDuoConnected = () => {
    setOptions([]); // Clear for fresh start
    setUserAOptionsCount(0);
    setIsDuoSession(true);
    setMode(AppMode.DUO_INPUT_A);
  };

  const finishDuoInputA = () => {
    if (options.length < 2) {
        alert("User A must add at least 2 options");
        return;
    }
    setUserAOptionsCount(options.length);
    setMode(AppMode.DUO_INPUT_B);
  };

  const finishDuoInputB = () => {
     const userBCount = options.length - userAOptionsCount;
     if (userBCount < 2) {
         alert("User B must add at least 2 options!");
         return;
     }
     setIsSyncing(true);
     // Fake sync delay for effect
     setTimeout(() => {
         setIsSyncing(false);
         setMode(AppMode.SOLO); // Ready to spin combined
     }, 1500);
  };

  const exitDuoMode = () => {
      setIsDuoSession(false);
      setMode(AppMode.SOLO);
      setUserAOptionsCount(0);
      setOptions([createOption('Pizza', 0), createOption('Sushi', 1), createOption('Tacos', 2)]);
  };

  // Renders
  return (
    <div className="min-h-screen w-full bg-slate-900 text-slate-50 flex flex-col items-center overflow-hidden relative selection:bg-pink-500 selection:text-white">
      
      {/* Header */}
      <header className="w-full p-4 flex justify-between items-center z-10 bg-slate-900/80 backdrop-blur-sm sticky top-0">
        <div className="flex items-center space-x-2">
          <Zap className="text-yellow-400 fill-yellow-400" size={24} />
          <h1 className="font-bold text-xl tracking-tight hidden sm:block">Tiny Decisions</h1>
          {isDuoSession && (
              <div className="flex items-center space-x-1 bg-indigo-600/20 border border-indigo-500/50 px-2 py-1 rounded-full ml-2">
                  <LinkIcon size={12} className="text-indigo-400" />
                  <span className="text-xs font-bold text-indigo-400 uppercase">Linked</span>
              </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {/* Solo Mode: Share Button */}
          {!isDuoSession && mode === AppMode.SOLO && (
            <button 
              onClick={startDuoMode} 
              className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors"
              title="Start 50/50 Link"
            >
                <Share2 size={20} className="text-pink-400" />
            </button>
          )}

          {/* Duo Mode: Exit Button (Visible during inputs or active link) */}
          {isDuoSession && mode !== AppMode.SPINNING && (
             <button 
              onClick={exitDuoMode} 
              className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors group"
              title="Exit Linked Mode"
             >
               <X size={20} className="text-slate-400 group-hover:text-red-400 transition-colors" />
             </button>
          )}

          {/* Profile (Visible only in Solo/Locked) */}
          {(mode === AppMode.SOLO || mode === AppMode.LOCKED) && (
              <button onClick={() => setMode(AppMode.PROFILE)} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors relative">
                  <User size={20} className="text-indigo-400" />
                  {!userProfile && <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>}
              </button>
          )}
        </div>
      </header>

      <main className="flex-1 w-full max-w-md flex flex-col items-center px-4 pb-8 relative">
        
        {/* PROFILE SECTION */}
        {mode === AppMode.PROFILE && (
           <ProfileSection 
              user={userProfile}
              onUpdateUser={setUserProfile}
              savedWheels={savedWheels}
              onLoadWheel={handleLoadWheel}
              onDeleteWheel={handleDeleteWheel}
              history={history}
              onClearHistory={handleClearHistory}
              onClose={() => setMode(lockedUntil ? AppMode.LOCKED : AppMode.SOLO)}
           />
        )}

        {/* LOCKED SCREEN */}
        {mode === AppMode.LOCKED && winningOption && (
            <div className="flex flex-col items-center justify-center flex-1 space-y-8 animate-fade-in w-full">
                <div className="text-center space-y-2">
                    <h2 className="text-slate-400 uppercase tracking-widest text-sm font-semibold">The Decision Is Final</h2>
                    <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500 py-2">
                        {winningOption.text}
                    </div>
                </div>

                <div className="w-64 h-64 rounded-full bg-slate-800 flex flex-col items-center justify-center border-4 border-slate-700 shadow-[0_0_50px_rgba(236,72,153,0.3)]">
                     <Lock size={64} className="text-slate-500 mb-4" />
                     <div className="text-3xl font-mono font-bold text-slate-300">{timeLeft}</div>
                     <div className="text-xs text-slate-500 mt-2">Locked</div>
                </div>

                <div className="p-4 bg-slate-800/50 rounded-lg text-sm text-slate-400 text-center max-w-xs">
                    "Commitment is an act, not a word." <br/> Stick with it for 2 minutes.
                </div>
            </div>
        )}

        {/* DUO SETUP */}
        {mode === AppMode.DUO_SETUP && (
            <div className="flex-1 flex items-center justify-center w-full">
                <DuoLink onComplete={onDuoConnected} onCancel={() => setMode(AppMode.SOLO)} />
            </div>
        )}

        {/* MAIN APP / INPUT MODES */}
        {(mode === AppMode.SOLO || mode === AppMode.SPINNING || mode === AppMode.DUO_INPUT_A || mode === AppMode.DUO_INPUT_B) && (
            <>
                {/* Helper Banner for Duo */}
                {(mode === AppMode.DUO_INPUT_A || mode === AppMode.DUO_INPUT_B) && (
                    <div className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white p-4 rounded-2xl mb-4 shadow-lg animate-fade-in flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-xl flex items-center gap-2">
                                {mode === AppMode.DUO_INPUT_A ? "User A" : "User B"}
                                <span className="text-xs bg-white/20 px-2 py-1 rounded-md font-normal text-indigo-100">
                                    {mode === AppMode.DUO_INPUT_A ? "First Pick" : "Second Pick"}
                                </span>
                            </h3>
                            <p className="text-indigo-200 text-xs mt-1">Add at least 2 options</p>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-3xl font-black">
                                {mode === AppMode.DUO_INPUT_A ? options.length : options.length - userAOptionsCount}
                            </span>
                            <span className="text-xs uppercase tracking-wider text-indigo-200">Added</span>
                        </div>
                    </div>
                )}

                {/* Wheel Area with Sync Overlay */}
                <div className="relative">
                    <div className={`transition-all duration-500 ${isSyncing ? 'opacity-50 blur-sm' : ''}`}>
                       <Wheel 
                          options={options} 
                          isSpinning={mode === AppMode.SPINNING} 
                          onSpinEnd={onSpinEnd} 
                       />
                    </div>
                    
                    {isSyncing && (
                        <div className="absolute inset-0 flex items-center justify-center z-20">
                            <div className="flex flex-col items-center bg-slate-900/90 p-6 rounded-2xl shadow-2xl border border-slate-700 animate-bounce-in">
                                <RefreshCw className="text-pink-500 animate-spin mb-3" size={32} />
                                <span className="text-white font-bold">Merging Choices...</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Controls Area (Hidden while spinning) */}
                {mode !== AppMode.SPINNING && (
                    <div className="w-full space-y-4 mt-4 animate-slide-up">
                        
                        {/* Save Wheel Input - Conditional Render */}
                        {showSaveInput ? (
                             <div className="flex gap-2 animate-fade-in">
                                <input 
                                    type="text" 
                                    value={saveName}
                                    onChange={(e) => setSaveName(e.target.value)}
                                    placeholder="Name this wheel..."
                                    autoFocus
                                    className="flex-1 bg-slate-800 border-pink-500 border-2 text-white px-4 py-3 rounded-xl focus:outline-none"
                                />
                                <button onClick={handleSaveWheel} className="bg-green-600 text-white p-3 rounded-xl">
                                    <Save size={24} />
                                </button>
                                <button onClick={() => setShowSaveInput(false)} className="bg-slate-700 text-white p-3 rounded-xl">
                                    <X size={24} />
                                </button>
                             </div>
                        ) : (
                            /* Standard Input Row */
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddOption()}
                                    placeholder={mode === AppMode.SOLO ? "Add option or ask AI..." : "Add option..."}
                                    className="flex-1 bg-slate-800 border-slate-700 border text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                                />
                                <button 
                                    onClick={handleAddOption}
                                    className="bg-slate-700 hover:bg-slate-600 text-white p-3 rounded-xl transition-colors"
                                >
                                    <Plus size={24} />
                                </button>
                                {/* AI Button - Only in Solo Mode or if we want AI in duo too (disabled for simplicity in duo) */}
                                {mode === AppMode.SOLO && !isDuoSession && (
                                    <>
                                        <button 
                                            onClick={handleAiGenerate}
                                            disabled={aiLoading}
                                            className={`bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-3 rounded-xl transition-all ${aiLoading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-[0_0_15px_rgba(99,102,241,0.5)]'}`}
                                        >
                                            {aiLoading ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Sparkles size={24} />}
                                        </button>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Options List Pills */}
                        <div className="flex flex-wrap gap-2 justify-center max-h-32 overflow-y-auto relative">
                            {options.map((opt) => (
                                <div key={opt.id} className="flex items-center bg-slate-800 rounded-full px-4 py-1.5 border border-slate-700 group hover:border-pink-500 transition-colors">
                                    <span className="text-sm font-medium mr-2" style={{ color: opt.color }}>●</span>
                                    <span className="text-sm">{opt.text}</span>
                                    <button onClick={() => handleDeleteOption(opt.id)} className="ml-2 text-slate-500 hover:text-red-400">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                            
                            {/* Save Button Trigger (Only if options exist and not currently saving) */}
                            {options.length > 0 && mode === AppMode.SOLO && !showSaveInput && !isDuoSession && (
                                <button 
                                    onClick={() => setShowSaveInput(true)}
                                    className="flex items-center bg-slate-800/50 hover:bg-slate-800 rounded-full px-3 py-1.5 border border-dashed border-slate-600 text-slate-400 hover:text-white transition-colors"
                                >
                                    <Save size={14} className="mr-1" />
                                    <span className="text-xs">Save</span>
                                </button>
                            )}

                            {options.length === 0 && (
                                <div className="text-slate-500 text-sm italic">No options added yet.</div>
                            )}
                        </div>

                        {/* Action Button */}
                        <div className="pt-4">
                            {mode === AppMode.DUO_INPUT_A ? (
                                <button onClick={finishDuoInputA} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl text-xl shadow-lg transition-all">
                                    Pass to User B <span className="ml-2">→</span>
                                </button>
                            ) : mode === AppMode.DUO_INPUT_B ? (
                                <button onClick={finishDuoInputB} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-2xl text-xl shadow-lg transition-all">
                                    Merge & Ready <span className="ml-2">✨</span>
                                </button>
                            ) : (
                                <button 
                                    onClick={startSpin}
                                    disabled={options.length < 2}
                                    className={`w-full font-black py-5 rounded-2xl text-2xl tracking-widest shadow-lg transform transition-all active:scale-95 ${options.length < 2 ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 text-white shadow-pink-500/20 animate-pulse-scale'}`}
                                >
                                    {isDuoSession ? "SPIN TOGETHER" : "SPIN IT"}
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </>
        )}

      </main>
    </div>
  );
};

export default App;