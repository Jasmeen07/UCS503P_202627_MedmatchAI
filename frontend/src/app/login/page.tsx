"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/client";
import { setUserSession, validateCredentials, registerNewAccount } from "@/lib/auth";
import { User as UserIcon, Stethoscope, Pill, Sun, Moon, ShieldCheck, Check } from "lucide-react";
import "./auth.css";

/* ── inline SVGs ─────────────────────────────────────────────── */
function IconMail() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}
function IconLock() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
function IconUser() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function IconEye({ off }: { off?: boolean }) {
  return off ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

const ROLES = [
  {
    id: "patient",
    label: "Patient",
    desc: "Manage your personal health records",
    icon: UserIcon,
  },
  {
    id: "doctor",
    label: "Doctor",
    desc: "Collaborate with patients",
    icon: Stethoscope,
  },
  {
    id: "pharmacy",
    label: "Pharmacy",
    desc: "Manage inventory and prescriptions",
    icon: Pill,
  },
] as const;

type Role = (typeof ROLES)[number]["id"];

function AuthFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const redirectParam = searchParams.get("redirect");
  let targetDestination = redirectParam ? decodeURIComponent(redirectParam) : "/dashboard";
  if (targetDestination.startsWith("/UCS503P_202627_MedmatchAI")) {
    targetDestination = targetDestination.slice("/UCS503P_202627_MedmatchAI".length) || "/dashboard";
  }

  // --- UI State ---
  const [isActive, setIsActive] = useState(false); // false = login, true = register
  const [theme, setTheme] = useState("light");

  // --- Login State ---
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState<string | null>(null);

  // --- Register State ---
  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<Role>("patient");
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  const pwStrong = regPassword.length >= 8 && /[A-Z]/.test(regPassword) && /[0-9]/.test(regPassword);
  const pwMatch = regPassword === regConfirmPassword && regConfirmPassword.length > 0;

  // Toggle Theme
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  // --- Handlers ---
  const handleMagicLink = async () => {
    setLoginError(null);
    setLoginSuccess(null);
    if (!loginEmail) {
      setLoginError("Please enter your email first to receive a magic link.");
      return;
    }
    setLoginLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: loginEmail,
    });
    setLoginLoading(false);
    if (error) {
      setLoginError(error.message);
    } else {
      setLoginSuccess("Magic link sent! Check your email to sign in.");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    const cleanEmail = loginEmail.trim().toLowerCase();
    const cleanPassword = loginPassword.trim();

    try {
      // 1. Primary check: validate credentials against registered accounts (instant & reliable)
      const localResult = validateCredentials(cleanEmail, cleanPassword);
      if (localResult.success && localResult.session) {
        // Attempt background Supabase sign-in without blocking the user
        try {
          const isPlaceholder = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");
          if (!isPlaceholder) {
            await supabase.auth.signInWithPassword({
              email: cleanEmail,
              password: cleanPassword,
            }).catch(() => {});
          }
        } catch {
          // ignore background Supabase errors
        }

        router.push(targetDestination);
        router.refresh();
        return;
      }

      // 2. Secondary check: If not matched in local registry, check Supabase
      const isPlaceholder = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");
      if (!isPlaceholder) {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password: cleanPassword,
          });

          if (!error && data?.user) {
            const newSession = {
              id: data.user.id,
              email: data.user.email || cleanEmail,
              name: data.user.user_metadata?.name || data.user.user_metadata?.username || cleanEmail.split("@")[0],
              role: (data.user.user_metadata?.role as any) || "patient",
              loggedInAt: Date.now()
            };
            setUserSession(newSession);

            // Cache credentials locally for future instant logins
            registerNewAccount({
              email: cleanEmail,
              password: cleanPassword,
              name: newSession.name,
              role: newSession.role
            });

            router.push(targetDestination);
            router.refresh();
            return;
          }
        } catch (supaErr) {
          console.warn("Supabase auth check:", supaErr);
        }
      }

      // 3. If neither succeeded, present clear and accurate error:
      // "Incorrect password. Please verify your password and try again." or
      // "No account found with this email address. Please register an account first."
      setLoginError(localResult.error || "Incorrect email or password. Please verify your credentials.");
    } catch (err: any) {
      setLoginError(err?.message || "Sign-in failed. Please verify credentials.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleDemoPatientLogin = () => {
    setUserSession({
      id: "usr-demo-patient",
      email: "patient@medmatch.com",
      name: "Jasmeen Kaur",
      role: "patient",
      loggedInAt: Date.now()
    });
    router.push(targetDestination);
    router.refresh();
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (!pwMatch) {
      setRegError("Passwords do not match.");
      return;
    }
    if (!pwStrong) {
      setRegError("Password must be 8+ chars with at least 1 uppercase letter and 1 number.");
      return;
    }

    setRegLoading(true);

    try {
      const cleanEmail = regEmail.trim().toLowerCase();
      const cleanPassword = regPassword.trim();
      const cleanName = regUsername.trim();

      // 1. Try Supabase signUp if available (non-blocking)
      const isPlaceholder = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");
      if (!isPlaceholder) {
        await supabase.auth.signUp({
          email: cleanEmail,
          password: cleanPassword,
          options: {
            data: {
              username: cleanName,
              role: role,
            },
          },
        }).catch(() => {});
      }

      // 2. Register account into local database with verified credentials
      const regResult = registerNewAccount({
        email: cleanEmail,
        password: cleanPassword,
        name: cleanName,
        role: role
      });

      if (!regResult.success) {
        setRegError(regResult.error || "Registration failed.");
        return;
      }

      setRegSuccess("Account registered successfully! Entering dashboard...");
      setTimeout(() => {
        router.push(targetDestination);
        router.refresh();
      }, 800);
    } catch (err: any) {
      setRegError(err?.message || "An error occurred during registration.");
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <header className="app-header">
        <Link href="/" className="brand">
          <img
            src={theme === "dark" ? "/logos/logo_dark.png" : "/logos/logo_light.png"}
            alt="MedMatch AI Logo"
            id="theme-logo"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <span className="brand-name limelight-regular font-bold text-black dark:text-white" style={{ fontSize: '1.5rem' }}>MedMatch AI</span>
        </Link>
        <button className="theme-toggle flex items-center justify-center" onClick={toggleTheme} aria-label="Toggle dark mode">
          {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>
      </header>

      <div className={`auth-container ${isActive ? "active" : ""}`}>
        {/* LOGIN FORM */}
        <div className="form-box login">
          <form onSubmit={handleLogin}>
            <h1 style={{ marginBottom: "15px" }}>Patient Sign In</h1>

            {redirectParam && (
              <div className="mb-3 rounded-lg border border-teal-500/30 bg-teal-500/10 px-3 py-2 text-xs text-teal-700 dark:text-teal-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-teal-600" />
                <span>Please sign in to access your protected medical dashboard.</span>
              </div>
            )}

            {loginError && (
              <div className="mb-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{loginError}</div>
            )}
            {loginSuccess && (
              <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">{loginSuccess}</div>
            )}

            <div className="input-box">
              <input
                type="email"
                placeholder="Email *"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
              />
            </div>
            <div className="input-box">
              <input
                type="password"
                placeholder="Password *"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
            </div>
            <div className="forgot-link" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "15px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-start" }}>
                <button 
                  type="button" 
                  onClick={handleMagicLink} 
                  disabled={loginLoading}
                  className="text-[var(--foreground)] hover:opacity-80 transition-opacity cursor-pointer bg-transparent border-none p-0 text-sm"
                >
                  Login with Email OTP
                </button>
              </div>
              <Link href="/forgot-password" style={{ marginLeft: "auto" }}>Forgot Password?</Link>
            </div>

            <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 leading-relaxed text-left">
              <span>Demo Login: <strong>patient@medmatch.com</strong> / <strong>Password123</strong></span>
            </div>

            <button type="submit" className="btn" disabled={loginLoading}>
              {loginLoading ? "Authenticating..." : "Sign In to Dashboard"}
            </button>

            {/* ONE-CLICK DEMO ACCESS FOR PATIENT EVALUATION */}
            <div className="mt-4 pt-3 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={handleDemoPatientLogin}
                className="w-full py-2.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <ShieldCheck className="w-4 h-4" />
                Continue as Verified Patient (Instant Sign-In)
              </button>
            </div>
          </form>
        </div>

        {/* REGISTER FORM */}
        <div className="form-box register px-8 py-10" style={{ textAlign: "left", display: "block" }}>
          <div className="flex items-center gap-2 mb-6 justify-center">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  s < step ? "bg-gradient-to-br from-[var(--brand-500)] to-[var(--accent-500)] text-white" :
                  s === step ? "bg-gradient-to-br from-[var(--brand-500)] to-[var(--accent-500)] text-white ring-4 ring-[var(--brand-500)]/20" :
                  "bg-[var(--surface-raised)] text-[var(--subtle)]"
                }`}>
                  {s < step ? <IconCheck /> : s}
                </div>
                {s < 2 && <div className={`h-px w-8 transition-all ${s < step ? "bg-[var(--brand-500)]" : "bg-[var(--border)]"}`} />}
              </div>
            ))}
            <span className="ml-2 text-xs text-[var(--subtle)]">Step {step} of 2</span>
          </div>

          {step === 1 ? (
            <>
              <h1 className="text-2xl font-bold text-[var(--foreground)] mb-1 text-center">Choose your role</h1>
              <p className="text-sm text-[var(--muted)] mb-6 text-center">This determines what you can access.</p>

              <div className="space-y-3 mb-8">
                {ROLES.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    id={`role-${r.id}`}
                    onClick={() => setRole(r.id)}
                    className={`w-full flex items-center gap-4 rounded-xl border p-4 text-left transition-all ${
                      role === r.id
                        ? "border-[var(--brand-500)] bg-[var(--brand-500)]/8 ring-2 ring-[var(--brand-500)]/20"
                        : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--brand-500)]/40"
                    }`}
                  >
                    <div className="w-9 h-9 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0">
                      <r.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-[var(--foreground)]">{r.label}</p>
                      <p className="text-xs text-[var(--muted)] mt-0.5">{r.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="btn w-full flex items-center justify-center gap-2"
                onClick={() => setStep(2)}
              >
                Continue
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1.5 text-xs text-[var(--subtle)] hover:text-[var(--foreground)] mb-4 transition-colors"
              >
                ← Back to role selection
              </button>

              <h1 className="text-2xl font-bold text-[var(--foreground)] mb-1">Create your account</h1>
              <p className="text-sm text-[var(--muted)] mb-6">
                Registering as a <span className="font-semibold text-[var(--brand-500)] capitalize">{role}</span>
              </p>

              {regError && (
                <div className="mb-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{regError}</div>
              )}
              {regSuccess && (
                <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">{regSuccess}</div>
              )}

              <form onSubmit={handleRegister}>
                <div className="input-box">
                  <input
                    type="text"
                    placeholder="Full Name *"
                    required
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                  />
                </div>
                <div className="input-box">
                  <input
                    type="email"
                    placeholder="Email *"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                  />
                </div>
                <div className="input-box" style={{ position: "relative" }}>
                  <input
                    type={showPw ? "text" : "password"}
                    placeholder="Password (8+ chars, 1 capital, 1 number) *"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    style={{ position: "absolute", right: "15px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}
                  >
                    <IconEye off={!showPw} />
                  </button>
                </div>
                <div className="input-box">
                  <input
                    type="password"
                    placeholder="Confirm Password *"
                    required
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn" disabled={regLoading}>
                  {regLoading ? "Registering..." : "Create Account"}
                </button>
              </form>
            </>
          )}
        </div>

        {/* TOGGLE PANEL */}
        <div className="toggle-box">
          <div className="toggle-panel toggle-left">
            <h1>Hello, Welcome!</h1>
            <p>Don't have an account?</p>
            <button className="btn register-btn" type="button" onClick={() => setIsActive(true)}>
              Register
            </button>
          </div>

          <div className="toggle-panel toggle-right">
            <h1>Welcome Back!</h1>
            <p>Already have an account?</p>
            <button className="btn login-btn" type="button" onClick={() => setIsActive(false)}>
              Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="auth-wrapper flex items-center justify-center h-screen bg-[#fbfdfc] dark:bg-[#0b1115]">
        <div className="p-8 text-center text-sm text-slate-500">
          Loading MedMatch Authentication...
        </div>
      </div>
    }>
      <AuthFormInner />
    </Suspense>
  );
}
