import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DisruptionHistory } from '@/types/habit';
import { CloudRain, Pause, X, ArrowRight } from 'lucide-react';

interface DisruptionBannerProps {
  disruption: DisruptionHistory;
  onPauseBaseline: () => void;
  onKeepGoing: () => void;
  onDismiss: () => void;
}

const DISRUPTION_LABELS: Record<string, { emoji: string; label: string }> = {
  travel: { emoji: '✈️', label: 'Travel mode' },
  stress: { emoji: '😰', label: 'Stress detected' },
  fatigue: { emoji: '😴', label: 'Fatigue detected' },
  illness: { emoji: '🤒', label: 'Recovery mode' },
  manual: { emoji: '🌧️', label: 'Disruption mode' },
};

export const DisruptionBanner = ({
  disruption,
  onPauseBaseline,
  onKeepGoing,
  onDismiss,
}: DisruptionBannerProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const typeInfo = DISRUPTION_LABELS[disruption.disruption_type] || DISRUPTION_LABELS.manual;

  if (!isExpanded) {
    return (
      <Card
        onClick={() => setIsExpanded(true)}
        className="p-3 bg-accent/10 border-accent/30 cursor-pointer hover:bg-accent/20 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm">
          <CloudRain className="w-4 h-4 text-accent" />
          <span className="text-foreground font-medium">{typeInfo.emoji} {typeInfo.label} active</span>
          <ArrowRight className="w-3 h-3 ml-auto text-muted-foreground" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-accent/10 border-accent/30 relative">
      <button
        onClick={onDismiss}
        className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-background/50"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
          <CloudRain className="w-5 h-5 text-accent-foreground" />
        </div>

        <div className="flex-1 pr-6">
          <h3 className="font-semibold text-foreground">
            {typeInfo.emoji} {typeInfo.label}
          </h3>
          
          {disruption.recovery_plan ? (
            <p className="text-sm text-muted-foreground mt-1">
              {disruption.recovery_plan}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground mt-1">
              Focus on your keystone habits. Baseline habits can wait until you're ready.
            </p>
          )}

          <div className="flex flex-wrap gap-2 mt-3">
            <Button
              size="sm"
              onClick={onPauseBaseline}
              className="gradient-forest text-primary-foreground"
            >
              <Pause className="w-3 h-3 mr-1" />
              Pause Baseline Habits
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onKeepGoing}
            >
              Keep Going
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
