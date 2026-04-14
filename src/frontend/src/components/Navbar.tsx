import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LogOut, Shield, User } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const navLinks = [
  { label: "Home", path: "/" },
  { label: "URL Scanner", path: "/url-scanner" },
  { label: "Phishing Detector", path: "/phishing-detector" },
  { label: "IP Scanner", path: "/ip-scanner" },
  { label: "DNS & WHOIS", path: "/dns-whois" },
  { label: "Compare", path: "/compare" },
  { label: "Threat Feed", path: "/threat-feed", live: true },
  { label: "History", path: "/history" },
];

export default function Navbar() {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate({ to: "/" });
  }

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
            className="h-7 w-7"
            style={{
              color: "oklch(0.65 0.22 250)",
              filter: "drop-shadow(0 0 8px oklch(0.65 0.22 250 / 0.8))",
            }}
          />
          <span
            className="text-xl font-bold tracking-tight"
            style={{
              background:
                "linear-gradient(90deg, oklch(0.65 0.22 250), oklch(0.60 0.23 305))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 0 8px oklch(0.65 0.22 250 / 0.4))",
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
                className={`relative px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
                  isActive
                    ? "nav-active"
                    : "text-muted-foreground hover:text-foreground hover:bg-primary/5"
                }`}
              >
                {link.label}
                {link.live && (
                  <span className="relative inline-flex items-center">
                    {/* Triple rings */}
                    <span
                      className="absolute rounded-full"
                      style={{
                        inset: "-4px",
                        border: "1px solid oklch(0.65 0.20 335 / 0.5)",
                        animation: "pulseRing 1.8s ease-out infinite",
                      }}
                    />
                    <span
                      className="absolute rounded-full"
                      style={{
                        inset: "-8px",
                        border: "1px solid oklch(0.65 0.20 335 / 0.25)",
                        animation: "pulseRing 1.8s ease-out 0.45s infinite",
                      }}
                    />
                    <span
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-black tracking-wider"
                      style={{
                        background: "oklch(0.65 0.20 335 / 0.15)",
                        border: "1px solid oklch(0.65 0.20 335 / 0.5)",
                        color: "oklch(0.65 0.20 335)",
                        boxShadow: "0 0 8px oklch(0.65 0.20 335 / 0.3)",
                      }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{
                          background: "oklch(0.65 0.20 335)",
                          boxShadow: "0 0 6px oklch(0.65 0.20 335)",
                          animation: "pulse 1s ease-in-out infinite",
                        }}
                      />
                      LIVE
                    </span>
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2">
              <Link
                to="/profile"
                data-ocid="navbar.profile.link"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass border border-border hover:border-primary/40 transition-all duration-200"
                style={{ transition: "border-color 0.2s, box-shadow 0.2s" }}
              >
                <User
                  className="w-3.5 h-3.5"
                  style={{ color: "oklch(0.65 0.22 250)" }}
                />
                <span className="text-sm text-foreground font-mono font-medium">
                  {user.username}
                </span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-destructive transition-all duration-200 font-mono border border-transparent hover:border-destructive/20 hover:bg-destructive/10"
                data-ocid="navbar.button"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-bold font-mono transition-all duration-200"
              style={{
                background: "oklch(0.65 0.22 250)",
                color: "oklch(0.08 0.02 250)",
                boxShadow: "0 0 12px oklch(0.65 0.22 250 / 0.4)",
              }}
              data-ocid="navbar.link"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
