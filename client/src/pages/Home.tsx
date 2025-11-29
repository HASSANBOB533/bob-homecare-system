import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { CheckCircle, Clock, Shield, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";

export default function Home() {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { data: services = [] } = trpc.services.list.useQuery();

  // Get service name and description based on current language
  const getServiceText = (service: any, field: 'name' | 'description') => {
    if (i18n.language === 'ar') {
      return service[field] || service[`${field}En`] || '';
    }
    return service[`${field}En`] || service[field] || '';
  };

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
            <span className="text-xl font-bold">BOB Home Care</span>
          </div>
          <nav className="flex items-center gap-4">
            <a href="#services" className="text-sm font-medium hover:text-primary transition-colors">
              {t('services')}
            </a>
            <a href="#why-us" className="text-sm font-medium hover:text-primary transition-colors">
              {t('whyUs')}
            </a>
            <LanguageSwitcher />
            {isAuthenticated && (
              <Button variant="default" size="sm" onClick={() => setLocation(user?.role === "admin" ? "/admin" : "/dashboard")}>
                {user?.role === "admin" ? t('adminDashboard') : t('userDashboard')}
              </Button>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-primary/5 to-background">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              {t('heroTitle')}
            </h1>
            <p className="text-xl text-muted-foreground">
              {t('heroSubtitle')}
            </p>
            <div className="flex flex-wrap gap-4 justify-center pt-4">
              <Button size="lg" onClick={handleGetStarted} className="text-lg px-8">
                {t('bookNow')}
              </Button>
              <WhatsAppButton size="lg" variant="secondary" className="text-lg px-8" />
              <Button size="lg" variant="outline" onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })} className="text-lg px-8">
                {t('viewServices')}
              </Button>
            </div>
            <div className="flex flex-wrap gap-6 justify-center pt-8">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span>{t('licensedInsured')}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span>{t('ecoFriendly')}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span>{t('satisfaction')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-background">
        <div className="container">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">{t('ourServices')}</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('servicesDescription')}
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            {services.map((service) => (
              <Card key={service.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle>
                    {getServiceText(service, 'name')}
                  </CardTitle>
                  {getServiceText(service, 'description') && (
                    <CardDescription>{getServiceText(service, 'description')}</CardDescription>
                  )}
                </CardHeader>
                <div className="px-6 pb-6">
                  {service.duration && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{service.duration} min</span>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section id="why-us" className="py-20 bg-muted/50">
        <div className="container">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">{t('whyChooseUs')}</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('whyDescription')}
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">{t('experiencedTeam')}</h3>
                <p className="text-muted-foreground">
                  {t('experiencedDesc')}
                </p>
              </div>
            </div>
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">{t('qualityGuarantee')}</h3>
                <p className="text-muted-foreground">
                  {t('qualityDesc')}
                </p>
              </div>
            </div>
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">{t('flexibleScheduling')}</h3>
                <p className="text-muted-foreground">
                  {t('flexibleDesc')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold">{t('readyForClean')}</h2>
          <p className="text-lg max-w-2xl mx-auto opacity-90">
            {t('joinCustomers')}
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" variant="secondary" onClick={handleGetStarted} className="text-lg px-8">
              {t('getStarted')}
            </Button>
            <WhatsAppButton size="lg" variant="outline" className="text-lg px-8 bg-white hover:bg-white/90 text-primary border-white" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-background">
        <div className="container text-center text-sm text-muted-foreground">
          <p>{t('copyright')}</p>
        </div>
      </footer>
    </div>
  );
}
