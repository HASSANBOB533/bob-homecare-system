import { Suspense, lazy } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "./_core/hooks/useAuth";
import { getLoginUrl } from "./const";
import { DebugPanel } from "./components/DebugPanel";
import { PWAInstallBanner } from "./components/PWAInstallBanner";

// Lazy load all page components for better code splitting
const Home = lazy(() => import("./pages/Home"));
const UserDashboard = lazy(() => import("./pages/UserDashboard"));
const BookingForm = lazy(() => import("./pages/BookingForm"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminReviews = lazy(() => import("./pages/AdminReviews").then(m => ({ default: m.AdminReviews })));
const LoyaltyDashboard = lazy(() => import("./pages/LoyaltyDashboard"));
const AdminLoyalty = lazy(() => import("./pages/AdminLoyalty").then(m => ({ default: m.AdminLoyalty })));
const AdminLoyaltyDashboard = lazy(() => import("./pages/AdminLoyaltyDashboard"));
const AdminPricingManagement = lazy(() => import("./pages/AdminPricingManagement"));
const AdminPricingEditor = lazy(() => import("./pages/AdminPricingEditor").then(m => ({ default: m.AdminPricingEditor })));
const BookService = lazy(() => import("./pages/BookService"));
const MyBookings = lazy(() => import("./pages/MyBookings"));
const CheckBooking = lazy(() => import("./pages/CheckBooking"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const PaymentFailed = lazy(() => import("./pages/PaymentFailed"));
const QuoteViewer = lazy(() => import("./pages/QuoteViewer"));
const ServiceDetail = lazy(() => import("./pages/ServiceDetail"));
const AdminBookings = lazy(() => import("./pages/AdminBookings"));
const AdminCalendar = lazy(() => import("./pages/AdminCalendar"));
const AdminServiceGallery = lazy(() => import("./pages/AdminServiceGallery"));
const AdminDebug = lazy(() => import("./pages/AdminDebug"));
const AdminSlotManagement = lazy(() => import("./pages/AdminSlotManagement"));
const Referrals = lazy(() => import("./pages/Referrals"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading component for Suspense fallback
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
}

function ProtectedRoute({ component: Component, requireAdmin = false }: { component: React.ComponentType; requireAdmin?: boolean }) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  if (requireAdmin && user?.role !== "admin") {
    return <div className="min-h-screen flex items-center justify-center">Access Denied</div>;
  }

  return <Component />;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <PWAInstallBanner />
          <DebugPanel />
          <Suspense fallback={<PageLoader />}>
            <Switch>
              {/* Public routes */}
              <Route path="/" component={Home} />
              <Route path="/book" component={BookService} />
              <Route path="/check-booking" component={CheckBooking} />
              <Route path="/verify-email" component={VerifyEmail} />
              <Route path="/payment-success" component={PaymentSuccess} />
              <Route path="/payment-failed" component={PaymentFailed} />
              <Route path="/quote/:code" component={QuoteViewer} />
              <Route path="/services/:id" component={ServiceDetail} />
              <Route path="/my-bookings" component={MyBookings} />
              <Route path="/referrals" component={Referrals} />

              {/* Protected routes */}
              <Route path="/dashboard">
                {() => <ProtectedRoute component={UserDashboard} />}
              </Route>
              <Route path="/loyalty">
                {() => <ProtectedRoute component={LoyaltyDashboard} />}
              </Route>

              {/* Admin routes */}
              <Route path="/admin">
                {() => <ProtectedRoute component={AdminDashboard} requireAdmin />}
              </Route>
              <Route path="/admin/bookings">
                {() => <ProtectedRoute component={AdminBookings} requireAdmin />}
              </Route>
              <Route path="/admin/calendar">
                {() => <ProtectedRoute component={AdminCalendar} requireAdmin />}
              </Route>
              <Route path="/admin/debug">
                {() => <ProtectedRoute component={AdminDebug} requireAdmin />}
              </Route>
              <Route path="/admin/reviews">
                {() => <ProtectedRoute component={AdminReviews} requireAdmin />}
              </Route>
              <Route path="/admin/loyalty">
                {() => <ProtectedRoute component={AdminLoyalty} requireAdmin />}
              </Route>
              <Route path="/admin/loyalty-analytics">
                {() => <ProtectedRoute component={AdminLoyaltyDashboard} requireAdmin />}
              </Route>
              <Route path="/admin/pricing">
                {() => <ProtectedRoute component={AdminPricingManagement} requireAdmin />}
              </Route>
              <Route path="/admin/pricing-editor">
                {() => <ProtectedRoute component={AdminPricingEditor} requireAdmin />}
              </Route>
              <Route path="/admin/services/:id/gallery">
                {() => <ProtectedRoute component={AdminServiceGallery} requireAdmin />}
              </Route>
              <Route path="/admin/slots">
                {() => <ProtectedRoute component={AdminSlotManagement} requireAdmin />}
              </Route>

              {/* 404 fallback */}
              <Route component={NotFound} />
            </Switch>
          </Suspense>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
