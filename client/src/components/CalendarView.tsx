import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Card } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { useState } from 'react';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const locales = {
  'en-US': require('date-fns/locale/en-US'),
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface Booking {
  id: number;
  serviceName: string | null;
  customerName: string;
  phone: string | null;
  address: string;
  dateTime: Date;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes: string | null;
}

interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  resource: Booking;
}

interface CalendarViewProps {
  bookings: Booking[];
  onStatusChange: (id: number, status: 'pending' | 'confirmed' | 'completed' | 'cancelled') => void;
}

export function CalendarView({ bookings, onStatusChange }: CalendarViewProps) {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  // Convert bookings to calendar events
  const events: CalendarEvent[] = bookings.map((booking) => {
    const startDate = new Date(booking.dateTime);
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 2); // Assume 2-hour duration

    return {
      id: booking.id,
      title: `${booking.customerName} - ${booking.serviceName || 'Service'}`,
      start: startDate,
      end: endDate,
      resource: booking,
    };
  });

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowDialog(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    }
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    const status = event.resource.status;
    let backgroundColor = '#fbbf24'; // yellow for pending
    
    switch (status) {
      case 'confirmed':
        backgroundColor = '#10b981'; // green
        break;
      case 'completed':
        backgroundColor = '#3b82f6'; // blue
        break;
      case 'cancelled':
        backgroundColor = '#ef4444'; // red
        break;
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block',
      },
    };
  };

  return (
    <>
      <Card className="p-6">
        <div style={{ height: '600px' }}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            onSelectEvent={handleSelectEvent}
            eventPropGetter={eventStyleGetter}
            views={['month', 'week', 'day']}
            defaultView="week"
          />
        </div>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>
              View and manage booking information
            </DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Service</label>
                <p className="text-sm text-muted-foreground">{selectedEvent.resource.serviceName || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Customer</label>
                <p className="text-sm text-muted-foreground">{selectedEvent.resource.customerName}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Phone</label>
                <p className="text-sm text-muted-foreground">{selectedEvent.resource.phone || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Address</label>
                <p className="text-sm text-muted-foreground">{selectedEvent.resource.address}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Date & Time</label>
                <p className="text-sm text-muted-foreground">
                  {format(selectedEvent.resource.dateTime, 'PPP p')}
                </p>
              </div>
              {selectedEvent.resource.notes && (
                <div>
                  <label className="text-sm font-medium">Notes</label>
                  <p className="text-sm text-muted-foreground">{selectedEvent.resource.notes}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select
                  value={selectedEvent.resource.status}
                  onValueChange={(value) => {
                    onStatusChange(selectedEvent.resource.id, value as any);
                    setShowDialog(false);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowDialog(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
