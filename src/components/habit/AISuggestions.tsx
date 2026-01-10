import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Sparkles, Loader2, AlertCircle, Lightbulb } from 'lucide-react';
import { Habit } from '@/types/habit';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AISuggestionsProps {
  habits: Habit[];
  disruptionMode: boolean;
  aiConsentGiven: boolean;
  onConsentChange: (consent: boolean) => void;
}

interface SuggestionResponse {
  suggestion: string;
  tips: string[];
}

const FALLBACK_TIPS = [
  "Stack your new habit after an existing one (e.g., 'After I brush my teeth, I will meditate for 2 minutes')",
  "Start incredibly small - 2 minutes is better than zero",
  "During disruptions, keep only your keystone habits active",
  "Environment design: Make good habits obvious and easy",
  "Track progress visually to stay motivated",
];

export const AISuggestions = ({
  habits,
  disruptionMode,
  aiConsentGiven,
  onConsentChange,
}: AISuggestionsProps) => {
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const habitSummary = habits
        .map((h) => `${h.name} (${h.category})`)
        .join(', ');

      const { data, error: fnError } = await supabase.functions.invoke('habit-suggestions', {
        body: {
          habits: habitSummary,
          disruptionMode,
          habitCount: habits.length,
        },
      });

      if (fnError) throw fnError;

      setSuggestions(data as SuggestionResponse);
    } catch (err) {
      console.error('AI suggestion error:', err);
      setError('Could not get AI suggestions. Here are some general tips instead.');
      setSuggestions({
        suggestion: 'Focus on consistency over intensity.',
        tips: FALLBACK_TIPS,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetSuggestions = () => {
    if (!aiConsentGiven) {
      setShowConsentModal(true);
    } else {
      fetchSuggestions();
    }
  };

  const handleConsent = () => {
    onConsentChange(true);
    setShowConsentModal(false);
    toast.success('AI suggestions enabled!');
    fetchSuggestions();
  };

  if (habits.length === 0) {
    return null;
  }

  return (
    <>
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            <h3 className="font-semibold text-foreground">AI Insights</h3>
          </div>
          <Button
            onClick={handleGetSuggestions}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Thinking...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Get Suggestions
              </>
            )}
          </Button>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm mb-3">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {suggestions && (
          <div className="space-y-3">
            <p className="text-foreground">{suggestions.suggestion}</p>
            <div className="space-y-2">
              {suggestions.tips.map((tip, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0 text-accent" />
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!suggestions && !isLoading && (
          <p className="text-sm text-muted-foreground">
            Get personalized stacking strategies based on your habits
            {disruptionMode && ' and current disruption mode'}.
          </p>
        )}
      </Card>

      {/* Consent Modal */}
      <Dialog open={showConsentModal} onOpenChange={setShowConsentModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" />
              Enable AI Suggestions
            </DialogTitle>
            <DialogDescription className="text-left space-y-3 pt-2">
              <p>
                HabitGrove can use AI to analyze your habits and provide
                personalized stacking strategies.
              </p>
              <p className="font-medium">What we send to our AI:</p>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Your habit names and categories</li>
                <li>Whether disruption mode is active</li>
              </ul>
              <p className="text-xs">
                Your data is processed securely and not stored beyond the request.
                You can disable this anytime.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowConsentModal(false)}>
              No Thanks
            </Button>
            <Button onClick={handleConsent} className="gradient-forest text-primary-foreground">
              Enable AI Suggestions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
