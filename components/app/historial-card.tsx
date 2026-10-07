"use client";

import { AnimatePresence, motion } from "motion/react";
import { History, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { META_RESULTADO, TONO, metaResultado } from "@/lib/meta";
import { cn } from "@/lib/utils";
import { Panel, PanelHeader } from "./panel";

export interface EntradaHistorial {
  n: number;
  hora: string;
  mascota: string;
  servicio: string;
  franja: string;
  resultado: keyof typeof META_RESULTADO;
  id_cita: string;
  ms: number;
  caso: string | null;
}

export function HistorialCard({
  entradas,
  onLimpiar,
}: {
  entradas: EntradaHistorial[];
  onLimpiar: () => void;
}) {
  return (
    <Panel aria-labelledby="hist-titulo">
      <PanelHeader
        id="hist-titulo"
        titulo="Historial de la sesión"
        descripcion={`${entradas.length} solicitud${entradas.length === 1 ? "" : "es"} enviada${entradas.length === 1 ? "" : "s"}`}
        icono={History}
        accion={
          entradas.length > 0 && (
            <Button variant="ghost" size="sm" onClick={onLimpiar} className="text-muted-foreground">
              <Trash2 aria-hidden /> Limpiar
            </Button>
          )
        }
      />
      {entradas.length === 0 ? (
        <p className="px-6 py-8 text-center text-sm text-muted-foreground">
          Aún no hay solicitudes en esta sesión.
        </p>
      ) : (
        <ul className="max-h-[340px] divide-y overflow-y-auto">
          <AnimatePresence initial={false}>
            {entradas.map((e) => {
              const meta = metaResultado(e.resultado);
              const tono = TONO[meta.tono];
              const Icono = meta.icono;
              return (
                <motion.li
                  key={e.n}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-5 py-3 sm:px-6">
                    <span className={cn("grid size-8 place-items-center rounded-lg border", tono.soft, tono.border, tono.text)}>
                      <Icono className="size-4" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 truncate text-sm font-medium">
                        {e.caso && (
                          <span className="rounded border px-1 font-mono text-[10px] text-muted-foreground">
                            {e.caso}
                          </span>
                        )}
                        {e.mascota} · <span className="text-muted-foreground">{e.servicio}</span>
                      </p>
                      <p className="truncate text-xs text-muted-foreground tabular">
                        {e.franja} · <span className={tono.text}>{meta.corta}</span>
                        {e.id_cita && <> · <span className="font-mono">{e.id_cita}</span></>}
                      </p>
                    </div>
                    <div className="text-right text-xs tabular">
                      <p className="font-medium">{e.ms} ms</p>
                      <p className="text-muted-foreground">{e.hora}</p>
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}
    </Panel>
  );
}
