import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";

interface PackageDiscount {
  id: number;
  visits: number;
  discountPercentage: number;
}

interface SpecialOffer {
  id: number;
  name: string;
  nameEn: string;
  description: string | null; // Arabic description
  descriptionEn: string | null;
  discountType: string;
  discountValue: number;
  maxDiscount: number | null;
  minProperties: number | null;
}

interface PackageDiscountSelectorProps {
  packages: PackageDiscount[];
  selectedPackage: number | null;
  onSelect: (packageId: number | null, visits: number, discountPercentage: number) => void;
}

export function PackageDiscountSelector({
  packages,
  selectedPackage,
  onSelect,
}: PackageDiscountSelectorProps) {
  const { t } = useTranslation();

  if (packages.length === 0) return null;

  return (
    <div className="space-y-3">
      <Label className="text-base font-semibold">
        {t("booking.packageDiscount")}
      </Label>
      <RadioGroup
        value={selectedPackage?.toString() || "none"}
        onValueChange={(value) => {
          if (value === "none") {
            onSelect(null, 0, 0);
          } else {
            const pkg = packages.find((p) => p.id.toString() === value);
            if (pkg) {
              onSelect(pkg.id, pkg.visits, pkg.discountPercentage);
            }
          }
        }}
      >
        <div className="space-y-2">
          <Card
            className={`cursor-pointer transition-all hover:border-primary ${
              !selectedPackage ? "border-primary bg-primary/5" : ""
            }`}
            onClick={() => onSelect(null, 0, 0)}
          >
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <RadioGroupItem value="none" id="package-none" />
                <label htmlFor="package-none" className="cursor-pointer flex-1">
                  {t("booking.noPackage")}
                </label>
              </div>
            </CardContent>
          </Card>

          {packages.map((pkg) => (
            <Card
              key={pkg.id}
              className={`cursor-pointer transition-all hover:border-primary ${
                selectedPackage === pkg.id ? "border-primary bg-primary/5" : ""
              }`}
              onClick={() => onSelect(pkg.id, pkg.visits, pkg.discountPercentage)}
            >
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <RadioGroupItem
                    value={pkg.id.toString()}
                    id={`package-${pkg.id}`}
                  />
                  <label
                    htmlFor={`package-${pkg.id}`}
                    className="cursor-pointer flex-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">
                        {pkg.visits} {t("booking.visits")}
                      </span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        {pkg.discountPercentage}% {t("booking.off")}
                      </Badge>
                    </div>
                  </label>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </RadioGroup>
    </div>
  );
}

interface SpecialOffersSelectorProps {
  offers: SpecialOffer[];
  selectedOffer: number | null;
  onSelect: (offerId: number | null, offer: SpecialOffer | null) => void;
}

export function SpecialOffersSelector({
  offers,
  selectedOffer,
  onSelect,
}: SpecialOffersSelectorProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  if (offers.length === 0) return null;

  return (
    <div className="space-y-3">
      <Label className="text-base font-semibold">
        {t("booking.specialOffers")}
      </Label>
      <RadioGroup
        value={selectedOffer?.toString() || "none"}
        onValueChange={(value) => {
          if (value === "none") {
            onSelect(null, null);
          } else {
            const offer = offers.find((o) => o.id.toString() === value);
            if (offer) {
              onSelect(offer.id, offer);
            }
          }
        }}
      >
        <div className="space-y-2">
          <Card
            className={`cursor-pointer transition-all hover:border-primary ${
              !selectedOffer ? "border-primary bg-primary/5" : ""
            }`}
            onClick={() => onSelect(null, null)}
          >
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <RadioGroupItem value="none" id="offer-none" />
                <label htmlFor="offer-none" className="cursor-pointer flex-1">
                  {t("booking.noOffer")}
                </label>
              </div>
            </CardContent>
          </Card>

          {offers.map((offer) => (
            <Card
              key={offer.id}
              className={`cursor-pointer transition-all hover:border-primary ${
                selectedOffer === offer.id ? "border-primary bg-primary/5" : ""
              }`}
              onClick={() => onSelect(offer.id, offer)}
            >
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <RadioGroupItem
                    value={offer.id.toString()}
                    id={`offer-${offer.id}`}
                  />
                  <label
                    htmlFor={`offer-${offer.id}`}
                    className="cursor-pointer flex-1"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{offer.name}</span>
                        <Badge
                          variant="secondary"
                          className={
                            offer.discountType === "percentage"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }
                        >
                          {offer.discountType === "percentage" ? (
                            <>
                              {offer.discountValue}% {t("booking.off")}
                            </>
                          ) : (
                            <>
                              +{offer.discountValue}% {t("booking.premium")}
                            </>
                          )}
                        </Badge>
                      </div>
                      {(isRTL ? offer.description : offer.descriptionEn) && (
                        <p className="text-xs text-muted-foreground">
                          {isRTL ? offer.description : offer.descriptionEn}
                        </p>
                      )}
                      {offer.maxDiscount && (
                        <p className="text-xs text-muted-foreground">
                          {t("booking.maxDiscount")}: {(offer.maxDiscount / 100).toLocaleString()}{" "}
                          {t("booking.egp")}
                        </p>
                      )}
                    </div>
                  </label>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </RadioGroup>
    </div>
  );
}
