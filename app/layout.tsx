import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Navbar } from "@/components/Navbar";

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
          <div className="flex">
            {/* Main content */}
            <main className="flex-1 px-12 py-20">
              {children}
            </main>

            {/* Right sidebar */}
            <Navbar />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
