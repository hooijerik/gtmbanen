import { addEmployerSubmission } from "@/lib/mutations";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const res = await addEmployerSubmission({
      companyName: body.companyName ? String(body.companyName) : undefined,
      contactEmail: body.contactEmail ? String(body.contactEmail) : undefined,
      jobUrl: body.jobUrl ? String(body.jobUrl) : undefined,
      jobTitle: body.jobTitle ? String(body.jobTitle) : undefined,
      message: body.message ? String(body.message) : undefined,
      package: body.package ? String(body.package) : undefined,
    });
    return Response.json(res, { status: res.ok ? 200 : 400 });
  } catch {
    return Response.json({ ok: false, error: "Ongeldige aanvraag" }, { status: 400 });
  }
}
