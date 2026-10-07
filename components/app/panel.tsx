import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

/** Tarjeta glass con borde 1px y highlight. */
export function Panel({
  className,
  children,
  ...props
}: React.ComponentProps<"section">) {
  return (
    <section
      className={cn("glass relative overflow-hidden rounded-2xl", className)}
      {...props}
    >
      {children}
    </section>
  );
}

export function PanelHeader({
  titulo,
  descripcion,
  icono: Icono,
  accion,
  className,
  id,
}: {
  titulo: React.ReactNode;
  descripcion?: React.ReactNode;
  icono?: LucideIcon;
  accion?: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 border-b px-5 py-4 sm:px-6",
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        {Icono && (
          <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border bg-muted/60 text-primary">
            <Icono className="size-4" aria-hidden />
          </span>
        )}
        <div className="min-w-0">
          <h2 id={id} className="text-[15px] font-semibold tracking-tight">
            {titulo}
          </h2>
          {descripcion && (
            <p className="mt-0.5 text-xs text-muted-foreground">{descripcion}</p>
          )}
        </div>
      </div>
      {accion && <div className="shrink-0">{accion}</div>}
    </div>
  );
}
