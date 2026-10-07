"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const oscuro = resolvedTheme !== "light";
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={oscuro ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
          onClick={() => setTheme(oscuro ? "light" : "dark")}
          className="relative"
        >
          <Sun className="size-4 scale-0 rotate-90 transition-transform dark:scale-100 dark:rotate-0" />
          <Moon className="absolute size-4 scale-100 rotate-0 transition-transform dark:scale-0 dark:-rotate-90" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Tema claro / oscuro</TooltipContent>
    </Tooltip>
  );
}
