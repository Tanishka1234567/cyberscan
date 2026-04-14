import { useEffect, useState } from "react";

type Severity = "Critical" | "High" | "Medium";
type ThreatType =
  | "Malware"
  | "Phishing"
  | "DDoS"
  | "Ransomware"
  | "Botnet"
  | "SQLi"
  | "Zero-Day"
  | "Brute Force";

interface ThreatEntry {
  id: number;
  type: ThreatType;
  source: string;
  severity: Severity;
  country: string;
  flag: string;
  minutesAgo: number;
}

const NEON_BLUE = "oklch(0.65 0.22 250)";
const NEON_PINK = "oklch(0.65 0.20 335)";
const MAGENTA = "oklch(0.60 0.23 305)";
const ORANGE = "oklch(0.70 0.18 48)";
const CYAN = "oklch(0.72 0.15 210)";

const THREAT_DATA: Omit<ThreatEntry, "id" | "minutesAgo">[] = [
  {
    type: "Malware",
    source: "185.220.101.47",
    severity: "Critical",
    country: "Russia",
    flag: "🇷🇺",
  },
  {
    type: "Phishing",
    source: "evil-crypto-giveaway.tk",
    severity: "High",
    country: "China",
    flag: "🇨🇳",
  },
  {
    type: "DDoS",
    source: "45.33.32.156",
    severity: "Critical",
    country: "United States",
    flag: "🇺🇸",
  },
  {
    type: "Ransomware",
    source: "secure-update-patch.com",
    severity: "Critical",
    country: "North Korea",
    flag: "🇰🇵",
  },
  {
    type: "Botnet",
    source: "192.168.0.0/16",
    severity: "High",
    country: "Brazil",
    flag: "🇧🇷",
  },
  {
    type: "SQLi",
    source: "mail-verify-login.net",
    severity: "Medium",
    country: "India",
    flag: "🇮🇳",
  },
  {
    type: "Phishing",
    source: "109.234.39.85",
    severity: "High",
    country: "Ukraine",
    flag: "🇺🇦",
  },
  {
    type: "Malware",
    source: "free-vpn-download.xyz",
    severity: "High",
    country: "Iran",
    flag: "🇮🇷",
  },
  {
    type: "Zero-Day",
    source: "198.51.100.23",
    severity: "Critical",
    country: "Germany",
    flag: "🇩🇪",
  },
  {
    type: "Brute Force",
    source: "103.21.244.0",
    severity: "Medium",
    country: "Netherlands",
    flag: "🇳🇱",
  },
  {
    type: "Botnet",
    source: "win-update-security.ru",
    severity: "Critical",
    country: "Russia",
    flag: "🇷🇺",
  },
  {
    type: "DDoS",
    source: "203.0.113.77",
    severity: "High",
    country: "Singapore",
    flag: "🇸🇬",
  },
  {
    type: "SQLi",
    source: "login-paypal-secure.xyz",
    severity: "High",
    country: "Romania",
    flag: "🇷🇴",
  },
  {
    type: "Ransomware",
    source: "91.108.4.0",
    severity: "Critical",
    country: "Turkey",
    flag: "🇹🇷",
  },
  {
    type: "Phishing",
    source: "amazon-support-verify.ml",
    severity: "Medium",
    country: "Vietnam",
    flag: "🇻🇳",
  },
  {
    type: "Malware",
    source: "64.62.197.152",
    severity: "High",
    country: "Canada",
    flag: "🇨🇦",
  },
  {
    type: "Brute Force",
    source: "5.188.10.51",
    severity: "Medium",
    country: "France",
    flag: "🇫🇷",
  },
  {
    type: "Zero-Day",
    source: "bank-alert-login.tk",
    severity: "Critical",
    country: "China",
    flag: "🇨🇳",
  },
  {
    type: "Botnet",
    source: "37.49.224.0",
    severity: "High",
    country: "Pakistan",
    flag: "🇵🇰",
  },
  {
    type: "DDoS",
    source: "streaming-free-hd.ml",
    severity: "Medium",
    country: "Indonesia",
    flag: "🇮🇩",
  },
  {
    type: "Phishing",
    source: "176.9.0.206",
    severity: "Critical",
    country: "Ukraine",
    flag: "🇺🇦",
  },
  {
    type: "Malware",
    source: "crypto-wallet-sync.io",
    severity: "High",
    country: "Belarus",
    flag: "🇧🇾",
  },
  {
    type: "SQLi",
    source: "194.165.16.5",
    severity: "Medium",
    country: "Mexico",
    flag: "🇲🇽",
  },
  {
    type: "Ransomware",
    source: "office-365-login.net",
    severity: "Critical",
    country: "North Korea",
    flag: "🇰🇵",
  },
  {
    type: "Brute Force",
    source: "45.142.212.100",
    severity: "High",
    country: "United Kingdom",
    flag: "🇬🇧",
  },
  {
    type: "Botnet",
    source: "update-flash-player.xyz",
    severity: "Medium",
    country: "Thailand",
    flag: "🇹🇭",
  },
  {
    type: "Zero-Day",
    source: "89.248.167.131",
    severity: "Critical",
    country: "Russia",
    flag: "🇷🇺",
  },
  {
    type: "DDoS",
    source: "mail-verify-secure.tk",
    severity: "High",
    country: "Egypt",
    flag: "🇪🇬",
  },
  {
    type: "Phishing",
    source: "104.21.0.0",
    severity: "Medium",
    country: "Japan",
    flag: "🇯🇵",
  },
  {
    type: "Malware",
    source: "gov-payment-portal.ml",
    severity: "Critical",
    country: "Iran",
    flag: "🇮🇷",
  },
  {
    type: "SQLi",
    source: "195.123.240.68",
    severity: "High",
    country: "South Korea",
    flag: "🇰🇷",
  },
  {
    type: "Brute Force",
    source: "tech-support-win.xyz",
    severity: "Medium",
    country: "India",
    flag: "🇮🇳",
  },
];

