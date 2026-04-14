import AttackTimeline from "@/components/AttackTimeline";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useLookupDns } from "@/hooks/useQueries";
import { incrementDownloadCount, saveReport } from "@/utils/downloadReports";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  Download,
  Globe,
  Loader2,
  Search,
  XCircle,
} from "lucide-react";
import { useState } from "react";

const NEON_BLUE = "oklch(0.65 0.22 250)";
const NEON_PINK = "oklch(0.65 0.20 335)";
const MAGENTA = "oklch(0.60 0.23 305)";
const ORANGE = "oklch(0.70 0.18 48)";

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
  nameServers: string[];
  registrantCountry: string;
}
interface DnsResult {
  dnsRecords: DnsRecord[];
  whois: WhoisInfo;
  partial?: boolean;
}

function parseDnsJson(raw: string): DnsRecord[] {
  try {
    const data = JSON.parse(raw) as Record<string, unknown>;
    const answers = data.Answer as Array<Record<string, unknown>> | undefined;
    if (!answers || !Array.isArray(answers)) return [];
    const typeMap: Record<number, string> = {
      1: "A",
      2: "NS",
      5: "CNAME",
      15: "MX",
      16: "TXT",
      28: "AAAA",
    };
    return answers.map((ans) => ({
      type: typeMap[Number(ans.type)] ?? String(ans.type),
      host: String(ans.name ?? ""),
      pointsTo: String(ans.data ?? ""),
      ttl: String(ans.TTL ?? ans.ttl ?? ""),
    }));
  } catch (err) {
    console.warn("[CyberScan] Failed to parse DNS JSON:", err);
    return [];
  }
}

function parseWhoisJson(raw: string): WhoisInfo | null {
  try {
    const data = JSON.parse(raw) as Record<string, unknown>;
    const record =
      (data.WhoisRecord as Record<string, unknown>) ??
      (data.whoisRecord as Record<string, unknown>) ??
      data;
    const registryData =
      (record.registryData as Record<string, unknown>) ?? record;
    const registrar = String(
      (record.registrarName as string) ??
        (registryData.registrarName as string) ??
        "Unknown",
    );
    const createdDate =
      (registryData.createdDate as string) ??
      (record.createdDate as string) ??
      "";
    const expiresDate =
      (registryData.expiresDate as string) ??
      (record.expiresDate as string) ??
      "";
    const registrant = (record.registrant as Record<string, unknown>) ?? {};
    const privacyMasked =
      String(registrant.name ?? "")
        .toLowerCase()
        .includes("redacted") ||
      String(registrant.email ?? "")
        .toLowerCase()
        .includes("redacted") ||
      String(registrant.organization ?? "")
        .toLowerCase()
        .includes("privacy") ||
      String(registrant.organization ?? "")
        .toLowerCase()
        .includes("protect");
    let newlyRegistered = false;
    if (createdDate) {
      try {
        const created = new Date(createdDate).getTime();
        newlyRegistered = created > Date.now() - 6 * 30 * 24 * 60 * 60 * 1000;
      } catch {
        /* ignore */
      }
    }
    const rawNs =
      (registryData.nameServers as unknown) ??
      (record.nameServers as unknown) ??
      (registryData.nameServer as unknown) ??
      null;
    let nameServers: string[] = [];
    if (Array.isArray(rawNs)) {
      nameServers = rawNs
        .map((ns: unknown) => {
          if (typeof ns === "string") return ns;
          if (ns && typeof ns === "object") {
            const n = ns as Record<string, unknown>;
            return String(n.name ?? n.hostName ?? n.nameServer ?? "");
          }
          return "";
        })
        .filter(Boolean);
    } else if (typeof rawNs === "string" && rawNs.trim()) {
      nameServers = rawNs.split(/[\s,]+/).filter(Boolean);
    }
    const adminContact =
      (record.administrativeContact as Record<string, unknown>) ?? {};
    const registrantCountry =
      String(
        (registrant.country as string) ??
          (registryData as Record<string, unknown>).registrantCountry ??
          (adminContact.country as string) ??
          "",
      ).trim() || "Not Available";
    return {
      domainName: String(record.domainName ?? ""),
      registrar,
      registered: createdDate || "Unknown",
      expires: expiresDate || "Unknown",
      privacyMasked,
      newlyRegistered,
      nameServers,
      registrantCountry,
    };
  } catch (err) {
    console.warn("[CyberScan] Failed to parse WHOIS JSON:", err);
    return null;
  }
}

