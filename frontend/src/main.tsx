import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';

import App from './App';
import './styles/index.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

// rootのインスタンスを一度だけ作成する
const root = createRoot(rootElement);

// エラーバウンドリのフォールバックUI
const ErrorFallback = ({ error }: { error: Error }) => {
    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-lg">
                <h2 className="text-red-800 text-lg font-semibold mb-2">アプリケーションエラー</h2>
                <p className="text-red-600 mb-4">申し訳ありません。エラーが発生しました。</p>
                <pre className="bg-red-100 p-4 rounded text-sm overflow-auto">{error.message}</pre>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                >
                    再読み込み
                </button>
            </div>
        </div>
    );
};

root.render(
    <StrictMode>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <ErrorBoundary FallbackComponent={ErrorFallback}>
                <App />
            </ErrorBoundary>
        </BrowserRouter>
    </StrictMode>
);