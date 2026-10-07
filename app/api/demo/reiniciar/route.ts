import { NextResponse } from "next/server";

import { reiniciarDemo } from "@/lib/demo-store";
import { estadoConexion } from "@/lib/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Solo en modo demo: vuelve a los datos de partida del contrato. */
export function POST() {
  const e = estadoConexion();
  if (e.make !== "demo" || e.sheets !== "demo") {
    return NextResponse.json(
      { ok: false, error: "Solo disponible en modo demo" },
      { status: 403 },
    );
  }
  reiniciarDemo();
  return NextResponse.json({ ok: true });
}
