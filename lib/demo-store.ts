/**
 * MODO DEMO — simulación en memoria del contrato.
 *
 * Se usa SOLO cuando faltan las variables de entorno (MAKE_WEBHOOK_URL,
 * APPS_SCRIPT_URL / API_TOKEN). Reproduce la lógica del Escenario 1 para que
 * la interfaz se pueda ver y desplegar antes de conectar Make. Con Make
 * conectado, esta lógica NO se usa: la UI solo muestra lo que Make responde.
 *
 * El estado vive en memoria del proceso (se pierde al reiniciar y, en Vercel,
 * cada instancia serverless tiene el suyo).
 */
import { compactoBogota, legibleBogota, parseBogota } from "./fechas";
import type {
  Cita,
  Franja,
  Indicadores,
  RespuestaProceso,
  SolicitudCita,
} from "./types";

interface FilaAgenda {
  franja: string;
  fecha: string;
  hora: string;
  cupo: number;
  ocupados: number;
}

interface Incidencia {
  id_incidencia: string;
  creado_en: string;
  tipo: "FRANJA_NO_EXISTE";
  franja_solicitada: string;
  propietario: string;
  correo: string;
  mascota: string;
  detalle: string;
}

interface DemoDB {
  agenda: FilaAgenda[];
  citas: Cita[];
  incidencias: Incidencia[];
  ultimoId: Record<string, string>;
}

/** Datos de partida del contrato (8 filas). */
function agendaInicial(): FilaAgenda[] {
  const filas: FilaAgenda[] = [];
  for (const fecha of ["2026-10-14", "2026-10-15"]) {
    [
      ["08:00", 0],
      ["09:00", 1],
      ["10:00", 2],
      ["11:00", 3],
    ].forEach(([hora, ocupados]) => {
      filas.push({
        franja: `${fecha} ${hora}`,
        fecha,
        hora: hora as string,
        cupo: 3,
        ocupados: ocupados as number,
      });
    });
  }
  return filas;
}

function nuevaDB(): DemoDB {
  return { agenda: agendaInicial(), citas: [], incidencias: [], ultimoId: {} };
}

const g = globalThis as unknown as { __huellasDemo?: DemoDB };

function db(): DemoDB {
  if (!g.__huellasDemo) g.__huellasDemo = nuevaDB();
  return g.__huellasDemo;
}

export function reiniciarDemo() {
  g.__huellasDemo = nuevaDB();
}

/** id único: C- + YYYYMMDDHHmmss (Bogotá). Si choca en el mismo segundo, avanza 1 s. */
function nuevoId(prefijo: string, ahora: Date) {
  const base = db();
  let t = ahora.getTime();
  let id = `${prefijo}${compactoBogota(new Date(t))}`;
  const previo = base.ultimoId[prefijo] ?? "";
  while (id <= previo) {
    t += 1000;
    id = `${prefijo}${compactoBogota(new Date(t))}`;
  }
  base.ultimoId[prefijo] = id;
  return id;
}

/**
 * Escenario 1 simulado, réplica 1:1 de blueprint_escenario1.json
 * (módulos 6 «Calcular libres» y 7 «Decidir ruta»; cuerpos de los Webhook response).
 * Orden: validar todo ANTES de cualquier escritura.
 */
