"use client";

import React, { useState, useEffect, useRef } from "react";
import jsQR from "jsqr";
import { 
  Camera, 
  Upload, 
  KeyRound, 
  X, 
  QrCode, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Sparkles,
  ExternalLink,
  ShieldCheck,
  VideoOff
} from "lucide-react";
import { 
  DoctorPatientRecord, 
  verifyAndConnectEmergencyQrPass 
} from "@/lib/patientData";

interface DoctorQrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (result: {
    patientRecord?: DoctorPatientRecord;
    token?: string;
    dossierUrl?: string;
    message: string;
  }) => void;
  doctorInfo?: {
    doctorId?: string;
    doctorName?: string;
    hospital?: string;
  };
}

export function DoctorQrScannerModal({
  isOpen,
  onClose,
  onScanSuccess,
  doctorInfo
}: DoctorQrScannerModalProps) {
  const [activeTab, setActiveTab] = useState<"camera" | "upload" | "manual">("camera");
  const [manualToken, setManualToken] = useState("");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    message: string;
    patientRecord?: DoctorPatientRecord;
    token?: string;
    dossierUrl?: string;
  } | null>(null);
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Play subtle confirmation beep via Web Audio API
  const playBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {}
  };

  // Stop camera media stream cleanly
  const stopCamera = () => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Start live webcam / camera stream
  const startCamera = async () => {
    stopCamera();
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError("Camera access is not supported by your browser or environment. Please use Image Upload or Manual Token.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
        scanVideoLoop();
      }
    } catch (err: any) {
      console.warn("Could not start camera:", err);
      const msg = err.name === "NotAllowedError"
        ? "Camera permission denied. Please allow camera permissions or upload a QR image."
        : "No functional camera found. Please use Image Upload or Manual Token.";
      setCameraError(msg);
    }
  };

  // Frame-by-frame continuous decoding loop
  const scanVideoLoop = () => {
    if (!videoRef.current || !canvasRef.current || !streamRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert"
        });

        if (code && code.data) {
          handleDetectedQr(code.data);
          return;
        }
      }
    }

    animFrameIdRef.current = requestAnimationFrame(scanVideoLoop);
  };

  // Handle successful QR detection
  const handleDetectedQr = (rawQrData: string) => {
    stopCamera();
    playBeep();
    setIsProcessing(true);

    try {
      const res = verifyAndConnectEmergencyQrPass(rawQrData, doctorInfo);
      setScanResult(res);
      if (res.success) {
        setTimeout(() => {
          onScanSuccess(res);
        }, 1200);
      }
    } catch (err: any) {
      setScanResult({
        success: false,
        message: err.message || "Failed to process emergency QR pass."
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle image upload from disk / screenshot
  const handleImageUpload = (file: File) => {
    if (!file) return;
    setIsProcessing(true);
    setScanResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setUploadedPreview(dataUrl);

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          setIsProcessing(false);
          setScanResult({ success: false, message: "Could not initialize image processing context." });
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "attemptBoth"
        });

        if (code && code.data) {
          handleDetectedQr(code.data);
        } else {
          setIsProcessing(false);
          setScanResult({
            success: false,
            message: "No QR code detected in this image. Make sure the QR code is clearly visible and well-lit, or enter the Emergency Token manually."
          });
        }
      };
      img.onerror = () => {
        setIsProcessing(false);
        setScanResult({ success: false, message: "Failed to read image file." });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  // Handle manual token submission
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualToken.trim()) return;
    setIsProcessing(true);
    setScanResult(null);

    try {
      const res = verifyAndConnectEmergencyQrPass(manualToken.trim(), doctorInfo);
      setScanResult(res);
      if (res.success) {
        playBeep();
        setTimeout(() => {
          onScanSuccess(res);
        }, 1000);
      }
    } catch (err: any) {
      setScanResult({
        success: false,
        message: err.message || "Failed to verify emergency token."
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Manage camera on modal open/close or tab change
  useEffect(() => {
    if (isOpen && activeTab === "camera" && !scanResult?.success) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab, scanResult?.success]);

  // Reset state when opening modal
  useEffect(() => {
    if (isOpen) {
      setScanResult(null);
      setUploadedPreview(null);
      setCameraError(null);
      setManualToken("");
      setIsProcessing(false);
      setActiveTab("camera");
    } else {
      stopCamera();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shadow-xs">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                <span>Emergency QR Pass Scanner</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                  Live Connect
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Instantly unlock patient medical vault from QR Pass or Token
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close scanner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-3 p-2 bg-slate-100/70 dark:bg-slate-800/50 m-4 rounded-xl gap-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("camera")}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "camera"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Live Camera</span>
          </button>

          <button
            type="button"
            onClick={() => {
              stopCamera();
              setActiveTab("upload");
            }}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "upload"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Image</span>
          </button>

          <button
            type="button"
            onClick={() => {
              stopCamera();
              setActiveTab("manual");
            }}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "manual"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Enter Token</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 pt-0 flex-1 overflow-y-auto space-y-4">
          {/* TAB 1: LIVE CAMERA VIEW */}
          {activeTab === "camera" && (
            <div className="space-y-3">
              <div className="relative aspect-square max-h-[320px] mx-auto rounded-2xl overflow-hidden bg-slate-950 border-2 border-indigo-500/40 shadow-inner flex items-center justify-center">
                {/* Live Video Feed */}
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Reticle HUD overlay */}
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                  <div className="w-48 h-48 border-2 border-dashed border-indigo-400/80 rounded-2xl relative shadow-lg">
                    {/* Corner Reticles */}
                    <span className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-indigo-400 rounded-tl" />
                    <span className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-indigo-400 rounded-tr" />
                    <span className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-indigo-400 rounded-bl" />
                    <span className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-indigo-400 rounded-br" />

                    {/* Animated Scanning Line */}
                    <div className="absolute inset-x-2 top-0 h-0.5 bg-gradient-to-r from-transparent via-teal-400 to-transparent shadow-[0_0_12px_#2dd4bf] animate-[bounce_2.5s_infinite]" />
                  </div>
                </div>

                {/* Camera Error Overlay */}
                {cameraError && (
                  <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center text-xs space-y-3">
                    <VideoOff className="w-10 h-10 text-rose-400" />
                    <p className="text-slate-300 font-medium">{cameraError}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={startCamera}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Retry Camera</span>
                      </button>
                      <button
                        onClick={() => setActiveTab("upload")}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs cursor-pointer"
                      >
                        Upload QR Image
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <p className="text-[11px] text-center text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>Scan the patient&apos;s <strong>Time-Limited Emergency QR Pass</strong> to unlock records</span>
              </p>
            </div>
          )}

          {/* TAB 2: UPLOAD IMAGE */}
          {activeTab === "upload" && (
            <div className="space-y-4">
              <label 
                htmlFor="qr-file-input"
                className="border-2 border-dashed border-indigo-200 dark:border-indigo-900 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 text-center cursor-pointer transition-all bg-indigo-50/20 dark:bg-indigo-950/20 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Upload Emergency QR Pass Screenshot
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Drag and drop or browse PNG, JPG, or WEBP image
                  </p>
                </div>
                <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs">
                  Choose Image
                </span>
                <input
                  id="qr-file-input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleImageUpload(e.target.files[0]);
                  }}
                  className="hidden"
                />
              </label>

              {uploadedPreview && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-between text-xs">
                  <span className="truncate text-slate-600 dark:text-slate-300 font-medium">
                    Image uploaded for scanning
                  </span>
                  <button
                    onClick={() => setUploadedPreview(null)}
                    className="text-slate-400 hover:text-slate-600 text-[11px] font-semibold"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MANUAL TOKEN INPUT */}
          {activeTab === "manual" && (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Emergency Pass Token or 6-Digit PIN
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EMG-1492-VLT or 882194"
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase tracking-wider"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                  Displayed directly beneath the patient&apos;s Emergency QR Pass in their sharing portal.
                </p>
              </div>

              <button
                type="submit"
                disabled={isProcessing || !manualToken.trim()}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Cryptographic Pass...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify &amp; Unlock Vault</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Result / Verification Banner */}
          {scanResult && (
            <div 
              className={`p-4 rounded-2xl border text-xs space-y-2 animate-in fade-in duration-200 ${
                scanResult.success
                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                  : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-200"
              }`}
            >
              <div className="flex items-start gap-2.5">
                {scanResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1 flex-1">
                  <p className="font-bold text-sm">
                    {scanResult.success ? "Emergency Pass Verified!" : "Verification Failed"}
                  </p>
                  <p className="leading-relaxed">{scanResult.message}</p>

                  {scanResult.success && scanResult.patientRecord && (
                    <div className="mt-3 p-3 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-emerald-200 dark:border-emerald-800/80 space-y-1.5 font-sans">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {scanResult.patientRecord.patientName}
                        </span>
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                          {scanResult.patientRecord.patientUid}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Blood Group: <strong>{scanResult.patientRecord.bloodGroup}</strong> • Allergies: <strong>{scanResult.patientRecord.allergiesSummary || "None"}</strong>
                      </div>
                    </div>
                  )}

                  {scanResult.success && (
                    <div className="pt-2 flex items-center gap-2">
                      <button
                        onClick={() => {
                          onScanSuccess(scanResult);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Open Patient Chart in Workstation</span>
                      </button>

                      {scanResult.dossierUrl && (
                        <a
                          href={scanResult.dossierUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Emergency Dossier View</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            <span>Encrypted HIPAA/ABDM Break-Glass Protocol</span>
          </span>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="px-3.5 py-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold cursor-pointer transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
