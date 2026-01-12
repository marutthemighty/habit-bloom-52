import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Habit, HabitCompletion, HabitCategory, MAX_ACTIVE_HABITS } from '@/types/habit';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

export const useHabits = () => {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch habits and completions
  useEffect(() => {
    if (!user) {
      setHabits([]);
      setCompletions([]);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      
      const [habitsRes, completionsRes] = await Promise.all([
        supabase
          .from('habits')
          .select('*')
          .eq('user_id', user.id)
          .order('display_order', { ascending: true }),
        supabase
          .from('habit_completions')
          .select('*')
          .eq('user_id', user.id)
          .gte('completed_date', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      ]);

      if (habitsRes.data) setHabits(habitsRes.data as Habit[]);
      if (completionsRes.data) setCompletions(completionsRes.data as HabitCompletion[]);
      setLoading(false);
    };

    fetchData();

    // Real-time subscription for habits
    const habitsChannel = supabase
      .channel('habits-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'habits',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setHabits(prev => [...prev, payload.new as Habit]);
        } else if (payload.eventType === 'UPDATE') {
          setHabits(prev => prev.map(h => h.id === payload.new.id ? payload.new as Habit : h));
        } else if (payload.eventType === 'DELETE') {
          setHabits(prev => prev.filter(h => h.id !== payload.old.id));
        }
      })
      .subscribe();

    // Real-time subscription for completions
    const completionsChannel = supabase
      .channel('completions-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'habit_completions',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setCompletions(prev => [...prev, payload.new as HabitCompletion]);
        } else if (payload.eventType === 'UPDATE') {
          setCompletions(prev => prev.map(c => c.id === payload.new.id ? payload.new as HabitCompletion : c));
        } else if (payload.eventType === 'DELETE') {
          setCompletions(prev => prev.filter(c => c.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(habitsChannel);
      supabase.removeChannel(completionsChannel);
    };
  }, [user]);

  const addHabit = useCallback(async (name: string, category: HabitCategory): Promise<boolean> => {
    if (!user) return false;

    const activeCount = habits.filter(h => h.is_active).length;
    if (activeCount >= MAX_ACTIVE_HABITS) {
      toast.warning(`Maximum ${MAX_ACTIVE_HABITS} active habits allowed. Deactivate one first.`);
      return false;
    }

    const { error } = await supabase.from('habits').insert({
      user_id: user.id,
      name: name.trim(),
      category,
      display_order: habits.length,
    });

    if (error) {
      toast.error('Failed to add habit');
      return false;
    }

    toast.success(`🌱 "${name}" planted!`);
    return true;
  }, [user, habits]);

  const removeHabit = useCallback(async (habitId: string) => {
    const { error } = await supabase.from('habits').delete().eq('id', habitId);

    if (error) {
      toast.error('Failed to remove habit');
      return;
    }

    toast.success('Habit removed');
  }, []);

  const toggleHabitActive = useCallback(async (habitId: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    if (!habit.is_active) {
      const activeCount = habits.filter(h => h.is_active).length;
      if (activeCount >= MAX_ACTIVE_HABITS) {
        toast.warning(`Maximum ${MAX_ACTIVE_HABITS} active habits allowed.`);
        return;
      }
    }

    const { error } = await supabase
      .from('habits')
      .update({ is_active: !habit.is_active })
      .eq('id', habitId);

    if (error) {
      toast.error('Failed to update habit');
    }
  }, [habits]);

  const toggleTodayCompletion = useCallback(async (habitId: string) => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    const existing = completions.find(
      c => c.habit_id === habitId && c.completed_date === today
    );

    if (existing) {
      if (existing.completed) {
        // Mark as not completed (delete the record)
        const { error } = await supabase
          .from('habit_completions')
          .delete()
          .eq('id', existing.id);

        if (error) toast.error('Failed to update completion');
      } else {
        // Mark as completed
        const { error } = await supabase
          .from('habit_completions')
          .update({ completed: true })
          .eq('id', existing.id);

        if (error) toast.error('Failed to update completion');
      }
    } else {
      // Create new completion
      const { error } = await supabase.from('habit_completions').insert({
        habit_id: habitId,
        user_id: user.id,
        completed_date: today,
        completed: true,
      });

      if (error) toast.error('Failed to record completion');
    }
  }, [user, completions]);

  const isCompletedToday = useCallback((habitId: string): boolean => {
    const today = new Date().toISOString().split('T')[0];
    return completions.some(
      c => c.habit_id === habitId && c.completed_date === today && c.completed
    );
  }, [completions]);

  const getStreak = useCallback((habitId: string): number => {
    const habitCompletions = completions
      .filter(c => c.habit_id === habitId && c.completed)
      .map(c => c.completed_date)
      .sort()
      .reverse();

    if (habitCompletions.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateKey = checkDate.toISOString().split('T')[0];

      if (habitCompletions.includes(dateKey)) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    return streak;
  }, [completions]);

  const pauseHabit = useCallback(async (habitId: string, reason: string) => {
    const { error } = await supabase
      .from('habits')
      .update({ is_active: false, pause_reason: reason })
      .eq('id', habitId);

    if (error) {
      toast.error('Failed to pause habit');
    }
  }, []);

  const getActiveHabits = useCallback((disruptionMode: boolean): Habit[] => {
    return habits.filter(h => {
      if (!h.is_active) return false;
      if (disruptionMode && h.category === 'baseline') return false;
      return true;
    });
  }, [habits]);

  const getOverallHealth = useCallback((disruptionMode: boolean): number => {
    const activeHabits = getActiveHabits(disruptionMode);
    if (activeHabits.length === 0) return 50;

    const today = new Date().toISOString().split('T')[0];
    const completedToday = activeHabits.filter(h =>
      completions.some(
        c => c.habit_id === h.id && c.completed_date === today && c.completed
      )
    ).length;

    const streaks = activeHabits.map(h => getStreak(h.id));
    const avgStreak = streaks.reduce((a, b) => a + b, 0) / streaks.length;

    const todayScore = (completedToday / activeHabits.length) * 50;
    const streakScore = Math.min(avgStreak * 5, 50);

    return Math.round(todayScore + streakScore);
  }, [getActiveHabits, completions, getStreak]);

  const getTotalStreak = useCallback((): number => {
    return habits.reduce((sum, h) => sum + getStreak(h.id), 0);
  }, [habits, getStreak]);

  return {
    habits,
    completions,
    loading,
    addHabit,
    removeHabit,
    toggleHabitActive,
    toggleTodayCompletion,
    isCompletedToday,
    getStreak,
    pauseHabit,
    getActiveHabits,
    getOverallHealth,
    getTotalStreak,
    activeCount: habits.filter(h => h.is_active).length,
  };
};
