import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/AppShell";
import { ShieldCheck, ClipboardList, ExternalLink } from "lucide-react";
import { AID_PROGRAMS } from "@/lib/aid-programs";
export const Route = createFileRoute("/_authenticated/aid")({ component: Aid });
function Aid() {
  return (
    <>
      <PageHeader
        title="Navigator bantuan pemerintah"
        description="Pencocokan deterministik dan dapat dijelaskan—LLM tidak menentukan kelayakan."
      />
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
        <strong>
          Hasil ini merupakan pencocokan awal. Keputusan akhir mengikuti instansi penyelenggara.
        </strong>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          to="/layanan"
          className="inline-flex h-11 items-center gap-2 rounded-lg bg-brand px-4 font-semibold text-white"
        >
          <ClipboardList size={18} />
          Mulai asesmen
        </Link>
        <button className="h-11 rounded-lg border border-border-default px-4 font-medium">
          Lihat pelacak pengajuan
        </button>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {AID_PROGRAMS.map((program) => (
          <article
            key={program.id}
            className="rounded-2xl border border-border-default bg-surface p-5"
          >
            <div className="flex items-center gap-2 text-xs font-medium uppercase text-brand">
              <ShieldCheck size={14} />
              {program.provider}
            </div>
            <h2 className="mt-2 font-semibold">{program.name}</h2>
            <p className="mt-2 text-sm text-text-secondary">{program.summary}</p>
            <details className="mt-3 text-sm">
              <summary className="cursor-pointer font-medium">
                Persyaratan dan data yang mungkin kurang
              </summary>
              <ul className="mt-2 list-disc pl-5 text-text-secondary">
                {program.requirements.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </details>
            <a
              href={program.official_url}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-brand"
            >
              Sumber resmi <ExternalLink size={14} />
            </a>
          </article>
        ))}
      </div>
    </>
  );
}
