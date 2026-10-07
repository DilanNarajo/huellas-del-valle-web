"use client";

import { motion } from "motion/react";
import { BarChart3, CalendarX2 } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { fechaCorta } from "@/lib/meta";
import { useDatos } from "@/lib/use-datos";
import { cn } from "@/lib/utils";
import { FechaSelector } from "./fecha-selector";
import { Panel, PanelHeader } from "./panel";

export function FranjasView({
  fecha,
  onFecha,
  version,
}: {
  fecha: string;
  onFecha: (f: string) => void;
  version: number;
}) {
  const { datos, primeraCarga, error } = useDatos(`franjas:${fecha}:${version}`, () =>
    api.franjas(fecha),
  );
  const franjas = datos?.franjas ?? [];

  return (
    <div className="grid gap-6 [&>*]:min-w-0">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-[0.14em] text-primary uppercase">
            Capacidad
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Franjas y cupo
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Hoja AGENDA · <span className="font-mono">libres = cupo − ocupados</span> se
            calcula solo para mostrar.
          </p>
        </div>
        <FechaSelector fecha={fecha} onFecha={onFecha} />
      </header>

      {error && (
        <div role="alert" className="rounded-xl border border-bad/40 bg-bad-soft px-4 py-3 text-sm text-bad">
          {error}
        </div>
      )}

      <Panel aria-labelledby="fr-titulo">
        <PanelHeader
          id="fr-titulo"
          icono={BarChart3}
          titulo={`Ocupación por franja · ${fechaCorta(fecha)}`}
          descripcion="Verde: 2+ libres · Ámbar: queda 1 · Rosa: sin cupo"
        />
        <div className="grid gap-3 p-5 sm:p-6">
          {primeraCarga ? (
            [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)
          ) : franjas.length === 0 ? (
            <div className="flex flex-col items-center rounded-xl border border-dashed py-12 text-center">
              <CalendarX2 className="size-7 text-muted-foreground" aria-hidden />
              <p className="mt-2 text-sm text-muted-foreground">
                No hay franjas en AGENDA para esta fecha.
              </p>
            </div>
          ) : (
            franjas.map((f, i) => {
              const color =
                f.libres <= 0 ? "bg-bad" : f.libres === 1 ? "bg-warn" : "bg-ok";
              const texto =
                f.libres <= 0 ? "text-bad" : f.libres === 1 ? "text-warn" : "text-ok";
              return (
                <div
                  key={f.franja}
                  className="grid grid-cols-[64px_1fr_auto] items-center gap-4 rounded-xl border bg-background/40 px-4 py-3"
                >
                  <span className="text-lg font-semibold tabular">{f.hora}</span>
                  <div
                    className="flex gap-1.5"
                    role="img"
                    aria-label={`${f.ocupados} de ${f.cupo} ocupados`}
                  >
                    {Array.from({ length: f.cupo }, (_, k) => (
                      <div key={k} className="h-3 flex-1 overflow-hidden rounded-full bg-muted ring-1 ring-inset ring-border">
                        {k < f.ocupados && (
                          <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ delay: i * 0.06 + k * 0.05 }}
                            style={{ originX: 0 }}
                            className={cn("h-full rounded-full", color)}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="text-right tabular">
                    <p className="text-sm font-medium">
                      {f.ocupados}/{f.cupo}
                    </p>
                    <p className={cn("text-xs font-medium", texto)}>
                      {f.libres <= 0 ? "Lleno" : `${f.libres} libre${f.libres === 1 ? "" : "s"}`}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Panel>
    </div>
  );
}
