import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ата заңның тарихи тамыры | Жеті жарғыдан Жаңа Қазақстанға дейін",
  description:
    "Қазақстан конституциялық құқығының тарихы туралы интерактивті лонгрид-таймлайн: XVII ғасырдағы Жеті жарғыдан 2026 жылғы Конституцияға дейін.",
  keywords:
    "Қазақстан, Конституция, Жеті жарғы, құқық тарихы, Тәуке хан, ҚазКСР, 1995, Жаңа Қазақстан, негізгі заң",
  openGraph: {
    title: "Ата заңның тарихи тамыры",
    description: "Дала әдет-ғұрып құқығынан қазіргі конституционализмге дейін",
    type: "article",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="kk" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
