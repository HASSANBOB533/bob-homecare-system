import { describe, it, expect } from "vitest";
import { calculatePriceBreakdown } from "../client/src/hooks/usePriceCalculation";

describe("Property Manager Discount Validation", () => {
  const mockPropertyManagerOffer = {
    id: 1,
    name: "Property Manager Discount",
    discountType: "PERCENTAGE",
    discountValue: 15, // 15% discount
    maxDiscount: null,
    minProperties: 5, // Requires at least 5 properties
  };

  it("should apply discount when property count meets minimum requirement", () => {
    const result = calculatePriceBreakdown({
      basePrice: 100000, // 1000 EGP in cents
      selectedAddOns: [],
      packageDiscountPercent: 0,
      specialOffer: mockPropertyManagerOffer,
      referralDiscountPercent: 0,
      propertyCount: 5, // Meets minimum
    });

    // Discount should be applied: 1000 * 15% = 150 EGP
    expect(result.specialOfferAdjustment).toBe(150);
    expect(result.finalPrice).toBe(850); // 1000 - 150
  });

  it("should NOT apply discount when property count is below minimum", () => {
    const result = calculatePriceBreakdown({
      basePrice: 100000, // 1000 EGP in cents
      selectedAddOns: [],
      packageDiscountPercent: 0,
      specialOffer: mockPropertyManagerOffer,
      referralDiscountPercent: 0,
      propertyCount: 3, // Below minimum of 5
    });

    // Discount should NOT be applied
    expect(result.specialOfferAdjustment).toBe(0);
    expect(result.finalPrice).toBe(1000); // No discount
  });

  it("should NOT apply discount when property count is zero", () => {
    const result = calculatePriceBreakdown({
      basePrice: 100000, // 1000 EGP in cents
      selectedAddOns: [],
      packageDiscountPercent: 0,
      specialOffer: mockPropertyManagerOffer,
      referralDiscountPercent: 0,
      propertyCount: 0,
    });

    // Discount should NOT be applied
    expect(result.specialOfferAdjustment).toBe(0);
    expect(result.finalPrice).toBe(1000);
  });

  it("should apply discount when property count exceeds minimum", () => {
    const result = calculatePriceBreakdown({
      basePrice: 100000, // 1000 EGP in cents
      selectedAddOns: [],
      packageDiscountPercent: 0,
      specialOffer: mockPropertyManagerOffer,
      referralDiscountPercent: 0,
      propertyCount: 10, // Exceeds minimum
    });

    // Discount should be applied
    expect(result.specialOfferAdjustment).toBe(150);
    expect(result.finalPrice).toBe(850);
  });

  it("should apply regular offer discount when no minProperties requirement", () => {
    const regularOffer = {
      id: 2,
      name: "Regular Discount",
      discountType: "PERCENTAGE",
      discountValue: 10,
      maxDiscount: null,
      minProperties: null, // No property requirement
    };

    const result = calculatePriceBreakdown({
      basePrice: 100000,
      selectedAddOns: [],
      packageDiscountPercent: 0,
      specialOffer: regularOffer,
      referralDiscountPercent: 0,
      propertyCount: 0, // Property count doesn't matter
    });

    // Discount should be applied regardless of property count
    expect(result.specialOfferAdjustment).toBe(100); // 10%
    expect(result.finalPrice).toBe(900);
  });

  it("should combine package discount with property manager discount", () => {
    const result = calculatePriceBreakdown({
      basePrice: 100000, // 1000 EGP
      selectedAddOns: [],
      packageDiscountPercent: 10, // 10% package discount
      specialOffer: mockPropertyManagerOffer,
      referralDiscountPercent: 0,
      propertyCount: 5,
    });

    // Package discount: 1000 * 10% = 100 EGP
    // After package: 900 EGP
    // Property manager discount: 900 * 15% = 135 EGP
    // Final: 765 EGP
    expect(result.packageDiscount).toBe(100);
    expect(result.specialOfferAdjustment).toBe(135);
    expect(result.finalPrice).toBe(765);
  });

  it("should combine property manager discount with referral discount", () => {
    const result = calculatePriceBreakdown({
      basePrice: 100000, // 1000 EGP
      selectedAddOns: [],
      packageDiscountPercent: 0,
      specialOffer: mockPropertyManagerOffer,
      referralDiscountPercent: 10, // 10% referral discount
      propertyCount: 5,
    });

    // Property manager discount: 1000 * 15% = 150 EGP
    // After property manager: 850 EGP
    // Referral discount: 850 * 10% = 85 EGP
    // Final: 765 EGP
    expect(result.specialOfferAdjustment).toBe(150);
    expect(result.referralDiscount).toBe(85);
    expect(result.finalPrice).toBe(765);
  });
});
