"use client"
// src/context/AuthContext.js
import { createContext, useContext, useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const { data: session, status, update } = useSession();
  const [user, setUser] = useState(null);
  const [isVerificationChecking, setIsVerificationChecking] = useState(false);
  const router = useRouter();
  
  useEffect(() => {
    if (session?.user) {
      setUser(session.user);
    } else {
      setUser(null);
    }
  }, [session]);
  
  // Check verification status for tradesperson users
  useEffect(() => {
    const checkVerificationStatus = async () => {
      // Only check for authenticated tradesperson users
      if (
        status !== "authenticated" || 
        !session?.user?.role === 'tradesperson' ||
        isVerificationChecking
      ) {
        return;
      }
      
      try {
        setIsVerificationChecking(true);
        const response = await fetch('/api/profile/verification-status');
        
        if (response.ok) {
          const data = await response.json();
          
          // Only update if verification status changed
          if (data.isVerified !== session.user.isVerified) {
            // Update session
            const updatedSession = await update({
              ...session,
              user: {
                ...session.user,
                isVerified: data.isVerified
              }
            });
            
            // Session update also updates our user state via the other useEffect
          }
        }
      } catch (error) {
        console.error('Error checking verification status:', error);
      } finally {
        setIsVerificationChecking(false);
      }
    };
    
    // Check verification status on initial load or when auth status changes
    if (status === "authenticated" && session?.user?.role === 'tradesperson') {
      checkVerificationStatus();
    }
  }, [status, session?.user?.role]); // Note: deliberately not including session in dependencies
  
  const login = async (email, password) => {
    const result = await signIn('credentials', {
      redirect: false,
      email,
      password
    });
    
    return result;
  };
  
  const logout = async () => {
    await signOut({ redirect: false });
    router.push('/');
  };
  
  const register = async (userData) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    
    return response.json();
  };
  
  // Method to manually refresh verification status
  const refreshVerificationStatus = async () => {
    if (
      !user || 
      user.role !== 'tradesperson' || 
      isVerificationChecking
    ) {
      return false;
    }
    
    try {
      setIsVerificationChecking(true);
      const response = await fetch('/api/profile/verification-status');
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.isVerified !== user.isVerified) {
          // Update session
          await update({
            ...session,
            user: {
              ...session.user,
              isVerified: data.isVerified
            }
          });
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error refreshing verification status:', error);
      return false;
    } finally {
      setIsVerificationChecking(false);
    }
  };
  
  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading: status === 'loading',
      isVerificationChecking,
      login,
      logout,
      register,
      refreshVerificationStatus
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);