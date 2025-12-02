import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, Database, Loader2, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import AdminLayout from "@/components/AdminLayout";

export default function AdminPricingManagement() {
  const { t } = useTranslation();
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<{ success: boolean; message: string } | null>(null);

  const seedPricingMutation = trpc.pricing.seedAllPricing.useMutation({
    onSuccess: (data) => {
      setSeedResult(data);
      setIsSeeding(false);
    },
    onError: (error) => {
      setSeedResult({ success: false, message: error.message });
      setIsSeeding(false);
    },
  });

  const handleSeedPricing = () => {
    setIsSeeding(true);
    setSeedResult(null);
    seedPricingMutation.mutate();
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Pricing Management</h1>
        <p className="text-muted-foreground mb-8">
          Manage and initialize pricing data for all services
        </p>

        {/* One-Click Seed Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              One-Click Pricing Seed
            </CardTitle>
            <CardDescription>
              Initialize all pricing data from the approved pricing structure. This will populate:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Service Pricing Types</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Service Apartments (Bedroom-based)</li>
                  <li>• Periodical Cleaning (Bedroom-based)</li>
                  <li>• Deep Cleaning (Square meter-based)</li>
                  <li>• Move-In/Move-Out (Square meter-based)</li>
                  <li>• Upholstery Cleaning (Item-based)</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Pricing Components</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Bedroom tiers (1-6 BR)</li>
                  <li>• Square meter rates with minimums</li>
                  <li>• 9 upholstery item types</li>
                  <li>• Add-ons (Laundry, Garden, Kitchen)</li>
                  <li>• Package discounts (4, 6, 8, 12 visits)</li>
                  <li>• Special offers (Referral, Property Manager)</li>
                </ul>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button
                onClick={handleSeedPricing}
                disabled={isSeeding}
                size="lg"
                className="w-full md:w-auto"
              >
                {isSeeding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Seeding Pricing Data...
                  </>
                ) : (
                  <>
                    <Database className="mr-2 h-4 w-4" />
                    Seed All Pricing Data
                  </>
                )}
              </Button>
            </div>

            {seedResult && (
              <Alert variant={seedResult.success ? "default" : "destructive"}>
                {seedResult.success ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertDescription>{seedResult.message}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Pricing Structure Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing Structure Overview</CardTitle>
            <CardDescription>
              Complete pricing details as per approved structure
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Service Apartments */}
            <div>
              <h3 className="font-semibold mb-2">Service Apartments</h3>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• 1 BR: 1,500 EGP | 2 BR: 2,000 EGP | 3 BR: 2,500 EGP</p>
                <p>• 4 BR: 3,000 EGP | 5 BR: 4,000 EGP | 6 BR: 5,000 EGP</p>
                <p>• Add-ons: Laundry (400-1,500 EGP), Garden (200-800 EGP)</p>
              </div>
            </div>

            {/* Deep Cleaning */}
            <div>
              <h3 className="font-semibold mb-2">Deep Cleaning</h3>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• 30 EGP per sqm (minimum 1,500 EGP)</p>
                <p>• Add-on: Kitchen Deep Clean (1,000 EGP)</p>
              </div>
            </div>

            {/* Move-In/Move-Out */}
            <div>
              <h3 className="font-semibold mb-2">Move-In/Move-Out Cleaning</h3>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• Normal: 40 EGP per sqm (minimum 2,000 EGP)</p>
                <p>• Heavy: 50 EGP per sqm (minimum 2,500 EGP)</p>
              </div>
            </div>

            {/* Periodical Cleaning */}
            <div>
              <h3 className="font-semibold mb-2">Periodical Cleaning</h3>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• 1 BR: 800 EGP | 2 BR: 1,200 EGP | 3 BR: 1,500 EGP</p>
                <p>• 4 BR: 2,000 EGP | 5 BR: 2,500 EGP | 6 BR: 3,000 EGP</p>
                <p>• Add-on: Kitchen Tools/Oven (250 EGP)</p>
                <p>• Package discounts: 4 visits (10%), 6 visits (12%), 8 visits (15%), 12 visits (20%)</p>
              </div>
            </div>

            {/* Upholstery */}
            <div>
              <h3 className="font-semibold mb-2">Upholstery Cleaning</h3>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• Minimum charge: 1,500 EGP</p>
                <p>• Arm Chair: 250 EGP | 1-Seat Sofa: 350 EGP | 2-Seat: 400 EGP</p>
                <p>• 3-Seat: 600 EGP | 4-Seat: 800 EGP | L-Shape: 1,000 EGP</p>
                <p>• Sectional: 1,200 EGP | Small Mattress: 400 EGP | Large Mattress: 600 EGP</p>
              </div>
            </div>

            {/* Special Offers */}
            <div>
              <h3 className="font-semibold mb-2">Special Offers</h3>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• Referral Program: 10% off (max 500 EGP)</p>
                <p>• Property Manager (5-10 properties): 5% off</p>
                <p>• Property Manager (11+ properties): 10% off</p>
                <p>• Emergency Same-Day Service: +50% premium</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </AdminLayout>
  );
}
