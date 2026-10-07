import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";

import { Providers } from "@/components/app/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Huellas del Valle · Agenda",
  description:
    "Sistema de agendamiento de la Clínica Veterinaria Huellas del Valle (Cali).",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0b0f16" },
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es-CO"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans">
        <div className="app-backdrop" aria-hidden />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
