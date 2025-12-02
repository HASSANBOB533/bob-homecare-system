import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Save, Share2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ShareQuoteDialog } from "./ShareQuoteDialog";

interface SaveQuoteButtonProps {
  serviceId: number;
  selections: {
    bedrooms?: number;
    squareMeters?: number;
    selectedItems?: Array<{ itemId: number; quantity: number }>;
    addOns?: Array<{ addOnId: number; quantity?: number }>;
    packageDiscountId?: number;
    specialOfferId?: number;
    date?: string;
    time?: string;
    address?: string;
    notes?: string;
  };
  totalPrice: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
}

export function SaveQuoteButton({
  serviceId,
  selections,
  totalPrice,
  customerName,
  customerEmail,
  customerPhone,
}: SaveQuoteButtonProps) {
  const { t } = useTranslation();
  // Using sonner toast
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [savedQuote, setSavedQuote] = useState<any>(null);

  const createQuoteMutation = trpc.quote.create.useMutation({
    onSuccess: (data) => {
      setSavedQuote(data);
      setShowShareDialog(true);
      toast.success(t("quote.quoteSaved"), {
        description: `${t("quote.quoteCode")}: ${data.quoteCode}`,
      });
    },
    onError: (error) => {
      toast.error(t("quote.quoteFailed"), {
        description: error.message,
      });
    },
  });

  const handleSaveQuote = () => {
    // Validate that we have a service and price
    if (!serviceId || totalPrice <= 0) {
      toast.error(t("quote.quoteFailed"), {
        description: "Please select a service and configure pricing first.",
      });
      return;
    }

    createQuoteMutation.mutate({
      serviceId,
      selections,
      totalPrice,
      customerName,
      customerEmail,
      customerPhone,
    });
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={handleSaveQuote}
        disabled={createQuoteMutation.isPending}
        className="w-full"
      >
        {createQuoteMutation.isPending ? (
          <>
            <Save className="mr-2 h-4 w-4 animate-spin" />
            {t("saving")}
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            {t("quote.saveQuote")}
          </>
        )}
      </Button>

      {savedQuote && (
        <ShareQuoteDialog
          open={showShareDialog}
          onOpenChange={setShowShareDialog}
          quote={savedQuote}
        />
      )}
    </>
  );
}
