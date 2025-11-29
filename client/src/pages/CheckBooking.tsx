import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { trpc } from "@/lib/trpc";
import { Search, XCircle } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function CheckBooking() {
  const { t, i18n } = useTranslation();
  const [, setLocation] = useLocation();
  const [bookingId, setBookingId] = useState("");
  const [phone, setPhone] = useState("");
  const [booking, setBooking] = useState<any>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const checkBookingMutation = trpc.bookings.checkStatus.useMutation({
    onSuccess: (data) => {
      if (data) {
        setBooking(data);
      } else {
        toast.error(t('Booking not found. Please check your booking reference and phone number.'));
      }
    },
    onError: () => {
      toast.error(t('Failed to check booking status. Please try again.'));
    },
  });

  const cancelMutation = trpc.bookings.cancelPublic.useMutation({
    onSuccess: () => {
      toast.success(t('Booking cancelled successfully'));
      setShowCancelDialog(false);
      // Refresh booking status
      checkBookingMutation.mutate({
        id: parseInt(bookingId),
        phone: phone,
      });
    },
    onError: (error) => {
      toast.error(error.message || t('Failed to cancel booking'));
      setShowCancelDialog(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingId || !phone) {
      toast.error(t('Please enter both booking reference and phone number'));
      return;
    }
    checkBookingMutation.mutate({
      id: parseInt(bookingId),
      phone: phone,
    });
  };

  const handleCancelBooking = () => {
    cancelMutation.mutate({
      id: parseInt(bookingId),
      phone: phone,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "text-green-600";
      case "completed":
        return "text-blue-600";
      case "cancelled":
        return "text-red-600";
      default:
        return "text-yellow-600";
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: t('Pending'),
      confirmed: t('Confirmed'),
      completed: t('Completed'),
      cancelled: t('Cancelled'),
    };
    return statusMap[status] || status;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏠</span>
            <span className="font-bold text-xl">BOB Home Care</span>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Button variant="outline" onClick={() => setLocation("/")}>
              {t('Back to Home')}
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container py-12">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-6 h-6" />
                {t('Check Booking Status')}
              </CardTitle>
              <CardDescription>
                {t('Enter your booking reference and phone number to check your booking status')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="bookingId">{t('Booking Reference')} *</Label>
                  <Input
                    id="bookingId"
                    type="number"
                    placeholder="123"
                    value={bookingId}
                    onChange={(e) => setBookingId(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">{t('Phone Number')} *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+20 123 456 7890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={checkBookingMutation.isPending}>
                  {checkBookingMutation.isPending ? t('Checking...') : t('Check Status')}
                </Button>
              </form>

              {booking && (
                <div className="mt-8 p-6 border rounded-lg space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{t('Booking Details')}</h3>
                      <p className="text-sm text-muted-foreground">#{booking.id}</p>
                    </div>
                    <span className={`font-semibold ${getStatusColor(booking.status)}`}>
                      {getStatusText(booking.status)}
                    </span>
                  </div>

                  <div className="grid gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground">{t('Customer Name')}</p>
                      <p className="font-medium">{booking.customerName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('Service')}</p>
                      <p className="font-medium">{booking.serviceName || t('Not specified')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('Date & Time')}</p>
                      <p className="font-medium">
                        {new Date(booking.dateTime).toLocaleString(i18n.language === 'ar' ? 'ar-EG' : 'en-US')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('Address')}</p>
                      <p className="font-medium">{booking.address}</p>
                    </div>
                    {booking.notes && (
                      <div>
                        <p className="text-sm text-muted-foreground">{t('Notes')}</p>
                        <p className="font-medium">{booking.notes}</p>
                      </div>
                    )}
                  </div>

                  {booking.status === "pending" && (
                    <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        {t('Your booking is pending confirmation. We will contact you soon to confirm and send the payment link.')}
                      </p>
                    </div>
                  )}

                  {(booking.status === "pending" || booking.status === "confirmed") && (
                    <div className="mt-6 pt-6 border-t">
                      <Button
                        variant="destructive"
                        className="w-full"
                        onClick={() => setShowCancelDialog(true)}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        {t('Cancel Booking')}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="border-t py-6 bg-muted/50">
        <div className="container text-center text-sm text-muted-foreground">
          {t('copyright')}
        </div>
      </footer>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('Cancel Booking')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('Are you sure you want to cancel this booking? This action cannot be undone.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('No, Keep Booking')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelBooking}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('Yes, Cancel Booking')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
