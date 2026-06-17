"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { ArrowLeft, FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { matchApi, type SavedTailored, type SavedTailoredListItem } from "@/lib/api";

const TailoredResumePanel = dynamic(() => import("@/components/TailoredResumePanel"), {
  ssr: false,
  loading: () => (
    <p className="font-mono text-[11px] uppercase tracking-widest text-[#737373] mt-12">Loading preview…</p>
  ),
});

export default function SavedTailoredPage() {
  const [items, setItems] = useState<SavedTailoredListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SavedTailored | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function load() {
    try {
      setItems(await matchApi.listSaved());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function open(id: string) {
    setSelected(await matchApi.getSaved(id));
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this saved version?")) return;
    setDeleting(id);
    try {
      await matchApi.deleteSaved(id);
      setItems((x) => x.filter((i) => i.id !== id));
      if (selected?.id === id) setSelected(null);
    } finally {
      setDeleting(null);
    }
  }

  // ── Detail view ──
  if (selected) {
    return (
      <div className="max-w-5xl">
        <button onClick={() => setSelected(null)}
          className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-[#737373] hover:text-[#111111] mb-6">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to saved
        </button>
        <div className="border-b border-[#111111] pb-6 mb-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-[#CC0000] mb-1">◼ Saved Version</p>
          <h2 className="font-serif text-4xl font-black">{selected.title}</h2>
        </div>
        {/* savedId → edit in place (PUT) and re-download */}
        <TailoredResumePanel
          resume={selected.content}
          savedId={selected.id}
          savedTitle={selected.title}
          onSaved={load}
        />
      </div>
    );
  }

  // ── List view ──
  return (
    <div className="max-w-4xl">
      <div className="flex items-start justify-between border-b border-[#111111] pb-6 mb-10">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-[#CC0000] mb-1">◼ Library</p>
          <h2 className="font-serif text-4xl font-black">Saved Resumes</h2>
        </div>
        <Link href="/dashboard/match"><Button>New Match</Button></Link>
      </div>

      {loading ? (
        <div className="border border-[#E5E5E0] p-12 text-center">
          <p className="font-mono text-[11px] uppercase tracking-widest text-[#737373]">Loading...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="border border-[#111111] p-16 text-center">
          <FileText className="h-12 w-12 mx-auto mb-6 text-[#E5E5E0]" strokeWidth={1} />
          <h3 className="font-serif text-2xl font-bold mb-3">No saved versions yet.</h3>
          <p className="font-body text-sm text-[#737373] mb-8">Tailor a resume for a job, then save it here.</p>
          <Link href="/dashboard/match"><Button>Match a Job</Button></Link>
        </div>
      ) : (
        <div className="border border-[#111111]">
          {items.map((it, i) => (
            <div key={it.id}
              className={`grid grid-cols-12 items-center hover:bg-[#F5F5F5] transition-colors ${i < items.length - 1 ? "border-b border-[#E5E5E0]" : ""}`}>
              <button onClick={() => open(it.id)} className="col-span-9 px-5 py-4 flex items-center gap-3 text-left">
                <FileText className="h-4 w-4 flex-shrink-0 text-[#737373]" strokeWidth={1.5} />
                <span className="font-body text-sm truncate">{it.title}</span>
              </button>
              <div className="col-span-2 px-5 py-4 border-l border-[#E5E5E0]">
                <span className="font-mono text-[11px] text-[#737373]">{new Date(it.created_at).toLocaleDateString()}</span>
              </div>
              <div className="col-span-1 px-4 py-4 border-l border-[#E5E5E0] flex justify-center">
                <button onClick={() => handleDelete(it.id)} disabled={deleting === it.id} aria-label="Delete"
                  className="p-2 hover:bg-[#CC0000] hover:text-[#F9F9F7] transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center">
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
