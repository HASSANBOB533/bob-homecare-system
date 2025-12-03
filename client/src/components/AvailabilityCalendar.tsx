import { useState, useEffect } from "react";
import { trpc } from "../lib/trpc";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { useTranslation } from "react-i18next";

interface AvailabilityCalendarProps {
  selectedDate?: string;
  onSelectSlot?: (date: string, time: string) => void;
}

export function AvailabilityCalendar({ selectedDate, onSelectSlot }: AvailabilityCalendarProps) {
  const { t } = useTranslation();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null);

  // Get calendar data for the current month
  const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];

  const { data: calendar, isLoading: calendarLoading } = trpc.availability.getCalendar.useQuery({
    startDate,
    endDate,
  });

  // Get available slots for selected date
  const { data: slots, isLoading: slotsLoading } = trpc.availability.getAvailableSlots.useQuery(
    { date: selectedDate || "" },
    { enabled: !!selectedDate }
  );

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleSlotClick = (date: string, time: string) => {
    setSelectedSlot({ date, time });
    onSelectSlot?.(date, time);
  };

  // Generate calendar grid
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-16 border border-border/50" />);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split("T")[0];
      const dayData = calendar?.find((d) => d.date === dateStr);
      const hasAvailability = dayData?.hasAvailability || false;
      const isToday = dateStr === new Date().toISOString().split("T")[0];
      const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));

      days.push(
        <button
          key={day}
          onClick={() => !isPast && onSelectSlot?.(dateStr, "")}
          disabled={isPast || !hasAvailability}
          className={`h-16 border border-border/50 p-2 text-sm transition-colors ${
            isToday ? "ring-2 ring-primary" : ""
          } ${
            hasAvailability && !isPast
              ? "hover:bg-primary/10 cursor-pointer"
              : "bg-muted/30 text-muted-foreground cursor-not-allowed"
          } ${selectedDate === dateStr ? "bg-primary/20" : ""}`}
        >
          <div className="font-semibold">{day}</div>
          {hasAvailability && !isPast && (
            <div className="text-xs text-green-600 dark:text-green-400">
              {dayData?.availableSlots} {t("slots")}
            </div>
          )}
        </button>
      );
    }

    return days;
  };

  return (
    <div className="space-y-6">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={handlePrevMonth}>
          ← {t("Previous")}
        </Button>
        <h3 className="text-lg font-semibold">
          {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </h3>
        <Button variant="outline" size="sm" onClick={handleNextMonth}>
          {t("Next")} →
        </Button>
      </div>

      {/* Calendar Grid */}
      {calendarLoading ? (
        <div className="text-center py-8">{t("Loading calendar...")}</div>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-center font-semibold text-sm py-2">
              {t(day)}
            </div>
          ))}
          {/* Calendar days */}
          {generateCalendarDays()}
        </div>
      )}

      {/* Available Time Slots */}
      {selectedDate && (
        <Card className="p-4">
          <h4 className="font-semibold mb-3">
            {t("Available Times for")} {selectedDate}
          </h4>
          {slotsLoading ? (
            <div className="text-center py-4">{t("Loading slots...")}</div>
          ) : slots && slots.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {slots.map((slot) => (
                <Button
                  key={`${slot.startTime}-${slot.endTime}`}
                  variant={selectedSlot?.time === slot.startTime ? "default" : "outline"}
                  disabled={!slot.available}
                  onClick={() => handleSlotClick(selectedDate, slot.startTime)}
                  className="flex flex-col items-center py-3"
                >
                  <span className="font-semibold">
                    {slot.startTime.substring(0, 5)} - {slot.endTime.substring(0, 5)}
                  </span>
                  {slot.available ? (
                    <span className="text-xs text-green-600 dark:text-green-400">
                      {slot.capacity - slot.bookedCount} {t("available")}
                    </span>
                  ) : (
                    <span className="text-xs text-red-600 dark:text-red-400">{t("Full")}</span>
                  )}
                </Button>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              {t("No slots available for this date")}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
