import "./globals.css";
import "../styles/tokens.css";
import { Inter } from "next/font/google";
import ThemeProvider from "@/components/ThemeProvider";
import Sidebar from "@/components/Sidebar";
import FileTree from "@/components/FileTree";
import { buildFileTree } from "@/lib/buildFileTree";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata = {
  title: "Eddy B — Portfolio",
  description: "Personal blog & projects of Eddy",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} bg-bg text-text`}>
        <ThemeProvider>
          <div className="flex h-screen">
            <Sidebar>
              <FileTree tree={buildFileTree()} />
            </Sidebar>

            {/* Main content area */}
            <main className="flex-1 relative">
              {/* Right nav (Phase 2.4) */}
              <nav id="floating-nav" className="hidden md:block"></nav>

              <div className="max-w-content mx-auto px-4 md:px-8 py-16">
                {children}
              </div>
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
