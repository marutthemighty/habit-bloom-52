import { useHabitStore } from '@/hooks/useHabitStore';
import { HabitCard } from '@/components/habit/HabitCard';
import { AddHabitForm } from '@/components/habit/AddHabitForm';
import { DisruptionToggle } from '@/components/habit/DisruptionToggle';
import { PlantCanvas } from '@/components/habit/PlantCanvas';
import { AISuggestions } from '@/components/habit/AISuggestions';
import { FeedbackForm } from '@/components/habit/FeedbackForm';
import { ExportActions } from '@/components/habit/ExportActions';
import { Leaf } from 'lucide-react';

const Index = () => {
  const {
    habits,
    disruptionMode,
    aiConsentGiven,
    addHabit,
    removeHabit,
    toggleHabitActive,
    toggleTodayCompletion,
    isCompletedToday,
    getStreak,
    toggleDisruptionMode,
    setAIConsent,
    getActiveHabits,
    getOverallHealth,
    exportToCSV,
    clearAllData,
  } = useHabitStore();

  const activeHabits = getActiveHabits();
  const overallHealth = getOverallHealth();
  const totalStreak = habits.reduce((sum, h) => sum + getStreak(h.id), 0);
  const activeCount = habits.filter((h) => h.isActive).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full gradient-forest flex items-center justify-center">
              <Leaf className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">
                HabitGrove
              </h1>
              <p className="text-sm text-muted-foreground">
                Grow habits that last
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Plant Visualization */}
        <PlantCanvas health={overallHealth} totalStreak={totalStreak} />

        {/* Disruption Mode Toggle */}
        <DisruptionToggle
          isActive={disruptionMode}
          onToggle={toggleDisruptionMode}
        />

        {/* Habits Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-semibold text-foreground">
              Your Habits
            </h2>
            <span className="text-sm text-muted-foreground">
              {activeCount}/3 active
            </span>
          </div>

          <div className="space-y-3">
            {habits.length === 0 ? (
              <div className="text-center py-8 px-4 rounded-lg border-2 border-dashed border-border">
                <Leaf className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">
                  No habits planted yet. Start your garden!
                </p>
              </div>
            ) : (
              habits.map((habit) => {
                const isPaused =
                  disruptionMode && habit.category === 'baseline';
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
          habits={habits}
          disruptionMode={disruptionMode}
          aiConsentGiven={aiConsentGiven}
          onConsentChange={setAIConsent}
        />

        {/* Feedback & Export */}
        <div className="space-y-4">
          <FeedbackForm />
          <ExportActions onExport={exportToCSV} onClear={clearAllData} />
        </div>

        {/* Footer */}
        <footer className="text-center py-6 text-sm text-muted-foreground">
          <p>🌱 HabitGrove — Build resilient habits, one day at a time</p>
          <p className="text-xs mt-1">Data stored locally in your browser</p>
        </footer>
      </main>
    </div>
  );
};

export default Index;
