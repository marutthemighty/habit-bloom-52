import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { MessageSquare, Download, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

export const FeedbackForm = () => {
  const [feedback, setFeedback] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleExport = () => {
    if (!feedback.trim()) {
      toast.error('Please write some feedback first');
      return;
    }

    const blob = new Blob([feedback], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `habitgrove-feedback-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Feedback exported! Thank you for sharing.');
    setFeedback('');
    setIsOpen(false);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="p-4">
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between p-0 h-auto hover:bg-transparent"
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-muted-foreground" />
              <span className="font-semibold text-foreground">Share Feedback</span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-muted-foreground transition-transform ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="pt-4">
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="What's working well? What could be better? Your thoughts help improve HabitGrove..."
            className="min-h-[100px] resize-none"
          />
          <div className="flex justify-between items-center mt-3">
            <p className="text-xs text-muted-foreground">
              Feedback stays private — export as a file to share
            </p>
            <Button
              onClick={handleExport}
              variant="outline"
              size="sm"
              disabled={!feedback.trim()}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
