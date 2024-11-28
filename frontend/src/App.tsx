import React from 'react';
import { SessionProvider } from './contexts/SessionContext';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './contexts/ProtectedRoute';

import Login from './pages/Login';
import LearningApp from './pages/QuizPage';
import Menu from './pages/Menu';

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
