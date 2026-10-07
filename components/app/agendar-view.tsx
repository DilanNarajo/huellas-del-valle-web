"use client";

import { useEffect, useId, useRef, useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  ArrowRight,
  Cat,
  Dog,
  LoaderCircle,
  Mail,
  PawPrint,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import type { CasoPrueba } from "@/lib/casos";
import { legibleBogota } from "@/lib/fechas";
import { META_SERVICIO, fechaCorta, metaResultado } from "@/lib/meta";
import {
  HORAS,
  SERVICIOS,
  type Especie,
  type Franja,
  type RespuestaAgendar,
  type Servicio,
} from "@/lib/types";
import { useDatos } from "@/lib/use-datos";
import { cn } from "@/lib/utils";
import { CasosCard } from "./casos-card";
import { HistorialCard, type EntradaHistorial } from "./historial-card";
import { ResultadoPanel, type EstadoResultado } from "./resultado-panel";
import { Panel, PanelHeader } from "./panel";

export interface Prefill {
  fecha: string;
  hora: string;
  nonce: number;
}

interface Formulario {
  propietario: string;
  correo: string;
  mascota: string;
  especie: Especie;
  servicio: Servicio;
  fecha: string;
  hora: string;
}

const INICIAL: Formulario = {
  propietario: "",
  correo: "",
  mascota: "",
  especie: "perro",
  servicio: "Consulta general",
  fecha: "2026-10-14",
  hora: "08:00",
};

const FECHAS_RAPIDAS = ["2026-10-14", "2026-10-15"];
const CLAVE_HISTORIAL = "huellas.historial.v1";

function leerHistorial(): EntradaHistorial[] {
  try {
    const raw = sessionStorage.getItem(CLAVE_HISTORIAL);
    return raw ? (JSON.parse(raw) as EntradaHistorial[]) : [];
  } catch {
    return [];
  }
}

export function AgendarView({
  prefill,
  demo,
  onAgendado,
  onVerAgenda,
}: {
  prefill: Prefill | null;
  demo: boolean;
  onAgendado: () => void;
  onVerAgenda: (fecha: string) => void;
}) {
  const [form, setForm] = useState<Formulario>(INICIAL);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [resultado, setResultado] = useState<EstadoResultado>({ fase: "inicio" });
  const [historial, setHistorial] = useState<EntradaHistorial[]>([]);
  const [casoActivo, setCasoActivo] = useState<CasoPrueba["id"] | null>(null);
  const [correoPruebas, setCorreoPruebas] = useState("pruebas@example.com");
  const ultimoPrefill = useRef<number | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const resultadoRef = useRef<HTMLDivElement>(null);

  const fechaValida = /^\d{4}-\d{2}-\d{2}$/.test(form.fecha);
  const franjas = useDatos(fechaValida ? `franjas:${form.fecha}` : null, () =>
    api.franjas(form.fecha),
  );
  const recargarFranjas = franjas.recargar;

  // Historial persistido en la pestaña (sessionStorage)
  useEffect(() => {
    const h = leerHistorial();
    if (h.length) queueMicrotask(() => setHistorial(h));
  }, []);
  useEffect(() => {
    try {
      sessionStorage.setItem(CLAVE_HISTORIAL, JSON.stringify(historial.slice(0, 30)));
    } catch {
      /* almacenamiento no disponible */
    }
  }, [historial]);

  // Prefill desde la agenda ("Agendar aquí")
  useEffect(() => {
    if (!prefill || prefill.nonce === ultimoPrefill.current) return;
    ultimoPrefill.current = prefill.nonce;
    queueMicrotask(() => {
      setForm((f) => ({ ...f, fecha: prefill.fecha, hora: prefill.hora }));
      setCasoActivo(null);
    });
  }, [prefill]);

  const set = <K extends keyof Formulario>(k: K, v: Formulario[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrores((e) => {
      if (!e[k]) return e;
      const n = { ...e };
      delete n[k];
      return n;
    });
  };

  const rellenarCaso = (c: CasoPrueba) => {
    setForm({
      propietario: c.propietario,
      correo: correoPruebas.trim() || "pruebas@example.com",
      mascota: c.mascota,
      especie: c.especie,
      servicio: c.servicio,
      fecha: c.fecha,
      hora: c.hora,
    });
    setErrores({});
    setCasoActivo(c.id);
    toast(`Formulario listo con ${c.id}`, {
      description: "Revise los datos y pulse «Agendar cita».",
    });
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const enviar = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (resultado.fase === "enviando") return;
    // Hora Bogotá "YYYY-MM-DD HH:mm:ss", igual que respondido_en de Make (I2).
    const solicitud = { ...form, solicitado_en: legibleBogota() };
    const caso = casoActivo;
    setResultado({ fase: "enviando", solicitud });
    if (window.matchMedia("(max-width: 1023px)").matches) {
      resultadoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    const t0 = performance.now();
    let data: RespuestaAgendar;
    try {
      const r = await fetch("/api/agendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(solicitud),
      });
      data = (await r.json()) as RespuestaAgendar;
      if (!data || typeof data.resultado !== "string") throw new Error(`HTTP ${r.status}`);
    } catch (e) {
      data = {
        resultado: "ERROR_COMUNICACION",
        mensaje: `No se pudo contactar al servidor: ${e instanceof Error ? e.message : e}`,
      };
    }
    const ms = Math.round(performance.now() - t0);

    if (data.resultado === "ERROR_VALIDACION") {
      setErrores(("errores" in data && data.errores) || {});
      setResultado({ fase: "inicio" });
      toast.error("Faltan datos", { description: data.mensaje });
      return;
    }

    setResultado({ fase: "listo", solicitud, respuesta: data, ms, caso });
    setHistorial((h) => [
      {
        n: (h[0]?.n ?? 0) + 1,
        hora: new Date().toLocaleTimeString("es-CO", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }),
        mascota: solicitud.mascota,
        servicio: solicitud.servicio,
        franja: `${solicitud.fecha} ${solicitud.hora}`,
        resultado: data.resultado,
        id_cita: "id_cita" in data ? data.id_cita : "",
        ms,
        caso,
      },
      ...h,
    ]);
    const meta = metaResultado(data.resultado);
    const fn =
      meta.tono === "ok"
        ? toast.success
        : meta.tono === "warn"
          ? toast.warning
          : meta.tono === "bad"
            ? toast.error
            : toast.info;
    fn(meta.etiqueta, { description: data.mensaje });
    recargarFranjas();
    onAgendado();
  };

  const enviando = resultado.fase === "enviando";

  return (
    <div className="grid gap-6 lg:grid-cols-12 lg:grid-rows-[auto_1fr] [&>*]:min-w-0">
      <div className="space-y-6 lg:col-span-7 lg:row-start-1">
        <motion.header
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-end justify-between gap-3"
        >
          <div>
            <p className="text-xs font-medium tracking-[0.14em] text-primary uppercase">
              Recepción
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
              Agendar una cita
            </h1>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              La solicitud viaja al proceso automático (Make), que valida el
              cupo y decide la ruta. Aquí solo se muestra su respuesta.
            </p>
          </div>
        </motion.header>

        <Panel>
          <form ref={formRef} onSubmit={enviar} noValidate className="scroll-mt-24">
            <PanelHeader
              titulo="Datos de la solicitud"
              descripcion="Todos los campos son obligatorios."
              icono={PawPrint}
            />
            <div className="grid gap-5 p-5 sm:p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <Campo
                  id="propietario"
                  etiqueta="Propietario"
                  error={errores.propietario}
                  icono={User}
                >
                  <Input
                    id="propietario"
                    value={form.propietario}
                    onChange={(e) => set("propietario", e.target.value)}
                    placeholder="Nombre y apellido"
                    autoComplete="name"
                    aria-invalid={!!errores.propietario}
                    className="pl-9"
                  />
                </Campo>
                <Campo id="correo" etiqueta="Correo" error={errores.correo} icono={Mail}>
                  <Input
                    id="correo"
                    type="email"
                    inputMode="email"
                    value={form.correo}
                    onChange={(e) => set("correo", e.target.value)}
                    placeholder="dueno@correo.com"
                    autoComplete="email"
                    aria-invalid={!!errores.correo}
                    className="pl-9"
                  />
                </Campo>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Campo
                  id="mascota"
                  etiqueta="Mascota"
                  error={errores.mascota}
                  icono={PawPrint}
                >
                  <Input
                    id="mascota"
                    value={form.mascota}
                    onChange={(e) => set("mascota", e.target.value)}
                    placeholder="Nombre de la mascota"
                    aria-invalid={!!errores.mascota}
                    className="pl-9"
                  />
                </Campo>
                <div className="grid gap-2">
                  <span className="text-sm font-medium" id="lbl-especie">
                    Especie
                  </span>
                  <Segmentado
                    etiquetaId="lbl-especie"
                    valor={form.especie}
                    onChange={(v) => set("especie", v)}
                    opciones={[
                      { valor: "perro", etiqueta: "Perro", icono: Dog },
                      { valor: "gato", etiqueta: "Gato", icono: Cat },
                    ]}
                  />
                </div>
              </div>

              <fieldset className="grid gap-2">
                <legend className="mb-2 text-sm font-medium">Servicio</legend>
                <div
                  role="radiogroup"
                  aria-label="Servicio"
                  className="grid grid-cols-2 gap-2.5 md:grid-cols-4"
                >
                  {SERVICIOS.map((s) => {
                    const { icono: Icono, detalle } = META_SERVICIO[s];
                    const activo = form.servicio === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        role="radio"
                        aria-checked={activo}
                        onClick={() => set("servicio", s)}
                        className={cn(
                          "group relative flex cursor-pointer flex-col items-start gap-3 overflow-hidden rounded-xl border p-3.5 text-left outline-none transition-all focus-visible:ring-[3px] focus-visible:ring-ring/50",
                          activo
                            ? "border-primary/60 bg-primary/[0.08] shadow-[0_0_0_1px] shadow-primary/30"
                            : "bg-background/30 hover:border-foreground/20 hover:bg-muted/50",
                        )}
                      >
                        <span
                          className={cn(
                            "grid size-9 place-items-center rounded-lg border transition-colors",
                            activo
                              ? "border-primary/40 bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground group-hover:text-foreground",
                          )}
                        >
                          <Icono className="size-[18px]" aria-hidden />
                        </span>
                        <span>
                          <span className="block text-sm font-medium leading-tight">
                            {s}
                          </span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            {detalle}
                          </span>
                        </span>
                        {activo && (
                          <motion.span
                            layoutId="servicio-activo"
                            className="absolute top-3 right-3 size-2 rounded-full bg-primary"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <div className="grid gap-4 sm:grid-cols-[minmax(0,220px)_1fr]">
                <div className="grid content-start gap-2">
                  <Label htmlFor="fecha">Fecha</Label>
                  <Input
                    id="fecha"
                    type="date"
                    value={form.fecha}
                    onChange={(e) => set("fecha", e.target.value)}
                    aria-invalid={!!errores.fecha}
                    className="tabular"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {FECHAS_RAPIDAS.map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => set("fecha", f)}
                        className={cn(
                          "cursor-pointer rounded-md border px-2 py-1 text-xs outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50",
                          form.fecha === f
                            ? "border-primary/50 bg-primary/10 text-primary"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {fechaCorta(f)}
                      </button>
                    ))}
                  </div>
                  {errores.fecha && <p className="text-xs text-bad">{errores.fecha}</p>}
                </div>
                <div className="grid content-start gap-2">
                  <span className="text-sm font-medium" id="lbl-hora">
                    Hora
                  </span>
                  <ChipsHora
                    valor={form.hora}
                    onChange={(h) => set("hora", h)}
                    franjas={franjas.datos?.franjas}
                    cargando={franjas.primeraCarga}
                    actualizando={franjas.cargando}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse items-stretch justify-between gap-3 border-t px-5 py-4 sm:flex-row sm:items-center sm:px-6">
              <p className="text-xs text-muted-foreground">
                {demo ? (
                  <>
                    <span className="font-medium text-violet">Modo demo:</span>{" "}
                    respuesta simulada con la lógica del contrato.
                  </>
                ) : (
                  <>Se envía a Make · espera hasta 45 s.</>
                )}
              </p>
              <Button
                type="submit"
                size="lg"
                disabled={enviando}
                className="group min-w-44 bg-gradient-to-r from-primary to-[color-mix(in_oklch,var(--primary)_75%,var(--violet))] font-semibold shadow-[0_8px_24px_-10px] shadow-primary/60"
              >
                {enviando ? (
                  <>
                    <LoaderCircle className="animate-spin" aria-hidden /> Procesando…
                  </>
                ) : (
                  <>
                    Agendar cita
                    <ArrowRight
                      className="transition-transform group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </>
                )}
              </Button>
            </div>
          </form>
        </Panel>

      </div>

      {/* En móvil el resultado aparece justo después del formulario. */}
      <div
        ref={resultadoRef}
        className="scroll-mt-20 lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1"
      >
        <div className="space-y-6 lg:sticky lg:top-24">
          <ResultadoPanel estado={resultado} onVerAgenda={onVerAgenda} />
          <HistorialCard
            entradas={historial}
            onLimpiar={() => setHistorial([])}
          />
        </div>
      </div>

      <div className="lg:col-span-7 lg:row-start-2">
        <CasosCard
          activo={casoActivo}
          correo={correoPruebas}
          onCorreo={setCorreoPruebas}
          onRellenar={rellenarCaso}
          resultados={historial}
        />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */

function Campo({
  id,
  etiqueta,
  error,
  icono: Icono,
  children,
}: {
  id: string;
  etiqueta: string;
  error?: string;
  icono: typeof User;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{etiqueta}</Label>
      <div className="relative">
        <Icono
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        {children}
      </div>
      {error && (
        <p className="text-xs text-bad" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function Segmentado<T extends string>({
  valor,
  onChange,
  opciones,
  etiquetaId,
}: {
  valor: T;
  onChange: (v: T) => void;
  opciones: { valor: T; etiqueta: string; icono: typeof Dog }[];
  etiquetaId: string;
}) {
  const uid = useId();
  return (
    <div
      role="radiogroup"
      aria-labelledby={etiquetaId}
      className="grid h-10 grid-cols-2 rounded-lg border bg-muted/50 p-1"
    >
      {opciones.map(({ valor: v, etiqueta, icono: Icono }) => {
        const activo = v === valor;
        return (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={activo}
            onClick={() => onChange(v)}
            className={cn(
              "relative flex cursor-pointer items-center justify-center gap-2 rounded-md text-sm font-medium outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50",
              activo ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {activo && (
              <motion.span
                layoutId={`seg-${uid}`}
                className="absolute inset-0 rounded-md border bg-background shadow-sm dark:bg-white/[0.08]"
                transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
              />
            )}
            <Icono
              className={cn("relative size-4", activo && "text-primary")}
              aria-hidden
            />
            <span className="relative">{etiqueta}</span>
          </button>
        );
      })}
    </div>
  );
}

function ChipsHora({
  valor,
  onChange,
  franjas,
  cargando,
  actualizando,
}: {
  valor: string;
  onChange: (h: string) => void;
  franjas?: Franja[];
  cargando: boolean;
  actualizando: boolean;
}) {
  const sinFranjas = !!franjas && franjas.length === 0;
  return (
    <div className="grid gap-2">
      <div
        role="radiogroup"
        aria-labelledby="lbl-hora"
        className={cn(
          "grid grid-cols-2 gap-2 sm:grid-cols-4 transition-opacity",
          actualizando && !cargando && "opacity-70",
        )}
      >
        {HORAS.map((h) => {
          const f = franjas?.find((x) => x.hora === h);
          const activo = valor === h;
          const libres = f?.libres;
          const tono =
            libres === undefined
              ? "text-muted-foreground"
              : libres <= 0
                ? "text-bad"
                : libres === 1
                  ? "text-warn"
                  : "text-ok";
          return (
            <button
              key={h}
              type="button"
              role="radio"
              aria-checked={activo}
              onClick={() => onChange(h)}
              className={cn(
                "flex cursor-pointer flex-col items-start rounded-lg border px-3 py-2 text-left outline-none transition-all focus-visible:ring-[3px] focus-visible:ring-ring/50",
                activo
                  ? "border-primary/60 bg-primary/[0.08] shadow-[0_0_0_1px] shadow-primary/30"
                  : "bg-background/30 hover:border-foreground/20 hover:bg-muted/50",
              )}
            >
              <span className="text-sm font-semibold tabular">{h}</span>
              {cargando ? (
                <Skeleton className="mt-1 h-3 w-14" />
              ) : (
                <span className={cn("mt-0.5 text-[11px] font-medium tabular", tono)}>
                  {f
                    ? libres! <= 0
                      ? "Lleno"
                      : `${libres} libre${libres === 1 ? "" : "s"}`
                    : "Sin franja"}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {sinFranjas
          ? "No hay franjas en AGENDA para esta fecha: el proceso tomará la ruta de respaldo."
          : "Disponibilidad informativa. La decisión final la toma el proceso."}
      </p>
    </div>
  );
}
