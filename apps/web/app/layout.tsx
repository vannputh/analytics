
import type { Metadata } from "next"
import { JetBrains_Mono, Space_Grotesk } from "next/font/google"
import { Toaster } from "sonner"
import "./globals.css"

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: 'swap',
  preload: true,
  adjustFontFallback: false,
})

const sans = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  display: 'swap',
  preload: true,
  adjustFontFallback: false,
})

export const metadata: Metadata = {
  title: "analythika",
  description: "A quiet logbook for the films, shows, books, games, and podcasts you actually care about.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${mono.variable} ${sans.variable} font-sans antialiased`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:border focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-md focus:outline-none focus:ring-2 focus:ring-ring"
        >
          Skip to content
        </a>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  if (typeof localStorage === 'undefined') return;
                  var stored = localStorage.getItem('theme');
                  var theme = stored || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                  document.documentElement.classList.toggle('dark', theme === 'dark');
                } catch (e) {}
              })();
            `,
          }}
        />
        <div className="min-h-screen bg-background">
          {children}
        </div>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
            },
          }}
        />
      </body>
    </html>
  )
}
