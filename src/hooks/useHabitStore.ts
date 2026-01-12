import { useState, useEffect, useCallback } from 'react';
import {
  HabitStore,
  LegacyHabit,
  DayRecord,
  Routine,
  STORAGE_KEY,
  DEFAULT_STORE,
  MAX_ACTIVE_HABITS,
  HabitCategory,
} from '@/types/habit';
import { toast } from 'sonner';

const isStorageAvailable = (): boolean => {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
};

const loadFromStorage = (): HabitStore => {
  if (!isStorageAvailable()) {
    console.warn('localStorage not available');
    return DEFAULT_STORE;
  }
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data) as HabitStore;
    }
  } catch (e) {
    console.error('Failed to load habit data:', e);
  }
  return DEFAULT_STORE;
};

const saveToStorage = (store: HabitStore): void => {
  if (!isStorageAvailable()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (e) {
    console.error('Failed to save habit data:', e);
    toast.error('Failed to save data. Storage may be full.');
  }
};

export const useHabitStore = () => {
  const [store, setStore] = useState<HabitStore>(loadFromStorage);

  useEffect(() => {
    saveToStorage(store);
  }, [store]);

  const updateStore = useCallback((updates: Partial<HabitStore>) => {
    setStore((prev) => ({
      ...prev,
      ...updates,
      lastUpdated: new Date().toISOString(),
    }));
  }, []);

  // Habit CRUD
  const addHabit = useCallback(
    (name: string, category: HabitCategory): boolean => {
      const activeCount = store.habits.filter((h) => h.isActive).length;
      if (activeCount >= MAX_ACTIVE_HABITS) {
        toast.warning(`Maximum ${MAX_ACTIVE_HABITS} active habits allowed. Deactivate one first.`);
        return false;
      }

      const newHabit: LegacyHabit = {
        id: crypto.randomUUID(),
        name: name.trim(),
        category,
        createdAt: new Date().toISOString(),
        isActive: true,
        order: store.habits.length,
      };

      updateStore({ habits: [...store.habits, newHabit] });
      toast.success(`🌱 "${name}" planted!`);
      return true;
    },
    [store.habits, updateStore]
  );

  const removeHabit = useCallback(
    (habitId: string) => {
      updateStore({
        habits: store.habits.filter((h) => h.id !== habitId),
        dayRecords: store.dayRecords.filter((r) => r.habitId !== habitId),
        routines: store.routines.map((r) => ({
          ...r,
          habitIds: r.habitIds.filter((id) => id !== habitId),
        })),
      });
      toast.success('Habit removed');
    },
    [store.habits, store.dayRecords, store.routines, updateStore]
  );

  const toggleHabitActive = useCallback(
    (habitId: string) => {
      const habit = store.habits.find((h) => h.id === habitId);
      if (!habit) return;

      if (!habit.isActive) {
        const activeCount = store.habits.filter((h) => h.isActive).length;
        if (activeCount >= MAX_ACTIVE_HABITS) {
          toast.warning(`Maximum ${MAX_ACTIVE_HABITS} active habits allowed.`);
          return;
        }
      }

      updateStore({
        habits: store.habits.map((h) =>
          h.id === habitId ? { ...h, isActive: !h.isActive } : h
        ),
      });
    },
    [store.habits, updateStore]
  );

  // Day records
  const getTodayKey = () => new Date().toISOString().split('T')[0];

  const toggleTodayCompletion = useCallback(
    (habitId: string) => {
      const today = getTodayKey();
      const existing = store.dayRecords.find(
        (r) => r.habitId === habitId && r.date === today
      );

      if (existing) {
        updateStore({
          dayRecords: store.dayRecords.map((r) =>
            r.habitId === habitId && r.date === today
              ? { ...r, completed: !r.completed }
              : r
          ),
        });
      } else {
        updateStore({
          dayRecords: [...store.dayRecords, { date: today, habitId, completed: true }],
        });
      }
    },
    [store.dayRecords, updateStore]
  );

  const isCompletedToday = useCallback(
    (habitId: string): boolean => {
      const today = getTodayKey();
      return store.dayRecords.some(
        (r) => r.habitId === habitId && r.date === today && r.completed
      );
    },
    [store.dayRecords]
  );

  const getStreak = useCallback(
    (habitId: string): number => {
      const records = store.dayRecords
        .filter((r) => r.habitId === habitId && r.completed)
        .map((r) => r.date)
        .sort()
        .reverse();

      if (records.length === 0) return 0;

      let streak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let i = 0; i < 365; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);
        const dateKey = checkDate.toISOString().split('T')[0];

        if (records.includes(dateKey)) {
          streak++;
        } else if (i > 0) {
          break;
        }
      }

      return streak;
    },
    [store.dayRecords]
  );

  // Routines
  const addRoutine = useCallback(
    (name: string, timeOfDay: Routine['timeOfDay'], habitIds: string[]) => {
      const newRoutine: Routine = {
        id: crypto.randomUUID(),
        name: name.trim(),
        timeOfDay,
        habitIds,
      };
      updateStore({ routines: [...store.routines, newRoutine] });
      toast.success(`Routine "${name}" created!`);
    },
    [store.routines, updateStore]
  );

  const removeRoutine = useCallback(
    (routineId: string) => {
      updateStore({
        routines: store.routines.filter((r) => r.id !== routineId),
      });
    },
    [store.routines, updateStore]
  );

  const updateRoutineHabits = useCallback(
    (routineId: string, habitIds: string[]) => {
      updateStore({
        routines: store.routines.map((r) =>
          r.id === routineId ? { ...r, habitIds } : r
        ),
      });
    },
    [store.routines, updateStore]
  );

  // Disruption mode
  const toggleDisruptionMode = useCallback(() => {
    const newMode = !store.disruptionMode;
    updateStore({ disruptionMode: newMode });
    if (newMode) {
      toast.info('🌧️ Disruption mode enabled. Baseline habits paused.');
    } else {
      toast.success('☀️ Back to normal! All habits active.');
    }
  }, [store.disruptionMode, updateStore]);

  // AI consent
  const setAIConsent = useCallback(
    (consent: boolean) => {
      updateStore({ aiConsentGiven: consent });
    },
    [updateStore]
  );

  // Get active habits (considering disruption mode)
  const getActiveHabits = useCallback((): LegacyHabit[] => {
    return store.habits.filter((h) => {
      if (!h.isActive) return false;
      if (store.disruptionMode && h.category === 'baseline') return false;
      return true;
    });
  }, [store.habits, store.disruptionMode]);

  // Calculate overall progress for plant
  const getOverallHealth = useCallback((): number => {
    const activeHabits = getActiveHabits();
    if (activeHabits.length === 0) return 50;

    const today = getTodayKey();
    const completedToday = activeHabits.filter((h) =>
      store.dayRecords.some(
        (r) => r.habitId === h.id && r.date === today && r.completed
      )
    ).length;

    const streaks = activeHabits.map((h) => getStreak(h.id));
    const avgStreak = streaks.reduce((a, b) => a + b, 0) / streaks.length;

    const todayScore = (completedToday / activeHabits.length) * 50;
    const streakScore = Math.min(avgStreak * 5, 50);

    return Math.round(todayScore + streakScore);
  }, [getActiveHabits, store.dayRecords, getStreak]);

  // Export to CSV
  const exportToCSV = useCallback(() => {
    const headers = ['Habit Name', 'Category', 'Date', 'Completed', 'Streak'];
    const rows: string[][] = [];

    store.habits.forEach((habit) => {
      const streak = getStreak(habit.id);
      const records = store.dayRecords.filter((r) => r.habitId === habit.id);

      if (records.length === 0) {
        rows.push([habit.name, habit.category, 'No records', '-', String(streak)]);
      } else {
        records.forEach((record) => {
          rows.push([
            habit.name,
            habit.category,
            record.date,
            record.completed ? 'Yes' : 'No',
            String(streak),
          ]);
        });
      }
    });

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `habitgrove-export-${getTodayKey()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Data exported to CSV!');
  }, [store.habits, store.dayRecords, getStreak]);

  // Clear all data
  const clearAllData = useCallback(() => {
    setStore(DEFAULT_STORE);
    toast.success('All data cleared');
  }, []);

  return {
    store,
    habits: store.habits,
    routines: store.routines,
    disruptionMode: store.disruptionMode,
    aiConsentGiven: store.aiConsentGiven,
    addHabit,
    removeHabit,
    toggleHabitActive,
    toggleTodayCompletion,
    isCompletedToday,
    getStreak,
    addRoutine,
    removeRoutine,
    updateRoutineHabits,
    toggleDisruptionMode,
    setAIConsent,
    getActiveHabits,
    getOverallHealth,
    exportToCSV,
    clearAllData,
  };
};
