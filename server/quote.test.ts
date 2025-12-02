import { describe, it, expect, beforeAll } from "vitest";
import { createQuote, getQuoteByCode, updateQuote, markQuoteConverted, createService } from "./db";

describe("Quote Management", () => {
  let testQuoteCode: string;
  let testQuoteId: number;
  let testServiceId: number;

  beforeAll(async () => {
    // Create a test service first
    const serviceResult = await createService({
      name: "خدمة اختبار",
      nameEn: "Test Service",
      description: "خدمة للاختبار",
      descriptionEn: "Service for testing",
      duration: 60,
    });
    testServiceId = Number(serviceResult[0].insertId);

    // Create a test quote
    const quote = await createQuote({
      serviceId: testServiceId,
      selections: {
        bedrooms: 3,
        date: "2025-02-15",
        time: "10:00",
        address: "123 Test Street, Cairo",
        notes: "Test booking",
      },
      totalPrice: 150000, // 1500.00 EGP in cents
      customerName: "Test Customer",
      customerEmail: "test@example.com",
      customerPhone: "+201234567890",
    });

    testQuoteCode = quote.quoteCode;
    testQuoteId = quote.id;
  });

  describe("createQuote", () => {
    it("should create a quote with a unique code", async () => {
      const quote = await createQuote({
        serviceId: testServiceId,
        selections: {
          bedrooms: 2,
          addOns: [{ addOnId: 1, quantity: 1 }],
        },
        totalPrice: 100000,
        customerName: "John Doe",
      });

      expect(quote).toBeDefined();
      expect(quote.quoteCode).toMatch(/^Q[A-Z2-9]{11}$/); // Starts with Q, 11 alphanumeric chars
      expect(quote.serviceId).toBe(testServiceId);
      expect(quote.totalPrice).toBe(100000);
      expect(quote.customerName).toBe("John Doe");
      expect(quote.expiresAt).toBeDefined();
    });

    it("should create a quote with all optional fields", async () => {
      const quote = await createQuote({
        serviceId: testServiceId,
        selections: {
          squareMeters: 150,
          specialOfferId: 1,
        },
        totalPrice: 200000,
        userId: 1,
        customerName: "Jane Smith",
        customerEmail: "jane@example.com",
        customerPhone: "+201987654321",
      });

      expect(quote).toBeDefined();
      expect(quote.userId).toBe(1);
      expect(quote.customerEmail).toBe("jane@example.com");
      expect(quote.customerPhone).toBe("+201987654321");
    });

    it("should set expiration date to 30 days from now", async () => {
      const quote = await createQuote({
        serviceId: testServiceId,
        selections: { bedrooms: 1 },
        totalPrice: 50000,
      });

      const expiryDate = new Date(quote.expiresAt);
      const now = new Date();
      const daysDiff = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      expect(daysDiff).toBeGreaterThanOrEqual(29);
      expect(daysDiff).toBeLessThanOrEqual(30);
    });
  });

  describe("getQuoteByCode", () => {
    it("should retrieve a quote by code", async () => {
      const quote = await getQuoteByCode(testQuoteCode);

      expect(quote).toBeDefined();
      expect(quote.quoteCode).toBe(testQuoteCode);
      expect(quote.serviceId).toBe(testServiceId);
      expect(quote.totalPrice).toBe(150000);
      expect(quote.customerName).toBe("Test Customer");
    });

    it("should include service details in the quote", async () => {
      const quote = await getQuoteByCode(testQuoteCode);

      expect(quote.serviceName).toBeDefined();
      expect(quote.serviceNameEn).toBeDefined();
    });

    it("should increment view count when retrieving a quote", async () => {
      const quote1 = await getQuoteByCode(testQuoteCode);
      const initialViewCount = quote1.viewCount;

      const quote2 = await getQuoteByCode(testQuoteCode);
      expect(quote2.viewCount).toBe(initialViewCount + 1);
    });

    it("should throw an error for non-existent quote code", async () => {
      await expect(getQuoteByCode("QINVALIDCODE")).rejects.toThrow("Quote not found");
    });

    it("should throw an error for expired quote", async () => {
      // Create a quote with past expiration date
      const { quotes } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const db = await getDb();
      
      if (!db) throw new Error("Database not available");

      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1); // Yesterday

      const expiredCode = `QEXP${Date.now().toString().slice(-7)}`;
      const result = await db.insert(quotes).values({
        quoteCode: expiredCode,
        serviceId: testServiceId,
        selections: { bedrooms: 1 },
        totalPrice: 50000,
        expiresAt: pastDate,
      });

      await expect(getQuoteByCode(expiredCode)).rejects.toThrow("Quote has expired");
    });
  });

  describe("updateQuote", () => {
    it("should update quote selections and price", async () => {
      const updatedQuote = await updateQuote(testQuoteId, {
        selections: {
          bedrooms: 4,
          addOns: [{ addOnId: 2, quantity: 1 }],
        },
        totalPrice: 180000,
      });

      expect(updatedQuote).toBeDefined();
      expect(updatedQuote.totalPrice).toBe(180000);
      expect(updatedQuote.selections).toEqual({
        bedrooms: 4,
        addOns: [{ addOnId: 2, quantity: 1 }],
      });
    });

    it("should preserve other fields when updating", async () => {
      const originalQuote = await getQuoteByCode(testQuoteCode);
      
      await updateQuote(testQuoteId, {
        selections: { bedrooms: 5 },
        totalPrice: 200000,
      });

      const updatedQuote = await getQuoteByCode(testQuoteCode);
      expect(updatedQuote.customerName).toBe(originalQuote.customerName);
      expect(updatedQuote.quoteCode).toBe(originalQuote.quoteCode);
    });
  });

  describe("markQuoteConverted", () => {
    it("should mark a quote as converted to booking", async () => {
      const result = await markQuoteConverted(testQuoteId);

      expect(result.success).toBe(true);

      const quote = await getQuoteByCode(testQuoteCode);
      expect(quote.convertedToBooking).toBe(true);
    });
  });

  describe("Quote Code Generation", () => {
    it("should generate unique quote codes", async () => {
      const codes = new Set<string>();

      for (let i = 0; i < 10; i++) {
        const quote = await createQuote({
          serviceId: testServiceId,
          selections: { bedrooms: 1 },
          totalPrice: 50000,
        });
        codes.add(quote.quoteCode);
      }

      expect(codes.size).toBe(10); // All codes should be unique
    });

    it("should exclude similar characters from quote codes", async () => {
      const quote = await createQuote({
        serviceId: testServiceId,
        selections: { bedrooms: 1 },
        totalPrice: 50000,
      });

      // Check that code doesn't contain I, O, 0, 1
      expect(quote.quoteCode).not.toMatch(/[IO01]/);
    });
  });

  describe("Quote Selections", () => {
    it("should handle bedroom-based selections", async () => {
      const quote = await createQuote({
        serviceId: testServiceId,
        selections: {
          bedrooms: 3,
          packageDiscountId: 1,
        },
        totalPrice: 120000,
      });

      const retrieved = await getQuoteByCode(quote.quoteCode);
      expect(retrieved.selections).toHaveProperty("bedrooms", 3);
      expect(retrieved.selections).toHaveProperty("packageDiscountId", 1);
    });

    it("should handle square meter-based selections", async () => {
      const quote = await createQuote({
        serviceId: testServiceId,
        selections: {
          squareMeters: 200,
          addOns: [{ addOnId: 1, quantity: 1 }],
        },
        totalPrice: 250000,
      });

      const retrieved = await getQuoteByCode(quote.quoteCode);
      expect(retrieved.selections).toHaveProperty("squareMeters", 200);
    });

    it("should handle item-based selections", async () => {
      const quote = await createQuote({
        serviceId: testServiceId,
        selections: {
          selectedItems: [
            { itemId: 1, quantity: 2 },
            { itemId: 2, quantity: 1 },
          ],
        },
        totalPrice: 180000,
      });

      const retrieved = await getQuoteByCode(quote.quoteCode);
      expect(retrieved.selections.selectedItems).toHaveLength(2);
      expect(retrieved.selections.selectedItems[0]).toEqual({ itemId: 1, quantity: 2 });
    });

    it("should handle complex selections with all options", async () => {
      const quote = await createQuote({
        serviceId: testServiceId,
        selections: {
          bedrooms: 4,
          addOns: [
            { addOnId: 1, quantity: 1 },
            { addOnId: 2, quantity: 1 },
          ],
          packageDiscountId: 2,
          specialOfferId: 1,
          date: "2025-03-01",
          time: "14:00",
          address: "456 Main St, Cairo",
          notes: "Please call before arrival",
        },
        totalPrice: 300000,
        customerName: "Complex Test",
        customerEmail: "complex@test.com",
        customerPhone: "+201111111111",
      });

      const retrieved = await getQuoteByCode(quote.quoteCode);
      expect(retrieved.selections.bedrooms).toBe(4);
      expect(retrieved.selections.addOns).toHaveLength(2);
      expect(retrieved.selections.date).toBe("2025-03-01");
      expect(retrieved.selections.notes).toBe("Please call before arrival");
    });
  });
});
