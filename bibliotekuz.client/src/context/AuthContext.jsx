import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    // Przy starcie sprawdzanie, czy w pamięci są już jakieś dane
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [roles, setRoles] = useState(JSON.parse(localStorage.getItem('userRoles')) || []);

    const login = (newToken, newRoles) => {
        setToken(newToken);
        setRoles(newRoles);
        localStorage.setItem('token', newToken);
        localStorage.setItem('userRoles', JSON.stringify(newRoles));
    };

    const logout = () => {
        setToken(null);
        setRoles([]);
        localStorage.removeItem('token');
        localStorage.removeItem('userRoles');
    };

    return (
        <AuthContext.Provider value={{ token, roles, login, logout, isAuthenticated: !!token }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);