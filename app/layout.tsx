import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";
import { QueryProvider } from "./providers/query-provider";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  axes: ["opsz"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "NOVA — Private AI Workspace",
  description: "NOVA is a self-hosted AI workspace built with Mastra and assistant-ui. BYOK, persistent memory, artifacts, and voice.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-gramm="false" data-gramm_editor="false" data-enable-grammarly="false">
      <body
        className={`${inter.variable} ${ibmPlexMono.variable} antialiased`}
        suppressHydrationWarning
        data-gramm="false"
        data-gramm_editor="false"
        data-enable-grammarly="false"
      >
        <script
          dangerouslySetInnerHTML={{
            __html: `try{for(const a of ["data-new-gr-c-s-check-loaded","data-gr-ext-installed"]){document.documentElement.removeAttribute(a);document.body&&document.body.removeAttribute(a)}}catch(e){}`,
          }}
        />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <QueryProvider>
            <TooltipProvider>{children}</TooltipProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
