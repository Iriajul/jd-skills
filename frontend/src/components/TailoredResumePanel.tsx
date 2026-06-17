"use client";

import { renderAsync } from "docx-preview";
import { Download, RefreshCw, Save, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { matchApi, type DocxEdit, type ParagraphChange, type TailoredDocx } from "@/lib/api";

const field =
  "w-full border border-[#E5E5E0] bg-transparent px-3 py-2.5 font-body text-base focus:outline-none focus:border-[#111111]";
const labelCls = "font-mono text-[11px] uppercase tracking-widest text-[#737373]";

export default function TailoredResumePanel({
  resume,
  resumeId,
  savedId,
  savedTitle,
  onSaved,
}: {
  resume: TailoredDocx;
  resumeId: string;
  savedId?: string;
  savedTitle?: string;
  onSaved?: () => void;
}) {
  const [paras, setParas] = useState<ParagraphChange[]>(resume.paragraphs);
  const [title, setTitle] = useState(savedTitle ?? "");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [previewing, setPreviewing] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const edits: DocxEdit[] = paras.map((p) => ({ index: p.index, text: p.tailored }));

  const refreshPreview = useCallback(async () => {
    if (!previewRef.current) return;
    setPreviewing(true);
    setError("");
    try {
      const blob = await matchApi.renderDocx({ resume_id: resumeId, edits });
      previewRef.current.innerHTML = "";
      await renderAsync(blob, previewRef.current, undefined, {
        className: "docx",
        inWrapper: true,
        ignoreWidth: false,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Preview failed");
    } finally {
      setPreviewing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeId, JSON.stringify(edits)]);

  // Render the preview once on mount.
  useEffect(() => {
    refreshPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function editPara(i: number, text: string) {
    setParas((p) => p.map((x, j) => (j === i ? { ...x, tailored: text } : x)));
    if (saveState === "done") setSaveState("idle");
  }

  async function handleDownload() {
    setError("");
    try {
      const blob = await matchApi.renderDocx({ resume_id: resumeId, edits });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "tailored_resume.docx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Download failed");
    }
  }

  async function handleSave() {
    if (!title.trim()) {
      setError("Give this version a title (e.g. the job/company).");
      return;
    }
    setSaveState("saving");
    setError("");
    const content: TailoredDocx = { paragraphs: paras, injected_keywords: resume.injected_keywords };
    try {
      if (savedId) await matchApi.updateSaved(savedId, { title: title.trim(), content });
      else await matchApi.saveTailored({ resume_id: resumeId, title: title.trim(), content });
      setSaveState("done");
      onSaved?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Save failed");
      setSaveState("error");
    }
  }

  return (
    <div className="mt-12">
      <div className="border-b border-[#111111] pb-4 mb-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.4em] text-[#CC0000] mb-1">◼ Tailored · Original formatting kept</p>
        <h3 className="font-serif text-4xl font-black">Your Tailored Resume</h3>
        <p className="font-body text-base text-[#737373] mt-2">
          Your document is untouched except for the wording below. Edit any line, refresh the preview, then download the exact same file.
        </p>
      </div>

      {resume.injected_keywords.length > 0 && (
        <div className="border-l-4 border-[#111111] pl-5 mb-8">
          <p className="font-mono text-[11px] uppercase tracking-widest text-[#737373] mb-2 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" strokeWidth={1.5} /> Keywords woven in — verify each is truthful
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            {resume.injected_keywords.map((k, i) => (
              <span key={i} className="font-mono text-[11px] uppercase tracking-wider border border-[#111111] px-2.5 py-1">{k}</span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-8">
        {/* ── Changed lines editor ── */}
        <div className="flex flex-col gap-4">
          <p className={labelCls}>{paras.length} line{paras.length === 1 ? "" : "s"} reworded for this job</p>
          {paras.length === 0 && (
            <p className="font-body text-sm text-[#737373]">The AI didn&apos;t need to change anything for this job.</p>
          )}
          {paras.map((p, i) => (
            <div key={p.index} className="border border-[#E5E5E0] p-4 flex flex-col gap-2">
              <p className="font-body text-sm text-[#A3A3A3] line-through">{p.original}</p>
              <textarea className={field} rows={3} value={p.tailored} onChange={(e) => editPara(i, e.target.value)} />
            </div>
          ))}
        </div>

        {/* ── Live docx preview (real file, scrollable) ── */}
        <div className="xl:sticky xl:top-24 self-start w-full">
          <div className="flex items-center justify-between mb-2">
            <span className={labelCls}>Live Preview (your actual document)</span>
            <button onClick={refreshPreview} disabled={previewing}
              className="font-mono text-[10px] uppercase tracking-widest text-[#111111] hover:text-[#CC0000] flex items-center gap-1 disabled:opacity-50">
              <RefreshCw className={`h-3.5 w-3.5 ${previewing ? "animate-spin" : ""}`} /> {previewing ? "Rendering" : "Refresh"}
            </button>
          </div>
          <div className="border border-[#111111] h-[85vh] overflow-auto bg-[#525252] p-4">
            <div ref={previewRef} className="bg-white mx-auto" />
          </div>
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="mt-8 border-t border-[#111111] pt-6 flex flex-col gap-4">
        {error && (
          <div className="border border-[#CC0000] px-4 py-3">
            <p className="font-mono text-[12px] text-[#CC0000] uppercase tracking-wider">{error}</p>
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-3">
          <input className={`${field} flex-1`} placeholder="Version title (e.g. Data Engineer @ Acme)"
            value={title} onChange={(e) => setTitle(e.target.value)} />
          <Button onClick={handleSave} loading={saveState === "saving"} disabled={saveState === "saving"} variant="outline" size="lg">
            <Save className="h-4 w-4 mr-2" strokeWidth={1.5} />
            {saveState === "done" ? (savedId ? "Updated ✓" : "Saved ✓") : savedId ? "Update Version" : "Save Version"}
          </Button>
          <Button onClick={handleDownload} size="lg">
            <Download className="h-4 w-4 mr-2" strokeWidth={1.5} /> Download .docx
          </Button>
        </div>
      </div>
    </div>
  );
}
