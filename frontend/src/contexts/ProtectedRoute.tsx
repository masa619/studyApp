import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSession } from './SessionContext';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isSessionExpired } = useSession();

    if (isSessionExpired) {
        return <Navigate to="/login" />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
