import { STORAGE_KEYS } from '../constants';
import { UserProfile, SavedWheel, HistoryEntry } from '../types';

export const getProfile = (): UserProfile | null => {
  const stored = localStorage.getItem(STORAGE_KEYS.PROFILE);
  return stored ? JSON.parse(stored) : null;
};

export const saveProfile = (profile: UserProfile): void => {
  localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
};

export const getSavedWheels = (): SavedWheel[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.SAVED_WHEELS);
  return stored ? JSON.parse(stored) : [];
};

export const saveWheel = (wheel: SavedWheel): SavedWheel[] => {
  const wheels = getSavedWheels();
  const updated = [wheel, ...wheels];
  localStorage.setItem(STORAGE_KEYS.SAVED_WHEELS, JSON.stringify(updated));
  return updated;
};

export const deleteSavedWheel = (id: string): SavedWheel[] => {
  const wheels = getSavedWheels().filter(w => w.id !== id);
  localStorage.setItem(STORAGE_KEYS.SAVED_WHEELS, JSON.stringify(wheels));
  return wheels;
};

export const getHistory = (): HistoryEntry[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.HISTORY);
  return stored ? JSON.parse(stored) : [];
};

export const addToHistory = (entry: HistoryEntry): HistoryEntry[] => {
  const history = getHistory();
  // Keep last 50 entries
  const updated = [entry, ...history].slice(0, 50);
  localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
  return updated;
};

export const clearHistory = (): void => {
  localStorage.removeItem(STORAGE_KEYS.HISTORY);
};