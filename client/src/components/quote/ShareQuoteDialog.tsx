import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Mail, MessageCircle } from "lucide-react";
import { toast } from "sonner";

interface ShareQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: {
    quoteCode: string;
    totalPrice: number;
    expiresAt: Date | string;
  };
}

export function ShareQuoteDialog({
  open,
  onOpenChange,
  quote,
}: ShareQuoteDialogProps) {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";

  // Generate quote URL
  const quoteUrl = `${window.location.origin}/quote/${quote.quoteCode}`;

  // Format price
  const formattedPrice = (quote.totalPrice / 100).toLocaleString("en-EG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // Format expiry date
  const expiryDate = new Date(quote.expiresAt).toLocaleDateString(
    isArabic ? "ar-EG" : "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(quoteUrl);
      toast.success(t("quote.linkCopied"));
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const handleShareWhatsApp = () => {
    const message = isArabic
      ? `مرحباً! إليك عرض السعر الخاص بي من BOB Home Care:\n\nرمز العرض: ${quote.quoteCode}\nالسعر الإجمالي: ${formattedPrice} جنيه\nصالح حتى: ${expiryDate}\n\nعرض التفاصيل: ${quoteUrl}`
      : `Hello! Here's my quote from BOB Home Care:\n\nQuote Code: ${quote.quoteCode}\nTotal Price: ${formattedPrice} EGP\nValid until: ${expiryDate}\n\nView details: ${quoteUrl}`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleShareEmail = () => {
    const subject = isArabic
      ? `عرض سعر من BOB Home Care - ${quote.quoteCode}`
      : `Quote from BOB Home Care - ${quote.quoteCode}`;

    const body = isArabic
      ? `مرحباً،\n\nإليك عرض السعر الخاص بي من BOB Home Care:\n\nرمز العرض: ${quote.quoteCode}\nالسعر الإجمالي: ${formattedPrice} جنيه\nصالح حتى: ${expiryDate}\n\nيمكنك عرض التفاصيل الكاملة على الرابط التالي:\n${quoteUrl}\n\nشكراً لك!`
      : `Hello,\n\nHere's my quote from BOB Home Care:\n\nQuote Code: ${quote.quoteCode}\nTotal Price: ${formattedPrice} EGP\nValid until: ${expiryDate}\n\nYou can view the full details at:\n${quoteUrl}\n\nThank you!`;

    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("quote.shareYourQuote")}</DialogTitle>
          <DialogDescription>
            {t("quote.quoteCode")}: <strong>{quote.quoteCode}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Quote Link */}
          <div className="space-y-2">
            <Label htmlFor="quote-link">{t("quote.quoteLink")}</Label>
            <div className="flex gap-2">
              <Input
                id="quote-link"
                value={quoteUrl}
                readOnly
                className="flex-1"
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={handleCopyLink}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Price and Expiry Info */}
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                {t("booking.finalPrice")}:
              </span>
              <span className="text-sm font-semibold">
                {formattedPrice} {t("booking.egp")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                {t("quote.validUntil")}:
              </span>
              <span className="text-sm">{expiryDate}</span>
            </div>
          </div>

          {/* Share Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleShareWhatsApp}
              className="w-full"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              {t("quote.shareViaWhatsApp")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleShareEmail}
              className="w-full"
            >
              <Mail className="mr-2 h-4 w-4" />
              {t("quote.shareViaEmail")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
