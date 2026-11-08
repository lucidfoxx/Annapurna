import { createContext, useContext, useEffect, useState } from "react";
import * as api from "../api";

// AuthContext keeps track of the logged-in user for the whole app.
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On first load, ask the API who is logged in (if anyone).
  useEffect(() => {
    let active = true;

    api
      .me()
      .then((currentUser) => {
        if (active) setUser(currentUser);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function login(credentials) {
    const data = await api.login(credentials);
    setUser(data.user);
    return data.user;
  }

  async function register(formData) {
    const data = await api.register(formData);
    setUser(data.user);
    return data.user;
  }

  function logout() {
    api.logout();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Small helper so components can write: const { user } = useAuth();
// oxlint-disable-next-line react/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>.");
  }
  return context;
}
