"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { CircleAlert, Lock, Plus, UserCheck, UserX, ZoomIn } from "lucide-react";

import {
  Timeline,
  TimelineGrid,
  TimelineHeader,
  TimelineProvider,
  TimelineRow,
  TimelineSlot,
  type TimelineRowData,
  type TimelineSlotData,
} from "@/components/ui/timeline";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { IconoEspecie, IconoServicio } from "@/lib/meta";
import type { Cita, Franja } from "@/lib/types";
import { cn } from "@/lib/utils";

type Item =
  | { tipo: "cita"; cita: Cita }
  | { tipo: "precargado"; franja: string }
  | { tipo: "libre"; fecha: string; hora: string };

interface Slot extends TimelineSlotData {
  item: Item;
}

const PUESTOS_MIN = 3;

/** Asigna cada cita de una franja a un puesto (Cupo 1..n) por orden de llegada. */
export function construirSlots(fecha: string, franjas: Franja[], citas: Cita[]) {
  const horas = new Set<string>([...franjas.map((f) => f.hora), ...citas.map((c) => c.hora)]);
  const slots: Slot[] = [];
  let maxPuestos = PUESTOS_MIN;

  for (const hora of [...horas].sort()) {
    const f = franjas.find((x) => x.hora === hora);
    const deFranja = citas
      .filter((c) => c.hora === hora)
      .sort((a, b) =>
        (a.solicitado_en || a.id_cita).localeCompare(b.solicitado_en || b.id_cita),
      );
    // Ocupados de partida (precargados en AGENDA, sin fila en CITAS) llegaron antes.
    const precargados = Math.max(0, (f?.ocupados ?? 0) - deFranja.length);
    const libres = Math.max(0, (f?.cupo ?? 0) - precargados - deFranja.length);

    const cola: Item[] = [
      ...Array.from({ length: precargados }, () => ({
        tipo: "precargado" as const,
        franja: `${fecha} ${hora}`,
      })),
      ...deFranja.map((cita) => ({ tipo: "cita" as const, cita })),
      ...Array.from({ length: libres }, () => ({ tipo: "libre" as const, fecha, hora })),
    ];
    maxPuestos = Math.max(maxPuestos, cola.length);
    cola.forEach((item, i) => {
      slots.push({
        id: item.tipo === "cita" ? item.cita.id_cita : `${item.tipo}-${hora}-${i}`,
        rowId: `cupo-${i + 1}`,
        startTime: hora,
        duration: 60,
        item,
      });
    });
  }

  const rows: TimelineRowData[] = Array.from({ length: maxPuestos }, (_, i) => ({
    id: `cupo-${i + 1}`,
    label: `Cupo ${i + 1}`,
  }));
  return { slots, rows };
}

function useEsMovil() {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia("(max-width: 639px)");
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia("(max-width: 639px)").matches,
    () => false,
  );
}

export function AgendaTimeline({
  fecha,
  franjas,
  citas,
  onCita,
  onAgendarEn,
}: {
  fecha: string;
  franjas: Franja[];
  citas: Cita[];
  onCita: (c: Cita) => void;
  onAgendarEn: (fecha: string, hora: string) => void;
}) {
  const movil = useEsMovil();
  const [zoomUsuario, setZoomUsuario] = useState<number | null>(null);
  const zoom = zoomUsuario ?? (movil ? 50 : 100);
  const columnWidth = movil ? 96 : 150;

  const { slots, rows } = useMemo(
    () => construirSlots(fecha, franjas, citas),
    [fecha, franjas, citas],
  );

  const porId = useMemo(() => new Map(slots.map((s) => [s.id, s])), [slots]);

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          <Leyenda className="border-l-ok bg-ok-soft" texto="Confirmada" />
          <Leyenda className="border-l-warn bg-warn-soft" texto="Con alerta" />
          <Leyenda className="hatch border-l-fallback" texto="Ocupado (precarga)" />
          <Leyenda className="border-dashed border-foreground/35 border-l-1" texto="Cupo libre" />
          <li>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  tabIndex={0}
                  className="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  <Lock className="size-3" aria-hidden /> Solo lectura
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-60">
                Reprogramar debe pasar por el proceso de agendamiento (Make).
              </TooltipContent>
            </Tooltip>
          </li>
        </ul>
        <div className="flex w-full items-center gap-3 sm:w-64">
          <ZoomIn className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <Slider
            aria-label="Porción del día visible"
            min={50}
            max={100}
            step={5}
            value={[zoom]}
            onValueChange={([v]) => setZoomUsuario(v)}
          />
          <span className="w-11 shrink-0 text-right text-xs text-muted-foreground tabular">
            {zoom}%
          </span>
        </div>
      </div>

      <p className="-mb-1 text-xs text-muted-foreground sm:hidden">
        Deslice la agenda horizontalmente para ver todas las franjas →
      </p>
      <TimelineProvider
        config={{ startHour: 8, endHour: 12, columnWidth, snapIntervalMinutes: 15 }}
        percentageInView={zoom}
        onValidateDrop={() => {
          toast.info("Reprogramar debe pasar por el proceso de agendamiento", {
            id: "timeline-solo-lectura",
            description: "La agenda es de solo lectura. Use la vista «Agendar».",
          });
          return false;
        }}
        onSlotClick={(id) => {
          const s = porId.get(id);
          if (!s) return;
          if (s.item.tipo === "cita") onCita(s.item.cita);
          else if (s.item.tipo === "libre") onAgendarEn(s.item.fecha, s.item.hora);
          else
            toast("Cupo ocupado desde la carga inicial", {
              id: "precarga",
              description: "Está contado en AGENDA.ocupados pero no tiene fila en CITAS.",
            });
        }}
      >
        <Timeline
          slots={slots}
          rows={rows}
          className="rounded-xl bg-card [scrollbar-width:thin]"
        >
          <TimelineGrid>
            <TimelineHeader
              columnLabel={
                <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Puesto
                </span>
              }
              className="bg-card [&_[data-slot=timeline-header-column]]:bg-card [&_[data-slot=timeline-hour-marker]]:font-medium [&_[data-slot=timeline-hour-marker]]:tabular-nums"
            />
            {rows.map((row) => (
              <TimelineRow
                key={row.id}
                row={row}
                className="h-[72px] bg-card last:border-b-0"
                renderRowHeader={(r: TimelineRowData) => (
                  <div className="flex items-center gap-2.5 px-3 sm:px-4">
                    <span className="grid size-7 place-items-center rounded-md border bg-muted/60 text-xs font-semibold tabular">
                      {r.id.split("-")[1]}
                    </span>
                    <span className="hidden text-sm font-medium sm:inline">{r.label}</span>
                  </div>
                )}
              >
                {(slot: TimelineSlotData) => (
                  <TimelineSlot
                    slot={slot}
                    className={claseSlot((slot as Slot).item)}
                  >
                    <ContenidoSlot item={(slot as Slot).item} />
                  </TimelineSlot>
                )}
              </TimelineRow>
            ))}
          </TimelineGrid>
        </Timeline>
      </TimelineProvider>
    </div>
  );
}

