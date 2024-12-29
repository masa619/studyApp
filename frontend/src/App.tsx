import React from 'react';
import { SessionProvider } from './contexts/SessionContext';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './contexts/ProtectedRoute';

import Login from './components/pages/auth/Login';
import LearningApp from './components/pages/study/QuizPage';
import Menu from './components/pages/menu/Menu';
import NotFound from './components/pages/NotFound'; // 404ページ用コンポーネント

import { JsonDataProvider } from './ocr_app/Context/JsonDataContext';
import OcrDashboard from './ocr_app/OcrDashboard';

function App() {
  return (
    <SessionProvider>
      {/* JSONに関わるContextのProviderをここに置く */}
      <JsonDataProvider>
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
          {/* /ocr への遷移では OcrDashboard を表示 */}
          <Route path="/ocr" element={<OcrDashboard />} />
          {/* 存在しないルートをキャッチ */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </JsonDataProvider>
    </SessionProvider>
  );
}

export default App;