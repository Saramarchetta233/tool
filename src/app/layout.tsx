import { Metadata } from 'next';
import * as React from 'react';

import '@/styles/globals.css';

export const metadata: Metadata = {
  title: {
    default: 'CalcioAI - Analisi Calcistiche con Intelligenza Artificiale',
    template: '%s | CalcioAI',
  },
  description: 'Probabilità avanzate, strategie di betting intelligenti e assistente per fantacalcio. Trasforma i dati in decisioni vincenti.',
  keywords: ['calcio', 'betting', 'fantacalcio', 'AI', 'intelligenza artificiale', 'probabilità', 'analisi', 'Serie A'],
  robots: { index: true, follow: true },
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    type: 'website',
    title: 'CalcioAI - Analisi Calcistiche con AI',
    description: 'Probabilità avanzate, strategie di betting intelligenti e assistente per fantacalcio.',
    locale: 'it_IT',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CalcioAI - Analisi Calcistiche con AI',
    description: 'Probabilità avanzate, strategie di betting intelligenti e assistente per fantacalcio.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it" className="dark">
      <body className="min-h-screen bg-slate-950 text-white antialiased">
        {children}
      </body>
    </html>
  );
}
