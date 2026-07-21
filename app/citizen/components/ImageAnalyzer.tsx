"use client";

import { FormEvent, useEffect, useState } from "react";
import { FileImage, ImageIcon, Loader2, ScanSearch, ShieldAlert, Upload, X } from "lucide-react";

import type { ScoredAnalysis } from "../../../lib/types";

interface ImageAnalyzerProps {
  onAnalyzed: (analysis: ScoredAnalysis, incidentId?: string) => void;
}

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const acceptedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export default function ImageAnalyzer({ onAnalyzed }: ImageAnalyzerProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(imageFile);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);

  function selectImage(file: File | null) {
    if (!file) return;
    if (!acceptedTypes.has(file.type)) {
      setError("Please choose a JPEG, PNG, WebP, or GIF image.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("Images must be 10 MB or smaller.");
      return;
    }
    setImageFile(file);
    setError("");
  }

  function clearImage() {
    setImageFile(null);
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!imageFile) {
      setError("Choose a document or screenshot before analyzing it.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", imageFile);
      const response = await fetch("/api/analyze/image", { method: "POST", body: formData });
      const payload = (await response.json()) as {
        data?: { analysis?: ScoredAnalysis; incident?: { id?: string } };
        error?: string;
      };

      if (!response.ok || !payload.data?.analysis) {
        throw new Error(payload.error || "The image could not be analyzed.");
      }

      onAnalyzed(payload.data.analysis, payload.data.incident?.id);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to analyze this image right now.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass-panel rounded-3xl p-5 sm:p-6">
      <div className="flex gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-300">
          <FileImage className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-white">Check a document or screenshot</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">Upload a suspected warrant, notice, invoice, or other government-looking document.</p>
        </div>
      </div>

      <label className={`mt-6 flex min-h-64 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed px-5 text-center transition ${imageFile ? "border-blue-400/30 bg-blue-400/[0.04]" : "border-white/15 bg-white/[0.025] hover:border-blue-400/40 hover:bg-blue-400/[0.05]"}`}>
        {previewUrl ? (
          <div className="relative flex w-full flex-col items-center">
            <img src={previewUrl} alt="Selected document preview" className="max-h-64 max-w-full rounded-xl object-contain" />
            <span className="mt-4 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-slate-300">Choose another image</span>
          </div>
        ) : (
          <>
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.07] text-amber-300"><ImageIcon className="h-7 w-7" /></span>
            <span className="mt-4 text-sm font-medium text-slate-200">Drop an image here or browse</span>
            <span className="mt-1 text-xs text-slate-500">JPEG, PNG, WebP, or GIF · max 10 MB</span>
          </>
        )}
        <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" onChange={(event) => selectImage(event.target.files?.[0] ?? null)} />
      </label>

      {imageFile && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Upload className="h-4 w-4 shrink-0 text-blue-300" />
            <div className="min-w-0">
              <p className="truncate text-sm text-slate-200">{imageFile.name}</p>
              <p className="text-xs text-slate-500">{(imageFile.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>
          <button type="button" onClick={clearImage} className="focus-ring rounded-lg p-2 text-slate-500 hover:bg-white/10 hover:text-white" aria-label="Remove image">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="mt-5 flex flex-col gap-4 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-600">The analysis checks visible seals, names, URLs, demands, and forgery indicators.</p>
        <button type="submit" disabled={isLoading || !imageFile} className="focus-ring button-primary inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanSearch className="h-4 w-4" />}
          {isLoading ? "Checking document..." : "Analyze image"}
        </button>
      </div>

      {error && (
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-400/[0.07] p-4 text-sm text-red-200" role="alert">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </form>
  );
}
