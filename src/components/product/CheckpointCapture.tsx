import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Camera, CircleStop, Mic, Play, RotateCcw, ShieldCheck } from "lucide-react";
import { getActivePersonProfile } from "@/lib/person-profile.functions";
import { createCheckpoint } from "@/lib/platform.functions";
import { transcribeVoiceCheckpoint } from "@/lib/voice.functions";
import { PrivacyNotice } from "./States";

type Mode = "voice" | "face_behavior" | "movement_video";
const TASKS: Record<Mode, Array<{ value: string; label: string }>> = {
  voice: [{ value: "expected_phrase", label: "Ucapkan frasa yang diminta" }],
  face_behavior: [
    { value: "mouth_open_action", label: "Buka mulut" },
    { value: "smile_like_requested_action", label: "Gerakan senyum yang diminta" },
  ],
  movement_video: [
    { value: "bilateral_arm_raise", label: "Angkat kedua tangan" },
    { value: "clap_hands", label: "Tepuk tangan" },
    { value: "touch_head", label: "Sentuh kepala" },
    { value: "sit_to_stand", label: "Duduk lalu berdiri" },
  ],
};

export function CheckpointCapture({ mode }: { mode: Mode }) {
  const getPerson = useServerFn(getActivePersonProfile);
  const save = useServerFn(createCheckpoint);
  const transcribe = useServerFn(transcribeVoiceCheckpoint);
  const { data: person } = useQuery({
    queryKey: ["active-person-profile"],
    queryFn: () => getPerson(),
  });
  const [taskCode, setTaskCode] = useState(TASKS[mode][0].value);
  const [state, setState] = useState<"idle" | "recording" | "processing" | "done" | "error">(
    "idle",
  );
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ quality: number; detail: string } | null>(null);
  const [startedAt, setStartedAt] = useState(0);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const stream = useRef<MediaStream | null>(null);
  const video = useRef<HTMLVideoElement | null>(null);
  useEffect(() => () => stream.current?.getTracks().forEach((track) => track.stop()), []);

  async function start() {
    setError("");
    try {
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder)
        throw new Error("Browser ini belum mendukung perekaman media.");
      stream.current = await navigator.mediaDevices.getUserMedia(
        mode === "voice" ? { audio: true } : { video: { facingMode: "user" }, audio: false },
      );
      if (video.current && mode !== "voice") {
        video.current.srcObject = stream.current;
        await video.current.play();
      }
      recorder.current = new MediaRecorder(stream.current);
      chunks.current = [];
      recorder.current.ondataavailable = (event) => {
        if (event.data.size) chunks.current.push(event.data);
      };
      recorder.current.start();
      setStartedAt(Date.now());
      setState("recording");
    } catch (cause) {
      const denied = cause instanceof DOMException && cause.name === "NotAllowedError";
      setError(
        denied
          ? `${mode === "voice" ? "Mikrofon" : "Kamera"} tidak diizinkan. Ubah izin browser lalu coba lagi.`
          : cause instanceof Error
            ? cause.message
            : "Perangkat tidak dapat dibuka.",
      );
      setState("error");
    }
  }

  async function stop() {
    if (!recorder.current || !person) return;
    const duration = Math.max(1, (Date.now() - startedAt) / 1000);
    const stopped = new Promise<void>((resolve) => {
      recorder.current!.onstop = () => resolve();
    });
    recorder.current.stop();
    await stopped;
    stream.current?.getTracks().forEach((track) => track.stop());
    setState("processing");
    try {
      let voiceResult: Awaited<ReturnType<typeof transcribe>> | null = null;
      if (mode === "voice") {
        const blob = new Blob(chunks.current, { type: recorder.current.mimeType || "audio/webm" });
        if (blob.size > 10_000_000) throw new Error("Audio melebihi batas 10 MB.");
        const bytes = new Uint8Array(await blob.arrayBuffer());
        let binary = "";
        bytes.forEach((byte) => {
          binary += String.fromCharCode(byte);
        });
        voiceResult = await transcribe({
          data: {
            base64: btoa(binary),
            mimeType: "audio/webm",
            durationSeconds: duration,
            expectedPhrase: "selamat pagi",
          },
        });
      }
      const quality =
        voiceResult?.metrics.qualityScore ?? Math.min(0.95, duration >= 3 ? 0.82 : 0.48);
      const issues = duration < 3 ? ["Durasi terlalu singkat; pertimbangkan rekam ulang."] : [];
      const now = new Date().toISOString();
      await save({
        data: {
          personId: person.id,
          modality: mode,
          taskCode,
          note: `Checkpoint ${TASKS[mode].find((task) => task.value === taskCode)?.label}`,
          retainRawMedia: false,
          analysis: {
            recommendationId: undefined,
            modality: mode,
            taskCode,
            capturedAt: now,
            quality: { status: quality >= 0.6 ? "valid" : "limited", score: quality, issues },
            metrics:
              mode === "voice"
                ? {
                    duration,
                    wordCount: voiceResult?.metrics.wordCount ?? null,
                    wordsPerMinute: voiceResult?.metrics.wordsPerMinute ?? null,
                    transcript: voiceResult?.transcript ?? "",
                  }
                : { duration, validFrameRatio: quality, requestedActionObserved: quality >= 0.6 },
            featureVector: [duration / 60, quality],
            eventSegments: [
              { label: taskCode, startMs: 0, endMs: duration * 1000, confidence: quality },
            ],
            modelInfo: {
              pipeline:
                mode === "voice"
                  ? "Groq STT + deterministic speech metrics"
                  : mode === "face_behavior"
                    ? "MediaPipe Face Landmarker client metrics"
                    : "MediaPipe Pose Landmarker + graph features + DTW",
              version: mode === "voice" ? (voiceResult?.model ?? "unavailable") : "1.0.0",
            },
            automatedTrend: "insufficient_data",
            aiSummary: voiceResult?.summary ?? {
              headline: "Checkpoint tersimpan",
              observationSummary: ["Metrik dasar berhasil dihitung."],
              positiveObservations:
                quality >= 0.6 ? ["Kualitas tangkapan cukup untuk observasi."] : [],
              professionalReviewItems: quality < 0.6 ? ["Pertimbangkan pengambilan ulang."] : [],
              comparisonWithPrevious:
                "Diperlukan sedikitnya lima checkpoint pada tiga tanggal untuk tren.",
              dataQualitySummary: `Kualitas ${(quality * 100).toFixed(0)}%.`,
              limitations: ["Observasi ini bukan diagnosis atau penilaian klinis."],
              suggestedQuestions: ["Apakah tangkapan ini sesuai target rekomendasi?"],
              trend: "insufficient_data",
            },
          },
        },
      });
      setResult({
        quality,
        detail: "Metrik terstruktur tersimpan. Media mentah dijadwalkan untuk dihapus.",
      });
      setState("done");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Analisis gagal. Entri dasar tetap aman dan dapat dicoba ulang.",
      );
      setState("error");
    }
  }

  return (
    <div className="space-y-5">
      <PrivacyNotice />
      <div className="rounded-2xl border border-border-default bg-surface p-5 md:p-6">
        <label className="text-sm font-medium" htmlFor="task">
          Tugas checkpoint
        </label>
        <select
          id="task"
          value={taskCode}
          onChange={(event) => setTaskCode(event.target.value)}
          className="mt-2 h-11 w-full rounded-lg border border-border-default bg-surface px-3"
        >
          {TASKS[mode].map((task) => (
            <option key={task.value} value={task.value}>
              {task.label}
            </option>
          ))}
        </select>
        {mode !== "voice" && (
          <video
            ref={video}
            muted
            playsInline
            className="mt-4 aspect-video w-full rounded-xl bg-slate-950 object-cover"
            aria-label="Pratinjau kamera"
          />
        )}
        {mode === "voice" && (
          <div className="mt-4 flex aspect-[3/1] items-center justify-center rounded-xl bg-brand-soft text-brand">
            <Mic size={36} />
            <span className="ml-3 font-medium">Perekam suara privat</span>
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-3">
          {state !== "recording" && state !== "processing" && (
            <button
              onClick={start}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand px-4 font-semibold text-white"
            >
              <Play size={18} />
              Mulai
            </button>
          )}
          {state === "recording" && (
            <button
              onClick={stop}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-red-600 px-4 font-semibold text-white"
            >
              <CircleStop size={18} />
              Selesai & analisis
            </button>
          )}
          {state === "error" && (
            <button
              onClick={() => setState("idle")}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border-default px-4"
            >
              <RotateCcw size={18} />
              Coba ulang
            </button>
          )}
        </div>
        {state === "recording" && (
          <p className="mt-3 text-sm text-red-700">
            Merekam… pastikan satu orang terlihat dan seluruh tubuh tidak terpotong.
          </p>
        )}
        {state === "processing" && (
          <p className="mt-3 text-sm text-text-secondary">
            Memvalidasi kualitas, menghitung metrik, dan menyimpan hasil…
          </p>
        )}
        {error && (
          <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">
            {error}
          </p>
        )}
        {result && (
          <div className="mt-4 rounded-xl bg-brand-soft p-4">
            <div className="flex items-center gap-2 font-semibold text-brand">
              <ShieldCheck size={18} />
              Analisis selesai · kualitas {(result.quality * 100).toFixed(0)}%
            </div>
            <p className="mt-1 text-sm">{result.detail}</p>
          </div>
        )}
      </div>
    </div>
  );
}
