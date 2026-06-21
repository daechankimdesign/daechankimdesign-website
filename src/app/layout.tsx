import type { Metadata } from "next";
import { notoSans, notoSerif } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Daechan Kim — Product Designer",
  description:
    "Portfolio of Daechan Kim, a product designer who plans and conducts qualitative research.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${notoSans.variable} ${notoSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
