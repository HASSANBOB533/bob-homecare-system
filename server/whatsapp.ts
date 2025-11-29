/**
 * WhatsApp notification helper
 * Sends booking confirmation messages via WhatsApp
 */

const WHATSAPP_BUSINESS_NUMBER = '+201273518887';

interface BookingDetails {
  customerName: string;
  customerPhone: string;
  serviceName: string;
  dateTime: Date;
  address: string;
  bookingId: number;
}

/**
 * Generate WhatsApp confirmation message URL
 * This creates a WhatsApp link that opens with a pre-filled message
 */
export function generateWhatsAppConfirmationURL(booking: BookingDetails): string {
  const message = `
🎉 *Booking Confirmed - BOB Home Care*

Dear ${booking.customerName},

Your booking has been confirmed!

📋 *Booking Details:*
• Service: ${booking.serviceName}
• Date: ${new Date(booking.dateTime).toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}
• Time: ${new Date(booking.dateTime).toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })}
• Address: ${booking.address}
• Booking ID: #${booking.bookingId}

💳 *Payment:*
A payment link will be sent to you shortly. Your reservation will be finalized after payment confirmation.

📞 *Need Help?*
Contact us on WhatsApp: ${WHATSAPP_BUSINESS_NUMBER}

Thank you for choosing BOB Home Care! 🏡✨
`.trim();

  // Encode message for URL
  const encodedMessage = encodeURIComponent(message);
  
  // Remove + from phone number for WhatsApp API
  const phoneNumber = booking.customerPhone.replace(/[^0-9]/g, '');
  
  // Return WhatsApp API URL
  return `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
}

/**
 * Send booking confirmation via WhatsApp
 * Returns the WhatsApp URL that can be opened to send the message
 */
export async function sendBookingConfirmation(booking: BookingDetails): Promise<{
  success: boolean;
  whatsappURL: string;
  message?: string;
}> {
  try {
    const whatsappURL = generateWhatsAppConfirmationURL(booking);
    
    return {
      success: true,
      whatsappURL,
      message: 'WhatsApp confirmation link generated successfully'
    };
  } catch (error) {
    console.error('Error generating WhatsApp confirmation:', error);
    return {
      success: false,
      whatsappURL: '',
      message: 'Failed to generate WhatsApp confirmation'
    };
  }
}
