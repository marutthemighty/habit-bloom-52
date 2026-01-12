import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useHabits } from '@/hooks/useHabits';
import { useDailyLogs } from '@/hooks/useDailyLogs';
import { useDisruption } from '@/hooks/useDisruption';
import { useAnalytics } from '@/hooks/useAnalytics';
import { HabitCard } from '@/components/habit/HabitCard';
import { AddHabitForm } from '@/components/habit/AddHabitForm';
import { DisruptionToggle } from '@/components/habit/DisruptionToggle';
import { PlantCanvas } from '@/components/habit/PlantCanvas';
import { AISuggestions } from '@/components/habit/AISuggestions';
import { OnboardingModal } from '@/components/habit/OnboardingModal';
import { DailyLogModal } from '@/components/habit/DailyLogModal';
import { DisruptionBanner } from '@/components/habit/DisruptionBanner';
import { AnalyticsTab } from '@/components/habit/AnalyticsTab';
import { ExportActions } from '@/components/habit/ExportActions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Leaf, LogOut, BookOpen, BarChart3, Loader2 } from 'lucide-react';
import { PlantType, Habit } from '@/types/habit';

const Index = () => {
  const { user, signOut } = useAuth();
  const { profile, needsOnboarding, updatePlantType, completeOnboarding, loading: profileLoading } = useProfile();
  const { habits, loading: habitsLoading, addHabit, removeHabit, toggleHabitActive, toggleTodayCompletion, isCompletedToday, getStreak, getActiveHabits, getOverallHealth, getTotalStreak, activeCount } = useHabits();
  const { todayLog, saveLog } = useDailyLogs();
  const { activeDisruption, disruptionMode, toggleDisruptionMode, dismissBanner, isBannerDismissed } = useDisruption();
  const { analytics, loading: analyticsLoading, refreshAnalytics } = useAnalytics();

  const [showLogModal, setShowLogModal] = useState(false);
  const [aiConsentGiven, setAIConsentGiven] = useState(false);

  const handleOnboardingComplete = async (plantType: PlantType) => {
    await updatePlantType(plantType);
    await completeOnboarding();
  };

  const handleLogSave = async (mood: number, notes: string) => {
    await saveLog(mood, notes);
  };

  const handleExport = () => {
    const headers = ['Habit Name', 'Category', 'Streak'];
    const rows = habits.map(h => [h.name, h.category, getStreak(h.id).toString()]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `habitgrove-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeHabits = getActiveHabits(disruptionMode);
  const overallHealth = getOverallHealth(disruptionMode);
  const totalStreak = getTotalStreak();

  if (profileLoading || habitsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Onboarding Modal */}
      <OnboardingModal open={!!needsOnboarding} onComplete={handleOnboardingComplete} />

      {/* Daily Log Modal */}
      <DailyLogModal
        open={showLogModal}
        onOpenChange={setShowLogModal}
        onSave={handleLogSave}
        existingMood={todayLog?.mood ?? undefined}
        existingNotes={todayLog?.notes ?? undefined}
      />

      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full gradient-forest flex items-center justify-center">
                <Leaf className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-foreground">HabitGrove</h1>
                <p className="text-sm text-muted-foreground">Grow habits that last</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowLogModal(true)}>
                <BookOpen className="w-4 h-4 mr-1" />
                Log
              </Button>
              <Button variant="ghost" size="icon" onClick={signOut}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Disruption Banner */}
        {activeDisruption && !isBannerDismissed() && (
          <DisruptionBanner
            disruption={activeDisruption}
            onPauseBaseline={toggleDisruptionMode}
            onKeepGoing={dismissBanner}
            onDismiss={dismissBanner}
          />
        )}

        {/* Plant Visualization */}
        <PlantCanvas health={overallHealth} totalStreak={totalStreak} plantType={profile?.plant_type} />

        {/* Tabs */}
        <Tabs defaultValue="habits" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="habits">
              <Leaf className="w-4 h-4 mr-2" />
              Habits
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="habits" className="space-y-6 mt-6">
            {/* Disruption Mode Toggle */}
            <DisruptionToggle isActive={disruptionMode} onToggle={toggleDisruptionMode} />

            {/* Habits Section */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-xl font-semibold text-foreground">Your Habits</h2>
                <span className="text-sm text-muted-foreground">{activeCount}/3 active</span>
              </div>

              <div className="space-y-3">
                {habits.length === 0 ? (
                  <div className="text-center py-8 px-4 rounded-lg border-2 border-dashed border-border">
                    <Leaf className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">No habits planted yet. Start your garden!</p>
                  </div>
                ) : (
                  habits.map((habit) => {
                    const isPaused = disruptionMode && habit.category === 'baseline';
                    return (
                      <HabitCard
                        key={habit.id}
                        habit={habit}
                        streak={getStreak(habit.id)}
                        isCompleted={isCompletedToday(habit.id)}
                        isPaused={isPaused}
                        onToggleComplete={() => toggleTodayCompletion(habit.id)}
                        onToggleActive={() => toggleHabitActive(habit.id)}
                        onRemove={() => removeHabit(habit.id)}
                      />
                    );
                  })
                )}

                <AddHabitForm onAdd={addHabit} currentCount={activeCount} />
              </div>
            </section>

            {/* AI Suggestions */}
            <AISuggestions
              habits={habits as any}
              disruptionMode={disruptionMode}
              aiConsentGiven={aiConsentGiven}
              onConsentChange={setAIConsentGiven}
            />

            {/* Export */}
            <ExportActions onExport={handleExport} onClear={() => {}} />
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <AnalyticsTab analytics={analytics} loading={analyticsLoading} onRefresh={refreshAnalytics} />
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <footer className="text-center py-6 text-sm text-muted-foreground">
          <p>🌱 HabitGrove — Build resilient habits, one day at a time</p>
          <p className="text-xs mt-1">Logged in as {user?.email}</p>
        </footer>
      </main>
    </div>
  );
};

export default Index;
