import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch all data
    const [habitsRes, completionsRes, logsRes, disruptionsRes] = await Promise.all([
      supabase.from("habits").select("*").eq("user_id", user.id),
      supabase.from("habit_completions").select("*").eq("user_id", user.id),
      supabase.from("daily_logs").select("*").eq("user_id", user.id).order("log_date", { ascending: false }).limit(30),
      supabase.from("disruption_history").select("*").eq("user_id", user.id),
    ]);

    const habits = habitsRes.data || [];
    const completions = completionsRes.data || [];
    const logs = logsRes.data || [];
    const disruptions = disruptionsRes.data || [];

    // Calculate streaks
    const calculateStreak = (habitId: string): number => {
      const habitCompletions = completions
        .filter((c: any) => c.habit_id === habitId && c.completed)
        .map((c: any) => c.completed_date)
        .sort()
        .reverse();

      if (habitCompletions.length === 0) return 0;

      let streak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let i = 0; i < 365; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);
        const dateKey = checkDate.toISOString().split("T")[0];
        if (habitCompletions.includes(dateKey)) {
          streak++;
        } else if (i > 0) {
          break;
        }
      }
      return streak;
    };

    const streaksByHabit = habits.map((h: any) => ({
      habitId: h.id,
      habitName: h.name,
      streak: calculateStreak(h.id),
    }));

    const allStreaks = streaksByHabit.map((s: any) => s.streak);
    const longestStreak = allStreaks.length > 0 ? Math.max(...allStreaks) : 0;
    const currentStreak = allStreaks.reduce((a: number, b: number) => a + b, 0);
    const totalCompletions = completions.filter((c: any) => c.completed).length;

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentCompletions = completions.filter((c: any) => new Date(c.completed_date) >= thirtyDaysAgo && c.completed);
    const expectedCompletions = habits.filter((h: any) => h.is_active).length * 30;
    const completionRate = expectedCompletions > 0 ? recentCompletions.length / expectedCompletions : 0;

    const moodsWithValues = logs.filter((l: any) => l.mood !== null);
    const averageMood = moodsWithValues.length > 0
      ? moodsWithValues.reduce((sum: number, l: any) => sum + l.mood, 0) / moodsWithValues.length
      : 0;

    const moodHistory = logs
      .filter((l: any) => l.mood !== null)
      .map((l: any) => ({ date: l.log_date, mood: l.mood }));

    return new Response(JSON.stringify({
      averageMood: Math.round(averageMood * 10) / 10,
      longestStreak,
      currentStreak,
      totalCompletions,
      disruptionCount: disruptions.length,
      completionRate: Math.round(completionRate * 100) / 100,
      streaksByHabit,
      moodHistory,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in get-analytics:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
