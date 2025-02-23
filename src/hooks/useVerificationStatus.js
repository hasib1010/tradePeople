// src/hooks/useVerificationStatus.js
"use client"
import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';

export function useVerificationStatus() {
  const { data: session, status, update } = useSession();
  const [isVerified, setIsVerified] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const hasCheckedRef = useRef(false);

  // Check verification status only once per component instance
  useEffect(() => {
    const checkVerificationStatus = async () => {
      // Only check if:
      // 1. User is authenticated
      // 2. User is a tradesperson
      // 3. We haven't checked yet
      // 4. We're not currently checking
      if (
        status !== "authenticated" || 
        session?.user?.role !== 'tradesperson' ||
        hasCheckedRef.current ||
        isChecking
      ) {
        return;
      }

      try {
        setIsChecking(true);
        const response = await fetch('/api/profile/verification-status');
        
        if (response.ok) {
          const data = await response.json();
          setIsVerified(data.isVerified);
          
          // Store this in memory to avoid repeated calls
          hasCheckedRef.current = true;
        }
      } catch (error) {
        console.error('Error checking verification status:', error);
      } finally {
        setIsChecking(false);
      }
    };

    // Only run once when the component mounts and session is authenticated
    if (status === "authenticated" && session?.user?.role === 'tradesperson') {
      checkVerificationStatus();
    }
  }, [status, session?.user?.role]);

  return {
    isVerified,
    isChecking
  };
}