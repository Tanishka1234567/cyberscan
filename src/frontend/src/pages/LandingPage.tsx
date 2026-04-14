import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { Activity, Globe, Lock, Search, Shield, Zap } from "lucide-react";
import NeonRain from "../components/NeonRain";
import TiltCard from "../components/TiltCard";

const features = [
  {
    icon: Shield,
    title: "URL Scanner",
    desc: "Analyze URLs against VirusTotal, Google Safe Browsing, and SSL certificate checks. Get instant risk scores and threat classifications.",
    color: "oklch(0.65 0.22 250)",
    path: "/url-scanner" as const,
  },
  {
    icon: Globe,
    title: "DNS Lookup",
    desc: "Query A, AAAA, MX, TXT, NS and CNAME records for any domain. Instant resolution with TTL values and resolver details.",
    color: "oklch(0.60 0.23 305)",
    path: "/dns-whois" as const,
  },
  {
    icon: Search,
    title: "WHOIS Analysis",
    desc: "Retrieve registrar details, registration dates, expiry info and flag suspicious domains — newly registered or privacy-masked.",
    color: "oklch(0.70 0.18 48)",
    path: "/dns-whois" as const,
  },
];

const stats = [
  { value: "10K+", label: "URLs Scanned" },
  { value: "99.9%", label: "Accuracy" },
  { value: "Real-time", label: "Intelligence" },
  { value: "3", label: "Threat Engines" },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <NeonRain />
      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden scan-overlay">
        {/* Animated gradient stripe */}
        <div className="cyber-gradient-bg absolute inset-x-0 top-0 h-1 opacity-60" />

        {/* Neon blue radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 50%, oklch(0.65 0.22 250 / 0.07) 0%, transparent 70%)",
          }}
        />
        {/* Magenta accent glow top right */}
        <div
          className="absolute top-0 right-0 w-96 h-96 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at top right, oklch(0.60 0.23 305 / 0.08) 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10 flex flex-col items-center text-center px-4 fade-in-up">
          <div
            className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass"
            style={{ border: "1px solid oklch(0.65 0.22 250 / 0.3)" }}
          >
            <Zap
              className="h-3.5 w-3.5"
              style={{ color: "oklch(0.65 0.22 250)" }}
            />
            <span
              className="text-xs font-semibold tracking-widest uppercase"
              style={{ color: "oklch(0.65 0.22 250)" }}
            >
              Threat Intelligence Platform
            </span>
          </div>

          <h1
            className="glitch-text text-6xl sm:text-7xl md:text-8xl font-black tracking-tight mb-6"
            data-text="CyberScan"
            style={{ lineHeight: 1.05 }}
          >
            <span
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.94 0.015 250) 0%, oklch(0.65 0.22 250) 50%, oklch(0.60 0.23 305) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              CyberScan
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mb-4 leading-relaxed">
            Next-Generation Threat Intelligence Platform
          </p>
          <p className="text-sm text-muted-foreground/70 max-w-xl mb-10">
            Scan URLs for malware, phishing and malicious content. Look up DNS
            records &amp; WHOIS data. Powered by VirusTotal &amp; Google Safe
            Browsing.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/url-scanner" data-ocid="hero.primary_button">
              <button
                className="cyber-gradient-btn inline-flex items-center gap-2 px-8 h-12 rounded-lg text-sm font-bold"
                type="button"
              >
                <Shield className="h-5 w-5" />
                Scan a URL
              </button>
            </Link>
            <Link to="/dns-whois" data-ocid="hero.secondary_button">
              <Button
                size="lg"
                variant="outline"
                className="font-bold px-8 h-12 transition-all duration-200 hover:scale-105"
                style={{
                  borderColor: "oklch(0.60 0.23 305 / 0.5)",
                  color: "oklch(0.60 0.23 305)",
                }}
              >
                <Globe className="mr-2 h-5 w-5" />
                DNS Lookup
              </Button>
            </Link>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
          <span className="text-xs text-muted-foreground tracking-widest uppercase">
            Explore
          </span>
          <div
            className="w-px h-8"
            style={{
              background:
                "linear-gradient(to bottom, oklch(0.65 0.22 250), transparent)",
            }}
          />
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-border glass">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                className="flex flex-col items-center gap-1"
              >
                <span
                  className="text-2xl font-black"
                  style={{
                    color:
                      i % 2 === 0
                        ? "oklch(0.65 0.22 250)"
                        : "oklch(0.60 0.23 305)",
                    textShadow:
                      i % 2 === 0
                        ? "0 0 20px oklch(0.65 0.22 250 / 0.6)"
                        : "0 0 20px oklch(0.60 0.23 305 / 0.6)",
                  }}
                >
                  {stat.value}
                </span>
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p
              className="text-xs font-semibold tracking-widest uppercase mb-3"
              style={{ color: "oklch(0.65 0.22 250)" }}
            >
              Capabilities
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Everything you need to{" "}
              <span style={{ color: "oklch(0.65 0.22 250)" }}>stay secure</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 stagger">
            {features.map((feat) => {
              const Icon = feat.icon;
              return (
                <Link
                  key={feat.title}
                  to={feat.path}
                  data-ocid="features.card"
                  className="block group fade-in-up"
                >
                  <TiltCard>
                    <div className="glass rounded-2xl p-7 h-full card-hover cursor-pointer border-glow holo-card">
                      <div
                        className="relative z-10 inline-flex items-center justify-center h-12 w-12 rounded-xl mb-5"
                        style={{
                          background: `${feat.color.replace(")", " / 0.12)")}`,
                          border: `1px solid ${feat.color.replace(")", " / 0.35)")}`,
                          boxShadow: `0 0 16px ${feat.color.replace(")", " / 0.15)")}`,
                        }}
                      >
                        <Icon
                          className="h-6 w-6"
                          style={{ color: feat.color }}
                        />
                      </div>
                      <h3 className="relative z-10 text-lg font-bold text-foreground mb-2">
                        {feat.title}
                      </h3>
                      <p className="relative z-10 text-sm text-muted-foreground leading-relaxed">
                        {feat.desc}
                      </p>
                      <div
                        className="relative z-10 mt-4 flex items-center gap-1 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ color: feat.color }}
                      >
                        <span>Try it →</span>
                      </div>
                    </div>
                  </TiltCard>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div
            className="glass rounded-3xl p-12 text-center relative overflow-hidden holo-card"
            style={{
              border: "1px solid oklch(0.65 0.22 250 / 0.25)",
              boxShadow:
                "0 0 80px oklch(0.65 0.22 250 / 0.08) inset, 0 0 40px oklch(0.60 0.23 305 / 0.05)",
            }}
          >
            <Activity
              className="relative z-10 h-12 w-12 mx-auto mb-5"
              style={{ color: "oklch(0.65 0.22 250)" }}
            />
            <h2 className="relative z-10 text-3xl font-bold text-foreground mb-3">
              Start scanning now
            </h2>
            <p className="relative z-10 text-muted-foreground mb-8">
              Protect yourself from malicious URLs and suspicious domains with
              real-time threat intelligence.
            </p>
            <div className="relative z-10 flex flex-wrap items-center justify-center gap-4">
              <Link to="/url-scanner" data-ocid="cta.primary_button">
                <button
                  className="cyber-gradient-btn inline-flex items-center gap-2 px-8 h-10 rounded-lg text-sm font-bold"
                  type="button"
                >
                  <Shield className="h-4 w-4" />
                  Scan a URL
                </button>
              </Link>
              <Link to="/history" data-ocid="cta.secondary_button">
                <Button
                  variant="outline"
                  className="border-border hover:bg-primary/5"
                >
                  <Lock className="mr-2 h-4 w-4" />
                  View History
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
