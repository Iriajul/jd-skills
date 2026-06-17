"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FileText, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { resumeApi, type Resume } from "@/lib/api";

export default function DashboardPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function load() {
    try {
      setResumes(await resumeApi.list());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: string) {
    if (!confirm("Delete this resume?")) return;
    setDeleting(id);
    try {
      await resumeApi.delete(id);
      setResumes((r) => r.filter((x) => x.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div>
      {/* Page header */}
      <div className="flex items-start justify-between border-b border-[#111111] pb-6 mb-10">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-[#CC0000] mb-1">◼ Your Files</p>
          <h2 className="font-serif text-4xl font-black">Resumes</h2>
        </div>
        <Link href="/dashboard/upload">
          <Button variant="primary" size="md">
            <Upload className="h-3 w-3 mr-2" strokeWidth={1.5} />
            Upload PDF
          </Button>
        </Link>
      </div>

      {/* Content */}
      {loading ? (
        <div className="border border-[#E5E5E0] p-12 text-center">
          <p className="font-mono text-[11px] uppercase tracking-widest text-[#737373]">Loading...</p>
        </div>
      ) : resumes.length === 0 ? (
        <div className="border border-[#111111] p-16 text-center">
          <FileText className="h-12 w-12 mx-auto mb-6 text-[#E5E5E0]" strokeWidth={1} />
          <h3 className="font-serif text-2xl font-bold mb-3">No resumes yet.</h3>
          <p className="font-body text-sm text-[#737373] mb-8">
            Upload a PDF and the AI will parse, chunk, and index it.
          </p>
          <Link href="/dashboard/upload">
            <Button>Upload Your First Resume</Button>
          </Link>
        </div>
      ) : (
        <div className="border border-[#111111]">
          {/* Table header */}
          <div className="grid grid-cols-12 border-b border-[#111111] bg-[#F5F5F5]">
            <div className="col-span-5 px-5 py-3 font-mono text-[10px] uppercase tracking-widest text-[#737373]">File</div>
            <div className="col-span-2 px-5 py-3 font-mono text-[10px] uppercase tracking-widest text-[#737373] border-l border-[#E5E5E0]">Status</div>
            <div className="col-span-2 px-5 py-3 font-mono text-[10px] uppercase tracking-widest text-[#737373] border-l border-[#E5E5E0]">Chunks</div>
            <div className="col-span-2 px-5 py-3 font-mono text-[10px] uppercase tracking-widest text-[#737373] border-l border-[#E5E5E0]">Uploaded</div>
            <div className="col-span-1 px-5 py-3 border-l border-[#E5E5E0]" />
          </div>

          {/* Rows */}
          {resumes.map((r, i) => (
            <div
              key={r.id}
              className={`grid grid-cols-12 items-center hover:bg-[#F5F5F5] transition-colors ${i < resumes.length - 1 ? "border-b border-[#E5E5E0]" : ""}`}
            >
              <div className="col-span-5 px-5 py-4 flex items-center gap-3">
                <FileText className="h-4 w-4 flex-shrink-0 text-[#737373]" strokeWidth={1.5} />
                <span className="font-body text-sm truncate">{r.filename}</span>
              </div>
              <div className="col-span-2 px-5 py-4 border-l border-[#E5E5E0]">
                <span
                  className={`font-mono text-[10px] uppercase tracking-widest ${
                    r.status === "ready"
                      ? "text-[#111111]"
                      : r.status === "failed"
                      ? "text-[#CC0000]"
                      : "text-[#737373]"
                  }`}
                >
                  {r.status === "ready" ? "◼ Ready" : r.status === "failed" ? "✕ Failed" : "○ Processing"}
                </span>
              </div>
              <div className="col-span-2 px-5 py-4 border-l border-[#E5E5E0]">
                <span className="font-mono text-xs text-[#737373]">{r.chunk_count}</span>
              </div>
              <div className="col-span-2 px-5 py-4 border-l border-[#E5E5E0]">
                <span className="font-mono text-[11px] text-[#737373]">
                  {new Date(r.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="col-span-1 px-4 py-4 border-l border-[#E5E5E0] flex justify-center">
                <button
                  onClick={() => handleDelete(r.id)}
                  disabled={deleting === r.id}
                  aria-label="Delete resume"
                  className="p-2 hover:bg-[#CC0000] hover:text-[#F9F9F7] transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                >
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
