import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { trpc } from "../lib/trpc";
import AdminLayout from "../components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Badge } from "../components/ui/badge";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import type { EventDropArg, EventClickArg } from "@fullcalendar/core";

export default function AdminCalendar() {
  const { t, i18n } = useTranslation();
  const [calendarView, setCalendarView] = useState<"dayGridMonth" | "timeGridWeek" | "timeGridDay">("timeGridWeek");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const { data: bookings = [], refetch } = trpc.bookings.allBookings.useQuery();
  const { data: services = [] } = trpc.services.list.useQuery();
  
  const rescheduleBookingMutation = trpc.bookings.reschedule.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (error: any) => {
      alert(t("Failed to reschedule booking") + ": " + error.message);
    },
  });

  // Filter bookings based on status and service
  const filteredBookings = bookings.filter((booking) => {
    const statusMatch = statusFilter === "all" || booking.status === statusFilter;
    const serviceMatch = serviceFilter === "all" || booking.serviceId === parseInt(serviceFilter);
    return statusMatch && serviceMatch;
  });

  // Convert bookings to FullCalendar events
  const events = filteredBookings.map((booking) => {
    const statusColors: Record<string, { bg: string; border: string }> = {
      pending: { bg: "#FEF3C7", border: "#F59E0B" },
      confirmed: { bg: "#DBEAFE", border: "#3B82F6" },
      completed: { bg: "#D1FAE5", border: "#10B981" },
      cancelled: { bg: "#FEE2E2", border: "#EF4444" },
    };

    const colors = statusColors[booking.status] || statusColors.pending;

    return {
      id: booking.id.toString(),
      title: `${booking.customerName} - ${booking.service?.nameEn || booking.service?.name || t("N/A")}`,
      start: new Date(booking.dateTime),
      end: new Date(new Date(booking.dateTime).getTime() + 2 * 60 * 60 * 1000), // Default 2 hours duration
      backgroundColor: colors.bg,
      borderColor: colors.border,
      textColor: "#1F2937",
      extendedProps: {
        booking,
      },
    };
  });

  const handleEventDrop = (info: EventDropArg) => {
    const bookingId = parseInt(info.event.id);
    const newDateTime = info.event.start;

    if (!newDateTime) return;

    rescheduleBookingMutation.mutate({
      id: bookingId,
      dateTime: newDateTime.toISOString(),
    });
  };

  const handleEventClick = (info: EventClickArg) => {
    const booking = info.event.extendedProps.booking;
    setSelectedBooking(booking);
    setDetailsDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      confirmed: "default",
      completed: "outline",
      cancelled: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{t(status)}</Badge>;
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Calendar className="w-8 h-8" />
              {t("Booking Calendar")}
            </h1>
            <p className="text-gray-600 mt-1">{t("Drag and drop bookings to reschedule")}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-4 justify-between">
              <CardTitle>{t("Schedule Overview")}</CardTitle>
              <div className="flex flex-wrap items-center gap-3">
                {/* View Selector */}
                <Select value={calendarView} onValueChange={(value: any) => setCalendarView(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dayGridMonth">{t("Month View")}</SelectItem>
                    <SelectItem value="timeGridWeek">{t("Week View")}</SelectItem>
                    <SelectItem value="timeGridDay">{t("Day View")}</SelectItem>
                  </SelectContent>
                </Select>

                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder={t("All Statuses")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("All Statuses")}</SelectItem>
                    <SelectItem value="pending">{t("Pending")}</SelectItem>
                    <SelectItem value="confirmed">{t("Confirmed")}</SelectItem>
                    <SelectItem value="completed">{t("Completed")}</SelectItem>
                    <SelectItem value="cancelled">{t("Cancelled")}</SelectItem>
                  </SelectContent>
                </Select>

                {/* Service Filter */}
                <Select value={serviceFilter} onValueChange={setServiceFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder={t("All Services")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("All Services")}</SelectItem>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id.toString()}>
                        {service.nameEn || service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView={calendarView}
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "",
              }}
              events={events}
              editable={true}
              droppable={true}
              eventDrop={handleEventDrop}
              eventClick={handleEventClick}
              height="auto"
              slotMinTime="06:00:00"
              slotMaxTime="22:00:00"
              allDaySlot={false}
              nowIndicator={true}
              locale={i18n.language}
              firstDay={i18n.language === "ar" ? 6 : 0} // Saturday for Arabic, Sunday for English
              direction={i18n.language === "ar" ? "rtl" : "ltr"}
            />
          </CardContent>
        </Card>

        {/* Booking Details Dialog */}
        <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t("Booking Details")}</DialogTitle>
            </DialogHeader>
            {selectedBooking && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{t("Customer")}</p>
                    <p className="text-base">{selectedBooking.customerName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">{t("Phone")}</p>
                    <p className="text-base">{selectedBooking.phone || t("N/A")}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">{t("Service")}</p>
                    <p className="text-base">
                      {selectedBooking.service?.nameEn || selectedBooking.service?.name || t("N/A")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">{t("Status")}</p>
                    <div className="mt-1">{getStatusBadge(selectedBooking.status)}</div>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-gray-500">{t("Address")}</p>
                    <p className="text-base">{selectedBooking.address}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-gray-500">{t("Date & Time")}</p>
                    <p className="text-base">
                      {new Date(selectedBooking.dateTime).toLocaleString(i18n.language === "ar" ? "ar-EG" : "en-US", {
                        dateStyle: "full",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                </div>
                {selectedBooking.notes && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">{t("Customer Notes")}</p>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-700 whitespace-pre-wrap">{selectedBooking.notes}</p>
                    </div>
                  </div>
                )}
                <div className="flex justify-end">
                  <Button onClick={() => setDetailsDialogOpen(false)}>{t("Close")}</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
