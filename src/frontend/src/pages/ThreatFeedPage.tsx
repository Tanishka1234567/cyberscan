import { useEffect, useRef, useState } from "react";

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
    color: "oklch(0.62 0.22 22)",
    bg: "oklch(0.62 0.22 22 / 0.12)",
    border: "oklch(0.62 0.22 22 / 0.35)",
    label: "CRITICAL",
  },
  High: {
    color: "oklch(0.70 0.18 48)",
    bg: "oklch(0.70 0.18 48 / 0.12)",
    border: "oklch(0.70 0.18 48 / 0.35)",
    label: "HIGH",
  },
  Medium: {
    color: "oklch(0.83 0.19 95)",
    bg: "oklch(0.83 0.19 95 / 0.12)",
    border: "oklch(0.83 0.19 95 / 0.35)",
    label: "MEDIUM",
  },
};

const typeColors: Record<ThreatType, string> = {
  Malware: "oklch(0.62 0.22 22)",
  Phishing: "oklch(0.70 0.18 48)",
  DDoS: "oklch(0.65 0.15 290)",
  Ransomware: "oklch(0.60 0.20 15)",
  Botnet: "oklch(0.62 0.13 265)",
  SQLi: "oklch(0.68 0.14 200)",
  "Zero-Day": "oklch(0.62 0.22 22)",
  "Brute Force": "oklch(0.73 0.16 162)",
};

function buildEntries(): ThreatEntry[] {
  return THREAT_DATA.map((d, i) => ({
    ...d,
    id: i,
    minutesAgo: i * 2 + 1,
  }));
}

function formatTime(minutesAgo: number): string {
  if (minutesAgo < 60) return `${minutesAgo} min ago`;
  const h = Math.floor(minutesAgo / 60);
  return `${h}h ago`;
}

export default function ThreatFeedPage() {
  const [entries, setEntries] = useState<ThreatEntry[]>(buildEntries);
  const [totalToday, setTotalToday] = useState(1247);
  const [newFlash, setNewFlash] = useState<number | null>(null);
  const tickerRef = useRef<HTMLDivElement>(null);

  // Increment counter and rotate entries every 4s
  useEffect(() => {
    const interval = setInterval(() => {
      setTotalToday((n) => n + Math.floor(Math.random() * 3) + 1);
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
        setNewFlash(updated[0].id);
        setTimeout(() => setNewFlash(null), 800);
        return updated;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const displayEntries = [...entries, ...entries]; // duplicate for seamless loop

  return (
    <main className="min-h-screen py-10 px-4 fade-in">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 fade-in-up">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs font-semibold text-muted-foreground tracking-widest uppercase">
              Global Intelligence
            </span>
          </div>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-foreground">
              Live Threat Feed
            </h1>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-red-500/30">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  background: "oklch(0.62 0.22 22)",
                  boxShadow: "0 0 8px oklch(0.62 0.22 22)",
                  animation: "pulse 1s ease-in-out infinite",
                }}
              />
              <span
                className="text-xs font-bold tracking-widest"
                style={{ color: "oklch(0.62 0.22 22)" }}
              >
                LIVE
              </span>
            </div>
          </div>
          <p className="text-muted-foreground mt-2">
            Real-time global cyber threat intelligence. Data refreshes every 4
            seconds.
          </p>
        </div>

        {/* Stats Bar */}
        <div
          className="grid grid-cols-3 gap-4 mb-8 fade-in-up"
          style={{ animationDelay: "0.1s" }}
        >
          {[
            {
              label: "Threats Today",
              value: totalToday.toLocaleString(),
              color: "oklch(0.62 0.22 22)",
              icon: "🚨",
            },
            {
              label: "Active Botnets",
              value: "847",
              color: "oklch(0.70 0.18 48)",
              icon: "🤖",
            },
            {
              label: "Countries Affected",
              value: "134",
              color: "oklch(0.89 0.21 118)",
              icon: "🌍",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="glass rounded-2xl p-5 flex flex-col gap-1"
              style={{ borderColor: `${stat.color.replace(")", " / 0.2)")}` }}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{stat.icon}</span>
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  {stat.label}
                </span>
              </div>
              <span
                className="text-2xl font-black font-mono"
                style={{
                  color: stat.color,
                  textShadow: `0 0 20px ${stat.color.replace(")", " / 0.5)")}`,
                }}
              >
                {stat.value}
              </span>
            </div>
          ))}
        </div>

        {/* Threat Ticker */}
        <div
          className="glass rounded-2xl overflow-hidden fade-in-up"
          style={{ animationDelay: "0.2s", height: "640px" }}
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
            <div ref={tickerRef} className="threat-ticker">
              {displayEntries.map((entry, idx) => {
                const sev = severityConfig[entry.severity];
                const typeColor = typeColors[entry.type];
                const isNew = entry.id === newFlash && idx < entries.length;
                return (
                  <div
                    key={`${entry.id}-${idx}`}
                    className="flex items-center gap-4 px-6 py-3 border-b border-border/40 hover:bg-white/5 transition-colors"
                    style={{
                      background: isNew
                        ? "oklch(0.62 0.22 22 / 0.08)"
                        : undefined,
                      transition: "background 0.8s ease",
                    }}
                  >
                    {/* Type badge */}
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

                    {/* Source */}
                    <span
                      className="font-mono text-sm text-foreground truncate flex-1"
                      style={{ minWidth: 0 }}
                    >
                      {entry.source}
                    </span>

                    {/* Severity */}
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

                    {/* Country */}
                    <span className="shrink-0 text-sm text-muted-foreground hidden sm:flex items-center gap-1.5">
                      <span>{entry.flag}</span>
                      <span className="hidden md:inline">{entry.country}</span>
                    </span>

                    {/* Time */}
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
    </main>
  );
}
