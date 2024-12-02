import React, { useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import LoginApp from '../../features/LoginApp';
import { useSession } from '../../../contexts/SessionContext';

function Login() {
  const { isSessionExpired } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('isSessionExpired:', isSessionExpired);
    if (!isSessionExpired) {
      navigate('/select');
    }
  }, []);

  return (
    <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID">
      <LoginApp />
    </GoogleOAuthProvider>
  );
}

export default Login;