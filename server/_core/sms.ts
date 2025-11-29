import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

let twilioClient: ReturnType<typeof twilio> | null = null;

// Initialize Twilio client only if credentials are available
if (accountSid && authToken && twilioPhoneNumber) {
  twilioClient = twilio(accountSid, authToken);
}

/**
 * Send an SMS message using Twilio
 * @param to - Recipient phone number (E.164 format recommended, e.g., +201234567890)
 * @param message - SMS message content
 * @returns Promise<boolean> - true if sent successfully, false otherwise
 */
export async function sendSMS(to: string, message: string): Promise<boolean> {
  if (!twilioClient || !twilioPhoneNumber) {
    console.warn('Twilio SMS not configured. Skipping SMS to:', to);
    return false;
  }

  try {
    // Ensure phone number is in E.164 format
    const formattedPhone = to.startsWith('+') ? to : `+${to}`;

    const result = await twilioClient.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: formattedPhone,
    });

    console.log(`SMS sent successfully to ${to}. SID: ${result.sid}`);
    return true;
  } catch (error) {
    console.error('Failed to send SMS:', error);
    return false;
  }
}

/**
 * Send booking confirmation SMS
 */
export async function sendBookingConfirmationSMS(
  phone: string,
  details: {
    customerName: string;
    serviceName: string;
    dateTime: Date;
    address: string;
    bookingId?: number;
  }
): Promise<boolean> {
  const formattedDate = details.dateTime.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const formattedTime = details.dateTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const message = `BOB Home Care - Booking Confirmed!

Hello ${details.customerName},

Your booking has been confirmed:
Service: ${details.serviceName}
Date: ${formattedDate}
Time: ${formattedTime}
Location: ${details.address}
${details.bookingId ? `Reference: #${details.bookingId}` : ''}

We will send you the payment link shortly.

Thank you for choosing BOB Home Care!`;

  return sendSMS(phone, message);
}

/**
 * Send booking reminder SMS (24 hours before appointment)
 */
export async function sendBookingReminderSMS(
  phone: string,
  details: {
    customerName: string;
    serviceName: string;
    dateTime: Date;
    address: string;
  }
): Promise<boolean> {
  const formattedDate = details.dateTime.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const formattedTime = details.dateTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const message = `BOB Home Care - Reminder

Hello ${details.customerName},

This is a reminder of your upcoming appointment:
Service: ${details.serviceName}
Tomorrow: ${formattedDate}
Time: ${formattedTime}
Location: ${details.address}

We look forward to serving you!

BOB Home Care`;

  return sendSMS(phone, message);
}

/**
 * Send loyalty points earned notification SMS
 */
export async function sendLoyaltyPointsEarnedSMS(
  phone: string,
  details: {
    customerName: string;
    pointsEarned: number;
    totalPoints: number;
  }
): Promise<boolean> {
  const message = `BOB Home Care - Loyalty Reward! 🎉

Hello ${details.customerName},

You've earned ${details.pointsEarned} loyalty points!

Your total balance: ${details.totalPoints} points

Redeem your points for exclusive rewards and discounts.

Visit your Loyalty Dashboard to explore rewards.

Thank you for your continued trust!
BOB Home Care`;

  return sendSMS(phone, message);
}

/**
 * Send reward redemption confirmation SMS
 */
export async function sendRewardRedeemedSMS(
  phone: string,
  details: {
    customerName: string;
    rewardName: string;
    pointsSpent: number;
    remainingPoints: number;
  }
): Promise<boolean> {
  const message = `BOB Home Care - Reward Redeemed! ✅

Hello ${details.customerName},

You've successfully redeemed:
${details.rewardName}

Points spent: ${details.pointsSpent}
Remaining balance: ${details.remainingPoints} points

Your reward will be applied to your next booking.

Thank you for being a loyal customer!
BOB Home Care`;

  return sendSMS(phone, message);
}

/**
 * Check if Twilio SMS is configured
 */
export function isSMSConfigured(): boolean {
  return twilioClient !== null && twilioPhoneNumber !== null;
}
