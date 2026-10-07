import {
  Bath,
  Cat,
  CircleAlert,
  CircleCheck,
  CircleX,
  Dog,
  LifeBuoy,
  ScanLine,
  Stethoscope,
  Syringe,
  WifiOff,
  type LucideIcon,
} from "lucide-react";

import type { Resultado, Servicio } from "./types";

export type Tono = "ok" | "warn" | "bad" | "fallback";

export interface MetaResultado {
  etiqueta: string;
  corta: string;
  tono: Tono;
  icono: LucideIcon;
  ruta: string;
}

export const META_RESULTADO: Record<
  Resultado | "ERROR_COMUNICACION" | "ERROR_VALIDACION",
  MetaResultado
> = {
  CONFIRMADA: {
    etiqueta: "Cita confirmada",
    corta: "Confirmada",
    tono: "ok",
    icono: CircleCheck,
    ruta: "Confirmar",
  },
  CONFIRMADA_CON_ALERTA: {
    etiqueta: "Confirmada con alerta",
    corta: "Con alerta",
    tono: "warn",
    icono: CircleAlert,
    ruta: "Alerta",
  },
  RECHAZADA: {
    etiqueta: "Solicitud rechazada",
    corta: "Rechazada",
    tono: "bad",
    icono: CircleX,
    ruta: "Rechazo",
  },
  RESPALDO: {
    etiqueta: "Ruta de respaldo",
    corta: "Respaldo",
    tono: "fallback",
    icono: LifeBuoy,
    ruta: "Respaldo",
  },
  ERROR_COMUNICACION: {
    etiqueta: "Sin respuesta del proceso",
    corta: "Error",
    tono: "bad",
    icono: WifiOff,
    ruta: "—",
  },
  ERROR_VALIDACION: {
    etiqueta: "Datos incompletos",
    corta: "Validación",
    tono: "bad",
    icono: CircleX,
    ruta: "—",
  },
};

/** Meta de un resultado; cualquier valor desconocido se trata como ERROR_COMUNICACION. */
export function metaResultado(resultado: string): MetaResultado {
  return (
    META_RESULTADO[resultado as keyof typeof META_RESULTADO] ??
    META_RESULTADO.ERROR_COMUNICACION
  );
}

/** Clases por tono (texto, fondo suave, borde, barra). */
export const TONO: Record<
  Tono,
  { text: string; soft: string; border: string; bar: string; ring: string; halo: string }
> = {
  ok: {
    text: "text-ok",
    soft: "bg-ok-soft",
    border: "border-ok/35",
    bar: "bg-ok",
    ring: "ring-ok/40",
    halo: "ring-ok/10",
  },
  warn: {
    text: "text-warn",
    soft: "bg-warn-soft",
    border: "border-warn/40",
    bar: "bg-warn",
    ring: "ring-warn/40",
    halo: "ring-warn/10",
  },
  bad: {
    text: "text-bad",
    soft: "bg-bad-soft",
    border: "border-bad/35",
    bar: "bg-bad",
    ring: "ring-bad/40",
    halo: "ring-bad/10",
  },
  fallback: {
    text: "text-fallback",
    soft: "bg-fallback-soft",
    border: "border-fallback/35",
    bar: "bg-fallback",
    ring: "ring-fallback/40",
    halo: "ring-fallback/10",
  },
};

export const META_SERVICIO: Record<
  Servicio,
  { icono: LucideIcon; detalle: string }
> = {
  "Consulta general": { icono: Stethoscope, detalle: "Revisión clínica" },
  Vacunación: { icono: Syringe, detalle: "Plan de vacunas" },
  Baño: { icono: Bath, detalle: "Higiene y estética" },
  Ecografía: { icono: ScanLine, detalle: "Imagen diagnóstica" },
};

export function iconoServicio(s: string): LucideIcon {
  return META_SERVICIO[s as Servicio]?.icono ?? Stethoscope;
}

export function iconoEspecie(e: string): LucideIcon {
  return e === "gato" ? Cat : Dog;
}

export function tonoEstado(estado: string): Tono {
  if (estado === "CONFIRMADA") return "ok";
  if (estado === "CONFIRMADA_CON_ALERTA") return "warn";
  if (estado === "RECHAZADA") return "bad";
  return "fallback";
}

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const DIAS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

/** "2026-10-14" → "mié 14 oct" */
export function fechaCorta(iso: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return `${DIAS[d.getUTCDay()]} ${+m[3]} ${MESES[+m[2] - 1]}`;
}

export function sumarDias(iso: string, n: number) {
  const [y, m, d] = iso.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return t.toISOString().slice(0, 10);
}

/** Icono de especie como componente estático (regla react-hooks/static-components). */
export function IconoEspecie({
  especie,
  ...props
}: { especie: string } & React.ComponentProps<typeof Dog>) {
  return especie === "gato" ? <Cat {...props} /> : <Dog {...props} />;
}

export function IconoServicio({
  servicio,
  ...props
}: { servicio: string } & React.ComponentProps<typeof Dog>) {
  switch (servicio) {
    case "Vacunación":
      return <Syringe {...props} />;
    case "Baño":
      return <Bath {...props} />;
    case "Ecografía":
      return <ScanLine {...props} />;
    default:
      return <Stethoscope {...props} />;
  }
}
