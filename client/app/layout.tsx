import type { Metadata } from "next";
import { Geist, Geist_Mono, Share_Tech } from "next/font/google";
import "@livekit/components-styles";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider"
import {ClerkProvider} from "@clerk/nextjs";
import { shadcn } from '@clerk/ui/themes'
import Header from "@/components/Header";
import AxiosProvider from "@/components/AxiosProvider";
import {Toaster} from "@/components/ui/sonner";
import {TooltipProvider} from "@/components/ui/tooltip";
import SmoothScroll from "@/components/SmoothScroll";
import { Analytics } from "@vercel/analytics/next"


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const shareTech = Share_Tech({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-share-tech",
});

export const metadata: Metadata = {
  title: "Axon",
  description: "Focused video rooms for technical teams",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (

          <html lang="en" suppressHydrationWarning>
          <body
              className={`${geistSans.variable} ${geistMono.variable} ${shareTech.variable} antialiased`}
          >
          <Analytics />
          <ClerkProvider
              appearance={{
                  theme: shadcn,
              }}
          >
          <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              enableSystem
              disableTransitionOnChange
          >
                <AxiosProvider>
                  <TooltipProvider>
                    <SmoothScroll>
                      <Toaster />
                      <Header/>
                      {children}
                    </SmoothScroll>
                  </TooltipProvider>
                </AxiosProvider>


          </ThemeProvider>
          </ClerkProvider>

          </body>
          </html>


  );
}
