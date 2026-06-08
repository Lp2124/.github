import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Liora Commerce POS',
  description: 'Punto de venta seguro con pagos tokenizados.'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
