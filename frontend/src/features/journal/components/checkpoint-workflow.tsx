"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";

import { api, CurrentUser } from "@/lib/api";
import {
  CheckpointHistoryItem,
  CheckpointRecord,
  CheckpointReport,
  CheckpointResults,
  createCheckpoint,
  getCheckpoint,
  getReport,
  getResults,
  listCheckpoints,
  listTemplates,
  presignAsset,
  sha256,
  submitCheckpoint,
  uploadToLocalStorage,
  completeAsset,
} from "@/features/journal/lib/checkpoint-client";
import { useActivePerson } from "@/features/people/active-person-context";
import { SectionCard } from "@/components/ui/section-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { ProcessingTimeline } from "@/features/journal/components/processing-timeline";

type WorkflowConfig = {
  templateCode: string;
  captureMode: "voice" | "face_image" | "movement_video";
  accept: string;
  directCaptureAccept?: string;
  directCaptureLabel?: string;
  directCaptureFacingMode?: "user" | "environment";
  dropTitle: string;
  dropDescription: string;
  qualityChecklist: string[];
  privacyNotes: string[];
  promptLines?: string[];
  directRecordingLabel?: string;
};

const statusToStep: Record<string, number> = {
  draft: 0,
  asset_uploaded: 2,
  processing: 4,
  ready_for_professional_review: 7,
  approved: 7,
  recapture_required: 7,
  failed: 0,
};

