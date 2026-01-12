import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Bell, BellOff, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface NotificationSettingsProps {
  enabled: boolean;
  time: string;
  onUpdate: (enabled: boolean, time?: string) => Promise<void>;
}

export const NotificationSettings = ({
  enabled,
  time,
  onUpdate,
}: NotificationSettingsProps) => {
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [notificationTime, setNotificationTime] = useState(time || '20:00');
  const [isLoading, setIsLoading] = useState(false);

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('Notifications are not supported in this browser');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      toast.error('Notifications are blocked. Please enable them in your browser settings.');
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  };

  const handleToggle = async (checked: boolean) => {
    setIsLoading(true);

    if (checked) {
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) {
        setIsLoading(false);
        return;
      }
    }

    try {
      await onUpdate(checked, notificationTime);
      setIsEnabled(checked);

      if (checked) {
        // Show a test notification
        new Notification('HabitGrove Reminders Enabled! 🌱', {
          body: `You'll receive daily check-in reminders at ${notificationTime}`,
          icon: '/favicon.ico',
        });
      }
    } catch (error) {
      toast.error('Failed to update notification settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimeChange = async (newTime: string) => {
    setNotificationTime(newTime);
    if (isEnabled) {
      setIsLoading(true);
      try {
        await onUpdate(true, newTime);
        toast.success(`Reminder time updated to ${newTime}`);
      } catch (error) {
        toast.error('Failed to update notification time');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleTestNotification = () => {
    if (Notification.permission === 'granted') {
      new Notification('HabitGrove Test Notification 🌱', {
        body: 'Time for your daily habit check-in!',
        icon: '/favicon.ico',
      });
      toast.success('Test notification sent!');
    } else {
      toast.error('Please enable notifications first');
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {isEnabled ? (
            <Bell className="w-5 h-5 text-primary" />
          ) : (
            <BellOff className="w-5 h-5 text-muted-foreground" />
          )}
          <h3 className="font-semibold text-foreground">Daily Reminders</h3>
        </div>
        <Switch
          checked={isEnabled}
          onCheckedChange={handleToggle}
          disabled={isLoading}
        />
      </div>

      {isEnabled && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <div className="flex-1">
              <Label htmlFor="reminder-time" className="text-sm">
                Reminder Time
              </Label>
              <Input
                id="reminder-time"
                type="time"
                value={notificationTime}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="mt-1 w-full"
                disabled={isLoading}
              />
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleTestNotification}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Bell className="w-4 h-4 mr-2" />
            )}
            Test Notification
          </Button>

          <p className="text-xs text-muted-foreground">
            Note: Notifications work best when the app is open. For background notifications,
            consider adding HabitGrove to your home screen.
          </p>
        </div>
      )}

      {!isEnabled && (
        <p className="text-sm text-muted-foreground">
          Enable daily reminders to get a gentle nudge for your habit check-ins.
        </p>
      )}
    </Card>
  );
};
