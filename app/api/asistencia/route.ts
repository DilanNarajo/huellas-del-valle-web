import { NextResponse } from "next/server";
import { z } from "zod";

import { asistenciaDemo } from "@/lib/demo-store";
import { appsScriptPost, sheetsConectado } from "@/lib/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const esquema = z.object({
  id_cita: z.string().regex(/^C-\d{14}$/, "id_cita no válido"),
  asistencia: z.enum(["ASISTIO", "NO_ASISTIO"]),
});

export async function POST(req: Request) {
  const v = esquema.safeParse(await req.json().catch(() => null));
  if (!v.success) {
    return NextResponse.json(
      { ok: false, error: v.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 },
    );
  }
  if (!sheetsConectado()) {
    const ok = asistenciaDemo(v.data.id_cita, v.data.asistencia);
    return NextResponse.json(
      ok ? { ok: true, modo: "demo", ...v.data } : { ok: false, error: "Cita no encontrada" },
      { status: ok ? 200 : 404 },
    );
  }
  try {
    const data = await appsScriptPost({ action: "asistencia", ...v.data });
    if (!data.ok) throw new Error(String(data.error ?? "Respuesta inválida"));
    return NextResponse.json({ ...data, modo: "conectado" });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: `Apps Script: ${e instanceof Error ? e.message : e}` },
      { status: 502 },
    );
  }
}
