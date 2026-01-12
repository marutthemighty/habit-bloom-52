import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PlantType } from '@/types/habit';
import { Flower2, Carrot, TreeDeciduous, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingModalProps {
  open: boolean;
  onComplete: (plantType: PlantType) => void;
}

const PLANT_OPTIONS: { type: PlantType; icon: React.ReactNode; title: string; description: string; emoji: string }[] = [
  {
    type: 'flower',
    icon: <Flower2 className="w-8 h-8" />,
    title: 'Flower',
    description: 'Quick blooms, visible progress. Perfect for motivation lovers who want to see immediate results.',
    emoji: '🌸',
  },
  {
    type: 'vegetable',
    icon: <Carrot className="w-8 h-8" />,
    title: 'Vegetable',
    description: 'Practical growth, steady rewards. Great for those who value consistency and tangible outcomes.',
    emoji: '🥕',
  },
  {
    type: 'fruit_tree',
    icon: <TreeDeciduous className="w-8 h-8" />,
    title: 'Fruit Tree',
    description: 'Long-term investment, big payoff. Ideal for patient growers building lasting habits.',
    emoji: '🍎',
  },
];

export const OnboardingModal = ({ open, onComplete }: OnboardingModalProps) => {
  const [selectedType, setSelectedType] = useState<PlantType | null>(null);

  const handleComplete = () => {
    if (selectedType) {
      onComplete(selectedType);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-lg" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-center">
            Choose Your Garden Companion 🌱
          </DialogTitle>
          <DialogDescription className="text-center">
            Your plant will grow as you build habits. Each type has its own personality!
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-4">
          {PLANT_OPTIONS.map((option) => (
            <Card
              key={option.type}
              onClick={() => setSelectedType(option.type)}
              className={cn(
                'p-4 cursor-pointer transition-all duration-200 hover:shadow-medium',
                selectedType === option.type
                  ? 'border-primary border-2 bg-primary/5'
                  : 'border-border hover:border-primary/50'
              )}
            >
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    'w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 transition-colors',
                    selectedType === option.type
                      ? 'gradient-forest text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {option.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      {option.emoji} {option.title}
                    </h3>
                    {selectedType === option.type && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {option.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Button
          onClick={handleComplete}
          disabled={!selectedType}
          className="w-full gradient-forest text-primary-foreground"
          size="lg"
        >
          Start Growing
        </Button>
      </DialogContent>
    </Dialog>
  );
};
