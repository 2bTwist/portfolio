import "./globals.css";
import "../styles/tokens.css";
import { Inter, Khand } from "next/font/google";
import ThemeProvider from "@/components/ThemeProvider";
import Sidebar from "@/components/Sidebar";
import FileTree from "@/components/FileTree";
import FloatingNav from "@/components/FloatingNav";
import { buildFileTree } from "@/lib/buildFileTree";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const khand = Khand({ subsets: ["latin"], variable: "--font-display", weight: ["400", "500", "600", "700"] });

export const metadata = {
  title: "Eddy B — Portfolio",
  description: "Personal blog & projects of Eddy",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${khand.variable} bg-bg text-text`}>
        <ThemeProvider>
          <div className="flex h-screen">
            <Sidebar>
              <FileTree tree={buildFileTree()} />
            </Sidebar>

            {/* Main content area */}
            <main className="flex-1 relative overflow-y-auto">
              <FloatingNav />

              <div className="pt-16 pb-24 px-4 md:px-8 max-w-content mx-auto">
                {children}
              </div>
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
