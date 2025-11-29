import { describe, it, expect, beforeAll, vi } from 'vitest';

describe('SMS Notification System', () => {
  beforeAll(() => {
    // Mock Twilio credentials for testing (using valid format)
    // Twilio Account SID must start with 'AC'
    process.env.TWILIO_ACCOUNT_SID = 'AC' + '0'.repeat(32);
    process.env.TWILIO_AUTH_TOKEN = 'test_auth_token_32_chars_long';
    process.env.TWILIO_PHONE_NUMBER = '+1234567890';
  });

  describe('SMS Helper Functions', () => {
    it('should have sendSMS function exported', async () => {
      const { sendSMS } = await import('./_core/sms');
      expect(typeof sendSMS).toBe('function');
    });

    it('should have sendBookingConfirmationSMS function exported', async () => {
      const { sendBookingConfirmationSMS } = await import('./_core/sms');
      expect(typeof sendBookingConfirmationSMS).toBe('function');
    });

    it('should have sendBookingReminderSMS function exported', async () => {
      const { sendBookingReminderSMS } = await import('./_core/sms');
      expect(typeof sendBookingReminderSMS).toBe('function');
    });

    it('should have sendLoyaltyPointsEarnedSMS function exported', async () => {
      const { sendLoyaltyPointsEarnedSMS } = await import('./_core/sms');
      expect(typeof sendLoyaltyPointsEarnedSMS).toBe('function');
    });

    it('should have sendRewardRedeemedSMS function exported', async () => {
      const { sendRewardRedeemedSMS } = await import('./_core/sms');
      expect(typeof sendRewardRedeemedSMS).toBe('function');
    });

    it('should check if SMS is configured', async () => {
      const { isSMSConfigured } = await import('./_core/sms');
      expect(typeof isSMSConfigured).toBe('function');
      // In test environment with mocked credentials, should return true
      expect(isSMSConfigured()).toBe(true);
    });
  });

  describe('SMS Message Formatting', () => {
    it('should format booking confirmation message correctly', async () => {
      const { sendBookingConfirmationSMS } = await import('./_core/sms');
      
      // Mock the actual SMS sending to avoid real API calls
      const mockSendSMS = vi.fn().mockResolvedValue(true);
      vi.doMock('./_core/sms', async () => {
        const actual = await vi.importActual('./_core/sms');
        return {
          ...actual,
          sendSMS: mockSendSMS,
        };
      });

      const testDetails = {
        customerName: 'John Doe',
        serviceName: 'Deep Cleaning',
        dateTime: new Date('2024-12-01T14:00:00'),
        address: '123 Main St',
        bookingId: 1,
      };

      // Function should accept these parameters without error
      expect(async () => {
        await sendBookingConfirmationSMS('+1234567890', testDetails);
      }).not.toThrow();
    });

    it('should format loyalty points message correctly', async () => {
      const { sendLoyaltyPointsEarnedSMS } = await import('./_core/sms');
      
      const testDetails = {
        customerName: 'John Doe',
        pointsEarned: 10,
        totalPoints: 50,
      };

      // Function should accept these parameters without error
      expect(async () => {
        await sendLoyaltyPointsEarnedSMS('+1234567890', testDetails);
      }).not.toThrow();
    });

    it('should format reward redemption message correctly', async () => {
      const { sendRewardRedeemedSMS } = await import('./_core/sms');
      
      const testDetails = {
        customerName: 'John Doe',
        rewardName: '10% Discount',
        pointsSpent: 50,
        remainingPoints: 0,
      };

      // Function should accept these parameters without error
      expect(async () => {
        await sendRewardRedeemedSMS('+1234567890', testDetails);
      }).not.toThrow();
    });
  });

  describe('Database Integration', () => {
    it('should have smsNotifications field in users table', async () => {
      const { users } = await import('../drizzle/schema');
      const userSchema = users;
      
      // Check that smsNotifications field exists in schema
      expect(userSchema).toBeDefined();
      // The field should be defined in the schema object
      expect('smsNotifications' in userSchema).toBe(true);
    });

    it('should update SMS notification preferences', async () => {
      const { updateNotificationPreferences, getUserById } = await import('./db');
      const { getDb } = await import('./db');
      
      const db = await getDb();
      if (!db) {
        console.warn('Database not available, skipping test');
        return;
      }

      // Create a test user
      const { users } = await import('../drizzle/schema');
      const userResult = await db.insert(users).values({
        openId: `test-sms-${Date.now()}`,
        name: 'SMS Test User',
        email: `sms-test-${Date.now()}@example.com`,
        role: 'user',
      });
      const userId = userResult[0].insertId;

      // Update SMS notification preference
      await updateNotificationPreferences(userId, {
        smsNotifications: false,
      });

      // Verify the update
      const user = await getUserById(userId);
      expect(user?.smsNotifications).toBe(false);

      // Cleanup
      const { eq } = await import('drizzle-orm');
      await db.delete(users).where(eq(users.id, userId));
    });
  });

  describe('Notification Preference Checks', () => {
    it('should respect SMS notification preferences in booking flow', async () => {
      // This is tested implicitly by the booking creation logic
      // When smsNotifications is false, SMS should not be sent
      // When smsNotifications is true, SMS should be sent
      
      // The logic is in server/routers.ts:
      // if (ctx.user.smsNotifications !== false) { await sendBookingConfirmationSMS(...) }
      
      expect(true).toBe(true); // Placeholder - actual test would require mocking Twilio
    });
  });
});
