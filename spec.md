# CyberScan

## Current State
CyberScan has four pages: Landing, URL Scanner, DNS/WHOIS Lookup, and Scan History. Backend supports `scanUrl`, `lookupDns`, `getScanHistory`, `getHistoryEntryByTarget`. Dark navy + neon lime theme with matrix rain hero and glitch animations.

## Requested Changes (Diff)

### Add
- **Live Threat Feed page** (`/threat-feed`): Animated scrolling ticker of simulated recent global cyber threats. Entries include threat type (Malware, Phishing, DDoS, Ransomware, etc.), IP/domain, severity, country, and timestamp. Auto-scrolls continuously. Looks like a real-time security operations feed.
- **Attack Timeline Visualizer** on DNS/WHOIS page and URL Scanner page: After a scan, show a vertical timeline of simulated historical incidents for that domain/URL. Each incident has a date, type, severity badge, and short description. Gives the illusion of threat history over time.
- **Side-by-side URL Comparison page** (`/compare`): Two URL input fields. User scans both and results are shown in two adjacent panels. Each panel shows risk score gauge, verdict, threats found, and key metadata. A summary row highlights which URL is safer.
- **Scan Report PDF export**: On URL Scanner, DNS/WHOIS, and Compare pages, a "Download Report" button triggers a print-friendly styled report using `window.print()` with a dedicated print CSS class. Report includes logo, scan target, timestamp, risk score, verdict, and findings in a professional layout.

### Modify
- Navbar: Add links for "Threat Feed" and "Compare" pages.
- URL Scanner and DNS/WHOIS pages: Integrate Attack Timeline after results are shown.

### Remove
- Nothing removed.

## Implementation Plan
1. Add `ThreatFeedPage` with auto-scrolling animated threat entries (simulated data, 30+ entries cycling).
2. Add `ComparePage` with dual URL input and side-by-side result panels.
3. Add `AttackTimeline` component used in both scanner pages after results.
4. Add print CSS and "Download Report" button to scanner pages.
5. Update Navbar with new routes.
6. Update App.tsx routing.
