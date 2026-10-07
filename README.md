# Huellas del Valle · Sistema de agendamiento (Parte B)

Interfaz propia de la **Clínica Veterinaria Huellas del Valle** (Cali).
Next.js (App Router) + TypeScript + Tailwind CSS v4 + shadcn/ui, pensada para desplegarse en Vercel.

- **Agendar**: formulario → `POST /api/agendar` → webhook del Escenario 1 de Make. La interfaz **solo muestra** lo que Make responde (resultado, mensaje, cupo, id_cita, alerta y una traza de la ruta tomada).
- **Agenda del día**: KPIs, timeline por puestos de atención (Cupo 1–3) y tabla de citas. Registrar asistencia escribe `CITAS.asistencia` vía Apps Script.
- **Franjas**: barras de ocupación por franja (AGENDA).

El contrato de datos está en `../../00_contrato.md`.

## Correr en local

```bash
npm i
npm run dev          # http://localhost:3000
```

Sin variables de entorno la app arranca en **Modo demo**: las rutas `/api/*` responden con una simulación en memoria que reproduce la lógica del contrato (cupo, rutas, C1–C5). La insignia «Modo demo» de la barra superior lo indica. Para conectarla de verdad:

```bash
cp .env.example .env.local   # y reemplace los PEGAR_AQUI_...
npm run dev
```

| Variable | Qué es |
| --- | --- |
| `MAKE_WEBHOOK_URL` | URL del webhook personalizado del Escenario 1 |
| `APPS_SCRIPT_URL` | URL `/exec` de la app web de Apps Script (`../apps-script/Code.gs`) |
| `API_TOKEN` | El mismo valor guardado en las Propiedades del script (`API_TOKEN`) |

Cada integración cambia de modo por separado: sin `MAKE_WEBHOOK_URL` el agendamiento es simulado; sin `APPS_SCRIPT_URL`/`API_TOKEN` la lectura de agenda es simulada. Un valor que empiece por `PEGAR_AQUI` cuenta como ausente.

Otros comandos: `npm run build`, `npm run start`, `npm run lint`.

## Rutas de servidor (`app/api/*`)

Todas son Route Handlers con `runtime = "nodejs"` y `dynamic = "force-dynamic"`.

| Ruta | Hace |
| --- | --- |
| `POST /api/agendar` | Valida con zod, normaliza `solicitado_en` a `AAAA-MM-DD HH:mm:ss` hora America/Bogota (lo agrega si falta; si llega ISO con zona lo convierte), valida que Make responda uno de los 4 `resultado`, reenvía el JSON a Make con timeout de 45 s y devuelve la respuesta **tal cual**. Si Make falla, no responde JSON o se agota el tiempo: `{resultado:"ERROR_COMUNICACION", mensaje}` con HTTP 502. Datos inválidos: `ERROR_VALIDACION` con HTTP 400. |
| `GET /api/agenda?fecha=` | Apps Script `action=citas` |
| `GET /api/franjas?fecha=` | Apps Script `action=franjas` |
| `GET /api/indicadores?fecha=` | Apps Script `action=indicadores` (I1, I2) |
| `POST /api/asistencia` | `{id_cita, asistencia}` → Apps Script `doPost` |
| `GET /api/estado` | Indica a la UI si Make/Sheets están conectados o en demo |
| `POST /api/demo/reiniciar` | Solo en modo demo: vuelve a los datos de partida |

La URL del webhook, la de Apps Script y el token **nunca** llegan al navegador.

## Estructura

```
app/
  layout.tsx, page.tsx, globals.css (tokens de color claro/oscuro), icon.svg
  api/…                       rutas de servidor
components/
  ui/                         componentes shadcn/ui (+ timeline.tsx del usuario)
  app/                        vistas y piezas de la aplicación
lib/
  types.ts                    tipos del contrato
  demo-store.ts               simulación del modo demo
  server.ts                   lectura de variables y llamadas a Apps Script
  utils.ts                    cn()
components.json               configuración del CLI de shadcn
```

### ¿Por qué `components/ui`?

Es la convención de shadcn/ui: `components.json` declara el alias `ui → @/components/ui`, y tanto el CLI (`npx shadcn@latest add …`) como los imports de cada componente (`@/components/ui/button`, `@/lib/utils`) asumen esa ruta. Si los componentes se movieran, el CLI los instalaría en otro sitio y los imports entre componentes se romperían. Por eso `timeline.tsx` también vive ahí.

## Notas técnicas

- **Componente timeline** (`components/ui/timeline.tsx`): copiado del original. Único cambio: se quitaron los dos `console.log` de depuración. No hizo falta tocar tipos para que `next build` pase. Como el archivo usa `any` a propósito, `eslint.config.mjs` desactiva `@typescript-eslint/no-explicit-any` **solo para ese archivo**, sin modificar su código.
- **Agenda en solo lectura**: arrastrar una cita no la mueve (`onValidateDrop → false`) y muestra el aviso «Reprogramar debe pasar por el proceso de agendamiento». Las citas se asignan a los puestos (Cupo 1–3) por orden de llegada. Los ocupados de la carga inicial de AGENDA, que no tienen fila en CITAS, aparecen como «Ocupado · Carga inicial». Pulsar un cupo libre abre «Agendar» con esa fecha y hora.
- **Next 16.4**: `create-next-app` activa `cacheComponents` por defecto, y eso es incompatible con `export const dynamic`. Se desactivó en `next.config.ts` porque la app es interactiva y las rutas usan la configuración clásica.
- **Tipografía**: Geist se toma del paquete npm `geist`, que es local (no descarga de Google Fonts al compilar).
- **Componentes shadcn**: el registro `ui.shadcn.com` no era accesible desde el entorno de construcción, así que `components.json` y los componentes de `components/ui` se crearon a mano con el código estándar de shadcn (estilo new-york, Radix). El slider es la versión clásica con `forwardRef`. El CLI funciona igual para agregar más: `npx shadcn@latest add <componente>`.
- **Modo demo**: en Vercel cada instancia serverless guarda su propio estado en memoria, que se pierde al reiniciarse. Solo sirve para mostrar la interfaz antes de conectar Make.
