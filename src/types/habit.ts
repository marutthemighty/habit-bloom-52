export type HabitCategory = 'keystone' | 'baseline';

export interface Habit {
  id: string;
  name: string;
  category: HabitCategory;
  createdAt: string;
  isActive: boolean;
  order: number;
}

export interface DayRecord {
  date: string; // YYYY-MM-DD
  habitId: string;
  completed: boolean;
}

export interface Routine {
  id: string;
  name: string;
  habitIds: string[];
  timeOfDay: 'morning' | 'evening' | 'anytime';
}

export interface HabitStore {
  habits: Habit[];
  dayRecords: DayRecord[];
  routines: Routine[];
  disruptionMode: boolean;
  aiConsentGiven: boolean;
  lastUpdated: string;
}

export interface PlantState {
  stage: 'seed' | 'sprout' | 'small' | 'medium' | 'flourishing';
  health: number; // 0-100
  daysWilting: number;
}

export interface AISuggestion {
  suggestion: string;
  tips: string[];
}

export const STORAGE_KEY = 'habitgrove-data';

export const DEFAULT_STORE: HabitStore = {
  habits: [],
  dayRecords: [],
  routines: [],
  disruptionMode: false,
  aiConsentGiven: false,
  lastUpdated: new Date().toISOString(),
};

export const MAX_ACTIVE_HABITS = 3;