export function CheckpointWorkflow({ config }: { config: WorkflowConfig }) {
  const { activePerson, loading: loadingPerson } = useActivePerson();
  const [bootstrapping, setBootstrapping] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [templateInstruction, setTemplateInstruction] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [checkpoint, setCheckpoint] = useState<CheckpointRecord | null>(null);
  const [results, setResults] = useState<CheckpointResults | null>(null);
  const [report, setReport] = useState<CheckpointReport | null>(null);
  const [history, setHistory] = useState<CheckpointHistoryItem[]>([]);
  const [stage, setStage] = useState("Menyiapkan sesi aktif.");
  const [sourceMode, setSourceMode] = useState<"upload" | "record" | "capture">(config.captureMode === "voice" ? "record" : "upload");
  const [recording, setRecording] = useState(false);
  const [recordedSeconds, setRecordedSeconds] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const captureInputRef = useRef<HTMLInputElement | null>(null);

  function stopTracks() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    mediaRecorderRef.current = null;
  }

  useEffect(() => {
    if (loadingPerson || !activePerson) {
      return;
    }
    const activePersonId = activePerson.id;

    let cancelled = false;
    async function bootstrap() {
      try {
        const [user, templates, nextHistory] = await Promise.all([
          api<CurrentUser>("/auth/me"),
          listTemplates(),
          listCheckpoints(activePersonId, config.captureMode),
        ]);
        const matched = templates.find((item) => item.code === config.templateCode);
        if (!matched) {
          throw new Error(`Template ${config.templateCode} belum tersedia di backend.`);
        }
        if (!cancelled) {
          setCurrentUser(user);
          setTemplateId(matched.id);
          setTemplateInstruction(matched.instruction_text);
          setHistory(nextHistory);
          setStage("Sesi siap. Rekam langsung atau pilih media.");
        }
      } catch (nextError) {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError.message : "Bootstrap gagal");
        }
      } finally {
        if (!cancelled) {
          setBootstrapping(false);
        }
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
      stopTracks();
    };
  }, [activePerson, config.captureMode, config.templateCode, loadingPerson]);

  useEffect(() => {
    if (!recording) {
      return;
    }
    const timer = window.setInterval(() => setRecordedSeconds((current) => current + 1), 1000);
    return () => window.clearInterval(timer);
  }, [recording]);

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  async function refreshHistory() {
    if (!activePerson) {
      return;
    }
    setHistory(await listCheckpoints(activePerson.id, config.captureMode));
  }

  function resetWorkingState(nextStage = "Sesi siap. Rekam langsung atau pilih media.") {
    setCheckpoint(null);
    setResults(null);
    setReport(null);
    setError(null);
    setStage(nextStage);
  }

  function handleFileSelected(nextFile: File | null) {
    resetWorkingState();
    setFile(nextFile);
    if (nextFile) {
      setStage("Media siap. Lanjutkan ke simpan dan proses.");
    }
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    handleFileSelected(event.target.files?.[0] ?? null);
  }

  async function startRecording() {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Browser ini belum mendukung rekam audio langsung.");
      }
      resetWorkingState("Merekam suara langsung dari mikrofon.");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        handleFileSelected(new File([blob], `voice-checkpoint-${Date.now()}.webm`, { type: "audio/webm" }));
        stopTracks();
      };
      setRecordedSeconds(0);
      setRecording(true);
      recorder.start();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Gagal memulai rekaman.");
      stopTracks();
    }
  }

  function stopRecording() {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    recorder.stop();
    setRecording(false);
  }

  async function handleSubmit() {
    if (!activePerson || !templateId || !file) {
      setError("Belum ada media yang bisa diproses.");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      setStage("Membuat checkpoint baru.");
      const created = await createCheckpoint(activePerson.id, templateId, config.captureMode);
      setCheckpoint(created);

      setStage("Meminta URL upload privat.");
      const presigned = await presignAsset(created.id, file);

      setStage("Mengunggah media ke penyimpanan privat.");
      await uploadToLocalStorage(presigned.upload_url, file);

      setStage("Memverifikasi ukuran dan SHA256 media.");
      const digest = await sha256(file);
      const completed = await completeAsset(created.id, file, presigned.object_key, digest);
      setCheckpoint(completed);

      setStage("Mengirim checkpoint ke antrian analisis.");
      const submitted = await submitCheckpoint(created.id);
      setCheckpoint(submitted);

      setStage("Menunggu worker menyelesaikan pipeline.");
      const settled = await waitForCompletion(created.id);
      setCheckpoint(settled);

      setStage("Mengambil hasil checkpoint dan ringkasan.");
      const [nextResults, nextReport] = await Promise.all([
        getResults(created.id),
        getReport(created.id).catch(() => null),
      ]);
      setResults(nextResults);
      setReport(nextReport);
      await refreshHistory();
      setStage("Selesai. Hasil tersimpan dan masuk ke riwayat harian.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Proses checkpoint gagal");
    } finally {
      setBusy(false);
    }
  }

  async function openHistoryItem(item: CheckpointHistoryItem) {
    setBusy(true);
    setError(null);
    try {
      const current = await getCheckpoint(item.id);
      const [nextResults, nextReport] = await Promise.all([
        item.has_results ? getResults(item.id) : Promise.resolve(null),
        item.has_report ? getReport(item.id).catch(() => null) : Promise.resolve(null),
      ]);
      setCheckpoint(current);
      setResults(nextResults);
      setReport(nextReport);
      setStage("Riwayat checkpoint dibuka dari database.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Gagal membuka riwayat checkpoint.");
    } finally {
      setBusy(false);
    }
  }

  const activeStep = checkpoint ? statusToStep[checkpoint.status] ?? 0 : 0;
  const resultCards = summarizeResultCards(results);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.18fr)_minmax(320px,0.82fr)]">
      <div className="space-y-6">
        <SectionCard title="Instruksi sesi" description="Checkpoint ini disusun sebagai rekam jejak harian. Setiap entri disimpan per profil aktif, bukan hanya hidup di layar terakhir.">
          <div className="grid gap-4 lg:grid-cols-[1.35fr_0.95fr]">
            <div className="rounded-[24px] bg-[var(--surface-soft)] p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--brand)]">Instruksi utama</p>
              <p className="mt-3 text-lg font-semibold text-[var(--brand-deep)]">{templateInstruction || "Memuat instruksi..."}</p>
              {config.promptLines?.length ? (
                <div className="mt-5 rounded-[22px] bg-white p-4">
                  <p className="text-sm font-semibold text-[var(--brand-deep)]">Prompt pelaksanaan</p>
                  <div className="mt-3 grid gap-2">
                    {config.promptLines.map((line, index) => (
                      <div key={line} className="rounded-2xl bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--ink-soft)]">
                        <span className="mr-2 font-semibold text-[var(--brand)]">{index + 1}.</span>
                        {line}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="grid gap-3">
              <InfoTile label="Pengguna aktif" value={currentUser?.full_name ?? "Memuat..."} />
              <InfoTile label="Profil aktif" value={activePerson?.display_name ?? "Belum dipilih"} />
              <InfoTile label="Mode retensi" value="privacy_first" />
              <InfoTile label="Status sesi" value={checkpoint ? humanizeStatus(checkpoint.status) : stage} subtle />
            </div>
          </div>
          {error ? <p className="mt-4 rounded-2xl bg-[#fff2f2] px-4 py-3 text-sm text-[#9f3d3d]">{error}</p> : null}
        </SectionCard>

        <SectionCard title="Capture dan upload" description={config.dropDescription}>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setSourceMode("upload")} className={tabClass(sourceMode === "upload")}>Pilih file</button>
            {config.captureMode === "voice" ? <button type="button" onClick={() => setSourceMode("record")} className={tabClass(sourceMode === "record")}>Rekam langsung</button> : null}
            {config.captureMode !== "voice" ? <button type="button" onClick={() => setSourceMode("capture")} className={tabClass(sourceMode === "capture")}>{config.directCaptureLabel ?? "Buka kamera"}</button> : null}
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="rounded-[26px] bg-[var(--surface-soft)] p-5">
              {sourceMode === "record" && config.captureMode === "voice" ? (
                <div className="rounded-[22px] bg-white p-5">
                  <p className="text-sm font-semibold text-[var(--brand-deep)]">{config.directRecordingLabel ?? "Rekam suara langsung"}</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    Izinkan mikrofon, lalu bacakan kalimat instruksi dengan tempo natural. Setelah berhenti, hasil rekaman otomatis dipakai sebagai file checkpoint.
                  </p>
                  <div className="mt-5 flex items-center justify-between rounded-[20px] bg-[var(--surface-soft)] px-4 py-4">
                    <div>
                      <p className="text-sm text-[var(--muted)]">Durasi rekam</p>
                      <p className="mt-1 text-3xl font-semibold text-[var(--brand-deep)]">{formatDuration(recordedSeconds)}</p>
                    </div>
                    {!recording ? (
                      <button type="button" onClick={startRecording} className="rounded-full bg-[#f35f5f] px-5 py-3 text-sm font-semibold text-white">Mulai rekam</button>
                    ) : (
                      <button type="button" onClick={stopRecording} className="rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white">Selesai</button>
                    )}
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => (sourceMode === "capture" ? captureInputRef.current?.click() : uploadInputRef.current?.click())}
                  className="flex w-full flex-col items-center justify-center rounded-[22px] border-2 border-dashed border-[var(--brand)] bg-white px-6 py-12 text-center transition hover:bg-[var(--brand-soft)]/40"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand)]">
                    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
                      <path d="M12 16V4M7 9l5-5 5 5M5 20h14" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <p className="mt-4 text-lg font-semibold text-[var(--brand-deep)]">{sourceMode === "capture" ? (config.directCaptureLabel ?? "Ambil langsung dari kamera") : config.dropTitle}</p>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--muted)]">
                    Media masuk ke storage privat, diverifikasi ukuran serta SHA256, lalu dikirim ke queue analisis.
                  </p>
                  <span className="mt-5 inline-flex rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white">
                    {sourceMode === "capture" ? "Buka kamera" : "Pilih media"}
                  </span>
                </button>
              )}

              <input ref={uploadInputRef} type="file" accept={config.accept} className="hidden" onChange={handleFileChange} />
              <input
                ref={captureInputRef}
                type="file"
                accept={config.directCaptureAccept ?? config.accept}
                capture={config.directCaptureFacingMode ?? "environment"}
                className="hidden"
                onChange={handleFileChange}
              />

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {config.qualityChecklist.map((item) => (
                  <div key={item} className="rounded-2xl bg-white px-4 py-3 text-sm text-[var(--muted)]">{item}</div>
                ))}
              </div>
            </div>

            <div className="rounded-[26px] border border-[var(--line)] bg-white p-5">
              <p className="text-sm font-semibold text-[var(--brand-deep)]">Riwayat harian tersimpan</p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Riwayat checkpoint dibaca ulang dari backend berdasarkan profil yang sedang aktif. Jadi entry lama tidak hilang setelah refresh.
              </p>
              <div className="mt-4 max-h-[540px] space-y-3 overflow-auto pr-1">
                {history.length === 0 ? (
                  <div className="rounded-2xl bg-[var(--surface-soft)] px-4 py-4 text-sm text-[var(--muted)]">Belum ada riwayat untuk modality ini.</div>
                ) : (
                  history.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => void openHistoryItem(item)}
                      className="block w-full rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] px-4 py-4 text-left transition hover:border-[var(--brand)] hover:bg-white"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[var(--brand-deep)]">{item.template_name}</p>
                          <p className="mt-1 text-xs text-[var(--muted)]">{formatDate(item.capture_timestamp)}</p>
                        </div>
                        <StatusBadge tone={statusTone(item.status)}>{humanizeStatus(item.status)}</StatusBadge>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.has_uploaded_asset ? <StatusBadge tone="neutral">asset</StatusBadge> : null}
                        {item.has_results ? <StatusBadge tone="accent">result</StatusBadge> : null}
                        {item.has_report ? <StatusBadge tone="success">report</StatusBadge> : null}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Preview media" description="Sebelum submit, caregiver bisa cek ulang media yang akan dianalisis.">
          {!file || !previewUrl ? (
            <div className="rounded-[24px] border border-dashed border-[var(--line)] bg-[var(--surface-soft)] px-5 py-10 text-sm text-[var(--muted)]">
              Belum ada media yang dipilih atau direkam.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-[24px] bg-[var(--surface-soft)] p-4">
                {config.captureMode === "voice" ? <audio controls className="w-full" src={previewUrl} /> : null}
                {config.captureMode === "movement_video" ? <video controls className="max-h-[420px] w-full rounded-[20px] bg-black" src={previewUrl} /> : null}
                {config.captureMode === "face_image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewUrl} alt="Preview media wajah" className="max-h-[420px] w-full rounded-[20px] object-contain bg-white" />
                ) : null}
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <InfoTile label="Nama file" value={file.name} />
                <InfoTile label="Ukuran" value={formatBytes(file.size)} />
                <InfoTile label="Tipe" value={file.type || "application/octet-stream"} />
              </div>
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={handleSubmit} disabled={busy || bootstrapping || recording || !activePerson} className="inline-flex rounded-2xl bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-button)] disabled:cursor-not-allowed disabled:opacity-60">
                  {busy ? "Memproses..." : "Simpan ke riwayat dan proses"}
                </button>
                <button type="button" onClick={() => { setFile(null); setRecordedSeconds(0); resetWorkingState(); }} className="inline-flex rounded-2xl border border-[var(--line)] bg-white px-5 py-3 text-sm font-semibold text-[var(--brand-deep)]">
                  Reset draft
                </button>
              </div>
            </div>
          )}
        </SectionCard>
      </div>

      <div className="space-y-6">
        <SectionCard title="Timeline proses" description="Tahap ini mengikuti create checkpoint, upload privat, verifikasi file, queue worker, hingga hasil tersimpan kembali.">
          <ProcessingTimeline activeStep={activeStep} />
        </SectionCard>

        <SectionCard title="Privasi dan retensi" description="Catatan ini tampil sebelum upload supaya keluarga tahu apa yang diproses dan bagaimana media dikelola.">
          <div className="space-y-3">
            {config.privacyNotes.map((item) => (
              <div key={item} className="rounded-2xl bg-[var(--surface-soft)] px-4 py-4 text-sm leading-6 text-[var(--ink-soft)]">{item}</div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Hasil checkpoint" description="Panel ini membaca hasil dan report yang tersimpan di backend untuk checkpoint yang sedang dipilih dari riwayat.">
          {!results ? (
            <div className="space-y-3 text-sm text-[var(--muted)]">
              <p>Belum ada hasil yang sedang dibuka.</p>
              <p>Setelah submit atau saat kamu buka item riwayat, panel ini akan menampilkan metrik observasi dan ringkasan prosesnya.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {results.speech && typeof results.speech.transcript === "string" ? (
                <div className="rounded-2xl bg-[var(--surface-soft)] px-4 py-4">
                  <p className="text-sm font-semibold text-[var(--brand-deep)]">Transkrip</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{results.speech.transcript}</p>
                </div>
              ) : null}

              {resultCards.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {resultCards.map((item) => (
                    <div key={item.label} className="rounded-2xl bg-[var(--surface-soft)] px-4 py-4">
                      <p className="text-sm text-[var(--muted)]">{item.label}</p>
                      <p className="mt-2 text-lg font-semibold text-[var(--brand-deep)]">{item.value}</p>
                    </div>
                  ))}
                </div>
              ) : null}

              {report ? (
                <div className="rounded-2xl border border-[var(--line)] bg-white p-4">
                  <p className="text-sm font-semibold text-[var(--brand-deep)]">{report.headline}</p>
                  <div className="mt-3 space-y-2 text-sm text-[var(--ink-soft)]">
                    {report.observation_summary.slice(0, 3).map((item) => (
                      <div key={item} className="rounded-xl bg-[var(--surface-soft)] px-3 py-3">{item}</div>
                    ))}
                    {report.automated_trend_language ? <div className="rounded-xl bg-[var(--accent-soft)] px-3 py-3 text-[var(--accent)]">{report.automated_trend_language}</div> : null}
                  </div>
                </div>
              ) : null}

              {results.limitations.length > 0 ? (
                <div className="rounded-2xl bg-[#fff8e9] px-4 py-4 text-sm leading-6 text-[#6f5520]">
                  <p className="font-semibold">Catatan keterbatasan pipeline saat ini</p>
                  <ul className="mt-2 space-y-1">
                    {results.limitations.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </div>
              ) : null}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
function InfoTile({ label, value, subtle = false }: { label: string; value: string; subtle?: boolean }) {
  return (
    <div className={`rounded-2xl px-4 py-4 text-sm ${subtle ? "border border-[var(--line)] bg-white" : "bg-[var(--surface-soft)]"}`}>
      <p className="text-[var(--muted)]">{label}</p>
      <p className="mt-1 font-semibold text-[var(--brand-deep)]">{value}</p>
    </div>
  );
}

function tabClass(active: boolean) {
  return `rounded-full px-4 py-2 text-sm font-semibold ${active ? "bg-[var(--brand)] text-white" : "bg-[var(--surface-soft)] text-[var(--muted)]"}`;
}

async function waitForCompletion(checkpointId: string) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const current = await getCheckpoint(checkpointId);
    if (!["draft", "asset_uploaded", "processing"].includes(current.status)) {
      return current;
    }
    await new Promise((resolve) => window.setTimeout(resolve, 1500));
  }
  return getCheckpoint(checkpointId);
}

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(value: number) {
  const minutes = Math.floor(value / 60).toString().padStart(2, "0");
  const seconds = (value % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function summarizeResultCards(results: CheckpointResults | null) {
  if (!results) return [];
  const source = results.speech ?? results.face ?? results.motion ?? {};
  const cards: Array<{ label: string; value: string }> = [];

  for (const [key, value] of Object.entries(source)) {
    if (key === "segments" || key === "transcript" || key === "model_revision") continue;
    if (typeof value === "number") cards.push({ label: startCase(key), value: Number.isInteger(value) ? String(value) : value.toFixed(2) });
    else if (typeof value === "string") cards.push({ label: startCase(key), value });
    else if (Array.isArray(value)) cards.push({ label: startCase(key), value: `${value.length} item` });
    else if (value && typeof value === "object") cards.push({ label: startCase(key), value: Object.entries(value).map(([nestedKey, nestedValue]) => `${nestedKey}: ${nestedValue}`).join(" · ") });
  }

  if (results.reference_comparison?.dtw_distance !== undefined) cards.push({ label: "DTW Distance", value: String(results.reference_comparison.dtw_distance) });
  if (results.trend?.status) cards.push({ label: "Trend", value: String(results.trend.status) });
  return cards.slice(0, 8);
}

function startCase(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function humanizeStatus(status: string) {
  return status.replace(/_/g, " ");
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusTone(status: string): "success" | "warning" | "neutral" | "accent" {
  if (status === "approved" || status === "ready_for_professional_review") return "success";
  if (status === "processing") return "accent";
  if (status === "recapture_required" || status === "failed") return "warning";
  return "neutral";
}
