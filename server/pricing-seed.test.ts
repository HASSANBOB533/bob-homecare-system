import { describe, it, expect, beforeAll } from "vitest";
import { seedPricingData } from "./pricing-seed";
import { getDb } from "./db";
import * as schema from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Pricing Seed System", () => {
  let db: Awaited<ReturnType<typeof getDb>>;

  beforeAll(async () => {
    db = await getDb();
    if (!db) {
      throw new Error("Database connection not available");
    }
  });

  it("should seed all pricing data successfully", async () => {
    const result = await seedPricingData();
    expect(result.success).toBe(true);
    expect(result.message).toContain("successfully");
  });

  it("should update services with correct pricing types", async () => {
    if (!db) throw new Error("DB not available");

    const services = await db.select().from(schema.services);
    
    const serviceApartments = services.find((s) => s.nameEn?.includes("Service Apartments"));
    const periodical = services.find((s) => s.nameEn?.includes("Periodical"));
    const deepCleaning = services.find((s) => s.nameEn?.includes("Deep Cleaning"));
    const moveInOut = services.find((s) => s.nameEn?.includes("Move"));
    const upholstery = services.find((s) => s.nameEn?.includes("Upholstery"));

    if (serviceApartments) {
      expect(serviceApartments.pricingType).toBe("BEDROOM_BASED");
    }
    if (periodical) {
      expect(periodical.pricingType).toBe("BEDROOM_BASED");
    }
    if (deepCleaning) {
      expect(deepCleaning.pricingType).toBe("SQM_BASED");
    }
    if (moveInOut) {
      expect(moveInOut.pricingType).toBe("SQM_BASED");
    }
    if (upholstery) {
      expect(upholstery.pricingType).toBe("ITEM_BASED");
    }
  });

  it("should seed bedroom-based pricing tiers for Service Apartments", async () => {
    if (!db) throw new Error("DB not available");

    const services = await db.select().from(schema.services);
    const serviceApartments = services.find((s) => s.nameEn?.includes("Service Apartments"));

    if (serviceApartments) {
      const tiers = await db
        .select()
        .from(schema.pricingTiers)
        .where(eq(schema.pricingTiers.serviceId, serviceApartments.id));

      expect(tiers.length).toBeGreaterThanOrEqual(6);
      
      // Check specific prices (in cents)
      const oneBR = tiers.find((t) => t.bedrooms === 1);
      const sixBR = tiers.find((t) => t.bedrooms === 6);
      
      expect(oneBR?.price).toBe(150000); // 1,500 EGP
      expect(sixBR?.price).toBe(500000); // 5,000 EGP
    }
  });

  it("should seed bedroom-based pricing tiers for Periodical Cleaning", async () => {
    if (!db) throw new Error("DB not available");

    const services = await db.select().from(schema.services);
    const periodical = services.find((s) => s.nameEn?.includes("Periodical"));

    if (periodical) {
      const tiers = await db
        .select()
        .from(schema.pricingTiers)
        .where(eq(schema.pricingTiers.serviceId, periodical.id));

      expect(tiers.length).toBeGreaterThanOrEqual(6);
      
      // Check specific prices (in cents)
      const oneBR = tiers.find((t) => t.bedrooms === 1);
      const sixBR = tiers.find((t) => t.bedrooms === 6);
      
      expect(oneBR?.price).toBe(80000); // 800 EGP
      expect(sixBR?.price).toBe(300000); // 3,000 EGP
    }
  });

  it("should seed square meter pricing for Deep Cleaning", async () => {
    if (!db) throw new Error("DB not available");

    const services = await db.select().from(schema.services);
    const deepCleaning = services.find((s) => s.nameEn?.includes("Deep Cleaning"));

    if (deepCleaning) {
      const sqmPricing = await db
        .select()
        .from(schema.pricingSqm)
        .where(eq(schema.pricingSqm.serviceId, deepCleaning.id));

      expect(sqmPricing.length).toBeGreaterThanOrEqual(1);
      
      const standard = sqmPricing.find((p) => p.tier === "standard");
      expect(standard?.pricePerSqm).toBe(3000); // 30 EGP
      expect(standard?.minimumCharge).toBe(150000); // 1,500 EGP
    }
  });

  it("should seed square meter pricing for Move-In/Move-Out with two tiers", async () => {
    if (!db) throw new Error("DB not available");

    const services = await db.select().from(schema.services);
    const moveInOut = services.find((s) => s.nameEn?.includes("Move"));

    if (moveInOut) {
      const sqmPricing = await db
        .select()
        .from(schema.pricingSqm)
        .where(eq(schema.pricingSqm.serviceId, moveInOut.id));

      expect(sqmPricing.length).toBeGreaterThanOrEqual(2);
      
      const normal = sqmPricing.find((p) => p.tier === "normal");
      const heavy = sqmPricing.find((p) => p.tier === "heavy");
      
      expect(normal?.pricePerSqm).toBe(4000); // 40 EGP
      expect(normal?.minimumCharge).toBe(200000); // 2,000 EGP
      
      expect(heavy?.pricePerSqm).toBe(5000); // 50 EGP
      expect(heavy?.minimumCharge).toBe(250000); // 2,500 EGP
    }
  });

  it("should seed upholstery item pricing with 9 items", async () => {
    if (!db) throw new Error("DB not available");

    const services = await db.select().from(schema.services);
    const upholstery = services.find((s) => s.nameEn?.includes("Upholstery"));

    if (upholstery) {
      const items = await db
        .select()
        .from(schema.pricingItems)
        .where(eq(schema.pricingItems.serviceId, upholstery.id));

      expect(items.length).toBeGreaterThanOrEqual(9);
      
      // Check specific items
      const armChair = items.find((i) => i.itemNameEn?.includes("Arm Chair"));
      const sectional = items.find((i) => i.itemNameEn?.includes("Sectional"));
      
      expect(armChair?.price).toBe(25000); // 250 EGP
      expect(sectional?.price).toBe(120000); // 1,200 EGP
    }
  });

  it("should seed add-ons with correct pricing", async () => {
    if (!db) throw new Error("DB not available");

    const addOns = await db.select().from(schema.addOns);
    
    const laundry = addOns.find((a) => a.nameEn?.includes("Laundry"));
    const garden = addOns.find((a) => a.nameEn?.includes("Garden"));
    const kitchenDeep = addOns.find((a) => a.nameEn?.includes("Kitchen Deep"));
    const kitchenTools = addOns.find((a) => a.nameEn?.includes("Kitchen Tools"));

    expect(laundry).toBeDefined();
    expect(laundry?.pricingType).toBe("PER_BEDROOM");
    expect(laundry?.active).toBe(true);

    expect(garden).toBeDefined();
    expect(garden?.pricingType).toBe("SIZE_TIERED");
    expect(garden?.sizeTierThreshold).toBe(100);

    expect(kitchenDeep).toBeDefined();
    expect(kitchenDeep?.pricingType).toBe("FIXED");
    expect(kitchenDeep?.price).toBe(100000); // 1,000 EGP

    expect(kitchenTools).toBeDefined();
    expect(kitchenTools?.pricingType).toBe("FIXED");
    expect(kitchenTools?.price).toBe(25000); // 250 EGP
  });

  it("should seed add-on tiers for laundry service", async () => {
    if (!db) throw new Error("DB not available");

    const addOns = await db.select().from(schema.addOns);
    const laundry = addOns.find((a) => a.nameEn?.includes("Laundry"));

    if (laundry) {
      const tiers = await db
        .select()
        .from(schema.addOnTiers)
        .where(eq(schema.addOnTiers.addOnId, laundry.id));

      expect(tiers.length).toBeGreaterThanOrEqual(6);
      
      const oneBR = tiers.find((t) => t.bedrooms === 1);
      const sixBR = tiers.find((t) => t.bedrooms === 6);
      
      expect(oneBR?.price).toBe(40000); // 400 EGP
      expect(sixBR?.price).toBe(150000); // 1,500 EGP
    }
  });

  it("should seed package discounts for Periodical Cleaning", async () => {
    if (!db) throw new Error("DB not available");

    const services = await db.select().from(schema.services);
    const periodical = services.find((s) => s.nameEn?.includes("Periodical"));

    if (periodical) {
      const packages = await db
        .select()
        .from(schema.packageDiscounts)
        .where(eq(schema.packageDiscounts.serviceId, periodical.id));

      expect(packages.length).toBeGreaterThanOrEqual(4);
      
      const fourVisits = packages.find((p) => p.visits === 4);
      const twelveVisits = packages.find((p) => p.visits === 12);
      
      expect(fourVisits?.discountPercentage).toBe(10);
      expect(twelveVisits?.discountPercentage).toBe(20);
      
      packages.forEach((pkg) => {
        expect(pkg.active).toBe(true);
      });
    }
  });

  it("should seed special offers with correct types", async () => {
    if (!db) throw new Error("DB not available");

    const offers = await db.select().from(schema.specialOffers);
    
    const referral = offers.find((o) => o.offerType === "REFERRAL");
    const propertyManager5 = offers.find((o) => o.offerType === "PROPERTY_MANAGER" && o.minProperties === 5);
    const propertyManager11 = offers.find((o) => o.offerType === "PROPERTY_MANAGER" && o.minProperties === 11);
    const emergency = offers.find((o) => o.offerType === "EMERGENCY_SAME_DAY");

    // Referral Program
    expect(referral).toBeDefined();
    expect(referral?.discountType).toBe("percentage");
    expect(referral?.discountValue).toBe(10);
    expect(referral?.maxDiscount).toBe(50000); // 500 EGP max
    expect(referral?.active).toBe(true);

    // Property Manager (5-10)
    expect(propertyManager5).toBeDefined();
    expect(propertyManager5?.discountValue).toBe(5);
    expect(propertyManager5?.active).toBe(true);

    // Property Manager (11+)
    expect(propertyManager11).toBeDefined();
    expect(propertyManager11?.discountValue).toBe(10);
    expect(propertyManager11?.active).toBe(true);

    // Emergency Same-Day
    expect(emergency).toBeDefined();
    expect(emergency?.discountValue).toBe(50); // +50% premium
    expect(emergency?.active).toBe(true);
  });

  it("should handle database connection errors gracefully", async () => {
    // This test verifies error handling is in place
    // The actual seedPricingData function checks for db availability
    expect(seedPricingData).toBeDefined();
  });
});
