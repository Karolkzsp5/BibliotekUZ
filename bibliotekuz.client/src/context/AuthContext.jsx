import { createContext, useContext, useState, useEffect, useCallback } from 'react';

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

    const logout = useCallback(() => {
        setToken(null);
        setRoles([]);
        localStorage.removeItem('token');
        localStorage.removeItem('userRoles');

        // Twarde przekierowanie na stronę logowania
        if (window.location.pathname !== '/login') {
            window.location.href = '/login';
        }
    }, []);

    // Globalny interceptor zapytań fetch
    useEffect(() => {
        const originalFetch = window.fetch;

        window.fetch = async (url, options) => {
            const response = await originalFetch(url, options);

            if (response.status === 401 && !url.includes('/api/Auth/login')) {
                console.warn('Wykryto wygaśnięcie sesji (Status 401). Automatyczne wylogowanie...');
                logout();
            }

            return response;
        };

        // Czyszczenie przy odmontowaniu
        return () => {
            window.fetch = originalFetch;
        };
    }, [logout]);

    return (
        <AuthContext.Provider value={{ token, roles, login, logout, isAuthenticated: !!token }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);