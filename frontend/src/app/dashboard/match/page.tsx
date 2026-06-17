"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Check, FileEdit, Sparkles, Target, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { matchApi, resumeApi, type MatchResult, type Resume, type TailoredDocx } from "@/lib/api";

// docx-preview renders in the browser — load the panel client-side without SSR.
const TailoredResumePanel = dynamic(() => import("@/components/TailoredResumePanel"), {
  ssr: false,
  loading: () => (
    <p className="font-mono text-[11px] uppercase tracking-widest text-[#737373] mt-12">Loading preview…</p>
  ),
});

type State = "idle" | "analyzing" | "done" | "error";
type TailorState = "idle" | "tailoring" | "done" | "error";

export default function MatchPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [resumeId, setResumeId] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<MatchResult | null>(null);
  const [tailorState, setTailorState] = useState<TailorState>("idle");
  const [tailored, setTailored] = useState<TailoredDocx | null>(null);

  useEffect(() => {
    resumeApi.list().then((list) => {
      const ready = list.filter((r) => r.status === "ready");
      setResumes(ready);
      if (ready.length) setResumeId(ready[0].id);
    });
  }, []);

  async function handleAnalyze() {
    if (!resumeId || jobDescription.trim().length < 20) {
      setError("Pick a resume and paste a job description (at least 20 characters).");
      return;
    }
    setState("analyzing");
    setError("");
    setResult(null);
    setTailored(null);
    setTailorState("idle");
    try {
      const res = await matchApi.analyze({ resume_id: resumeId, job_description: jobDescription });
      setResult(res);
      setState("done");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Analysis failed");
      setState("error");
    }
  }

  async function handleTailor() {
    setTailorState("tailoring");
    setError("");
    try {
      const res = await matchApi.tailor({ resume_id: resumeId, job_description: jobDescription });
      setTailored(res);
      setTailorState("done");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Tailoring failed");
      setTailorState("error");
    }
  }

  return (
    <div className="w-full">
      {/* Page header */}
      <div className="border-b border-[#111111] pb-6 mb-10">
        <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-[#CC0000] mb-1">◼ ATS Analysis</p>
        <h2 className="font-serif text-4xl font-black">Match a Job</h2>
        <p className="font-body text-sm text-[#737373] mt-3">
          Paste a job description and we&apos;ll score how well your resume fits — and what&apos;s missing.
        </p>
      </div>

      {resumes.length === 0 ? (
        <div className="border border-[#111111] p-16 text-center">
          <Target className="h-12 w-12 mx-auto mb-6 text-[#E5E5E0]" strokeWidth={1} />
          <h3 className="font-serif text-2xl font-bold mb-3">No ready resumes.</h3>
          <p className="font-body text-sm text-[#737373] mb-8">
            Upload and index a resume before running an ATS match.
          </p>
          <Link href="/dashboard/upload">
            <Button>Upload a Resume</Button>
          </Link>
        </div>
      ) : (
        <>
          {/* Inputs + score stay readable width; the tailored panel below goes full width */}
          <div className="max-w-3xl">
          {/* Resume selector */}
          <label className="block mb-6">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#737373]">Resume</span>
            <select
              value={resumeId}
              onChange={(e) => setResumeId(e.target.value)}
              className="mt-2 w-full border border-[#111111] bg-transparent px-4 py-3 font-body text-sm focus:outline-none focus:bg-[#F5F5F5]"
            >
              {resumes.map((r) => (
                <option key={r.id} value={r.id}>{r.filename}</option>
              ))}
            </select>
          </label>

          {/* Job description */}
          <label className="block mb-6">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#737373]">Job Description</span>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={10}
              placeholder="Paste the full job posting here…"
              className="mt-2 w-full border border-[#111111] bg-transparent px-4 py-3 font-body text-sm resize-y focus:outline-none focus:bg-[#F5F5F5]"
            />
          </label>

          {error && (
            <div className="border border-[#CC0000] px-5 py-4 mb-6">
              <p className="font-mono text-[11px] text-[#CC0000] uppercase tracking-wider">{error}</p>
            </div>
          )}

          <Button
            onClick={handleAnalyze}
            loading={state === "analyzing"}
            disabled={state === "analyzing"}
            size="lg"
            className="w-full"
          >
            <Sparkles className="h-3.5 w-3.5 mr-2" strokeWidth={1.5} />
            Analyze Match
          </Button>

          {/* Result */}
          {result && (
            <div className="mt-12">
              {/* Score */}
              <div className="border border-[#111111] flex items-stretch mb-8">
                <div className="bg-[#111111] text-[#F9F9F7] px-8 py-6 flex flex-col items-center justify-center">
                  <span className="font-serif text-5xl font-black leading-none">{result.match_score}</span>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-[#737373] mt-1">/ 100</span>
                </div>
                <div className="flex-1 px-6 py-6">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-[#CC0000] mb-2">◼ Verdict</p>
                  <p className="font-body text-sm text-[#525252] leading-relaxed">{result.summary}</p>
                </div>
              </div>

              {/* Skills grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-[#111111] mb-8">
                <div className="p-6 md:border-r border-[#111111]">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-[#737373] mb-4">Matched Skills</p>
                  <ul className="flex flex-col gap-2">
                    {result.matched_skills.length === 0 && (
                      <li className="font-body text-sm text-[#737373]">None detected.</li>
                    )}
                    {result.matched_skills.map((s, i) => (
                      <li key={i} className="font-body text-sm flex items-start gap-2">
                        <Check className="h-3.5 w-3.5 text-[#111111] mt-0.5 flex-shrink-0" strokeWidth={2} />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-6 border-t md:border-t-0 border-[#111111]">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-[#CC0000] mb-4">Missing Skills</p>
                  <ul className="flex flex-col gap-2">
                    {result.missing_skills.length === 0 && (
                      <li className="font-body text-sm text-[#737373]">Nothing major missing.</li>
                    )}
                    {result.missing_skills.map((s, i) => (
                      <li key={i} className="font-body text-sm flex items-start gap-2">
                        <X className="h-3.5 w-3.5 text-[#CC0000] mt-0.5 flex-shrink-0" strokeWidth={2} />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Suggestions */}
              <div className="border-l-4 border-[#111111] pl-5">
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#737373] mb-3">Suggestions</p>
                <ul className="flex flex-col gap-2">
                  {result.suggestions.map((s, i) => (
                    <li key={i} className="font-body text-sm text-[#525252] flex items-start gap-2">
                      <span className="font-mono text-[10px] text-[#CC0000] mt-0.5 flex-shrink-0">{String(i + 1).padStart(2, "0")}</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Tailor CTA */}
              {!tailored && (
                <div className="border border-[#111111] mt-10 p-6 text-center">
                  {resumes.find((r) => r.id === resumeId)?.file_format === "docx" ? (
                    <>
                      <p className="font-body text-sm text-[#525252] mb-4">
                        Rewrite the wording for this job — your document&apos;s exact formatting stays
                        untouched, and you can edit every change before downloading.
                      </p>
                      <Button
                        onClick={handleTailor}
                        loading={tailorState === "tailoring"}
                        disabled={tailorState === "tailoring"}
                        size="lg"
                      >
                        <FileEdit className="h-3.5 w-3.5 mr-2" strokeWidth={1.5} />
                        Tailor My Resume for This Job
                      </Button>
                    </>
                  ) : (
                    <p className="font-body text-sm text-[#525252]">
                      Tailoring needs a <strong>.docx</strong> resume so your exact formatting is preserved.
                      This resume is a PDF — <Link href="/dashboard/upload" className="underline">upload a .docx</Link> to tailor it.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
          </div>

          {/* Tailored resume editor + preview + save + download (full width) */}
          {tailored && <TailoredResumePanel resume={tailored} resumeId={resumeId} />}
        </>
      )}
    </div>
  );
}
