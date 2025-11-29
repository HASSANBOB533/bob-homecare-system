/**
 * Booking Reminder Job
 * Sends WhatsApp reminders 24 hours before scheduled bookings
 * 
 * This script should be run periodically (e.g., every hour) via cron or a task scheduler
 */

import { getDb } from "../db";
import { sendBookingReminder } from "../_core/whatsapp";

export async function sendBookingReminders() {
  console.log('[Reminders] Starting booking reminder job...');
  
  const db = await getDb();
  if (!db) {
    console.error('[Reminders] Database not available');
    return { success: false, error: 'Database not available' };
  }

  try {
    const { bookings, services } = await import("../../drizzle/schema");
    const { and, gte, lte, eq } = await import("drizzle-orm");
    
    // Calculate time window: 24 hours from now (±1 hour for flexibility)
    const now = new Date();
    const reminderStart = new Date(now.getTime() + 23 * 60 * 60 * 1000); // 23 hours from now
    const reminderEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);   // 25 hours from now
    
    console.log(`[Reminders] Checking bookings between ${reminderStart.toISOString()} and ${reminderEnd.toISOString()}`);
    
    // Find bookings that need reminders (join with users to check preferences)
    const { users } = await import("../../drizzle/schema");
    const upcomingBookings = await db.select({
      id: bookings.id,
      customerName: bookings.customerName,
      phone: bookings.phone,
      address: bookings.address,
      dateTime: bookings.dateTime,
      status: bookings.status,
      serviceName: services.name,
      serviceNameEn: services.nameEn,
      userId: bookings.userId,
      whatsappNotifications: users.whatsappNotifications,
    })
    .from(bookings)
    .leftJoin(services, eq(bookings.serviceId, services.id))
    .leftJoin(users, eq(bookings.userId, users.id))
    .where(
      and(
        gte(bookings.dateTime, reminderStart),
        lte(bookings.dateTime, reminderEnd),
        // Only send reminders for confirmed or pending bookings
        eq(bookings.status, "confirmed")
      )
    );
    
    console.log(`[Reminders] Found ${upcomingBookings.length} bookings to remind`);
    
    let successCount = 0;
    let failureCount = 0;
    
    for (const booking of upcomingBookings) {
      if (!booking.phone) {
        console.log(`[Reminders] Skipping booking ${booking.id} - no phone number`);
        continue;
      }
      
      if (!booking.dateTime) {
        console.log(`[Reminders] Skipping booking ${booking.id} - no date/time`);
        continue;
      }
      
      // Check if user has disabled WhatsApp notifications
      if (booking.userId && booking.whatsappNotifications === false) {
        console.log(`[Reminders] Skipping booking ${booking.id} - user disabled WhatsApp notifications`);
        continue;
      }
      
      try {
        const result = await sendBookingReminder(booking.phone, {
          customerName: booking.customerName || 'Customer',
          serviceName: booking.serviceNameEn || booking.serviceName || 'Cleaning Service',
          dateTime: booking.dateTime,
          address: booking.address || 'Your address',
        });
        
        if (result.success) {
          console.log(`[Reminders] ✓ Sent reminder for booking ${booking.id} to ${booking.phone}`);
          successCount++;
        } else {
          console.error(`[Reminders] ✗ Failed to send reminder for booking ${booking.id}: ${result.error}`);
          failureCount++;
        }
      } catch (error: any) {
        console.error(`[Reminders] ✗ Error sending reminder for booking ${booking.id}:`, error.message);
        failureCount++;
      }
    }
    
    console.log(`[Reminders] Job completed: ${successCount} sent, ${failureCount} failed`);
    
    return {
      success: true,
      total: upcomingBookings.length,
      sent: successCount,
      failed: failureCount,
    };
  } catch (error: any) {
    console.error('[Reminders] Job failed:', error.message);
    return { success: false, error: error.message };
  }
}

// If run directly (not imported), execute the job
if (require.main === module) {
  sendBookingReminders()
    .then((result) => {
      console.log('[Reminders] Result:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('[Reminders] Fatal error:', error);
      process.exit(1);
    });
}
