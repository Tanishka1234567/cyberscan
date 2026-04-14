import AiAnalysisPanel, { type AiAnalysis } from "@/components/AiAnalysisPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  type SavedReport,
  deleteReport,
  getReports,
  getTotalDownloadCount,
  incrementDownloadCount,
  printReport,
} from "@/utils/downloadReports";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  Brain,
  Calendar,
  Download,
  FileText,
  Globe,
  RefreshCw,
  Shield,
  Trash2,
  User,
} from "lucide-react";
import { useState } from "react";

const NEON_BLUE = "oklch(0.65 0.22 250)";
const NEON_PINK = "oklch(0.65 0.20 335)";
const MAGENTA = "oklch(0.60 0.23 305)";
const ORANGE = "oklch(0.70 0.18 48)";

function getInitials(username: string): string {
  return username
    .split(/[\s._-]+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function VerdictPill({ verdict }: { verdict: string }) {
  if (verdict === "SAFE")
    return (
      <span
        className="px-2.5 py-0.5 rounded-full text-xs font-bold"
        style={{
          background: `${NEON_BLUE.replace(")", " / 0.12)")}`,
          color: NEON_BLUE,
          border: `1px solid ${NEON_BLUE.replace(")", " / 0.35)")}`,
        }}
      >
        SAFE
      </span>
    );
  if (verdict === "SUSPICIOUS")
    return (
      <span
        className="px-2.5 py-0.5 rounded-full text-xs font-bold"
        style={{
          background: `${ORANGE.replace(")", " / 0.12)")}`,
          color: ORANGE,
          border: `1px solid ${ORANGE.replace(")", " / 0.35)")}`,
        }}
      >
        SUSPICIOUS
      </span>
    );
  if (verdict === "DANGEROUS")
    return (
      <span
        className="px-2.5 py-0.5 rounded-full text-xs font-bold"
        style={{
          background: `${NEON_PINK.replace(")", " / 0.12)")}`,
          color: NEON_PINK,
          border: `1px solid ${NEON_PINK.replace(")", " / 0.35)")}`,
        }}
      >
        DANGEROUS
      </span>
    );
  return (
    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/10 text-muted-foreground">
      {verdict || "—"}
    </span>
  );
}

function AiMiniPill({ ai }: { ai: AiAnalysis | undefined }) {
  if (!ai?.available) return null;
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    Low: {
      bg: `${NEON_BLUE.replace(")", " / 0.10)")}`,
      text: NEON_BLUE,
      border: `${NEON_BLUE.replace(")", " / 0.30)")}`,
    },
    Medium: {
      bg: `${ORANGE.replace(")", " / 0.10)")}`,
      text: ORANGE,
      border: `${ORANGE.replace(")", " / 0.30)")}`,
    },
    High: {
      bg: `${MAGENTA.replace(")", " / 0.10)")}`,
      text: MAGENTA,
      border: `${MAGENTA.replace(")", " / 0.30)")}`,
    },
    Critical: {
      bg: `${NEON_PINK.replace(")", " / 0.10)")}`,
      text: NEON_PINK,
      border: `${NEON_PINK.replace(")", " / 0.30)")}`,
    },
  };
  const c = colors[ai.riskLevel] ?? colors.Low;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
      style={{
        background: c.bg,
        color: c.text,
        border: `1px solid ${c.border}`,
      }}
      title={`AI: ${ai.verdict} (${Math.round(ai.confidence)}% confidence)`}
      data-ocid="profile.report.ai_badge"
    >
      <Brain className="w-3 h-3" />
      {ai.riskLevel}
    </span>
  );
}

