import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DailyLogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (mood: number, notes: string) => Promise<void>;
  existingMood?: number;
  existingNotes?: string;
}

const MOOD_OPTIONS = [
  { value: 1, emoji: '😢', label: 'Rough' },
  { value: 2, emoji: '😕', label: 'Meh' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '😊', label: 'Great' },
];

export const DailyLogModal = ({
  open,
  onOpenChange,
  onSave,
  existingMood,
  existingNotes,
}: DailyLogModalProps) => {
  const [mood, setMood] = useState<number>(existingMood || 3);
  const [notes, setNotes] = useState(existingNotes || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onSave(mood, notes);
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Daily Check-in 📝</DialogTitle>
          <DialogDescription>
            How are you feeling today? This helps us understand your journey.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Mood Selector */}
          <div className="space-y-3">
            <Label>How's your vibe?</Label>
            <div className="flex justify-between gap-2">
              {MOOD_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setMood(option.value)}
                  className={cn(
                    'flex flex-col items-center gap-1 p-3 rounded-lg transition-all flex-1',
                    mood === option.value
                      ? 'bg-primary/10 border-2 border-primary scale-105'
                      : 'bg-muted hover:bg-muted/80 border-2 border-transparent'
                  )}
                >
                  <span className="text-2xl">{option.emoji}</span>
                  <span className="text-xs text-muted-foreground">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Anything on your mind? Traveling, stressed, celebrating..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              💡 Our AI can detect disruptions from your notes and suggest recovery plans
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="gradient-forest text-primary-foreground"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Check-in'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
