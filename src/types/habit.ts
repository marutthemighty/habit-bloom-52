export type HabitCategory = 'keystone' | 'baseline';
export type PlantType = 'flower' | 'vegetable' | 'fruit_tree';

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  category: HabitCategory;
  is_active: boolean;
  pause_reason: string | null;
  display_order: number;
  created_at: string;
}

export interface HabitCompletion {
  id: string;
  habit_id: string;
  user_id: string;
  completed_date: string;
  completed: boolean;
  created_at: string;
}

export interface DailyLog {
  id: string;
  user_id: string;
  log_date: string;
  mood: number | null;
  notes: string | null;
  disruption_type: string | null;
  disruption_detected_at: string | null;
  recovery_plan: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  plant_type: PlantType;
  onboarding_completed: boolean;
  notification_enabled: boolean;
  notification_time: string;
  created_at: string;
  updated_at: string;
}

export interface DisruptionHistory {
  id: string;
  user_id: string;
  disruption_type: string;
  started_at: string;
  ended_at: string | null;
  recovery_plan: string | null;
  paused_habits: string[];
  created_at: string;
}

export interface Analytics {
  averageMood: number;
  longestStreak: number;
  currentStreak: number;
  totalCompletions: number;
  disruptionCount: number;
  completionRate: number;
  streaksByHabit: { habitId: string; habitName: string; streak: number }[];
  moodHistory: { date: string; mood: number }[];
}

// Legacy types for localStorage fallback
export interface DayRecord {
  date: string;
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
  habits: LegacyHabit[];
  dayRecords: DayRecord[];
  routines: Routine[];
  disruptionMode: boolean;
  aiConsentGiven: boolean;
  lastUpdated: string;
}

export interface LegacyHabit {
  id: string;
  name: string;
  category: HabitCategory;
  createdAt: string;
  isActive: boolean;
  order: number;
}

export interface PlantState {
  stage: 'seed' | 'sprout' | 'small' | 'medium' | 'flourishing';
  health: number;
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
