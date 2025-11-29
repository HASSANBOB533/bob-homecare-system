import { sendWhatsAppMessage } from "./_core/whatsapp";
import { getDb } from "./db";
import { services, bookings } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Process incoming WhatsApp messages and respond with chatbot logic
 */
export async function processChatbotMessage(
  from: string,
  messageBody: string,
  messageId: string
): Promise<void> {
  try {
    const lowerMessage = messageBody.toLowerCase().trim();

    // Menu/Help command
    if (lowerMessage === "menu" || lowerMessage === "help" || lowerMessage === "مرحبا" || lowerMessage === "hi" || lowerMessage === "hello") {
      await sendMenuMessage(from);
      return;
    }

    // Services list command
    if (lowerMessage.includes("service") || lowerMessage.includes("خدمات") || lowerMessage === "1") {
      await sendServicesMessage(from);
      return;
    }

    // Booking/Reservation command
    if (lowerMessage.includes("book") || lowerMessage.includes("حجز") || lowerMessage === "2") {
      await sendBookingInstructions(from);
      return;
    }

    // Contact information
    if (lowerMessage.includes("contact") || lowerMessage.includes("تواصل") || lowerMessage === "3") {
      await sendContactInfo(from);
      return;
    }

    // Default response - show menu
    await sendMenuMessage(from);
  } catch (error) {
    console.error("[WhatsApp Chatbot] Error processing message:", error);
    await sendWhatsAppMessage({
      to: from,
      message: "Sorry, I encountered an error. Please try again later or contact us directly.\n\nعذراً، حدث خطأ. يرجى المحاولة لاحقاً أو التواصل معنا مباشرة."
    });
  }
}

/**
 * Send main menu message
 */
async function sendMenuMessage(from: string): Promise<void> {
  const menuMessage = `🏠 *Welcome to BOB Home Care!*
مرحباً بك في بوب للعناية المنزلية!

How can I help you today? / كيف يمكنني مساعدتك اليوم؟

*Main Menu:*
1️⃣ View Services / عرض الخدمات
2️⃣ Make a Booking / حجز موعد
3️⃣ Contact Us / تواصل معنا

Reply with a number or keyword to continue.
رد برقم أو كلمة للمتابعة.`;

  await sendWhatsAppMessage({ to: from, message: menuMessage });
}

/**
 * Send list of available services
 */
async function sendServicesMessage(from: string): Promise<void> {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    const allServices = await db.select().from(services);

    if (allServices.length === 0) {
      await sendWhatsAppMessage({
        to: from,
        message: "No services available at the moment.\n\nلا توجد خدمات متاحة حالياً."
      });
      return;
    }

    let servicesMessage = `🧹 *Our Services / خدماتنا:*\n\n`;

    for (const service of allServices) {
      servicesMessage += `📌 *${service.name}* (${service.nameEn})\n`;
      servicesMessage += `${service.description}\n`;
      servicesMessage += `${service.descriptionEn}\n`;
      servicesMessage += `⏱ Duration: ${service.duration} minutes\n\n`;
    }

    servicesMessage += `\nTo book a service, reply with "2" or "book".\nلحجز خدمة، رد بـ "2" أو "حجز".`;

    await sendWhatsAppMessage({ to: from, message: servicesMessage });
  } catch (error) {
    console.error("[WhatsApp Chatbot] Error fetching services:", error);
    await sendWhatsAppMessage({
      to: from,
      message: "Sorry, I couldn't fetch the services list. Please try again later.\n\nعذراً، لم أتمكن من جلب قائمة الخدمات. يرجى المحاولة لاحقاً."
    });
  }
}

/**
 * Send booking instructions
 */
async function sendBookingInstructions(from: string): Promise<void> {
  const bookingMessage = `📅 *Make a Booking / حجز موعد*

To make a booking, please visit our website:
لحجز موعد، يرجى زيارة موقعنا الإلكتروني:

🌐 https://housekeeping-service-website.manus.space

Or call us directly:
أو اتصل بنا مباشرة:

📞 +971 XX XXX XXXX

We'll confirm your booking via WhatsApp!
سنؤكد حجزك عبر واتساب!`;

  await sendWhatsAppMessage({ to: from, message: bookingMessage });
}

/**
 * Send contact information
 */
async function sendContactInfo(from: string): Promise<void> {
  const contactMessage = `📞 *Contact Us / تواصل معنا*

*BOB Home Care*
بوب للعناية المنزلية

📧 Email: info@bobhomecare.com
📱 WhatsApp: This number
🌐 Website: https://housekeeping-service-website.manus.space

*Business Hours:*
ساعات العمل:
🕐 Sunday - Thursday: 8:00 AM - 8:00 PM
🕐 Friday - Saturday: 10:00 AM - 6:00 PM

We're here to help! / نحن هنا للمساعدة!`;

  await sendWhatsAppMessage({ to: from, message: contactMessage });
}
