import { describe, it, expect, beforeAll } from "vitest";
import { generateBookingConfirmationEmail } from "./emailTemplates";
import { generateChecklistPDF } from "./pdfGenerator";

describe("Checklist PDF Generation", () => {
  it("should generate PDF buffer with service name and checklist items", async () => {
    const result = await generateChecklistPDF({
      serviceName: "Service Apartments Cleaning",
      checklist: [
        { text: "Clean all bedrooms", textEn: "Clean all bedrooms" },
        { text: "Vacuum carpets and floors", textEn: "Vacuum carpets and floors" },
        { text: "Clean bathrooms", textEn: "Clean bathrooms" },
        { text: "Kitchen cleaning", textEn: "Kitchen cleaning" },
      ],
      language: "en",
    });

    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(0);
    // Check PDF header
    expect(result.toString('utf8', 0, 5)).toBe("%PDF-");
  });

  it("should generate PDF with Arabic service name", async () => {
    const result = await generateChecklistPDF({
      serviceName: "تنظيف شقق Airbnb",
      checklist: [
        { text: "تنظيف جميع الغرف" },
        { text: "تنظيف الحمامات" },
        { text: "تنظيف المطبخ" },
      ],
      language: "ar",
    });

    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(0);
    expect(result.toString('utf8', 0, 5)).toBe("%PDF-");
  });

  it("should handle empty checklist gracefully", async () => {
    const result = await generateChecklistPDF({
      serviceName: "Test Service",
      checklist: [],
      language: "en",
    });

    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(0);
  });
});

describe("Booking Confirmation Email", () => {
  it("should generate email with complete pricing breakdown", () => {
    const result = generateBookingConfirmationEmail({
      customerName: "John Doe",
      serviceName: "Service Apartments Cleaning",
      date: "2025-12-15",
      time: "10:00",
      address: "123 Main St, Cairo",
      pricingBreakdown: {
        basePrice: 250000, // 2500 EGP in cents
        addOns: [
          { name: "Laundry Service", price: 25000 },
          { name: "Garden Cleaning", price: 25000 },
        ],
        packageDiscount: {
          visits: 4,
          discountPercentage: 10,
          discountAmount: 30000,
        },
        finalPrice: 270000, // 2700 EGP
      },
      bookingReference: "BOB-12345",
      language: "en",
    });

    expect(result).toHaveProperty("subject");
    expect(result).toHaveProperty("html");
    expect(result).toHaveProperty("text");
    
    // Check subject
    expect(result.subject).toContain("Booking Confirmation");
    expect(result.subject).toContain("BOB-12345");
    
    // Check HTML content
    expect(result.html).toContain("John Doe");
    expect(result.html).toContain("Service Apartments Cleaning");
    expect(result.html).toContain("2025-12-15");
    expect(result.html).toContain("10:00");
    expect(result.html).toContain("123 Main St, Cairo");
    expect(result.html).toContain("BOB-12345");
    
    // Check pricing breakdown in HTML
    expect(result.html).toContain("2500.00"); // Base price
    expect(result.html).toContain("Laundry Service");
    expect(result.html).toContain("250.00"); // Add-on price
    expect(result.html).toContain("Package Discount");
    expect(result.html).toContain("2700.00"); // Final price
    
    // Check text content
    expect(result.text).toContain("John Doe");
    expect(result.text).toContain("BOB-12345");
    expect(result.text).toContain("2500.00");
    expect(result.text).toContain("2700.00");
  });

  it("should generate Arabic email template correctly", () => {
    const result = generateBookingConfirmationEmail({
      customerName: "أحمد محمد",
      serviceName: "تنظيف شقق Airbnb",
      date: "2025-12-15",
      time: "10:00",
      address: "123 شارع الرئيسي، القاهرة",
      pricingBreakdown: {
        basePrice: 250000,
        finalPrice: 250000,
      },
      bookingReference: "BOB-12345",
      language: "ar",
    });

    expect(result.subject).toContain("تأكيد الحجز");
    expect(result.html).toContain("أحمد محمد");
    expect(result.html).toContain("تنظيف شقق Airbnb");
    expect(result.html).toContain("dir=\"rtl\"");
    expect(result.html).toContain("السعر الأساسي");
    expect(result.html).toContain("المجموع النهائي");
    expect(result.html).toContain("ج.م"); // Egyptian Pound symbol
  });

  it("should handle pricing without add-ons or discounts", () => {
    const result = generateBookingConfirmationEmail({
      customerName: "Jane Smith",
      serviceName: "Deep Cleaning",
      date: "2025-12-20",
      time: "14:00",
      address: "456 Oak Ave",
      pricingBreakdown: {
        basePrice: 150000,
        finalPrice: 150000,
      },
      bookingReference: "BOB-67890",
      language: "en",
    });

    expect(result.html).toContain("1500.00");
    expect(result.html).not.toContain("Add-Ons");
    expect(result.html).not.toContain("Package Discount");
    expect(result.html).not.toContain("Special Offer");
  });

  it("should include special offer discount in email", () => {
    const result = generateBookingConfirmationEmail({
      customerName: "Test User",
      serviceName: "Move In/Out Cleaning",
      date: "2025-12-25",
      time: "09:00",
      address: "789 Pine St",
      pricingBreakdown: {
        basePrice: 300000,
        specialOffer: {
          name: "Referral Program Discount",
          discountAmount: 30000,
        },
        finalPrice: 270000,
      },
      bookingReference: "BOB-11111",
      language: "en",
    });

    expect(result.html).toContain("Referral Program Discount");
    expect(result.html).toContain("300.00"); // Discount amount
    expect(result.html).toContain("2700.00"); // Final price
  });

  it("should format prices correctly with two decimal places", () => {
    const result = generateBookingConfirmationEmail({
      customerName: "Test",
      serviceName: "Test Service",
      date: "2025-12-01",
      time: "10:00",
      address: "Test Address",
      pricingBreakdown: {
        basePrice: 123456, // 1234.56 EGP
        finalPrice: 123456,
      },
      bookingReference: "BOB-TEST",
      language: "en",
    });

    expect(result.html).toContain("1234.56");
    expect(result.text).toContain("1234.56");
  });
});
