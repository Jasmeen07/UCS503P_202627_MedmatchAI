"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  HeartPulse, 
  RefreshCw, 
  Plus, 
  X, 
  ShieldAlert, 
  Pill, 
  Clock, 
  Utensils, 
  Sparkles, 
  ExternalLink,
  ChevronRight,
  Stethoscope,
  Filter
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { 
  analyzePrescriptionInteractions, 
  resolveDrugProfile, 
  DrugProfile, 
  InteractionResult, 
  InteractionAnalysisSummary 
} from "@/lib/drug-interactions";

const DEFAULT_BASE_MEDS = [
  "Metformin", 
  "Glimepiride", 
  "Atorvastatin", 
  "Pregabalin", 
  "Cetirizine"
];

const SUGGESTED_QUICK_ADD = [
  { name: "Aspirin", desc: "Antiplatelet / Pain" },
  { name: "Warfarin", desc: "Anticoagulant" },
  { name: "Omeprazole", desc: "Proton Pump Inhibitor" },
  { name: "Ciprofloxacin", desc: "Fluoroquinolone" },
  { name: "Clarithromycin", desc: "Macrolide" },
  { name: "Sildenafil", desc: "PDE5 Inhibitor" },
  { name: "Spironolactone", desc: "K-Sparing Diuretic" },
  { name: "Lisinopril", desc: "ACE Inhibitor" },
  { name: "Fimasartan", desc: "Novel ARB (INN Stem test)" },
  { name: "Dolo 650", desc: "Paracetamol Brand" },
  { name: "Augmentin", desc: "Amoxicillin Brand" }
];

