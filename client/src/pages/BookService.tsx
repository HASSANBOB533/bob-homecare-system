import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { trpc } from "@/lib/trpc";
import { Calendar, Clock, MapPin, Sparkles, CheckCircle2, Menu, Home } from "lucide-react";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { 
  isValidEmail, 
  isValidPhone, 
  isValidName, 
  isValidAddress,
  sanitizeString,
  isSecureInput 
} from "@shared/validation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BedroomSelector } from "@/components/pricing/BedroomSelector";
import { SquareMeterInput } from "@/components/pricing/SquareMeterInput";
import { UpholsteryItemSelector } from "@/components/pricing/UpholsteryItemSelector";
import { AddOnsSelector } from "@/components/pricing/AddOnsSelector";
import { PackageDiscountSelector, SpecialOffersSelector } from "@/components/pricing/DiscountsSelector";
import { PriceBreakdownCard } from "@/components/pricing/PriceBreakdownCard";
import { usePriceCalculation } from "@/hooks/usePriceCalculation";
import { Separator } from "@/components/ui/separator";
import { SaveQuoteButton } from "@/components/quote/SaveQuoteButton";

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
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

  // Referral code state
  const [referralCode, setReferralCode] = useState("");
  
  // Property count state (for property manager discount)
  const [propertyCount, setPropertyCount] = useState<number>(0);
  const [propertyCountError, setPropertyCountError] = useState<string | null>(null);
  const [referralValidation, setReferralValidation] = useState<{
    isValid: boolean;
    message: string;
    discount: number;
    referrerUserId?: number;
  } | null>(null);
  const [isValidatingReferral, setIsValidatingReferral] = useState(false);
  
  // Loyalty points redemption state
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);
  const [loyaltyPointsToRedeem, setLoyaltyPointsToRedeem] = useState(0);

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
  const { data: addOns = [] } = trpc.pricing.getAddOns.useQuery(
    { serviceId: selectedServiceId! },
    { enabled: !!selectedServiceId }
  );
  const { data: packageDiscounts = [] } = trpc.pricing.getPackageDiscounts.useQuery(
    { serviceId: selectedServiceId! },
    { enabled: !!selectedServiceId }
  );
  
  // Fetch user's loyalty points balance
  const { data: loyaltyPointsBalance = 0 } = trpc.loyalty.getPoints.useQuery(
    undefined,
    { enabled: true }
  );
  const { data: specialOffers = [] } = trpc.pricing.getSpecialOffers.useQuery();

  // Referral code validation
  const validateReferralMutation = trpc.referrals.validate.useQuery(
    { code: referralCode },
    { 
      enabled: false, // Manual trigger
      retry: false,
    }
  );

  // Validate referral code with debounce
  useEffect(() => {
    if (!referralCode || referralCode.length < 6) {
      setReferralValidation(null);
      return;
    }

    setIsValidatingReferral(true);
    const timer = setTimeout(async () => {
      try {
        const result = await validateReferralMutation.refetch();
        if (result.data) {
          if (result.data.valid) {
            setReferralValidation({
              isValid: true,
              message: t("booking.referralValid"),
              discount: 10, // 10% referral discount
              referrerUserId: result.data.referrerId,
            });
          } else {
            setReferralValidation({
              isValid: false,
              message: result.data.message || t("booking.referralInvalid"),
              discount: 0,
            });
          }
        }
      } catch (error) {
        setReferralValidation({
          isValid: false,
          message: t("booking.referralInvalid"),
          discount: 0,
        });
      } finally {
        setIsValidatingReferral(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [referralCode]);

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
    setReferralCode("");
    setReferralValidation(null);
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
  
  // Calculate loyalty points discount
  // Conversion rate: 100 points = 10 EGP (0.1 EGP per point)
  // Points are stored as integers, discount is in cents
  const POINTS_TO_CENTS_RATE = 10; // 1 point = 10 cents = 0.1 EGP
  
  // Calculate maximum points that can be redeemed (can't exceed total price)
  const maxRedeemablePoints = useLoyaltyPoints ? Math.min(
    loyaltyPointsBalance,
    Math.floor(basePrice / POINTS_TO_CENTS_RATE) // Don't redeem more than the booking total
  ) : 0;
  
  // Calculate loyalty discount in cents
  const loyaltyDiscountCents = maxRedeemablePoints * POINTS_TO_CENTS_RATE;
  
  // Update points to redeem when checkbox changes
  useEffect(() => {
    if (useLoyaltyPoints) {
      setLoyaltyPointsToRedeem(maxRedeemablePoints);
    } else {
      setLoyaltyPointsToRedeem(0);
    }
  }, [useLoyaltyPoints, maxRedeemablePoints]);

  // Calculate final price
  const priceBreakdown = usePriceCalculation({
    basePrice,
    selectedAddOns,
    packageDiscountPercent,
    specialOffer: selectedOfferData,
    referralDiscountPercent: referralValidation?.isValid ? referralValidation.discount : 0,
    propertyCount,
    loyaltyDiscountCents,
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
    
    // Basic required field validation
    if (!formData.serviceId || !formData.date || !formData.time || !formData.name || !formData.phone || !formData.address) {
      toast.error(t('Please fill in all required fields'));
      return;
    }

    if (!formData.email) {
      toast.error(t('Email is required for online payment'));
      return;
    }

    // Input validation and security checks
    if (!isValidName(formData.name)) {
      toast.error(t('Invalid name format. Please use only letters (2-100 characters)'));
      return;
    }

    if (!isValidEmail(formData.email)) {
      toast.error(t('Invalid email format. Please enter a valid email address'));
      return;
    }

    if (!isValidPhone(formData.phone)) {
      toast.error(t('Invalid phone number format. Please enter a valid phone number'));
      return;
    }

    if (!isValidAddress(formData.address)) {
      toast.error(t('Invalid address. Please enter an address between 10-500 characters'));
      return;
    }

    // Security check for malicious input
    const nameCheck = isSecureInput(formData.name);
    if (!nameCheck.secure) {
      toast.error(t('Invalid input detected. Please remove special characters'));
      console.warn('Security check failed:', nameCheck.reason);
      return;
    }

    const addressCheck = isSecureInput(formData.address);
    if (!addressCheck.secure) {
      toast.error(t('Invalid input detected in address. Please remove special characters'));
      console.warn('Security check failed:', addressCheck.reason);
      return;
    }

    if (formData.notes) {
      const notesCheck = isSecureInput(formData.notes);
      if (!notesCheck.secure) {
        toast.error(t('Invalid input detected in notes. Please remove special characters'));
        console.warn('Security check failed:', notesCheck.reason);
        return;
      }
      if (formData.notes.length > 1000) {
        toast.error(t('Notes too long. Maximum 1000 characters allowed'));
        return;
      }
    }

    if (basePrice === 0) {
      toast.error(t('Please select pricing options for the service'));
      return;
    }

    // Validate property count for property manager discount
    if (selectedOfferData?.minProperties && propertyCount < selectedOfferData.minProperties) {
      toast.error(t('booking.propertyCountTooLow', { min: selectedOfferData.minProperties }));
      return;
    }

    // Save booking to database with pricing
    createBookingMutation.mutate({
      serviceId: parseInt(formData.serviceId),
      date: formData.date,
      time: formData.time,
      customerName: formData.name,
      customerEmail: formData.email,
      phone: formData.phone,
      address: formData.address,
      notes: formData.notes || undefined,
      amount: Math.round(priceBreakdown.finalPrice * 100), // Convert EGP to cents
      pricingBreakdown: {
        basePrice: priceBreakdown.basePrice,
        addOnsTotal: priceBreakdown.addOnsTotal,
        packageDiscount: priceBreakdown.packageDiscount,
        specialOfferAdjustment: priceBreakdown.specialOfferAdjustment,
        referralDiscount: priceBreakdown.referralDiscount,
        loyaltyDiscount: priceBreakdown.loyaltyDiscount,
        loyaltyPointsRedeemed: useLoyaltyPoints ? loyaltyPointsToRedeem : 0,
        finalPrice: priceBreakdown.finalPrice,
        selections: {
          bedrooms: selectedVariant,
          squareMeters,
          selectedItems,
          addOns: selectedAddOns,
          packageDiscountPercent,
          specialOfferId: selectedOffer,
          referralCode: referralValidation?.isValid ? referralCode : undefined,
          referrerUserId: referralValidation?.referrerUserId,
        },
      },
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
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            <LanguageSwitcher />
            <Button variant="ghost" size="sm" onClick={() => setLocation("/")}>
              {t('Back to Home')}
            </Button>
          </div>

          {/* Mobile Menu */}
          <div className="flex md:hidden items-center gap-2">
            <LanguageSwitcher />
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    BOB Home Care
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-4 mt-6">
                  <Button 
                    variant="ghost" 
                    className="justify-start w-full" 
                    onClick={() => {
                      setLocation("/");
                      setMobileMenuOpen(false);
                    }}
                  >
                    <Home className="mr-2 h-4 w-4" />
                    {t('Back to Home')}
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
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
                              // Reset property count when offer changes
                              setPropertyCount(0);
                              setPropertyCountError(null);
                            }}
                          />
                        )}

                        {/* Property Count Input (for Property Manager discount) */}
                        {selectedOfferData?.minProperties && (
                          <div className="space-y-2 mt-4">
                            <Label htmlFor="propertyCount" className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-primary" />
                              {t('booking.propertyCount')} *
                            </Label>
                            <Input
                              id="propertyCount"
                              type="number"
                              min="1"
                              value={propertyCount || ""}
                              onChange={(e) => {
                                const count = parseInt(e.target.value) || 0;
                                setPropertyCount(count);
                                
                                // Validate property count
                                if (count > 0 && selectedOfferData?.minProperties && count < selectedOfferData.minProperties) {
                                  setPropertyCountError(
                                    t('booking.propertyCountTooLow', { min: selectedOfferData.minProperties })
                                  );
                                } else {
                                  setPropertyCountError(null);
                                }
                              }}
                              placeholder={t('booking.enterPropertyCount')}
                              className={propertyCountError ? "border-red-500" : ""}
                            />
                            {selectedOfferData.minProperties && (
                              <p className="text-sm text-muted-foreground">
                                {t('booking.minPropertiesRequired', { min: selectedOfferData.minProperties })}
                              </p>
                            )}
                            {propertyCountError && (
                              <p className="text-sm text-red-600">{propertyCountError}</p>
                            )}
                          </div>
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

                      {/* Referral Code */}
                      <div className="space-y-2">
                        <Label htmlFor="referralCode">
                          {t('booking.referralCode')} ({t('optional')})
                        </Label>
                        <div className="relative">
                          <Input
                            id="referralCode"
                            value={referralCode}
                            onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                            placeholder={t('booking.enterReferralCode')}
                            maxLength={12}
                            className={`pr-10 ${
                              referralValidation?.isValid
                                ? "border-green-500 focus-visible:ring-green-500"
                                : referralValidation && !referralValidation.isValid
                                ? "border-red-500 focus-visible:ring-red-500"
                                : ""
                            }`}
                          />
                          {isValidatingReferral && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                            </div>
                          )}
                          {!isValidatingReferral && referralValidation?.isValid && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600">
                              <CheckCircle2 className="h-4 w-4" />
                            </div>
                          )}
                          {!isValidatingReferral && referralValidation && !referralValidation.isValid && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-600">
                              <span className="text-xl">✕</span>
                            </div>
                          )}
                        </div>
                        {referralValidation && (
                          <p
                            className={`text-sm ${
                              referralValidation.isValid ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {referralValidation.message}
                            {referralValidation.isValid && (
                              <span className="font-semibold ml-1">
                                ({referralValidation.discount}% {t('booking.discount')})
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                      
                      {/* Loyalty Points Redemption */}
                      {loyaltyPointsBalance > 0 && (
                        <div className="space-y-2 pt-4 border-t">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="useLoyaltyPoints"
                                checked={useLoyaltyPoints}
                                onChange={(e) => setUseLoyaltyPoints(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                              />
                              <Label htmlFor="useLoyaltyPoints" className="cursor-pointer">
                                {t('booking.useLoyaltyPoints')}
                              </Label>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {t('booking.availablePoints')}: <span className="font-semibold text-foreground">{loyaltyPointsBalance}</span>
                            </div>
                          </div>
                          {useLoyaltyPoints && (
                            <div className="text-sm space-y-1">
                              <p className="text-green-600">
                                {t('booking.redeeming')} {loyaltyPointsToRedeem} {t('booking.points')} = {(loyaltyPointsToRedeem * 0.1).toFixed(2)} {t('currency')}
                              </p>
                              <p className="text-muted-foreground text-xs">
                                {t('booking.conversionRate')}: 100 {t('booking.points')} = 10 {t('currency')}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Submit Buttons */}
                    <div className="space-y-3 pt-4">
                      <div className="flex flex-col sm:flex-row gap-4">
                        <Button type="submit" size="lg" className="flex-1" disabled={basePrice === 0}>
                          {t('submit')}
                        </Button>
                        <WhatsAppButton size="lg" variant="outline" className="flex-1" />
                      </div>
                      
                      {/* Save Quote Button */}
                      {basePrice > 0 && (
                        <SaveQuoteButton
                          serviceId={parseInt(formData.serviceId)}
                          selections={{
                            bedrooms: selectedBedrooms || undefined,
                            squareMeters: squareMeters || undefined,
                            selectedItems: selectedItems.map(item => ({
                              itemId: item.itemId,
                              quantity: item.quantity,
                            })),
                            addOns: selectedAddOns.map(addon => ({
                              addOnId: addon.addOnId,
                              quantity: 1,
                            })),
                            packageDiscountId: selectedPackage || undefined,
                            specialOfferId: selectedOffer || undefined,
                            date: formData.date || undefined,
                            time: formData.time || undefined,
                            address: formData.address || undefined,
                            notes: formData.notes || undefined,
                          }}
                          totalPrice={priceBreakdown.finalPrice}
                          customerName={formData.name || undefined}
                          customerEmail={formData.email || undefined}
                          customerPhone={formData.phone || undefined}
                        />
                      )}
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