export function agendarDemo(s: SolicitudCita): RespuestaProceso {
  const base = db();
  const ahora = new Date();
  const respondidoEn = legibleBogota(ahora);
  const franja = `${s.fecha.replace(/[^0-9-]/g, "")} ${s.hora.replace(/[^0-9:]/g, "")}`;
  const servicioTxt = s.servicio.replace(/[^0-9A-Za-zÁÉÍÓÚáéíóúÑñ ]/g, "");

  // 2–3. Search Rows AGENDA (franja = fecha hora) + Array aggregator
  const fila = base.agenda.find((f) => f.franja === `${s.fecha} ${s.hora}`);
  // 4–5. Search Rows CITAS (correo + mascota + fecha, text:equal) + Array aggregator
  const previas = base.citas.filter(
    (c) => c.correo === s.correo && c.mascota === s.mascota && c.fecha === s.fecha,
  );

  // 6. Calcular libres
  const existeFranja = Boolean(fila);
  const cupo = fila?.cupo ?? 0;
  const ocupadosAntes = fila?.ocupados ?? 0;
  const libresAntes = cupo - ocupadosAntes;
  const mismoServicio = previas.some((c) => c.servicio === s.servicio);
  const dobleCita = previas.length > 0 && !mismoServicio;

  // 7. Decidir ruta (misma precedencia que el blueprint)
  const ruta = !existeFranja
    ? "RESPALDO"
    : libresAntes <= 0
      ? "RECHAZADA"
      : mismoServicio
        ? "RECHAZADA"
        : libresAntes <= 2
          ? "CONFIRMADA_CON_ALERTA"
          : dobleCita
            ? "CONFIRMADA_CON_ALERTA"
            : "CONFIRMADA";
  const DOBLE = "DOBLE_CITA_MISMA_MASCOTA";
  const alerta = !existeFranja
    ? "FRANJA_NO_EXISTE"
    : libresAntes <= 0
      ? "CUPO_LLENO"
      : mismoServicio
        ? DOBLE
        : libresAntes === 1
          ? dobleCita
            ? `CUPO_LLENO;${DOBLE}`
            : "CUPO_LLENO"
          : libresAntes === 2
            ? dobleCita
              ? `ULTIMO_CUPO;${DOBLE}`
              : "ULTIMO_CUPO"
            : dobleCita
              ? DOBLE
              : "";
  const agenda = existeFranja && libresAntes > 0 && !mismoServicio;
  const ocupadosDespues = agenda ? ocupadosAntes + 1 : ocupadosAntes;
  const libresDespues = agenda ? libresAntes - 1 : Math.max(0, libresAntes);

  const comun = {
    franja,
    cupo,
    ocupados_antes: ocupadosAntes,
    ocupados_despues: ocupadosDespues,
    libres: libresDespues,
  };

  // Ruta RESPALDO: INCIDENCIAS (add row) + respuesta
  if (ruta === "RESPALDO") {
    base.incidencias.push({
      id_incidencia: nuevoId("I-", ahora),
      creado_en: respondidoEn,
      tipo: "FRANJA_NO_EXISTE",
      franja_solicitada: `${s.fecha} ${s.hora}`,
      propietario: s.propietario,
      correo: s.correo,
      mascota: s.mascota,
      detalle: `Solicitud de ${s.servicio} (${s.especie}) para una franja que no existe en AGENDA. Solicitado en ${s.solicitado_en}.`,
    });
    return {
      resultado: "RESPALDO",
      mensaje: `La franja ${franja} no existe en la agenda. Se registró una incidencia para que administración contacte al dueño.`,
      ...comun,
      id_cita: "",
      alerta,
    };
  }

  // Ruta RECHAZADA: cero escrituras, cero correos
  if (ruta === "RECHAZADA") {
    return {
      resultado: "RECHAZADA",
      mensaje: `${mismoServicio ? "Rechazada: la mascota ya tiene una cita de este mismo servicio ese día (duplicado)." : "Rechazada: la franja está llena, no quedan cupos."} Franja ${franja}. No se registró nada.`,
      ...comun,
      id_cita: "",
      alerta,
    };
  }

  // Rutas CONFIRMADA / CONFIRMADA_CON_ALERTA: Update AGENDA, Add CITAS (correos simulados)
  fila!.ocupados = ocupadosDespues;
  const id = nuevoId("C-", ahora);
  const conAlerta = ruta === "CONFIRMADA_CON_ALERTA";
  base.citas.push({
    id_cita: id,
    franja,
    fecha: s.fecha,
    hora: s.hora,
    propietario: s.propietario,
    correo: s.correo,
    mascota: s.mascota,
    especie: s.especie,
    servicio: s.servicio,
    estado: ruta,
    alerta: conAlerta ? alerta : "",
    solicitado_en: s.solicitado_en,
    respondido_en: respondidoEn,
    asistencia: "",
  });

  return {
    resultado: ruta,
    mensaje: conAlerta
      ? `Cita confirmada con alerta (${alerta}): ${servicioTxt} el ${franja}. Quedan ${libresDespues} cupos. Se avisó a administración.`
      : `Cita confirmada: ${servicioTxt} el ${franja}. Quedan ${libresDespues} cupos.`,
    ...comun,
    id_cita: id,
    alerta: conAlerta ? alerta : "",
  };
}

export function citasDemo(fecha: string): Cita[] {
  return db()
    .citas.filter((c) => c.fecha === fecha)
    .map((c) => ({ ...c }));
}

export function franjasDemo(fecha: string): Franja[] {
  return db()
    .agenda.filter((f) => f.fecha === fecha)
    .map((f) => ({ ...f, libres: f.cupo - f.ocupados }));
}

export function asistenciaDemo(id: string, asistencia: string) {
  const c = db().citas.find((x) => x.id_cita === id);
  if (!c) return false;
  c.asistencia = asistencia;
  return true;
}

export function indicadoresDemo(fecha: string | null): Indicadores {
  const citas = db().citas.filter((c) => !fecha || c.fecha === fecha);
  const marcadas = citas.filter(
    (c) => c.asistencia === "ASISTIO" || c.asistencia === "NO_ASISTIO",
  );
  const no = marcadas.filter((c) => c.asistencia === "NO_ASISTIO").length;
  const tiempos = citas
    .map((c) => {
      const a = parseBogota(c.solicitado_en)?.getTime() ?? Number.NaN;
      const b = parseBogota(c.respondido_en)?.getTime();
      // respondido_en tiene precisión de segundos: diferencias de hasta −1 s cuentan como 0.
      return b && !Number.isNaN(a) ? Math.max(0, (b - a) / 1000) : null;
    })
    .filter((x): x is number => x !== null);
  return {
    fecha,
    i1_tasa_inasistencia: marcadas.length ? no / marcadas.length : null,
    marcadas: marcadas.length,
    no_asistio: no,
    i2_tiempo_medio_respuesta_s: tiempos.length
      ? tiempos.reduce((s, x) => s + x, 0) / tiempos.length
      : null,
    muestras_i2: tiempos.length,
  };
}
