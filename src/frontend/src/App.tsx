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
import ComparePage from "./pages/ComparePage";
import DnsWhoisPage from "./pages/DnsWhoisPage";
import HistoryPage from "./pages/HistoryPage";
import LandingPage from "./pages/LandingPage";
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

const routeTree = rootRoute.addChildren([
  indexRoute,
  urlScannerRoute,
  dnsWhoisRoute,
  historyRoute,
  threatFeedRoute,
  compareRoute,
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
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
