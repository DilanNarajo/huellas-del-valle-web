"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fechaCorta, sumarDias } from "@/lib/meta";
import { cn } from "@/lib/utils";

const RAPIDAS = ["2026-10-14", "2026-10-15"];

export function FechaSelector({
  fecha,
  onFecha,
}: {
  fecha: string;
  onFecha: (f: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center rounded-lg border bg-background/50 p-0.5">
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label="Día anterior"
          onClick={() => onFecha(sumarDias(fecha, -1))}
        >
          <ChevronLeft aria-hidden />
        </Button>
        <label htmlFor="fecha-agenda" className="sr-only">
          Fecha de la agenda
        </label>
        <Input
          id="fecha-agenda"
          type="date"
          value={fecha}
          onChange={(e) => e.target.value && onFecha(e.target.value)}
          className="h-8 w-[172px] border-0 bg-transparent px-2 text-center text-sm shadow-none tabular dark:bg-transparent"
        />
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label="Día siguiente"
          onClick={() => onFecha(sumarDias(fecha, 1))}
        >
          <ChevronRight aria-hidden />
        </Button>
      </div>
      {RAPIDAS.map((f) => (
        <button
          key={f}
          type="button"
          onClick={() => onFecha(f)}
          className={cn(
            "h-9 cursor-pointer rounded-lg border px-3 text-xs font-medium outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50",
            fecha === f
              ? "border-primary/50 bg-primary/10 text-primary"
              : "bg-background/40 text-muted-foreground hover:text-foreground",
          )}
        >
          {fechaCorta(f)}
        </button>
      ))}
    </div>
  );
}
