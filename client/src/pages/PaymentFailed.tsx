import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { XCircle, Home, RefreshCw } from "lucide-react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { WhatsAppButton } from "@/components/WhatsAppButton";

export default function PaymentFailed() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  
  // Get booking ID from URL query params
  const params = new URLSearchParams(window.location.search);
  const bookingId = params.get("bookingId");

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
            <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl">{t('Payment Failed')}</CardTitle>
          <CardDescription>
            {t('We could not process your payment')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {bookingId && (
            <div className="bg-muted p-4 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">{t('Booking Reference')}</p>
              <p className="text-2xl font-bold">#{bookingId}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {t('Your booking is saved but payment is pending')}
              </p>
            </div>
          )}
          
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>{t('Your booking has been created but the payment was not completed.')}</p>
            <p>{t('You can try again or contact us via WhatsApp to complete the payment.')}</p>
          </div>

          <div className="flex flex-col gap-2 pt-4">
            <Button onClick={() => setLocation("/book")} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              {t('Try Again')}
            </Button>
            <WhatsAppButton className="w-full" />
            <Button variant="outline" onClick={() => setLocation("/")} className="w-full">
              <Home className="mr-2 h-4 w-4" />
              {t('Back to Home')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
