import { createContext, useContext, useState, useEffect } from "react";
import { loginUser, registerUser, logoutUser } from "@/lib/api";

const AuthContext = createContext(null);



export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  
  useEffect(() => { // runs only once when app loads
    const token = localStorage.getItem("bankflow_token");
    const savedUser = localStorage.getItem("bankflow_user");

    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("bankflow_token");
        localStorage.removeItem("bankflow_user");
      }
    }

    setIsLoading(false);
  }, []);

  
  async function register({ email, name, password }) {
    const data = await registerUser({ email, name, password });

    // Backend returns { user: email, token }
    const userData = { email: data.user, name };
    setUser(userData);
    localStorage.setItem("bankflow_user", JSON.stringify(userData));

    return data;
  }

  
  async function login({ email, password }) {
    const data = await loginUser({ email, password });

    // Backend returns { user: { id, email, name }, token }
    setUser(data.user);
    localStorage.setItem("bankflow_user", JSON.stringify(data.user));

    return data;
  }

  
  async function logout() {
    await logoutUser();
    setUser(null);
    localStorage.removeItem("bankflow_user");
  }

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth state and actions.
 * Must be used within an <AuthProvider>.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
