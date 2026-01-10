import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { CloudRain, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DisruptionToggleProps {
  isActive: boolean;
  onToggle: () => void;
}

export const DisruptionToggle = ({ isActive, onToggle }: DisruptionToggleProps) => {
  return (
    <Card
      className={cn(
        'p-4 transition-all duration-500',
        isActive && 'bg-muted/50 border-muted-foreground/20'
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500',
              isActive
                ? 'bg-muted-foreground/20 text-muted-foreground'
                : 'bg-accent/20 text-accent-foreground'
            )}
          >
            {isActive ? (
              <CloudRain className="w-5 h-5 animate-pulse" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </div>
          <div>
            <Label
              htmlFor="disruption-mode"
              className="text-base font-semibold cursor-pointer"
            >
              Disruption Mode
            </Label>
            <p className="text-sm text-muted-foreground">
              {isActive
                ? 'Active — Baseline habits paused'
                : 'Travel, stress, or life changes?'}
            </p>
          </div>
        </div>

        <Switch
          id="disruption-mode"
          checked={isActive}
          onCheckedChange={onToggle}
        />
      </div>
    </Card>
  );
};
