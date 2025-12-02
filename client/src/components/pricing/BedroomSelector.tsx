import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface BedroomTier {
  id: number;
  bedrooms: number;
  price: number;
}

interface BedroomSelectorProps {
  tiers: BedroomTier[];
  selectedBedrooms: number | null;
  onSelect: (bedrooms: number, price: number) => void;
}

export function BedroomSelector({ tiers, selectedBedrooms, onSelect }: BedroomSelectorProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  return (
    <div className="space-y-3">
      <Label className="text-base font-semibold">
        {t("booking.selectBedrooms")}
      </Label>
      <RadioGroup
        value={selectedBedrooms?.toString() || ""}
        onValueChange={(value) => {
          const bedrooms = parseInt(value);
          const tier = tiers.find((t) => t.bedrooms === bedrooms);
          if (tier) {
            onSelect(bedrooms, tier.price);
          }
        }}
      >
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {tiers.map((tier) => (
            <Card
              key={tier.id}
              className={`cursor-pointer transition-all hover:border-primary ${
                selectedBedrooms === tier.bedrooms
                  ? "border-primary bg-primary/5"
                  : ""
              }`}
              onClick={() => onSelect(tier.bedrooms, tier.price)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <RadioGroupItem
                    value={tier.bedrooms.toString()}
                    id={`bedroom-${tier.bedrooms}`}
                  />
                  <div className="flex-1">
                    <div className="font-semibold">
                      {tier.bedrooms} {t("booking.bedrooms")}
                    </div>
                    <div className="text-sm text-primary font-bold">
                      {tier.price.toLocaleString()} {t("booking.egp")}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </RadioGroup>
    </div>
  );
}
