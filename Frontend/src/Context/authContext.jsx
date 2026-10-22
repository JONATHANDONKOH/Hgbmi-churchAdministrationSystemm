
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

const AuthContext = createContext(null);

const API_URL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ==========================================================
  // HELPER: READ API RESPONSE
  // ==========================================================

  const readResponse = async (res) => {
    let data;

    try {
      data = await res.json();
    } catch {
      data = {};
    }

    if (!res.ok) {
      throw new Error(
        data.message || 'Something went wrong. Please try again.'
      );
    }

    return data;
  };

  // ==========================================================
  // RESTORE SESSION
  // ==========================================================

  useEffect(() => {
    let cancelled = false;

    const loadUser = async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/me`, {
          method: 'GET',
          credentials: 'include',
        });

        if (!res.ok) {
          if (!cancelled) {
            setUser(null);
          }

          return;
        }

        const data = await res.json();

        if (!cancelled) {
          setUser(data.user || null);
        }
      } catch (err) {
        console.error('Failed to restore session:', err);

        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadUser();

    return () => {
      cancelled = true;
    };
  }, []);

  // ==========================================================
  // REGISTER SUPER ADMIN
  // ==========================================================

  const registerSuperAdmin = async ({
    fullName,
    email,
    password,
    confirmPassword,
  }) => {
    const res = await fetch(
      `${API_URL}/api/auth/register-super-admin`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          fullName,
          email,
          password,
          confirmPassword,
        }),
      }
    );

    const data = await readResponse(res);

    if (!data.user) {
      throw new Error('Registration response did not contain a user.');
    }

    setUser(data.user);

    return data.user;
  };

  // ==========================================================
  // REGISTER NORMAL USER
  // ==========================================================

  const register = async ({
    fullName,
    email,
    password,
    confirmPassword,
  }) => {
    const res = await fetch(
      `${API_URL}/api/auth/register`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          fullName,
          email,
          password,
          confirmPassword,
        }),
      }
    );

    const data = await readResponse(res);

    if (!data.user) {
      throw new Error('Registration response did not contain a user.');
    }

    setUser(data.user);

    return data.user;
  };

  // ==========================================================
  // LOGIN
  // ==========================================================

  const login = async (
    identifier,
    password,
    options = {}
  ) => {
    const { rememberMe = false } = options;

    const res = await fetch(
      `${API_URL}/api/auth/login`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: identifier.trim(),
          password,
          rememberMe,
        }),
      }
    );

    const data = await readResponse(res);

    if (!data.user) {
      throw new Error('Login response did not contain a user.');
    }

    // The backend should return the user with their groups.
    const loggedInUser = {
      ...data.user,
      groups: Array.isArray(data.user.groups)
        ? data.user.groups
        : [],
    };

    setUser(loggedInUser);

    return loggedInUser;
  };

  // ==========================================================
  // LOGOUT
  // ==========================================================

  const logout = async () => {
    try {
      const res = await fetch(
        `${API_URL}/api/auth/logout`,
        {
          method: 'POST',
          credentials: 'include',
        }
      );

      await readResponse(res);
    } finally {
      setUser(null);
    }
  };

  // ==========================================================
  // AUTH CONTEXT PROVIDER
  // ==========================================================

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        registerSuperAdmin,
        register,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ============================================================
// CUSTOM AUTH HOOK
// ============================================================

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used within an AuthProvider'
    );
  }

  return context;
}
