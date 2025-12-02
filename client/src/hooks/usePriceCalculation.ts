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
}

interface PriceBreakdown {
  basePrice: number;
  addOnsTotal: number;
  subtotal: number;
  packageDiscount: number;
  subtotalAfterPackage: number;
  specialOfferAdjustment: number;
  finalPrice: number;
}

export function usePriceCalculation(input: PriceCalculationInput): PriceBreakdown {
  return useMemo(() => {
    const { basePrice, selectedAddOns, packageDiscountPercent, specialOffer } = input;

    // Calculate add-ons total
    const addOnsTotal = selectedAddOns.reduce((sum, addOn) => sum + addOn.price, 0);

    // Subtotal before discounts
    const subtotal = basePrice + addOnsTotal;

    // Apply package discount (percentage off)
    const packageDiscount = (subtotal * packageDiscountPercent) / 100;
    const subtotalAfterPackage = subtotal - packageDiscount;

    // Apply special offer
    let specialOfferAdjustment = 0;
    let finalPrice = subtotalAfterPackage;

    if (specialOffer) {
      if (specialOffer.discountType === "PERCENTAGE") {
        // Discount (negative adjustment)
        specialOfferAdjustment = (subtotalAfterPackage * specialOffer.discountValue) / 100;
        
        // Apply max discount cap if specified
        if (specialOffer.maxDiscount && specialOfferAdjustment > specialOffer.maxDiscount) {
          specialOfferAdjustment = specialOffer.maxDiscount;
        }
        
        finalPrice = subtotalAfterPackage - specialOfferAdjustment;
      } else if (specialOffer.discountType === "PREMIUM") {
        // Premium (positive adjustment)
        specialOfferAdjustment = (subtotalAfterPackage * specialOffer.discountValue) / 100;
        finalPrice = subtotalAfterPackage + specialOfferAdjustment;
      }
    }

    // Ensure final price is never negative
    finalPrice = Math.max(0, Math.round(finalPrice));

    return {
      basePrice,
      addOnsTotal,
      subtotal,
      packageDiscount: Math.round(packageDiscount),
      subtotalAfterPackage: Math.round(subtotalAfterPackage),
      specialOfferAdjustment: Math.round(specialOfferAdjustment),
      finalPrice,
    };
  }, [input.basePrice, input.selectedAddOns, input.packageDiscountPercent, input.specialOffer]);
}