const severityConfig: Record<
  Severity,
  { color: string; bg: string; border: string; label: string }
> = {
  Critical: {
    color: NEON_PINK,
    bg: `${NEON_PINK.replace(")", " / 0.12)")}`,
    border: `${NEON_PINK.replace(")", " / 0.35)")}`,
    label: "CRITICAL",
  },
  High: {
    color: MAGENTA,
    bg: `${MAGENTA.replace(")", " / 0.12)")}`,
    border: `${MAGENTA.replace(")", " / 0.35)")}`,
    label: "HIGH",
  },
  Medium: {
    color: NEON_BLUE,
    bg: `${NEON_BLUE.replace(")", " / 0.12)")}`,
    border: `${NEON_BLUE.replace(")", " / 0.35)")}`,
    label: "MEDIUM",
  },
};

const typeColors: Record<ThreatType, string> = {
  Malware: NEON_PINK,
  Phishing: ORANGE,
  DDoS: MAGENTA,
  Ransomware: NEON_PINK,
  Botnet: NEON_BLUE,
  SQLi: CYAN,
  "Zero-Day": NEON_PINK,
  "Brute Force": MAGENTA,
};

function buildEntries(): ThreatEntry[] {
  return THREAT_DATA.map((d, i) => ({ ...d, id: i, minutesAgo: i * 2 + 1 }));
}

function formatTime(minutesAgo: number): string {
  if (minutesAgo < 60) return `${minutesAgo} min ago`;
  return `${Math.floor(minutesAgo / 60)}h ago`;
}

