import type { Metadata } from "next";
import { Jost } from "next/font/google";
import "./globals.css";
// import { ThemeProvider } from "@/components/theme-provider"; // Temporarily commented out
import SessionProviderWrapper from "@/components/session-provider-wrapper.tsx";

const jost = Jost({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jost",
});

export const metadata: Metadata = {
  title: "Almaniac - Smart Farming Dashboard",
  description: "Intelligent insights for your agricultural success.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${jost.variable} font-sans`}>
        <SessionProviderWrapper>
          {/* <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          > */}
        {children}
          {/* </ThemeProvider> */}
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
