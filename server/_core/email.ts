import { Resend } from 'resend';

// Initialize Resend client
let resendClient: Resend | null = null;

function getResendClient() {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn('[Email] RESEND_API_KEY not configured. Email sending will be skipped.');
      return null;
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

/**
 * Send an email using Resend
 * @param options Email options (to, subject, html, from)
 * @returns Promise<{ success: boolean, messageId?: string, error?: string }>
 */
export async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const client = getResendClient();
  
  if (!client) {
    console.log('[Email] Skipping email send (no API key configured)');
    console.log(`[Email] Would send to: ${options.to}`);
    console.log(`[Email] Subject: ${options.subject}`);
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const result = await client.emails.send({
      from: options.from || 'BOB Home Care <onboarding@resend.dev>', // Default Resend test address
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    console.log(`[Email] Sent successfully to ${options.to}, ID: ${result.data?.id}`);
    return { success: true, messageId: result.data?.id };
  } catch (error: any) {
    console.error('[Email] Failed to send:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send email verification email
 */
export async function sendVerificationEmail(to: string, token: string, baseUrl: string): Promise<{ success: boolean; error?: string }> {
  const verificationUrl = `${baseUrl}/verify-email?token=${token}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>BOB Home Care</h1>
          </div>
          <div class="content">
            <h2>Verify Your Email Address</h2>
            <p>Thank you for signing up with BOB Home Care! Please verify your email address to complete your registration and start booking our cleaning services.</p>
            <p style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #6b7280;">${verificationUrl}</p>
            <p>This verification link will expire in 24 hours.</p>
            <p>If you didn't create an account with BOB Home Care, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 BOB Home Care. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: 'Verify your email address - BOB Home Care',
    html,
  });
}

/**
 * Send booking confirmation email
 */
export async function sendBookingConfirmationEmail(
  to: string,
  bookingDetails: {
    customerName: string;
    serviceName: string;
    dateTime: Date;
    address: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const formattedDate = bookingDetails.dateTime.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = bookingDetails.dateTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .booking-details { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .detail-label { font-weight: bold; color: #6b7280; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✓ Booking Confirmed</h1>
          </div>
          <div class="content">
            <h2>Hello ${bookingDetails.customerName},</h2>
            <p>Your cleaning service has been successfully booked! Here are your booking details:</p>
            <div class="booking-details">
              <div class="detail-row">
                <span class="detail-label">Service:</span>
                <span>${bookingDetails.serviceName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Date:</span>
                <span>${formattedDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Time:</span>
                <span>${formattedTime}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Address:</span>
                <span>${bookingDetails.address}</span>
              </div>
            </div>
            <p>We'll send you a reminder 24 hours before your appointment via WhatsApp.</p>
            <p>If you need to reschedule or cancel, please contact us as soon as possible.</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 BOB Home Care. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `Booking Confirmed - ${bookingDetails.serviceName}`,
    html,
  });
}

/**
 * Send loyalty points earned email
 */
export async function sendLoyaltyPointsEarnedEmail(
  to: string,
  details: {
    customerName: string;
    pointsEarned: number;
    totalPoints: number;
    bookingId: number;
  }
): Promise<{ success: boolean; error?: string }> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #8b5cf6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .points-badge { background: white; padding: 30px; border-radius: 8px; text-align: center; margin: 20px 0; }
          .points-number { font-size: 48px; color: #8b5cf6; font-weight: bold; }
          .balance-box { background: #ede9fe; padding: 15px; border-radius: 6px; text-align: center; color: #6b21a8; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 You've Earned Loyalty Points!</h1>
          </div>
          <div class="content">
            <h2>Hello ${details.customerName},</h2>
            <p>Thank you for using our services! You've earned new loyalty points.</p>
            <div class="points-badge">
              <div class="points-number">+${details.pointsEarned}</div>
              <p style="color: #6b7280; margin: 10px 0;">New Points</p>
              <p style="font-size: 14px; color: #9ca3af;">From Booking #${details.bookingId}</p>
            </div>
            <div class="balance-box">
              <p style="margin: 0;"><strong>Your Current Balance:</strong> ${details.totalPoints} points</p>
            </div>
            <p>You can use your points to get discounts on your next bookings!</p>
            <p style="font-size: 14px; color: #6b7280;">💡 100 points = 10 EGP discount</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 BOB Home Care. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: '🎉 You Earned Loyalty Points! - BOB Home Care',
    html,
  });
}

/**
 * Send loyalty points redeemed email
 */
export async function sendLoyaltyPointsRedeemedEmail(
  to: string,
  details: {
    customerName: string;
    pointsRedeemed: number;
    discountAmount: number;
    remainingPoints: number;
    bookingId: number;
  }
): Promise<{ success: boolean; error?: string }> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #8b5cf6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .redemption-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .discount-amount { font-size: 32px; color: #10b981; font-weight: bold; }
          .balance-box { background: #ede9fe; padding: 15px; border-radius: 6px; text-align: center; color: #6b21a8; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✓ Points Redeemed Successfully!</h1>
          </div>
          <div class="content">
            <h2>Hello ${details.customerName},</h2>
            <p>You've successfully redeemed your loyalty points for a discount!</p>
            <div class="redemption-box">
              <p><strong>Points Redeemed:</strong> ${details.pointsRedeemed} points</p>
              <p><strong>Discount Applied:</strong> <span class="discount-amount">${details.discountAmount} EGP</span></p>
              <p style="font-size: 14px; color: #9ca3af;">On Booking #${details.bookingId}</p>
            </div>
            <div class="balance-box">
              <p style="margin: 0;"><strong>Remaining Balance:</strong> ${details.remainingPoints} points</p>
            </div>
            <p>Keep using our services to earn more points and enjoy more discounts!</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 BOB Home Care. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: 'Points Redeemed Successfully - BOB Home Care',
    html,
  });
}

/**
 * Send booking status update email
 */
export async function sendBookingStatusEmail(
  to: string,
  details: {
    customerName: string;
    serviceName: string;
    bookingId: number;
    status: 'confirmed' | 'completed' | 'cancelled';
  }
): Promise<{ success: boolean; error?: string }> {
  const statusConfig = {
    confirmed: {
      color: '#10b981',
      title: 'Booking Confirmed',
      message: 'Your booking has been confirmed by our team. We\'ll see you soon!',
      emoji: '✓',
    },
    completed: {
      color: '#3b82f6',
      title: 'Service Completed',
      message: 'Your service has been completed. We hope you enjoyed our service! Please consider leaving us a review.',
      emoji: '🎉',
    },
    cancelled: {
      color: '#ef4444',
      title: 'Booking Cancelled',
      message: 'Your booking has been cancelled. If you have any questions or would like to rebook, please contact us.',
      emoji: '✕',
    },
  };

  const config = statusConfig[details.status];

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${config.color}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .status-box { background: white; padding: 20px; border-radius: 8px; border-left: 4px solid ${config.color}; margin: 20px 0; }
          .status-label { color: ${config.color}; font-weight: bold; font-size: 18px; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${config.emoji} ${config.title}</h1>
          </div>
          <div class="content">
            <h2>Hello ${details.customerName},</h2>
            <div class="status-box">
              <p><strong>Booking ID:</strong> #${details.bookingId}</p>
              <p><strong>Service:</strong> ${details.serviceName}</p>
              <p><strong>Status:</strong> <span class="status-label">${config.title}</span></p>
            </div>
            <p>${config.message}</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 BOB Home Care. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `${config.title} - BOB Home Care`,
    html,
  });
}
