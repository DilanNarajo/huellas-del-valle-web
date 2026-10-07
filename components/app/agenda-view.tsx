"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  CalendarDays,
  CalendarX2,
  CircleAlert,
  CircleCheck,
  Gauge,
  ListChecks,
  RefreshCw,
  RotateCcw,
  Timer,
  UserX,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api";
import { fechaCorta, IconoEspecie, IconoServicio } from "@/lib/meta";
import type { Cita, Franja, Indicadores } from "@/lib/types";
import { useDatos } from "@/lib/use-datos";
import { cn } from "@/lib/utils";
import { AgendaTimeline } from "./agenda-timeline";
import { BadgeAsistencia, BadgeEstado, CitaDialog } from "./cita-dialog";
import { FechaSelector } from "./fecha-selector";
import { Panel, PanelHeader } from "./panel";

interface DatosAgenda {
  franjas: Franja[];
  citas: Cita[];
  indicadores: Indicadores | null;
}

async function cargarAgenda(fecha: string): Promise<DatosAgenda> {
  const [f, c, i] = await Promise.all([
    api.franjas(fecha),
    api.citas(fecha),
    api.indicadores(fecha).catch(() => null),
  ]);
  return { franjas: f.franjas, citas: c.citas, indicadores: i };
}

export function useAgenda(fecha: string, version: number) {
  return useDatos(`agenda:${fecha}:${version}`, () => cargarAgenda(fecha));
}

