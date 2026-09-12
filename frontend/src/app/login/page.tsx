"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/client";
import { User as UserIcon, Stethoscope, Pill, Sun, Moon } from "lucide-react";
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
function IconArrowRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
  );
}
function IconArrowLeft() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
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

export default function AuthPage() {
  const router = useRouter();
  const supabase = createClient();

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
  const [step, setStep]         = useState<1 | 2>(1);
  const [role, setRole]         = useState<Role>("patient");
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  const pwStrong = regPassword.length >= 8 && /[A-Z]/.test(regPassword) && /[0-9]/.test(regPassword);
  const pwMatch  = regPassword === regConfirmPassword && regConfirmPassword.length > 0;

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

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });

    setLoginLoading(false);

    if (error) {
      setLoginError(error.message);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (!pwMatch) {
      setRegError("Passwords do not match");
      return;
    }
    if (!pwStrong) {
      setRegError("Password must be 8+ chars with a number and uppercase letter.");
      return;
    }

    setRegLoading(true);

    const { error } = await supabase.auth.signUp({
      email: regEmail,
      password: regPassword,
      options: {
        data: {
          username: regUsername,
          role: role,
        },
      },
    });

    setRegLoading(false);

    if (error) {
      setRegError(error.message);
    } else {
      setRegSuccess("Account created! Check your email to confirm, then sign in.");
      setTimeout(() => {
        setIsActive(false);
        setStep(1);
        setRegSuccess(null);
      }, 3000);
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
            <h1 style={{ marginBottom: "20px" }}>Login</h1>

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
                <button 
                  type="button" 
                  disabled
                  title="Coming soon"
                  className="text-[var(--foreground)] cursor-not-allowed bg-transparent border-none p-0 text-sm"
                >
                  Login with Phone Number
                </button>
              </div>
              <Link href="/forgot-password" style={{ marginLeft: "auto" }}>Forgot Password?</Link>
            </div>
            <button type="submit" className="btn" disabled={loginLoading}>
              {loginLoading ? "Logging in..." : "Login"}
            </button>
            <p style={{ marginTop: "15px" }}>or login with social platforms</p>
            <div className="social-icons">
              <button type="button" disabled title="Google OAuth coming soon" style={{ display: 'flex', gap: '8px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
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
                    {role === r.id && (
                      <span className="ml-auto w-5 h-5 rounded-full bg-gradient-to-br from-[var(--brand-500)] to-[var(--accent-500)] flex items-center justify-center text-white flex-shrink-0">
                        <IconCheck />
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="btn-brand w-full btn"
                style={{ height: '48px', color: 'white', border: 'none' }}
              >
                Continue <IconArrowRight />
              </button>
            </>
          ) : (
            <>
              <div className="relative w-full flex items-center justify-center mb-1">
                <button 
                  type="button" 
                  onClick={() => setStep(1)} 
                  className="absolute left-0 text-[var(--subtle)] hover:text-[var(--foreground)] transition-colors p-1 flex items-center justify-center rounded-full hover:bg-[var(--surface-raised)]"
                  aria-label="Go back"
                >
                  <IconArrowLeft />
                </button>
                <h1 className="text-2xl font-bold text-[var(--foreground)] m-0">Create account</h1>
              </div>
              <p className="text-sm text-[var(--muted)] mb-6 text-center">
                Signing up as a{" "}
                <button type="button" onClick={() => setStep(1)} className="text-[var(--brand-500)] font-medium hover:underline capitalize">{role}</button>
              </p>

              {regError && (
                <div className="mb-5 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {regError}
                </div>
              )}
              {regSuccess && (
                <div className="mb-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
                  {regSuccess}
                </div>
              )}

              <form onSubmit={handleRegister} noValidate className="space-y-4">
                {/* Username */}
                <div>
                  <label htmlFor="reg-username" className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Username</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--subtle)]"><IconUser /></span>
                    <input
                      id="reg-username"
                      type="text"
                      required
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                      placeholder="e.g. john_doe"
                      maxLength={32}
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] pl-10 pr-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--subtle)] outline-none focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-500)]/20 transition font-mono"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="reg-email" className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Email address</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--subtle)]"><IconMail /></span>
                    <input
                      id="reg-email"
                      type="email"
                      autoComplete="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="you@email.com"
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] pl-10 pr-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--subtle)] outline-none focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-500)]/20 transition"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="reg-password" className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Password</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--subtle)]"><IconLock /></span>
                    <input
                      id="reg-password"
                      type={showPw ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Min 8 chars, 1 uppercase, 1 number"
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] pl-10 pr-11 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--subtle)] outline-none focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-500)]/20 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--subtle)] hover:text-[var(--muted)] transition-colors"
                      aria-label={showPw ? "Hide password" : "Show password"}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      <IconEye off={showPw} />
                    </button>
                  </div>
                  {regPassword.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-2">
                      {[regPassword.length >= 8, /[A-Z]/.test(regPassword), /[0-9]/.test(regPassword)].map((ok, i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-all ${ok ? "bg-gradient-to-r from-[var(--brand-500)] to-[var(--accent-500)]" : "bg-[var(--border)]"}`} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Confirm */}
                <div>
                  <label htmlFor="reg-confirm" className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Confirm password</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--subtle)]"><IconLock /></span>
                    <input
                      id="reg-confirm"
                      type={showPw ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className={`w-full rounded-xl border bg-[var(--surface)] pl-10 pr-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--subtle)] outline-none focus:ring-2 transition ${
                        regConfirmPassword.length === 0 ? "border-[var(--border)] focus:border-[var(--brand-500)] focus:ring-[var(--brand-500)]/20" :
                        pwMatch ? "border-emerald-500/50 focus:border-emerald-500 focus:ring-emerald-500/20" :
                        "border-red-400/50 focus:border-red-400 focus:ring-red-400/20"
                      }`}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={regLoading}
                  className="btn w-full mt-4"
                  style={{ height: '48px', color: 'white', border: 'none' }}
                >
                  {regLoading ? "Creating account…" : (<>Create account <IconArrowRight /></>)}
                </button>
                
                <div style={{ marginTop: "15px", textAlign: 'center' }}>
                  <p>or register with social platforms</p>
                  <div className="social-icons">
                    <button type="button" disabled title="Google OAuth coming soon" style={{ display: 'flex', gap: '8px' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Google
                    </button>
                  </div>
                </div>

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
