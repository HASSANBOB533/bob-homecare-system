import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { trpc } from "@/lib/trpc";
import { Calendar, Clock, MapPin, Sparkles } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function BookService() {
  const { t, i18n } = useTranslation();
  const [, setLocation] = useLocation();
  const { data: services = [] } = trpc.services.list.useQuery();
  
  const [formData, setFormData] = useState({
    serviceId: "",
    date: "",
    time: "",
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  });

  // Get service name based on current language
  const getServiceName = (service: any) => {
    if (i18n.language === 'ar') {
      return service.name || service.nameEn || '';
    }
    return service.nameEn || service.name || '';
  };

  const createBookingMutation = trpc.bookings.createPublic.useMutation({
    onSuccess: (data) => {
      toast.success(t('Booking created successfully! We will contact you soon to confirm and send payment link.'));
      // Reset form
      setFormData({
        serviceId: "",
        date: "",
        time: "",
        name: "",
        email: "",
        phone: "",
        address: "",
        notes: "",
      });
      // Show booking reference number
      toast.info(`${t('Booking Reference')}: #${data.id}`);
    },
    onError: (error) => {
      toast.error(t('Failed to create booking. Please try again or contact us via WhatsApp.'));
      console.error('Booking error:', error);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.serviceId || !formData.date || !formData.time || !formData.name || !formData.phone || !formData.address) {
      toast.error(t('Please fill in all required fields'));
      return;
    }

    // Save booking to database
    createBookingMutation.mutate({
      serviceId: parseInt(formData.serviceId),
      date: formData.date,
      time: formData.time,
      customerName: formData.name,
      customerEmail: formData.email || undefined,
      phone: formData.phone,
      address: formData.address,
      notes: formData.notes || undefined,
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setLocation("/")}>
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">BOB Home Care</span>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Button variant="ghost" size="sm" onClick={() => setLocation("/")}>
              {t('Back to Home')}
            </Button>
          </div>
        </div>
      </header>

      {/* Booking Form */}
      <main className="flex-1 py-12">
        <div className="container max-w-3xl">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-3xl">{t('bookNow')}</CardTitle>
              <CardDescription className="text-base">
                {t('Fill in the form below to book your cleaning service')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Service Selection */}
                <div className="space-y-2">
                  <Label htmlFor="service" className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    {t('selectService')} *
                  </Label>
                  <Select value={formData.serviceId} onValueChange={(value) => setFormData({ ...formData, serviceId: value })}>
                    <SelectTrigger id="service">
                      <SelectValue placeholder={t('selectService')} />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service.id} value={service.id.toString()}>
                          {getServiceName(service)}
                          {service.duration && ` (${service.duration} min)`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date and Time */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      {t('selectDate')} *
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time" className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      {t('selectTime')} *
                    </Label>
                    <Select value={formData.time} onValueChange={(value) => setFormData({ ...formData, time: value })}>
                      <SelectTrigger id="time">
                        <SelectValue placeholder={t('selectTime')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="09:00">09:00 AM</SelectItem>
                        <SelectItem value="10:00">10:00 AM</SelectItem>
                        <SelectItem value="11:00">11:00 AM</SelectItem>
                        <SelectItem value="12:00">12:00 PM</SelectItem>
                        <SelectItem value="13:00">01:00 PM</SelectItem>
                        <SelectItem value="14:00">02:00 PM</SelectItem>
                        <SelectItem value="15:00">03:00 PM</SelectItem>
                        <SelectItem value="16:00">04:00 PM</SelectItem>
                        <SelectItem value="17:00">05:00 PM</SelectItem>
                        <SelectItem value="18:00">06:00 PM</SelectItem>
                        <SelectItem value="19:00">07:00 PM</SelectItem>
                        <SelectItem value="20:00">08:00 PM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-semibold">{t('Your Information')}</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('Full Name')} *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder={t('Enter your full name')}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">{t('Phone Number')} *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+20 123 456 7890"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">{t('Email')} ({t('optional')})</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="email@example.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      {t('address')} *
                    </Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder={t('Enter your full address')}
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">{t('notes')} ({t('optional')})</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder={t('Any special requests or notes')}
                      rows={3}
                    />
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button type="submit" size="lg" className="flex-1">
                    {t('submit')}
                  </Button>
                  <WhatsAppButton size="lg" variant="outline" className="flex-1" />
                </div>

                <p className="text-sm text-muted-foreground text-center">
                  {t('Your booking will be sent via WhatsApp for confirmation')}
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 bg-background">
        <div className="container text-center text-sm text-muted-foreground">
          <p>{t('copyright')}</p>
        </div>
      </footer>
    </div>
  );
}
