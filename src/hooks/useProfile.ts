import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Profile, PlantType } from '@/types/habit';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        // Profile might not exist yet (created by trigger)
        if (error.code === 'PGRST116') {
          // Create profile manually if trigger hasn't run
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({ id: user.id })
            .select()
            .single();
          
          if (!insertError && newProfile) {
            setProfile(newProfile as Profile);
          }
        }
      } else if (data) {
        setProfile(data as Profile);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [user]);

  const updatePlantType = useCallback(async (plantType: PlantType) => {
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({ plant_type: plantType })
      .eq('id', user.id);

    if (error) {
      toast.error('Failed to update plant type');
      return;
    }

    setProfile(prev => prev ? { ...prev, plant_type: plantType } : null);
    toast.success('Plant type updated! 🌱');
  }, [user]);

  const completeOnboarding = useCallback(async () => {
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({ onboarding_completed: true })
      .eq('id', user.id);

    if (error) {
      toast.error('Failed to complete onboarding');
      return;
    }

    setProfile(prev => prev ? { ...prev, onboarding_completed: true } : null);
  }, [user]);

  const updateNotificationSettings = useCallback(async (enabled: boolean, time?: string) => {
    if (!user) return;

    const updates: Partial<Profile> = { notification_enabled: enabled };
    if (time) updates.notification_time = time;

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (error) {
      toast.error('Failed to update notification settings');
      return;
    }

    setProfile(prev => prev ? { ...prev, ...updates } : null);
    toast.success(enabled ? 'Notifications enabled! ⏰' : 'Notifications disabled');
  }, [user]);

  return {
    profile,
    loading,
    updatePlantType,
    completeOnboarding,
    updateNotificationSettings,
    needsOnboarding: profile && !profile.onboarding_completed,
  };
};
