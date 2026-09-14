/**
 * MedMatch AI - Client-side Authentication & Session Security Guard
 * 
 * Protects dashboard routes so only authenticated patients and medical providers
 * can view medical records, scanned prescriptions, and health insights.
 * 
 * Works with both Supabase Auth and persistent clinical user sessions.
 * Strictly zero secrets or hardcoded keys.
 */

import { createClient } from "./client";

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: "patient" | "doctor" | "pharmacy";
  loggedInAt: number;
}

const SESSION_KEY = "medmatch_user_session";

/**
 * Returns currently active user session from localStorage or null if unauthenticated.
 */
export function getUserSession(): UserSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && parsed.email) {
      return parsed as UserSession;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Persists an authenticated user session into local storage.
 */
export function setUserSession(session: UserSession): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (e) {
    console.warn("Failed to persist user session:", e);
  }
}

/**
 * Clears current session from both Supabase Auth and localStorage.
 */
export async function clearUserSession(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(SESSION_KEY);
    const supabase = createClient();
    await supabase.auth.signOut().catch(() => {});
  } catch (e) {
    console.warn("Error during session logout:", e);
  }
}

/**
 * Synchronously checks if a user session exists.
 */
export function isUserAuthenticated(): boolean {
  return getUserSession() !== null;
}

/**
 * Asynchronously verifies authentication against Supabase or local session.
 */
export async function verifyActiveSession(): Promise<UserSession | null> {
  // 1. Check local session first
  const local = getUserSession();
  if (local) return local;

  // 2. Check Supabase session
  try {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    if (data?.session?.user) {
      const u = data.session.user;
      const session: UserSession = {
        id: u.id,
        email: u.email || "patient@medmatch.org",
        name: u.user_metadata?.name || u.user_metadata?.username || (u.email ? u.email.split("@")[0] : "Patient"),
        role: (u.user_metadata?.role as any) || "patient",
        loggedInAt: Date.now()
      };
      setUserSession(session);
      return session;
    }
  } catch {
    // If Supabase is unreachable or placeholder, fall back to local
  }

  return null;
}

/**
 * Formats raw prescription IDs (such as legacy millisecond timestamps like rx-1789281902629)
 * into standard clinical reference format (e.g. RX-2026-2629).
 */
export function formatPrescriptionId(rawId?: string | number | null): string {
  if (!rawId) return "RX-2026-1001";
  const str = rawId.toString().trim();
  
  // If already formatted like RX-YYYY-XXXX
  if (/^RX-\d{4}-\d+/i.test(str)) {
    return str.toUpperCase();
  }

  // If starts with rx- followed by timestamp e.g. rx-1789281902629
  if (str.toLowerCase().startsWith("rx-")) {
    const digits = str.replace(/\D/g, "");
    const lastFour = digits.slice(-4) || "1001";
    return `RX-2026-${lastFour}`;
  }

  // If pure number like 1, 2, 3
  if (/^\d+$/.test(str)) {
    const padded = str.padStart(4, "0");
    return `RX-2026-${padded}`;
  }

  return `RX-${str.toUpperCase()}`;
}

/**
 * Generates a clean, professional medical reference code for new prescriptions.
 * e.g. RX-2026-8492
 */
export function generatePrescriptionId(): string {
  const year = new Date().getFullYear();
  const randomSeq = Math.floor(1000 + Math.random() * 9000);
  return `RX-${year}-${randomSeq}`;
}
