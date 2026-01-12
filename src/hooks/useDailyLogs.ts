import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DailyLog } from '@/types/habit';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

interface LogEntryResponse {
  log: DailyLog;
  disruption_detected: boolean;
  disruption_type: string | null;
  recovery_plan: string | null;
}

export const useDailyLogs = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [todayLog, setTodayLog] = useState<DailyLog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLogs([]);
      setTodayLog(null);
      setLoading(false);
      return;
    }

    const fetchLogs = async () => {
      setLoading(true);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const { data, error } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('log_date', thirtyDaysAgo)
        .order('log_date', { ascending: false });

      if (error) {
        console.error('Error fetching logs:', error);
      } else if (data) {
        setLogs(data as DailyLog[]);
        const today = new Date().toISOString().split('T')[0];
        const todaysLog = data.find(l => l.log_date === today);
        setTodayLog(todaysLog as DailyLog | undefined || null);
      }
      setLoading(false);
    };

    fetchLogs();
  }, [user]);

  const saveLog = useCallback(async (
    mood: number,
    notes: string,
    logDate?: string
  ): Promise<LogEntryResponse | null> => {
    if (!user) return null;

    const date = logDate || new Date().toISOString().split('T')[0];

    try {
      // Call the log-entry edge function for AI disruption detection
      const { data, error } = await supabase.functions.invoke('log-entry', {
        body: { mood, notes, log_date: date },
      });

      if (error) throw error;

      const response = data as LogEntryResponse;

      // Update local state
      setLogs(prev => {
        const existing = prev.findIndex(l => l.log_date === date);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = response.log;
          return updated;
        }
        return [response.log, ...prev];
      });

      if (date === new Date().toISOString().split('T')[0]) {
        setTodayLog(response.log);
      }

      if (response.disruption_detected) {
        toast.info(`🌧️ ${response.disruption_type} detected. Check your recovery plan!`);
      } else {
        toast.success('Daily log saved! 📝');
      }

      return response;
    } catch (error) {
      console.error('Error saving log:', error);
      
      // Fallback: save directly to database without AI detection
      const { data: directSave, error: dbError } = await supabase
        .from('daily_logs')
        .upsert({
          user_id: user.id,
          log_date: date,
          mood,
          notes,
        }, { onConflict: 'user_id,log_date' })
        .select()
        .single();

      if (dbError) {
        toast.error('Failed to save log');
        return null;
      }

      const savedLog = directSave as DailyLog;
      setLogs(prev => {
        const existing = prev.findIndex(l => l.log_date === date);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = savedLog;
          return updated;
        }
        return [savedLog, ...prev];
      });

      if (date === new Date().toISOString().split('T')[0]) {
        setTodayLog(savedLog);
      }

      toast.success('Daily log saved! 📝');
      return {
        log: savedLog,
        disruption_detected: false,
        disruption_type: null,
        recovery_plan: null,
      };
    }
  }, [user]);

  const getLogForDate = useCallback((date: string): DailyLog | undefined => {
    return logs.find(l => l.log_date === date);
  }, [logs]);

  const getAverageMood = useCallback((days: number = 7): number => {
    const recentLogs = logs.slice(0, days).filter(l => l.mood !== null);
    if (recentLogs.length === 0) return 0;
    return recentLogs.reduce((sum, l) => sum + (l.mood || 0), 0) / recentLogs.length;
  }, [logs]);

  return {
    logs,
    todayLog,
    loading,
    saveLog,
    getLogForDate,
    getAverageMood,
  };
};
