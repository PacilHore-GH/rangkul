import { CheckpointWorkflow } from "@/features/journal/components/checkpoint-workflow";
import { JournalPageFrame } from "@/features/journal/components/journal-page-frame";

export default function MovementCheckpointPage() {
  return (
    <JournalPageFrame
      title="Checkpoint Gerak"
      description="Unggah video gerakan instruksional, lalu cek alur validasi upload, antrian pemrosesan, dan hasil checkpoint yang tersimpan di backend."
    >
      <CheckpointWorkflow
        config={{
          templateCode: "bilateral_arm_raise",
          captureMode: "movement_video",
          accept: "video/*",
          directCaptureAccept: "video/*",
          directCaptureFacingMode: "environment",
          directCaptureLabel: "Rekam video langsung",
          dropTitle: "Unggah video gerak",
          dropDescription: "Video gerak bisa dipilih dari galeri atau direkam langsung dari kamera perangkat sebelum dikirim ke pipeline backend.",
          promptLines: ["Posisi awal berdiri tegak.", "Angkat kedua tangan setinggi bahu.", "Tahan dua detik, lalu turunkan perlahan."],
          qualityChecklist: ["Video landscape disarankan", "Seluruh tubuh terlihat", "Satu orang utama di frame"],
          privacyNotes: [
            "Video mentah masuk ke object storage privat sebelum diproses oleh worker checkpoint.",
            "Hasil yang tampil adalah metrik observabel, reference comparison, dan trend snapshot yang tersimpan di database.",
            "Pipeline AI gerak saat ini belum memakai MotionBERT real, jadi hasil observasi tetap harus dibaca sebagai draft non-klinis.",
          ],
        }}
      />
    </JournalPageFrame>
  );
}
