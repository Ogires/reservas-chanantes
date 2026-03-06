import type { Metadata } from "next";
import { DM_Serif_Display, DM_Sans } from "next/font/google";
import "./globals.css";

const dmSerifDisplay = DM_Serif_Display({
  variable: "--font-dm-serif-display",
  subsets: ["latin"],
  weight: "400",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://reservas-chanantes.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'Reservas Chanantes — Reservas Online para Negocios',
    template: '%s | Reservas Chanantes',
  },
  description:
    'Plataforma de reservas online para pequenos negocios. Crea tu pagina de reservas en minutos y permite a tus clientes reservar citas 24/7.',
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    siteName: 'Reservas Chanantes',
    title: 'Reservas Chanantes — Reservas Online para Negocios',
    description:
      'Plataforma de reservas online para pequenos negocios. Crea tu pagina de reservas en minutos y permite a tus clientes reservar citas 24/7.',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${dmSerifDisplay.variable} ${dmSans.variable} bg-warm-bg font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
