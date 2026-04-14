import AiAnalysisPanel, {
  type AiAnalysis,
  parseAiAnalysis,
} from "@/components/AiAnalysisPanel";
import AttackTimeline from "@/components/AttackTimeline";
import { Badge } from "@/components/ui/badge";
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
import { useScanUrl } from "@/hooks/useQueries";
import {
  incrementDownloadCount,
  printReport,
  saveReport,
} from "@/utils/downloadReports";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  CheckCircle,
  Download,
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
  aiAnalysis?: AiAnalysis | null;
}

// Cyberpunk color palette
const NEON_BLUE = "oklch(0.65 0.22 250)";
const NEON_PINK = "oklch(0.65 0.20 335)";
const ORANGE = "oklch(0.70 0.18 48)";

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
    clampedScore >= 70 ? NEON_PINK : clampedScore >= 40 ? ORANGE : NEON_BLUE;

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
            style={{ filter: `drop-shadow(0 0 10px ${color})` }}
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
          background: `${NEON_BLUE.replace(")", " / 0.12)")}`,
          border: `1px solid ${NEON_BLUE.replace(")", " / 0.4)")}`,
          boxShadow: `0 0 16px ${NEON_BLUE.replace(")", " / 0.2)")}`,
        }}
      >
        <CheckCircle className="h-5 w-5" style={{ color: NEON_BLUE }} />
        <span
          className="font-black text-lg tracking-widest"
          style={{ color: NEON_BLUE }}
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
          background: `${ORANGE.replace(")", " / 0.12)")}`,
          border: `1px solid ${ORANGE.replace(")", " / 0.4)")}`,
        }}
      >
        <AlertTriangle className="h-5 w-5" style={{ color: ORANGE }} />
        <span
          className="font-black text-lg tracking-widest"
          style={{ color: ORANGE }}
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
        background: `${NEON_PINK.replace(")", " / 0.12)")}`,
        border: `1px solid ${NEON_PINK.replace(")", " / 0.4)")}`,
        boxShadow: `0 0 16px ${NEON_PINK.replace(")", " / 0.2)")}`,
      }}
    >
      <XCircle className="h-5 w-5" style={{ color: NEON_PINK }} />
      <span
        className="font-black text-lg tracking-widest"
        style={{ color: NEON_PINK }}
      >
        DANGEROUS
      </span>
    </div>
  );
}

function safeParseJson(value: unknown, label: string): Record<string, unknown> {
  if (value === null || value === undefined) return {};
  if (typeof value === "object") return value as Record<string, unknown>;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object")
        return parsed as Record<string, unknown>;
    } catch (err) {
      console.warn(`[CyberScan] Failed to parse ${label} as JSON:`, err);
    }
  }
  return {};
}

function extractOuterWrapper(raw: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (parsed && typeof parsed === "object") return parsed;
  } catch {
    console.warn(
      "[CyberScan] Outer JSON parse failed, trying regex extraction...",
    );
  }

  const result: Record<string, unknown> = {};
  let extracted = false;

  const vtMatch = raw.match(
    /"vtResponse"\s*:\s*(\{[\s\S]*?\}(?=\s*,\s*"sbResponse"))/,
  );
  if (vtMatch) {
    try {
      result.vtResponse = JSON.parse(vtMatch[1]);
      extracted = true;
    } catch {
      result.vtResponse = vtMatch[1];
    }
  }

  const sbMatch = raw.match(
    /"sbResponse"\s*:\s*(\{[\s\S]*?\}(?=\s*,\s*"aiAnalysis"))/,
  );
  if (sbMatch) {
    try {
      result.sbResponse = JSON.parse(sbMatch[1]);
      extracted = true;
    } catch {
      result.sbResponse = sbMatch[1];
    }
  }

  const aiMatch = raw.match(/"aiAnalysis"\s*:\s*(\{[^}]+\})\s*\}?\s*$/);
  if (aiMatch) {
    try {
      result.aiAnalysis = JSON.parse(aiMatch[1]);
      extracted = true;
    } catch {
      /* non-critical */
    }
  }

  if (extracted) return result;
  console.error("[CyberScan] All outer wrapper extraction strategies failed.");
  return null;
}

