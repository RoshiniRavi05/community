import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CommUnity WA — WhatsApp Community Operations',
  description: 'Production-ready WhatsApp community management, week message scheduling, frequency capping, and delivery monitoring.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full bg-[#0b0f19] text-slate-100 flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
