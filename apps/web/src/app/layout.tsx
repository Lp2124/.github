import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Liora Ferretería De La O',
  description: 'Administración multi-tenant para Ferretería De La O.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
