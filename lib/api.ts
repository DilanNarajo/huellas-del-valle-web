"use client";

import type { Cita, EstadoConexion, Franja, Indicadores } from "./types";

async function json<T>(r: Response): Promise<T> {
  const data = await r.json().catch(() => null);
  if (!r.ok || !data || data.ok === false) {
    throw new Error(data?.error ?? `HTTP ${r.status}`);
  }
  return data as T;
}

export const api = {
  estado: () =>
    fetch("/api/estado", { cache: "no-store" }).then((r) =>
      json<EstadoConexion>(r),
    ),
  franjas: (fecha: string) =>
    fetch(`/api/franjas?fecha=${fecha}`, { cache: "no-store" }).then((r) =>
      json<{ franjas: Franja[] }>(r),
    ),
  citas: (fecha: string) =>
    fetch(`/api/agenda?fecha=${fecha}`, { cache: "no-store" }).then((r) =>
      json<{ citas: Cita[] }>(r),
    ),
  indicadores: (fecha: string) =>
    fetch(`/api/indicadores?fecha=${fecha}`, { cache: "no-store" }).then((r) =>
      json<Indicadores>(r),
    ),
  asistencia: (id_cita: string, asistencia: "ASISTIO" | "NO_ASISTIO") =>
    fetch("/api/asistencia", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_cita, asistencia }),
    }).then((r) => json<{ ok: true }>(r)),
  reiniciarDemo: () =>
    fetch("/api/demo/reiniciar", { method: "POST" }).then((r) =>
      json<{ ok: true }>(r),
    ),
};
