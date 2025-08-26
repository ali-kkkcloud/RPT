import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'G4S Fleet Management Dashboard',
  description: 'Advanced fleet monitoring system with AI alerts, speed alarms, and offline reports for G4S vehicles',
  keywords: 'fleet management, vehicle tracking, AI alerts, speed monitoring, G4S, dashboard',
  authors: [{ name: 'Fleet Management System' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#3b82f6',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content="#3b82f6" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Dark mode toggle script
              (function() {
                const darkMode = localStorage.getItem('darkMode') === 'true' || 
                  (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches);
                
                if (darkMode) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.className} antialiased bg-gray-50 dark:bg-gray-900 transition-colors duration-300`}>
        <div className="min-h-screen">
          {children}
        </div>
        
        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('ServiceWorker registration successful');
                    })
                    .catch(function(err) {
                      console.log('ServiceWorker registration failed');
                    });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
