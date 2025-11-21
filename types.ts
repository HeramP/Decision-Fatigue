export interface Option {
  id: string;
  text: string;
  color: string;
}

export enum AppMode {
  SOLO = 'SOLO',
  DUO_SETUP = 'DUO_SETUP',
  DUO_INPUT_A = 'DUO_INPUT_A',
  DUO_INPUT_B = 'DUO_INPUT_B',
  SPINNING = 'SPINNING',
  LOCKED = 'LOCKED',
  PROFILE = 'PROFILE'
}

export interface LockedState {
  winner: Option;
  unlockTime: number;
}

export interface SavedWheel {
  id: string;
  name: string;
  options: Option[];
  createdAt: number;
}

export interface HistoryEntry {
  id: string;
  winner: Option;
  timestamp: number;
}

export interface UserProfile {
  name: string;
}