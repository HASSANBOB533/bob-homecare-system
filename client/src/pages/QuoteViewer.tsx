import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Calendar, Clock, MapPin, FileText, Share2, ArrowRight, AlertCircle } from "lucide-react";
import { ShareQuoteDialog } from "@/components/quote/ShareQuoteDialog";
import { toast } from "sonner";

export default function QuoteViewer() {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";
  const [, params] = useRoute("/quote/:code");
  const [, setLocation] = useLocation();
  const [showShareDialog, setShowShareDialog] = useState(false);

  const quoteCode = params?.code || "";

  const { data: quote, isLoading, error } = trpc.quote.getByCode.useQuery(
    { code: quoteCode },
    { enabled: !!quoteCode, retry: false }
  );

  // Format price helper
  const formatPrice = (price: number) => {
    return (price / 100).toLocaleString("en-EG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Format date helper
  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString(
      isArabic ? "ar-EG" : "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );
  };

  const handleConvertToBooking = () => {
    if (!quote) return;

    // Store quote data in sessionStorage for the booking form
    sessionStorage.setItem("quoteData", JSON.stringify({
      serviceId: quote.serviceId,
      selections: quote.selections,
      totalPrice: quote.totalPrice,
      customerName: quote.customerName,
      customerEmail: quote.customerEmail,
      customerPhone: quote.customerPhone,
    }));

    // Navigate to booking page
    setLocation("/book");
    toast.success(t("quote.convertToBooking"));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-muted-foreground">{t("quote.loadingQuote")}</p>
        </div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
          <div className="container flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🧹</span>
              <span className="font-bold text-xl">BOB Home Care</span>
            </div>
            <LanguageSwitcher />
          </div>
        </header>

        <main className="container py-12">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-6 w-6" />
                <CardTitle>{t("quote.quoteNotFound")}</CardTitle>
              </div>
              <CardDescription>
                {error?.message || t("quote.quoteExpired")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setLocation("/")} className="w-full">
                {t("Back to Home")}
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const selections = quote.selections as any;
  const serviceName = isArabic ? quote.serviceName : quote.serviceNameEn;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setLocation("/")}>
            <span className="text-2xl">🧹</span>
            <span className="font-bold text-xl">BOB Home Care</span>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <main className="container py-12">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-3xl">{t("quote.quoteDetails")}</CardTitle>
                  <CardDescription>
                    {t("quote.quoteCode")}: <strong>{quote.quoteCode}</strong>
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowShareDialog(true)}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  {t("quote.shareQuote")}
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Service Details */}
          <Card>
            <CardHeader>
              <CardTitle>{t("Service")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">{serviceName}</span>
                {quote.serviceDuration && (
                  <Badge variant="secondary">
                    {quote.serviceDuration} {t("minutes")}
                  </Badge>
                )}
              </div>

              <Separator />

              {/* Selection Details */}
              <div className="space-y-3">
                {selections.bedrooms && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{t("booking.bedrooms")}:</span>
                    <span className="font-medium">{selections.bedrooms}</span>
                  </div>
                )}

                {selections.squareMeters && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{t("booking.squareMeters")}:</span>
                    <span className="font-medium">{selections.squareMeters} {t("booking.sqm")}</span>
                  </div>
                )}

                {selections.date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{t("selectDate")}:</span>
                    <span className="font-medium">{formatDate(selections.date)}</span>
                  </div>
                )}

                {selections.time && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{t("selectTime")}:</span>
                    <span className="font-medium">{selections.time}</span>
                  </div>
                )}

                {selections.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                    <div className="flex-1">
                      <span className="text-muted-foreground">{t("address")}:</span>
                      <p className="font-medium">{selections.address}</p>
                    </div>
                  </div>
                )}

                {selections.notes && (
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground mt-1" />
                    <div className="flex-1">
                      <span className="text-muted-foreground">{t("notes")}:</span>
                      <p className="font-medium">{selections.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Price Summary */}
          <Card>
            <CardHeader>
              <CardTitle>{t("booking.priceBreakdown")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-2xl font-bold">
                  <span>{t("booking.finalPrice")}:</span>
                  <span className="text-primary">
                    {formatPrice(quote.totalPrice)} {t("booking.egp")}
                  </span>
                </div>

                <Separator />

                <div className="text-sm text-muted-foreground">
                  {t("quote.validUntil")}: {formatDate(quote.expiresAt)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          {(quote.customerName || quote.customerEmail || quote.customerPhone) && (
            <Card>
              <CardHeader>
                <CardTitle>{t("Your Information")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {quote.customerName && (
                  <div>
                    <span className="text-muted-foreground">{t("Full Name")}:</span>
                    <p className="font-medium">{quote.customerName}</p>
                  </div>
                )}
                {quote.customerEmail && (
                  <div>
                    <span className="text-muted-foreground">{t("Email")}:</span>
                    <p className="font-medium">{quote.customerEmail}</p>
                  </div>
                )}
                {quote.customerPhone && (
                  <div>
                    <span className="text-muted-foreground">{t("Phone Number")}:</span>
                    <p className="font-medium">{quote.customerPhone}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              size="lg"
              className="flex-1"
              onClick={handleConvertToBooking}
            >
              {t("quote.convertToBooking")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="flex-1"
              onClick={() => setLocation("/")}
            >
              {t("Back to Home")}
            </Button>
          </div>
        </div>
      </main>

      {/* Share Dialog */}
      <ShareQuoteDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        quote={quote}
      />

      {/* Footer */}
      <footer className="border-t py-6 bg-background mt-12">
        <div className="container text-center text-sm text-muted-foreground">
          <p>{t("copyright")}</p>
        </div>
      </footer>
    </div>
  );
}
