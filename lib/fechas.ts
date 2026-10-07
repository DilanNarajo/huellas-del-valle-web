/** Utilidades de fecha en America/Bogota (UTC−5, sin horario de verano). */

const FORMATO_BOGOTA = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Bogota",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function partesBogota(d: Date) {
  const p: Record<string, string> = {};
  for (const { type, value } of FORMATO_BOGOTA.formatToParts(d)) p[type] = value;
  return { y: p.year, m: p.month, d: p.day, H: p.hour, M: p.minute, S: p.second };
}

/** Equivale a formatDate(now;"YYYYMMDDHHmmss";"America/Bogota"). */
export function compactoBogota(d = new Date()) {
  const p = partesBogota(d);
  return `${p.y}${p.m}${p.d}${p.H}${p.M}${p.S}`;
}

/**
 * Equivale a formatDate(now;"YYYY-MM-DD HH:mm:ss";"America/Bogota").
 * Es el formato de `solicitado_en` (lo envía la interfaz) y de `respondido_en`
 * (lo pone Make), así el I2 resta dos textos con la misma zona horaria.
 */
export function legibleBogota(d = new Date()) {
  const p = partesBogota(d);
  return `${p.y}-${p.m}-${p.d} ${p.H}:${p.M}:${p.S}`;
}

/** "YYYY-MM-DD HH:mm:ss" (hora Bogotá, sin zona). */
export const FECHA_HORA_BOGOTA_RE =
  /^\d{4}-\d{2}-\d{2} ([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/;

/** Interpreta "YYYY-MM-DD HH:mm:ss" como hora de Bogotá. */
export function parseBogota(texto: string): Date | null {
  const m = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}(?::\d{2})?)$/.exec(
    texto.trim(),
  );
  if (!m) {
    const d = new Date(texto);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const hora = m[2].length === 5 ? `${m[2]}:00` : m[2];
  const d = new Date(`${m[1]}T${hora}-05:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/;
export const HORA_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
