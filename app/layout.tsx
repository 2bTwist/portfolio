import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Navbar } from "@/components/Navbar";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  title: "Edmond Ndanji — Software Engineer",
  description: "Backend engineer and product enthusiast.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="light">
          <Navbar />
          <main className="px-6 md:px-12 lg:pr-48 pt-20 pb-20">
            {children}
          </main>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
