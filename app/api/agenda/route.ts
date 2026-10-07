import { NextResponse, type NextRequest } from "next/server";

import { citasDemo } from "@/lib/demo-store";
import { FECHA_RE } from "@/lib/fechas";
import { appsScriptGet, sheetsConectado } from "@/lib/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const fecha = req.nextUrl.searchParams.get("fecha") ?? "";
  if (!FECHA_RE.test(fecha)) {
    return NextResponse.json(
      { ok: false, error: "Parámetro fecha=AAAA-MM-DD requerido" },
      { status: 400 },
    );
  }
  if (!sheetsConectado()) {
    return NextResponse.json({ ok: true, modo: "demo", fecha, citas: citasDemo(fecha) });
  }
  try {
    const data = await appsScriptGet({ action: "citas", fecha });
    if (!data.ok) throw new Error(String(data.error ?? "Respuesta inválida"));
    return NextResponse.json({ ...data, modo: "conectado" });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: `Apps Script: ${e instanceof Error ? e.message : e}` },
      { status: 502 },
    );
  }
}
