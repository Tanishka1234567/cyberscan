import type { AiAnalysis } from "@/components/AiAnalysisPanel";
import { buildAiSectionHtml } from "@/components/AiAnalysisPanel";

export interface SavedReport {
  id: string;
  target: string;
  scanType: "url" | "dns" | "ip" | "phishing";
  timestamp: number;
  verdict: string;
  riskScore: number;
  downloadCount: number;
  aiAnalysis?: AiAnalysis;
  services?: Array<{
    name: string;
    status: string;
    details: string;
    safe: boolean;
  }>;
  dnsRecords?: Array<{
    type: string;
    host: string;
    pointsTo: string;
    ttl: string;
  }>;
  whoisInfo?: Record<string, string | boolean>;
  threatTypes?: string[];
  ipInfo?: {
    country: string;
    city: string;
    region?: string;
    isp: string;
    hostname: string;
    abuseScore: number;
    totalReports: number;
    lastReported?: string;
  };
}

const getKey = (email: string) => `cyberscan_reports_${email}`;

export function getReports(email: string): SavedReport[] {
  try {
    const raw = localStorage.getItem(getKey(email));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setReports(email: string, reports: SavedReport[]) {
  localStorage.setItem(getKey(email), JSON.stringify(reports));
}

export function saveReport(
  email: string,
  report: Omit<SavedReport, "id" | "downloadCount">,
): SavedReport {
  const reports = getReports(email);
  const newReport: SavedReport = {
    ...report,
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : Date.now().toString(),
    downloadCount: 0,
  };
  reports.unshift(newReport);
  // Keep max 50 reports
  setReports(email, reports.slice(0, 50));
  return newReport;
}

export function incrementDownloadCount(email: string, reportId: string): void {
  const reports = getReports(email);
  const idx = reports.findIndex((r) => r.id === reportId);
  if (idx !== -1) {
    reports[idx].downloadCount += 1;
    setReports(email, reports);
  }
}

export function getTotalDownloadCount(email: string): number {
  return getReports(email).reduce((acc, r) => acc + r.downloadCount, 0);
}

export function deleteReport(email: string, reportId: string): void {
  const reports = getReports(email).filter((r) => r.id !== reportId);
  setReports(email, reports);
}

export function printReport(report: SavedReport): void {
  const verdictColor =
    report.verdict === "SAFE"
      ? "#7ec832"
      : report.verdict === "SUSPICIOUS"
        ? "#e8a838"
        : "#e84838";

  const riskBarWidth = Math.min(100, report.riskScore);
  const riskBarColor =
    report.riskScore >= 70
      ? "#e84838"
      : report.riskScore >= 40
        ? "#e8a838"
        : "#7ec832";

  const servicesTable =
    (report.scanType === "url" ||
      report.scanType === "ip" ||
      report.scanType === "phishing") &&
    report.services &&
    report.services.length > 0
      ? `<table>
          <thead>
            <tr><th>Service</th><th>Status</th><th>Details</th></tr>
          </thead>
          <tbody>
            ${report.services
              .map(
                (s) =>
                  `<tr>
                    <td><strong>${s.name}</strong></td>
                    <td style="color:${s.safe ? "#7ec832" : "#e84838"};font-weight:700">${s.status}</td>
                    <td>${s.details}</td>
                  </tr>`,
              )
              .join("")}
          </tbody>
        </table>`
      : "";

  const dnsTable =
    report.scanType === "dns" &&
    report.dnsRecords &&
    report.dnsRecords.length > 0
      ? `<table>
          <thead>
            <tr><th>Type</th><th>Host</th><th>Points To</th><th>TTL</th></tr>
          </thead>
          <tbody>
            ${report.dnsRecords
              .map(
                (r) =>
                  `<tr>
                    <td><span class="badge">${r.type}</span></td>
                    <td class="mono">${r.host}</td>
                    <td class="mono">${r.pointsTo}</td>
                    <td>${r.ttl}s</td>
                  </tr>`,
              )
              .join("")}
          </tbody>
        </table>`
      : "";

  const whoisSection =
    report.scanType === "dns" && report.whoisInfo
      ? (() => {
          const wi = report.whoisInfo as Record<string, unknown>;
          const nameServers = Array.isArray(wi.nameServers)
            ? (wi.nameServers as string[])
            : [];
          const registrantCountry =
            typeof wi.registrantCountry === "string"
              ? wi.registrantCountry
              : "";
          const nsHtml =
            nameServers.length > 0
              ? `<ul style="margin:0;padding-left:16px;font-family:'Courier New',monospace;font-size:12px;">${nameServers.map((ns) => `<li>${ns}</li>`).join("")}</ul>`
              : "Not Available";
          const baseRows = Object.entries(wi)
            .filter(([k]) => k !== "nameServers" && k !== "registrantCountry")
            .map(
              ([k, v]) =>
                `<tr><td class="label">${k}</td><td>${String(v)}</td></tr>`,
            )
            .join("");
          return `<div class="section">
            <h3>WHOIS Information</h3>
            <table>
              <tbody>
                ${baseRows}
                ${registrantCountry ? `<tr><td class="label">registrantCountry</td><td>${registrantCountry}</td></tr>` : ""}
                <tr><td class="label">nameServers</td><td>${nsHtml}</td></tr>
              </tbody>
            </table>
          </div>`;
        })()
      : "";

  const ipInfoSection =
    report.scanType === "ip" && report.ipInfo
      ? `<div class="section">
          <h3>IP Intelligence</h3>
          <table>
            <tbody>
              <tr><td class="label">Country</td><td>${report.ipInfo.country}</td></tr>
              <tr><td class="label">City</td><td>${report.ipInfo.city}</td></tr>
              ${report.ipInfo.region ? `<tr><td class="label">Region / State</td><td>${report.ipInfo.region}</td></tr>` : ""}
              <tr><td class="label">ISP / Organization</td><td>${report.ipInfo.isp}</td></tr>
              <tr><td class="label">Hostname</td><td>${report.ipInfo.hostname || "—"}</td></tr>
              <tr><td class="label">Abuse Score</td><td>${report.ipInfo.abuseScore}%</td></tr>
              <tr><td class="label">Total Abuse Reports</td><td>${report.ipInfo.totalReports.toLocaleString()}</td></tr>
              ${report.ipInfo.lastReported ? `<tr><td class="label">Last Reported</td><td>${report.ipInfo.lastReported}</td></tr>` : ""}
            </tbody>
          </table>
        </div>`
      : "";

  const threatSection =
    report.threatTypes && report.threatTypes.length > 0
      ? `<div class="section">
          <h3>Threat Types Detected</h3>
          <div class="threats">
            ${report.threatTypes.map((t) => `<span class="threat-tag">${t}</span>`).join("")}
          </div>
        </div>`
      : "";

  const aiSection = buildAiSectionHtml(report.aiAnalysis);

  const reportTitle =
    report.scanType === "url"
      ? "URL Security Report"
      : report.scanType === "ip"
        ? "IP Reputation Report"
        : report.scanType === "phishing"
          ? "Phishing Detection Report"
          : "DNS & WHOIS Report";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>CyberScan Report — ${report.target}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #1a1a2e; padding: 40px; max-width: 900px; margin: 0 auto; }
    .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #7ec832; padding-bottom: 20px; margin-bottom: 30px; }
    .logo { font-size: 26px; font-weight: 900; letter-spacing: 0.08em; color: #0d1b2a; }
    .logo span { color: #7ec832; }
    .meta { text-align: right; font-size: 11px; color: #666; }
    .meta strong { display: block; font-size: 13px; color: #333; }
    .overview { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
    .card { background: #f4f8f0; border: 1px solid #dde8d0; border-radius: 10px; padding: 18px; }
    .card-label { font-size: 10px; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 8px; }
    .target { font-family: 'Courier New', monospace; font-size: 13px; word-break: break-all; color: #1a1a2e; background: #e8f0e0; padding: 10px; border-radius: 6px; }
    .verdict { display: inline-flex; align-items: center; gap: 8px; padding: 8px 18px; border-radius: 50px; font-weight: 900; font-size: 16px; letter-spacing: 0.1em; color: ${verdictColor}; border: 2px solid ${verdictColor}; background: ${verdictColor}18; }
    .risk-bar-wrap { margin-top: 8px; }
    .risk-score-num { font-size: 42px; font-weight: 900; color: ${riskBarColor}; line-height: 1; }
    .risk-bar { height: 10px; background: #e0e8d8; border-radius: 5px; margin-top: 8px; overflow: hidden; }
    .risk-bar-fill { height: 100%; width: ${riskBarWidth}%; background: ${riskBarColor}; border-radius: 5px; }
    .section { margin-bottom: 28px; }
    .section h3 { font-size: 12px; font-weight: 800; color: #7ec832; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 14px; padding-bottom: 8px; border-bottom: 1px solid #dde8d0; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    thead tr { background: #e8f0e0; }
    th { text-align: left; padding: 10px 14px; font-size: 10px; font-weight: 800; color: #555; text-transform: uppercase; letter-spacing: 0.08em; }
    td { padding: 9px 14px; border-bottom: 1px solid #eef2e8; }
    tr:last-child td { border-bottom: none; }
    .mono { font-family: 'Courier New', monospace; font-size: 12px; }
    .label { font-weight: 700; color: #444; min-width: 150px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 800; background: #7ec83220; color: #4a8010; border: 1px solid #7ec83240; font-family: 'Courier New', monospace; }
    .threats { display: flex; flex-wrap: wrap; gap: 8px; }
    .threat-tag { padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; background: #e8483818; color: #c03020; border: 1px solid #e8483840; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #dde8d0; font-size: 10px; color: #999; text-align: center; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">🛡 Cyber<span>Scan</span></div>
    <div class="meta">
      <strong>${reportTitle}</strong>
      Generated: ${new Date(report.timestamp).toLocaleString()}
    </div>
  </div>

  <div class="overview">
    <div class="card">
      <div class="card-label">Scan Target</div>
      <div class="target">${report.target}</div>
      <div style="margin-top:10px;font-size:11px;color:#888">
        Type: <strong>${report.scanType.toUpperCase()}</strong> &nbsp;|&nbsp;
        Date: <strong>${new Date(report.timestamp).toLocaleDateString()}</strong>
      </div>
    </div>
    <div class="card">
      <div class="card-label">Risk Score</div>
      <div class="risk-score-num">${report.riskScore}</div>
      <div class="risk-bar"><div class="risk-bar-fill"></div></div>
      <div style="margin-top:12px"><span class="verdict">${report.verdict || "N/A"}</span></div>
    </div>
  </div>

  ${threatSection}

  ${
    report.scanType === "url" && servicesTable
      ? `<div class="section"><h3>Engine Results</h3>${servicesTable}</div>`
      : ""
  }

  ${ipInfoSection}

  ${
    report.scanType === "ip" && servicesTable
      ? `<div class="section"><h3>Engine Results</h3>${servicesTable}</div>`
      : ""
  }

  ${
    report.scanType === "dns" && dnsTable
      ? `<div class="section"><h3>DNS Records</h3>${dnsTable}</div>`
      : ""
  }

  ${whoisSection}

  ${aiSection}

  <div class="footer">CyberScan Security Report &mdash; caffeine.ai &mdash; Report ID: ${report.id}</div>
</body>
</html>`;

  const win = window.open("", "_blank", "width=960,height=700");
  if (win) {
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
  }
}
