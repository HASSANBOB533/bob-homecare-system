import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { Context } from "./_core/context";
import * as db from "./db";

describe("Delete Booking Functionality", () => {
  let testBookingId: number;
  let testUserId: number;
  let adminUserId: number;

  beforeAll(async () => {
    // Create test users
    await db.upsertUser({
      openId: "test-user-delete-booking",
      name: "Test User",
      email: "testuser@example.com",
      role: "user",
    });
    const regularUser = await db.getUserByOpenId("test-user-delete-booking");
    if (!regularUser) throw new Error("Failed to create test user");
    testUserId = regularUser.id;

    await db.upsertUser({
      openId: "test-admin-delete-booking",
      name: "Test Admin",
      email: "testadmin@example.com",
      role: "admin",
    });
    const adminUser = await db.getUserByOpenId("test-admin-delete-booking");
    if (!adminUser) throw new Error("Failed to create admin user");
    adminUserId = adminUser.id;

    // Create a test service
    const service = await db.createService({
      name: "Test Cleaning Service",
      nameEn: "Test Cleaning Service",
      description: "Test service for deletion",
      descriptionEn: "Test service for deletion",
      price: 10000,
      duration: 120,
      category: "cleaning",
      isVisible: true,
    });

    // Create a test booking
    const booking = await db.createBooking({
      userId: testUserId,
      serviceId: service.id,
      customerName: "Test Customer",
      phone: "+201234567890",
      customerEmail: "customer@example.com",
      dateTime: new Date("2025-02-01T10:00:00"),
      address: "Test Address",
      amount: 10000,
      status: "pending",
      pricingBreakdown: JSON.stringify({
        basePrice: 10000,
        total: 10000,
      }),
    });
    testBookingId = booking.id;
  });

  it("should allow admin to delete any booking", async () => {
    const mockContext: Context = {
      req: {} as any,
      res: {} as any,
      user: {
        id: adminUserId,
        openId: "test-admin-delete-booking",
        name: "Test Admin",
        email: "testadmin@example.com",
        role: "admin",
        createdAt: new Date(),
        lastSignedIn: new Date(),
        phone: null,
        loginMethod: null,
        emailVerified: false,
      },
    };

    const caller = appRouter.createCaller(mockContext);

    // Admin should be able to delete the booking
    const result = await caller.bookings.delete({ id: testBookingId });
    expect(result).toBeDefined();
    expect(result.success).toBe(true);

    // Verify booking is deleted
    const deletedBooking = await db.getBookingById(testBookingId);
    expect(deletedBooking).toBeUndefined();
  });

  it("should prevent non-admin users from deleting other users' bookings", async () => {
    // Create another booking for testing
    const service = await db.createService({
      name: "Another Test Service",
      nameEn: "Another Test Service",
      description: "Test service",
      descriptionEn: "Test service",
      price: 15000,
      duration: 120,
      category: "cleaning",
      isVisible: true,
    });

    const anotherBooking = await db.createBooking({
      userId: adminUserId, // Booking belongs to admin
      serviceId: service.id,
      customerName: "Admin Customer",
      phone: "+201234567891",
      customerEmail: "admincustomer@example.com",
      dateTime: new Date("2025-02-02T11:00:00"),
      address: "Admin Address",
      amount: 15000,
      status: "pending",
      pricingBreakdown: JSON.stringify({
        basePrice: 15000,
        total: 15000,
      }),
    });

    const mockContext: Context = {
      req: {} as any,
      res: {} as any,
      user: {
        id: testUserId,
        openId: "test-user-delete-booking",
        name: "Test User",
        email: "testuser@example.com",
        role: "user",
        createdAt: new Date(),
        lastSignedIn: new Date(),
        phone: null,
        loginMethod: null,
        emailVerified: false,
      },
    };

    const caller = appRouter.createCaller(mockContext);

    // Regular user should NOT be able to delete admin's booking
    await expect(
      caller.bookings.delete({ id: anotherBooking.id })
    ).rejects.toThrow("Not authorized");

    // Verify booking still exists
    const stillExists = await db.getBookingById(anotherBooking.id);
    expect(stillExists).toBeDefined();
  });

  it("should allow users to delete their own bookings", async () => {
    // Create a booking for the regular user
    const service = await db.createService({
      name: "User's Own Service",
      nameEn: "User's Own Service",
      description: "Test service",
      descriptionEn: "Test service",
      price: 12000,
      duration: 120,
      category: "cleaning",
      isVisible: true,
    });

    const userBooking = await db.createBooking({
      userId: testUserId,
      serviceId: service.id,
      customerName: "Own Booking",
      phone: "+201234567892",
      customerEmail: "ownbooking@example.com",
      dateTime: new Date("2025-02-03T12:00:00"),
      address: "Own Address",
      amount: 12000,
      status: "pending",
      pricingBreakdown: JSON.stringify({
        basePrice: 12000,
        total: 12000,
      }),
    });

    const mockContext: Context = {
      req: {} as any,
      res: {} as any,
      user: {
        id: testUserId,
        openId: "test-user-delete-booking",
        name: "Test User",
        email: "testuser@example.com",
        role: "user",
        createdAt: new Date(),
        lastSignedIn: new Date(),
        phone: null,
        loginMethod: null,
        emailVerified: false,
      },
    };

    const caller = appRouter.createCaller(mockContext);

    // User should be able to delete their own booking
    const result = await caller.bookings.delete({ id: userBooking.id });
    expect(result).toBeDefined();
    expect(result.success).toBe(true);

    // Verify booking is deleted
    const deletedBooking = await db.getBookingById(userBooking.id);
    expect(deletedBooking).toBeUndefined();
  });

  it("should return error when trying to delete non-existent booking", async () => {
    const mockContext: Context = {
      req: {} as any,
      res: {} as any,
      user: {
        id: adminUserId,
        openId: "test-admin-delete-booking",
        name: "Test Admin",
        email: "testadmin@example.com",
        role: "admin",
        createdAt: new Date(),
        lastSignedIn: new Date(),
        phone: null,
        loginMethod: null,
        emailVerified: false,
      },
    };

    const caller = appRouter.createCaller(mockContext);

    // Try to delete non-existent booking
    await expect(
      caller.bookings.delete({ id: 999999 })
    ).rejects.toThrow("Booking not found");
  });
});