function claseSlot(item: Item) {
  if (item.tipo === "libre")
    return "rounded-lg border border-dashed border-foreground/15 bg-transparent shadow-none hover:border-primary/60 hover:bg-primary/[0.06] hover:ring-0";
  if (item.tipo === "precargado")
    return "hatch rounded-lg border border-fallback/25 border-l-[3px] border-l-fallback/70 bg-fallback-soft shadow-none";
  const alerta = item.cita.estado === "CONFIRMADA_CON_ALERTA";
  return cn(
    "rounded-lg border border-l-[3px] shadow-sm",
    alerta
      ? "border-warn/30 border-l-warn bg-warn-soft"
      : "border-ok/30 border-l-ok bg-ok-soft",
    item.cita.asistencia === "NO_ASISTIO" && "opacity-60",
  );
}

function ContenidoSlot({ item }: { item: Item }) {
  if (item.tipo === "libre") {
    return (
      <div className="flex h-full items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <Plus className="size-3.5" aria-hidden />
        <span className="truncate">Libre</span>
      </div>
    );
  }
  if (item.tipo === "precargado") {
    return (
      <div className="flex h-full flex-col justify-center px-2.5">
        <span className="truncate text-xs font-medium text-fallback">Ocupado</span>
        <span className="truncate text-[11px] text-muted-foreground">Carga inicial</span>
      </div>
    );
  }
  const c = item.cita;
  const alerta = c.estado === "CONFIRMADA_CON_ALERTA";
  return (
    <div className="flex h-full min-w-0 flex-col justify-center gap-1 px-2.5">
      <div className="flex min-w-0 items-center gap-1.5">
        <span
          className={cn(
            "grid size-5 shrink-0 place-items-center rounded-md",
            alerta ? "bg-warn/20 text-warn" : "bg-ok/20 text-ok",
          )}
        >
          <IconoEspecie especie={c.especie} className="size-3" aria-hidden />
        </span>
        <span className="truncate text-[13px] font-semibold">{c.mascota}</span>
        {c.alerta && <CircleAlert className="size-3.5 shrink-0 text-warn" aria-label="Con alerta" />}
        {c.asistencia === "ASISTIO" && <UserCheck className="ml-auto size-3.5 shrink-0 text-ok" aria-label="Asistió" />}
        {c.asistencia === "NO_ASISTIO" && <UserX className="ml-auto size-3.5 shrink-0 text-bad" aria-label="No asistió" />}
      </div>
      <div className="flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
        <IconoServicio servicio={c.servicio} className="size-3 shrink-0" aria-hidden />
        <span className="truncate">
          {c.servicio} · {c.propietario}
        </span>
      </div>
    </div>
  );
}

function Leyenda({ className, texto }: { className: string; texto: string }) {
  return (
    <li className="inline-flex items-center gap-1.5">
      <span className={cn("h-3 w-4 rounded-[4px] border border-l-[3px]", className)} />
      {texto}
    </li>
  );
}
