import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/layout/Sidebar';

export const metadata: Metadata = {
  title: 'ClaimPilot AI — OPD Claims Operations Copilot',
  description:
    'Automate OPD claims intake, extraction, adjudication, and decision generation with AI-powered document understanding and deterministic rules.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" />
      </head>
      <body>
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--background)' }}>
          <Sidebar />
          <main
            style={{
              flex: 1,
              marginLeft: '240px',
              minHeight: '100vh',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
