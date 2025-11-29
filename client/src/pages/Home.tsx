import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Check, Clock, MapPin, Shield, Sparkles, Star } from "lucide-react";
import { useLocation } from "wouter";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { data: services = [] } = trpc.services.list.useQuery();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      if (user?.role === "admin") {
        setLocation("/admin");
      } else {
        setLocation("/dashboard");
      }
    } else {
      window.location.href = getLoginUrl();
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">CleanPro Services</span>
          </div>
          <nav className="flex items-center gap-6">
            <a href="#services" className="text-sm font-medium hover:text-primary transition-colors">
              Services
            </a>
            <a href="#why-us" className="text-sm font-medium hover:text-primary transition-colors">
              Why Us
            </a>
            {isAuthenticated ? (
              <Button onClick={handleGetStarted}>
                {user?.role === "admin" ? "Admin Dashboard" : "My Bookings"}
              </Button>
            ) : (
              <Button onClick={handleGetStarted}>Sign In</Button>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-primary/5 to-background">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Professional Housekeeping Services
            </h1>
            <p className="text-xl text-muted-foreground">
              Experience spotless cleanliness with our expert team. Book your service in minutes and enjoy a pristine home.
            </p>
            <div className="flex flex-wrap gap-4 justify-center pt-4">
              <Button size="lg" onClick={handleGetStarted} className="text-lg px-8">
                Book Now
              </Button>
              <Button size="lg" variant="outline" onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })} className="text-lg px-8">
                View Services
              </Button>
            </div>
            <div className="flex flex-wrap gap-6 justify-center pt-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>Licensed & Insured</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>Eco-Friendly Products</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>Satisfaction Guaranteed</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-background">
        <div className="container">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">Our Services</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose from our range of professional cleaning services tailored to your needs
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
            {services.map((service) => (
              <Card key={service.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-start justify-between">
                    <span>{service.name}</span>
                    {service.price && (
                      <span className="text-primary font-bold">
                        ${(service.price / 100).toFixed(0)}
                      </span>
                    )}
                  </CardTitle>
                  {service.description && (
                    <CardDescription>{service.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    {service.duration && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{service.duration} minutes</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span>Professional team</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span>All supplies included</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button size="lg" onClick={handleGetStarted}>
              Book a Service
            </Button>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section id="why-us" className="py-20 bg-muted/50">
        <div className="container">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">Why Choose CleanPro?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We're committed to providing exceptional service and peace of mind
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
            <div className="text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Trusted & Reliable</h3>
              <p className="text-muted-foreground">
                All our staff are background-checked, trained, and insured for your peace of mind
              </p>
            </div>

            <div className="text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Quality Guaranteed</h3>
              <p className="text-muted-foreground">
                We stand behind our work with a 100% satisfaction guarantee on all services
              </p>
            </div>

            <div className="text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Flexible Scheduling</h3>
              <p className="text-muted-foreground">
                Book online 24/7 and choose a time that works best for your schedule
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold">Ready for a Spotless Home?</h2>
          <p className="text-lg max-w-2xl mx-auto opacity-90">
            Join thousands of satisfied customers who trust CleanPro for their housekeeping needs
          </p>
          <Button size="lg" variant="secondary" onClick={handleGetStarted} className="text-lg px-8">
            Get Started Today
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-background">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© 2024 CleanPro Services. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
