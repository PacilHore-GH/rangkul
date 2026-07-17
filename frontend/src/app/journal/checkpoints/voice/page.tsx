import { CheckpointWorkflow } from "@/features/journal/components/checkpoint-workflow";
import { JournalPageFrame } from "@/features/journal/components/journal-page-frame";

export default function VoiceCheckpointPage() {
  return (
    <JournalPageFrame
      title="Checkpoint Suara"
      description="Unggah rekaman suara yang relevan dengan instruksi terapi, lalu pantau verifikasi upload, status worker, dan hasil yang tersimpan di backend."
    >
      <CheckpointWorkflow
        config={{
          templateCode: "repeat_phrase",
          captureMode: "voice",
          accept: "audio/*",
          dropTitle: "Unggah rekaman suara",
          dropDescription: "Area ini menerima file audio untuk checkpoint suara. Fokusnya bukan demo waveform kosong, tetapi upload nyata yang masuk ke pipeline backend.",
          directRecordingLabel: "Rekam suara dari browser",
          qualityChecklist: ["Suara utama terdengar jelas", "Gangguan latar rendah", "Durasi sesuai instruksi"],
          promptLines: [
            "Aku mau minum.",
            "Tolong buka pintu.",
            "Hari ini aku merasa lebih tenang.",
          ],
          privacyNotes: [
            "Media mentah diunggah ke storage privat dan diverifikasi ukuran serta SHA256 sebelum diproses.",
            "Hanya pengguna dengan relasi profil yang bisa membuat dan melihat checkpoint ini.",
            "Hasil akhir tersimpan di PostgreSQL, sementara raw retention mengikuti mode privacy_first.",
          ],
        }}
      />
    </JournalPageFrame>
  );
}
