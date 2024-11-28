import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { Navigate } from 'react-router-dom';
import { useSession } from './SessionContext';
const ProtectedRoute = ({ children }) => {
    const { isSessionExpired } = useSession();
    if (isSessionExpired) {
        return _jsx(Navigate, { to: "/login" });
    }
    return _jsx(_Fragment, { children: children });
};
export default ProtectedRoute;
