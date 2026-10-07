import { NextResponse } from "next/server";
import { z } from "zod";

import { agendarDemo } from "@/lib/demo-store";
import {
  FECHA_HORA_BOGOTA_RE,
  FECHA_RE,
  HORA_RE,
  legibleBogota,
} from "@/lib/fechas";
import { esperar, makeUrl } from "@/lib/server";
import { ESPECIES, SERVICIOS, type SolicitudCita } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TIMEOUT_MS = 45_000;

const esquema = z.object({
  propietario: z.string().trim().min(2, "Escriba el nombre del propietario"),
  correo: z.string().trim().email("Correo no válido"),
  mascota: z.string().trim().min(1, "Escriba el nombre de la mascota"),
  especie: z.enum(ESPECIES, { message: "Especie: perro o gato" }),
  servicio: z.enum(SERVICIOS, { message: "Servicio no válido" }),
  fecha: z.string().regex(FECHA_RE, "Fecha en formato AAAA-MM-DD"),
  hora: z.string().regex(HORA_RE, "Hora en formato HH:MM"),
  // Contrato: "YYYY-MM-DD HH:mm:ss" en hora America/Bogota (mismo formato que
  // respondido_en de Make). Por compatibilidad se acepta ISO-8601 con zona y se
  // convierte a ese formato antes de reenviarlo.
  solicitado_en: z
    .union([
      z.string().regex(FECHA_HORA_BOGOTA_RE),
      z.string().datetime({ offset: true }),
    ])
    .optional(),
});

const RESULTADOS = new Set([
  "CONFIRMADA",
  "CONFIRMADA_CON_ALERTA",
  "RECHAZADA",
  "RESPALDO",
]);

/** Normaliza solicitado_en a "YYYY-MM-DD HH:mm:ss" hora Bogotá. */
function solicitadoBogota(v?: string) {
  if (!v) return legibleBogota(new Date());
  if (FECHA_HORA_BOGOTA_RE.test(v)) return v;
  return legibleBogota(new Date(v));
}

function error(status: number, mensaje: string, extra?: object) {
  return NextResponse.json(
    { resultado: "ERROR_COMUNICACION", mensaje, ...extra },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(req: Request) {
  let cuerpo: unknown;
  try {
    cuerpo = await req.json();
  } catch {
    return NextResponse.json(
      { resultado: "ERROR_VALIDACION", mensaje: "El cuerpo debe ser JSON." },
      { status: 400 },
    );
  }

  const v = esquema.safeParse(cuerpo);
  if (!v.success) {
    const errores: Record<string, string> = {};
    for (const i of v.error.issues) errores[String(i.path[0])] ??= i.message;
    return NextResponse.json(
      {
        resultado: "ERROR_VALIDACION",
        mensaje: "Revise los campos marcados.",
        errores,
      },
      { status: 400 },
    );
  }

  const solicitud: SolicitudCita = {
    ...v.data,
    solicitado_en: solicitadoBogota(v.data.solicitado_en),
  };

  const url = makeUrl();

  // ---- MODO DEMO: sin webhook configurado ----
  if (!url) {
    await esperar(450 + Math.round(Math.random() * 450));
    return NextResponse.json(agendarDemo(solicitud), {
      headers: { "x-proceso": "demo", "Cache-Control": "no-store" },
    });
  }

  // ---- Make: reenvía el JSON y devuelve la respuesta tal cual ----
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  const t0 = Date.now();
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(solicitud),
      cache: "no-store",
      signal: ctrl.signal,
    });
    const texto = await r.text();
    if (!r.ok) {
      return error(
        502,
        `Make respondió HTTP ${r.status}. ${texto.slice(0, 200)}`.trim(),
      );
    }
    let datos: unknown;
    try {
      datos = JSON.parse(texto);
    } catch {
      return error(
        502,
        `Make respondió sin JSON ("${texto.slice(0, 80)}"). ¿Falta el módulo Webhook response en alguna ruta?`,
      );
    }
    const resultado = (datos as { resultado?: unknown } | null)?.resultado;
    if (typeof resultado !== "string" || !RESULTADOS.has(resultado)) {
      return error(
        502,
        `Make respondió un resultado desconocido (${JSON.stringify(resultado ?? null)}). Revise el cuerpo del Webhook response.`,
      );
    }
    return new NextResponse(texto, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "x-proceso": "make",
        "x-duracion-ms": String(Date.now() - t0),
      },
    });
  } catch (e) {
    const abortado = e instanceof Error && e.name === "AbortError";
    return error(
      502,
      abortado
        ? "Make no respondió en 45 s. Verifique que el escenario esté activo."
        : `No se pudo contactar a Make: ${e instanceof Error ? e.message : String(e)}`,
    );
  } finally {
    clearTimeout(timer);
  }
}
