import AiAnalysisPanel, { type AiAnalysis } from "@/components/AiAnalysisPanel";
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
import { usePhishingDetect } from "@/hooks/useQueries";
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
  Eye,
  EyeOff,
  FishIcon,
  Loader2,
  Lock,
  LockOpen,
  Shield,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { useState } from "react";

// Cyberpunk palette
const NEON_BLUE = "oklch(0.65 0.22 250)";
const NEON_PINK = "oklch(0.65 0.20 335)";
const MAGENTA = "oklch(0.60 0.23 305)";
const ORANGE = "oklch(0.70 0.18 48)";

interface PhishingIndicator {
  name: string;
  detected: boolean;
}
interface SafeBrowsingResult {
  phishingDetected: boolean;
  threatTypes: string[];
}
interface VirusTotalPhishing {
  detected: boolean;
  engineCount: number;
  totalEngines: number;
}
interface PhishingResult {
  url: string;
  verdict: "Safe" | "Phishing" | "Suspicious";
  confidence: number;
  indicators: PhishingIndicator[];
  safeBrowsing: SafeBrowsingResult;
  virusTotalPhishing: VirusTotalPhishing;
  aiAnalysis: AiAnalysis | null;
  scanTime: string;
}

function PhishingRing({ confidence }: { confidence: number }) {
  const c = Math.max(0, Math.min(100, confidence));
  const r = 70;
  const cx = 90;
  const cy = 90;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference - (c / 100) * circumference;
  const color = c >= 70 ? NEON_PINK : c >= 40 ? ORANGE : NEON_BLUE;

  return (
    <div className="flex flex-col items-center gap-3">
      <svg
        width="180"
        height="180"
        viewBox="0 0 180 180"
        aria-label={`Phishing confidence: ${c}%`}
      >
        <title>Phishing Confidence Meter</title>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="oklch(0.28 0.04 245)"
          strokeWidth="14"
          strokeDasharray={circumference}
          strokeDashoffset={0}
          transform={`rotate(-90 ${cx} ${cy})`}
          strokeLinecap="round"
        />
        {c > 0 && (
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="14"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${cx} ${cy})`}
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 10px ${color})`,
              transition: "stroke-dashoffset 1s ease",
            }}
          />
        )}
        <circle cx={cx} cy={cy} r="50" fill="oklch(0.18 0.04 245 / 0.8)" />
        <text
          x={cx}
          y={cy - 8}
          textAnchor="middle"
          fill={color}
          fontSize="30"
          fontWeight="900"
          fontFamily="Inter, sans-serif"
        >
          {c}%
        </text>
        <text
          x={cx}
          y={cy + 10}
          textAnchor="middle"
          fill="oklch(0.62 0.04 245)"
          fontSize="9"
          fontFamily="Inter, sans-serif"
          letterSpacing="1"
        >
          PHISHING RISK
        </text>
        <text
          x="12"
          y="162"
          fill="oklch(0.62 0.04 245)"
          fontSize="9"
          fontFamily="Inter, sans-serif"
        >
          0%
        </text>
        <text
          x="145"
          y="162"
          fill="oklch(0.62 0.04 245)"
          fontSize="9"
          fontFamily="Inter, sans-serif"
        >
          100%
        </text>
      </svg>
    </div>
  );
}

