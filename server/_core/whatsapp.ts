/**
 * WhatsApp notification helper
 * Sends WhatsApp messages using WhatsApp Business API or third-party services
 */

interface WhatsAppMessageOptions {
  to: string; // Phone number in international format (e.g., +201234567890)
  message: string;
}

/**
 * Send WhatsApp message
 * @param options Message options (to, message)
 * @returns Promise<{ success: boolean, error?: string }>
 */
export async function sendWhatsAppMessage(options: WhatsAppMessageOptions): Promise<{ success: boolean; error?: string }> {
  const { to, message } = options;
  
  // For now, we'll log the message and return success
  // In production, integrate with WhatsApp Business API or services like Twilio, MessageBird, etc.
  console.log('[WhatsApp] Sending message:');
  console.log(`[WhatsApp] To: ${to}`);
  console.log(`[WhatsApp] Message: ${message}`);
  
  // TODO: Integrate with actual WhatsApp service
  // Example with Twilio:
  // const accountSid = process.env.TWILIO_ACCOUNT_SID;
  // const authToken = process.env.TWILIO_AUTH_TOKEN;
  // const client = require('twilio')(accountSid, authToken);
  // 
  // try {
  //   await client.messages.create({
  //     from: 'whatsapp:+14155238886', // Twilio WhatsApp number
  //     to: `whatsapp:${to}`,
  //     body: message
  //   });
  //   return { success: true };
  // } catch (error: any) {
  //   return { success: false, error: error.message };
  // }
  
  return { success: true };
}

/**
 * Send booking reminder via WhatsApp
 */
export async function sendBookingReminder(
  phone: string,
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

  const message = `
🏠 *BOB Home Care - Booking Reminder*

Hello ${bookingDetails.customerName}!

This is a reminder that your cleaning service is scheduled for tomorrow:

📋 *Service:* ${bookingDetails.serviceName}
📅 *Date:* ${formattedDate}
⏰ *Time:* ${formattedTime}
📍 *Address:* ${bookingDetails.address}

Our team will arrive on time and ready to provide you with excellent service!

If you need to reschedule or have any questions, please contact us.

Thank you for choosing BOB Home Care! 🌟
  `.trim();

  return sendWhatsAppMessage({
    to: phone,
    message,
  });
}

/**
 * Send booking confirmation via WhatsApp
 */
export async function sendBookingConfirmation(
  phone: string,
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

  const message = `
✅ *BOB Home Care - Booking Confirmed*

Hello ${bookingDetails.customerName}!

Your cleaning service has been successfully booked!

📋 *Service:* ${bookingDetails.serviceName}
📅 *Date:* ${formattedDate}
⏰ *Time:* ${formattedTime}
📍 *Address:* ${bookingDetails.address}

We'll send you a reminder 24 hours before your appointment.

Thank you for choosing BOB Home Care! 🌟
  `.trim();

  return sendWhatsAppMessage({
    to: phone,
    message,
  });
}
