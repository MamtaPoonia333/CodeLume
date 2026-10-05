import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Code Review Assistant', description: 'AI-powered code review workspace' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
