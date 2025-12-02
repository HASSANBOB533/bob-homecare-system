import { ENV } from "./_core/env";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * Send email using Manus built-in notification API
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const response = await fetch(`${ENV.forgeApiUrl}/notification/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${ENV.forgeApiKey}`,
      },
      body: JSON.stringify({
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      }),
    });

    if (!response.ok) {
      console.error("Failed to send email:", await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}
