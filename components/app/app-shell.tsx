"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { BarChart3, CalendarDays, CalendarPlus } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import type { EstadoConexion } from "@/lib/types";
import { AgendarView, type Prefill } from "./agendar-view";
import { AgendaView } from "./agenda-view";
import { FranjasView } from "./franjas-view";
import { Topbar } from "./topbar";

export type Vista = "agendar" | "agenda" | "franjas";

const VISTAS: { id: Vista; etiqueta: string; icono: typeof CalendarPlus }[] = [
  { id: "agendar", etiqueta: "Agendar", icono: CalendarPlus },
  { id: "agenda", etiqueta: "Agenda del día", icono: CalendarDays },
  { id: "franjas", etiqueta: "Franjas", icono: BarChart3 },
];

function vistaInicial(): Vista {
  if (typeof window === "undefined") return "agendar";
  const v = new URLSearchParams(window.location.search).get("vista");
  return v === "agenda" || v === "franjas" ? v : "agendar";
}

export function AppShell() {
  const [vista, setVista] = useState<Vista>("agendar");
  const [conexion, setConexion] = useState<EstadoConexion | null>(null);
  const [prefill, setPrefill] = useState<Prefill | null>(null);
  const [fechaAgenda, setFechaAgenda] = useState("2026-10-14");
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const v = vistaInicial();
    if (v !== "agendar") queueMicrotask(() => setVista(v));
    api
      .estado()
      .then(setConexion)
      .catch(() => setConexion({ make: "demo", sheets: "demo" }));
  }, []);

  const cambiarVista = (v: string) => {
    setVista(v as Vista);
    const url = new URL(window.location.href);
    if (v === "agendar") url.searchParams.delete("vista");
    else url.searchParams.set("vista", v);
    window.history.replaceState(null, "", url);
  };

  const lista = (
    <TabsList
      aria-label="Vistas"
      className="h-10 w-full rounded-xl border bg-muted/60 p-1 backdrop-blur md:w-auto"
    >
      {VISTAS.map(({ id, etiqueta, icono: Icono }) => (
        <TabsTrigger
          key={id}
          value={id}
          className="relative h-full rounded-lg px-3 data-[state=active]:bg-transparent data-[state=active]:shadow-none dark:data-[state=active]:border-transparent dark:data-[state=active]:bg-transparent"
        >
          {vista === id && (
            <motion.span
              layoutId="tab-activa"
              className="absolute inset-0 rounded-lg border border-border bg-background shadow-sm dark:bg-white/[0.07]"
              transition={{ type: "spring", bounce: 0.18, duration: 0.45 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-1.5">
            <Icono className="size-4" aria-hidden />
            {etiqueta}
          </span>
        </TabsTrigger>
      ))}
    </TabsList>
  );

  return (
    <Tabs value={vista} onValueChange={cambiarVista} className="gap-0">
      <Topbar conexion={conexion} tabs={lista} />
      <div className="px-4 pt-3 md:hidden">{lista}</div>

      <main className="mx-auto w-full max-w-[1400px] px-4 pt-6 pb-16 sm:px-6 lg:px-8">
        {/* Agendar queda montado (conserva formulario e historial). */}
        <TabsContent value="agendar" forceMount hidden={vista !== "agendar"}>
          <AgendarView
            prefill={prefill}
            demo={conexion?.make === "demo"}
            onAgendado={() => setVersion((n) => n + 1)}
            onVerAgenda={(fecha) => {
              setFechaAgenda(fecha);
              cambiarVista("agenda");
            }}
          />
        </TabsContent>
        <TabsContent value="agenda">
          <Entrada>
            <AgendaView
              fecha={fechaAgenda}
              onFecha={setFechaAgenda}
              version={version}
              demo={conexion?.sheets === "demo"}
              puedeReiniciar={
                conexion?.make === "demo" && conexion?.sheets === "demo"
              }
              onReiniciado={() => setVersion((n) => n + 1)}
              onAgendarEn={(fecha, hora) => {
                setPrefill({ fecha, hora, nonce: Date.now() });
                cambiarVista("agendar");
              }}
            />
          </Entrada>
        </TabsContent>
        <TabsContent value="franjas">
          <Entrada>
            <FranjasView
              fecha={fechaAgenda}
              onFecha={setFechaAgenda}
              version={version}
            />
          </Entrada>
        </TabsContent>
      </main>
    </Tabs>
  );
}

function Entrada({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