function ReportCard({
  report,
  onRedownload,
  onDelete,
}: {
  report: SavedReport;
  onRedownload: (r: SavedReport) => void;
  onDelete: (id: string) => void;
}) {
  const [showAi, setShowAi] = useState(false);
  return (
    <div
      className="glass rounded-xl p-5 flex flex-col gap-3 fade-in-up border border-border card-hover transition-all duration-200"
      data-ocid="profile.report.card"
    >
      <div className="flex items-start gap-3 justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: `${NEON_BLUE.replace(")", " / 0.10)")}` }}
          >
            {report.scanType === "url" ? (
              <Shield className="w-4 h-4" style={{ color: NEON_BLUE }} />
            ) : (
              <Globe className="w-4 h-4" style={{ color: MAGENTA }} />
            )}
          </div>
          <p className="font-mono text-sm text-foreground truncate max-w-[220px] sm:max-w-xs">
            {report.target}
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
          <Badge
            variant="outline"
            className="text-xs font-bold border-border text-muted-foreground"
          >
            {report.scanType.toUpperCase()}
          </Badge>
          <VerdictPill verdict={report.verdict} />
          <AiMiniPill ai={report.aiAnalysis} />
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          {new Date(report.timestamp).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </span>
        <span
          className="font-semibold"
          style={{
            color:
              report.riskScore >= 70
                ? NEON_PINK
                : report.riskScore >= 40
                  ? ORANGE
                  : NEON_BLUE,
          }}
        >
          Risk: {report.riskScore}/100
        </span>
        <span className="flex items-center gap-1">
          <Download className="w-3.5 h-3.5" />
          Downloaded {report.downloadCount}×
        </span>
        {report.aiAnalysis?.available && (
          <span
            className="flex items-center gap-1"
            style={{ color: `${NEON_BLUE.replace(")", " / 0.7)")}` }}
          >
            <Brain className="w-3.5 h-3.5" />
            AI: {Math.round(report.aiAnalysis.confidence)}% confidence
          </span>
        )}
      </div>

      {report.aiAnalysis?.available && (
        <div>
          <button
            type="button"
            onClick={() => setShowAi((v) => !v)}
            className="text-xs hover:text-primary flex items-center gap-1 transition-colors"
            style={{ color: `${NEON_BLUE.replace(")", " / 0.7)")}` }}
            data-ocid="profile.report.ai_toggle"
          >
            <Brain className="w-3 h-3" />
            {showAi ? "Hide AI Analysis" : "Show AI Analysis"}
          </button>
          {showAi && (
            <div className="mt-3">
              <AiAnalysisPanel ai={report.aiAnalysis} />
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 pt-1">
        <Button
          size="sm"
          data-ocid="profile.report.button"
          onClick={() => onRedownload(report)}
          variant="outline"
          className="h-8 px-4 text-xs font-bold"
          style={{
            background: `${NEON_BLUE.replace(")", " / 0.1)")}`,
            color: NEON_BLUE,
            borderColor: `${NEON_BLUE.replace(")", " / 0.3)")}`,
          }}
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Re-Download
        </Button>
        <Button
          size="sm"
          data-ocid="profile.report.delete_button"
          onClick={() => onDelete(report.id)}
          variant="ghost"
          className="h-8 px-3 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<SavedReport[]>(() =>
    user ? getReports(user.email) : [],
  );

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div
          className="glass rounded-2xl p-12 flex flex-col items-center gap-6 max-w-sm w-full text-center fade-in border-glow"
          data-ocid="profile.panel"
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{
              background: `${NEON_BLUE.replace(")", " / 0.08)")}`,
              border: `2px solid ${NEON_BLUE.replace(")", " / 0.25)")}`,
            }}
          >
            <User className="w-8 h-8" style={{ color: NEON_BLUE }} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              Access Restricted
            </h2>
            <p className="text-sm text-muted-foreground">
              Please log in to view your profile and scan history.
            </p>
          </div>
          <Link to="/login">
            <Button
              data-ocid="profile.login.button"
              className="font-bold px-8"
              style={{ background: NEON_BLUE, color: "oklch(0.08 0.02 250)" }}
            >
              Log In
            </Button>
          </Link>
        </div>
      </main>
    );
  }

  const totalDownloads = getTotalDownloadCount(user.email);
  const threatsFound = reports.filter(
    (r) => r.verdict === "SUSPICIOUS" || r.verdict === "DANGEROUS",
  ).length;
  const aiScans = reports.filter((r) => r.aiAnalysis?.available).length;
  const memberSince =
    reports.length > 0
      ? new Date(
          Math.min(...reports.map((r) => r.timestamp)),
        ).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";

  function handleRedownload(report: SavedReport) {
    incrementDownloadCount(user!.email, report.id);
    printReport(report);
    setReports(getReports(user!.email));
  }

  function handleDelete(reportId: string) {
    deleteReport(user!.email, reportId);
    setReports(getReports(user!.email));
  }

  return (
    <main className="min-h-screen py-10 px-4 fade-in">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="fade-in-up">
          <p
            className="text-xs font-semibold tracking-widest uppercase mb-2"
            style={{ color: NEON_BLUE }}
          >
            Account
          </p>
          <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
        </div>

        {/* User info card */}
        <div
          className="glass rounded-2xl p-6 fade-in-up flex items-center gap-6 border-glow"
          style={{ animationDelay: "0.05s" }}
          data-ocid="profile.panel"
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 text-2xl font-black"
            style={{
              background: `linear-gradient(135deg, ${NEON_BLUE.replace(")", " / 0.15)")}, ${MAGENTA.replace(")", " / 0.15)")})`,
              border: `2px solid ${NEON_BLUE.replace(")", " / 0.4)")}`,
              color: NEON_BLUE,
              boxShadow: `0 0 20px ${NEON_BLUE.replace(")", " / 0.2)")}`,
            }}
          >
            {getInitials(user.username)}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold text-foreground font-mono">
              {user.username}
            </h2>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <p className="text-xs text-muted-foreground mt-1">
              First scan:{" "}
              <span className="text-foreground font-medium">{memberSince}</span>
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 fade-in-up"
          style={{ animationDelay: "0.1s" }}
        >
          {[
            {
              label: "Total Scans",
              value: reports.length,
              icon: FileText,
              color: NEON_BLUE,
            },
            {
              label: "Reports Downloaded",
              value: totalDownloads,
              icon: Download,
              color: MAGENTA,
            },
            {
              label: "Threats Found",
              value: threatsFound,
              icon: AlertTriangle,
              color: threatsFound > 0 ? NEON_PINK : NEON_BLUE,
            },
            {
              label: "AI Scans",
              value: aiScans,
              icon: Brain,
              color: "oklch(0.75 0.15 210)",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="glass rounded-2xl p-5 flex flex-col items-center text-center card-hover"
              data-ocid="profile.card"
              style={{ borderColor: `${stat.color.replace(")", " / 0.2)")}` }}
            >
              <stat.icon
                className="w-5 h-5 mb-3"
                style={{ color: stat.color }}
              />
              <p
                className="text-3xl font-black mb-1"
                style={{
                  color: stat.color,
                  textShadow: `0 0 20px ${stat.color.replace(")", " / 0.4)")}`,
                }}
              >
                {stat.value}
              </p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Reports section */}
        <div className="fade-in-up" style={{ animationDelay: "0.15s" }}>
          <div className="flex items-center gap-3 mb-5">
            <h2 className="text-lg font-bold text-foreground">Scan History</h2>
            <span
              className="px-2.5 py-0.5 rounded-full text-xs font-bold"
              style={{
                background: `${NEON_BLUE.replace(")", " / 0.12)")}`,
                color: NEON_BLUE,
                border: `1px solid ${NEON_BLUE.replace(")", " / 0.3)")}`,
              }}
            >
              {reports.length}
            </span>
          </div>

          {reports.length === 0 ? (
            <div
              className="glass rounded-2xl p-14 flex flex-col items-center text-center"
              data-ocid="profile.reports.empty_state"
            >
              <FileText className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-base font-semibold text-foreground mb-2">
                No saved reports
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Run a URL scan or DNS lookup and download the report — it will
                appear here automatically.
              </p>
              <div className="flex gap-3 mt-5">
                <Link to="/url-scanner">
                  <Button
                    size="sm"
                    data-ocid="profile.url_scanner.button"
                    className="font-bold"
                    style={{
                      background: NEON_BLUE,
                      color: "oklch(0.08 0.02 250)",
                    }}
                  >
                    <Shield className="w-3.5 h-3.5 mr-1.5" />
                    URL Scanner
                  </Button>
                </Link>
                <Link to="/dns-whois">
                  <Button
                    size="sm"
                    data-ocid="profile.dns_whois.button"
                    variant="outline"
                    className="border-border text-muted-foreground hover:text-foreground"
                  >
                    <Globe className="w-3.5 h-3.5 mr-1.5" />
                    DNS Lookup
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3" data-ocid="profile.reports.list">
              {reports.map((report, i) => (
                <div
                  key={report.id}
                  data-ocid={`profile.reports.item.${i + 1}`}
                >
                  <ReportCard
                    report={report}
                    onRedownload={handleRedownload}
                    onDelete={handleDelete}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
