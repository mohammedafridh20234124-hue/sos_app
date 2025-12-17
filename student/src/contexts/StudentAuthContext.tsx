import React, { createContext, useCallback, useEffect, useState } from "react";

interface StudentUser {
  id: string;
  email: string;
  name?: string;
}

interface StudentAuthContextType {
  student: StudentUser | null;
  isLoading: boolean;
  login: (email: string, otp: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

export const StudentAuthContext = createContext<StudentAuthContextType | undefined>(undefined);

export const StudentAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [student, setStudent] = useState<StudentUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check if already logged in
  useEffect(() => {
    const checkSession = async () => {
      try {
        const email = sessionStorage.getItem("verified_email");
        if (email) {
          setStudent({ id: "", email, name: email.split("@")[0] });
        }
      } catch (error) {
        console.error("Session check failed:", error);
      }
    };
    checkSession();
  }, []);

  const login = useCallback(async (email: string, otp: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/student/auth/verify_otp.php", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}`,
      });

      const data = await response.json();
      if (data.status === "success") {
        sessionStorage.setItem("verified_email", email);
        sessionStorage.setItem("verified_at", new Date().toISOString());
        setStudent({ id: "", email, name: email.split("@")[0] });
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      sessionStorage.removeItem("verified_email");
      sessionStorage.removeItem("verified_at");
      setStudent(null);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }, []);

  const value: StudentAuthContextType = {
    student,
    isLoading,
    login,
    logout,
    isAuthenticated: !!student,
  };

  return (
    <StudentAuthContext.Provider value={value}>
      {children}
    </StudentAuthContext.Provider>
  );
};
