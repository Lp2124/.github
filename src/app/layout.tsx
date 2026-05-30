import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ferretería De La O",
  description: "Fundación operativa de Ferretería De La O"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-MX">
      <body>{children}</body>
    </html>
  );
}