const EMPTY_WHOIS: WhoisInfo = {
  domainName: "",
  registrar: "Unavailable",
  registered: "Unknown",
  expires: "Unknown",
  privacyMasked: false,
  newlyRegistered: false,
  nameServers: [],
  registrantCountry: "Not Available",
};

function parseDnsResult(raw: string): DnsResult | null {
  const pipeIdx = raw.indexOf(" | ");
  if (pipeIdx !== -1) {
    const dnsRecords = parseDnsJson(raw.slice(0, pipeIdx).trim());
    const whois = parseWhoisJson(raw.slice(pipeIdx + 3).trim());
    if (dnsRecords.length > 0 || whois !== null)
      return {
        dnsRecords,
        whois: whois ?? EMPTY_WHOIS,
        partial: whois === null,
      };
  }
  try {
    const data = JSON.parse(raw) as Record<string, unknown>;
    const dnsRecords = (data.dnsRecords ?? data.records ?? []) as DnsRecord[];
    const whois = (data.whois ?? {}) as WhoisInfo;
    if (dnsRecords.length > 0 || Object.keys(whois).length > 0)
      return { dnsRecords, whois };
  } catch {
    /* not JSON */
  }
  const dnsRecordsOnly = parseDnsJson(raw);
  if (dnsRecordsOnly.length > 0)
    return { dnsRecords: dnsRecordsOnly, whois: EMPTY_WHOIS, partial: true };
  return null;
}

