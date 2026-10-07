"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarClock, Database, FlaskConical, PawPrint, Zap } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { EstadoConexion } from "@/lib/types";
import { ThemeToggle } from "./theme-toggle";

function useHoyBogota() {
  const [hoy, setHoy] = useState<string | null>(null);
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("es-CO", {
      timeZone: "America/Bogota",
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const tick = () => setHoy(fmt.format(new Date()).replace(/\./g, ""));
    const id = setInterval(tick, 30_000);
    queueMicrotask(tick);
    return () => clearInterval(id);
  }, []);
  return hoy;
}

function Pill({
  activo,
  icono: Icono,
  texto,
  ayuda,
}: {
  activo: boolean;
  icono: typeof Zap;
  texto: string;
  ayuda: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          className={cn(
            "inline-flex h-8 items-center gap-2 rounded-full border px-3 text-xs font-medium outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
            activo
              ? "border-ok/30 bg-ok-soft text-ok"
              : "border-violet/30 bg-violet/10 text-violet",
          )}
        >
          <span className="relative flex size-2">
            {activo && (
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-ok opacity-60" />
            )}
            <span
              className={cn(
                "relative inline-flex size-2 rounded-full",
                activo ? "bg-ok" : "bg-violet",
              )}
            />
          </span>
          <Icono className="size-3.5" aria-hidden />
          {texto}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-64">{ayuda}</TooltipContent>
    </Tooltip>
  );
}

export function Topbar({
  conexion,
  tabs,
}: {
  conexion: EstadoConexion | null;
  tabs: React.ReactNode;
}) {
  const hoy = useHoyBogota();
  const todoDemo = conexion?.make === "demo" && conexion?.sheets === "demo";

  return (
    <header className="sticky top-0 z-40 border-b bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/55">
      <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex min-w-0 items-center gap-3 rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
          <span className="relative grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[oklch(0.62_0.13_175)] to-[oklch(0.55_0.2_295)] shadow-[0_6px_20px_-6px] shadow-primary/50 ring-1 ring-white/20">
            <PawPrint className="size-[18px] text-white drop-shadow-sm transition-transform duration-300 group-hover:-rotate-12" aria-hidden />
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-[15px] font-semibold tracking-tight">
              Huellas del Valle
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              Clínica veterinaria · Cali
            </span>
          </span>
        </Link>

        <nav className="ml-4 hidden md:block" aria-label="Principal">
          {tabs}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden items-center gap-2 sm:flex">
            {!conexion ? (
              <Skeleton className="h-8 w-32 rounded-full" />
            ) : todoDemo ? (
              <Pill
                activo={false}
                icono={FlaskConical}
                texto="Modo demo"
                ayuda="Faltan MAKE_WEBHOOK_URL / APPS_SCRIPT_URL / API_TOKEN. Las respuestas se simulan en memoria con la lógica del contrato."
              />
            ) : (
              <>
                <Pill
                  activo={conexion.make === "conectado"}
                  icono={Zap}
                  texto={conexion.make === "conectado" ? "Make conectado" : "Make: demo"}
                  ayuda={
                    conexion.make === "conectado"
                      ? "Agendar pasa por el webhook del Escenario 1."
                      : "Sin MAKE_WEBHOOK_URL: agendamiento simulado."
                  }
                />
                <Pill
                  activo={conexion.sheets === "conectado"}
                  icono={Database}
                  texto={conexion.sheets === "conectado" ? "Sheets" : "Sheets: demo"}
                  ayuda={
                    conexion.sheets === "conectado"
                      ? "La agenda se lee del Spreadsheet vía Apps Script."
                      : "Sin APPS_SCRIPT_URL / API_TOKEN: datos simulados."
                  }
                />
              </>
            )}
          </div>
          {conexion && todoDemo && (
            <span className="inline-flex h-7 items-center gap-1.5 rounded-full border border-violet/30 bg-violet/10 px-2.5 text-[11px] font-medium text-violet sm:hidden">
              <FlaskConical className="size-3" aria-hidden /> Demo
            </span>
          )}
          <span className="hidden h-8 items-center gap-2 rounded-full border bg-background/40 px-3 text-xs text-muted-foreground tabular lg:inline-flex">
            <CalendarClock className="size-3.5" aria-hidden />
            {hoy ?? "—"}
          </span>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
