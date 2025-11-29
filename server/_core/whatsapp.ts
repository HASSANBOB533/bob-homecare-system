/**
 * WhatsApp notification helper using Meta's WhatsApp Business Cloud API
 * Official documentation: https://developers.facebook.com/docs/whatsapp/cloud-api
 */

interface WhatsAppMessageOptions {
  to: string; // Phone number in international format (e.g., +201234567890 or 201234567890)
  message: string;
}

/**
 * Send WhatsApp message using Meta's WhatsApp Business Cloud API
 * @param options Message options (to, message)
 * @returns Promise<{ success: boolean, error?: string, messageId?: string }>
 */
export async function sendWhatsAppMessage(options: WhatsAppMessageOptions): Promise<{ success: boolean; error?: string; messageId?: string }> {
  const { to, message } = options;
  
  // Get Meta WhatsApp credentials from environment
  const accessToken = process.env.META_WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID;
  const apiVersion = process.env.META_WHATSAPP_API_VERSION || 'v18.0';
  
  // If credentials are not set, log to console (development mode)
  if (!accessToken || !phoneNumberId) {
    console.log('[WhatsApp] Meta credentials not configured - logging message instead:');
    console.log(`[WhatsApp] To: ${to}`);
    console.log(`[WhatsApp] Message: ${message}`);
    return { success: true };
  }
  
  try {
    // Clean phone number (remove + and any spaces)
    const cleanPhone = to.replace(/[+\s]/g, '');
    
    // Meta WhatsApp Cloud API endpoint
    const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;
    
    // Send message using Meta's WhatsApp Business Cloud API
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: cleanPhone,
        type: 'text',
        text: {
          body: message,
        },
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('[WhatsApp] Meta API error:', data);
      return { 
        success: false, 
        error: data.error?.message || 'Failed to send WhatsApp message' 
      };
    }
    
    console.log('[WhatsApp] Message sent successfully:', data);
    return { 
      success: true, 
      messageId: data.messages?.[0]?.id 
    };
    
  } catch (error: any) {
    console.error('[WhatsApp] Error sending message:', error);
    return { 
      success: false, 
      error: error.message || 'Unknown error occurred' 
    };
  }
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
): Promise<{ success: boolean; error?: string; messageId?: string }> {
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
): Promise<{ success: boolean; error?: string; messageId?: string }> {
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