// Cyberpunk DNS type badge colors
const typeColors: Record<string, string> = {
  A: NEON_BLUE,
  AAAA: MAGENTA,
  MX: ORANGE,
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
  const [result, setResult] = useState<DnsResult | null>(null);
  const [scannedDomain, setScannedDomain] = useState("");
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [latestReportId, setLatestReportId] = useState<string | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const { mutateAsync: lookupDns, isPending } = useLookupDns();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLookup = async () => {
    if (!domainInput.trim()) return;
    setResult(null);
    setLookupError(null);
    setLatestReportId(null);
    try {
      const raw = await lookupDns(domainInput.trim());
      const parsed = parseDnsResult(raw);
      if (parsed) {
        setResult(parsed);
        setScannedDomain(domainInput.trim());
        const hasSuspicious =
          parsed.whois?.newlyRegistered || parsed.whois?.privacyMasked;
        if (user) {
          const saved = saveReport(user.email, {
            target: domainInput.trim(),
            scanType: "dns",
            timestamp: Date.now(),
            verdict: hasSuspicious ? "SUSPICIOUS" : "SAFE",
            riskScore: hasSuspicious ? 55 : 10,
            dnsRecords: parsed.dnsRecords,
            whoisInfo: parsed.whois as unknown as Record<
              string,
              string | boolean
            >,
          });
          setLatestReportId(saved.id);
        }
      } else {
        setLookupError(
          "Lookup completed but results could not be displayed. Please check your API keys or try again.",
        );
      }
    } catch {
      setLookupError(
        "Lookup failed. Please check the domain name and try again.",
      );
    }
  };

  const whois = result?.whois;
  const isNewlyReg = whois?.newlyRegistered;
  const isPrivacyMasked = whois?.privacyMasked;
  const hasSuspiciousFlags = isNewlyReg || isPrivacyMasked;

  const handleDownload = () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    if (user && latestReportId)
      incrementDownloadCount(user.email, latestReportId);
    window.print();
  };

  return (
    <main className="min-h-screen py-10 px-4 fade-in">
      <Dialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
        <DialogContent data-ocid="dns_whois.dialog" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Login Required</DialogTitle>
            <DialogDescription>
              You need to be logged in to download scan reports.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:flex-row flex-col-reverse">
            <Button
              data-ocid="dns_whois.cancel_button"
              variant="ghost"
              onClick={() => setShowLoginPrompt(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="dns_whois.confirm_button"
              onClick={() => {
                setShowLoginPrompt(false);
                navigate({ to: "/login" });
              }}
              style={{ background: NEON_BLUE, color: "oklch(0.08 0.02 250)" }}
              className="font-bold"
            >
              Login
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
        <div className="mb-10 fade-in-up flex items-start justify-between gap-4">
          <div>
            <p
              className="text-xs font-semibold tracking-widest uppercase mb-2"
              style={{ color: NEON_BLUE }}
            >
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
              className="shrink-0 print-hide"
              style={{
                borderColor: `${NEON_BLUE.replace(")", " / 0.35)")}`,
                color: NEON_BLUE,
              }}
            >
              <Download className="h-4 w-4 mr-2" /> Download Report
            </Button>
          )}
        </div>

        {/* Input */}
        <div
          className="glass rounded-2xl p-6 mb-8 fade-in-up print-hide border-glow"
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
              className="flex-1 h-12 border-border text-foreground placeholder:text-muted-foreground/50 font-mono"
              style={{ background: "oklch(0.12 0.04 255 / 0.5)" }}
            />
            <Button
              data-ocid="dns_whois.submit_button"
              onClick={handleLookup}
              disabled={isPending || !domainInput.trim()}
              className="h-12 px-7 font-bold transition-all"
              style={{
                background: NEON_BLUE,
                color: "oklch(0.08 0.02 250)",
                boxShadow: `0 0 16px ${NEON_BLUE.replace(")", " / 0.4)")}`,
              }}
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

        {isPending && (
          <div
            data-ocid="dns_whois.loading_state"
            className="glass rounded-2xl p-12 mb-8 flex flex-col items-center gap-4 fade-in"
          >
            <Loader2
              className="h-10 w-10 animate-spin"
              style={{ color: NEON_BLUE }}
            />
            <p className="text-foreground font-semibold">
              Querying DNS resolvers...
            </p>
            <p className="text-sm text-muted-foreground">
              Fetching WHOIS records
            </p>
          </div>
        )}

        {lookupError && !isPending && (
          <div
            data-ocid="dns_whois.error_state"
            className="glass rounded-2xl p-6 mb-8 flex items-center gap-3 fade-in"
            style={{
              border: `1px solid ${NEON_PINK.replace(")", " / 0.4)")}`,
              background: `${NEON_PINK.replace(")", " / 0.06)")}`,
            }}
          >
            <XCircle
              className="h-5 w-5 shrink-0"
              style={{ color: NEON_PINK }}
            />
            <p className="text-sm" style={{ color: NEON_PINK }}>
              {lookupError}
            </p>
          </div>
        )}

        {result && !isPending && (
          <div
            className="space-y-6 fade-in"
            data-ocid="dns_whois.success_state"
          >
            {result.partial && (
              <div
                className="flex items-start gap-3 px-4 py-4 rounded-xl"
                style={{
                  background: `${ORANGE.replace(")", " / 0.08)")}`,
                  border: `1px solid ${ORANGE.replace(")", " / 0.35)")}`,
                }}
              >
                <AlertTriangle
                  className="h-5 w-5 shrink-0 mt-0.5"
                  style={{ color: ORANGE }}
                />
                <p className="text-sm" style={{ color: ORANGE }}>
                  WHOIS data is unavailable — showing DNS records only. This may
                  be due to a missing WHOIS API key.
                </p>
              </div>
            )}

            {hasSuspiciousFlags && (
              <div
                className="flex items-start gap-3 px-4 py-4 rounded-xl"
                style={{
                  background: `${NEON_PINK.replace(")", " / 0.08)")}`,
                  border: `1px solid ${NEON_PINK.replace(")", " / 0.4)")}`,
                }}
              >
                <AlertTriangle
                  className="h-5 w-5 shrink-0 mt-0.5"
                  style={{ color: NEON_PINK }}
                />
                <div>
                  <p
                    className="font-semibold text-sm mb-1"
                    style={{ color: NEON_PINK }}
                  >
                    Suspicious Domain Flags Detected
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {isNewlyReg && (
                      <span
                        className="px-3 py-1 rounded-full text-xs font-bold"
                        style={{
                          background: `${NEON_PINK.replace(")", " / 0.12)")}`,
                          color: NEON_PINK,
                          border: `1px solid ${NEON_PINK.replace(")", " / 0.3)")}`,
                        }}
                      >
                        ⚠ Newly Registered (&lt;6 months)
                      </span>
                    )}
                    {isPrivacyMasked && (
                      <span
                        className="px-3 py-1 rounded-full text-xs font-bold"
                        style={{
                          background: `${NEON_PINK.replace(")", " / 0.12)")}`,
                          color: NEON_PINK,
                          border: `1px solid ${NEON_PINK.replace(")", " / 0.3)")}`,
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
                <Globe className="h-4 w-4" style={{ color: NEON_BLUE }} />
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  DNS Records
                </p>
                <span className="ml-auto text-xs text-muted-foreground">
                  {result.dnsRecords.length} records
                </span>
              </div>
              {result.dnsRecords.length === 0 ? (
                <div className="px-6 py-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    No DNS records found for this domain.
                  </p>
                </div>
              ) : (
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
                          className="border-b border-border/50 hover:bg-primary/5 transition-colors"
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
              )}
            </div>

            {/* WHOIS Panel */}
            {whois && !result.partial && (
              <div className="glass rounded-2xl overflow-hidden border-glow-accent">
                <div className="px-6 py-4 border-b border-border flex items-center gap-3">
                  <Search className="h-4 w-4" style={{ color: MAGENTA }} />
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
                    {
                      label: "Registrant Country",
                      value: whois.registrantCountry,
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="p-4 rounded-xl border border-border"
                      style={{ background: "oklch(0.12 0.04 255 / 0.5)" }}
                    >
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                        {item.label}
                      </p>
                      <p className="font-mono text-sm text-foreground">
                        {item.value || "Unknown"}
                      </p>
                    </div>
                  ))}
                  <div
                    className="p-4 rounded-xl border border-border"
                    style={{ background: "oklch(0.12 0.04 255 / 0.5)" }}
                  >
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                      Name Servers
                    </p>
                    {whois.nameServers.length > 0 ? (
                      <ul className="space-y-1">
                        {whois.nameServers.map((ns) => (
                          <li
                            key={ns}
                            className="font-mono text-xs text-foreground flex items-start gap-1.5"
                          >
                            <span
                              className="mt-0.5 shrink-0"
                              style={{ color: NEON_BLUE }}
                            >
                              •
                            </span>
                            <span className="break-all">{ns}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="font-mono text-sm text-muted-foreground">
                        Not Available
                      </p>
                    )}
                  </div>
                  <div
                    className="p-4 rounded-xl border border-border"
                    style={{ background: "oklch(0.12 0.04 255 / 0.5)" }}
                  >
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                      Privacy Masked
                    </p>
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-bold"
                      style={
                        isPrivacyMasked
                          ? {
                              background: `${NEON_PINK.replace(")", " / 0.12)")}`,
                              color: NEON_PINK,
                              border: `1px solid ${NEON_PINK.replace(")", " / 0.3)")}`,
                            }
                          : {
                              background: `${NEON_BLUE.replace(")", " / 0.12)")}`,
                              color: NEON_BLUE,
                              border: `1px solid ${NEON_BLUE.replace(")", " / 0.3)")}`,
                            }
                      }
                    >
                      {isPrivacyMasked ? "Yes" : "No"}
                    </span>
                  </div>
                  <div
                    className="p-4 rounded-xl border border-border"
                    style={{ background: "oklch(0.12 0.04 255 / 0.5)" }}
                  >
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                      Registration Status
                    </p>
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-bold"
                      style={
                        isNewlyReg
                          ? {
                              background: `${NEON_PINK.replace(")", " / 0.12)")}`,
                              color: NEON_PINK,
                              border: `1px solid ${NEON_PINK.replace(")", " / 0.3)")}`,
                            }
                          : {
                              background: `${NEON_BLUE.replace(")", " / 0.12)")}`,
                              color: NEON_BLUE,
                              border: `1px solid ${NEON_BLUE.replace(")", " / 0.3)")}`,
                            }
                      }
                    >
                      {isNewlyReg ? "Newly Registered" : "Established"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <AttackTimeline target={scannedDomain} />
          </div>
        )}

        {!result && !isPending && !lookupError && (
          <div
            data-ocid="dns_whois.empty_state"
            className="glass rounded-2xl p-16 flex flex-col items-center text-center fade-in-up"
            style={{ animationDelay: "0.2s" }}
          >
            <Globe className="h-14 w-14 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Ready to lookup
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Enter any domain above to query DNS records, WHOIS information,
              and detect suspicious registration patterns.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
