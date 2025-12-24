import type { Metadata } from 'next';
import './globals.css';
import '@/styles/nprogress.css';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from '@/components/theme-provider';
import ClientProgressBar from '@/components/ui/client-progress-bar';
import { Providers } from '@/components/providers';
import { SidebarProvider } from '@/contexts/SidebarContext';


export const metadata: Metadata = {
  title: 'libly.space',
  description: 'Library management for modern libraries',
  manifest: '/manifest.webmanifest',
  // dynamic theme colors for light/dark mode
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#111827' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Source+Code+Pro:ital,wght@0,200..900;1,200..900&display=swap" rel="stylesheet" />
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#111827" media="(prefers-color-scheme: dark)" />
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
      </head>
      <body className="font-body antialiased">
        {/* --- MODIFICATION: Wrap with Providers for TanStack Query --- */}
        <Providers>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div className="flex flex-col min-h-screen">
              <ClientProgressBar />
              <main className="flex-grow">
                {children}
              </main>
              <Toaster />
            </div>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
