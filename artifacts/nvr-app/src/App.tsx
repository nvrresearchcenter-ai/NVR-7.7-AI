import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme";
import { AuthProvider, useAuth } from "@/lib/authContext";
import { UsageProvider } from "@/lib/usageContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Home from "@/pages/Home";
import Chat from "@/pages/Chat";
import Agent from "@/pages/Agent";
import Pricing from "@/pages/Pricing";
import Login from "@/pages/Login";
import OAuthCallback from "@/pages/OAuthCallback";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import Refund from "@/pages/Refund";
import Checkout from "@/pages/Checkout";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const NO_FOOTER = ["/chat", "/agent", "/checkout"];

function ProtectedAgent() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Redirect to="/login?next=/agent" />;
  return <Agent />;
}

function Router() {
  const [location] = useLocation();
  const showFooter = !NO_FOOTER.includes(location);

  return (
    <>
      <Navbar />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/chat" component={Chat} />
        <Route path="/agent" component={ProtectedAgent} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/login" component={Login} />
        <Route path="/auth/callback" component={OAuthCallback} />
        <Route path="/terms" component={Terms} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/refund" component={Refund} />
        <Route path="/checkout" component={Checkout} />
        <Route component={NotFound} />
      </Switch>
      {showFooter && <Footer />}
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <AuthProvider>
            <UsageProvider>
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                <Router />
              </WouterRouter>
            </UsageProvider>
          </AuthProvider>
        </ThemeProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
