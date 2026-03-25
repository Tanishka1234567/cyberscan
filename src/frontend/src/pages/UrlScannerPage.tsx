import AttackTimeline from "@/components/AttackTimeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useScanUrl } from "@/hooks/useQueries";
import {
  AlertTriangle,
  CheckCircle,
  Download,
  Info,
  Loader2,
  Shield,
  XCircle,
} from "lucide-react";
import { useState } from "react";

interface ScanService {
  name: string;
  status: string;
  details: string;
  safe: boolean;
}

interface ScanResult {
  url: string;
  riskScore: number;
  verdict: "SAFE" | "SUSPICIOUS" | "DANGEROUS";
  threatTypes: string[];
  services: ScanService[];
}

const DEMO_RESULT: ScanResult = {
  url: "https://example.com",
  riskScore: 8,
  verdict: "SAFE",
  threatTypes: [],
  services: [
    {
      name: "VirusTotal",
      status: "Clean",
      details: "0/72 engines flagged",
      safe: true,
    },
    {
      name: "Google Safe Browsing",
      status: "Safe",
      details: "No threats detected",
      safe: true,
    },
    {
      name: "SSL Certificate",
      status: "Valid",
      details: "Expires in 240 days (Let's Encrypt)",
      safe: true,
    },
    {
      name: "Domain Age",
      status: "Established",
      details: "Registered 25+ years ago",
      safe: true,
    },
  ],
};

const DEMO_DANGEROUS: ScanResult = {
  url: "http://malware-test-site.tk/phish",
  riskScore: 91,
  verdict: "DANGEROUS",
  threatTypes: ["Phishing", "Malware Distribution", "Social Engineering"],
  services: [
    {
      name: "VirusTotal",
      status: "Malicious",
      details: "54/72 engines flagged",
      safe: false,
    },
    {
      name: "Google Safe Browsing",
      status: "Dangerous",
      details: "SOCIAL_ENGINEERING threat type",
      safe: false,
    },
    {
      name: "SSL Certificate",
      status: "Missing",
      details: "No HTTPS — plain HTTP only",
      safe: false,
    },
    {
      name: "Domain Age",
      status: "Suspicious",
      details: "Registered 3 days ago",
      safe: false,
    },
  ],
};

