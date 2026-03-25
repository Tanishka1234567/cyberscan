import { Link, useRouterState } from "@tanstack/react-router";
import { Shield } from "lucide-react";

const navLinks = [
  { label: "Home", path: "/" },
  { label: "URL Scanner", path: "/url-scanner" },
  { label: "DNS & WHOIS", path: "/dns-whois" },
  { label: "Compare", path: "/compare" },
  { label: "Threat Feed", path: "/threat-feed" },
  { label: "History", path: "/history" },
];

export default function Navbar() {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  return (
    <nav className="sticky top-0 z-50 glass-strong border-b border-border print-hide">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2.5"
          data-ocid="navbar.link"
        >
          <Shield
            className="h-7 w-7 text-lime"
            style={{
              filter: "drop-shadow(0 0 8px oklch(0.89 0.21 118 / 0.8))",
            }}
          />
          <span
            className="text-xl font-bold tracking-tight"
            style={{
              background:
                "linear-gradient(90deg, oklch(0.89 0.21 118), oklch(0.73 0.16 162))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            CyberScan
          </span>
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = currentPath === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                data-ocid="navbar.link"
                className={`relative px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isActive
                    ? "nav-active text-lime bg-lime/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-lime/20">
            <span className="h-2 w-2 rounded-full bg-lime animate-pulse" />
            <span className="text-xs text-lime font-medium">Live</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
