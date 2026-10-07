import { NextResponse, type NextRequest } from "next/server";

import { indicadoresDemo } from "@/lib/demo-store";
import { FECHA_RE } from "@/lib/fechas";
import { appsScriptGet, sheetsConectado } from "@/lib/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const f = req.nextUrl.searchParams.get("fecha");
  const fecha = f && FECHA_RE.test(f) ? f : null;
  if (!sheetsConectado()) {
    return NextResponse.json({ ok: true, modo: "demo", ...indicadoresDemo(fecha) });
  }
  try {
    const data = await appsScriptGet(
      fecha ? { action: "indicadores", fecha } : { action: "indicadores" },
    );
    if (!data.ok) throw new Error(String(data.error ?? "Respuesta inválida"));
    return NextResponse.json({ ...data, modo: "conectado" });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: `Apps Script: ${e instanceof Error ? e.message : e}` },
      { status: 502 },
    );
  }
}
