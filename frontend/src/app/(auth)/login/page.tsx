"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { authApi } from "@/lib/api";
import { saveTokens } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await authApi.login(form);
      saveTokens(data.access_token, data.refresh_token);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header strip */}
      <div className="border-b border-[#111111] px-4 py-4 flex items-center justify-between">
        <Link href="/" className="font-serif text-xl font-black hover:text-[#CC0000] transition-colors">
          ATS Friendly
        </Link>
        <span className="font-mono text-[10px] uppercase tracking-widest text-[#737373]">
          Sign In
        </span>
      </div>

      <div className="flex flex-1 items-stretch">
        {/* Left — form */}
        <div className="flex-1 flex items-center justify-center px-6 py-16 border-r border-[#111111]">
          <div className="w-full max-w-sm">
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-[#CC0000] mb-3">
              ◼ Secure Access
            </p>
            <h2 className="font-serif text-4xl font-black mb-10">Welcome Back.</h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-8">
              <Input
                label="Email Address"
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                required
                autoComplete="email"
              />
              <Input
                label="Password"
                type="password"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                required
                autoComplete="current-password"
              />

              {error && (
                <div className="border border-[#CC0000] px-4 py-3">
                  <p className="font-mono text-[11px] text-[#CC0000] uppercase tracking-wider">{error}</p>
                </div>
              )}

              <Button type="submit" size="full" loading={loading}>
                Sign In
              </Button>
            </form>

            <div className="border-t border-[#E5E5E0] mt-10 pt-6">
              <p className="font-mono text-[11px] text-[#737373] uppercase tracking-wider">
                No account?{" "}
                <Link href="/register" className="text-[#111111] underline decoration-[#CC0000] decoration-2 underline-offset-4">
                  Create one
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Right — editorial panel */}
        <div className="hidden lg:flex w-[420px] bg-[#111111] text-[#F9F9F7] flex-col justify-between p-12">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-[#737373] mb-6">
              Today&apos;s Edition
            </p>
            <p className="font-serif text-3xl font-bold leading-tight">
              &ldquo;The best resume is one written for the job, not the world.&rdquo;
            </p>
          </div>
          <div className="border-t border-[#333] pt-6">
            <div className="font-mono text-[10px] uppercase tracking-widest text-[#737373]">
              AI Career Agent — Vol 1.0
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
