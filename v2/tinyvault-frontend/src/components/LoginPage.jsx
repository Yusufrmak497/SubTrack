import { useState } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
      });

      const data = await res.json();

      if (res.status === 429) {
        setError('Too many failed attempts. Please wait 1 minute and try again.');
        return;
      }

      if (!res.ok) {
        setError(data.error || data.detail || 'Login failed');
        return;
      }

      localStorage.setItem('token', data.access_token);
      onLogin(data.access_token);
    } catch {
      setError('Could not connect to server. Is the API running?');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-container">
      <div className="panel login-box">
        <h1>TinyVault</h1>
        <p className="muted">Manage your subscriptions</p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          {error && <p className="error-text">{error}</p>}
          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
