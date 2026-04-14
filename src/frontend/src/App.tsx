import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  RouterProvider,
  createHashHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import Navbar from "./components/Navbar";
import { AuthProvider } from "./contexts/AuthContext";
import ComparePage from "./pages/ComparePage";
import DnsWhoisPage from "./pages/DnsWhoisPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import HistoryPage from "./pages/HistoryPage";
import IpScannerPage from "./pages/IpScannerPage";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import PhishingDetectorPage from "./pages/PhishingDetectorPage";
import ProfilePage from "./pages/ProfilePage";
import SignupPage from "./pages/SignupPage";
import ThreatFeedPage from "./pages/ThreatFeedPage";
import UrlScannerPage from "./pages/UrlScannerPage";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

const rootRoute = createRootRoute({
  component: () => (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1">
        <Outlet />
      </div>
      <Toaster />
    </div>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: LandingPage,
});
const urlScannerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/url-scanner",
  component: UrlScannerPage,
});
const phishingDetectorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/phishing-detector",
  component: PhishingDetectorPage,
});
const ipScannerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/ip-scanner",
  component: IpScannerPage,
});
const dnsWhoisRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dns-whois",
  component: DnsWhoisPage,
});
const historyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/history",
  component: HistoryPage,
});
const threatFeedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/threat-feed",
  component: ThreatFeedPage,
});
const compareRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/compare",
  component: ComparePage,
});
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});
const signupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/signup",
  component: SignupPage,
});
const forgotPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/forgot-password",
  component: ForgotPasswordPage,
});
const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  component: ProfilePage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  urlScannerRoute,
  phishingDetectorRoute,
  ipScannerRoute,
  dnsWhoisRoute,
  historyRoute,
  threatFeedRoute,
  compareRoute,
  loginRoute,
  signupRoute,
  forgotPasswordRoute,
  profileRoute,
]);

const hashHistory = createHashHistory();
const router = createRouter({ routeTree, history: hashHistory });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  );
}
