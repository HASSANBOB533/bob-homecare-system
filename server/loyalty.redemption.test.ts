import { describe, it, expect } from "vitest";
import { calculatePriceBreakdown } from "../client/src/hooks/usePriceCalculation";

describe("Loyalty Points Redemption", () => {
  const POINTS_TO_CENTS_RATE = 10; // 1 point = 10 cents = 0.1 EGP

  it("should apply loyalty discount when points are redeemed", () => {
    const result = calculatePriceBreakdown({
      basePrice: 100000, // 1000 EGP in cents
      selectedAddOns: [],
      packageDiscountPercent: 0,
      specialOffer: null,
      referralDiscountPercent: 0,
      propertyCount: 0,
      loyaltyDiscountCents: 5000, // 500 points = 50 EGP
    });

    // Loyalty discount should be applied
    expect(result.loyaltyDiscount).toBe(50); // 50 EGP
    expect(result.finalPrice).toBe(950); // 1000 - 50
  });

  it("should NOT apply loyalty discount when no points redeemed", () => {
    const result = calculatePriceBreakdown({
      basePrice: 100000,
      selectedAddOns: [],
      packageDiscountPercent: 0,
      specialOffer: null,
      referralDiscountPercent: 0,
      propertyCount: 0,
      loyaltyDiscountCents: 0, // No points redeemed
    });

    expect(result.loyaltyDiscount).toBe(0);
    expect(result.finalPrice).toBe(1000);
  });

  it("should combine loyalty discount with package discount", () => {
    const result = calculatePriceBreakdown({
      basePrice: 100000, // 1000 EGP
      selectedAddOns: [],
      packageDiscountPercent: 10, // 10% package discount
      specialOffer: null,
      referralDiscountPercent: 0,
      propertyCount: 0,
      loyaltyDiscountCents: 3000, // 300 points = 30 EGP
    });

    // Package discount: 1000 * 10% = 100 EGP
    // After package: 900 EGP
    // Loyalty discount: 30 EGP
    // Final: 870 EGP
    expect(result.packageDiscount).toBe(100);
    expect(result.loyaltyDiscount).toBe(30);
    expect(result.finalPrice).toBe(870);
  });

  it("should combine loyalty discount with referral discount", () => {
    const result = calculatePriceBreakdown({
      basePrice: 100000, // 1000 EGP
      selectedAddOns: [],
      packageDiscountPercent: 0,
      specialOffer: null,
      referralDiscountPercent: 10, // 10% referral discount
      propertyCount: 0,
      loyaltyDiscountCents: 2000, // 200 points = 20 EGP
    });

    // Referral discount: 1000 * 10% = 100 EGP
    // After referral: 900 EGP
    // Loyalty discount: 20 EGP
    // Final: 880 EGP
    expect(result.referralDiscount).toBe(100);
    expect(result.loyaltyDiscount).toBe(20);
    expect(result.finalPrice).toBe(880);
  });

  it("should combine loyalty discount with special offer", () => {
    const specialOffer = {
      id: 1,
      name: "Special Discount",
      discountType: "PERCENTAGE",
      discountValue: 15, // 15% discount
      maxDiscount: null,
      minProperties: null,
    };

    const result = calculatePriceBreakdown({
      basePrice: 100000, // 1000 EGP
      selectedAddOns: [],
      packageDiscountPercent: 0,
      specialOffer,
      referralDiscountPercent: 0,
      propertyCount: 0,
      loyaltyDiscountCents: 2500, // 250 points = 25 EGP
    });

    // Special offer: 1000 * 15% = 150 EGP
    // After special offer: 850 EGP
    // Loyalty discount: 25 EGP
    // Final: 825 EGP
    expect(result.specialOfferAdjustment).toBe(150);
    expect(result.loyaltyDiscount).toBe(25);
    expect(result.finalPrice).toBe(825);
  });

  it("should apply all discounts in correct order", () => {
    const specialOffer = {
      id: 1,
      name: "Special Discount",
      discountType: "PERCENTAGE",
      discountValue: 10,
      maxDiscount: null,
      minProperties: null,
    };

    const result = calculatePriceBreakdown({
      basePrice: 100000, // 1000 EGP
      selectedAddOns: [{ addOnId: 1, name: "Extra", price: 20000, tierId: 1 }], // 200 EGP
      packageDiscountPercent: 10, // 10% package discount
      specialOffer,
      referralDiscountPercent: 5, // 5% referral discount
      propertyCount: 0,
      loyaltyDiscountCents: 1000, // 100 points = 10 EGP
    });

    // Base + Add-ons: 1000 + 200 = 1200 EGP
    // Package discount: 1200 * 10% = 120 EGP → 1080 EGP
    // Special offer: 1080 * 10% = 108 EGP → 972 EGP
    // Referral: 972 * 5% = 48.6 EGP → 923.4 EGP
    // Loyalty: 10 EGP → 913.4 EGP (rounded to 913)
    expect(result.subtotal).toBe(1200);
    expect(result.packageDiscount).toBe(120);
    expect(result.specialOfferAdjustment).toBe(108);
    expect(result.referralDiscount).toBe(49); // Rounded
    expect(result.loyaltyDiscount).toBe(10);
    expect(result.finalPrice).toBe(913);
  });

  it("should ensure final price never goes negative", () => {
    const result = calculatePriceBreakdown({
      basePrice: 5000, // 50 EGP
      selectedAddOns: [],
      packageDiscountPercent: 0,
      specialOffer: null,
      referralDiscountPercent: 0,
      propertyCount: 0,
      loyaltyDiscountCents: 10000, // 1000 points = 100 EGP (more than base price)
    });

    // Final price should be 0, not negative
    expect(result.finalPrice).toBeGreaterThanOrEqual(0);
  });
});