export default function ThreatFeedPage() {
  const [entries, setEntries] = useState<ThreatEntry[]>(buildEntries);
  const [newFlashId, setNewFlashId] = useState<number | null>(null);
  const [showTypewriter, setShowTypewriter] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowTypewriter(true), 300);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setEntries((prev) => {
        const copy = [...prev];
        const last = copy.pop()!;
        const newEntry: ThreatEntry = {
          ...last,
          id: Date.now(),
          minutesAgo: 1,
        };
        const updated = [newEntry, ...copy].map((e, i) => ({
          ...e,
          minutesAgo: i === 0 ? 1 : e.minutesAgo + 1,
        }));
        setNewFlashId(updated[0].id);
        setTimeout(() => setNewFlashId(null), 800);
        return updated;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const displayEntries = [...entries, ...entries];

  return (
    <main className="min-h-screen py-10 px-4 fade-in">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 fade-in-up">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs font-semibold text-muted-foreground tracking-widest uppercase">
              Global Intelligence
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-5 mb-3">
            <h1 className="text-3xl font-bold text-foreground">
              Live Threat Feed
            </h1>

            {/* Enhanced LIVE badge */}
            <div className="relative flex items-center">
              {/* Triple pulse rings */}
              <span
                className="absolute rounded-full"
                style={{
                  inset: "-10px",
                  border: "1.5px solid oklch(0.65 0.20 335 / 0.5)",
                  animation: "pulseRing 1.8s ease-out infinite",
                }}
              />
              <span
                className="absolute rounded-full"
                style={{
                  inset: "-18px",
                  border: "1px solid oklch(0.65 0.20 335 / 0.3)",
                  animation: "pulseRing 1.8s ease-out 0.4s infinite",
                }}
              />
              <span
                className="absolute rounded-full"
                style={{
                  inset: "-26px",
                  border: "1px solid oklch(0.65 0.20 335 / 0.15)",
                  animation: "pulseRing 1.8s ease-out 0.8s infinite",
                }}
              />

              {/* Badge */}
              <div
                className="relative flex items-center gap-2 px-4 py-2 rounded-full"
                style={{
                  background: "oklch(0.65 0.20 335 / 0.12)",
                  border: "1.5px solid oklch(0.65 0.20 335 / 0.6)",
                  boxShadow:
                    "0 0 20px oklch(0.65 0.20 335 / 0.3), inset 0 0 12px oklch(0.65 0.20 335 / 0.05)",
                }}
                data-ocid="threat-feed.live-badge"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{
                    background: "oklch(0.65 0.20 335)",
                    boxShadow: "0 0 10px oklch(0.65 0.20 335 / 0.9)",
                    animation: "pulse 1s ease-in-out infinite",
                  }}
                />
                <span
                  className="text-sm font-black tracking-widest live-heartbeat"
                  style={{
                    color: "oklch(0.65 0.20 335)",
                    textShadow: "0 0 12px oklch(0.65 0.20 335 / 0.8)",
                  }}
                >
                  LIVE
                </span>
              </div>
            </div>
          </div>

          {/* Typewriter subtitle */}
          <div className="h-6 overflow-hidden">
            {showTypewriter && (
              <p
                className="text-sm font-mono tracking-widest uppercase"
                style={{
                  color: "oklch(0.65 0.22 250 / 0.7)",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  borderRight: "2px solid oklch(0.65 0.22 250 / 0.7)",
                  width: "0",
                  animation:
                    "typewriterIn 2.5s steps(35, end) 0.1s forwards, cursorBlink 0.6s step-start 0.1s 6",
                }}
              >
                ⚡ SCANNING GLOBAL THREATS IN REAL-TIME...
              </p>
            )}
          </div>

          <p className="text-muted-foreground mt-2">
            Real-time global cyber threat intelligence. Data refreshes every 4
            seconds.
          </p>
        </div>

        {/* Threat Ticker — animated border */}
        <div
          className="fade-in-up ticker-border-wrap"
          style={{ animationDelay: "0.2s" }}
          data-ocid="threat-feed.ticker-container"
        >
          <div
            className="glass rounded-2xl overflow-hidden"
            style={{ height: "640px" }}
          >
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Threat Event Log
              </p>
              <span className="text-xs text-muted-foreground">
                Hover to pause
              </span>
            </div>
            <div
              className="overflow-hidden"
              style={{ height: "calc(100% - 57px)" }}
            >
              <div className="threat-ticker">
                {displayEntries.map((entry, idx) => {
                  const sev = severityConfig[entry.severity];
                  const typeColor = typeColors[entry.type];
                  const isNew = entry.id === newFlashId && idx < entries.length;
                  return (
                    <div
                      key={`${entry.id}-${idx}`}
                      className={`flex items-center gap-4 px-6 py-3 border-b border-border/40 hover:bg-primary/5 transition-colors${isNew ? " threat-flash-in" : ""}`}
                      style={{
                        transition: isNew ? undefined : "background 0.8s ease",
                      }}
                    >
                      <span
                        className="shrink-0 text-xs font-bold px-2.5 py-1 rounded font-mono w-24 text-center"
                        style={{
                          color: typeColor,
                          background: `${typeColor.replace(")", " / 0.12)")}`,
                          border: `1px solid ${typeColor.replace(")", " / 0.3)")}`,
                        }}
                      >
                        {entry.type}
                      </span>
                      <span
                        className="font-mono text-sm text-foreground truncate flex-1"
                        style={{ minWidth: 0 }}
                      >
                        {entry.source}
                      </span>
                      <span
                        className="shrink-0 text-xs font-black px-2.5 py-1 rounded-full tracking-widest"
                        style={{
                          color: sev.color,
                          background: sev.bg,
                          border: `1px solid ${sev.border}`,
                        }}
                      >
                        {sev.label}
                      </span>
                      <span className="shrink-0 text-sm text-muted-foreground hidden sm:flex items-center gap-1.5">
                        <span>{entry.flag}</span>
                        <span className="hidden md:inline">
                          {entry.country}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground font-mono w-16 text-right">
                        {formatTime(entry.minutesAgo)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
