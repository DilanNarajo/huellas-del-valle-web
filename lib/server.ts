import "server-only";
import type { EstadoConexion } from "./types";

/** Lee variables y descarta marcadores tipo PEGAR_AQUI_... */
function env(nombre: string): string | null {
  const v = process.env[nombre]?.trim();
  if (!v || v.startsWith("PEGAR_AQUI")) return null;
  return v;
}

export const makeUrl = () => env("MAKE_WEBHOOK_URL");
export const appsScriptUrl = () => env("APPS_SCRIPT_URL");
export const apiToken = () => env("API_TOKEN");

export const sheetsConectado = () => Boolean(appsScriptUrl() && apiToken());

export function estadoConexion(): EstadoConexion {
  return {
    make: makeUrl() ? "conectado" : "demo",
    sheets: sheetsConectado() ? "conectado" : "demo",
  };
}

const TIMEOUT_SHEETS_MS = 20_000;

/** GET a la API de Apps Script: ?action=...&token=... */
export async function appsScriptGet(params: Record<string, string>) {
  const url = new URL(appsScriptUrl()!);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("token", apiToken()!);
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_SHEETS_MS);
  try {
    const r = await fetch(url, {
      cache: "no-store",
      redirect: "follow",
      signal: ctrl.signal,
    });
    const texto = await r.text();
    return JSON.parse(texto) as Record<string, unknown>;
  } finally {
    clearTimeout(t);
  }
}

/** POST a la API de Apps Script (Apps Script redirige 302 → se sigue). */
export async function appsScriptPost(body: Record<string, unknown>) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_SHEETS_MS);
  try {
    const r = await fetch(appsScriptUrl()!, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ ...body, token: apiToken() }),
      cache: "no-store",
      redirect: "follow",
      signal: ctrl.signal,
    });
    const texto = await r.text();
    return JSON.parse(texto) as Record<string, unknown>;
  } finally {
    clearTimeout(t);
  }
}

export const esperar = (ms: number) =>
  new Promise((res) => setTimeout(res, ms));
