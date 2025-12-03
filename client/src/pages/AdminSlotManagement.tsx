import { useState } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "../lib/trpc";
import AdminLayout from "../components/AdminLayout";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import { Calendar, Clock, Users, Ban, Check } from "lucide-react";
import { toast } from "sonner";

export default function AdminSlotManagement() {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [isBlockDateOpen, setIsBlockDateOpen] = useState(false);
  const [blockStartDate, setBlockStartDate] = useState("");
  const [blockEndDate, setBlockEndDate] = useState("");

  // Get slots for selected date
  const { data: slots, isLoading, refetch } = trpc.availability.getAvailableSlots.useQuery({
    date: selectedDate,
  });

  // Mutations
  const updateCapacity = trpc.availability.updateSlotCapacity.useMutation({
    onSuccess: () => {
      toast.success(t("Capacity updated successfully"));
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const toggleSlot = trpc.availability.toggleSlotAvailability.useMutation({
    onSuccess: () => {
      toast.success(t("Slot availability updated"));
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const blockDates = trpc.availability.blockDateRange.useMutation({
    onSuccess: () => {
      toast.success(t("Dates blocked successfully"));
      setIsBlockDateOpen(false);
      setBlockStartDate("");
      setBlockEndDate("");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleCapacityChange = (slotId: number, newCapacity: number) => {
    if (newCapacity < 1 || newCapacity > 10) {
      toast.error(t("Capacity must be between 1 and 10"));
      return;
    }
    updateCapacity.mutate({ slotId, capacity: newCapacity });
  };

  const handleToggleSlot = (slotId: number, currentStatus: boolean) => {
    toggleSlot.mutate({ slotId, isAvailable: !currentStatus });
  };

  const handleBlockDates = () => {
    if (!blockStartDate || !blockEndDate) {
      toast.error(t("Please select both start and end dates"));
      return;
    }
    if (blockStartDate > blockEndDate) {
      toast.error(t("Start date must be before end date"));
      return;
    }
    blockDates.mutate({ startDate: blockStartDate, endDate: blockEndDate });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t("Time Slot Management")}</h1>
            <p className="text-muted-foreground">
              {t("Manage availability, capacity, and block dates")}
            </p>
          </div>
          <Button onClick={() => setIsBlockDateOpen(true)}>
            <Ban className="mr-2 h-4 w-4" />
            {t("Block Dates")}
          </Button>
        </div>

        {/* Date Selector */}
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="date">{t("Select Date")}</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="mt-2"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{new Date(selectedDate).toLocaleDateString()}</span>
            </div>
          </div>
        </Card>

        {/* Slots List */}
        {isLoading ? (
          <Card className="p-6">
            <div className="text-center">{t("Loading slots...")}</div>
          </Card>
        ) : slots && slots.length > 0 ? (
          <div className="grid gap-4">
            {slots.map((slot) => (
              <Card key={slot.id} className="p-6">
                <div className="flex items-center justify-between">
                  {/* Slot Info */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <span className="font-semibold text-lg">
                        {slot.startTime.substring(0, 5)} - {slot.endTime.substring(0, 5)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm">
                        {slot.bookedCount} / {slot.capacity} {t("booked")}
                      </span>
                    </div>
                    <div>
                      {slot.available ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                          <Check className="h-3 w-3" />
                          {t("Available")}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
                          <Ban className="h-3 w-3" />
                          {t("Blocked")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`capacity-${slot.id}`} className="text-sm">
                        {t("Capacity")}:
                      </Label>
                      <Input
                        id={`capacity-${slot.id}`}
                        type="number"
                        min="1"
                        max="10"
                        value={slot.capacity}
                        onChange={(e) =>
                          handleCapacityChange(slot.id, parseInt(e.target.value))
                        }
                        className="w-20"
                      />
                    </div>
                    <Button
                      variant={slot.isAvailable ? "destructive" : "default"}
                      size="sm"
                      onClick={() => handleToggleSlot(slot.id, slot.isAvailable)}
                    >
                      {slot.isAvailable ? t("Block") : t("Unblock")}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-6">
            <div className="text-center text-muted-foreground">
              {t("No slots available for this date")}
            </div>
          </Card>
        )}

        {/* Block Dates Dialog */}
        <Dialog open={isBlockDateOpen} onOpenChange={setIsBlockDateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("Block Date Range")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="start-date">{t("Start Date")}</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={blockStartDate}
                  onChange={(e) => setBlockStartDate(e.target.value)}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="end-date">{t("End Date")}</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={blockEndDate}
                  onChange={(e) => setBlockEndDate(e.target.value)}
                  className="mt-2"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {t("All time slots in this date range will be blocked from booking.")}
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsBlockDateOpen(false)}>
                {t("Cancel")}
              </Button>
              <Button onClick={handleBlockDates} disabled={blockDates.isPending}>
                {blockDates.isPending ? t("Blocking...") : t("Block Dates")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
