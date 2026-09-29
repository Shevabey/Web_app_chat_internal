import type { Metadata } from 'next';
import { Nunito } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import './globals.css';

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Akselera Chat — Obrolan Internal',
  description: 'Aplikasi chat internal Akselera.Tech',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={nunito.variable}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          storageKey="akselera-theme"
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
