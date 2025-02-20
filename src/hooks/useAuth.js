// src/hooks/useAuth.js
"use client"
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";

export function useAuth() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = useCallback(async (email, password, redirectUrl = null) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password
      });
      
      if (result.error) {
        setError(result.error);
        return { success: false, error: result.error };
      }
      
      if (redirectUrl) {
        router.push(redirectUrl);
      }
      
      return { success: true };
    } catch (err) {
      setError("An unexpected error occurred");
      return { success: false, error: "An unexpected error occurred" };
    } finally {
      setLoading(false);
    }
  }, [router]);

  const register = useCallback(async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.message || "Registration failed");
        return { success: false, error: data.message };
      }
      
      return { success: true, data };
    } catch (err) {
      setError("An unexpected error occurred");
      return { success: false, error: "An unexpected error occurred" };
    } finally {
      setLoading(false);
    }
  }, []);

  const registerTradesperson = useCallback(async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      
      // Append all text fields
      Object.keys(userData).forEach(key => {
        if (key === "profileImage" && userData[key] instanceof File) {
          formData.append(key, userData[key]);
        } else if (key === "skills" || key === "location") {
          formData.append(key, JSON.stringify(userData[key]));
        } else if (userData[key] !== undefined) {
          formData.append(key, userData[key]);
        }
      });
      
      const response = await fetch("/api/auth/register-tradesperson", {
        method: "POST",
        body: formData
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.message || "Registration failed");
        return { success: false, error: data.message };
      }
      
      return { success: true, data };
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred");
      return { success: false, error: "An unexpected error occurred" };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async (redirectUrl = "/") => {
    await signOut({ redirect: false });
    router.push(redirectUrl);
  }, [router]);

  const updateUserSession = useCallback(async (data) => {
    await update(data);
  }, [update]);

  return {
    user: session?.user,
    isAuthenticated: !!session?.user,
    isLoading: status === "loading" || loading,
    error,
    login,
    logout,
    register,
    registerTradesperson,
    updateUserSession
  };
}