import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Bell, Calendar, Clock, MapPin, Plus, Star, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useTranslation } from "react-i18next";
import { ReviewDialog } from "@/components/ReviewDialog";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { format } from "date-fns";

export default function UserDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<{
    id: number;
    serviceId: number;
    serviceName: string;
  } | null>(null);

  const { data: bookings = [], isLoading } = trpc.bookings.myBookings.useQuery();
  const { data: myReviews = [] } = trpc.reviews.myReviews.useQuery();
  const { data: reviewStats } = trpc.reviews.myStats.useQuery();
  
  const updatePreferencesMutation = trpc.auth.updateNotificationPreferences.useMutation({
    onSuccess: () => {
      toast.success(t("preferencesUpdated"));
      utils.auth.me.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update preferences");
    },
  });

  const deleteMutation = trpc.bookings.delete.useMutation({
    onSuccess: () => {
      toast.success("Booking cancelled successfully");
      utils.bookings.myBookings.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to cancel booking");
    },
  });

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to cancel this booking?")) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Welcome, {user?.name || "User"}!</h1>
            <p className="text-muted-foreground mt-1">Manage your cleaning service bookings</p>
            {reviewStats && reviewStats.count > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                {reviewStats.count} reviews • {reviewStats.avgRating.toFixed(1)} ⭐ average rating
              </p>
            )}
          </div>
          <Button onClick={() => setLocation("/book")} size="lg">
            <Plus className="mr-2 h-4 w-4" />
            New Booking
          </Button>
        </div>

        {/* Notification Preferences Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              {t("notificationPreferences")}
            </CardTitle>
            <CardDescription>
              Choose how you want to receive booking updates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications">{t("emailNotifications")}</Label>
                <p className="text-sm text-muted-foreground">
                  {t("receiveEmailNotifications")}
                </p>
              </div>
              <Switch
                id="email-notifications"
                checked={user?.emailNotifications ?? true}
                onCheckedChange={(checked) => {
                  updatePreferencesMutation.mutate({ emailNotifications: checked });
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="whatsapp-notifications">{t("whatsappNotifications")}</Label>
                <p className="text-sm text-muted-foreground">
                  {t("receiveWhatsappNotifications")}
                </p>
              </div>
              <Switch
                id="whatsapp-notifications"
                checked={user?.whatsappNotifications ?? true}
                onCheckedChange={(checked) => {
                  updatePreferencesMutation.mutate({ whatsappNotifications: checked });
                }}
              />
            </div>

          </CardContent>
        </Card>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading bookings...</p>
          </div>
        ) : bookings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No bookings yet</h3>
              <p className="text-muted-foreground mb-4">
                Start by creating your first cleaning service booking
              </p>
              <Button onClick={() => setLocation("/book")}>
                <Plus className="mr-2 h-4 w-4" />
                Create Booking
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {bookings.map((booking) => (
              <Card key={booking.id} className="relative">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{booking.serviceName || "Service"}</CardTitle>
                      <CardDescription className="mt-1">
                        <span
                          className={`inline-block px-2 py-1 text-xs rounded-full ${
                            booking.status === "confirmed"
                              ? "bg-green-100 text-green-800"
                              : booking.status === "completed"
                              ? "bg-blue-100 text-blue-800"
                              : booking.status === "cancelled"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {booking.status}
                        </span>
                      </CardDescription>
                    </div>
                    {booking.status === "pending" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(booking.id)}
                        className="h-8 w-8 text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-start gap-2 text-sm">
                    <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <span>{format(new Date(booking.dateTime), "PPP")}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <span>{format(new Date(booking.dateTime), "p")}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <span>{booking.address}</span>
                  </div>
                  {booking.notes && (
                    <div className="text-sm text-muted-foreground pt-2 border-t">
                      {booking.notes}
                    </div>
                  )}
                  {booking.status === "completed" && (
                    <div className="pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          if (booking.serviceId) {
                            setSelectedBooking({
                              id: booking.id,
                              serviceId: booking.serviceId,
                              serviceName: booking.serviceName || "Service",
                            });
                            setReviewDialogOpen(true);
                          }
                        }}
                      >
                        <Star className="mr-2 h-4 w-4" />
                        Leave Review
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {selectedBooking && (
        <ReviewDialog
          open={reviewDialogOpen}
          onOpenChange={setReviewDialogOpen}
          bookingId={selectedBooking.id}
          serviceId={selectedBooking.serviceId}
          serviceName={selectedBooking.serviceName}
          onSuccess={() => {
            utils.bookings.myBookings.invalidate();
          }}
        />
      )}
    </DashboardLayout>
  );
}
