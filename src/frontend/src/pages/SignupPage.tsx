import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActor } from "@/hooks/useActor";
import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2, Shield, Terminal, UserPlus } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

const NEON_BLUE = "oklch(0.65 0.22 250)";
const MAGENTA = "oklch(0.60 0.23 305)";

export default function SignupPage() {
  const { login } = useAuth();
  const { actor } = useActor();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!actor) return;
    setError("");
    setLoading(true);
    try {
      const result = await actor.createUser(email, username, password);
      if (result.__kind__ === "success") {
        login(email, username);
        navigate({ to: "/" });
      } else if (result.__kind__ === "duplicateEmail") {
        setError("An account with this email already exists.");
      } else if (result.__kind__ === "duplicateUsername") {
        setError("Username already taken. Choose another.");
      } else if (result.__kind__ === "invalidEmailFormat") {
        setError("Invalid email format.");
      } else if (result.__kind__ === "invalidUsernameLength") {
        setError("Username must be 3-20 characters.");
      } else if (result.__kind__ === "invalidPasswordLength") {
        setError("Password must be at least 8 characters.");
      } else {
        setError("Registration failed. Please try again.");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `linear-gradient(${MAGENTA} 1px, transparent 1px), linear-gradient(90deg, ${MAGENTA} 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />
      <div
        className="absolute bottom-0 right-0 w-96 h-96 pointer-events-none"
        style={{
          background: `radial-gradient(circle at bottom right, ${NEON_BLUE.replace(")", " / 0.06)")}, transparent 70%)`,
        }}
      />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{
              background: `${MAGENTA.replace(")", " / 0.1)")}`,
              border: `1px solid ${MAGENTA.replace(")", " / 0.4)")}`,
              boxShadow: `0 0 24px ${MAGENTA.replace(")", " / 0.2)")}`,
            }}
          >
            <UserPlus className="w-8 h-8" style={{ color: MAGENTA }} />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-1">
            <span style={{ color: MAGENTA }}>Create</span> Account
          </h1>
          <p className="text-muted-foreground text-sm font-mono">
            &gt; initialize_new_user_record_
          </p>
        </div>

        <div
          className="glass-strong rounded-2xl p-8"
          style={{
            boxShadow: `0 0 40px ${MAGENTA.replace(")", " / 0.08)")}, 0 8px 32px rgba(0,0,0,0.4)`,
          }}
        >
          <div className="flex items-center gap-2 mb-6">
            <Terminal className="w-4 h-4" style={{ color: MAGENTA }} />
            <span className="text-xs font-mono" style={{ color: MAGENTA }}>
              REGISTER.SH
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                data-ocid="signup.input"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="username"
                className="text-sm text-muted-foreground font-mono"
              >
                USERNAME
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="hacker_alias"
                className="border-border font-mono placeholder:text-muted-foreground/40"
                style={{ background: "oklch(0.12 0.04 255 / 0.6)" }}
                data-ocid="signup.input"
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
                data-ocid="signup.input"
              />
              <p className="text-xs text-muted-foreground font-mono">
                min 8 characters
              </p>
            </div>

            {error && (
              <div
                className="px-4 py-3 rounded-lg border text-sm font-mono"
                style={{
                  borderColor: "oklch(0.65 0.20 335 / 0.4)",
                  background: "oklch(0.65 0.20 335 / 0.08)",
                  color: "oklch(0.65 0.20 335)",
                }}
                data-ocid="signup.error_state"
              >
                ⚠ {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full font-bold font-mono tracking-wider h-11"
              style={{
                background: MAGENTA,
                color: "oklch(0.08 0.02 250)",
                boxShadow: `0 0 16px ${MAGENTA.replace(")", " / 0.4)")}`,
              }}
              data-ocid="signup.submit_button"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> CREATING
                  ACCOUNT...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" /> CREATE ACCOUNT
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-xs text-muted-foreground font-mono">
              already_registered?{" "}
              <Link
                to="/login"
                className="hover:underline"
                style={{ color: NEON_BLUE }}
                data-ocid="signup.link"
              >
                login_here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
