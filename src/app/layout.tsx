import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ConditionalLayout } from "@/components/layout/conditional-layout";
import { SimpleAuthProvider } from "@/components/auth/simple-auth-provider";
import { ThemeProvider } from "@/components/theme/theme-provider";
import Script from "next/script";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Piktor | Générateur d’images produit IA pour e-commerce et mobilier",
  description: "Créez des packshots et visuels lifestyle ultra-réalistes grâce à l’IA. Idéal pour les sites e-commerce, marques de meubles et réseaux sociaux.",
  viewport: "width=device-width, initial-scale=1, maximum-scale=5",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased min-h-screen bg-background text-foreground overflow-x-hidden`}
      >
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-NH26LFWXZ7"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-NH26LFWXZ7');
          `}
        </Script>

        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
          <SimpleAuthProvider>
            <ConditionalLayout>
              {children}
            </ConditionalLayout>
          </SimpleAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
