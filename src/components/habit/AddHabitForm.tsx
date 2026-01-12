import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card } from '@/components/ui/card';
import { HabitCategory, MAX_ACTIVE_HABITS } from '@/types/habit';
import { Plus, Leaf, Anchor, Loader2 } from 'lucide-react';

interface AddHabitFormProps {
  onAdd: (name: string, category: HabitCategory) => boolean | Promise<boolean>;
  currentCount: number;
}

export const AddHabitForm = ({ onAdd, currentCount }: AddHabitFormProps) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<HabitCategory>('baseline');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      const success = await onAdd(name, category);
      if (success) {
        setName('');
        setCategory('baseline');
        setIsOpen(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="w-full gradient-forest text-primary-foreground hover:opacity-90"
        disabled={currentCount >= MAX_ACTIVE_HABITS}
      >
        <Plus className="w-4 h-4 mr-2" />
        Plant a New Habit
        {currentCount >= MAX_ACTIVE_HABITS && ' (Max reached)'}
      </Button>
    );
  }

  return (
    <Card className="p-4 border-2 border-dashed border-primary/30">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="habit-name" className="text-sm font-medium">
            What habit do you want to grow?
          </Label>
          <Input
            id="habit-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Morning meditation"
            className="mt-1"
            autoFocus
            disabled={isLoading}
          />
        </div>

        <div>
          <Label className="text-sm font-medium mb-3 block">Category</Label>
          <RadioGroup
            value={category}
            onValueChange={(v) => setCategory(v as HabitCategory)}
            className="grid grid-cols-2 gap-3"
            disabled={isLoading}
          >
            <div>
              <RadioGroupItem
                value="keystone"
                id="keystone"
                className="peer sr-only"
              />
              <Label
                htmlFor="keystone"
                className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 cursor-pointer transition-all"
              >
                <Anchor className="w-6 h-6 mb-2 text-primary" />
                <span className="font-medium">Keystone</span>
                <span className="text-xs text-muted-foreground text-center mt-1">
                  Stays during disruptions
                </span>
              </Label>
            </div>

            <div>
              <RadioGroupItem
                value="baseline"
                id="baseline"
                className="peer sr-only"
              />
              <Label
                htmlFor="baseline"
                className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 cursor-pointer transition-all"
              >
                <Leaf className="w-6 h-6 mb-2 text-primary" />
                <span className="font-medium">Baseline</span>
                <span className="text-xs text-muted-foreground text-center mt-1">
                  Pauses during disruptions
                </span>
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="flex gap-2">
          <Button 
            type="submit" 
            className="flex-1 gradient-forest text-primary-foreground"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Plant Habit
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
};
