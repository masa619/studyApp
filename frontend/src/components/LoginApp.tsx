import React, { useState, useEffect } from 'react';
import auth from '../api/auth';
import styles from '../styles/Login.module.css';
import { useGoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../contexts/SessionContext';

const LoginApp = () => {
    const { setSessionExpired } = useSession();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState(''); // エラーメッセージ用の状態
    const navigate = useNavigate();

    useEffect(() => {
        setSessionExpired(false);
      }, []);
      
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(''); // エラーメッセージの初期化

        try {
            await auth.login(username, password);
            setSessionExpired(false);
            navigate('/select', { replace: true });
        } catch (error: any) {
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

    return (
        <div className={`${styles.background} min-h-screen text-slate-100 antialiased flex justify-center items-center`}>
            <div className="container mx-auto px-4 py-16">
                <div className="mx-auto max-w-md">
                    {/* ヘッダー部分 */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome Back</h1>
                        <p className="text-slate-400 text-sm">Continue your learning journey</p>
                    </div>

                    {/* メインフォーム */}
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-xl p-6 border border-slate-700">
                        <form onSubmit={handleLogin} className="space-y-5">
                            <div className="space-y-2">
                                <label htmlFor="username" className="block text-sm font-medium text-slate-300">
                                    Username
                                </label>
                                <input
                                    id="username"
                                    type="text"
                                    required
                                    className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg 
                                             focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                             text-slate-100 placeholder-slate-500 transition-colors"
                                    placeholder="Enter your username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    required
                                    className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg 
                                             focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                             text-slate-100 placeholder-slate-500 transition-colors"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>

                            {/* エラーメッセージの表示 */}
                            {errorMessage && (
                                <p className="text-red-500 text-sm">{errorMessage}</p>
                            )}

                            <button
                                type="submit"
                                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg 
                                         font-medium transition-colors duration-200 flex items-center justify-center
                                         focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                            >
                                Sign in to learn
                            </button>
                        </form>

                        {/* 区切り線 */}
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-700"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-slate-800/50 text-slate-400">Or continue with</span>
                            </div>
                        </div>

                        {/* ソーシャルログイン */}
                        <button
                            onClick={() => googleLogin()}
                            className="w-full py-2 px-4 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200 
                                     font-medium transition-colors duration-200 flex items-center justify-center
                                     focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-900"
                        >
                            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                                <path
                                    fill="currentColor"
                                    d="M12.545,12.151L12.545,12.151c0,1.054,0.855,1.909,1.909,1.909h3.536c-0.607,1.972-2.101,3.467-4.073,4.073v-1.909c0-1.054-0.855-1.909-1.909-1.909H8.472c-1.054,0-1.909-0.855-1.909-1.909V8.472c0-1.054,0.855-1.909,1.909-1.909h3.536c1.054,0,1.909,0.855,1.909,1.909V12.151z M12,2C6.477,2,2,6.477,2,12c0,5.523,4.477,10,10,10s10-4.477,10-10C22,6.477,17.523,2,12,2"
                                />
                            </svg>
                            Continue with Google
                        </button>

                        {/* 新規登録リンク */}
                        <p className="mt-6 text-center text-slate-400 text-sm">
                            New to our learning platform?{' '}
                            <a href="/register" className="text-blue-400 hover:text-blue-300 font-medium">
                                Create an account
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginApp;