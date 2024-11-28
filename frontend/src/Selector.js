import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate } from 'react-router-dom';
import useAuth from './hooks/useAuth';
const Selector = () => {
    const navigate = useNavigate();
    const { isAuthenticated, loading } = useAuth();
    if (loading) {
        return _jsx("div", { className: "min-h-screen flex items-center justify-center", children: "Loading..." });
    }
    return (_jsxs("div", { children: [_jsx("h1", { children: "V1" }), _jsx("button", { onClick: () => navigate('/select'), children: "V1 menu \u306B\u79FB\u52D5" }), _jsx("h1", { children: "V2" }), _jsx("button", { onClick: () => navigate('/select2'), children: "V2 menu \u306B\u79FB\u52D5" })] }));
};
export default Selector;
