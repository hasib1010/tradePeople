// src/components/layout/ClientLayout.js
"use client"
import { SessionProvider } from "next-auth/react";
import MainLayout from "./MainLayout";

export default function ClientLayout({ children }) {
  return (
    <SessionProvider>
      <MainLayout>
        {children}
      </MainLayout>
    </SessionProvider>
  );
}