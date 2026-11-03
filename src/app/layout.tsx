import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Community Hub — WhatsApp Community Operations',
  description: 'Production-ready WhatsApp community management, week message scheduling, frequency capping, and delivery monitoring.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-[#F4F0E8] text-[#20231F] flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
