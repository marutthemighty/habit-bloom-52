import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { habits, disruptionMode, habitCount } = await req.json();
    
    console.log("Received request:", { habits, disruptionMode, habitCount });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a habit-building coach specializing in resilient habit stacking and behavior design. 
You help people build sustainable habits that survive life's disruptions (travel, stress, illness, busy periods).

Key principles you follow:
- Keystone habits are anchors that should be maintained even during disruptions
- Baseline habits support keystones but can be paused during challenging times
- Habit stacking (linking habits together) increases success rates
- Starting small and being consistent beats being ambitious and inconsistent
- Environment design is crucial for habit success

Provide practical, actionable advice. Be encouraging but realistic.`;

    const userPrompt = disruptionMode
      ? `I'm currently in disruption mode (dealing with travel, stress, or life changes). 
My habits are: ${habits || "No habits yet"}.
I have ${habitCount} habits total.
How should I adjust my routine to maintain my essential habits while being kind to myself during this challenging period?`
      : `My current habits are: ${habits || "No habits yet"}.
I have ${habitCount} habits total.
Suggest resilient stacking strategies that will help these habits survive future disruptions like travel or stress. 
Also suggest what order to do them and how to link them together.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: "Rate limit exceeded. Please try again in a moment.",
            suggestion: "Take a moment to reflect on your habits while we reset.",
            tips: [
              "Stack your habits: 'After I [current habit], I will [new habit]'",
              "Keep keystone habits during disruptions, pause baseline ones",
              "Start with 2-minute versions of habits to build consistency",
            ]
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    console.log("AI response received:", content.substring(0, 100) + "...");

    // Parse the response into suggestion and tips
    const lines = content.split("\n").filter((line: string) => line.trim());
    const suggestion = lines[0] || "Focus on consistency over intensity.";
    const tips = lines.slice(1, 6).map((line: string) => 
      line.replace(/^[-*•]\s*/, "").replace(/^\d+\.\s*/, "").trim()
    ).filter((tip: string) => tip.length > 10);

    return new Response(
      JSON.stringify({
        suggestion,
        tips: tips.length > 0 ? tips : [
          "Stack habits together for better adherence",
          "Keep your keystone habits during disruptions",
          "Start incredibly small - 2 minutes is better than zero",
        ],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in habit-suggestions:", error);
    
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        suggestion: "Focus on one keystone habit at a time.",
        tips: [
          "Habit stacking: Link new habits to existing ones",
          "During disruptions, maintain only your most important habit",
          "Design your environment to make good habits easy",
          "Track your streaks visually for motivation",
        ],
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
