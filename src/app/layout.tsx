import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppProvider } from '../context/AppContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AutoCard — Smart Card Recommendations',
  description: 'Know which credit card to use before you pay.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-100 min-h-screen`}>
        <AppProvider>
          {/* Mobile-first shell: max 480px, centered on desktop */}
          <div className="min-h-screen max-w-[480px] mx-auto bg-white shadow-2xl relative overflow-x-hidden">
            {children}
          </div>
        </AppProvider>
      </body>
    </html>
  );
}
