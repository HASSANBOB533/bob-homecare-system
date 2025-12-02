import { useState } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Download, RefreshCw, Star, Clock, MapPin, DollarSign } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

type BookingStatus = "all" | "pending" | "confirmed" | "completed" | "cancelled";

export default function MyBookings() {
  const { t, i18n } = useTranslation();
  const [, setLocation] = useLocation();
  const [statusFilter, setStatusFilter] = useState<BookingStatus>("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  const { data: bookings, isLoading } = trpc.bookings.myBookings.useQuery();
  const downloadInvoiceMutation = trpc.bookings.downloadInvoice.useMutation();

  const handleDownloadInvoice = async (bookingId: number) => {
    try {
      const result = await downloadInvoiceMutation.mutateAsync({
        bookingId,
        language: i18n.language as "ar" | "en",
      });

      // Convert base64 to blob and download
      const byteCharacters = atob(result.pdf);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(t("myBookings.invoiceDownloaded"));
    } catch (error) {
      console.error("Failed to download invoice:", error);
      toast.error(t("myBookings.invoiceDownloadFailed"));
    }
  };

  const handleRebook = (booking: any) => {
    // Pre-fill booking form with previous booking details
    if (booking.serviceId) {
      const params = new URLSearchParams({
        serviceId: booking.serviceId.toString(),
        address: booking.address || "",
      });
      setLocation(`/book?${params.toString()}`);
    } else {
      setLocation("/book");
    }
  };

  const handleLeaveReview = (bookingId: number) => {
    setLocation(`/review/${bookingId}`);
  };

  // Filter and sort bookings
  const filteredBookings = bookings
    ?.filter((booking) => statusFilter === "all" || booking.status === statusFilter)
    .sort((a, b) => {
      const dateA = new Date(a.dateTime).getTime();
      const dateB = new Date(b.dateTime).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

  const getStatusBadge = (status: string) => {
    const statusColors = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };

    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}>
        {t(`myBookings.status.${status}`)}
      </Badge>
    );
  };

  const formatPrice = (amount?: number) => {
    if (!amount) return t("myBookings.notAvailable");
    return `${(amount / 100).toFixed(2)} ${t("common.egp")}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container py-8">
          <Skeleton className="h-10 w-64 mb-8" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t("myBookings.title")}</h1>
          <Button variant="outline" onClick={() => setLocation("/book")}>
            {t("myBookings.bookNewService")}
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as BookingStatus)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder={t("myBookings.filterByStatus")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("myBookings.allBookings")}</SelectItem>
              <SelectItem value="pending">{t("myBookings.status.pending")}</SelectItem>
              <SelectItem value="confirmed">{t("myBookings.status.confirmed")}</SelectItem>
              <SelectItem value="completed">{t("myBookings.status.completed")}</SelectItem>
              <SelectItem value="cancelled">{t("myBookings.status.cancelled")}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as "newest" | "oldest")}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder={t("myBookings.sortBy")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">{t("myBookings.newestFirst")}</SelectItem>
              <SelectItem value="oldest">{t("myBookings.oldestFirst")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bookings List */}
        {!filteredBookings || filteredBookings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">{t("myBookings.noBookings")}</p>
              <Button className="mt-4" onClick={() => setLocation("/book")}>
                {t("myBookings.bookFirstService")}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <Card key={booking.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl mb-2">
                        {i18n.language === "ar" ? booking.service?.name : (booking.service?.nameEn || booking.service?.name)}
                      </CardTitle>
                      <p className="text-sm text-gray-500">
                        {t("myBookings.reference")}: BOB-{booking.id}
                      </p>
                    </div>
                    {getStatusBadge(booking.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Booking Details */}
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">{t("myBookings.dateTime")}</p>
                          <p className="font-medium">
                            {new Date(booking.dateTime).toLocaleDateString(i18n.language, {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                          <p className="text-sm text-gray-600">
                            {new Date(booking.dateTime).toLocaleTimeString(i18n.language, {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">{t("myBookings.address")}</p>
                          <p className="font-medium">{booking.address}</p>
                        </div>
                      </div>

                      {booking.notes && (
                        <div className="flex items-start gap-3">
                          <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-500">{t("myBookings.notes")}</p>
                            <p className="text-sm text-gray-600">{booking.notes}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Pricing Details */}
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <DollarSign className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-500 mb-2">{t("myBookings.pricingDetails")}</p>

                          {booking.pricingBreakdown ? (
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">{t("myBookings.basePrice")}</span>
                                <span className="font-medium">
                                  {formatPrice(booking.pricingBreakdown.basePrice)}
                                </span>
                              </div>

                              {booking.pricingBreakdown.addOns &&
                                booking.pricingBreakdown.addOns.length > 0 && (
                                  <div className="space-y-1 pl-2 border-l-2 border-gray-200">
                                    {booking.pricingBreakdown.addOns.map((addon: any, idx: number) => (
                                      <div key={idx} className="flex justify-between text-xs">
                                        <span className="text-gray-500">{addon.name}</span>
                                        <span>{formatPrice(addon.price)}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}

                              {booking.pricingBreakdown.packageDiscount && (
                                <div className="flex justify-between text-green-600">
                                  <span>{t("myBookings.packageDiscount")}</span>
                                  <span>
                                    -{formatPrice(booking.pricingBreakdown.packageDiscount.discountAmount)}
                                  </span>
                                </div>
                              )}

                              {booking.pricingBreakdown.specialOffer && (
                                <div className="flex justify-between text-green-600">
                                  <span>{booking.pricingBreakdown.specialOffer.name}</span>
                                  <span>
                                    -{formatPrice(booking.pricingBreakdown.specialOffer.discountAmount)}
                                  </span>
                                </div>
                              )}

                              <div className="flex justify-between pt-2 border-t font-bold text-base">
                                <span>{t("myBookings.total")}</span>
                                <span className="text-green-600">{formatPrice(booking.amount)}</span>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-600">{formatPrice(booking.amount)}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 mt-6 pt-6 border-t">
                    {booking.status === "completed" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadInvoice(booking.id)}
                          disabled={downloadInvoiceMutation.isPending}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          {downloadInvoiceMutation.isPending
                            ? t("myBookings.downloading")
                            : t("myBookings.downloadInvoice")}
                        </Button>

                        <Button variant="outline" size="sm" onClick={() => handleLeaveReview(booking.id)}>
                          <Star className="w-4 h-4 mr-2" />
                          {t("myBookings.leaveReview")}
                        </Button>
                      </>
                    )}

                    <Button variant="outline" size="sm" onClick={() => handleRebook(booking)}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      {t("myBookings.bookAgain")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
