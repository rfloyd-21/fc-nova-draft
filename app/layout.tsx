import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FC Nova Draft',
  description: 'Weekly draft board for FC Nova Cidade Oeste',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
