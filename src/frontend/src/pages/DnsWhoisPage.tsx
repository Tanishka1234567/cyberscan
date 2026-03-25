import AttackTimeline from "@/components/AttackTimeline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLookupDns } from "@/hooks/useQueries";
import {
  AlertTriangle,
  Download,
  Globe,
  Info,
  Loader2,
  Search,
} from "lucide-react";
import { useState } from "react";

interface DnsRecord {
  type: string;
  host: string;
  pointsTo: string;
  ttl: string;
}

interface WhoisInfo {
  domainName: string;
  registrar: string;
  registered: string;
  expires: string;
  privacyMasked: boolean;
  newlyRegistered: boolean;
}

interface DnsResult {
  dnsRecords: DnsRecord[];
  whois: WhoisInfo;
}

const DEMO_RESULT: DnsResult = {
  dnsRecords: [
    { type: "A", host: "example.com", pointsTo: "93.184.216.34", ttl: "3600" },
    {
      type: "AAAA",
      host: "example.com",
      pointsTo: "2606:2800:220:1:248:1893:25c8:1946",
      ttl: "3600",
    },
    {
      type: "MX",
      host: "example.com",
      pointsTo: "mail.example.com (priority 10)",
      ttl: "3600",
    },
    {
      type: "NS",
      host: "example.com",
      pointsTo: "a.iana-servers.net",
      ttl: "172800",
    },
    {
      type: "NS",
      host: "example.com",
      pointsTo: "b.iana-servers.net",
      ttl: "172800",
    },
    {
      type: "TXT",
      host: "example.com",
      pointsTo: '"v=spf1 -all"',
      ttl: "3600",
    },
    {
      type: "CNAME",
      host: "www.example.com",
      pointsTo: "example.com",
      ttl: "3600",
    },
  ],
  whois: {
    domainName: "example.com",
    registrar: "RESERVED-Internet Assigned Numbers Authority",
    registered: "1995-08-14",
    expires: "2025-08-13",
    privacyMasked: false,
    newlyRegistered: false,
  },
};

const DEMO_SUSPICIOUS: DnsResult = {
  dnsRecords: [
    {
      type: "A",
      host: "free-crypto-giveaway.tk",
      pointsTo: "185.220.101.47",
      ttl: "60",
    },
    {
      type: "NS",
      host: "free-crypto-giveaway.tk",
      pointsTo: "ns1.freedns.tk",
      ttl: "86400",
    },
  ],
  whois: {
    domainName: "free-crypto-giveaway.tk",
    registrar: "Dot TK / Freenom",
    registered: "2026-03-01",
    expires: "2026-09-01",
    privacyMasked: true,
    newlyRegistered: true,
  },
};

function parseDnsResult(raw: string): DnsResult | null {
  try {
    const data = JSON.parse(raw);
    return {
      dnsRecords: data.dnsRecords ?? data.records ?? [],
      whois: data.whois ?? {},
    };
  } catch {
    return null;
  }
}

const typeColors: Record<string, string> = {
  A: "oklch(0.89 0.21 118)",
  AAAA: "oklch(0.73 0.16 162)",
  MX: "oklch(0.70 0.18 48)",
  NS: "oklch(0.62 0.13 265)",
  TXT: "oklch(0.65 0.15 290)",
  CNAME: "oklch(0.68 0.14 200)",
};

function RecordTypeBadge({ type }: { type: string }) {
  const color = typeColors[type] ?? "oklch(0.62 0.04 245)";
  return (
    <span
      className="px-2 py-0.5 rounded text-xs font-bold font-mono"
      style={{
        background: `${color.replace(")", " / 0.12)")}`,
        color,
        border: `1px solid ${color.replace(")", " / 0.3)")}`,
      }}
    >
      {type}
    </span>
  );
}

