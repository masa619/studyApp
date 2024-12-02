import React from 'react';
import { SessionProvider } from './contexts/SessionContext';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './contexts/ProtectedRoute';

import Login from './components/pages/auth/Login';
import LearningApp from './components/pages/study/QuizPage';
import Menu from './components/pages/menu/Menu';

function App() {
    return (
        <SessionProvider>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/login" element={<Login />} />
                <Route
                    path="/select"
                    element={
                        <ProtectedRoute>
                            <Menu />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/quiz"
                    element={
                        <ProtectedRoute>
                            <LearningApp />
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </SessionProvider>
    );
}

export default App;
