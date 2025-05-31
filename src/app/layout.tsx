
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { FeatureTogglesProvider } from '@/contexts/FeatureTogglesContext'; // Import the provider

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Quantum Leap - AI Crypto Insights',
  description: 'AI-powered cryptocurrency recommendations and trading insights.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <FeatureTogglesProvider> {/* Wrap children with the provider */}
          {children}
        </FeatureTogglesProvider>
        <Toaster />
      </body>
    </html>
  );
}

    