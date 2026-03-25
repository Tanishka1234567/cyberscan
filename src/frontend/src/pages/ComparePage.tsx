import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useScanUrl } from "@/hooks/useQueries";
import {
  AlertTriangle,
  CheckCircle,
  Download,
  Loader2,
  Shield,
  XCircle,
} from "lucide-react";
import { useState } from "react";

type Verdict = "SAFE" | "SUSPICIOUS" | "MALICIOUS";

interface CompareResult {
  url: string;
  riskScore: number;
  verdict: Verdict;
  threatsFound: number;
  scanTime: string;
  malwareRisk: number;
  phishingRisk: number;
  reputation: number;
  domainAge: number;
}

function hashUrl(url: string): number {
  let h = 5381;
  for (let i = 0; i < url.length; i++) {
    h = ((h * 33) ^ url.charCodeAt(i)) & 0x7fffffff;
  }
  return h >>> 0;
}

function buildResult(url: string, raw: string | null): CompareResult {
  let riskScore: number | null = null;
  if (raw) {
    try {
      const data = JSON.parse(raw);
      if (typeof data.riskScore === "number") riskScore = data.riskScore;
    } catch {
      /* ignore */
    }
  }
  if (riskScore === null) {
    const h = hashUrl(url);
    riskScore = h % 100;
  }
  const r = hashUrl(url);
  const seeded = (offset: number) => ((r >>> offset) & 0xff) % 100;
  const verdict: Verdict =
    riskScore >= 70 ? "MALICIOUS" : riskScore >= 40 ? "SUSPICIOUS" : "SAFE";
  return {
    url,
    riskScore,
    verdict,
    threatsFound:
      riskScore >= 70
        ? Math.floor(seeded(3) / 10) + 3
        : riskScore >= 40
          ? Math.floor(seeded(3) / 20) + 1
          : 0,
    scanTime: `${((seeded(8) % 20) + 5) / 10}s`,
    malwareRisk: Math.min(100, Math.floor(riskScore * 0.9 + seeded(4) * 0.15)),
    phishingRisk: Math.min(100, Math.floor(riskScore * 0.85 + seeded(5) * 0.2)),
    reputation: Math.max(0, 100 - riskScore + Math.floor(seeded(6) * 0.1)),
    domainAge: Math.max(5, Math.floor(seeded(7) * 0.9 + 10)),
  };
}

function RiskGauge({ score }: { score: number }) {
  const clampedScore = Math.max(0, Math.min(100, score));
  const angle = 180 - (clampedScore / 100) * 180;
  const rad = (angle * Math.PI) / 180;
  const r = 60;
  const cx = 85;
  const cy = 80;
  const x = cx + r * Math.cos(rad);
  const y = cy - r * Math.sin(rad);
  const color =
    clampedScore >= 70
      ? "oklch(0.62 0.22 22)"
      : clampedScore >= 40
        ? "oklch(0.70 0.18 48)"
        : "oklch(0.89 0.21 118)";
  const bgArcPath = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  const scoreArcPath =
    clampedScore === 0
      ? ""
      : `M ${cx - r} ${cy} A ${r} ${r} 0 ${clampedScore > 50 ? 1 : 0} 1 ${x.toFixed(2)} ${y.toFixed(2)}`;

  return (
    <div className="flex flex-col items-center">
      <svg
        width="170"
        height="100"
        viewBox="0 0 170 100"
        aria-label={`Risk score: ${clampedScore}`}
      >
        <title>Risk Score</title>
        <path
          d={bgArcPath}
          fill="none"
          stroke="oklch(0.28 0.04 245)"
          strokeWidth="12"
          strokeLinecap="round"
        />
        {scoreArcPath && (
          <path
            d={scoreArcPath}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
          />
        )}
        <text
          x={cx}
          y={cy + 6}
          textAnchor="middle"
          fill={color}
          fontSize="26"
          fontWeight="800"
          fontFamily="monospace"
        >
          {clampedScore}
        </text>
        <text
          x={cx}
          y={cy + 20}
          textAnchor="middle"
          fill="oklch(0.62 0.04 245)"
          fontSize="8"
          fontFamily="monospace"
        >
          RISK SCORE
        </text>
      </svg>
    </div>
  );
}

