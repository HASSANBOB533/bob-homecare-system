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
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BedroomSelector } from "@/components/pricing/BedroomSelector";
import { SquareMeterInput } from "@/components/pricing/SquareMeterInput";
import { UpholsteryItemSelector } from "@/components/pricing/UpholsteryItemSelector";
import { AddOnsSelector } from "@/components/pricing/AddOnsSelector";
import { PackageDiscountSelector, SpecialOffersSelector } from "@/components/pricing/DiscountsSelector";
import { PriceBreakdownCard } from "@/components/pricing/PriceBreakdownCard";
import { usePriceCalculation } from "@/hooks/usePriceCalculation";
import { Separator } from "@/components/ui/separator";

interface SelectedItem {
  itemId: number;
  itemName: string;
  price: number;
  quantity: number;
}

interface SelectedAddOn {
  addOnId: number;
  name: string;
  price: number;
  tierId?: number;
}

interface SpecialOffer {
  id: number;
  name: string;
  nameEn: string;
  description: string | null; // Arabic description
  descriptionEn: string | null;
  discountType: string;
  discountValue: number;
  maxDiscount: number | null;
  minProperties: number | null;
}

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

  // Pricing state
  const [selectedBedrooms, setSelectedBedrooms] = useState<number | null>(null);
  const [bedroomPrice, setBedroomPrice] = useState(0);
  
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [squareMeters, setSquareMeters] = useState(0);
  const [sqmPricePerUnit, setSqmPricePerUnit] = useState(0);
  const [sqmMinimum, setSqmMinimum] = useState(0);
  
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [itemsMinimum, setItemsMinimum] = useState(0);
  
  const [selectedAddOns, setSelectedAddOns] = useState<SelectedAddOn[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [packageDiscountPercent, setPackageDiscountPercent] = useState(0);
  const [selectedOffer, setSelectedOffer] = useState<number | null>(null);
  const [selectedOfferData, setSelectedOfferData] = useState<SpecialOffer | null>(null);

  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState("");
  const [currentBookingId, setCurrentBookingId] = useState<number | null>(null);

  // Fetch pricing data when service is selected
  const selectedServiceId = formData.serviceId ? parseInt(formData.serviceId) : undefined;
  const { data: pricingData } = trpc.pricing.getServicePricing.useQuery(
    { serviceId: selectedServiceId! },
    { enabled: !!selectedServiceId }
  );
  
  // Debug: Log pricing data
  useEffect(() => {
    if (pricingData) {
      console.log('Pricing Data:', pricingData);
      console.log('Service:', pricingData.service);
      console.log('Pricing:', pricingData.pricing);
      console.log('Pricing Type:', pricingData.service?.pricingType);
    }
  }, [pricingData]);
  const { data: addOns = [] } = trpc.pricing.getAddOns.useQuery();
  const { data: packageDiscounts = [] } = trpc.pricing.getPackageDiscounts.useQuery(
    { serviceId: selectedServiceId! },
    { enabled: !!selectedServiceId }
  );
  const { data: specialOffers = [] } = trpc.pricing.getSpecialOffers.useQuery();

  // Reset pricing when service changes
  useEffect(() => {
    setSelectedBedrooms(null);
    setBedroomPrice(0);
    setSelectedVariant(null);
    setSquareMeters(0);
    setSqmPricePerUnit(0);
    setSqmMinimum(0);
    setSelectedItems([]);
    setItemsMinimum(0);
    setSelectedAddOns([]);
    setSelectedPackage(null);
    setPackageDiscountPercent(0);
    setSelectedOffer(null);
    setSelectedOfferData(null);
  }, [formData.serviceId]);

  // Calculate base price based on pricing type
  const calculateBasePrice = () => {
    if (!pricingData) return 0;

    const pricingType = pricingData.service.pricingType;

    if (pricingType === "BEDROOM_BASED") {
      return bedroomPrice;
    } else if (pricingType === "SQM_BASED") {
      const calculated = squareMeters * sqmPricePerUnit;
      return Math.max(calculated, sqmMinimum);
    } else if (pricingType === "ITEM_BASED") {
      const itemsTotal = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      return Math.max(itemsTotal, itemsMinimum);
    }

    return 0;
  };

  const basePrice = calculateBasePrice();

  // Calculate final price
  const priceBreakdown = usePriceCalculation({
    basePrice,
    selectedAddOns,
    packageDiscountPercent,
    specialOffer: selectedOfferData,
  });

  const initiatePaymentMutation = trpc.bookings.initiatePayment.useMutation({
    onSuccess: (data) => {
      setPaymentUrl(data.iframeUrl);
      setShowPaymentDialog(true);
    },
    onError: (error) => {
      toast.error(t('Payment initialization failed. Please try again.'));
      console.error('Payment error:', error);
    },
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
      setCurrentBookingId(data.id);
      toast.success(t('Booking created! Proceeding to payment...'));
      
      // Initiate payment
      if (formData.email) {
        initiatePaymentMutation.mutate({
          bookingId: data.id,
          serviceId: parseInt(formData.serviceId),
          customerName: formData.name,
          customerEmail: formData.email,
          phone: formData.phone,
          address: formData.address,
        });
      } else {
        toast.error(t('Email is required for payment. Please add your email.'));
      }
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

    if (!formData.email) {
      toast.error(t('Email is required for online payment'));
      return;
    }

    if (basePrice === 0) {
      toast.error(t('Please select pricing options for the service'));
      return;
    }

    // Save booking to database
    createBookingMutation.mutate({
      serviceId: parseInt(formData.serviceId),
      date: formData.date,
      time: formData.time,
      customerName: formData.name,
      customerEmail: formData.email,
      phone: formData.phone,
      address: formData.address,
      notes: formData.notes || undefined,
    });
  };

  const selectedService = services.find(s => s.id.toString() === formData.serviceId);
  const pricingType = pricingData?.service.pricingType;

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
        <div className="container max-w-5xl">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Form */}
            <div className="lg:col-span-2">
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

                    {/* Dynamic Pricing Inputs */}
                    {pricingData && (
                      <div className="space-y-6 pt-4 border-t">
                        <h3 className="font-semibold text-lg">{t('booking.priceBreakdown')}</h3>

                        {/* Bedroom-based pricing */}
                        {pricingType === "BEDROOM_BASED" && pricingData.pricing.tiers && (
                          <BedroomSelector
                            tiers={pricingData.pricing.tiers}
                            selectedBedrooms={selectedBedrooms}
                            onSelect={(bedrooms, price) => {
                              setSelectedBedrooms(bedrooms);
                              setBedroomPrice(price);
                            }}
                          />
                        )}

                        {/* Square meter pricing */}
                        {pricingType === "SQM_BASED" && pricingData.pricing.sqmPricing && (
                          <SquareMeterInput
                            sqmPricing={pricingData.pricing.sqmPricing}
                            selectedVariant={selectedVariant}
                            squareMeters={squareMeters}
                            onVariantSelect={(variant, pricePerSqm, minimum) => {
                              setSelectedVariant(variant);
                              setSqmPricePerUnit(pricePerSqm);
                              setSqmMinimum(minimum);
                            }}
                            onSquareMetersChange={setSquareMeters}
                          />
                        )}

                        {/* Item-based pricing */}
                        {pricingType === "ITEM_BASED" && pricingData.pricing.items && (
                          <UpholsteryItemSelector
                            items={pricingData.pricing.items}
                            selectedItems={selectedItems}
                            onItemsChange={setSelectedItems}
                            minimumCharge={pricingData.pricing.items[0]?.minimumCharge || 0}
                          />
                        )}

                        <Separator />

                        {/* Add-ons */}
                        {addOns.length > 0 && (
                          <AddOnsSelector
                            addOns={addOns}
                            selectedAddOns={selectedAddOns}
                            onAddOnsChange={setSelectedAddOns}
                            selectedBedrooms={selectedBedrooms}
                          />
                        )}

                        {/* Package Discounts */}
                        {packageDiscounts.length > 0 && (
                          <PackageDiscountSelector
                            packages={packageDiscounts}
                            selectedPackage={selectedPackage}
                            onSelect={(pkgId, visits, discountPercent) => {
                              setSelectedPackage(pkgId);
                              setPackageDiscountPercent(discountPercent);
                            }}
                          />
                        )}

                        {/* Special Offers */}
                        {specialOffers.length > 0 && (
                          <SpecialOffersSelector
                            offers={specialOffers}
                            selectedOffer={selectedOffer}
                            onSelect={(offerId, offer) => {
                              setSelectedOffer(offerId);
                              setSelectedOfferData(offer);
                            }}
                          />
                        )}
                      </div>
                    )}

                    {/* Date and Time */}
                    <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
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
                          <Label htmlFor="email">{t('Email')} *</Label>
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
                      <Button type="submit" size="lg" className="flex-1" disabled={basePrice === 0}>
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

            {/* Right Column - Price Breakdown */}
            <div className="lg:col-span-1">
              <div className="sticky top-20">
                <PriceBreakdownCard
                  breakdown={priceBreakdown}
                  specialOfferType={selectedOfferData?.discountType}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{t('Complete Payment')}</DialogTitle>
          </DialogHeader>
          <div className="w-full h-[600px]">
            {paymentUrl && (
              <iframe
                src={paymentUrl}
                className="w-full h-full border-0"
                title="Payment Gateway"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="border-t py-6 bg-background">
        <div className="container text-center text-sm text-muted-foreground">
          <p>{t('copyright')}</p>
        </div>
      </footer>
    </div>
  );
}