function parseScanResult(raw: string, url: string): ScanResult | null {
  const wrapper = extractOuterWrapper(raw);
  if (!wrapper) return null;

  const vtData = safeParseJson(wrapper.vtResponse, "vtResponse");
  const sbData = safeParseJson(wrapper.sbResponse, "sbResponse");

  let aiAnalysis: AiAnalysis | null = null;
  try {
    aiAnalysis = parseAiAnalysis(wrapper);
  } catch (err) {
    console.warn("[CyberScan] AI analysis parse failed:", err);
  }

  const sbMatches = sbData.matches as
    | Array<Record<string, unknown>>
    | undefined;
  const threatTypes: string[] = sbMatches
    ? sbMatches.map((m) => String(m.threatType ?? "Unknown"))
    : [];

  const vtAttrs = (
    (vtData.data as Record<string, unknown>)?.attributes as Record<
      string,
      unknown
    >
  )?.last_analysis_stats as Record<string, number> | undefined;
  const vtMalicious = vtAttrs?.malicious ?? 0;
  const vtSuspicious = vtAttrs?.suspicious ?? 0;
  const hasSbThreats = (sbMatches?.length ?? 0) > 0;

  const hasVtData = vtAttrs !== undefined;
  const hasSbData = sbData && Object.keys(sbData).length > 0;
  if (!hasVtData && !hasSbData && !aiAnalysis?.available) return null;

  const totalFlags = vtMalicious + vtSuspicious;
  const riskScore =
    totalFlags > 0
      ? Math.min(100, 20 + totalFlags * 2 + (hasSbThreats ? 20 : 0))
      : hasSbThreats
        ? 60
        : 10;
  const verdict: ScanResult["verdict"] =
    vtMalicious > 5 || (hasSbThreats && vtMalicious > 0)
      ? "DANGEROUS"
      : vtMalicious > 0 || vtSuspicious > 2 || hasSbThreats
        ? "SUSPICIOUS"
        : "SAFE";

  const vtTotal = vtAttrs
    ? (vtAttrs.harmless ?? 0) +
      (vtAttrs.malicious ?? 0) +
      (vtAttrs.suspicious ?? 0) +
      (vtAttrs.undetected ?? 0)
    : 0;
  const services: ScanResult["services"] = [
    {
      name: "VirusTotal",
      status: !hasVtData
        ? "Unavailable"
        : vtMalicious > 0
          ? "Malicious"
          : vtSuspicious > 0
            ? "Suspicious"
            : "Clean",
      details: !hasVtData
        ? "Reputation data unavailable — check API key"
        : vtTotal > 0
          ? `${vtMalicious}/${vtTotal} engines flagged`
          : "No detection data",
      safe: !hasVtData || (vtMalicious === 0 && vtSuspicious === 0),
    },
    {
      name: "Google Safe Browsing",
      status: !hasSbData ? "Unavailable" : hasSbThreats ? "Dangerous" : "Safe",
      details: !hasSbData
        ? "Safe Browsing data unavailable — check API key"
        : hasSbThreats
          ? (sbMatches ?? []).map((m) => String(m.threatType ?? "")).join(", ")
          : "No threats detected",
      safe: !hasSbData || !hasSbThreats,
    },
  ];

  return { url, riskScore, verdict, threatTypes, services, aiAnalysis };
}

