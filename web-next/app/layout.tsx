import type { Metadata } from 'next';
import { ClientProviders } from '@/components/providers/ClientProviders';
import './globals.css';

export const metadata: Metadata = {
  title: 'SeaCalendar - Ocean-themed Event Organizer',
  description: 'Coordinate friend group hangouts through Discord and web',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
