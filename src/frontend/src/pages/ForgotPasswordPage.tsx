import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActor } from "@/hooks/useActor";
import { Link, useNavigate } from "@tanstack/react-router";
import { KeyRound, Loader2, RefreshCw, Terminal } from "lucide-react";
import { useState } from "react";

const NEON_BLUE = "oklch(0.65 0.22 250)";
const NEON_PINK = "oklch(0.65 0.20 335)";

type Step = "email" | "otp";

export default function ForgotPasswordPage() {
  const { actor } = useActor();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [demoOtp, setDemoOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!actor) return;
    setError("");
    setLoading(true);
    try {
      const result = await actor.requestPasswordReset(email);
      if (result.__kind__ === "success") {
        setDemoOtp(result.success);
        setStep("otp");
      } else if (result.__kind__ === "userNotFound")
        setError("No account found with that email.");
      else setError("Failed to generate OTP. Please try again.");
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!actor) return;
    setError("");
    setLoading(true);
    try {
      const result = await actor.verifyOtpAndResetPassword(
        email,
        otp,
        newPassword,
      );
      if (result.__kind__ === "success") {
        setSuccessMsg("Password reset successful! Redirecting to login...");
        setTimeout(() => navigate({ to: "/login" }), 2000);
      } else if (result.__kind__ === "invalidOtp")
        setError("Invalid OTP. Please check and try again.");
      else if (result.__kind__ === "otpExpired")
        setError("OTP has expired. Please request a new one.");
      else setError("User not found.");
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
          backgroundImage: `linear-gradient(${NEON_BLUE} 1px, transparent 1px), linear-gradient(90deg, ${NEON_BLUE} 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
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
            <KeyRound className="w-8 h-8" style={{ color: NEON_BLUE }} />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-1">
            <span style={{ color: NEON_BLUE }}>Reset</span> Password
          </h1>
          <p className="text-muted-foreground text-sm font-mono">
            {step === "email"
              ? "&gt; enter_registered_email_"
              : "&gt; enter_otp_and_new_password_"}
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
              RESET_PWD.SH
            </span>
            <span className="ml-auto text-xs font-mono text-muted-foreground">
              STEP {step === "email" ? "1" : "2"}/2
            </span>
          </div>

          {step === "email" && (
            <form onSubmit={handleRequestOtp} className="space-y-5">
              <div className="space-y-2">
                <Label
                  htmlFor="reset-email"
                  className="text-sm text-muted-foreground font-mono"
                >
                  REGISTERED_EMAIL
                </Label>
                <Input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="user@domain.com"
                  className="border-border font-mono placeholder:text-muted-foreground/40"
                  style={{ background: "oklch(0.12 0.04 255 / 0.6)" }}
                  data-ocid="forgot_password.input"
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
                  data-ocid="forgot_password.error_state"
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
                data-ocid="forgot_password.submit_button"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> SENDING
                    OTP...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" /> SEND OTP
                  </>
                )}
              </Button>
            </form>
          )}

          {step === "otp" && (
            <>
              {demoOtp && (
                <div
                  className="mb-5 px-4 py-4 rounded-xl"
                  style={{
                    border: `1px solid ${NEON_BLUE.replace(")", " / 0.5)")}`,
                    background: `${NEON_BLUE.replace(")", " / 0.05)")}`,
                    boxShadow: `0 0 16px ${NEON_BLUE.replace(")", " / 0.1)")}`,
                  }}
                  data-ocid="forgot_password.success_state"
                >
                  <p
                    className="text-xs font-mono mb-2"
                    style={{ color: NEON_BLUE }}
                  >
                    &gt; DEMO_MODE: OTP_GENERATED
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground font-mono">
                      Your OTP:
                    </span>
                    <span
                      className="text-2xl font-bold font-mono tracking-[0.3em]"
                      style={{
                        color: NEON_BLUE,
                        textShadow: `0 0 20px ${NEON_BLUE.replace(")", " / 0.8)")}`,
                      }}
                    >
                      {demoOtp}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono mt-2">
                    In production, this would be sent to your email.
                  </p>
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="otp"
                    className="text-sm text-muted-foreground font-mono"
                  >
                    OTP_CODE
                  </Label>
                  <Input
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    maxLength={6}
                    placeholder="000000"
                    className="border-border font-mono text-center tracking-[0.4em] text-xl placeholder:tracking-normal"
                    style={{ background: "oklch(0.12 0.04 255 / 0.6)" }}
                    data-ocid="forgot_password.input"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="new-password"
                    className="text-sm text-muted-foreground font-mono"
                  >
                    NEW_PASSWORD
                  </Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="border-border font-mono"
                    style={{ background: "oklch(0.12 0.04 255 / 0.6)" }}
                    data-ocid="forgot_password.input"
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
                    data-ocid="forgot_password.error_state"
                  >
                    ⚠ {error}
                  </div>
                )}
                {successMsg && (
                  <div
                    className="px-4 py-3 rounded-lg border text-sm font-mono"
                    style={{
                      borderColor: `${NEON_BLUE.replace(")", " / 0.4)")}`,
                      background: `${NEON_BLUE.replace(")", " / 0.1)")}`,
                      color: NEON_BLUE,
                    }}
                    data-ocid="forgot_password.success_state"
                  >
                    ✓ {successMsg}
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
                  data-ocid="forgot_password.submit_button"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                      RESETTING...
                    </>
                  ) : (
                    <>
                      <KeyRound className="mr-2 h-4 w-4" /> RESET PASSWORD
                    </>
                  )}
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setError("");
                    setDemoOtp("");
                  }}
                  className="w-full text-xs text-muted-foreground hover:text-primary font-mono transition-colors"
                  data-ocid="forgot_password.secondary_button"
                >
                  &lt; back_to_email
                </button>
              </form>
            </>
          )}

          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-xs text-muted-foreground font-mono">
              remembered_password?{" "}
              <Link
                to="/login"
                className="hover:underline"
                style={{ color: NEON_PINK }}
                data-ocid="forgot_password.link"
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
