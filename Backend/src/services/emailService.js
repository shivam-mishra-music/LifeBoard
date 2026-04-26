import sgMail from "@sendgrid/mail";
import prisma from "../prismaClient.js";
import { format, subDays, startOfDay } from "date-fns";
import Groq from "groq-sdk";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Send motivational briefing email to user
 */
export async function sendBriefingEmail(userId) {
  try {
    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        habits: true,
        tasks: true,
      },
    });

    if (!user) {
      console.error(`User ${userId} not found`);
      return { success: false, error: "User not found" };
    }

    // Check email preferences
    const prefs = await prisma.emailPreference.findUnique({
      where: { userId },
    });

    if (!prefs || !prefs.dailyBriefing) {
      console.log(`Email disabled for user ${userId}`);
      return { success: false, error: "Email preferences disabled" };
    }

    // Get user stats
    const today = startOfDay(new Date());
    const last7days = Array.from({ length: 7 }, (_, i) => subDays(today, i));

    const summaries = await prisma.daySummary.findMany({
      where: {
        userId,
        date: {
          gte: last7days[6],
          lte: today,
        },
      },
    });

    const habits = user.habits || [];
    const topStreak = habits.reduce((max, h) => Math.max(max, h.currentStreak || 0), 0);
    const completedHabitsToday = habits.filter(h => h.todayDone).length;
    const totalHabits = habits.length;

    const tasks = user.tasks || [];
    const completedToday = tasks.filter(t => t.completed && t.dueDate && new Date(t.dueDate).toDateString() === today.toDateString()).length;
    const totalToday = tasks.filter(t => t.dueDate && new Date(t.dueDate).toDateString() === today.toDateString()).length;

    // Get latest summary
    const latestSummary = summaries[summaries.length - 1];
    const mood = latestSummary?.mood || "moderate";
    const productivity = latestSummary?.productivity || 0;

    // Generate AI briefing
    const briefing = await generateMotivationalBriefing(user.name, {
      topStreak,
      completedHabitsToday,
      totalHabits,
      completedToday,
      totalToday,
      mood,
      productivity,
      summaries,
    });

    // Create email HTML
    const emailHTML = createMotivationalEmail(user.name, {
      briefing,
      topStreak,
      completedHabitsToday,
      totalHabits,
      completedToday,
      totalToday,
      mood,
      productivity,
    });

    // Send email
    const msg = {
      to: user.email,
      from: process.env.SENDGRID_FROM_EMAIL || "noreply@lifeboardapp.com",
      subject: `✨ Your LifeBoard Weekly Briefing - Keep That Streak Going! 🔥`,
      html: emailHTML,
    };

    await sgMail.send(msg);

    // Update last email sent timestamp
    await prisma.user.update({
      where: { id: userId },
      data: { lastEmailSent: new Date() },
    });

    console.log(`Email sent successfully to ${user.email}`);
    return { success: true, message: "Email sent" };
  } catch (error) {
    console.error("Email sending error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate motivational briefing using Groq
 */
async function generateMotivationalBriefing(userName, stats) {
  try {
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const prompt = `You are an inspiring life coach writing a motivational email briefing.

User: ${userName}
This Week's Stats:
- Top Habit Streak: ${stats.topStreak} days 🔥
- Habits Completed Today: ${stats.completedHabitsToday}/${stats.totalHabits}
- Tasks Done Today: ${stats.completedToday}/${stats.totalToday}
- Mood: ${stats.mood}
- Productivity: ${stats.productivity}/5

Write a SHORT (2-3 sentences), POWERFUL motivational message that:
1. Celebrates their progress (especially the streak!)
2. Encourages them to visit LifeBoard today
3. Creates urgency to maintain their streak
4. Is personal and genuine, not generic

Keep it concise and action-oriented. Make them WANT to open the app right now!`;

    const message = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }],
    });

    return message.choices[0].message.content;
  } catch (error) {
    console.error("Groq error:", error);
    return `Keep building that ${stats.topStreak}-day streak! Your dedication is amazing. Visit LifeBoard now to log today and keep the momentum going! 🚀`;
  }
}

/**
 * Create beautiful, motivational HTML email
 */
