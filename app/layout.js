import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Sperm Buddy",
  description: "Care for your sperm companion with playful daily habits.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-linear-to-b from-[#fdf2ff] to-[#dff3ff] text-[#2f2a44] antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
