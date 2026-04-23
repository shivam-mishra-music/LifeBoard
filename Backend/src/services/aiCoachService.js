import Groq from "groq-sdk";

export async function generateDailyBriefing(briefingData) {
  const {
    userName = "Friend",
    todayMood = null,
    todayProductivity = null,
    moodTrend = [],
    productivityTrend = [],
    pendingTasks = [],
    completedToday = 0,
    totalTasks = 0,
    habits = [],
    topStreak = 0,
    completionRate = 0,
  } = briefingData;

  const moodTrendStr = moodTrend.filter(Boolean).length > 0
    ? `Mood history: ${moodTrend.map(m => m === "good" ? "😊" : m === "moderate" ? "😐" : "😢").join(" ")}`
    : "No mood data yet";

  const productivityStr = productivityTrend.filter(v => v > 0).length > 0
    ? `Productivity average: ${(productivityTrend.filter(v => v > 0).reduce((a,b) => a+b, 0) / productivityTrend.filter(v => v > 0).length).toFixed(1)}/5`
    : "No productivity data yet";

  const habitsStr = habits.length > 0
    ? `Active habits: ${habits.map(h => `${h.icon} ${h.name} (${h.currentStreak} day streak)`).join(", ")}`
    : "No habits created yet";

  const overdueTasks = pendingTasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < new Date() && new Date(t.dueDate).toDateString() !== new Date().toDateString()
  );

  const prompt = `You are an empathetic, motivational AI life coach. Give ${userName} a brief personalized briefing (2-3 sentences max).

Data: ${moodTrendStr}. ${productivityStr}. ${habitsStr}. Tasks: ${completedToday}/${totalTasks} done. ${overdueTasks.length > 0 ? `⚠️ ${overdueTasks.length} overdue tasks.` : ""} Streak: ${topStreak} days.

Be encouraging, mention one action for today, keep it under 150 words.`;

  try {
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const message = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 256,
      messages: [{ role: "user", content: prompt }],
    });

    const briefing = message.choices[0].message.content || "";
    return { success: true, briefing, timestamp: new Date() };
  } catch (error) {
    console.error("Groq API error:", error.message);
    return { success: false, error: error.message, briefing: "Could not generate briefing right now. Check back later!" };
  }
}

export async function suggestTaskPriority(taskTitle, taskDescription) {
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const message = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 128,
      messages: [{ role: "user", content: `Task: "${taskTitle}". ${taskDescription || ""}. Rate as HIGH/MEDIUM/LOW priority.` }],
    });
    return { success: true, priority: "MEDIUM", reason: message.choices[0].message.content };
  } catch (error) {
    return { success: false, priority: "MEDIUM", reason: "Could not suggest" };
  }
}

export async function generateJournalPrompts(mood, completedTasks, pendingTasks) {
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const message = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 128,
      messages: [{ role: "user", content: `Generate 2 journaling prompts for: ${completedTasks} tasks done, ${pendingTasks} pending, mood: ${mood}.` }],
    });
    return { success: true, prompts: [message.choices[0].message.content] };
  } catch (error) {
    return { success: false, prompts: ["What went well today?"] };
  }
}
