import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Home } from "lucide-react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";

export default function PaymentSuccess() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  
  // Get booking ID from URL query params
  const params = new URLSearchParams(window.location.search);
  const bookingId = params.get("bookingId");

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl">{t('Payment Successful!')}</CardTitle>
          <CardDescription>
            {t('Your booking has been confirmed and payment received')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {bookingId && (
            <div className="bg-muted p-4 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">{t('Booking Reference')}</p>
              <p className="text-2xl font-bold">#{bookingId}</p>
            </div>
          )}
          
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>{t('A confirmation message has been sent to your WhatsApp and email.')}</p>
            <p>{t('Our team will contact you shortly to confirm the appointment details.')}</p>
          </div>

          <div className="flex flex-col gap-2 pt-4">
            <Button onClick={() => setLocation("/")} className="w-full">
              <Home className="mr-2 h-4 w-4" />
              {t('Back to Home')}
            </Button>
            <Button variant="outline" onClick={() => setLocation("/check-booking")} className="w-full">
              {t('Check Booking Status')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
