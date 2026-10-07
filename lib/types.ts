/* Tipos del contrato compartido (00_contrato.md). */

export const ESPECIES = ["perro", "gato"] as const;
export type Especie = (typeof ESPECIES)[number];

export const SERVICIOS = [
  "Consulta general",
  "Vacunación",
  "Baño",
  "Ecografía",
] as const;
export type Servicio = (typeof SERVICIOS)[number];

export const HORAS = ["08:00", "09:00", "10:00", "11:00"] as const;

export type Resultado =
  | "CONFIRMADA"
  | "CONFIRMADA_CON_ALERTA"
  | "RECHAZADA"
  | "RESPALDO";

/** Payload del webhook del Escenario 1. */
export interface SolicitudCita {
  propietario: string;
  correo: string;
  mascota: string;
  especie: Especie;
  servicio: Servicio;
  fecha: string; // AAAA-MM-DD
  hora: string; // HH:MM
  solicitado_en: string; // "YYYY-MM-DD HH:mm:ss" hora America/Bogota (igual que respondido_en)
}

/** Respuesta del webhook (todas las rutas, HTTP 200). */
export interface RespuestaProceso {
  resultado: Resultado;
  mensaje: string;
  franja: string;
  cupo: number;
  ocupados_antes: number;
  ocupados_despues: number;
  libres: number;
  id_cita: string;
  alerta: string;
}

/**
 * Códigos de `alerta` (Escenario 1, módulo 7 «Decidir ruta»):
 * - CUPO_LLENO: la cita tomó el último cupo (queda 0) o, en RECHAZADA, ya no había cupo.
 * - ULTIMO_CUPO: tras agendar queda 1 libre.
 * - DOBLE_CITA_MISMA_MASCOTA: la mascota ya tenía cita ese día (otro servicio → alerta;
 *   mismo servicio → RECHAZADA).
 * - FRANJA_NO_EXISTE: solo en RESPALDO.
 * Se combinan con ";" (p. ej. "ULTIMO_CUPO;DOBLE_CITA_MISMA_MASCOTA").
 */
export type CodigoAlerta =
  | "CUPO_LLENO"
  | "ULTIMO_CUPO"
  | "DOBLE_CITA_MISMA_MASCOTA"
  | "FRANJA_NO_EXISTE";

/** Respuesta de error generada por la propia app (no por Make). */
export interface RespuestaError {
  resultado: "ERROR_COMUNICACION" | "ERROR_VALIDACION";
  mensaje: string;
  errores?: Record<string, string>;
}

export type RespuestaAgendar = RespuestaProceso | RespuestaError;

export type EstadoCita = "CONFIRMADA" | "CONFIRMADA_CON_ALERTA";
export type Asistencia = "" | "ASISTIO" | "NO_ASISTIO";

/** Fila de la hoja CITAS. */
export interface Cita {
  id_cita: string;
  franja: string;
  fecha: string;
  hora: string;
  propietario: string;
  correo: string;
  mascota: string;
  especie: Especie | string;
  servicio: Servicio | string;
  estado: EstadoCita | string;
  alerta: string;
  solicitado_en: string;
  respondido_en: string;
  asistencia: Asistencia | string;
}

/** Fila de AGENDA + libres calculado (solo para mostrar). */
export interface Franja {
  franja: string;
  fecha: string;
  hora: string;
  cupo: number;
  ocupados: number;
  libres: number;
}

export interface Indicadores {
  fecha: string | null;
  /** I1: no asistió / (asistió + no asistió). null si no hay marcadas. */
  i1_tasa_inasistencia: number | null;
  marcadas: number;
  no_asistio: number;
  /** I2: promedio (respondido_en − solicitado_en) en segundos. */
  i2_tiempo_medio_respuesta_s: number | null;
  muestras_i2: number;
}

export type Modo = "demo" | "conectado";

export interface EstadoConexion {
  make: Modo;
  sheets: Modo;
}
