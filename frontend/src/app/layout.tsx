import type { Metadata } from 'next';
import { Urbanist } from 'next/font/google';
import './globals.css';
import Providers from './providers';

const urbanist = Urbanist({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700', '800'] });

export const metadata: Metadata = {
  title: 'HospitalAI - Smart Queue. Better Care.',
  description: 'AI Hospital Queue & Appointment System designed for premium healthcare efficiency.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${urbanist.className} antialiased bg-[#DAE3EE] text-[#2C3137]`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
