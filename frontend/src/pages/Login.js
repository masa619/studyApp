import { jsx as _jsx } from "react/jsx-runtime";
import { GoogleOAuthProvider } from '@react-oauth/google';
import LoginApp from '../components/LoginApp';
function Login() {
    return (_jsx(GoogleOAuthProvider, { clientId: "YOUR_GOOGLE_CLIENT_ID", children: _jsx(LoginApp, {}) }));
}
export default Login;