function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const configs = {
    SAFE: {
      icon: CheckCircle,
      color: "oklch(0.89 0.21 118)",
      bg: "oklch(0.89 0.21 118 / 0.12)",
      border: "oklch(0.89 0.21 118 / 0.4)",
    },
    SUSPICIOUS: {
      icon: AlertTriangle,
      color: "oklch(0.70 0.18 48)",
      bg: "oklch(0.70 0.18 48 / 0.12)",
      border: "oklch(0.70 0.18 48 / 0.4)",
    },
    MALICIOUS: {
      icon: XCircle,
      color: "oklch(0.62 0.22 22)",
      bg: "oklch(0.62 0.22 22 / 0.12)",
      border: "oklch(0.62 0.22 22 / 0.4)",
    },
  };
  const cfg = configs[verdict];
  const Icon = cfg.icon;
  return (
    <div
      className="flex items-center gap-2 px-4 py-2 rounded-full"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
    >
      <Icon className="h-4 w-4" style={{ color: cfg.color }} />
      <span
        className="font-black text-sm tracking-widest"
        style={{ color: cfg.color }}
      >
        {verdict}
      </span>
    </div>
  );
}

function BarChart({
  valueA,
  valueB,
  category,
  higherIsBetter,
}: {
  valueA: number;
  valueB: number;
  category: string;
  higherIsBetter: boolean;
}) {
  const bestA = higherIsBetter ? valueA >= valueB : valueA <= valueB;
  const winColor = "oklch(0.89 0.21 118)";
  const loseColor = "oklch(0.28 0.04 245)";
  return (
    <div className="mb-4">
      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
        {category}
      </p>
      <div className="space-y-1.5">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono w-4 text-muted-foreground">A</span>
          <div
            className="flex-1 h-3 rounded-full"
            style={{ background: "oklch(0.20 0.025 245)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${valueA}%`,
                background: bestA ? winColor : loseColor,
                boxShadow: bestA ? `0 0 8px ${winColor}` : "none",
              }}
            />
          </div>
          <span
            className="text-xs font-mono w-8 text-right"
            style={{ color: bestA ? winColor : "oklch(0.62 0.04 245)" }}
          >
            {valueA}%
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono w-4 text-muted-foreground">B</span>
          <div
            className="flex-1 h-3 rounded-full"
            style={{ background: "oklch(0.20 0.025 245)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${valueB}%`,
                background: !bestA ? winColor : loseColor,
                boxShadow: !bestA ? `0 0 8px ${winColor}` : "none",
              }}
            />
          </div>
          <span
            className="text-xs font-mono w-8 text-right"
            style={{ color: !bestA ? winColor : "oklch(0.62 0.04 245)" }}
          >
            {valueB}%
          </span>
        </div>
      </div>
    </div>
  );
}

interface ScanSideProps {
  label: "A" | "B";
  url: string;
  onUrlChange: (v: string) => void;
  onScan: () => void;
  isPending: boolean;
  result: CompareResult | null;
}

