import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS, ar } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useTranslation } from 'react-i18next';
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Badge } from './ui/badge';

interface Booking {
  id: number;
  serviceId: number | null;
  serviceName?: string | null;
  dateTime: Date;
  address: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string | null;
}

interface BookingCalendarProps {
  bookings: Booking[];
  onSelectBooking?: (booking: Booking) => void;
}

export function BookingCalendar({ bookings, onSelectBooking }: BookingCalendarProps) {
  const { t, i18n } = useTranslation();
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());

  // Set up localizer with current language
  const locale = i18n.language === 'ar' ? ar : enUS;
  const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek: () => startOfWeek(new Date(), { locale }),
    getDay,
    locales: { 'en-US': enUS, 'ar': ar },
  });

  // Transform bookings into calendar events
  const events = useMemo(() => {
    return bookings.map((booking) => ({
      id: booking.id,
      title: booking.serviceName || t('cleaningService'),
      start: new Date(booking.dateTime),
      end: new Date(new Date(booking.dateTime).getTime() + 2 * 60 * 60 * 1000), // 2 hours default
      resource: booking,
    }));
  }, [bookings, t]);

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500';
      case 'confirmed':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Custom event style
  const eventStyleGetter = (event: any) => {
    const booking = event.resource as Booking;
    const backgroundColor = getStatusColor(booking.status).replace('bg-', '');
    
    const colorMap: Record<string, string> = {
      'yellow-500': '#eab308',
      'blue-500': '#3b82f6',
      'green-500': '#22c55e',
      'red-500': '#ef4444',
      'gray-500': '#6b7280',
    };

    return {
      style: {
        backgroundColor: colorMap[backgroundColor] || '#6b7280',
        borderRadius: '4px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block',
      },
    };
  };

  const handleNavigate = (newDate: Date) => {
    setDate(newDate);
  };

  const handleViewChange = (newView: View) => {
    setView(newView);
  };

  const handleSelectEvent = (event: any) => {
    if (onSelectBooking) {
      onSelectBooking(event.resource);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {t('bookingCalendar')}
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newDate = new Date(date);
                newDate.setMonth(date.getMonth() - 1);
                handleNavigate(newDate);
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleNavigate(new Date())}
            >
              {t('today')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newDate = new Date(date);
                newDate.setMonth(date.getMonth() + 1);
                handleNavigate(newDate);
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex gap-2 mt-4 flex-wrap">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-yellow-500" />
            <span className="text-xs text-muted-foreground">{t('pending')}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-blue-500" />
            <span className="text-xs text-muted-foreground">{t('confirmed')}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-500" />
            <span className="text-xs text-muted-foreground">{t('completed')}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-500" />
            <span className="text-xs text-muted-foreground">{t('cancelled')}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[600px]" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            view={view}
            date={date}
            onNavigate={handleNavigate}
            onView={handleViewChange}
            onSelectEvent={handleSelectEvent}
            eventPropGetter={eventStyleGetter}
            culture={i18n.language === 'ar' ? 'ar' : 'en-US'}
            messages={{
              next: t('next'),
              previous: t('previous'),
              today: t('today'),
              month: t('month'),
              week: t('week'),
              day: t('day'),
              agenda: t('agenda'),
              date: t('date'),
              time: t('time'),
              event: t('event'),
              noEventsInRange: t('noBookingsInRange'),
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
