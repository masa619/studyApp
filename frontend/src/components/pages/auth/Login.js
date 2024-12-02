import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import LoginApp from '../../features/LoginApp';
import { useSession } from '../../../contexts/SessionContext';
function Login() {
    const { isSessionExpired } = useSession();
    const navigate = useNavigate();
    useEffect(() => {
        console.log('isSessionExpired:', isSessionExpired);
        if (!isSessionExpired) {
            navigate('/select');
        }
    }, []);
    return (_jsx(GoogleOAuthProvider, { clientId: "YOUR_GOOGLE_CLIENT_ID", children: _jsx(LoginApp, {}) }));
}
export default Login;
