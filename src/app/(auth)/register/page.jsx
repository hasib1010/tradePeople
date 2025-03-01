"use client";
import dynamic from 'next/dynamic';

// Dynamically import the RegisterPageContent with no SSR
const RegisterPageContent = dynamic(() => import('./RegisterPageContent'), { 
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex justify-center items-center bg-gray-50">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  )
});

export default function RegisterPage() {
  return <RegisterPageContent />;
}