export default function InsightsPage() {
  const [activeMeds, setActiveMeds] = useState<string[]>(DEFAULT_BASE_MEDS);
  const [scannedSourceMeds, setScannedSourceMeds] = useState<string[]>(DEFAULT_BASE_MEDS);
  const [hasScanned, setHasScanned] = useState(false);
  const [newMedInput, setNewMedInput] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "critical" | "moderate" | "food" | "timing">("all");
  const [lastAddedProfile, setLastAddedProfile] = useState<DrugProfile | null>(null);

  // Load medications from stored prescriptions in localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("medmatch_prescriptions");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setHasScanned(true);
          const scannedMeds: string[] = [];
          for (const rx of parsed) {
            if (Array.isArray(rx.medicines)) {
              for (const m of rx.medicines) {
                const name = m.medicine_name || m.name;
                if (name && typeof name === "string") {
                  scannedMeds.push(name.trim());
                }
              }
            }
          }
          if (scannedMeds.length > 0) {
            const combined = Array.from(new Set([...scannedMeds]));
            setScannedSourceMeds(combined);
            setActiveMeds(combined);
          }
        }
      }
    } catch (e) {
      console.warn("Could not read stored prescriptions for insights:", e);
    }
  }, []);

  // Compute full clinical interaction summary dynamically
  const summary: InteractionAnalysisSummary = useMemo(() => {
    return analyzePrescriptionInteractions(activeMeds);
  }, [activeMeds]);

  // Handle adding a medication
  const handleAddMed = (drugName: string) => {
    const trimmed = drugName.trim();
    if (!trimmed) return;
    if (activeMeds.some(m => m.toLowerCase() === trimmed.toLowerCase())) {
      setNewMedInput("");
      return;
    }
    const profile = resolveDrugProfile(trimmed);
    setLastAddedProfile(profile);
    setActiveMeds(prev => [...prev, trimmed]);
    setNewMedInput("");
  };

  // Handle removing a medication
  const handleRemoveMed = (medToRemove: string) => {
    setActiveMeds(prev => prev.filter(m => m.toLowerCase() !== medToRemove.toLowerCase()));
  };

  // Reset to scanned prescriptions
  const handleReset = () => {
    setActiveMeds(scannedSourceMeds);
    setLastAddedProfile(null);
  };

  // Filtered interactions based on active tab
  const filteredInteractions = useMemo(() => {
    if (activeTab === "critical") {
      return summary.interactions.filter(i => i.severity === "critical");
    }
    if (activeTab === "moderate") {
      return summary.interactions.filter(i => i.severity === "moderate" || i.severity === "minor");
    }
    return summary.interactions;
  }, [summary.interactions, activeTab]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <PageHeader 
        title="Clinical Health Insights" 
        subtitle="Automated pharmacology screening & interaction prediction engine"
        action={
          <button 
            onClick={handleReset}
            className="dash-btn-secondary bg-[var(--dash-surface)] flex items-center gap-2 hover:bg-[var(--dash-surface-warm)] transition-colors text-sm px-3 py-2 rounded-lg border border-[var(--dash-border)]"
            title="Reset to scanned prescriptions"
          >
            <RefreshCw className="w-4 h-4 text-[var(--dash-sage)]" /> Reset to Prescriptions
          </button>
        }
      />

      {/* EXECUTIVE INTERACTION SUMMARY BANNER */}
      <div className="dash-card overflow-hidden bg-gradient-to-br from-[var(--dash-surface)] via-[var(--dash-sage-bg)]/40 to-[var(--dash-surface)] border border-[var(--dash-sage-light)] rounded-2xl shadow-sm">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[var(--dash-border)]/60">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[var(--dash-sage)] text-white flex items-center justify-center shadow-md shadow-[var(--dash-sage)]/20">
                  <HeartPulse className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[var(--dash-text)] tracking-tight">Regimen Safety Summary</h2>
                  <p className="text-sm text-[var(--dash-text-secondary)]">
                    Cross-referenced with clinical pharmacology databases & INN predictive models
                  </p>
                </div>
              </div>
            </div>

            {/* Overall Score Dial */}
            <div className="flex items-center gap-4 bg-[var(--dash-surface)]/90 backdrop-blur border border-[var(--dash-border)] rounded-2xl p-4 shadow-sm">
              <div className="text-center px-2">
                <div className="text-xs uppercase tracking-wider font-semibold text-[var(--dash-text-tertiary)] mb-0.5">Safety Index</div>
                <div className={`text-3xl font-extrabold ${
                  summary.safetyScore >= 85 
                    ? "text-emerald-600 dark:text-emerald-400" 
                    : summary.safetyScore >= 65 
                    ? "text-amber-600 dark:text-amber-400" 
                    : "text-rose-600 dark:text-rose-400"
                }`}>
                  {summary.safetyScore}<span className="text-lg font-medium text-[var(--dash-text-tertiary)]">/100</span>
                </div>
              </div>
              <div className="h-10 w-px bg-[var(--dash-border)]" />
              <div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  summary.safetyRating === "Safe" 
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                    : summary.safetyRating === "Low Risk"
                    ? "bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20"
                    : summary.safetyRating === "Moderate Risk"
                    ? "bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20"
                    : "bg-rose-500/10 text-rose-800 dark:text-rose-300 border border-rose-500/20"
                }`}>
                  {summary.safetyRating === "Critical Risk" && <ShieldAlert className="w-3.5 h-3.5" />}
                  {summary.safetyRating === "Moderate Risk" && <AlertTriangle className="w-3.5 h-3.5" />}
                  {(summary.safetyRating === "Safe" || summary.safetyRating === "Low Risk") && <CheckCircle2 className="w-3.5 h-3.5" />}
                  {summary.safetyRating}
                </span>
                <p className="text-xs text-[var(--dash-text-secondary)] mt-1 font-medium">
                  {summary.pairsChecked} pair combinations evaluated
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stat Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <div className="p-3.5 rounded-xl bg-[var(--dash-surface)] border border-[var(--dash-border)]/70">
              <div className="text-xs text-[var(--dash-text-secondary)] font-medium">Active Drugs</div>
              <div className="text-2xl font-bold text-[var(--dash-text)] mt-1">{summary.totalMeds}</div>
            </div>
            <div className="p-3.5 rounded-xl bg-[var(--dash-surface)] border border-[var(--dash-border)]/70">
              <div className="text-xs text-[var(--dash-text-secondary)] font-medium">Combinations Screened</div>
              <div className="text-2xl font-bold text-[var(--dash-text)] mt-1">{summary.pairsChecked}</div>
            </div>
            <div className={`p-3.5 rounded-xl border ${
              summary.criticalCount > 0 
                ? "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300" 
                : "bg-[var(--dash-surface)] border-[var(--dash-border)]/70 text-[var(--dash-text)]"
            }`}>
              <div className="text-xs font-medium">Critical Contraindications</div>
              <div className="text-2xl font-bold mt-1">{summary.criticalCount}</div>
            </div>
            <div className={`p-3.5 rounded-xl border ${
              summary.moderateCount > 0 
                ? "bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300" 
                : "bg-[var(--dash-surface)] border-[var(--dash-border)]/70 text-[var(--dash-text)]"
            }`}>
              <div className="text-xs font-medium">Moderate / Mild Alerts</div>
              <div className="text-2xl font-bold mt-1">{summary.moderateCount + summary.minorCount}</div>
            </div>
          </div>

          {/* Actionable Summary Points */}
          <div className="mt-6 pt-4 border-t border-[var(--dash-border)]/60">
            <div className="space-y-2">
              {summary.actionableSummary.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-sm text-[var(--dash-text-secondary)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--dash-sage)] mt-2 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* INTERACTIVE DRUG CHECKER & NOVEL MEDICINE PREDICTION SANDBOX */}
      <div className="dash-card p-6 bg-[var(--dash-surface)] border border-[var(--dash-border)] rounded-2xl shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-bold text-[var(--dash-text)] flex items-center gap-2">
              <Pill className="w-5 h-5 text-[var(--dash-sage)]" />
              Active Medication Regimen & Novel Drug Tester
            </h3>
            <p className="text-sm text-[var(--dash-text-secondary)] mt-0.5">
              Add any prescription, OTC brand, or new generic. The engine automatically classifies unknown medicines using WHO INN pharmacological stem recognition.
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--dash-sage-bg)] text-[var(--dash-sage)] font-semibold border border-[var(--dash-sage-light)] self-start md:self-auto">
            Live Analysis
          </span>
        </div>

        {/* Input Box to Add Any Medicine */}
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleAddMed(newMedInput);
          }}
          className="flex gap-2 mb-4"
        >
          <div className="relative flex-1">
            <input 
              type="text"
              value={newMedInput}
              onChange={(e) => setNewMedInput(e.target.value)}
              placeholder="Type any medicine (e.g. Warfarin, Omeprazole, Sildenafil, or new -sartan, -pril)..."
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--dash-border)] bg-[var(--dash-bg)] text-[var(--dash-text)] placeholder-[var(--dash-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--dash-sage)] text-sm shadow-inner"
            />
          </div>
          <button
            type="submit"
            disabled={!newMedInput.trim()}
            className="dash-btn-primary px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            <Plus className="w-4 h-4" /> Add & Test
          </button>
        </form>

        {/* Real-time Novel Drug Recognition Feedback */}
        {lastAddedProfile && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="text-[var(--dash-text)]">
                Recognized <strong>{lastAddedProfile.name}</strong> as <strong className="text-emerald-700 dark:text-emerald-300">{lastAddedProfile.categoryLabel}</strong>
                {lastAddedProfile.detectionSource === "inn_stem_model" && (
                  <span className="ml-1.5 px-2 py-0.5 rounded bg-emerald-500/20 font-mono text-[10px] text-emerald-800 dark:text-emerald-200">
                    WHO INN Stem Inference
                  </span>
                )}
              </span>
            </div>
            <button 
              onClick={() => setLastAddedProfile(null)}
              className="text-[var(--dash-text-tertiary)] hover:text-[var(--dash-text)]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Quick Add Suggestion Pills */}
        <div className="mb-5">
          <div className="text-xs font-semibold text-[var(--dash-text-tertiary)] uppercase tracking-wider mb-2">
            Quick-Test Scenarios & Novel Molecules:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_QUICK_ADD.map((drug) => {
              const isAdded = activeMeds.some(m => m.toLowerCase() === drug.name.toLowerCase());
              return (
                <button
                  key={drug.name}
                  onClick={() => isAdded ? handleRemoveMed(drug.name) : handleAddMed(drug.name)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 ${
                    isAdded 
                      ? "bg-[var(--dash-sage-bg)] border-[var(--dash-sage)] text-[var(--dash-sage)] font-semibold"
                      : "bg-[var(--dash-surface-warm)]/60 hover:bg-[var(--dash-surface-warm)] border-[var(--dash-border)] text-[var(--dash-text-secondary)]"
                  }`}
                >
                  <span>{isAdded ? "✓" : "+"}</span>
                  <span className="font-medium">{drug.name}</span>
                  <span className="text-[10px] opacity-70">({drug.desc})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Regimen Chips */}
        <div>
          <div className="text-xs font-semibold text-[var(--dash-text-tertiary)] uppercase tracking-wider mb-2">
            Currently Monitored ({activeMeds.length} medications):
          </div>
          <div className="flex flex-wrap gap-2">
            {summary.analyzedProfiles.map((profile) => (
              <div 
                key={profile.name}
                className="group inline-flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-xl bg-[var(--dash-bg)] border border-[var(--dash-border)] shadow-sm hover:border-[var(--dash-sage)] transition-colors"
              >
                <div>
                  <span className="text-sm font-semibold text-[var(--dash-text)]">{profile.name}</span>
                  <span className="block text-[10px] text-[var(--dash-text-tertiary)]">{profile.categoryLabel}</span>
                </div>
                <button
                  onClick={() => handleRemoveMed(profile.name)}
                  className="w-5 h-5 rounded-md hover:bg-rose-500/10 hover:text-rose-600 flex items-center justify-center text-[var(--dash-text-tertiary)] transition-colors ml-1"
                  title={`Remove ${profile.name}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FILTER TABS */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--dash-border)] pb-2">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
            activeTab === "all"
              ? "bg-[var(--dash-sage)] text-white shadow-sm"
              : "text-[var(--dash-text-secondary)] hover:text-[var(--dash-text)] hover:bg-[var(--dash-surface-warm)]"
          }`}
        >
          All Findings ({summary.interactions.length})
        </button>

        <button
          onClick={() => setActiveTab("critical")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
            activeTab === "critical"
              ? "bg-rose-600 text-white shadow-sm"
              : "text-[var(--dash-text-secondary)] hover:text-[var(--dash-text)] hover:bg-[var(--dash-surface-warm)]"
          }`}
        >
          <ShieldAlert className="w-4 h-4" /> Critical Alerts ({summary.criticalCount})
        </button>

        <button
          onClick={() => setActiveTab("moderate")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
            activeTab === "moderate"
              ? "bg-amber-600 text-white shadow-sm"
              : "text-[var(--dash-text-secondary)] hover:text-[var(--dash-text)] hover:bg-[var(--dash-surface-warm)]"
          }`}
        >
          <AlertTriangle className="w-4 h-4" /> Moderate / Minor ({summary.moderateCount + summary.minorCount})
        </button>

        <button
          onClick={() => setActiveTab("food")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
            activeTab === "food"
              ? "bg-[var(--dash-sage)] text-white shadow-sm"
              : "text-[var(--dash-text-secondary)] hover:text-[var(--dash-text)] hover:bg-[var(--dash-surface-warm)]"
          }`}
        >
          <Utensils className="w-4 h-4" /> Food & Lifestyle ({summary.foodWarnings.length})
        </button>

        <button
          onClick={() => setActiveTab("timing")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
            activeTab === "timing"
              ? "bg-[var(--dash-sage)] text-white shadow-sm"
              : "text-[var(--dash-text-secondary)] hover:text-[var(--dash-text)] hover:bg-[var(--dash-surface-warm)]"
          }`}
        >
          <Clock className="w-4 h-4" /> Timing Optimizer ({summary.timingRecommendations.length})
        </button>
      </div>

      {/* TAB CONTENT: DRUG INTERACTIONS */}
      {(activeTab === "all" || activeTab === "critical" || activeTab === "moderate") && (
        <div className="space-y-4">
          {filteredInteractions.length === 0 ? (
            <div className="dash-card p-8 text-center border-l-[6px] border-l-emerald-500 bg-emerald-500/5 rounded-2xl">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400 mx-auto mb-3" />
              <h4 className="text-lg font-bold text-[var(--dash-text)]">
                {activeTab === "critical" 
                  ? "No Critical Contraindications Detected"
                  : activeTab === "moderate"
                  ? "No Moderate or Minor Warnings Detected"
                  : "All Clear — No Adverse Drug Interactions Detected"}
              </h4>
              <p className="text-sm text-[var(--dash-text-secondary)] max-w-xl mx-auto mt-1">
                Your currently selected {activeMeds.length} medications show no recognized cross-reactivity or pharmacological conflicts based on clinical matrices.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredInteractions.map((item) => {
                const isCritical = item.severity === "critical";
                const isModerate = item.severity === "moderate";

                return (
                  <div
                    key={item.id}
                    className={`dash-card p-6 border-l-[6px] rounded-2xl transition-all shadow-sm ${
                      isCritical
                        ? "border-l-rose-500 bg-rose-500/[0.04] border-rose-500/20"
                        : isModerate
                        ? "border-l-amber-500 bg-amber-500/[0.04] border-amber-500/20"
                        : "border-l-sky-500 bg-sky-500/[0.04] border-sky-500/20"
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                            isCritical
                              ? "bg-rose-500/20 text-rose-800 dark:text-rose-300"
                              : isModerate
                              ? "bg-amber-500/20 text-amber-800 dark:text-amber-300"
                              : "bg-sky-500/20 text-sky-800 dark:text-sky-300"
                          }`}>
                            {isCritical ? <ShieldAlert className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                            {item.severity} Risk
                          </span>

                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-[var(--dash-surface)] border border-[var(--dash-border)] text-[var(--dash-text-secondary)] font-mono">
                            {item.source === "direct_pair" && "Clinical Pair Database"}
                            {item.source === "class_rule" && "Pharmacological Class Model"}
                            {item.source === "predicted_novel_stem" && "WHO INN Predictive Stem Engine"}
                            {item.source === "cyp_interaction" && "CYP450 Metabolism Model"}
                          </span>

                          <span className="text-xs text-[var(--dash-text-tertiary)]">
                            Evidence: {item.evidenceLevel}
                          </span>
                        </div>

                        <h4 className="text-xl font-bold text-[var(--dash-text)]">
                          {item.drug1} <span className="text-[var(--dash-text-tertiary)] font-normal">+</span> {item.drug2}
                        </h4>
                        <div className="text-xs text-[var(--dash-text-secondary)] mt-0.5">
                          {item.drug1Class} <span className="text-[var(--dash-text-tertiary)]">interacts with</span> {item.drug2Class}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 mt-4 text-sm">
                      {/* Interaction Title */}
                      <div className="font-semibold text-[var(--dash-text)] text-base">
                        {item.title}
                      </div>

                      {/* Mechanism */}
                      <div className="p-3 rounded-xl bg-[var(--dash-surface)] border border-[var(--dash-border)]/60">
                        <span className="font-semibold text-[var(--dash-text)] block text-xs uppercase tracking-wide mb-1 text-[var(--dash-sage)]">
                          Biological Mechanism:
                        </span>
                        <p className="text-[var(--dash-text-secondary)] leading-relaxed">
                          {item.mechanism}
                        </p>
                      </div>

                      {/* Clinical Impact */}
                      <div className="p-3 rounded-xl bg-[var(--dash-surface)] border border-[var(--dash-border)]/60">
                        <span className="font-semibold text-[var(--dash-text)] block text-xs uppercase tracking-wide mb-1 text-rose-600 dark:text-rose-400">
                          Clinical Consequence:
                        </span>
                        <p className="text-[var(--dash-text-secondary)] leading-relaxed">
                          {item.clinicalEffect}
                        </p>
                      </div>

                      {/* Actionable Medical Recommendation */}
                      <div className="p-3.5 rounded-xl bg-[var(--dash-sage-bg)]/60 border border-[var(--dash-sage-light)]">
                        <span className="font-semibold text-[var(--dash-text)] block text-xs uppercase tracking-wide mb-1 text-[var(--dash-sage)]">
                          Clinical Action Plan:
                        </span>
                        <p className="text-[var(--dash-text)] font-medium leading-relaxed">
                          {item.management}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: FOOD & LIFESTYLE */}
      {activeTab === "food" && (
        <div className="space-y-4">
          {summary.foodWarnings.length === 0 ? (
            <div className="dash-card p-8 text-center border-l-[6px] border-l-emerald-500 bg-emerald-500/5 rounded-2xl">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400 mx-auto mb-3" />
              <h4 className="text-lg font-bold text-[var(--dash-text)]">No Dietary Conflicts Detected</h4>
              <p className="text-sm text-[var(--dash-text-secondary)] mt-1">
                None of your currently tracked medications have high-risk food or beverage interactions.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {summary.foodWarnings.map((fw, idx) => (
                <div key={idx} className="dash-card p-5 border border-[var(--dash-border)] rounded-2xl bg-[var(--dash-surface)] shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                      <Utensils className="w-5 h-5" />
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-[var(--dash-text)] text-base">
                          {fw.drug} <span className="text-[var(--dash-text-tertiary)] font-normal">+</span> {fw.warning.food}
                        </h4>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300">
                          {fw.warning.severity}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--dash-text-secondary)] leading-relaxed">
                        {fw.warning.effect}
                      </p>
                      <div className="text-xs font-medium text-[var(--dash-text)] bg-[var(--dash-bg)] p-2.5 rounded-lg mt-2 border border-[var(--dash-border)]">
                        <strong>Advice:</strong> {fw.warning.recommendation}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: TIMING OPTIMIZER */}
      {activeTab === "timing" && (
        <div className="space-y-4">
          <div className="dash-card p-6 bg-[var(--dash-surface)] border border-[var(--dash-border)] rounded-2xl shadow-sm">
            <h4 className="text-lg font-bold text-[var(--dash-text)] flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-[var(--dash-sage)]" />
              Chronotherapeutic Dosing Schedule
            </h4>
            <p className="text-sm text-[var(--dash-text-secondary)] mb-6">
              Optimal daily timing based on hepatic chronobiology, food absorption kinetics, and gastric mucosal protection.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {summary.timingRecommendations.map((t, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-[var(--dash-bg)] border border-[var(--dash-border)]">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-sm text-[var(--dash-text)]">{t.drug}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--dash-sage-bg)] text-[var(--dash-sage)] font-semibold">
                      Optimal Schedule
                    </span>
                  </div>
                  <p className="text-xs text-[var(--dash-text-secondary)] leading-relaxed">
                    {t.timing}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CLINICAL SUMMARY CHECKLIST FOR DOCTOR VISITS */}
      <div className="dash-card p-6 bg-gradient-to-r from-[var(--dash-surface-warm)]/40 to-[var(--dash-surface)] border border-[var(--dash-border)] rounded-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[var(--dash-sage)] text-white flex items-center justify-center">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[var(--dash-text)]">Doctor & Pharmacist Consultation Checklist</h3>
            <p className="text-xs text-[var(--dash-text-secondary)]">
              Key discussion points to bring to your next healthcare appointment
            </p>
          </div>
        </div>

        <ul className="space-y-2.5 text-sm text-[var(--dash-text)]">
          <li className="flex items-start gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--dash-sage)] mt-2 shrink-0" />
            <span>Verify whether your current dose of <strong>Atorvastatin</strong> requires liver enzyme or CPK monitoring if taken long-term.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--dash-sage)] mt-2 shrink-0" />
            <span>Confirm periodic eGFR (kidney function) and HbA1c tests every 3 to 6 months while on <strong>Metformin</strong>.</span>
          </li>
          {summary.criticalCount > 0 && (
            <li className="flex items-start gap-2.5 text-rose-700 dark:text-rose-300 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mt-2 shrink-0" />
              <span>Discuss substituting or closely timing the {summary.criticalCount} severe interaction pair(s) detected above.</span>
            </li>
          )}
          <li className="flex items-start gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--dash-sage)] mt-2 shrink-0" />
            <span>Inform your dentist and surgical providers about any anticoagulants, antiplatelets, or blood thinners before procedures.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
