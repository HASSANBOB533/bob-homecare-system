import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import UserDashboard from "./pages/UserDashboard";
import BookingForm from "./pages/BookingForm";
import AdminDashboard from "./pages/AdminDashboard";
import { AdminReviews } from "./pages/AdminReviews";
import LoyaltyDashboard from "./pages/LoyaltyDashboard";
import { AdminLoyalty } from "./pages/AdminLoyalty";
import AdminPricingManagement from "./pages/AdminPricingManagement";
import { AdminPricingEditor } from "./pages/AdminPricingEditor";
import BookService from "./pages/BookService";
import MyBookings from "./pages/MyBookings";
import CheckBooking from "./pages/CheckBooking";
import VerifyEmail from "./pages/VerifyEmail";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailed from "./pages/PaymentFailed";
import QuoteViewer from "./pages/QuoteViewer";
import ServiceDetail from "./pages/ServiceDetail";
import AdminBookings from "./pages/AdminBookings";
import AdminServiceGallery from "./pages/AdminServiceGallery";
import { useAuth } from "./_core/hooks/useAuth";
import { getLoginUrl } from "./const";

function ProtectedRoute({ component: Component, requireAdmin = false }: { component: React.ComponentType; requireAdmin?: boolean }) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
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

function Router() {
  return (
    <Switch>          <Route path="/" component={Home} />
          <Route path="/verify-email" component={VerifyEmail} />      <Route path={"/book"} component={BookService} />
      <Route path={"/my-bookings"} component={MyBookings} />
      <Route path={"/check-booking"} component={CheckBooking} />
      <Route path={"/payment-success"} component={PaymentSuccess} />
      <Route path={"/payment-failed"} component={PaymentFailed} />
      <Route path={"/quote/:code"} component={QuoteViewer} />
      <Route path={"/services/:id"} component={ServiceDetail} />
      <Route path={"/dashboard"}>
        {() => <ProtectedRoute component={UserDashboard} />}
      </Route>
      <Route path={"/admin"}>
        {() => <ProtectedRoute component={AdminDashboard} requireAdmin />}
      </Route>
      <Route path={"/admin/reviews"}>
        {() => <ProtectedRoute component={AdminReviews} requireAdmin />}
      </Route>
      <Route path={"/loyalty"}>
        {() => <ProtectedRoute component={LoyaltyDashboard} />}
      </Route>
      <Route path={"/admin/loyalty"}>
        {() => <ProtectedRoute component={AdminLoyalty} requireAdmin />}
      </Route>
      <Route path={"/admin/pricing"}>
        {() => <ProtectedRoute component={AdminPricingManagement} requireAdmin />}
      </Route>
      <Route path={"/admin/pricing-editor"}>
        {() => <ProtectedRoute component={AdminPricingEditor} requireAdmin />}
      </Route>
      <Route path={"/admin/bookings"}>
        {() => <ProtectedRoute component={AdminBookings} requireAdmin />}
      </Route>
      <Route path={"/admin/services/:id/gallery"}>
        {() => <ProtectedRoute component={AdminServiceGallery} requireAdmin />}
      </Route>
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
