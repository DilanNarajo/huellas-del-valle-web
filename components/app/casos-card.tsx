"use client";

import { Check, FlaskConical, MousePointerClick, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CASOS, type CasoPrueba } from "@/lib/casos";
import { META_RESULTADO, TONO, fechaCorta, IconoEspecie, IconoServicio } from "@/lib/meta";
import { cn } from "@/lib/utils";
import type { EntradaHistorial } from "./historial-card";
import { Panel, PanelHeader } from "./panel";

export function CasosCard({
  activo,
  correo,
  onCorreo,
  onRellenar,
  resultados,
}: {
  activo: CasoPrueba["id"] | null;
  correo: string;
  onCorreo: (v: string) => void;
  onRellenar: (c: CasoPrueba) => void;
  resultados: EntradaHistorial[];
}) {
  return (
    <Panel aria-labelledby="casos-titulo">
      <PanelHeader
        id="casos-titulo"
        titulo="Casos de prueba C1–C5"
        descripcion="Rellenan el formulario; usted pulsa «Agendar cita». Ejecútelos en orden."
        icono={FlaskConical}
      />
      <div className="grid gap-4 p-5 sm:p-6">
        <div className="grid gap-2 sm:max-w-sm">
          <Label htmlFor="correo-pruebas">Correo de pruebas</Label>
          <Input
            id="correo-pruebas"
            type="email"
            value={correo}
            onChange={(e) => onCorreo(e.target.value)}
            placeholder="su-correo@ejemplo.com"
          />
          <p className="text-xs text-muted-foreground">
            Se usa en los cinco casos (C5 depende de repetir correo + mascota).
          </p>
        </div>
        <ol className="grid gap-2">
          {CASOS.map((c) => {
            const meta = META_RESULTADO[c.esperado];
            const tono = TONO[meta.tono];
            const ultimo = resultados.find((r) => r.caso === c.id);
            const acierto = ultimo ? ultimo.resultado === c.esperado : null;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => onRellenar(c)}
                  className={cn(
                    "group grid w-full cursor-pointer grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border px-3 py-2.5 text-left outline-none transition-all focus-visible:ring-[3px] focus-visible:ring-ring/50",
                    activo === c.id
                      ? "border-primary/50 bg-primary/[0.07]"
                      : "bg-background/30 hover:border-foreground/20 hover:bg-muted/40",
                  )}
                  aria-label={`Rellenar formulario con el caso ${c.id}`}
                >
                  <span
                    className={cn(
                      "grid size-9 place-items-center rounded-lg border font-mono text-xs font-semibold",
                      activo === c.id ? "border-primary/40 text-primary" : "text-muted-foreground",
                    )}
                  >
                    {c.id}
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 text-sm font-medium">
                      <IconoEspecie especie={c.especie} className="size-3.5 text-muted-foreground" aria-hidden />
                      {c.mascota}
                      <span className="text-muted-foreground">·</span>
                      <IconoServicio servicio={c.servicio} className="size-3.5 text-muted-foreground" aria-hidden />
                      <span className="truncate">{c.servicio}</span>
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground tabular">
                      {fechaCorta(c.fecha)} · {c.hora} — {c.nota}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <Badge variant={meta.tono} className="hidden sm:inline-flex">
                      <span className={cn("size-1.5 rounded-full", tono.bar)} />
                      {meta.corta}
                    </Badge>
                    {acierto === null ? (
                      <MousePointerClick
                        className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                        aria-hidden
                      />
                    ) : acierto ? (
                      <span className="grid size-5 place-items-center rounded-full bg-ok text-background" title="Coincide con lo esperado">
                        <Check className="size-3" strokeWidth={3} aria-label="Coincide" />
                      </span>
                    ) : (
                      <span className="grid size-5 place-items-center rounded-full bg-bad text-background" title="No coincide con lo esperado">
                        <X className="size-3" strokeWidth={3} aria-label="No coincide" />
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </Panel>
  );
}
