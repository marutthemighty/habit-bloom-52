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
    const { mood, notes, log_date } = await req.json();
    
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

    // Detect disruption using AI if notes provided
    let disruptionType: string | null = null;
    let recoveryPlan: string | null = null;

    if (notes && notes.length > 10) {
      try {
        const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
        if (LOVABLE_API_KEY) {
          const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-3-flash-preview",
              messages: [
                {
                  role: "system",
                  content: `Analyze this daily log note and determine if it indicates a disruption. Return JSON only: {"disruption_type": "travel"|"stress"|"fatigue"|"illness"|null, "recovery_plan": "brief suggestion or null"}`,
                },
                { role: "user", content: notes },
              ],
              max_tokens: 150,
            }),
          });

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            const content = aiData.choices?.[0]?.message?.content || "";
            try {
              const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, "").trim());
              disruptionType = parsed.disruption_type;
              recoveryPlan = parsed.recovery_plan;
            } catch {
              console.log("Could not parse AI response:", content);
            }
          }
        }
      } catch (aiError) {
        console.error("AI detection error:", aiError);
      }
    }

    // Upsert the log
    const { data: log, error: logError } = await supabase
      .from("daily_logs")
      .upsert({
        user_id: user.id,
        log_date,
        mood,
        notes,
        disruption_type: disruptionType,
        disruption_detected_at: disruptionType ? new Date().toISOString() : null,
        recovery_plan: recoveryPlan,
      }, { onConflict: "user_id,log_date" })
      .select()
      .single();

    if (logError) throw logError;

    // Create disruption history if detected
    if (disruptionType) {
      await supabase.from("disruption_history").insert({
        user_id: user.id,
        disruption_type: disruptionType,
        recovery_plan: recoveryPlan,
      });
    }

    return new Response(JSON.stringify({
      log,
      disruption_detected: !!disruptionType,
      disruption_type: disruptionType,
      recovery_plan: recoveryPlan,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in log-entry:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
