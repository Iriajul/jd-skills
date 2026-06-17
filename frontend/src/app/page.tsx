import Link from "next/link";
import { Header } from "@/components/layout/Header";

const FEATURES = [
  { label: "01", title: "Upload Resume", body: "Drop your PDF. Our parser extracts every skill, role, and achievement with precision." },
  { label: "02", title: "Discover Jobs", body: "AI scouts thousands of listings daily and surfaces roles that match your exact profile." },
  { label: "03", title: "Tailor & Apply", body: "LangGraph agents rewrite your resume and craft a cover letter for each position." },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="border-b border-[#111111] newsprint-texture">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 border-t-0">

            {/* Main headline col */}
            <div className="lg:col-span-8 border-b border-[#111111] lg:border-b-0 lg:border-r py-16 lg:py-24 pr-0 lg:pr-12">
              <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-[#CC0000] mb-4">
                ◼ Breaking — AI-Powered Job Search
              </p>
              <h2 className="font-serif text-5xl sm:text-6xl lg:text-8xl font-black leading-[0.92] tracking-tighter text-[#111111] mb-8">
                Your Resume,<br />
                <em className="not-italic text-[#CC0000]">Tailored</em><br />
                for Every Job.
              </h2>
              <p className="font-body text-lg text-[#525252] leading-relaxed max-w-xl mb-10 text-justify">
                ATS Friendly is an AI agent that reads your resume, discovers matching jobs,
                and autonomously rewrites your application materials — tailored, precise, and ready to send.
              </p>
              <div className="flex flex-col sm:flex-row gap-0 border border-[#111111]">
                <Link
                  href="/register"
                  className="flex-1 text-center py-4 font-sans text-xs uppercase tracking-widest bg-[#111111] text-[#F9F9F7] hover:bg-[#CC0000] transition-colors"
                >
                  Start for Free
                </Link>
                <Link
                  href="/login"
                  className="flex-1 text-center py-4 font-sans text-xs uppercase tracking-widest border-t sm:border-t-0 sm:border-l border-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7] transition-colors"
                >
                  Sign In
                </Link>
              </div>
            </div>

            {/* Side stats col */}
            <div className="lg:col-span-4 py-10 lg:py-24 pl-0 lg:pl-10 flex flex-col gap-8">
              {[
                { num: "3×", label: "More interviews on average" },
                { num: "< 2min", label: "Time to a tailored resume" },
                { num: "100%", label: "ATS-compatible output" },
              ].map((s) => (
                <div key={s.label} className="border-b border-[#E5E5E0] pb-6 last:border-b-0">
                  <div className="font-serif text-5xl font-black text-[#111111] leading-none">{s.num}</div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-[#737373] mt-2">{s.label}</div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ── How It Works (inverted) ───────────────────────────────── */}
      <section className="bg-[#111111] text-[#F9F9F7] border-b border-[#111111]">
        <div className="max-w-screen-xl mx-auto px-4 py-16">
          <div className="border-b border-[#333] pb-6 mb-12">
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-[#737373]">How It Works</p>
            <h3 className="font-serif text-4xl font-black mt-2">Three Steps to Your Next Role</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
            {FEATURES.map((f, i) => (
              <div
                key={f.label}
                className={`p-8 ${i < FEATURES.length - 1 ? "border-b md:border-b-0 md:border-r border-[#333]" : ""}`}
              >
                <span className="font-mono text-4xl font-bold text-[#CC0000]">{f.label}</span>
                <h4 className="font-serif text-2xl font-bold mt-4 mb-3">{f.title}</h4>
                <p className="font-body text-sm text-[#A3A3A3] leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="border-b border-[#111111] py-20">
        <div className="max-w-screen-xl mx-auto px-4 text-center">
          <div className="py-6 font-serif text-2xl text-[#E5E5E0] tracking-[1em]">&#x2727; &#x2727; &#x2727;</div>
          <h3 className="font-serif text-4xl lg:text-5xl font-black mb-6">
            Ready to land the interview?
          </h3>
          <Link
            href="/register"
            className="inline-flex items-center justify-center font-sans text-xs uppercase tracking-widest bg-[#111111] text-[#F9F9F7] border border-[#111111] hover:bg-[#CC0000] hover:border-[#CC0000] transition-all px-12 py-4 min-h-[52px]"
          >
            Create Your Free Account
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="mt-auto border-t border-[#111111] px-4 py-6">
        <div className="max-w-screen-xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-serif text-lg font-black">ATS Friendly</span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#737373]">
            Edition: Vol 1.0 · AI Career Agent · {new Date().getFullYear()}
          </span>
        </div>
      </footer>
    </div>
  );
}
