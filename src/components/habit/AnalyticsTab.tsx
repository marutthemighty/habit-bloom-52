import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Analytics } from '@/types/habit';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, Calendar, Target, CloudRain, RefreshCw, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface AnalyticsTabProps {
  analytics: Analytics;
  loading: boolean;
  onRefresh: () => void;
}

export const AnalyticsTab = ({ analytics, loading, onRefresh }: AnalyticsTabProps) => {
  const [timeRange, setTimeRange] = useState('7');

  const filteredMoodHistory = analytics.moodHistory.slice(-parseInt(timeRange));

  const statsCards = [
    {
      label: 'Longest Streak',
      value: analytics.longestStreak,
      unit: 'days',
      icon: <TrendingUp className="w-4 h-4" />,
      color: 'text-primary',
    },
    {
      label: 'Average Mood',
      value: analytics.averageMood.toFixed(1),
      unit: '/ 5',
      icon: <Target className="w-4 h-4" />,
      color: 'text-accent-foreground',
    },
    {
      label: 'Completion Rate',
      value: Math.round(analytics.completionRate * 100),
      unit: '%',
      icon: <Calendar className="w-4 h-4" />,
      color: 'text-primary',
    },
    {
      label: 'Disruptions',
      value: analytics.disruptionCount,
      unit: 'total',
      icon: <CloudRain className="w-4 h-4" />,
      color: 'text-muted-foreground',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold text-foreground">Analytics</h2>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={onRefresh} disabled={loading}>
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        {statsCards.map((stat) => (
          <Card key={stat.label} className="p-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              {stat.icon}
              <span className="text-xs">{stat.label}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl font-bold ${stat.color}`}>{stat.value}</span>
              <span className="text-xs text-muted-foreground">{stat.unit}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Mood Chart */}
      {filteredMoodHistory.length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-medium text-foreground mb-3">Mood Over Time</h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredMoodHistory}>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(date) => {
                    const d = new Date(date);
                    return `${d.getMonth() + 1}/${d.getDate()}`;
                  }}
                />
                <YAxis domain={[1, 5]} tick={{ fontSize: 10 }} width={20} />
                <Tooltip
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  formatter={(value: number) => [`${value} / 5`, 'Mood']}
                />
                <Line
                  type="monotone"
                  dataKey="mood"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Streaks by Habit */}
      {analytics.streaksByHabit.length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-medium text-foreground mb-3">Current Streaks</h3>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.streaksByHabit} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis
                  type="category"
                  dataKey="habitName"
                  tick={{ fontSize: 10 }}
                  width={80}
                />
                <Tooltip formatter={(value: number) => [`${value} days`, 'Streak']} />
                <Bar dataKey="streak" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Total Completions */}
      <Card className="p-4 text-center">
        <p className="text-muted-foreground text-sm">Total Habit Completions</p>
        <p className="text-3xl font-bold text-primary mt-1">{analytics.totalCompletions}</p>
        <p className="text-xs text-muted-foreground mt-1">Keep growing! 🌱</p>
      </Card>
    </div>
  );
};
