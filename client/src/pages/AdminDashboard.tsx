import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { Calendar, CheckCircle, Plus, Trash2, XCircle, CalendarDays, List, Edit, Save, MessageCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarView } from "@/components/CalendarView";

export default function AdminDashboard() {
  const utils = trpc.useUtils();
  const [showServiceDialog, setShowServiceDialog] = useState(false);
  const [editingNotes, setEditingNotes] = useState<number | null>(null);
  const [notesText, setNotesText] = useState("");
  const [newService, setNewService] = useState({
    name: "",
    description: "",
    duration: "",
  });

  const { data: bookings = [], isLoading: bookingsLoading } = trpc.bookings.allBookings.useQuery();
  const { data: services = [] } = trpc.services.list.useQuery();

  const createServiceMutation = trpc.services.create.useMutation({
    onSuccess: () => {
      toast.success("Service created successfully");
      utils.services.list.invalidate();
      setShowServiceDialog(false);
      setNewService({ name: "", description: "", duration: "" });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create service");
    },
  });

  const deleteServiceMutation = trpc.services.delete.useMutation({
    onSuccess: () => {
      toast.success("Service deleted successfully");
      utils.services.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete service");
    },
  });

  const updateBookingMutation = trpc.bookings.update.useMutation({
    onSuccess: () => {
      toast.success("Booking updated successfully");
      utils.bookings.allBookings.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update booking");
    },
  });

  const sendWhatsAppMutation = trpc.bookings.sendWhatsAppConfirmation.useMutation({
    onSuccess: (data) => {
      if (data.success && data.whatsappURL) {
        window.open(data.whatsappURL, '_blank');
        toast.success("WhatsApp confirmation opened");
      } else {
        toast.error(data.message || "Failed to generate WhatsApp confirmation");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send WhatsApp confirmation");
    },
  });

  const handleCreateService = () => {
    if (!newService.name) {
      toast.error("Service name is required");
      return;
    }

    createServiceMutation.mutate({
      name: newService.name,
      description: newService.description || undefined,
      duration: newService.duration ? parseInt(newService.duration) : undefined,
    });
  };

  const handleDeleteService = (id: number) => {
    if (confirm("Are you sure you want to delete this service?")) {
      deleteServiceMutation.mutate({ id });
    }
  };

  const handleStatusChange = (id: number, status: "pending" | "confirmed" | "completed" | "cancelled") => {
    updateBookingMutation.mutate({ id, status });
  };

  const handleEditNotes = (booking: typeof bookings[0]) => {
    setEditingNotes(booking.id);
    setNotesText(booking.notes || "");
  };

  const handleSaveNotes = (id: number) => {
    updateBookingMutation.mutate({ id, notes: notesText }, {
      onSuccess: () => {
        setEditingNotes(null);
        setNotesText("");
      }
    });
  };

  const handleSendWhatsApp = (bookingId: number) => {
    sendWhatsAppMutation.mutate({ bookingId });
  };

  const pendingCount = bookings.filter((b) => b.status === "pending").length;
  const confirmedCount = bookings.filter((b) => b.status === "confirmed").length;
  const completedCount = bookings.filter((b) => b.status === "completed").length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage bookings and services</p>
        </div>

        {/* View Tabs */}
        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="list">
              <List className="mr-2 h-4 w-4" />
              List View
            </TabsTrigger>
            <TabsTrigger value="calendar">
              <CalendarDays className="mr-2 h-4 w-4" />
              Calendar View
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-6 mt-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{confirmedCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Services Management */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Services</CardTitle>
                <CardDescription>Manage available cleaning services</CardDescription>
              </div>
              <Button onClick={() => setShowServiceDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Service
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {services.map((service) => (
                <div key={service.id} className="flex justify-between items-start p-3 border rounded-lg">
                  <div>
                    <h4 className="font-semibold">{service.name}</h4>
                    {service.description && (
                      <p className="text-sm text-muted-foreground">{service.description}</p>
                    )}
                    <div className="text-sm mt-1 text-muted-foreground">
                      {service.duration && <span>{service.duration} min</span>}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteService(service.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Bookings Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Bookings</CardTitle>
            <CardDescription>View and manage customer bookings</CardDescription>
          </CardHeader>
          <CardContent>
            {bookingsLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading bookings...</div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No bookings yet</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{booking.customerName}</div>
                            {booking.userEmail && (
                              <div className="text-xs text-muted-foreground">{booking.userEmail}</div>
                            )}
                          </div>
                        </TableCell>
                            <TableCell>{booking.address}</TableCell>
                        <TableCell>
                          {editingNotes === booking.id ? (
                            <div className="flex items-center gap-2">
                              <Textarea
                                value={notesText}
                                onChange={(e) => setNotesText(e.target.value)}
                                placeholder="Add notes..."
                                rows={2}
                                className="min-w-[200px]"
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleSaveNotes(booking.id)}
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">
                                {booking.notes || "No notes"}
                              </span>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleEditNotes(booking)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={booking.status}
                            onValueChange={(value) =>
                              handleStatusChange(booking.id, value as any)
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="confirmed">Confirmed</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {booking.status === "confirmed" && booking.phone && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSendWhatsApp(booking.id)}
                                title="Send WhatsApp confirmation"
                              >
                                <MessageCircle className="h-4 w-4 mr-1" />
                                Send Confirmation
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="calendar" className="mt-6">
            <CalendarView
              bookings={bookings}
              onStatusChange={handleStatusChange}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Service Dialog */}
      <Dialog open={showServiceDialog} onOpenChange={setShowServiceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Service</DialogTitle>
            <DialogDescription>Create a new cleaning service offering</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="serviceName">Service Name *</Label>
              <Input
                id="serviceName"
                value={newService.name}
                onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                placeholder="e.g., Deep Cleaning"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serviceDescription">Description</Label>
              <Textarea
                id="serviceDescription"
                value={newService.description}
                onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                placeholder="Describe the service..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serviceDuration">Duration (min)</Label>
              <Input
                id="serviceDuration"
                type="number"
                value={newService.duration}
                onChange={(e) => setNewService({ ...newService, duration: e.target.value })}
                placeholder="120"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowServiceDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateService} disabled={createServiceMutation.isPending}>
              {createServiceMutation.isPending ? "Creating..." : "Create Service"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
