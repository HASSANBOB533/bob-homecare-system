import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { Context } from "./_core/context";

describe("Booking with Pricing Integration", () => {
  let testServiceId: number;
  let testUserId: number;

  beforeAll(async () => {
    const { getDb } = await import("./db");
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const { services, users } = await import("../drizzle/schema");

    // Create a test service with bedroom-based pricing
    const serviceResult = await db.insert(services).values({
      name: "Test Pricing Service",
      nameEn: "Test Pricing Service",
      description: "Test service for pricing integration",
      descriptionEn: "Test service for pricing integration",
      duration: 120,
      pricingType: "BEDROOM_BASED",
    });
    testServiceId = serviceResult[0].insertId;

    // Create pricing tiers for the service
    const { pricingTiers } = await import("../drizzle/schema");
    await db.insert(pricingTiers).values([
      { serviceId: testServiceId, bedrooms: 1, price: 150000 }, // 1500 EGP in cents
      { serviceId: testServiceId, bedrooms: 2, price: 200000 }, // 2000 EGP
      { serviceId: testServiceId, bedrooms: 3, price: 250000 }, // 2500 EGP
    ]);

    // Create an add-on for testing
    const { addOns } = await import("../drizzle/schema");
    await db.insert(addOns).values({
      serviceId: testServiceId,
      name: "Test Add-on",
      nameEn: "Test Add-on",
      description: "Test add-on",
      descriptionEn: "Test add-on",
      price: 25000, // 250 EGP
    });

    // Create a test user with unique openId
    const uniqueOpenId = `test-pricing-user-${Date.now()}`;
    const userResult = await db.insert(users).values({
      openId: uniqueOpenId,
      name: "Test Pricing User",
      email: `pricing-${Date.now()}@test.com`,
      role: "user",
    });
    testUserId = userResult[0].insertId;
  });

  it("should create booking with correct price (bedroom-based)", async () => {
    const caller = appRouter.createCaller({
      user: null,
    } as Context);

    const booking = await caller.bookings.createPublic({
      serviceId: testServiceId,
      date: "2025-12-25",
      time: "10:00",
      customerName: "Test Customer",
      customerEmail: "customer@test.com",
      phone: "+201234567890",
      address: "123 Test Street",
      notes: "Test booking with pricing",
      amount: 250000, // 2500 EGP for 3 bedrooms
      pricingBreakdown: {
        basePrice: 2500,
        addOnsTotal: 0,
        packageDiscount: 0,
        specialOfferAdjustment: 0,
        finalPrice: 2500,
        selections: {
          bedrooms: "3",
          squareMeters: 0,
          selectedItems: [],
          addOns: [],
          packageDiscountPercent: 0,
          specialOfferId: null,
        },
      },
    });

    expect(booking).toBeDefined();
    expect(booking.id).toBeDefined();

    // Verify booking was stored with correct price
    const { getDb } = await import("./db");
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const { bookings } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    const storedBooking = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, booking.id))
      .limit(1);

    expect(storedBooking).toHaveLength(1);
    expect(storedBooking[0].amount).toBe(250000); // Stored in cents
    expect(storedBooking[0].pricingBreakdown).toBeDefined();
    
    const breakdown = storedBooking[0].pricingBreakdown as any;
    expect(breakdown.finalPrice).toBe(2500);
    expect(breakdown.selections.bedrooms).toBe("3");
  });

  it("should create booking with add-ons included in price", async () => {
    const { getDb } = await import("./db");
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const { addOns } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const addOnsList = await db.select().from(addOns).where(eq(addOns.serviceId, testServiceId));
    const testAddOn = addOnsList[0];

    const caller = appRouter.createCaller({
      user: null,
    } as Context);

    const booking = await caller.bookings.createPublic({
      serviceId: testServiceId,
      date: "2025-12-26",
      time: "14:00",
      customerName: "Test Customer 2",
      customerEmail: "customer2@test.com",
      phone: "+201234567891",
      address: "456 Test Avenue",
      amount: 175000, // 1500 (base) + 250 (add-on) = 1750 EGP
      pricingBreakdown: {
        basePrice: 1500,
        addOnsTotal: 250,
        packageDiscount: 0,
        specialOfferAdjustment: 0,
        finalPrice: 1750,
        selections: {
          bedrooms: "1",
          squareMeters: 0,
          selectedItems: [],
          addOns: [
            {
              addOnId: testAddOn.id,
              name: testAddOn.nameEn,
              price: 250,
            },
          ],
          packageDiscountPercent: 0,
          specialOfferId: null,
        },
      },
    });

    expect(booking).toBeDefined();
    expect(booking.id).toBeDefined();

    // Verify pricing breakdown includes add-on
    const { bookings } = await import("../drizzle/schema");

    const storedBooking = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, booking.id))
      .limit(1);

    const breakdown = storedBooking[0].pricingBreakdown as any;
    expect(breakdown.addOnsTotal).toBe(250);
    expect(breakdown.selections.addOns).toHaveLength(1);
    expect(breakdown.selections.addOns[0].addOnId).toBe(testAddOn.id);
  });

  it("should create booking with package discount applied", async () => {
    const caller = appRouter.createCaller({
      user: null,
    } as Context);

    // 2000 EGP base - 10% discount = 1800 EGP
    const booking = await caller.bookings.createPublic({
      serviceId: testServiceId,
      date: "2025-12-27",
      time: "16:00",
      customerName: "Test Customer 3",
      customerEmail: "customer3@test.com",
      phone: "+201234567892",
      address: "789 Test Boulevard",
      amount: 180000, // 1800 EGP after 10% discount
      pricingBreakdown: {
        basePrice: 2000,
        addOnsTotal: 0,
        packageDiscount: 200,
        specialOfferAdjustment: 0,
        finalPrice: 1800,
        selections: {
          bedrooms: "2",
          squareMeters: 0,
          selectedItems: [],
          addOns: [],
          packageDiscountPercent: 10,
          specialOfferId: null,
        },
      },
    });

    expect(booking).toBeDefined();

    // Verify discount was applied correctly
    const { getDb } = await import("./db");
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const { bookings } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    const storedBooking = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, booking.id))
      .limit(1);

    const breakdown = storedBooking[0].pricingBreakdown as any;
    expect(breakdown.packageDiscount).toBe(200);
    expect(breakdown.finalPrice).toBe(1800);
    expect(breakdown.selections.packageDiscountPercent).toBe(10);
  });

  it("should handle booking without pricing data (legacy support)", async () => {
    const caller = appRouter.createCaller({
      user: null,
    } as Context);

    const booking = await caller.bookings.createPublic({
      serviceId: testServiceId,
      date: "2025-12-28",
      time: "11:00",
      customerName: "Legacy Customer",
      customerEmail: "legacy@test.com",
      phone: "+201234567893",
      address: "321 Legacy Street",
      // No amount or pricingBreakdown provided
    });

    expect(booking).toBeDefined();
    expect(booking.id).toBeDefined();

    // Verify booking was created without pricing data
    const { getDb } = await import("./db");
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const { bookings } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    const storedBooking = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, booking.id))
      .limit(1);

    expect(storedBooking[0].amount).toBeNull();
    expect(storedBooking[0].pricingBreakdown).toBeNull();
  });

  it("should store complex pricing breakdown with all fields", async () => {
    const { getDb } = await import("./db");
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const { addOns, specialOffers } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const addOnsList = await db.select().from(addOns).where(eq(addOns.serviceId, testServiceId));
    const testAddOn = addOnsList[0];

    // Create a special offer
    const offerResult = await db.insert(specialOffers).values({
      name: "Test Referral Offer",
      nameEn: "Test Referral Offer",
      description: "10% discount",
      descriptionEn: "10% discount",
      offerType: "REFERRAL",
      discountType: "percentage",
      discountValue: 10,
      maxDiscount: 50000, // 500 EGP max
    });
    const testOfferId = offerResult[0].insertId;

    const caller = appRouter.createCaller({
      user: null,
    } as Context);

    // Complex scenario: 2500 base + 250 add-on = 2750
    // Package discount 5% = 137.5
    // Subtotal after package = 2612.5
    // Special offer 10% = 261.25
    // Final = 2351.25 ≈ 2351 EGP
    const booking = await caller.bookings.createPublic({
      serviceId: testServiceId,
      date: "2025-12-29",
      time: "13:00",
      customerName: "Complex Customer",
      customerEmail: "complex@test.com",
      phone: "+201234567894",
      address: "555 Complex Street",
      amount: 235100, // 2351 EGP
      pricingBreakdown: {
        basePrice: 2500,
        addOnsTotal: 250,
        packageDiscount: 138,
        specialOfferAdjustment: 261,
        finalPrice: 2351,
        selections: {
          bedrooms: "3",
          squareMeters: 0,
          selectedItems: [],
          addOns: [
            {
              addOnId: testAddOn.id,
              name: testAddOn.nameEn,
              price: 250,
            },
          ],
          packageDiscountPercent: 5,
          specialOfferId: testOfferId,
        },
      },
    });

    expect(booking).toBeDefined();

    // Verify all pricing details are stored correctly
    const { bookings } = await import("../drizzle/schema");

    const storedBooking = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, booking.id))
      .limit(1);

    expect(storedBooking[0].amount).toBe(235100);
    
    const breakdown = storedBooking[0].pricingBreakdown as any;
    expect(breakdown.basePrice).toBe(2500);
    expect(breakdown.addOnsTotal).toBe(250);
    expect(breakdown.packageDiscount).toBe(138);
    expect(breakdown.specialOfferAdjustment).toBe(261);
    expect(breakdown.finalPrice).toBe(2351);
    expect(breakdown.selections.bedrooms).toBe("3");
    expect(breakdown.selections.addOns).toHaveLength(1);
    expect(breakdown.selections.packageDiscountPercent).toBe(5);
    expect(breakdown.selections.specialOfferId).toBe(testOfferId);
  });
});
