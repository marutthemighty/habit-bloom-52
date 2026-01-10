import { Habit } from '@/types/habit';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Trash2, Pause, Play, Leaf, Anchor } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HabitCardProps {
  habit: Habit;
  streak: number;
  isCompleted: boolean;
  isPaused: boolean;
  onToggleComplete: () => void;
  onToggleActive: () => void;
  onRemove: () => void;
}

export const HabitCard = ({
  habit,
  streak,
  isCompleted,
  isPaused,
  onToggleComplete,
  onToggleActive,
  onRemove,
}: HabitCardProps) => {
  const isKeystone = habit.category === 'keystone';

  return (
    <Card
      className={cn(
        'p-4 transition-all duration-300 border-2',
        isPaused && 'opacity-60 grayscale',
        isCompleted && 'ring-2 ring-primary/30 bg-primary/5',
        !isPaused && 'hover:shadow-medium'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <button
            onClick={onToggleComplete}
            disabled={isPaused}
            className={cn(
              'mt-0.5 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all',
              isCompleted
                ? 'bg-primary border-primary text-primary-foreground'
                : 'border-muted-foreground/30 hover:border-primary/50',
              isPaused && 'cursor-not-allowed'
            )}
          >
            {isCompleted && <Check className="w-4 h-4" />}
          </button>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3
                className={cn(
                  'font-semibold text-foreground',
                  isCompleted && 'line-through opacity-70'
                )}
              >
                {habit.name}
              </h3>
              <Badge
                variant={isKeystone ? 'default' : 'secondary'}
                className={cn(
                  'text-xs',
                  isKeystone && 'gradient-forest text-primary-foreground'
                )}
              >
                {isKeystone ? (
                  <>
                    <Anchor className="w-3 h-3 mr-1" />
                    Keystone
                  </>
                ) : (
                  <>
                    <Leaf className="w-3 h-3 mr-1" />
                    Baseline
                  </>
                )}
              </Badge>
            </div>

            {streak > 0 && (
              <p className="text-sm text-muted-foreground">
                🔥 {streak} day{streak !== 1 ? 's' : ''} streak
              </p>
            )}
            {isPaused && (
              <p className="text-sm text-muted-foreground italic">
                Paused during disruption
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleActive}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            {habit.isActive ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
