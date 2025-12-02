import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PricingItem {
  id: number;
  itemName: string;
  price: number;
  minimumCharge: number;
}

interface SelectedItem {
  itemId: number;
  itemName: string;
  price: number;
  quantity: number;
}

interface UpholsteryItemSelectorProps {
  items: PricingItem[];
  selectedItems: SelectedItem[];
  onItemsChange: (items: SelectedItem[]) => void;
  minimumCharge: number;
}

export function UpholsteryItemSelector({
  items,
  selectedItems,
  onItemsChange,
  minimumCharge,
}: UpholsteryItemSelectorProps) {
  const { t } = useTranslation();

  const handleToggleItem = (item: PricingItem, checked: boolean) => {
    if (checked) {
      onItemsChange([
        ...selectedItems,
        {
          itemId: item.id,
          itemName: item.itemName,
          price: item.price,
          quantity: 1,
        },
      ]);
    } else {
      onItemsChange(selectedItems.filter((i) => i.itemId !== item.id));
    }
  };

  const handleQuantityChange = (itemId: number, quantity: number) => {
    if (quantity < 1) return;
    onItemsChange(
      selectedItems.map((item) =>
        item.itemId === itemId ? { ...item, quantity } : item
      )
    );
  };

  const totalPrice = selectedItems.reduce(
    (sum, item) => sum + (item.price / 100) * item.quantity,
    0
  );
  const finalPrice = Math.max(totalPrice, minimumCharge / 100);

  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold">
        {t("booking.selectItems")}
      </Label>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {items.map((item) => {
          const selectedItem = selectedItems.find((i) => i.itemId === item.id);
          const isSelected = !!selectedItem;

          return (
            <Card
              key={item.id}
              className={`transition-all ${
                isSelected ? "border-primary bg-primary/5" : ""
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id={`item-${item.id}`}
                    checked={isSelected}
                    onCheckedChange={(checked) =>
                      handleToggleItem(item, checked as boolean)
                    }
                  />
                  <div className="flex-1">
                    <label
                      htmlFor={`item-${item.id}`}
                      className="font-semibold cursor-pointer"
                    >
                      {item.itemName}
                    </label>
                    <div className="text-sm text-primary font-bold">
                      {(item.price / 100).toLocaleString()} {t("booking.egp")}
                    </div>

                    {isSelected && selectedItem && (
                      <div className="flex items-center gap-2 mt-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            handleQuantityChange(
                              item.id,
                              selectedItem.quantity - 1
                            )
                          }
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          min="1"
                          value={selectedItem.quantity}
                          onChange={(e) =>
                            handleQuantityChange(
                              item.id,
                              parseInt(e.target.value) || 1
                            )
                          }
                          className="h-8 w-16 text-center"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            handleQuantityChange(
                              item.id,
                              selectedItem.quantity + 1
                            )
                          }
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <span className="text-sm text-muted-foreground ml-2">
                          {((selectedItem.price / 100) * selectedItem.quantity).toLocaleString()}{" "}
                          {t("booking.egp")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedItems.length > 0 && (
        <Card className="bg-muted/50">
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                {t("booking.subtotal")}:
              </span>
              <span className="font-semibold">
                {totalPrice.toLocaleString()} {t("booking.egp")}
              </span>
            </div>
            {finalPrice > totalPrice && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">
                  {t("booking.minimumCharge")}:
                </span>
                <span className="font-semibold">
                  {minimumCharge.toLocaleString()} {t("booking.egp")}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-base font-semibold">
                {t("booking.total")}:
              </span>
              <span className="text-lg font-bold text-primary">
                {finalPrice.toLocaleString()} {t("booking.egp")}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
