"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  Calculator,
  Check,
  Copy,
  GitBranch,
  Hash,
  LoaderCircle,
  PawPrint,
  Search,
  Send,
  Timer,
  TriangleAlert,
  Webhook,
  CalendarDays,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TONO, metaResultado, type Tono } from "@/lib/meta";
import type { RespuestaAgendar, RespuestaProceso, SolicitudCita } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Panel } from "./panel";

export type EstadoResultado =
  | { fase: "inicio" }
  | { fase: "enviando"; solicitud: SolicitudCita }
  | {
      fase: "listo";
      solicitud: SolicitudCita;
      respuesta: RespuestaAgendar;
      ms: number;
      caso: string | null;
    };

const esProceso = (r: RespuestaAgendar): r is RespuestaProceso =>
  r.resultado === "CONFIRMADA" ||
  r.resultado === "CONFIRMADA_CON_ALERTA" ||
  r.resultado === "RECHAZADA" ||
  r.resultado === "RESPALDO";

export function ResultadoPanel({
  estado,
  onVerAgenda,
}: {
  estado: EstadoResultado;
  onVerAgenda: (fecha: string) => void;
}) {
  const tono: Tono | null =
    estado.fase === "listo" ? metaResultado(estado.respuesta.resultado).tono : null;

  return (
    <Panel aria-labelledby="res-titulo" className="isolate">
      {/* glow por tono */}
      <AnimatePresence>
        {tono && (
          <motion.div
            key={tono}
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              "pointer-events-none absolute -top-24 left-1/2 -z-10 h-56 w-[120%] -translate-x-1/2 rounded-full blur-3xl",
              TONO[tono].soft,
            )}
          />
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between gap-3 border-b px-5 py-4 sm:px-6">
        <h2 id="res-titulo" className="text-[15px] font-semibold tracking-tight">
          Resultado del proceso
        </h2>
        {estado.fase === "listo" && (
          <span className="inline-flex items-center gap-1.5 rounded-full border bg-background/50 px-2.5 py-1 text-xs text-muted-foreground tabular">
            <Timer className="size-3.5" aria-hidden />
            {estado.ms.toLocaleString("es-CO")} ms
          </span>
        )}
      </div>

      <div aria-live="polite" aria-atomic="true" className="p-5 sm:p-6">
        <AnimatePresence mode="wait" initial={false}>
          {estado.fase === "inicio" && (
            <motion.div
              key="inicio"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid gap-6"
            >
              <div className="flex flex-col items-center py-4 text-center">
                <div className="relative grid size-16 place-items-center">
                  <span className="absolute inset-0 rounded-full border border-dashed border-primary/30" />
                  <span className="absolute inset-2 rounded-full border border-primary/20 bg-primary/5" />
                  <PawPrint className="relative size-6 text-primary" aria-hidden />
                </div>
                <p className="mt-4 text-sm font-medium">Esperando una solicitud</p>
                <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                  Complete el formulario o use un caso de prueba. La respuesta de
                  Make aparecerá aquí con su ruta.
                </p>
              </div>
              <Traza resultado={null} />
            </motion.div>
          )}

          {estado.fase === "enviando" && (
            <motion.div
              key="enviando"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid gap-6"
            >
              <div className="flex items-center gap-4">
                <span className="grid size-14 place-items-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
                  <LoaderCircle className="size-6 animate-spin" aria-hidden />
                </span>
                <div>
                  <p className="text-lg font-semibold">Procesando solicitud…</p>
                  <p className="text-sm text-muted-foreground">
                    {estado.solicitud.mascota || "Mascota"} ·{" "}
                    <span className="tabular">
                      {estado.solicitud.fecha} {estado.solicitud.hora}
                    </span>
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 rounded-xl" />
                ))}
              </div>
              <Traza resultado="enviando" />
            </motion.div>
          )}

          {estado.fase === "listo" && (
            <motion.div
              key={`listo-${estado.ms}-${estado.respuesta.resultado}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <Resultado
                r={estado.respuesta}
                ms={estado.ms}
                solicitud={estado.solicitud}
                onVerAgenda={onVerAgenda}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Panel>
  );
}

function Resultado({
  r,
  ms,
  solicitud,
  onVerAgenda,
}: {
  r: RespuestaAgendar;
  ms: number;
  solicitud: SolicitudCita;
  onVerAgenda: (fecha: string) => void;
}) {
  const meta = metaResultado(r.resultado);
  const tono = TONO[meta.tono];
  const Icono = meta.icono;
  const p = esProceso(r) ? r : null;
  const alertas = p?.alerta ? p.alerta.split(/[;,]/).map((a) => a.trim()).filter(Boolean) : [];

  return (
    <div className="grid gap-5">
      {/* Encabezado del resultado */}
      <div className="flex items-start gap-4">
        <motion.span
          initial={{ scale: 0.6, rotate: -12 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", bounce: 0.5, duration: 0.6 }}
          className={cn(
            "grid size-14 shrink-0 place-items-center rounded-2xl border ring-4",
            tono.soft,
            tono.border,
            tono.text,
            tono.halo,
          )}
        >
          <Icono className="size-7" aria-hidden />
        </motion.span>
        <div className="min-w-0">
          <p className={cn("text-xl font-semibold tracking-tight sm:text-2xl", tono.text)}>
            {meta.etiqueta}
          </p>
          <code
            className={cn(
              "mt-1 inline-block rounded-md border px-1.5 py-0.5 font-mono text-[11px] font-medium",
              tono.border,
              tono.soft,
              tono.text,
            )}
          >
            {r.resultado}
          </code>
        </div>
      </div>

      <p className="text-sm leading-relaxed text-foreground/90">{r.mensaje}</p>

      {p && <MedidorCupo r={p} tono={meta.tono} />}

      <dl className="grid grid-cols-2 gap-2.5">
        <Dato etiqueta="Franja" icono={CalendarDays}>
          <span className="tabular">{p?.franja || `${solicitud.fecha} ${solicitud.hora}`}</span>
        </Dato>
        <Dato etiqueta="Tiempo de respuesta" icono={Timer}>
          <span className="tabular">{ms.toLocaleString("es-CO")} ms</span>
        </Dato>
        <Dato etiqueta="ID de cita" icono={Hash}>
          {p?.id_cita ? <CopiarId id={p.id_cita} /> : <span className="text-muted-foreground">—</span>}
        </Dato>
        <Dato etiqueta="Alerta" icono={TriangleAlert}>
          {alertas.length ? (
            <span className="flex flex-wrap gap-1">
              {alertas.map((a) => (
                <span
                  key={a}
                  className="rounded border border-warn/35 bg-warn-soft px-1.5 py-px font-mono text-[10.5px] text-warn"
                >
                  {a}
                </span>
              ))}
            </span>
          ) : (
            <span className="text-muted-foreground">Sin alerta</span>
          )}
        </Dato>
      </dl>

      <Traza resultado={r.resultado} />

      {p?.id_cita && (
        <Button
          variant="outline"
          className="w-full justify-between"
          onClick={() => onVerAgenda(solicitud.fecha)}
        >
          Ver en la agenda del {solicitud.fecha}
          <ArrowRight aria-hidden />
        </Button>
      )}
    </div>
  );
}

function Dato({
  etiqueta,
  icono: Icono,
  children,
}: {
  etiqueta: string;
  icono: typeof Hash;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-xl border bg-background/40 px-3 py-2.5">
      <dt className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
        <Icono className="size-3" aria-hidden />
        {etiqueta}
      </dt>
      <dd className="mt-1 truncate text-sm font-medium">{children}</dd>
    </div>
  );
}

function CopiarId({ id }: { id: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(id).then(() => {
          setOk(true);
          setTimeout(() => setOk(false), 1400);
        });
      }}
      className="inline-flex max-w-full cursor-pointer items-center gap-1.5 rounded font-mono text-[13px] outline-none hover:text-primary focus-visible:ring-[3px] focus-visible:ring-ring/50"
      aria-label={`Copiar ${id}`}
    >
      <span className="truncate">{id}</span>
      {ok ? <Check className="size-3.5 text-ok" aria-hidden /> : <Copy className="size-3.5 opacity-60" aria-hidden />}
    </button>
  );
}

/* --------------------------- Medidor de cupo --------------------------- */

function MedidorCupo({ r, tono }: { r: RespuestaProceso; tono: Tono }) {
  if (!r.cupo) {
    return (
      <div className="rounded-xl border border-dashed border-fallback/40 bg-fallback-soft px-4 py-3 text-sm text-fallback">
        La franja <span className="font-mono tabular">{r.franja}</span> no existe en AGENDA: no hay
        cupo que medir. Se registró en INCIDENCIAS.
      </div>
    );
  }
  const segmentos = Array.from({ length: r.cupo }, (_, i) =>
    i < r.ocupados_antes ? "previo" : i < r.ocupados_despues ? "nuevo" : "libre",
  );
  const t = TONO[tono];
  return (
    <div className="rounded-xl border bg-background/40 p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          Cupo de la franja
        </p>
        <p className="text-sm tabular">
          <span className="text-muted-foreground">{r.ocupados_antes}</span>
          <ArrowRight className="mx-1 inline size-3.5 text-muted-foreground" aria-hidden />
          <span className={cn("font-semibold", t.text)}>{r.ocupados_despues}</span>
          <span className="text-muted-foreground"> / {r.cupo}</span>
        </p>
      </div>
      <div
        className="mt-3 flex gap-1.5"
        role="img"
        aria-label={`Ocupados antes ${r.ocupados_antes}, después ${r.ocupados_despues} de ${r.cupo}. Libres ${r.libres}.`}
      >
        {segmentos.map((s, i) => (
          <div key={i} className="relative h-3 flex-1 overflow-hidden rounded-full bg-muted ring-1 ring-inset ring-border">
            {s === "libre" && (
              <div className="absolute inset-0 rounded-full border border-dashed border-foreground/15" />
            )}
            {s === "previo" && (
              <div
                className={cn(
                  "absolute inset-0 rounded-full",
                  r.resultado === "RECHAZADA" ? "bg-bad/60" : "bg-foreground/25",
                )}
              />
            )}
            {s === "nuevo" && (
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.25, duration: 0.5, ease: "easeOut" }}
                style={{ originX: 0 }}
                className={cn("absolute inset-0 rounded-full", t.bar)}
              />
            )}
          </div>
        ))}
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <Leyenda clase="bg-foreground/25" texto={`Ocupados antes: ${r.ocupados_antes}`} />
        {r.ocupados_despues > r.ocupados_antes && (
          <Leyenda clase={t.bar} texto="Esta cita" />
        )}
        <span className={cn("ml-auto font-medium tabular", r.libres <= 0 ? "text-bad" : r.libres === 1 ? "text-warn" : "text-ok")}>
          {r.libres} libre{r.libres === 1 ? "" : "s"}
        </span>
      </div>
    </div>
  );
}

function Leyenda({ clase, texto }: { clase: string; texto: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("size-2 rounded-full", clase)} />
      {texto}
    </span>
  );
}

/* -------------------------------- Traza -------------------------------- */

type EstadoPaso = "pendiente" | "activo" | "hecho" | "omitido" | "error";

const RUTAS = [
  { id: "CONFIRMADA", etiqueta: "Confirmar", tono: "ok" },
  { id: "CONFIRMADA_CON_ALERTA", etiqueta: "Alerta", tono: "warn" },
  { id: "RECHAZADA", etiqueta: "Rechazo", tono: "bad" },
  { id: "RESPALDO", etiqueta: "Respaldo", tono: "fallback" },
] as const;

function Traza({ resultado }: { resultado: string | null }) {
  const enviando = resultado === "enviando";
  const respaldo = resultado === "RESPALDO";
  const ruta = RUTAS.find((r) => r.id === resultado);
  // ERROR_COMUNICACION (o cualquier resultado fuera de las 4 rutas) = sin respuesta válida
  const error = resultado !== null && !enviando && !ruta;
  const tono = ruta ? TONO[ruta.tono] : null;

  const pasos: { icono: typeof Webhook; titulo: string; sub: string; estado: EstadoPaso }[] = [
    {
      icono: Webhook,
      titulo: "Webhook",
      sub: "POST JSON",
      estado: error ? "error" : enviando ? "activo" : resultado ? "hecho" : "pendiente",
    },
    {
      icono: Search,
      titulo: "Buscar franja",
      sub: respaldo ? "0 filas" : "AGENDA",
      estado: error ? "omitido" : enviando ? "pendiente" : resultado ? "hecho" : "pendiente",
    },
    {
      icono: Calculator,
      titulo: "Calcular libres",
      sub: respaldo ? "omitido" : "cupo − ocupados",
      estado: error ? "omitido" : respaldo ? "omitido" : resultado && !enviando ? "hecho" : "pendiente",
    },
    {
      icono: GitBranch,
      titulo: ruta ? `Ruta ${ruta.etiqueta}` : "Router",
      sub: ruta ? "tomada" : "4 rutas",
      estado: error ? "omitido" : ruta ? "hecho" : "pendiente",
    },
    {
      icono: Send,
      titulo: "Respuesta",
      sub: error ? "sin respuesta" : "HTTP 200",
      estado: error ? "error" : ruta ? "hecho" : "pendiente",
    },
  ];

  return (
    <div className="rounded-xl border bg-background/40 p-4">
      <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        Traza del Escenario 1
      </p>
      <ol className="mt-3 grid grid-cols-5 gap-1">
        {pasos.map((p, i) => {
          const Icono = p.icono;
          const esRuta = i === 3 && ruta;
          return (
            <li key={i} className="relative flex flex-col items-center text-center">
              {i > 0 && (
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-[17px] h-0 border-t",
                    p.estado === "hecho"
                      ? tono
                        ? tono.border
                        : "border-primary/50"
                      : "border-border",
                    p.estado === "omitido" && "border-dashed border-foreground/20",
                  )}
                  style={{ left: "calc(-50% + 22px)", right: "calc(50% + 22px)" }}
                />
              )}
              <motion.span
                initial={false}
                animate={{ scale: p.estado === "hecho" ? [0.85, 1] : 1 }}
                transition={{ delay: i * 0.08, duration: 0.3 }}
                className={cn(
                  "relative z-10 grid size-9 place-items-center rounded-full border transition-colors",
                  p.estado === "pendiente" && "bg-muted/60 text-muted-foreground/70",
                  p.estado === "activo" && "border-primary/50 bg-primary/10 text-primary",
                  p.estado === "hecho" && !esRuta && "border-primary/40 bg-primary/10 text-primary",
                  p.estado === "hecho" && esRuta && tono && cn(tono.soft, tono.border, tono.text, "ring-4", tono.halo),
                  p.estado === "omitido" && "border-dashed bg-transparent text-muted-foreground/50",
                  p.estado === "error" && "border-bad/40 bg-bad-soft text-bad",
                )}
              >
                {p.estado === "activo" && (
                  <span className="absolute inset-0 animate-ping rounded-full border border-primary/40" />
                )}
                <Icono className="size-4" aria-hidden />
              </motion.span>
              <span
                className={cn(
                  "mt-2 text-[11px] leading-tight font-medium",
                  p.estado === "pendiente" || p.estado === "omitido" ? "text-muted-foreground" : "text-foreground",
                  esRuta && tono?.text,
                )}
              >
                {p.titulo}
              </span>
              <span className="mt-0.5 text-[10px] leading-tight text-muted-foreground">{p.sub}</span>
            </li>
          );
        })}
      </ol>
      <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t pt-3">
        <span className="mr-1 text-[11px] text-muted-foreground">Router:</span>
        {RUTAS.map((r) => {
          const activa = r.id === resultado;
          const t = TONO[r.tono];
          return (
            <span
              key={r.id}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] transition-all",
                activa ? cn(t.soft, t.border, t.text, "font-semibold") : "text-muted-foreground/80 opacity-70",
              )}
              aria-current={activa ? "step" : undefined}
            >
              <span className={cn("size-1.5 rounded-full", activa ? t.bar : "bg-foreground/25")} />
              {r.etiqueta}
            </span>
          );
        })}
      </div>
    </div>
  );
}
