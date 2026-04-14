import AiAnalysisPanel, {
  type AiAnalysis,
  parseAiAnalysis,
} from "@/components/AiAnalysisPanel";
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
import { useScanIp } from "@/hooks/useQueries";
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
  Globe,
  Laptop,
  Loader2,
  MapPin,
  Monitor,
  Server,
  Smartphone,
  Tablet,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";

// Cyberpunk palette
const NEON_BLUE = "oklch(0.65 0.22 250)";
const NEON_PINK = "oklch(0.65 0.20 335)";
const MAGENTA = "oklch(0.60 0.23 305)";
const ORANGE = "oklch(0.70 0.18 48)";

interface IpService {
  name: string;
  status: string;
  details: string;
  safe: boolean;
}
interface IpInfo {
  country: string;
  city: string;
  region: string;
  isp: string;
  hostname: string;
  abuseScore: number;
  totalReports: number;
  lastReported: string;
}
interface IpScanResult {
  ip: string;
  riskScore: number;
  verdict: "SAFE" | "SUSPICIOUS" | "DANGEROUS";
  threatCategories: string[];
  services: IpService[];
  ipInfo: IpInfo;
  aiAnalysis?: AiAnalysis | null;
}

type DeviceType = "Mobile" | "Tablet" | "Laptop" | "Desktop";
type OsType =
  | "Windows"
  | "macOS"
  | "Linux"
  | "iOS"
  | "Android"
  | "ChromeOS"
  | "Other";

