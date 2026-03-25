import { useEffect, useMemo, useState } from "react";

type IncidentSeverity = "Critical" | "High" | "Medium" | "Low";

interface Incident {
  date: string;
  type: string;
  severity: IncidentSeverity;
  description: string;
}

const INCIDENT_TYPES = [
  "Malware Distribution",
  "Phishing Campaign",
  "DDoS Attack",
  "Data Breach",
  "Ransomware Deploy",
  "Credential Stuffing",
  "SQL Injection Attempt",
  "Zero-Day Exploit",
  "Botnet C2 Activity",
  "Cryptojacking",
];

const SEVERITIES: IncidentSeverity[] = ["Critical", "High", "Medium", "Low"];

const DESCRIPTIONS = [
  "Multiple engines flagged suspicious outbound traffic patterns.",
  "Domain used in credential harvesting emails targeting enterprise users.",
  "Volumetric attack peaked at 48 Gbps, sourced from 12 countries.",
  "Unauthorized access exposed 220K user records; notified authorities.",
  "LockBit variant detected; encrypted 40% of host filesystem before containment.",
  "Over 15K login attempts using leaked credential databases.",
  "Blind SQL injection exploited in login endpoint, data exfiltration detected.",
  "Unpatched CVE-2024-1234 leveraged for remote code execution.",
  "Consistent beaconing to known C2 infrastructure every 5 minutes.",
  "Hidden mining script injected via compromised third-party widget.",
];

function seededRand(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function hashStr(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h * 33) ^ str.charCodeAt(i)) & 0x7fffffff;
  }
  return h;
}

function generateIncidents(target: string): Incident[] {
  const rand = seededRand(hashStr(target));
  const now = new Date();
  const count = 6 + Math.floor(rand() * 3);
  const incidents: Incident[] = [];

  for (let i = 0; i < count; i++) {
    const daysBack = Math.floor(rand() * 700) + 10;
    const date = new Date(now);
    date.setDate(date.getDate() - daysBack);
    const typeIdx = Math.floor(rand() * INCIDENT_TYPES.length);
    const sevIdx = Math.floor(rand() * SEVERITIES.length);
    const descIdx = Math.floor(rand() * DESCRIPTIONS.length);
    incidents.push({
      date: date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      type: INCIDENT_TYPES[typeIdx],
      severity: SEVERITIES[sevIdx],
      description: DESCRIPTIONS[descIdx],
    });
  }

  return incidents.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

const sevConfig: Record<
  IncidentSeverity,
  { color: string; bg: string; border: string }
> = {
  Critical: {
    color: "oklch(0.62 0.22 22)",
    bg: "oklch(0.62 0.22 22 / 0.12)",
    border: "oklch(0.62 0.22 22 / 0.35)",
  },
  High: {
    color: "oklch(0.70 0.18 48)",
    bg: "oklch(0.70 0.18 48 / 0.12)",
    border: "oklch(0.70 0.18 48 / 0.35)",
  },
  Medium: {
    color: "oklch(0.83 0.19 95)",
    bg: "oklch(0.83 0.19 95 / 0.12)",
    border: "oklch(0.83 0.19 95 / 0.35)",
  },
  Low: {
    color: "oklch(0.89 0.21 118)",
    bg: "oklch(0.89 0.21 118 / 0.12)",
    border: "oklch(0.89 0.21 118 / 0.35)",
  },
};

export default function AttackTimeline({ target }: { target: string }) {
  const incidents = useMemo(() => generateIncidents(target), [target]);
  const [visible, setVisible] = useState<boolean[]>(() =>
    Array(incidents.length).fill(false),
  );

  useEffect(() => {
    setVisible(Array(incidents.length).fill(false));
    const timers: ReturnType<typeof setTimeout>[] = [];
    incidents.forEach((_, i) => {
      timers.push(
        setTimeout(() => {
          setVisible((prev) => {
            const next = [...prev];
            next[i] = true;
            return next;
          });
        }, i * 120),
      );
    });
    return () => timers.forEach(clearTimeout);
  }, [incidents]);

  return (
    <div className="glass rounded-2xl overflow-hidden mt-6">
      <div className="px-6 py-4 border-b border-border flex items-center gap-3">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Attack History Timeline
        </span>
        <span
          className="ml-auto text-xs font-mono px-2 py-0.5 rounded"
          style={{
            color: "oklch(0.89 0.21 118)",
            background: "oklch(0.89 0.21 118 / 0.1)",
          }}
        >
          {target}
        </span>
      </div>

      <div className="p-6">
        <div className="relative">
          <div
            className="absolute left-[7px] top-3 bottom-3 w-px"
            style={{
              background:
                "linear-gradient(to bottom, oklch(0.89 0.21 118 / 0.8), oklch(0.89 0.21 118 / 0.1))",
            }}
          />

          <div className="space-y-5">
            {incidents.map((incident, i) => {
              const sev = sevConfig[incident.severity];
              const nodeKey = `${incident.date}-${incident.type}-${i}`;
              return (
                <div
                  key={nodeKey}
                  className="flex gap-5 transition-all duration-500"
                  style={{
                    opacity: visible[i] ? 1 : 0,
                    transform: visible[i]
                      ? "translateX(0)"
                      : "translateX(-12px)",
                  }}
                >
                  <div className="shrink-0 mt-1.5">
                    <div
                      className="h-3.5 w-3.5 rounded-full"
                      style={{
                        background: sev.color,
                        boxShadow: `0 0 8px ${sev.color}`,
                        border: "2px solid oklch(0.17 0.025 245)",
                      }}
                    />
                  </div>

                  <div
                    className="flex-1 p-4 rounded-xl border"
                    style={{
                      background: "oklch(0.15 0.025 245 / 0.6)",
                      borderColor: sev.border,
                    }}
                  >
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="text-xs font-mono text-muted-foreground">
                        {incident.date}
                      </span>
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{
                          color: sev.color,
                          background: sev.bg,
                          border: `1px solid ${sev.border}`,
                        }}
                      >
                        {incident.severity}
                      </span>
                      <span className="text-xs font-semibold text-foreground">
                        {incident.type}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {incident.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
