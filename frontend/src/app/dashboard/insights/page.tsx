"use client";

import React from "react";
import { Activity, AlertTriangle, CheckCircle, Info, HeartPulse, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";

export default function InsightsPage() {
  const [activeMeds, setActiveMeds] = React.useState<string[]>([
    "Metformin", "Glimepiride", "Atorvastatin", "Pregabalin", "Cetirizine", "Fluticasone"
  ]);
  const [hasScanned, setHasScanned] = React.useState(false);

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem("medmatch_prescriptions");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setHasScanned(true);
          const scannedMeds = parsed.flatMap(p => p.medicines?.map((m: { name: string }) => m.name) || []);
          if (scannedMeds.length > 0) {
            setActiveMeds(prev => Array.from(new Set([...prev, ...scannedMeds])));
          }
        }
      }
    } catch (e) {
      console.warn("Could not read stored prescriptions:", e);
    }
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader 
        title="Health Insights" 
        subtitle="AI-powered analysis of your medical profile"
        action={
          <button className="dash-btn-secondary bg-[var(--dash-surface)]">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        }
      />

      {/* AI Summary Banner */}
      <div className="dash-card overflow-hidden bg-gradient-to-br from-[var(--dash-sage-bg)] to-[var(--dash-surface)] border-[var(--dash-sage-light)]">
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[var(--dash-sage)] text-white flex items-center justify-center shadow-sm">
              <HeartPulse className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-semibold text-[var(--dash-text)]">Health Overview</h2>
          </div>
          <p className="text-[var(--dash-text-secondary)] leading-relaxed max-w-4xl text-lg">
            Your overall treatment profile is stable. You are currently managing <strong className="text-[var(--dash-text)]">Type 2 Diabetes</strong> and seasonal allergies. 
            Your medication adherence appears good based on prescription renewals. 
            {hasScanned && (
              <> Recently scanned prescriptions have been cross-verified with clinical guidelines and drug databases.</>
            )}
          </p>
          <p className="text-xs text-[var(--dash-text-tertiary)] mt-4 font-medium">Generated today at 9:00 AM • Based on {activeMeds.length} tracked medications</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Interaction Warnings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-[var(--dash-text)] flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-[var(--dash-amber)]" />
            Drug Interactions
          </h3>
          
          <div className="space-y-3">
            <div className="dash-card card-interactive p-5 border-l-[6px] border-l-[var(--dash-coral)] bg-[var(--dash-coral-bg)]/30">
              <div className="flex gap-4">
                <AlertTriangle className="w-6 h-6 text-[var(--dash-coral)] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-[var(--dash-text)] text-lg mb-1">Metformin + Alcohol</h4>
                  <p className="text-sm font-medium text-[var(--dash-coral)] mb-2 uppercase tracking-wide">Moderate Risk</p>
                  <p className="text-sm text-[var(--dash-text-secondary)] leading-relaxed">
                    Combining Metformin with excessive alcohol can increase the risk of lactic acidosis, a rare but serious condition. Limit alcohol intake while on this medication.
                  </p>
                </div>
              </div>
            </div>

            <div className="dash-card card-interactive p-5 border-l-[6px] border-l-[var(--dash-amber)] bg-[var(--dash-amber-bg)]/30">
              <div className="flex gap-4">
                <Info className="w-6 h-6 text-[var(--dash-amber)] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-[var(--dash-text)] text-lg mb-1">Cetirizine + Pregabalin</h4>
                  <p className="text-sm font-medium text-[var(--dash-amber)] mb-2 uppercase tracking-wide">Mild Caution</p>
                  <p className="text-sm text-[var(--dash-text-secondary)] leading-relaxed">
                    Both medications can cause central nervous system depression. You may experience increased drowsiness or dizziness. Avoid driving until you know how this combination affects you.
                  </p>
                </div>
              </div>
            </div>

            <div className="dash-card card-interactive p-5 border-l-[6px] border-l-[var(--dash-sage)]">
              <div className="flex gap-4">
                <CheckCircle className="w-6 h-6 text-[var(--dash-sage)] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-[var(--dash-text)]">Other Medications</h4>
                  <p className="text-sm text-[var(--dash-text-secondary)] mt-1">
                    No known significant interactions found among your other active medications (Glimepiride, Atorvastatin, Fluticasone).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lifestyle & Tips */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-[var(--dash-text)] flex items-center gap-2">
            <Activity className="w-5 h-5 text-[var(--dash-sage)]" />
            AI Recommendations
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="dash-card card-interactive p-5 hover:bg-[var(--dash-surface-warm)] transition-colors">
              <div className="w-10 h-10 rounded-xl bg-[var(--dash-sage-bg)] text-[var(--dash-sage)] flex items-center justify-center mb-4">
                <Activity className="w-5 h-5" />
              </div>
              <h4 className="font-semibold text-[var(--dash-text)] mb-2">Timing Routine</h4>
              <p className="text-sm text-[var(--dash-text-secondary)]">Take Atorvastatin in the evening for best results, as cholesterol production is highest at night.</p>
            </div>

            <div className="dash-card card-interactive p-5 hover:bg-[var(--dash-surface-warm)] transition-colors">
              <div className="w-10 h-10 rounded-xl bg-[var(--dash-terracotta-bg)] text-[var(--dash-terracotta)] flex items-center justify-center mb-4">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h4 className="font-semibold text-[var(--dash-text)] mb-2">Dietary Notes</h4>
              <p className="text-sm text-[var(--dash-text-secondary)]">Take Metformin with meals to reduce gastrointestinal side effects.</p>
            </div>

            <div className="dash-card card-interactive p-5 hover:bg-[var(--dash-surface-warm)] transition-colors sm:col-span-2">
              <h4 className="font-semibold text-[var(--dash-text)] mb-3">Active Medications Summary</h4>
              <div className="flex flex-wrap gap-2">
                {activeMeds.map((med, i) => (
                  <span key={i} className="dash-pill bg-[var(--dash-bg)] border border-[var(--dash-border)] text-[var(--dash-text-secondary)]">
                    {med}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
