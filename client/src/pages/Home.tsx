import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { CheckCircle, Clock, Shield, Sparkles, User, LogOut, LayoutDashboard, UserCog, Calendar, Star, Award, Menu } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { EditProfileDialog } from "@/components/EditProfileDialog";
import { useState } from "react";
// SEO components temporarily disabled due to React 19 compatibility
// import { SEO, OrganizationSchema, LocalBusinessSchema } from "@/components/SEO";

// Service Rating Component
function ServiceRating({ serviceId }: { serviceId: number }) {
  const { t } = useTranslation();
  const { data: rating } = trpc.reviews.getServiceRating.useQuery(
    { serviceId },
    { enabled: !!serviceId }
  );

  if (!rating || !rating.count || rating.count === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-1 mb-3">
      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
      <span className="text-sm font-medium">{rating.average?.toFixed(1) || '0.0'}</span>
      <span className="text-xs text-muted-foreground">({rating.count} {t('reviews')})</span>
    </div>
  );
}

export default function Home() {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { data: services = [] } = trpc.services.list.useQuery();
  

  const { data: upcomingBookings = [] } = trpc.bookings.upcomingBookings.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      window.location.href = '/';
    },
  });

  const handleSignOut = () => {
    logoutMutation.mutate();
  };

  // Get service name and description based on current language
  const getServiceText = (service: any, field: 'name' | 'description') => {
    if (i18n.language === 'ar') {
      return service[field] || service[`${field}En`] || '';
    }
    return service[`${field}En`] || service[field] || '';
  };

  const handleGetStarted = () => {
    // Always go to booking page for clients
    setLocation("/book");
  };

  return (
    <>
      {/* SEO components temporarily disabled due to React 19 compatibility */}
      {/* <SEO
        title="BOB Home Care - Professional Cleaning Services in Egypt"
        description="BOB Home Care offers professional home cleaning services with international hospitality standards. Airbnb cleaning, deep cleaning, regular maintenance, and more. Licensed, insured, and eco-friendly."
        keywords="home cleaning Egypt, professional cleaning services, Airbnb cleaning, deep cleaning, house cleaning, cleaning company Egypt, eco-friendly cleaning, licensed cleaning service"
        locale={i18n.language as 'en' | 'ar'}
      />
      <OrganizationSchema />
      <LocalBusinessSchema /> */}
      <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">BOB Home Care</span>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-4">
            <a href="#services" className="text-sm font-medium hover:text-primary transition-colors">
              {t('services')}
            </a>
            <a href="#why-us" className="text-sm font-medium hover:text-primary transition-colors">
              {t('whyUs')}
            </a>
            <LanguageSwitcher />
            {isAuthenticated ? (
              <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex items-center gap-2 relative z-50"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                  >
                    <User className="h-4 w-4" />
                    <span>{user?.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 z-50">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.role === 'admin' ? t('adminDashboard') : t('userDashboard')}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  {/* Upcoming Bookings Preview */}
                  {user?.role !== 'admin' && (
                    <>
                      <DropdownMenuLabel className="text-xs text-muted-foreground">
                        {t('upcomingBookings')}
                      </DropdownMenuLabel>
                      {upcomingBookings.length > 0 ? (
                        <div className="px-2 py-1 max-h-32 overflow-y-auto">
                          {upcomingBookings.map((booking) => (
                            <div key={booking.id} className="text-xs py-1.5 px-2 hover:bg-accent rounded-sm">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">
                                    {i18n.language === 'ar' ? booking.serviceName : (booking.serviceNameEn || booking.serviceName)}
                                  </p>
                                  <p className="text-muted-foreground">
                                    {booking.dateTime ? new Date(booking.dateTime).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' }) : t('Not specified')}
                                  </p>
                                </div>
                                <span className={`text-xs px-1.5 py-0.5 rounded ${
                                  booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                  booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {t(booking.status || 'pending')}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="px-2 py-2 text-xs text-muted-foreground text-center">
                          {t('noUpcomingBookings')}
                        </div>
                      )}
                      <DropdownMenuSeparator />
                    </>
                  )}
                  
                  <DropdownMenuItem onClick={() => setLocation(user?.role === "admin" ? "/admin" : "/dashboard")}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>{t('myDashboard')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setEditProfileOpen(true)}>
                    <UserCog className="mr-2 h-4 w-4" />
                    <span>{t('editProfile')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocation("/loyalty")}>
                    <Award className="mr-2 h-4 w-4" />
                    <span>{t('loyalty.title')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} disabled={logoutMutation.isPending}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{logoutMutation.isPending ? t('Checking...') : t('signOut')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => window.location.href = getLoginUrl()}>
                  {t('signIn')}
                </Button>
                <Button variant="default" size="sm" onClick={() => window.location.href = getLoginUrl()}>
                  {t('signUp')}
                </Button>
              </div>
            )}
          </nav>

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
                  <a 
                    href="#services" 
                    className="text-base font-medium hover:text-primary transition-colors py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('services')}
                  </a>
                  <a 
                    href="#why-us" 
                    className="text-base font-medium hover:text-primary transition-colors py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('whyUs')}
                  </a>
                  
                  <div className="border-t pt-4 mt-2">
                    {isAuthenticated ? (
                      <>
                        <div className="mb-4">
                          <p className="text-sm font-medium mb-1">{user?.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {user?.role === 'admin' ? t('adminDashboard') : t('userDashboard')}
                          </p>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <Button 
                            variant="ghost" 
                            className="justify-start" 
                            onClick={() => {
                              setLocation(user?.role === "admin" ? "/admin" : "/dashboard");
                              setMobileMenuOpen(false);
                            }}
                          >
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            {t('myDashboard')}
                          </Button>
                          <Button 
                            variant="ghost" 
                            className="justify-start" 
                            onClick={() => {
                              setEditProfileOpen(true);
                              setMobileMenuOpen(false);
                            }}
                          >
                            <UserCog className="mr-2 h-4 w-4" />
                            {t('editProfile')}
                          </Button>
                          <Button 
                            variant="ghost" 
                            className="justify-start" 
                            onClick={() => {
                              setLocation("/loyalty");
                              setMobileMenuOpen(false);
                            }}
                          >
                            <Award className="mr-2 h-4 w-4" />
                            {t('loyalty.title')}
                          </Button>
                          <Button 
                            variant="ghost" 
                            className="justify-start text-destructive hover:text-destructive" 
                            onClick={() => {
                              handleSignOut();
                              setMobileMenuOpen(false);
                            }}
                            disabled={logoutMutation.isPending}
                          >
                            <LogOut className="mr-2 h-4 w-4" />
                            {logoutMutation.isPending ? t('Checking...') : t('signOut')}
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <Button 
                          variant="ghost" 
                          className="w-full" 
                          onClick={() => {
                            window.location.href = getLoginUrl();
                            setMobileMenuOpen(false);
                          }}
                        >
                          {t('signIn')}
                        </Button>
                        <Button 
                          className="w-full" 
                          onClick={() => {
                            window.location.href = getLoginUrl();
                            setMobileMenuOpen(false);
                          }}
                        >
                          {t('signUp')}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
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
                  <ServiceRating serviceId={service.id} />
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

      {/* Edit Profile Dialog */}
      {user && (
        <EditProfileDialog
          open={editProfileOpen}
          onOpenChange={setEditProfileOpen}
          user={user}
        />
      )}
    </div>
    </>
  );
}
