import { useMemo } from "react";

interface SelectedItem {
  itemId: number;
  itemName: string;
  price: number;
  quantity: number;
}

interface SelectedAddOn {
  addOnId: number;
  name: string;
  price: number;
  tierId?: number;
}

interface SpecialOffer {
  id: number;
  name: string;
  discountType: string;
  discountValue: number;
  maxDiscount: number | null;
}

interface PriceCalculationInput {
  // Base price from service selection
  basePrice: number;
  
  // Add-ons
  selectedAddOns: SelectedAddOn[];
  
  // Package discount
  packageDiscountPercent: number;
  
  // Special offer
  specialOffer: SpecialOffer | null;
  
  // Referral discount (percentage)
  referralDiscountPercent?: number;
}

interface PriceBreakdown {
  basePrice: number;
  addOnsTotal: number;
  subtotal: number;
  packageDiscount: number;
  subtotalAfterPackage: number;
  specialOfferAdjustment: number;
  referralDiscount: number;
  finalPrice: number;
}

export function usePriceCalculation(input: PriceCalculationInput): PriceBreakdown {
  return useMemo(() => {
    const { basePrice, selectedAddOns, packageDiscountPercent, specialOffer, referralDiscountPercent = 0 } = input;

    // Calculate add-ons total
    const addOnsTotal = selectedAddOns.reduce((sum, addOn) => sum + addOn.price, 0);

    // Subtotal before discounts
    const subtotal = basePrice + addOnsTotal;

    // Apply package discount (percentage off)
    const packageDiscount = (subtotal * packageDiscountPercent) / 100;
    const subtotalAfterPackage = subtotal - packageDiscount;

    // Apply special offer
    let specialOfferAdjustment = 0;
    let priceAfterSpecialOffer = subtotalAfterPackage;

    if (specialOffer) {
      if (specialOffer.discountType === "PERCENTAGE") {
        // Discount (negative adjustment)
        specialOfferAdjustment = (subtotalAfterPackage * specialOffer.discountValue) / 100;
        
        // Apply max discount cap if specified
        if (specialOffer.maxDiscount && specialOfferAdjustment > specialOffer.maxDiscount) {
          specialOfferAdjustment = specialOffer.maxDiscount;
        }
        
        priceAfterSpecialOffer = subtotalAfterPackage - specialOfferAdjustment;
      } else if (specialOffer.discountType === "PREMIUM") {
        // Premium (positive adjustment)
        specialOfferAdjustment = (subtotalAfterPackage * specialOffer.discountValue) / 100;
        priceAfterSpecialOffer = subtotalAfterPackage + specialOfferAdjustment;
      }
    }

    // Apply referral discount
    const referralDiscount = (priceAfterSpecialOffer * referralDiscountPercent) / 100;
    let finalPrice = priceAfterSpecialOffer - referralDiscount;

    // Ensure final price is never negative
    finalPrice = Math.max(0, Math.round(finalPrice));

    return {
      basePrice: Math.round(basePrice / 100),
      addOnsTotal: Math.round(addOnsTotal / 100),
      subtotal: Math.round(subtotal / 100),
      packageDiscount: Math.round(packageDiscount / 100),
      subtotalAfterPackage: Math.round(subtotalAfterPackage / 100),
      specialOfferAdjustment: Math.round(specialOfferAdjustment / 100),
      referralDiscount: Math.round(referralDiscount / 100),
      finalPrice: Math.round(finalPrice / 100),
    };
  }, [input.basePrice, input.selectedAddOns, input.packageDiscountPercent, input.specialOffer, input.referralDiscountPercent]);
}
