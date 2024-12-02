import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import auth from '../../api/auth';
import styles from '@/styles/Login.module.css';
import { useGoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../../contexts/SessionContext';
import backgroundImage from '@/assets/images/IMG_1861.JPG';
const LoginApp = () => {
    const { setSessionExpired } = useSession();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState(''); // エラーメッセージ用の状態
    const navigate = useNavigate();
    const backgroundImageUrl = backgroundImage;
    useEffect(() => {
        setSessionExpired(false);
    }, []);
    const handleLogin = async (e) => {
        e.preventDefault();
        setErrorMessage(''); // エラーメッセージの初期化
        try {
            await auth.login(username, password);
            setSessionExpired(false);
            navigate('/select', { replace: true });
        }
        catch (error) {
            setSessionExpired(true);
            console.error('Login failed', error);
            setErrorMessage(error.message || 'An error occurred');
        }
    };
    const googleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            console.log(tokenResponse);
            // Googleトークンをバックエンドに送信するロジックを実装
        },
        onError: (error) => console.log('Google login failed:', error),
    });
    return (_jsx("div", { className: styles.background, style: { backgroundImage: `url(${backgroundImageUrl})` }, children: _jsx("div", { className: "container mx-auto px-4 py-16", children: _jsxs("div", { className: "mx-auto max-w-md", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx("h1", { className: "text-3xl font-bold tracking-tight mb-2", children: "Welcome Back" }), _jsx("p", { className: "text-slate-400 text-sm", children: "Continue your learning journey" })] }), _jsxs("div", { className: "bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-xl p-6 border border-slate-700", children: [_jsxs("form", { onSubmit: handleLogin, className: "space-y-5", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { htmlFor: "username", className: "block text-sm font-medium text-slate-300", children: "Username" }), _jsx("input", { id: "username", type: "text", required: true, className: "w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg \n                                             focus:ring-2 focus:ring-blue-500 focus:border-transparent\n                                             text-slate-100 placeholder-slate-500 transition-colors", placeholder: "Enter your username", value: username, onChange: (e) => setUsername(e.target.value) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { htmlFor: "password", className: "block text-sm font-medium text-slate-300", children: "Password" }), _jsx("input", { id: "password", type: "password", required: true, className: "w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg \n                                             focus:ring-2 focus:ring-blue-500 focus:border-transparent\n                                             text-slate-100 placeholder-slate-500 transition-colors", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", value: password, onChange: (e) => setPassword(e.target.value) })] }), errorMessage && (_jsx("p", { className: "text-red-500 text-sm", children: errorMessage })), _jsx("button", { type: "submit", className: "w-full py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg \n                                         font-medium transition-colors duration-200 flex items-center justify-center\n                                         focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900", children: "Sign in to learn" })] }), _jsxs("div", { className: "relative my-6", children: [_jsx("div", { className: "absolute inset-0 flex items-center", children: _jsx("div", { className: "w-full border-t border-slate-700" }) }), _jsx("div", { className: "relative flex justify-center text-sm", children: _jsx("span", { className: "px-2 bg-slate-800/50 text-slate-400", children: "Or continue with" }) })] }), _jsxs("button", { onClick: () => googleLogin(), className: "w-full py-2 px-4 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200 \n                                     font-medium transition-colors duration-200 flex items-center justify-center\n                                     focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-900", children: [_jsx("svg", { className: "w-5 h-5 mr-2", viewBox: "0 0 24 24", children: _jsx("path", { fill: "currentColor", d: "M12.545,12.151L12.545,12.151c0,1.054,0.855,1.909,1.909,1.909h3.536c-0.607,1.972-2.101,3.467-4.073,4.073v-1.909c0-1.054-0.855-1.909-1.909-1.909H8.472c-1.054,0-1.909-0.855-1.909-1.909V8.472c0-1.054,0.855-1.909,1.909-1.909h3.536c1.054,0,1.909,0.855,1.909,1.909V12.151z M12,2C6.477,2,2,6.477,2,12c0,5.523,4.477,10,10,10s10-4.477,10-10C22,6.477,17.523,2,12,2" }) }), "Continue with Google"] }), _jsxs("p", { className: "mt-6 text-center text-slate-400 text-sm", children: ["New to our learning platform?", ' ', _jsx("a", { href: "/register", className: "text-blue-400 hover:text-blue-300 font-medium", children: "Create an account" })] })] })] }) }) }));
};
export default LoginApp;
