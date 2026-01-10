import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ExportActionsProps {
  onExport: () => void;
  onClear: () => void;
}

export const ExportActions = ({ onExport, onClear }: ExportActionsProps) => {
  return (
    <Card className="p-4">
      <h3 className="font-semibold text-foreground mb-3">Data Management</h3>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onExport} className="flex-1">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear all data?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all your habits, streaks, and progress.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={onClear}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete Everything
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Card>
  );
};
