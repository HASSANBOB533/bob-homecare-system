import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { upsertUser, getUserByOpenId } from "./db";

describe("bookings.reschedule", () => {
  let adminUserId: number;
  let regularUserId: number;
  let bookingId: number;

  beforeAll(async () => {
    // Create admin user
    await upsertUser({
      openId: "test-admin-reschedule",
      name: "Admin User",
      email: "admin-reschedule@test.com",
      role: "admin",
    });
    const adminUser = await getUserByOpenId("test-admin-reschedule");
    if (!adminUser) throw new Error("Failed to create admin user");
    adminUserId = adminUser.id;

    // Create regular user
    await upsertUser({
      openId: "test-user-reschedule",
      name: "Regular User",
      email: "user-reschedule@test.com",
      role: "user",
    });
    const regularUser = await getUserByOpenId("test-user-reschedule");
    if (!regularUser) throw new Error("Failed to create regular user");
    regularUserId = regularUser.id;

    // Create a test booking
    const { createBooking } = await import("./db");
    const booking = await createBooking({
      userId: regularUserId,
      serviceId: null,
      customerName: "Test Customer",
      phone: "+1234567890",
      address: "123 Test St",
      dateTime: new Date("2025-12-15T10:00:00Z"),
      status: "pending",
      amount: 100,
      pricingBreakdown: null,
    });
    bookingId = booking.id;
  });

  it("should allow admin to reschedule booking", async () => {
    const adminCtx: TrpcContext = {
      user: {
        id: adminUserId,
        openId: "test-admin-reschedule",
        name: "Admin User",
        email: "admin-reschedule@test.com",
        role: "admin",
      },
    };

    const caller = appRouter.createCaller(adminCtx);
    const newDateTime = "2025-12-20T14:00:00Z";

    const result = await caller.bookings.reschedule({
      id: bookingId,
      dateTime: newDateTime,
    });

    expect(result).toEqual({ success: true });

    // Verify the booking was updated
    const { getBookingById } = await import("./db");
    const updatedBooking = await getBookingById(bookingId);
    expect(updatedBooking).toBeDefined();
    expect(new Date(updatedBooking!.dateTime).toISOString()).toContain("2025-12-20T14:00:00");
  });

  it("should not allow regular user to reschedule booking", async () => {
    const userCtx: TrpcContext = {
      user: {
        id: regularUserId,
        openId: "test-user-reschedule",
        name: "Regular User",
        email: "user-reschedule@test.com",
        role: "user",
      },
    };

    const caller = appRouter.createCaller(userCtx);

    await expect(
      caller.bookings.reschedule({
        id: bookingId,
        dateTime: "2025-12-25T10:00:00Z",
      })
    ).rejects.toThrow("Only admins can reschedule bookings");
  });

  it("should return error for non-existent booking", async () => {
    const adminCtx: TrpcContext = {
      user: {
        id: adminUserId,
        openId: "test-admin-reschedule",
        name: "Admin User",
        email: "admin-reschedule@test.com",
        role: "admin",
      },
    };

    const caller = appRouter.createCaller(adminCtx);

    await expect(
      caller.bookings.reschedule({
        id: 999999,
        dateTime: "2025-12-25T10:00:00Z",
      })
    ).rejects.toThrow("Booking not found");
  });
});
