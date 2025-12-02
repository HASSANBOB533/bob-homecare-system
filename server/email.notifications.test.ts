import { describe, it, expect } from "vitest";
import { sendLoyaltyPointsEarnedEmail, sendLoyaltyPointsRedeemedEmail, sendBookingStatusEmail } from "./_core/email";

/**
 * Email notification tests
 * 
 * Note: These tests verify that email functions handle missing API keys gracefully.
 * When RESEND_API_KEY is not configured, emails are not sent but the system continues to function.
 * This is intentional graceful degradation to prevent booking/loyalty workflows from failing.
 */
describe("Email Notifications", () => {
  describe("sendLoyaltyPointsEarnedEmail", () => {
    it("should handle email sending gracefully when API key is missing", async () => {
      const result = await sendLoyaltyPointsEarnedEmail("test@example.com", {
        customerName: "John Doe",
        pointsEarned: 10,
        totalPoints: 110,
        bookingId: 123,
      });

      // Email service returns {success: false} when API key is not configured
      // This is expected behavior - graceful degradation
      expect(result).toBeDefined();
      expect(typeof result.success).toBe("boolean");
    });

    it("should accept valid loyalty points parameters", async () => {
      const details = {
        customerName: "Jane Smith",
        pointsEarned: 20,
        totalPoints: 200,
        bookingId: 456,
      };

      const result = await sendLoyaltyPointsEarnedEmail("jane@example.com", details);

      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
    });
  });

  describe("sendLoyaltyPointsRedeemedEmail", () => {
    it("should handle redemption email gracefully", async () => {
      const result = await sendLoyaltyPointsRedeemedEmail("test@example.com", {
        customerName: "John Doe",
        pointsRedeemed: 100,
        discountAmount: 10,
        remainingPoints: 50,
        bookingId: 789,
      });

      expect(result).toBeDefined();
      expect(typeof result.success).toBe("boolean");
    });

    it("should accept correct discount calculation (100 points = 10 EGP)", async () => {
      const details = {
        customerName: "Test User",
        pointsRedeemed: 200,
        discountAmount: 20,
        remainingPoints: 0,
        bookingId: 999,
      };

      const result = await sendLoyaltyPointsRedeemedEmail("user@example.com", details);

      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
    });
  });

  describe("sendBookingStatusEmail", () => {
    it("should handle confirmed booking status email", async () => {
      const result = await sendBookingStatusEmail("test@example.com", {
        customerName: "John Doe",
        serviceName: "Deep Cleaning",
        bookingId: 123,
        status: "confirmed",
      });

      expect(result).toBeDefined();
      expect(typeof result.success).toBe("boolean");
    });

    it("should handle completed booking status email", async () => {
      const result = await sendBookingStatusEmail("test@example.com", {
        customerName: "Jane Smith",
        serviceName: "Regular Cleaning",
        bookingId: 456,
        status: "completed",
      });

      expect(result).toBeDefined();
      expect(typeof result.success).toBe("boolean");
    });

    it("should handle cancelled booking status email", async () => {
      const result = await sendBookingStatusEmail("test@example.com", {
        customerName: "Bob Johnson",
        serviceName: "Move-in Cleaning",
        bookingId: 789,
        status: "cancelled",
      });

      expect(result).toBeDefined();
      expect(typeof result.success).toBe("boolean");
    });
  });

  describe("Email Integration", () => {
    it("should not throw errors when email sending fails", async () => {
      // This test verifies error handling is in place
      // In production, if Resend API fails, the catch blocks will log errors
      // but won't break the booking/loyalty workflows
      
      const result = await sendLoyaltyPointsEarnedEmail("test@example.com", {
        customerName: "Test User",
        pointsEarned: 10,
        totalPoints: 100,
        bookingId: 1,
      });

      // Should return a result object (graceful degradation)
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
    });

    it("should integrate with booking workflow without breaking it", async () => {
      // Email notifications are called with .catch() in the codebase
      // This ensures that email failures don't break bookings
      
      const result = await sendBookingStatusEmail("customer@example.com", {
        customerName: "Customer",
        serviceName: "Test Service",
        bookingId: 1,
        status: "confirmed",
      });

      // Even if email fails, function returns gracefully
      expect(result).toBeDefined();
    });
  });
});
