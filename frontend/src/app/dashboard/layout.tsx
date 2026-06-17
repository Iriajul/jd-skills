"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { authApi, type User } from "@/lib/api";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    authApi.me().then(setUser).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header authenticated userName={user?.full_name} />
      <main className="flex-1 max-w-screen-2xl mx-auto w-full px-4 py-10">
        {children}
      </main>
      <footer className="border-t border-[#111111] px-4 py-4">
        <div className="max-w-screen-xl mx-auto">
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#737373]">
            ATS Friendly — AI Career Agent · Vol 1.0
          </span>
        </div>
      </footer>
    </div>
  );
}
