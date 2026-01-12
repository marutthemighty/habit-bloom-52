import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DisruptionHistory } from '@/types/habit';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

export const useDisruption = () => {
  const { user } = useAuth();
  const [activeDisruption, setActiveDisruption] = useState<DisruptionHistory | null>(null);
  const [disruptionHistory, setDisruptionHistory] = useState<DisruptionHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setActiveDisruption(null);
      setDisruptionHistory([]);
      setLoading(false);
      return;
    }

    const fetchDisruptions = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('disruption_history')
        .select('*')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false });

      if (error) {
        console.error('Error fetching disruptions:', error);
      } else if (data) {
        setDisruptionHistory(data as DisruptionHistory[]);
        const active = data.find(d => d.ended_at === null);
        setActiveDisruption(active as DisruptionHistory | undefined || null);
      }
      setLoading(false);
    };

    fetchDisruptions();
  }, [user]);

  const startDisruption = useCallback(async (
    disruptionType: string,
    recoveryPlan?: string,
    pausedHabitIds?: string[]
  ) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('disruption_history')
      .insert({
        user_id: user.id,
        disruption_type: disruptionType,
        recovery_plan: recoveryPlan,
        paused_habits: pausedHabitIds || [],
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to start disruption mode');
      return;
    }

    const disruption = data as DisruptionHistory;
    setActiveDisruption(disruption);
    setDisruptionHistory(prev => [disruption, ...prev]);
    toast.info(`🌧️ ${disruptionType} mode activated. Focus on keystone habits.`);
  }, [user]);

  const endDisruption = useCallback(async () => {
    if (!user || !activeDisruption) return;

    const { error } = await supabase
      .from('disruption_history')
      .update({ ended_at: new Date().toISOString() })
      .eq('id', activeDisruption.id);

    if (error) {
      toast.error('Failed to end disruption mode');
      return;
    }

    setActiveDisruption(null);
    setDisruptionHistory(prev =>
      prev.map(d => d.id === activeDisruption.id ? { ...d, ended_at: new Date().toISOString() } : d)
    );
    toast.success('☀️ Welcome back! All habits are active again.');
  }, [user, activeDisruption]);

  const toggleDisruptionMode = useCallback(async () => {
    if (activeDisruption) {
      await endDisruption();
    } else {
      await startDisruption('manual');
    }
  }, [activeDisruption, startDisruption, endDisruption]);

  const dismissBanner = useCallback(() => {
    // Just for UI - doesn't end the disruption
    localStorage.setItem('disruption-banner-dismissed', activeDisruption?.id || '');
  }, [activeDisruption]);

  const isBannerDismissed = useCallback((): boolean => {
    if (!activeDisruption) return true;
    return localStorage.getItem('disruption-banner-dismissed') === activeDisruption.id;
  }, [activeDisruption]);

  return {
    activeDisruption,
    disruptionHistory,
    loading,
    disruptionMode: !!activeDisruption,
    startDisruption,
    endDisruption,
    toggleDisruptionMode,
    dismissBanner,
    isBannerDismissed,
    disruptionCount: disruptionHistory.length,
  };
};
