import cron from "node-cron";
import prisma from "../prismaClient.js";
import { sendBriefingEmail } from "../services/emailService.js";

/**
 * Schedule email sending job
 * Runs every day at 6 AM, sends emails to users who haven't received one in 4-5 days
 */
export function scheduleEmailJob() {
  // Run every day at 6 AM (0 6 * * *)
  cron.schedule("0 6 * * *", async () => {
    console.log("🕐 Email job running at 6 AM...");
    
    try {
      // Get all users with email preferences enabled
      const usersToEmail = await prisma.user.findMany({
        include: {
          emailPreference: true,
        },
      });

      let emailsSent = 0;
      let emailsFailed = 0;

      for (const user of usersToEmail) {
        // Skip if email disabled
        if (!user.emailPreference?.dailyBriefing) {
          continue;
        }

        // Check if user has received email in last 4 days
        const fourDaysAgo = new Date();
        fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);

        const lastEmail = user.lastEmailSent || new Date(0);

        // Only send if last email was more than 4 days ago
        if (lastEmail < fourDaysAgo) {
          try {
            const result = await sendBriefingEmail(user.id);
            
            if (result.success) {
              emailsSent++;
              console.log(`✅ Email sent to ${user.email}`);
            } else {
              emailsFailed++;
              console.error(`❌ Failed to send email to ${user.email}: ${result.error}`);
            }
          } catch (error) {
            emailsFailed++;
            console.error(`❌ Error sending email to user ${user.id}:`, error.message);
          }
        } else {
          console.log(`⏭️  Skipping ${user.email} - email sent recently`);
        }
      }

      console.log(`📧 Email job completed. Sent: ${emailsSent}, Failed: ${emailsFailed}`);
    } catch (error) {
      console.error("❌ Error in email job:", error);
    }
  });

  console.log("✅ Email scheduling job initialized (runs daily at 6 AM)");
}

export default {
  scheduleEmailJob,
};
