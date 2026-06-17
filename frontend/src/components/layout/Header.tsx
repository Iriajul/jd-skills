"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearTokens } from "@/lib/auth";

interface HeaderProps {
  authenticated?: boolean;
  userName?: string;
}

export function Header({ authenticated, userName }: HeaderProps) {
  const router = useRouter();

  function handleLogout() {
    clearTokens();
    router.push("/login");
  }

  return (
    <header className="border-b border-[#111111] bg-[#F9F9F7] sticky top-0 z-40">
      {/* Edition bar */}
      <div className="border-b border-[#111111] px-4 py-1 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-[#737373]">
          Vol. 1 · AI Career Edition · {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </span>
        {authenticated && userName && (
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#737373]">
            {userName}
          </span>
        )}
      </div>

      {/* Main header */}
      <div className="px-4 py-4 flex items-center justify-between max-w-screen-xl mx-auto">
        <Link href={authenticated ? "/dashboard" : "/"} className="group">
          <h1 className="font-serif text-2xl font-black tracking-tighter text-[#111111] group-hover:text-[#CC0000] transition-colors">
            ATS Friendly
          </h1>
          <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-[#737373]">
            AI Career Agent
          </p>
        </Link>

        <nav className="flex items-center gap-0 border-l border-[#111111]">
          {authenticated ? (
            <>
              <Link
                href="/dashboard"
                className="border-r border-[#111111] px-5 py-3 font-sans text-[10px] uppercase tracking-widest hover:bg-[#111111] hover:text-[#F9F9F7] transition-all"
              >
                Resumes
              </Link>
              <Link
                href="/dashboard/upload"
                className="border-r border-[#111111] px-5 py-3 font-sans text-[10px] uppercase tracking-widest hover:bg-[#111111] hover:text-[#F9F9F7] transition-all"
              >
                Upload
              </Link>
              <Link
                href="/dashboard/match"
                className="border-r border-[#111111] px-5 py-3 font-sans text-[10px] uppercase tracking-widest hover:bg-[#111111] hover:text-[#F9F9F7] transition-all"
              >
                Match
              </Link>
              <Link
                href="/dashboard/tailored"
                className="border-r border-[#111111] px-5 py-3 font-sans text-[10px] uppercase tracking-widest hover:bg-[#111111] hover:text-[#F9F9F7] transition-all"
              >
                Saved
              </Link>
              <button
                onClick={handleLogout}
                className="px-5 py-3 font-sans text-[10px] uppercase tracking-widest hover:bg-[#CC0000] hover:text-[#F9F9F7] transition-all min-h-[44px]"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="border-r border-[#111111] px-5 py-3 font-sans text-[10px] uppercase tracking-widest hover:bg-[#111111] hover:text-[#F9F9F7] transition-all"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-5 py-3 font-sans text-[10px] uppercase tracking-widest bg-[#111111] text-[#F9F9F7] hover:bg-[#CC0000] transition-all"
              >
                Get Started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