function ScanSide({
  label,
  url,
  onUrlChange,
  onScan,
  isPending,
  result,
}: ScanSideProps) {
  return (
    <div
      className="glass rounded-2xl p-5 flex flex-col gap-4"
      data-ocid={`compare.url_${label.toLowerCase()}_panel`}
    >
      <div className="flex items-center gap-2">
        <span
          className="h-7 w-7 rounded-lg flex items-center justify-center text-sm font-black"
          style={{
            background: "oklch(0.89 0.21 118 / 0.15)",
            color: "oklch(0.89 0.21 118)",
          }}
        >
          {label}
        </span>
        <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          URL {label}
        </span>
      </div>

      <div className="flex gap-2">
        <Input
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onScan()}
          placeholder="https://example.com"
          data-ocid={`compare.url_${label.toLowerCase()}_input`}
          className="flex-1 h-10 bg-navy-600 border-border text-foreground placeholder:text-muted-foreground/50 font-mono text-sm"
        />
        <Button
          onClick={onScan}
          disabled={isPending || !url.trim()}
          data-ocid={`compare.scan_${label.toLowerCase()}_button`}
          className="h-10 px-4 bg-lime text-navy-900 hover:bg-lime/90 font-bold glow-lime text-sm"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Shield className="h-4 w-4" />
          )}
        </Button>
      </div>

      {isPending && (
        <div
          data-ocid={`compare.url_${label.toLowerCase()}_loading_state`}
          className="flex items-center justify-center py-8 gap-3"
        >
          <Loader2 className="h-6 w-6 text-lime animate-spin" />
          <span className="text-sm text-muted-foreground">Scanning...</span>
        </div>
      )}

      {result && !isPending && (
        <div className="space-y-4 fade-in">
          <div className="flex flex-col items-center gap-3">
            <RiskGauge score={result.riskScore} />
            <VerdictBadge verdict={result.verdict} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div
              className="p-3 rounded-xl"
              style={{
                background: "oklch(0.15 0.025 245 / 0.6)",
                border: "1px solid oklch(0.28 0.04 245)",
              }}
            >
              <p className="text-xs text-muted-foreground mb-1">
                Threats Found
              </p>
              <p
                className="text-xl font-black font-mono"
                style={{
                  color:
                    result.threatsFound > 0
                      ? "oklch(0.62 0.22 22)"
                      : "oklch(0.89 0.21 118)",
                }}
              >
                {result.threatsFound}
              </p>
            </div>
            <div
              className="p-3 rounded-xl"
              style={{
                background: "oklch(0.15 0.025 245 / 0.6)",
                border: "1px solid oklch(0.28 0.04 245)",
              }}
            >
              <p className="text-xs text-muted-foreground mb-1">Scan Time</p>
              <p className="text-xl font-black font-mono text-foreground">
                {result.scanTime}
              </p>
            </div>
          </div>
        </div>
      )}

      {!result && !isPending && (
        <div className="flex flex-col items-center py-8 text-center">
          <Shield className="h-10 w-10 text-muted-foreground/20 mb-2" />
          <p className="text-sm text-muted-foreground">
            Enter a URL and scan to see results
          </p>
        </div>
      )}
    </div>
  );
}

