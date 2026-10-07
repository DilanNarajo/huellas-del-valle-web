"use client";

import { useState } from "react";
import { toast } from "sonner";
import { LoaderCircle, UserCheck, UserX } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { parseBogota } from "@/lib/fechas";
import { META_RESULTADO, TONO, IconoEspecie, IconoServicio, tonoEstado } from "@/lib/meta";
import type { Cita } from "@/lib/types";
import { cn } from "@/lib/utils";

export function BadgeEstado({ estado }: { estado: string }) {
  const tono = tonoEstado(estado);
  const meta = META_RESULTADO[estado as keyof typeof META_RESULTADO];
  return (
    <Badge variant={tono}>
      <span className={cn("size-1.5 rounded-full", TONO[tono].bar)} />
      {meta?.corta ?? estado}
    </Badge>
  );
}

export function BadgeAsistencia({ valor }: { valor: string }) {
  if (valor === "ASISTIO")
    return (
      <Badge variant="ok">
        <UserCheck aria-hidden /> Asistió
      </Badge>
    );
  if (valor === "NO_ASISTIO")
    return (
      <Badge variant="bad">
        <UserX aria-hidden /> No asistió
      </Badge>
    );
  return <Badge variant="outline" className="text-muted-foreground">Pendiente</Badge>;
}

function segundosRespuesta(c: Cita) {
  const a = parseBogota(c.solicitado_en)?.getTime() ?? Number.NaN;
  const b = parseBogota(c.respondido_en)?.getTime();
  if (!b || Number.isNaN(a)) return null;
  return Math.max(0, (b - a) / 1000);
}

export function CitaDialog({
  cita,
  onClose,
  onActualizada,
}: {
  cita: Cita | null;
  onClose: () => void;
  onActualizada: () => void;
}) {
  const [enviando, setEnviando] = useState<null | "ASISTIO" | "NO_ASISTIO">(null);
  const seg = cita ? segundosRespuesta(cita) : null;

  const marcar = async (v: "ASISTIO" | "NO_ASISTIO") => {
    if (!cita) return;
    setEnviando(v);
    try {
      await api.asistencia(cita.id_cita, v);
      toast.success(v === "ASISTIO" ? "Asistencia registrada" : "Inasistencia registrada", {
        description: `${cita.mascota} · ${cita.id_cita}`,
      });
      onActualizada();
      onClose();
    } catch (e) {
      toast.error("No se pudo actualizar", {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setEnviando(null);
    }
  };

  return (
    <Dialog open={!!cita} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        {cita && (
          <>
            <DialogHeader className="text-left">
              <div className="flex items-center gap-3">
                <span className={cn("grid size-11 place-items-center rounded-xl border", TONO[tonoEstado(cita.estado)].soft, TONO[tonoEstado(cita.estado)].border, TONO[tonoEstado(cita.estado)].text)}>
                  <IconoEspecie especie={cita.especie} className="size-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <DialogTitle className="text-xl">{cita.mascota}</DialogTitle>
                  <DialogDescription className="mt-1 flex items-center gap-1.5">
                    <IconoServicio servicio={cita.servicio} className="size-3.5" aria-hidden /> {cita.servicio} ·{" "}
                    <span className="tabular">{cita.franja}</span>
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="flex flex-wrap gap-1.5">
              <BadgeEstado estado={cita.estado} />
              <BadgeAsistencia valor={cita.asistencia} />
              {cita.alerta
                .split(";")
                .filter(Boolean)
                .map((a) => (
                  <Badge key={a} variant="warn" className="font-mono text-[10.5px]">
                    {a}
                  </Badge>
                ))}
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2.5 rounded-xl border bg-muted/30 p-4 text-sm">
              <dt className="text-muted-foreground">Propietario</dt>
              <dd className="truncate font-medium">{cita.propietario}</dd>
              <dt className="text-muted-foreground">Correo</dt>
              <dd className="truncate">{cita.correo}</dd>
              <dt className="text-muted-foreground">Especie</dt>
              <dd className="capitalize">{cita.especie}</dd>
              <dt className="text-muted-foreground">ID cita</dt>
              <dd className="font-mono text-[13px]">{cita.id_cita}</dd>
              <dt className="text-muted-foreground">Solicitado</dt>
              <dd className="truncate font-mono text-[12px]">{cita.solicitado_en}</dd>
              <dt className="text-muted-foreground">Respondido</dt>
              <dd className="font-mono text-[12px]">
                {cita.respondido_en}
                {seg !== null && (
                  <span className="ml-2 text-muted-foreground">({seg.toFixed(1)} s)</span>
                )}
              </dd>
            </dl>
            <DialogFooter className="gap-2 sm:justify-between">
              <p className="self-center text-xs text-muted-foreground">
                Registrar asistencia
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="border-bad/40 text-bad hover:bg-bad-soft hover:text-bad"
                  disabled={!!enviando}
                  onClick={() => marcar("NO_ASISTIO")}
                >
                  {enviando === "NO_ASISTIO" ? <LoaderCircle className="animate-spin" /> : <UserX />}
                  No asistió
                </Button>
                <Button
                  className="bg-ok text-background hover:bg-ok/90"
                  disabled={!!enviando}
                  onClick={() => marcar("ASISTIO")}
                >
                  {enviando === "ASISTIO" ? <LoaderCircle className="animate-spin" /> : <UserCheck />}
                  Asistió
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
