import { JournalPageFrame } from "@/features/journal/components/journal-page-frame";
import { MilestoneBoard } from "@/features/journal/components/milestone-board";

export default function MilestonesPage() {
  return (
    <JournalPageFrame
      title="Milestone dan Galeri"
      description="Unggah bukti progres dan rayakan pencapaian dengan timeline yang tetap terhubung ke jurnal dan target profesional."
      action={<button className="rounded-2xl bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-button)]">Tambah Milestone</button>}
    >
      <MilestoneBoard />
    </JournalPageFrame>
  );
}
