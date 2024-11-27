import React from 'react'
import { GoogleOAuthProvider } from '@react-oauth/google';
import LoginApp from '../components/LoginApp'

function Login() {
  return (
    <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID">
      <LoginApp />
    </GoogleOAuthProvider>
  )
}

export default Login