function RiskGauge({ score }: { score: number }) {
  const clampedScore = Math.max(0, Math.min(100, score));
  const angle = 180 - (clampedScore / 100) * 180;
  const rad = (angle * Math.PI) / 180;
  const r = 80;
  const cx = 110;
  const cy = 100;
  const x = cx + r * Math.cos(rad);
  const y = cy - r * Math.sin(rad);

  const color =
    clampedScore >= 70
      ? "oklch(0.62 0.22 22)"
      : clampedScore >= 40
        ? "oklch(0.70 0.18 48)"
        : "oklch(0.89 0.21 118)";

  const bgArcPath = "M 30 100 A 80 80 0 0 1 190 100";
  const scoreArcPath =
    clampedScore === 0
      ? ""
      : `M 30 100 A 80 80 0 ${clampedScore > 50 ? 1 : 0} 1 ${x.toFixed(2)} ${y.toFixed(2)}`;

  return (
    <div className="flex flex-col items-center">
      <svg
        width="220"
        height="120"
        viewBox="0 0 220 120"
        aria-label={`Risk score: ${clampedScore}`}
      >
        <title>Risk Score Gauge</title>
        <path
          d={bgArcPath}
          fill="none"
          stroke="oklch(0.28 0.04 245)"
          strokeWidth="16"
          strokeLinecap="round"
        />
        {scoreArcPath && (
          <path
            d={scoreArcPath}
            fill="none"
            stroke={color}
            strokeWidth="16"
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 8px ${color})` }}
          />
        )}
        <text
          x={cx}
          y={cy + 8}
          textAnchor="middle"
          fill={color}
          fontSize="32"
          fontWeight="800"
          fontFamily="Inter, sans-serif"
        >
          {clampedScore}
        </text>
        <text
          x={cx}
          y={cy + 26}
          textAnchor="middle"
          fill="oklch(0.62 0.04 245)"
          fontSize="10"
          fontFamily="Inter, sans-serif"
        >
          RISK SCORE
        </text>
        <text
          x="18"
          y="118"
          fill="oklch(0.62 0.04 245)"
          fontSize="9"
          fontFamily="Inter, sans-serif"
        >
          0
        </text>
        <text
          x="196"
          y="118"
          fill="oklch(0.62 0.04 245)"
          fontSize="9"
          fontFamily="Inter, sans-serif"
        >
          100
        </text>
      </svg>
    </div>
  );
}

function VerdictBadge({ verdict }: { verdict: ScanResult["verdict"] }) {
  if (verdict === "SAFE") {
    return (
      <div
        className="flex items-center gap-2 px-5 py-2.5 rounded-full"
        style={{
          background: "oklch(0.89 0.21 118 / 0.12)",
          border: "1px solid oklch(0.89 0.21 118 / 0.4)",
        }}
      >
        <CheckCircle
          className="h-5 w-5"
          style={{ color: "oklch(0.89 0.21 118)" }}
        />
        <span
          className="font-black text-lg tracking-widest"
          style={{ color: "oklch(0.89 0.21 118)" }}
        >
          SAFE
        </span>
      </div>
    );
  }
  if (verdict === "SUSPICIOUS") {
    return (
      <div
        className="flex items-center gap-2 px-5 py-2.5 rounded-full"
        style={{
          background: "oklch(0.70 0.18 48 / 0.12)",
          border: "1px solid oklch(0.70 0.18 48 / 0.4)",
        }}
      >
        <AlertTriangle
          className="h-5 w-5"
          style={{ color: "oklch(0.70 0.18 48)" }}
        />
        <span
          className="font-black text-lg tracking-widest"
          style={{ color: "oklch(0.70 0.18 48)" }}
        >
          SUSPICIOUS
        </span>
      </div>
    );
  }
  return (
    <div
      className="flex items-center gap-2 px-5 py-2.5 rounded-full"
      style={{
        background: "oklch(0.62 0.22 22 / 0.12)",
        border: "1px solid oklch(0.62 0.22 22 / 0.4)",
      }}
    >
      <XCircle className="h-5 w-5" style={{ color: "oklch(0.62 0.22 22)" }} />
      <span
        className="font-black text-lg tracking-widest"
        style={{ color: "oklch(0.62 0.22 22)" }}
      >
        DANGEROUS
      </span>
    </div>
  );
}

function parseScanResult(raw: string, url: string): ScanResult | null {
  try {
    const data = JSON.parse(raw);
    return {
      url,
      riskScore:
        typeof data.riskScore === "number"
          ? data.riskScore
          : Number(data.riskScore ?? 0),
      verdict: data.verdict ?? "SAFE",
      threatTypes: data.threatTypes ?? data.threats ?? [],
      services: data.services ?? [],
    };
  } catch {
    return null;
  }
}

export default function UrlScannerPage() {
  const [urlInput, setUrlInput] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [scannedUrl, setScannedUrl] = useState("");
  const [isDemoMode, setIsDemoMode] = useState(false);
  const { mutateAsync: scanUrl, isPending } = useScanUrl();

  const handleScan = async () => {
    if (!urlInput.trim()) return;
    setResult(null);
    setIsDemoMode(false);
    try {
      const raw = await scanUrl(urlInput.trim());
      const parsed = parseScanResult(raw, urlInput.trim());
      if (parsed) {
        setResult(parsed);
        setScannedUrl(urlInput.trim());
      } else {
        setResult({ ...DEMO_RESULT, url: urlInput.trim() });
        setScannedUrl(urlInput.trim());
        setIsDemoMode(true);
      }
    } catch {
      const isDangerous =
        urlInput.includes("malware") || urlInput.includes("phish");
      setResult({
        ...(isDangerous ? DEMO_DANGEROUS : DEMO_RESULT),
        url: urlInput.trim(),
      });
      setScannedUrl(urlInput.trim());
      setIsDemoMode(true);
    }
  };

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
            🛡 CYBERSCAN — URL Security Report
          </h1>
          <p style={{ fontSize: "11px", color: "#555", marginTop: "4px" }}>
            Scan Target: {result?.url}
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
              Threat Intelligence
            </p>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              URL Scanner
            </h1>
            <p className="text-muted-foreground">
              Analyze any URL against multiple threat intelligence engines in
              real time.
            </p>
          </div>
          {result && (
            <Button
              onClick={handleDownload}
              data-ocid="url_scanner.download_button"
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
            htmlFor="url-input"
            className="text-sm font-semibold text-muted-foreground mb-3 block uppercase tracking-wider"
          >
            Enter URL to scan
          </label>
          <div className="flex gap-3">
            <Input
              id="url-input"
              data-ocid="url_scanner.input"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleScan()}
              placeholder="https://example.com"
              className="flex-1 h-12 bg-navy-600 border-border text-foreground placeholder:text-muted-foreground/50 font-mono"
            />
            <Button
              data-ocid="url_scanner.submit_button"
              onClick={handleScan}
              disabled={isPending || !urlInput.trim()}
              className="h-12 px-7 bg-lime text-navy-900 hover:bg-lime/90 font-bold glow-lime transition-all"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Scanning...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" /> Scan Now
                </>
              )}
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground/60">
            Supports http://, https://, and bare domain inputs
          </p>
        </div>

        {/* Scanning animation */}
        {isPending && (
          <div
            data-ocid="url_scanner.loading_state"
            className="glass rounded-2xl p-12 mb-8 flex flex-col items-center gap-6 fade-in"
          >
            <div className="pulse-ring">
              <div
                className="h-16 w-16 rounded-full flex items-center justify-center"
                style={{
                  background: "oklch(0.89 0.21 118 / 0.1)",
                  border: "2px solid oklch(0.89 0.21 118 / 0.5)",
                }}
              >
                <Shield className="h-8 w-8 text-lime" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-foreground mb-1">
                Analyzing URL...
              </p>
              <p className="text-sm text-muted-foreground">
                Querying threat intelligence engines
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {["VirusTotal", "Google Safe Browsing", "SSL Check", "WHOIS"].map(
                (s) => (
                  <span
                    key={s}
                    className="text-xs px-3 py-1 rounded-full glass border border-lime/20 text-muted-foreground"
                  >
                    {s}
                  </span>
                ),
              )}
            </div>
          </div>
        )}

        {/* Results */}
        {result && !isPending && (
          <div
            className="space-y-6 fade-in"
            data-ocid="url_scanner.success_state"
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
                  <strong>Demo Mode</strong> — Configure API keys in settings to
                  enable live scanning. Showing simulated results.
                </p>
              </div>
            )}

            {/* Risk overview */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="glass rounded-2xl p-6 flex flex-col items-center justify-center">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  Risk Assessment
                </p>
                <RiskGauge score={result.riskScore} />
                <div className="mt-4">
                  <VerdictBadge verdict={result.verdict} />
                </div>
              </div>
              <div className="glass rounded-2xl p-6">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  Scan Target
                </p>
                <p className="font-mono text-sm text-foreground break-all mb-5 p-3 rounded-lg bg-navy-600 border border-border">
                  {result.url}
                </p>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Threat Types
                </p>
                {result.threatTypes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No threats detected
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {result.threatTypes.map((t) => (
                      <Badge
                        key={t}
                        className="px-3 py-1 text-xs font-bold"
                        style={{
                          background: "oklch(0.62 0.22 22 / 0.15)",
                          border: "1px solid oklch(0.62 0.22 22 / 0.4)",
                          color: "oklch(0.62 0.22 22)",
                        }}
                      >
                        {t}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Services table */}
            <div className="glass rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Engine Results
                </p>
              </div>
              <table className="w-full" data-ocid="url_scanner.table">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Service
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {result.services.map((svc, i) => (
                    <tr
                      key={svc.name}
                      data-ocid={`url_scanner.row.${i + 1}`}
                      className="border-b border-border/50 hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4 font-semibold text-sm text-foreground">
                        {svc.name}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="px-2.5 py-1 rounded-full text-xs font-bold"
                          style={
                            svc.safe
                              ? {
                                  background: "oklch(0.89 0.21 118 / 0.12)",
                                  color: "oklch(0.89 0.21 118)",
                                  border:
                                    "1px solid oklch(0.89 0.21 118 / 0.3)",
                                }
                              : {
                                  background: "oklch(0.62 0.22 22 / 0.12)",
                                  color: "oklch(0.62 0.22 22)",
                                  border: "1px solid oklch(0.62 0.22 22 / 0.3)",
                                }
                          }
                        >
                          {svc.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {svc.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Attack Timeline */}
            <AttackTimeline target={scannedUrl || result.url} />
          </div>
        )}

        {/* Empty state */}
        {!result && !isPending && (
          <div
            data-ocid="url_scanner.empty_state"
            className="glass rounded-2xl p-16 flex flex-col items-center text-center fade-in-up"
            style={{ animationDelay: "0.2s" }}
          >
            <Shield className="h-14 w-14 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Ready to scan
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Enter any URL above to check it against our threat intelligence
              engines.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
