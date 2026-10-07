"use client";

import { useCallback, useEffect, useEffectEvent, useState } from "react";

/**
 * Carga datos remotos por clave. Conserva los datos anteriores mientras
 * recarga (la UI los atenúa) y expone `recargar()`.
 */
export function useDatos<T>(clave: string | null, cargar: () => Promise<T>) {
  const [tick, setTick] = useState(0);
  const [estado, setEstado] = useState<{
    clave: string;
    datos?: T;
    error?: string;
  } | null>(null);

  const ejecutar = useEffectEvent(() => cargar());
  const claveActual = clave === null ? null : `${clave}#${tick}`;

  useEffect(() => {
    if (claveActual === null) return;
    let vivo = true;
    ejecutar()
      .then((datos) => {
        if (vivo) setEstado({ clave: claveActual, datos });
      })
      .catch((e: unknown) => {
        if (vivo)
          setEstado((prev) => ({
            clave: claveActual,
            datos: prev?.datos,
            error: e instanceof Error ? e.message : String(e),
          }));
      });
    return () => {
      vivo = false;
    };
  }, [claveActual]);

  const recargar = useCallback(() => setTick((t) => t + 1), []);

  return {
    datos: estado?.datos,
    error: estado?.clave === claveActual ? estado?.error : undefined,
    cargando: claveActual !== null && estado?.clave !== claveActual,
    primeraCarga: estado === null,
    recargar,
  };
}
