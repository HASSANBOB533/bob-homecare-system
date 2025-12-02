import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState } from "react";

interface SqmPricing {
  id: number;
  variant: string | null;
  pricePerSqm: number;
  minimumCharge: number;
}

interface SquareMeterInputProps {
  sqmPricing: SqmPricing[];
  selectedVariant: string | null;
  squareMeters: number;
  onVariantSelect: (variant: string | null, pricePerSqm: number, minimumCharge: number) => void;
  onSquareMetersChange: (sqm: number) => void;
}

export function SquareMeterInput({
  sqmPricing,
  selectedVariant,
  squareMeters,
  onVariantSelect,
  onSquareMetersChange,
}: SquareMeterInputProps) {
  const { t } = useTranslation();

  // If there are multiple variants, show variant selector
  const hasVariants = sqmPricing.length > 1;
  const selectedPricing = sqmPricing.find((p) => p.variant === selectedVariant) || sqmPricing[0];

  const calculatedPrice = Math.max(
    squareMeters * (selectedPricing.pricePerSqm / 100),
    selectedPricing.minimumCharge / 100
  );

  return (
    <div className="space-y-4">
      {hasVariants && (
        <div className="space-y-3">
          <Label className="text-base font-semibold">
            {t("booking.selectVariant")}
          </Label>
          <RadioGroup
            value={selectedVariant || ""}
            onValueChange={(value) => {
              const pricing = sqmPricing.find((p) => p.variant === value);
              if (pricing) {
                onVariantSelect(value, pricing.pricePerSqm, pricing.minimumCharge);
              }
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sqmPricing.map((pricing) => (
                <Card
                  key={pricing.id}
                  className={`cursor-pointer transition-all hover:border-primary ${
                    selectedVariant === pricing.variant
                      ? "border-primary bg-primary/5"
                      : ""
                  }`}
                  onClick={() =>
                    onVariantSelect(
                      pricing.variant,
                      pricing.pricePerSqm,
                      pricing.minimumCharge
                    )
                  }
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <RadioGroupItem
                        value={pricing.variant || ""}
                        id={`variant-${pricing.id}`}
                      />
                      <div className="flex-1">
                        <div className="font-semibold">{pricing.variant}</div>
                        <div className="text-sm text-muted-foreground">
                          {(pricing.pricePerSqm / 100).toFixed(2)} {t("booking.egp")}/
                          {t("booking.sqm")}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {t("booking.minimum")}: {(pricing.minimumCharge / 100).toLocaleString()}{" "}
                          {t("booking.egp")}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </RadioGroup>
        </div>
      )}

      <div className="space-y-3">
        <Label htmlFor="squareMeters" className="text-base font-semibold">
          {t("booking.squareMeters")}
        </Label>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <Input
              id="squareMeters"
              type="number"
              min="0"
              step="1"
              value={squareMeters || ""}
              onChange={(e) => onSquareMetersChange(parseInt(e.target.value) || 0)}
              placeholder={t("booking.enterSquareMeters")}
              className="text-lg"
            />
          </div>
          <div className="text-sm text-muted-foreground whitespace-nowrap">
            {(selectedPricing.pricePerSqm / 100).toFixed(2)} {t("booking.egp")}/{t("booking.sqm")}
          </div>
        </div>
        {squareMeters > 0 && (
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {t("booking.estimatedPrice")}:
                </span>
                <span className="text-lg font-bold text-primary">
                  {calculatedPrice.toLocaleString()} {t("booking.egp")}
                </span>
              </div>
              {calculatedPrice === selectedPricing.minimumCharge && (
                <div className="text-xs text-muted-foreground mt-2">
                  {t("booking.minimumChargeApplied")}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
