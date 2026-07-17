import { CheckpointWorkflow } from "@/features/journal/components/checkpoint-workflow";
import { JournalPageFrame } from "@/features/journal/components/journal-page-frame";

export default function FaceCheckpointPage() {
  return (
    <JournalPageFrame
      title="Checkpoint Wajah dan Komunikasi"
      description="Unggah foto wajah yang sesuai instruksi observasi, lalu lihat status upload privat, proses backend, dan hasil capture quality yang tersimpan."
    >
      <CheckpointWorkflow
        config={{
          templateCode: "open_mouth_then_smile",
          captureMode: "face_image",
          accept: "image/*",
          directCaptureAccept: "image/*",
          directCaptureFacingMode: "user",
          directCaptureLabel: "Ambil foto langsung",
          dropTitle: "Unggah foto wajah",
          dropDescription: "Sekarang ada dua jalur: upload foto yang sudah ada atau ambil gambar langsung dari kamera depan perangkat.",
          promptLines: ["Buka mulut perlahan.", "Tahan sebentar.", "Lalu tersenyum natural ke arah kamera."],
          qualityChecklist: ["Satu wajah dominan", "Pencahayaan cukup", "Tidak blur dan tidak terlalu jauh"],
          privacyNotes: [
            "Fitur ini ditujukan untuk aksi observabel sesuai instruksi, bukan identifikasi identitas atau klasifikasi emosi.",
            "Media mentah disimpan privat dan akses raw media tetap dibatasi oleh relationship-based authorization.",
            "Ringkasan hasil hanya boleh dipakai sebagai bahan review profesional, bukan diagnosis otomatis.",
          ],
        }}
      />
    </JournalPageFrame>
  );
}
