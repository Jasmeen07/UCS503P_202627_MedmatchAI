"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/client";
import { assetPath } from "@/lib/utils";

/* ── inline SVGs ─────────────────────────────────────────────── */
function IconMail() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}
function IconArrowLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });

    setLoading(false);

    if (resetError) {
      setError(resetError.message);
    } else {
      setSuccess(true);
    }
  }

  return (
    <div className="bg-mesh min-h-dvh flex flex-col items-center justify-center px-4 py-16">
      
      <div className="w-full max-w-md mb-6">
        <Link href="/login" className="inline-flex items-center gap-2 text-sm text-[var(--subtle)] hover:text-[var(--foreground)] transition-colors">
          <IconArrowLeft /> Back to login
        </Link>
      </div>

      <div className="glass w-full max-w-md rounded-3xl border border-[var(--border)] p-8 shadow-2xl">
        
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8 group cursor-pointer" onClick={() => router.push('/')}>
          <div className="w-10 h-10">
            <img src={assetPath("/logos/logo_light.png")} alt="MedMatch AI Logo" className="w-full h-full object-contain dark:hidden" />
            <img src={assetPath("/logos/logo_dark.png")} alt="MedMatch AI Logo" className="w-full h-full object-contain hidden dark:block" />
          </div>
          <span className="brand-name limelight-regular font-bold text-black dark:text-white" style={{ fontSize: '1.5rem' }}>MedMatch AI</span>
        </div>

        {success ? (
          <div className="text-center py-6 animate-fade-up">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 mb-6">
              <IconCheck />
            </div>
            <h1 className="text-2xl font-bold text-[var(--foreground)] mb-3">Check your email</h1>
            <p className="text-sm text-[var(--muted)] mb-8">
              We&apos;ve sent a password reset link to <span className="font-medium text-[var(--foreground)]">{email}</span>.
            </p>
            <Link href="/login" className="btn-brand w-full">Return to login</Link>
          </div>
        ) : (
          <div className="animate-fade-up">
            <h1 className="text-2xl font-bold text-[var(--foreground)] mb-1">Reset password</h1>
            <p className="text-sm text-[var(--muted)] mb-7">Enter your email and we&apos;ll send you a reset link.</p>

            {error && (
              <div className="mb-5 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div>
                <label htmlFor="reset-email" className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--subtle)]"><IconMail /></span>
                  <input
                    id="reset-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] pl-10 pr-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--subtle)] outline-none focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-500)]/20 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className="btn-brand w-full disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Sending link…" : "Send reset link"}
              </button>

              <div className="text-center mt-4">
                <button 
                  type="button" 
                  disabled
                  title="Coming soon"
                  className="text-sm text-[var(--subtle)] cursor-not-allowed bg-transparent border-none p-0"
                >
                  Reset via Phone Number
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
