import { useState } from 'react';
import { GoogleOAuthProvider, useGoogleLogin, googleLogout } from '@react-oauth/google';
import Board from './components/Board';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SPREADSHEET_ID = import.meta.env.VITE_SPREADSHEET_ID;
const SCOPE = 'https://www.googleapis.com/auth/spreadsheets';

function AppInner() {
  const [token, setToken] = useState(null);
  const [userName, setUserName] = useState('');

  const login = useGoogleLogin({
    scope: SCOPE,
    onSuccess: async (res) => {
      setToken(res.access_token);
      try {
        const info = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${res.access_token}` },
        }).then(r => r.json());
        setUserName(info.name || info.email || '');
      } catch { /* non-critical */ }
    },
    onError: (err) => console.error('Login failed', err),
  });

  function logout() {
    googleLogout();
    setToken(null);
    setUserName('');
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <h1>Task Dashboard</h1>
        </div>
        <div className="header-right">
          {token && userName && <span className="account-name">{userName}</span>}
          {token
            ? <button onClick={logout} className="btn btn-ghost">Sign out</button>
            : null
          }
        </div>
      </header>

      {token ? (
        <Board token={token} spreadsheetId={SPREADSHEET_ID} onAuthError={() => setToken(null)} />
      ) : (
        <div className="full-center login-screen">
          <div className="login-card">
            <div className="login-icon">&#128203;</div>
            <h2>Task Dashboard</h2>
            <p>Sign in with the Google account that owns your task spreadsheet.</p>
            <button onClick={() => login()} className="btn btn-google btn-large">
              <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
                <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Sign in with Google
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <AppInner />
    </GoogleOAuthProvider>
  );
}
