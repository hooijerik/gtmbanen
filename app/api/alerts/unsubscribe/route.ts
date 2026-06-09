import { NextResponse } from "next/server";
import { unsubscribeByToken } from "@/lib/mutations";

// Unsubscribe from job-alert emails. The email links to /afmelden?token=... (a
// confirm page) which POSTs here; we also accept ?token= for mail-client
// "List-Unsubscribe" requests. A bare GET just bounces to the confirm page so
// link-scanners can't unsubscribe anyone by accident.
export async function POST(req: Request) {
  const url = new URL(req.url);
  let token = url.searchParams.get("token") || "";
  if (!token) {
    try {
      const form = await req.formData();
      token = String(form.get("token") || "");
    } catch {
      /* no form body */
    }
  }
  const res = token ? unsubscribeByToken(token) : { ok: false };
  return NextResponse.redirect(new URL(`/afmelden?done=${res.ok ? "1" : "0"}`, url), 303);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") || "";
  return NextResponse.redirect(
    new URL(`/afmelden${token ? `?token=${encodeURIComponent(token)}` : ""}`, url),
    302,
  );
}
