import { getDb } from "./db";
import * as schema from "../drizzle/schema";
import { eq } from "drizzle-orm";

// Helper function to convert EGP to cents
const toCents = (egp: number) => egp * 100;

export async function seedPricingData() {
  console.log("🌱 Seeding pricing data...\n");

  const db = await getDb();
  if (!db) {
    throw new Error("Database connection not available");
  }

  try {
    // 1. Update existing services with pricing types
    console.log("1️⃣ Updating services with pricing types...");
    
    const services = await db.select().from(schema.services);
    
    for (const service of services) {
      let pricingType: "BEDROOM_BASED" | "SQM_BASED" | "ITEM_BASED" | "FIXED" = "FIXED";
      
      if (service.nameEn?.includes("Airbnb") || service.nameEn?.includes("Hotel Apartments") || service.nameEn?.includes("Regular Cleaning")) {
        pricingType = "BEDROOM_BASED";
      } else if (service.nameEn?.includes("Deep Cleaning") || service.nameEn?.includes("Move")) {
        pricingType = "SQM_BASED";
      } else if (service.nameEn?.includes("Upholstery")) {
        pricingType = "ITEM_BASED";
      }
      
      await db.update(schema.services)
        .set({ pricingType })
        .where(eq(schema.services.id, service.id));
      
      console.log(`   ✓ ${service.nameEn}: ${pricingType}`);
    }
    
    // 2. Seed bedroom-based pricing (Service Apartments & Periodical Cleaning)
    console.log("\n2️⃣ Seeding bedroom-based pricing...");
    
    const serviceApartmentsId = services.find((s: typeof schema.services.$inferSelect) => s.nameEn?.includes("Airbnb") || s.nameEn?.includes("Hotel Apartments"))?.id;
    const periodicalCleaningId = services.find((s: typeof schema.services.$inferSelect) => s.nameEn?.includes("Regular Cleaning"))?.id;
    
    if (serviceApartmentsId) {
      const serviceApartmentsTiers = [
        { bedrooms: 1, price: toCents(1500) },
        { bedrooms: 2, price: toCents(2000) },
        { bedrooms: 3, price: toCents(2500) },
        { bedrooms: 4, price: toCents(3000) },
        { bedrooms: 5, price: toCents(4000) },
        { bedrooms: 6, price: toCents(5000) },
      ];
      
      for (const tier of serviceApartmentsTiers) {
        await db.insert(schema.pricingTiers).values({
          serviceId: serviceApartmentsId,
          ...tier,
        });
      }
      console.log(`   ✓ Service Apartments: 6 bedroom tiers added`);
    }
    
    if (periodicalCleaningId) {
      const periodicalTiers = [
        { bedrooms: 1, price: toCents(800) },
        { bedrooms: 2, price: toCents(1200) },
        { bedrooms: 3, price: toCents(1500) },
        { bedrooms: 4, price: toCents(2000) },
        { bedrooms: 5, price: toCents(2500) },
        { bedrooms: 6, price: toCents(3000) },
      ];
      
      for (const tier of periodicalTiers) {
        await db.insert(schema.pricingTiers).values({
          serviceId: periodicalCleaningId,
          ...tier,
        });
      }
      console.log(`   ✓ Periodical Cleaning: 6 bedroom tiers added`);
    }
    
    // 3. Seed square meter pricing (Deep Cleaning & Move-In/Move-Out)
    console.log("\n3️⃣ Seeding square meter pricing...");
    
    const deepCleaningId = services.find((s: typeof schema.services.$inferSelect) => s.nameEn?.includes("Deep Cleaning"))?.id;
    const moveInOutId = services.find((s: typeof schema.services.$inferSelect) => s.nameEn?.includes("Move"))?.id;
    
    if (deepCleaningId) {
      await db.insert(schema.pricingSqm).values({
        serviceId: deepCleaningId,
        pricePerSqm: toCents(30),
        minimumCharge: toCents(1500),
        tier: "standard",
      });
      console.log(`   ✓ Deep Cleaning: 30 EGP/sqm, min 1,500 EGP`);
    }
    
    if (moveInOutId) {
      await db.insert(schema.pricingSqm).values([
        {
          serviceId: moveInOutId,
          pricePerSqm: toCents(40),
          minimumCharge: toCents(2000),
          tier: "normal",
        },
        {
          serviceId: moveInOutId,
          pricePerSqm: toCents(50),
          minimumCharge: toCents(2500),
          tier: "heavy",
        },
      ]);
      console.log(`   ✓ Move-In/Move-Out: Normal 40 EGP/sqm, Heavy 50 EGP/sqm`);
    }
    
    // 4. Seed item-based pricing (Upholstery)
    console.log("\n4️⃣ Seeding upholstery item pricing...");
    
    const upholsteryId = services.find((s: typeof schema.services.$inferSelect) => s.nameEn?.includes("Upholstery"))?.id;
    
    if (upholsteryId) {
      const upholsteryItems = [
        { itemName: "كرسي / كرسي سفرة / كرسي تسريحة", itemNameEn: "Arm Chair / Dining Chair / Dressing Chair", price: toCents(250) },
        { itemName: "كرسي صالون مقعد واحد", itemNameEn: "Sofa Chair One Seat", price: toCents(350) },
        { itemName: "كنبة مقعدين", itemNameEn: "Sofa 2 Seats", price: toCents(400) },
        { itemName: "مرتبة صغيرة", itemNameEn: "Small Mattress", price: toCents(400) },
        { itemName: "كنبة 3 مقاعد", itemNameEn: "Sofa 3 Seats", price: toCents(600) },
        { itemName: "مرتبة كبيرة", itemNameEn: "Large Mattress", price: toCents(600) },
        { itemName: "كنبة 4 مقاعد", itemNameEn: "Sofa 4 Seats", price: toCents(800) },
        { itemName: "كنبة على شكل L", itemNameEn: "L-Shape Sofa", price: toCents(1000) },
        { itemName: "كنبة قطعية", itemNameEn: "Sectional Sofa", price: toCents(1200) },
      ];
      
      for (const item of upholsteryItems) {
        await db.insert(schema.pricingItems).values({
          serviceId: upholsteryId,
          ...item,
        });
      }
      console.log(`   ✓ Upholstery: 9 item types added`);
    }
    
    // 5. Seed add-ons
    console.log("\n5️⃣ Seeding add-ons...");
    
    // Laundry add-on (bedroom-based)
    const [laundryAddOn] = await db.insert(schema.addOns).values({
      serviceId: serviceApartmentsId,
      name: "خدمة الغسيل",
      nameEn: "Laundry Service",
      description: "غسيل وكي الملابس والمفروشات",
      descriptionEn: "Washing and ironing clothes and linens",
      price: toCents(400), // Base price for 1BR
      pricingType: "PER_BEDROOM",
      active: true,
    }).$returningId();
    
    // Laundry pricing tiers
    const laundryTiers = [
      { bedrooms: 1, price: toCents(400) },
      { bedrooms: 2, price: toCents(600) },
      { bedrooms: 3, price: toCents(800) },
      { bedrooms: 4, price: toCents(1000) },
      { bedrooms: 5, price: toCents(1200) },
      { bedrooms: 6, price: toCents(1500) },
    ];
    
    for (const tier of laundryTiers) {
      await db.insert(schema.addOnTiers).values({
        addOnId: laundryAddOn.id,
        ...tier,
      });
    }
    console.log(`   ✓ Laundry: 6 bedroom tiers added`);
    
    // Garden/Terrace add-on (size-tiered)
    const [gardenAddOn] = await db.insert(schema.addOns).values({
      serviceId: serviceApartmentsId,
      name: "تنظيف الحديقة/الشرفة",
      nameEn: "Garden/Terrace Cleaning",
      description: "تنظيف المساحات الخارجية",
      descriptionEn: "Cleaning outdoor spaces",
      price: toCents(200), // Base price for 1BR
      pricingType: "SIZE_TIERED",
      sizeTierThreshold: 100, // 100 sqm threshold
      sizeTierMultiplier: 150, // +50% for >100 sqm
      active: true,
    }).$returningId();
    
    // Garden pricing tiers (up to 100 sqm)
    const gardenTiers = [
      { bedrooms: 1, price: toCents(200) },
      { bedrooms: 2, price: toCents(300) },
      { bedrooms: 3, price: toCents(400) },
      { bedrooms: 4, price: toCents(500) },
      { bedrooms: 5, price: toCents(700) },
      { bedrooms: 6, price: toCents(800) },
    ];
    
    for (const tier of gardenTiers) {
      await db.insert(schema.addOnTiers).values({
        addOnId: gardenAddOn.id,
        ...tier,
      });
    }
    console.log(`   ✓ Garden/Terrace: 6 bedroom tiers + size multiplier`);
    
    // Kitchen Deep Clean add-on (fixed price)
    await db.insert(schema.addOns).values({
      serviceId: deepCleaningId,
      name: "تنظيف المطبخ العميق",
      nameEn: "Kitchen Deep Clean",
      description: "تنظيف عميق للمطبخ والفرن",
      descriptionEn: "Deep cleaning of kitchen and oven",
      price: toCents(1000),
      pricingType: "FIXED",
      active: true,
    });
    console.log(`   ✓ Kitchen Deep Clean: 1,000 EGP fixed`);
    
    // Kitchen Tools/Oven add-on for Periodical Cleaning
    await db.insert(schema.addOns).values({
      serviceId: periodicalCleaningId,
      name: "تنظيف أدوات المطبخ والفرن",
      nameEn: "Kitchen Tools & Oven Cleaning",
      description: "تنظيف أدوات المطبخ والفرن",
      descriptionEn: "Cleaning kitchen tools and oven",
      price: toCents(250),
      pricingType: "FIXED",
      active: true,
    });
    console.log(`   ✓ Kitchen Tools/Oven: 250 EGP fixed`);
    
    // 6. Seed package discounts (Periodical Cleaning)
    console.log("\n6️⃣ Seeding package discounts...");
    
    if (periodicalCleaningId) {
      const packages = [
        { visits: 4, discountPercentage: 10 },
        { visits: 6, discountPercentage: 12 },
        { visits: 8, discountPercentage: 15 },
        { visits: 12, discountPercentage: 20 },
      ];
      
      for (const pkg of packages) {
        await db.insert(schema.packageDiscounts).values({
          serviceId: periodicalCleaningId,
          ...pkg,
          active: true,
        });
      }
      console.log(`   ✓ Periodical Cleaning: 4 package discounts added`);
    }
    
    // 7. Seed special offers
    console.log("\n7️⃣ Seeding special offers...");
    
    // Referral Program
    await db.insert(schema.specialOffers).values({
      name: "برنامج الإحالة",
      nameEn: "Referral Program",
      description: "احصل على خصم 10% عند إحالة صديق، وسيحصل صديقك أيضًا على خصم 10%",
      descriptionEn: "Get 10% off when you refer a friend, and your friend gets 10% off too",
      offerType: "REFERRAL",
      discountType: "percentage",
      discountValue: 10,
      maxDiscount: toCents(500), // Max 500 EGP discount
      active: true,
    });
    console.log(`   ✓ Referral Program: 10% off (max 500 EGP)`);
    
    // Property Manager Discount (5-10 properties)
    await db.insert(schema.specialOffers).values({
      name: "خصم مدير العقارات (5-10 عقارات)",
      nameEn: "Property Manager Discount (5-10 properties)",
      description: "خصم 5% لمديري العقارات الذين لديهم 5-10 عقارات شهريًا",
      descriptionEn: "5% discount for property managers with 5-10 properties per month",
      offerType: "PROPERTY_MANAGER",
      discountType: "percentage",
      discountValue: 5,
      minProperties: 5,
      active: true,
    });
    console.log(`   ✓ Property Manager (5-10): 5% off`);
    
    // Property Manager Discount (11+ properties)
    await db.insert(schema.specialOffers).values({
      name: "خصم مدير العقارات (11+ عقار)",
      nameEn: "Property Manager Discount (11+ properties)",
      description: "خصم 10% لمديري العقارات الذين لديهم 11+ عقار شهريًا",
      descriptionEn: "10% discount for property managers with 11+ properties per month",
      offerType: "PROPERTY_MANAGER",
      discountType: "percentage",
      discountValue: 10,
      minProperties: 11,
      active: true,
    });
    console.log(`   ✓ Property Manager (11+): 10% off`);
    
    // Emergency Same-Day Premium
    await db.insert(schema.specialOffers).values({
      name: "خدمة الطوارئ في نفس اليوم",
      nameEn: "Emergency Same-Day Service",
      description: "رسوم إضافية 50% للحجوزات في نفس اليوم (الاتصال قبل الظهر)",
      descriptionEn: "50% premium for same-day bookings (call before 12 PM)",
      offerType: "EMERGENCY_SAME_DAY",
      discountType: "percentage",
      discountValue: 50, // +50% premium (not a discount)
      active: true,
    });
    console.log(`   ✓ Emergency Same-Day: +50% premium`);
    
    console.log("\n✅ Pricing data seeded successfully!");
    return { success: true, message: "All pricing data loaded successfully!" };
    
  } catch (error) {
    console.error("❌ Error seeding pricing data:", error);
    throw error;
  }
}