function VerdictDisplay({ verdict }: { verdict: PhishingResult["verdict"] }) {
  if (verdict === "Safe")
    return (
      <div className="flex flex-col items-center gap-3">
        <div
          className="h-20 w-20 rounded-full flex items-center justify-center"
          style={{
            background: `${NEON_BLUE.replace(")", " / 0.12)")}`,
            border: `2px solid ${NEON_BLUE.replace(")", " / 0.5)")}`,
            boxShadow: `0 0 30px ${NEON_BLUE.replace(")", " / 0.2)")}`,
          }}
        >
          <ShieldCheck className="h-10 w-10" style={{ color: NEON_BLUE }} />
        </div>
        <div
          className="flex items-center gap-2 px-6 py-2.5 rounded-full"
          style={{
            background: `${NEON_BLUE.replace(")", " / 0.12)")}`,
            border: `1px solid ${NEON_BLUE.replace(")", " / 0.4)")}`,
          }}
        >
          <CheckCircle className="h-5 w-5" style={{ color: NEON_BLUE }} />
          <span
            className="font-black text-xl tracking-widest"
            style={{ color: NEON_BLUE }}
          >
            SAFE
          </span>
        </div>
        <p className="text-xs text-muted-foreground text-center max-w-[160px]">
          No phishing patterns detected
        </p>
      </div>
    );

  if (verdict === "Suspicious")
    return (
      <div className="flex flex-col items-center gap-3">
        <div
          className="h-20 w-20 rounded-full flex items-center justify-center"
          style={{
            background: `${ORANGE.replace(")", " / 0.12)")}`,
            border: `2px solid ${ORANGE.replace(")", " / 0.5)")}`,
            boxShadow: `0 0 30px ${ORANGE.replace(")", " / 0.2)")}`,
          }}
        >
          <ShieldAlert className="h-10 w-10" style={{ color: ORANGE }} />
        </div>
        <div
          className="flex items-center gap-2 px-6 py-2.5 rounded-full"
          style={{
            background: `${ORANGE.replace(")", " / 0.12)")}`,
            border: `1px solid ${ORANGE.replace(")", " / 0.4)")}`,
          }}
        >
          <AlertTriangle className="h-5 w-5" style={{ color: ORANGE }} />
          <span
            className="font-black text-xl tracking-widest"
            style={{ color: ORANGE }}
          >
            SUSPICIOUS
          </span>
        </div>
        <p className="text-xs text-muted-foreground text-center max-w-[160px]">
          Potential phishing indicators found
        </p>
      </div>
    );

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="h-20 w-20 rounded-full flex items-center justify-center"
        style={{
          background: `${NEON_PINK.replace(")", " / 0.12)")}`,
          border: `2px solid ${NEON_PINK.replace(")", " / 0.5)")}`,
          boxShadow: `0 0 30px ${NEON_PINK.replace(")", " / 0.3)")}`,
        }}
      >
        <FishIcon className="h-10 w-10" style={{ color: NEON_PINK }} />
      </div>
      <div
        className="flex items-center gap-2 px-6 py-2.5 rounded-full"
        style={{
          background: `${NEON_PINK.replace(")", " / 0.12)")}`,
          border: `1px solid ${NEON_PINK.replace(")", " / 0.4)")}`,
        }}
      >
        <XCircle className="h-5 w-5" style={{ color: NEON_PINK }} />
        <span
          className="font-black text-xl tracking-widest glitch-text"
          style={{ color: NEON_PINK }}
          data-text="PHISHING"
        >
          PHISHING
        </span>
      </div>
      <p className="text-xs text-muted-foreground text-center max-w-[160px]">
        Active phishing attack detected
      </p>
    </div>
  );
}

const INDICATOR_ICONS: Record<string, React.ReactNode> = {
  HTTPS: <Lock className="h-4 w-4" />,
  "HTTP (No SSL)": <LockOpen className="h-4 w-4" />,
  "Suspicious TLD": <AlertTriangle className="h-4 w-4" />,
  "IP Address URL": <Eye className="h-4 w-4" />,
  "URL Obfuscation": <EyeOff className="h-4 w-4" />,
  "Lookalike Domain": <FishIcon className="h-4 w-4" />,
};