function detectDevice(): { deviceType: DeviceType; os: OsType } {
  const ua = navigator.userAgent;
  let os: OsType = "Other";
  if (/CrOS/.test(ua)) os = "ChromeOS";
  else if (/Android/.test(ua)) os = "Android";
  else if (/iPhone|iPad|iPod/.test(ua)) os = "iOS";
  else if (/Windows/.test(ua)) os = "Windows";
  else if (/Macintosh|Mac OS X/.test(ua)) os = "macOS";
  else if (/Linux/.test(ua)) os = "Linux";

  let deviceType: DeviceType = "Desktop";
  const isTouchDevice =
    "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const isMobileUA =
    /iPhone|Android.*Mobile|Mobile.*Android|BlackBerry|IEMobile|Opera Mini/.test(
      ua,
    );
  const isTabletUA = /iPad|Android(?!.*Mobile)|Tablet/.test(ua);

  if (isMobileUA) deviceType = "Mobile";
  else if (isTabletUA) deviceType = "Tablet";
  else if (
    isTouchDevice &&
    (os === "Windows" || os === "macOS") &&
    window.screen.width >= 1024
  )
    deviceType = "Laptop";
  else if (os === "macOS" || os === "Windows" || os === "Linux")
    deviceType = "Desktop";

  return { deviceType, os };
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

function extractIpWrapper(raw: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (parsed && typeof parsed === "object") return parsed;
  } catch {
    console.warn("[CyberScan] IP outer JSON parse failed...");
  }

  const result: Record<string, unknown> = {};
  let extracted = false;

  const abuseMatch = raw.match(
    /"abuseResponse"\s*:\s*(\{[\s\S]*?\}(?=\s*,\s*"(?:geoLocation|aiAnalysis)"))/,
  );
  if (abuseMatch) {
    try {
      result.abuseResponse = JSON.parse(abuseMatch[1]);
      extracted = true;
    } catch {
      result.abuseResponse = abuseMatch[1];
      extracted = true;
    }
  }
  const geoMatch = raw.match(
    /"geoLocation"\s*:\s*(\{[\s\S]*?\}(?=\s*,\s*"aiAnalysis"|\s*\}))/,
  );
  if (geoMatch) {
    try {
      result.geoLocation = JSON.parse(geoMatch[1]);
    } catch {
      /* non-critical */
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
  return null;
}

function parseIpScanResult(raw: string, ip: string): IpScanResult | null {
  const wrapper = extractIpWrapper(raw);
  if (!wrapper) return null;

  const abuseOuter = safeParseJson(wrapper.abuseResponse, "abuseResponse");
  const geoLocation = safeParseJson(wrapper.geoLocation, "geoLocation");

  let aiAnalysis: AiAnalysis | null = null;
  try {
    aiAnalysis = parseAiAnalysis(wrapper);
  } catch (err) {
    console.warn("[CyberScan] AI analysis parse failed:", err);
  }

  const abuseData = (abuseOuter.data as Record<string, unknown>) ?? abuseOuter;
  const hasAbuseData = Object.keys(abuseData).length > 0;
  const hasGeoData = Object.keys(geoLocation).length > 0;

  if (!hasAbuseData && !hasGeoData && !aiAnalysis?.available) return null;

  const abuseScore = Number(
    abuseData.abuseConfidenceScore ?? abuseData.abuseScore ?? 0,
  );
  const totalReports = Number(abuseData.totalReports ?? 0);
  const lastReportedAt = String(abuseData.lastReportedAt ?? "");

  const nonEmpty = (v: unknown): string | undefined => {
    const s = v != null ? String(v).trim() : "";
    return s.length > 0 ? s : undefined;
  };

  const displayCountry =
    nonEmpty(geoLocation.country) ??
    nonEmpty(abuseData.countryCode) ??
    "Unknown";
  const displayCity =
    nonEmpty(geoLocation.city) ?? nonEmpty(abuseData.city) ?? "Unknown";
  const displayRegion =
    nonEmpty(geoLocation.regionName) ??
    nonEmpty(abuseData.region) ??
    nonEmpty(abuseData.usageType) ??
    "Unknown";
  const rawIsp =
    nonEmpty(geoLocation.isp) ?? nonEmpty(abuseData.isp) ?? undefined;
  const rawOrg = nonEmpty(geoLocation.org) ?? undefined;
  const displayIsp: string = (() => {
    if (rawIsp && rawOrg && rawIsp !== rawOrg) return `${rawIsp} / ${rawOrg}`;
    return rawIsp ?? rawOrg ?? "Unknown";
  })();

  const verdict: IpScanResult["verdict"] =
    abuseScore >= 70 ? "DANGEROUS" : abuseScore >= 25 ? "SUSPICIOUS" : "SAFE";
  const categories = (abuseData.categories as number[]) ?? [];
  const categoryNames: Record<number, string> = {
    1: "DNS Compromise",
    2: "DNS Poisoning",
    3: "Fraud Orders",
    4: "DDoS Attack",
    5: "FTP Brute Force",
    6: "Ping of Death",
    7: "Phishing",
    8: "Fraud VoIP",
    9: "Open Proxy",
    10: "Web Spam",
    11: "Email Spam",
    12: "Blog Spam",
    13: "VPN IP",
    14: "Port Scan",
    15: "Hacking",
    16: "SQL Injection",
    17: "Spoofing",
    18: "Brute Force",
    19: "Bad Web Bot",
    20: "Exploited Host",
    21: "Web App Attack",
    22: "SSH",
    23: "IoT Targeted",
  };
  const threatCategories = categories.map(
    (c) => categoryNames[c] ?? `Category ${c}`,
  );

  const geoResolved =
    displayCountry !== "Unknown" ||
    displayCity !== "Unknown" ||
    displayRegion !== "Unknown";
  const geoDetails =
    [displayCity, displayRegion, displayCountry]
      .filter((v) => v && v !== "Unknown")
      .join(", ") || "Location unavailable";

  const services: IpService[] = [
    {
      name: "AbuseIPDB",
      status: !hasAbuseData
        ? "Unavailable"
        : abuseScore > 0
          ? "Flagged"
          : "Clean",
      details: !hasAbuseData
        ? "Reputation data unavailable — check API key"
        : totalReports > 0
          ? `${totalReports} abuse report${totalReports > 1 ? "s" : ""} — confidence ${abuseScore}%`
          : "0 abuse reports — no malicious activity recorded",
      safe: !hasAbuseData || abuseScore === 0,
    },
    {
      name: "Geolocation",
      status: geoResolved ? "Resolved" : "Unknown",
      details: geoDetails,
      safe: true,
    },
    {
      name: "ISP",
      status: displayIsp !== "Unknown" ? "Identified" : "Unknown",
      details: displayIsp !== "Unknown" ? displayIsp : "ISP unknown",
      safe: abuseScore < 25,
    },
  ];

  return {
    ip,
    riskScore: abuseScore,
    verdict,
    threatCategories,
    services,
    ipInfo: {
      country: displayCountry,
      city: displayCity,
      region: displayRegion,
      isp: displayIsp,
      hostname: String(
        (abuseData.hostnames as string[] | undefined)?.[0] ??
          abuseData.domain ??
          "",
      ),
      abuseScore,
      totalReports,
      lastReported: lastReportedAt || "Never",
    },
    aiAnalysis,
  };
}

function RiskGauge({ score }: { score: number }) {
  const c = Math.max(0, Math.min(100, score));
  const angle = 180 - (c / 100) * 180;
  const rad = (angle * Math.PI) / 180;
  const r = 80;
  const cx = 110;
  const cy = 100;
  const x = cx + r * Math.cos(rad);
  const y = cy - r * Math.sin(rad);
  const color = c >= 70 ? NEON_PINK : c >= 40 ? ORANGE : NEON_BLUE;
  const bgArcPath = "M 30 100 A 80 80 0 0 1 190 100";
  const scoreArcPath =
    c === 0
      ? ""
      : `M 30 100 A 80 80 0 ${c > 50 ? 1 : 0} 1 ${x.toFixed(2)} ${y.toFixed(2)}`;
  return (
    <div className="flex flex-col items-center">
      <svg
        width="220"
        height="120"
        viewBox="0 0 220 120"
        aria-label={`Risk score: ${c}`}
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
          {c}
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

function VerdictBadge({ verdict }: { verdict: IpScanResult["verdict"] }) {
  if (verdict === "SAFE")
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
  if (verdict === "SUSPICIOUS")
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

function DeviceInfoCard() {
  const { deviceType, os } = useMemo(() => detectDevice(), []);
  const DeviceIcon =
    deviceType === "Mobile"
      ? Smartphone
      : deviceType === "Tablet"
        ? Tablet
        : deviceType === "Laptop"
          ? Laptop
          : Monitor;

  return (
    <div className="glass rounded-2xl p-6">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-5">
        Your Device Info
      </p>
      <div className="grid sm:grid-cols-2 gap-4">
        <div
          className="rounded-xl p-4 flex items-start gap-4"
          style={{
            background: `${MAGENTA.replace(")", " / 0.07)")}`,
            border: `1px solid ${MAGENTA.replace(")", " / 0.2)")}`,
          }}
        >
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: `${MAGENTA.replace(")", " / 0.12)")}`,
              border: `1px solid ${MAGENTA.replace(")", " / 0.25)")}`,
            }}
          >
            <DeviceIcon className="h-5 w-5" style={{ color: MAGENTA }} />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Device Type
            </p>
            <p className="text-base font-bold text-foreground">{deviceType}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {deviceType === "Mobile" && "Handheld smartphone"}
              {deviceType === "Tablet" && "Tablet or large-screen touch device"}
              {deviceType === "Laptop" && "Touch-enabled laptop"}
              {deviceType === "Desktop" && "Desktop workstation"}
            </p>
          </div>
        </div>
        <div
          className="rounded-xl p-4 flex items-start gap-4"
          style={{
            background: `${NEON_BLUE.replace(")", " / 0.05)")}`,
            border: `1px solid ${NEON_BLUE.replace(")", " / 0.15)")}`,
          }}
        >
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: `${NEON_BLUE.replace(")", " / 0.1)")}`,
              border: `1px solid ${NEON_BLUE.replace(")", " / 0.25)")}`,
            }}
          >
            <span className="text-base font-black" style={{ color: NEON_BLUE }}>
              {os === "Windows"
                ? "⊞"
                : os === "macOS"
                  ? ""
                  : os === "Linux"
                    ? "🐧"
                    : os === "iOS"
                      ? ""
                      : os === "Android"
                        ? "🤖"
                        : os === "ChromeOS"
                          ? "⬡"
                          : "?"}
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Operating System
            </p>
            <p className="text-base font-bold text-foreground">{os}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Detected via User-Agent
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function IpScannerPage() {
  const [ipInput, setIpInput] = useState("");
  const [result, setResult] = useState<IpScanResult | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [latestReportId, setLatestReportId] = useState<string | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const { mutateAsync: scanIp, isPending } = useScanIp();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleScan = async () => {
    if (!ipInput.trim()) return;
    setResult(null);
    setScanError(null);
    setLatestReportId(null);
    try {
      const raw = await scanIp(ipInput.trim());
      const parsed = parseIpScanResult(raw, ipInput.trim());
      if (parsed) {
        setResult(parsed);
        if (user) {
          const saved = saveReport(user.email, {
            target: parsed.ip,
            scanType: "ip",
            timestamp: Date.now(),
            verdict: parsed.verdict,
            riskScore: parsed.riskScore,
            services: parsed.services,
            threatTypes: parsed.threatCategories,
            ipInfo: parsed.ipInfo,
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
      setScanError("Scan failed. Please check the IP address and try again.");
    }
  };

  const handleDownload = () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    if (result && latestReportId)
      incrementDownloadCount(user.email, latestReportId);
    if (result)
      printReport({
        id: latestReportId ?? Date.now().toString(),
        target: result.ip,
        scanType: "ip",
        timestamp: Date.now(),
        verdict: result.verdict,
        riskScore: result.riskScore,
        downloadCount: 1,
        services: result.services,
        threatTypes: result.threatCategories,
        ipInfo: result.ipInfo,
        aiAnalysis: result.aiAnalysis ?? undefined,
      });
  };

  return (
    <main className="min-h-screen py-10 px-4 fade-in">
      <Dialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
        <DialogContent data-ocid="ip_scanner.dialog" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Login Required</DialogTitle>
            <DialogDescription>
              You need to be logged in to download scan reports.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:flex-row flex-col-reverse">
            <Button
              data-ocid="ip_scanner.cancel_button"
              variant="ghost"
              onClick={() => setShowLoginPrompt(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="ip_scanner.confirm_button"
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

      <div className="max-w-5xl mx-auto">
        <div className="mb-10 fade-in-up flex items-start justify-between gap-4">
          <div>
            <p
              className="text-xs font-semibold tracking-widest uppercase mb-2"
              style={{ color: NEON_BLUE }}
            >
              IP Reputation
            </p>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              IP Scanner
            </h1>
            <p className="text-muted-foreground">
              Analyze any IPv4 or IPv6 address against abuse databases,
              geolocation, and AI analysis.
            </p>
          </div>
          {result && (
            <Button
              onClick={handleDownload}
              data-ocid="ip_scanner.download_button"
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
            htmlFor="ip-input"
            className="text-sm font-semibold text-muted-foreground mb-3 block uppercase tracking-wider"
          >
            Enter IP address to scan
          </label>
          <div className="flex gap-3">
            <Input
              id="ip-input"
              data-ocid="ip_scanner.input"
              value={ipInput}
              onChange={(e) => setIpInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleScan()}
              placeholder="e.g. 8.8.8.8 or 2001:4860:4860::8888"
              className="flex-1 h-12 border-border text-foreground placeholder:text-muted-foreground/50 font-mono"
              style={{ background: "oklch(0.12 0.04 255 / 0.5)" }}
            />
            <Button
              data-ocid="ip_scanner.submit_button"
              onClick={handleScan}
              disabled={isPending || !ipInput.trim()}
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
                  <Server className="mr-2 h-4 w-4" /> Scan Now
                </>
              )}
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground/60">
            Supports IPv4 (e.g. 192.168.1.1) and IPv6 addresses
          </p>
        </div>

        {isPending && (
          <div
            data-ocid="ip_scanner.loading_state"
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
                <Server className="h-8 w-8" style={{ color: NEON_BLUE }} />
              </div>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-foreground mb-1">
                Analyzing IP address...
              </p>
              <p className="text-sm text-muted-foreground">
                Querying abuse databases, geolocation + AI analysis
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {["AbuseIPDB", "Geolocation", "Reverse DNS", "AI Analysis"].map(
                (s) => (
                  <span
                    key={s}
                    className="text-xs px-3 py-1 rounded-full glass border text-muted-foreground"
                    style={{
                      borderColor: `${NEON_BLUE.replace(")", " / 0.2)")}`,
                    }}
                  >
                    {s}
                  </span>
                ),
              )}
            </div>
          </div>
        )}

        {scanError && !isPending && (
          <div
            data-ocid="ip_scanner.error_state"
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
          <div
            className="space-y-6 fade-in"
            data-ocid="ip_scanner.success_state"
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
                  {result.ip}
                </p>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Threat Categories
                </p>
                {result.threatCategories.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No threats detected
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {result.threatCategories.map((t) => (
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

            {/* IP Intelligence */}
            <div className="glass rounded-2xl p-6">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-5">
                IP Intelligence
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div
                  className="rounded-xl p-4"
                  style={{
                    background: `${NEON_BLUE.replace(")", " / 0.05)")}`,
                    border: `1px solid ${NEON_BLUE.replace(")", " / 0.15)")}`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="h-4 w-4" style={{ color: NEON_BLUE }} />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Location
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {result.ipInfo.country}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {result.ipInfo.city}
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-0.5">
                    {result.ipInfo.region}
                  </p>
                </div>
                <div
                  className="rounded-xl p-4"
                  style={{
                    background: `${MAGENTA.replace(")", " / 0.05)")}`,
                    border: `1px solid ${MAGENTA.replace(")", " / 0.15)")}`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Server className="h-4 w-4" style={{ color: MAGENTA }} />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      ISP / Org
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {result.ipInfo.isp}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">
                    {result.ipInfo.hostname || "—"}
                  </p>
                </div>
                <div
                  className="rounded-xl p-4"
                  style={{
                    background: `${NEON_PINK.replace(")", " / 0.05)")}`,
                    border: `1px solid ${NEON_PINK.replace(")", " / 0.2)")}`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle
                      className="h-4 w-4"
                      style={{ color: NEON_PINK }}
                    />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Abuse Score
                    </span>
                  </div>
                  <p
                    className="text-2xl font-black"
                    style={{
                      color:
                        result.ipInfo.abuseScore >= 50 ? NEON_PINK : NEON_BLUE,
                    }}
                  >
                    {result.ipInfo.abuseScore}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {result.ipInfo.totalReports.toLocaleString()} total reports
                  </p>
                </div>
                <div
                  className="rounded-xl p-4"
                  style={{
                    background: `${NEON_BLUE.replace(")", " / 0.05)")}`,
                    border: `1px solid ${NEON_BLUE.replace(")", " / 0.15)")}`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4" style={{ color: NEON_BLUE }} />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Last Reported
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {result.ipInfo.lastReported}
                  </p>
                </div>
              </div>
            </div>

            <DeviceInfoCard />

            {/* Engine Results */}
            <div className="glass rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Engine Results
                </p>
              </div>
              <table className="w-full" data-ocid="ip_scanner.table">
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
                      data-ocid={`ip_scanner.row.${i + 1}`}
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
          </div>
        )}

        {!result && !isPending && !scanError && (
          <div
            data-ocid="ip_scanner.empty_state"
            className="glass rounded-2xl p-16 flex flex-col items-center text-center fade-in-up"
            style={{ animationDelay: "0.2s" }}
          >
            <Server className="h-14 w-14 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Ready to scan
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Enter any IPv4 or IPv6 address to check it against abuse
              databases, geolocation, and AI threat prediction.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
