import { Inter } from "next/font/google";
import { Suspense } from "react"; // Add this import
import ClientLayout from "@/components/layout/ClientLayout";
import ToastProvider from "@/components/layout/TostProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "tradePeople - Connect with Skilled Tradespeople",
  description:
    "Find skilled tradespeople for your projects or grow your trade business with exclusive leads",
};

// Create a loading fallback component
const LoadingFallback = () => (
  <div className="min-h-screen flex justify-center items-center bg-gray-50">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ToastProvider />
        <Suspense fallback={<LoadingFallback />}>
          <ClientLayout>{children}</ClientLayout>
        </Suspense>
      </body>
    </html>
  );
}