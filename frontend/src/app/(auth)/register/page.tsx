"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { authApi } from "@/lib/api";
import { saveTokens } from "@/lib/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", full_name: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "", general: "" }));
  }

  function validate() {
    const next: Record<string, string> = {};
    if (!form.full_name.trim()) next.full_name = "Required";
    if (!form.email.includes("@")) next.email = "Enter a valid email";
    if (form.password.length < 8) next.password = "Minimum 8 characters";
    return next;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length) { setErrors(v); return; }
    setLoading(true);
    try {
      const data = await authApi.register(form);
      saveTokens(data.access_token, data.refresh_token);
      router.push("/dashboard");
    } catch (err: unknown) {
      setErrors({ general: err instanceof Error ? err.message : "Registration failed" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="border-b border-[#111111] px-4 py-4 flex items-center justify-between">
        <Link href="/" className="font-serif text-xl font-black hover:text-[#CC0000] transition-colors">
          ATS Friendly
        </Link>
        <span className="font-mono text-[10px] uppercase tracking-widest text-[#737373]">
          Create Account
        </span>
      </div>

      <div className="flex flex-1 items-stretch">
        {/* Left — editorial */}
        <div className="hidden lg:flex w-[420px] bg-[#111111] text-[#F9F9F7] flex-col justify-between p-12 border-r border-[#111111]">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-[#737373] mb-6">New Edition</p>
            <h2 className="font-serif text-5xl font-black leading-tight mb-8">
              Your career,<br />on the<br />front page.
            </h2>
            <ul className="flex flex-col gap-4">
              {["Tailored resumes in seconds", "AI cover letters that land interviews", "Job discovery on autopilot"].map((t) => (
                <li key={t} className="flex items-center gap-3 font-body text-sm text-[#A3A3A3]">
                  <span className="w-1.5 h-1.5 bg-[#CC0000] flex-shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="border-t border-[#333] pt-6">
            <div className="font-mono text-[10px] uppercase tracking-widest text-[#737373]">Free to start · No credit card</div>
          </div>
        </div>

        {/* Right — form */}
        <div className="flex-1 flex items-center justify-center px-6 py-16">
          <div className="w-full max-w-sm">
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-[#CC0000] mb-3">◼ New Account</p>
            <h2 className="font-serif text-4xl font-black mb-10">Get Started.</h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-8">
              <Input
                label="Full Name"
                type="text"
                value={form.full_name}
                onChange={(e) => set("full_name", e.target.value)}
                error={errors.full_name}
                required
              />
              <Input
                label="Email Address"
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                error={errors.email}
                required
                autoComplete="email"
              />
              <Input
                label="Password"
                type="password"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                error={errors.password}
                required
                autoComplete="new-password"
              />

              {errors.general && (
                <div className="border border-[#CC0000] px-4 py-3">
                  <p className="font-mono text-[11px] text-[#CC0000] uppercase tracking-wider">{errors.general}</p>
                </div>
              )}

              <Button type="submit" size="full" loading={loading}>
                Create Account
              </Button>
            </form>

            <div className="border-t border-[#E5E5E0] mt-10 pt-6">
              <p className="font-mono text-[11px] text-[#737373] uppercase tracking-wider">
                Already have an account?{" "}
                <Link href="/login" className="text-[#111111] underline decoration-[#CC0000] decoration-2 underline-offset-4">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
