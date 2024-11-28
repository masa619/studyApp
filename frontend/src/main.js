import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import App from './App';
import './styles/index.css';
const rootElement = document.getElementById('root');
if (!rootElement)
    throw new Error('Failed to find the root element');
// rootのインスタンスを一度だけ作成する
const root = createRoot(rootElement);
// エラーバウンドリのフォールバックUI
const ErrorFallback = ({ error }) => {
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center p-4", children: _jsxs("div", { className: "bg-red-50 border border-red-200 rounded-lg p-6 max-w-lg", children: [_jsx("h2", { className: "text-red-800 text-lg font-semibold mb-2", children: "\u30A2\u30D7\u30EA\u30B1\u30FC\u30B7\u30E7\u30F3\u30A8\u30E9\u30FC" }), _jsx("p", { className: "text-red-600 mb-4", children: "\u7533\u3057\u8A33\u3042\u308A\u307E\u305B\u3093\u3002\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F\u3002" }), _jsx("pre", { className: "bg-red-100 p-4 rounded text-sm overflow-auto", children: error.message }), _jsx("button", { onClick: () => window.location.reload(), className: "mt-4 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors", children: "\u518D\u8AAD\u307F\u8FBC\u307F" })] }) }));
};
root.render(_jsx(StrictMode, { children: _jsx(BrowserRouter, { future: { v7_startTransition: true, v7_relativeSplatPath: true }, children: _jsx(ErrorBoundary, { FallbackComponent: ErrorFallback, children: _jsx(App, {}) }) }) }));
