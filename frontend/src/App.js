import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { SessionProvider } from './contexts/SessionContext';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './contexts/ProtectedRoute';
import Login from './components/pages/auth/Login';
import LearningApp from './components/pages/study/QuizPage';
import Menu from './components/pages/menu/Menu';
function App() {
    return (_jsx(SessionProvider, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Login, {}) }), _jsx(Route, { path: "/login", element: _jsx(Login, {}) }), _jsx(Route, { path: "/select", element: _jsx(ProtectedRoute, { children: _jsx(Menu, {}) }) }), _jsx(Route, { path: "/quiz", element: _jsx(ProtectedRoute, { children: _jsx(LearningApp, {}) }) })] }) }));
}
export default App;
