import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // Register Super Admin
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

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    // If the backend creates the auth cookie during registration,
    // update the React authentication state as well.
    setUser(data.user);

    return data.user;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        registerSuperAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom authentication hook
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used within an AuthProvider'
    );
  }

  return context;
}