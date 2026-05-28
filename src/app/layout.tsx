import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import Providers from '@/components/Providers';
import './globals.css';

const geist = Geist({ variable: '--font-geist', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Learning Tracker',
  description: 'Отслеживай прогресс в обучении — курсы, книги, видео и подкасты',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
