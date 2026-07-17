import { JournalPageFrame } from "@/features/journal/components/journal-page-frame";
import { JournalTextEditor } from "@/features/journal/components/journal-text-editor";

export default function TextJournalPage() {
  return (
    <JournalPageFrame
      title="Tulis Jurnal Teks"
      description="Gunakan jurnal teks untuk refleksi harian, catatan terapi, atau perkembangan kecil yang belum memerlukan media."
      action={<button className="rounded-2xl border border-[var(--line)] px-5 py-3 text-sm font-semibold text-[var(--brand-deep)]">Simpan Draft</button>}
    >
      <JournalTextEditor />
    </JournalPageFrame>
  );
}
