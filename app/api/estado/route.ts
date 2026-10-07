import { NextResponse } from "next/server";

import { estadoConexion } from "@/lib/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Indica a la UI si cada integración está conectada o en modo demo. */
export function GET() {
  return NextResponse.json(estadoConexion(), {
    headers: { "Cache-Control": "no-store" },
  });
}
