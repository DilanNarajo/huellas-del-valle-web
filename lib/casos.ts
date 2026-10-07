import type { Especie, Resultado, Servicio } from "./types";

export interface CasoPrueba {
  id: "C1" | "C2" | "C3" | "C4" | "C5";
  propietario: string;
  mascota: string;
  especie: Especie;
  servicio: Servicio;
  fecha: string;
  hora: string;
  esperado: Resultado;
  nota: string;
}

/** Casos del contrato (se ejecutan en orden). */
export const CASOS: CasoPrueba[] = [
  {
    id: "C1",
    propietario: "Ana Gómez",
    mascota: "Luna",
    especie: "perro",
    servicio: "Consulta general",
    fecha: "2026-10-14",
    hora: "08:00",
    esperado: "CONFIRMADA",
    nota: "0 → 1 · quedan 2",
  },
  {
    id: "C2",
    propietario: "Carlos Rojas",
    mascota: "Michi",
    especie: "gato",
    servicio: "Vacunación",
    fecha: "2026-10-14",
    hora: "10:00",
    esperado: "CONFIRMADA_CON_ALERTA",
    nota: "2 → 3 · queda 0 · CUPO_LLENO",
  },
  {
    id: "C3",
    propietario: "Diana Torres",
    mascota: "Rocky",
    especie: "perro",
    servicio: "Baño",
    fecha: "2026-10-14",
    hora: "11:00",
    esperado: "RECHAZADA",
    nota: "Cupo lleno (CUPO_LLENO) · sin escrituras",
  },
  {
    id: "C4",
    propietario: "Esteban Muñoz",
    mascota: "Pelusa",
    especie: "gato",
    servicio: "Consulta general",
    fecha: "2026-10-20",
    hora: "08:00",
    esperado: "RESPALDO",
    nota: "FRANJA_NO_EXISTE → INCIDENCIAS",
  },
  {
    id: "C5",
    propietario: "Ana Gómez",
    mascota: "Luna",
    especie: "perro",
    servicio: "Baño",
    fecha: "2026-10-14",
    hora: "09:00",
    esperado: "CONFIRMADA_CON_ALERTA",
    nota: "1 → 2 · ULTIMO_CUPO + doble cita",
  },
];
