import type { Metadata } from "next";
import { Fraunces, Work_Sans, JetBrains_Mono, Noto_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { cn } from "@/lib/utils";

const playfairDisplayHeading = Playfair_Display({subsets:['latin'],variable:'--font-heading'});

const notoSans = Noto_Sans({subsets:['latin'],variable:'--font-sans'});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-work-sans",
  weight: ["400", "500", "600"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "MoodMovies — recommendations for how you feel tonight",
  description:
    "Tell it your mood, an AI agent picks the movies. No genre dropdowns.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("font-sans", notoSans.variable, playfairDisplayHeading.variable)}>
      <body
        className={`${fraunces.variable} ${workSans.variable} ${jetbrainsMono.variable} font-body bg-void text-foam`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
