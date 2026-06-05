import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
    const { isAuthenticated, roles } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (requiredRole && !roles.includes(requiredRole)) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;