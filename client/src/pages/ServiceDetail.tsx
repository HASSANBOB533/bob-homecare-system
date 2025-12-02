import { useParams, useLocation, Link } from "wouter";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, ArrowRight, Home } from "lucide-react";
import { useState, useMemo } from "react";

export default function ServiceDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { t, i18n } = useTranslation();
  const language = i18n.language;
  
  const serviceId = parseInt(id || "0");
  
  const { data: service, isLoading: serviceLoading } = trpc.pricing.getServiceById.useQuery(
    { serviceId },
    { enabled: !!serviceId }
  );
  
  const { data: pricingData, isLoading: pricingLoading } = trpc.pricing.getPricingData.useQuery(
    { serviceId },
    { enabled: !!serviceId }
  );
  
  const { data: addOns = [] } = trpc.pricing.getAddOns.useQuery(
    { serviceId },
    { enabled: !!serviceId }
  );

  // Pricing calculator state
  const [selectedBedrooms, setSelectedBedrooms] = useState<string | null>(null);
  const [squareMeters, setSquareMeters] = useState<number>(0);
  const [selectedItems, setSelectedItems] = useState<{ id: number; quantity: number }[]>([]);
  const [selectedAddOns, setSelectedAddOns] = useState<number[]>([]);

  // Calculate price based on selections
  const calculatedPrice = useMemo(() => {
    if (!pricingData) return 0;

    let basePrice = 0;

    if (pricingData.service.pricingType === "BEDROOM_BASED" && selectedBedrooms && pricingData.pricing.tiers) {
      const tier = pricingData.pricing.tiers.find((t: any) => t.bedrooms.toString() === selectedBedrooms);
      basePrice = tier ? tier.price / 100 : 0;
    } else if (pricingData.service.pricingType === "SQM_BASED" && pricingData.pricing.sqmPricing) {
      const sqmData = pricingData.pricing.sqmPricing[0];
      if (sqmData) {
        const calculated = squareMeters * (sqmData.pricePerSqm / 100);
        basePrice = Math.max(calculated, sqmData.minimumCharge / 100);
      }
    } else if (pricingData.service.pricingType === "ITEM_BASED" && pricingData.pricing.items) {
      const itemsTotal = selectedItems.reduce((sum, item) => {
        const pricingItem = pricingData.pricing.items.find((i: any) => i.id === item.id);
        return sum + (pricingItem ? (pricingItem.price / 100) * item.quantity : 0);
      }, 0);
      const minimum = pricingData.pricing.items[0]?.minimumCharge || 0;
      basePrice = Math.max(itemsTotal, minimum / 100);
    }

    const addOnsTotal = selectedAddOns.reduce((sum, addOnId) => {
      const addOn = addOns.find((a: any) => a.id === addOnId);
      return sum + (addOn ? addOn.price / 100 : 0);
    }, 0);

    return basePrice + addOnsTotal;
  }, [pricingData, selectedBedrooms, squareMeters, selectedItems, selectedAddOns, addOns]);

  const handleBookNow = () => {
    setLocation(`/book?serviceId=${serviceId}`);
  };

  if (serviceLoading || pricingLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container py-8">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-64 w-full mb-8" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!service || !pricingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">{t("Service not found")}</h2>
          <Button onClick={() => setLocation("/")} variant="outline">
            <Home className="w-4 h-4 mr-2" />
            {t("Back to Home")}
          </Button>
        </Card>
      </div>
    );
  }

  const serviceName = language === "ar" ? service.name : service.nameEn;
  const serviceDescription = language === "ar" ? service.description : service.descriptionEn;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container py-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <Home className="w-4 h-4 mr-2" />
              {t("Back to Home")}
            </Button>
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-green-50 to-blue-50 py-16">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{serviceName}</h1>
            <p className="text-xl text-gray-600 mb-8">{serviceDescription}</p>
            <Button onClick={handleBookNow} size="lg" className="bg-green-600 hover:bg-green-700">
              {t("Book Now")}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Service Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Service Features */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">
                {language === "ar" ? "مميزات الخدمة" : "Service Features"}
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">
                      {language === "ar" ? "فريق محترف" : "Professional Team"}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {language === "ar" 
                        ? "فريق مدرب على أعلى المعايير الدولية"
                        : "Team trained to international standards"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">
                      {language === "ar" ? "منتجات صديقة للبيئة" : "Eco-Friendly Products"}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {language === "ar"
                        ? "نستخدم منتجات آمنة وصديقة للبيئة"
                        : "Safe and environmentally friendly products"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">
                      {language === "ar" ? "ضمان الجودة" : "Quality Guarantee"}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {language === "ar"
                        ? "نضمن رضاك التام عن الخدمة"
                        : "100% satisfaction guaranteed"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">
                      {language === "ar" ? "مرونة في المواعيد" : "Flexible Scheduling"}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {language === "ar"
                        ? "احجز في الوقت المناسب لك"
                        : "Book at your convenient time"}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Service Checklist */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">
                {language === "ar" ? "ما يشمله التنظيف" : "What's Included"}
              </h2>
              <div className="grid md:grid-cols-2 gap-3">
                {[
                  language === "ar" ? "تنظيف جميع الأسطح" : "All surfaces cleaning",
                  language === "ar" ? "تنظيف الأرضيات" : "Floor cleaning",
                  language === "ar" ? "تنظيف الحمامات" : "Bathroom cleaning",
                  language === "ar" ? "تنظيف المطبخ" : "Kitchen cleaning",
                  language === "ar" ? "إزالة الغبار" : "Dusting",
                  language === "ar" ? "تنظيف النوافذ" : "Window cleaning",
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Right Column - Pricing Calculator */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-20">
              <h2 className="text-2xl font-bold mb-6">
                {language === "ar" ? "احسب السعر" : "Price Calculator"}
              </h2>

              {/* Bedroom-based pricing */}
              {pricingData.service.pricingType === "BEDROOM_BASED" && pricingData.pricing.tiers && (
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-3">
                    {language === "ar" ? "عدد الغرف" : "Number of Bedrooms"}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {pricingData.pricing.tiers.map((tier: any) => (
                      <button
                        key={tier.id}
                        onClick={() => setSelectedBedrooms(tier.bedrooms.toString())}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          selectedBedrooms === tier.bedrooms.toString()
                            ? "border-green-600 bg-green-50"
                            : "border-gray-200 hover:border-green-300"
                        }`}
                      >
                        <div className="font-semibold">{tier.bedrooms} {language === "ar" ? "غرف" : "BR"}</div>
                        <div className="text-sm text-gray-600">{(tier.price / 100).toFixed(0)} {t("EGP")}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Square meter pricing */}
              {pricingData.service.pricingType === "SQM_BASED" && pricingData.pricing.sqmPricing && pricingData.pricing.sqmPricing[0] && (
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-3">
                    {language === "ar" ? "المساحة (متر مربع)" : "Area (Square Meters)"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={squareMeters || ""}
                    onChange={(e) => setSquareMeters(parseInt(e.target.value) || 0)}
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-green-600 focus:outline-none"
                    placeholder={language === "ar" ? "أدخل المساحة" : "Enter area"}
                  />
                  <p className="text-sm text-gray-600 mt-2">
                    {(pricingData.pricing.sqmPricing[0].pricePerSqm / 100).toFixed(2)} {t("EGP")} / {language === "ar" ? "م²" : "sqm"}
                  </p>
                </div>
              )}

              {/* Add-ons */}
              {addOns.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-3">
                    {language === "ar" ? "خدمات إضافية" : "Add-ons"}
                  </label>
                  <div className="space-y-2">
                    {addOns.map((addOn: any) => (
                      <label
                        key={addOn.id}
                        className="flex items-center gap-3 p-3 rounded-lg border-2 border-gray-200 hover:border-green-300 cursor-pointer transition-all"
                      >
                        <input
                          type="checkbox"
                          checked={selectedAddOns.includes(addOn.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAddOns([...selectedAddOns, addOn.id]);
                            } else {
                              setSelectedAddOns(selectedAddOns.filter(id => id !== addOn.id));
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            {language === "ar" ? addOn.name : addOn.nameEn}
                          </div>
                          <div className="text-xs text-gray-600">
                            +{(addOn.price / 100).toFixed(0)} {t("EGP")}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Price Display */}
              {calculatedPrice > 0 && (
                <div className="bg-green-50 rounded-lg p-4 mb-6">
                  <div className="text-sm text-gray-600 mb-1">
                    {language === "ar" ? "السعر التقديري" : "Estimated Price"}
                  </div>
                  <div className="text-3xl font-bold text-green-600">
                    {calculatedPrice.toFixed(0)} {t("EGP")}
                  </div>
                </div>
              )}

              <Button onClick={handleBookNow} className="w-full bg-green-600 hover:bg-green-700" size="lg">
                {t("Book Now")}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
