import { Brain, TrendingUp } from "lucide-react";

export interface AiAnalysis {
  confidence: number;
  riskLevel: string;
  verdict: string;
  explanation: string;
  available: boolean;
}

// Cyberpunk palette
const NEON_BLUE = "oklch(0.65 0.22 250)";
const NEON_PINK = "oklch(0.65 0.20 335)";
const MAGENTA = "oklch(0.60 0.23 305)";
const ORANGE = "oklch(0.70 0.18 48)";

const RISK_LEVEL_STYLES: Record<
  string,
  { bar: string; badge: string; text: string }
> = {
  Low: {
    bar: NEON_BLUE,
    badge: `${NEON_BLUE.replace(")", " / 0.12)")}`,
    text: NEON_BLUE,
  },
  Medium: {
    bar: ORANGE,
    badge: `${ORANGE.replace(")", " / 0.12)")}`,
    text: ORANGE,
  },
  High: {
    bar: MAGENTA,
    badge: `${MAGENTA.replace(")", " / 0.12)")}`,
    text: MAGENTA,
  },
  Critical: {
    bar: NEON_PINK,
    badge: `${NEON_PINK.replace(")", " / 0.12)")}`,
    text: NEON_PINK,
  },
};

function getRiskStyle(level: string) {
  return (
    RISK_LEVEL_STYLES[level] ?? {
      bar: "oklch(0.62 0.04 245)",
      badge: "oklch(0.62 0.04 245 / 0.12)",
      text: "oklch(0.62 0.04 245)",
    }
  );
}

interface Props {
  ai: AiAnalysis | null | undefined;
  isLoading?: boolean;
}

