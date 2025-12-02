import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface AddOnTier {
  id: number;
  bedrooms: number;
  price: number;
}

interface AddOn {
  id: number;
  nameEn: string;
  name: string; // Arabic name
  descriptionEn: string | null;
  description: string | null; // Arabic description
  price: number; // Base price
  pricingType: string;
  active: boolean;
  tiers: AddOnTier[];
}

interface SelectedAddOn {
  addOnId: number;
  name: string;
  price: number;
  tierId?: number;
}

interface AddOnsSelectorProps {
  addOns: AddOn[];
  selectedAddOns: SelectedAddOn[];
  onAddOnsChange: (addOns: SelectedAddOn[]) => void;
  selectedBedrooms?: number | null;
}

export function AddOnsSelector({
  addOns,
  selectedAddOns,
  onAddOnsChange,
  selectedBedrooms,
}: AddOnsSelectorProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const handleToggleAddOn = (addOn: AddOn, checked: boolean) => {
    if (checked) {
      // For fixed price add-ons
      if (addOn.pricingType === "FIXED" && addOn.price) {
        onAddOnsChange([
          ...selectedAddOns,
          {
            addOnId: addOn.id,
            name: isRTL ? addOn.name : addOn.nameEn,
            price: addOn.price,
          },
        ]);
      }
      // For tiered add-ons, select first tier or tier matching bedrooms
      else if (addOn.pricingType !== "FIXED" && addOn.tiers.length > 0) {
        const matchingTier =
          addOn.tiers.find((t) => t.bedrooms === selectedBedrooms) ||
          addOn.tiers[0];
        onAddOnsChange([
          ...selectedAddOns,
          {
            addOnId: addOn.id,
            name: isRTL ? addOn.name : addOn.nameEn,
            price: matchingTier.price,
            tierId: matchingTier.id,
          },
        ]);
      }
    } else {
      onAddOnsChange(selectedAddOns.filter((a) => a.addOnId !== addOn.id));
    }
  };

  const handleTierChange = (addOn: AddOn, tierId: number) => {
    const tier = addOn.tiers.find((t) => t.id === tierId);
    if (!tier) return;

    onAddOnsChange(
      selectedAddOns.map((a) =>
        a.addOnId === addOn.id
          ? {
              ...a,
              price: tier.price,
              tierId: tier.id,
            }
          : a
      )
    );
  };

  if (addOns.length === 0) return null;

  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold">{t("booking.addOns")}</Label>

      <div className="space-y-3">
        {addOns.map((addOn) => {
          const selectedAddOn = selectedAddOns.find(
            (a) => a.addOnId === addOn.id
          );
          const isSelected = !!selectedAddOn;

          return (
            <Card
              key={addOn.id}
              className={`transition-all ${
                isSelected ? "border-primary bg-primary/5" : ""
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id={`addon-${addOn.id}`}
                    checked={isSelected}
                    onCheckedChange={(checked) =>
                      handleToggleAddOn(addOn, checked as boolean)
                    }
                  />
                  <div className="flex-1">
                    <label
                      htmlFor={`addon-${addOn.id}`}
                      className="font-semibold cursor-pointer"
                    >
                      {isRTL ? addOn.name : addOn.nameEn}
                    </label>
                    {(isRTL ? addOn.description : addOn.descriptionEn) && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {isRTL ? addOn.description : addOn.descriptionEn}
                      </p>
                    )}

                    {/* Fixed price */}
                    {addOn.pricingType === "FIXED" && addOn.price && (
                      <div className="text-sm text-primary font-bold mt-2">
                        {addOn.price.toLocaleString()} {t("booking.egp")}
                      </div>
                    )}

                    {/* Tiered pricing */}
                    {isSelected &&
                      addOn.pricingType === "TIERED" &&
                      addOn.tiers.length > 1 && (
                        <RadioGroup
                          value={selectedAddOn?.tierId?.toString() || ""}
                          onValueChange={(value) =>
                            handleTierChange(addOn, parseInt(value))
                          }
                          className="mt-3 space-y-2"
                        >
                          {addOn.tiers.map((tier) => (
                            <div
                              key={tier.id}
                              className="flex items-center gap-2"
                            >
                              <RadioGroupItem
                                value={tier.id.toString()}
                                id={`tier-${tier.id}`}
                              />
                              <label
                                htmlFor={`tier-${tier.id}`}
                                className="text-sm cursor-pointer flex-1"
                              >
                                {tier.bedrooms && (
                                  <span>
                                    {tier.bedrooms} {t("booking.bedrooms")} -{" "}
                                  </span>
                                )}
                                <span className="font-semibold text-primary">
                                  {tier.price.toLocaleString()}{" "}
                                  {t("booking.egp")}
                                </span>
                              </label>
                            </div>
                          ))}
                        </RadioGroup>
                      )}

                    {/* Show selected tier price for single tier */}
                    {isSelected &&
                      addOn.pricingType === "TIERED" &&
                      addOn.tiers.length === 1 && (
                        <div className="text-sm text-primary font-bold mt-2">
                          {addOn.tiers[0].price.toLocaleString()}{" "}
                          {t("booking.egp")}
                        </div>
                      )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedAddOns.length > 0 && (
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="space-y-2">
              {selectedAddOns.map((addOn) => (
                <div
                  key={addOn.addOnId}
                  className="flex justify-between items-center text-sm"
                >
                  <span className="text-muted-foreground">{addOn.name}:</span>
                  <span className="font-semibold">
                    {addOn.price.toLocaleString()} {t("booking.egp")}
                  </span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="font-semibold">{t("booking.addOnsTotal")}:</span>
                <span className="text-lg font-bold text-primary">
                  {selectedAddOns
                    .reduce((sum, a) => sum + a.price, 0)
                    .toLocaleString()}{" "}
                  {t("booking.egp")}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