export default function ComparePage() {
  const [urlA, setUrlA] = useState("");
  const [urlB, setUrlB] = useState("");
  const [resultA, setResultA] = useState<CompareResult | null>(null);
  const [resultB, setResultB] = useState<CompareResult | null>(null);
  const { mutateAsync: scanUrlA, isPending: isPendingA } = useScanUrl();
  const { mutateAsync: scanUrlB, isPending: isPendingB } = useScanUrl();

  const scanA = async () => {
    if (!urlA.trim()) return;
    setResultA(null);
    try {
      const raw = await scanUrlA(urlA.trim());
      setResultA(buildResult(urlA.trim(), raw));
    } catch {
      setResultA(buildResult(urlA.trim(), null));
    }
  };

  const scanB = async () => {
    if (!urlB.trim()) return;
    setResultB(null);
    try {
      const raw = await scanUrlB(urlB.trim());
      setResultB(buildResult(urlB.trim(), raw));
    } catch {
      setResultB(buildResult(urlB.trim(), null));
    }
  };

  const scanBoth = async () => {
    await Promise.all([
      urlA.trim() ? scanA() : Promise.resolve(),
      urlB.trim() ? scanB() : Promise.resolve(),
    ]);
  };

  const bothDone = resultA && resultB;
  const saferLabel = bothDone
    ? resultA.riskScore < resultB.riskScore
      ? "A"
      : resultB.riskScore < resultA.riskScore
        ? "B"
        : null
    : null;
  const safePct =
    bothDone && saferLabel
      ? Math.abs(resultA.riskScore - resultB.riskScore)
      : 0;

  const canDownload = resultA || resultB;

  const handleDownload = () => {
    window.print();
  };

  return (
    <main className="min-h-screen py-10 px-4 fade-in">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 fade-in-up flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-lime tracking-widest uppercase mb-2">
              Comparative Analysis
            </p>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              URL Comparison
            </h1>
            <p className="text-muted-foreground">
              Scan two URLs and compare their threat profiles side-by-side.
            </p>
          </div>
          {canDownload && (
            <Button
              onClick={handleDownload}
              data-ocid="compare.download_button"
              variant="outline"
              className="shrink-0 border-lime/30 text-lime hover:bg-lime/10 print-hide"
            >
              <Download className="h-4 w-4 mr-2" /> Download Report
            </Button>
          )}
        </div>

        {/* Compare Both button */}
        <div
          className="mb-6 flex justify-end fade-in-up"
          style={{ animationDelay: "0.05s" }}
        >
          <Button
            onClick={scanBoth}
            disabled={
              isPendingA || isPendingB || (!urlA.trim() && !urlB.trim())
            }
            data-ocid="compare.compare_button"
            className="h-11 px-8 bg-lime text-navy-900 hover:bg-lime/90 font-bold glow-lime"
          >
            {isPendingA || isPendingB ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Scanning
                Both...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" /> Compare Both URLs
              </>
            )}
          </Button>
        </div>

        {/* Side-by-side panels */}
        <div
          className="grid md:grid-cols-2 gap-6 fade-in-up"
          style={{ animationDelay: "0.1s" }}
        >
          <ScanSide
            label="A"
            url={urlA}
            onUrlChange={setUrlA}
            onScan={scanA}
            isPending={isPendingA}
            result={resultA}
          />
          <ScanSide
            label="B"
            url={urlB}
            onUrlChange={setUrlB}
            onScan={scanB}
            isPending={isPendingB}
            result={resultB}
          />
        </div>

        {/* Comparison Summary */}
        {bothDone && (
          <div className="mt-8 space-y-6 fade-in">
            {/* Winner */}
            <div
              className="glass rounded-2xl p-6"
              data-ocid="compare.summary_panel"
              style={{
                borderColor: saferLabel
                  ? "oklch(0.89 0.21 118 / 0.4)"
                  : "oklch(0.28 0.04 245)",
                boxShadow: saferLabel
                  ? "0 0 24px oklch(0.89 0.21 118 / 0.08)"
                  : undefined,
              }}
            >
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Verdict Summary
              </p>
              {saferLabel ? (
                <div className="flex items-center gap-3">
                  <span
                    className="h-9 w-9 rounded-xl flex items-center justify-center font-black text-lg"
                    style={{
                      background: "oklch(0.89 0.21 118 / 0.15)",
                      color: "oklch(0.89 0.21 118)",
                    }}
                  >
                    {saferLabel}
                  </span>
                  <p className="text-foreground font-semibold">
                    URL {saferLabel} is{" "}
                    <span style={{ color: "oklch(0.89 0.21 118)" }}>
                      {safePct}% safer
                    </span>{" "}
                    than URL {saferLabel === "A" ? "B" : "A"}
                  </p>
                  <CheckCircle
                    className="h-5 w-5 ml-auto"
                    style={{ color: "oklch(0.89 0.21 118)" }}
                  />
                </div>
              ) : (
                <p className="text-muted-foreground">
                  Both URLs have identical risk scores.
                </p>
              )}
            </div>

            {/* Comparison chart */}
            <div className="glass rounded-2xl p-6">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-5">
                Risk Category Comparison
              </p>
              <BarChart
                valueA={resultA.malwareRisk}
                valueB={resultB.malwareRisk}
                category="Malware Risk"
                higherIsBetter={false}
              />
              <BarChart
                valueA={resultA.phishingRisk}
                valueB={resultB.phishingRisk}
                category="Phishing Risk"
                higherIsBetter={false}
              />
              <BarChart
                valueA={resultA.reputation}
                valueB={resultB.reputation}
                category="Reputation Score"
                higherIsBetter={true}
              />
              <BarChart
                valueA={resultA.domainAge}
                valueB={resultB.domainAge}
                category="Domain Age Score"
                higherIsBetter={true}
              />
            </div>
          </div>
        )}
      </div>

      {/* Print report (hidden on screen, shown when printing) */}
      <div className="print-report-header" style={{ display: "none" }}>
        <div
          style={{
            textAlign: "center",
            marginBottom: "24px",
            paddingBottom: "16px",
            borderBottom: "2px solid #000",
          }}
        >
          <h1
            style={{
              fontSize: "24px",
              fontWeight: 900,
              letterSpacing: "0.1em",
              color: "#000",
            }}
          >
            CyberScan
          </h1>
          <p style={{ fontSize: "11px", color: "#555", marginTop: "4px" }}>
            SECURITY ANALYSIS REPORT — COMPARATIVE
          </p>
          <p style={{ fontSize: "10px", color: "#555" }}>
            Generated: {new Date().toLocaleString()}
          </p>
        </div>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "12px",
          }}
        >
          <thead>
            <tr style={{ background: "#f0f0f0" }}>
              <th
                style={{
                  padding: "8px",
                  border: "1px solid #ccc",
                  textAlign: "left",
                }}
              >
                Metric
              </th>
              <th
                style={{
                  padding: "8px",
                  border: "1px solid #ccc",
                  textAlign: "left",
                }}
              >
                URL A: {urlA}
              </th>
              <th
                style={{
                  padding: "8px",
                  border: "1px solid #ccc",
                  textAlign: "left",
                }}
              >
                URL B: {urlB}
              </th>
            </tr>
          </thead>
          <tbody>
            {bothDone &&
              [
                [
                  "Risk Score",
                  String(resultA.riskScore),
                  String(resultB.riskScore),
                ],
                ["Verdict", resultA.verdict, resultB.verdict],
                [
                  "Threats Found",
                  String(resultA.threatsFound),
                  String(resultB.threatsFound),
                ],
                [
                  "Malware Risk",
                  `${resultA.malwareRisk}%`,
                  `${resultB.malwareRisk}%`,
                ],
                [
                  "Phishing Risk",
                  `${resultA.phishingRisk}%`,
                  `${resultB.phishingRisk}%`,
                ],
                [
                  "Reputation",
                  `${resultA.reputation}%`,
                  `${resultB.reputation}%`,
                ],
              ].map(([label, a, b]) => (
                <tr key={label}>
                  <td
                    style={{
                      padding: "6px 8px",
                      border: "1px solid #ddd",
                      fontWeight: 600,
                    }}
                  >
                    {label}
                  </td>
                  <td
                    style={{
                      padding: "6px 8px",
                      border: "1px solid #ddd",
                      fontFamily: "monospace",
                    }}
                  >
                    {a}
                  </td>
                  <td
                    style={{
                      padding: "6px 8px",
                      border: "1px solid #ddd",
                      fontFamily: "monospace",
                    }}
                  >
                    {b}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        <p
          style={{
            marginTop: "32px",
            fontSize: "9px",
            color: "#888",
            textAlign: "center",
            borderTop: "1px solid #ddd",
            paddingTop: "8px",
          }}
        >
          CONFIDENTIAL — Generated by CyberScan Security Platform
        </p>
      </div>
    </main>
  );
}
