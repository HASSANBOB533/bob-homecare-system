import { describe, it, expect, beforeEach } from "vitest";
import { getDb } from "./db";
import { eq } from "drizzle-orm";

describe("Admin Bookings Management", () => {
  let testServiceId: number;
  let testUserId: number;
  let testBookingId: number;

  beforeEach(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const { services, users, bookings } = await import("../drizzle/schema");

    // Create test service
    await db.insert(services).values({
      name: "Test Admin Service",
      nameEn: "Test Admin Service",
      description: "Test service for admin bookings",
      descriptionEn: "Test service for admin bookings",
      price: 150000, // 1500 EGP
      pricingType: "BEDROOM_BASED",
    });
    
    const servicesList = await db.select().from(services).where(eq(services.name, "Test Admin Service"));
    testServiceId = servicesList[0].id;

    // Create test user
    const uniqueOpenId = `test-admin-${Date.now()}`;
    await db.insert(users).values({
      openId: uniqueOpenId,
      name: "Test Customer",
      email: `${uniqueOpenId}@example.com`,
      role: "user",
    });
    
    const usersList = await db.select().from(users).where(eq(users.openId, uniqueOpenId));
    testUserId = usersList[0].id;

    // Create test booking with pricing breakdown
    await db.insert(bookings).values({
      userId: testUserId,
      serviceId: testServiceId,
      customerName: "Test Customer",
      phone: "+201234567890",
      address: "123 Test Street",
      dateTime: new Date("2025-12-25T10:00:00"),
      status: "pending",
      amount: 250000, // 2500 EGP
      pricingBreakdown: JSON.stringify({
        basePrice: 2500,
        addOnsTotal: 0,
        packageDiscount: 0,
        specialOfferAdjustment: 0,
        finalPrice: 2500,
        selections: {
          bedrooms: "3",
          addOns: [],
        },
      }),
    });
    
    const bookingsList = await db.select().from(bookings).where(eq(bookings.userId, testUserId));
    testBookingId = bookingsList[0].id;
  });

  it("should get all bookings for admin", async () => {
    const { getAllBookings } = await import("./db");
    const bookings = await getAllBookings();

    expect(bookings).toBeDefined();
    expect(Array.isArray(bookings)).toBe(true);
    expect(bookings.length).toBeGreaterThan(0);

    const testBooking = bookings.find((b: any) => b.id === testBookingId);
    expect(testBooking).toBeDefined();
    expect(testBooking?.customerName).toBe("Test Customer");
    expect(testBooking?.amount).toBe(250000);
  });

  it("should include pricing breakdown in booking data", async () => {
    const { getAllBookings } = await import("./db");
    const bookings = await getAllBookings();

    const testBooking = bookings.find((b: any) => b.id === testBookingId);
    expect(testBooking?.pricingBreakdown).toBeDefined();
    expect(testBooking?.pricingBreakdown.basePrice).toBe(2500);
    expect(testBooking?.pricingBreakdown.finalPrice).toBe(2500);
    expect(testBooking?.pricingBreakdown.selections.bedrooms).toBe("3");
  });

  it("should update booking status", async () => {
    const { updateBooking, getBookingById } = await import("./db");

    await updateBooking(testBookingId, { status: "confirmed" });

    const updatedBooking = await getBookingById(testBookingId);
    expect(updatedBooking?.status).toBe("confirmed");
  });

  it("should calculate total revenue from completed bookings", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const { bookings } = await import("../drizzle/schema");

    // Mark booking as completed
    await db
      .update(bookings)
      .set({ status: "completed" })
      .where(eq(bookings.id, testBookingId));

    const { getAllBookings } = await import("./db");
    const allBookings = await getAllBookings();

    const completedBookings = allBookings.filter((b: any) => b.status === "completed");
    const totalRevenue = completedBookings.reduce(
      (sum: number, b: any) => sum + (b.amount || 0),
      0
    );

    expect(totalRevenue).toBeGreaterThanOrEqual(250000); // At least our test booking
  });

  it("should filter bookings by status", async () => {
    const { getAllBookings } = await import("./db");
    const allBookings = await getAllBookings();

    const pendingBookings = allBookings.filter((b: any) => b.status === "pending");
    const confirmedBookings = allBookings.filter((b: any) => b.status === "confirmed");

    expect(Array.isArray(pendingBookings)).toBe(true);
    expect(Array.isArray(confirmedBookings)).toBe(true);

    // Our test booking should be in pending
    const testBooking = pendingBookings.find((b: any) => b.id === testBookingId);
    expect(testBooking).toBeDefined();
  });

  it("should include service details in booking data", async () => {
    const { getAllBookings } = await import("./db");
    const bookings = await getAllBookings();

    const testBooking = bookings.find((b: any) => b.id === testBookingId);
    expect(testBooking?.service).toBeDefined();
    expect(testBooking?.service.name).toBe("Test Admin Service");
    expect(testBooking?.service.nameEn).toBe("Test Admin Service");
  });

  it("should handle bookings without pricing breakdown (legacy)", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const { bookings } = await import("../drizzle/schema");

    // Create legacy booking without pricing breakdown
    await db.insert(bookings).values({
      userId: testUserId,
      serviceId: testServiceId,
      customerName: "Legacy Customer",
      phone: "+201234567891",
      address: "456 Legacy Street",
      dateTime: new Date("2025-12-26T11:00:00"),
      status: "pending",
      amount: null, // No amount
      pricingBreakdown: null, // No breakdown
    });

    const { getAllBookings } = await import("./db");
    const allBookings = await getAllBookings();

    const legacy = allBookings.find((b: any) => b.customerName === "Legacy Customer");
    expect(legacy).toBeDefined();
    expect(legacy?.amount).toBeNull();
    expect(legacy?.pricingBreakdown).toBeNull();
  });

  it("should update booking to cancelled status", async () => {
    const { updateBooking, getBookingById } = await import("./db");

    await updateBooking(testBookingId, { status: "cancelled" });

    const cancelledBooking = await getBookingById(testBookingId);
    expect(cancelledBooking?.status).toBe("cancelled");
  });
});
