"use client";
import { useState } from "react";
import type { Dict } from "@/lib/i18n/types";

export function EmployerForm({
  t,
  packages,
  packageLabel,
}: {
  t: Dict["forms"]["employer"];
  packages?: { value: string; label: string }[];
  packageLabel?: string;
}) {
  const [form, setForm] = useState({
    package: packages?.[0]?.value ?? "",
    companyName: "",
    contactEmail: "",
    jobUrl: "",
    jobTitle: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const r = await fetch("/api/employer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      setStatus(d.ok ? "ok" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "ok") {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <div className="text-2xl">✅</div>
        <h3 className="mt-2 font-bold text-emerald-900">{t.success}</h3>
        <p className="mt-1 text-sm text-emerald-700">{t.successBody}</p>
      </div>
    );
  }

  const input =
    "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200";

  return (
    <form onSubmit={submit} className="space-y-3">
      {packages && packages.length > 0 && (
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-500">{packageLabel}</span>
          <select
            value={form.package}
            onChange={(e) => setForm({ ...form, package: e.target.value })}
            className={input}
          >
            {packages.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <input value={form.companyName} onChange={set("companyName")} placeholder={t.companyName} className={input} />
        <input
          type="email"
          required
          value={form.contactEmail}
          onChange={set("contactEmail")}
          placeholder={t.contactEmail}
          className={input}
        />
      </div>
      <input value={form.jobTitle} onChange={set("jobTitle")} placeholder={t.jobTitle} className={input} />
      <input
        type="url"
        value={form.jobUrl}
        onChange={set("jobUrl")}
        placeholder={t.jobUrl}
        className={input}
      />
      <textarea
        value={form.message}
        onChange={set("message")}
        placeholder={t.message}
        rows={3}
        className={input}
      />
      {status === "error" && <p className="text-sm text-red-600">{t.error}</p>}
      <button
        type="submit"
        disabled={status === "loading"}
        className="rounded-lg bg-brand-600 px-5 py-2.5 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
      >
        {status === "loading" ? t.submitting : t.submit}
      </button>
    </form>
  );
}
