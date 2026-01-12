import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Analytics } from '@/types/habit';
import { useAuth } from './useAuth';
import { useHabits } from './useHabits';
import { useDailyLogs } from './useDailyLogs';
import { useDisruption } from './useDisruption';

const DEFAULT_ANALYTICS: Analytics = {
  averageMood: 0,
  longestStreak: 0,
  currentStreak: 0,
  totalCompletions: 0,
  disruptionCount: 0,
  completionRate: 0,
  streaksByHabit: [],
  moodHistory: [],
};

export const useAnalytics = () => {
  const { user } = useAuth();
  const { habits, completions, getStreak } = useHabits();
  const { logs } = useDailyLogs();
  const { disruptionCount } = useDisruption();
  const [analytics, setAnalytics] = useState<Analytics>(DEFAULT_ANALYTICS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setAnalytics(DEFAULT_ANALYTICS);
      setLoading(false);
      return;
    }

    const calculateAnalytics = () => {
      setLoading(true);

      // Calculate streaks by habit
      const streaksByHabit = habits.map(h => ({
        habitId: h.id,
        habitName: h.name,
        streak: getStreak(h.id),
      }));

      // Calculate longest and current streak
      const allStreaks = streaksByHabit.map(s => s.streak);
      const longestStreak = allStreaks.length > 0 ? Math.max(...allStreaks) : 0;
      const currentStreak = allStreaks.reduce((a, b) => a + b, 0);

      // Calculate total completions
      const totalCompletions = completions.filter(c => c.completed).length;

      // Calculate completion rate (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recentCompletions = completions.filter(c => {
        const date = new Date(c.completed_date);
        return date >= thirtyDaysAgo && c.completed;
      });
      const expectedCompletions = habits.filter(h => h.is_active).length * 30;
      const completionRate = expectedCompletions > 0
        ? recentCompletions.length / expectedCompletions
        : 0;

      // Calculate average mood
      const moodsWithValues = logs.filter(l => l.mood !== null);
      const averageMood = moodsWithValues.length > 0
        ? moodsWithValues.reduce((sum, l) => sum + (l.mood || 0), 0) / moodsWithValues.length
        : 0;

      // Mood history for chart
      const moodHistory = logs
        .filter(l => l.mood !== null)
        .slice(0, 30)
        .map(l => ({
          date: l.log_date,
          mood: l.mood!,
        }))
        .reverse();

      setAnalytics({
        averageMood: Math.round(averageMood * 10) / 10,
        longestStreak,
        currentStreak,
        totalCompletions,
        disruptionCount,
        completionRate: Math.round(completionRate * 100) / 100,
        streaksByHabit,
        moodHistory,
      });

      setLoading(false);
    };

    calculateAnalytics();
  }, [user, habits, completions, logs, getStreak, disruptionCount]);

  const fetchFromEdgeFunction = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('get-analytics');
      if (error) throw error;
      if (data) {
        setAnalytics(prev => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error('Failed to fetch analytics from edge function:', error);
    }
  }, [user]);

  return {
    analytics,
    loading,
    refreshAnalytics: fetchFromEdgeFunction,
  };
};
