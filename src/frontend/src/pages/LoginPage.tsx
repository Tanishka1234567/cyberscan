import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActor } from "@/hooks/useActor";
import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2, Lock, Shield, Terminal } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

const NEON_BLUE = "oklch(0.65 0.22 250)";
const MAGENTA = "oklch(0.60 0.23 305)";

export default function LoginPage() {
  const { login } = useAuth();
  const { actor } = useActor();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!actor) return;
    setError("");
    setLoading(true);
    try {
      const result = await actor.authenticateUser(email, password);
      if (result.__kind__ === "success") {
        login(email, result.success);
        navigate({ to: "/" });
      } else if (result.__kind__ === "wrongPassword") {
        setError("Incorrect password. Please try again.");
      } else {
        setError("No account found with that email.");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16 relative overflow-hidden">
      {/* Cyberpunk grid background */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `linear-gradient(${NEON_BLUE} 1px, transparent 1px), linear-gradient(90deg, ${NEON_BLUE} 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />
      {/* Corner glow */}
      <div
        className="absolute top-0 left-0 w-96 h-96 pointer-events-none"
        style={{
          background: `radial-gradient(circle at top left, ${MAGENTA.replace(")", " / 0.06)")}, transparent 70%)`,
        }}
      />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{
              background: `${NEON_BLUE.replace(")", " / 0.1)")}`,
              border: `1px solid ${NEON_BLUE.replace(")", " / 0.4)")}`,
              boxShadow: `0 0 24px ${NEON_BLUE.replace(")", " / 0.2)")}`,
            }}
          >
            <Shield className="w-8 h-8" style={{ color: NEON_BLUE }} />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-1">
            <span style={{ color: NEON_BLUE }}>Access</span> Portal
          </h1>
          <p className="text-muted-foreground text-sm font-mono">
            &gt; authenticate to continue_
          </p>
        </div>

        <div
          className="glass-strong rounded-2xl p-8"
          style={{
            boxShadow: `0 0 40px ${NEON_BLUE.replace(")", " / 0.08)")}, 0 8px 32px rgba(0,0,0,0.4)`,
          }}
        >
          <div className="flex items-center gap-2 mb-6">
            <Terminal className="w-4 h-4" style={{ color: NEON_BLUE }} />
            <span className="text-xs font-mono" style={{ color: NEON_BLUE }}>
              LOGIN.SH
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm text-muted-foreground font-mono"
              >
                EMAIL_ADDRESS
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="user@domain.com"
                className="border-border font-mono placeholder:text-muted-foreground/40"
                style={{ background: "oklch(0.12 0.04 255 / 0.6)" }}
                data-ocid="login.input"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-sm text-muted-foreground font-mono"
              >
                PASSWORD
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="border-border font-mono"
                style={{ background: "oklch(0.12 0.04 255 / 0.6)" }}
                data-ocid="login.input"
              />
            </div>

            {error && (
              <div
                className="px-4 py-3 rounded-lg border text-sm font-mono"
                style={{
                  borderColor: "oklch(0.65 0.20 335 / 0.4)",
                  background: "oklch(0.65 0.20 335 / 0.08)",
                  color: "oklch(0.65 0.20 335)",
                }}
                data-ocid="login.error_state"
              >
                ⚠ {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full font-bold font-mono tracking-wider h-11"
              style={{
                background: NEON_BLUE,
                color: "oklch(0.08 0.02 250)",
                boxShadow: `0 0 16px ${NEON_BLUE.replace(")", " / 0.4)")}`,
              }}
              data-ocid="login.submit_button"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                  AUTHENTICATING...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" /> AUTHENTICATE
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border space-y-3 text-center">
            <Link
              to="/forgot-password"
              className="text-xs text-muted-foreground hover:text-primary transition-colors font-mono block"
              data-ocid="login.link"
            >
              &gt; forgot_password?
            </Link>
            <p className="text-xs text-muted-foreground font-mono">
              no_account?{" "}
              <Link
                to="/signup"
                className="hover:underline"
                style={{ color: MAGENTA }}
                data-ocid="login.link"
              >
                register_now
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
