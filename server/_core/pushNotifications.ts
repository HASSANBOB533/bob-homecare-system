/**
 * Push Notifications Module
 * Handles web push notifications for booking updates and reminders
 */

import webpush from 'web-push';
import { db } from '../db';
import { pushSubscriptions } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

// VAPID keys for push notifications
// Generate with: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@bobhomecare.com';

// Configure web-push
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    VAPID_SUBJECT,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: Record<string, any>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  tag?: string;
  requireInteraction?: boolean;
}

/**
 * Send push notification to a specific user
 */
export async function sendPushNotification(
  userId: number,
  payload: PushNotificationPayload
): Promise<{ success: boolean; sent: number; failed: number }> {
  try {
    // Get all push subscriptions for the user
    const subscriptions = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));

    if (subscriptions.length === 0) {
      console.log(`[Push] No subscriptions found for user ${userId}`);
      return { success: true, sent: 0, failed: 0 };
    }

    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/icons/icon-192x192.png',
      badge: payload.badge || '/icons/icon-96x96.png',
      image: payload.image,
      data: payload.data || {},
      actions: payload.actions || [],
      tag: payload.tag || 'bob-notification',
      requireInteraction: payload.requireInteraction || false,
    });

    let sent = 0;
    let failed = 0;

    // Send to all user's subscriptions
    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          };

          await webpush.sendNotification(pushSubscription, notificationPayload);
          sent++;
          console.log(`[Push] Notification sent to subscription ${sub.id}`);
        } catch (error: any) {
          failed++;
          console.error(`[Push] Failed to send to subscription ${sub.id}:`, error);

          // Remove invalid subscriptions (410 Gone or 404 Not Found)
          if (error.statusCode === 410 || error.statusCode === 404) {
            console.log(`[Push] Removing invalid subscription ${sub.id}`);
            await db
              .delete(pushSubscriptions)
              .where(eq(pushSubscriptions.id, sub.id));
          }
        }
      })
    );

    return { success: true, sent, failed };
  } catch (error) {
    console.error('[Push] Error sending push notification:', error);
    return { success: false, sent: 0, failed: 0 };
  }
}

/**
 * Send booking confirmation notification
 */
export async function sendBookingConfirmationPush(
  userId: number,
  bookingDetails: {
    bookingId: number;
    serviceName: string;
    dateTime: Date;
    address: string;
  }
): Promise<void> {
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

  await sendPushNotification(userId, {
    title: '✅ Booking Confirmed!',
    body: `Your ${bookingDetails.serviceName} is scheduled for ${formattedDate} at ${formattedTime}`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    data: {
      type: 'booking-confirmation',
      bookingId: bookingDetails.bookingId,
      url: '/my-bookings',
    },
    actions: [
      {
        action: 'view',
        title: 'View Booking',
      },
      {
        action: 'close',
        title: 'Close',
      },
    ],
    tag: `booking-${bookingDetails.bookingId}`,
    requireInteraction: true,
  });
}

/**
 * Send booking reminder notification (24 hours before)
 */
export async function sendBookingReminderPush(
  userId: number,
  bookingDetails: {
    bookingId: number;
    serviceName: string;
    dateTime: Date;
  }
): Promise<void> {
  const formattedTime = bookingDetails.dateTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  await sendPushNotification(userId, {
    title: '⏰ Booking Reminder',
    body: `Your ${bookingDetails.serviceName} is tomorrow at ${formattedTime}`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    data: {
      type: 'booking-reminder',
      bookingId: bookingDetails.bookingId,
      url: '/my-bookings',
    },
    actions: [
      {
        action: 'view',
        title: 'View Details',
      },
      {
        action: 'close',
        title: 'Dismiss',
      },
    ],
    tag: `reminder-${bookingDetails.bookingId}`,
  });
}

/**
 * Send booking status update notification
 */
export async function sendBookingStatusPush(
  userId: number,
  bookingDetails: {
    bookingId: number;
    serviceName: string;
    status: string;
  }
): Promise<void> {
  const statusMessages: Record<string, { title: string; emoji: string }> = {
    confirmed: { title: 'Booking Confirmed', emoji: '✅' },
    'in-progress': { title: 'Service In Progress', emoji: '🧹' },
    completed: { title: 'Service Completed', emoji: '✨' },
    cancelled: { title: 'Booking Cancelled', emoji: '❌' },
  };

  const statusInfo = statusMessages[bookingDetails.status] || {
    title: 'Booking Updated',
    emoji: '📋',
  };

  await sendPushNotification(userId, {
    title: `${statusInfo.emoji} ${statusInfo.title}`,
    body: `Your ${bookingDetails.serviceName} status has been updated`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    data: {
      type: 'booking-status',
      bookingId: bookingDetails.bookingId,
      status: bookingDetails.status,
      url: '/my-bookings',
    },
    actions: [
      {
        action: 'view',
        title: 'View Booking',
      },
    ],
    tag: `status-${bookingDetails.bookingId}`,
  });
}

/**
 * Send promotional notification
 */
export async function sendPromotionalPush(
  userId: number,
  promotion: {
    title: string;
    message: string;
    url?: string;
    imageUrl?: string;
  }
): Promise<void> {
  await sendPushNotification(userId, {
    title: promotion.title,
    body: promotion.message,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    image: promotion.imageUrl,
    data: {
      type: 'promotional',
      url: promotion.url || '/',
    },
    actions: [
      {
        action: 'view',
        title: 'View Offer',
      },
      {
        action: 'close',
        title: 'Dismiss',
      },
    ],
    tag: 'promotional',
  });
}

/**
 * Get VAPID public key for client-side subscription
 */
export function getVapidPublicKey(): string {
  return VAPID_PUBLIC_KEY;
}

/**
 * Check if push notifications are configured
 */
export function isPushNotificationsEnabled(): boolean {
  return Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);
}
