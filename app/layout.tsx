import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Yuan",
    description: "游戏开发者，以及厨子",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="zh-CN">
            <body className="min-h-screen">{children}</body>
        </html>
    );
}
