"use client";

import { PDFDownloadLink, PDFViewer } from "@react-pdf/renderer";
import { Download, Plus, Save, ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";
import { ResumePDF } from "@/components/ResumePDF";
import { Button } from "@/components/ui/Button";
import { matchApi, type ExperienceItem, type TailoredResume } from "@/lib/api";

const fieldClass =
  "w-full border border-[#E5E5E0] bg-transparent px-3 py-2 font-body text-sm focus:outline-none focus:border-[#111111]";
const labelClass = "font-mono text-[10px] uppercase tracking-widest text-[#737373]";

function emptyExperience(): ExperienceItem {
  return { title: "", company: "", location: "", dates: "", bullets: [] };
}

export default function TailoredResumePanel({
  resume,
  resumeId,
  savedId,
  savedTitle,
  onSaved,
}: {
  resume: TailoredResume;
  resumeId?: string;
  savedId?: string;
  savedTitle?: string;
  onSaved?: () => void;
}) {
  const [data, setData] = useState<TailoredResume>(resume);
  const [title, setTitle] = useState(savedTitle ?? "");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [saveError, setSaveError] = useState("");

  // Show the save/update control when we can either create (resumeId) or update (savedId).
  const canPersist = Boolean(resumeId || savedId);

  const fileName = `${(data.name || "resume").replace(/\s+/g, "_")}_ATS.pdf`;

  function set<K extends keyof TailoredResume>(key: K, value: TailoredResume[K]) {
    setData((d) => ({ ...d, [key]: value }));
    if (saveState === "done") setSaveState("idle");
  }

  function setExp(i: number, patch: Partial<ExperienceItem>) {
    setData((d) => ({
      ...d,
      experience: d.experience.map((e, j) => (j === i ? { ...e, ...patch } : e)),
    }));
  }

  async function handleSave() {
    if (!canPersist) return;
    if (!title.trim()) {
      setSaveError("Give this version a title (e.g. the job/company).");
      return;
    }
    setSaveState("saving");
    setSaveError("");
    try {
      if (savedId) {
        await matchApi.updateSaved(savedId, { title: title.trim(), content: data });
      } else if (resumeId) {
        await matchApi.saveTailored({ resume_id: resumeId, title: title.trim(), content: data });
      }
      setSaveState("done");
      onSaved?.();
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Save failed");
      setSaveState("error");
    }
  }

  return (
    <div className="mt-12">
      <div className="border-b border-[#111111] pb-4 mb-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-[#CC0000] mb-1">◼ ATS-Optimized · Editable</p>
        <h3 className="font-serif text-3xl font-black">Your Tailored Resume</h3>
        <p className="font-body text-sm text-[#737373] mt-2">
          Edit any field — the PDF preview updates live. Verify every injected keyword is true before you send it.
        </p>
      </div>

      {/* Keyword verification */}
      {data.injected_keywords.length > 0 && (
        <div className="border-l-4 border-[#111111] pl-5 mb-8">
          <p className="font-mono text-[10px] uppercase tracking-widest text-[#737373] mb-2 flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.5} />
            Keywords woven in — verify each is truthful
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            {data.injected_keywords.map((k, i) => (
              <span key={i} className="font-mono text-[10px] uppercase tracking-wider border border-[#111111] px-2 py-1">{k}</span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ── Editor ── */}
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3">
            <label className="col-span-2"><span className={labelClass}>Name</span>
              <input className={fieldClass} value={data.name} onChange={(e) => set("name", e.target.value)} />
            </label>
            <label><span className={labelClass}>Email</span>
              <input className={fieldClass} value={data.email} onChange={(e) => set("email", e.target.value)} />
            </label>
            <label><span className={labelClass}>Phone</span>
              <input className={fieldClass} value={data.phone} onChange={(e) => set("phone", e.target.value)} />
            </label>
            <label><span className={labelClass}>Location</span>
              <input className={fieldClass} value={data.location} onChange={(e) => set("location", e.target.value)} />
            </label>
            <label><span className={labelClass}>Links (comma-separated)</span>
              <input className={fieldClass} value={data.links.join(", ")}
                onChange={(e) => set("links", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} />
            </label>
          </div>

          <label><span className={labelClass}>Professional Summary</span>
            <textarea className={fieldClass} rows={4} value={data.summary} onChange={(e) => set("summary", e.target.value)} />
          </label>

          <label><span className={labelClass}>Skills (one per line)</span>
            <textarea className={fieldClass} rows={4} value={data.skills.join("\n")}
              onChange={(e) => set("skills", e.target.value.split("\n").map((s) => s.trim()).filter(Boolean))} />
          </label>

          {/* Experience */}
          <div>
            <p className={`${labelClass} mb-2`}>Experience</p>
            <div className="flex flex-col gap-4">
              {data.experience.map((exp, i) => (
                <div key={i} className="border border-[#E5E5E0] p-3 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[10px] text-[#737373]">#{i + 1}</span>
                    <button onClick={() => set("experience", data.experience.filter((_, j) => j !== i))}
                      className="text-[#CC0000] hover:underline font-mono text-[10px] uppercase flex items-center gap-1">
                      <Trash2 className="h-3 w-3" /> Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input className={fieldClass} placeholder="Title" value={exp.title} onChange={(e) => setExp(i, { title: e.target.value })} />
                    <input className={fieldClass} placeholder="Company" value={exp.company} onChange={(e) => setExp(i, { company: e.target.value })} />
                    <input className={fieldClass} placeholder="Location" value={exp.location} onChange={(e) => setExp(i, { location: e.target.value })} />
                    <input className={fieldClass} placeholder="Dates" value={exp.dates} onChange={(e) => setExp(i, { dates: e.target.value })} />
                  </div>
                  <textarea className={fieldClass} rows={4} placeholder="Bullets (one per line)" value={exp.bullets.join("\n")}
                    onChange={(e) => setExp(i, { bullets: e.target.value.split("\n").map((s) => s.replace(/^[•\-\s]+/, "").trim()).filter(Boolean) })} />
                </div>
              ))}
              <button onClick={() => set("experience", [...data.experience, emptyExperience()])}
                className="border border-dashed border-[#111111] py-2 font-mono text-[10px] uppercase tracking-widest hover:bg-[#F5F5F5] flex items-center justify-center gap-2">
                <Plus className="h-3 w-3" /> Add Experience
              </button>
            </div>
          </div>

          {/* Education */}
          <div>
            <p className={`${labelClass} mb-2`}>Education</p>
            <div className="flex flex-col gap-3">
              {data.education.map((ed, i) => (
                <div key={i} className="border border-[#E5E5E0] p-3 grid grid-cols-3 gap-2 relative">
                  <input className={fieldClass} placeholder="Degree" value={ed.degree}
                    onChange={(e) => set("education", data.education.map((x, j) => j === i ? { ...x, degree: e.target.value } : x))} />
                  <input className={fieldClass} placeholder="Institution" value={ed.institution}
                    onChange={(e) => set("education", data.education.map((x, j) => j === i ? { ...x, institution: e.target.value } : x))} />
                  <input className={fieldClass} placeholder="Dates" value={ed.dates}
                    onChange={(e) => set("education", data.education.map((x, j) => j === i ? { ...x, dates: e.target.value } : x))} />
                  <button onClick={() => set("education", data.education.filter((_, j) => j !== i))}
                    className="absolute -top-2 -right-2 bg-[#F9F9F7] border border-[#CC0000] text-[#CC0000] p-1" aria-label="Remove education">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <button onClick={() => set("education", [...data.education, { degree: "", institution: "", dates: "" }])}
                className="border border-dashed border-[#111111] py-2 font-mono text-[10px] uppercase tracking-widest hover:bg-[#F5F5F5] flex items-center justify-center gap-2">
                <Plus className="h-3 w-3" /> Add Education
              </button>
            </div>
          </div>

          <label><span className={labelClass}>Certifications (one per line)</span>
            <textarea className={fieldClass} rows={3} value={data.certifications.join("\n")}
              onChange={(e) => set("certifications", e.target.value.split("\n").map((s) => s.trim()).filter(Boolean))} />
          </label>
        </div>

        {/* ── Live preview ── */}
        <div className="lg:sticky lg:top-24 self-start w-full">
          <div className="border border-[#111111]" style={{ height: 640 }}>
            <PDFViewer width="100%" height="100%" showToolbar={false}>
              <ResumePDF resume={data} />
            </PDFViewer>
          </div>
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="mt-8 border-t border-[#111111] pt-6 flex flex-col gap-4">
        {saveError && (
          <div className="border border-[#CC0000] px-4 py-3">
            <p className="font-mono text-[11px] text-[#CC0000] uppercase tracking-wider">{saveError}</p>
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-3">
          {canPersist && (
            <>
              <input className={`${fieldClass} flex-1`} placeholder="Version title (e.g. Data Engineer @ Acme)"
                value={title} onChange={(e) => setTitle(e.target.value)} />
              <Button onClick={handleSave} loading={saveState === "saving"} disabled={saveState === "saving"} variant="outline" size="lg">
                <Save className="h-3.5 w-3.5 mr-2" strokeWidth={1.5} />
                {saveState === "done"
                  ? savedId ? "Updated ✓" : "Saved ✓"
                  : savedId ? "Update Version" : "Save Version"}
              </Button>
            </>
          )}
          <PDFDownloadLink document={<ResumePDF resume={data} />} fileName={fileName}>
            {({ loading }) => (
              <span className="inline-flex items-center justify-center font-sans font-semibold uppercase tracking-widest text-xs min-h-[52px] px-8 bg-[#111111] text-[#F9F9F7] border border-[#111111] hover:bg-[#F9F9F7] hover:text-[#111111] transition-all">
                <Download className="h-3.5 w-3.5 mr-2" strokeWidth={1.5} />
                {loading ? "Preparing…" : "Download PDF"}
              </span>
            )}
          </PDFDownloadLink>
        </div>
      </div>
    </div>
  );
}
