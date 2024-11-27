import React from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from './hooks/useAuth';
const Selector: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
      return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  return (
    <div>
      <h1>V1</h1>
      <button onClick={() => navigate('/select')}>V1 menu に移動</button>
      <h1>V2</h1>
      <button onClick={() => navigate('/select2')}>V2 menu に移動</button>
    </div>
  );
};

export default Selector;