function createMotivationalEmail(userName, stats) {
  const moodEmoji = {
    good: "😊",
    moderate: "😐",
    bad: "😢",
  };

  const moodEmoji$ = moodEmoji[stats.mood] || "😐";

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>LifeBoard - Your Weekly Briefing</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
          background: linear-gradient(135deg, #060b18 0%, #0b1126 100%);
          color: #e2e8f0;
          line-height: 1.6;
        }
        
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .email-wrapper {
          background: linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(15,23,42,0.95) 100%);
          border: 1px solid rgba(99,102,241,0.25);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        
        .header {
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          padding: 40px 30px;
          text-align: center;
          color: white;
        }
        
        .header h1 {
          font-size: 28px;
          margin-bottom: 10px;
          font-weight: 700;
        }
        
        .header p {
          font-size: 16px;
          opacity: 0.9;
        }
        
        .content {
          padding: 40px 30px;
        }
        
        .greeting {
          font-size: 20px;
          font-weight: 600;
          color: #e2e8f0;
          margin-bottom: 20px;
        }
        
        .briefing-box {
          background: rgba(99,102,241,0.15);
          border-left: 4px solid #6366f1;
          padding: 20px;
          border-radius: 8px;
          margin: 25px 0;
          font-size: 15px;
          line-height: 1.8;
          color: #cbd5e1;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin: 30px 0;
        }
        
        .stat-card {
          background: rgba(15,23,42,0.6);
          border: 1px solid rgba(148,163,184,0.1);
          border-radius: 12px;
          padding: 20px;
          text-align: center;
        }
        
        .stat-value {
          font-size: 28px;
          font-weight: 700;
          color: #6366f1;
          margin: 10px 0;
        }
        
        .stat-label {
          font-size: 12px;
          text-transform: uppercase;
          color: #94a3b8;
          letter-spacing: 1px;
        }
        
        .streak-highlight {
          background: linear-gradient(135deg, rgba(248,113,113,0.15) 0%, rgba(251,146,60,0.15) 100%);
          border: 2px solid rgba(251,146,60,0.3);
          border-radius: 12px;
          padding: 25px;
          text-align: center;
          margin: 25px 0;
        }
        
        .streak-number {
          font-size: 48px;
          font-weight: 800;
          background: linear-gradient(135deg, #f97316 0%, #fb923c 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 10px 0;
        }
        
        .streak-text {
          font-size: 16px;
          color: #e2e8f0;
          margin-bottom: 10px;
        }
        
        .cta-button {
          display: inline-block;
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          color: white;
          padding: 14px 40px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          font-size: 16px;
          transition: all 0.3s ease;
          margin-top: 20px;
        }
        
        .cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(99,102,241,0.4);
        }
        
        .tips-section {
          background: rgba(34,197,94,0.1);
          border-left: 4px solid #22c55e;
          padding: 20px;
          border-radius: 8px;
          margin: 25px 0;
          font-size: 14px;
          color: #cbd5e1;
        }
        
        .tips-section h3 {
          color: #22c55e;
          margin-bottom: 10px;
          font-size: 16px;
        }
        
        .tips-section ul {
          list-style: none;
          margin-left: 0;
        }
        
        .tips-section li {
          margin: 8px 0;
          padding-left: 20px;
          position: relative;
        }
        
        .tips-section li:before {
          content: "✓";
          position: absolute;
          left: 0;
          color: #22c55e;
          font-weight: bold;
        }
        
        .footer {
          background: rgba(15,23,42,0.8);
          padding: 25px 30px;
          text-align: center;
          border-top: 1px solid rgba(148,163,184,0.1);
          font-size: 12px;
          color: #64748b;
        }
        
        .footer a {
          color: #6366f1;
          text-decoration: none;
        }
        
        @media (max-width: 600px) {
          .container {
            padding: 10px;
          }
          
          .header {
            padding: 30px 20px;
          }
          
          .header h1 {
            font-size: 24px;
          }
          
          .content {
            padding: 25px 20px;
          }
          
          .stats-grid {
            grid-template-columns: 1fr;
          }
          
          .stat-value {
            font-size: 24px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="email-wrapper">
          <!-- Header -->
          <div class="header">
            <h1>✨ LifeBoard Weekly Briefing</h1>
            <p>Your personal life organizer</p>
          </div>
          
          <!-- Content -->
          <div class="content">
            <div class="greeting">Hey ${userName}! 👋</div>
            
            <!-- Streak Highlight -->
            <div class="streak-highlight">
              <div class="streak-text">🔥 Your Current Streak</div>
              <div class="streak-number">${stats.topStreak}</div>
              <div class="streak-text">DAYS IN A ROW</div>
              <p style="color: #94a3b8; margin-top: 10px; font-size: 13px;">Keep this momentum going! Every day matters.</p>
            </div>
            
            <!-- AI Briefing -->
            <div class="briefing-box">
              <strong>💭 Your AI Coach Says:</strong>
              <p style="margin-top: 12px;">${stats.briefing}</p>
            </div>
            
            <!-- Stats -->
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-label">Habits Today</div>
                <div class="stat-value">${stats.completedHabitsToday}/${stats.totalHabits}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Tasks Completed</div>
                <div class="stat-value">${stats.completedToday}/${stats.totalToday}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Current Mood</div>
                <div class="stat-value" style="font-size: 36px;">${moodEmoji$}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Productivity</div>
                <div class="stat-value">${stats.productivity}/5</div>
              </div>
            </div>
            
            <!-- Tips Section -->
            <div class="tips-section">
              <h3>🎯 Tips to Maintain Your Streak:</h3>
              <ul>
                <li>Check in daily to log your mood and productivity</li>
                <li>Complete at least one habit every day</li>
                <li>Review your briefing from the AI Coach</li>
                <li>Chat with your AI Coach for personalized advice</li>
                <li>Celebrate milestones and rewards!</li>
              </ul>
            </div>
            
            <!-- CTA -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || "https://lifeboardapp.vercel.app"}/dashboard" class="cta-button">
                🚀 Open LifeBoard Now
              </a>
            </div>
          </div>
          
          <!-- Footer -->
          <div class="footer">
            <p>You're receiving this because you enabled daily briefing emails in your <a href="${process.env.FRONTEND_URL || "https://lifeboardapp.vercel.app"}/dashboard/settings">settings</a>.</p>
            <p style="margin-top: 10px;">© 2026 LifeBoard. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

export default {
  sendBriefingEmail,
};