export default function UrlScannerPage() {
  const [urlInput, setUrlInput] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [scannedUrl, setScannedUrl] = useState("");
  const [scanError, setScanError] = useState<string | null>(null);
  const [latestReportId, setLatestReportId] = useState<string | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const { mutateAsync: scanUrl, isPending } = useScanUrl();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleScan = async () => {
    if (!urlInput.trim()) return;
    setResult(null);
    setScanError(null);
    setLatestReportId(null);
    try {
      const raw = await scanUrl(urlInput.trim());
      const parsed = parseScanResult(raw, urlInput.trim());
      if (parsed) {
        setResult(parsed);
        setScannedUrl(urlInput.trim());
        if (user) {
          const saved = saveReport(user.email, {
            target: parsed.url,
            scanType: "url",
            timestamp: Date.now(),
            verdict: parsed.verdict,
            riskScore: parsed.riskScore,
            services: parsed.services,
            threatTypes: parsed.threatTypes,
            aiAnalysis: parsed.aiAnalysis ?? undefined,
          });
          setLatestReportId(saved.id);
        }
      } else {
        setScanError(
          "Scan completed but results could not be displayed. Please check your API keys or try again.",
        );
      }
    } catch {
      setScanError("Scan failed. Please check the URL and try again.");
    }
  };

  const handleDownload = () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    if (!result) return;
    if (latestReportId) incrementDownloadCount(user.email, latestReportId);
    printReport({
      id: latestReportId ?? Date.now().toString(),
      target: result.url,
      scanType: "url",
      timestamp: Date.now(),
      verdict: result.verdict,
      riskScore: result.riskScore,
      downloadCount: 1,
      services: result.services,
      threatTypes: result.threatTypes,
      aiAnalysis: result.aiAnalysis ?? undefined,
    });
  };

  return (
    <main className="min-h-screen py-10 px-4 fade-in">
      <Dialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
        <DialogContent data-ocid="url_scanner.dialog" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Login Required</DialogTitle>
            <DialogDescription>
              You need to be logged in to download scan reports.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:flex-row flex-col-reverse">
            <Button
              data-ocid="url_scanner.cancel_button"
              variant="ghost"
              onClick={() => setShowLoginPrompt(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="url_scanner.confirm_button"
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
            <p
              className="text-xs font-semibold tracking-widest uppercase mb-2"
              style={{ color: NEON_BLUE }}
            >
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
              className="flex-1 h-12 border-border text-foreground placeholder:text-muted-foreground/50 font-mono"
              style={{ background: "oklch(0.12 0.04 255 / 0.5)" }}
            />
            <Button
              data-ocid="url_scanner.submit_button"
              onClick={handleScan}
              disabled={isPending || !urlInput.trim()}
              className="h-12 px-7 font-bold transition-all"
              style={{
                background: NEON_BLUE,
                color: "oklch(0.08 0.02 250)",
                boxShadow: `0 0 16px ${NEON_BLUE.replace(")", " / 0.4)")}`,
              }}
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

        {/* Loading */}
        {isPending && (
          <div
            data-ocid="url_scanner.loading_state"
            className="glass rounded-2xl p-12 mb-8 flex flex-col items-center gap-6 fade-in"
          >
            <div className="pulse-ring">
              <div
                className="h-16 w-16 rounded-full flex items-center justify-center"
                style={{
                  background: `${NEON_BLUE.replace(")", " / 0.1)")}`,
                  border: `2px solid ${NEON_BLUE.replace(")", " / 0.5)")}`,
                }}
              >
                <Shield className="h-8 w-8" style={{ color: NEON_BLUE }} />
              </div>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-foreground mb-1">
                Analyzing URL...
              </p>
              <p className="text-sm text-muted-foreground">
                Querying threat intelligence engines + AI analysis
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                "VirusTotal",
                "Google Safe Browsing",
                "SSL Check",
                "AI Analysis",
              ].map((s) => (
                <span
                  key={s}
                  className="text-xs px-3 py-1 rounded-full glass border text-muted-foreground"
                  style={{
                    borderColor: `${NEON_BLUE.replace(")", " / 0.2)")}`,
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {scanError && !isPending && (
          <div
            data-ocid="url_scanner.error_state"
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
              {scanError}
            </p>
          </div>
        )}

        {/* Results */}
        {result && !isPending && (
          <div
            className="space-y-6 fade-in"
            data-ocid="url_scanner.success_state"
          >
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
                <p
                  className="font-mono text-sm text-foreground break-all mb-5 p-3 rounded-lg border border-border"
                  style={{ background: "oklch(0.12 0.04 255 / 0.5)" }}
                >
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
                          background: `${NEON_PINK.replace(")", " / 0.15)")}`,
                          border: `1px solid ${NEON_PINK.replace(")", " / 0.4)")}`,
                          color: NEON_PINK,
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
                      className="border-b border-border/50 hover:bg-primary/5 transition-colors"
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
                                  background: `${NEON_BLUE.replace(")", " / 0.12)")}`,
                                  color: NEON_BLUE,
                                  border: `1px solid ${NEON_BLUE.replace(")", " / 0.3)")}`,
                                }
                              : {
                                  background: `${NEON_PINK.replace(")", " / 0.12)")}`,
                                  color: NEON_PINK,
                                  border: `1px solid ${NEON_PINK.replace(")", " / 0.3)")}`,
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

            <AiAnalysisPanel ai={result.aiAnalysis} isLoading={false} />
            <AttackTimeline target={scannedUrl || result.url} />
          </div>
        )}

        {/* Empty state */}
        {!result && !isPending && !scanError && (
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
              engines and AI analysis.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