export default function DnsWhoisPage() {
  const [domainInput, setDomainInput] = useState("");
  const [result, setResult] = useState<DnsResult | null>(DEMO_RESULT);
  const [scannedDomain, setScannedDomain] = useState("example.com");
  const [isDemoMode, setIsDemoMode] = useState(true);
  const { mutateAsync: lookupDns, isPending } = useLookupDns();

  const handleLookup = async () => {
    if (!domainInput.trim()) return;
    setResult(null);
    setIsDemoMode(false);
    try {
      const raw = await lookupDns(domainInput.trim());
      const parsed = parseDnsResult(raw);
      if (parsed) {
        setResult(parsed);
        setScannedDomain(domainInput.trim());
      } else {
        const domain = domainInput.trim().toLowerCase();
        const isSuspicious =
          domain.endsWith(".tk") ||
          domain.endsWith(".ml") ||
          domain.includes("free") ||
          domain.includes("crypto");
        setResult(
          isSuspicious
            ? DEMO_SUSPICIOUS
            : {
                ...DEMO_RESULT,
                whois: { ...DEMO_RESULT.whois, domainName: domainInput.trim() },
              },
        );
        setScannedDomain(domainInput.trim());
        setIsDemoMode(true);
      }
    } catch {
      const domain = domainInput.trim().toLowerCase();
      const isSuspicious =
        domain.endsWith(".tk") ||
        domain.endsWith(".ml") ||
        domain.includes("free");
      setResult(
        isSuspicious
          ? DEMO_SUSPICIOUS
          : {
              ...DEMO_RESULT,
              whois: { ...DEMO_RESULT.whois, domainName: domainInput.trim() },
            },
      );
      setScannedDomain(domainInput.trim());
      setIsDemoMode(true);
    }
  };

  const whois = result?.whois;
  const isNewlyReg = whois?.newlyRegistered;
  const isPrivacyMasked = whois?.privacyMasked;
  const hasSuspiciousFlags = isNewlyReg || isPrivacyMasked;

  const handleDownload = () => window.print();

  return (
    <main className="min-h-screen py-10 px-4 fade-in">
      {/* Print header */}
      <div className="print-header">
        <div className="print-header-inner">
          <h1
            style={{
              fontSize: "22px",
              fontWeight: 900,
              letterSpacing: "0.1em",
            }}
          >
            🛡 CYBERSCAN — DNS & WHOIS Report
          </h1>
          <p style={{ fontSize: "11px", color: "#555", marginTop: "4px" }}>
            Domain: {scannedDomain}
          </p>
          <p style={{ fontSize: "10px", color: "#777" }}>
            Generated: {new Date().toLocaleString()}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-10 fade-in-up flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-lime tracking-widest uppercase mb-2">
              Network Intelligence
            </p>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              DNS &amp; WHOIS Lookup
            </h1>
            <p className="text-muted-foreground">
              Query DNS records and WHOIS data. Flag suspicious domain
              registrations.
            </p>
          </div>
          {result && (
            <Button
              onClick={handleDownload}
              data-ocid="dns_whois.download_button"
              variant="outline"
              className="shrink-0 border-lime/30 text-lime hover:bg-lime/10 print-hide"
            >
              <Download className="h-4 w-4 mr-2" /> Download Report
            </Button>
          )}
        </div>

        {/* Input */}
        <div
          className="glass rounded-2xl p-6 mb-8 fade-in-up print-hide"
          style={{ animationDelay: "0.1s" }}
        >
          <label
            htmlFor="domain-input"
            className="text-sm font-semibold text-muted-foreground mb-3 block uppercase tracking-wider"
          >
            Enter domain name
          </label>
          <div className="flex gap-3">
            <Input
              id="domain-input"
              data-ocid="dns_whois.input"
              value={domainInput}
              onChange={(e) => setDomainInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLookup()}
              placeholder="example.com"
              className="flex-1 h-12 bg-navy-600 border-border text-foreground placeholder:text-muted-foreground/50 font-mono"
            />
            <Button
              data-ocid="dns_whois.submit_button"
              onClick={handleLookup}
              disabled={isPending || !domainInput.trim()}
              className="h-12 px-7 bg-lime text-navy-900 hover:bg-lime/90 font-bold glow-lime transition-all"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Looking
                  up...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" /> Lookup
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Loading */}
        {isPending && (
          <div
            data-ocid="dns_whois.loading_state"
            className="glass rounded-2xl p-12 mb-8 flex flex-col items-center gap-4 fade-in"
          >
            <Loader2 className="h-10 w-10 text-lime animate-spin" />
            <p className="text-foreground font-semibold">
              Querying DNS resolvers...
            </p>
            <p className="text-sm text-muted-foreground">
              Fetching WHOIS records
            </p>
          </div>
        )}

        {/* Results */}
        {result && !isPending && (
          <div
            className="space-y-6 fade-in"
            data-ocid="dns_whois.success_state"
          >
            {isDemoMode && (
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-xl print-hide"
                style={{
                  background: "oklch(0.70 0.18 48 / 0.1)",
                  border: "1px solid oklch(0.70 0.18 48 / 0.3)",
                }}
              >
                <Info
                  className="h-4 w-4 shrink-0"
                  style={{ color: "oklch(0.70 0.18 48)" }}
                />
                <p className="text-sm" style={{ color: "oklch(0.70 0.18 48)" }}>
                  <strong>Demo Mode</strong> — Configure API keys to enable live
                  lookups. Showing example data for{" "}
                  <span className="font-mono">
                    {domainInput || "example.com"}
                  </span>
                  .
                </p>
              </div>
            )}

            {hasSuspiciousFlags && (
              <div
                data-ocid="dns_whois.error_state"
                className="flex items-start gap-3 px-4 py-4 rounded-xl"
                style={{
                  background: "oklch(0.62 0.22 22 / 0.08)",
                  border: "1px solid oklch(0.62 0.22 22 / 0.4)",
                }}
              >
                <AlertTriangle
                  className="h-5 w-5 shrink-0 mt-0.5"
                  style={{ color: "oklch(0.62 0.22 22)" }}
                />
                <div>
                  <p
                    className="font-semibold text-sm mb-1"
                    style={{ color: "oklch(0.62 0.22 22)" }}
                  >
                    Suspicious Domain Flags Detected
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {isNewlyReg && (
                      <span
                        className="px-3 py-1 rounded-full text-xs font-bold"
                        style={{
                          background: "oklch(0.62 0.22 22 / 0.12)",
                          color: "oklch(0.62 0.22 22)",
                          border: "1px solid oklch(0.62 0.22 22 / 0.3)",
                        }}
                      >
                        ⚠ Newly Registered (&lt;6 months)
                      </span>
                    )}
                    {isPrivacyMasked && (
                      <span
                        className="px-3 py-1 rounded-full text-xs font-bold"
                        style={{
                          background: "oklch(0.62 0.22 22 / 0.12)",
                          color: "oklch(0.62 0.22 22)",
                          border: "1px solid oklch(0.62 0.22 22 / 0.3)",
                        }}
                      >
                        ⚠ Privacy Masked
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* DNS Records */}
            <div className="glass rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-border flex items-center gap-3">
                <Globe className="h-4 w-4 text-lime" />
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  DNS Records
                </p>
                <span className="ml-auto text-xs text-muted-foreground">
                  {result.dnsRecords.length} records
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full" data-ocid="dns_whois.table">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Type
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Host
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Points To
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        TTL
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.dnsRecords.map((rec, i) => (
                      <tr
                        key={`${rec.type}-${i}`}
                        data-ocid={`dns_whois.row.${i + 1}`}
                        className="border-b border-border/50 hover:bg-white/5 transition-colors"
                      >
                        <td className="px-6 py-3.5">
                          <RecordTypeBadge type={rec.type} />
                        </td>
                        <td className="px-6 py-3.5 font-mono text-xs text-foreground">
                          {rec.host}
                        </td>
                        <td className="px-6 py-3.5 font-mono text-xs text-muted-foreground max-w-xs truncate">
                          {rec.pointsTo}
                        </td>
                        <td className="px-6 py-3.5 text-xs text-muted-foreground">
                          {rec.ttl}s
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* WHOIS Panel */}
            {whois && (
              <div className="glass rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-border flex items-center gap-3">
                  <Search className="h-4 w-4 text-lime" />
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    WHOIS Information
                  </p>
                </div>
                <div className="p-6 grid sm:grid-cols-2 gap-5">
                  {[
                    { label: "Domain Name", value: whois.domainName },
                    { label: "Registrar", value: whois.registrar },
                    { label: "Registered", value: whois.registered },
                    { label: "Expires", value: whois.expires },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="p-4 rounded-xl bg-navy-600 border border-border"
                    >
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                        {item.label}
                      </p>
                      <p className="font-mono text-sm text-foreground">
                        {item.value}
                      </p>
                    </div>
                  ))}
                  <div className="p-4 rounded-xl bg-navy-600 border border-border">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                      Privacy Masked
                    </p>
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-bold"
                      style={
                        isPrivacyMasked
                          ? {
                              background: "oklch(0.62 0.22 22 / 0.12)",
                              color: "oklch(0.62 0.22 22)",
                              border: "1px solid oklch(0.62 0.22 22 / 0.3)",
                            }
                          : {
                              background: "oklch(0.89 0.21 118 / 0.12)",
                              color: "oklch(0.89 0.21 118)",
                              border: "1px solid oklch(0.89 0.21 118 / 0.3)",
                            }
                      }
                    >
                      {isPrivacyMasked ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-navy-600 border border-border">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                      Registration Status
                    </p>
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-bold"
                      style={
                        isNewlyReg
                          ? {
                              background: "oklch(0.62 0.22 22 / 0.12)",
                              color: "oklch(0.62 0.22 22)",
                              border: "1px solid oklch(0.62 0.22 22 / 0.3)",
                            }
                          : {
                              background: "oklch(0.89 0.21 118 / 0.12)",
                              color: "oklch(0.89 0.21 118)",
                              border: "1px solid oklch(0.89 0.21 118 / 0.3)",
                            }
                      }
                    >
                      {isNewlyReg ? "Newly Registered" : "Established"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Attack Timeline */}
            <AttackTimeline target={scannedDomain} />
          </div>
        )}
      </div>
    </main>
  );
}