function IndicatorRow({ name, detected }: PhishingIndicator) {
  const icon = INDICATOR_ICONS[name] ?? <Shield className="h-4 w-4" />;
  const isRedFlag = detected && name !== "HTTPS";
  return (
    <div
      className="flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200"
      style={{
        background: isRedFlag
          ? `${NEON_PINK.replace(")", " / 0.06)")}`
          : "oklch(0.65 0.22 250 / 0.03)",
        border: isRedFlag
          ? `1px solid ${NEON_PINK.replace(")", " / 0.25)")}`
          : "1px solid oklch(0.28 0.04 245)",
      }}
    >
      <div className="flex items-center gap-3">
        <span style={{ color: isRedFlag ? NEON_PINK : "oklch(0.62 0.04 245)" }}>
          {icon}
        </span>
        <span className="text-sm font-medium text-foreground">{name}</span>
      </div>
      <span
        className="text-xs font-bold px-2.5 py-1 rounded-full"
        style={
          !isRedFlag
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
        {isRedFlag ? "DETECTED" : "NOT DETECTED"}
      </span>
    </div>
  );
}

function parsePhishingResult(raw: string, url: string): PhishingResult | null {
  try {
    const data = JSON.parse(raw) as Record<string, unknown>;
    const verdict = (data.verdict as string) || "Safe";
    const confidence =
      typeof data.confidence === "number" ? data.confidence : 0;
    const rawIndicators = Array.isArray(data.indicators)
      ? (data.indicators as Array<Record<string, unknown>>)
      : [];
    const indicators: PhishingIndicator[] = rawIndicators.map((ind) => ({
      name: String(ind.name ?? "Unknown"),
      detected: Boolean(ind.detected),
    }));
    const sb = (data.safeBrowsing as Record<string, unknown>) ?? {};
    const safeBrowsing: SafeBrowsingResult = {
      phishingDetected: Boolean(sb.phishingDetected),
      threatTypes: Array.isArray(sb.threatTypes)
        ? (sb.threatTypes as string[])
        : [],
    };
    const vt = (data.virusTotalPhishing as Record<string, unknown>) ?? {};
    const virusTotalPhishing: VirusTotalPhishing = {
      detected: Boolean(vt.detected),
      engineCount: typeof vt.engineCount === "number" ? vt.engineCount : 0,
      totalEngines: typeof vt.totalEngines === "number" ? vt.totalEngines : 0,
    };
    let aiAnalysis: AiAnalysis | null = null;
    if (data.aiAnalysis) {
      const ai = data.aiAnalysis as Record<string, unknown>;
      if (ai.available)
        aiAnalysis = {
          available: true,
          verdict: String(ai.verdict ?? ""),
          riskLevel: String(ai.riskLevel ?? "Low"),
          confidence: typeof ai.confidence === "number" ? ai.confidence : 0,
          explanation: String(ai.explanation ?? ""),
        };
    }
    return {
      url: (data.url as string) || url,
      verdict: verdict as PhishingResult["verdict"],
      confidence,
      indicators,
      safeBrowsing,
      virusTotalPhishing,
      aiAnalysis,
      scanTime: (data.scanTime as string) || new Date().toISOString(),
    };
  } catch (err) {
    console.error("[CyberScan] Failed to parse phishing result:", err);
    return null;
  }
}

export default function PhishingDetectorPage() {
  const [urlInput, setUrlInput] = useState("");
  const [result, setResult] = useState<PhishingResult | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [latestReportId, setLatestReportId] = useState<string | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const { mutateAsync: detectPhishing, isPending } = usePhishingDetect();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleScan = async () => {
    if (!urlInput.trim()) return;
    setResult(null);
    setScanError(null);
    setLatestReportId(null);
    try {
      const raw = await detectPhishing(urlInput.trim());
      const parsed = parsePhishingResult(raw, urlInput.trim());
      if (parsed) {
        setResult(parsed);
        if (user) {
          const saved = saveReport(user.email, {
            target: parsed.url,
            scanType: "phishing",
            timestamp: Date.now(),
            verdict: parsed.verdict,
            riskScore: parsed.confidence,
            services: [],
            threatTypes: parsed.safeBrowsing.threatTypes,
            aiAnalysis: parsed.aiAnalysis ?? undefined,
          });
          setLatestReportId(saved.id);
        }
      } else {
        setScanError(
          "Scan completed but results could not be displayed. Please try again.",
        );
      }
    } catch {
      setScanError("Phishing scan failed. Please check the URL and try again.");
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
      scanType: "phishing",
      timestamp: Date.now(),
      verdict: result.verdict,
      riskScore: result.confidence,
      downloadCount: 1,
      services: [],
      threatTypes: result.safeBrowsing.threatTypes,
      aiAnalysis: result.aiAnalysis ?? undefined,
    });
  };

  const detectedCount =
    result?.indicators.filter((i) => i.detected && i.name !== "HTTPS").length ??
    0;

  return (
    <main className="min-h-screen py-10 px-4 fade-in">
      <Dialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
        <DialogContent data-ocid="phishing.dialog" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Login Required</DialogTitle>
            <DialogDescription>
              You need to be logged in to download phishing reports.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:flex-row flex-col-reverse">
            <Button
              variant="ghost"
              onClick={() => setShowLoginPrompt(false)}
              data-ocid="phishing.cancel_button"
            >
              Cancel
            </Button>
            <Button
              data-ocid="phishing.confirm_button"
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
            🎣 CYBERSCAN — Phishing Detection Report
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
        <div className="mb-10 fade-in-up flex items-start justify-between gap-4">
          <div>
            <p
              className="text-xs font-semibold tracking-widest uppercase mb-2"
              style={{ color: MAGENTA }}
            >
              Anti-Phishing Engine
            </p>
            <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
              <FishIcon
                className="h-8 w-8"
                style={{
                  color: MAGENTA,
                  filter: `drop-shadow(0 0 8px ${MAGENTA.replace(")", " / 0.6)")})`,
                }}
              />
              Phishing Detector
            </h1>
            <p className="text-muted-foreground">
              Deep-scan URLs for phishing patterns, deceptive domains, and
              social engineering tactics using AI-powered analysis.
            </p>
          </div>
          {result && (
            <Button
              onClick={handleDownload}
              data-ocid="phishing.download_button"
              variant="outline"
              className="shrink-0 print-hide"
              style={{
                borderColor: `${MAGENTA.replace(")", " / 0.35)")}`,
                color: MAGENTA,
              }}
            >
              <Download className="h-4 w-4 mr-2" /> Download Report
            </Button>
          )}
        </div>

        {/* Info strip */}
        <div
          className="glass rounded-xl px-5 py-3 mb-6 flex flex-wrap gap-4 items-center print-hide fade-in-up border-glow-accent"
          style={{ animationDelay: "0.05s" }}
        >
          {[
            {
              icon: <FishIcon className="h-3.5 w-3.5" />,
              label: "Phishing Pattern Analysis",
            },
            {
              icon: <Shield className="h-3.5 w-3.5" />,
              label: "Google Safe Browsing",
            },
            {
              icon: <Eye className="h-3.5 w-3.5" />,
              label: "VirusTotal Phishing Engines",
            },
            {
              icon: <Lock className="h-3.5 w-3.5" />,
              label: "SSL / HTTPS Verification",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-1.5 text-xs text-muted-foreground"
            >
              <span style={{ color: MAGENTA }}>{item.icon}</span>
              {item.label}
            </div>
          ))}
        </div>

        {/* Input */}
        <div
          className="glass rounded-2xl p-6 mb-8 fade-in-up print-hide border-glow-accent"
          style={{ animationDelay: "0.1s" }}
        >
          <label
            htmlFor="phishing-url-input"
            className="text-sm font-semibold text-muted-foreground mb-3 block uppercase tracking-wider"
          >
            Enter URL to analyze for phishing
          </label>
          <div className="flex gap-3">
            <Input
              id="phishing-url-input"
              data-ocid="phishing.input"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleScan()}
              placeholder="https://suspicious-site.com"
              className="flex-1 h-12 border-border text-foreground placeholder:text-muted-foreground/50 font-mono"
              style={{ background: "oklch(0.12 0.04 255 / 0.5)" }}
            />
            <Button
              data-ocid="phishing.submit_button"
              onClick={handleScan}
              disabled={isPending || !urlInput.trim()}
              className="h-12 px-7 font-bold transition-all"
              style={{
                background: MAGENTA,
                color: "oklch(0.08 0.02 250)",
                boxShadow: `0 0 16px ${MAGENTA.replace(")", " / 0.4)")}`,
              }}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...
                </>
              ) : (
                <>
                  <FishIcon className="mr-2 h-4 w-4" /> Detect Phishing
                </>
              )}
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground/60">
            Analyzes URL structure, domain reputation, SSL status, and AI-based
            phishing patterns
          </p>
        </div>

        {isPending && (
          <div
            data-ocid="phishing.loading_state"
            className="glass rounded-2xl p-12 mb-8 flex flex-col items-center gap-6 fade-in"
          >
            <div className="pulse-ring">
              <div
                className="h-16 w-16 rounded-full flex items-center justify-center"
                style={{
                  background: `${NEON_PINK.replace(")", " / 0.1)")}`,
                  border: `2px solid ${NEON_PINK.replace(")", " / 0.5)")}`,
                }}
              >
                <FishIcon className="h-8 w-8" style={{ color: NEON_PINK }} />
              </div>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-foreground mb-1">
                Analyzing for phishing patterns…
              </p>
              <p className="text-sm text-muted-foreground">
                Running deep inspection across multiple threat engines
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                "Pattern Analysis",
                "Domain Reputation",
                "SSL Check",
                "Safe Browsing",
                "AI Detection",
              ].map((s) => (
                <span
                  key={s}
                  className="text-xs px-3 py-1 rounded-full glass border text-muted-foreground"
                  style={{ borderColor: `${MAGENTA.replace(")", " / 0.2)")}` }}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {scanError && !isPending && (
          <div
            data-ocid="phishing.error_state"
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

        {result && !isPending && (
          <div className="space-y-6 fade-in" data-ocid="phishing.success_state">
            {/* Hero verdict */}
            <div
              className="glass rounded-2xl p-6"
              style={{
                border:
                  result.verdict === "Phishing"
                    ? `1px solid ${NEON_PINK.replace(")", " / 0.4)")}`
                    : result.verdict === "Suspicious"
                      ? `1px solid ${ORANGE.replace(")", " / 0.4)")}`
                      : `1px solid ${NEON_BLUE.replace(")", " / 0.3)")}`,
                background:
                  result.verdict === "Phishing"
                    ? `${NEON_PINK.replace(")", " / 0.05)")}`
                    : result.verdict === "Suspicious"
                      ? `${ORANGE.replace(")", " / 0.04)")}`
                      : `${NEON_BLUE.replace(")", " / 0.03)")}`,
              }}
            >
              <div className="grid md:grid-cols-3 gap-6 items-center">
                <div className="flex flex-col items-center justify-center">
                  <VerdictDisplay verdict={result.verdict} />
                </div>
                <div className="flex flex-col items-center justify-center">
                  <PhishingRing confidence={result.confidence} />
                </div>
                <div className="space-y-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Detection Summary
                  </p>
                  <div className="space-y-3">
                    <StatRow
                      label="Threat Indicators"
                      value={`${detectedCount} detected`}
                      danger={detectedCount > 0}
                    />
                    <StatRow
                      label="Google Safe Browsing"
                      value={
                        result.safeBrowsing.phishingDetected
                          ? "Phishing flagged"
                          : "Clear"
                      }
                      danger={result.safeBrowsing.phishingDetected}
                    />
                    <StatRow
                      label="VirusTotal Engines"
                      value={
                        result.virusTotalPhishing.totalEngines > 0
                          ? `${result.virusTotalPhishing.engineCount}/${result.virusTotalPhishing.totalEngines} flagged`
                          : "No data"
                      }
                      danger={result.virusTotalPhishing.detected}
                    />
                    <StatRow
                      label="Confidence Level"
                      value={`${result.confidence}%`}
                      danger={result.confidence >= 70}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Scan target */}
            <div className="glass rounded-2xl p-5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Analyzed URL
              </p>
              <p
                className="font-mono text-sm text-foreground break-all p-3 rounded-lg border border-border"
                style={{ background: "oklch(0.12 0.04 255 / 0.5)" }}
              >
                {result.url}
              </p>
            </div>

            {result.indicators.length > 0 && (
              <div className="glass rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-border flex items-center gap-2.5">
                  <ShieldAlert className="h-4 w-4" style={{ color: MAGENTA }} />
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Phishing Indicators
                  </p>
                  <span
                    className="ml-auto text-xs px-2.5 py-0.5 rounded-full font-bold"
                    style={{
                      background:
                        detectedCount > 0
                          ? `${NEON_PINK.replace(")", " / 0.12)")}`
                          : `${NEON_BLUE.replace(")", " / 0.12)")}`,
                      color: detectedCount > 0 ? NEON_PINK : NEON_BLUE,
                      border: `1px solid ${(detectedCount > 0 ? NEON_PINK : NEON_BLUE).replace(")", " / 0.3)")}`,
                    }}
                  >
                    {detectedCount} / {result.indicators.length} triggered
                  </span>
                </div>
                <div
                  className="p-4 space-y-2"
                  data-ocid="phishing.indicators_list"
                >
                  {result.indicators.map((ind) => (
                    <IndicatorRow key={ind.name} {...ind} />
                  ))}
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              <div className="glass rounded-2xl p-5">
                <div className="flex items-center gap-2.5 mb-4">
                  <Shield className="h-4 w-4" style={{ color: NEON_BLUE }} />
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Google Safe Browsing
                  </p>
                </div>
                <div
                  className="flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={
                    result.safeBrowsing.phishingDetected
                      ? {
                          background: `${NEON_PINK.replace(")", " / 0.08)")}`,
                          border: `1px solid ${NEON_PINK.replace(")", " / 0.3)")}`,
                        }
                      : {
                          background: `${NEON_BLUE.replace(")", " / 0.06)")}`,
                          border: `1px solid ${NEON_BLUE.replace(")", " / 0.25)")}`,
                        }
                  }
                >
                  {result.safeBrowsing.phishingDetected ? (
                    <XCircle
                      className="h-5 w-5 shrink-0"
                      style={{ color: NEON_PINK }}
                    />
                  ) : (
                    <CheckCircle
                      className="h-5 w-5 shrink-0"
                      style={{ color: NEON_BLUE }}
                    />
                  )}
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {result.safeBrowsing.phishingDetected
                        ? "Phishing Detected"
                        : "No Threats Found"}
                    </p>
                    {result.safeBrowsing.threatTypes.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {result.safeBrowsing.threatTypes.join(", ")}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="glass rounded-2xl p-5">
                <div className="flex items-center gap-2.5 mb-4">
                  <Eye className="h-4 w-4" style={{ color: MAGENTA }} />
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    VirusTotal Phishing Engines
                  </p>
                </div>
                <div
                  className="flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={
                    result.virusTotalPhishing.detected
                      ? {
                          background: `${NEON_PINK.replace(")", " / 0.08)")}`,
                          border: `1px solid ${NEON_PINK.replace(")", " / 0.3)")}`,
                        }
                      : {
                          background: `${NEON_BLUE.replace(")", " / 0.06)")}`,
                          border: `1px solid ${NEON_BLUE.replace(")", " / 0.25)")}`,
                        }
                  }
                >
                  {result.virusTotalPhishing.detected ? (
                    <XCircle
                      className="h-5 w-5 shrink-0"
                      style={{ color: NEON_PINK }}
                    />
                  ) : (
                    <CheckCircle
                      className="h-5 w-5 shrink-0"
                      style={{ color: NEON_BLUE }}
                    />
                  )}
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {result.virusTotalPhishing.totalEngines > 0
                        ? `${result.virusTotalPhishing.engineCount} of ${result.virusTotalPhishing.totalEngines} engines flagged`
                        : "Engine data unavailable"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {result.virusTotalPhishing.detected
                        ? "Phishing confirmed by security vendors"
                        : "No phishing signals from vendors"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <AiAnalysisPanel ai={result.aiAnalysis} isLoading={false} />
          </div>
        )}

        {!result && !isPending && !scanError && (
          <div
            data-ocid="phishing.empty_state"
            className="glass rounded-2xl p-16 flex flex-col items-center text-center fade-in-up"
            style={{ animationDelay: "0.2s" }}
          >
            <div
              className="h-20 w-20 rounded-full flex items-center justify-center mb-5"
              style={{
                background: `${MAGENTA.replace(")", " / 0.06)")}`,
                border: `1px solid ${MAGENTA.replace(")", " / 0.2)")}`,
              }}
            >
              <FishIcon className="h-9 w-9 text-muted-foreground/40" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Phishing Detector Ready
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Enter a URL to analyze it for phishing patterns, deceptive
              redirects, impersonation attacks, and social engineering
              indicators.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3 w-full max-w-md">
              {[
                {
                  icon: <Lock className="h-4 w-4" />,
                  text: "SSL/TLS Verification",
                },
                {
                  icon: <Eye className="h-4 w-4" />,
                  text: "Domain Impersonation",
                },
                {
                  icon: <AlertTriangle className="h-4 w-4" />,
                  text: "Suspicious Patterns",
                },
                {
                  icon: <FishIcon className="h-4 w-4" />,
                  text: "Social Engineering",
                },
              ].map((item) => (
                <div
                  key={item.text}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-muted-foreground"
                  style={{
                    background: "oklch(0.28 0.04 245 / 0.4)",
                    border: "1px solid oklch(0.35 0.04 245)",
                  }}
                >
                  <span style={{ color: MAGENTA }}>{item.icon}</span>
                  {item.text}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function StatRow({
  label,
  value,
  danger,
}: { label: string; value: string; danger: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className="text-xs font-bold"
        style={{ color: danger ? NEON_PINK : NEON_BLUE }}
      >
        {value}
      </span>
    </div>
  );
}
