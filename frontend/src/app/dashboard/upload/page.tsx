"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { FileText, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { resumeApi } from "@/lib/api";

type UploadState = "idle" | "uploading" | "done" | "error";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<UploadState>("idle");
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  const pickFile = useCallback((f: File | null | undefined) => {
    if (!f) return;
    const name = f.name.toLowerCase();
    const ok = name.endsWith(".docx") || name.endsWith(".pdf");
    if (!ok) { setError("Upload a .docx (recommended — lets you tailor) or .pdf."); return; }
    if (f.size > 5 * 1024 * 1024) { setError("File must be under 5 MB."); return; }
    setFile(f);
    setError("");
    setState("idle");
  }, []);

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    pickFile(e.dataTransfer.files?.[0]);
  }

  async function handleUpload() {
    if (!file) return;
    setState("uploading");
    setError("");
    try {
      await resumeApi.upload(file);
      setState("done");
      setTimeout(() => router.push("/dashboard"), 1200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setState("error");
    }
  }

  return (
    <div className="max-w-2xl">
      {/* Page header */}
      <div className="border-b border-[#111111] pb-6 mb-10">
        <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-[#CC0000] mb-1">◼ New Document</p>
        <h2 className="font-serif text-4xl font-black">Upload Resume</h2>
        <p className="font-body text-sm text-[#737373] mt-3">
          .docx (recommended) or .pdf · max 5 MB · upload .docx to tailor with exact formatting
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`border-2 border-dashed transition-colors p-16 text-center mb-8 ${
          dragging ? "border-[#111111] bg-[#F5F5F5]" : "border-[#E5E5E0]"
        }`}
      >
        {file ? (
          <div className="flex flex-col items-center gap-4">
            <FileText className="h-10 w-10 text-[#111111]" strokeWidth={1} />
            <div>
              <p className="font-mono text-sm font-medium">{file.name}</p>
              <p className="font-mono text-[10px] text-[#737373] uppercase tracking-wider mt-1">
                {(file.size / 1024).toFixed(0)} KB
              </p>
            </div>
            <button
              onClick={() => { setFile(null); setState("idle"); }}
              className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-[#CC0000] hover:underline"
            >
              <X className="h-3 w-3" /> Remove
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="border border-[#E5E5E0] p-4">
              <Upload className="h-8 w-8 text-[#737373]" strokeWidth={1} />
            </div>
            <div>
              <p className="font-body text-base text-[#525252]">Drag & drop your .docx or .pdf here</p>
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#737373] mt-1">or</p>
            </div>
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".docx,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="sr-only"
                onChange={(e) => pickFile(e.target.files?.[0])}
              />
              <span className="font-sans text-[10px] uppercase tracking-widest border border-[#111111] px-6 py-2.5 hover:bg-[#111111] hover:text-[#F9F9F7] transition-colors inline-block">
                Browse File
              </span>
            </label>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="border border-[#CC0000] px-5 py-4 mb-6">
          <p className="font-mono text-[11px] text-[#CC0000] uppercase tracking-wider">{error}</p>
        </div>
      )}

      {/* Success */}
      {state === "done" && (
        <div className="border border-[#111111] bg-[#111111] text-[#F9F9F7] px-5 py-4 mb-6">
          <p className="font-mono text-[11px] uppercase tracking-widest">◼ Uploaded & indexed — redirecting...</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-0 border border-[#111111]">
        <Button
          onClick={handleUpload}
          disabled={!file || state === "uploading" || state === "done"}
          loading={state === "uploading"}
          size="lg"
          className="flex-1 border-0"
        >
          <Upload className="h-3.5 w-3.5 mr-2" strokeWidth={1.5} />
          Upload & Index
        </Button>
        <Link
          href="/dashboard"
          className="px-8 py-4 font-sans text-[10px] uppercase tracking-widest border-l border-[#111111] hover:bg-[#E5E5E0] transition-colors min-h-[52px] flex items-center"
        >
          Cancel
        </Link>
      </div>

      {/* Info box */}
      <div className="border-l-4 border-[#111111] pl-5 mt-10">
        <p className="font-mono text-[10px] uppercase tracking-widest text-[#737373] mb-2">What happens next</p>
        <ul className="flex flex-col gap-2">
          {[
            "Text is extracted from all pages",
            "Content is split into semantic chunks",
            "Each chunk is embedded and stored in Qdrant",
            "AI agents can now reference your resume",
          ].map((t, i) => (
            <li key={i} className="font-body text-sm text-[#525252] flex items-start gap-2">
              <span className="font-mono text-[10px] text-[#CC0000] mt-0.5 flex-shrink-0">{String(i + 1).padStart(2, "0")}</span>
              {t}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
