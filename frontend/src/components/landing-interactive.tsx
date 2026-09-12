"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Shield,
  Clock,
  UserCheck,
  CheckCircle,
  ArrowRight,
  Database,
  Lock,
  Search,
  Receipt,
  Sparkles,
  Scan,
  AlertTriangle,
  Stethoscope,
  Share2,
  CheckCheck,
  Layers,
  Activity,
  Play,
  RotateCcw,
} from "lucide-react";

export function LandingInteractive() {
  const [activePerspective, setActivePerspective] = useState<"patient" | "clinical">("patient");
  const [isSimulatingScan, setIsSimulatingScan] = useState(false);
  const [scanCompleted, setScanCompleted] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<string>("Muphyline 400");

  const runSimulation = () => {
    setIsSimulatingScan(true);
    setScanCompleted(false);
    setTimeout(() => {
      setIsSimulatingScan(false);
      setScanCompleted(true);
    }, 1800);
  };

  const resetSimulation = () => {
    setIsSimulatingScan(false);
    setScanCompleted(false);
    setSelectedCandidate("Muphyline 400");
  };

  return (
    <div className="space-y-20 py-8">
      {/* Hero Section */}
      <section className="px-6 text-center max-w-5xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md border border-teal-200 bg-teal-50 text-teal-900 dark:border-teal-800 dark:bg-teal-950/60 dark:text-teal-300 text-xs font-semibold tracking-wide">
          <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          <span>Next-Generation Clinical Record Architecture</span>
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-slate-950 dark:text-white max-w-4xl mx-auto leading-[1.12]">
          Digital Prescription Storage & Multimodal Healthcare AI
        </h1>

        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Digitize handwritten prescriptions, cross-verify cursive brand names with pharmacy receipts, organize chronic conditions into treatment groups, and run automated drug interaction checks.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white font-medium text-sm transition-all card-interactive w-full sm:w-auto shadow-sm"
          >
            Access Patient Portal
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#interactive-demo"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 font-medium text-sm transition-colors w-full sm:w-auto text-slate-700 dark:text-slate-300"
          >
            <Scan className="w-4 h-4 text-teal-600" />
            Try Live Scanner Demo
          </a>
        </div>
      </section>

      {/* Interactive Sliding Perspective Showcase (Inspired by Login Toggle Box) */}
      <section className="px-6 max-w-5xl mx-auto">
        <div className="text-center space-y-2 mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
            Interactive Dual Perspective
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            Switch between the patient management view and the clinical cross-verification workstation.
          </p>

          {/* Smooth Sliding Tab Controller */}
          <div className="inline-flex p-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 mt-4 relative">
            <button
              type="button"
              onClick={() => setActivePerspective("patient")}
              className={`relative z-10 px-5 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                activePerspective === "patient"
                  ? "text-white dark:text-slate-950 font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              Patient Management View
            </button>
            <button
              type="button"
              onClick={() => setActivePerspective("clinical")}
              className={`relative z-10 px-5 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                activePerspective === "clinical"
                  ? "text-white dark:text-slate-950 font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              Doctor & Pharmacist Cross-Verifier
            </button>

            {/* Sliding background pill with login-style easing */}
            <div
              className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-slate-900 dark:bg-slate-100 rounded-md transition-transform duration-300 ease-out z-0 ${
                activePerspective === "clinical"
                  ? "translate-x-full"
                  : "translate-x-0"
              }`}
            />
          </div>
        </div>

        {/* Perspective Content Card */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm transition-all">
          {activePerspective === "patient" ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div className="space-y-4 md:col-span-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950 px-2.5 py-1 rounded">
                  Patient Health Records
                </span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  Organize by Disease & Condition
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Instead of disconnected file uploads, group your prescriptions into Treatment Groups (e.g. Hypertension, Diabetes, Thyroid). The AI summarizes your continuous medication history and warns you of drug interactions.
                </p>
                <div className="pt-2 flex flex-col gap-2 text-xs text-slate-700 dark:text-slate-300 font-medium">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Real-time drug-drug interaction warning checks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Time-limited, revocable QR/link sharing with doctors</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Daily medication schedule with dosage reminders</span>
                  </div>
                </div>
              </div>

              {/* Patient Mockup Card */}
              <div className="md:col-span-2 border border-slate-200 dark:border-slate-800 rounded-lg p-5 bg-slate-50 dark:bg-slate-950/50 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      Active Treatment Group: Hypertension & Lipid Care
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    Dr. Lavanya • Apollo Clinic
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">Tab Stamlo 5mg</span>
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded">0-0-1</span>
                    </div>
                    <p className="text-slate-500 text-[11px]">Indication: Blood pressure management (Amlodipine)</p>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">Tab Avas 10mg</span>
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded">0-0-1</span>
                    </div>
                    <p className="text-slate-500 text-[11px]">Indication: Cholesterol lowering & arterial protection</p>
                  </div>
                </div>

                {/* AI Safety Banner */}
                <div className="p-2.5 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-200">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-600" />
                    <span>Zero adverse drug interactions detected across 4 active items</span>
                  </div>
                  <span className="font-mono text-[10px] font-semibold uppercase">Verified</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div className="space-y-4 md:col-span-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950 px-2.5 py-1 rounded">
                  Clinical Verification
                </span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  Multi-Source Pharmacy Cross-Check
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Doctor handwriting can be faint or cursive. By comparing the prescription against the printed pharmacy bill or medicine packaging strip, the system eliminates ambiguous guesswork and confirms exact brand names.
                </p>
                <div className="pt-2 flex flex-col gap-2 text-xs text-slate-700 dark:text-slate-300 font-medium">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-emerald-600" />
                    <span>Dual multimodal OCR verification</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Clinical context diagnosis-based class filtering</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCheck className="w-4 h-4 text-emerald-600" />
                    <span>Instant candidate brand replacement chips</span>
                  </div>
                </div>
              </div>

              {/* Clinical Verification Mockup */}
              <div className="md:col-span-2 border border-slate-200 dark:border-slate-800 rounded-lg p-5 bg-slate-50 dark:bg-slate-950/50 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {/* Left: Handwritten Doctor Slip */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 p-3 space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">1. Handwritten Slip</span>
                      <span className="text-[10px] text-amber-700 bg-amber-50 dark:bg-amber-950 px-1.5 py-0.5 rounded">Cursive Stroke</span>
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-800/80 p-2 rounded text-[11px] font-mono text-slate-500 italic">
                      "Tab. Mup... 400 1-0-1"
                    </div>
                    <p className="text-[10px] text-amber-700 dark:text-amber-400">
                      Ambiguity detected: Candidate match needed
                    </p>
                  </div>

                  {/* Right: Printed Pharmacy Bill */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 p-3 space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">2. Pharmacy Bill</span>
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded">Printed</span>
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-800/80 p-2 rounded text-[11px] font-mono text-slate-900 dark:text-slate-100">
                      "MUPHYLINE 400MG TAB - QTY 10"
                    </div>
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
                      Matched: 100% Cross-Verified
                    </p>
                  </div>
                </div>

                {/* Candidate replacement resolution */}
                <div className="p-3 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      Resolved: Muphyline 400mg (Doxofylline)
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Therapeutic Purpose: Bronchodilator / Chest congestion relief
                    </p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800 font-medium">
                    Verified
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Live Interactive Prescription Scanner Simulation */}
      <section id="interactive-demo" className="px-6 max-w-5xl mx-auto scroll-mt-24">
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/60 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Scan className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Live Scanner & Diagnosis-Assisted Candidate Demo
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Experience how the AI eliminates 90% of irrelevant drug classes when clinical context is supplied.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetSimulation}
                disabled={isSimulatingScan}
                className="px-3 py-1.5 text-xs font-medium border border-slate-300 dark:border-slate-700 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Demo
              </button>
              <button
                type="button"
                onClick={runSimulation}
                disabled={isSimulatingScan}
                className="px-4 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white rounded transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5" />
                {isSimulatingScan ? "Simulating Laser Scan..." : "Run Laser Scan"}
              </button>
            </div>
          </div>

          {/* Interactive Scanner Box with Laser Beam HUD */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            {/* Left: Document with Animated Laser Beam */}
            <div className="scan-hud-container border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 p-4 min-h-[300px] flex flex-col justify-between relative">
              <div className="scan-hud-grid"></div>

              {/* Animated Laser Beam when scanning */}
              {isSimulatingScan && <div className="scan-laser-beam"></div>}

              <div className="space-y-3 relative z-0">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-[11px] font-semibold uppercase text-slate-500">
                    Sample Doctor Slip • Sai Clinic
                  </span>
                  <span className="text-[10px] text-teal-700 dark:text-teal-300 font-mono">
                    Context: Chest Congestion & Cough
                  </span>
                </div>

                <div className="space-y-2 font-mono text-xs text-slate-700 dark:text-slate-300 leading-relaxed p-3 bg-slate-50 dark:bg-slate-900/60 rounded border border-slate-100 dark:border-slate-800">
                  <p className="text-slate-500 text-[11px]">Rx:</p>
                  <p>1. Tab Stamlo 5mg - 0-0-1 x 30 days</p>
                  <p className="text-amber-700 dark:text-amber-400 font-semibold">
                    2. Tab Mu... 400mg - 1-0-0 (Cursive cursive strokes)
                  </p>
                  <p>3. Tab Zifi 200mg - 1-0-1 x 5 days</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                <span>OCR Mode: Multimodal Gemini 3.6 Flash</span>
                <span>{isSimulatingScan ? "Analyzing..." : scanCompleted ? "Extracted" : "Ready"}</span>
              </div>
            </div>

            {/* Right: Decoded Structured Output with 1-Click Candidate Chips */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 p-4 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-3">
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    Decoded Structured Data
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300 font-medium">
                    3 Medications Detected
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  {/* Medicine 1 */}
                  <div className="p-2.5 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">Tab Stamlo 5mg</p>
                      <p className="text-[11px] text-slate-500">Schedule: 0-0-1 • Blood pressure regulation</p>
                    </div>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded font-medium">
                      Verified
                    </span>
                  </div>

                  {/* Medicine 2 with Interactive Candidates */}
                  <div className="p-2.5 rounded border border-amber-300 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                          {selectedCandidate}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Schedule: 1-0-0 • Respiratory bronchodilator
                        </p>
                      </div>
                      <span className="text-[10px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded font-medium">
                        Condition Matched
                      </span>
                    </div>

                    {/* Clickable Candidate Suggestion Chips */}
                    <div className="pt-1 border-t border-amber-200/60 dark:border-amber-800/60">
                      <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-teal-600" />
                        Click candidate to replace ambiguous brand:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {["Muphyline 400", "Mucolite", "Montair-LC"].map((cand) => (
                          <button
                            key={cand}
                            type="button"
                            onClick={() => setSelectedCandidate(cand)}
                            className={`px-2 py-0.5 text-[11px] rounded border transition-colors ${
                              selectedCandidate === cand
                                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold border-slate-900"
                                : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400"
                            }`}
                          >
                            {cand}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Medicine 3 */}
                  <div className="p-2.5 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">Tab Zifi 200mg</p>
                      <p className="text-[11px] text-slate-500">Schedule: 1-0-1 x 5 days • Bacterial infection</p>
                    </div>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded font-medium">
                      Verified
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 text-right">
                <Link
                  href="/login"
                  className="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline inline-flex items-center gap-1"
                >
                  Try this with your own prescription
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step Interactive Process Cards */}
      <section className="px-6 max-w-5xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
            How MedMatch AI Resolves Medical Records
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Three simple steps to digitize, verify, and monitor your continuous health profile.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="card-interactive border border-slate-200 dark:border-slate-800 rounded-xl p-6 bg-white dark:bg-slate-900 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-teal-50 dark:bg-teal-950 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-700 dark:text-teal-300 font-bold text-sm">
              01
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
              Capture Doctor's Slip
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Upload any photographed prescription slip. Gemini 3.6 multimodal vision reads the clinic letterhead, date, vitals, and all prescribed medications.
            </p>
          </div>

          <div className="card-interactive border border-slate-200 dark:border-slate-800 rounded-xl p-6 bg-white dark:bg-slate-900 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-bold text-sm">
              02
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
              Cross-Verify with Bill
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Take a photo of the printed pharmacy receipt or medicine strip packaging. The dual-document verifier matches cursive handwriting against clean printed text.
            </p>
          </div>

          <div className="card-interactive border border-slate-200 dark:border-slate-800 rounded-xl p-6 bg-white dark:bg-slate-900 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-800 dark:text-slate-200 font-bold text-sm">
              03
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
              Safety & History Sharing
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Prescriptions are organized into chronic condition groups with automated drug interaction checks. Grant secure, time-limited access to consulting physicians.
            </p>
          </div>
        </div>
      </section>

      {/* Security & Architecture Standards */}
      <section id="security" className="px-6 max-w-5xl mx-auto border-t border-slate-200 dark:border-slate-800 pt-12">
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-8 bg-slate-50 dark:bg-slate-900/40">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Data Isolation & Medical Privacy Standards
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Engineered in compliance with clinical record confidentiality practices.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2 text-xs">
            <div className="p-3 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 space-y-1">
              <p className="font-semibold text-slate-900 dark:text-slate-100">PostgreSQL Row-Level Security</p>
              <p className="text-slate-500">Records isolated at the database level for each authenticated user.</p>
            </div>
            <div className="p-3 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 space-y-1">
              <p className="font-semibold text-slate-900 dark:text-slate-100">AES-256 Storage Encryption</p>
              <p className="text-slate-500">Uploaded medical documents encrypted at rest and in transit (TLS 1.3).</p>
            </div>
            <div className="p-3 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 space-y-1">
              <p className="font-semibold text-slate-900 dark:text-slate-100">Revocable Access Grants</p>
              <p className="text-slate-500">Patients control doctor access with time-bounded tokens and instant revoke.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
