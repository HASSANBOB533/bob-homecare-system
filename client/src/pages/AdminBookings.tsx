import { useState } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar, DollarSign, TrendingUp, Users, ChevronDown, ChevronUp, Trash2, Download } from "lucide-react";
import { toast } from "sonner";

type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";

export default function AdminBookings() {
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [expandedBooking, setExpandedBooking] = useState<number | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<number | null>(null);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [bookingNotes, setBookingNotes] = useState<{ booking: any } | null>(null);

  const { data: bookings = [], refetch } = trpc.bookings.allBookings.useQuery();
  const updateStatusMutation = trpc.bookings.updateStatus.useMutation({
    onSuccess: () => {
      toast.success(t("Booking status updated successfully"));
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const deleteBookingMutation = trpc.bookings.delete.useMutation({
    onSuccess: () => {
      toast.success(t("Booking deleted successfully"));
      setDeleteDialogOpen(false);
      setBookingToDelete(null);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || t("Failed to delete booking"));
    },
  });

  // Filter bookings by status and date range
  const filteredBookings = bookings.filter((booking: any) => {
    // Status filter
    if (statusFilter !== "all" && booking.status !== statusFilter) return false;
    
    // Date range filter
    if (dateFrom && new Date(booking.dateTime) < new Date(dateFrom)) return false;
    if (dateTo && new Date(booking.dateTime) > new Date(dateTo + "T23:59:59")) return false;
    
    return true;
  });

  // Export to Excel function
  const exportToExcel = () => {
    const XLSX = require('xlsx');
    
    // Prepare data for export
    const exportData = filteredBookings.map((booking: any) => ({
      [t("Booking ID")]: `#${booking.id}`,
      [t("Customer Name")]: booking.customerName,
      [t("Phone")]: booking.phone,
      [t("Email")]: booking.email || "N/A",
      [t("Service")]: booking.service?.nameEn || booking.service?.name || "N/A",
      [t("Date & Time")]: new Date(booking.dateTime).toLocaleString(),
      [t("Address")]: booking.address,
      [t("Amount")]: booking.amount ? `${(booking.amount / 100).toFixed(0)} EGP` : "N/A",
      [t("Status")]: booking.status.toUpperCase(),
      [t("Notes")]: booking.notes || "N/A",
      [t("Created At")]: new Date(booking.createdAt).toLocaleString(),
    }));

    // Create worksheet and workbook
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, t("Bookings"));

    // Generate filename with date range
    const filename = `BOB_Bookings_${dateFrom || 'all'}_to_${dateTo || 'all'}_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // Download file
    XLSX.writeFile(wb, filename);
    toast.success(t("Bookings exported successfully"));
  };

  // Calculate revenue statistics
  const stats = {
    totalRevenue: bookings
      .filter((b: any) => b.status === "completed" && b.amount)
      .reduce((sum: number, b: any) => sum + (b.amount || 0), 0) / 100,
    pendingBookings: bookings.filter((b: any) => b.status === "pending").length,
    confirmedBookings: bookings.filter((b: any) => b.status === "confirmed").length,
    completedBookings: bookings.filter((b: any) => b.status === "completed").length,
  };

  const handleStatusUpdate = (bookingId: number, newStatus: BookingStatus) => {
    updateStatusMutation.mutate({ id: bookingId, status: newStatus });
  };

  const handleDeleteClick = (bookingId: number) => {
    setBookingToDelete(bookingId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (bookingToDelete) {
      deleteBookingMutation.mutate({ id: bookingToDelete });
    }
  };

  const handleViewNotes = (booking: any) => {
    setBookingNotes({ booking });
    setNotesDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      confirmed: "default",
      completed: "outline",
      cancelled: "destructive",
    };
    return (
      <Badge variant={variants[status] || "default"}>
        {t(status.charAt(0).toUpperCase() + status.slice(1))}
      </Badge>
    );
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString(t("locale"), {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">{t("Booking Management")}</h1>
          <p className="text-gray-600 mt-2">
            {t("View and manage all bookings with pricing details")}
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{t("Total Revenue")}</p>
                  <p className="text-2xl font-bold">{stats.totalRevenue.toFixed(0)} {t("EGP")}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{t("Pending")}</p>
                  <p className="text-2xl font-bold">{stats.pendingBookings}</p>
                </div>
                <Calendar className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{t("Confirmed")}</p>
                  <p className="text-2xl font-bold">{stats.confirmedBookings}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{t("Completed")}</p>
                  <p className="text-2xl font-bold">{stats.completedBookings}</p>
                </div>
                <Users className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <CardTitle>{t("All Bookings")}</CardTitle>
                <Button onClick={exportToExcel} variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />
                  {t("Export to Excel")}
                </Button>
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">{t("From")}:</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="border rounded px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">{t("To")}:</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="border rounded px-3 py-2 text-sm"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder={t("Filter by status")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("All Status")}</SelectItem>
                    <SelectItem value="pending">{t("Pending")}</SelectItem>
                    <SelectItem value="confirmed">{t("Confirmed")}</SelectItem>
                    <SelectItem value="completed">{t("Completed")}</SelectItem>
                    <SelectItem value="cancelled">{t("Cancelled")}</SelectItem>
                  </SelectContent>
                </Select>
                {(dateFrom || dateTo || statusFilter !== "all") && (
                  <Button
                    onClick={() => {
                      setDateFrom("");
                      setDateTo("");
                      setStatusFilter("all");
                    }}
                    variant="ghost"
                    size="sm"
                  >
                    {t("Clear Filters")}
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("ID")}</TableHead>
                  <TableHead>{t("Customer")}</TableHead>
                  <TableHead>{t("Service")}</TableHead>
                  <TableHead>{t("Date & Time")}</TableHead>
                  <TableHead>{t("Amount")}</TableHead>
                  <TableHead>{t("Status")}</TableHead>
                  <TableHead>{t("Actions")}</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                      {t("No bookings found")}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBookings.map((booking: any) => (
                    <>
                      <TableRow key={booking.id}>
                        <TableCell className="font-medium">#{booking.id}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{booking.customerName}</div>
                            <div className="text-sm text-gray-600">{booking.phone}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {booking.service?.nameEn || booking.service?.name || t("N/A")}
                        </TableCell>
                        <TableCell>{formatDate(booking.dateTime)}</TableCell>
                        <TableCell>
                          {booking.amount ? (
                            <span className="font-semibold">
                              {(booking.amount / 100).toFixed(0)} {t("EGP")}
                            </span>
                          ) : (
                            <span className="text-gray-400">{t("N/A")}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(booking.status)}
                            <Select
                              value={booking.status}
                              onValueChange={(value) => handleStatusUpdate(booking.id, value as BookingStatus)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">{t("Pending")}</SelectItem>
                                <SelectItem value="confirmed">{t("Confirmed")}</SelectItem>
                                <SelectItem value="completed">{t("Completed")}</SelectItem>
                                <SelectItem value="cancelled">{t("Cancelled")}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewNotes(booking)}
                              title={t("View Notes")}
                            >
                              {t("View Notes")}
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteClick(booking.id)}
                              disabled={deleteBookingMutation.isPending}
                              title={t("Delete Booking")}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          {booking.pricingBreakdown && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedBooking(expandedBooking === booking.id ? null : booking.id)}
                            >
                              {expandedBooking === booking.id ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                      {expandedBooking === booking.id && booking.pricingBreakdown && (
                        <TableRow>
                          <TableCell colSpan={8} className="bg-gray-50">
                            <div className="p-4 space-y-3">
                              <h4 className="font-semibold text-sm">{t("Pricing Breakdown")}</h4>
                              <div className="grid md:grid-cols-2 gap-4 text-sm">
                                <div>
                                  <div className="flex justify-between py-1">
                                    <span className="text-gray-600">{t("Base Price")}:</span>
                                    <span className="font-medium">
                                      {booking.pricingBreakdown.basePrice} {t("EGP")}
                                    </span>
                                  </div>
                                  <div className="flex justify-between py-1">
                                    <span className="text-gray-600">{t("Add-ons Total")}:</span>
                                    <span className="font-medium">
                                      {booking.pricingBreakdown.addOnsTotal} {t("EGP")}
                                    </span>
                                  </div>
                                  {booking.pricingBreakdown.packageDiscount > 0 && (
                                    <div className="flex justify-between py-1 text-green-600">
                                      <span>{t("Package Discount")}:</span>
                                      <span className="font-medium">
                                        -{booking.pricingBreakdown.packageDiscount} {t("EGP")}
                                      </span>
                                    </div>
                                  )}
                                  {booking.pricingBreakdown.specialOfferAdjustment > 0 && (
                                    <div className="flex justify-between py-1 text-green-600">
                                      <span>{t("Special Offer")}:</span>
                                      <span className="font-medium">
                                        -{booking.pricingBreakdown.specialOfferAdjustment} {t("EGP")}
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex justify-between py-1 border-t mt-2 pt-2">
                                    <span className="font-semibold">{t("Final Price")}:</span>
                                    <span className="font-bold text-green-600">
                                      {booking.pricingBreakdown.finalPrice} {t("EGP")}
                                    </span>
                                  </div>
                                </div>
                                <div>
                                  <h5 className="font-medium mb-2">{t("Selections")}:</h5>
                                  {booking.pricingBreakdown.selections?.bedrooms && (
                                    <div className="text-gray-600">
                                      {t("Bedrooms")}: {booking.pricingBreakdown.selections.bedrooms}
                                    </div>
                                  )}
                                  {booking.pricingBreakdown.selections?.squareMeters > 0 && (
                                    <div className="text-gray-600">
                                      {t("Area")}: {booking.pricingBreakdown.selections.squareMeters} m²
                                    </div>
                                  )}
                                  {booking.pricingBreakdown.selections?.addOns?.length > 0 && (
                                    <div className="mt-2">
                                      <div className="text-gray-600 font-medium">{t("Add-ons")}:</div>
                                      <ul className="list-disc list-inside text-gray-600">
                                        {booking.pricingBreakdown.selections.addOns.map((addon: any, idx: number) => (
                                          <li key={idx}>{addon.name}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* View Notes Dialog */}
      <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("Booking Notes & Details")}</DialogTitle>
          </DialogHeader>
          {bookingNotes && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">{t("Customer")}</p>
                  <p className="text-base">{bookingNotes.booking.customerName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">{t("Phone")}</p>
                  <p className="text-base">{bookingNotes.booking.phone || t("N/A")}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">{t("Service")}</p>
                  <p className="text-base">
                    {bookingNotes.booking.service?.nameEn || bookingNotes.booking.service?.name || t("N/A")}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">{t("Address")}</p>
                  <p className="text-base">{bookingNotes.booking.address}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">{t("Customer Notes")}</p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  {bookingNotes.booking.notes ? (
                    <p className="text-gray-700 whitespace-pre-wrap">{bookingNotes.booking.notes}</p>
                  ) : (
                    <p className="text-gray-400 italic">{t("No notes provided")}</p>
                  )}
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => setNotesDialogOpen(false)}>
                  {t("Close")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Delete Booking")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              {t("Are you sure you want to delete this booking? This action cannot be undone.")}
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={deleteBookingMutation.isPending}
              >
                {t("Cancel")}
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={deleteBookingMutation.isPending}
              >
                {deleteBookingMutation.isPending ? t("Deleting...") : t("Delete")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