export function AgendaView({
  fecha,
  onFecha,
  version,
  demo,
  puedeReiniciar,
  onReiniciado,
  onAgendarEn,
}: {
  fecha: string;
  onFecha: (f: string) => void;
  version: number;
  demo: boolean;
  puedeReiniciar: boolean;
  onReiniciado: () => void;
  onAgendarEn: (fecha: string, hora: string) => void;
}) {
  const { datos, cargando, primeraCarga, error, recargar } = useAgenda(fecha, version);
  const [seleccion, setSeleccion] = useState<Cita | null>(null);

  const citas = datos?.citas ?? [];
  const franjas = datos?.franjas ?? [];
  const cupo = franjas.reduce((s, f) => s + f.cupo, 0);
  const ocupados = franjas.reduce((s, f) => s + f.ocupados, 0);
  const ocupacion = cupo ? ocupados / cupo : null;
  const confirmadas = citas.filter((c) => c.estado === "CONFIRMADA").length;
  const conAlerta = citas.filter((c) => c.estado === "CONFIRMADA_CON_ALERTA").length;
  const ind = datos?.indicadores;

  const reiniciar = async () => {
    try {
      await api.reiniciarDemo();
      toast.success("Demo reiniciada", { description: "AGENDA vuelve a los datos de partida; CITAS vacía." });
      onReiniciado();
    } catch (e) {
      toast.error("No se pudo reiniciar", { description: String(e) });
    }
  };

  return (
    <div className="grid gap-6 [&>*]:min-w-0">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-[0.14em] text-primary uppercase">
            Operación
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Agenda del día
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="capitalize">{fechaCorta(fecha)}</span> · {citas.length} cita
            {citas.length === 1 ? "" : "s"} en CITAS
            {demo && <span className="text-violet"> · datos de demostración</span>}
          </p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <FechaSelector fecha={fecha} onFecha={onFecha} />
          <Button variant="outline" size="icon" onClick={recargar} aria-label="Actualizar">
            <RefreshCw className={cn(cargando && "animate-spin")} aria-hidden />
          </Button>
          {puedeReiniciar && (
            <Button
              variant="ghost"
              size="sm"
              onClick={reiniciar}
              className="text-muted-foreground"
              aria-label="Reiniciar demo"
            >
              <RotateCcw aria-hidden /> <span className="hidden sm:inline">Reiniciar demo</span>
            </Button>
          )}
        </div>
      </header>

      {error && (
        <div role="alert" className="rounded-xl border border-bad/40 bg-bad-soft px-4 py-3 text-sm text-bad">
          No se pudo leer la hoja: {error}
        </div>
      )}

      {/* KPIs */}
      <section aria-label="Indicadores del día" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Kpi icono={ListChecks} etiqueta="Citas" valor={citas.length} sub={`${cupo || 0} cupos en agenda`} cargando={primeraCarga} i={0} />
        <Kpi icono={CircleCheck} etiqueta="Confirmadas" valor={confirmadas} sub="sin alerta" tono="ok" cargando={primeraCarga} i={1} />
        <Kpi icono={CircleAlert} etiqueta="Con alerta" valor={conAlerta} sub="aviso a administración" tono="warn" cargando={primeraCarga} i={2} />
        <Kpi
          icono={Gauge}
          etiqueta="Ocupación"
          valor={ocupacion === null ? "—" : `${Math.round(ocupacion * 100)}%`}
          sub={`${ocupados}/${cupo} cupos`}
          progreso={ocupacion ?? 0}
          cargando={primeraCarga}
          i={3}
        />
        <Kpi
          icono={UserX}
          etiqueta="Inasistencia · I1"
          valor={ind?.i1_tasa_inasistencia == null ? "—" : `${Math.round(ind.i1_tasa_inasistencia * 100)}%`}
          sub={ind?.marcadas ? `${ind.no_asistio} de ${ind.marcadas} marcadas` : "sin marcar aún"}
          tono="bad"
          cargando={primeraCarga}
          i={4}
        />
        <Kpi
          icono={Timer}
          etiqueta="Respuesta · I2"
          valor={ind?.i2_tiempo_medio_respuesta_s == null ? "—" : `${ind.i2_tiempo_medio_respuesta_s.toFixed(1)} s`}
          sub={ind?.muestras_i2 ? `media de ${ind.muestras_i2} citas` : "sin datos"}
          cargando={primeraCarga}
          i={5}
        />
      </section>

      {/* Timeline */}
      <Panel aria-labelledby="tl-titulo">
        <PanelHeader
          id="tl-titulo"
          icono={CalendarDays}
          titulo="Puestos de atención · 08:00 – 12:00"
          descripcion="Cada fila es un cupo de la franja; las citas se asignan por orden de llegada (60 min). Pulse una cita para ver el detalle y registrar asistencia."
        />
        <div className={cn("p-4 transition-opacity sm:p-6", cargando && !primeraCarga && "opacity-70")}>
          {primeraCarga ? (
            <div className="grid gap-3">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-[264px] w-full rounded-xl" />
            </div>
          ) : franjas.length === 0 && citas.length === 0 ? (
            <div className="flex flex-col items-center rounded-xl border border-dashed px-6 py-14 text-center">
              <CalendarX2 className="size-8 text-muted-foreground" aria-hidden />
              <p className="mt-3 font-medium">Sin franjas para {fechaCorta(fecha)}</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                AGENDA no tiene filas para esta fecha. Una solicitud aquí tomaría la
                ruta de respaldo (INCIDENCIAS).
              </p>
            </div>
          ) : (
            <AgendaTimeline
              fecha={fecha}
              franjas={franjas}
              citas={citas}
              onCita={setSeleccion}
              onAgendarEn={onAgendarEn}
            />
          )}
        </div>
      </Panel>

      {/* Tabla */}
      <Panel aria-labelledby="tabla-titulo">
        <PanelHeader
          id="tabla-titulo"
          icono={ListChecks}
          titulo="Citas del día"
          descripcion="Hoja CITAS filtrada por fecha · estado, alerta y asistencia."
        />
        {primeraCarga ? (
          <div className="grid gap-2 p-6">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : citas.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-muted-foreground">
            No hay citas registradas para esta fecha.
          </p>
        ) : (
          <div className="px-2 pb-2 sm:px-4">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Hora</TableHead>
                  <TableHead>Mascota</TableHead>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Propietario</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Alerta</TableHead>
                  <TableHead>Asistencia</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead className="text-right">
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...citas]
                  .sort((a, b) => a.hora.localeCompare(b.hora) || a.id_cita.localeCompare(b.id_cita))
                  .map((c) => {
                    return (
                      <TableRow key={c.id_cita}>
                        <TableCell className="font-medium tabular">{c.hora}</TableCell>
                        <TableCell>
                          <span className="flex items-center gap-2 font-medium">
                            <IconoEspecie especie={c.especie} className="size-4 text-muted-foreground" aria-label={c.especie} />
                            {c.mascota}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-2">
                            <IconoServicio servicio={c.servicio} className="size-4 text-muted-foreground" aria-hidden />
                            {c.servicio}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-44 truncate">{c.propietario}</TableCell>
                        <TableCell>
                          <BadgeEstado estado={c.estado} />
                        </TableCell>
                        <TableCell>
                          {c.alerta ? (
                            <span className="font-mono text-[11px] text-warn">{c.alerta.replaceAll(";", " · ")}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <BadgeAsistencia valor={c.asistencia} />
                        </TableCell>
                        <TableCell className="font-mono text-[12px] text-muted-foreground">{c.id_cita}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => setSeleccion(c)}>
                            Detalle
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </div>
        )}
      </Panel>

      <CitaDialog cita={seleccion} onClose={() => setSeleccion(null)} onActualizada={recargar} />
    </div>
  );
}

function Kpi({
  icono: Icono,
  etiqueta,
  valor,
  sub,
  tono,
  progreso,
  cargando,
  i,
}: {
  icono: typeof Gauge;
  etiqueta: string;
  valor: React.ReactNode;
  sub: string;
  tono?: "ok" | "warn" | "bad";
  progreso?: number;
  cargando: boolean;
  i: number;
}) {
  const color =
    tono === "ok" ? "text-ok" : tono === "warn" ? "text-warn" : tono === "bad" ? "text-bad" : "text-primary";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.04 }}
      className="glass rounded-2xl p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-xs font-medium text-muted-foreground">{etiqueta}</p>
        <Icono className={cn("size-4 shrink-0", color)} aria-hidden />
      </div>
      {cargando ? (
        <Skeleton className="mt-3 h-8 w-16" />
      ) : (
        <p className="mt-2 text-[28px] leading-none font-semibold tracking-tight tabular">{valor}</p>
      )}
      {progreso !== undefined && !cargando ? (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
          <motion.div
            className={cn(
              "h-full rounded-full",
              progreso >= 0.9 ? "bg-bad" : progreso >= 0.67 ? "bg-warn" : "bg-ok",
            )}
            initial={{ width: 0 }}
            animate={{ width: `${Math.round(progreso * 100)}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
      ) : (
        <p className="mt-2 truncate text-xs text-muted-foreground">{sub}</p>
      )}
      {progreso !== undefined && !cargando && (
        <p className="mt-1.5 truncate text-xs text-muted-foreground tabular">{sub}</p>
      )}
    </motion.div>
  );
}