export default function AiAnalysisPanel({ ai, isLoading }: Props) {
  if (isLoading) {
    return (
      <div
        className="glass rounded-2xl overflow-hidden"
        data-ocid="ai_panel.loading"
        aria-busy="true"
        aria-label="Loading AI analysis"
      >
        <div className="px-6 py-4 border-b border-border flex items-center gap-2.5">
          <Brain
            className="h-4 w-4 animate-pulse"
            style={{ color: NEON_BLUE }}
          />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            AI Analysis
          </p>
          <span
            className="ml-auto text-xs px-2.5 py-0.5 rounded-full font-bold"
            style={{
              background: `${NEON_BLUE.replace(")", " / 0.10)")}`,
              color: NEON_BLUE,
              border: `1px solid ${NEON_BLUE.replace(")", " / 0.25)")}`,
            }}
          >
            Processing…
          </span>
        </div>
        <div className="p-6 space-y-4">
          {[80, 55, 100].map((w) => (
            <div
              key={w}
              className="h-4 rounded-md animate-pulse"
              style={{
                width: `${w}%`,
                background: "oklch(0.28 0.04 245 / 0.6)",
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!ai || !ai.available) {
    return null;
  }

  const style = getRiskStyle(ai.riskLevel);
  const confidencePct = Math.round(Math.max(0, Math.min(100, ai.confidence)));

  return (
    <div
      className="glass rounded-2xl overflow-hidden fade-in"
      data-ocid="ai_panel.result"
    >
      <div
        className="px-6 py-4 border-b border-border flex items-center gap-2.5"
        style={{
          borderBottom: `1px solid ${NEON_BLUE.replace(")", " / 0.15)")}`,
        }}
      >
        <Brain className="h-4 w-4" style={{ color: NEON_BLUE }} />
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          AI Analysis
        </p>
        <span
          className="ml-auto text-xs px-2.5 py-0.5 rounded-full font-bold"
          style={{
            background: `${NEON_BLUE.replace(")", " / 0.10)")}`,
            color: NEON_BLUE,
            border: `1px solid ${NEON_BLUE.replace(")", " / 0.25)")}`,
          }}
        >
          AI-Powered
        </span>
      </div>

      <div className="p-6 grid sm:grid-cols-3 gap-6">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            AI Verdict
          </p>
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-black tracking-wider self-start"
            data-ocid="ai_panel.verdict_badge"
            style={{
              background: style.badge,
              color: style.text,
              border: `1px solid ${style.text.replace(")", " / 0.4)")}`,
            }}
          >
            <Brain className="h-3.5 w-3.5" />
            {ai.verdict}
          </span>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Confidence
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2.5 rounded-full overflow-hidden bg-border/40">
              <div
                className="h-full rounded-full transition-all duration-700"
                data-ocid="ai_panel.confidence_bar"
                style={{
                  width: `${confidencePct}%`,
                  background: style.bar,
                  boxShadow: `0 0 8px ${style.bar.replace(")", " / 0.5)")}`,
                }}
              />
            </div>
            <span
              className="text-sm font-black tabular-nums min-w-[3ch] text-right"
              style={{ color: style.bar }}
            >
              {confidencePct}%
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-3 w-3 text-muted-foreground/60" />
            <span className="text-xs text-muted-foreground">
              Model confidence
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Risk Level
          </p>
          <span
            className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-black tracking-wider self-start"
            data-ocid="ai_panel.risk_badge"
            style={{
              background: style.badge,
              color: style.text,
              border: `1px solid ${style.text.replace(")", " / 0.4)")}`,
            }}
          >
            {ai.riskLevel.toUpperCase()}
          </span>
          <p className="text-xs text-muted-foreground">Categorical risk</p>
        </div>
      </div>

      {ai.explanation && (
        <div
          className="mx-6 mb-6 px-4 py-3 rounded-xl text-sm text-muted-foreground leading-relaxed"
          data-ocid="ai_panel.explanation"
          style={{
            background: "oklch(0.20 0.03 245 / 0.6)",
            border: `1px solid ${NEON_BLUE.replace(")", " / 0.12)")}`,
            borderLeft: `3px solid ${style.bar}`,
          }}
        >
          <span
            className="text-xs font-bold uppercase tracking-wider block mb-1.5"
            style={{ color: style.text }}
          >
            AI Explanation
          </span>
          {ai.explanation}
        </div>
      )}
    </div>
  );
}

export function parseAiAnalysis(
  data: Record<string, unknown>,
): AiAnalysis | null {
  if (!data.aiAnalysis) return null;
  const a = data.aiAnalysis as Record<string, unknown>;
  return {
    confidence:
      typeof a.confidence === "number"
        ? a.confidence
        : Number(a.confidence ?? 0),
    riskLevel: String(a.riskLevel ?? "Low"),
    verdict: String(a.verdict ?? ""),
    explanation: String(a.explanation ?? ""),
    available: Boolean(a.available),
  };
}

export function buildAiSectionHtml(ai: AiAnalysis | null | undefined): string {
  if (!ai?.available) return "";
  const colors: Record<string, string> = {
    Low: "#4a9eff",
    Medium: "#e8a838",
    High: "#c040e8",
    Critical: "#ff4488",
  };
  const c = colors[ai.riskLevel] ?? "#999";
  const pct = Math.round(Math.max(0, Math.min(100, ai.confidence)));
  return `
    <div class="section">
      <h3>🤖 AI Analysis</h3>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:14px">
        <div class="card" style="border-color:${c}33">
          <div class="card-label">AI Verdict</div>
          <div style="font-size:15px;font-weight:900;color:${c};letter-spacing:0.06em">${ai.verdict}</div>
        </div>
        <div class="card" style="border-color:${c}33">
          <div class="card-label">Confidence</div>
          <div style="font-size:24px;font-weight:900;color:${c};line-height:1">${pct}%</div>
          <div style="height:6px;background:#e0e8f8;border-radius:3px;margin-top:6px;overflow:hidden">
            <div style="height:100%;width:${pct}%;background:${c};border-radius:3px"></div>
          </div>
        </div>
        <div class="card" style="border-color:${c}33">
          <div class="card-label">Risk Level</div>
          <div style="font-size:15px;font-weight:900;color:${c};letter-spacing:0.06em">${ai.riskLevel.toUpperCase()}</div>
        </div>
      </div>
      ${ai.explanation ? `<div style="padding:12px 16px;border-radius:8px;background:#f4f8ff;border-left:3px solid ${c};font-size:13px;color:#333;line-height:1.6">${ai.explanation}</div>` : ""}
    </div>`;
}
