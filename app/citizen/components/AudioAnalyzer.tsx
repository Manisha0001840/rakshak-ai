"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { AudioLines, CircleStop, Loader2, Mic, Play, ShieldAlert, Upload, X } from "lucide-react";

import type { ScoredAnalysis } from "../../../lib/types";

interface AudioAnalyzerProps {
  onAnalyzed: (analysis: ScoredAnalysis, incidentId?: string) => void;
}

const MAX_AUDIO_BYTES = 15 * 1024 * 1024;

export default function AudioAnalyzer({ onAnalyzed }: AudioAnalyzerProps) {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (!audioFile) {
      setAudioUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(audioFile);
    setAudioUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [audioFile]);

  useEffect(() => {
    if (!isRecording) return;
    const timer = window.setInterval(() => setRecordingSeconds((seconds) => seconds + 1), 1000);
    return () => window.clearInterval(timer);
  }, [isRecording]);

  useEffect(() => {
    return () => mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  function setSelectedFile(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("audio/")) {
      setError("Please choose an audio file.");
      return;
    }
    if (file.size > MAX_AUDIO_BYTES) {
      setError("Audio files must be 15 MB or smaller.");
      return;
    }
    setAudioFile(file);
    setError("");
  }

  async function startRecording() {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Microphone recording is not supported in this browser. Upload an audio file instead.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      mediaStreamRef.current = stream;
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const type = recorder.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        setSelectedFile(new File([blob], `rakshak-recording-${Date.now()}.webm`, { type }));
        stream.getTracks().forEach((track) => track.stop());
      };
      recorder.start();
      setRecordingSeconds(0);
      setIsRecording(true);
    } catch {
      setError("Microphone access was not available. Check browser permissions or upload a recording instead.");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
    setIsRecording(false);
  }

  function clearFile() {
    setAudioFile(null);
    setRecordingSeconds(0);
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!audioFile) {
      setError("Upload a recording or record a call before analyzing it.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", audioFile);
      formData.append("locale", "auto");
      const response = await fetch("/api/analyze/audio", { method: "POST", body: formData });
      const payload = (await response.json()) as {
        data?: { analysis?: ScoredAnalysis; incident?: { id?: string } };
        error?: string;
      };

      if (!response.ok || !payload.data?.analysis) {
        throw new Error(payload.error || "The recording could not be analyzed.");
      }

      onAnalyzed(payload.data.analysis, payload.data.incident?.id);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to analyze this recording right now.");
    } finally {
      setIsLoading(false);
    }
  }

  const formattedTime = `${String(Math.floor(recordingSeconds / 60)).padStart(2, "0")}:${String(recordingSeconds % 60).padStart(2, "0")}`;

  return (
    <form onSubmit={handleSubmit} className="glass-panel rounded-3xl p-5 sm:p-6">
      <div className="flex gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-400/10 text-violet-300">
          <AudioLines className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-white">Analyze a suspicious call</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">Upload a recording or use your microphone. Audio is sent for transcription and threat analysis.</p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <label className="focus-ring flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.025] px-5 text-center transition hover:border-blue-400/40 hover:bg-blue-400/[0.06]">
          <Upload className="h-6 w-6 text-blue-300" />
          <span className="mt-3 text-sm font-medium text-slate-200">Choose audio file</span>
          <span className="mt-1 text-xs text-slate-500">WebM, WAV, MP3, or M4A · max 15 MB</span>
          <input type="file" accept="audio/*" className="sr-only" onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)} />
        </label>

        <div className="flex min-h-36 flex-col items-center justify-center rounded-2xl border border-white/10 bg-black/15 px-5 text-center">
          {isRecording ? (
            <>
              <span className="flex h-10 w-10 animate-pulse items-center justify-center rounded-full bg-red-400/15 text-red-300"><Mic className="h-5 w-5" /></span>
              <span className="mt-3 font-mono text-sm text-red-200">{formattedTime}</span>
              <button type="button" onClick={stopRecording} className="focus-ring mt-3 inline-flex items-center gap-2 rounded-lg border border-red-400/25 bg-red-400/10 px-3 py-2 text-xs font-medium text-red-200 hover:bg-red-400/15">
                <CircleStop className="h-3.5 w-3.5" /> Stop recording
              </button>
            </>
          ) : (
            <>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.07] text-slate-300"><Mic className="h-5 w-5" /></span>
              <span className="mt-3 text-sm font-medium text-slate-200">Record from microphone</span>
              <button type="button" onClick={startRecording} className="focus-ring mt-3 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-medium text-slate-300 hover:border-blue-400/30 hover:bg-blue-400/10 hover:text-blue-200">
                <Mic className="h-3.5 w-3.5" /> Start recording
              </button>
            </>
          )}
        </div>
      </div>

      {audioFile && (
        <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-200">{audioFile.name}</p>
              <p className="mt-1 text-xs text-slate-500">{(audioFile.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button type="button" onClick={clearFile} className="focus-ring rounded-lg p-2 text-slate-500 hover:bg-white/10 hover:text-white" aria-label="Remove recording">
              <X className="h-4 w-4" />
            </button>
          </div>
          {audioUrl && <audio controls src={audioUrl} className="mt-4 h-9 w-full" aria-label="Selected audio preview"><track kind="captions" /></audio>}
        </div>
      )}

      <div className="mt-5 flex flex-col gap-4 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-600">The transcript will be shown with caller and receiver markers.</p>
        <button type="submit" disabled={isLoading || !audioFile || isRecording} className="focus-ring button-primary inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          {isLoading ? "Analyzing recording..." : "Analyze recording"}
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
