import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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

interface PriceBreakdownCardProps {
  breakdown: PriceBreakdown;
  specialOfferType?: string | null;
}

export function PriceBreakdownCard({ breakdown, specialOfferType }: PriceBreakdownCardProps) {
  const { t } = useTranslation();

  // Don't show if no price selected
  if (breakdown.basePrice === 0) return null;

  return (
    <Card className="bg-primary/5 border-primary">
      <CardHeader>
        <CardTitle className="text-lg">{t("booking.priceBreakdown")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Base Price */}
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">{t("booking.basePrice")}:</span>
          <span className="font-semibold">
            {breakdown.basePrice.toLocaleString()} {t("booking.egp")}
          </span>
        </div>

        {/* Add-ons */}
        {breakdown.addOnsTotal > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">{t("booking.addOnsTotal")}:</span>
            <span className="font-semibold">
              +{breakdown.addOnsTotal.toLocaleString()} {t("booking.egp")}
            </span>
          </div>
        )}

        {/* Subtotal */}
        {(breakdown.addOnsTotal > 0 || breakdown.packageDiscount > 0 || breakdown.specialOfferAdjustment > 0) && (
          <>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">{t("booking.subtotal")}:</span>
              <span className="font-semibold">
                {breakdown.subtotal.toLocaleString()} {t("booking.egp")}
              </span>
            </div>
          </>
        )}

        {/* Package Discount */}
        {breakdown.packageDiscount > 0 && (
          <div className="flex justify-between items-center text-green-600">
            <span>{t("booking.packageDiscount")}:</span>
            <span className="font-semibold">
              -{breakdown.packageDiscount.toLocaleString()} {t("booking.egp")}
            </span>
          </div>
        )}

        {/* Special Offer */}
        {breakdown.specialOfferAdjustment > 0 && (
          <div
            className={`flex justify-between items-center ${
              specialOfferType === "PREMIUM" ? "text-red-600" : "text-green-600"
            }`}
          >
            <span>{t("booking.specialOffers")}:</span>
            <span className="font-semibold">
              {specialOfferType === "PREMIUM" ? "+" : "-"}
              {breakdown.specialOfferAdjustment.toLocaleString()} {t("booking.egp")}
            </span>
          </div>
        )}

        {/* Referral Discount */}
        {breakdown.referralDiscount > 0 && (
          <div className="flex justify-between items-center text-green-600">
            <span>{t("booking.referralDiscount")}:</span>
            <span className="font-semibold">
              -{breakdown.referralDiscount.toLocaleString()} {t("booking.egp")}
            </span>
          </div>
        )}

        {/* Final Price */}
        <Separator className="my-2" />
        <div className="flex justify-between items-center pt-2">
          <span className="text-lg font-bold">{t("booking.finalPrice")}:</span>
          <span className="text-2xl font-bold text-primary">
            {breakdown.finalPrice.toLocaleString()} {t("booking.egp")}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
