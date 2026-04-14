import { Skeleton } from "@/components/ui/skeleton";
import { useGetScanHistory } from "@/hooks/useQueries";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Globe,
  Inbox,
  Shield,
  XCircle,
} from "lucide-react";
import { ScanType } from "../backend";
import type { ScanHistoryEntry } from "../backend.d.ts";

const NEON_BLUE = "oklch(0.65 0.22 250)";
const NEON_PINK = "oklch(0.65 0.20 335)";
const MAGENTA = "oklch(0.60 0.23 305)";
const ORANGE = "oklch(0.70 0.18 48)";

function VerdictPill({ verdict }: { verdict: string }) {
  const v = verdict?.toUpperCase() ?? "UNKNOWN";
  if (v === "SAFE")
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
        style={{
          background: `${NEON_BLUE.replace(")", " / 0.12)")}`,
          color: NEON_BLUE,
          border: `1px solid ${NEON_BLUE.replace(")", " / 0.3)")}`,
        }}
      >
        <CheckCircle className="h-3 w-3" /> {v}
      </span>
    );
  if (v === "SUSPICIOUS")
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
        style={{
          background: `${ORANGE.replace(")", " / 0.12)")}`,
          color: ORANGE,
          border: `1px solid ${ORANGE.replace(")", " / 0.3)")}`,
        }}
      >
        <AlertTriangle className="h-3 w-3" /> {v}
      </span>
    );
  if (v === "DANGEROUS")
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
        style={{
          background: `${NEON_PINK.replace(")", " / 0.12)")}`,
          color: NEON_PINK,
          border: `1px solid ${NEON_PINK.replace(")", " / 0.3)")}`,
        }}
      >
        <XCircle className="h-3 w-3" /> {v}
      </span>
    );
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
      style={{
        background: "oklch(0.62 0.04 245 / 0.12)",
        color: "oklch(0.62 0.04 245)",
        border: "1px solid oklch(0.62 0.04 245 / 0.3)",
      }}
    >
      {v}
    </span>
  );
}

function TypeBadge({ scanType }: { scanType: ScanHistoryEntry["scanType"] }) {
  return scanType === ScanType.url ? (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
      style={{
        background: `${NEON_BLUE.replace(")", " / 0.1)")}`,
        color: NEON_BLUE,
        border: `1px solid ${NEON_BLUE.replace(")", " / 0.25)")}`,
      }}
    >
      <Shield className="h-3 w-3" /> URL
    </span>
  ) : (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
      style={{
        background: `${MAGENTA.replace(")", " / 0.1)")}`,
        color: MAGENTA,
        border: `1px solid ${MAGENTA.replace(")", " / 0.25)")}`,
      }}
    >
      <Globe className="h-3 w-3" /> DNS
    </span>
  );
}

function formatDate(ts: bigint): string {
  try {
    const ms = Number(ts) / 1_000_000;
    return new Date(ms).toLocaleString();
  } catch {
    return "—";
  }
}

export default function HistoryPage() {
  const { data: history, isLoading, isError } = useGetScanHistory();

  return (
    <main className="min-h-screen py-10 px-4 fade-in">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10 fade-in-up">
          <p
            className="text-xs font-semibold tracking-widest uppercase mb-2"
            style={{ color: NEON_BLUE }}
          >
            Audit Trail
          </p>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Scan History
          </h1>
          <p className="text-muted-foreground">
            Complete log of all URL and DNS scans performed.
          </p>
        </div>

        {isLoading && (
          <div
            data-ocid="history.loading_state"
            className="glass rounded-2xl overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-border">
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          </div>
        )}

        {isError && (
          <div
            data-ocid="history.error_state"
            className="glass rounded-2xl p-8 flex items-center gap-4"
            style={{ border: `1px solid ${NEON_PINK.replace(")", " / 0.3)")}` }}
          >
            <AlertTriangle className="h-8 w-8" style={{ color: NEON_PINK }} />
            <div>
              <p className="font-semibold text-foreground">
                Failed to load history
              </p>
              <p className="text-sm text-muted-foreground">
                Could not connect to the backend canister.
              </p>
            </div>
          </div>
        )}

        {!isLoading && !isError && history && history.length > 0 && (
          <div className="glass rounded-2xl overflow-hidden fade-in border-glow">
            <div className="px-6 py-4 border-b border-border flex items-center gap-3">
              <Clock className="h-4 w-4" style={{ color: NEON_BLUE }} />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Recent Scans
              </p>
              <span className="ml-auto text-xs text-muted-foreground">
                {history.length} entries
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full" data-ocid="history.table">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Target
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Date
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Type
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Verdict
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Risk Score
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((entry, i) => (
                    <tr
                      key={`${entry.target}-${i}`}
                      data-ocid={`history.item.${i + 1}`}
                      className="border-b border-border/50 hover:bg-primary/5 transition-colors"
                    >
                      <td className="px-6 py-4 font-mono text-xs text-foreground max-w-xs truncate">
                        {entry.target}
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(entry.timestamp)}
                      </td>
                      <td className="px-6 py-4">
                        <TypeBadge scanType={entry.scanType} />
                      </td>
                      <td className="px-6 py-4">
                        <VerdictPill verdict={entry.summary.verdict} />
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="font-bold text-sm"
                          style={{
                            color:
                              Number(entry.summary.riskScore) >= 70
                                ? NEON_PINK
                                : Number(entry.summary.riskScore) >= 40
                                  ? ORANGE
                                  : NEON_BLUE,
                          }}
                        >
                          {Number(entry.summary.riskScore)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!isLoading && !isError && (!history || history.length === 0) && (
          <div
            data-ocid="history.empty_state"
            className="glass rounded-2xl p-16 flex flex-col items-center text-center fade-in-up"
          >
            <Inbox className="h-14 w-14 text-muted-foreground/25 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No scans yet
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Your scan history will appear here once you start scanning URLs or
              looking up domains.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
